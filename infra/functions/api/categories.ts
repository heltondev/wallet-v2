import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { putItem, queryItems, getItem, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, forbidden, notFound, serverError } from '../shared/response';
import { resolveWorkspaceAccess } from '../shared/workspace-access';

async function createCategory(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { slug, label, color, icon } = body;

  if (!slug || !label || !color || !icon) {
    return badRequest(event, 'Missing required fields: slug, label, color, icon');
  }

  const item: Record<string, unknown> = {
    PK: `USER#${userId}`,
    SK: `CAT#${slug}`,
    slug,
    label,
    labelEn: body.labelEn ?? label,
    color,
    icon,
    createdAt: new Date().toISOString(),
  };
  if (body.hidden !== undefined) item.hidden = body.hidden;

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

  const body = JSON.parse(event.body ?? '{}');
  const now = new Date().toISOString();

  // Upsert — create if not exists, update if exists
  const item: Record<string, unknown> = {
    PK: `USER#${userId}`,
    SK: `CAT#${slug}`,
    slug,
    label: body.label,
    labelEn: body.labelEn,
    color: body.color,
    icon: body.icon,
    updatedAt: now,
  };
  if (body.hidden !== undefined) item.hidden = body.hidden;

  await putItem(item);
  return ok(event, item);
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

    if (method === 'POST') return createCategory(event, targetUserId);
    if (method === 'GET') return listCategories(event, targetUserId);
    if (method === 'PUT' && hasSlug) return updateCategory(event, targetUserId);
    if (method === 'DELETE' && hasSlug) return removeCategory(event, targetUserId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
