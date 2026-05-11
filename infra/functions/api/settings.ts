import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { getItem, putItem } from '../shared/dynamo';
import { ok, badRequest, serverError } from '../shared/response';

const DEFAULTS = {
  theme: 'dark',
  currency: 'BRL',
  monthlyBudget: 9500,
};

async function getSettings(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const item = await getItem(`USER#${userId}`, 'SETTINGS');
  return ok(event, item ?? { ...DEFAULTS, PK: `USER#${userId}`, SK: 'SETTINGS' });
}

async function updateSettings(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { theme, currency, monthlyBudget } = body;

  const existing = await getItem(`USER#${userId}`, 'SETTINGS') ?? { ...DEFAULTS };

  const updated = {
    PK: `USER#${userId}`,
    SK: 'SETTINGS',
    theme: theme ?? existing.theme ?? DEFAULTS.theme,
    currency: currency ?? existing.currency ?? DEFAULTS.currency,
    monthlyBudget: monthlyBudget ?? existing.monthlyBudget ?? DEFAULTS.monthlyBudget,
    updatedAt: new Date().toISOString(),
  };

  await putItem(updated);
  return ok(event, updated);
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return badRequest(event, 'Authentication required');

    if (event.httpMethod === 'GET') return getSettings(event, auth.userId);
    if (event.httpMethod === 'PUT') return updateSettings(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
