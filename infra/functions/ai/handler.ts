import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { getItem, putItem, queryItems } from '../shared/dynamo';
import { ok, badRequest, serverError, tooManyRequests } from '../shared/response';

async function loadPrompt(feature: string): Promise<string> {
  const item = await getItem('GLOBAL', `PROMPT#${feature}`);
  if (!item?.content) throw new Error(`Prompt "${feature}" não configurado. Configure em Ajustes → Admin → Prompts de AI.`);
  return item.content as string;
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
  options?: { responseFormat?: 'json'; maxTokens?: number },
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  const body: Record<string, unknown> = { model, messages };
  if (options?.responseFormat === 'json') {
    body.response_format = { type: 'json_object' };
  }
  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens;
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

async function loadUserContext(userId: string): Promise<{
  accounts: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  recentTransactions: Record<string, unknown>[];
  settings: Record<string, unknown>;
}> {
  const [accounts, categories, settings] = await Promise.all([
    queryItems(`USER#${userId}`, 'ACCOUNT#'),
    queryItems(`USER#${userId}`, 'CAT#'),
    getItem(`USER#${userId}`, 'SETTINGS'),
  ]);

  // Get recent transactions — query current month and previous month, take last 20
  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const [curTx, prevTx] = await Promise.all([
    queryItems(`USER#${userId}`, `TX#${curMonth}`, undefined, { scanForward: false }),
    queryItems(`USER#${userId}`, `TX#${prevMonth}`, undefined, { scanForward: false }),
  ]);

  const recentTransactions = [...curTx, ...prevTx].slice(0, 20);

  return {
    accounts,
    categories,
    recentTransactions,
    settings: settings ?? { currency: 'BRL' },
  };
}

function buildExtractPrompt(
  basePrompt: string,
  ctx: {
    accounts: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    recentTransactions: Record<string, unknown>[];
    settings: Record<string, unknown>;
  },
): string {
  const accountList = ctx.accounts
    .map((a) => `${a.name} (${a.institution}, ${a.currency})`)
    .join(', ') || 'No accounts registered';

  const categoryList = ctx.categories
    .map((c) => c.slug ?? c.name)
    .join(', ') || 'mercado, restaurante, transporte, casa, saude, lazer, trabalho, assinaturas, educacao, salario, freelance, outros';

  const recentTxSummary = ctx.recentTransactions
    .map((t) => `${t.date}: ${t.desc} ${t.amount} ${t.currency} [${t.cat}]`)
    .join('\n') || 'No recent transactions';

  const currency = (ctx.settings.currency as string) ?? 'BRL';

  return basePrompt
    .replace(/{accounts}/g, accountList)
    .replace(/{accountList}/g, accountList)
    .replace(/{categories}/g, categoryList)
    .replace(/{categoryList}/g, categoryList)
    .replace(/{recentTransactions}/g, recentTxSummary)
    .replace(/{settings\.currency}/g, currency);
}

async function extractReceipt(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { files, text } = body as {
    files?: { base64: string; mimeType: string }[];
    text?: string;
  };

  if ((!files || files.length === 0) && !text?.trim()) {
    return badRequest(event, 'At least one file or text is required');
  }

  const [basePrompt, userContext] = await Promise.all([
    loadPrompt('extract-receipt'),
    loadUserContext(userId),
  ]);

  const systemPrompt = buildExtractPrompt(basePrompt, userContext);

  // Build user content array
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

  if (text?.trim()) {
    userContent.push({ type: 'text', text: text.trim() });
  } else {
    userContent.push({ type: 'text', text: 'Extract all transactions from the provided document(s).' });
  }

  if (files) {
    for (const file of files) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${file.mimeType};base64,${file.base64}` },
      });
    }
  }

  const model = 'gpt-4o';
  const result = await callOpenAi(systemPrompt, userContent, model, {
    responseFormat: 'json',
    maxTokens: 8000,
  });

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
    if (resource === '/ai/extract-receipt') return extractReceipt(event, auth.userId);
    if (resource === '/ai/insights') return insights(event, auth.userId);
    if (resource === '/ai/forecast') return forecast(event, auth.userId);
    if (resource === '/ai/chat') return chat(event);

    return badRequest(event, 'Unknown AI endpoint');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
