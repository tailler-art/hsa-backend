import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, Perfil } from '../types';

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token de autenticação não fornecido' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

export function autorizar(...perfis: Perfil[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ erro: 'Não autenticado' });
      return;
    }
    if (!perfis.includes(req.usuario.perfil)) {
      res.status(403).json({ erro: 'Acesso negado para este perfil' });
      return;
    }
    next();
  };
}
