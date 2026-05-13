import { Amplify } from 'aws-amplify';
import {
  signInWithRedirect,
  signIn,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getCurrentUser,
  signOut,
} from 'aws-amplify/auth';

export const configureCognito = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: 'us-east-1_HX9MWWCOm',
        userPoolClientId: '1ce5fr1gi00pbt5reeheeg1mnu',
        loginWith: {
          oauth: {
            domain: 'wallet-prod-auth.auth.us-east-1.amazoncognito.com',
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: ['wallet://auth/callback'],
            redirectSignOut: ['wallet://'],
            responseType: 'code',
          },
        },
      },
    },
  });
};

export const cognitoService = {
  signInWithGoogle: async () => {
    await signInWithRedirect({ provider: 'Google' });
  },

  signInWithEmail: async (email: string, password: string) => {
    const result = await signIn({
      username: email,
      password,
      options: { authFlowType: 'USER_SRP_AUTH' },
    });
    if (result.isSignedIn) {
      await cognitoService.syncSession();
    }
    return result;
  },

  forgotPassword: async (email: string) => {
    return await resetPassword({ username: email });
  },

  confirmForgotPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    return await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  },

  syncSession: async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();

      if (user && session.tokens?.idToken) {
        const payload = session.tokens.idToken.payload;
        const email = payload['email'] as string;
        const name =
          (payload['name'] as string) ||
          (payload['given_name'] as string) ||
          (email ? email.split('@')[0] : '');

        return { userId: user.userId, email, name };
      }
      return null;
    } catch {
      return null;
    }
  },

  getSession: async () => {
    try {
      return await fetchAuthSession();
    } catch {
      return null;
    }
  },

  signOut: async () => {
    await signOut();
  },
};
