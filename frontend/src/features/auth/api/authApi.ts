import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { AuthSession, CurrentUser } from "../types/user";

export async function login(identifier: string, password: string) {
  const response = await apiClient.post<ApiResponse<AuthSession>>(
    "/auth/login",
    { identifier, password },
  );
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiResponse<CurrentUser>>("/auth/me");
  return response.data.data;
}

export async function updateCurrentUser(changes: {
  name?: string;
  email?: string;
}) {
  const response = await apiClient.patch<ApiResponse<CurrentUser>>(
    "/auth/me",
    changes,
  );
  return response.data.data;
}

export async function requestPasswordReset(identifier: string) {
  await apiClient.post("/auth/forgot-password", { identifier });
}

export async function resetPassword(input: {
  token: string;
  password: string;
}) {
  await apiClient.post("/auth/reset-password", input);
}

export async function acceptInvitation(input: {
  token: string;
  fullName: string;
  phone?: string;
  password: string;
}) {
  const response = await apiClient.post<
    ApiResponse<{ accessToken: string; refreshToken: string }>
  >("/auth/accept-invite", input);
  return response.data.data;
}

export async function logout(refreshToken: string) {
  await apiClient.post("/auth/logout", { refreshToken });
}
