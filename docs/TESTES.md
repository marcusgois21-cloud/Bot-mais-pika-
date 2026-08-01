# Testes

## Rodar

```bash
cd apps/api
npm test              # suíte completa
npm run test:watch    # durante o desenvolvimento
npm run test:cov      # com cobertura
npm run typecheck     # verificação de tipos
```

Estado atual: **26 testes passando** em 3 suítes.

---

## O que está coberto e por quê

A suíte cobre os pontos onde um erro sai caro, não a superfície inteira.

### `whatsapp/assinatura.guard.spec.ts` — 6 testes

Sem validação de assinatura, o webhook é público e qualquer um injeta RDO falso
na obra de um cliente. Os casos cobrem: assinatura válida, corpo adulterado
depois de assinado, cabeçalho ausente, prefixo errado, `rawBody` não capturado
(erro de configuração do Nest) e o GET de verificação, que a Meta não assina.

### `ai/extracao.service.spec.ts` — 12 testes

Duas responsabilidades críticas:

**Resolução de obra.** No canteiro ninguém fala o nome completo — fala
"aurora", "galpão". O teste cobre apelido, acento, caixa, menção dentro de
frase, obra única sem menção e, principalmente, **ambiguidade**: dois nomes que
casam com o mesmo termo devolvem `null` para o sistema perguntar. Errar a obra
significa lançar estoque, custo e cronograma no lugar errado.

**Extração.** Inclui o caso que sustenta a regra central do produto: material
citado sem quantidade permanece `null` e gera pendência — nunca um valor
estimado.

Há um teste de regressão explícito para a validação de campos omitidos (ver
"Bug encontrado", abaixo).

### `conversa/conversa.service.spec.ts` — 8 testes

A mesclagem entre turnos é onde o RDO se corrompe silenciosamente. Os testes
garantem que:

- a resposta complementa a atividade do primeiro áudio em vez de duplicá-la
  ("terminamos a concretagem" + "bloco B, 12 metros" = **uma** atividade);
- atividades diferentes do mesmo dia se acumulam;
- escalar já preenchido não é sobrescrito;
- **ocorrências se acumulam** — perder um registro de segurança na mesclagem
  seria inaceitável;
- pendências respondidas não ressuscitam.

---

## Bug encontrado pelos testes

Vale registrar porque é o tipo de defeito que só aparece em produção.

Os campos opcionais do schema de extração eram `z.string().nullable()` —
*nullable*, mas não *opcionais*. Como o function schema marca poucos campos como
obrigatórios, o modelo legitimamente omite `clima`, `observacoes`,
`atividades[].descricao`. Quando isso acontecia, o zod rejeitava **a extração
inteira** e o usuário recebia "não identifiquei informação de obra" — perdendo
um RDO legítimo.

Corrigido com `.nullish().default(null)`: ausente e `null` passam a significar a
mesma coisa (não foi dito). O caso virou teste de regressão:
`aceita resposta que omite os campos opcionais`.

---

## Testar o webhook sem a Meta

A assinatura precisa ser gerada com o mesmo `WHATSAPP_APP_SECRET` do `.env`:

```bash
SECRET="seu-app-secret"
BODY='{"object":"whatsapp_business_account","entry":[{"id":"1","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"1","phone_number_id":"1"},"contacts":[{"profile":{"name":"João"},"wa_id":"5531999990002"}],"messages":[{"id":"wamid.teste123","from":"5531999990002","timestamp":"1754000000","type":"text","text":{"body":"hoje concretamos a laje do bloco B, 12 metros de concreto"}}]}}]}]}'

SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -d "$BODY"
```

Esperado: `{"recebido":true}` e, nos logs do worker, a extração acontecendo.

> Reenvie o mesmo comando: o `wamid.teste123` repetido deve ser ignorado pela
> deduplicação. Para um novo teste, troque o id.

### Verificação do webhook (GET)

```bash
curl "http://localhost:3000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=12345"
# → 12345
```

---

## Verificar o isolamento entre clientes

O teste que mais importa numa aplicação multi-tenant.

**Primeiro, confirme que o papel está sujeito às policies.** Superusuário
ignora Row-Level Security — sempre, sem exceção — então rodar a verificação com
o usuário errado dá um falso positivo tranquilizador:

```sql
SELECT * FROM verificar_isolamento();
--  papel      | superusuario | bypassrls | rls_ativo
--  obraia_app | f            | f         | t          ← esperado
```

Se `rls_ativo` vier `false`, este papel enxerga **todos os tenants** e o teste
abaixo não prova nada. O usuário criado por `POSTGRES_USER` no Compose (aqui,
`obraia`) é superusuário: use-o para migrations, nunca para a aplicação.

```sql
SET ROLE obraia_app;

-- Sem tenant definido: nenhuma linha (falha fechada)
SELECT count(*) FROM obras;                    -- 0

-- Com tenant: só as obras daquela empresa
SET app.empresa_id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) FROM obras;                    -- 2

-- Tentar ler outra empresa
SET app.empresa_id = '99999999-9999-9999-9999-999999999999';
SELECT count(*) FROM obras;                    -- 0
```

---

## Lacunas assumidas

Ditas explicitamente:

- **Sem testes de integração ponta a ponta** (webhook → fila → banco). Exigem
  Postgres e Redis reais; o caminho natural é Testcontainers.
- **Sem teste do gerador de PDF.** Comparar bytes de PDF é frágil; o teste útil
  seria de snapshot visual.
- **Sem teste de carga.** Antes de produção, vale medir o comportamento com
  rajada de áudios simultâneos — é o padrão real de fim de expediente.
- **`BiService` sem cobertura.** Os cálculos de curva S e projeção merecem
  testes com dados sintéticos.
