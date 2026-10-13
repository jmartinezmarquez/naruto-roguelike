"""
Sprites de los 8 objetos añadidos el 2026-10-14, en `src/assets/items/<id>.png`.

Uso:  python scripts/generar-sprites-objetos-nuevos.py      (necesita Pillow)

Tiene DOS modos, y elige solo:

1. **Si existe `src/assets/sprite-objetos-nuevos.png`** (la hoja del artista, con
   fondo transparente), la RECORTA. Los dibujos se leen en orden de lectura —por
   filas de arriba abajo y, dentro de cada fila, de izquierda a derecha—, separados
   por filas y columnas de alfa vacías, y se asignan a `IDS` en ese orden. Cada uno
   sale en un cuadrado con margen, reducido a 116 px como el resto de `assets/items/`.
   Es el mismo método que `generar-sprites-pergaminos.py`.
2. **Si no existe**, DIBUJA un icono provisional geométrico por objeto, para que la
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

# El orden en que tienen que aparecer en la hoja (orden de lectura).
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

LADO_FINAL = 116
MARGEN = 0.04
ALFA_MINIMO = 16
HUECO_MINIMO = 8

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


def recortar_hoja():
    hoja = Image.open(HOJA).convert('RGBA')
    alfa = hoja.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0)
    datos = alfa.load()
    filas = tramos([any(datos[x, y] for x in range(hoja.width)) for y in range(hoja.height)])
    dibujos = []
    for y0, y1 in filas:
        columnas = tramos([any(datos[x, y] for y in range(y0, y1)) for x in range(hoja.width)])
        for x0, x1 in columnas:
            trozo = hoja.crop((x0, y0, x1, y1))
            dibujos.append(trozo.crop(trozo.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0).getbbox()))
    if len(dibujos) != len(IDS):
        raise SystemExit(f'La hoja tiene {len(dibujos)} dibujos y hacen falta {len(IDS)} (en este orden: {IDS})')
    return dict(zip(IDS, map(cuadrar, dibujos)))

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
    if os.path.exists(HOJA):
        sprites, modo = recortar_hoja(), 'recortado de la hoja'
    else:
        sprites, modo = {ident: dibujar(ICONOS[ident]) for ident in IDS}, 'provisional (no hay hoja)'
    for ident, im in sprites.items():
        im.save(os.path.join(DESTINO, f'{ident}.png'))
        print('ok', ident, '-', modo)
