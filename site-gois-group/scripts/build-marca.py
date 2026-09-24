#!/usr/bin/env python3
"""
Gera o wordmark "GOIS GROUP" em contornos (spec §5.2) — roda uma vez, em dev.
Archivo wght 640 · wdth 112 · CAIXA ALTA · tracking +0,06 em. Licença OFL permite a conversão.
Saída: public/marca/{wordmark,simbolo,lockup}.svg e components/marca/wordmark.generated.ts
Uso: python3 scripts/build-marca.py   (requer fontTools + brotli)
"""
import io, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FONTE = RAIZ / 'node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2'
TEXTO = 'GOIS GROUP'
TRACKING = 0.06  # em

font = TTFont(str(FONTE))
inst = instancer.instantiateVariableFont(font, {'wght': 640, 'wdth': 112})
buf = io.BytesIO(); inst.flavor = None; inst.save(buf); buf.seek(0)
f = TTFont(buf)
upm = f['head'].unitsPerEm
cap = f['OS/2'].sCapHeight
cmap = f.getBestCmap()
gs = f.getGlyphSet()
hmtx = f['hmtx']

pen = SVGPathPen(gs)
x = 0
for i, ch in enumerate(TEXTO):
    g = cmap[ord(ch)]
    # y para baixo: espelha e desloca pela altura de versal
    tp = TransformPen(pen, (1, 0, 0, -1, x, cap))
    gs[g].draw(tp)
    x += hmtx[g][0] + (TRACKING * upm if i < len(TEXTO) - 1 else 0)

bp = BoundsPen(gs)
x2 = 0
for i, ch in enumerate(TEXTO):
    g = cmap[ord(ch)]
    tp = TransformPen(bp, (1, 0, 0, -1, x2, cap)); gs[g].draw(tp)
    x2 += hmtx[g][0] + (TRACKING * upm if i < len(TEXTO) - 1 else 0)
xmin, ymin, xmax, ymax = bp.bounds
largura = xmax - xmin
d = pen.getCommands()

# normaliza: origem em xmin, altura de versal = cap unidades
def svg(conteudo, w, h):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" fill="currentColor">{conteudo}</svg>\n'

vb_w, vb_h = largura, ymax - ymin
path = f'<path transform="translate({-xmin:.0f} {-ymin:.0f})" d="{d}"/>'
(RAIZ / 'public/marca').mkdir(parents=True, exist_ok=True)
(RAIZ / 'public/marca/wordmark.svg').write_text(svg(path, vb_w, vb_h).replace('currentColor', '#EEEDE8'))

SIMBOLO = '<path d="M0 0H48V8H8V40H28V48H0Z"/><path d="M32 20H48V48H32V40H40V28H32Z"/>'
(RAIZ / 'public/marca/simbolo.svg').write_text(svg(SIMBOLO, 48, 48).replace('currentColor', '#EEEDE8'))

# lockup: símbolo S = 2h, centrado na altura de versal; espaço 0,75h (h = altura de versal)
h = cap
S = 2 * h
esp = 0.75 * h
escala_s = S / 48
lock_w = S + esp + largura
lock = (f'<g transform="scale({escala_s:.5f})">{SIMBOLO}</g>'
        f'<g transform="translate({S + esp - xmin:.1f} {(S - h) / 2:.1f})"><path d="{d}"/></g>')
(RAIZ / 'public/marca/lockup.svg').write_text(svg(lock, lock_w, S).replace('currentColor', '#EEEDE8').replace('<svg ', '<svg overflow="visible" ', 1))

ts = f"""// Gerado por scripts/build-marca.py — não editar à mão.
// Archivo wght 640 · wdth 112 · tracking +0,06 em. Coordenadas em unidades da fonte (UPM {upm}).
export const WORDMARK = {{
  largura: {largura:.0f},
  versal: {cap},
  xmin: {xmin:.0f},
  ymin: {ymin:.0f},
  ymax: {ymax:.0f},
  d: {d!r},
}} as const
"""
(RAIZ / 'components/marca/wordmark.generated.ts').write_text(ts.replace("d: '", 'd: \'', 1))
print(f'UPM {upm} · versal {cap} · largura {largura:.0f} ({largura / cap:.2f} × versal) · path {len(d)} chars')
