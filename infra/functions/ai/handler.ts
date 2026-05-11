import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { getItem, putItem, queryItems } from '../shared/dynamo';
import { ok, badRequest, serverError, tooManyRequests } from '../shared/response';

const DEFAULT_PROMPTS: Record<string, string> = {
  'extract-receipt': `You are a financial document analyzer. Extract transaction information from the provided document (receipt, bank statement, invoice).

Return a JSON object with these fields:
- desc: merchant/payee name
- amount: negative for expenses, positive for income (number)
- currency: "BRL" or "USD" or "EUR"
- cat: category slug (mercado, restaurante, transporte, casa, saude, lazer, trabalho, assinaturas, educacao, salario, freelance, outros)
- date: YYYY-MM-DD format

If the document contains multiple transactions, return the primary/largest one.
If information is unclear, make your best guess based on context.`,
  'categorize': 'You are a transaction categorizer. Given a transaction description and amount, respond with JSON containing "category" (a slug like "food", "transport", "housing", "entertainment", "health", "shopping", "income", "utilities", "education", "other") and "confidence" (0-1).',
  'insights': 'You are a personal finance analyst. Analyze the user\'s monthly transactions and provide JSON with: "summary" (string, 2-3 sentences), "patterns" (array of strings), "alerts" (array of strings for concerning spending), "tips" (array of strings for saving money).',
  'forecast': 'You are a financial forecasting assistant. Based on 3 months of transaction history, predict the next month. Respond with JSON: "projectedBalance" (number), "byCategory" (array of {category, projected, trend}), "confidence" (0-1).',
  'chat': 'You are a helpful financial assistant. You help users understand their spending, budgeting, and financial health. Be concise and practical.',
};

async function loadPrompt(feature: string): Promise<string> {
  try {
    const item = await getItem('GLOBAL', `PROMPT#${feature}`);
    if (item?.content) return item.content as string;
  } catch {
    // fall through to default
  }
  return DEFAULT_PROMPTS[feature] ?? '';
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MONTHLY_BUDGET_USD = parseFloat(process.env.AI_MONTHLY_BUDGET ?? '5');

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface OpenAiResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number };
}

async function callOpenAi(
  systemPrompt: string,
  userContent: ChatMessage['content'],
  model: string,
  options?: { responseFormat?: 'json' },
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  const body: Record<string, unknown> = { model, messages };
  if (options?.responseFormat === 'json') {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as OpenAiResponse;
  return {
    content: data.choices[0].message.content,
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
  };
}

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  };
  const rate = rates[model] ?? rates['gpt-4o-mini'];
  return promptTokens * rate.input + completionTokens * rate.output;
}

async function logUsage(
  feature: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const costUsd = estimateCost(model, promptTokens, completionTokens);
  await putItem({
    PK: 'GLOBAL',
    SK: `AI_USAGE#${today}#${feature}`,
    model,
    promptTokens,
    completionTokens,
    costUsd,
    timestamp: new Date().toISOString(),
  });
}

async function checkBudget(): Promise<boolean> {
  const month = new Date().toISOString().slice(0, 7);
  const usageItems = await queryItems('GLOBAL', `AI_USAGE#${month}`);
  const totalCost = usageItems.reduce((sum, item) => sum + ((item.costUsd as number) ?? 0), 0);
  return totalCost < MONTHLY_BUDGET_USD;
}

async function categorize(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { desc, amount } = body;
  if (!desc) return badRequest(event, 'Missing required field: desc');

  const model = 'gpt-4o-mini';
  const systemPrompt = await loadPrompt('categorize');
  const result = await callOpenAi(
    systemPrompt,
    `Description: ${desc}, Amount: ${amount ?? 'unknown'}`,
    model,
    { responseFormat: 'json' },
  );

  await logUsage('categorize', model, result.promptTokens, result.completionTokens);
  return ok(event, JSON.parse(result.content));
}

async function extractReceipt(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { file, mimeType } = body;
  if (!file || !mimeType) return badRequest(event, 'Missing required fields: file, mimeType');

  const model = 'gpt-4o';
  const systemPrompt = await loadPrompt('extract-receipt');
  const result = await callOpenAi(
    systemPrompt,
    [
      { type: 'text', text: 'Extract transaction data from this receipt.' },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${file}` } },
    ],
    model,
    { responseFormat: 'json' },
  );

  await logUsage('extract-receipt', model, result.promptTokens, result.completionTokens);
  return ok(event, JSON.parse(result.content));
}

async function insights(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { month } = body;
  if (!month) return badRequest(event, 'Missing required field: month');

  const transactions = await queryItems(`USER#${userId}`, `TX#${month}`);

  const model = 'gpt-4o-mini';
  const systemPrompt = await loadPrompt('insights');
  const result = await callOpenAi(
    systemPrompt,
    `Transactions for ${month}: ${JSON.stringify(transactions)}`,
    model,
    { responseFormat: 'json' },
  );

  await logUsage('insights', model, result.promptTokens, result.completionTokens);
  return ok(event, JSON.parse(result.content));
}

async function forecast(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { month } = body;
  if (!month) return badRequest(event, 'Missing required field: month');

  const [y, m] = month.split('-').map(Number);
  const months: string[] = [];
  for (let i = 3; i >= 1; i--) {
    const d = new Date(y, m - 1 - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const history = await Promise.all(
    months.map((mo) => queryItems(`USER#${userId}`, `TX#${mo}`)),
  );

  const historyData = months.map((mo, i) => ({ month: mo, transactions: history[i] }));

  const model = 'gpt-4o';
  const systemPrompt = await loadPrompt('forecast');
  const result = await callOpenAi(
    systemPrompt,
    `Forecast for ${month}. History: ${JSON.stringify(historyData)}`,
    model,
    { responseFormat: 'json' },
  );

  await logUsage('forecast', model, result.promptTokens, result.completionTokens);
  return ok(event, JSON.parse(result.content));
}

async function chat(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { message, context } = body;
  if (!message) return badRequest(event, 'Missing required field: message');

  const basePrompt = await loadPrompt('chat');
  const systemPrompt = `${basePrompt}${context ? ` Context: ${context}` : ''}`;

  const model = 'gpt-4o-mini';
  const result = await callOpenAi(systemPrompt, message, model);

  await logUsage('chat', model, result.promptTokens, result.completionTokens);
  return ok(event, { reply: result.content });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const withinBudget = await checkBudget();
    if (!withinBudget) return tooManyRequests(event, 'Monthly AI budget exceeded');

    const resource = event.resource;

    if (resource === '/ai/categorize') return categorize(event);
    if (resource === '/ai/extract-receipt') return extractReceipt(event);
    if (resource === '/ai/insights') return insights(event, auth.userId);
    if (resource === '/ai/forecast') return forecast(event, auth.userId);
    if (resource === '/ai/chat') return chat(event);

    return badRequest(event, 'Unknown AI endpoint');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
