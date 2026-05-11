import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { putItem } from '../shared/dynamo';

const cognito = new CognitoIdentityProviderClient({});

interface PostConfirmationEvent {
  userPoolId: string;
  userName: string;
  request: {
    userAttributes: {
      email: string;
      'custom:role'?: string;
      [key: string]: string | undefined;
    };
  };
  [key: string]: unknown;
}

export async function handler(event: PostConfirmationEvent): Promise<PostConfirmationEvent> {
  const userId = event.userName;
  const email = event.request.userAttributes.email;
  const role = event.request.userAttributes['custom:role'] ?? 'member';
  const groupName = role === 'owner' ? 'wallet_owner' : 'wallet_member';

  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: event.userPoolId,
    Username: userId,
    GroupName: groupName,
  }));

  const now = new Date().toISOString();

  await Promise.all([
    putItem({
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      email,
      role,
      createdAt: now,
    }),
    putItem({
      PK: `USER#${userId}`,
      SK: 'SETTINGS',
      currency: 'BRL',
      theme: 'dark',
      monthlyBudget: 9500,
    }),
  ]);

  return event;
}
