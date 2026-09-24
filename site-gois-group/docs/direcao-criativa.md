# GOIS GROUP: especificação criativa final, "Plano de Corte"

> **Status:** versão final para implementação. Direção executiva sobre três propostas concorrentes e três pareceres.
> **Cliente:** Gois Group, **empresa de desenvolvimento de sites**. Constrói sites, plataformas web, sistemas e produtos digitais, que são a estrutura digital das empresas.
> **Stack:** Next.js 16 (App Router, `output: 'export'`, `trailingSlash: true`), React 19, TypeScript, CSS com custom properties e CSS Modules. Não usa GSAP, three.js, framer-motion nem Tailwind. Idioma `pt-BR`.
> **Projeto-alvo:** `site-gois-group/`. O scaffold já tem `app/`, `lib/pending.ts` (`pending()`, `Maybe<T>`, `isPending`, `known`), `lib/env.ts` (`SITE_URL`) e `hooks/useReducedMotion.ts`. Esta spec parte dele e não o substitui.

---

## 0. Como ler este documento

| Marca | Significado | Efeito no build |
|---|---|---|
| `[PENDENTE]` | Dado factual que só a Gois Group pode fornecer: nomes, números, datas, contatos, dados legais. | Vira `pending('[…]')` em `content/`. Aparece no site no estado "dado pendente" (§7). Alguns bloqueiam a publicação (§22). |
| `[VALIDAR]` | Frase de compromisso ou de oferta que a Gois Group precisa confirmar que pratica. | Vira `validar('texto')` em `content/`. **O build de produção falha** enquanto houver `[VALIDAR]` sem `aprovado: true`. |
| `x,xx s` · `xxx KB` · `{hash}` · `{data}` | Formato do valor, nunca um valor. | Nenhum número de exemplo existe no código nem na interface. |
| **"Copy"** | Texto final que vai ao ar exatamente como está escrito. | Fica centralizado em `content/copy/*.ts`. |
| `Texto → /rota/` | Notação desta spec para "link com este texto, para este destino". **A seta não faz parte da copy.** No site, toda seta é o ícone SVG de §4.6. | — |

**Regras de honestidade que valem para tudo:**
1. Nenhum dado factual inventado.
2. Nenhuma frase afirma que empresas ou cases existem enquanto forem placeholder.
3. Nenhum número sem fonte.
4. Nenhum rótulo de medição diferente do que a medição mede.

---

## 1. Decisão executiva

### 1.1 Base e enxertos
**A base é "Plano de Corte" (direção Sistema).** Ela venceu dois dos três júris e tem o mecanismo mais proprietário: um site que se deixa ver por dentro. Só faz sentido para quem constrói sites.

Enxertos:
- **Da direção Estrutura:**
  - ofício dito no primeiro segundo;
  - headline pintada sólida em t=0;
  - coluna "Pronto quando" e coluna "Como verificar";
  - nome **Método Prumo**;
  - H1 do Sobre;
  - convenção de traço como gramática de estado;
  - medida com fonte obrigatória (tipo `Medida`, §21.2);
  - no máximo 3 espaços reservados;
  - SVG enxuto;
  - o padrão "o que todo case terá";
  - build que falha sem canal de contato.
- **Da direção Luz:**
  - "O que precisa entrar no ar?" como título da seção 08;
  - acento como dado;
  - status por forma e por texto;
  - `checar-sinais`;
  - "Velocidade é respeito.";
  - tagline "A estrutura por trás do que aparece.";
  - SEO completo;
  - `<DadoPendente>` visível em homologação;
  - separação entre `[PENDENTE]` e `[VALIDAR]`;
  - setas em SVG;
  - regras de motion testáveis;
  - a página 404;
  - a estrutura de pastas.

### 1.2 Correções de rumo (ofício: sites)
| Direção | Desvio | Correção |
|---|---|---|
| Sistema | "Construímos a estrutura." não diz *sites* e soa como construtora ou holding. "L0 Fundação Gois… design system comum a todas" afirma infraestrutura que não sabemos se existe. "CRM com resposta automatizada" é falso para este site. | Nova headline com "sites" dentro dela. O modelo L0–L5 foi eliminado. A capacidade é descrita só com o que este site realmente faz. |
| Luz | "Colocamos empresas no ar." pode ser lida como venture builder ou como emissora de TV. A Visão tem retórica de fundo de investimento. O cinema transbordou para o site inteiro. | "No ar" fica só onde é o idioma de publicar um site (título da 08). Todo o vocabulário de cinema foi cortado. |
| Estrutura | O canteiro de obra (zarcão, subsolo, prancha, núcleo rígido, linha de carga, reforço estrutural) obriga a decodificar uma obra para entender que ali se fazem sites. | O vocabulário de metáfora do site inteiro fica limitado a **três termos**: *corte*, *superfície*, *Prumo* (nome do método). "Estrutura" não conta, porque para sites é literal. |

### 1.3 Registro de decisões (onde as direções conflitavam)
| # | Tema | Decisão | Justificativa (1 linha) |
|---|---|---|---|
| D1 | Headline | **"Construímos sites de dentro para fora."** | Nomeia o ofício, é uma tese contestável que o corte demonstra na tela e dialoga com o H1 do Sobre. |
| D2 | "Colocamos empresas no ar" | Vira o título da seção 08: "O que precisa entrar no ar?" | Onde se fala de publicar, o idioma é exato e a leitura de venture builder desaparece. |
| D3 | Símbolo | Novo: **G em corte**, retilíneo com fenda vertical (§5). | O G circular com barra horizontal tinha a topologia do G do Google. A fenda é por onde passa a linha do corte do hero. |
| D4 | Mecanismo do hero | O corte revela **uma camada de linhas e anotações atrás do texto sólido**, e nunca esconde texto. | Mantém o conceito da Sistema e cumpre "H1 real, sólido, LCP em t=0". |
| D5 | Visual gerado | Levantamento: deriva do layout medido da página, em SVG com cerca de 10 nós e rótulos em HTML. | Proprietário porque é o site medindo a si mesmo. A BSP/Mondrian é genérica. |
| D6 | Piloto automático | Cortado. | WCAG 2.2.2 e o princípio "nada se move sozinho depois da abertura". |
| D7 | Modo Estrutura | Vira **"Ver por dentro"**, fora do header: rodapé, seção 07, Sobre, menu mobile e 404. | O header fica extremamente limpo e a promessa "qualquer página pode ser vista por dentro" continua verdadeira. |
| D8 | Tipografia | Archivo (arquivo só `wght`, 34,9 KB) + Martian Mono (23,6 KB). O eixo `wdth` só entra no wordmark convertido em SVG. | Arquivos verificados; o fallback calibrado vale; nada de CLS no swap. |
| D9 | Mono | **Mono = medida ou código. Nada mais.** Rótulos de seção e eyebrow em Archivo. | Tira a identidade do default convergente "label mono + hairline". |
| D10 | Contadores "01 / 08" | Cortados. Os rótulos de seção são só palavras. | Evita a leitura de folha de especificação e o default convergente. |
| D11 | Códigos | Só três famílias: `P1–P6` (fases), `Nº 000` (cases), `E-01` (empresas). | Só onde ajudam a navegar e a referenciar. |
| D12 | Nome do acento | **Rubrica `#FF5A1F`**. | Tem um nome e um racional só. Zarcão e Tungstênio saem. |
| D13 | Ecossistema | **Mapa com centro**: nós ligados à Gois Group por conexões ortogonais, e a seleção vira um corte em Rubrica. | Lê como sistema sem virar bento, gráfico de barras nem constelação. É honesto com zero empresas. |
| D14 | Teclado no ecossistema | Lista de links com Tab simples, sem roving tabindex. A ficha é `aria-hidden`. | Até 12 itens: o padrão mais simples e correto. Evita o conflito entre Tab e setas e o `aria-live` verborrágico. |
| D15 | Método (UI) | Disclosures (`button[aria-expanded]` + painel). Exclusivo no desktop, independente no mobile, **um DOM só**. | Resolve "tabs sem hover" e "um DOM por componente" ao mesmo tempo. |
| D16 | Formulário | Página única com revelação progressiva. | Wizard esconde campos e erros. |
| D17 | Medição ao vivo | Fora do hero, na seção 07, com degradação campo a campo. | Nenhum "não disponível" no primeiro viewport. |
| D18 | Case Nº 000 | Aparece também na Home (07). | É a única prova real hoje. |
| D19 | Magnetismo | Mantido: no máximo 3 px, só nos CTAs primários. | O brief pede, e é aplicado com contenção. |
| D20 | Hover com hachura em CTAs | Cortado. | O botão sólido já mostra a área clicável. Seria enfeite. |
| D21 | Seção em papel | Só a Visão, revelada por varredura CSS ligada ao scroll (só `transform`). | É a mudança de iluminação pedida, sem repintar na thread principal. |
| D22 | LGPD no formulário | Aviso em texto, sem checkbox. `[VALIDAR jurídico]` | Responder a um contato é procedimento pré-contratual. Menos atrito. |
| D23 | Números na Home | 4 campos do brief. O p75 de LCP dos sites entregues só aparece quando confirmado. | Evita uma parede de vazios e mantém a métrica de qualidade para quando houver dado. |
| D24 | Textura | Ruído só no fundo do hero, sem camada fixa em tela cheia. | Evita banding sem deixar uma camada de composição permanente. |
| D25 | Placeholder | Produção mostra "Espaço reservado" (neutro). Homologação mostra "[EMPRESA 01 — nome a confirmar]". | O público nunca vê um nome simulado. O cliente vê exatamente o que falta preencher. |

### 1.4 Teste dos cinco segundos (primeiro viewport, qualquer dispositivo)
O visitante lê, nesta ordem:
1. eyebrow: "Gois Group — desenvolvimento de sites, plataformas e sistemas web";
2. H1: "Construímos **sites** de dentro para fora.";
3. subtítulo: "Projetamos e desenvolvemos **sites**…";
4. CTA: "Iniciar um projeto".

A palavra *sites* aparece três vezes antes do primeiro scroll, e nenhuma interação é necessária para entender o ofício.

---

## 2. Conceito

### Nome: **PLANO DE CORTE**
**Em uma frase:** todo site tem duas camadas, a superfície que o cliente vê e a estrutura que decide se ela funciona. A Gois Group constrói as duas, e o próprio site deixa o visitante passar de uma para a outra e conferir, com medidas reais, que nada ali está por acaso.

### O mecanismo, em três peças
1. **O corte (hero).**
   - Uma linha vertical de 1 px em Rubrica divide o topo da Home.
   - À esquerda fica a superfície: a página como o cliente a vê.
   - À direita, a mesma página por dentro: grade, linhas de leitura, caixas e medidas, geradas a partir do layout real, atrás do texto (que continua sólido).
   - A linha sai da fenda do símbolo.
   - No desktop, segue o cursor. No teclado, é um controle deslizante. No mobile, acompanha o scroll.
2. **Ver por dentro (global).** Um botão, fora do header, liga a mesma camada em qualquer página do site.
3. **Case Nº 000: "Este site."** A única prova real hoje, com números gerados a cada versão publicada e medições da visita feitas no navegador de quem visita.

### Por que é da Gois Group
- **É literal para este negócio.** Só quem vende a camada de baixo tem motivo para abrir o próprio site.
- **Transforma a restrição em prova.** Sem cases nem números publicáveis, o site mostra o único dado verificável que existe: ele mesmo.
- **O sistema não se separa.** O símbolo é a alça do corte. A Rubrica só aparece onde há corte, seleção ou foco. O gesto do corte (esquerda para a direita = construir, direita para a esquerda = voltar) aparece no hero, nos títulos, nas transições e na Visão. Quem copia uma peça isolada não leva a marca junto.
- **Não envelhece como efeito.** Não usa 3D, glow, gradiente nem estética de terminal. Usa medida, grade e tipografia.

---

## 3. Verbal

| Peça | Copy |
|---|---|
| Tagline (assinatura: OG, bio, `slogan` do schema, célula de marca do rodapé) | **A estrutura por trás do que aparece.** |
| Headline do hero | **Construímos sites de dentro para fora.** |
| Frase de fechamento (rodapé) | **A superfície muda. A estrutura fica.** |
| Frase de assinatura de método | **Construímos para acumular.** (fecho da Visão) |

### Manifesto (abre o Sobre; uma linha por verso)
> Todo site tem duas camadas.
> A que o cliente vê — e a que decide se ela funciona.
> Nós construímos as duas, com o mesmo rigor, no mesmo projeto.
> Estratégia, desenho e código, medidos pelo mesmo critério:
> o que sustenta o negócio fica. O resto sai.
> Por isso qualquer página deste site pode ser vista por dentro.

### Orçamento de metáfora (fechado)
- **Permitidos:** *corte*, *superfície*, *Prumo* (só como nome do método, explicado uma vez).
- **Proibidos no texto do site:**
  - canteiro: zarcão, subsolo, prancha, carimbo, núcleo rígido, linha de carga, reforço estrutural, planta, lote, fundação como metáfora;
  - cinema: storyboard, créditos, estreia, programa, sinal, plano-sequência;
  - dicionário ("s.f.");
  - camadas L0–L5.

### Regras de voz
- Cada frase ou é **verificável** ou é uma **convicção declarada como convicção**.
- Verbo antes de adjetivo. Frases curtas. Primeira pessoa do plural.
- Vetado: soluções, inovação, excelência, transformar, impulsionar, apaixonados, sob medida, personalizado, sinergia, disruptivo, "próximo nível", "de ponta", qualquer superlativo, "toda empresa já é software", "as empresas que vão importar…".
- Número só com fonte. Até dez, por extenso no texto corrido.
- Jargão técnico só como **segunda linha**, sempre sob uma frase em linguagem de negócio.

---

## 4. Tokens

### 4.1 Cor (`styles/tokens.css`)

```css
:root {
  color-scheme: dark;
  /* primitivos */
  --breu:#0B0B0A; --grafite-1:#121211; --grafite-2:#1A1A18; --grafite-3:#242421;
  --linha:#2A2A27; --linha-forte:#3C3B37; --linha-ui:#6E6D67;
  --giz:#EEEDE8; --branco:#FFFFFF; --cinza-2:#A9A8A1; --cinza-3:#8F8E87;
  --rubrica:#FF5A1F;
  --papel:#E9E7E0; --papel-2:#DEDCD4; --tinta:#0B0B0A; --tinta-2:#4A4944; --tinta-3:#62615B;
  --linha-papel:#C9C7BF; --papel-ui:#7A7872;

  /* semânticos */
  --bg:var(--breu); --surface-1:var(--grafite-1); --surface-2:var(--grafite-2); --surface-3:var(--grafite-3);
  --line:var(--linha);            /* decorativa: divisórias, baselines */
  --line-deco:var(--linha-forte); /* decorativa: arestas de coluna, hachura */
  --line-ui:var(--linha-ui);      /* INFORMATIVA: bordas de controle, conectores, marcador reservado (≥3:1) */
  --text-1:var(--giz); --text-2:var(--cinza-2); --text-3:var(--cinza-3);
  --accent:var(--rubrica); --focus-ring:var(--rubrica);
  --btn-bg:var(--giz); --btn-bg-hover:var(--branco); --btn-fg:var(--breu);
  --selection-bg:var(--giz); --selection-fg:var(--breu);

  /* luz e textura (as únicas do site) */
  --luz-hero: radial-gradient(1200px 800px at 12% -10%, rgb(238 237 232 / .035), transparent 70%);
  --hachura: repeating-linear-gradient(135deg, rgb(238 237 232 / .06) 0 1px, transparent 1px 6px);
  --edge-light: inset 0 1px 0 rgb(238 237 232 / .05);
  --shadow: none;
}
[data-surface="papel"] {
  --bg:var(--papel); --surface-2:var(--papel-2); --line:var(--linha-papel); --line-ui:var(--papel-ui);
  --text-1:var(--tinta); --text-2:var(--tinta-2); --text-3:var(--tinta-3);
  --focus-ring:var(--tinta); --accent:transparent;   /* a Rubrica não existe sobre papel */
  --selection-bg:var(--tinta); --selection-fg:var(--papel);
}
@media (prefers-contrast: more) {
  :root { --line-ui:var(--cinza-2); --hachura:none; --line-deco:var(--linha-ui); }
}
@media (forced-colors: active) {
  :root { --focus-ring: Highlight; }
  /* camadas decorativas de estrutura: display:none (§19) */
}
```

**Contraste (fórmula WCAG 2.x, calculado sobre estes HEX)**

| Par | Razão | Uso | Veredito |
|---|---|---|---|
| giz / breu | 16,80:1 | texto primário | AAA |
| giz / grafite-2 · grafite-3 | 14,87 · 13,28 | texto em painéis | AAA |
| breu / giz · breu / branco | 16,80 · 19,69 | texto do botão primário (repouso · hover) | AAA |
| cinza-2 / breu · grafite-2 · grafite-3 | 8,25 · 7,31 · 6,52 | corpo secundário | AAA · AAA · AA |
| cinza-3 / breu · grafite-2 · grafite-3 | 5,99 · 5,30 · 4,73 | rótulos, metadados | AA (em grafite-3, só ≥ 12 px) |
| rubrica / breu · grafite-1 · grafite-2 | 6,31 · 6,01 · 5,59 | corte, anel de foco, seleção | ≥ 3:1 não-texto |
| linha-ui / breu · grafite-1 · grafite-2 | 3,79 · 3,61 · 3,36 | bordas de campo, conectores, marcador reservado | passa 1.4.11 (proibido sobre grafite-3: 3,00) |
| tinta · tinta-2 · tinta-3 / papel | 15,91 · 7,29 · 5,02 | Visão | AAA · AAA · AA |
| papel-ui / papel | 3,57 | bordas sobre papel | passa 1.4.11 |
| linha-forte / breu | 1,76 | só decoração | nunca carrega informação |
| linha / breu | 1,37 | só decoração | nunca carrega informação |
| **rubrica / papel** | **2,52** | — | **proibido** |
| **giz / rubrica** | **2,66** | — | **proibido** (nunca texto sobre Rubrica) |

**A Rubrica (`#FF5A1F`).** Nos manuscritos, a tinta vermelha marcava a estrutura do texto: títulos e divisões. Em português, *rubricar* também é aprovar uma página. Aqui ela marca **onde o visitante escolhe ver por dentro, escolhe examinar ou está agindo**.

Aparece **somente** em:
1. a linha do corte do hero;
2. o caminho selecionado no mapa do ecossistema;
3. a marca vertical da fase aberta no Método;
4. o anel de foco sobre fundo escuro;
5. o quadrado de 6×6 que indica "Ver por dentro" ligado.

Nunca aparece em:
- texto, títulos ou logo;
- botões e hover de links;
- preenchimentos com mais de 2 px, gradientes, glows;
- dados, gráficos ou estado de erro;
- sobre papel.

**Regra da única:** no máximo um objeto em Rubrica por viewport em repouso.

### 4.2 Tipografia

**Fontes (Fontsource v5.3.0)**

| Papel | Pacote npm (exato) | Arquivo em `node_modules/<pacote>/` | Eixos | Peso do arquivo | Preload |
|---|---|---|---|---|---|
| Display, texto e UI | `@fontsource-variable/archivo` | `files/archivo-latin-wght-normal.woff2` | `wght` 100–900 | 34,9 KB | **sim** (fonte do LCP) |
| Medida e código | `@fontsource-variable/martian-mono` | `files/martian-mono-latin-wght-normal.woff2` | `wght` 100–800 | 23,6 KB | não |
| Só para gerar o wordmark (build) | `@fontsource-variable/archivo` | `files/archivo-latin-standard-normal.woff2` | `wght` + `wdth` 62–125 | 90 KB | nunca vai ao site |

**Métricas conferidas nos arquivos:**
- Archivo: UPM 1000; ascendente 878; descendente 210; lineGap 0; versal 686; altura-x 526; `USE_TYPO_METRICS` ligado.
- Martian Mono: ascendente 1000; descendente 200; altura-x 600; avanço de 0,700 em.

**Cobertura conferida no cmap** (vale para as duas famílias, exceto o espaço fino):
- **Presentes:** · — – º ª × … “ ” ‘ ’ © − ↓ ↑ U+00A0.
- **Espaço fino U+2009:** só na Archivo.
- **Ausentes nas duas:** → ← ↗ ≤ ● ○ ◐ № U+202F. Por isso: todas as setas e todos os marcadores de status são **SVG inline**; unidades usam U+00A0; nenhum desses caracteres entra na copy.

```ts
// app/fonts.ts
import localFont from 'next/font/local'
export const archivo = localFont({
  src: '../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2',
  weight: '100 900', style: 'normal', display: 'swap', preload: true,
  variable: '--font-archivo', adjustFontFallback: 'Arial', fallback: ['Arial', 'sans-serif'],
})
export const martian = localFont({
  src: '../node_modules/@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2',
  weight: '100 800', style: 'normal', display: 'swap', preload: false,
  variable: '--font-martian', adjustFontFallback: false,
  fallback: ['Martian Fallback', 'ui-monospace', 'monospace'],
})
```
```css
/* styles/base.css — fallback calibrado da mono (0,700 ÷ 0,600) */
@font-face { font-family:'Martian Fallback'; src: local('Courier New'), local('Menlo'); size-adjust:116.7%; }
:root { --font-sans: var(--font-archivo), Arial, sans-serif;
        --font-mono: var(--font-martian), 'Martian Fallback', ui-monospace, monospace; }
```

**Escala fluida (360 → 1440 px; congelada acima de 1440)**

A razão máximo ÷ mínimo é ≤ 2,5 em todos os níveis, o que garante que o zoom de 200% sempre aumenta o texto (WCAG 1.4.4).

| Token | Uso | `font-size` | px @360 → @1440 | Família · peso | Leading | Tracking |
|---|---|---|---|---|---|---|
| `--fs-hero` | H1 do hero | `clamp(3rem, 1.5rem + 6.667vw, 7.5rem)` | 48 → 120 | Archivo 620 | 0,94 | −0,035em |
| `--fs-display-xl` | Visão, frase do rodapé, 404, 08 | `clamp(2.5rem, 1.25rem + 5.556vw, 6.25rem)` | 40 → 100 | Archivo 600 | 0,96 | −0,03em |
| `--fs-display-l` | H2 de seção, H1 interno | `clamp(2rem, 1.083rem + 4.074vw, 4.75rem)` | 32 → 76 | Archivo 580 | 1,0 | −0,025em |
| `--fs-display-m` | subtítulos grandes, nomes de empresa e case, itens do menu | `clamp(1.625rem, 1.167rem + 2.037vw, 3rem)` | 26 → 48 | Archivo 560 | 1,05 | −0,02em |
| `--fs-numeral` | Números | `clamp(2.75rem, 1.5rem + 5.556vw, 6.5rem)` | 44 → 104 | Archivo 600, `tabular-nums lining-nums` | 0,9 | −0,04em |
| `--fs-title` | H3, termos, fases | `clamp(1.25rem, 1.042rem + 0.926vw, 1.875rem)` | 20 → 30 | Archivo 540 | 1,2 | −0,01em |
| `--fs-lead` | subtítulo, leads | `clamp(1.125rem, 1.021rem + 0.463vw, 1.4375rem)` | 18 → 23 | Archivo 420 | 1,4 | −0,005em |
| `--fs-body` | corpo | `clamp(1rem, 0.958rem + 0.185vw, 1.125rem)` | 16 → 18 | Archivo 400 | 1,6 | 0 |
| `--fs-eyebrow` | eyebrow, rótulos de seção | `clamp(0.9375rem, 0.896rem + 0.185vw, 1.0625rem)` | 15 → 17 | Archivo 500 | 1,4 | 0 |
| `--fs-small` | nav, notas, legendas | `clamp(0.875rem, 0.854rem + 0.093vw, 0.9375rem)` | 14 → 15 | Archivo 400/500 | 1,5 | 0,005em |
| `--fs-label` | **mono**: códigos, status, medidas | `clamp(0.6875rem, 0.667rem + 0.093vw, 0.75rem)` | 11 → 12 | Martian 500, CAIXA ALTA | 1,3 | +0,04em |
| `--fs-micro` | **mono**: 2ª linha técnica das anotações (sempre redundante) | `clamp(0.625rem, 0.604rem + 0.093vw, 0.6875rem)` | 10 → 11 | Martian 400, CAIXA ALTA | 1,3 | +0,02em |

**Regras de composição:**
- Títulos em caixa de frase com ponto final. Caixa alta só no wordmark e na mono. Sem itálico. Sem texto vazado. Sem gradiente em texto.
- `text-wrap: balance` em títulos e `text-wrap: pretty` em parágrafos. `hyphens: manual`.
- Medida máxima: corpo 64ch, lead 44ch.
- **H1 do hero (medido na Archivo 620, com tracking):**
  - "Construímos sites" = 7,829 em; "Construímos" = 5,611 em; "de dentro" = 4,081 em; "para fora." = 4,072 em.
  - Com a escala acima, a linha mais longa ocupa no máximo 940 px a 1440 (cabem 1089 nas colunas 1–10) e 269 px a 360 (cabem 320).
  - **≥ 600 px: 3 linhas** (`Construímos sites / de dentro / para fora.`).
  - **< 600 px: 4 linhas** (`Construímos / sites / de dentro / para fora.`).
  - Não há descendentes nem acentos em colisão; leading 0,94 seguro.

**Números:**
- `Intl.NumberFormat('pt-BR')`.
- Unidade separada por U+00A0: `x,xx s`, `xxx KB`.
- `tabular-nums` em dados.
- Zeros à esquerda só em códigos (`E-01`, `P1`, `Nº 000`).
- Nada de "+", "mais de", arredondamento para cima ou contagem animada.

### 4.3 Espaço, grid e breakpoints

```css
:root {
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px;
  --s-7:48px; --s-8:64px; --s-9:96px; --s-10:128px; --s-11:192px; --s-12:256px;
  --section-y: clamp(6rem, 4rem + 8.889vw, 12rem);  /* 96 → 192 */
  --cols:4; --margin:20px; --gutter:12px; --content-max:1520px; --header-h:56px;
  --col-corte:4;                                    /* coluna onde o corte repousa (§6) */
}
@media (min-width: 600px)  { :root { --cols:8;  --margin:32px; --gutter:16px; --col-corte:7; } }
@media (min-width: 900px)  { :root { --cols:12; --margin:40px; --gutter:20px; --col-corte:11; } }
@media (min-width: 1280px) { :root { --margin:64px; --gutter:24px; --col-corte:10; } }
@media (min-width: 1680px) { :root { --margin:80px; } }

.grid { display:grid; grid-template-columns:repeat(var(--cols), minmax(0,1fr)); column-gap:var(--gutter);
        padding-inline:var(--margin); max-width:calc(var(--content-max) + 2 * var(--margin)); margin-inline:auto; }
```

| Nome | Faixa | Colunas | Margem | Gutter | Header | Hero: anotações |
|---|---|---|---|---|---|---|
| `xs` | < 600 | 4 | 20 | 12 | menu | legenda de 1 linha |
| `sm` | 600–899 | 8 | 32 | 16 | menu | legenda de 1 linha |
| `md` | 900–1279 | 12 | 40 | 20 | completo | legenda de 1 linha |
| `lg` | 1280–1679 | 12 | 64 | 24 | completo | 5 anotações |
| `xl` | ≥ 1680 | 12 | 80, conteúdo máx. 1520 | 24 | completo | 5 anotações |

`lib/breakpoints.ts` exporta `{ sm: 600, md: 900, lg: 1280, xl: 1680 }`. É a única fonte para `matchMedia`, usada só para **comportamento**, nunca para DOM.

- **Ritmo:** `--section-y` no topo e na base de cada seção. Rótulo → título: 24 px. Título → lead: 32 px. Lead → conteúdo: 64 px.
- **Vazio medido:** toda seção desktop deixa pelo menos 3 colunas vazias de propósito. O vazio é marcado com `<div data-dentro-vazio aria-hidden="true">` e aparece rotulado no modo "Ver por dentro".

### 4.4 Forma, profundidade, camadas
```css
:root {
  --radius:0;                 /* tudo reto; única exceção: o indicador do radio (50%) */
  --hairline:1px;
  --control-h:48px; --control-h-sm:36px; --target-min:44px;
  --z-estrutura:0; --z-conteudo:1; --z-corte:2; --z-dentro:40; --z-header:50; --z-pill:55; --z-menu:60;
}
```
- Nenhuma sombra projetada.
- A profundidade vem de três coisas:
  - degraus de superfície (breu, grafite-1, grafite-2, grafite-3);
  - `--edge-light` em blocos elevados;
  - a única luz: `--luz-hero`, com o ruído de 96×96 px (`/textura/ruido.png`, cerca de 2 KB) a 2,5% **como background do próprio hero**, nunca como camada fixa.
- A hachura tem um único significado: **reservado ou pendente**.

### 4.5 Motion
```css
:root {
  --dur-1:90ms;   /* pressão, cor curta */
  --dur-2:160ms;  /* hover, sublinhado, rótulos */
  --dur-3:240ms;  /* ficha, painéis, header, fases */
  --dur-4:320ms;  /* transição de página, menu, intro curta */
  --dur-5:560ms;  /* títulos revelados por corte */
  --dur-6:640ms;  /* varredura do corte na abertura */
  --dur-7:720ms;  /* traçado da linha do Método */
  --ease-cut:  cubic-bezier(.16, 1, .3, 1);   /* decidido na saída, pousa suave: corte, revelações */
  --ease-move: cubic-bezier(.65, 0, .35, 1);  /* transferências: páginas, morphs, header */
  --ease-draw: cubic-bezier(.55, 0, .1, 1);   /* linhas que se desenham */
  --ease-exit: cubic-bezier(.5, 0, .75, 0);   /* saídas (raras) */
  --stagger:40ms; --stagger-max:240ms; --reveal-y:16px;
}
@media (max-width: 599px) { :root { --stagger:30ms; --reveal-y:8px; } }
@media (prefers-reduced-motion: reduce) {
  :root { --dur-3:0ms; --dur-5:0ms; --dur-6:0ms; --dur-7:0ms; --dur-4:120ms; --reveal-y:0px; --stagger:0ms; }
}
```
Animações ligadas ao scroll usam `linear`, porque a curva é do próprio usuário.

### 4.6 Ícones (SVG inline, `viewBox="0 0 12 12"`, `stroke="currentColor"`, `stroke-width="1.5"`, `stroke-linecap="square"`, `fill="none"`, `aria-hidden="true"`)
| Nome | `d` |
|---|---|
| seta-direita | `M1 6H10.5M6.5 2L10.5 6L6.5 10` |
| seta-esquerda | `M11 6H1.5M5.5 2L1.5 6L5.5 10` |
| seta-baixo | `M6 1V10.5M2 6.5L6 10.5L10 6.5` |
| seta-cima | `M6 11V1.5M2 5.5L6 1.5L10 5.5` |
| externo | `M3 9L9.5 2.5M4 2.5H9.5V8` |
| erro (14×14) | `<rect x=".75" y=".75" width="12.5" height="12.5"/>` + `M7 3.5V8.5M7 10.25V10.5` |

**Marcadores de status** (`viewBox="0 0 10 10"`, sempre acompanhados do texto do status):

| Status | Desenho | Cor |
|---|---|---|
| Em operação | `<rect width="10" height="10" fill="currentColor"/>` | `--text-1` |
| Em construção | `<rect x=".75" y=".75" width="8.5" height="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/>` | `--text-2` |
| Em evolução | contorno de construção + `<path d="M.75 9.25V.75L9.25 9.25Z" fill="currentColor"/>` | `--text-2` |
| Espaço reservado / pendente | `<rect x=".5" y=".5" width="9" height="9" fill="none" stroke="currentColor" stroke-dasharray="1 2"/>` | `--line-ui` |

---

## 5. Marca

### 5.1 Símbolo: "G em corte"
Um G retilíneo atravessado por **uma fenda vertical** na parte de baixo, à direita. A fenda é o corte. A linha em Rubrica do hero sai exatamente dela. A topologia (quadrado, boca no alto à direita, fenda vertical) não se confunde com o G circular com barra horizontal.

Grade mestre: 48 × 48 unidades, módulo de 4. Espessura de 8 unidades (2 módulos). Fenda de 4 unidades (1 módulo).

```svg
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill="currentColor" d="M0 0H48V8H8V40H28V48H0Z"/>        <!-- corpo: topo inteiro, haste esquerda, base até a fenda -->
  <path fill="currentColor" d="M32 20H48V48H32V40H40V28H32Z"/>   <!-- queixo: barra interna, haste direita, base depois da fenda -->
</svg>
```
**Geometria:**
- barra superior (0,0)–(48,8);
- haste esquerda (0,0)–(8,48);
- base esquerda (0,40)–(28,48);
- **fenda x 28–32, de y 20 a y 48**;
- barra interna (32,20)–(48,28);
- haste direita (40,20)–(48,48);
- base direita (32,40)–(48,48);
- boca: x 40–48, y 8–20.

Fica nítido em múltiplos de 12 px: a 24 px, o módulo tem 2 px e a fenda também tem 2 px.

**Variantes hintadas (pixel exato):**
```svg
<!-- 16 px -->  <path d="M0 0H16V3H3V13H9V16H0Z"/><path d="M11 7H16V16H11V13H13V10H11Z"/>
<!-- 32 px -->  <path d="M0 0H32V5H5V27H19V32H0Z"/><path d="M22 13H32V32H22V27H27V18H22Z"/>
```
As variantes foram renderizadas e conferidas a 16, 24, 32, 48, 96 e 160 px: a leitura de G se mantém em todos os tamanhos.

**Alça do corte (hero):**
- o símbolo a 24 px, em giz, no topo da linha;
- a linha de 1 px em Rubrica nasce na base da fenda (x = 14 px dentro do símbolo de 24) e desce até a base do hero;
- é o único lugar onde o símbolo toca a Rubrica, e mesmo ali o símbolo continua giz.

### 5.2 Wordmark
- Texto: `GOIS GROUP`, em Archivo **wght 640, wdth 112**, CAIXA ALTA, tracking +0,06 em.
- Largura medida: 7,885 em, ou seja, **11,49 × a altura de versal (h)**.
- É **convertido em contornos no build**, uma única vez, por `scripts/build-marca.py`:
  1. instanciar `archivo-latin-standard-normal.woff2` em `{wght:640, wdth:112}` com `fontTools.varLib.instancer`;
  2. aplicar o tracking;
  3. exportar com `SVGPathPen` para `public/marca/wordmark.svg` e `public/marca/lockup.svg`.
- A licença OFL permite a conversão. O arquivo `standard` nunca vai ao site.

### 5.3 Lockup horizontal
- Símbolo com altura **S = 2h**, centrado verticalmente na altura de versal. Espaço entre símbolo e texto: **0,75h**.
- **Header:** h = 12 px, S = 24 px, espaço de 9 px, wordmark com cerca de 138 px. Lockup total com cerca de 171 px.
- Área de proteção: h em todos os lados.
- Mínimos: símbolo de 16 px (usar a variante hintada); lockup com 120 px de largura.
- Cores: giz sobre escuro, tinta sobre papel.
- **Proibido:**
  - Rubrica, contorno, gradiente ou sombra no logo;
  - girar ou esticar;
  - separar as duas peças do símbolo;
  - wordmark em outra largura ou peso.

### 5.4 Ícones do navegador
| Arquivo | Conteúdo |
|---|---|
| `app/icon.svg` | Variante 32, fill `#EEEDE8`. Com `<style>@media (prefers-color-scheme: light){path{fill:#0B0B0A}}</style>`. |
| `app/apple-icon.png` | 180×180 px, fundo breu, símbolo mestre com 108 px centrado. |
| `public/marca/simbolo-512.png` | Para o `logo` do JSON-LD. |

---

## 6. Hero

### 6.1 Composição
**Desktop, `lg`/`xl`** (referência 1440 × 900):
- **Caixa:**
  - `min-height: clamp(640px, 100svh, 1000px)`;
  - `padding-top: calc(var(--header-h) + clamp(40px, 10svh, 128px))`;
  - `padding-bottom: 64px`;
  - hairline `--line` na base, de ponta a ponta.
- **Fundo:** `var(--luz-hero), url(/textura/ruido.png) repeat, var(--bg)`, com o ruído a 2,5%.
- **Conteúdo** (`.grid`, z 1), sempre visível e sólido desde o primeiro paint:
  - eyebrow nas colunas 1–8, `--fs-eyebrow` 500, `--text-2`;
  - 24 px abaixo, o **H1** nas colunas 1–10, `--fs-hero`, 3 linhas, `--text-1`;
  - 40 px abaixo, o subtítulo nas colunas 1–6, `--fs-lead`, `--text-2`, máximo de 44ch;
  - 32 px abaixo, os CTAs: primário **Iniciar um projeto** (48 px, fundo giz, texto breu, padding 0 24, raio 0) e secundário **Ver como construímos** (link com sublinhado e seta para baixo em SVG).
- **Corte** (z 2):
  - linha de 1 px em Rubrica, **em repouso na borda esquerda da coluna 10** (x ≈ 1066 a 1440);
  - a linha mais longa do H1 termina em x ≈ 1004, então o corte em repouso não cruza o texto;
  - alça (símbolo de 24 px) em `top: calc(var(--header-h) + 16px)`; a linha vai da alça até a base do hero.
- **Faixa por dentro** (à direita do corte, cerca de 310 px + margem): colunas 10–12 com as linhas do Levantamento e **5 anotações** (§6.2, passo 7).
- **Dica**, só na primeira visita da sessão e só com ponteiro fino, logo à direita da alça, em `--fs-small`, `--text-3`: "Mova o cursor: à direita do corte, este site por dentro." Some depois do primeiro `pointermove` no hero (160 ms) e não volta na sessão.

**Notebook `md` (900–1279):**
- mesma composição; o corte repousa na coluna 11;
- **sem anotações**; no lugar delas, a legenda de uma linha sob os CTAs (`--fs-small`, `--text-3`): "À direita do corte: a grade, as linhas de leitura e a área de toque de cada botão desta página."

**Tablet `sm` (600–899):**
- H1 em 8 colunas; corte em repouso na coluna 7; a mesma legenda de uma linha;
- o corte acompanha o scroll como no mobile se `(pointer: coarse)`, e segue o cursor se `(pointer: fine)`.

**Mobile `xs`** (referência 390 × 844):
- H1 em 4 linhas, com 48 px a 360 e cerca de 50 px a 390;
- subtítulo em 4 colunas; CTA primário com largura total e 52 px de altura; link secundário abaixo;
- o corte **já nasce visível**, em repouso na borda esquerda da coluna 4 (x ≈ 291 a 390);
- legenda: "Role a página: o corte mostra este site por dentro.";
- tudo cabe na primeira dobra a 390 × 844.

**Markup** (Server Component, um DOM só):
```html
<section class="hero" aria-labelledby="hero-titulo">
  <div class="hero__estrutura" aria-hidden="true">                 <!-- z0, atrás do texto -->
    <div class="clip-x"><div class="clip-scroll"><div class="inner-scroll"><div class="inner-x">
      <div class="grade-css"></div>                                <!-- fallback sem JS -->
      <svg class="levantamento"></svg><div class="rotulos"></div>   <!-- preenchidos pelo CutPlane -->
    </div></div></div></div>
  </div>
  <div class="hero__conteudo grid">                                <!-- z1 -->
    <p class="eyebrow">Gois Group — desenvolvimento de sites, plataformas e sistemas web</p>
    <h1 id="hero-titulo"><span class="ln">Construímos <span class="ln-sm">sites</span></span> <span class="ln">de dentro</span> <span class="ln">para fora.</span></h1>
    <p class="sub">…</p><div class="ctas">…</div><p class="legenda">…</p>
  </div>
  <div class="hero__corte">                                        <!-- z2 -->
    <div class="cut-x"><div class="cut-scroll"><span class="alca"><Simbolo/></span><span class="linha"></span></div></div>
    <input class="cut-range" type="range" …>
    <p class="dica">…</p>
  </div>
</section>
```
- `.ln { display:block }`. `.ln-sm` é `inline` a partir de 600 px e `block` abaixo disso.
- O `textContent` do H1 é "Construímos sites de dentro para fora.".
- `.clip-x`, `.cut-x` e `.hero__estrutura` têm o tamanho da **caixa de conteúdo** da grade. `.clip-x` se estende até a borda direita do hero (`width: calc(100% + var(--margin))`).
- **Posição de repouso só com CSS** (percentual relativo à largura da caixa de conteúdo):
  `--x-rest: calc((var(--col-corte) - 1) * ((100% - (var(--cols) - 1) * var(--gutter)) / var(--cols) + var(--gutter)))`.
- **Transforms (só compositor):**
  - `.cut-x` e `.clip-x`: `transform: translateX(var(--x, var(--x-rest)))`;
  - `.inner-x`: `transform: translateX(calc(-1 * var(--x, var(--x-rest))))`;
  - `.clip-scroll` tem `overflow: hidden`;
  - as camadas `*-scroll` só se movem no mobile (§6.4).

### 6.2 Visual gerado: **Levantamento** (SVG + HTML, dentro do componente cliente `CutPlane`)
Em vez de uma subdivisão aleatória, o hero desenha um **levantamento técnico de si mesmo**, calculado a partir do layout real renderizado. Nada é injetado antes da hidratação: `CutPlane` é carregado com `next/dynamic` (`ssr:false`) e renderiza por estado do React.

1. **Montagem:** `useEffect` depois da hidratação. Aguarda `Promise.race([document.fonts.ready, espera(400)])`.
2. **Leitura da grade:**
   - `getComputedStyle(heroGrid)` fornece `--cols`, `--gutter` e `padding-inline` (margem);
   - `r = heroGrid.getBoundingClientRect()`;
   - `contentLeft = r.left + margem`; `contentW = r.width − 2·margem`;
   - `colW = (contentW − (cols−1)·g) / cols`; `colX(i) = i·(colW + g)`, com `i = 0…cols−1`, relativo à caixa de conteúdo.
3. **Linhas do H1** (vale para qualquer quebra):
   - `range.selectNodeContents(h1)` e `range.getClientRects()`, agrupando retângulos com o mesmo `top` (±1 px) em uma linha visual;
   - para cada linha: `fs` = font-size, `lh` = line-height (px);
   - `base = top + (lh − 1,088·fs)/2 + 0,878·fs`; `x = base − 0,526·fs`; `cap = base − 0,686·fs`;
   - as constantes vêm de hhea e OS/2 da Archivo.
4. **Alvos:** retângulos do eyebrow, do subtítulo e do CTA primário.
   - Contraste do CTA: `color` e `background-color` computados, depois luminância WCAG.
   - Altura do CTA: `getBoundingClientRect().height`.
5. **Lista de exibição** (uma função pura, `components/hero/levantamento.ts`, testável em Node):

   | Elemento | Geometria | Traço | Nós |
   |---|---|---|---|
   | `path.colunas` | `M{colX(i)+.5} 0V{H}` e `M{colX(i)+colW−.5} 0V{H}` para cada coluna | 1 px `--line-deco` | 1 |
   | `path.intervalos` | um retângulo por gutter, preenchido com `url(#hachura)` | — | 1 (+ `defs`, `pattern` e o `path` do padrão: 3) |
   | `path.baselines` | `M0 {y}H{W}`, com y de 24 em 24 px a partir do topo do conteúdo | 1 px `--line` | 1 |
   | `path.leitura` | `cap`, `x` e `base` de cada linha do H1, da esquerda da linha até a borda direita do hero | 1 px `--line-ui` a 70% | 1 |
   | `path.caixas` | retângulos em volta de cada linha do H1, do eyebrow, do subtítulo e do CTA | 1 px `--line-ui`, `stroke-dasharray: 4 4` | 1 |
   | `path.cotas` | (a) margem direita, horizontal a `H − 40`; (b) um gutter na faixa, a `top + 40`; (c) altura do CTA, vertical a `cta.direita + 12`. Cada uma com linha e dois traços de 6 px | 1 px `--text-3` | 1 |
   | `svg` raiz | `width=100% height=100%`, sem `viewBox` (coordenadas em px CSS), `shape-rendering: crispEdges` | — | 1 |

   São cerca de 10 nós SVG. Os rótulos ficam em **HTML** (quebram linha naturalmente): 3 rótulos de cota (mono `--fs-micro`, `--text-3`) e 5 anotações.
6. **Anotações** (só em `lg`/`xl`). Posição x = `--x-rest + 16 px`. Posição y = y do alvo. Colisões são resolvidas numa segunda passagem com `useLayoutEffect`: se a anotação i sobrepõe a anterior, desce até `anterior.bottom + 12`. Cada anotação tem duas linhas: a **principal** em linguagem de negócio (`--fs-small`, `--text-2`) e a **técnica** (mono `--fs-micro`, `--text-3`, CAIXA ALTA).

   | Âncora | Principal (copy) | Técnica |
   |---|---|---|
   | topo do eyebrow | Grade de {cols} colunas: tudo nesta página se alinha a ela. | `COLUNA {colW} PX · INTERVALO {g} PX · MARGEM {m} PX` |
   | cap da linha 1 | Título: a primeira coisa que se lê. | `ARCHIVO 620 · {fs} PX · ENTRELINHA {lh} PX` |
   | base da linha 2 | Linhas de leitura: toda letra se apoia nelas. | `VERSAL · ALTURA-X · LINHA DE BASE` |
   | meio do CTA | Botão principal: {h} px de altura, fácil de acertar. | `CONTRASTE {ratio}:1 · MÍNIMO WCAG AA 4,5:1` |
   | base do hero − 32 | Esta versão do site foi publicada em {data}. | `BUILD {hash}` |

   `{data}` e `{hash}` vêm de `NEXT_PUBLIC_BUILD_DATE` e `NEXT_PUBLIC_BUILD_SHA`. Os demais valores são arredondados para inteiro, exceto o contraste (duas casas).
7. **Re-medição:** `ResizeObserver` com debounce de 150 ms e `document.fonts` `loadingdone`. Recalcula sem nenhuma animação.

**Fallback sem JS:** `.grade-css` desenha só as colunas e os gutters com gradientes CSS dos tokens:
- arestas: `--line-deco`;
- gutters: `rgb(238 237 232 / .04)`.

A classe `html:not(.js)` mostra essa camada em repouso. Sem anotações, sem dica.

### 6.3 Interação
- **Cursor** (`(hover:hover) and (pointer:fine)`):
  - `pointermove` passivo no `<section>`. O alvo é `clamp(pointerX − contentLeft, 0, contentW)`.
  - Loop rAF **só enquanto** `|x − alvo| > 0,5 px`: `x += (alvo − x) · (1 − 0,82^(dt/16,67))`, amortecimento independente da taxa de quadros.
  - Grava `--x` em px no `<section>`.
  - Em `pointerleave`, o alvo volta ao repouso.
  - O valor do range é sincronizado com a coluna mais próxima, sem anúncio.
- **Teclado e toque:** `<input type="range" class="cut-range" min="0" max="{cols}" step="1" value="{col-corte − 1}">`.
  - Posição: faixa de 44 px de altura no topo do corte, na largura do conteúdo. O track é transparente. O thumb (44 × 44, transparente) fica sobre a alça visual.
  - `aria-label="Corte: mova para ver este site por dentro"`.
  - `aria-valuetext`: "Corte na coluna {v+1} de {cols}". Com `v = cols`: "Corte depois da última coluna".
  - Setas: uma coluna. Home: margem esquerda (a página inteira por dentro). End: margem direita.
  - A mudança é animada em 240 ms com `--ease-cut`.
  - No foco: anel Rubrica de 2 px em volta da alça (`.cut-range:focus-visible ~ .cut-x .alca`) e a dica "Setas movem o corte coluna a coluna."
  - Não há atalho de tecla única.
- **Ver por dentro ligado:** o corte vai para a margem esquerda.
- **Pausas:**
  - `IntersectionObserver` fora da tela remove os listeners e interrompe o rAF;
  - `visibilitychange` pausa;
  - em repouso: **zero trabalho por quadro**.

### 6.4 Mobile e toque (sem cursor)
O scroll move o corte **por CSS scroll-driven**, só com `transform` e dentro de `@supports (animation-timeline: view())`:
```css
@media (pointer: coarse) {
  .cut-scroll, .clip-scroll { animation: corte-sai linear both; animation-timeline: view(); animation-range: exit 0% exit 60%; }
  .inner-scroll            { animation: corte-sai-inv linear both; animation-timeline: view(); animation-range: exit 0% exit 60%; }
}
@keyframes corte-sai     { to { transform: translateX(calc(-1 * var(--x-rest))); } }
@keyframes corte-sai-inv { to { transform: translateX(var(--x-rest)); } }
```
- Rolar até 60% da altura do hero leva o corte da coluna de repouso até a margem esquerda: a página inteira "por dentro" antes de sumir.
- Sem suporte a scroll-driven: o corte fica parado em repouso. Nada se perde.
- Se o range for usado por toque, o hero ganha `.corte-manual` (`animation: none` nas camadas `*-scroll`).

### 6.5 Abertura (primeira visita da sessão, só na Home, só em carga inicial de documento)
- **T0** é o momento em que o Levantamento está pronto: normalmente 250 a 600 ms. **Teto de 1200 ms após o início da navegação**; se passar, não há intro e tudo aparece direto em repouso.

| Tempo | Evento | Duração | Easing |
|---|---|---|---|
| 0 (primeiro paint) | Header, eyebrow, **H1 sólido (LCP)**, subtítulo e CTAs visíveis. Estrutura e corte ainda ocultos. | — | — |
| T0 | Camada de estrutura: opacidade 0→1, com o corte na **margem esquerda**. A página inteira aparece por dentro, com as linhas atrás do texto sólido. | 240 ms | linear |
| T0 | Linha do corte: `scaleY 0→1` a partir do topo; alça com fade | 160 ms | `--ease-cut` |
| T0 + 320 → 960 | **O corte varre da esquerda até o repouso** (esquerda para a direita = construir). A superfície fecha sobre a estrutura. | 640 ms | `--ease-cut` |
| T0 + 960 → 1120 | Dica aparece (primeira visita, ponteiro fino) | 160 ms | linear |

- **Intro completa:** T0 + 1,12 s, normalmente 1,4 a 1,7 s desde o início da navegação. **Nenhum conteúdo espera; nada se move sozinho depois.**
- O ponteiro pode assumir a qualquer momento: um `pointermove` cancela a varredura.
- **Intro curta:** revisita na sessão, chegada por transição de página ou qualquer navegação cliente anterior. A estrutura aparece em repouso com fade de 200 ms e não há varredura.
- **Flag de sessão:** um script inline no `<head>`, **antes do primeiro paint** (§21.4), define `html[data-intro="completa"|"curta"]`. O `CutPlane` também confere `window.__ggNavegou`, que o `NavigationListener` liga na primeira mudança de rota.

### 6.6 `prefers-reduced-motion: reduce`
- Estado final em T0: estrutura em repouso, sem fade, sem varredura e sem dica animada.
- O corte **não segue** cursor nem scroll. O range funciona com saltos instantâneos.

### 6.7 Custo
- JS do `CutPlane` + `levantamento.ts`: ≤ 4 KB gz (import dinâmico após a hidratação).
- Cerca de 10 nós SVG e cerca de 18 elementos HTML de rótulo.
- Em repouso: 0 ms por quadro.
- Com o cursor: 4 transforms no compositor.
- Nenhum canvas, WebGL ou bitmap além do ruído de 2 KB.

---

## 7. Sistema de estado e placeholders

### 7.1 Convenção de traço (a única gramática de estado do site)
| Traço | Significa | Onde |
|---|---|---|
| Contínuo | Existe ou está confirmado | conectores de empresas publicadas, bordas de dados confirmados |
| Tracejado `6 4` | Em construção | caixas do Levantamento e da vista por dentro; status "em construção" nas fichas |
| Pontilhado `1 2` | Pendente ou reservado | espaços reservados, quadros de número pendente, dados pendentes em homologação |
| Hachura 45° | Reservado ou pendente (redundante com o pontilhado) | interior de espaços reservados e de quadros pendentes |

Todo traço que carrega informação usa `--line-ui` ou mais forte (≥ 3:1). O estado **sempre** vem também em texto.

### 7.2 Dois modos de exibição
| Modo | Quando | Como aparece um dado pendente |
|---|---|---|
| **Produção** | `NEXT_PUBLIC_SITE_ENV=production` | Neutro: "Espaço reservado", "Pendente", "—", "Fonte: a definir". Nenhum nome simulado, nenhuma página de placeholder, nenhum placeholder nas contagens. |
| **Homologação** | `NEXT_PUBLIC_SHOW_PENDING=1` | `<DadoPendente>` mostra a instrução exata entre colchetes, em mono `--fs-label`, com `outline: 1px dotted var(--line-ui); outline-offset: 2px`, fundo `var(--hachura)` e a etiqueta `PENDENTE`. As páginas-modelo existem, com `noindex` e a faixa "PÁGINA-MODELO — NÃO PUBLICADA. Os campos entre colchetes aguardam dados da Gois Group." |

### 7.3 Formato textual dos placeholders (homologação)
Formato: `[ENTIDADE NN — instrução em minúsculas]`. Lista canônica:

- **Empresa:**
  - `[EMPRESA 01 — nome a confirmar]`
  - `[SEGMENTO — a confirmar]`
  - `[DESCRIÇÃO — até 160 caracteres, a confirmar]`
  - `[STATUS — em operação, em construção ou em evolução]`
  - `[RELAÇÃO — estrutura construída, estrutura operada, empresa do grupo ou parceira]`
  - `[DESDE — mês/ano a confirmar]`
  - `[SITE — URL a confirmar]`
  - `[ESCOPO — o que a Gois Group construiu]`
  - `[NÚMERO — valor, fonte e período a confirmar]`
  - `[IDENTIDADE — logo em SVG monocromático, fornecido pela empresa]`
- **Case:**
  - `[CASE 01 — título a confirmar]`
  - `[EMPRESA DO CASE — a confirmar]`
  - `[PERÍODO — início e lançamento a confirmar]`
  - `[PROBLEMA — a escrever com a empresa]` (idem para oportunidade, estratégia, construção, o que passou a existir e resultado)
  - `[MÉTRICA — antes, depois, período, fonte e método a confirmar]`
- **Institucional:**
  - `[E-MAIL — a informar]`
  - `[REDES — perfis oficiais a informar]`
  - `[RAZÃO SOCIAL — a informar]`
  - `[CNPJ — a informar]`
  - `[FUNDAÇÃO — ano a informar]`
  - `[FUNDADORES — nomes a informar]`
  - `[MARCOS — a informar]`
  - `[PRAZO DE RESPOSTA — a informar]`
  - `[POLÍTICA DE PRIVACIDADE — texto jurídico a informar]`

### 7.4 Tetos
- **No máximo 3 espaços reservados visíveis** em qualquer página pública, somando empresas e cases.
- Com 1 ou 2 empresas reais, os espaços completam a composição até 3. A partir de 3 empresas reais, não há espaços.
- Espaços reservados são `aria-hidden`, não recebem foco e têm um resumo oculto para leitor de tela.

### 7.5 Placeholders propostos (em `content/`)
| Slug | Tipo | Produção | Homologação |
|---|---|---|---|
| `empresa-01`, `empresa-02`, `empresa-03` | empresa | "Espaço reservado" nos slots 1–3 do mapa; sem página | nomes entre colchetes e página-modelo com `noindex` |
| `empresa-04` | empresa | **não aparece** (respeita o teto de 3) | aparece para testar layouts com mais de 3 itens, a lista e os filtros |
| `case-01`, `case-02` | case | linhas "Nº 001 · Espaço reservado para case" e "Nº 002 · …", sem link | título entre colchetes e página-modelo com `noindex` |

---

## 8. Home: seção por seção (na ordem do brief)

**Regras comuns:**
- Cada seção tem uma hairline `--line` de ponta a ponta no topo e um rótulo em Archivo 500 `--fs-eyebrow`, `--text-3`, caixa de frase, nas colunas 1–3. **Sem números de seção.**
- Âncoras: `#quem-e`, `#o-que-construimos`, `#metodo`, `#ecossistema`, `#capacidade`, `#visao`, `#por-que`, `#proximo-passo`.
- **Revelação** (componente `Reveal`, só com `html.js` e movimento permitido):
  - IntersectionObserver com `rootMargin: 0px 0px -12% 0px`, uma vez só, com `unobserve`.
  - Títulos: **corte**, `clip-path: inset(0 100% 0 0) → inset(0)`, `--dur-5`, `--ease-cut`.
  - Corpo: `opacity 0→1` + `translateY(var(--reveal-y)) → 0`, 360 ms, 80 ms depois do título.
  - Elementos já visíveis no carregamento **não fazem revelação**.
  - Nenhum conteúdo fica oculto por mais de 1 s depois de entrar na viewport.

### Hero
Ver §6. Copy:
- **Eyebrow:** Gois Group — desenvolvimento de sites, plataformas e sistemas web
- **H1:** Construímos sites de dentro para fora.
- **Subtítulo:** Projetamos e desenvolvemos sites, plataformas e sistemas web para empresas. Começamos pela parte que não aparece — arquitetura, código, dados e velocidade — e desenhamos a que aparece com o mesmo rigor.
- **CTA primário:** Iniciar um projeto → `/contato/?origem=home-hero`
- **CTA secundário:** Ver como construímos → `#metodo`

### 01 · Quem é
**Objetivo:** fixar em uma leitura: "empresa de desenvolvimento de sites e estrutura digital".

**Layout desktop:**
- título nas colunas 1–9 (`--fs-display-l`);
- lead nas colunas 5–10; corpo nas colunas 5–9;
- colunas 1–4 ao lado do lead: vazio medido;
- três afirmações nas colunas 1–4, 5–8 e 9–12, cada uma com hairline superior; rótulo em `--fs-title` e texto em `--fs-body` `--text-2`;
- link nas colunas 5–8.

**Mobile:** empilhado.

**Copy:**
- **Rótulo:** Quem é
- **Título:** Desenvolvemos sites. E tudo o que precisa existir por baixo deles.
- **Lead:** A Gois Group é uma empresa de desenvolvimento de sites e estrutura digital. Projetamos, construímos e operamos sites, plataformas e sistemas web para empresas que precisam que a presença digital funcione como parte do negócio — não como enfeite dele.
- **Corpo:** Estratégia, design e engenharia trabalham no mesmo projeto, sob o mesmo método e medidos pelo mesmo critério: o que sustenta a empresa fica; o resto sai.
- **Afirmações:**
  - **O que aparece.** Identidade, interface e conteúdo. É por onde a empresa é julgada nos primeiros segundos.
  - **O que sustenta.** Arquitetura de informação, código, dados, integrações e velocidade. É o que decide se a primeira impressão se confirma.
  - **O que ele precisa fazer.** Ser encontrado, explicar, vender, atender, operar. Tudo o que construímos é medido por isso.
- **Link:** Sobre a Gois Group → `/sobre/`

**Motion:** título por corte; as três hairlines se desenham da esquerda para a direita (`scaleX`, 480 ms, 60 ms entre elas).

### 02 · O que construímos
**Objetivo:** deixar inequívoco o que se contrata, sem cards e sem ícones.

**Layout desktop:** `<ol>` de linhas com a largura do conteúdo e hairline superior em cada linha:
- nome nas colunas 1–3 (`--fs-display-m`);
- "para quê" (`--fs-lead`) + "inclui" (`--fs-small`, `--text-2`) nas colunas 4–8;
- "Pronto quando" (rótulo `--fs-small` 500 + critério `--fs-body`) nas colunas 9–11;
- link com seta SVG na coluna 12, com nome acessível completo.

**Mobile:** empilhado, na mesma ordem. Um DOM só: `<li>` com `<h3>` e `<dl>`.

**Copy:**
- **Rótulo:** O que construímos
- **Título:** {Cinco} tipos de estrutura. Uma engenharia.
  - O número é **derivado** da quantidade de linhas aprovadas e escrito por extenso: se "Reconstrução" não for validada, vira "Quatro".
- **Lead:** Tudo o que a Gois Group constrói roda na web — do site institucional ao sistema que a operação usa todos os dias. Muda o tamanho da estrutura. O método é o mesmo.

| Nome | Para quê | Inclui | Pronto quando | Link (texto → destino) |
|---|---|---|---|---|
| **Sites** | Onde a empresa é encontrada, entendida e escolhida. | Arquitetura de páginas · design de interface · conteúdo · SEO técnico · gerenciador de conteúdo · medição | quem chega entende o que a empresa faz e sabe qual é o próximo passo. `[VALIDAR]` | Começar por um site → `/contato/?tipo=site-novo&origem=home-02` |
| **Plataformas web** | Onde o cliente entra, usa e volta. | Áreas logadas · portais · catálogos e lojas virtuais `[VALIDAR: lojas]` · agendamentos · pagamentos · painéis do cliente | as tarefas principais são concluídas sem ajuda. `[VALIDAR]` | Começar por uma plataforma → `…tipo=plataforma-sistema…` |
| **Sistemas internos** | Onde a operação acontece sem planilha paralela. | Painéis de gestão · fluxos de aprovação · integrações com ERP e CRM · automações · permissões · relatórios | a equipe para de depender de planilhas paralelas. `[VALIDAR]` | Começar por um sistema → `…tipo=plataforma-sistema…` |
| **Produtos digitais** | Do primeiro esboço ao primeiro usuário — e aos seguintes. | Descoberta · protótipo · primeira versão · lançamento · evolução orientada por dados | a primeira versão está nas mãos de usuários reais, medindo o que foi definido na Leitura. `[VALIDAR]` | Começar por um produto → `…tipo=plataforma-sistema…` |
| **Reconstrução de sites existentes** `[VALIDAR: oferta]` | Para quando o site atual já não acompanha o que a empresa se tornou. | Auditoria · plano de migração · redirecionamentos · reconstrução por etapas · monitoramento | a nova versão supera a antiga em todas as medições da linha de base, sem ter saído do ar. `[VALIDAR]` | Começar pela auditoria → `…tipo=site-existente…` |

- **Fecho:** Não sabe qual combinação precisa? É exatamente por aí que o método começa. **Ver o Método Prumo** → `#metodo`

**Motion:**
- entrada: hairlines com `scaleX` a partir da esquerda (480 ms, `--stagger`);
- hover e `:focus-within`: hairline passa a giz, nome de `--text-2` para `--text-1`, seta avança 4 px (`--dur-2`).

### 03 · Como construímos (`#metodo`)
Conteúdo completo em §10.

**Layout desktop:**
- título nas colunas 1–6; etiqueta de versão (mono) nas colunas 7–8, alinhada à linha de base do título;
- lead nas colunas 1–7;
- trilho nas colunas 1–12;
- painel da fase aberta em três colunas: "O que acontece" (1–5), "Artefatos" (6–9), "Passa quando" (10–12).

**Copy:**
- **Rótulo:** Como construímos
- **Título:** Método Prumo.
- **Etiqueta (mono):** VERSÃO 1
- **Lead:** Prumo é o instrumento que garante que uma parede sobe reta. Em português, ter prumo também é ter juízo. O método tem os dois sentidos: precisão para construir, critério para decidir. São seis fases — e nenhuma começa antes de a anterior cumprir o seu critério.
- **Rótulo do laço de retorno:** Cada ciclo de evolução volta à Leitura — agora com dados reais.
- **Fecho:** A primeira conversa já faz parte da Leitura. **Iniciar um projeto** (botão secundário) → `/contato/?origem=home-03`

### 04 · Ecossistema (`#ecossistema`)
Conteúdo completo em §9.

**Copy:**
- **Rótulo:** Ecossistema
- **Título:** O ecossistema.
- **Lead:** As empresas cuja estrutura digital a Gois Group construiu ou opera aparecem aqui, ligadas ao centro pelo que construímos para cada uma. Só entram com autorização e com dados que possam ser conferidos.
- **Estado vazio** (logo abaixo do lead, `--fs-title`, `--text-2`): Nenhuma empresa publicada.
- **Legenda** (marcadores SVG + texto `--fs-small`): Em operação · Em construção · Em evolução · Espaço reservado
- **CTA** (só com ≥ 1 empresa publicada): Ver o ecossistema completo → `/empresas/`

### 05 · Capacidade (`#capacidade`)
Conteúdo completo em §11 e §13. Dois blocos: **05.1 Um botão** e **05.2 Números**.

**Copy:**
- **Rótulo:** Capacidade
- **Título 05.1:** Um botão atravessa quatro disciplinas.
- **Lead 05.1:** Capacidade não é uma lista de serviços. É o número de decisões certas que cabem num único elemento. Pegue o botão "Iniciar um projeto" — o mesmo do topo desta página — e veja quem decide o quê.
- **Fecho 05.1:** Na Gois Group, as quatro decisões são tomadas no mesmo projeto, sob o mesmo método. É isso que chamamos de capacidade.
- **Título 05.2** (`--fs-display-m`): Números com fonte, ou nenhum número.
- **Lead 05.2:** Cada número publicado aqui tem definição, fonte e data. Enquanto não tiver, o campo fica aberto — à vista.

### 06 · Visão (`#visao`), a única seção em papel
**Objetivo:** convicção de longo prazo. É a mudança de iluminação da Home.

**Layout:**
- `data-surface="papel"`;
- `padding-top: max(var(--section-y), 32svh)`, para que a varredura termine antes do texto entrar;
- título `--fs-display-xl` nas colunas 1–10;
- parágrafos nas colunas 7–11;
- fecho `--fs-display-m` nas colunas 1–6.

**Copy:**
- **Rótulo:** Visão
- **Título:** Um site não deveria ser refeito a cada mudança da empresa.
- **Parágrafo 1:** O site é onde a empresa é encontrada, avaliada e contratada — e, cada vez mais, onde ela trabalha. Mesmo assim, quase sempre é tratado como peça de campanha: feito para o lançamento e refeito do zero alguns anos depois.
- **Parágrafo 2:** A visão da Gois Group é a oposta: estrutura digital projetada para receber o que a empresa ainda vai precisar. Cada página, cada integração e cada dado medido servindo à próxima decisão — em vez de ir para o lixo no próximo redesenho.
- **Fecho:** Construímos para acumular.

**Motion:**
- O papel entra **por corte**, da esquerda para a direita, preso ao scroll. É o par de translates, só compositor, dentro de `@supports (animation-timeline: view())`:
  - `.visao-clip` (`overflow:hidden`) vai de `translateX(-100%)` a `0`;
  - `.visao-inner` vai de `translateX(100%)` a `0`;
  - `animation-range: entry 0% entry 25vh`.
- Sem suporte ou com reduced motion: papel estático, troca seca na borda.
- Depois disso, título por corte e parágrafos com fade.
- O header troca de tom (§15.1).

### 07 · Por que a Gois Group (`#por-que`)
**Objetivo:** trocar "confie" por "verifique". Dois blocos: compromissos e prova.

**Layout A (compromissos), desktop:** `<ol>` com hairline entre os itens:
- termo nas colunas 1–4 (`--fs-title`);
- explicação nas colunas 5–8 (`--fs-body`, `--text-2`);
- "Como verificar" nas colunas 9–12 (rótulo `--fs-small` 500 + texto `--fs-small`).

**Copy:**
- **Rótulo:** Por que a Gois Group
- **Título:** Não pedimos que acredite. Pedimos que verifique.
- **Intro:** Qualquer empresa pode prometer qualidade. Estes são pontos que você pode conferir por escrito — antes de assinar e depois de lançar.

| Termo | Explicação | Como verificar |
|---|---|---|
| Métrica antes do layout. `[VALIDAR]` | O que conta como sucesso é definido e medido na primeira fase, antes de qualquer tela. | Peça o documento de objetivos da Leitura. Ele vem antes do primeiro desenho. |
| Orçamento de desempenho. `[VALIDAR]` | Peso de página e tempo de carregamento são acordados na fase de Arquitetura. Uma entrega que estoura o orçamento não está pronta. | Teste qualquer página entregue no PageSpeed Insights. |
| Acessibilidade como critério de entrega. `[VALIDAR]` | Teclado, contraste, semântica e leitores de tela verificados contra a WCAG 2.2, nível AA, antes do lançamento. | Navegue sem mouse. Ligue um leitor de tela. |
| O que é seu fica com você. `[VALIDAR]` | Código, domínio, contas, conteúdo e dados no nome da sua empresa desde o primeiro dia. | Confira quem é o titular de cada conta. |
| Documentação que sobrevive a nós. `[VALIDAR]` | Arquitetura, decisões e rotinas registradas para que qualquer equipe competente consiga manter o site. | Peça o repositório e a documentação na entrega. |
| O lançamento é o dia um. `[VALIDAR]` | Depois de lançar, o site entra em ciclos de medição e evolução, com um relatório por ciclo. | Cada relatório traz duas colunas: antes e depois. |

**Bloco B (prova):**
- título `--fs-display-m` nas colunas 1–8;
- grade de medições com 5 pares (rótulo / valor / referência) nas colunas 1–12: 5 colunas no desktop, 2 no tablet, 1 no mobile;
- cada célula tem altura reservada (zero CLS).

**Copy:**
- **Título:** O primeiro case é este site.
- **Intro:** Há números que você pode conferir sozinho, agora: os desta página, no seu aparelho. Nenhum deles foi digitado por nós.
- **Medições** (§13.3).
- **Legenda:** Medido no seu dispositivo, nesta visita, pela API de Performance do navegador. Varia com a rede e o aparelho — por isso mostramos o seu número, não o nosso.
- **Link:** Ver o Case Nº 000: este site → `/cases/este-site/`
- **Botão:** Ver esta página por dentro (`aria-pressed`, §15.3)
- **Outros cases** (só publicados reais, no máximo 2 linhas, formato §12.2) + link **Ver todos os cases** → `/cases/`

**Motion:** itens com fade + `--reveal-y` e `--stagger`. Valores medidos entram com fade de 160 ms, **sem contagem**.

### 08 · Próximo passo (`#proximo-passo`)
**Layout:**
- título `--fs-display-xl` nas colunas 1–10;
- corpo nas colunas 1–6;
- quatro entradas nas colunas 1–8: título `--fs-title`, apoio `--fs-small` `--text-2`, seta SVG; linha inteira clicável, mínimo 64 px;
- botão primário.

**Copy:**
- **Rótulo:** Próximo passo
- **Título:** O que precisa entrar no ar?
- **Corpo:** Conte o que você quer construir. A primeira conversa já faz parte da Leitura — serve para entender o negócio, não para vender um pacote. `[VALIDAR]`
- **Entradas:**

| Entrada | Apoio | Destino |
|---|---|---|
| Um site novo | Para uma empresa que está nascendo ou que nunca teve o site certo. | `/contato/?tipo=site-novo&origem=home-08` |
| Um site que já existe | Para refazer ou evoluir o que não acompanha mais a empresa. | `/contato/?tipo=site-existente&origem=home-08` |
| Uma plataforma ou um sistema | Quando o site precisa operar, não só apresentar. | `/contato/?tipo=plataforma-sistema&origem=home-08` |
| Uma parceria | Estúdios, equipes e empresas que querem construir junto. | `/contato/?tipo=parceria&origem=home-08` |

- **Botão:** Iniciar um projeto → `/contato/?origem=home-08` (com magnetismo, §17)

---

## 9. Ecossistema

### 9.1 Metáfora: **mapa com centro**
A Gois Group é o centro. Cada empresa é um nó ligado a ele por conexões ortogonais, como um diagrama de sistema.

**Por que esta metáfora:**
- Constelação e órbita sugerem astros e distância.
- Um grafo de rede genérico não tem centro.
- Um bento vira grade de cards.
- Um corte com barras lê como gráfico.

O mapa tem centro, hierarquia, espaço visível para o que vem e continua legível com zero, três ou doze empresas. **A seleção é um corte:** o caminho da empresa escolhida até o centro acende em Rubrica.

### 9.2 Visualização (≥ 900 px)
- **Campo:** o próprio grid de 12 colunas × 3 linhas, com `grid-template-rows: 200px 160px 200px` (`md`: 180/140/180).
- **Centro:** `grid-column: 6 / 8; grid-row: 2`, 96 px de altura, centrado. Contém:
  - borda de 1 px giz e `--edge-light`;
  - símbolo de 32 px;
  - "Gois Group" (`--fs-title`);
  - "Método, design e engenharia" (`--fs-small`, `--text-3`).
- **Slots** (ordem de preenchimento por `ordem`; "6,5" = o eixo entre as colunas 6 e 7, centro do mapa):

  | Slot | Coluna do nó | Linha | Rótulo |
  |---|---|---|---|
  | 1 | 3 | 1 (topo) | acima do nó |
  | 2 | 10 | 1 | acima |
  | 3 | 6,5 | 3 (base) | abaixo |
  | 4 | 3 | 3 | abaixo |
  | 5 | 10 | 3 | abaixo |
  | 6 | 1 | 2 (meio) | abaixo |
  | 7 | 12 | 2 | abaixo |
  | 8 | 6,5 | 1 | acima |
  | 9 | 1 | 1 | acima |
  | 10 | 12 | 1 | acima |
  | 11 | 1 | 3 | abaixo |
  | 12 | 12 | 3 | abaixo |

  Com 3 espaços reservados (hoje), os slots 1, 2 e 3 formam um triângulo equilibrado.
- **Área do `<li>`:**
  - nós à esquerda do centro (colunas ≤ 6): colunas `c / c+2`, rótulo alinhado à esquerda a partir do marcador;
  - nós à direita (≥ 7): colunas `c−1 / c+1`, rótulo alinhado à direita;
  - nós no eixo: `6 / 8`, rótulo centrado;
  - o marcador (10 px) fica no centro da coluna `c`;
  - na linha 1, o `<li>` alinha à base da linha, com o rótulo em cima e o marcador embaixo; nas linhas 2 e 3, marcador em cima e rótulo embaixo;
  - a ordem do DOM é sempre nome → segmento → status.
- **Rótulo do nó:**
  - código em mono `E-01` (`--fs-label`, `--text-3`);
  - nome (`--fs-small` 560, `--text-1`, máximo 2 linhas);
  - segmento (`--fs-small`, `--text-2`);
  - status (marcador + texto, `--fs-label`).
  - Logo: só se a empresa fornecer um SVG monocromático (giz). **Nunca inventar logo nem monograma.**
- **Conectores** (componente cliente `Conectores`, depois da montagem):
  - mede o centro de cada marcador e as bordas do centro com `getBoundingClientRect` relativo ao campo;
  - rota: do nó até a linha do meio na vertical, depois até a borda esquerda ou direita do centro na horizontal; nós no eixo vão direto na vertical;
  - `<path>` 1 px `--line-ui`: contínuo para empresas publicadas, pontilhado `1 2` para espaço reservado;
  - trechos compartilhados se sobrepõem sem problema;
  - re-medição com ResizeObserver (debounce de 150 ms);
  - sem JS: nós e centro aparecem, sem conectores.
- **Todos os nós têm o mesmo tamanho.** Tamanho sugeriria porte, e esse dado não existe.

### 9.3 Interação
- **Hover e foco no link de um nó** (mesmo comportamento para os dois):
  - um `<path>` em Rubrica de 1,5 px redesenha o caminho do nó até o centro (é o corte);
  - o marcador passa a `--text-1`;
  - os outros nós vão a 40% de opacidade (`--dur-3`);
  - a **ficha** abaixo do mapa troca de conteúdo (crossfade de `--dur-3`).
- **Ficha:** linha com a largura do conteúdo, 4 blocos de 3 colunas, `aria-hidden="true"` (duplica o nome acessível):
  1. identidade: nome em `--fs-display-m` e logo, se houver;
  2. segmento e descrição;
  3. status, relação e site (link externo com ícone SVG);
  4. até 2 números com fonte e link "Ver case".
- **Sem seleção, com empresas:** "Passe o cursor ou navegue com o teclado por uma empresa para ver o que a Gois Group construiu para ela."
- **Clique:** abre `/empresas/{slug}/`, com transição compartilhada do nome (§16).
- **Teclado:**
  - `<ol aria-label="Empresas do ecossistema">`, com um `<a>` por empresa publicada;
  - **Tab percorre os links em ordem**, sem roving e sem setas; Enter abre;
  - foco = hover;
  - Esc limpa a seleção visual.
- **Nome acessível completo do link:** "E-01, {Nome}, {segmento}, {status}. O que construímos: {escopo}."
- **Leitor de tela e reservados:** espaços reservados são `aria-hidden` e ficam fora do foco. Um `<p class="sr-only">` resume:
  - com zero publicadas: "Nenhuma empresa publicada.";
  - com algumas: "{n} empresas publicadas."
- Nenhum `aria-live` na ficha.

### 9.4 Mobile e tablet (< 900 px): o mesmo `<ol>`, restilizado por CSS
- **Topo:** bloco "Gois Group" (símbolo de 24 px + nome + "Método, design e engenharia").
- **Espinha:** 1 px `--line-ui`, descendo na margem esquerda.
- **Cada empresa:** conector horizontal de 16 px + linha-link com no mínimo 72 px de altura, mostrando marcador, código, nome (`--fs-title`), segmento, status e seta SVG. O toque abre o detalhe. Não há hover nem ficha.
- **Espaço reservado:** conector pontilhado, "Espaço reservado" em `--text-3`, fundo `var(--hachura)`, sem link.

### 9.5 Estado placeholder (hoje)
- Home e `/empresas`:
  - centro + **3 espaços reservados** (slots 1–3), cada um com marcador pontilhado, texto "Espaço reservado" (`--fs-small`, `--text-3`) e conector pontilhado;
  - sem código, sem nome, sem segmento.
- Logo abaixo do lead: **"Nenhuma empresa publicada."**
- A ficha mostra o padrão, não uma promessa: "Cada empresa publicada aqui aparece com nome, segmento, o que construímos, status, site e até dois números com fonte."
- **Proibido:** "serão publicadas", "em montagem", "publicação em andamento", "após confirmação" e qualquer texto que sugira que existem empresas a caminho.

### 9.6 Dados por empresa
Ver `Empresa` em §21.2. A ficha e a página mostram:
- nome;
- identidade (se fornecida);
- segmento;
- descrição (≤ 160 caracteres);
- status;
- relação;
- desde;
- site;
- escopo, ou seja, o que a Gois Group construiu (site, plataforma, sistema, produto, reconstrução), com um parágrafo cada;
- até 3 números com fonte e período;
- case relacionado.

### 9.7 Verificação do status
`scripts/checar-sinais.mjs` roda no `predeploy` de produção:
- faz `HEAD` (timeout de 8 s) no `website` de cada empresa publicada com status `em-operacao`;
- resposta diferente de 2xx ou 3xx **interrompe o deploy** com a lista de falhas;
- a variável `PERMITIR_SINAL_FALHO=1` libera, e o override fica registrado no log.

---

## 10. Método Prumo (proprietário)

**Princípio:** seis fases. Nenhuma começa sem que a anterior cumpra o seu **critério de passagem**. A sexta não termina: cada ciclo volta à Leitura com dados reais. O método é versionado ("Versão 1"), e mudanças futuras ganham nova versão e uma nota em `content/metodo.ts`.

| Fase | Verbo | O que acontece | Artefatos | Passa quando |
|---|---|---|---|---|
| **P1 · Leitura** | Ler | Entendemos a empresa antes do site: modelo de negócio, públicos, concorrência, operação, o que existe hoje e o que está falhando. | Mapa do negócio · Auditoria do site atual (desempenho, SEO, acessibilidade, medição), quando existe · Tese do projeto em uma frase · Métricas de sucesso com linha de base | Tese e métricas aprovadas por escrito por quem decide. `[VALIDAR]` |
| **P2 · Arquitetura** | Estruturar | Definimos o que precisa existir e onde: páginas, fluxos, conteúdos, integrações e a tecnologia que vai sustentar tudo. | Mapa do site e fluxos principais · Modelo de conteúdo · Especificação técnica e escolha de tecnologia · Orçamento de desempenho · Plano de SEO e de migração | Toda página tem objetivo, métrica e responsável. Orçamento de desempenho aprovado. `[VALIDAR]` |
| **P3 · Desenho** | Desenhar | Desenhamos o sistema visual e de interação que vai sustentar todas as páginas, inclusive as que ainda não existem. | Design tokens · Biblioteca de componentes · Protótipo navegável em todos os tamanhos de tela · Textos finais · Especificação de movimento e acessibilidade | Protótipo aprovado em aparelho real, contraste verificado, textos aprovados. `[VALIDAR]` |
| **P4 · Construção** | Construir | Engenharia de front-end e back-end, gerenciador de conteúdo, integrações e testes, em ciclos curtos e visíveis num ambiente de homologação. | Código versionado · Ambiente de homologação · Testes automatizados · Relatórios de acessibilidade e de desempenho contra o orçamento | Orçamento cumprido, nenhuma falha crítica de acessibilidade, testes passando, conteúdo real carregado. `[VALIDAR]` |
| **P5 · Lançamento** | Colocar no ar | Migração, redirecionamentos, SEO técnico, medição e monitoramento. Publicação com plano de reversão. | Checklist de lançamento · Mapa de redirecionamentos · Plano de medição · Plano de reversão | No ar, medindo, e com o período de estabilização concluído sem erro crítico. `[VALIDAR]` |
| **P6 · Evolução** | Evoluir | Ciclos contínuos: medir, formular uma hipótese, mudar, medir de novo. Manutenção, segurança, novas páginas e funções. | Relatório de ciclo · Backlog priorizado · Registro de mudanças | Não fecha. Cada ciclo volta à Leitura, agora com dados reais. |

### 10.1 Visualização: o trilho (desktop ≥ 900 px)
- **Linha:** horizontal de 1 px `--text-3`, atravessando as colunas 1–12, dividida em 6 trechos de 2 colunas.
- **Critério de passagem:** no fim de cada trecho, duas verticais de 1 px × 12 px, com 6 px entre elas, e um quadrado de 6 × 6 no meio.
  - Contorno `--text-3` até ser alcançado pela entrada; depois, preenchido em giz.
- **Acima da linha, cada fase é um `<button aria-expanded aria-controls>`** com:
  - código `P1` em mono;
  - nome em `--fs-title`;
  - verbo em `--fs-small` `--text-3`.
- **Laço de retorno:** caminho ortogonal que sobe 24 px no fim de P6, corre para a esquerda acima do trilho e desce em P1, com ponta de seta em SVG. Traço tracejado `6 4` em `--line-ui`. Rótulo `--fs-small` `--text-3`: "Cada ciclo de evolução volta à Leitura — agora com dados reais."
- **Fase aberta:**
  - uma vertical de 1 px em **Rubrica** atravessa o critério de passagem da fase (é o corte e a única Rubrica da seção);
  - botões das outras fases em `--text-3`;
  - painel abaixo com 3 colunas (O que acontece · Artefatos, em lista com travessão · Passa quando, numa caixa de 1 px `--line-ui`);
  - **exclusivo:** abrir uma fecha a outra;
  - troca por **clique ou Enter/Espaço**, nunca por hover;
  - crossfade do painel em `--dur-3`.
- **Um DOM só:** `<ol>`; cada `<li>` tem `<h3><button></button></h3>` + `<div role="region" aria-labelledby>`. No desktop, todos os painéis caem por CSS Grid na mesma área abaixo do trilho, e só o aberto fica visível (`[hidden]` controlado por JS).
- **Estado inicial:** com JS, P1 aberta. Sem JS, todos os painéis visíveis, em sequência.

### 10.2 Mobile (< 900 px)
- Mesmo DOM, com o trilho vertical na margem esquerda e os critérios de passagem na horizontal.
- Cada fase é um disclosure **independente** (o JS lê `matchMedia` só para esse comportamento). P1 abre por padrão.
- O laço vira a nota "P6 volta para P1: cada ciclo recomeça pela Leitura, com dados reais."

### 10.3 Entrada (uma vez só)
- A linha desenha da esquerda para a direita: `scaleX`, `--dur-7`, `--ease-draw`.
- Os botões das fases fazem fade quando a linha passa (`delay = 720 · (i+1)/6 − 120 ms`).
- Os critérios de passagem se preenchem em `--dur-1` ao serem alcançados.
- O laço desenha por último: `stroke-dashoffset`, 480 ms.
- **Todo o texto fica visível em até 720 ms.**
- Reduced motion: estado final imediato.

---

## 11. Capacidades

### 11.1 Agrupamento
Quatro disciplinas. Os termos do brief aparecem entre parênteses para rastrear a cobertura: são 12 de 12, incluindo Product.

| Disciplina | Responde | Capacidades |
|---|---|---|
| **Estratégia** | Isso deve existir? Para quem? | Estratégia digital (Strategy) · modelo de negócio e jornada (Business Design) · definição de produto (Product) · arquitetura de informação · conteúdo |
| **Design** | Como é visto e entendido? | Identidade digital (Branding) · design de interface · design system · motion · redação |
| **Engenharia** | Como funciona, rápido e sem falhar? | Front-end e back-end (Technology, Engineering) · integrações e APIs · desempenho e acessibilidade · infraestrutura e segurança |
| **Operação** | O que se aprende depois, e o que muda? | Dados e medição (Data) · SEO contínuo e aquisição (Growth, Marketing) · automação e IA aplicada (Automation, AI) · operação contínua (Operations) |

### 11.2 Como mostrar que trabalham juntas: "Um botão atravessa quatro disciplinas"
**O elemento:** o botão real do site, **Iniciar um projeto** (o mesmo componente do hero). Ele fica centrado nas colunas 5–8.

**Quatro faixas empilhadas.** Em cada uma:
- nome da disciplina + pergunta nas colunas 1–5;
- decisão nas colunas 6–9, com as capacidades embaixo em `--fs-small` `--text-3`;
- representação nas colunas 10–12.

| Faixa | Pergunta | Decisão (copy) | Representação |
|---|---|---|---|
| **Estratégia** | Ele deve existir? Para quem? O que promete? | Promete uma leitura do seu caso, não um orçamento genérico. `[VALIDAR]` Aparece no topo para quem já decidiu e de novo depois das provas, para quem precisava delas. | a frase-promessa, em `--fs-body` |
| **Design** | Como ele é lido em meio segundo? | Rótulo com verbo, contraste de {contraste}:1, {altura} px de altura e foco visível para quem navega pelo teclado. | o botão renderizado |
| **Engenharia** | O que acontece quando alguém toca nele? | Leva ao formulário já sabendo de onde você veio. O formulário valida cada campo, envia sem recarregar a página, se protege de spam e, se a rede falhar, oferece o envio por e-mail com a mensagem pronta. | estados, em mono: `REPOUSO · FOCO · ENVIANDO · ENVIADO · FALHOU` |
| **Operação** | O que a empresa aprende depois? | Cada mensagem chega com o tipo de conversa e a página de origem, para que a primeira resposta já parta do contexto certo. | campos do envio, em mono: `TIPO · ORIGEM · PÁGINA · DATA` |

- **Valores:** `{contraste}` e `{altura}` são **derivados no build** por `scripts/derive-tokens.mjs`, a partir de `styles/tokens.css` (`--btn-fg`/`--btn-bg`, `--control-h`), e gravados em `content/generated/derivados.json`. Com os tokens desta spec, o contraste é 16,80:1 e a altura é 48 px. Nada é digitado à mão.
- **Tudo o que a tabela afirma é verdade por construção neste site** (§14.7): o parâmetro `origem`, a validação, o envio assíncrono, o honeypot e o fallback `mailto`. **Não há CRM nem automação afirmados.**
- **O botão desta seção é funcional:** Iniciar um projeto → `/contato/?origem=home-05`.
- **Hover (ponteiro fino) numa faixa:** a parte correspondente do botão ganha contorno tracejado `--line-ui` (rótulo, caixa, estados ou atributo `data-origem`). É só realce: a informação já está no texto.

**Motion (desktop):** "explosão" ligada ao scroll, só CSS:
- `@supports (animation-timeline: view())`;
- a faixa i (0–3) vai de `translateY(calc((1.5 - i) * -12px))` a `0`;
- `animation-range: entry 20% cover 45%`.

Sem suporte, no mobile e com reduced motion: faixas estáticas e empilhadas, com o botão repetido no topo.

---

## 12. Cases

### 12.1 Estrutura narrativa (7 capítulos, igual para todos)
1. **Problema:** o que estava errado ou faltando.
2. **Oportunidade:** o que ficava possível se fosse resolvido.
3. **Estratégia:** a tese e as escolhas, inclusive o que se decidiu não fazer.
4. **Construção:** o que foi feito e com que tecnologia (inclui uma tabela de stack).
5. **O que passou a existir:** o site, a plataforma ou a empresa que foi ao ar.
6. **Resultado:** o que mudou, em frases claras.
7. **Métricas:** tabela com Métrica · Antes · Depois · Variação · Período · Fonte · Método.

**Regras:**
- Métrica sem `fonte` e `periodo` **quebra o build**.
- Antes e depois exigem o mesmo método e períodos comparáveis.
- Percentual sempre com a base absoluta.
- Depoimento só com autorização escrita, nome e cargo.
- Imagem só com captura real fornecida pela empresa, com legenda "Captura do site em {data}". Sem fotos de banco.

### 12.2 Linha de case (listagem e bloco da Home)
- Um `<ol>` de linhas, sem thumbnails.
- Colunas:
  - `Nº 000` em mono (colunas 1–2);
  - título (`--fs-title`) + empresa (`--fs-small`) nas colunas 3–7;
  - estrutura (Site, Plataforma…) nas colunas 8–9;
  - métrica-chave com fonte (`--fs-small`) nas colunas 10–11;
  - seta na coluna 12.
- Hover e foco: fundo `--surface-1`, hairline giz, seta de 4 px.
- Mobile: empilhado.

### 12.3 Case Nº 000: "Este site." (real)
Os campos estão em §14.5. As métricas vêm de `out/metrics.json`, gerado por `scripts/measure-build.mjs` a cada build (§13.4).

### 12.4 Estado placeholder
- `/cases` mostra, abaixo do Nº 000, **duas linhas sem link** com borda superior pontilhada e fundo `var(--hachura)`:
  - "Nº 001 · Espaço reservado para case";
  - "Nº 002 · Espaço reservado para case";
  - as demais colunas ficam em "—".
- Não há página de detalhe pública.
- Abaixo delas, o bloco **"O que todo case publicado aqui terá"** (§14.4).

---

## 13. Números

### 13.1 Campos (`content/numeros.ts`)
| Campo | Definição (publicada já) | Fonte | Cálculo |
|---|---|---|---|
| Empresas no ecossistema | Empresas com estrutura digital construída ou operada pela Gois Group e publicação autorizada. | Este site | **Derivado:** conta `publicar && !placeholder` |
| Sites e sistemas lançados | Sites, plataformas e sistemas colocados no ar pela Gois Group. | Registro interno de projetos `[PENDENTE]` | Manual |
| Segmentos atendidos | Segmentos de mercado distintos entre as empresas publicadas. | Este site | **Derivado** |
| Pessoas alcançadas por mês | Visitantes únicos mensais somados dos sites operados pela Gois Group, com autorização de cada empresa e período informado. | Medição das empresas `[PENDENTE]` | Manual, com período |
| *Velocidade dos sites entregues (não entra na Home enquanto pendente)* | Tempo até o conteúdo principal aparecer (LCP, p75) na mediana dos sites entregues. | Chrome UX Report / Search Console `[PENDENTE]` | Manual, com período. Aparece na seção 07, ao lado de "Orçamento de desempenho", só quando confirmado. |

### 13.2 Visual
**Layout:** Home 05.2 com 4 células (3 colunas cada no desktop, 2 × 2 no tablet, empilhadas no mobile). Todas têm a mesma altura.

**Confirmado:**
- numeral em `--fs-numeral` tabular, `--text-1`, com a unidade em mono ao lado;
- rótulo em `--fs-title`;
- definição em `--fs-small` `--text-2`;
- linha em mono: `FONTE: {fonte} · PERÍODO: {período} · VERIFICADO EM {mm.aaaa}`;
- entra por corte, **sem contagem**.

**Pendente:**
- rótulo em mono acima: `PENDENTE`;
- quadro com **largura fixa de 2,4 em** no tamanho do numeral, igual para todos os campos (não sugere ordem de grandeza);
- altura igual à versal + 0,2 em;
- contorno pontilhado de 1 px `--line-ui`, fundo `var(--hachura)` e um "—" centrado em `--text-3`;
- abaixo: rótulo, definição e `FONTE: A DEFINIR · PERÍODO: A DEFINIR`.

**Derivado igual a zero:** mesmo quadro, com o rótulo em mono `SEM EMPRESAS PUBLICADAS` e a linha "Calculado a partir das empresas publicadas neste site."

**Leitor de tela:** "{Rótulo}: dado pendente. Definição: {definição}."

**Proibido:** contagem animada, "+", "mais de", arredondar para cima, valor de exemplo.

### 13.3 "Este site, medido agora" (seção 07, componente `MedicaoAoVivo`, cerca de 1,2 KB gz)
- Carrega em `requestIdleCallback` (fallback: `setTimeout` de 1 s).
- Detecção **por recurso**, com `PerformanceObserver.supportedEntryTypes`, nunca por navegador.

| Rótulo (copy) | Medição | Referência pública (copy) | Sem dado ou sem suporte (copy) |
|---|---|---|---|
| Transferido nesta visita | soma de `transferSize` da navegação e dos recursos, em KB com 1 casa (`xxx,x KB`) | — | Se a soma for 0: "Em cache — 0 KB transferidos" |
| Arquivos carregados | `getEntriesByType('resource').length + 1` | — | — |
| Conteúdo principal visível em | `largest-contentful-paint` (buffered), último candidato, `x,xx s` | Referência para "bom": até 2,5 s. | Não medido neste navegador. |
| Quanto a página se mexeu ao carregar | soma de `layout-shift` sem input recente, `x,xxx` | Referência para "bom": até 0,1. | Não medido neste navegador. |
| Resposta mais lenta a um toque ou clique | máximo de `event` com `durationThreshold: 40`, `xxx ms` | Referência para "bom": até 200 ms. | Interaja com a página para medir. / Não medido neste navegador. |

- Segunda linha técnica de cada rótulo, em mono `--fs-micro`: `TRANSFERSIZE`, `RESOURCE TIMING`, `LCP`, `CLS`, `INP (APROXIMAÇÃO)`.
- Os valores atualizam ao chegar, com fade de 160 ms.
- **Nunca** esconder, filtrar ou arredondar um resultado ruim.
- A célula reserva a altura para não gerar CLS.

### 13.4 Métricas de build (Case Nº 000): `scripts/measure-build.mjs` (`postbuild`)
1. Lê `out/index.html` e coleta `script[src]`, `link[rel=stylesheet]`, `link[rel=preload][as=font]` e as fontes referenciadas no CSS.
2. Aplica gzip nível 9 com `zlib` em cada arquivo.
3. Grava `out/metrics.json`:
   `{ build:{hash,data}, home:{ htmlKB, cssKB, jsKB, fontesKB, totalKB, requisicoes }, metodo:"gzip -9 dos arquivos que a página inicial carrega", gerador:"scripts/measure-build.mjs" }`.
4. A página do case busca `/metrics.json` no cliente, com a célula reservada.
   - Sem JS: link "Ver as medições em JSON" → `/metrics.json`.
   - Se falhar: "Medições indisponíveis nesta versão."

| Rótulo (copy) | Tradução (copy, `--fs-small`) |
|---|---|
| Peso da página inicial (comprimido) | Quanto o navegador precisa baixar para mostrar a página inicial. |
| JavaScript da página inicial (comprimido) | O código que roda no seu aparelho. Quanto menor, mais rápido responde. |
| CSS (comprimido) | As regras visuais da página. |
| Fontes | As duas famílias tipográficas do site. |
| Requisições na primeira visita | Quantos arquivos a página inicial pede ao servidor. |

Linha de fonte (mono): `FONTE: SCRIPTS/MEASURE-BUILD.MJS · VERSÃO {hash} · {data} · MÉTODO: GZIP -9`

---

## 14. Páginas: copy completa

### 14.1 `/empresas/`
- **Rótulo:** Ecossistema
- **H1:** Ecossistema.
- **Lead:** Empresas cuja estrutura digital foi construída ou é operada pela Gois Group. Cada uma aparece com o que construímos para ela, e só com dados que possam ser conferidos.
- **Estado vazio:** Nenhuma empresa publicada.
- **Mapa:** o mesmo da Home (§9), sem o limite de 12. Com mais de 12 empresas, a vista padrão passa a ser "Lista".
- **Alternador** (só com ≥ 1 publicada): botões **Mapa** · **Lista** (`aria-pressed`). Os dois restilizam o mesmo `<ol>`.
  - Na vista Lista, cada linha mostra: código, nome, segmento, relação, status, site e case.
- **Filtros** (só com ≥ 6 publicadas):
  - `<fieldset>` "Status": Em operação · Em construção · Em evolução;
  - `<fieldset>` "Relação": Estrutura construída · Estrutura operada · Empresa do grupo `[VALIDAR]` · Parceira;
  - estado na URL (`?status=`, `?relacao=`);
  - contagem em `aria-live="polite"`: "{n} empresas exibidas".
- **Bloco "O que cada empresa publicada aqui terá"** (sempre visível enquanto houver menos de 3 publicadas):
  1. Nome e identidade — fornecidos pela própria empresa.
  2. Segmento e descrição.
  3. O que a Gois Group construiu: site, plataforma, sistema ou produto.
  4. Status: em operação, em construção ou em evolução.
  5. O site, para conferir ao vivo.
  6. Até três números, cada um com fonte e período.
  7. O case, quando houver.
- **Fecho:** Precisa de uma estrutura assim? Comece por uma conversa. **Iniciar um projeto** → `/contato/?origem=empresas`

### 14.2 `/empresas/[slug]/` (gerada só para `publicar && !placeholder`; em homologação, também para placeholders, com `noindex`)
- **Trilha:** Ecossistema / {Nome}
- **Linha de status** (mono + marcador): `E-{nn}` · {Status}
- **H1** (`--fs-display-l`, `view-transition-name: empresa-{slug}` só durante a transição): {Nome}
- **Meta:** {Segmento} · {Relação}
- **Descrição** (`--fs-lead`).
- **Ficha** (colunas 9–12 no desktop; `<dl>`): Segmento · Relação com a Gois Group · Status · Desde · Site (**Visitar o site**, ícone externo, `rel="noopener"`).
- **H2: O que construímos para {Nome}.** Lista do escopo, cada item com `<h3>` (Site / Plataforma / Sistema interno / Produto digital / Reconstrução) e um parágrafo.
- **H2: Números.** Até 3, no formato de §13.2. **Números pendentes não aparecem em página de empresa.**
- **H2: Case.** Linha de case (§12.2), se houver.
- **Navegação:** Empresa anterior · Próxima empresa (setas SVG).
- **Faixa em homologação:** PÁGINA-MODELO — NÃO PUBLICADA. Os campos entre colchetes aguardam dados da Gois Group.

### 14.3 `/cases/`
- **Rótulo:** Cases
- **H1:** Cases, com fonte.
- **Lead:** Cada case mostra o problema, a estratégia, o que foi construído e o que mudou — com a origem de cada número. Sem autorização ou sem dados verificáveis, o case não entra aqui.
- **Registro:**
  - **Nº 000 · Este site.** — Gois Group · Site · Em operação · "Peso da página inicial: {totalKB} KB (versão {hash})" (vem de `metrics.json`) → `/cases/este-site/`
  - **Nº 001 · Espaço reservado para case** — — · — · — (sem link)
  - **Nº 002 · Espaço reservado para case** — — · — · — (sem link)
  - Os espaços seguem o teto de §7.4 e somem conforme cases reais são publicados.

### 14.4 Bloco "O que todo case publicado aqui terá" (em `/cases/`)
1. Problema — o que estava errado ou faltando.
2. Oportunidade — o que ficava possível se fosse resolvido.
3. Estratégia — a tese e as escolhas, inclusive o que decidimos não fazer.
4. Construção — o que foi feito, e com que tecnologia.
5. O que passou a existir — o site, a plataforma ou a empresa que foi ao ar.
6. Resultado — o que mudou, em frases claras.
7. Métricas — antes, depois, período, fonte e método de cada número.

### 14.5 `/cases/[slug]/` (modelo) e `/cases/este-site/`
**Layout desktop:**
- índice nas colunas 1–3, `position: sticky` sob o header, com os 7 capítulos em links e o capítulo atual marcado por um traço giz de 12 px (IntersectionObserver). É posição, não seleção, por isso não é Rubrica;
- conteúdo nas colunas 5–11.

**Mobile:** o índice vira uma lista de links no topo, sem nada fixo.

**Cabeçalho do modelo:** `Case Nº {nnn}` (mono) · H1 com a tese (`view-transition-name: case-{slug}` só durante a transição) · meta: Empresa (link) · Estrutura · Período · Status · **Ver o site**.

**Capítulos:** `<h2>` com "01 — Problema", "02 — Oportunidade", "03 — Estratégia", "04 — Construção", "05 — O que passou a existir", "06 — Resultado", "07 — Métricas".

**Métricas:** `<table>` com `<caption>Métricas do case Nº {nnn}</caption>`. No mobile, a tabela fica numa região rolável (`role="region" tabindex="0" aria-label="Métricas, role para os lados"`), com a primeira coluna fixa.

**Fim da página:** Empresa relacionada · Próximo case · **Iniciar um projeto**.

**`/cases/este-site/` (Case Nº 000):**
- **H1:** Este site.
- **Lead:** Como apresentar uma empresa de desenvolvimento de sites sem pedir que ninguém acredite em nada que não possa conferir.
- **Meta:** Empresa: Gois Group · Estrutura: Site · Período: `[PENDENTE: início do projeto]` até {data do build de produção} · Status: **Em construção** até o lançamento; depois, **Em operação** (campo de conteúdo).
- **01 — Problema:** Apresentar uma empresa de desenvolvimento de sites sem cases, clientes ou números publicáveis — e sem pedir ao visitante que acredite em nada que ele não possa verificar.
- **02 — Oportunidade:** Para quem constrói sites, o próprio site é a única prova que qualquer pessoa pode inspecionar sozinha, agora.
- **03 — Estratégia:** Construir o site em duas camadas — a superfície e a estrutura — e deixar o visitante passar de uma para a outra. Publicar só dados verificáveis. Tratar o que ainda não é verificável como campo aberto, à vista. O que decidimos não fazer: 3D, vídeo de fundo, bibliotecas de animação, fotos de banco e números de exemplo.
- **04 — Construção:** Next.js com exportação estática, React e TypeScript. CSS com tokens, sem framework. Nenhuma biblioteca de animação: o movimento é CSS, com poucas linhas de JavaScript onde o CSS não alcança. Fontes auto-hospedadas. O desenho do corte é gerado a partir das medidas reais da página, no navegador de quem visita.

  | Tecnologia | Para quê |
  |---|---|
  | Next.js 16, exportação estática | Páginas prontas no servidor, hospedáveis em qualquer lugar |
  | React 19 + TypeScript | Componentes e conteúdo tipado, com dado pendente impossível de publicar como real |
  | CSS com tokens e CSS Modules | Um sistema visual único, sem framework |
  | Archivo e Martian Mono (Fontsource) | Tipografia auto-hospedada, 58,5 KB no total |
  | View Transitions API | Transições entre páginas com fallback instantâneo |
  | API de Performance do navegador | As medições ao vivo da página inicial |

- **05 — O que passou a existir:** Um site que se deixa ver por dentro: o corte no topo da página inicial, a vista "por dentro" em qualquer página, medições ao vivo e pendências declaradas.
- **06 — Resultado:** Medido, não declarado. Os números abaixo são gerados a cada versão publicada; os da sua visita estão na página inicial.
- **07 — Métricas:** tabela de §13.4 com as colunas Métrica · Valor · Versão · Data · Fonte · Método, mais o link **Ver as medições desta visita** → `/#por-que`.

### 14.6 `/sobre/`
- **Rótulo:** Sobre
- **H1** (`--fs-display-l`): Existimos porque quase todo site é construído de fora para dentro.
- **Lead:** Primeiro a aparência, depois o conteúdo, por último a engenharia. A empresa descobre os limites do próprio site justo quando mais precisa dele. A Gois Group trabalha na ordem inversa.
- **Manifesto** (rótulo "Manifesto"; os 6 versos de §3 em `--fs-title`, revelados por corte com 80 ms entre eles) + botão **Ver esta página por dentro**.
- **01 — Por que existimos:** Um site é a parte da empresa que trabalha o tempo todo: atende quem chega, explica o que ela faz, vende enquanto a equipe dorme, conecta sistemas que ninguém vê. Quando essa parte é tratada como detalhe, a empresa paga duas vezes — na oportunidade perdida e na reconstrução. A Gois Group existe para projetar essa parte com o rigor que ela exige, desde o início, e para continuar responsável por ela depois do lançamento. `[VALIDAR: continuidade]`
- **02 — Visão:** Estrutura digital tratada como infraestrutura: projetada para durar, medida desde o primeiro dia, mantida por quem a construiu e ampliada quando a empresa cresce.
- **03 — Convicções** (lista numerada: afirmação em `--fs-title`, explicação em `--text-2`):
  1. **O site é a empresa, na web.** Para muita gente é o primeiro contato — às vezes, o único. Merece o rigor de um produto, não o prazo de uma peça.
  2. **Estrutura não aparece — até faltar.** Ninguém elogia um site rápido, acessível e bem indexado. Todo mundo sente quando ele não é.
  3. **Beleza sem medida é opinião.** Design é julgado pelo que faz acontecer. Por isso a métrica vem antes do layout.
  4. **Velocidade é respeito.** Cada segundo de carregamento é tempo tirado de quem chegou até você.
  5. **Método vence talento isolado.** Talento faz um bom projeto. Método faz o próximo também.
  6. **Mostrar vale mais que afirmar.** Por isso este site pode ser visto por dentro, medido e conferido por quem quiser.
- **04 — Modelo** `[VALIDAR]`:
  - **Intro:** Trabalhamos de três formas.
  - **Construção.** Um projeto com escopo e seis fases, da Leitura ao Lançamento. Termina com o site no ar e medido.
  - **Evolução contínua.** Ciclos depois do lançamento: medir, decidir, mudar, medir de novo.
  - **Parceria.** Construção conjunta com estúdios, equipes e empresas que precisam de um time técnico ao lado.
  - **Visual:** três linhas sobre o mesmo trilho do Método, que mostram o trecho coberto por cada forma: P1–P5; P6 em laço; P1–P6.
- **05 — Como pensamos:** O Método Prumo organiza tudo o que fazemos em seis fases, cada uma com artefatos e um critério de passagem: Leitura, Arquitetura, Desenho, Construção, Lançamento, Evolução. **Ver o método** → `/#metodo`
- **06 — Registro:** **só é renderizado com pelo menos um marco real.** Formato: tabela `Ano · Marco`. Em homologação, mostra `[FUNDAÇÃO — ano a informar]`, `[FUNDADORES — nomes a informar]` e `[MARCOS — a informar]`.
- **07 — O que vem:** Cada site que construímos ensina alguma coisa ao próximo. O plano é simples de dizer e difícil de cumprir: construir menos coisas descartáveis e mais coisas que aguentam o tempo e o crescimento de quem depende delas.
- **Fecho:** Se a sua empresa precisa de um site que aguente o que ela ainda vai virar, o começo é uma conversa. **Iniciar um projeto** → `/contato/?origem=sobre`

### 14.7 `/contato/`
**Layout:**
- H1 e lead nas colunas 1–8;
- formulário nas colunas 1–7;
- coluna lateral nas colunas 9–12, **sem sticky**;
- mobile: título, lead, formulário e depois a lateral.

**Topo e lateral:**
- **H1:** Conte o que precisa entrar no ar.
- **Lead:** Poucas perguntas, todas úteis. Quanto mais claro o ponto de partida, mais precisa a primeira resposta.
- **Lateral "O que acontece depois"** `[VALIDAR]`:
  1. Lemos com atenção.
  2. Respondemos pelo e-mail informado, com perguntas ou com uma primeira leitura do caso.
  3. Se fizer sentido para os dois lados, marcamos uma conversa.
  - Prazo de resposta: exibido **só quando informado** `[PENDENTE]`.
- **Lateral "Canais":** o e-mail, **só se configurado**, com o botão **Copiar**, que vira **Copiado** por 1,2 s (anunciado por `aria-live="polite"`).

**Fluxo (uma página, revelação progressiva, sem wizard):**
- `?tipo=` pré-seleciona o tipo; `?origem=` vai num campo oculto.
- Os campos condicionais aparecem com fade de 240 ms logo abaixo do tipo. **Nenhum campo obrigatório fica escondido.**
- Ao trocar de tipo, o que já foi digitado nos campos comuns é mantido.

**1. `<fieldset>` "O que você quer construir?"*** (radios em linhas grandes: título `--fs-title` + apoio `--text-2`)

| Valor | Título | Apoio |
|---|---|---|
| `site-novo` | Um site novo | Para uma empresa que está nascendo ou que nunca teve o site certo. |
| `site-existente` | Um site que já existe | Para refazer ou evoluir o que não acompanha mais a empresa. |
| `plataforma-sistema` | Uma plataforma ou um sistema | Quando o site precisa operar, não só apresentar. |
| `parceria` | Uma parceria | Estúdios, equipes e empresas que querem construir junto. |
| `outro` | Outro assunto | Imprensa, fornecedores e demais contatos. |

**2. `<fieldset>` "Sobre você"**

| Campo | Obrigatório | Atributos |
|---|---|---|
| Nome | sim | `autocomplete="name"`, ajuda: "Como devemos chamar você?" |
| E-mail | sim | `type="email" autocomplete="email"` |
| Empresa | sim, exceto em `outro` e `parceria` (nesses, opcional) | `autocomplete="organization"` |
| Cargo | não | `autocomplete="organization-title"` |
| Telefone ou WhatsApp | não | `type="tel" autocomplete="tel"` |

**3. `<fieldset>` "Sobre o projeto"** (varia com o tipo)
- **`site-novo`:**
  - "Em que momento a empresa está?"* (radio): Ainda é uma ideia · Já opera, sem site · Já opera, com um site que não a representa;
  - "Prazo desejado" (select): Sem data definida · Até 3 meses · De 3 a 6 meses · Mais de 6 meses;
  - "O que esse site precisa fazer pela empresa?"* (textarea).
- **`site-existente`:**
  - "Endereço do site atual"* (`type="url"`; aceita sem `https://` e normaliza);
  - "O que não está funcionando?" (checkbox): Está lento · É difícil de editar · Não aparece bem no Google · Não converte · O visual não representa mais a empresa · Integrações falham · Outro;
  - "Prazo desejado";
  - "O que mudou na empresa desde que o site foi feito?" (textarea).
- **`plataforma-sistema`:**
  - "O que precisa existir?" (checkbox): Área do cliente · Portal ou painel · Loja virtual `[VALIDAR]` · Sistema interno · Integração entre sistemas · Produto digital · Ainda não sei;
  - "Quais sistemas precisam conversar?" (texto, opcional);
  - "Prazo desejado";
  - "Quem vai usar, e para fazer o quê?"* (textarea).
- **`parceria`:**
  - "Tipo de parceria"* (radio): Estúdio ou agência · Tecnologia · Empresa ou investimento · Outro;
  - "Site" (url, opcional);
  - "Como você imagina construir junto?"* (textarea).
- **`outro`:** "Assunto"* · "Mensagem"*.
- **Faixa de investimento:** **o campo não existe** até a Gois Group definir as faixas `[PENDENTE]`.

**Aviso de privacidade** (texto, sem checkbox): Usamos estes dados só para responder a este contato. Veja a **Política de privacidade**. `[VALIDAR: jurídico]`

**Envio:**
- **Botão:** Enviar → "Enviando…" (`aria-busy="true"`, campos desabilitados).
- **Sem endpoint e com e-mail configurado:** o botão vira **Enviar pelo seu e-mail**, com a nota "Vamos abrir o seu aplicativo de e-mail com a mensagem pronta."
- **Sucesso** (o painel substitui o formulário, recebe foco e tem `role="status"`):
  - **Recebido.**
  - Sua mensagem foi registrada. A resposta vem da equipe da Gois Group, pelo e-mail informado.
  - Resumo do que foi enviado + link **Voltar ao início**.
  - Sem promessa de prazo.
- **Falha de rede ou timeout (10 s):**
  - Não foi possível enviar agora. Nada do que você escreveu se perdeu.
  - Ações: **Tentar de novo** · **Enviar por e-mail** · **Copiar mensagem**.

**Erros** (no blur e no envio; `aria-invalid` + `aria-describedby`; borda de 2 px giz + ícone de erro SVG + texto em giz, **sem Rubrica nem vermelho**):
- Nome: Como devemos chamar você?
- E-mail: Esse e-mail parece incompleto. Confira o que vem depois do @.
- Mensagem com menos de 20 caracteres: Conte um pouco mais. Uma ou duas frases já ajudam.
- URL: Parece incompleto. Exemplo: https://suaempresa.com.br
- Tipo: Escolha o que você quer construir.
- Radio obrigatório: Escolha uma opção.
- **Resumo** (topo do formulário, recebe foco no envio): "Faltam {n} ajustes antes de enviar:" + links para cada campo.

**Técnica:**
- **Payload:** `POST` JSON para `NEXT_PUBLIC_CONTACT_ENDPOINT`:
  `{ tipo, campos:{…}, origem, pagina, enviadoEm (ISO), versaoSite: NEXT_PUBLIC_BUILD_SHA }`.
- **`mailto:`** para `NEXT_PUBLIC_CONTACT_EMAIL`:
  - assunto: `[Gois Group] {Tipo} — {Empresa ou Nome}`;
  - corpo: `Rótulo: valor` por linha + `Origem: {origem}`.
- **Anti-spam:** honeypot `name="website"` (fora da tela, `tabindex="-1"`, `autocomplete="off"`) e envio rejeitado se acontecer menos de 3 s depois da renderização.
- **Sem nenhum dos dois canais:** o build de produção falha. Em homologação aparece a faixa "CANAL DE ENVIO PENDENTE".

### 14.8 `/privacidade/` (página adicional necessária pela LGPD, porque o formulário coleta dados pessoais)
- **H1:** Política de privacidade.
- **Estrutura:**
  1. Quem somos: controlador, razão social e CNPJ `[PENDENTE]`.
  2. Que dados coletamos: os campos do formulário de contato.
  3. Para quê: responder ao contato.
  4. Base legal `[VALIDAR: jurídico]`.
  5. Por quanto tempo `[PENDENTE]`.
  6. Com quem compartilhamos: o provedor do endpoint `[PENDENTE]`.
  7. Seus direitos.
  8. Como falar com o encarregado `[PENDENTE]`.
  9. **Cookies e armazenamento:** este site não usa cookies nem ferramentas de rastreamento. Guarda no seu navegador, só durante a sessão, duas preferências de navegação: se a abertura da página inicial já foi exibida e se a vista "por dentro" está ligada. (É verdade por construção: §21.4.)
- **Bloqueio:** texto jurídico pendente quebra o build de produção.

### 14.9 404 (`app/not-found.tsx`)
- **H1** (`--fs-display-xl`): Esta página não foi construída.
- **Texto:** O endereço pode ter mudado — ou nunca ter existido. Tudo o que construímos começa por aqui:
- **Links:** Início · Empresas · Cases · Iniciar um projeto
- **Visual:**
  - faixa de hero reduzida (50svh) com o corte em repouso e só a grade (`.grade-css`);
  - uma anotação: "Nesta página: nenhum elemento para medir." / `404`;
  - botão **Ver esta página por dentro**.

---

## 15. Header, rodapé e "Ver por dentro"

### 15.1 Header
- **Estrutura:**
  - 56 px fixos em todos os breakpoints, `position: fixed`;
  - `padding-inline: var(--margin)`;
  - `<header>` com `<nav aria-label="Principal">`.
- **Esquerda:** lockup (§5.3) em um link com `aria-label="Gois Group — página inicial"`; o SVG é `aria-hidden`.
- **Direita (≥ 900):**
  - links **Empresas** · **Cases** · **Sobre** (`--fs-small` 500, `--text-2`, hover `--text-1` com sublinhado, §17; 32 px entre eles);
  - CTA **Iniciar um projeto**: 36 px, borda 1 px `--line-ui`, padding 0 16, `--text-1`; hover com fundo giz e texto breu (`--dur-2`);
  - o CTA some em `/contato/`.
- **Página atual:** `--text-1`, sublinhado fixo de 1 px a 6 px da base, `aria-current="page"`.
- **Transformação no scroll:**
  - no topo, fundo transparente sobre o hero;
  - depois de 24 px, fundo `rgb(11 11 10 / .94)` (sem blur) e hairline inferior `--line` (`--dur-3`);
  - rolando para baixo depois de 480 px, o header se recolhe (`translateY(-100%)`, `--dur-3`, `--ease-move`);
  - qualquer subida de 8 px ou mais o traz de volta;
  - **nunca se recolhe** com o menu aberto ou com foco dentro dele;
  - o listener de scroll é passivo e só troca classes, agrupado em rAF.
- **Sobre a Visão:** um IntersectionObserver aplica `data-tone="papel"`: fundo papel a 94%, texto tinta, logo tinta, borda `--papel-ui`.
- **Mobile (< 900):**
  - lockup + botão de texto **Menu** (44 × 44, `aria-expanded`, `aria-controls`), que vira **Fechar**;
  - menu em tela cheia, breu, revelado por corte (`clip-path` da esquerda para a direita, `--dur-4`, `--ease-cut`);
  - conteúdo: **Empresas** · **Cases** · **Sobre** · **Contato** (`--fs-display-m`), depois o botão **Iniciar um projeto** (largura total), o botão **Ver esta página por dentro** e o e-mail, se configurado;
  - foco preso no menu, `inert` em `<main>` e `<footer>`, Esc fecha e o foco volta ao botão Menu;
  - reduced motion: abre sem animação.
- **Skip link:** "Pular para o conteúdo" é o primeiro focável e aponta para `<main id="conteudo" tabindex="-1">`.
- **Âncoras:** `html { scroll-padding-top: 72px }`, para que o header fixo não cubra o foco (WCAG 2.4.11).

### 15.2 Rodapé: o fechamento
1. **Frase** (`--fs-display-xl`, colunas 1–10, **sólida**, duas linhas, revelada por corte com 120 ms entre as linhas): **A superfície muda. / A estrutura fica.**
2. **CTA:** **Iniciar um projeto** (`/contato/?origem=footer`) + o e-mail com **Copiar**, só se configurado.
3. **Grade de informação** (hairline no topo; cada célula ocupa 3 colunas; **uma célula só existe se houver dado real**):
   - **Marca:** lockup + tagline "A estrutura por trás do que aparece.";
   - **Navegação:** Início · Empresas · Cases · Sobre · Contato;
   - **Empresas:** nomes das empresas publicadas (a célula some se não houver nenhuma);
   - **Redes:** perfis oficiais (some se não houver);
   - **Legal:** Política de privacidade · razão social e CNPJ, só quando informados.
4. **Barra final** (hairline; `--fs-small`, `--text-3`; o que é código vai em mono):
   - `© {ano do build} Gois Group`;
   - "Versão publicada em {dd.mm.aaaa}" + `{hash}` em mono;
   - botão **Ver esta página por dentro**;
   - **Voltar ao topo** (seta para cima em SVG).

**Proibido no rodapé:** wordmark gigante, "em breve", "publicação em andamento", qualquer dado inventado.

### 15.3 "Ver por dentro" (modo global)
- **Onde se liga:** barra final do rodapé, bloco B da 07, manifesto do Sobre, menu mobile e 404. É `<button aria-pressed>`, com o rótulo **Ver esta página por dentro** / **Ver só a superfície**.
- **Estado:** `sessionStorage['gg:dentro']` com try/catch, aplicado por script inline no `<head>` (`html[data-dentro="on"]`).
- **Indicador (ligado):**
  - pílula fixa no canto inferior esquerdo, com 40 px de altura, `--surface-2`, borda `--line-ui`;
  - quadrado de 6 × 6 em Rubrica + "Vendo por dentro" + botão **Desligar**;
  - `z-index: var(--z-pill)`.
- **Anúncio:** região `aria-live="polite"` oculta: "Vista por dentro ligada." / "Vista por dentro desligada."
- **Camada** (`components/dentro/DentroOverlay.tsx`, cerca de 3 KB gz, `next/dynamic` só na primeira ativação):
  - `position:absolute; inset:0` sobre o documento, `pointer-events:none`, `aria-hidden`, `z-index: var(--z-dentro)`;
  - colunas do grid em faixas de giz a 3%;
  - linhas de base a cada 8 px, a 2%;
  - para cada `[data-dentro]`, uma caixa tracejada `6 4` em `--line-ui` e um chip com a linha principal em linguagem de negócio (o valor do atributo, por exemplo "Título da seção", "Texto de apoio", "Botão principal", "Lista de fases", "Desenho gerado por código") e a linha técnica medida ao vivo (mono `--fs-micro`, por exemplo `ARCHIVO 580 · 76 PX` ou `{w} × {h} PX`);
  - cada `[data-dentro-vazio]` ganha o rótulo "Espaço vazio de propósito" / `{n} COLUNAS · {w} PX`;
  - no máximo 40 elementos por página;
  - recalcula ao ligar, com ResizeObserver (debounce de 150 ms) e na troca de rota. **Nunca em loop.**
- **Entrada:** fade de 160 ms. Reduced motion: instantâneo.
- **Na Home:** ligar leva o corte do hero até a margem esquerda.

---

## 16. Transições entre páginas (View Transitions API)

- **Componente:** `TransitionLink` (`components/layout/TransitionLink.tsx`) envolve o `next/link`.
  - Clique sem modificador (Ctrl, Cmd, Shift, botão do meio), mesma origem e `startViewTransition` disponível: `document.startViewTransition(() => new Promise(r => { pendente = r; router.push(href); setTimeout(r, 300) }))`.
  - **Teto da promessa: 300 ms.**
  - O `NavigationListener` do layout resolve a promessa num `useEffect` de mudança de `usePathname()`, liga `window.__ggNavegou = true` e move o foco para `#conteudo` com `preventScroll`.
  - Scroll para o topo antes do snapshot novo (comportamento padrão do `router.push`).
- **Direção:** `html[data-vt-dir="forward"|"back"]`. Voltar é detectado por `popstate`.
- **CSS:**
```css
@view-transition { navigation: auto; }                       /* fallback para navegação completa */
::view-transition-old(root) { animation: none; }
::view-transition-new(root) { animation: vt-corte 320ms var(--ease-move) both; }
html[data-vt-dir="back"]::view-transition-new(root) { animation-name: vt-corte-volta; }
@keyframes vt-corte       { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } }
@keyframes vt-corte-volta { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0); } }
.site-header { view-transition-name: site-header; }
::view-transition-group(site-header) { animation: none; }
::view-transition-group(*) { animation-duration: 320ms; animation-timing-function: var(--ease-move); }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root) { animation: vt-fade 120ms linear both; }
  @keyframes vt-fade { from { opacity: 0; } }
}
```
- **Gesto:** a página nova entra **por corte**, da esquerda para a direita (ao voltar, da direita para a esquerda), sobre a antiga, que fica parada. Não há linha Rubrica, porque a borda entre as duas páginas já é o corte.
- **Continuidade:** o header não se move.
  - O nome da empresa no mapa ou na lista vira o H1 do detalhe (`empresa-{slug}`).
  - A linha do case vira o H1 do case (`case-{slug}`).
  - Os nomes são aplicados **só ao elemento clicado**, no clique, e removidos depois da transição, para nunca haver duplicata.
- **Duração percebida:** ≤ 400 ms (animação de 320 ms, rota pré-carregada pelo Next).
- **Sem suporte:** navegação instantânea.
- **Home via transição:** intro curta.

---

## 17. Microinterações (todas passaram pela regra de ouro)

| Elemento | Comportamento | Por que fica |
|---|---|---|
| Corte do hero | Segue o cursor; slider no teclado; scroll no mobile | É o conceito e explica o que a empresa vende |
| Links de texto | Sublinhado de 1 px desenha da esquerda para a direita (`scaleX`, `--dur-2`) e sai pela direita | O gesto único do corte aplicado à affordance |
| CTA primário | Fundo giz → branco; seta avança 4 px; `:active` `translateY(1px)`; **magnetismo ≤ 3 px** (zona = retângulo do botão + 24 px; deslocamento = `clamp(±3px)` de 12% da distância; volta em `--dur-2`), só em `(hover:hover) and (pointer:fine)` e sem reduced motion. **Só no hero, na 08 e no Sobre.** | Pedido pelo brief, aplicado à ação principal e a mais nada |
| Linhas de lista (O que construímos, cases, entradas da 08) | Hairline superior giz; texto `--text-2` → `--text-1`; seta de 4 px (`--dur-2`) | Mostra que a linha inteira é clicável (substitui "cards que reagem") |
| Mapa do ecossistema | Caminho em Rubrica + esmaecimento dos outros + ficha (`--dur-3`) | Informação revelada na interação ("imagens revelam informação") |
| Método | Fase aberta marcada por uma vertical em Rubrica; painel com crossfade | Mostra que existe um sistema, sem esconder nada |
| Capacidades | Hover numa faixa contorna a parte correspondente do botão | Liga a decisão ao objeto |
| Foco | `outline: 2px solid var(--focus-ring); outline-offset: 3px;` raio 0, em todo focável | Acessibilidade. Foco = onde se age |
| `::selection` | Fundo giz, texto breu (sobre papel: fundo tinta, texto papel) | Neutro, preserva a regra da Rubrica |
| Copiar e-mail | "Copiar" → "Copiado" por 1,2 s + `aria-live` | Utilidade |
| Ver por dentro | Camada com fade de 160 ms; pílula com Rubrica | O mecanismo proprietário em qualquer página |
| **Cursor** | **Nativo em todo o site** | Um cursor custom competiria com o corte e pioraria a precisão |

---

## 18. SEO

### 18.1 Metadados por página
Template: `title: { template: '%s — Gois Group', default: 'Gois Group — Desenvolvimento de sites e sistemas web' }`. `metadataBase` vem de `SITE_URL` (`lib/env.ts`).

| Rota | `title` | `description` | Index |
|---|---|---|---|
| `/` | Gois Group — Desenvolvimento de sites e sistemas web | A Gois Group projeta e desenvolve sites, plataformas e sistemas web para empresas, começando pela estrutura: arquitetura, código, dados e velocidade. | sim |
| `/empresas/` | Ecossistema — Gois Group | Empresas cuja estrutura digital foi construída ou é operada pela Gois Group, cada uma com o que construímos para ela e dados que podem ser conferidos. | sim |
| `/empresas/[slug]/` | {Nome} — Ecossistema — Gois Group | {descrição da empresa, ≤ 160 caracteres} | sim; placeholders nunca geram página em produção |
| `/cases/` | Cases, com fonte — Gois Group | Sites e sistemas construídos pela Gois Group, contados do problema ao resultado, com fonte, período e método de cada número. | sim |
| `/cases/este-site/` | Este site — Case Nº 000 — Gois Group | O primeiro case da Gois Group é o próprio site: construído em duas camadas, medido a cada versão e aberto para quem quiser ver por dentro. | sim |
| `/cases/[slug]/` | {Título} — Case Nº {nnn} — Gois Group | {tese do case, ≤ 160 caracteres} | sim; placeholders nunca geram página em produção |
| `/sobre/` | Sobre — Gois Group | Por que a Gois Group existe, no que acredita e como trabalha: sites construídos de dentro para fora, com método, engenharia e medição. | sim |
| `/contato/` | Iniciar um projeto — Gois Group | Conte o que precisa entrar no ar: um site novo, a reconstrução de um site existente, uma plataforma, um sistema ou uma parceria. | sim |
| `/privacidade/` | Política de privacidade — Gois Group | Como a Gois Group trata os dados enviados pelo formulário de contato deste site. | sim (só quando publicada) |
| 404 | Página não encontrada — Gois Group | — | `noindex` |

### 18.2 Técnico
- **`canonical`** por rota, com barra final (`trailingSlash: true`).
- **Open Graph:** `og:locale pt_BR`, `og:type website` (case: `article`), `og:image /og/default.png` 1200 × 630.
  - A imagem é tipográfica: fundo breu, símbolo de 96 px, "Construímos sites de dentro para fora." em Archivo 620 e a linha do corte em Rubrica.
  - É gerada uma vez e commitada.
- **X:** `summary_large_image`.
- **`app/sitemap.ts` e `app/robots.ts`** com `export const dynamic = 'force-static'`.
  - O sitemap lista só rotas publicadas (sem placeholders, sem 404; `/privacidade/` só quando publicada).
  - Com `NEXT_PUBLIC_SITE_ENV !== 'production'`: `robots` com `Disallow: /` e `<meta name="robots" content="noindex">` em todas as páginas.
- **JSON-LD:**
  - `Organization` (`name`, `url`, `logo: /marca/simbolo-512.png`, `slogan: "A estrutura por trás do que aparece."`, `sameAs` **só com redes reais**) e `WebSite` (`inLanguage: pt-BR`) no layout;
  - `BreadcrumbList` nas páginas internas;
  - `CreativeWork` nos cases publicados (`name`, `about`, `creator: Organization`; `dateCreated` só se conhecido).
- **Semântica:** um `h1` por página, hierarquia sem saltos, `lang="pt-BR"`, URLs limpas via `generateStaticParams`.

---

## 19. Acessibilidade: checklist de entrega

**Estrutura e leitura**
- [ ] `lang="pt-BR"`; landmarks `header`, `nav`, `main#conteudo`, `footer`; um `h1` por página, sem saltos de nível.
- [ ] Skip link é o primeiro focável e fica visível no foco.
- [ ] Listas reais (`ol`/`ul`) no mapa, no método, nos cases e nas entradas. `<table>` com `<caption>` e `th scope` só em dado tabular.
- [ ] Um DOM por componente, responsivo só por CSS. `matchMedia` só muda comportamento.
- [ ] SVGs decorativos com `aria-hidden="true"`; o link do logo tem nome acessível.
- [ ] Nenhum conteúdo em `::before`/`::after` que precise ser lido.
- [ ] A cópia do H1 e do subtítulo **não existe** (um H1 só, sem texto duplicado para o Ctrl+F).

**Cor e forma**
- [ ] Todos os pares de texto da tabela de §4.1 com ≥ 4,5:1 (texto pequeno) ou ≥ 3:1 (≥ 24 px ou 19 px bold).
- [ ] Gráficos e controles que carregam informação com ≥ 3:1 (`--line-ui`, marcadores `--text-2`/`--text-1`) **e** redundância por forma e texto.
- [ ] Status sempre por forma + texto. Erro por borda + ícone + texto, nunca só por cor.
- [ ] Nenhum glifo fora do subset (setas e marcadores em SVG; unidades com U+00A0).
- [ ] `prefers-contrast: more`: hachura some, linhas informativas vão para `--cinza-2`.
- [ ] `forced-colors: active`: `--focus-ring: Highlight`; camadas decorativas de estrutura (`.hero__estrutura`, `DentroOverlay`, hachuras) com `display:none`; marcadores em `CanvasText`.

**Teclado e foco**
- [ ] Tudo operável por teclado. Ordem de foco igual à ordem visual.
- [ ] Anel de foco em todo focável (2 px, offset de 3 px, Rubrica no escuro, tinta no papel).
- [ ] Corte do hero por `input[type=range]` com `aria-label` e `aria-valuetext`. Arrastar tem alternativa por setas e por clique no track (2.5.7).
- [ ] Método: disclosures com `aria-expanded`/`aria-controls` e troca **sem hover**.
- [ ] Ecossistema: Tab simples; ficha `aria-hidden`; reservados fora do foco + resumo oculto; nenhum `aria-live` em painel que muda com foco.
- [ ] Menu: foco preso, `inert` fora dele, Esc fecha, foco devolvido.
- [ ] Nenhum atalho de tecla única (2.1.4).
- [ ] Header nunca cobre o foco (`scroll-padding-top`; não se recolhe com foco dentro).
- [ ] Depois de uma navegação cliente, o foco vai para `#conteudo`; o anunciador de rota do Next fica ativo.

**Movimento e tempo**
- [ ] Nada se move sozinho depois da abertura do hero (1,1 s após T0). Nenhum loop (2.2.2).
- [ ] `prefers-reduced-motion`: sem varredura, revelações, magnetismo, explosão, wipe da Visão nem transição com deslocamento (fade de 120 ms). Tudo utilizável.
- [ ] Nenhum conteúdo oculto por mais de 1 s depois de entrar na viewport. Sem JS, nada fica oculto (as regras de revelação só existem sob `html.js`).

**Texto e zoom**
- [ ] Zoom de 200% aumenta todo o texto (escala com razão ≤ 2,5). Nenhum tamanho de fonte limitado por unidade de altura.
- [ ] Reflow a 320 px sem rolagem horizontal, exceto dentro das regiões de tabela roláveis e rotuladas.
- [ ] Espaçamento de texto (1.4.12) sem cortes: nenhuma altura fixa em contêiner de texto.

**Formulário**
- [ ] `label` explícito em todo campo; `fieldset`/`legend` nos grupos; `autocomplete` correto.
- [ ] Obrigatórios marcados em texto ("obrigatório"), não só por asterisco.
- [ ] Erros com `aria-invalid` + `aria-describedby`; resumo focado no envio; nenhum campo obrigatório escondido.
- [ ] Estados de envio anunciados (`aria-busy`, `role="status"` no sucesso).
- [ ] Alvos com no mínimo 44 × 44 px.

**Imagens**
- [ ] Logos de empresas com `alt` (fornecido pela empresa). Capturas de case com `alt` descritivo e legenda. OG sem texto essencial exclusivo.

---

## 20. Performance

| Métrica | Meta (p75, 4G, validada em CI com Lighthouse CI e no painel Performance) |
|---|---|
| LCP | ≤ 1,8 s (o H1 é texto SSR pintado em t=0) |
| CLS | ≤ 0,02 (fallbacks de fonte calibrados, alturas reservadas, camadas absolutas) |
| INP | ≤ 150 ms |
| Fontes | 58,5 KB (Archivo 34,9 com preload + Martian 23,6 sem preload) |
| JS próprio (sem o runtime do Next e do React) | ≤ 25 KB gz no total. Carregado sob demanda: `CutPlane` ≤ 4; `Reveal` ≈ 1; `TransitionLink`/`NavigationListener` ≈ 1,5; `Conectores` ≈ 1,5; `MedicaoAoVivo` ≈ 1,2; `DentroOverlay` ≈ 3 (só ao ligar); `Formulario` ≈ 5 (só em `/contato/`) |
| CSS | ≤ 30 KB gz |
| Imagens | Zero bitmaps além do ruído (2 KB), do OG e dos ícones |
| Animações | Só `transform` e `opacity`. `clip-path` apenas em revelações ≤ 560 ms, na transição de 320 ms e no menu. Scroll ligado a animação só por CSS scroll-driven dentro de `@supports`. Nenhum repaint por quadro na thread principal. |

---

## 21. Implementação

### 21.1 Estrutura de pastas (sobre o scaffold existente)
```
site-gois-group/
  app/
    layout.tsx            fontes, script inline do <head>, Header, Footer, NavigationListener, SkipLink, JSON-LD
    fonts.ts              §4.2
    page.tsx              Home (§8)
    not-found.tsx         404 (§14.9)
    sitemap.ts · robots.ts (existentes, completar) · icon.svg · apple-icon.png
    empresas/page.tsx · empresas/[slug]/page.tsx
    cases/page.tsx · cases/[slug]/page.tsx          (este-site é o case numero '000')
    sobre/page.tsx · contato/page.tsx · privacidade/page.tsx
  components/
    marca/      Simbolo.tsx (48 · 32 · 16) · Lockup.tsx
    layout/     Header.tsx · MenuMobile.tsx · Footer.tsx · SkipLink.tsx · TransitionLink.tsx · NavigationListener.tsx
    hero/       Hero.tsx (server) · CutPlane.tsx (client, dynamic) · levantamento.ts (pura) · Hero.module.css
    secoes/     QuemE · OQueConstruimos · Metodo · Ecossistema · Capacidade · Numeros · Visao · PorQue · ProximoPasso
    ecossistema/ MapaEmpresas.tsx · Conectores.tsx (client) · FichaEmpresa.tsx
    cases/      LinhaCase.tsx · CapitulosCase.tsx · TabelaMetricas.tsx · MetricasBuild.tsx (client)
    medicao/    MedicaoAoVivo.tsx (client)
    dentro/     VerPorDentroBotao.tsx · DentroOverlay.tsx (client, dynamic) · DentroPill.tsx
    contato/    Formulario.tsx (client) · campos.ts · mailto.ts
    sistema/    Rotulo · Reveal (client) · Seta · Icone · StatusMarcador · DadoPendente · Numero · Botao (magnetismo) · RegiaoTabela
  content/
    site.ts · empresas.ts · cases.ts · numeros.ts · metodo.ts · capacidades.ts · copy/{home,sobre,contato,empresas,cases,comum}.ts
    generated/derivados.json           (gerado no prebuild; listado no .gitignore)
  lib/
    pending.ts (existente) · env.ts (existente) · conteudo.ts (tipos, validar()) · formatar.ts (pt-BR, U+00A0)
    contraste.ts (WCAG) · medir.ts (usada pelo Levantamento e pelo DentroOverlay) · breakpoints.ts · seo.ts
  hooks/
    useReducedMotion.ts (existente) · useEmVista.ts
  styles/
    tokens.css · base.css · tipografia.css · grid.css · motion.css · utilitarios.css (sr-only, hachura)
  scripts/
    build-marca.py · derive-tokens.mjs · check-content.mjs · measure-build.mjs · checar-sinais.mjs
  public/
    marca/{wordmark.svg, lockup.svg, simbolo.svg, simbolo-512.png} · og/default.png · textura/ruido.png
```
**`package.json` (scripts):**
- `"prebuild": "node scripts/derive-tokens.mjs && node scripts/check-content.mjs"`
- `"postbuild": "node scripts/measure-build.mjs"`
- `"predeploy": "node scripts/checar-sinais.mjs"`
- `"pendencias": "node scripts/check-content.mjs --listar"`

**Dependências de runtime:** `next`, `react`, `react-dom`, `@fontsource-variable/archivo`, `@fontsource-variable/martian-mono`. Mais nada. `fontTools` é Python, usado só em dev para a marca.

### 21.2 Modelo de conteúdo (`lib/conteudo.ts`, sobre `lib/pending.ts`)
```ts
import type { Maybe } from './pending'
export type Validar = { readonly __validar: true; readonly texto: string; readonly aprovado: boolean }
export const validar = (texto: string, aprovado = false): Validar => ({ __validar: true, texto, aprovado })
export type Texto = string | Validar

export type Status = 'em-operacao' | 'em-construcao' | 'em-evolucao'
export type Relacao = 'estrutura-construida' | 'estrutura-operada' | 'empresa-do-grupo' | 'parceira'
export type Escopo = 'site' | 'plataforma' | 'sistema' | 'produto' | 'reconstrucao'

export interface Medida {
  id: string; rotulo: string; definicao: string; unidade?: string
  calculo: 'manual' | 'derivado'
  valor: Maybe<number>; fonte: Maybe<string>; periodo: Maybe<string>; verificadoEm: Maybe<string> // AAAA-MM
}
export interface Empresa {
  slug: string; codigo: `E-${string}`; ordem: number            // ordem = slot do mapa
  placeholder: boolean; publicar: boolean
  nome: Maybe<string>; logoSvg?: string; logoAlt?: string        // logo só se fornecido pela empresa
  segmento: Maybe<string>; descricao: Maybe<string>              // ≤ 160
  status: Maybe<Status>; relacao: Maybe<Relacao>; desde: Maybe<string>
  website: Maybe<string>
  escopo: Maybe<{ item: Escopo; texto: string }[]>
  numeros: Medida[]                                              // ≤ 3
  caseSlug?: string
}
export interface Case {
  numero: string; slug: string; placeholder: boolean; publicar: boolean
  titulo: Maybe<string>; tese: Maybe<string>; empresaSlug?: string
  estrutura: Maybe<Escopo[]>; periodo: Maybe<{ inicio: string; lancamento?: string }>
  status: Maybe<Status>; website: Maybe<string>
  capitulos: Record<'problema'|'oportunidade'|'estrategia'|'construcao'|'passouAExistir'|'resultado', Maybe<string>>
  stack?: { tecnologia: string; paraQue: string }[]
  metricas: (Medida & { antes: Maybe<number>; depois: Maybe<number>; metodo: Maybe<string> })[]
  metricasDoBuild?: true                                         // só o Nº 000
}
```
**Exemplo de placeholder:**
```ts
{ slug:'empresa-01', codigo:'E-01', ordem:1, placeholder:true, publicar:false,
  nome: pending('[EMPRESA 01 — nome a confirmar]'), segmento: pending('[SEGMENTO — a confirmar]'), … }
```

### 21.3 `scripts/check-content.mjs` (gates)
| Regra | Homologação | Produção |
|---|---|---|
| `Validar` com `aprovado:false` | lista | **falha** |
| `Medida` com `valor` definido mas sem `fonte`, `periodo` ou `verificadoEm` | **falha** | **falha** |
| Métrica de case sem `fonte` e `periodo` | **falha** | **falha** |
| Placeholder com `publicar:true` | **falha** | **falha** |
| Nenhum canal (`NEXT_PUBLIC_CONTACT_ENDPOINT` nem `NEXT_PUBLIC_CONTACT_EMAIL`) | faixa de aviso | **falha** |
| `NEXT_PUBLIC_SITE_URL` ausente | aviso (usa `.example`) | **falha** |
| Texto de `/privacidade/` ou controlador pendente | aviso | **falha** |
| Mais de 3 espaços reservados visíveis | **falha** | **falha** |
| Caracteres proibidos na copy (→ ← ↗ ≤ ● ○ ◐ № U+202F) | **falha** | **falha** |
| Palavras vetadas (§3) na copy | aviso | **falha** |

### 21.4 Script inline do `<head>` (antes do primeiro paint)
```html
<script>(function(){var d=document.documentElement;d.classList.add('js');
try{var s=sessionStorage;d.dataset.intro=s.getItem('gg:intro')?'curta':'completa';s.setItem('gg:intro','1');
if(s.getItem('gg:dentro')==='1')d.dataset.dentro='on'}catch(e){d.dataset.intro='curta'}})();</script>
```
São as duas únicas chaves de armazenamento do site. Nada de `localStorage`, cookies ou rastreadores.

### 21.5 Variáveis de ambiente
| Variável | Origem | Uso |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | deploy | canonical, OG, sitemap (`lib/env.ts`) |
| `NEXT_PUBLIC_SITE_ENV` | deploy (`production`/`preview`) | gates, `robots`, `noindex` |
| `NEXT_PUBLIC_SHOW_PENDING` | preview = `1` | `<DadoPendente>` visível, páginas-modelo |
| `NEXT_PUBLIC_BUILD_SHA` · `NEXT_PUBLIC_BUILD_DATE` | `next.config.ts` (`git rev-parse --short HEAD`, data ISO) | hero, rodapé, Nº 000, payload |
| `NEXT_PUBLIC_CONTACT_ENDPOINT` | deploy | envio do formulário |
| `NEXT_PUBLIC_CONTACT_EMAIL` | deploy | `mailto` e e-mail visível |
| `PERMITIR_SINAL_FALHO` | manual | libera o `checar-sinais` |

---

## 22. Pendências (dados e validações)

### 22.1 Dados `[PENDENTE]`
| Dado | Onde aparece | Sem o dado | Bloqueia produção? |
|---|---|---|---|
| Empresas (todos os campos de §9.6) | Home 04, `/empresas/`, rodapé | 3 espaços reservados + "Nenhuma empresa publicada." | não |
| Cases | `/cases/`, Home 07 | Nº 000 real + 2 espaços reservados | não |
| Sites e sistemas lançados | Home 05.2 | quadro pendente | não |
| Pessoas alcançadas por mês | Home 05.2 | quadro pendente | não |
| p75 de LCP dos sites entregues | Home 07 | não aparece | não |
| Início do projeto deste site | Nº 000 | `[PENDENTE]` na homologação; em produção a linha de período mostra só a data de lançamento | não |
| E-mail **ou** endpoint do formulário | contato, rodapé, menu | — | **sim** (pelo menos um) |
| Domínio | canonical, OG, sitemap | `.example` na homologação | **sim** |
| Texto da política de privacidade, controlador, retenção, encarregado | `/privacidade/` | — | **sim** |
| Razão social, CNPJ | rodapé, privacidade | célula oculta no rodapé | por meio da privacidade |
| Redes oficiais | rodapé, JSON-LD `sameAs` | célula oculta | não |
| Fundação, fundadores, marcos | Sobre 06 | seção não renderizada | não |
| Prazo de resposta | contato | não exibido | não |
| Faixas de investimento | contato | campo inexistente | não |

### 22.2 Compromissos e ofertas `[VALIDAR]`
1. Os cinco tipos de estrutura, em especial "lojas virtuais" e "Reconstrução de sites existentes", e os cinco "Pronto quando" (§8-02).
2. Os seis critérios de passagem do Método Prumo (§10).
3. Os seis compromissos da seção 07 (§8-07).
4. A promessa do botão ("uma leitura do seu caso, não um orçamento genérico") (§11.2) e o corpo da 08.
5. "Continuar responsável depois do lançamento" (Sobre 01) e o Modelo (Sobre 04).
6. A relação "Empresa do grupo" como categoria do ecossistema.
7. "O que acontece depois" no contato e a base legal do aviso de privacidade.

---

## 23. Cortado deliberadamente

| Cortado | Por quê |
|---|---|
| Headline "Construímos a estrutura." | Não diz *sites*; lê como construtora ou holding |
| "Colocamos empresas no ar." como H1 | Ambígua (venture builder ou emissora). Foi para o título da 08 |
| "Sites que sustentam empresas." | Correta, mas pouco memorável; quebra fraca |
| Símbolo "G de corte" circular | Topologia do G do Google |
| Símbolos "G-perfil" e "Fresta" | Genérico / não se lê como G |
| Texto vazado (`-webkit-text-stroke`) no H1 e no rodapé | Tropo datado; prejudica a leitura e o LCP |
| Máscara ou véu na headline | O conteúdo nunca espera; o site exibe a própria medição |
| Piloto automático no hero | WCAG 2.2.2; quebra o silêncio |
| Script inline injetando SVG antes da hidratação | Mismatch de hidratação no React 19 |
| Canvas de tela cheia, spot de luz seguindo o cursor, máscara radial em cards | Tropo de template, 23 MB de memória, repaint no scroll |
| BSP/Mondrian semeada | Genérica; o visual gerado deriva do layout medido |
| Modo Estrutura no header e medidor de profundidade fixo | Header lotado; navegação por pontos de template |
| Contadores "01 / 08" e rótulos de seção em mono | Default convergente, cara de folha de especificação |
| Códigos S-, M-, V-, C-, T-, N-, L0–L5, P2.4 | Excesso de códigos; lembrava diagrama de camadas de SaaS |
| Vocabulário de obra (zarcão, subsolo, prancha, carimbo, núcleo rígido, linha de carga, reforço estrutural, planta, lote) | Obriga a decodificar |
| Vocabulário de cinema (plano-sequência, estreia, sinal, programa, storyboard, créditos) | Leitura de produtora ou broadcast |
| Bloco de dicionário "estrutura digital · s.f." | Tropo gasto |
| "Toda empresa já é, em parte, software.", visões de VC, "Empresas serão tão sólidas…" | Derivativas / genéricas |
| "Contato criado no CRM com resposta automatizada" | Falso para este site |
| "L0 · design system-base comum a todas as empresas" | Afirma fato não confirmado |
| "Serão publicadas", "em montagem", "publicação em andamento", "case em preparação" | Sugerem existência |
| Mural bento 4 × 3, molduras ilustradas por serviço, carrossel horizontal | Cards disfarçados |
| Oito empresas-fantasma e páginas de placeholder em produção | Simulam escala |
| Wordmark gigante de ponta a ponta no rodapé | Tropo de agência |
| Grão fixo em tela cheia | Camada de composição permanente; o ruído vive só no hero |
| Hachura no hover dos CTAs | Enfeite; o botão sólido já mostra a área |
| Formulário em wizard, faixa de investimento sem faixas definidas | Atrito, erros escondidos, campo sem dado |
| Seção do método fixa com rolagem longa (cerca de 420vh) e "plano aberto" de 40vh por seção | Home cansativa |
| Medição ao vivo no primeiro viewport | Mostraria "não disponível" no Safari e no Firefox justo na abertura |
| "Peso transferido" medido com `encodedBodySize` | Rótulo mentiroso; usamos `transferSize` com "Em cache" |
| Contagem animada de números | Exibe valores falsos durante a animação |
| WebGL/3D, partículas, parallax por seção, cursor custom, smooth-scroll de biblioteca, preloader, palavras que acendem com o scroll, marquee de logos, glassmorphism, glow, gradiente mesh | Não passam na regra de ouro |
| Barra de progresso de navegação | O export estático com prefetch já é instantâneo |
| Linha Rubrica nas transições de página | Redundante: a borda entre as páginas já é o corte |
