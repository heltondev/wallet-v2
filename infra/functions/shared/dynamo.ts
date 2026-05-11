import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export async function getItem(pk: string, sk: string): Promise<Record<string, unknown> | undefined> {
  const { Item } = await doc.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
  return Item;
}

export async function putItem(item: Record<string, unknown>): Promise<void> {
  await doc.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
}

export async function queryItems(
  pk: string,
  skPrefix?: string,
  indexName?: string,
  options?: { limit?: number; scanForward?: boolean },
): Promise<Record<string, unknown>[]> {
  const params: Record<string, unknown> = {
    TableName: TABLE_NAME,
    KeyConditionExpression: skPrefix
      ? 'PK = :pk AND begins_with(SK, :sk)'
      : 'PK = :pk',
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pk, ':sk': skPrefix }
      : { ':pk': pk },
  };
  if (indexName) params.IndexName = indexName;
  if (options?.limit) params.Limit = options.limit;
  if (options?.scanForward !== undefined) params.ScanIndexForward = options.scanForward;

  const { Items } = await doc.send(new QueryCommand(params as any));
  return Items ?? [];
}

export async function queryByGSI1(
  gsi1pk: string,
  gsi1skPrefix?: string,
): Promise<Record<string, unknown>[]> {
  const { Items } = await doc.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: gsi1skPrefix
      ? 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)'
      : 'GSI1PK = :pk',
    ExpressionAttributeValues: gsi1skPrefix
      ? { ':pk': gsi1pk, ':sk': gsi1skPrefix }
      : { ':pk': gsi1pk },
  }));
  return Items ?? [];
}

export async function updateItem(
  pk: string,
  sk: string,
  attrs: Record<string, unknown>,
): Promise<void> {
  const keys = Object.keys(attrs);
  if (keys.length === 0) return;

  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const setClauses: string[] = [];

  for (const key of keys) {
    const safe = `#${key}`;
    names[safe] = key;
    values[`:${key}`] = attrs[key];
    setClauses.push(`${safe} = :${key}`);
  }

  await doc.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

export async function deleteItem(pk: string, sk: string): Promise<void> {
  await doc.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
}
