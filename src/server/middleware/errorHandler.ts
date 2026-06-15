import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // 记录错误日志
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode,
    operational: isOperational,
  }, "Error occurred");

  // 生产环境不返回详细错误信息
  const message = process.env.NODE_ENV === "production" && !isOperational
    ? "Internal server error"
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Route ${req.method} ${req.url} not found`,
  });
}