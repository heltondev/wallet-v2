import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { getItem, putItem, queryItems } from '../shared/dynamo';
import { ok, badRequest, serverError, tooManyRequests } from '../shared/response';

const DEFAULT_EXTRACT_RECEIPT_PROMPT = `You are a financial document analyzer for a personal finance app. The user has accounts in both Brazil (BRL) and the United States (USD).

## Your Task
Analyze the provided document (receipt, bank statement, invoice, bill, credit card statement, or screenshot) and extract ALL transactions found.

## User Context
The user's registered accounts are: {accounts}
The user's categories are: {categories}
Recent transactions for pattern matching: {recentTransactions}
User's primary currency: {settings.currency}

## Rules for Extraction

### Transaction Detection
- Extract EVERY transaction found in the document
- If the document is a single receipt, return 1 transaction
- If it's a bank statement or credit card bill, return ALL line items as separate transactions

### Amount
- Negative for expenses (saída), positive for income (entrada)
- Use the exact amount from the document
- Do NOT convert currencies — use the original currency from the document

### Currency Detection (use ALL signals, ask if conflicting)
- Symbol: R$ = BRL, $ without R = USD, € = EUR
- Number format: 1.234,56 = likely BRL, 1,234.56 = likely USD
- Document language: Portuguese = likely BRL, English = likely USD
- If signals conflict, set currencyConflict: true and explain in warnings

### Category Assignment
- Analyze the ENTIRE document to determine category
- Match against the user's existing categories: {categoryList}
- Use merchant name, item descriptions, document type, and amount patterns
- Set catConfidence: "high" (>90% sure), "medium" (60-90%), "low" (<60%)
- When "low" or "medium", provide 2-3 catAlternatives ranked by likelihood

### Date Selection (depends on document type)
- Receipt/purchase: use the purchase/transaction date
- Bill/boleto: use the payment date (data de pagamento), or due date if unpaid
- Credit card statement: use each transaction's individual date
- Bank statement: use each transaction's date
- If unclear, use the most recent date on the document

### Account Matching
- Match against user's registered accounts: {accountList}
- Look for bank name, card last 4 digits, account identifiers
- Set accountConfidence: "high", "medium", "low"
- If no match found, set account to null

### Merchant Details
- Extract as much as possible: name, legal name, CNPJ (Brazil) or EIN (US), address, phone
- For Brazilian NFe/cupom fiscal, extract all fiscal data

### Items & Tax
- If individual items are listed (like a grocery receipt), extract each one
- For Brazilian documents, extract tax breakdown (ICMS, PIS, COFINS) if available
- For US documents, extract sales tax if shown

### Notes & Intelligence
- Write detailed notes in the document's language
- Include context: what type of purchase, number of items, payment method
- Add flags: high_value, regular_merchant, unusual_amount, first_time_merchant, subscription
- In suggestions, reference the user's history if relevant patterns exist

## Response Format
Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "transactions": [
    {
      "desc": "merchant or payee name",
      "amount": -123.45,
      "currency": "BRL",
      "cat": "category_slug",
      "catConfidence": "high|medium|low",
      "catAlternatives": ["alt1", "alt2"],
      "date": "YYYY-MM-DD",
      "dateType": "purchase_date|payment_date|due_date|transaction_date",
      "account": "account name or null",
      "accountConfidence": "high|medium|low",
      "merchant": {
        "name": "display name",
        "fullName": "legal/full name or null",
        "cnpj": "XX.XXX.XXX/XXXX-XX or null",
        "ein": "XX-XXXXXXX or null",
        "address": "full address or null",
        "phone": "phone or null",
        "category": "merchant industry category"
      },
      "payment": {
        "method": "credit_card|debit_card|pix|boleto|cash|transfer|null",
        "cardLast4": "1234 or null",
        "installments": "total installments or null",
        "installmentNumber": "current installment or null"
      },
      "items": [
        {"name": "item", "qty": 1, "unitPrice": 10.00, "total": 10.00}
      ],
      "tax": {
        "total": 0,
        "breakdown": {}
      },
      "totals": {
        "subtotal": 0,
        "discount": 0,
        "tax": 0,
        "total": 0
      },
      "notes": "detailed contextual notes about this transaction",
      "rawText": "relevant excerpt from original document",
      "flags": ["flag1", "flag2"]
    }
  ],
  "document": {
    "type": "receipt|invoice|bank_statement|bill|credit_card_statement|screenshot|other",
    "subType": "more specific type",
    "language": "pt-BR|en-US",
    "country": "BR|US",
    "issueDate": "YYYY-MM-DD or null",
    "dueDate": "YYYY-MM-DD or null",
    "quality": "good|fair|poor",
    "pageCount": 1
  },
  "warnings": ["any issues or uncertainties"],
  "suggestions": ["intelligent observations based on user history"]
}`;

const DEFAULT_PROMPTS: Record<string, string> = {
  'extract-receipt': DEFAULT_EXTRACT_RECEIPT_PROMPT,
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
