import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, notFound, serverError } from '../shared/response';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createWorkspace(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { name, currency, monthlyBudget, icon, order } = body;

  if (!name || !currency) {
    return badRequest(event, 'Missing required fields: name, currency');
  }

  const now = new Date();
  const id = generateId();

  const item: Record<string, unknown> = {
    PK: `USER#${userId}`,
    SK: `WORKSPACE#${id}`,
    id,
    name,
    currency,
    monthlyBudget: monthlyBudget ?? 0,
    icon: icon ?? '',
    order: order ?? 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await putItem(item);
  return created(event, item);
}

async function listWorkspaces(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const items = await queryItems(`USER#${userId}`, 'WORKSPACE#');
  return ok(event, items);
}

async function updateWorkspace(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing workspace id');

  const sk = `WORKSPACE#${id}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Workspace not found');

  const body = JSON.parse(event.body ?? '{}');
  const attrs: Record<string, unknown> = {};
  if (body.name !== undefined) attrs.name = body.name;
  if (body.currency !== undefined) attrs.currency = body.currency;
  if (body.monthlyBudget !== undefined) attrs.monthlyBudget = body.monthlyBudget;
  if (body.icon !== undefined) attrs.icon = body.icon;
  if (body.order !== undefined) attrs.order = body.order;
  attrs.updatedAt = new Date().toISOString();

  await updateItem(`USER#${userId}`, sk, attrs);
  return ok(event, { ...existing, ...attrs });
}

async function removeWorkspace(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing workspace id');

  const sk = `WORKSPACE#${id}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Workspace not found');

  // Check if any accounts are linked to this workspace
  const accounts = await queryItems(`USER#${userId}`, 'ACCOUNT#');
  const linked = accounts.some(a => a.workspaceId === id);
  if (linked) {
    return badRequest(event, 'Cannot delete workspace with linked accounts. Remove or reassign accounts first.');
  }

  // Check if any transactions are linked
  const transactions = await queryItems(`USER#${userId}`, 'TX#');
  const txLinked = transactions.some(t => t.workspaceId === id);
  if (txLinked) {
    return badRequest(event, 'Cannot delete workspace with linked transactions.');
  }

  await deleteItem(`USER#${userId}`, sk);
  return ok(event, { deleted: true });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasId = !!event.pathParameters?.id;

    if (method === 'POST') return createWorkspace(event, auth.userId);
    if (method === 'GET') return listWorkspaces(event, auth.userId);
    if (method === 'PUT' && hasId) return updateWorkspace(event, auth.userId);
    if (method === 'DELETE' && hasId) return removeWorkspace(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
