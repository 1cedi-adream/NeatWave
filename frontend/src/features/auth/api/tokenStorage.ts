let accessToken: string | null = null;
const localKey = "neatwave-refresh-token";
const sessionKey = "neatwave-session-refresh-token";
export function getAccessToken() {
  return accessToken;
}
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("neatwave:access-token-changed"));
}
export function getRefreshToken() {
  return sessionStorage.getItem(sessionKey) ?? localStorage.getItem(localKey);
}
export function storeRefreshToken(token: string, remember: boolean) {
  clearRefreshToken();
  (remember ? localStorage : sessionStorage).setItem(
    remember ? localKey : sessionKey,
    token,
  );
}
export function replaceRefreshToken(token: string) {
  storeRefreshToken(token, localStorage.getItem(localKey) !== null);
}
export function clearRefreshToken() {
  localStorage.removeItem(localKey);
  sessionStorage.removeItem(sessionKey);
}
export function clearTokens() {
  setAccessToken(null);
  clearRefreshToken();
}
