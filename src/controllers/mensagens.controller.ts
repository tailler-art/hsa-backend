import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function enviarMensagem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: chamado_id } = req.params;
    const { conteudo, interna = false } = req.body as { conteudo: string; interna?: boolean };

    if (!conteudo?.trim()) throw new AppError('Conteúdo da mensagem não pode ser vazio');

    const podeInterna = ['atendente', 'gestor', 'administrador'].includes(req.usuario!.perfil);
    if (interna && !podeInterna) throw new AppError('Apenas atendentes podem enviar mensagens internas', 403);

    const mensagem = await queryOne(
      `INSERT INTO mensagens (chamado_id, autor_id, conteudo, interna)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [chamado_id, req.usuario!.id, conteudo.trim(), interna]
    );

    const mensagemCompleta = await queryOne(
      `SELECT m.*, u.nome AS autor_nome, u.perfil AS autor_perfil
       FROM mensagens m JOIN usuarios u ON u.id = m.autor_id
       WHERE m.id = $1`,
      [(mensagem as { id: string }).id]
    );

    req.app.get('io')?.to(`chamado:${chamado_id}`).emit('nova_mensagem', mensagemCompleta);

    res.status(201).json(mensagemCompleta);
  } catch (err) { next(err); }
}

export async function listarMensagens(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: chamado_id } = req.params;
    const podeVerInternas = ['atendente', 'gestor', 'administrador'].includes(req.usuario!.perfil);

    const mensagens = await query(
      `SELECT m.*, u.nome AS autor_nome, u.perfil AS autor_perfil
       FROM mensagens m JOIN usuarios u ON u.id = m.autor_id
       WHERE m.chamado_id = $1
         AND ($2 = TRUE OR m.interna = FALSE)
       ORDER BY m.criado_em ASC`,
      [chamado_id, podeVerInternas]
    );

    res.json(mensagens);
  } catch (err) { next(err); }
}
