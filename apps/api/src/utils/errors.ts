import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (resource: string) => new ApiError(404, `${resource} not found`);

// Wraps an async route handler so thrown/rejected errors reach the error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err instanceof ApiError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal server error";

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
};
