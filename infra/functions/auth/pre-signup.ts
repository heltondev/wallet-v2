import { getItem } from '../shared/dynamo';

interface PreSignUpEvent {
  request: {
    userAttributes: {
      email: string;
      [key: string]: string;
    };
  };
  response: {
    autoConfirmUser: boolean;
    autoVerifyEmail: boolean;
  };
  [key: string]: unknown;
}

export async function handler(event: PreSignUpEvent): Promise<PreSignUpEvent> {
  const email = event.request.userAttributes.email?.toLowerCase();
  if (!email) throw new Error('Email is required');

  const invite = await getItem(`INVITE#${email}`, 'GRANT');
  if (!invite) throw new Error('User is not invited');

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
}
