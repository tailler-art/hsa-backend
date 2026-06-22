import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';
import type { Usuario } from '../types';

export async function listar(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuarios = await query<Omit<Usuario, 'senha_hash'>>(
      'SELECT id, nome, email, perfil, departamento, ativo, criado_em FROM usuarios ORDER BY nome'
    );
    res.json(usuarios);
  } catch (err) { next(err); }
}

export async function criar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { nome, email, senha, perfil, departamento } = req.body as Partial<Usuario & { senha: string }>;

    if (!nome || !email || !senha || !perfil || !departamento) {
      throw new AppError('Todos os campos são obrigatórios');
    }

    const existente = await queryOne('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existente) throw new AppError('Email já cadastrado');

    const senha_hash = await bcrypt.hash(senha, 12);

    const usuario = await queryOne<Omit<Usuario, 'senha_hash'>>(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento)
       VALUES ($1, $2, $3, $4::perfil_enum, $5::departamento_enum)
       RETURNING id, nome, email, perfil, departamento, ativo, criado_em`,
      [nome, email.toLowerCase(), senha_hash, perfil, departamento]
    );

    res.status(201).json(usuario);
  } catch (err) { next(err); }
}

export async function alterarSenha(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { senhaAtual, novaSenha } = req.body as { senhaAtual: string; novaSenha: string };

    const usuario = await queryOne<Usuario>(
      'SELECT * FROM usuarios WHERE id = $1', [req.usuario!.id]
    );
    if (!usuario) throw new AppError('Usuário não encontrado', 404);

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash!);
    if (!senhaValida) throw new AppError('Senha atual incorreta', 401);

    if (novaSenha.length < 8) throw new AppError('Nova senha deve ter pelo menos 8 caracteres');

    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
    await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaSenhaHash, req.usuario!.id]);

    res.json({ mensagem: 'Senha alterada com sucesso' });
  } catch (err) { next(err); }
}

export async function toggleAtivo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (id === req.usuario!.id) throw new AppError('Não é possível desativar a própria conta');

    const usuario = await queryOne<Omit<Usuario, 'senha_hash'>>(
      `UPDATE usuarios SET ativo = NOT ativo
       WHERE id = $1 RETURNING id, nome, email, perfil, departamento, ativo`,
      [id]
    );
    if (!usuario) throw new AppError('Usuário não encontrado', 404);

    res.json(usuario);
  } catch (err) { next(err); }
}
