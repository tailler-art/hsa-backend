import { pool } from '../config/database';
import { logger } from '../config/logger';

const schema = `
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
DO $$ BEGIN
  CREATE TYPE perfil_enum AS ENUM ('solicitante', 'atendente', 'gestor', 'administrador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE departamento_enum AS ENUM ('Técnico', 'Comercial', 'Administrativo', 'Sistema');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE categoria_enum AS ENUM ('Reclamação', 'Solicitação', 'Dúvidas', 'Elogios', 'Melhorias');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE prioridade_enum AS ENUM ('critica', 'alta', 'media', 'baixa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_chamado_enum AS ENUM (
    'aberto', 'em_atendimento', 'aguardando_resposta', 'resolvido', 'fechado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(150) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  perfil        perfil_enum NOT NULL DEFAULT 'solicitante',
  departamento  departamento_enum NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de chamados
CREATE TABLE IF NOT EXISTS chamados (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocolo     VARCHAR(20) NOT NULL UNIQUE,
  titulo        VARCHAR(300) NOT NULL,
  descricao     TEXT NOT NULL,
  status        status_chamado_enum NOT NULL DEFAULT 'aberto',
  prioridade    prioridade_enum NOT NULL DEFAULT 'media',
  categoria     categoria_enum NOT NULL,
  departamento  departamento_enum NOT NULL,
  solicitante_id UUID NOT NULL REFERENCES usuarios(id),
  atendente_id   UUID REFERENCES usuarios(id),
  prazo_sla      TIMESTAMPTZ NOT NULL,
  resolvido_em   TIMESTAMPTZ,
  fechado_em     TIMESTAMPTZ,
  nota_avaliacao SMALLINT CHECK (nota_avaliacao BETWEEN 1 AND 5),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mensagens do chat interno
CREATE TABLE IF NOT EXISTS mensagens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chamado_id  UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  autor_id    UUID NOT NULL REFERENCES usuarios(id),
  conteudo    TEXT NOT NULL,
  interna     BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anexos dos chamados
CREATE TABLE IF NOT EXISTS anexos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chamado_id      UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  nome_original   VARCHAR(255) NOT NULL,
  nome_arquivo    VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  tamanho_bytes   INTEGER NOT NULL,
  enviado_por     UUID NOT NULL REFERENCES usuarios(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Histórico de alterações
CREATE TABLE IF NOT EXISTS historico_chamados (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chamado_id      UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  campo_alterado  VARCHAR(100) NOT NULL,
  valor_anterior  TEXT,
  valor_novo      TEXT NOT NULL,
  alterado_por    UUID NOT NULL REFERENCES usuarios(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expira_em   TIMESTAMPTZ NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chamados_status        ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_departamento  ON chamados(departamento);
CREATE INDEX IF NOT EXISTS idx_chamados_prioridade    ON chamados(prioridade);
CREATE INDEX IF NOT EXISTS idx_chamados_solicitante   ON chamados(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_chamados_atendente     ON chamados(atendente_id);
CREATE INDEX IF NOT EXISTS idx_chamados_prazo_sla     ON chamados(prazo_sla);
CREATE INDEX IF NOT EXISTS idx_chamados_criado_em     ON chamados(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_chamado      ON mensagens(chamado_id);
CREATE INDEX IF NOT EXISTS idx_historico_chamado      ON historico_chamados(chamado_id);

-- Trigger: atualiza atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_usuarios_atualizado_em ON usuarios;
CREATE TRIGGER trigger_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

DROP TRIGGER IF EXISTS trigger_chamados_atualizado_em ON chamados;
CREATE TRIGGER trigger_chamados_atualizado_em
  BEFORE UPDATE ON chamados
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();
`;

async function migrar(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info('Iniciando migração do banco de dados...');
    await client.query(schema);
    logger.info('✅ Migração concluída com sucesso!');
  } catch (error) {
    logger.error('Erro na migração:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrar();
