import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (resource: string) => new ApiError(404, `${resource} not found`);
export const badRequest = (message: string) => new ApiError(400, message);

// Wraps an async route handler so thrown/rejected errors reach the error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

// --- Input helpers ---

export const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
};

export const optionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  return value.trim();
};

export const optionalQuantity = (value: unknown, field = "quantity"): number | undefined => {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw badRequest(`${field} must be a whole number of 0 or more`);
  }
  return n;
};

// Map Prisma's known request errors onto HTTP statuses instead of a blanket 500.
const prismaStatus = (err: Prisma.PrismaClientKnownRequestError) => {
  switch (err.code) {
    case "P2025":
      return { status: 404, message: "Record not found" };
    case "P2002":
      return { status: 409, message: "That value is already in use" };
    case "P2003":
      return { status: 409, message: "A related record is missing or still in use" };
    default:
      return null;
  }
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = prismaStatus(err);
    if (mapped) {
      res.status(mapped.status).json({ error: mapped.message });
      return;
    }
  }

  const status = err instanceof ApiError ? err.status : 500;
  const message =
    err instanceof ApiError
      ? err.message
      : "Something went wrong on the server";

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
};
