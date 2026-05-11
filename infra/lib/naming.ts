export type ResourceType =
  | 'db'
  | 'api'
  | 'fn'
  | 'bucket'
  | 'role'
  | 'cdn'
  | 'userpool'
  | 'appclient'
  | 'rule'
  | 'alarm'
  | 'secret';

const PROJECT = 'wallet';

export function name(env: string, type: ResourceType, resourceName: string): string {
  return `${PROJECT}-${env}-${type}-${resourceName}`;
}

export function bucketName(env: string, resourceName: string, accountId: string): string {
  return `${PROJECT}-${env}-bucket-${resourceName}-${accountId}`;
}
