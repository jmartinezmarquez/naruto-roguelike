"""
Sprites de los 8 objetos añadidos el 2026-10-14, en `src/assets/items/<id>.png`.

Uso:  python scripts/generar-sprites-objetos-nuevos.py      (necesita Pillow)

Tiene DOS modos, y elige solo:

1. **Si existe `src/assets/sprite-objetos-nuevos.png`** (la hoja del artista), la
   RECORTA. Si no trae transparencia, primero borra el fondo pintado. Los dibujos se
   leen en orden de lectura —por filas de arriba abajo y, dentro de cada fila, de
   izquierda a derecha—, separados por filas y columnas vacías, y se asignan a
   `IDS_EN_LA_HOJA` en ese orden. Cada uno
   sale en un cuadrado con margen, reducido a 116 px como el resto de `assets/items/`.
   Es el mismo método que `generar-sprites-pergaminos.py`.
2. **Lo que no está en la hoja** (o todo, si no hay hoja) se DIBUJA: un icono provisional geométrico por objeto, para que la
   tienda y la mochila no enseñen una caja vacía mientras llega el arte. Están en
   "Pendiente de arte" del roadmap.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.
"""

import os

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'sprite-objetos-nuevos.png')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'items')

# Todos los objetos de esta tanda: los que no estén en la hoja salen provisionales.
IDS = [
    'unguento_curativo',
    'kit_ninja_medico',
    'manual_jonin',
    'pesas_de_lee',
    'cuchillas_de_asuma',
    'chaleco_chunin',
    'bolsa_de_sellos_explosivos',
    'talisman_ocho_puertas',
]

# Qué hay en la hoja, en orden de lectura. La que llegó el 2026-10-14 trae 7 de los 8
# —faltan las pesas de Lee, que siguen provisionales— y en otro orden que el encargado,
# así que se asignan por lo que se ve en cada dibujo.
IDS_EN_LA_HOJA = [
    'cuchillas_de_asuma',          # dos kunai con cinta roja
    'chaleco_chunin',              # chaleco verde
    'bolsa_de_sellos_explosivos',  # bolsa con sellos 爆
    'talisman_ocho_puertas',       # talismán 八門 en llamas
    'unguento_curativo',           # tarro abierto
    'kit_ninja_medico',            # bolsa con la cruz roja
    'manual_jonin',                # libro verde
]

LADO_FINAL = 116
MARGEN = 0.04
ALFA_MINIMO = 16
# Entre el kunai y el chaleco hay muy poco aire: con 8 columnas los dos salían pegados.
HUECO_MINIMO = 3
# Lo que no llega a esto de ancho es una mota suelta (una brasa del talismán), no un dibujo.
ANCHO_MINIMO = 40

# ---------------------------------------------------------------- modo 1: recortar


def tramos(lleno):
    """Rangos [a, b) de posiciones llenas separados por al menos HUECO_MINIMO vacías."""
    resultado, inicio, vacias = [], None, 0
    for i, hay in enumerate(lleno):
        if hay:
            if inicio is None:
                inicio = i
            vacias = 0
        elif inicio is not None:
            vacias += 1
            if vacias >= HUECO_MINIMO:
                resultado.append((inicio, i - vacias + 1))
                inicio, vacias = None, 0
    if inicio is not None:
        resultado.append((inicio, len(lleno)))
    return resultado


def cuadrar(dibujo):
    lado = round(max(dibujo.size) * (1 + 2 * MARGEN))
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(dibujo, ((lado - dibujo.width) // 2, (lado - dibujo.height) // 2), dibujo)
    return lienzo.resize((LADO_FINAL, LADO_FINAL), Image.Resampling.LANCZOS)


def quitar_fondo_pintado(hoja):
    """
    La hoja llegó en RGB con el damero gris PINTADO, no con transparencia (como las de
    chakra, ver generar-sprites-iconos.py). Se borra por **inundación desde el borde**
    sobre lo claro y sin color: el contorno negro de cada dibujo frena el relleno, así
    que los blancos de DENTRO —la venda del kit, la etiqueta del tarro— no se tocan,
    que es lo que haría un umbral global.
    """
    rgb = hoja.convert('RGB')
    ancho, alto = rgb.size
    px = rgb.load()

    def es_fondo(x, y):
        r, g, b = px[x, y]
        return min(r, g, b) >= 190 and max(r, g, b) - min(r, g, b) <= 18

    fondo = bytearray(ancho * alto)
    pila = [(x, y) for x in range(ancho) for y in (0, alto - 1)] + [(x, y) for y in range(alto) for x in (0, ancho - 1)]
    while pila:
        x, y = pila.pop()
        i = y * ancho + x
        if fondo[i] or not es_fondo(x, y):
            continue
        fondo[i] = 1
        if x > 0: pila.append((x - 1, y))
        if x < ancho - 1: pila.append((x + 1, y))
        if y > 0: pila.append((x, y - 1))
        if y < alto - 1: pila.append((x, y + 1))

    resultado = rgb.convert('RGBA')
    resultado.putalpha(Image.frombytes('L', (ancho, alto), bytes(0 if v else 255 for v in fondo)))
    return resultado


def recortar_hoja():
    hoja = Image.open(HOJA)
    hoja = hoja.convert('RGBA') if 'A' in hoja.getbands() else quitar_fondo_pintado(hoja)
    alfa = hoja.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0)
    datos = alfa.load()
    filas = tramos([any(datos[x, y] for x in range(hoja.width)) for y in range(hoja.height)])
    trozos = []
    for y0, y1 in filas:
        alturas = [sum(1 for y in range(y0, y1) if datos[x, y]) for x in range(hoja.width)]
        for x0, x1 in tramos([h > 0 for h in alturas]):
            if x1 - x0 >= ANCHO_MINIMO:
                trozos.append((x0, x1, y0, y1, alturas))

    # ⚠️ **Dos dibujos que se tocan no se separan por huecos**: en la hoja del
    # 2026-10-14 la cinta del kunai roza el chaleco y salían como uno solo. Mientras
    # falten dibujos, el trozo más ancho se parte por su columna MÁS FINA de la zona
    # central — una cinta que roza no es un hueco, pero se mide igual de bien. Es lo
    # mismo que hace generar-sprites-proyectiles.py con el fuego que sale del puño.
    while len(trozos) < len(IDS_EN_LA_HOJA):
        i = max(range(len(trozos)), key=lambda k: trozos[k][1] - trozos[k][0])
        x0, x1, y0, y1, alturas = trozos[i]
        margen = (x1 - x0) // 5
        corte = min(range(x0 + margen, x1 - margen), key=lambda x: alturas[x])
        trozos[i:i + 1] = [(x0, corte, y0, y1, alturas), (corte, x1, y0, y1, alturas)]

    dibujos = []
    for x0, x1, y0, y1, _ in trozos:
            trozo = hoja.crop((x0, y0, x1, y1))
            dibujos.append(trozo.crop(trozo.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0).getbbox()))
    if len(dibujos) != len(IDS_EN_LA_HOJA):
        raise SystemExit(f'La hoja tiene {len(dibujos)} dibujos y IDS_EN_LA_HOJA dice {len(IDS_EN_LA_HOJA)}: {IDS_EN_LA_HOJA}')
    return dict(zip(IDS_EN_LA_HOJA, map(cuadrar, dibujos)))

# ---------------------------------------------------------------- modo 2: dibujar


LADO = 29
ESCALA = 4
CONTORNO = (34, 28, 30, 255)

# Cada icono: lista de rectángulos (x0, y0, x1, y1, color), inclusivos, en un lienzo de 29×29.
C = {
    'verde': (88, 160, 92, 255), 'verde_osc': (52, 110, 60, 255),
    'crema': (232, 218, 182, 255), 'blanco': (240, 236, 228, 255), 'rojo': (200, 56, 48, 255),
    'naranja': (226, 128, 48, 255), 'gris': (170, 176, 184, 255), 'gris_osc': (100, 106, 116, 255),
    'madera': (120, 78, 44, 255), 'morado': (128, 76, 168, 255), 'oro': (226, 186, 72, 255),
    'oliva': (92, 112, 64, 255), 'oliva_osc': (64, 80, 44, 255),
}
ICONOS = {
    'unguento_curativo': [(9, 6, 19, 8, C['madera']), (8, 9, 20, 22, C['verde']), (10, 12, 18, 19, C['crema'])],
    'kit_ninja_medico': [(5, 8, 23, 22, C['blanco']), (11, 5, 17, 8, C['gris']), (12, 10, 16, 20, C['rojo']), (9, 13, 19, 17, C['rojo'])],
    'manual_jonin': [(6, 5, 22, 23, C['verde_osc']), (8, 7, 20, 21, C['oliva']), (6, 5, 8, 23, C['madera']), (11, 10, 17, 11, C['oro']), (11, 13, 17, 14, C['oro'])],
    'pesas_de_lee': [(4, 9, 11, 19, C['naranja']), (17, 9, 24, 19, C['naranja']), (11, 12, 17, 16, C['gris_osc'])],
    'cuchillas_de_asuma': [(13, 3, 15, 16, C['gris']), (9, 16, 19, 18, C['gris_osc']), (12, 19, 16, 25, C['madera'])],
    'chaleco_chunin': [(7, 7, 21, 23, C['oliva']), (11, 5, 17, 9, C['oliva_osc']), (13, 9, 15, 23, C['oliva_osc']), (8, 15, 12, 19, C['oliva_osc']), (16, 15, 20, 19, C['oliva_osc'])],
    'bolsa_de_sellos_explosivos': [(9, 4, 19, 24, C['crema']), (13, 7, 15, 21, C['rojo']), (11, 9, 17, 10, C['rojo']), (11, 15, 17, 16, C['rojo'])],
    'talisman_ocho_puertas': [(9, 4, 19, 24, C['morado']), (11, 7, 17, 8, C['oro']), (11, 7, 12, 21, C['oro']), (16, 7, 17, 21, C['oro']), (11, 20, 17, 21, C['oro'])],
}


def dibujar(rectangulos):
    px = [[None] * LADO for _ in range(LADO)]
    for x0, y0, x1, y1, color in rectangulos:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                px[y][x] = color
    dentro = lambda x, y: 0 <= x < LADO and 0 <= y < LADO and px[y][x] is not None
    for x, y in [(x, y) for y in range(LADO) for x in range(LADO)
                 if px[y][x] is None and any(dentro(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]:
        px[y][x] = CONTORNO
    im = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    for y in range(LADO):
        for x in range(LADO):
            if px[y][x]:
                im.putpixel((x, y), px[y][x])
    return im.resize((LADO * ESCALA, LADO * ESCALA), Image.NEAREST)


if __name__ == '__main__':
    de_la_hoja = recortar_hoja() if os.path.exists(HOJA) else {}
    for ident in IDS:
        im = de_la_hoja.get(ident) or dibujar(ICONOS[ident])
        im.save(os.path.join(DESTINO, f'{ident}.png'))
        print('ok', ident, '-', 'recortado de la hoja' if ident in de_la_hoja else 'provisional')
