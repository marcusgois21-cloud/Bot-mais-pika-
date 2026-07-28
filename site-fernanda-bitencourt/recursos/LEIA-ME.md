# Recursos visuais — a colocar

Não incluí fotos da vereadora porque não encontrei uma imagem de licença
claramente pública/livre, e não é correto baixar e hospedar fotos de redes
sociais ou da imprensa (direito de imagem/autoral). As molduras do site já estão
prontas, no tamanho certo, esperando os arquivos abaixo.

## Imagens necessárias (fornecidas pela cliente ou de fonte licenciada)
- `fernanda-hero.jpg` — retrato principal do herói, proporção **4:5** (retrato).
- `fernanda-historia.jpg` — foto da seção "Quem é", proporção **4:5**.
- `fernanda-og.jpg` — cartão de compartilhamento (Open Graph), **1200×630**.
- `fernanda-capa.jpg` — capa do app/marketplace, proporção **3:2**.
- `fernanda-favicon.png` — ícone/monograma, **256×256**.

## Como colocar no site
1. Suba os arquivos para a pasta pública de assets do app (`/assets/...`).
2. No `codigo/index.tsx`, troque as `moldura-vazia` do herói e da seção "Quem é"
   por `<img src="/assets/fernanda-hero.jpg" ... />` (já há um comentário no
   ponto exato).
3. Confira os caminhos em `codigo/app-meta.json` (og, favicon, capa).

## Importante (conteúdo a confirmar com a vereadora)
- As **prioridades** e a **mensagem** do site são um rascunho plausível, não uma
  declaração publicada dela. Substituir pelo programa/fala reais quando o
  gabinete enviar.
- Fatos já confirmados por fontes públicas: cargo, partido, número de urna,
  votos, datas de eleição e posse, cidade e data de nascimento.
