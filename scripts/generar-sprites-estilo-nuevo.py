"""
Sprites del ESTILO NUEVO (2026-10-14): recorta las hojas generadas a partir de los
prompts de `documentacion/41-arte-estilo-nuevo.md` y deja un PNG por sprite en su
carpeta de `src/assets/`.

Uso:  python scripts/generar-sprites-estilo-nuevo.py      (necesita Pillow)

Es el script del cambio de estilo: cada hoja nueva se añade a `HOJAS` (fichero,
carpeta de destino y qué id es cada dibujo, de izquierda a derecha) y ya está. Las
hojas que aún no existen se saltan, así que se puede correr a medias.

**Cómo separa los dibujos.** En estas hojas las auras de las transformaciones se
tocan (los dragones de Tenten llegan a Neji y a Shikamaru), así que buscar columnas
vacías no sirve. Como se piden en UNA fila y equiespaciados, se reparte el ancho
ocupado en N partes iguales y cada corte se mueve a la columna MÁS FINA de su zona
(±25% de una celda): donde dos auras se rozan, la columna más fina es justo el roce.
Una entrada `None` en los ids descarta ese dibujo (la hoja de transformaciones trajo
un Pain Camino Animal transformado que no usa nada: ese jefe no tiene modo).

**Dónde y a qué tamaño.** Cada tipo se coloca como los sprites que ya había, medidos
sobre ellos, para que los nuevos y los viejos se vean a la misma escala mientras
conviven (ver `COLOCACION`). El lienzo de personajes y transformaciones sigue siendo
el común de 96×96: se pintan a múltiplos enteros de él.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.
"""

import os

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
ASSETS = os.path.join(RAIZ, 'src', 'assets')

HOJAS = [
    ('sprite-pendientes-personajes.png', 'characters', 'personaje',
     ['kakashi', 'sai', 'yamato', 'camino_animal_pain']),
    ('sprite-pendientes-transformaciones-1.png', 'transformations', 'transformacion',
     ['kakashi_0', 'sai_0', 'yamato_0', None]),
    ('sprite-pendientes-transformaciones-2a.png', 'transformations', 'transformacion',
     ['rock_lee_1', 'neji_1', 'tenten_1', 'shikamaru_1', 'ino_1', 'choji_1']),
    ('sprite-pendientes-transformaciones-2b.png', 'transformations', 'transformacion',
     ['kiba_1', 'hinata_1', 'shino_1', 'kakashi_1', 'zabuza_1']),
    ('sprite-pendientes-proyectiles.png', 'projectiles', 'proyectil',
     ['neji', 'shikamaru', 'kiba', 'sai', 'yamato', 'camino_animal_pain']),
    ('sprite-pendientes-cascabeles.png', 'items', 'objeto',
     ['cascabeles']),
]

# Medido sobre los sprites que ya había (mediana de cada carpeta):
#   personajes      lienzo 96, 62 px de alto, pies en y=78
#   transformación  lienzo 96, hasta 80 de alto y 90 de ancho, suelo en y=88
#   proyectil       lienzo cuadrado con 6 px de margen; el juego lo pinta con object-contain
#   objeto          lienzo 116 con un 4% de margen, como el resto de assets/items/
COLOCACION = {
    'personaje': {'lienzo': 96, 'alto': 62, 'ancho_max': 60, 'suelo': 78},
    'transformacion': {'lienzo': 96, 'alto': 80, 'ancho_max': 90, 'suelo': 88},
    'proyectil': {'lienzo': 128, 'margen': 6},
    'objeto': {'lienzo': 116, 'margen_frac': 0.04},
}

ALFA_MINIMO = 16


def mascara(im):
    return im.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0)


def cortes(hoja, n):
    """Los n tramos [x0, x1) de la hoja, uno por dibujo (ver el docstring del módulo)."""
    caja = mascara(hoja).getbbox()
    datos = mascara(hoja).load()
    alturas = [sum(1 for y in range(hoja.height) if datos[x, y]) for x in range(hoja.width)]
    x0, x1 = caja[0], caja[2]
    celda = (x1 - x0) / n
    bordes = [x0]
    for k in range(1, n):
        ideal = round(x0 + k * celda)
        ventana = range(max(bordes[-1] + 1, ideal - int(celda * 0.25)), min(x1 - 1, ideal + int(celda * 0.25)))
        bordes.append(min(ventana, key=lambda x: alturas[x]))
    bordes.append(x1)
    return list(zip(bordes, bordes[1:]))


def quitar_restos_del_vecino(dibujo):
    """
    Borra las manchas pequeñas que tocan el borde izquierdo o derecho del corte: son
    trozos del aura del dibujo de al lado (en la primera pasada, un jirón de los dragones
    de Tenten se colaba en el Shikamaru). "Pequeña" es menos del 3% de lo pintado; una
    parte del propio dibujo que llegue al borde es mucho más grande que eso.
    """
    ancho, alto = dibujo.size
    datos = mascara(dibujo).load()
    total = sum(1 for y in range(alto) for x in range(ancho) if datos[x, y])
    visto = bytearray(ancho * alto)
    alfa = dibujo.getchannel('A')
    pa = alfa.load()
    for x_borde in (0, ancho - 1):
        for y0 in range(alto):
            if not datos[x_borde, y0] or visto[y0 * ancho + x_borde]:
                continue
            mancha, pila = [], [(x_borde, y0)]
            visto[y0 * ancho + x_borde] = 1
            while pila:
                x, y = pila.pop()
                mancha.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < ancho and 0 <= ny < alto and datos[nx, ny] and not visto[ny * ancho + nx]:
                        visto[ny * ancho + nx] = 1
                        pila.append((nx, ny))
            if len(mancha) < total * 0.03:
                for x, y in mancha:
                    pa[x, y] = 0
    dibujo.putalpha(alfa)
    return dibujo


def limpio(dibujo):
    """Sin el halo casi invisible de alfa < ALFA_MINIMO, sin restos del vecino y recortado a su caja."""
    dibujo = dibujo.copy()
    dibujo.putalpha(dibujo.getchannel('A').point(lambda a: a if a >= ALFA_MINIMO else 0))
    dibujo = quitar_restos_del_vecino(dibujo)
    return dibujo.crop(mascara(dibujo).getbbox())


def reducir(dibujo, ancho, alto):
    return dibujo.resize((max(1, round(ancho)), max(1, round(alto))), Image.Resampling.LANCZOS)


def colocar(dibujo, tipo):
    c = COLOCACION[tipo]
    lienzo = Image.new('RGBA', (c['lienzo'], c['lienzo']), (0, 0, 0, 0))
    w, h = dibujo.size
    if tipo in ('personaje', 'transformacion'):
        escala = min(c['alto'] / h, c['ancho_max'] / w)
        d = reducir(dibujo, w * escala, h * escala)
        lienzo.alpha_composite(d, ((c['lienzo'] - d.width) // 2, c['suelo'] - d.height))
    elif tipo == 'proyectil':
        util = c['lienzo'] - 2 * c['margen']
        escala = min(util / w, util / h)
        d = reducir(dibujo, w * escala, h * escala)
        lienzo.alpha_composite(d, ((c['lienzo'] - d.width) // 2, (c['lienzo'] - d.height) // 2))
    else:
        util = c['lienzo'] * (1 - 2 * c['margen_frac'])
        escala = min(util / w, util / h)
        d = reducir(dibujo, w * escala, h * escala)
        lienzo.alpha_composite(d, ((c['lienzo'] - d.width) // 2, (c['lienzo'] - d.height) // 2))
    return lienzo


if __name__ == '__main__':
    for fichero, carpeta, tipo, ids in HOJAS:
        ruta = os.path.join(ASSETS, fichero)
        if not os.path.exists(ruta):
            print('--', fichero, 'no existe todavía, se salta')
            continue
        hoja = Image.open(ruta).convert('RGBA')
        for (x0, x1), ident in zip(cortes(hoja, len(ids)), ids):
            if ident is None:
                continue
            sprite = colocar(limpio(hoja.crop((x0, 0, x1, hoja.height))), tipo)
            sprite.save(os.path.join(ASSETS, carpeta, f'{ident}.png'))
            print('ok', carpeta, ident, (x0, x1))
