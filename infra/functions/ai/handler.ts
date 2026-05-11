import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { extractAuth } from '../shared/auth';
import { getItem, putItem, queryItems, updateItem } from '../shared/dynamo';
import { ok, badRequest, notFound, serverError, tooManyRequests } from '../shared/response';

async function loadPrompt(feature: string): Promise<string> {
  const item = await getItem('GLOBAL', `PROMPT#${feature}`);
  if (!item?.content) throw new Error(`Prompt "${feature}" não configurado. Configure em Ajustes → Admin → Prompts de AI.`);
  return item.content as string;
}

let cachedApiKey: string | null = null;
async function getOpenAiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  const ssm = new SSMClient({});
  const param = await ssm.send(new GetParameterCommand({
    Name: '/wallet/openai-api-key',
    WithDecryption: true,
  }));
  cachedApiKey = param.Parameter?.Value ?? '';
  return cachedApiKey;
}

const MONTHLY_BUDGET_USD = parseFloat(process.env.AI_MONTHLY_BUDGET ?? '5');

interface ContentPart {
  type: string;
  text?: string;
  image_url?: { url: string; detail?: string };
  file?: { filename?: string; file_data: string };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

function buildFileContent(files: { base64: string; mimeType: string; name?: string }[]): ContentPart[] {
  return files.map((file, i) => {
    const dataUrl = `data:${file.mimeType};base64,${file.base64}`;
    if (file.mimeType === 'application/pdf') {
      return {
        type: 'file',
        file: {
          filename: file.name ?? `document-${i + 1}.pdf`,
          file_data: dataUrl,
        },
      };
    }
    return {
      type: 'image_url',
      image_url: { url: dataUrl, detail: 'high' },
    };
  });
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
      Authorization: `Bearer ${await getOpenAiKey()}`,
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

interface UserContext {
  accounts: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  recentTransactions: Record<string, unknown>[];
  settings: Record<string, unknown>;
}

type CatLearning = Record<string, unknown>;

async function loadCategoryLearning(): Promise<CatLearning[]> {
  return queryItems('GLOBAL', 'CAT_LEARN#');
}

function buildPromptWithContext(
  basePrompt: string,
  ctx: UserContext,
  learning: CatLearning[],
  extra?: Record<string, string>,
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

  const learningText = learning.length > 0
    ? learning.map((l) => `"${l.merchant}" → ${l.category} (corrected ${l.count}x)`).join('\n')
    : 'No corrections yet';

  const currency = (ctx.settings.currency as string) ?? 'BRL';
  const budget = (ctx.settings.monthlyBudget as string) ?? 'Not set';
  const settingsText = `Currency: ${currency}, Budget: ${budget}`;

  let result = basePrompt
    .replace(/{accounts}/g, accountList)
    .replace(/{categories}/g, categoryList)
    .replace(/{recentTransactions}/g, recentTxSummary)
    .replace(/{categoryLearning}/g, learningText)
    .replace(/{settings}/g, settingsText)
    .replace(/{monthlyBudget}/g, budget);

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }

  return result;
}

function buildCategorizePrompt(
  basePrompt: string,
  ctx: UserContext,
  learning: CatLearning[],
): string {
  return buildPromptWithContext(basePrompt, ctx, learning);
}

async function categorize(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { desc, amount, currency, account } = body;
  if (!desc) return badRequest(event, 'Missing required field: desc');

  const [basePrompt, userContext, learning] = await Promise.all([
    loadPrompt('categorize'),
    loadUserContext(userId),
    loadCategoryLearning(),
  ]);

  const systemPrompt = buildCategorizePrompt(basePrompt, userContext, learning);

  const model = 'gpt-4o-mini';
  const userMessage = `Description: ${desc}, Amount: ${amount ?? 'unknown'}, Currency: ${currency ?? 'unknown'}, Account: ${account ?? 'unknown'}`;
  const result = await callOpenAi(systemPrompt, userMessage, model, { responseFormat: 'json' });

  await logUsage('categorize', model, result.promptTokens, result.completionTokens);
  return ok(event, JSON.parse(result.content));
}

function normalizeToSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function learnCategory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { merchant, suggestedCategory, correctedCategory } = body;
  if (!merchant || !correctedCategory) return badRequest(event, 'Missing required fields: merchant, correctedCategory');

  const slug = normalizeToSlug(merchant);
  const sk = `CAT_LEARN#${slug}`;
  const existing = await getItem('GLOBAL', sk);

  if (existing) {
    await updateItem('GLOBAL', sk, {
      category: correctedCategory,
      suggestedCategory: suggestedCategory ?? existing.suggestedCategory,
      count: ((existing.count as number) ?? 0) + 1,
      lastUsed: new Date().toISOString().slice(0, 10),
    });
  } else {
    await putItem({
      PK: 'GLOBAL',
      SK: sk,
      merchant,
      category: correctedCategory,
      suggestedCategory: suggestedCategory ?? '',
      count: 1,
      lastUsed: new Date().toISOString().slice(0, 10),
    });
  }

  return ok(event, { saved: true });
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
  ctx: UserContext,
): string {
  const currency = (ctx.settings.currency as string) ?? 'BRL';
  const accountList = ctx.accounts
    .map((a) => `${a.name} (${a.institution}, ${a.currency})`)
    .join(', ') || 'No accounts registered';
  const categoryList = ctx.categories
    .map((c) => c.slug ?? c.name)
    .join(', ') || 'mercado, restaurante, transporte, casa, saude, lazer, trabalho, assinaturas, educacao, salario, freelance, outros';

  return buildPromptWithContext(basePrompt, ctx, [], {
    'accountList': accountList,
    'categoryList': categoryList,
    'settings\\.currency': currency,
  });
}

async function extractReceipt(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { files, text, jobId: existingJobId } = body as {
    files?: { base64: string; mimeType: string }[];
    text?: string;
    jobId?: string;
  };

  // Async worker invocation — do the actual work
  if (existingJobId) {
    return processExtractReceipt(event, userId, existingJobId, files, text);
  }

  if ((!files || files.length === 0) && !text?.trim()) {
    return badRequest(event, 'At least one file or text is required');
  }

  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await putItem({
    PK: 'GLOBAL',
    SK: `AI_JOB#${jobId}`,
    jobId,
    userId,
    status: 'processing',
    feature: 'extract-receipt',
    createdAt: new Date().toISOString(),
  });

  const lambda = new LambdaClient({});
  await lambda.send(new InvokeCommand({
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
    InvocationType: 'Event',
    Payload: new TextEncoder().encode(JSON.stringify({
      ...event,
      body: JSON.stringify({ ...body, jobId }),
    })),
  }));

  return ok(event, { jobId, status: 'processing' });
}

async function processExtractReceipt(
  event: APIGatewayProxyEvent,
  userId: string,
  jobId: string,
  files?: { base64: string; mimeType: string }[],
  text?: string,
): Promise<APIGatewayProxyResult> {
  try {
    const [basePrompt, userContext] = await Promise.all([
      loadPrompt('extract-receipt'),
      loadUserContext(userId),
    ]);

    const systemPrompt = buildExtractPrompt(basePrompt, userContext);

    const userContent: ContentPart[] = [];
    if (text?.trim()) {
      userContent.push({ type: 'text', text: text.trim() });
    } else {
      userContent.push({ type: 'text', text: 'Extract all transactions from the provided document(s).' });
    }
    if (files) {
      userContent.push(...buildFileContent(files));
    }

    const model = 'gpt-4o';
    const result = await callOpenAi(systemPrompt, userContent, model, {
      responseFormat: 'json',
      maxTokens: 8000,
    });

    await logUsage('extract-receipt', model, result.promptTokens, result.completionTokens);

    const parsed = JSON.parse(result.content);
    await putItem({
      PK: 'GLOBAL',
      SK: `AI_JOB#${jobId}`,
      jobId,
      userId,
      status: 'completed',
      feature: 'extract-receipt',
      result: parsed,
      completedAt: new Date().toISOString(),
    });

    return ok(event, { jobId, status: 'completed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await putItem({
      PK: 'GLOBAL',
      SK: `AI_JOB#${jobId}`,
      jobId,
      userId,
      status: 'failed',
      feature: 'extract-receipt',
      error: message,
      completedAt: new Date().toISOString(),
    });
    return serverError(event, message);
  }
}

function buildInsightsPrompt(
  basePrompt: string,
  ctx: UserContext,
  learning: CatLearning[],
  currentMonthTx: Record<string, unknown>[],
  previousMonthTx: Record<string, unknown>[],
): string {
  const formatTx = (txs: Record<string, unknown>[]) =>
    txs.map((t) => `${t.date}: ${t.desc} ${t.amount} ${t.currency} [${t.cat}]`).join('\n') || 'No transactions';

  return buildPromptWithContext(basePrompt, ctx, learning, {
    currentMonthTransactions: formatTx(currentMonthTx),
    previousMonthTransactions: formatTx(previousMonthTx),
  });
}

async function insights(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { month } = body;
  if (!month) return badRequest(event, 'Missing required field: month');

  const [y, m] = month.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const [basePrompt, userContext, learning, currentMonthTx, previousMonthTx] = await Promise.all([
    loadPrompt('insights'),
    loadUserContext(userId),
    loadCategoryLearning(),
    queryItems(`USER#${userId}`, `TX#${month}`),
    queryItems(`USER#${userId}`, `TX#${prevMonth}`),
  ]);

  const systemPrompt = buildInsightsPrompt(basePrompt, userContext, learning, currentMonthTx, previousMonthTx);

  const model = 'gpt-4o-mini';
  const result = await callOpenAi(
    systemPrompt,
    `Analyze spending for ${month} and compare with ${prevMonth}.`,
    model,
    { responseFormat: 'json' },
  );

  await logUsage('insights', model, result.promptTokens, result.completionTokens);
  return ok(event, JSON.parse(result.content));
}

function buildForecastPrompt(
  basePrompt: string,
  ctx: UserContext,
  learning: CatLearning[],
  historyData: { month: string; transactions: Record<string, unknown>[] }[],
): string {
  const historyText = historyData
    .map((h) => {
      const txLines = h.transactions
        .map((t) => `  ${t.date}: ${t.desc} ${t.amount} ${t.currency} [${t.cat}]`)
        .join('\n') || '  No transactions';
      return `${h.month}:\n${txLines}`;
    })
    .join('\n\n');

  return buildPromptWithContext(basePrompt, ctx, learning, {
    history: historyText,
  });
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

  const [basePrompt, userContext, learning, historyArrays] = await Promise.all([
    loadPrompt('forecast'),
    loadUserContext(userId),
    loadCategoryLearning(),
    Promise.all(months.map((mo) => queryItems(`USER#${userId}`, `TX#${mo}`))),
  ]);

  const historyData = months.map((mo, i) => ({ month: mo, transactions: historyArrays[i] }));

  const systemPrompt = buildForecastPrompt(basePrompt, userContext, learning, historyData);

  const model = 'gpt-4o';
  const result = await callOpenAi(
    systemPrompt,
    `Forecast spending for ${month} based on the historical data provided.`,
    model,
    { responseFormat: 'json' },
  );

  await logUsage('forecast', model, result.promptTokens, result.completionTokens);
  return ok(event, JSON.parse(result.content));
}

function buildChatPrompt(
  basePrompt: string,
  ctx: UserContext,
  learning: CatLearning[],
): string {
  return buildPromptWithContext(basePrompt, ctx, learning);
}

async function chat(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { message } = body;
  if (!message) return badRequest(event, 'Missing required field: message');

  const [basePrompt, userContext, learning] = await Promise.all([
    loadPrompt('chat'),
    loadUserContext(userId),
    loadCategoryLearning(),
  ]);

  const systemPrompt = buildChatPrompt(basePrompt, userContext, learning);

  const model = 'gpt-4o-mini';
  const result = await callOpenAi(systemPrompt, message, model);

  await logUsage('chat', model, result.promptTokens, result.completionTokens);
  return ok(event, { reply: result.content });
}

async function extractRecurring(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { files, text, jobId: existingJobId } = body as {
    files?: { base64: string; mimeType: string }[];
    text?: string;
    jobId?: string;
  };

  // Async worker invocation — do the actual work
  if (existingJobId) {
    return processExtractRecurring(event, userId, existingJobId, files, text);
  }

  if ((!files || files.length === 0) && !text?.trim()) {
    return badRequest(event, 'At least one file or text is required');
  }

  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await putItem({
    PK: 'GLOBAL',
    SK: `AI_JOB#${jobId}`,
    jobId,
    userId,
    status: 'processing',
    feature: 'extract-recurring',
    createdAt: new Date().toISOString(),
  });

  const lambda = new LambdaClient({});
  await lambda.send(new InvokeCommand({
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
    InvocationType: 'Event',
    Payload: new TextEncoder().encode(JSON.stringify({
      ...event,
      body: JSON.stringify({ ...body, jobId }),
    })),
  }));

  return ok(event, { jobId, status: 'processing' });
}

async function processExtractRecurring(
  event: APIGatewayProxyEvent,
  userId: string,
  jobId: string,
  files?: { base64: string; mimeType: string }[],
  text?: string,
): Promise<APIGatewayProxyResult> {
  try {
    const [basePrompt, userContext] = await Promise.all([
      loadPrompt('extract-recurring'),
      loadUserContext(userId),
    ]);

    const systemPrompt = buildExtractPrompt(basePrompt, userContext);

    const userContent: ContentPart[] = [];
    if (text?.trim()) {
      userContent.push({ type: 'text', text: text.trim() });
    } else {
      userContent.push({ type: 'text', text: 'Identify all recurring transactions/subscriptions from the provided document(s). Cross-reference ALL documents to find patterns across months.' });
    }
    if (files) {
      userContent.push(...buildFileContent(files));
    }

    const model = 'gpt-4o';
    const result = await callOpenAi(systemPrompt, userContent, model, {
      responseFormat: 'json',
      maxTokens: 16000,
    });

    await logUsage('extract-recurring', model, result.promptTokens, result.completionTokens);

    const parsed = JSON.parse(result.content);
    await putItem({
      PK: 'GLOBAL',
      SK: `AI_JOB#${jobId}`,
      jobId,
      userId,
      status: 'completed',
      feature: 'extract-recurring',
      result: parsed,
      completedAt: new Date().toISOString(),
    });

    return ok(event, { jobId, status: 'completed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await putItem({
      PK: 'GLOBAL',
      SK: `AI_JOB#${jobId}`,
      jobId,
      userId,
      status: 'failed',
      feature: 'extract-recurring',
      error: message,
      completedAt: new Date().toISOString(),
    });
    return serverError(event, message);
  }
}

async function getJobStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const jobId = event.pathParameters?.jobId;
  if (!jobId) return badRequest(event, 'Missing jobId');

  const item = await getItem('GLOBAL', `AI_JOB#${jobId}`);
  if (!item) return notFound(event, 'Job not found');

  return ok(event, item);
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const resource = event.resource;

    // Job status polling — no budget check needed
    if (resource === '/ai/jobs/{jobId}') return getJobStatus(event);

    const withinBudget = await checkBudget();
    if (!withinBudget) return tooManyRequests(event, 'Monthly AI budget exceeded');

    if (resource === '/ai/categorize') return categorize(event, auth.userId);
    if (resource === '/ai/extract-receipt') return extractReceipt(event, auth.userId);
    if (resource === '/ai/extract-recurring') return extractRecurring(event, auth.userId);
    if (resource === '/ai/insights') return insights(event, auth.userId);
    if (resource === '/ai/forecast') return forecast(event, auth.userId);
    if (resource === '/ai/chat') return chat(event, auth.userId);
    if (resource === '/ai/learn-category') return learnCategory(event);

    return badRequest(event, 'Unknown AI endpoint');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
