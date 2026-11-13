import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

export const mockDataEnabled = import.meta.env.VITE_USE_MOCK_DATA !== "false";
