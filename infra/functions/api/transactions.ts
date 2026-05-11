import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, notFound, serverError } from '../shared/response';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createTransaction(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { date, day, wd, desc, cat, amount, currency, account, fxRate } = body;

  if (!desc || !cat || amount == null || !currency || !account) {
    return badRequest(event, 'Missing required fields: desc, cat, amount, currency, account');
  }

  const now = new Date();
  const isoDate = date || now.toISOString().slice(0, 10);
  const month = isoDate.slice(0, 7);
  const id = generateId();

  const item: Record<string, unknown> = {
    PK: `USER#${userId}`,
    SK: `TX#${month}#${id}`,
    id,
    date: isoDate,
    day: day || String(now.getDate()),
    wd: wd || '',
    desc,
    cat,
    amount,
    currency,
    account,
    createdAt: now.toISOString(),
  };
  if (fxRate != null) item.fxRate = fxRate;
  if (body.receiptKey) item.receiptKey = body.receiptKey;
  if (body.receiptName) item.receiptName = body.receiptName;

  await putItem(item);
  return created(event, item);
}

async function listTransactions(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const month = event.queryStringParameters?.month;
  const prefix = month ? `TX#${month}` : 'TX#';
  const items = await queryItems(`USER#${userId}`, prefix);
  return ok(event, items);
}

async function getTransaction(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing transaction id');

  const month = event.queryStringParameters?.month;
  if (!month) return badRequest(event, 'Query parameter "month" is required');

  const item = await getItem(`USER#${userId}`, `TX#${month}#${id}`);
  if (!item) return notFound(event, 'Transaction not found');
  return ok(event, item);
}

async function updateTransaction(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing transaction id');

  const body = JSON.parse(event.body ?? '{}');
  const month = body.month ?? event.queryStringParameters?.month;
  if (!month) return badRequest(event, 'Month is required to identify transaction');

  const sk = `TX#${month}#${id}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Transaction not found');

  const { day, desc, cat, amount, currency, account, fxRate, receiptKey, receiptName } = body;
  const attrs: Record<string, unknown> = {};
  if (day !== undefined) attrs.day = day;
  if (desc !== undefined) attrs.desc = desc;
  if (cat !== undefined) attrs.cat = cat;
  if (amount !== undefined) attrs.amount = amount;
  if (currency !== undefined) attrs.currency = currency;
  if (account !== undefined) attrs.account = account;
  if (fxRate !== undefined) attrs.fxRate = fxRate;
  if (receiptKey !== undefined) attrs.receiptKey = receiptKey;
  if (receiptName !== undefined) attrs.receiptName = receiptName;
  attrs.updatedAt = new Date().toISOString();

  await updateItem(`USER#${userId}`, sk, attrs);
  return ok(event, { ...existing, ...attrs });
}

async function removeTransaction(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing transaction id');

  const month = event.queryStringParameters?.month;
  if (!month) return badRequest(event, 'Query parameter "month" is required');

  await deleteItem(`USER#${userId}`, `TX#${month}#${id}`);
  return ok(event, { deleted: true });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasId = !!event.pathParameters?.id;

    if (method === 'POST') return createTransaction(event, auth.userId);
    if (method === 'GET' && !hasId) return listTransactions(event, auth.userId);
    if (method === 'GET' && hasId) return getTransaction(event, auth.userId);
    if (method === 'PUT' && hasId) return updateTransaction(event, auth.userId);
    if (method === 'DELETE' && hasId) return removeTransaction(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
