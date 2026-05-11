import { CognitoUserPool, CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';

const USER_POOL_ID = 'us-east-1_HX9MWWCOm';
const CLIENT_ID = '1ce5fr1gi00pbt5reeheeg1mnu';
const COGNITO_DOMAIN = 'wallet-prod-auth.auth.us-east-1.amazoncognito.com';

const REDIRECT_URI = window.location.origin + '/auth/callback';

const userPool = new CognitoUserPool({ UserPoolId: USER_POOL_ID, ClientId: CLIENT_ID });

export function getCurrentUser(): CognitoUser | null {
  return userPool.getCurrentUser();
}

export function getSession(): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = getCurrentUser();
    if (!user) return reject(new Error('No user'));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) return reject(err || new Error('No session'));
      resolve(session);
    });
  });
}

export function getIdToken(): Promise<string> {
  return getSession().then(s => s.getIdToken().getJwtToken());
}

export function signInWithGoogle(): void {
  const url = `https://${COGNITO_DOMAIN}/oauth2/authorize?` +
    `identity_provider=Google` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&scope=openid+email+profile`;
  window.location.href = url;
}

export async function handleAuthCallback(code: string): Promise<CognitoUserSession> {
  const res = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const tokens = await res.json();

  // Store tokens in CognitoUserPool's internal storage so getSession() works
  const idToken = new (await import('amazon-cognito-identity-js')).CognitoIdToken({ IdToken: tokens.id_token });
  const accessToken = new (await import('amazon-cognito-identity-js')).CognitoAccessToken({ AccessToken: tokens.access_token });
  const refreshToken = new (await import('amazon-cognito-identity-js')).CognitoRefreshToken({ RefreshToken: tokens.refresh_token });

  const session = new CognitoUserSession({ IdToken: idToken, AccessToken: accessToken, RefreshToken: refreshToken });

  // Extract username from id token
  const payload = idToken.decodePayload();
  const username = payload['cognito:username'] || payload['sub'];

  const user = new CognitoUser({ Username: username, Pool: userPool });
  user.setSignInUserSession(session);

  return session;
}

export function signOut(): void {
  const user = getCurrentUser();
  if (user) user.signOut();
}

export function isAuthenticated(): Promise<boolean> {
  return getSession().then(() => true).catch(() => false);
}
