"""
Recorta los proyectiles de `src/assets/projectile-sprites.png` a un PNG por
proyectil en `src/assets/projectiles/<id>.png`, con fondo transparente.

Uso:  python scripts/generar-sprites-proyectiles.py

La hoja del artista es de **referencia**: trae marcos, títulos y pies de foto
("KUNAI", "RASENGAN"...). Usarla entera como sprite pintaría los rótulos, que es
exactamente el error que ya se cometió con `map-column-backgrounds.png` — por eso
se recorta, igual que se hizo con los objetos y con las columnas del mapa.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.

Saca tres cosas, y la tercera de OTRA hoja:

- El **kunai**, arriba a la izquierda, que es el ataque básico de TODOS los
  luchadores (`config.combate.jutsu.ataqueBasicoPorDefecto`).
- El **proyectil de jutsu de cada personaje**, de la rejilla de 7×4 de abajo.
- El **jutsu de los cinco genin rivales**, que no está en esta hoja sino en la de
  personajes (`map-sprites-idle-all-characters.png`), al final de la tira de
  animación de cada uno. Ver `proyectiles_de_la_hoja_de_personajes` más abajo.

Quien no tenga proyectil propio se queda sin archivo y la UI cae al kunai: Rock
Lee es cuerpo a cuerpo a propósito, y Neji, Shikamaru, Kiba, Sai y Yamato
simplemente no están dibujados.

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

# La hoja de personajes ya está medida —rejilla, paneles, color del papel, bandas
# de dibujo— por su propio script. Se carga igual, por ruta, para NO duplicar esas
# cien líneas aquí: lo que cambia entre los dos scripts no es cómo se mide la hoja,
# es qué fotograma se saca de ella. Importarlo es seguro porque allí todo cuelga de
# `if __name__ == '__main__'` y no se ejecuta nada al cargarlo.
_spec_personajes = importlib.util.spec_from_file_location(
    'sprites_personajes', os.path.join(AQUI, 'generar-sprites-personajes.py'))
sprites_personajes = importlib.util.module_from_spec(_spec_personajes)
_spec_personajes.loader.exec_module(sprites_personajes)

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

# Los cinco genin rivales SÍ tienen jutsu dibujado, pero en la hoja de personajes:
# es el último fotograma de su tira de ataque. Son los proyectiles que más se ven
# de todo el juego —los genin son la mayoría de los combates—, así que sin esto el
# golpe que el sistema de jutsus existe para subrayar salía por pantalla como un
# kunai, igual que el ataque corriente. La clave es la fila del panel en
# `sprites_personajes.PANELES`; el valor, los ids que hay en esa fila.
FILA_GENIN = 4

# Qué parte de la densidad máxima de columna tiene que bajar una franja para contar
# como separación entre el personaje y su efecto. Ver `ultimo_grupo_denso`.
FRACCION_SEPARADOR = 0.25
MINIMO_GRUPO = 4  # columnas; menos que esto es una chispa suelta, no un dibujo


def perfil_de_columnas(w, ch, px, rect, papel):
    """Cuántas filas de dibujo (no papel) tiene cada columna del rect."""
    x0, y0, x1, y1 = rect
    perfil = []
    for x in range(x0, x1):
        cuenta = 0
        for y in range(y0, y1):
            i = (y * w + x) * ch
            if (abs(px[i] - papel[0]) > sprites_personajes.TOLERANCIA_PAPEL
                    or abs(px[i + 1] - papel[1]) > sprites_personajes.TOLERANCIA_PAPEL
                    or abs(px[i + 2] - papel[2]) > sprites_personajes.TOLERANCIA_PAPEL):
                cuenta += 1
        perfil.append(cuenta)
    return perfil


def ultimo_grupo_denso(perfil):
    """
    El último bloque de columnas con dibujo DENSO del perfil, en índices relativos.

    ⚠️ **Aquí no vale separar por columnas vacías**, que es como se parten los
    fotogramas en el resto del proyecto. En tres de los cinco paneles el efecto está
    despegado y sí habría valido, pero en katon y en raiton **el fuego sale del puño
    del personaje**: entre los dos dibujos no hay ni un píxel de papel, así que la
    detección por huecos los devuelve fundidos en una sola celda y el proyectil salía
    con medio genin pegado a la izquierda.

    Lo que sí los separa es la **densidad**: el chorro que une la mano con el efecto
    ocupa 3-10 filas de alto, contra las 45-55 del cuerpo y las 17-50 del efecto. O
    sea que la cintura fina no es un hueco, pero se mide igual de bien — y con el
    umbral relativo al propio panel, el mismo criterio vale para los cinco.
    """
    if not perfil:
        return None
    umbral = max(perfil) * FRACCION_SEPARADOR
    grupos = []
    for indice, cuenta in enumerate(perfil):
        if cuenta > umbral:
            if grupos and indice - grupos[-1][-1] <= 1:
                grupos[-1].append(indice)
            else:
                grupos.append([indice])
    grupos = [g for g in grupos if len(g) >= MINIMO_GRUPO]
    return (grupos[-1][0], grupos[-1][-1]) if grupos else None


def caja_del_ultimo_fotograma(w, ch, px, panel, papel):
    """
    La caja del último fotograma de la última tira de animación del panel.

    Las tiras van en dos bandas: arriba el idle (que es lo que se lleva el script de
    personajes) y abajo el ataque. El jutsu es el final de la de abajo.
    """
    bandas = sprites_personajes.bandas_con_dibujo(w, ch, px, panel, papel, por_filas=True)
    if len(bandas) < 2:
        return None
    fy0, fy1 = bandas[-1]

    perfil = perfil_de_columnas(w, ch, px, (panel[0], fy0, panel[2], fy1 + 1), papel)
    grupo = ultimo_grupo_denso(perfil)
    if grupo is None:
        return None
    # La cola fina del propio efecto —la punta de la llama, una chispa suelta— también
    # queda por debajo del umbral, así que se recupera estirando el grupo hacia la
    # derecha hasta la primera columna de papel limpio. **Solo hacia la derecha**: a la
    # izquierda es donde está el personaje, y en katon y raiton no hay ni un píxel
    # vacío entre su puño y el efecto, así que estirar por ahí lo traería de vuelta.
    fin = grupo[1]
    while fin + 1 < len(perfil) and perfil[fin + 1] > 0:
        fin += 1
    fx0, fx1 = panel[0] + grupo[0], panel[0] + fin

    return caja_del_dibujo(w, ch, px, (fx0, fy0, fx1 + 1, fy1 + 1), papel)


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


def proyectiles_de_la_hoja_de_personajes():
    """
    Los jutsus de los cinco genin rivales, que están en la hoja de personajes.

    La rejilla se mide con el script de personajes, no se repite aquí, y de cada panel
    de la fila de los genin se saca el ÚLTIMO fotograma de la tira de ataque en vez del
    primero de la de idle, que es lo que se lleva aquel script.
    """
    hoja = sprites_personajes.HOJA
    w, h, ch, px = leer_png(hoja)
    cols, filas = sprites_personajes.separadores(w, h, ch, px)
    huecosX = [(cols[i][1] + 1, cols[i + 1][0]) for i in range(len(cols) - 1)]
    huecosY = [(filas[i][1] + 1, filas[i + 1][0]) for i in range(len(filas) - 1)]
    huecosY = [g for g in huecosY if g[1] - g[0] > 60]  # los bajos son rótulos

    if len(huecosX) != 6 or len(huecosY) != len(sprites_personajes.PANELES):
        raise SystemExit('Rejilla de la hoja de personajes inesperada')

    margen = sprites_personajes.MARGEN_PANEL
    for columna, identificador in enumerate(sprites_personajes.PANELES[FILA_GENIN]):
        if identificador is None:
            continue
        panel = (huecosX[columna][0] + margen, huecosY[FILA_GENIN][0] + margen,
                 huecosX[columna][1] - margen, huecosY[FILA_GENIN][1] - margen)
        papel = sprites_personajes.color_del_papel(w, ch, px, panel)
        caja = caja_del_ultimo_fotograma(w, ch, px, panel, papel)
        if caja is None:
            print(f'  ⚠ {identificador}: no se ha encontrado su jutsu en {panel}')
            continue
        lado, salida = recortar(w, h, ch, px, caja, papel)
        escribir_png_rgba(os.path.join(DESTINO, f'{identificador}.png'), lado, lado, salida)
        print(f'  {identificador}: jutsu de la hoja de personajes, caja {caja} → {lado}×{lado}')


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

    proyectiles_de_la_hoja_de_personajes()


if __name__ == '__main__':
    main()
