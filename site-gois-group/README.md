# Site da Gois Group

Site oficial da Gois Group, empresa de desenvolvimento de sites, plataformas e sistemas web.

O conceito se chama **Plano de Corte**: todo site tem duas camadas, a superfície que o cliente vê e a
estrutura que decide se ela funciona. O site deixa o visitante passar de uma para a outra, no corte do
topo da página inicial e no modo "Ver por dentro", disponível em qualquer página.

É um site estático (Next.js 16 com `output: 'export'`, React 19 e TypeScript, CSS com tokens e CSS
Modules). O resultado do build é a pasta `out/`, que pode ser publicada em qualquer servidor de arquivos.

## Onde está cada decisão

| Documento | Conteúdo |
|---|---|
| [`docs/direcao-criativa.md`](docs/direcao-criativa.md) | Especificação criativa final e fonte da verdade: conceito, voz (§3), tokens (§4), marca (§5), cada seção e página com a copy final (§6 a §15), transições e microinterações (§16, §17), SEO (§18), acessibilidade (§19), performance (§20), implementação e gates (§21), pendências (§22) e o que foi cortado (§23). |
| [`docs/brief.md`](docs/brief.md) | Pedido do cliente e restrições do projeto. |

A copy da especificação é final. Quando o texto do site precisar mudar, a mudança começa na especificação.

## Requisitos

- **Node.js 22.18 ou mais recente** (ou 24). O site compila a partir do Node 20.9, mas a verificação de
  conteúdo executa os arquivos de `content/` com o *type stripping* do Node. Sem ele, a verificação cai
  para uma leitura aproximada e avisa.
- npm.

## Comandos

```bash
npm ci                    # instala as dependências
npm run dev               # desenvolvimento em http://localhost:3000
npm run build             # build estático em out/
npm run build:homolog     # build de homologação: mostra o que falta preencher (ver "Modos")
npm run pendencias        # checklist de tudo o que falta, por arquivo
npm run typecheck         # TypeScript
npx serve out             # serve o build localmente
```

Para salvar o checklist num arquivo: `npm run --silent pendencias > pendencias.md`.

O `npm run build` roda, antes, `scripts/derive-tokens.mjs` (valores publicados derivados dos tokens) e
`scripts/check-content.mjs` (os gates de conteúdo) e, depois, `scripts/measure-build.mjs` (as medições do
Case Nº 000, em `out/metrics.json`).

## Modos: produção e homologação

| | Homologação | Produção |
|---|---|---|
| Como ligar | `NEXT_PUBLIC_SITE_ENV` com qualquer valor diferente de `production` (ou ausente) | `NEXT_PUBLIC_SITE_ENV=production` |
| Indexação | `robots.txt` com `Disallow: /` e `noindex` em todas as páginas | liberada, com sitemap |
| Dado pendente | com `NEXT_PUBLIC_SHOW_PENDING=1` (o `build:homolog`), a instrução exata entre colchetes, com a etiqueta PENDENTE; páginas-modelo das empresas e dos cases placeholder, com `noindex` | neutro: "Espaço reservado", "Pendente", "—". Nenhum nome simulado, nenhuma página de placeholder |
| Gates de conteúdo | só falham as regras que valem para os dois modos; o resto é aviso | qualquer bloqueio interrompe o build |

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Domínio oficial, com `https://` e sem barra final. Entra no canonical, no Open Graph, no JSON-LD e no sitemap. Sem ela, o site usa `https://gois-group.example`, visivelmente provisório. **Obrigatória em produção.** |
| `NEXT_PUBLIC_SITE_ENV` | `production` liga os bloqueios de publicação e a indexação. Qualquer outro valor é homologação. |
| `NEXT_PUBLIC_SHOW_PENDING` | `1` mostra as instruções dos dados pendentes e gera as páginas-modelo. Só em homologação: em produção, o build falha. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | E-mail exibido no site (contato, rodapé, menu) e destino do envio por `mailto:`. |
| `NEXT_PUBLIC_CONTACT_ENDPOINT` | Endereço `https://` que recebe o formulário de contato em JSON. |
| `NEXT_PUBLIC_BUILD_SHA`, `NEXT_PUBLIC_BUILD_DATE` | Versão e data publicadas. Definidas sozinhas em `next.config.ts` (hash do git e data do build). |
| `PERMITIR_SINAL_FALHO` | `1` libera o deploy mesmo que o site de uma empresa "em operação" não responda (ver "Publicar"). |

Pelo menos um canal de contato (`NEXT_PUBLIC_CONTACT_EMAIL` ou `NEXT_PUBLIC_CONTACT_ENDPOINT`) é
obrigatório em produção.

As variáveis podem vir do painel do serviço de hospedagem ou de um arquivo `.env.production.local` na raiz
do projeto (fora do git: `.env*.local` está no `.gitignore`). A verificação de conteúdo lê os mesmos
arquivos `.env` do `next build`, na mesma ordem.

## Conteúdo: como preencher

Todo o conteúdo fica em `content/`. Duas marcas indicam o que ainda depende da Gois Group:

- **`pending('[…]')`** é um dado factual que só a Gois Group pode fornecer: nomes, números, datas,
  contatos, dados legais. O texto entre colchetes diz exatamente o que falta. Para publicar o dado, troque
  `pending('[…]')` pelo valor real.
- **`validar('…')`** é uma frase de compromisso ou de oferta que a Gois Group precisa confirmar que
  pratica. Ela aparece no site normalmente, mas o build de produção falha enquanto não for aprovada. Para
  aprovar: `validar('…', true)`. Se a frase não for verdade para a Gois Group, reescreva-a ou retire-a.

Nenhum dado é inventado: enquanto um campo estiver pendente, o site mostra o estado neutro (produção) ou
a instrução (homologação). `npm run pendencias` lista tudo, por arquivo e linha.

### Dados institucionais: `content/site.ts`

| Campo | Formato | Onde aparece |
|---|---|---|
| `email` | vem de `NEXT_PUBLIC_CONTACT_EMAIL` | contato, rodapé, menu |
| `redes` | `[{ rede: '<nome da rede>', url: 'https://<perfil oficial>' }]` | rodapé e `sameAs` do JSON-LD; só redes oficiais |
| `razaoSocial`, `cnpj` | texto | rodapé e política de privacidade |
| `fundacao` | ano, texto | Sobre |
| `fundadores` | `['<nome>', …]` | Sobre |
| `marcos` | `[{ ano: '<ano>', marco: '<o que aconteceu>' }]` | Sobre |
| `prazoResposta` | texto | contato; só aparece quando informado |
| `inicioDoSite` | `'AAAA-MM'` | período do Case Nº 000 e `dateCreated` do JSON-LD |
| `privacidade` | ver abaixo | `/privacidade/` |

Uma célula do rodapé ou uma seção do Sobre sem dado real simplesmente não aparece.

### Política de privacidade: `site.privacidade`

O formulário de contato coleta dados pessoais, então a política é obrigatória (LGPD) e bloqueia a
publicação enquanto estiver pendente. Preencha `controlador`, `retencao`, `compartilhamento` (o provedor
que recebe o formulário), `encarregado` e `textoJuridico`, e marque `publicada: true`. Só então a página
entra no sitemap e é indexada.

### Empresas do ecossistema: `content/empresas.ts`

Hoje o arquivo tem quatro placeholders (`empresa-01` a `empresa-04`, com `placeholder: true` e
`publicar: false`). Em produção, eles aparecem só como "Espaço reservado", no máximo três. Para publicar
uma empresa real, com autorização dela, substitua um placeholder pelos dados reais:

| Campo | Formato |
|---|---|
| `slug` | endereço da página: `/empresas/<slug>/` (minúsculas, hífens) |
| `codigo` | `'E-01'`, `'E-02'`… |
| `ordem` | posição no mapa do ecossistema (1, 2, 3…) |
| `placeholder`, `publicar` | `false` e `true` para uma empresa real e autorizada |
| `nome` | nome oficial |
| `logoSvg`, `logoAlt` | só se a empresa fornecer o logo, em SVG monocromático, com o texto alternativo |
| `segmento` | segmento de mercado |
| `descricao` | uma frase, até 160 caracteres |
| `status` | `'em-operacao'`, `'em-construcao'` ou `'em-evolucao'` |
| `relacao` | `'estrutura-construida'`, `'estrutura-operada'`, `'empresa-do-grupo'` ou `'parceira'` |
| `desde` | mês e ano |
| `website` | endereço completo, com `https://` |
| `escopo` | o que a Gois Group construiu: `[{ item: 'site', texto: '<um parágrafo>' }]`; `item` é `'site'`, `'plataforma'`, `'sistema'`, `'produto'` ou `'reconstrucao'` |
| `numeros` | até três medidas, no formato de "Números" abaixo |
| `caseSlug` | o `slug` do case relacionado, se houver |

Com três empresas reais, os espaços reservados somem. Retire os placeholders que sobrarem à medida que as
empresas reais entram. O status "em operação" é conferido antes de cada deploy (ver "Publicar").

### Números: `content/numeros.ts` e o formato `Medida`

Todo número publicado tem definição, fonte, período e data de verificação:

```ts
{
  id: 'lancados',
  rotulo: 'Sites e sistemas lançados',
  definicao: 'Sites, plataformas e sistemas colocados no ar pela Gois Group.',
  calculo: 'manual',            // 'derivado' = calculado pelo próprio site
  valor: <número>,
  fonte: '<de onde vem o número>',
  periodo: '<período medido>',
  verificadoEm: 'AAAA-MM',
}
```

Um `valor` preenchido sem `fonte`, `periodo` ou `verificadoEm` quebra o build, em qualquer modo. "Empresas
no ecossistema" e "Segmentos atendidos" são derivados das empresas publicadas: não se editam à mão.

### Cases: `content/cases.ts`

O **Case Nº 000** é o próprio site, e as métricas dele são geradas a cada build. Os cases `case-01` e
`case-02` são placeholders: em produção viram linhas "Espaço reservado para case", sem página. Um case
real, com autorização escrita da empresa, preenche:

- `numero` (`'001'`, `'002'`…), `slug`, `placeholder: false`, `publicar: true`;
- `titulo`, `tese` (uma frase, até 160 caracteres), `empresaSlug`, `estrutura`, `periodo`
  (`{ inicio, lancamento }`), `status`, `website`;
- `capitulos`: `problema`, `oportunidade`, `estrategia`, `construcao`, `passouAExistir` e `resultado`;
- `stack` (opcional): `[{ tecnologia, paraQue }]`;
- `metricas`: cada uma com `antes`, `depois`, `metodo` e os campos de `Medida`. Métrica com valor e sem
  fonte, período ou método quebra o build.

### Contato

O formulário envia um `POST` em JSON para `NEXT_PUBLIC_CONTACT_ENDPOINT`:

```json
{ "tipo": "…", "campos": { }, "origem": "…", "pagina": "…", "enviadoEm": "<data ISO>", "versaoSite": "<hash>" }
```

Como o site é estático e o envio parte do navegador, o endpoint precisa aceitar requisições do domínio do
site (CORS). Sem endpoint e com e-mail, o formulário abre o aplicativo de e-mail com a mensagem pronta.

### Compromissos a validar

Estão em `content/metodo.ts` (critérios de passagem do Método Prumo), `content/capacidades.ts` e
`content/copy/*.ts` (ofertas, compromissos, textos do contato e da privacidade). A lista completa, com
arquivo e linha, sai em `npm run pendencias`. A especificação explica cada grupo em §22.2.

## O que bloqueia a publicação

`scripts/check-content.mjs` roda antes de todo build (spec §21.3):

| Regra | Homologação | Produção |
|---|---|---|
| `validar(…)` sem aprovação | lista | **falha** |
| Número com valor e sem fonte, período ou data de verificação | **falha** | **falha** |
| Métrica de case com valor e sem fonte, período ou método | **falha** | **falha** |
| Placeholder com `publicar: true` | **falha** | **falha** |
| Empresa ou case publicado sem nome ou título | **falha** | **falha** |
| Nenhum canal de contato | aviso | **falha** |
| `NEXT_PUBLIC_SITE_URL` ausente ou provisório | aviso | **falha** |
| Política de privacidade não publicada ou com dado pendente | aviso | **falha** |
| Mais de 3 espaços reservados numa página | **falha** | **falha** |
| Caracteres que não existem nas fontes do site: setas, "menor ou igual", círculos de status, o sinal de numeral e o espaço fino U+202F | **falha** | **falha** |
| Palavras vetadas pela voz da marca (spec §3) | aviso | **falha** |
| `NEXT_PUBLIC_SHOW_PENDING=1` num build de produção | — | **falha** |
| Unidade separada do número por espaço comum (use U+00A0) | aviso | aviso |

As mensagens dizem o arquivo, a linha e o que fazer. Setas e marcadores do site são sempre SVG
(`components/sistema/Icone.tsx`, `StatusMarcador.tsx`); unidades usam o espaço inseparável de
`lib/formatar.ts`.

Se uma palavra vetada for necessária em sentido literal, marque a linha com o comentário
`// check-content: ignorar` (na mesma linha ou na de cima). Caracteres fora da fonte não têm liberação.

## Publicar

1. Resolva os bloqueios: canal de contato, domínio, política de privacidade e compromissos a validar.
   `npm run pendencias` mostra o que falta.
2. Se houver empresas publicadas com status "em operação", confira se os sites delas respondem:

   ```bash
   node scripts/checar-sinais.mjs
   ```

   O script faz um `HEAD` em cada `website`, com tempo máximo de 8 s. Resposta 2xx ou 3xx passa; qualquer
   outra, erro de rede ou tempo esgotado interrompe o deploy com a lista de falhas. Para publicar mesmo
   assim, `PERMITIR_SINAL_FALHO=1 node scripts/checar-sinais.mjs`: o override fica registrado no log.
3. Gere o build de produção:

   ```bash
   NEXT_PUBLIC_SITE_ENV=production \
   NEXT_PUBLIC_SITE_URL=https://<domínio oficial> \
   NEXT_PUBLIC_CONTACT_EMAIL=<e-mail> \
   npm run build
   ```

4. Publique o conteúdo de `out/` em qualquer servidor de arquivos estáticos (Netlify, Vercel, Cloudflare
   Pages, um bucket S3 com CDN, nginx, Apache…), na raiz do domínio.

No servidor:

- Cada página é uma pasta com `index.html` (`/sobre/` é `out/sobre/index.html`). O servidor precisa
  entregar o `index.html` de uma pasta, o comportamento padrão de quase todos.
- A página de erro é `out/404.html`. Configure o servidor para usá-la em endereços inexistentes (no nginx,
  `error_page 404 /404.html;`; no Apache, `ErrorDocument 404 /404.html`).
- Os arquivos de `/_next/static/` têm hash no nome e podem ter cache longo e imutável. HTML, `robots.txt`,
  `sitemap.xml` e `metrics.json` não.

## Marca e imagens geradas

Tudo é gerado por script e commitado. Rode de novo só se a origem mudar.

| Script | Gera | A partir de |
|---|---|---|
| `scripts/build-marca.py` (`npm run marca`, Python com fontTools) | `public/marca/wordmark.svg`, `lockup.svg`, `simbolo.svg` e `components/marca/wordmark.generated.ts` | Archivo em `wght 640`, `wdth 112` |
| `scripts/gerar-icones.mjs` | `app/icon.svg` (variante de 32 px; em tema claro do navegador, breu), `app/apple-icon.png` (180 × 180) e `public/marca/simbolo-512.png` (logo do JSON-LD) | símbolo de `components/marca/Simbolo.tsx` |
| `scripts/gerar-og.mjs` (usa Playwright) | `public/og/default.png` (1200 × 630), imagem de Open Graph e do X | copy de `content/site.ts`, símbolo, wordmark, tokens e a Archivo |
| `scripts/gerar-ruido.mjs` | `public/textura/ruido.png` (ruído do hero) | semente fixa |
| `scripts/derive-tokens.mjs` (no `prebuild`) | `content/generated/derivados.json` (fora do git) | `styles/tokens.css` |
| `scripts/measure-build.mjs` (no `postbuild`) | `out/metrics.json` | arquivos da página inicial em `out/` |

## Estrutura

```
app/          rotas (App Router), layout, ícones, robots e sitemap
components/   marca, layout, hero, seções da Home, ecossistema, cases, contato, "Ver por dentro", sistema
content/      conteúdo tipado: site, empresas, cases, números, método, capacidades e copy/ (textos por página)
lib/          tipos de conteúdo (pending, validar), ambiente, formatação pt-BR, SEO, contraste, breakpoints
styles/       tokens, base, tipografia, grade, motion e utilitários
scripts/      gates, geração de marca e imagens, medições
public/       marca, imagem de Open Graph, textura
docs/         direção criativa e brief
```

## Verificação de conteúdo em detalhe

`scripts/check-content.mjs` não tem dependências e lê o projeto de duas formas:

1. **Leitura estática** de `content/`, `components/`, `app/`, `lib/` e `hooks/`: strings, texto e
   atributos de JSX, chamadas `validar()` e `pending()`, caracteres e palavras. Comentários não contam.
2. **Execução** dos arquivos de `content/` com o *type stripping* do Node: os valores reais de cada medida,
   placeholder e campo da privacidade, e o texto exato de cada pendência, com a linha de onde saiu.

```bash
node scripts/check-content.mjs            # relatório curto; código de saída 1 quando há falha
node scripts/check-content.mjs --listar   # checklist em Markdown (npm run pendencias)
```
