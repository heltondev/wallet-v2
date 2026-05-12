import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { getItem, putItem, queryItems, queryByGSI1, updateItem, deleteItem } from '../shared/dynamo';
import { ok, created, badRequest, forbidden, notFound, serverError } from '../shared/response';

async function findUserByEmail(email: string): Promise<Record<string, unknown> | null> {
  const results = await queryByGSI1(`EMAIL#${email.toLowerCase()}`);
  const profile = results.find(r => r.SK === 'PROFILE');
  return profile ?? null;
}

async function shareWorkspace(event: APIGatewayProxyEvent, userId: string, email: string): Promise<APIGatewayProxyResult> {
  const workspaceId = event.pathParameters?.id;
  if (!workspaceId) return badRequest(event, 'Missing workspace id');

  const body = JSON.parse(event.body ?? '{}');
  const { email: targetEmail, role } = body;

  if (!targetEmail || !role) return badRequest(event, 'Missing required fields: email, role');
  if (!['editor', 'viewer'].includes(role)) return badRequest(event, 'Role must be "editor" or "viewer"');

  // Verify caller owns the workspace
  const workspace = await getItem(`USER#${userId}`, `WORKSPACE#${workspaceId}`);
  if (!workspace) return notFound(event, 'Espaço não encontrado');

  // Find target user
  const targetUser = await findUserByEmail(targetEmail);
  if (!targetUser) return notFound(event, 'Usuário não encontrado. O usuário precisa ter uma conta primeiro.');

  const targetUserId = (targetUser.PK as string).replace('USER#', '');
  if (targetUserId === userId) return badRequest(event, 'Você não pode compartilhar com você mesmo');

  // Check if already shared
  const existingSK = `SHARE#${workspaceId}#${targetUserId}`;
  const existing = await getItem(`USER#${userId}`, existingSK);
  if (existing) return badRequest(event, 'Espaço já compartilhado com este usuário');

  const now = new Date().toISOString();
  const item: Record<string, unknown> = {
    PK: `USER#${userId}`,
    SK: existingSK,
    workspaceId,
    sharedUserId: targetUserId,
    sharedEmail: targetEmail.toLowerCase(),
    role,
    ownerId: userId,
    ownerEmail: email,
    GSI1PK: `SHARED_USER#${targetUserId}`,
    GSI1SK: `WORKSPACE#${userId}#${workspaceId}`,
    createdAt: now,
  };

  await putItem(item);
  return created(event, {
    workspaceId,
    sharedUserId: targetUserId,
    sharedEmail: targetEmail.toLowerCase(),
    role,
    createdAt: now,
  });
}

async function listShares(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const workspaceId = event.pathParameters?.id;
  if (!workspaceId) return badRequest(event, 'Missing workspace id');

  // Verify caller owns the workspace
  const workspace = await getItem(`USER#${userId}`, `WORKSPACE#${workspaceId}`);
  if (!workspace) return notFound(event, 'Espaço não encontrado');

  const items = await queryItems(`USER#${userId}`, `SHARE#${workspaceId}#`);
  const shares = items.map(s => ({
    workspaceId: s.workspaceId,
    sharedUserId: s.sharedUserId,
    sharedEmail: s.sharedEmail,
    role: s.role,
    createdAt: s.createdAt,
  }));

  return ok(event, shares);
}

async function updateShare(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const workspaceId = event.pathParameters?.id;
  const targetUserId = event.pathParameters?.userId;
  if (!workspaceId || !targetUserId) return badRequest(event, 'Missing workspace id or user id');

  // Verify caller owns the workspace
  const workspace = await getItem(`USER#${userId}`, `WORKSPACE#${workspaceId}`);
  if (!workspace) return notFound(event, 'Espaço não encontrado');

  const sk = `SHARE#${workspaceId}#${targetUserId}`;
  const existing = await getItem(`USER#${userId}`, sk);
  if (!existing) return notFound(event, 'Compartilhamento não encontrado');

  const body = JSON.parse(event.body ?? '{}');
  const { role } = body;
  if (!role || !['editor', 'viewer'].includes(role)) return badRequest(event, 'Role must be "editor" or "viewer"');

  await updateItem(`USER#${userId}`, sk, { role });
  return ok(event, { ...existing, role });
}

async function removeShare(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const workspaceId = event.pathParameters?.id;
  const targetUserId = event.pathParameters?.userId;
  if (!workspaceId || !targetUserId) return badRequest(event, 'Missing workspace id or user id');

  // Allow owner to revoke OR shared user to leave
  const isOwner = !!(await getItem(`USER#${userId}`, `WORKSPACE#${workspaceId}`));

  let sk: string;
  let pk: string;

  if (isOwner) {
    pk = `USER#${userId}`;
    sk = `SHARE#${workspaceId}#${targetUserId}`;
  } else if (targetUserId === userId) {
    // User leaving a shared workspace — need to find the owner
    const shares = await queryByGSI1(`SHARED_USER#${userId}`, `WORKSPACE#`);
    const match = shares.find(s => s.workspaceId === workspaceId);
    if (!match) return notFound(event, 'Compartilhamento não encontrado');
    pk = match.PK as string;
    sk = match.SK as string;
  } else {
    return forbidden(event, 'Acesso negado');
  }

  await deleteItem(pk, sk);
  return ok(event, { deleted: true });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const hasUserId = !!event.pathParameters?.userId;

    if (method === 'POST') return shareWorkspace(event, auth.userId, auth.email);
    if (method === 'GET') return listShares(event, auth.userId);
    if (method === 'PUT' && hasUserId) return updateShare(event, auth.userId);
    if (method === 'DELETE' && hasUserId) return removeShare(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
