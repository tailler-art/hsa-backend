import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth.middleware';
import { calcularPrazoSLA } from '../utils/sla';
import { gerarProtocolo } from '../utils/protocolo';
import { emailChamadoAberto, emailStatusAlterado } from '../services/email.service';
import type { Chamado, PaginacaoQuery, StatusChamado, Usuario } from '../types';

export async function listar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      pagina = 1, limite = 20, status, prioridade, categoria,
      departamento, atendente_id, busca
    } = req.query as PaginacaoQuery;

    const offset = (Number(pagina) - 1) * Number(limite);
    const params: unknown[] = [];
    const where: string[] = ['1=1'];

    if (req.usuario?.perfil === 'solicitante') {
      params.push(req.usuario.id);
      where.push(`c.solicitante_id = $${params.length}`);
    } else if (req.usuario?.perfil === 'atendente') {
      params.push(req.usuario.id);
      where.push(`(c.atendente_id = $${params.length} OR c.departamento = $${params.length + 1}::departamento_enum)`);
      params.push(req.usuario.departamento);
    }

    if (status)       { params.push(status);       where.push(`c.status = $${params.length}::status_chamado_enum`); }
    if (prioridade)   { params.push(prioridade);   where.push(`c.prioridade = $${params.length}::prioridade_enum`); }
    if (categoria)    { params.push(categoria);    where.push(`c.categoria = $${params.length}::categoria_enum`); }
    if (departamento) { params.push(departamento); where.push(`c.departamento = $${params.length}::departamento_enum`); }
    if (atendente_id) { params.push(atendente_id); where.push(`c.atendente_id = $${params.length}`); }
    if (busca) {
      params.push(`%${busca}%`);
      where.push(`(c.titulo ILIKE $${params.length} OR c.protocolo ILIKE $${params.length} OR c.descricao ILIKE $${params.length})`);
    }

    const whereClause = where.join(' AND ');

    const total = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM chamados c WHERE ${whereClause}`, params
    );

    params.push(Number(limite), offset);
    const chamados = await query<Chamado & { solicitante_nome: string; atendente_nome: string }>(
      `SELECT c.*,
              s.nome AS solicitante_nome,
              a.nome AS atendente_nome
       FROM chamados c
       JOIN usuarios s ON s.id = c.solicitante_id
       LEFT JOIN usuarios a ON a.id = c.atendente_id
       WHERE ${whereClause}
       ORDER BY c.criado_em DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      dados: chamados,
      total: Number(total?.count ?? 0),
      pagina: Number(pagina),
      limite: Number(limite),
      paginas: Math.ceil(Number(total?.count ?? 0) / Number(limite)),
    });
  } catch (err) { next(err); }
}

export async function buscarPorId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const chamado = await queryOne<Chamado & { solicitante_nome: string; atendente_nome: string }>(
      `SELECT c.*, s.nome AS solicitante_nome, a.nome AS atendente_nome
       FROM chamados c
       JOIN usuarios s ON s.id = c.solicitante_id
       LEFT JOIN usuarios a ON a.id = c.atendente_id
       WHERE c.id = $1`,
      [id]
    );
    if (!chamado) throw new AppError('Chamado não encontrado', 404);

    const mensagens = await query(
      `SELECT m.*, u.nome AS autor_nome
       FROM mensagens m JOIN usuarios u ON u.id = m.autor_id
       WHERE m.chamado_id = $1
         AND (m.interna = FALSE OR $2 IN ('atendente','gestor','administrador'))
       ORDER BY m.criado_em ASC`,
      [id, req.usuario?.perfil]
    );

    const anexos = await query(
      `SELECT a.*, u.nome AS enviado_por_nome
       FROM anexos a JOIN usuarios u ON u.id = a.enviado_por
       WHERE a.chamado_id = $1 ORDER BY a.criado_em ASC`,
      [id]
    );

    const historico = await query(
      `SELECT h.*, u.nome AS alterado_por_nome
       FROM historico_chamados h JOIN usuarios u ON u.id = h.alterado_por
       WHERE h.chamado_id = $1 ORDER BY h.criado_em DESC`,
      [id]
    );

    res.json({ ...chamado, mensagens, anexos, historico });
  } catch (err) { next(err); }
}

export async function criar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { titulo, descricao, categoria, departamento, prioridade } = req.body as Partial<Chamado>;

    if (!titulo || !descricao || !categoria || !departamento || !prioridade) {
      throw new AppError('Campos obrigatórios: titulo, descricao, categoria, departamento, prioridade');
    }

    const protocolo = await gerarProtocolo();
    const prazo_sla = calcularPrazoSLA(prioridade);

    const chamado = await queryOne<Chamado>(
      `INSERT INTO chamados
         (protocolo, titulo, descricao, categoria, departamento, prioridade, solicitante_id, prazo_sla)
       VALUES ($1,$2,$3,$4::categoria_enum,$5::departamento_enum,$6::prioridade_enum,$7,$8)
       RETURNING *`,
      [protocolo, titulo, descricao, categoria, departamento, prioridade, req.usuario!.id, prazo_sla]
    );

    if (!chamado) throw new AppError('Erro ao criar chamado');

    const solicitante = await queryOne<Usuario>('SELECT * FROM usuarios WHERE id = $1', [req.usuario!.id]);
    if (solicitante) {
      emailChamadoAberto(chamado, solicitante).catch(() => {});
    }

    res.status(201).json(chamado);
  } catch (err) { next(err); }
}

export async function atualizarStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: StatusChamado };

    const atual = await queryOne<Chamado>('SELECT * FROM chamados WHERE id = $1', [id]);
    if (!atual) throw new AppError('Chamado não encontrado', 404);

    const statusAnterior = atual.status;

    const updates: Record<string, string> = { status: `$2::status_chamado_enum` };
    const params: unknown[] = [id, status];

    if (status === 'resolvido') {
      updates.resolvido_em = `NOW()`;
    } else if (status === 'fechado') {
      updates.fechado_em = `NOW()`;
    }

    const setClause = Object.entries(updates)
      .map(([col, val]) => `${col} = ${val}`)
      .join(', ');

    const chamado = await queryOne<Chamado>(
      `UPDATE chamados SET ${setClause} WHERE id = $1 RETURNING *`,
      params
    );

    await query(
      `INSERT INTO historico_chamados (chamado_id, campo_alterado, valor_anterior, valor_novo, alterado_por)
       VALUES ($1, 'status', $2, $3, $4)`,
      [id, statusAnterior, status, req.usuario!.id]
    );

    if (chamado) {
      const solicitante = await queryOne<Usuario>(
        'SELECT * FROM usuarios WHERE id = $1', [chamado.solicitante_id]
      );
      if (solicitante) {
        emailStatusAlterado(chamado, solicitante, statusAnterior).catch(() => {});
      }
    }

    res.json(chamado);
  } catch (err) { next(err); }
}

export async function atribuir(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { atendente_id } = req.body as { atendente_id: string };

    const atendente = await queryOne<Usuario>(
      "SELECT * FROM usuarios WHERE id = $1 AND perfil IN ('atendente','gestor') AND ativo = TRUE",
      [atendente_id]
    );
    if (!atendente) throw new AppError('Atendente não encontrado ou sem permissão');

    const chamado = await queryOne<Chamado>(
      `UPDATE chamados SET atendente_id = $2, status = 'em_atendimento'::status_chamado_enum
       WHERE id = $1 RETURNING *`,
      [id, atendente_id]
    );
    if (!chamado) throw new AppError('Chamado não encontrado', 404);

    await query(
      `INSERT INTO historico_chamados (chamado_id, campo_alterado, valor_anterior, valor_novo, alterado_por)
       VALUES ($1, 'atendente_id', NULL, $2, $3)`,
      [id, atendente_id, req.usuario!.id]
    );

    res.json(chamado);
  } catch (err) { next(err); }
}

export async function avaliar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { nota } = req.body as { nota: number };

    if (nota < 1 || nota > 5) throw new AppError('Nota deve ser entre 1 e 5');

    const chamado = await queryOne<Chamado>('SELECT * FROM chamados WHERE id = $1', [id]);
    if (!chamado) throw new AppError('Chamado não encontrado', 404);
    if (chamado.solicitante_id !== req.usuario!.id) throw new AppError('Apenas o solicitante pode avaliar', 403);
    if (chamado.status !== 'resolvido') throw new AppError('Só é possível avaliar chamados resolvidos');

    const atualizado = await queryOne<Chamado>(
      `UPDATE chamados SET nota_avaliacao = $2, status = 'fechado'::status_chamado_enum, fechado_em = NOW()
       WHERE id = $1 RETURNING *`,
      [id, nota]
    );

    res.json(atualizado);
  } catch (err) { next(err); }
}

export async function dashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totais, porStatus, porCategoria, porDepartamento, volumeSemanal] = await Promise.all([
      queryOne<Record<string, string>>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'aberto') AS abertos,
           COUNT(*) FILTER (WHERE status = 'em_atendimento') AS em_atendimento,
           COUNT(*) FILTER (WHERE status = 'resolvido' AND resolvido_em >= DATE_TRUNC('month', NOW())) AS resolvidos_mes,
           ROUND(AVG(nota_avaliacao) FILTER (WHERE nota_avaliacao IS NOT NULL)::numeric, 1) AS csat_medio,
           COUNT(*) FILTER (WHERE prazo_sla < NOW() AND status NOT IN ('resolvido','fechado')) AS sla_vencidos
         FROM chamados`
      ),
      query(
        `SELECT status, COUNT(*) AS total FROM chamados GROUP BY status ORDER BY total DESC`
      ),
      query(
        `SELECT categoria, COUNT(*) AS total FROM chamados GROUP BY categoria ORDER BY total DESC`
      ),
      query(
        `SELECT departamento, COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status IN ('resolvido','fechado')) AS resolvidos
         FROM chamados GROUP BY departamento ORDER BY total DESC`
      ),
      query(
        `SELECT DATE(criado_em) AS dia, COUNT(*) AS total
         FROM chamados
         WHERE criado_em >= NOW() - INTERVAL '7 days'
         GROUP BY dia ORDER BY dia ASC`
      ),
    ]);

    res.json({ totais, porStatus, porCategoria, porDepartamento, volumeSemanal });
  } catch (err) { next(err); }
}
