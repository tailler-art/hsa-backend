"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const sql = `
CREATE TABLE IF NOT EXISTS configuracoes (
  chave         TEXT PRIMARY KEY,
  valor         JSONB NOT NULL,
  descricao     TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('sla_critica',    '120',  'SLA prioridade critica (minutos)'),
  ('sla_alta',       '480',  'SLA prioridade alta (minutos)'),
  ('sla_media',      '1440', 'SLA prioridade media (minutos)'),
  ('sla_baixa',      '4320', 'SLA prioridade baixa (minutos)'),
  ('departamentos',  '["Tecnico","Comercial","Administrativo","Sistema"]', 'Departamentos ativos'),
  ('categorias',     '["Reclamacao","Solicitacao","Duvidas","Elogios","Melhorias"]', 'Categorias ativas')
ON CONFLICT (chave) DO NOTHING;
`;
async function migrar() {
    const client = await database_1.pool.connect();
    try {
        logger_1.logger.info('Criando tabela configuracoes...');
        await client.query(sql);
        logger_1.logger.info('Tabela criada. Atualizando valores com acentos...');
        await client.query(`
      UPDATE configuracoes SET valor = '["Técnico","Comercial","Administrativo","Sistema"]'::jsonb
      WHERE chave = 'departamentos';
      UPDATE configuracoes SET valor = '["Reclamação","Solicitação","Dúvidas","Elogios","Melhorias"]'::jsonb
      WHERE chave = 'categorias';
    `);
        const { rows } = await client.query('SELECT chave, valor FROM configuracoes ORDER BY chave');
        rows.forEach(r => logger_1.logger.info(`  ${r.chave}: ${JSON.stringify(r.valor)}`));
        logger_1.logger.info('Migracao de configuracoes concluida!');
    }
    catch (error) {
        logger_1.logger.error('Erro:', error);
        throw error;
    }
    finally {
        client.release();
        await database_1.pool.end();
    }
}
migrar();
//# sourceMappingURL=migrate_config.js.map