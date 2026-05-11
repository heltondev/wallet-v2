import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, notFound, serverError } from '../shared/response';

async function createCategory(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { slug, label, color, icon } = body;

  if (!slug || !label || !color || !icon) {
    return badRequest(event, 'Missing required fields: slug, label, color, icon');
  }

  const item = {
    PK: `USER#${userId}`,
    SK: `CAT#${slug}`,
    slug,
    label,
    color,
    icon,
    createdAt: new Date().toISOString(),
  };

  await putItem(item);
  return created(event, item);
}

async function listCategories(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const items = await queryItems(`USER#${userId}`, 'CAT#');
  return ok(event, items);
}

async function updateCategory(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest(event, 'Missing category slug');

  const sk = `CAT#${slug}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Category not found');

  const body = JSON.parse(event.body ?? '{}');
  const attrs: Record<string, unknown> = {};
  if (body.label !== undefined) attrs.label = body.label;
  if (body.color !== undefined) attrs.color = body.color;
  if (body.icon !== undefined) attrs.icon = body.icon;
  attrs.updatedAt = new Date().toISOString();

  await updateItem(`USER#${userId}`, sk, attrs);
  return ok(event, { ...existing, ...attrs });
}

async function removeCategory(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest(event, 'Missing category slug');

  await deleteItem(`USER#${userId}`, `CAT#${slug}`);
  return ok(event, { deleted: true });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasSlug = !!event.pathParameters?.slug;

    if (method === 'POST') return createCategory(event, auth.userId);
    if (method === 'GET') return listCategories(event, auth.userId);
    if (method === 'PUT' && hasSlug) return updateCategory(event, auth.userId);
    if (method === 'DELETE' && hasSlug) return removeCategory(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
