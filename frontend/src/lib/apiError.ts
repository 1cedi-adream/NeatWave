import axios from "axios";
import type { ApiErrorResponse } from "@/types/api";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (axios.isAxiosError<ApiErrorResponse>(error))
    return error.response?.data?.error?.message ?? fallback;

  return error instanceof Error ? error.message : fallback;
}
