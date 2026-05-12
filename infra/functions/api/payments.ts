import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, serverError } from '../shared/response';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createPayment(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { recurringId, month, amount, currency, paidDate, account } = body;

  if (!recurringId || !month || amount == null || !currency || !paidDate || !account) {
    return badRequest(event, 'Missing required fields: recurringId, month, amount, currency, paidDate, account');
  }

  const id = generateId();
  const now = new Date();

  const item: Record<string, unknown> = {
    PK: `USER#${userId}`,
    SK: `PAYMENT#${month}#${id}`,
    id,
    recurringId,
    month,
    amount,
    currency,
    paidDate,
    account,
    createdAt: now.toISOString(),
  };
  if (body.receiptKey) item.receiptKey = body.receiptKey;
  if (body.receiptName) item.receiptName = body.receiptName;
  if (body.notes) item.notes = body.notes;
  if (body.workspaceId) item.workspaceId = body.workspaceId;

  await putItem(item);
  return created(event, item);
}

async function listPayments(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const month = event.queryStringParameters?.month;
  const prefix = month ? `PAYMENT#${month}` : 'PAYMENT#';
  const items = await queryItems(`USER#${userId}`, prefix);
  return ok(event, items);
}

async function removePayment(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters?.id;
  if (!id) return badRequest(event, 'Missing payment id');

  const month = event.queryStringParameters?.month;
  if (!month) return badRequest(event, 'Query parameter "month" is required');

  await deleteItem(`USER#${userId}`, `PAYMENT#${month}#${id}`);
  return ok(event, { deleted: true });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasId = !!event.pathParameters?.id;

    if (method === 'POST') return createPayment(event, auth.userId);
    if (method === 'GET') return listPayments(event, auth.userId);
    if (method === 'DELETE' && hasId) return removePayment(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
