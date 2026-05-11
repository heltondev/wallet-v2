import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extractAuth } from '../shared/auth';
import { queryItems } from '../shared/dynamo';
import { ok, badRequest, notFound, serverError } from '../shared/response';

const s3 = new S3Client({});
const BUCKET = process.env.RECEIPTS_BUCKET!;

async function generateUploadUrl(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const { txId, fileName, contentType } = body;

  if (!txId || !fileName || !contentType) {
    return badRequest(event, 'Missing required fields: txId, fileName, contentType');
  }

  const key = `${userId}/${txId}/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
  return ok(event, { uploadUrl, key });
}

async function getReceiptDownloadUrl(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  const txId = event.pathParameters?.txId;
  if (!txId) return badRequest(event, 'Missing txId');

  // Find the transaction by scanning TX# items for this user
  const items = await queryItems(`USER#${userId}`, 'TX#');
  const tx = items.find(item => item.id === txId);
  if (!tx) return notFound(event, 'Transaction not found');

  const receiptKey = tx.receiptKey as string | undefined;
  const receiptName = tx.receiptName as string | undefined;
  if (!receiptKey) return notFound(event, 'No receipt attached');

  const contentType = receiptName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: receiptKey,
  });

  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return ok(event, { downloadUrl, fileName: receiptName ?? 'receipt', contentType });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');

    const method = event.httpMethod;
    const path = event.resource;

    if (method === 'POST' && path === '/receipts/upload-url') return generateUploadUrl(event, auth.userId);
    if (method === 'GET' && path === '/receipts/{txId}') return getReceiptDownloadUrl(event, auth.userId);

    return badRequest(event, 'Unsupported method');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
