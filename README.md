# ObraIA

**Gestão de obras pelo WhatsApp, com IA.** O mestre de obras manda um áudio —
_"hoje concretamos o bloco B, gastamos uns 12 metros de concreto"_ — e a
plataforma transcreve, estrutura, pergunta o que faltou, gera o RDO (Relatório
Diário de Obra), baixa o estoque e alimenta o painel do engenheiro.

Sem app novo para instalar no canteiro. Sem planilha. Praticamente sem digitação.

---

## Por que existe

O gargalo da obra não é falta de sistema — é que **ninguém preenche o sistema**.
O engenheiro não fica no canteiro o dia todo e o mestre não vai parar o serviço
para preencher formulário. O RDO acaba escrito de memória, incompleto, dias
depois.

A ObraIA move a captura do dado para onde o time já está (WhatsApp) e para o
formato que ele já usa (voz e foto), no momento em que o serviço acontece.

## O loop principal

```
Áudio no WhatsApp
   └─> webhook (responde 200 na hora)
         └─> fila
               └─> transcrição (Whisper)
                     └─> extração estruturada (LLM + function calling)
                           ├─ faltou dado? -> pergunta objetiva no WhatsApp
                           └─ completo?    -> RDO + estoque + alertas + PDF
```

Uma regra de negócio dura atravessa todo o sistema: **a IA nunca inventa dado que
não foi dito.** Se o volume de concreto não veio no áudio, o campo fica pendente e
a IA pergunta — não estima. RDO é documento técnico e, às vezes, jurídico.

## Stack

| Camada | Tecnologia |
|---|---|
| Canal | WhatsApp Business Platform (Cloud API) |
| API | Node.js 20 + NestJS + TypeScript |
| Banco | PostgreSQL 16 (multi-tenant com Row-Level Security) |
| Fila / cache | Redis + BullMQ |
| IA | Whisper (voz) + LLM com function calling (extração) |
| Painel | Next.js 14 + React + Tailwind |
| Infra | Docker Compose → Kubernetes |

## Estrutura do repositório

```
.
├── apps/
│   ├── api/                 API NestJS (webhook, IA, domínio, relatórios)
│   └── web/                 Painel Next.js
├── db/
│   ├── migrations/          SQL versionado (schema + RLS)
│   └── seed.sql             Dados de demonstração
├── docs/
│   ├── ARQUITETURA.md       Decisões técnicas e diagramas
│   ├── INSTALACAO.md        Subir o projeto localmente
│   ├── DEPLOY.md            Produção (AWS / Kubernetes)
│   ├── TESTES.md            Como testar, incluindo o webhook
│   └── MELHORIAS.md         Roadmap e evoluções futuras
├── docker-compose.yml
└── .env.example
```

## Começar em 3 comandos

```bash
cp .env.example .env      # preencha as chaves (veja docs/INSTALACAO.md)
docker compose up -d      # sobe Postgres, Redis, API e painel
curl localhost:3000/health
```

Painel em <http://localhost:3001> · API em <http://localhost:3000>.

O guia completo — incluindo como conectar um número real do WhatsApp e como
simular mensagens sem a Meta — está em [docs/INSTALACAO.md](docs/INSTALACAO.md).

## Documentação

- [Arquitetura](docs/ARQUITETURA.md) — como as peças se encaixam e por quê
- [Instalação](docs/INSTALACAO.md) — ambiente local, credenciais, webhook
- [Deploy](docs/DEPLOY.md) — produção, escala e observabilidade
- [Testes](docs/TESTES.md) — unitários, integração e simulação do WhatsApp
- [Melhorias futuras](docs/MELHORIAS.md) — visão computacional, BI preditivo

## Conformidade

O sistema trata dados pessoais (voz, imagem, funcionários citados, localização).
A LGPD foi considerada no design, não depois: retenção configurável de mídia,
trilha de auditoria, isolamento por tenant no banco e consentimento no
onboarding. Detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md#lgpd).

## Licença

MIT.
