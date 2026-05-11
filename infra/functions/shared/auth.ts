import type { APIGatewayProxyEvent } from 'aws-lambda';

export interface AuthContext {
  userId: string;
  email: string;
  groups: string[];
}

export function extractAuth(event: APIGatewayProxyEvent): AuthContext | null {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) return null;

  const userId = claims.sub as string;
  const email = claims.email as string;
  if (!userId || !email) return null;

  const rawGroups = (claims['cognito:groups'] ?? '') as string;
  const groups = rawGroups
    .split(/[\s,]+/)
    .map((g: string) => g.trim())
    .filter(Boolean);

  return { userId, email, groups };
}

export function isOwner(auth: AuthContext): boolean {
  return auth.groups.includes('wallet_owner');
}

export function isMember(auth: AuthContext): boolean {
  return auth.groups.includes('wallet_member');
}

export function isViewer(auth: AuthContext): boolean {
  return auth.groups.includes('wallet_viewer');
}
