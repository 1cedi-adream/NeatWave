import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { StaffMember } from "../types/staffMember";

export async function getStaff() {
  const response = await apiClient.get<ApiResponse<StaffMember[]>>("/staff");
  return response.data.data;
}

export async function inviteStaff(input: {
  email: string;
  role: "manager" | "staff";
}) {
  await apiClient.post("/staff/invite", input);
}

export async function updateStaff({
  membershipId,
  ...changes
}: {
  membershipId: string;
  role?: "manager" | "staff";
  active?: boolean;
}) {
  const response = await apiClient.patch<ApiResponse<StaffMember>>(
    `/staff/${membershipId}`,
    changes,
  );
  return response.data.data;
}
