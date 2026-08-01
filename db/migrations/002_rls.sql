-- =============================================================
-- ObraIA · 002 — Row-Level Security (isolamento entre empresas)
--
-- Regra: a aplicação abre a conexão e executa
--     SET LOCAL app.empresa_id = '<uuid>';
-- antes de qualquer query de negócio. A partir daí o Postgres só
-- devolve linhas daquele tenant — mesmo que a query da aplicação
-- esqueça o WHERE empresa_id.
--
-- Isso transforma vazamento entre clientes de "bug provável" em
-- "impossível pelo banco". É a linha de defesa que não depende de
-- ninguém lembrar de filtrar.
-- =============================================================

-- ⚠️ ATENÇÃO — leia antes de ir para produção
--
-- SUPERUSUÁRIO IGNORA ROW-LEVEL SECURITY. Sempre. Não existe policy que
-- segure um superusuário.
--
-- O usuário criado por POSTGRES_USER na imagem oficial do Postgres (aqui,
-- `obraia`) É superusuário. Se a aplicação conectar com ele, todo o isolamento
-- abaixo vira decoração: as policies existem e não são aplicadas.
--
-- Em produção, a DATABASE_URL DEVE apontar para o papel `obraia_app` criado
-- abaixo, que não é superusuário e não tem BYPASSRLS. Defina a senha com:
--
--     ALTER ROLE obraia_app WITH PASSWORD 'senha-forte-aqui';
--
-- e use: postgresql://obraia_app:senha-forte-aqui@host:5432/obraia
--
-- Para confirmar que o isolamento está mesmo ativo, veja docs/TESTES.md
-- ("Verificar o isolamento entre clientes").

DO $$ BEGIN
  -- LOGIN para que a aplicação possa de fato conectar com este papel.
  -- Sem NOSUPERUSER/NOBYPASSRLS explícitos: são o padrão de CREATE ROLE.
  CREATE ROLE obraia_app LOGIN;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Papel obraia_app já existe.';
END $$;

GRANT USAGE ON SCHEMA public TO obraia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO obraia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO obraia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO obraia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO obraia_app;

-- Lê o tenant da sessão. Retorna NULL quando não definido, o que faz
-- toda policy falhar e nenhuma linha ser devolvida (falha fechada).
CREATE OR REPLACE FUNCTION current_empresa_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.empresa_id', TRUE), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Aplica a policy padrão em todas as tabelas que têm empresa_id.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND a.attname = 'empresa_id'
      AND NOT a.attisdropped
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING (empresa_id = current_empresa_id())
        WITH CHECK (empresa_id = current_empresa_id())
    $f$, t);
  END LOOP;
END $$;

-- Tabelas-filhas não têm empresa_id próprio: herdam pelo pai.
ALTER TABLE rdo_atividades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_mao_de_obra    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_equipamentos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_equipe        ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_via_rdo ON rdo_atividades
  USING (EXISTS (SELECT 1 FROM rdos r WHERE r.id = rdo_id AND r.empresa_id = current_empresa_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM rdos r WHERE r.id = rdo_id AND r.empresa_id = current_empresa_id()));

CREATE POLICY tenant_via_rdo ON rdo_mao_de_obra
  USING (EXISTS (SELECT 1 FROM rdos r WHERE r.id = rdo_id AND r.empresa_id = current_empresa_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM rdos r WHERE r.id = rdo_id AND r.empresa_id = current_empresa_id()));

CREATE POLICY tenant_via_rdo ON rdo_equipamentos
  USING (EXISTS (SELECT 1 FROM rdos r WHERE r.id = rdo_id AND r.empresa_id = current_empresa_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM rdos r WHERE r.id = rdo_id AND r.empresa_id = current_empresa_id()));

CREATE POLICY tenant_via_pedido ON pedido_itens
  USING (EXISTS (SELECT 1 FROM pedidos_compra p WHERE p.id = pedido_id AND p.empresa_id = current_empresa_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM pedidos_compra p WHERE p.id = pedido_id AND p.empresa_id = current_empresa_id()));

CREATE POLICY tenant_via_obra ON obra_equipe
  USING (EXISTS (SELECT 1 FROM obras o WHERE o.id = obra_id AND o.empresa_id = current_empresa_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM obras o WHERE o.id = obra_id AND o.empresa_id = current_empresa_id()));

-- Exceção deliberada: o webhook do WhatsApp chega com um número de telefone e
-- ainda não sabe a empresa. Esta função roda com privilégio elevado só para
-- resolver telefone -> (usuario, empresa) e nada mais.
CREATE OR REPLACE FUNCTION resolver_usuario_por_telefone(p_telefone VARCHAR)
RETURNS TABLE (usuario_id UUID, empresa_id UUID, nome TEXT, perfil perfil_usuario)
AS $$
  SELECT u.id, u.empresa_id, u.nome, u.perfil
  FROM usuarios u
  JOIN empresas e ON e.id = u.empresa_id
  WHERE u.telefone = p_telefone AND u.ativo AND e.ativa
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION resolver_usuario_por_telefone(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolver_usuario_por_telefone(VARCHAR) TO obraia_app;


-- ─────────────────────────────────────────────────────────────
-- Diagnóstico: a aplicação está mesmo sujeita às policies?
--
--   SELECT * FROM verificar_isolamento();
--
-- `rls_ativo = false` significa que este papel enxerga todos os tenants.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION verificar_isolamento()
RETURNS TABLE (papel NAME, superusuario BOOLEAN, bypassrls BOOLEAN, rls_ativo BOOLEAN)
AS $$
  SELECT r.rolname, r.rolsuper, r.rolbypassrls, NOT (r.rolsuper OR r.rolbypassrls)
    FROM pg_roles r
   WHERE r.rolname = current_user;
$$ LANGUAGE sql STABLE;
