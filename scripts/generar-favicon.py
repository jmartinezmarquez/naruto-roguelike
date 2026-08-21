# -*- coding: utf-8 -*-
"""Genera `public/favicon.png`: el símbolo de Konoha de la pestaña del navegador.

**No se dibuja un icono nuevo: se recorta uno que ya está en el juego.** El fondo
del tema claro (`src/assets/originales/game-background-light-theme.png`) tiene la
torre de agua de la aldea con el remolino de Konoha pintado en una placa blanca, y
eso es exactamente lo que hace falta: alto contraste, forma circular y del mismo
artista que el resto. Dibujar uno aparte habría sido arte nuevo que mantener, y
además se parecería *casi* al del juego, que es peor que parecerse del todo.

⚠️ **Un favicon se ve a 16 px.** Ahí no se lee un dibujo, se lee una silueta y dos
colores. Por eso se elige la placa de la torre y no el símbolo del cartel de madera
(rojo apagado sobre crema, que a ese tamaño es una mancha) ni el emblema de combate
de los nodos, que era el que había antes de que el juego tuviera nombre propio.

Se conserva el cuadrado naranja de la pared en vez de recortar el disco: en una
pestaña, un mosaico sólido se distingue mejor que una forma flotante, porque la
barra del navegador puede ser clara u oscura y el disco blanco desaparecería en la
clara.

Uso:  python scripts/generar-favicon.py
"""

import importlib.util
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, 'src', 'assets', 'originales', 'game-background-light-theme.png')
# ⚠️ Un solo destino. Llegó a escribir también el icono "Home" del menú, con el
# argumento de que "volver a la aldea" y "volver al inicio" son la misma idea. Se
# descartó por dos motivos: **a 32 px un remolino es una mancha**, y el mismo dibujo
# acababa significando dos cosas distintas en la misma pantalla. El Home tiene ahora su
# propio sprite (`scripts/generar-icono-home.py`).
DESTINO = os.path.join(RAIZ, 'public', 'favicon.png')

# La placa de la torre de agua, medida sobre el original de 1672×941.
CAJA = (1191, 583, 40)  # x, y, lado
# Ampliado a múltiplo entero, que es la regla de todo el pixel art del proyecto: a
# escalas no enteras se duplican unas columnas de píxeles y otras no.
ESCALA = 4


def _herramientas_png():
    """Reutiliza el lector/escritor de PNG de `generar-sprites-objetos.py`.

    Está ahí y no en un módulo común porque fue el primero que lo necesitó; se
    importa en vez de copiarse para que haya UNA implementación del formato.
    """
    ruta = os.path.join(RAIZ, 'scripts', 'generar-sprites-objetos.py')
    spec = importlib.util.spec_from_file_location('sprites_objetos', ruta)
    modulo = importlib.util.module_from_spec(spec)
    sys.modules['sprites_objetos'] = modulo
    try:
        spec.loader.exec_module(modulo)
    except SystemExit:
        pass  # ese script genera sus sprites al importarse; aquí solo queremos sus funciones
    return modulo


def main():
    png = _herramientas_png()
    ancho, _alto, canales, pixeles = png.leer_png(ORIGEN)
    x0, y0, lado = CAJA

    salida = bytearray()
    for y in range(y0, y0 + lado):
        fila = bytearray()
        for x in range(x0, x0 + lado):
            p = (y * ancho + x) * canales
            fila += bytes((pixeles[p], pixeles[p + 1], pixeles[p + 2], 255)) * ESCALA
        salida += fila * ESCALA

    png.escribir_png_rgba(DESTINO, lado * ESCALA, lado * ESCALA, bytes(salida))
    print(f'Escrito {DESTINO} ({lado * ESCALA}x{lado * ESCALA})')


if __name__ == '__main__':
    main()
