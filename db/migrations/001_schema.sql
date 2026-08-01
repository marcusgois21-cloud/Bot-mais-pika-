-- =============================================================
-- ObraIA · 001 — Schema base
--
-- Modelo multi-tenant: TODA tabela de negócio carrega empresa_id.
-- O isolamento é garantido por Row-Level Security (migration 002),
-- não por confiança no código da aplicação.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- pgvector habilita a busca por similaridade entre fotos (evolução da obra).
-- Se a extensão não existir na instância, o schema segue funcionando: a coluna
-- de embedding é criada condicionalmente no fim deste arquivo.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector indisponível: busca por similaridade de fotos ficará desativada.';
END $$;


-- ─────────────────────────────────────────────────────────────
-- Tenant e pessoas
-- ─────────────────────────────────────────────────────────────

CREATE TABLE empresas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  cnpj        VARCHAR(18) UNIQUE,
  plano       TEXT NOT NULL DEFAULT 'starter'
                CHECK (plano IN ('starter', 'profissional', 'enterprise')),
  ativa       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE perfil_usuario AS ENUM (
  'gestor',       -- dono/diretor: vê o portfólio inteiro
  'engenheiro',   -- responsável técnico das obras
  'mestre',       -- registra o dia a dia pelo WhatsApp
  'almoxarife',   -- estoque e compras
  'cliente'       -- contratante: canal somente-leitura + aprovação
);

CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  -- E.164 sem "+": 5531999998888. É a chave de identificação no WhatsApp.
  telefone      VARCHAR(20) NOT NULL,
  email         TEXT,
  senha_hash    TEXT,                       -- só para quem acessa o painel
  perfil        perfil_usuario NOT NULL DEFAULT 'mestre',
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (telefone)
);

CREATE INDEX idx_usuarios_empresa ON usuarios (empresa_id);

CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  documento   VARCHAR(18),
  telefone    VARCHAR(20),
  email       TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fornecedores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  documento   VARCHAR(18),
  telefone    VARCHAR(20),
  email       TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- Obras
-- ─────────────────────────────────────────────────────────────

CREATE TABLE obras (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id     UUID REFERENCES clientes(id) ON DELETE SET NULL,
  nome           TEXT NOT NULL,
  -- Apelidos ditos no canteiro ("aurora", "obra do centro"). A IA usa esta
  -- lista para casar o áudio com a obra certa sem o usuário soletrar o nome.
  apelidos       TEXT[] NOT NULL DEFAULT '{}',
  endereco       TEXT,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  area_m2        NUMERIC(12,2),
  valor_contrato NUMERIC(14,2),
  data_inicio    DATE,
  data_prevista  DATE,
  status         TEXT NOT NULL DEFAULT 'em_andamento'
                   CHECK (status IN ('planejamento','em_andamento','paralisada','concluida')),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_obras_empresa ON obras (empresa_id, status);

-- Quem pode registrar/consultar cada obra pelo WhatsApp.
CREATE TABLE obra_equipe (
  obra_id     UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  papel       TEXT NOT NULL DEFAULT 'membro',
  PRIMARY KEY (obra_id, usuario_id)
);


-- ─────────────────────────────────────────────────────────────
-- Registro de voz — a matéria-prima do sistema
-- ─────────────────────────────────────────────────────────────

CREATE TYPE status_registro AS ENUM (
  'recebido',      -- áudio baixado, ainda não transcrito
  'transcrito',
  'aguardando',    -- IA perguntou algo e espera resposta do usuário
  'consolidado',   -- virou RDO
  'erro'
);

CREATE TABLE registros_voz (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id       UUID REFERENCES obras(id) ON DELETE SET NULL,
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  -- Rastreabilidade: id da mensagem no WhatsApp, para deduplicação e auditoria
  wa_message_id TEXT UNIQUE,
  audio_url     TEXT,
  duracao_seg   INTEGER,
  transcricao   TEXT,
  -- Saída estruturada do LLM. Guardamos o JSON bruto para auditar o que a IA
  -- entendeu — se um RDO for contestado, dá para provar a origem do dado.
  entidades     JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        status_registro NOT NULL DEFAULT 'recebido',
  erro          TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registros_obra ON registros_voz (obra_id, criado_em DESC);
CREATE INDEX idx_registros_status ON registros_voz (status)
  WHERE status IN ('recebido','aguardando');


-- ─────────────────────────────────────────────────────────────
-- RDO — Relatório Diário de Obra
-- ─────────────────────────────────────────────────────────────

CREATE TABLE rdos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id             UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  autor_id            UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data                DATE NOT NULL,
  clima               TEXT,
  condicao_trabalho   TEXT,                 -- praticável / impraticável
  efetivo_total       INTEGER,
  horas_trabalhadas   NUMERIC(5,2),
  observacoes         TEXT,
  proximas_atividades TEXT[],
  -- 'rascunho' enquanto a IA ainda espera complemento; 'publicado' quando
  -- fechado; 'aprovado' quando o engenheiro valida no painel.
  status              TEXT NOT NULL DEFAULT 'rascunho'
                        CHECK (status IN ('rascunho','publicado','aprovado')),
  pdf_url             TEXT,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Um RDO por obra por dia. Registros extras do mesmo dia são mesclados.
  UNIQUE (obra_id, data)
);

CREATE INDEX idx_rdos_obra_data ON rdos (obra_id, data DESC);

CREATE TABLE rdo_atividades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rdo_id       UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  etapa        TEXT NOT NULL,               -- "Concretagem laje 3º pav."
  local        TEXT,                        -- bloco / pavimento / frente
  descricao    TEXT,
  quantidade   NUMERIC(12,2),
  unidade      TEXT,
  percentual   NUMERIC(5,2),
  ordem        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_rdo_atividades ON rdo_atividades (rdo_id);

CREATE TABLE rdo_mao_de_obra (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rdo_id     UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  funcao     TEXT NOT NULL,                 -- pedreiro, servente, armador
  quantidade INTEGER NOT NULL DEFAULT 1,
  horas      NUMERIC(5,2)
);

CREATE TABLE rdo_equipamentos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rdo_id     UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  horas      NUMERIC(5,2)
);

CREATE TYPE tipo_ocorrencia AS ENUM (
  'problema', 'atraso', 'seguranca', 'nao_conformidade', 'acidente', 'incidente'
);

CREATE TABLE ocorrencias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id     UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  rdo_id      UUID REFERENCES rdos(id) ON DELETE SET NULL,
  tipo        tipo_ocorrencia NOT NULL,
  gravidade   TEXT NOT NULL DEFAULT 'baixa'
                CHECK (gravidade IN ('baixa','media','alta','critica')),
  descricao   TEXT NOT NULL,
  epi_citado  TEXT[],
  resolvida   BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ocorrencias_obra ON ocorrencias (obra_id, criado_em DESC);


-- ─────────────────────────────────────────────────────────────
-- Registro fotográfico
-- ─────────────────────────────────────────────────────────────

CREATE TABLE fotos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id       UUID REFERENCES obras(id) ON DELETE CASCADE,
  rdo_id        UUID REFERENCES rdos(id) ON DELETE SET NULL,
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  wa_message_id TEXT UNIQUE,
  url           TEXT NOT NULL,
  etapa         TEXT,                       -- classificada pela visão computacional
  legenda       TEXT,                       -- gerada automaticamente
  analise       JSONB NOT NULL DEFAULT '{}'::jsonb,
  tirada_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fotos_obra ON fotos (obra_id, tirada_em DESC);

-- Embedding para comparar evolução entre fotos da mesma frente.
DO $$ BEGIN
  ALTER TABLE fotos ADD COLUMN embedding vector(512);
EXCEPTION WHEN undefined_object OR undefined_file THEN
  RAISE NOTICE 'Coluna fotos.embedding não criada (pgvector ausente).';
END $$;


-- ─────────────────────────────────────────────────────────────
-- Materiais e estoque
-- ─────────────────────────────────────────────────────────────

CREATE TABLE materiais (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  -- Como o material é chamado no canteiro ("cimento", "saco de cimento")
  apelidos     TEXT[] NOT NULL DEFAULT '{}',
  unidade      TEXT NOT NULL DEFAULT 'un',  -- un, m3, m2, kg, saco
  estoque_min  NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_medio  NUMERIC(12,2),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, nome)
);

CREATE TYPE tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste', 'perda');

CREATE TABLE estoque_movimentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id      UUID REFERENCES obras(id) ON DELETE CASCADE,
  material_id  UUID NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
  rdo_id       UUID REFERENCES rdos(id) ON DELETE SET NULL,
  tipo         tipo_movimento NOT NULL,
  quantidade   NUMERIC(12,2) NOT NULL CHECK (quantidade > 0),
  custo_unit   NUMERIC(12,2),
  -- De onde veio o dado: 'voz' (áudio do canteiro), 'manual', 'nota_fiscal'
  origem       TEXT NOT NULL DEFAULT 'voz',
  observacao   TEXT,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_estoque_mov ON estoque_movimentos (obra_id, material_id, criado_em DESC);

CREATE TABLE pedidos_compra (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id       UUID REFERENCES obras(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  solicitante_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  numero        SERIAL,
  status        TEXT NOT NULL DEFAULT 'rascunho'
                  CHECK (status IN ('rascunho','enviado','aprovado','recebido','cancelado')),
  -- TRUE quando a IA gerou sozinha por estoque abaixo do mínimo
  gerado_por_ia BOOLEAN NOT NULL DEFAULT FALSE,
  entrega_em    DATE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pedido_itens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materiais(id),
  quantidade  NUMERIC(12,2) NOT NULL,
  preco_unit  NUMERIC(12,2)
);


-- ─────────────────────────────────────────────────────────────
-- Cronograma
-- ─────────────────────────────────────────────────────────────

CREATE TABLE cronograma_etapas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id        UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  ordem          INTEGER NOT NULL DEFAULT 0,
  previsto_inicio DATE,
  previsto_fim    DATE,
  real_inicio     DATE,
  real_fim        DATE,
  percentual      NUMERIC(5,2) NOT NULL DEFAULT 0,
  peso            NUMERIC(5,2) NOT NULL DEFAULT 1,  -- participação na obra (curva S)
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cronograma_obra ON cronograma_etapas (obra_id, ordem);


-- ─────────────────────────────────────────────────────────────
-- Financeiro
-- ─────────────────────────────────────────────────────────────

CREATE TYPE tipo_lancamento AS ENUM ('custo', 'receita', 'medicao', 'previsto');

CREATE TABLE financeiro_lancamentos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id       UUID REFERENCES obras(id) ON DELETE CASCADE,
  etapa_id      UUID REFERENCES cronograma_etapas(id) ON DELETE SET NULL,
  tipo          tipo_lancamento NOT NULL,
  categoria     TEXT,                       -- material, mao_de_obra, equipamento
  descricao     TEXT,
  valor         NUMERIC(14,2) NOT NULL,
  data          DATE NOT NULL DEFAULT CURRENT_DATE,
  documento_url TEXT,                       -- NF lida por OCR
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financeiro_obra ON financeiro_lancamentos (obra_id, data DESC);

CREATE TABLE medicoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id       UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  numero        INTEGER NOT NULL,
  periodo_ini   DATE NOT NULL,
  periodo_fim   DATE NOT NULL,
  percentual    NUMERIC(5,2) NOT NULL,
  valor         NUMERIC(14,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','aprovada','rejeitada','paga')),
  aprovada_em   TIMESTAMPTZ,
  aprovada_por  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  pdf_url       TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (obra_id, numero)
);


-- ─────────────────────────────────────────────────────────────
-- Conversas do WhatsApp
-- ─────────────────────────────────────────────────────────────

CREATE TABLE conversas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  telefone      VARCHAR(20) NOT NULL,
  -- Estado da máquina de conversa: obra em foco, campos pendentes,
  -- id do rascunho aguardando complemento.
  contexto      JSONB NOT NULL DEFAULT '{}'::jsonb,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (telefone)
);

CREATE TABLE mensagens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES empresas(id) ON DELETE CASCADE,
  conversa_id   UUID REFERENCES conversas(id) ON DELETE CASCADE,
  wa_message_id TEXT UNIQUE,
  direcao       TEXT NOT NULL CHECK (direcao IN ('entrada','saida')),
  tipo          TEXT NOT NULL,              -- text, audio, image, document, location
  conteudo      TEXT,
  media_url     TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mensagens_conversa ON mensagens (conversa_id, criado_em DESC);


-- ─────────────────────────────────────────────────────────────
-- Auditoria (exigência de LGPD e de rastreabilidade do RDO)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE auditoria (
  id          BIGSERIAL PRIMARY KEY,
  empresa_id  UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao        TEXT NOT NULL,                -- rdo.consolidado, foto.acessada
  entidade    TEXT,
  entidade_id UUID,
  detalhes    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip          INET,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditoria_empresa ON auditoria (empresa_id, criado_em DESC);


-- ─────────────────────────────────────────────────────────────
-- Gatilho de atualização
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rdos_touch BEFORE UPDATE ON rdos
  FOR EACH ROW EXECUTE FUNCTION touch_atualizado_em();


-- ─────────────────────────────────────────────────────────────
-- Visão de saldo de estoque por obra
-- ─────────────────────────────────────────────────────────────

CREATE VIEW estoque_saldo AS
SELECT
  m.empresa_id,
  mov.obra_id,
  m.id                AS material_id,
  m.nome,
  m.unidade,
  m.estoque_min,
  SUM(
    CASE WHEN mov.tipo = 'entrada' THEN mov.quantidade
         WHEN mov.tipo = 'ajuste'  THEN mov.quantidade
         ELSE -mov.quantidade
    END
  ) AS saldo
FROM materiais m
JOIN estoque_movimentos mov ON mov.material_id = m.id
GROUP BY m.empresa_id, mov.obra_id, m.id, m.nome, m.unidade, m.estoque_min;
