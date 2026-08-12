"""
Recorta el sprite de cada personaje de `src/assets/map-sprites-idle-all-characters.png`
a un PNG por personaje en `src/assets/characters/<id>.png`, con fondo transparente.

Uso:  python scripts/generar-sprites-personajes.py

Como el resto de hojas del artista, esta es de **referencia**: rejilla de 6×5
paneles, cada uno con su rótulo ("NARUTO UZUMAKI") y una tira de fotogramas de
animación. Usarla directamente pintaría los rótulos y los marcos.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.

Nada de coordenadas escritas a ojo. El script mide la hoja en tres pasos, cada
uno más fino que el anterior:

1. Los **separadores de la rejilla**, buscando las filas y columnas que son casi
   todas marco oscuro. Los paneles no miden todos lo mismo (las filas de abajo
   son más bajas y la última tiene el rótulo a dos líneas), así que una rejilla
   uniforme calculada dividiendo 1536/6 se habría desalineado sola.
2. Dentro de cada panel, la **primera fila de fotogramas**, buscando bandas de
   filas que tengan algo que no sea papel.
3. Dentro de esa fila, el **primer fotograma**, igual pero por columnas.

Se coge el primer fotograma de la primera fila: es el personaje de frente y
quieto, que es lo que quiere una tarjeta de combate.
"""

import importlib.util
import os
from collections import Counter

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'map-sprites-idle-all-characters.png')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'characters')

# El códec PNG ya está escrito y probado en el script de objetos; se carga por
# ruta porque el nombre del archivo lleva guiones (ver generar-sprites-proyectiles.py).
_spec = importlib.util.spec_from_file_location(
    'sprites_objetos', os.path.join(AQUI, 'generar-sprites-objetos.py'))
sprites_objetos = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sprites_objetos)
leer_png, escribir_png_rgba, recortar = (
    sprites_objetos.leer_png, sprites_objetos.escribir_png_rgba, sprites_objetos.recortar)

# Qué hay en cada panel, en orden de lectura. `None` = está en la hoja pero no en
# el juego (Rin, Temari, Kankuro, Orochimaru). Los ids son los de characters.json,
# enemies.json y common-enemies.json.
PANELES = [
    ['naruto', 'sasuke', 'sakura', 'haku', 'zabuza', None],
    ['zaku', 'rock_lee', 'gaara', 'pain_camino_deva', 'kabuto', None],
    ['shikamaru', 'ino', 'choji', None, None, 'kiba'],
    ['shino', 'neji', 'hinata', 'tenten', 'dosu', 'kin'],
    ['genin_rival_katon', 'genin_rival_fuuton', 'genin_rival_raiton',
     'genin_rival_doton', 'genin_rival_suiton', None],
]

# Sprites que se copian de otro porque su personaje no está en la hoja. Son
# placeholders declarados, no un descuido: Sai y Yamato no tienen arte propio, y
# Camino Animal comparte panel con Camino Deva. Se eligen por tipo de chakra para
# que al menos el color pegue. Ver el punto 2 del roadmap.
PLACEHOLDERS = {
    'sai': 'genin_rival_fuuton',       # Sai es fuuton
    'yamato': 'genin_rival_doton',     # Yamato es doton
    'camino_animal_pain': 'pain_camino_deva',
}

UMBRAL_OSCURO = 70       # por debajo de esto un píxel cuenta como marco
DENSIDAD_SEPARADOR = 0.88  # qué parte de una línea tiene que ser marco para serlo
TOLERANCIA_PAPEL = 26    # cuánto puede alejarse un píxel del papel y seguir siéndolo
MINIMO_BANDA = 8         # bandas más finas que esto son ruido de compresión
# Cuánto se mete el análisis hacia dentro del panel. Sin esto, el borde interior
# del panel (una sombra que no es papel) aparece en TODAS las filas y en TODAS
# las columnas, así que no se separaba ninguna banda y cada sprite salía siendo
# el panel entero.
MARGEN_PANEL = 8
# En algunos paneles los fotogramas se tocan y una banda se come dos o tres
# filas. En vez de escribir la caja a mano para esos, se usa la MEDIANA de todas
# las cajas como calibre: los sprites de la hoja son del mismo tamaño, así que
# cualquiera que salga mucho más grande es una fusión y se recorta al calibre,
# anclado arriba a la izquierda (que es donde empieza el sprite bueno).
FACTOR_FUSION = 1.4
# Todos los sprites salen en un lienzo del MISMO tamaño, con el dibujo centrado y
# sin reescalar. Dos motivos, y los dos se veían en pantalla:
#
# - **Proporciones.** Recortando a la caja justa, un dibujo pequeño acababa en un
#   lienzo pequeño; al pintarlos todos al mismo tamaño CSS, el pequeño se ampliaba
#   más y Chōji salía del tamaño de Naruto.
# - **Nitidez.** El pixel art solo se ve limpio a escalas ENTERAS. Con lienzos de
#   70 a 94 px pintados a un tamaño fijo, cada personaje caía en un factor
#   distinto y ninguno era x2 — se duplicaban unas columnas de píxeles si y otras
#   no. Con un lienzo comun basta con pintar a un múltiplo suyo.
#
# 96 cubre el dibujo mas grande de las dos hojas (el Susanoo de Sasuke) con margen.
LADO_LIENZO = 96


def agrupar(indices):
    """Índices contiguos → lista de (inicio, fin)."""
    grupos = []
    for n in indices:
        if grupos and n - grupos[-1][-1] <= 2:
            grupos[-1].append(n)
        else:
            grupos.append([n])
    return [(g[0], g[-1]) for g in grupos]


def separadores(w, h, ch, px):
    """Las columnas y filas de la hoja que son marco oscuro de la rejilla."""
    def oscuro(x, y):
        i = (y * w + x) * ch
        return px[i] < UMBRAL_OSCURO and px[i + 1] < UMBRAL_OSCURO and px[i + 2] < UMBRAL_OSCURO + 10

    muestrasY = range(0, h, 17)
    muestrasX = range(0, w, 17)
    cols = [x for x in range(w)
            if sum(oscuro(x, y) for y in muestrasY) / len(muestrasY) > DENSIDAD_SEPARADOR]
    filas = [y for y in range(h)
             if sum(oscuro(x, y) for x in muestrasX) / len(muestrasX) > DENSIDAD_SEPARADOR]
    return agrupar(cols), agrupar(filas)


def color_del_papel(w, ch, px, rect):
    """
    El color del papel del panel: el tono más repetido, contando por grupos.

    Los tonos se agrupan de 8 en 8 antes de contar porque **el papel está
    texturizado**: son decenas de variantes de (237,225,204) que por separado no
    ganan a ningún color plano. Contando color a color, el ganador salía siendo
    el NEGRO de los contornos de los sprites, y con eso el borrado de fondo se
    llevaba los contornos y dejaba el papel.
    """
    x0, y0, x1, y1 = rect
    cuenta = Counter()
    muestras = {}
    for y in range(y0, y1, 3):
        for x in range(x0, x1, 3):
            i = (y * w + x) * ch
            grupo = (px[i] // 8, px[i + 1] // 8, px[i + 2] // 8)
            cuenta[grupo] += 1
            muestras.setdefault(grupo, (px[i], px[i + 1], px[i + 2]))
    return muestras[cuenta.most_common(1)[0][0]]


def bandas_con_dibujo(w, ch, px, rect, papel, por_filas):
    """Bandas de filas (o de columnas) del rect que tienen algo que no es papel."""
    x0, y0, x1, y1 = rect

    def hay_dibujo(fijo):
        rango = range(x0, x1) if por_filas else range(y0, y1)
        for movil in rango:
            x, y = (movil, fijo) if por_filas else (fijo, movil)
            i = (y * w + x) * ch
            if (abs(px[i] - papel[0]) > TOLERANCIA_PAPEL
                    or abs(px[i + 1] - papel[1]) > TOLERANCIA_PAPEL
                    or abs(px[i + 2] - papel[2]) > TOLERANCIA_PAPEL):
                return True
        return False

    eje = range(y0, y1) if por_filas else range(x0, x1)
    return [b for b in agrupar([n for n in eje if hay_dibujo(n)]) if b[1] - b[0] >= MINIMO_BANDA]


def encuadrar(lado, px, ladoDestino=None):
    """Centra un lienzo RGBA cuadrado dentro de otro mayor, sin reescalar nada."""
    destino = ladoDestino or LADO_LIENZO
    if lado > destino:
        raise SystemExit(f'Un sprite de {lado}px no cabe en el lienzo comun de {destino}px')
    salida = bytearray(destino * destino * 4)
    desplazamiento = (destino - lado) // 2
    for y in range(lado):
        origen = y * lado * 4
        fila = ((y + desplazamiento) * destino + desplazamiento) * 4
        salida[fila:fila + lado * 4] = px[origen:origen + lado * 4]
    return destino, bytes(salida)


def caja_del_primer_sprite(w, ch, px, panel, papel):
    """Caja del primer fotograma de la primera fila del panel."""
    x0, y0, x1, y1 = panel
    filas = bandas_con_dibujo(w, ch, px, panel, papel, por_filas=True)
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
    cols, filas = separadores(w, h, ch, px)
    print(f'Hoja {w}×{h} — {len(cols) - 1} columnas × {len(filas) - 1} bandas horizontales detectadas')

    # De los separadores verticales salen los 6 huecos de panel. Los horizontales
    # traen además los rótulos, así que la banda de papel de cada fila es la que
    # va desde el último separador de su rótulo hasta el separador siguiente.
    huecosX = [(cols[i][1] + 1, cols[i + 1][0]) for i in range(len(cols) - 1)]
    huecosY = [(filas[i][1] + 1, filas[i + 1][0]) for i in range(len(filas) - 1)]
    # Nos quedamos con los huecos altos: los bajos son el interior de un rótulo.
    huecosY = [g for g in huecosY if g[1] - g[0] > 60]

    if len(huecosX) != 6 or len(huecosY) != len(PANELES):
        raise SystemExit(f'Rejilla inesperada: {len(huecosX)} columnas, {len(huecosY)} filas')

    medidas = {}
    for fila, ids in enumerate(PANELES):
        for columna, identificador in enumerate(ids):
            if identificador is None:
                continue
            panel = (huecosX[columna][0] + MARGEN_PANEL, huecosY[fila][0] + MARGEN_PANEL,
                     huecosX[columna][1] - MARGEN_PANEL, huecosY[fila][1] - MARGEN_PANEL)
            papel = color_del_papel(w, ch, px, panel)
            caja = caja_del_primer_sprite(w, ch, px, panel, papel)
            if caja is None:
                print(f'  ⚠ {identificador}: no se ha encontrado sprite en {panel}')
                continue
            medidas[identificador] = (caja, papel)

    def mediana(valores):
        v = sorted(valores)
        return v[len(v) // 2]

    anchoTipico = mediana([c[2] for c, _ in medidas.values()])
    altoTipico = mediana([c[3] for c, _ in medidas.values()])
    print(f'  calibre: sprite típico {anchoTipico}×{altoTipico}')

    generados = {}
    for identificador, (caja, papel) in medidas.items():
        x, y, ancho, alto = caja
        fusionado = ancho > anchoTipico * FACTOR_FUSION or alto > altoTipico * FACTOR_FUSION
        if fusionado:
            ancho, alto = min(ancho, anchoTipico), min(alto, altoTipico)
            print(f'  {identificador}: fotogramas pegados, recortado al calibre')
        caja = (x, y, ancho, alto)
        lado, salida = encuadrar(*recortar(w, h, ch, px, caja, papel))
        escribir_png_rgba(os.path.join(DESTINO, f'{identificador}.png'), lado, lado, salida)
        generados[identificador] = (caja, lado)
        print(f'  {identificador}: caja {caja} → {lado}×{lado}')

    for destino, origen in PLACEHOLDERS.items():
        if origen not in generados:
            print(f'  ⚠ {destino}: falta su placeholder {origen}')
            continue
        caja, _ = generados[origen]
        papel = color_del_papel(w, ch, px, (caja[0], caja[1], caja[0] + caja[2], caja[1] + caja[3]))
        lado, salida = encuadrar(*recortar(w, h, ch, px, caja, papel))
        escribir_png_rgba(os.path.join(DESTINO, f'{destino}.png'), lado, lado, salida)
        print(f'  {destino}: placeholder, copia de {origen}')


if __name__ == '__main__':
    main()
