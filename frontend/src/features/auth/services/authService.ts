import { apiClient, mockDataEnabled } from "../../../services/apiClient";
import type { User } from "../types/user";

export async function signIn(
  identifier: string,
  password: string,
): Promise<User> {
  if (mockDataEnabled) {
    if (!identifier.trim() || !password)
      throw new Error("Enter your email or phone number and password.");
    return {
      id: "staff-jamie-lee",
      name: "Jamie Lee",
      email: identifier.includes("@") ? identifier : "jamie@freshandfold.com",
      role: "Manager",
      active: true,
    };
  }
  const { data } = await apiClient.post<User>("/auth/login", {
    identifier,
    password,
  });
  return data;
}

export async function requestPasswordReset(identifier: string) {
  if (mockDataEnabled) return;
  await apiClient.post("/auth/forgot-password", { identifier });
}
