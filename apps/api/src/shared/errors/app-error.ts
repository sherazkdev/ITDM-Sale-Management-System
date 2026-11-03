export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details: unknown;
  readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    options?: { details?: unknown; isOperational?: boolean; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = options?.details ?? null;
    this.isOperational = options?.isOperational ?? true;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
