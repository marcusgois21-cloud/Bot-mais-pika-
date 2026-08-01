# Deploy

## Antes de ir para produção

Lista curta e obrigatória:

- [ ] **`DATABASE_URL` conectando como `obraia_app`, não como superusuário** —
      superusuário ignora Row-Level Security e o isolamento entre clientes deixa
      de valer (veja abaixo)
- [ ] `JWT_SECRET` gerado com `openssl rand -hex 32` (nunca o valor de exemplo)
- [ ] Token **permanente** do WhatsApp (o de teste expira em 24h)
- [ ] `STORAGE_DRIVER=s3` com bucket privado
- [ ] Postgres gerenciado com backup automático e PITR
- [ ] Redis com persistência (AOF) ativada
- [ ] HTTPS obrigatório — a Meta não entrega webhook em HTTP
- [ ] `NODE_ENV=production`
- [ ] Segredos em gerenciador (Secrets Manager / Vault), não em `.env` no host

---

## O usuário do banco (não pule este passo)

**Superusuário do PostgreSQL ignora Row-Level Security.** Não existe policy que
o segure. Se a aplicação conectar como superusuário, todo o isolamento
multi-tenant vira decoração: as policies existem e simplesmente não são
aplicadas — sem erro, sem aviso, com um cliente enxergando dados de outro.

O usuário criado por `POSTGRES_USER` na imagem oficial do Postgres é
superusuário. Use-o **apenas** para rodar migrations.

```sql
-- criado pela migration 002; defina a senha:
ALTER ROLE obraia_app WITH PASSWORD 'senha-forte-gerada-aleatoriamente';
```

```bash
DATABASE_URL=postgresql://obraia_app:senha-forte@host:5432/obraia
```

Confirme depois de subir:

```sql
SELECT * FROM verificar_isolamento();   -- rls_ativo deve ser true
```

---

## Token permanente do WhatsApp

O token de API Setup expira. Para produção:

1. **Business Settings → Users → System Users** → criar usuário do sistema
2. Atribuir o app do WhatsApp com permissão de administrador
3. **Generate token** → marcar `whatsapp_business_messaging` e
   `whatsapp_business_management`
4. Escolher validade **Never**

---

## Opção 1 — Docker Compose (VPS)

Suficiente para as primeiras dezenas de clientes.

```bash
git clone <repo> obraia && cd obraia
cp .env.example .env && vim .env
docker compose up -d
docker compose up -d --scale worker=3   # mais vazão de IA
```

Nginx à frente:

```nginx
server {
  listen 443 ssl http2;
  server_name api.obraia.com.br;

  ssl_certificate     /etc/letsencrypt/live/api.obraia.com.br/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.obraia.com.br/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Áudio de canteiro pode ser grande; o padrão de 1 MB rejeitaria mídia.
    client_max_body_size 30M;
  }
}
```

---

## Opção 2 — Kubernetes (AWS EKS)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: obraia-api
spec:
  replicas: 2
  selector:
    matchLabels: { app: obraia-api }
  template:
    metadata:
      labels: { app: obraia-api }
    spec:
      containers:
        - name: api
          image: <registry>/obraia-api:1.0.0
          ports: [{ containerPort: 3000 }]
          envFrom:
            - secretRef: { name: obraia-secrets }
          resources:
            requests: { cpu: 200m, memory: 256Mi }
            limits:   { cpu: 1,    memory: 512Mi }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 10
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 30
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: obraia-worker
spec:
  replicas: 3
  selector:
    matchLabels: { app: obraia-worker }
  template:
    metadata:
      labels: { app: obraia-worker }
    spec:
      # Encerramento tem que esperar a transcrição em curso: matar no meio
      # deixaria o áudio sem RDO e sem aviso ao usuário.
      terminationGracePeriodSeconds: 60
      containers:
        - name: worker
          image: <registry>/obraia-api:1.0.0
          command: ["node", "dist/worker.js"]
          envFrom:
            - secretRef: { name: obraia-secrets }
          resources:
            requests: { cpu: 300m, memory: 512Mi }
            limits:   { cpu: 2,    memory: 1Gi }
```

Autoescala do worker pelo tamanho da fila (KEDA), não por CPU — a carga é de
I/O esperando a API de IA, então a CPU fica baixa mesmo com fila cheia:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: obraia-worker
spec:
  scaleTargetRef: { name: obraia-worker }
  minReplicaCount: 2
  maxReplicaCount: 20
  triggers:
    - type: redis
      metadata:
        address: redis:6379
        listName: "bull:obraia:mensagens:wait"
        listLength: "20"
```

---

## Infraestrutura AWS sugerida

| Componente | Serviço | Observação |
|---|---|---|
| Banco | RDS PostgreSQL 16 | Multi-AZ, backup 7 dias, PITR |
| Cache/fila | ElastiCache Redis 7 | com AOF |
| Mídia | S3 | bucket **privado**, acesso por URL assinada |
| Contêineres | EKS ou ECS Fargate | |
| Segredos | Secrets Manager | |
| CDN | CloudFront | só para o painel |
| Logs | CloudWatch | retenção 30 dias |

Região `sa-east-1` (São Paulo): latência e residência de dados no Brasil, o que
também facilita o argumento de LGPD.

---

## Migrations

No Compose, os arquivos de `db/migrations/` rodam automaticamente na **primeira**
subida do volume do Postgres. Em produção, aplique de forma controlada:

```bash
psql "$DATABASE_URL" -f db/migrations/001_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_rls.sql
```

Regra: migration nova é sempre um arquivo novo, numerado. Nunca edite uma
migration já aplicada em produção.

---

## Observabilidade

O que realmente importa monitorar aqui:

| Métrica | Por quê | Alerta |
|---|---|---|
| Fila `waiting` | Workers caídos ou insuficientes | > 100 por 5 min |
| Jobs `failed` | Áudio que virou nada para o usuário | qualquer aumento |
| Latência de transcrição | Degradação do provedor de IA | p95 > 30s |
| `/health` | Disponibilidade | 2 falhas seguidas |
| Custo de IA/dia | Principal custo variável | acima do orçado |
| RDOs/obra ativa/dia | **Métrica de produto**: adoção real | < 0,5 |

A última é a que prevê churn. Cliente que para de mandar áudio parou de usar o
produto, mesmo que a assinatura continue ativa.

---

## Backup e recuperação

```bash
# diário
pg_dump "$DATABASE_URL" -Fc -f obraia_$(date +%F).dump
aws s3 cp obraia_$(date +%F).dump s3://obraia-backups/

# restauração
pg_restore -d "$DATABASE_URL" --clean --if-exists obraia_2026-08-12.dump
```

Teste a restauração periodicamente. Backup nunca verificado não é backup.

---

## Escala — o que quebra primeiro

Em ordem de chegada:

1. **Cota da API de IA.** É o primeiro teto. Mitigação: cache de transcrição
   por hash de áudio, fila com prioridade, contrato com cota maior.
2. **Conexões do Postgres.** Cada worker abre pool próprio. Acima de ~20
   réplicas, use PgBouncer em modo transaction.
3. **Rate limit da Cloud API.** A Meta limita mensagens por segundo por número.
   Vários números por tenant resolvem.
4. **Storage de mídia.** Áudio e foto crescem rápido. Política de ciclo de vida
   no S3 movendo para Glacier após `MEDIA_RETENTION_DAYS`.
