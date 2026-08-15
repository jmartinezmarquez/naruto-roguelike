"""
Genera los fondos de columna del mapa al estilo de las rutas de Pokémon, que es lo
que hace Pokelike: **suelo liso** de un color por arco, **borde denso** de vegetación
o ruina a los dos lados, y **detalle suelto y escaso** por en medio.

Salida: src/assets/map-columns/<arco>.png  (lo que importa MapScreen)

Uso:  python scripts/generar-columnas-mapa.py

Sin dependencias: escribe PNG con zlib de la librería estándar, así que funciona
igual en Windows que en macOS. Es determinista (semilla fija): volver a correrlo da
exactamente el mismo fichero.

--- Por qué se DIBUJA y ya no se compone -------------------------------------

La versión anterior recortaba el paisaje del artista (`map-columns/originales/`) y le
aplanaba el centro. Resolvía el problema de que los nodos se perdieran, pero seguía
siendo una ilustración densa recortada: el centro quedaba lavado y los bordes,
sucios. Una ruta de Pokémon no es un paisaje recortado — es un color plano con cuatro
cosas puestas encima, y esa diferencia no se consigue filtrando una foto.

Los originales se conservan en `originales/` como referencia de paleta y por si algún
día se vuelve a ellos; este script ya no los lee.

--- Las tres reglas del dibujo -----------------------------------------------

1. **El suelo es plano.** Un color por arco y un moteado muy flojo del mismo tono
   para que no parezca un rectángulo de Paint. Nada que compita con un nodo.
2. **El borde es denso y los lados son lo único denso.** Encuadra la columna y da
   todo el sabor del arco. Su ancho tiene tope duro (ver `BORDE`).
3. **El detalle suelto es escaso y se aparta.** Va detrás de los nodos, así que un
   solape ocasional no se ve; lo que se nota es la DENSIDAD. Dos pesos lo controlan:
   baja hacia el centro horizontal (donde siempre hay nodos) y baja en las filas
   donde se sabe que van a caer (ver `FILAS_DE_NODO`).
"""

import math
import os
import struct
import zlib

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'map-columns')

# El lienzo del mapa es ANCHO x (ALTO_POR_PISO * pisos), con los 8 pisos que tienen
# hoy los tres arcos.
#
# ⚠️ **Los dos números tienen que ser los mismos que en `MapScreen.jsx`.** El fondo se
# pinta con `backgroundSize: 100% 100%`, así que si el lienzo del juego y el PNG no
# miden lo mismo el dibujo **se deforma** — no se recorta, se estira, y los árboles
# del borde salen ovalados. MapScreen lleva el mismo aviso al lado de su constante.
ANCHO = 520
ALTO_POR_PISO = 104
PISOS = 8
ALTO = ALTO_POR_PISO * PISOS

# ⚠️ Tope duro del borde. El piso más ancho tiene 4 nodos, así que el de más a la
# izquierda cae en x = 520/5 = 104, y un nodo mide como mucho 76 px (`TAMANO_MAXIMO_NODO`
# en MapScreen.jsx) → su borde izquierdo llega a x ≈ 66. Por encima de eso la
# vegetación se le metería debajo. Si algún día se agrandan los nodos, este número baja.
BORDE = 60

# Dónde caen los nodos en vertical: `calcularPosiciones` los pone en el centro de cada
# piso, o sea y = 60, 180, 300… Es lo ÚNICO que se puede saber al generar el fondo —
# la x depende de cuántos nodos tenga el piso, que se sortea en cada run.
FILAS_DE_NODO = [ALTO_POR_PISO * i + ALTO_POR_PISO // 2 for i in range(PISOS)]

SEMILLA = 20260815

# El negro del marco. Es el mismo para los tres arcos: es el encuadre, no el paisaje.
MARCO = (26, 22, 18)


class Azar:
    """Generador propio (LCG) para no depender de que `random` no cambie entre versiones."""

    def __init__(self, semilla):
        self.s = semilla & 0xFFFFFFFF

    def siguiente(self):
        self.s = (1103515245 * self.s + 12345) & 0x7FFFFFFF
        return self.s / 0x7FFFFFFF

    def entre(self, a, b):
        return a + int(self.siguiente() * (b - a + 1))

    def elige(self, xs):
        return xs[self.entre(0, len(xs) - 1)]


# --- Paletas ------------------------------------------------------------------
# Escritas a mano y no sacadas del original: son cuatro colores por arco y a mano se
# controla el contraste con los nodos, que es lo único que importa aquí.
PALETAS = {
    # País de las Olas: un camino de ARENA entre el mar. Nada de bosque — es el arco
    # del puente y la niebla, y compartía estilo con el Examen Chunin hasta el punto
    # de que los dos mapas se confundían.
    'pais_de_las_olas': {
        # Hierba de isla, verde CLARO y tirando a azulado: el Bosque de la Muerte es
        # verde muy oscuro, así que a la vista no se pueden confundir.
        'suelo': (132, 180, 140),
        'moteado': (118, 166, 128),
        'hoja': [(74, 124, 92), (56, 104, 76), (104, 152, 112)],
        'tronco': (122, 94, 62),                     # madera del puente de Tazuna
        'deco': [(226, 220, 202), (208, 190, 152)],  # conchas y madera de deriva
        'piedra': (140, 142, 138),
        'sombra': (108, 156, 120),
        'brillo': (240, 240, 228),
        # La orilla, de fuera adentro: mar hondo, mar bajo, espuma y arena mojada.
        'agua_honda': (38, 88, 124),
        'agua_baja': (68, 142, 168),
        'espuma': (228, 240, 242),
        'arena': (206, 192, 156),
        'arena_humeda': (176, 162, 128),
    },
    # Bosque de la Muerte: más oscuro que el resto a propósito — es el sitio donde no
    # entra la luz, y es lo que lo separa de un día en la playa.
    'examen_chunin': {
        'suelo': (74, 108, 74),
        'moteado': (64, 96, 66),
        'hoja': [(26, 58, 38), (16, 42, 28), (40, 78, 50)],
        'tronco': (44, 34, 26),
        'deco': [(150, 142, 78), (58, 92, 56)],     # hierba seca y matojos
        'piedra': (86, 92, 86),
        'sombra': (54, 82, 56),
        'brillo': (172, 178, 140),
    },
    # Konoha arrasada: tierra pisada, escombro y madera quemada en vez de árboles.
    'invasion_de_pain': {
        'suelo': (150, 132, 108),
        'moteado': (138, 120, 98),
        'hoja': [(96, 92, 88), (78, 74, 72), (114, 108, 100)],
        'tronco': (68, 58, 50),
        'deco': [(168, 88, 72), (120, 112, 104)],   # tejas rotas y cascotes
        'piedra': (136, 130, 122),
        'sombra': (124, 108, 88),
        'brillo': (206, 198, 184),
    },
}


# --- Dibujo -------------------------------------------------------------------

def poner(px, x, y, c):
    if 0 <= x < ANCHO and 0 <= y < ALTO:
        i = (y * ANCHO + x) * 3
        px[i], px[i + 1], px[i + 2] = c


def disco(px, cx, cy, r, c):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy <= r * r:
                poner(px, x, y, c)


def rect(px, x0, y0, w, h, c):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            poner(px, x, y, c)


# --- Bordes ---------------------------------------------------------------------
# ⚠️ **Cada arco tiene su borde, no solo su paleta.** Con `arbol` para los tres y solo
# los colores cambiados, el País de las Olas y el Examen Chunin salían **el mismo
# mapa en dos verdes**: la silueta manda mucho más que el color, y una fila de copas
# redondas es una fila de copas redondas se pinte del verde que se pinte.

def borde_arboles(px, lado, pal, azar):
    """Bosque: copas apretadas, pintadas de arriba abajo para que las de abajo tapen
    a las de arriba y la banda se lea como una masa y no como una fila de sellos."""
    base = 0 if lado == 0 else ANCHO - BORDE
    for y in range(-10, ALTO + 20, 22):
        for _ in range(3):
            escala = 0.8 + azar.siguiente() * 0.5
            # El centro se limita para que la COPA no se salga de la banda: medir el
            # tope contra el centro del árbol metía 17 px de copa bajo los nodos.
            radio = int(13 * escala) + 4
            arbol(px, base + azar.entre(-radio // 2, BORDE - radio),
                  y + azar.entre(-8, 8), pal, azar, escala=escala)


def borde_agua(px, lado, pal, azar):
    """
    Costa del País de las Olas: **una playa de verdad, no una raya de agua**.

    De fuera adentro: mar hondo → mar bajo → espuma → arena mojada → arena seca →
    hierba. Son cinco franjas y no dos, y eso es lo que la hace leerse como una orilla
    en vez de como un río al lado de un desierto — que es lo que parecía la primera
    versión, con todo el suelo de arena y el agua pegada al canto.

    La onda de la orilla es la MISMA para las cinco franjas (se desplazan juntas), que
    es lo que hace que parezca una costa y no cinco líneas independientes.
    """
    base = 0 if lado == 0 else ANCHO - BORDE
    # Anchos de cada franja, contados desde el exterior.
    AGUA, ESPUMA, MOJADA, SECA = BORDE - 26, 2, 5, 9

    for y in range(ALTO):
        onda = int(6 * math.sin(y / 41.0) + 3 * math.sin(y / 13.0))
        i = 0

        def franja(ancho, color, jitter=0):
            nonlocal i
            for _ in range(ancho + jitter):
                x = base + i + onda if lado == 0 else ANCHO - 1 - i - onda
                poner(px, x, y, color)
                i += 1

        # El mar se pinta hasta el borde exterior del lienzo, sin onda, para que no
        # asome el suelo por detrás cuando la onda va hacia dentro.
        for k in range(AGUA + onda + 4):
            x = base + k - 4 if lado == 0 else ANCHO - 1 - k + 4
            poner(px, x, y, pal['agua_honda'] if k < AGUA - 8 else pal['agua_baja'])
        i = AGUA
        franja(ESPUMA, pal['espuma'])
        franja(MOJADA, pal['arena_humeda'])
        franja(SECA, pal['arena'], jitter=azar.entre(0, 2))

    # Juncos y piedras donde la arena toca la hierba, para que la última franja no sea
    # un corte limpio.
    for _ in range(30):
        y = azar.entre(0, ALTO - 1)
        onda = int(6 * math.sin(y / 41.0) + 3 * math.sin(y / 13.0))
        borde_x = AGUA + ESPUMA + MOJADA + SECA + onda
        x = (borde_x + azar.entre(-2, 6)) if lado == 0 else (ANCHO - 1 - borde_x - azar.entre(-2, 6))
        (hierba if azar.siguiente() < 0.7 else piedra)(px, x, y, pal, azar)


def borde_ruina(px, lado, pal, azar):
    """Konoha arrasada: lienzos de muro roto de alturas distintas, apilados. Rectas y
    esquinas donde los otros dos arcos tienen curvas."""
    base = 0 if lado == 0 else ANCHO - BORDE
    # ⚠️ El lado de FUERA va siempre a ras y solo varía el de dentro. La primera
    # versión movía los dos y metía mordiscos a mansalva, y el resultado no parecía un
    # muro roto: parecía **ruido**. Una ruina se lee por sus rectas largas y sus
    # esquinas; lo que la rompe tiene que ser poco y grande, no mucho y pequeño.
    y = -8
    while y < ALTO + 8:
        alto = azar.entre(26, 52)
        ancho = azar.entre(BORDE - 16, BORDE - 2)
        x0 = base if lado == 0 else base + BORDE - ancho
        rect(px, x0, y, ancho, alto, pal['hoja'][azar.entre(0, 1)])
        # Coronación más clara: es lo que hace que se lea como un muro y no como una
        # mancha rectangular.
        rect(px, x0, y, ancho, 3, pal['hoja'][2])
        # Un solo mordisco, y grande, en el canto interior.
        if azar.siguiente() < 0.35:
            hueco = azar.entre(8, 14)
            mx = x0 + ancho - hueco if lado == 0 else x0
            rect(px, mx, y + azar.entre(4, max(5, alto // 2)), hueco, azar.entre(8, 16), pal['suelo'])
        y += alto


BORDES = {
    'pais_de_las_olas': borde_agua,
    'examen_chunin': borde_arboles,
    'invasion_de_pain': borde_ruina,
}


def arbol(px, cx, cy, pal, azar, escala=1.0):
    """Copa de tres discos desfasados sobre un tronco corto. Sin contorno: a la
    escala a la que se ve el mapa, un contorno de 1 px se convierte en suciedad."""
    r = int(13 * escala)
    rect(px, cx - max(1, r // 4), cy, max(2, r // 2), int(10 * escala), pal['tronco'])
    disco(px, cx, cy - r // 2, r, pal['hoja'][1])
    disco(px, cx - r // 3, cy - r, int(r * 0.75), pal['hoja'][0])
    disco(px, cx + r // 3, cy - r + 2, int(r * 0.6), pal['hoja'][2])


def mata(px, cx, cy, pal, azar):
    """Arbusto: dos discos y una luz arriba. Lleva sombra propia porque sin ella,
    sobre un suelo plano, un disco verde sobre verde no se lee como un objeto."""
    r = azar.entre(7, 9)
    disco(px, cx + 1, cy + 2, r, pal['sombra'])
    disco(px, cx, cy, r, pal['hoja'][0])
    # La luz ocupa casi todo el disco, no una esquinita: con un realce pequeño el
    # arbusto se leía como un agujero oscuro en el suelo en vez de como una planta.
    disco(px, cx - 1, cy - 2, r - 2, pal['hoja'][2])


def flores(px, cx, cy, pal, azar):
    """El macizo de flores de una ruta de Pokémon: mata pequeña y cuatro o cinco
    puntos de color GORDOS encima. Con puntos de 1 px se leían como polvo."""
    disco(px, cx + 1, cy + 2, 7, pal['sombra'])
    disco(px, cx, cy, 7, pal['hoja'][2])
    for _ in range(azar.entre(4, 6)):
        c = azar.elige(pal['deco'])
        fx, fy = cx + azar.entre(-5, 5), cy + azar.entre(-4, 4)
        disco(px, fx, fy, 2, c)
        poner(px, fx, fy - 1, pal['brillo'])


def hierba(px, cx, cy, pal, azar):
    """Los tres tallos que salpican la hierba alta de una ruta. En el tono OSCURO
    de la paleta: en el claro desaparecían contra el suelo."""
    c = pal['hoja'][0]
    for dx, alto in ((-5, 8), (0, 12), (5, 9)):
        alto += azar.entre(-1, 2)
        for dy in range(alto):
            # Los tallos se van cerrando hacia la punta, que es lo que los hace
            # parecer hierba y no tres palotes.
            poner(px, cx + dx, cy - dy, c)
            if dy < alto - 3:
                poner(px, cx + dx + 1, cy - dy, c)


def madera(px, cx, cy, pal, azar):
    """Solo del arco 1: un tablón de deriva en la arena. El puente de Tazuna es la
    imagen del arco, así que la madera suelta cuenta más que una flor."""
    largo = azar.entre(12, 20)
    for i in range(largo):
        poner(px, cx - largo // 2 + i, cy, pal['tronco'])
        poner(px, cx - largo // 2 + i, cy + 1, pal['tronco'])
        if i % 5 == 0:
            poner(px, cx - largo // 2 + i, cy + 2, pal['sombra'])


def escombro(px, cx, cy, pal, azar):
    """Solo del arco 3: una viga caída con dos cascotes. Le da a Konoha arrasada algo
    que no sea otra piedra redonda."""
    largo = azar.entre(14, 22)
    grosor = azar.entre(3, 4)
    for i in range(largo):
        for g in range(grosor):
            poner(px, cx - largo // 2 + i, cy + g + (i // 7), pal['tronco'])
    disco(px, cx - largo // 2 - 2, cy + 3, 3, pal['piedra'])
    disco(px, cx + largo // 2 + 1, cy + 5, 2, pal['piedra'])


def piedra(px, cx, cy, pal, azar):
    # El realce va a `moteado` y no a `brillo`, y pequeño: con el brillo entero las
    # piedras se leían como **puntos blancos** repartidos por el mapa, que en un fondo
    # tan plano es lo que más llama la atención de todo. Una piedra tiene que estar,
    # no que verse.
    r = azar.entre(5, 7)
    disco(px, cx + 1, cy + 2, r, pal['sombra'])
    disco(px, cx, cy, r, pal['piedra'])
    disco(px, cx - 2, cy - 2, max(1, r - 5), pal['moteado'])


# ⚠️ **Cada arco tiene su repertorio**, y no es sabor: es lo que evita el fallo que
# tuvo la primera versión. Con una lista común, en los arcos verdes salían arbustos
# —un disco verde oscuro sobre suelo verde— y a la escala del mapa se leían como
# AGUJEROS en el suelo, no como plantas. Mirando la referencia, una ruta de Pokémon no
# tiene arbustos sueltos: tiene macizos de flores y matas de hierba, que son cosas con
# color o con silueta. El arbusto se retiró de los dos arcos verdes por eso.
#
# Los pesos son las repeticiones de la lista.
REPERTORIOS = {
    'pais_de_las_olas': [hierba, hierba, piedra, piedra, madera, madera],
    'examen_chunin': [hierba, hierba, hierba, flores, flores, piedra],
    'invasion_de_pain': [piedra, piedra, piedra, escombro, escombro, hierba],
}


def peso_de_sitio(x, y):
    """
    Cuánto encaja una decoración en (x, y). Es el corazón del diseño: el detalle no
    se reparte por igual, **se aparta de donde van los nodos**.

    - En horizontal: el centro es donde SIEMPRE hay nodos (un piso de 1 nodo lo pone
      justo en x=260), así que el peso cae hacia el medio.
    - En vertical: las filas de nodo son fijas y conocidas, así que el peso cae al
      acercarse a una de ellas. No es un veto porque la decoración va DETRÁS del
      nodo: un solape ocasional no se ve, lo que se nota es la densidad.
    """
    dx = abs(x - ANCHO / 2) / (ANCHO / 2)          # 0 en el centro, 1 en el borde
    peso_x = 0.15 + 0.85 * (dx ** 2)
    dy = min(abs(y - fila) for fila in FILAS_DE_NODO)
    peso_y = min(1.0, dy / 50.0)                    # 0 encima de la fila, 1 a 50 px
    return peso_x * peso_y


def generar(arco, pal):
    azar = Azar(SEMILLA + sum(arco.encode()))
    repertorio = REPERTORIOS[arco]
    px = bytearray(ANCHO * ALTO * 3)

    # 1) Suelo liso, con un moteado flojo para que no parezca un rectángulo pintado.
    for y in range(ALTO):
        for x in range(ANCHO):
            poner(px, x, y, pal['suelo'])
    # Marcas de hierba de 1 px, no ruido: con discos de 2 px el suelo se llenaba de
    # grano y competía con los nodos, que es justo lo que este rediseño evita.
    for _ in range(900):
        x, y = azar.entre(0, ANCHO - 1), azar.entre(0, ALTO - 1)
        poner(px, x, y, pal['moteado'])
        if azar.siguiente() < 0.4:
            poner(px, x + 1, y, pal['moteado'])

    # 2) Los bordes, uno por lado y **con la forma que le toca al arco**.
    for lado in (0, 1):
        BORDES[arco](px, lado, pal, azar)

    # 3) El detalle suelto. Se tiran muchos candidatos y se aceptan pocos: cada uno
    # pasa por `peso_de_sitio`, así que los que caen encima de una fila de nodos o en
    # mitad de la columna se descartan casi siempre.
    # ⚠️ Distancia mínima entre decoraciones. Sin ella el sorteo hacía **corrillos**:
    # cuatro macizos de flores pegados en una esquina y medio mapa vacío. El azar
    # uniforme se agrupa por naturaleza, y en un fondo tan vacío se ve muchísimo.
    SEPARACION = 52
    puestos = []
    intentos = 0
    while len(puestos) < 30 and intentos < 6000:
        intentos += 1
        x = azar.entre(BORDE + 10, ANCHO - BORDE - 10)
        y = azar.entre(12, ALTO - 12)
        if azar.siguiente() > peso_de_sitio(x, y):
            continue
        if any((x - px2) ** 2 + (y - py2) ** 2 < SEPARACION ** 2 for px2, py2 in puestos):
            continue
        azar.elige(repertorio)(px, x, y, pal, azar)
        puestos.append((x, y))
    puestas = len(puestos)

    # 4) ⚠️ El marco, **a los cuatro lados y dentro del PNG**. Antes el encuadre lo
    # ponía solo el `box-shadow` del lienzo, y como las bandas de vegetación tapan los
    # lados verticales, el remate se leía únicamente arriba y abajo — la columna
    # parecía abierta por los costados. Dibujarlo aquí lo ata al dibujo: se escala con
    # él y no depende de que nadie recuerde el CSS.
    for i in range(3):
        c = MARCO if i < 2 else pal['sombra']
        for x in range(ANCHO):
            poner(px, x, i, c)
            poner(px, x, ALTO - 1 - i, c)
        for y in range(ALTO):
            poner(px, i, y, c)
            poner(px, ANCHO - 1 - i, y, c)

    return bytes(px), puestas


# --- PNG ----------------------------------------------------------------------

def escribir_png(path, w, h, px):
    """px = bytes RGB. Elige filtro por fila con la heurística estándar."""
    stride = w * 3
    cuerpo = bytearray()
    prev = bytes(stride)
    for y in range(h):
        line = px[y * stride:(y + 1) * stride]
        mejor = None
        for f in range(5):
            if f == 0:
                cand = bytes(line)
            elif f == 1:
                cand = bytes((line[i] - (line[i - 3] if i >= 3 else 0)) & 255 for i in range(stride))
            elif f == 2:
                cand = bytes((line[i] - prev[i]) & 255 for i in range(stride))
            elif f == 3:
                cand = bytes((line[i] - (((line[i - 3] if i >= 3 else 0) + prev[i]) >> 1)) & 255 for i in range(stride))
            else:
                c = bytearray(stride)
                for i in range(stride):
                    a = line[i - 3] if i >= 3 else 0
                    b = prev[i]
                    cc = prev[i - 3] if i >= 3 else 0
                    pp = a + b - cc
                    pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - cc)
                    pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else cc)
                    c[i] = (line[i] - pr) & 255
                cand = bytes(c)
            score = sum(v if v < 128 else 256 - v for v in cand)
            if mejor is None or score < mejor[0]:
                mejor = (score, f, cand)
        cuerpo.append(mejor[1])
        cuerpo += mejor[2]
        prev = line

    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(cuerpo), 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)


def main():
    for arco, pal in PALETAS.items():
        px, puestas = generar(arco, pal)
        destino = os.path.join(DESTINO, arco + '.png')
        escribir_png(destino, ANCHO, ALTO, px)
        print(f'{arco:18} {puestas:2} decoraciones  ->  {os.path.relpath(destino, RAIZ)}')


if __name__ == '__main__':
    main()
