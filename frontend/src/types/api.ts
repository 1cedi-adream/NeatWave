export type ApiResponse<T> = { data: T };

export type PaginatedResponse<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type ApiErrorResponse = {
  error: { code: string; message: string; details?: unknown };
};
