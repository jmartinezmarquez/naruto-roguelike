"""
Recorta el sprite de cada transformación de `src/assets/sprites-transformaciones.png`
a `src/assets/transformations/<personajeId>_<indiceDelModo>.png`.

Uso:  python scripts/generar-sprites-transformaciones.py

El índice es la posición del modo en el array `modos` del personaje, así que
`naruto_0.png` es el Manto de Chakra y `naruto_1.png` el Modo Sabio. Esa es la
clave que usa `components/common/transformationSprites.js`.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.

Esta hoja es la más irregular de las cuatro del artista: los paneles no forman
rejilla, cada fila tiene un número distinto (5, 6, 7 y 9) y los personajes con
dos transformaciones ocupan un panel del doble de ancho. Por eso los separadores
verticales se buscan **fila a fila**, no de una vez sobre la hoja entera.

Dentro de un panel, cada bloque de modo trae dos líneas de rótulo (nombre y
nivel) encima de una parrilla de fotogramas. Se coge el primero de arriba a la
izquierda, y para no confundir el rótulo con el dibujo se descartan las bandas
más finas que `ALTO_MINIMO_SPRITE`: una línea de texto mide ~10 px y un sprite
con su aura pasa de 50.

Ojo: los niveles que pone la hoja (12, 62, 20...) son los de antes de recalibrar
la progresión y no coinciden con `characters.json`. Son rótulos de referencia,
no datos.
"""

import importlib.util
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'sprites-transformaciones.png')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'transformations')

# Se reutiliza la maquinaria del script de personajes (que a su vez trae el códec
# PNG del de objetos): mismo problema, misma solución. Se carga por ruta porque
# los nombres de archivo llevan guiones.
_spec = importlib.util.spec_from_file_location(
    'sprites_personajes', os.path.join(AQUI, 'generar-sprites-personajes.py'))
personajes = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(personajes)
leer_png, escribir_png_rgba, recortar = (
    personajes.leer_png, personajes.escribir_png_rgba, personajes.recortar)
agrupar, color_del_papel, bandas_con_dibujo = (
    personajes.agrupar, personajes.color_del_papel, personajes.bandas_con_dibujo)
# Mismo lienzo comun que los sprites normales: si no, al transformarse el
# personaje cambiaria de tamaño en pantalla solo por como se recorto su dibujo.
encuadrar = personajes.encuadrar

# Qué personaje hay en cada panel y cuántas transformaciones trae, fila a fila.
# `None` = está en la hoja pero no lo usa el juego. Los ids son los de
# characters.json y enemies.json; el número es cuántos bloques de modo tiene el
# panel EN LA HOJA, que no siempre coincide con los que tiene el personaje en los
# datos (Camino Deva trae dos dibujados y en el juego solo usa uno).
PANELES = [
    [('naruto', 2), ('sasuke', 2), ('sakura', 2), ('rock_lee', 1), ('gaara', 2)],
    [('pain_camino_deva', 2), ('kabuto', 1), ('zabuza', 1), (None, 1),
     ('shikamaru', 1), ('ino', 1)],
    [('choji', 1), (None, 1), (None, 1), ('kiba', 1), ('shino', 1), ('neji', 1), ('hinata', 1)],
    [('tenten', 1), (None, 1), (None, 1), (None, 1), (None, 1),
     (None, 1), (None, 1), (None, 1), (None, 1)],
]

UMBRAL_OSCURO = 70
DENSIDAD_SEPARADOR = 0.85
MARGEN_PANEL = 8
ALTO_MINIMO_SPRITE = 30  # por debajo de esto una banda es rótulo, no dibujo
# Igual que en el script de personajes: en varios paneles los fotogramas se
# tocan y una banda se come dos filas o dos columnas. Se usa la mediana de todas
# las cajas como calibre y se recorta lo que se pase, anclado arriba a la
# izquierda, que es donde empieza el fotograma bueno.
FACTOR_FUSION = 1.4


def oscuro(w, ch, px, x, y):
    i = (y * w + x) * ch
    return px[i] < UMBRAL_OSCURO and px[i + 1] < UMBRAL_OSCURO and px[i + 2] < UMBRAL_OSCURO + 10


def bandas_de_papel_por_fila(w, h, ch, px):
    """Las franjas de papel de cada fila de paneles, ya sin sus rótulos."""
    muestras = range(0, w, 11)
    filas = agrupar([y for y in range(h)
                     if sum(oscuro(w, ch, px, x, y) for x in muestras) / len(muestras)
                     > DENSIDAD_SEPARADOR])
    huecos = [(filas[i][1] + 1, filas[i + 1][0]) for i in range(len(filas) - 1)]
    # Los huecos bajos son el interior de un rótulo, no una franja de contenido.
    return [g for g in huecos if g[1] - g[0] > 100]


def paneles_de_la_fila(w, ch, px, franja):
    """Los huecos entre separadores verticales, mirando SOLO dentro de esta fila."""
    y0, y1 = franja
    muestras = range(y0, y1, 7)
    cols = agrupar([x for x in range(w)
                    if sum(oscuro(w, ch, px, x, y) for y in muestras) / len(muestras)
                    > DENSIDAD_SEPARADOR])
    return [(cols[i][1] + 1, cols[i + 1][0]) for i in range(len(cols) - 1)]


def caja_del_primer_fotograma(w, ch, px, bloque, papel):
    """El fotograma de arriba a la izquierda del bloque, saltándose el rótulo."""
    x0, y0, x1, y1 = bloque
    filas = [b for b in bandas_con_dibujo(w, ch, px, bloque, papel, por_filas=True)
             if b[1] - b[0] >= ALTO_MINIMO_SPRITE]
    if not filas:
        return None
    fy0, fy1 = filas[0]

    columnas = bandas_con_dibujo(w, ch, px, (x0, fy0, x1, fy1 + 1), papel, por_filas=False)
    if not columnas:
        return None
    fx0, fx1 = columnas[0]
    return (fx0, fy0, fx1 - fx0 + 1, fy1 - fy0 + 1)


def main():
    os.makedirs(DESTINO, exist_ok=True)
    w, h, ch, px = leer_png(HOJA)
    franjas = bandas_de_papel_por_fila(w, h, ch, px)
    print(f'Hoja {w}×{h} — {len(franjas)} filas de paneles')

    if len(franjas) != len(PANELES):
        raise SystemExit(f'Se esperaban {len(PANELES)} filas y se han encontrado {len(franjas)}')

    medidas = {}
    for franja, contenido in zip(franjas, PANELES):
        huecos = paneles_de_la_fila(w, ch, px, franja)
        if len(huecos) != len(contenido):
            raise SystemExit(f'Fila {franja}: {len(huecos)} paneles, se esperaban {len(contenido)}')

        for (px0, px1), (identificador, modos) in zip(huecos, contenido):
            if identificador is None:
                continue
            ancho = (px1 - px0) // modos
            for indice in range(modos):
                bloque = (px0 + indice * ancho + MARGEN_PANEL, franja[0] + MARGEN_PANEL,
                          px0 + (indice + 1) * ancho - MARGEN_PANEL, franja[1] - MARGEN_PANEL)
                papel = color_del_papel(w, ch, px, bloque)
                caja = caja_del_primer_fotograma(w, ch, px, bloque, papel)
                if caja is None:
                    print(f'  ⚠ {identificador}_{indice}: sin dibujo en {bloque}')
                    continue
                medidas[f'{identificador}_{indice}'] = (caja, papel)

    def mediana(valores):
        v = sorted(valores)
        return v[len(v) // 2]

    anchoTipico = mediana([c[2] for c, _ in medidas.values()])
    altoTipico = mediana([c[3] for c, _ in medidas.values()])
    print(f'  calibre: fotograma típico {anchoTipico}×{altoTipico}')

    for nombre, (caja, papel) in medidas.items():
        x, y, ancho, alto = caja
        if ancho > anchoTipico * FACTOR_FUSION or alto > altoTipico * FACTOR_FUSION:
            ancho, alto = min(ancho, anchoTipico), min(alto, altoTipico)
            print(f'  {nombre}: fotogramas pegados, recortado al calibre')
        lado, salida = encuadrar(*recortar(w, h, ch, px, (x, y, ancho, alto), papel))
        escribir_png_rgba(os.path.join(DESTINO, f'{nombre}.png'), lado, lado, salida)
        print(f'  {nombre}: caja {(x, y, ancho, alto)} → {lado}×{lado}')


if __name__ == '__main__':
    main()
