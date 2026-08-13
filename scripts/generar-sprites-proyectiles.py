"""
Recorta los proyectiles de `src/assets/projectile-sprites.png` a un PNG por
proyectil en `src/assets/projectiles/<id>.png`, con fondo transparente.

Uso:  python scripts/generar-sprites-proyectiles.py

La hoja del artista es de **referencia**: trae marcos, títulos y pies de foto
("KUNAI", "RASENGAN"...). Usarla entera como sprite pintaría los rótulos, que es
exactamente el error que ya se cometió con `map-column-backgrounds.png` — por eso
se recorta, igual que se hizo con los objetos y con las columnas del mapa.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.

Saca dos cosas:

- El **kunai**, arriba a la izquierda, que es el ataque básico de TODOS los
  luchadores (`config.combate.jutsu.ataqueBasicoPorDefecto`).
- El **proyectil de jutsu de cada personaje**, de la rejilla de 7×4 de abajo.

Quien no tenga proyectil propio en la hoja se queda sin archivo y la UI cae al
kunai: Rock Lee es cuerpo a cuerpo a propósito, y Neji, Shikamaru, Kiba, Sai,
Yamato y los genin rivales simplemente no están dibujados.

La caja no está escrita a mano: se le da una región generosa del panel y el
script busca dentro el rectángulo que de verdad ocupa el dibujo. Escribir
coordenadas a ojo sobre una hoja de 1536×1024 sale mal y no se nota hasta que
el sprite aparece descentrado en pantalla.
"""

import importlib.util
import os
import struct  # noqa: F401  (lo usa el códec importado)

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'projectile-sprites.png')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'projectiles')

# El códec PNG (lectura, escritura y borrado de fondo por inundación) ya está
# escrito y probado en el script de objetos. Se carga por ruta en vez de con un
# `import` normal porque el nombre del archivo lleva guiones, que no son un
# identificador válido de Python. Duplicar 150 líneas de códec era peor.
_ruta_objetos = os.path.join(AQUI, 'generar-sprites-objetos.py')
_spec = importlib.util.spec_from_file_location('sprites_objetos', _ruta_objetos)
sprites_objetos = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sprites_objetos)

leer_png = sprites_objetos.leer_png
escribir_png_rgba = sprites_objetos.escribir_png_rgba
recortar = sprites_objetos.recortar

# Región donde buscar cada proyectil: el interior de su panel, sin el borde ni
# el rótulo de arriba ni el pie de abajo. (x0, y0, x1, y1) sobre la hoja original.
REGIONES = {
    'kunai': (24, 86, 270, 188),
}

MARGEN_BUSQUEDA = 30  # cuánto puede alejarse un píxel del fondo y contar como dibujo
MARGEN_CELDA = 10     # cuánto se mete el análisis dentro de la celda, para esquivar su borde
MINIMO_BANDA = 6

# Qué hay en cada celda de la rejilla de abajo, en orden de lectura. `None` = no
# se usa: o el personaje no está en el juego (Rin, Temari, Kankuro, Orochimaru),
# o hay una versión mejor más abajo (las dos primeras filas son las "de niño"),
# o directamente no es un proyectil (Rock Lee es cuerpo a cuerpo, y la última
# celda es la leyenda de colores de la hoja).
REJILLA = [
    [None, None, None, None, None, None, None],
    ['ino', None, None, 'shino', 'hinata', 'tenten', 'choji'],
    ['zaku', 'dosu', 'kin', 'naruto', 'sasuke', 'sakura', None],
    ['haku', 'zabuza', 'kabuto', 'gaara', 'pain_camino_deva', None, None],
]

# Camino Animal no tiene proyectil propio: comparte el de Camino Deva, igual que
# comparte sprite de personaje. Placeholder declarado, ver el roadmap.
PLACEHOLDERS = {'camino_animal_pain': 'pain_camino_deva'}

UMBRAL_OSCURO = 70
DENSIDAD_SEPARADOR = 0.85
ZONA_REJILLA_DESDE_Y = 250  # por encima de esto está la cabecera con el kunai


def color_de_fondo(w, ch, px, region):
    """
    El color del papel del panel, tomado de su esquina superior izquierda.

    Por eso la región tiene que empezar DENTRO del papel: el primer intento la
    empezaba unos píxeles más arriba, cayó sobre el marco azul oscuro de la hoja
    y el borrado por inundación se llevó el marco en vez del papel — el kunai
    salía con su rectángulo crema pegado detrás.
    """
    x0, y0, _, _ = region
    i = (y0 * w + x0) * ch
    return (px[i], px[i + 1], px[i + 2])


def caja_del_dibujo(w, ch, px, region, fondo):
    """Rectángulo real que ocupa el dibujo dentro de la región dada."""
    x0, y0, x1, y1 = region
    minX, minY, maxX, maxY = x1, y1, x0, y0

    for y in range(y0, y1):
        for x in range(x0, x1):
            i = (y * w + x) * ch
            distinto = (abs(px[i] - fondo[0]) > MARGEN_BUSQUEDA
                        or abs(px[i + 1] - fondo[1]) > MARGEN_BUSQUEDA
                        or abs(px[i + 2] - fondo[2]) > MARGEN_BUSQUEDA)
            if distinto:
                minX, minY = min(minX, x), min(minY, y)
                maxX, maxY = max(maxX, x), max(maxY, y)

    if maxX <= minX or maxY <= minY:
        raise SystemExit(f'No se ha encontrado dibujo en la región {region}')
    return (minX, minY, maxX - minX + 1, maxY - minY + 1)


def agrupar(indices):
    grupos = []
    for n in indices:
        if grupos and n - grupos[-1][-1] <= 2:
            grupos[-1].append(n)
        else:
            grupos.append([n])
    return [(g[0], g[-1]) for g in grupos]


def rejilla_de_celdas(w, h, ch, px):
    """Los huecos de la rejilla de abajo, midiendo sus separadores oscuros."""
    def oscuro(x, y):
        i = (y * w + x) * ch
        return px[i] < UMBRAL_OSCURO and px[i + 1] < UMBRAL_OSCURO and px[i + 2] < UMBRAL_OSCURO + 10

    muestrasY = range(ZONA_REJILLA_DESDE_Y, h, 9)
    muestrasX = range(0, w, 9)
    cols = agrupar([x for x in range(w)
                    if sum(oscuro(x, y) for y in muestrasY) / len(muestrasY) > DENSIDAD_SEPARADOR])
    filas = agrupar([y for y in range(ZONA_REJILLA_DESDE_Y, h)
                     if sum(oscuro(x, y) for x in muestrasX) / len(muestrasX) > DENSIDAD_SEPARADOR])
    huecosX = [(cols[i][1] + 1, cols[i + 1][0]) for i in range(len(cols) - 1)]
    huecosY = [(filas[i][1] + 1, filas[i + 1][0]) for i in range(len(filas) - 1)]
    return huecosX, huecosY


def caja_del_dibujo_en_celda(w, ch, px, celda, fondo):
    """
    El dibujo de una celda de la rejilla, que lleva rótulo arriba y pie abajo.

    Se queda con la banda de filas MÁS ALTA, que es el dibujo: el rótulo y el pie
    son texto, y una línea de texto es mucho más fina que un proyectil. Coger la
    primera banda habría devuelto siempre el rótulo.
    """
    x0, y0, x1, y1 = celda

    def hay_dibujo(y):
        for x in range(x0, x1):
            i = (y * w + x) * ch
            if (abs(px[i] - fondo[0]) > MARGEN_BUSQUEDA
                    or abs(px[i + 1] - fondo[1]) > MARGEN_BUSQUEDA
                    or abs(px[i + 2] - fondo[2]) > MARGEN_BUSQUEDA):
                return True
        return False

    bandas = [b for b in agrupar([y for y in range(y0, y1) if hay_dibujo(y)])
              if b[1] - b[0] >= MINIMO_BANDA]
    if not bandas:
        return None
    fy0, fy1 = max(bandas, key=lambda b: b[1] - b[0])
    return caja_del_dibujo(w, ch, px, (x0, fy0, x1, fy1 + 1), fondo)


def main():
    os.makedirs(DESTINO, exist_ok=True)
    w, h, ch, px = leer_png(HOJA)
    print(f'Hoja {w}×{h}, {ch} canales')

    for nombre, region in REGIONES.items():
        fondo = color_de_fondo(w, ch, px, region)
        caja = caja_del_dibujo(w, ch, px, region, fondo)
        lado, salida = recortar(w, h, ch, px, caja, fondo)
        escribir_png_rgba(os.path.join(DESTINO, f'{nombre}.png'), lado, lado, salida)
        print(f'  {nombre}: caja {caja} → {lado}×{lado}')

    huecosX, huecosY = rejilla_de_celdas(w, h, ch, px)
    print(f'  rejilla: {len(huecosX)} columnas × {len(huecosY)} filas')
    if len(huecosX) != 7 or len(huecosY) != len(REJILLA):
        raise SystemExit('Rejilla de proyectiles inesperada')

    cajas = {}
    for fila, ids in enumerate(REJILLA):
        for columna, identificador in enumerate(ids):
            if identificador is None:
                continue
            celda = (huecosX[columna][0] + MARGEN_CELDA, huecosY[fila][0] + MARGEN_CELDA,
                     huecosX[columna][1] - MARGEN_CELDA, huecosY[fila][1] - MARGEN_CELDA)
            fondo = color_de_fondo(w, ch, px, celda)
            caja = caja_del_dibujo_en_celda(w, ch, px, celda, fondo)
            if caja is None:
                print(f'  ⚠ {identificador}: sin dibujo en {celda}')
                continue
            lado, salida = recortar(w, h, ch, px, caja, fondo)
            escribir_png_rgba(os.path.join(DESTINO, f'{identificador}.png'), lado, lado, salida)
            cajas[identificador] = (caja, fondo)
            print(f'  {identificador}: caja {caja} → {lado}×{lado}')

    for destino, origen in PLACEHOLDERS.items():
        if origen not in cajas:
            continue
        caja, fondo = cajas[origen]
        lado, salida = recortar(w, h, ch, px, caja, fondo)
        escribir_png_rgba(os.path.join(DESTINO, f'{destino}.png'), lado, lado, salida)
        print(f'  {destino}: placeholder, copia de {origen}')


if __name__ == '__main__':
    main()
