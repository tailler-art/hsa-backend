import { pool } from '../config/database';
import { logger } from '../config/logger';
import bcrypt from 'bcryptjs';

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info('Iniciando seed do banco de dados...');

    const senha = await bcrypt.hash('Hsa@2026', 12);

    await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento)
      VALUES
        ('Administrador HSA',   'admin@hsa.com.br',        $1, 'administrador', 'Sistema'),
        ('João Mendes',         'joao.mendes@hsa.com.br',  $1, 'gestor',        'Técnico'),
        ('Maria Oliveira',      'maria.oliveira@hsa.com.br',$1, 'atendente',    'Comercial'),
        ('Carlos Souza',        'carlos.souza@hsa.com.br', $1, 'solicitante',   'Técnico'),
        ('Ana Paula Lima',      'ana.lima@hsa.com.br',     $1, 'atendente',     'Administrativo'),
        ('Roberto Fernandes',   'roberto.f@hsa.com.br',    $1, 'gestor',        'Comercial')
      ON CONFLICT (email) DO NOTHING
    `, [senha]);

    logger.info('✅ Usuários criados');

    const adminId = await client.query(
      "SELECT id FROM usuarios WHERE email = 'admin@hsa.com.br'"
    );
    const joaoId = await client.query(
      "SELECT id FROM usuarios WHERE email = 'joao.mendes@hsa.com.br'"
    );
    const carlosId = await client.query(
      "SELECT id FROM usuarios WHERE email = 'carlos.souza@hsa.com.br'"
    );

    const admin = adminId.rows[0]?.id;
    const joao = joaoId.rows[0]?.id;
    const carlos = carlosId.rows[0]?.id;

    if (!admin || !joao || !carlos) {
      logger.warn('IDs não encontrados — seed de chamados ignorado');
      return;
    }

    await client.query(`
      INSERT INTO chamados
        (protocolo, titulo, descricao, status, prioridade, categoria, departamento,
         solicitante_id, atendente_id, prazo_sla)
      VALUES
        ('HSA-0042', 'Sistema de ponto eletrônico fora do ar',
         'O sistema de registro de ponto está inacessível desde as 08h45.',
         'em_atendimento', 'critica', 'Solicitação', 'Técnico',
         $1, $2, NOW() + INTERVAL '2 hours'),

        ('HSA-0041', 'Solicitação de acesso ao módulo financeiro',
         'Preciso de acesso ao módulo de relatórios financeiros para gerar fechamentos.',
         'aberto', 'alta', 'Solicitação', 'Administrativo',
         $1, NULL, NOW() + INTERVAL '8 hours'),

        ('HSA-0040', 'Dúvida sobre procedimento de vistoria sanitária',
         'Qual o protocolo correto para vistorias em restaurantes industriais?',
         'aguardando_resposta', 'media', 'Dúvidas', 'Técnico',
         $3, $2, NOW() + INTERVAL '24 hours'),

        ('HSA-0039', 'Elogio ao atendimento da equipe comercial',
         'Gostaria de registrar a excelência no atendimento do time comercial.',
         'resolvido', 'baixa', 'Elogios', 'Comercial',
         $3, NULL, NOW() - INTERVAL '1 hour')
      ON CONFLICT (protocolo) DO NOTHING
    `, [admin, joao, carlos]);

    logger.info('✅ Chamados de exemplo criados');
    logger.info('');
    logger.info('─── Credenciais de acesso ───────────────────');
    logger.info('Admin:       admin@hsa.com.br    / Hsa@2026');
    logger.info('Gestor:      joao.mendes@hsa.com.br / Hsa@2026');
    logger.info('Atendente:   maria.oliveira@hsa.com.br / Hsa@2026');
    logger.info('Solicitante: carlos.souza@hsa.com.br / Hsa@2026');
    logger.info('─────────────────────────────────────────────');

  } catch (error) {
    logger.error('Erro no seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
