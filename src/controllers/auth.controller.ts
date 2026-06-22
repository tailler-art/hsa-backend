import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import type { Usuario, JwtPayload } from '../types';

function gerarTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, senha } = req.body as { email: string; senha: string };

    if (!email || !senha) throw new AppError('Email e senha são obrigatórios');

    const usuario = await queryOne<Usuario>(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE',
      [email.toLowerCase()]
    );

    if (!usuario) throw new AppError('Credenciais inválidas', 401);

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash!);
    if (!senhaValida) throw new AppError('Credenciais inválidas', 401);

    const payload: JwtPayload = {
      id: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      departamento: usuario.departamento,
    };

    const { accessToken, refreshToken } = gerarTokens(payload);

    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7);

    await query(
      'INSERT INTO refresh_tokens (usuario_id, token, expira_em) VALUES ($1, $2, $3)',
      [usuario.id, refreshToken, expiraEm]
    );

    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        departamento: usuario.departamento,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    if (!token) throw new AppError('Refresh token não fornecido');

    const registro = await queryOne<{ usuario_id: string; expira_em: Date }>(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [token]
    );

    if (!registro || new Date(registro.expira_em) < new Date()) {
      throw new AppError('Refresh token inválido ou expirado', 401);
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const { accessToken, refreshToken: novoRefresh } = gerarTokens(payload);

    await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7);
    await query(
      'INSERT INTO refresh_tokens (usuario_id, token, expira_em) VALUES ($1, $2, $3)',
      [registro.usuario_id, novoRefresh, expiraEm]
    );

    res.json({ accessToken, refreshToken: novoRefresh });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    if (token) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    }
    res.json({ mensagem: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function perfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = (req as Request & { usuario: JwtPayload }).usuario;
    const usuario = await queryOne<Omit<Usuario, 'senha_hash'>>(
      'SELECT id, nome, email, perfil, departamento, ativo, criado_em FROM usuarios WHERE id = $1',
      [id]
    );
    if (!usuario) throw new AppError('Usuário não encontrado', 404);
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}
