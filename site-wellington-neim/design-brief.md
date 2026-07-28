# Design brief: site institucional Wellington Neim

## Design read
Site oficial de um presidente de Câmara Municipal do interior de Minas Gerais.
Público: eleitores, imprensa local e instituições. Registro emocional: confiança,
seriedade, proximidade. Deve parecer papelaria oficial de alto padrão, nunca
template ou "site de IA".

## Concept spine
**"Papel timbrado vivo".** A página é o papel timbrado da Presidência da Câmara
levado para a tela: papel creme, tinta azul-marinho, filetes finos, tipografia de
documento oficial, retrato real. Cada seção é uma peça do dossiê público do
mandato (números, trajetória, bandeiras, palavra, atos, gabinete).

## Delivery tier
`editorial`. O usuário escolheu explicitamente "Institucional clássico" na
entrevista (não animado). Micro-movimento apenas, motivado e discreto.

## Locked palette
- Papel: `#F4EFE6` (fundo), painel claro `#FBF8F2`, faixa bege `#E9E0CE`
- Tinta azul-marinho (ÚNICO acento, display, CTAs): `#1E3A5C`, hover `#152C47`
- Texto tinta: `#23211C`; texto sobre azul: `#F4EFE6`; apoio: `#6B655A`
Defesa: são as cores da marca pedidas pelo cliente ("bege e azul"). Base neutra
quente única, um acento só, sem dourado/latão (família banida evitada), sem neon,
sem roxo.

## Locked type
- Display: **Source Serif 4** (serif). Justificativa de marca: instituição
  cívica/heráldica genuína (Presidência de Câmara Municipal centenária), registro
  editorial-institucional de documento oficial; o cliente vetou a estética
  "IA/startup". Não é Fraunces/Instrument (banidas como default).
- Corpo/UI: **Public Sans** (desenhada para setor público; neutra sem ser Inter).

## Animation mode
Animation mode: non-animated — usuário escolheu "Institucional clássico" na
entrevista de abertura (opção Não animado). Tier editorial: entrada suave no
carregamento (dispara no mount, nunca opacity-0 esperando viewport), contadores
dos números do mandato ao rolar (transform/números apenas), sublinhado que cresce
em links, sombra/filete na navegação ao rolar. Tudo com fallback
`prefers-reduced-motion`.

## Combinatorial pick (vale para TODOS os painéis)
- Theme paradigm: Pristine Light (papel creme, tinta azul-marinho)
- Background character: papel tátil com grão sutilíssimo
- Typography character: serifa editorial + sans (pareamento)
- Hero architecture: masthead editorial deslocado (cabeçalho de papel timbrado;
  NUNCA o split texto-esquerda/foto-direita clássico)
- Section system: blocos editoriais alternados
- Signature components: faixa de métricas gigante · linhas de ritmo verticais ·
  editorial fora de grade · molduras de recorte de imagem
- Narrative spine: arquivo/dossiê
- Second-read moment: UM numeral gigante como estrutura ("1.060" na faixa de
  números), usado uma única vez

## Section plan (7 seções, 7 famílias distintas, máx. 2 eyebrows)
1. **Herói**: masthead editorial: filete fino no topo com o cargo (eyebrow),
   nome gigante em serifa atravessando a página, subtexto ≤20 palavras e CTAs à
   esquerda, retrato real deslocado à direita em moldura de filete (âncora:
   top-left lead/masthead). Família: masthead editorial.
2. **Mandato em números**: faixa full-width azul-marinho, 4 contadores (1.060
   votos; 2º mais votado; 2 mandatos; requerimentos aprovados por unanimidade).
   Família: stat band.
3. **Trajetória**: linha do tempo vertical com anos em serifa e filetes.
   Família: timeline.
4. **Bandeiras**: bento assimétrico de 5 células (1 grande + 4), variação por
   tinta (célula azul, células papel, 1 célula com prancha gravada da ponte).
   Família: bento.
5. **Palavra do presidente**: citação real da posse, full-width, aspas
   tipográficas. Família: quote.
6. **Atuação recente**: lista editorial de atos/notícias reais com datas e fonte.
   Família: article list.
7. **Gabinete**: painel de encerramento azul com contatos oficiais e CTA.
   Família: CTA panel.

## Asset plan
- Herói: retrato real fornecido pelo cliente (`wellington-hero.jpg`).
- Prancha "gravura da ponte de Ponte Nova": ilustração estilo gravura em metal,
  traço azul-marinho sobre papel creme (gerada).
- OG card + capa 3:2 por `references/app-cover.md`; favicon monograma WN.
- Sem textura extra: o papel é liso.

## CTA inventory (chrome próprio por CTA)
- **"Fale comigo"** (primário; herói e gabinete, mesma intenção, mesmo rótulo):
  bloco azul sólido, texto papel, prensa sutil no clique (translate-y 1px),
  destino Instagram DM até o cliente enviar WhatsApp oficial.
- **"Ver atuação"** (secundário do herói): link tipográfico com sublinhado que
  cresce da esquerda; âncora para a seção 6.
- **Linhas de notícia**: a linha inteira é o alvo; seta desliza 4px no hover,
  rótulo "Ler na fonte".
- **Navegação**: wordmark tipográfico + 4 âncoras com sublinhado fino no hover.

## Copy
Português formal-próximo, frases curtas, zero travessão em texto visível, só
fatos reais (TSE, Câmara, imprensa local). Rodapé com aviso de fontes públicas.

## Nota de execução
Os painéis de referência e a gravura da ponte (fase de imagens geradas) não
foram produzidos: o espaço de trabalho está sem créditos de geração. O design
foi construído diretamente sobre este brief, com a foto real do cliente e
recursos tipográficos feitos à mão (OG, capa, favicon via Pillow).
