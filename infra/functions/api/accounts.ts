import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, notFound, serverError } from '../shared/response';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createAccount(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { name, institution, currency } = body;

  if (!name || !institution || !currency) {
    return badRequest(event, 'Missing required fields: name, institution, currency');
  }

  const id = generateId();
  const item = {
    PK: `USER#${userId}`,
    SK: `ACCOUNT#${id}`,
    id,
    name,
    institution,
    currency,
    createdAt: new Date().toISOString(),
  };

  await putItem(item);
  return created(event, item);
}

async function listAccounts(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const items = await queryItems(`USER#${userId}`, 'ACCOUNT#');
  return ok(event, items);
}

async function updateAccount(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing account id');

  const sk = `ACCOUNT#${id}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Account not found');

  const body = JSON.parse(event.body ?? '{}');
  const attrs: Record<string, unknown> = {};
  if (body.name !== undefined) attrs.name = body.name;
  if (body.institution !== undefined) attrs.institution = body.institution;
  if (body.currency !== undefined) attrs.currency = body.currency;
  attrs.updatedAt = new Date().toISOString();

  await updateItem(`USER#${userId}`, sk, attrs);
  return ok(event, { ...existing, ...attrs });
}

async function removeAccount(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing account id');

  await deleteItem(`USER#${userId}`, `ACCOUNT#${id}`);
  return ok(event, { deleted: true });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasId = !!event.pathParameters?.id;

    if (method === 'POST') return createAccount(event, auth.userId);
    if (method === 'GET') return listAccounts(event, auth.userId);
    if (method === 'PUT' && hasId) return updateAccount(event, auth.userId);
    if (method === 'DELETE' && hasId) return removeAccount(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
