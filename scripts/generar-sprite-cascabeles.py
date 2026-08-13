"""
Dibuja el sprite del objeto `cascabeles` en `src/assets/items/cascabeles.png`.

Uso:  python scripts/generar-sprite-cascabeles.py

**Este script DIBUJA, no recorta**, y es el único así. El resto de sprites del
juego salen de las hojas del artista (`generar-sprites-objetos.py`,
`generar-sprites-personajes.py`…); los cascabeles no están en ninguna, y son la
pieza más simple que tiene el juego —dos esferas con una ranura—, así que sale más
barato dibujarlas que buscarlas. Es un **placeholder declarado**: cuando exista el
dibujo de verdad, este archivo se borra y el objeto pasa a
`generar-sprites-objetos.py` como todos los demás.

**No editar a mano el PNG generado**: se pisa al volver a correr esto.

Se dibuja en una rejilla lógica de 28×28 y se amplía a ×4 (112×112), que es el
rango en el que están los otros objetos (97-119 px). La ampliación es entera a
propósito: el pixel art a escalas no enteras duplica unas columnas de píxeles y
otras no (la misma razón que documenta `generar-sprites-personajes.py`).
"""

import importlib.util
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'items', 'cascabeles.png')

_spec = importlib.util.spec_from_file_location(
    'sprites_objetos', os.path.join(AQUI, 'generar-sprites-objetos.py'))
sprites_objetos = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sprites_objetos)
escribir_png_rgba = sprites_objetos.escribir_png_rgba

LADO_LOGICO = 28
ESCALA = 4

# Paleta de cuatro tonos, como el resto de los objetos de la hoja: contorno, sombra,
# base y brillo. Cuatro es lo que hace que una esfera se lea como esfera sin
# degradados, que a este tamaño se ven sucios.
CONTORNO = (58, 44, 16, 255)
SOMBRA = (168, 128, 31, 255)
BASE = (224, 178, 58, 255)
BRILLO = (245, 224, 138, 255)
CUERDA = (150, 46, 38, 255)
NADA = (0, 0, 0, 0)


def dibujar_cascabel(lienzo, cx, cy, radio):
    """Un cascabel: esfera de cuatro tonos, ranura horizontal y anilla arriba."""
    for y in range(cy - radio - 3, cy + radio + 1):
        for x in range(cx - radio - 1, cx + radio + 2):
            if not (0 <= x < LADO_LOGICO and 0 <= y < LADO_LOGICO):
                continue
            dx, dy = x - cx, y - cy
            distancia = (dx * dx + dy * dy) ** 0.5

            if distancia > radio + 0.6:
                continue
            if distancia > radio - 0.7:
                lienzo[y][x] = CONTORNO          # borde de la esfera
            elif dx + dy > radio * 0.55:
                lienzo[y][x] = SOMBRA            # abajo a la derecha
            elif dx + dy < -radio * 0.75:
                lienzo[y][x] = BRILLO            # arriba a la izquierda
            else:
                lienzo[y][x] = BASE

    # La ranura: una línea horizontal cruzando la esfera y un corte hacia abajo. Es
    # lo único que distingue un cascabel de una bola de oro cualquiera, así que va
    # en contorno puro y no en sombra.
    for x in range(cx - radio + 1, cx + radio):
        if 0 <= x < LADO_LOGICO and 0 <= cy + 1 < LADO_LOGICO:
            lienzo[cy + 1][x] = CONTORNO
    for y in range(cy + 1, cy + radio - 1):
        if 0 <= y < LADO_LOGICO:
            lienzo[y][cx] = CONTORNO

    # La anilla de arriba, dos píxeles de alto para que se vea a tamaño de rejilla.
    for y in (cy - radio - 2, cy - radio - 1):
        for x in (cx - 1, cx + 1):
            if 0 <= y < LADO_LOGICO and 0 <= x < LADO_LOGICO:
                lienzo[y][x] = CONTORNO
    if 0 <= cy - radio - 3 < LADO_LOGICO:
        lienzo[cy - radio - 3][cx] = CONTORNO


def main():
    lienzo = [[NADA for _ in range(LADO_LOGICO)] for _ in range(LADO_LOGICO)]

    # La cuerda roja va ANTES de las esferas: así los cascabeles la tapan donde se
    # cruzan y parece que pasa por detrás en vez de pintada encima.
    for x in range(8, 20):
        lienzo[7][x] = CUERDA
    lienzo[8][8] = CUERDA
    lienzo[8][19] = CUERDA

    # Dos cascabeles, el segundo un poco más abajo: colgando de la misma cuerda a
    # la misma altura parecían un icono simétrico, no dos objetos sueltos.
    dibujar_cascabel(lienzo, 9, 15, 5)
    dibujar_cascabel(lienzo, 19, 17, 5)

    lado = LADO_LOGICO * ESCALA
    pixeles = bytearray(lado * lado * 4)
    for y in range(lado):
        for x in range(lado):
            r, g, b, a = lienzo[y // ESCALA][x // ESCALA]
            i = (y * lado + x) * 4
            pixeles[i:i + 4] = bytes((r, g, b, a))

    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    escribir_png_rgba(DESTINO, lado, lado, pixeles)
    print(f'  cascabeles: dibujado {lado}×{lado} → {os.path.relpath(DESTINO, RAIZ)}')


if __name__ == '__main__':
    main()
