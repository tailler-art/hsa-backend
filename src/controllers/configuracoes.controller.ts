import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';

interface Configuracao {
  chave: string;
  valor: unknown;
  descricao: string | null;
  atualizado_em: Date;
}

export async function listar(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await query<Configuracao>(
      'SELECT chave, valor, descricao, atualizado_em FROM configuracoes ORDER BY chave'
    );
    const obj: Record<string, unknown> = {};
    rows.forEach((r) => { obj[r.chave] = r.valor; });
    res.json(obj);
  } catch (err) { next(err); }
}

export async function atualizar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chave } = req.params;
    const { valor } = req.body as { valor: unknown };

    if (valor === undefined || valor === null) throw new AppError('Campo valor é obrigatório');

    const existe = await queryOne<{ chave: string }>(
      'SELECT chave FROM configuracoes WHERE chave = $1', [chave]
    );
    if (!existe) throw new AppError('Configuração não encontrada', 404);

    // Validações específicas
    if (['sla_critica', 'sla_alta', 'sla_media', 'sla_baixa'].includes(chave)) {
      const minutos = Number(valor);
      if (isNaN(minutos) || minutos < 1) throw new AppError('SLA deve ser um número maior que zero');
    }
    if (['departamentos', 'categorias'].includes(chave)) {
      if (!Array.isArray(valor) || valor.length === 0) throw new AppError('Deve ser uma lista com ao menos um item');
      if (valor.some((v) => typeof v !== 'string' || !v.trim())) throw new AppError('Todos os itens devem ser textos não vazios');
    }

    const atualizado = await queryOne<Configuracao>(
      `UPDATE configuracoes SET valor = $2::jsonb, atualizado_em = NOW()
       WHERE chave = $1 RETURNING chave, valor, atualizado_em`,
      [chave, JSON.stringify(valor)]
    );

    res.json(atualizado);
  } catch (err) { next(err); }
}
