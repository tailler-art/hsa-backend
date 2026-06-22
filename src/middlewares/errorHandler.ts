import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ erro: err.message });
    return;
  }
  logger.error('Erro não tratado:', err);
  res.status(500).json({
    erro: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
}
