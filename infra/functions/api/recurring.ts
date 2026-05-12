import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, forbidden, notFound, serverError } from '../shared/response';
import { resolveWorkspaceAccess } from '../shared/workspace-access';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createRecurring(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { desc, amount, currency, cat, account, frequency } = body;

  if (!desc || amount == null || !currency || !cat || !account || !frequency) {
    return badRequest(event, 'Missing required fields: desc, amount, currency, cat, account, frequency');
  }

  const now = new Date();
  const id = generateId();

  const item: Record<string, unknown> = {
    PK: `USER#${userId}`,
    SK: `RECURRING#${id}`,
    id,
    desc,
    amount,
    currency,
    cat,
    account,
    frequency,
    customDays: body.customDays ?? null,
    dayOfMonth: body.dayOfMonth ?? null,
    dayOfWeek: body.dayOfWeek ?? null,
    startDate: body.startDate ?? now.toISOString().slice(0, 10),
    endDate: body.endDate ?? null,
    active: body.active !== undefined ? body.active : true,
    fxRate: body.fxRate ?? 1,
    notes: body.notes ?? null,
    workspaceId: body.workspaceId ?? null,
    lastGenerated: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await putItem(item);
  return created(event, item);
}

async function listRecurring(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const items = await queryItems(`USER#${userId}`, 'RECURRING#');
  return ok(event, items);
}

async function updateRecurring(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing recurring id');

  const sk = `RECURRING#${id}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Recurring template not found');

  const body = JSON.parse(event.body ?? '{}');
  const allowedFields = [
    'desc', 'amount', 'currency', 'cat', 'account', 'frequency',
    'customDays', 'dayOfMonth', 'dayOfWeek', 'startDate', 'endDate',
    'active', 'fxRate', 'notes', 'workspaceId', 'lastGenerated',
  ];

  const attrs: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) attrs[field] = body[field];
  }
  attrs.updatedAt = new Date().toISOString();

  await updateItem(`USER#${userId}`, sk, attrs);
  return ok(event, { ...existing, ...attrs });
}

function isDue(r: Record<string, unknown>, now: Date): boolean {
  const lastGen = r.lastGenerated as string | null;
  const freq = r.frequency as string;
  const startDate = r.startDate as string;
  const endDate = r.endDate as string | null;

  // Not started yet
  if (startDate && now.toISOString().slice(0, 10) < startDate) return false;
  // Past end date
  if (endDate && now.toISOString().slice(0, 10) > endDate) return false;

  const today = now.toISOString().slice(0, 10);
  const curMonth = today.slice(0, 7);
  const curYear = now.getFullYear();

  if (!lastGen) return true; // Never generated

  if (freq === 'monthly') {
    const dayOfMonth = (r.dayOfMonth as number) ?? now.getDate();
    const lastMonth = lastGen.slice(0, 7);
    return now.getDate() >= dayOfMonth && lastMonth < curMonth;
  }

  if (freq === 'weekly') {
    const diffDays = Math.floor((now.getTime() - new Date(lastGen).getTime()) / 86400000);
    return diffDays >= 7;
  }

  if (freq === 'biweekly') {
    const diffDays = Math.floor((now.getTime() - new Date(lastGen).getTime()) / 86400000);
    return diffDays >= 14;
  }

  if (freq === 'yearly') {
    const lastYear = new Date(lastGen).getFullYear();
    const dayOfMonth = (r.dayOfMonth as number) ?? 1;
    return curYear > lastYear && now.getDate() >= dayOfMonth;
  }

  if (freq === 'custom') {
    const customDays = (r.customDays as number) ?? 30;
    const diffDays = Math.floor((now.getTime() - new Date(lastGen).getTime()) / 86400000);
    return diffDays >= customDays;
  }

  return false;
}

const PT_WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

async function generateRecurring(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const items = await queryItems(`USER#${userId}`, 'RECURRING#');
  const now = new Date();
  const generated: Record<string, unknown>[] = [];

  for (const r of items) {
    if (!(r.active as boolean)) continue;
    if (!isDue(r, now)) continue;

    const isoDate = now.toISOString().slice(0, 10);
    const month = isoDate.slice(0, 7);
    const txId = generateId();

    const tx: Record<string, unknown> = {
      PK: `USER#${userId}`,
      SK: `TX#${month}#${txId}`,
      id: txId,
      date: isoDate,
      day: String(now.getDate()),
      wd: PT_WEEKDAYS[now.getDay()],
      desc: r.desc,
      cat: r.cat,
      amount: r.amount,
      currency: r.currency,
      account: r.account,
      fxRate: r.fxRate ?? 1,
      recurringId: r.id,
      createdAt: now.toISOString(),
      ...(r.workspaceId ? { workspaceId: r.workspaceId } : {}),
    };

    await putItem(tx);
    await updateItem(`USER#${userId}`, r.SK as string, {
      lastGenerated: isoDate,
      updatedAt: now.toISOString(),
    });

    generated.push(tx);
  }

  return ok(event, { generated });
}

async function removeRecurring(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing recurring id');

  const sk = `RECURRING#${id}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Recurring template not found');

  await deleteItem(`USER#${userId}`, sk);
  return ok(event, { deleted: true });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasId = !!event.pathParameters?.id;
    const resource = event.resource;

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

    if (resource === '/recurring/generate' && method === 'POST') return generateRecurring(event, targetUserId);
    if (method === 'POST') return createRecurring(event, targetUserId);
    if (method === 'GET' && !hasId) return listRecurring(event, targetUserId);
    if (method === 'PUT' && hasId) return updateRecurring(event, targetUserId);
    if (method === 'DELETE' && hasId) return removeRecurring(event, targetUserId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
