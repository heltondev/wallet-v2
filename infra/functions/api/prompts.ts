import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuth } from '../shared/auth';
import { getItem, putItem, queryItems } from '../shared/dynamo';
import { ok, badRequest, forbidden, notFound, serverError } from '../shared/response';

const ADMIN_EMAIL = 'holiver.usa@gmail.com';

async function listPrompts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const items = await queryItems('GLOBAL', 'PROMPT#');
  return ok(event, items);
}

async function getPrompt(event: APIGatewayProxyEvent, feature: string): Promise<APIGatewayProxyResult> {
  const item = await getItem('GLOBAL', `PROMPT#${feature}`);
  if (!item) return notFound(event, `Prompt not found: ${feature}`);
  return ok(event, item);
}

async function updatePrompt(event: APIGatewayProxyEvent, feature: string, email: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { content } = body;
  if (!content) return badRequest(event, 'Missing required field: content');

  const item = {
    PK: 'GLOBAL',
    SK: `PROMPT#${feature}`,
    content,
    updatedAt: new Date().toISOString(),
    updatedBy: email,
  };

  await putItem(item);
  return ok(event, item);
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return badRequest(event, 'Authentication required');

    if (auth.email !== ADMIN_EMAIL) return forbidden(event, 'Admin access required');

    const feature = event.pathParameters?.feature;

    if (event.httpMethod === 'GET' && !feature) return listPrompts(event);
    if (event.httpMethod === 'GET' && feature) return getPrompt(event, feature);
    if (event.httpMethod === 'PUT' && feature) return updatePrompt(event, feature, auth.email);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
