-- =============================================================
-- ObraIA · Seed de demonstração
--
-- Uso:  psql "$DATABASE_URL" -f db/seed.sql
-- Cria uma construtora fictícia com duas obras, equipe e materiais,
-- suficiente para exercitar o fluxo de áudio de ponta a ponta.
--
-- Senha do painel para todos os usuários: obraia123
-- (hash bcrypt abaixo; troque antes de qualquer uso real)
-- =============================================================

BEGIN;

INSERT INTO empresas (id, nome, cnpj, plano) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Construtora Aurora Ltda', '12.345.678/0001-90', 'profissional');

INSERT INTO clientes (id, empresa_id, nome, documento, telefone) VALUES
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111',
   'Ricardo Menezes', '123.456.789-00', '5531988887777');

INSERT INTO fornecedores (id, empresa_id, nome, telefone) VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111',
   'Casa do Construtor', '5531977776666');

-- Ajuste os telefones para os SEUS números antes de testar no WhatsApp real.
INSERT INTO usuarios (id, empresa_id, nome, telefone, email, senha_hash, perfil) VALUES
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111',
   'Ana Ribeiro', '5531999990001', 'ana@aurora.com.br',
   '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfgqwAg0jkPBKk3E5nWiVMxr3MTqLKPu', 'engenheiro'),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111',
   'João Batista', '5531999990002', NULL, NULL, 'mestre'),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111',
   'Carlos Souza', '5531999990003', 'carlos@aurora.com.br',
   '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfgqwAg0jkPBKk3E5nWiVMxr3MTqLKPu', 'almoxarife'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
   'Marcos Diretor', '5531999990004', 'marcos@aurora.com.br',
   '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfgqwAg0jkPBKk3E5nWiVMxr3MTqLKPu', 'gestor');

INSERT INTO obras (id, empresa_id, cliente_id, nome, apelidos, endereco, area_m2,
                   valor_contrato, data_inicio, data_prevista, status) VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222221', 'Residencial Aurora',
   ARRAY['aurora','residencial','obra do aurora'],
   'Rua das Acácias, 120 - Belo Horizonte/MG', 1850.00, 3200000.00,
   '2026-02-01', '2027-06-30', 'em_andamento'),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111',
   NULL, 'Galpão Industrial Norte',
   ARRAY['galpao','galpão','obra do norte'],
   'Av. Industrial, 4500 - Contagem/MG', 4200.00, 5100000.00,
   '2026-05-15', '2027-02-28', 'em_andamento');

INSERT INTO obra_equipe (obra_id, usuario_id, papel) VALUES
  ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'responsavel'),
  ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444442', 'mestre'),
  ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444441', 'responsavel');

INSERT INTO materiais (id, empresa_id, nome, apelidos, unidade, estoque_min) VALUES
  ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111',
   'Concreto usinado FCK 25', ARRAY['concreto','concreto usinado'], 'm3', 10),
  ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111',
   'Cimento CP-II 50kg', ARRAY['cimento','saco de cimento'], 'saco', 40),
  ('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111',
   'Vergalhão CA-50 10mm', ARRAY['vergalhao','vergalhão','ferro','aço'], 'barra', 60),
  ('66666666-6666-6666-6666-666666666664', '11111111-1111-1111-1111-111111111111',
   'Bloco cerâmico 14x19x39', ARRAY['bloco','tijolo'], 'un', 500),
  ('66666666-6666-6666-6666-666666666665', '11111111-1111-1111-1111-111111111111',
   'Areia média', ARRAY['areia'], 'm3', 8);

-- Entradas iniciais. O cimento entra propositalmente perto do mínimo para
-- disparar o alerta de compra logo no primeiro consumo registrado por voz.
INSERT INTO estoque_movimentos (empresa_id, obra_id, material_id, tipo, quantidade, custo_unit, origem) VALUES
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   '66666666-6666-6666-6666-666666666661', 'entrada', 45, 420.00, 'manual'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   '66666666-6666-6666-6666-666666666662', 'entrada', 45, 38.00, 'manual'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   '66666666-6666-6666-6666-666666666663', 'entrada', 300, 52.00, 'manual'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   '66666666-6666-6666-6666-666666666664', 'entrada', 4000, 2.10, 'manual');

INSERT INTO cronograma_etapas (empresa_id, obra_id, nome, ordem, previsto_inicio,
                               previsto_fim, real_inicio, percentual, peso) VALUES
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'Fundação', 1, '2026-02-01', '2026-04-15', '2026-02-03', 100, 15),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'Estrutura', 2, '2026-04-16', '2026-09-30', '2026-04-20', 62, 30),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'Alvenaria', 3, '2026-08-01', '2026-12-20', '2026-08-10', 18, 20),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'Instalações', 4, '2026-10-01', '2027-02-28', NULL, 0, 20),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'Acabamento', 5, '2027-01-15', '2027-06-15', NULL, 0, 15);

INSERT INTO financeiro_lancamentos (empresa_id, obra_id, tipo, categoria, descricao, valor, data) VALUES
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'custo', 'material', 'Concreto usinado - 1ª remessa', 18900.00, '2026-04-22'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'custo', 'mao_de_obra', 'Folha equipe estrutura - julho', 62400.00, '2026-07-30'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   'receita', 'medicao', '2ª medição aprovada', 480000.00, '2026-07-05');

INSERT INTO medicoes (empresa_id, obra_id, numero, periodo_ini, periodo_fim,
                      percentual, valor, status, aprovada_em) VALUES
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   1, '2026-02-01', '2026-04-30', 12.0, 384000.00, 'paga', '2026-05-08'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   2, '2026-05-01', '2026-06-30', 15.0, 480000.00, 'paga', '2026-07-05'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551',
   3, '2026-07-01', '2026-08-31', 11.0, 352000.00, 'pendente', NULL);

COMMIT;

\echo '✅ Seed aplicado.'
\echo '   Empresa: Construtora Aurora Ltda'
\echo '   Painel:  ana@aurora.com.br / obraia123'
\echo '   Mestre no WhatsApp: 5531999990002 (ajuste para seu número real)'
