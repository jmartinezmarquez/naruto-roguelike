"""
Dibuja los sprites de EFECTO del combate en `src/assets/effects/`: tiras horizontales
de fotogramas que la pantalla de combate reproduce con `steps()`.

Uso:  python scripts/generar-sprites-efectos.py      (necesita Pillow)

**Este script DIBUJA, no recorta**, como hacía `generar-sprite-cascabeles.py` (borrado al llegar su arte): ninguna de
las hojas del artista trae efectos. Y aquí no es un placeholder — los efectos son
formas geométricas (nubes de círculos, arcos, estrellas, explosiones), justo lo que
un script dibuja tan bien como una mano. Lo que NO se dibuja así son personajes.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.

Reglas de estilo, sacadas de los sprites de personaje para que casen con ellos:
  - **1 píxel de dibujo = 1 píxel de pantalla**, sin ampliar: los personajes se pintan
    a ×1 en su lienzo de 96 y un efecto con píxeles más gordos se vería de otro juego.
  - **Contorno oscuro de 1 píxel** alrededor de cada forma, como el de los ninjas.
  - **Paleta corta por efecto** (3-4 tonos planos) y sombreado por bandas, sin
    degradados ni antialias.
  - **Se desvanecen por tramado** (matriz de Bayer), no por transparencia: el pixel
    art no tiene alfa parcial, se deshace a píxeles sueltos.

Tiras que salen (fotogramas cuadrados, de izquierda a derecha):
  humo.png                 — el "poof" del shunshin, para el relevo.
  corte.png                — tajo blanco, para el golpe básico.
  estrella.png             — estallido de impacto, para el golpe muy eficaz.
  estrella-metal.png       — el mismo en frío, para el golpe bloqueado.
  explosion-<tipo>.png     — una por naturaleza de chakra, para el impacto de jutsu.

El tamaño y número de fotogramas de cada tira van también en
`src/components/Combat/spritesDeEfecto.js`: si se cambian aquí, cambiarlos allí.
"""

import math
import os

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
DESTINO = os.path.join(os.path.dirname(AQUI), 'src', 'assets', 'effects')

# Matriz de Bayer 4×4, normalizada a 0..1: el umbral de cada píxel para el tramado.
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def umbral(x, y):
    return (BAYER[y % 4][x % 4] + 0.5) / 16


def nueva_mascara(lado):
    return [[0] * lado for _ in range(lado)]


def pintar_tira(fotogramas, lado, nombre):
    """`fotogramas` = lista de matrices lado×lado de colores RGBA (o None)."""
    tira = Image.new('RGBA', (lado * len(fotogramas), lado), (0, 0, 0, 0))
    px = tira.load()
    for i, fotograma in enumerate(fotogramas):
        for y in range(lado):
            for x in range(lado):
                color = fotograma[y][x]
                if color:
                    px[i * lado + x, y] = color
    tira.save(os.path.join(DESTINO, f'{nombre}.png'))


def con_contorno(capas, lado, contorno, disolver=0.0):
    """
    `capas` = matriz de índices de tono (0 = vacío, 1..n = de más oscuro a más claro)
    → matriz de colores, con el contorno pintado alrededor de la forma y el tramado de
    `disolver` (0 nada, 1 todo) deshaciéndolo todo a píxeles sueltos.

    ⚠️ El contorno se calcula sobre la forma ENTERA y antes del tramado, y en una
    pasada aparte. La primera versión lo pintaba sobre la misma matriz que recorría,
    así que cada píxel de contorno nuevo contaba como forma para el siguiente y el
    contorno se comía el fondo entero; y calculado después del tramado, perfilaba
    cada agujero del tramado por dentro.
    """
    paleta = contorno['paleta']
    dentro = lambda x, y: 0 <= x < lado and 0 <= y < lado and capas[y][x]
    salida = [[None] * lado for _ in range(lado)]
    for y in range(lado):
        for x in range(lado):
            if capas[y][x]:
                color = paleta[capas[y][x] - 1]
            elif contorno.get('color') and any(dentro(vx, vy) for vx, vy in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))):
                color = contorno['color']
            else:
                continue
            if disolver and umbral(x, y) < disolver:
                continue
            salida[y][x] = color
    return salida


# --- Humo: el "poof" ----------------------------------------------------------
#
# Una nube de bolas que se abre desde el centro, se hincha y se deshace. Cada bola
# lleva su sombra abajo a la derecha (la luz viene de arriba a la izquierda, como en
# los personajes) y un brillo arriba.

def humo():
    lado = 80
    c = lado / 2
    # (ángulo, distancia final, radio final) de cada bola. A mano y no al azar: la
    # silueta del poof tiene que leerse como nube, y el azar da manchas.
    bolas = [(0, 0, 15), (30, 19, 11), (95, 18, 12), (160, 20, 11), (215, 19, 12),
             (270, 17, 11), (330, 20, 10), (60, 25, 7), (190, 26, 7), (300, 26, 6)]
    progreso = [0.25, 0.55, 0.85, 1.0, 1.08, 1.14]
    disolver = [0, 0, 0, 0.18, 0.5, 0.82]
    paleta = {'paleta': [(150, 148, 165, 255), (205, 205, 218, 255), (240, 240, 246, 255), (255, 255, 255, 255)],
              'color': (54, 50, 64, 255)}
    fotogramas = []
    for p, d in zip(progreso, disolver):
        capas = nueva_mascara(lado)
        centros = []
        for ang, dist, radio in bolas:
            bx = c + math.cos(math.radians(ang)) * dist * p
            by = c + math.sin(math.radians(ang)) * dist * p * 0.85 - 4 * p
            centros.append((bx, by, radio * min(1.0, p * 1.2)))
        for y in range(lado):
            for x in range(lado):
                # Cada píxel se sombrea con la bola en la que está MÁS adentro: así cada
                # bola se ve redonda por separado. Con "la más clara gana" salían facetas.
                mejor = None
                for bx, by, r in centros:
                    dx, dy = x + 0.5 - bx, y + 0.5 - by
                    rel = math.hypot(dx, dy) / r
                    if rel <= 1 and (mejor is None or rel < mejor[0]):
                        mejor = (rel, dx / r, dy / r)
                if mejor is None:
                    continue
                rel, nx, ny = mejor
                luz = -nx - ny
                if rel > 0.88 and luz < 0.3:
                    tono = 1  # el borde en sombra separa una bola de la de al lado
                else:
                    tono = 4 if luz > 0.55 else 3 if luz > -0.1 else 2
                capas[y][x] = tono
        fotogramas.append(con_contorno(capas, lado, paleta, d))
    pintar_tira(fotogramas, lado, 'humo')


# --- Corte ----------------------------------------------------------------------
#
# Un arco en diagonal que se traza (fotogramas 1-2), queda entero y se deshace. Grueso
# en el centro y afilado en las puntas, que es lo que lo hace leerse como tajo.

def corte():
    lado = 64
    c = lado / 2
    radio = 22
    inicio, fin = 200, 340  # grados: arco de abajo-izquierda a arriba-derecha
    trazado = [0.45, 1.0, 1.0, 1.0]
    disolver = [0, 0, 0.35, 0.75]
    paleta = {'paleta': [(110, 170, 230, 255), (190, 225, 255, 255), (255, 255, 255, 255)],
              'color': (40, 60, 100, 255)}
    fotogramas = []
    for t, d in zip(trazado, disolver):
        capas = nueva_mascara(lado)
        hasta = inicio + (fin - inicio) * t
        for y in range(lado):
            for x in range(lado):
                # El arco se inclina 35° para que vaya en diagonal.
                rx, ry = x + 0.5 - c, y + 0.5 - c
                a = math.radians(35)
                ux, uy = rx * math.cos(a) - ry * math.sin(a), rx * math.sin(a) + ry * math.cos(a)
                ang = math.degrees(math.atan2(uy, ux)) % 360
                if not (inicio <= ang <= hasta):
                    continue
                avance = (ang - inicio) / (fin - inicio)
                grosor = 1 + 7 * math.sin(math.pi * avance)
                dist = math.hypot(ux, uy)
                hueco = dist - radio
                if 0 <= hueco <= grosor:
                    centro = 1 - abs(hueco - grosor / 2) / (grosor / 2 + 0.01)
                    capas[y][x] = 3 if centro > 0.45 else 2 if centro > 0.1 else 1
        fotogramas.append(con_contorno(capas, lado, paleta, d))
    pintar_tira(fotogramas, lado, 'corte')


# --- Estrella de impacto ----------------------------------------------------------
#
# El "¡pam!" de cómic: estrella de puntas irregulares que estalla, se queda un
# fotograma y se encoge deshaciéndose.

def estrella(nombre, paleta):
    lado = 64
    c = lado / 2
    puntas = 9
    escala = [0.45, 1.0, 0.92, 0.75]
    disolver = [0, 0, 0.3, 0.7]
    fotogramas = []
    for s, d in zip(escala, disolver):
        capas = nueva_mascara(lado)
        for y in range(lado):
            for x in range(lado):
                dx, dy = x + 0.5 - c, y + 0.5 - c
                ang = math.atan2(dy, dx)
                # Radio en estrella: alterna largo y corto, con puntas de largo dispar.
                fase = (ang * puntas / (2 * math.pi)) % 1
                pico = 1 - abs(fase - 0.5) * 2
                largo = 0.75 + 0.25 * math.sin(ang * 3 + 1.3)
                r = (9 + 18 * pico ** 2.2 * largo) * s
                dist = math.hypot(dx, dy)
                if dist <= r:
                    rel = dist / (r + 0.01)
                    capas[y][x] = 3 if rel < 0.42 else 2 if rel < 0.75 else 1
        fotogramas.append(con_contorno(capas, lado, paleta, d))
    pintar_tira(fotogramas, lado, nombre)


# --- Explosión de chakra ------------------------------------------------------------
#
# Bola que estalla con borde dentado (el radio ondula con el ángulo), se abre en anillo
# de humo del color de la naturaleza y se deshace. Una tira por tipo: el color es la
# única pista de que el elemento importa en ese golpe.

PALETAS_EXPLOSION = {
    # oscuro → claro; el último es el núcleo casi blanco.
    'katon': [(120, 35, 20, 255), (217, 83, 43, 255), (250, 170, 50, 255), (255, 245, 200, 255)],
    'fuuton': [(35, 75, 60, 255), (94, 156, 132, 255), (170, 225, 195, 255), (240, 255, 248, 255)],
    'raiton': [(100, 78, 20, 255), (217, 178, 60, 255), (255, 232, 120, 255), (255, 255, 235, 255)],
    'doton': [(65, 45, 28, 255), (140, 107, 71, 255), (200, 165, 115, 255), (245, 230, 200, 255)],
    'suiton': [(22, 52, 75, 255), (61, 122, 158, 255), (140, 200, 235, 255), (235, 250, 255, 255)],
}


def explosion(tipo, colores):
    lado = 96
    c = lado / 2
    radios = [10, 22, 32, 38, 41, 43]
    # A partir del tercer fotograma el centro se vacía: deja de ser bola y es anillo.
    huecos = [0, 0, 0.35, 0.6, 0.75, 0.85]
    disolver = [0, 0, 0, 0.25, 0.55, 0.85]
    paleta = {'paleta': colores, 'color': tuple(max(0, v - 45) if i < 3 else 255 for i, v in enumerate(colores[0]))}
    fotogramas = []
    for i, (r, h, d) in enumerate(zip(radios, huecos, disolver)):
        capas = nueva_mascara(lado)
        for y in range(lado):
            for x in range(lado):
                dx, dy = x + 0.5 - c, y + 0.5 - c
                ang = math.atan2(dy, dx)
                borde = r * (1 + 0.13 * math.sin(ang * 7 + i) + 0.07 * math.sin(ang * 13 + 2 * i))
                dist = math.hypot(dx, dy)
                if dist > borde or dist < borde * h:
                    continue
                rel = dist / (borde + 0.01)
                # Al principio el núcleo es blanco; luego se va enfriando hacia el color.
                caliente = max(0.0, 1 - i * 0.28)
                if rel < 0.35 * caliente + 0.05:
                    tono = 4
                elif rel < 0.62:
                    tono = 3
                elif rel < 0.85:
                    tono = 2
                else:
                    tono = 1
                capas[y][x] = tono
        fotogramas.append(con_contorno(capas, lado, paleta, d))
    pintar_tira(fotogramas, lado, f'explosion-{tipo}')


if __name__ == '__main__':
    # ⚠️ **Script retirado (2026-10-15).** Todo el arte que generaba está rehecho en el
    # estilo nuevo (documentacion/41) y lo recorta scripts/generar-sprites-estilo-nuevo.py.
    # Correr esto PISARÍA ese arte con el viejo, así que se para siempre. Ya no depende de
    # que existan las hojas nuevas: se pueden borrar de la carpeta sin que esto se
    # reactive. Se conserva como referencia de cómo se sacó el arte original.
    import sys as _sys
    _sys.exit('Script retirado: el arte que generaba está rehecho en el estilo nuevo '
              '(documentacion/41-arte-estilo-nuevo.md). Correrlo pisaría ese arte.')
    os.makedirs(DESTINO, exist_ok=True)
    humo()
    corte()
    estrella('estrella', {'paleta': [(230, 140, 40, 255), (255, 214, 90, 255), (255, 255, 235, 255)],
                          'color': (110, 50, 20, 255)})
    estrella('estrella-metal', {'paleta': [(90, 130, 190, 255), (175, 210, 250, 255), (255, 255, 255, 255)],
                                'color': (35, 50, 85, 255)})
    for tipo, colores in PALETAS_EXPLOSION.items():
        explosion(tipo, colores)
    print('Sprites de efecto generados en', DESTINO)
