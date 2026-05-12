import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, forbidden, notFound, serverError } from '../shared/response';
import { resolveWorkspaceAccess } from '../shared/workspace-access';

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
  if (body.recurringId) item.recurringId = body.recurringId;
  if (body.workspaceId) item.workspaceId = body.workspaceId;

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
  if (body.workspaceId !== undefined) attrs.workspaceId = body.workspaceId;
  attrs.updatedAt = new Date().toISOString();

  // Mark as override if editing a recurring-generated transaction
  if (existing.recurringId) {
    attrs.isRecurringOverride = true;
  }

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

    // Resolve shared workspace access
    const ownerParam = event.queryStringParameters?.owner;
    const workspaceParam = event.queryStringParameters?.workspace;
    let targetUserId = auth.userId;

    if (ownerParam && ownerParam !== auth.userId) {
      if (!workspaceParam) return badRequest(event, 'workspace param required for shared access');
      const access = await resolveWorkspaceAccess(auth.userId, workspaceParam);
      if (!access || access.ownerId !== ownerParam) return forbidden(event, 'Acesso negado');
      const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE';
      if (isWrite && access.role === 'viewer') return forbidden(event, 'Permissão insuficiente');
      targetUserId = ownerParam;
    }

    if (method === 'POST') return createTransaction(event, targetUserId);
    if (method === 'GET' && !hasId) return listTransactions(event, targetUserId);
    if (method === 'GET' && hasId) return getTransaction(event, targetUserId);
    if (method === 'PUT' && hasId) return updateTransaction(event, targetUserId);
    if (method === 'DELETE' && hasId) return removeTransaction(event, targetUserId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
