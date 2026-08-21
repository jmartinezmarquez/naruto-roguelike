# -*- coding: utf-8 -*-
"""Dibuja `src/assets/menu/home.png`: la entrada Home del menú vertical.

**Es el segundo sprite del juego que no sale de una hoja del artista** (el otro son
los cascabeles). Aquí no había de dónde recortarlo: los cuatro iconos del menú son
objetos —pergamino, libro, engranaje, torii— y "volver al inicio" no tiene objeto. Se
probó con el símbolo de Konoha del fondo del juego y no funcionaba: a 32 px un
remolino es una mancha, y además ya es el favicon, así que el mismo dibujo significaba
dos cosas distintas.

Una **casa** sí se lee a 32 px, que es el único tamaño al que hay que verla, y dice
"inicio" sin que haya que aprendérselo. Va en la paleta del juego —rojo de sello en el
tejado, crema de pergamino en el muro, oro en las ventanas— para que no desentone al
lado de los cuatro que sí dibujó el artista.

⚠️ **Se exporta a 32×32 EXACTOS**, no ampliado. El menú lo pinta a 32 px, así que a
tamaño natural no hay reescalado ninguno: ni el `image-rendering: pixelated` global ni
el `.imagen-suave` de la clase pueden estropearlo. Los otros cuatro sí se amplían
porque vienen de una hoja con mucho más detalle (ver
documentacion/13-ui-mapa-y-combate.md).

Uso:  python scripts/generar-icono-home.py
"""

import importlib.util
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'menu', 'home.png')

LADO = 32
ESCALA = 1

# El dibujo, en texto, que es la forma de que se pueda revisar y retocar sin ejecutar
# nada: cada carácter es un píxel. Es lo mismo que hace el script de los cascabeles.
DIBUJO = [
    '........................',
    '...........KK...........',
    '..........KrrK..........',
    '.........KrrrrK.........',
    '........KrrrrrrK........',
    '.......KRRRRRRRRK.......',
    '......KRRRRRRRRRRK......',
    '.....KRRRRRRRRRRRRK.....',
    '....KRRRRRRRRRRRRRRK....',
    '...KRRRRRRRRRRRRRRRRK...',
    '..KKKKKKKKKKKKKKKKKKKK..',
    '...KWWWWWWWWWWWWWWWWK...',
    '...KWWWWWWWWWWWWWWWWK...',
    '...KWLLKWWWWWWWWKLLWK...',
    '...KWLLKWWWWWWWWKLLWK...',
    '...KWWWWWWWWWWWWWWWWK...',
    '...KWWWWWKDDDDKWWWWWK...',
    '...KwWWWWKDDDDKWWWWwK...',
    '...KwWWWWKDDDDKWWWWwK...',
    '...KwWWWWKDDDDKWWWWwK...',
    '...KKKKKKKKKKKKKKKKKK...',
    '........................',
]

# Los tokens del tema, escritos aquí porque un script de Python no puede leer el CSS.
# Si algún día cambian en `index.css`, este icono se queda con los viejos — es el
# precio de dibujar fuera del navegador, y por eso son colores de acento (que NO
# cambian con el tema) y no superficies.
PALETA = {
    '.': (0, 0, 0, 0),
    'K': (21, 18, 16, 255),       # tinta-950, el contorno
    'R': (178, 58, 46, 255),      # sello-600, el tejado
    'r': (201, 74, 60, 255),      # sello-500, la cumbrera iluminada
    'W': (224, 211, 176, 255),    # pergamino-200, el muro
    'w': (176, 163, 134, 255),    # el muro en sombra, abajo
    'L': (212, 169, 58, 255),     # oro, la luz de las ventanas
    'D': (58, 42, 32, 255),       # la puerta
}


def _png():
    ruta = os.path.join(RAIZ, 'scripts', 'generar-sprites-objetos.py')
    spec = importlib.util.spec_from_file_location('sprites_objetos', ruta)
    modulo = importlib.util.module_from_spec(spec)
    sys.modules['sprites_objetos'] = modulo
    try:
        spec.loader.exec_module(modulo)
    except SystemExit:
        pass
    return modulo


def main():
    ancho = max(len(fila) for fila in DIBUJO)
    alto = len(DIBUJO)
    assert ancho <= LADO and alto <= LADO, f'el dibujo ({ancho}x{alto}) no cabe en {LADO}'

    despX = (LADO - ancho) // 2
    despY = (LADO - alto) // 2
    lienzo = [[(0, 0, 0, 0)] * LADO for _ in range(LADO)]
    for y, fila in enumerate(DIBUJO):
        for x, caracter in enumerate(fila):
            color = PALETA.get(caracter)
            if color is None:
                raise ValueError(f'carácter sin color en la paleta: {caracter!r}')
            lienzo[y + despY][x + despX] = color

    datos = bytearray()
    for fila in lienzo:
        linea = bytearray()
        for celda in fila:
            linea += bytes(celda) * ESCALA
        datos += linea * ESCALA

    _png().escribir_png_rgba(DESTINO, LADO * ESCALA, LADO * ESCALA, bytes(datos))
    print(f'Escrito {DESTINO} ({LADO * ESCALA}x{LADO * ESCALA})')


if __name__ == '__main__':
    main()
