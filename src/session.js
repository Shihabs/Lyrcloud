// The signed-in user, derived from the Cognito ID token kept by src/auth.js.
import { decodeJwt, getTokens, logout } from './auth.js';

export function getSession() {
  const tokens = getTokens();
  if (!tokens) return null;
  const claims = decodeJwt(tokens.idToken ?? '') || {};
  return {
    email: claims.email || claims['cognito:username'] || 'account',
    name: claims.name || '',
    picture: claims.picture || '',
  };
}

export const endSession = logout;
