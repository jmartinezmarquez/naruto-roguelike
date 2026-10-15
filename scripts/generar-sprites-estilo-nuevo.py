"""
Sprites del ESTILO NUEVO (2026-10-14): recorta las hojas generadas a partir de los
prompts de `documentacion/41-arte-estilo-nuevo.md` y deja un PNG por sprite en su
carpeta de `src/assets/`.

Uso:  python scripts/generar-sprites-estilo-nuevo.py      (necesita Pillow)

Es el script del cambio de estilo: cada hoja está en `HOJAS` con qué es cada dibujo,
de izquierda a derecha. Las hojas que aún no existen se saltan, así que se puede correr
a medias, según vayan llegando.

**Cómo separa los dibujos.** En estas hojas las auras de las transformaciones se
tocan (los dragones de Tenten llegan a Neji y a Shikamaru), así que no basta con
buscar columnas vacías: donde no hay hueco se corta por el valle más profundo, la
columna más fina, que es justo el roce (ver `cortes`).
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

# Cada hoja: (fichero en src/assets/, celdas de izquierda a derecha). Cada celda es
# 'carpeta/id' —la carpeta decide el tipo, ver TIPO_POR_CARPETA— o None para descartar
# ese dibujo. Una hoja puede mezclar carpetas: el personaje y sus transformaciones van
# JUNTOS a propósito, para que el generador mantenga cara, ropa y escala entre ellos.
# Los prompts de cada hoja están en documentacion/41-arte-estilo-nuevo.md.
HOJAS = [
    # --- Tanda 1 (2026-10-14): lo que faltaba ---
    ('sprite-pendientes-personajes.png',
     ['characters/kakashi', 'characters/sai', 'characters/yamato', 'characters/camino_animal_pain']),
    ('sprite-pendientes-transformaciones-1.png',
     ['transformations/kakashi_0', 'transformations/sai_0', 'transformations/yamato_0', None]),
    ('sprite-pendientes-transformaciones-2a.png',
     ['transformations/rock_lee_1', 'transformations/neji_1', 'transformations/tenten_1',
      'transformations/shikamaru_1', 'transformations/ino_1', 'transformations/choji_1']),
    ('sprite-pendientes-transformaciones-2b.png',
     ['transformations/kiba_1', 'transformations/hinata_1', 'transformations/shino_1',
      'transformations/kakashi_1', 'transformations/zabuza_1']),
    ('sprite-pendientes-proyectiles.png',
     ['projectiles/neji', 'projectiles/shikamaru', 'projectiles/kiba', 'projectiles/sai',
      'projectiles/yamato', 'projectiles/camino_animal_pain']),
    ('sprite-pendientes-cascabeles.png', ['items/cascabeles']),

    # --- Tanda 2: rehacer en el estilo nuevo lo que ya existía ---
    ('sprite-estilo-nuevo-01.png',
     ['characters/naruto', 'transformations/naruto_0', 'transformations/naruto_1',
      'characters/sasuke', 'transformations/sasuke_0', 'transformations/sasuke_1']),
    ('sprite-estilo-nuevo-02.png',
     ['characters/sakura', 'transformations/sakura_0', 'transformations/sakura_1',
      'characters/rock_lee', 'transformations/rock_lee_0']),
    ('sprite-estilo-nuevo-03.png',
     ['characters/neji', 'transformations/neji_0', 'characters/tenten', 'transformations/tenten_0',
      'characters/shikamaru', 'transformations/shikamaru_0']),
    ('sprite-estilo-nuevo-04.png',
     ['characters/ino', 'transformations/ino_0', 'characters/choji', 'transformations/choji_0',
      'characters/kiba', 'transformations/kiba_0']),
    ('sprite-estilo-nuevo-05.png',
     ['characters/hinata', 'transformations/hinata_0', 'characters/shino', 'transformations/shino_0',
      'characters/haku']),
    ('sprite-estilo-nuevo-06.png',
     ['characters/zabuza', 'transformations/zabuza_0', 'characters/kabuto', 'transformations/kabuto_0',
      'characters/genin_rival_doton', 'characters/genin_rival_suiton']),
    ('sprite-estilo-nuevo-07.png',
     ['characters/gaara', 'transformations/gaara_0', 'transformations/gaara_1',
      'characters/pain_camino_deva', 'transformations/pain_camino_deva_0']),
    ('sprite-estilo-nuevo-08.png',
     ['characters/zaku', 'characters/dosu', 'characters/kin',
      'characters/genin_rival_katon', 'characters/genin_rival_fuuton', 'characters/genin_rival_raiton']),
    ('sprite-estilo-nuevo-09.png',
     ['projectiles/kunai', 'projectiles/naruto', 'projectiles/sasuke', 'projectiles/sakura',
      'projectiles/tenten', 'projectiles/ino']),
    ('sprite-estilo-nuevo-10.png',
     ['projectiles/choji', 'projectiles/hinata', 'projectiles/shino', 'projectiles/haku',
      'projectiles/zabuza', 'projectiles/kabuto']),
    ('sprite-estilo-nuevo-11.png',
     ['projectiles/gaara', 'projectiles/pain_camino_deva', 'projectiles/zaku', 'projectiles/dosu',
      'projectiles/kin']),
    ('sprite-estilo-nuevo-12.png',
     ['projectiles/genin_rival_katon', 'projectiles/genin_rival_fuuton', 'projectiles/genin_rival_raiton',
      'projectiles/genin_rival_doton', 'projectiles/genin_rival_suiton']),
    ('sprite-estilo-nuevo-13.png',
     ['items/pildora_soldado', 'items/banda_repuesto', 'items/sello_chakra', 'items/pergamino_reserva',
      'items/semilla_sabio']),
    ('sprite-estilo-nuevo-14.png',
     ['items/fragmento_sello_maldito', 'items/pergamino_viento', 'items/kubikiribocho_fragmento',
      'items/calabaza_arena', 'items/anillo_rinnegan_fragmento']),

    # --- Tanda 3: el arte que no es de personaje ---
    ('sprite-estilo-nuevo-15.png',
     ['nodes/combate', 'nodes/evento', 'nodes/descanso', 'nodes/tienda']),
    ('sprite-estilo-nuevo-16.png',
     ['nodes/reclutar-comun', None, 'nodes/reclutar-legendario']),
    ('sprite-estilo-nuevo-17.png',
     ['chakra/katon', 'chakra/fuuton', 'chakra/raiton', 'chakra/doton', 'chakra/suiton']),
    ('sprite-estilo-nuevo-18.png',
     ['menu/logros', 'menu/enciclopedia', 'menu/ajustes', 'menu/reiniciar', 'menu/salon', 'menu/home']),
    ('sprite-estilo-nuevo-19.png',
     ['medals/pais_de_las_olas', 'medals/examen_chunin', 'medals/invasion_de_pain']),
    # Tiras de animación: UNA tira por hoja, un fotograma por celda (ver TIRAS).
    ('sprite-estilo-nuevo-20.png', ['effects/corte']),
    ('sprite-estilo-nuevo-21.png', ['effects/estrella']),
    ('sprite-estilo-nuevo-22.png', ['effects/estrella-metal']),
    ('sprite-estilo-nuevo-23.png', ['effects/explosion-katon']),
    ('sprite-estilo-nuevo-24.png', ['effects/explosion-fuuton']),
    ('sprite-estilo-nuevo-25.png', ['effects/explosion-raiton']),
    ('sprite-estilo-nuevo-26.png', ['effects/explosion-doton']),
    ('sprite-estilo-nuevo-27.png', ['effects/explosion-suiton']),
    ('sprite-estilo-nuevo-28.png', ['effects/humo']),
    # Fondos: una imagen entera por hoja.
    ('sprite-estilo-nuevo-29.png', ['map-columns/pais_de_las_olas']),
    ('sprite-estilo-nuevo-30.png', ['map-columns/examen_chunin']),
    ('sprite-estilo-nuevo-31.png', ['map-columns/invasion_de_pain']),

    # --- Tanda 4: lo último ---
    # La ilustración de la tarjeta de campaña del Home (no existía: la tarjeta salía lisa).
    ('sprite-estilo-nuevo-32.png', ['campaigns/camino_ninja']),
    # Fondos de página del Home, OPCIONALES: los de antes ya eran pixel art detallado.
    ('sprite-estilo-nuevo-33.png', ['home/game-background-dark-theme']),
    ('sprite-estilo-nuevo-34.png', ['home/game-background-light-theme']),
    # El favicon: solo hace falta si cambia el fondo claro, de donde lo recorta
    # generar-favicon.py (ver su docstring).
    ('sprite-estilo-nuevo-35.png', ['favicon/favicon']),
]

TIPO_POR_CARPETA = {
    'characters': 'personaje',
    'transformations': 'transformacion',
    'projectiles': 'proyectil',
    'items': 'objeto',
    'nodes': 'icono',
    'chakra': 'icono',
    'menu': 'icono',
    'medals': 'icono',
    'effects': 'tira',
    'map-columns': 'fondo',
    'campaigns': 'fondo',
    'home': 'fondo',
    'favicon': 'favicon',
}

# Dónde va cada "carpeta" lógica, si no es la suya dentro de src/assets. Los fondos del
# Home viven sueltos en src/assets (los importa App.jsx) y el favicon en public/.
DESTINOS = {
    'home': os.path.join(RAIZ, 'src', 'assets'),
    'favicon': os.path.join(RAIZ, 'public'),
}

# Iconos: lienzo cuadrado y margen, por carpeta. Los nodos y el menú van a 128 como
# los que había (el juego los pinta con tamaño fijo por CSS). Las medallas suben de 32
# a 64: el juego las pinta a 32 y a 64, y a 32 el arte nuevo perdía casi todo.
ICONOS = {
    'nodes': {'lienzo': 128, 'margen_frac': 0.03},
    'chakra': {'lienzo': 96, 'margen_frac': 0.06},
    'menu': {'lienzo': 128, 'margen_frac': 0.04},
    'medals': {'lienzo': 64, 'margen_frac': 0.02},
}

# Tiras de animación: cuántos fotogramas y de qué lado. ⚠️ Tienen que coincidir con
# `lado` y `fotogramas` de src/components/Combat/spritesDeEfecto.js, o la animación
# CSS (steps() sobre el fondo) se descuadra.
TIRAS = {
    'corte': (4, 64),
    'estrella': (4, 64),
    'estrella-metal': (4, 64),
    'explosion-katon': (6, 96),
    'explosion-fuuton': (6, 96),
    'explosion-raiton': (6, 96),
    'explosion-doton': (6, 96),
    'explosion-suiton': (6, 96),
    'humo': (6, 80),
}

# Fondos de columna del mapa: el tamaño de los que había. Se recorta para CUBRIR, no
# para caber: un fondo con bandas vacías se vería roto.
FONDOS = {
    'map-columns': (520, 832, 'png'),
    # La celda de la tarjeta es apaisada y cambia con el ancho (en móvil, una franja de
    # 128 px de alto a todo el ancho); se pinta con background-size: cover, así que vale
    # un 16:9 con el motivo en el centro.
    'campaigns': (1024, 576, 'png'),
    # El tamaño de los que había. En JPEG: son las dos imágenes más pesadas de la primera
    # carga (ver documentacion/37-publicacion-web.md) y el PNG pesaba el triple.
    'home': (1672, 941, 'jpg'),
}

# El favicon: un icono cuadrado ampliado a múltiplo entero, como el que había.
FAVICON_LADO = 160

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


PASO_CORTE = 2        # se prueban cortes cada 2 columnas: de sobra para hojas de ~2000 px
PESO_DENSIDAD = 5.0   # lo que cuesta cortar por una columna llena (frente a una vacía)
PESO_ANCHO = 3.0      # lo que cuesta que un dibujo se aleje del ancho medio (ver hoja 10)


def cortes(hoja, n):
    """
    Los n tramos [x0, x1) de la hoja, uno por dibujo.

    Se eligen los n-1 cortes que **minimizan un coste** (programación dinámica sobre
    las columnas de la hoja):

    - **cortar por una columna pintada** cuesta en proporción a lo llena que esté: un
      hueco no cuesta nada, un roce de dos auras casi nada, atravesar a un personaje
      mucho (`PESO_DENSIDAD`);
    - **que un dibujo salga mucho más ancho o más estrecho que la media** también cuesta
      (`PESO_ANCHO`), al cuadrado de la desviación.

    ⚠️ **Hacen falta las dos cosas**, y se aprendió por las malas:
    - Repartir en partes iguales y ajustar a la columna más fina fallaba con dibujos de
      anchos muy distintos (hoja 04: la transformación de Kiba con Akamaru mide el doble
      que Ino, y los cortes caían dentro de Chōji).
    - Cortar primero por los huecos fallaba al revés: las dos manos de Hinata (hoja 10)
      tienen un hueco real entre ellas, así que salían como dos dibujos, y a cambio
      Zabuza y Kabuto, que se rozan, salían como uno.
    Con el coste, ese hueco entre manos pierde: deja dos trozos estrechos y uno el doble
    de ancho, y eso pesa más que cortar por el roce fino de al lado.
    """
    datos = mascara(hoja).load()
    alto = hoja.height
    alturas = [sum(1 for y in range(alto) if datos[x, y]) for x in range(hoja.width)]
    caja = mascara(hoja).getbbox()
    inicio, fin = caja[0], caja[2]
    medio = (fin - inicio) / n
    if n == 1:
        return [(inicio, fin)]

    posiciones = list(range(inicio + PASO_CORTE, fin - PASO_CORTE, PASO_CORTE))
    coste_corte = [PESO_DENSIDAD * alturas[x] / alto for x in posiciones]

    def coste_tramo(a, b):
        return PESO_ANCHO * ((b - a - medio) / medio) ** 2

    # mejor[k][i] = coste mínimo de partir [inicio, posiciones[i]) en k+1 tramos con el
    # último corte en posiciones[i]; desde[k][i] = índice del corte anterior.
    infinito = float('inf')
    m = len(posiciones)
    mejor = [[infinito] * m for _ in range(n - 1)]
    desde = [[-1] * m for _ in range(n - 1)]
    for i, x in enumerate(posiciones):
        mejor[0][i] = coste_tramo(inicio, x) + coste_corte[i]
    for k in range(1, n - 1):
        for i, x in enumerate(posiciones):
            mejor_aqui, de = infinito, -1
            for p in range(i):
                if mejor[k - 1][p] == infinito:
                    continue
                c = mejor[k - 1][p] + coste_tramo(posiciones[p], x)
                if c < mejor_aqui:
                    mejor_aqui, de = c, p
            if de >= 0:
                mejor[k][i] = mejor_aqui + coste_corte[i]
                desde[k][i] = de

    ultimo = min(range(m), key=lambda i: mejor[n - 2][i] + coste_tramo(posiciones[i], fin))
    cortes_x = []
    i, k = ultimo, n - 2
    while k >= 0:
        cortes_x.append(posiciones[i])
        i, k = desde[k][i], k - 1
    bordes = [inicio] + sorted(cortes_x) + [fin]
    return list(zip(bordes, bordes[1:]))


def quitar_restos_del_vecino(dibujo):
    """
    Borra las manchas que tocan el borde izquierdo o derecho del corte y son **mucho más
    pequeñas que la pieza principal del dibujo** (menos del 35% de ella): son trozos del
    dibujo de al lado que el corte se ha llevado.

    ⚠️ La primera versión medía contra el TOTAL pintado (menos del 3%) y se quedaba corta
    con los dibujos finos: la hoja de Kabuto (hoja 10) es tan estrecha que el jirón de la
    niebla de Zabuza que se colaba pesaba más que ese 3%. Comparar con la pieza principal
    no depende de lo grande que sea el dibujo.
    """
    ancho, alto = dibujo.size
    datos = mascara(dibujo).load()
    etiqueta = [0] * (ancho * alto)
    tamanos = {}
    toca_borde = set()
    actual = 0
    for y0 in range(alto):
        for x0 in range(ancho):
            if not datos[x0, y0] or etiqueta[y0 * ancho + x0]:
                continue
            actual += 1
            etiqueta[y0 * ancho + x0] = actual
            pila, n = [(x0, y0)], 0
            while pila:
                x, y = pila.pop()
                n += 1
                if x in (0, ancho - 1):
                    toca_borde.add(actual)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < ancho and 0 <= ny < alto and datos[nx, ny] and not etiqueta[ny * ancho + nx]:
                        etiqueta[ny * ancho + nx] = actual
                        pila.append((nx, ny))
            tamanos[actual] = n
    if not tamanos:
        return dibujo
    principal = max(tamanos, key=tamanos.get)
    fuera = {e for e in toca_borde if e != principal and tamanos[e] < tamanos[principal] * 0.35}
    if not fuera:
        return dibujo
    alfa = dibujo.getchannel('A')
    pa = alfa.load()
    for y in range(alto):
        for x in range(ancho):
            if etiqueta[y * ancho + x] in fuera:
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


def quitar_damero_pintado(hoja):
    """
    Para las hojas que llegan SIN transparencia, con el damero gris pintado (las 15, 16
    y 19). Se borra por **inundación desde el borde** sobre lo gris y sin color: el
    contorno negro de cada dibujo frena el relleno, así que los grises de DENTRO —el
    aro de piedra de los nodos— no se tocan, que es lo que haría un umbral global.
    Mismo método que generar-sprites-objetos-nuevos.py, con el damero de estas hojas
    (grises neutros de ~125 a ~200, más las vetas claras que el generador le pinta).
    """
    rgb = hoja.convert('RGB')
    ancho, alto = rgb.size
    px = rgb.load()

    def es_fondo(x, y):
        r, g, b = px[x, y]
        return min(r, g, b) >= 100 and max(r, g, b) - min(r, g, b) <= 14

    fondo = bytearray(ancho * alto)
    pila = [(x, y) for x in range(ancho) for y in (0, alto - 1)] + [(x, y) for y in range(alto) for x in (0, ancho - 1)]
    while pila:
        x, y = pila.pop()
        i = y * ancho + x
        if fondo[i] or not es_fondo(x, y):
            continue
        fondo[i] = 1
        if x > 0: pila.append((x - 1, y))
        if x < ancho - 1: pila.append((x + 1, y))
        if y > 0: pila.append((x, y - 1))
        if y < alto - 1: pila.append((x, y + 1))

    resultado = rgb.convert('RGBA')
    resultado.putalpha(Image.frombytes('L', (ancho, alto), bytes(0 if v else 255 for v in fondo)))
    return resultado


def colocar_icono(dibujo, carpeta):
    c = ICONOS[carpeta]
    lienzo = Image.new('RGBA', (c['lienzo'], c['lienzo']), (0, 0, 0, 0))
    util = c['lienzo'] * (1 - 2 * c['margen_frac'])
    escala = min(util / dibujo.width, util / dibujo.height)
    d = reducir(dibujo, dibujo.width * escala, dibujo.height * escala)
    lienzo.alpha_composite(d, ((c['lienzo'] - d.width) // 2, (c['lienzo'] - d.height) // 2))
    return lienzo


def tira(hoja, fotogramas, lado):
    """
    Una tira de animación: la hoja trae los fotogramas en fila. ⚠️ Todos se reducen con
    la MISMA escala —la del fotograma más grande—, no cada uno a su caja: una explosión
    que crece tiene que crecer, y escalando cada fotograma por separado saldrían todos
    del mismo tamaño. Por lo mismo no se limpian "restos del vecino": los últimos
    fotogramas de un desvanecido son motas sueltas a propósito.
    """
    trozos = []
    for x0, x1 in cortes(hoja, fotogramas):
        trozo = hoja.crop((x0, 0, x1, hoja.height))
        trozo.putalpha(trozo.getchannel('A').point(lambda a: a if a >= ALFA_MINIMO else 0))
        caja = mascara(trozo).getbbox()
        trozos.append(trozo.crop(caja) if caja else None)
    vivos = [x for x in trozos if x]
    escala = min(lado * 0.94 / max(x.width for x in vivos), lado * 0.94 / max(x.height for x in vivos))
    resultado = Image.new('RGBA', (lado * fotogramas, lado), (0, 0, 0, 0))
    for k, trozo in enumerate(trozos):
        if trozo is None:
            continue
        d = reducir(trozo, trozo.width * escala, trozo.height * escala)
        resultado.alpha_composite(d, (k * lado + (lado - d.width) // 2, (lado - d.height) // 2))
    return resultado


def fondo(imagen, ancho, alto):
    """Reducida para CUBRIR el tamaño y recortada al centro."""
    imagen = imagen.convert('RGB')
    escala = max(ancho / imagen.width, alto / imagen.height)
    d = imagen.resize((round(imagen.width * escala), round(imagen.height * escala)), Image.Resampling.LANCZOS)
    x0, y0 = (d.width - ancho) // 2, (d.height - alto) // 2
    return d.crop((x0, y0, x0 + ancho, y0 + alto))


if __name__ == '__main__':
    for fichero, celdas in HOJAS:
        ruta = os.path.join(ASSETS, fichero)
        if not os.path.exists(ruta):
            print('--', fichero, 'no existe todavía, se salta')
            continue
        original = Image.open(ruta)
        primera = next(c for c in celdas if c)
        carpeta, ident = primera.split('/')
        tipo = TIPO_POR_CARPETA[carpeta]
        destino = DESTINOS.get(carpeta, os.path.join(ASSETS, carpeta))
        # Sin alfa y no siendo un fondo: trae el damero pintado y hay que borrarlo.
        sin_alfa = 'A' not in original.getbands()
        hoja = quitar_damero_pintado(original) if sin_alfa and tipo != 'fondo' else original.convert('RGBA')

        if tipo == 'tira':
            fotogramas, lado = TIRAS[ident]
            tira(hoja, fotogramas, lado).save(os.path.join(destino, f'{ident}.png'))
            print('ok', primera, f'{fotogramas} fotogramas de {lado}')
            continue
        if tipo == 'fondo':
            ancho, alto, ext = FONDOS[carpeta]
            imagen = fondo(hoja, ancho, alto)
            ruta_salida = os.path.join(destino, f'{ident}.{ext}')
            if ext == 'jpg':
                imagen.save(ruta_salida, quality=88, optimize=True, progressive=True)
            else:
                imagen.save(ruta_salida)
            print('ok', primera, (ancho, alto, ext))
            continue
        if tipo == 'favicon':
            dibujo = limpio(hoja)
            lado = max(dibujo.size)
            lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
            lienzo.alpha_composite(dibujo, ((lado - dibujo.width) // 2, (lado - dibujo.height) // 2))
            lienzo.resize((FAVICON_LADO, FAVICON_LADO), Image.Resampling.LANCZOS).save(
                os.path.join(destino, f'{ident}.png'))
            print('ok', primera, FAVICON_LADO)
            continue

        for (x0, x1), celda in zip(cortes(hoja, len(celdas)), celdas):
            if celda is None:
                continue
            carpeta, ident = celda.split('/')
            tipo = TIPO_POR_CARPETA[carpeta]
            dibujo = limpio(hoja.crop((x0, 0, x1, hoja.height)))
            sprite = colocar_icono(dibujo, carpeta) if tipo == 'icono' else colocar(dibujo, tipo)
            sprite.save(os.path.join(ASSETS, carpeta, f'{ident}.png'))
            print('ok', celda, (x0, x1))
