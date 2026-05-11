import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem } from '../shared/dynamo';
import { ok, created, badRequest, notFound, serverError } from '../shared/response';

async function createBudget(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { month, amount, categoryBudgets } = body;

  if (!month || amount == null) {
    return badRequest(event, 'Missing required fields: month, amount');
  }

  const item = {
    PK: `USER#${userId}`,
    SK: `BUDGET#${month}`,
    month,
    amount,
    categoryBudgets: categoryBudgets ?? {},
    createdAt: new Date().toISOString(),
  };

  await putItem(item);
  return created(event, item);
}

async function listBudgets(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const month = event.queryStringParameters?.month;
  const prefix = month ? `BUDGET#${month}` : 'BUDGET#';
  const items = await queryItems(`USER#${userId}`, prefix);
  return ok(event, items);
}

async function updateBudget(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const month = event.pathParameters?.month;
  if (!month) return badRequest(event, 'Missing budget month');

  const sk = `BUDGET#${month}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Budget not found');

  const body = JSON.parse(event.body ?? '{}');
  const attrs: Record<string, unknown> = {};
  if (body.amount !== undefined) attrs.amount = body.amount;
  if (body.categoryBudgets !== undefined) attrs.categoryBudgets = body.categoryBudgets;
  attrs.updatedAt = new Date().toISOString();

  await updateItem(`USER#${userId}`, sk, attrs);
  return ok(event, { ...existing, ...attrs });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasMonth = !!event.pathParameters?.month;

    if (method === 'POST') return createBudget(event, auth.userId);
    if (method === 'GET') return listBudgets(event, auth.userId);
    if (method === 'PUT' && hasMonth) return updateBudget(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
