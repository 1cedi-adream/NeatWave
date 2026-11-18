import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  replaceRefreshToken,
  setAccessToken,
} from "@/features/auth/api/tokenStorage";
import type { ApiResponse } from "@/types/api";

type RetryRequest = InternalAxiosRequestConfig & { _retried?: boolean };
let refreshPromise: Promise<string> | null = null;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const response = await axios.post<
    ApiResponse<{ accessToken: string; refreshToken: string }>
  >(`${apiClient.defaults.baseURL}/auth/refresh`, { refreshToken });

  if (getRefreshToken() !== refreshToken)
    throw new Error("The session changed while refreshing its access token");

  setAccessToken(response.data.data.accessToken);
  replaceRefreshToken(response.data.data.refreshToken);

  return response.data.data.accessToken;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(undefined, async (error) => {
  const request = error.config as RetryRequest | undefined;

  const isSessionEndpoint =
    request?.url?.endsWith("/auth/login") ||
    request?.url?.endsWith("/auth/refresh") ||
    request?.url?.endsWith("/auth/logout");

  if (
    error.response?.status !== 401 ||
    !request ||
    request._retried ||
    isSessionEndpoint
  )
    return Promise.reject(error);

  request._retried = true;
  const refreshTokenBeforeRequest = getRefreshToken();

  try {
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const refreshedAccessToken = await refreshPromise;
    if (getRefreshToken() !== refreshTokenBeforeRequest)
      throw new Error("The session changed while retrying the request");
    request.headers.Authorization = `Bearer ${refreshedAccessToken}`;

    return apiClient(request);
  } catch (refreshError) {
    if (getRefreshToken() === refreshTokenBeforeRequest) {
      clearTokens();
      window.dispatchEvent(new Event("neatwave:session-expired"));
    }
    return Promise.reject(refreshError);
  }
});

export async function restoreAccessToken() {
  const refreshTokenBeforeRestore = getRefreshToken();
  if (!refreshTokenBeforeRestore) return false;

  try {
    await refreshAccessToken();
    return true;
  } catch {
    if (getRefreshToken() === refreshTokenBeforeRestore) clearTokens();
    return false;
  }
}
