export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (resource: string) =>
  new AppError(404, "NOT_FOUND", `${resource} not found.`);
