export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export const unavailable = (service: string) =>
  new AppError(
    503,
    "SERVICE_UNAVAILABLE",
    `${service} is not available yet. Your saved work is safe. Please try again later.`,
  );
