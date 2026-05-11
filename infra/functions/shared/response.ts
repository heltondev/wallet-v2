import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean);

function getCorsOrigin(event: APIGatewayProxyEvent): string {
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin ?? '';
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0] ?? '';
}

function headers(event: APIGatewayProxyEvent): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': '*',
    'Vary': 'Origin',
  };
}

export function ok(event: APIGatewayProxyEvent, data: unknown): APIGatewayProxyResult {
  return { statusCode: 200, headers: headers(event), body: JSON.stringify(data) };
}

export function created(event: APIGatewayProxyEvent, data: unknown): APIGatewayProxyResult {
  return { statusCode: 201, headers: headers(event), body: JSON.stringify(data) };
}

export function badRequest(event: APIGatewayProxyEvent, message: string): APIGatewayProxyResult {
  return { statusCode: 400, headers: headers(event), body: JSON.stringify({ error: message }) };
}

export function forbidden(event: APIGatewayProxyEvent, message: string): APIGatewayProxyResult {
  return { statusCode: 403, headers: headers(event), body: JSON.stringify({ error: message }) };
}

export function notFound(event: APIGatewayProxyEvent, message: string): APIGatewayProxyResult {
  return { statusCode: 404, headers: headers(event), body: JSON.stringify({ error: message }) };
}

export function serverError(event: APIGatewayProxyEvent, message: string): APIGatewayProxyResult {
  return { statusCode: 500, headers: headers(event), body: JSON.stringify({ error: message }) };
}

export function tooManyRequests(event: APIGatewayProxyEvent, message: string): APIGatewayProxyResult {
  return { statusCode: 429, headers: headers(event), body: JSON.stringify({ error: message }) };
}
