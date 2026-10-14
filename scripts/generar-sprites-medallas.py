"""
Dibuja las MEDALLAS de arco en `src/assets/medals/<arcoId>.png` y el icono del Salón de
la Fama en `src/assets/menu/salon.png`.

Uso:  python scripts/generar-sprites-medallas.py      (necesita Pillow)

**Este script DIBUJA, no recorta**, como `generar-sprites-efectos.py`: ninguna hoja del
artista trae medallas. Son insignias geométricas (círculo, hexágono, escudo) con un
símbolo sencillo encima — lo que un script dibuja bien. Si algún día hay dibujo de
verdad, este archivo se borra y el nombre del PNG (el `id` del arco) se mantiene.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.

Las medallas imitan a las de gimnasio de Pokémon: **cada una con su forma y su color**,
para que una fila de tres se lea de un vistazo sin leer nombres. Se dibujan a 32×32
y a ×1 (el mapa las pinta a 32 y la transición a 64, siempre a múltiplo entero).

El icono del menú va a 32×32 lógicos ampliado ×4 (128), el tamaño de los otros iconos
de `assets/menu/`.
"""

import math
import os

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
DESTINO_MEDALLAS = os.path.join(RAIZ, 'src', 'assets', 'medals')
DESTINO_MENU = os.path.join(RAIZ, 'src', 'assets', 'menu')

LADO = 32
C = LADO / 2
CONTORNO = (34, 28, 30, 255)


def lienzo():
    return [[None] * LADO for _ in range(LADO)]


def perfilar(px, color=CONTORNO):
    """Contorno de 1 px por fuera de lo pintado, calculado en una pasada aparte."""
    dentro = lambda x, y: 0 <= x < LADO and 0 <= y < LADO and px[y][x] is not None
    borde = []
    for y in range(LADO):
        for x in range(LADO):
            if px[y][x] is None and any(dentro(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                borde.append((x, y))
    for x, y in borde:
        px[y][x] = color


def guardar(px, ruta, escala=1):
    im = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    for y in range(LADO):
        for x in range(LADO):
            if px[y][x]:
                im.putpixel((x, y), px[y][x])
    if escala != 1:
        im = im.resize((LADO * escala, LADO * escala), Image.NEAREST)
    im.save(ruta)


def insignia(px, forma, aro, cara):
    """
    Rellena la insignia: un aro metálico de 2 px y la cara de dentro. `forma(x, y)`
    devuelve la "distancia normalizada" al borde (≤ 1 dentro). El aro lleva luz arriba
    a la izquierda y sombra abajo a la derecha, como los sprites del juego.
    """
    for y in range(LADO):
        for x in range(LADO):
            d = forma(x + 0.5, y + 0.5)
            if d > 1:
                continue
            luz = ((C - x) + (C - y)) / LADO  # >0 arriba-izquierda
            if d > 0.82:
                px[y][x] = aro[2] if luz > 0.15 else aro[0] if luz < -0.15 else aro[1]
            else:
                px[y][x] = cara[1] if luz > 0.2 else cara[0]


def circulo(radio):
    return lambda x, y: math.hypot(x - C, y - C) / radio


def hexagono(radio):
    def f(x, y):
        dx, dy = abs(x - C), abs(y - C)
        return max(dy / (radio * 0.866), (dx * 0.5 + dy * 0.866) / (radio * 0.866))
    return f


def escudo(radio):
    def f(x, y):
        dx, dy = abs(x - C) / radio, (y - C) / radio
        if dy < 0:
            return max(dx, -dy)
        return dx + dy * dy * 0.9 if dy < 1 else 2
    return f


ORO = [(150, 105, 35, 255), (212, 169, 58, 255), (250, 222, 130, 255)]
PLATA = [(110, 115, 128, 255), (176, 182, 196, 255), (236, 240, 248, 255)]
BRONCE = [(120, 70, 40, 255), (180, 110, 60, 255), (230, 170, 110, 255)]


def medalla_olas():
    """País de las Olas: círculo de plata, cara de mar y tres olas — el puente sobre el agua."""
    px = lienzo()
    insignia(px, circulo(14), PLATA, [(40, 92, 130, 255), (61, 122, 158, 255)])
    espuma = (225, 240, 250, 255)
    for fila in (-5, 0, 5):
        for x in range(LADO):
            y = C + fila + 1.6 * math.sin((x - 6) / 2.4)
            yi = int(y)
            if 0 <= yi < LADO and px[yi][x] not in (None, *PLATA):
                px[yi][x] = espuma
    perfilar(px)
    return px


def medalla_arena():
    """Examen Chunin: hexágono de bronce, cara de arena y el reloj de Suna."""
    px = lienzo()
    insignia(px, hexagono(15), BRONCE, [(190, 150, 95, 255), (222, 190, 130, 255)])
    tinta = (92, 58, 30, 255)
    for y in range(LADO):
        for x in range(LADO):
            dx, dy = abs(x + 0.5 - C), y + 0.5 - C
            # Dos triángulos que se tocan por el vértice: el reloj de arena de la Arena.
            if abs(dy) <= 7 and dx <= abs(dy) * 0.75 + 0.6 and px[y][x] not in BRONCE:
                px[y][x] = tinta
            # Y las dos barras de arriba y abajo.
            if abs(abs(dy) - 8) < 0.9 and dx <= 6.5 and px[y][x] not in BRONCE:
                px[y][x] = tinta
    perfilar(px)
    return px


def medalla_nube():
    """Invasión de Pain: escudo de oro, cara negra y la nube roja del Akatsuki."""
    px = lienzo()
    insignia(px, escudo(14), ORO, [(22, 20, 26, 255), (38, 34, 42, 255)])
    rojo, rojo_claro, blanco = (178, 34, 34, 255), (222, 60, 50, 255), (240, 236, 230, 255)
    # Seis bultos y no cuatro: con pocos y grandes la nube se leía como una mancha, y
    # la del Akatsuki es reconocible precisamente por lo festoneada que es.
    bolas = [(C - 7, C + 1.5, 3.2), (C - 3.5, C - 2, 3.8), (C + 1.5, C - 3, 4.0),
             (C + 6, C - 0.5, 3.4), (C + 3, C + 3, 3.2), (C - 2, C + 3, 3.2)]
    nube = set()
    for y in range(LADO):
        for x in range(LADO):
            if any(math.hypot(x + 0.5 - bx, y + 0.5 - by) <= r for bx, by, r in bolas):
                nube.add((x, y))
    for x, y in nube:
        luz = (C - x) + (C - 2 - y)
        px[y][x] = rojo_claro if luz > 2 else rojo
    # El ribete blanco de la nube del Akatsuki, por fuera.
    for y in range(LADO):
        for x in range(LADO):
            if (x, y) in nube:
                continue
            if any((x + dx, y + dy) in nube for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                if px[y][x] not in ORO:
                    px[y][x] = blanco
    perfilar(px)
    return px


def icono_salon():
    """El Salón de la Fama: una copa de oro con asas sobre un pedestal."""
    px = lienzo()
    oro_osc, oro, oro_claro = ORO
    for y in range(LADO):
        for x in range(LADO):
            cx = x + 0.5 - C
            # Copa: semicírculo ancho arriba (y 5..17).
            if 5 <= y <= 17 and abs(cx) <= 9 - max(0, (y - 11)) * 0.9:
                px[y][x] = oro_claro if cx < -3 else oro if cx < 4 else oro_osc
            # Asas.
            if 7 <= y <= 13 and 9 <= abs(cx) <= 12 and not (8 < y < 12 and abs(cx) < 11):
                px[y][x] = oro_osc if cx > 0 else oro
            # Tallo y pedestal.
            if 18 <= y <= 22 and abs(cx) <= 1.6:
                px[y][x] = oro
            if 23 <= y <= 24 and abs(cx) <= 5:
                px[y][x] = oro
            if 25 <= y <= 27 and abs(cx) <= 7.5:
                px[y][x] = (120, 70, 40, 255) if cx > 0 else (160, 95, 55, 255)
    # Brillo en la copa.
    for y in range(7, 13):
        if px[y][int(C) - 6]:
            px[y][int(C) - 6] = (255, 248, 210, 255)
    perfilar(px)
    return px


MEDALLAS = {
    'pais_de_las_olas': medalla_olas,
    'examen_chunin': medalla_arena,
    'invasion_de_pain': medalla_nube,
}

if __name__ == '__main__':
    # ⚠️ Este arte se está rehaciendo en el estilo nuevo (documentacion/41). Si ya ha
    # llegado su hoja, correr esto PISARÍA el arte nuevo con el viejo: se para.
    import os as _os
    import sys as _sys
    _assets = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), 'src', 'assets')
    _nuevas = [h for h in ('sprite-estilo-nuevo-18.png', 'sprite-estilo-nuevo-19.png',) if _os.path.exists(_os.path.join(_assets, h))]
    if _nuevas:
        _sys.exit(f'No se ejecuta: ya existe {_nuevas} del estilo nuevo, y esto pisaría su arte. '
                  'Usa scripts/generar-sprites-estilo-nuevo.py.')
    os.makedirs(DESTINO_MEDALLAS, exist_ok=True)
    for arco_id, dibujar in MEDALLAS.items():
        guardar(dibujar(), os.path.join(DESTINO_MEDALLAS, f'{arco_id}.png'))
    guardar(icono_salon(), os.path.join(DESTINO_MENU, 'salon.png'), escala=4)
    print('Medallas en', DESTINO_MEDALLAS, '· icono en', DESTINO_MENU)
