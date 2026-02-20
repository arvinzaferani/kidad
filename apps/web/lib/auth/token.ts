const TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const tokenCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_KEY}=`));
  return tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null;
}

export function setAuthToken(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 14}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
