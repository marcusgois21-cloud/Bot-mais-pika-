# Instalação

## Requisitos

- Docker e Docker Compose (caminho recomendado), **ou**
- Node.js 20+, PostgreSQL 16+ e Redis 7+ instalados localmente

---

## 1. Configurar o ambiente

```bash
cp .env.example .env
```

Abra o `.env`. Para subir e ver o painel, o mínimo é:

| Variável | Como obter |
|---|---|
| `OPENAI_API_KEY` | <https://platform.openai.com/api-keys> |
| `JWT_SECRET` | qualquer string longa: `openssl rand -hex 32` |

As variáveis do WhatsApp podem ficar com valores de placeholder enquanto você
não conectar um número real — a API sobe, mas o webhook rejeita chamadas.

---

## 2. Subir com Docker

```bash
docker compose up -d
docker compose logs -f api
```

Isso levanta cinco serviços:

| Serviço | Porta | Papel |
|---|---|---|
| `postgres` | 5432 | banco (migrations rodam sozinhas na primeira subida) |
| `redis` | 6379 | fila e cache de conversa |
| `api` | 3000 | webhook + API do painel |
| `worker` | — | consome a fila: transcrição, extração, visão |
| `web` | 3001 | painel Next.js |

Verifique:

```bash
curl localhost:3000/health
```

Resposta esperada:

```json
{ "status": "ok", "banco": "ok", "fila": { "waiting": 0, "active": 0 } }
```

### Popular com dados de demonstração

```bash
docker compose exec -T postgres psql -U obraia -d obraia < db/seed.sql
```

Cria a "Construtora Aurora" com duas obras, equipe, materiais e cronograma.
Login do painel: `ana@aurora.com.br` / `obraia123`.

> Ajuste os telefones em `db/seed.sql` para os seus números reais antes de
> testar pelo WhatsApp — é o telefone que identifica o usuário.

---

## 3. Rodar sem Docker

```bash
# banco
createdb obraia
psql obraia -f db/migrations/001_schema.sql
psql obraia -f db/migrations/002_rls.sql

# API
cd apps/api
npm install
npm run start:dev      # http://localhost:3000

# worker (outro terminal)
npm run worker:dev

# painel (outro terminal)
cd apps/web
npm install
npm run dev            # http://localhost:3001
```

---

## 4. Conectar o WhatsApp

### 4.1 Criar o app na Meta

1. Acesse <https://developers.facebook.com> → **Meus apps** → **Criar app** →
   tipo **Empresa**.
2. Adicione o produto **WhatsApp**.
3. Em **API Setup**, copie:
   - **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary access token** → `WHATSAPP_ACCESS_TOKEN`
4. Em **Configurações → Básico**, copie **Chave secreta do app** →
   `WHATSAPP_APP_SECRET`.
5. Invente um valor qualquer para `WHATSAPP_VERIFY_TOKEN` (você vai repetir no
   passo seguinte).

> O token temporário expira em 24h. Para produção, gere um token permanente por
> usuário do sistema em **Business Settings → Users → System Users**.

### 4.2 Expor o webhook

A Meta precisa alcançar sua máquina. Em desenvolvimento:

```bash
npx localtunnel --port 3000
# ou: ngrok http 3000
```

### 4.3 Cadastrar o webhook

No painel da Meta, **WhatsApp → Configuration → Webhook**:

- **Callback URL**: `https://SEU-TUNEL/webhook/whatsapp`
- **Verify token**: o mesmo `WHATSAPP_VERIFY_TOKEN` do `.env`
- Clique em **Verify and save**
- Em **Webhook fields**, assine `messages`

Se a verificação falhar, veja os logs: `docker compose logs api | grep -i webhook`.

### 4.4 Cadastrar seu número

O telefone é a identidade do usuário. Insira o seu no banco:

```sql
INSERT INTO usuarios (empresa_id, nome, telefone, perfil)
VALUES ('11111111-1111-1111-1111-111111111111', 'Seu Nome', '5531999999999', 'mestre');

INSERT INTO obra_equipe (obra_id, usuario_id, papel)
SELECT '55555555-5555-5555-5555-555555555551', id, 'mestre'
  FROM usuarios WHERE telefone = '5531999999999';
```

Formato: E.164 **sem** o `+` — `5531999999999`.

### 4.5 Testar

Mande um áudio para o número de teste do app:

> "Hoje terminamos a concretagem"

Resposta esperada:

> Entendido. Pra fechar o RDO de hoje:
> 1️⃣ Qual bloco foi concretado?
> 2️⃣ Quantos m³ de concreto?

Responda e o RDO é fechado.

---

## Problemas comuns

**O webhook devolve 403 e nada chega**
A assinatura não confere. Confirme que `WHATSAPP_APP_SECRET` é a *chave secreta
do app* (não o token de acesso) e que a API subiu com `rawBody: true` — a
validação usa o corpo bruto da requisição.

**"Este número atende apenas equipes cadastradas"**
O telefone não está em `usuarios`. Confira o formato: sem `+`, sem espaço,
sem parênteses.

**O áudio chega mas o RDO não aparece**
O worker provavelmente não está rodando ou falhou:
```bash
docker compose logs -f worker
curl localhost:3000/health   # olhe "waiting" na fila
```

**"Configuração inválida" ao subir**
A validação de ambiente rejeitou o `.env`. A mensagem lista exatamente qual
variável está faltando ou malformada.

**A IA não identifica a obra**
Adicione apelidos usados no canteiro:
```sql
UPDATE obras SET apelidos = ARRAY['aurora','obra do centro'] WHERE id = '...';
```
