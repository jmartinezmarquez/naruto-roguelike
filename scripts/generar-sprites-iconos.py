# -*- coding: utf-8 -*-
"""Recorta los iconos de naturaleza de chakra y los del menú vertical.

Entrada: `src/assets/iconos-chakra.png` (5 en fila) y `src/assets/iconos-menu.png`
(4 en fila). Salida: `src/assets/chakra/<tipo>.png` y `src/assets/menu/<accion>.png`,
todos en el **lienzo común de 96×96** del resto del arte del proyecto.

⚠️ **Estas hojas llegaron en JPEG, y eso hace daño dos veces al pixel art**: no hay
canal alfa —el damero de la transparencia viene *pintado* en los píxeles— y la
compresión emborrona los bloques de color plano, que es justo lo que hace que el
pixel art se vea nítido. Medido: en una franja de fondo no hay **dos píxeles
contiguos iguales**, y aparecen manchas sueltas en zonas que deberían estar vacías.

Este script lo deshace, y la clave es el paso 2:

1. **Encuentra cada icono** por columnas con tinta, descartando las manchas: se queda
   con los grupos anchos y tira los de dos o tres columnas, que son basura del JPEG.
2. ⚠️ **Vuelve a muestrear sobre la rejilla lógica**: la hoja está ampliada ~8,7×
   (una escala NO entera, de ahí que unos bloques midan 9 px y otros 10), así que se
   estima el paso real y se toma **un píxel del centro de cada celda**. Eso reconstruye
   los colores planos de golpe: si el bloque original era de un color y el JPEG lo dejó
   en veinte tonos parecidos, el del centro es el bueno. Es lo que convierte una hoja
   estropeada en pixel art limpio, y no un filtro de suavizado.
3. **Borra el fondo por inundación desde el borde**, no por color global: el fuego y
   el agua tienen el centro casi blanco, y un reemplazo global se los comería.
4. **Centra en un lienzo cuadrado** y amplía a 96×96 por múltiplo entero.

Si algún día llegan las hojas en PNG con transparencia de verdad, este mismo script
sirve: el paso 3 no encontrará fondo que borrar y el 2 tendrá menos que arreglar.

Uso:  python scripts/generar-sprites-iconos.py
"""

import importlib.util
import os
import sys
from collections import Counter, deque

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(RAIZ, 'src', 'assets')

# El orden es el de la hoja, de izquierda a derecha. Si el artista reordena la hoja,
# esto es lo único que hay que tocar.
# ⚠️ **`lado` es la resolución LÓGICA del dibujo, y cada hoja tiene la suya.** Al
# principio las dos usaban 32 y los del menú salían toscos: están dibujados con mucho
# más detalle (el torii mide 51×62 celdas), así que meterlos a la fuerza en 32×32
# tiraba la mitad de la información — se veían peor que la hoja de la que salen, que
# es la señal de que el recorte está mal hecho. La regla: **el lienzo se elige por lo
# que mide el dibujo, no al revés**, y por eso el script avisa si algo no cabe.
HOJAS = [
    {
        'fichero': 'iconos-chakra.png',
        'destino': 'chakra',
        'ids': ['katon', 'suiton', 'doton', 'raiton', 'fuuton'],
        'lado': 32,
        'escala': 3,   # 32 × 3 = 96, el lienzo común del proyecto
    },
    {
        'fichero': 'iconos-menu.png',
        'destino': 'menu',
        # Mismo orden que `ENTRADAS` en el menú vertical de `MapScreen.jsx`.
        'ids': ['logros', 'enciclopedia', 'ajustes', 'reiniciar'],
        'lado': 64,
        'escala': 2,   # 64 × 2 = 128
    },
]

FONDO_MINIMO = 238   # a partir de aquí se considera fondo (el damero es casi blanco)
TOLERANCIA_FONDO = 26


def _png():
    """El lector/escritor de PNG del proyecto, que vive en el script de objetos."""
    ruta = os.path.join(RAIZ, 'scripts', 'generar-sprites-objetos.py')
    spec = importlib.util.spec_from_file_location('sprites_objetos', ruta)
    modulo = importlib.util.module_from_spec(spec)
    sys.modules['sprites_objetos'] = modulo
    try:
        spec.loader.exec_module(modulo)
    except SystemExit:
        pass
    return modulo


def es_fondo(color):
    return all(v >= FONDO_MINIMO for v in color)


def distancia(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def columnas_de_iconos(leer, ancho, alto):
    """Grupos de columnas con tinta, descartando la basura del JPEG.

    ⚠️ El descarte por ANCHO no es un adorno: sin él, tres manchas de compresión de
    una sola columna se cuelan como "iconos" y el reparto de la hoja sale mal.
    """
    conTinta = [x for x in range(ancho) if any(not es_fondo(leer(x, y)) for y in range(0, alto, 2))]
    grupos, inicio, anterior = [], conTinta[0], conTinta[0]
    for x in conTinta[1:]:
        if x - anterior > 12:
            grupos.append((inicio, anterior))
            inicio = x
        anterior = x
    grupos.append((inicio, anterior))
    return [g for g in grupos if g[1] - g[0] >= 20]


def paso_logico(leer, x0, x1, y0, y1):
    """Cuánto mide un píxel del dibujo original, en píxeles de la hoja."""
    saltos = Counter()
    for y in range(y0, y1, max(1, (y1 - y0) // 40)):
        anterior = None
        for x in range(x0, x1 + 1):
            color = leer(x, y)
            if anterior is not None and distancia(color, anterior) > 24:
                saltos[x] += 1
            anterior = color
    bordes = sorted(k for k, v in saltos.items() if v >= 3)
    difs = Counter(b - a for a, b in zip(bordes, bordes[1:]) if 3 < b - a < 40)
    return difs.most_common(1)[0][0] if difs else 8


def recortar_icono(leer, caja, paso, lado_logico):
    """Muestrea el icono sobre su rejilla lógica y le quita el fondo."""
    x0, y0, x1, y1 = caja
    ancho = max(1, round((x1 - x0 + 1) / paso))
    alto = max(1, round((y1 - y0 + 1) / paso))

    # ⚠️ **Cada icono se lleva al mismo tamaño en el lienzo, no al suyo propio.**
    # El artista los dibuja a escalas distintas —el engranaje del menú mide 32×33
    # celdas y el torii 51×62—, y respetar eso deja el engranaje a la mitad de alto
    # que sus vecinos en una columna donde los cuatro son hermanos. Se estira el lado
    # mayor hasta el lienzo (con un margen) y el otro va en proporción, así que
    # ninguno se recorta ni se aplasta.
    #
    # Se puede AMPLIAR sin perder nada porque el muestreo sale de la hoja original, que
    # tiene mucha más resolución que cualquiera de estas rejillas: pedir más celdas no
    # inventa detalle, lo saca de donde ya estaba.
    hueco = lado_logico - 4
    factor = hueco / max(ancho, alto)
    ancho = max(1, round(ancho * factor))
    alto = max(1, round(alto * factor))

    pasoX = (x1 - x0 + 1) / ancho
    pasoY = (y1 - y0 + 1) / alto

    # Un píxel del CENTRO de cada celda: reconstruye el color plano que el JPEG rompió.
    celdas = [
        [leer(min(x1, int(x0 + (cx + 0.5) * pasoX)), min(y1, int(y0 + (cy + 0.5) * pasoY))) + (255,)
         for cx in range(ancho)]
        for cy in range(alto)
    ]

    # Inundación desde el borde, con un marco de una celda para que siempre haya
    # por dónde entrar aunque el dibujo toque el borde de su caja.
    W, H = ancho + 2, alto + 2
    lienzo = [[(255, 255, 255, 0)] * W for _ in range(H)]
    for cy in range(alto):
        for cx in range(ancho):
            lienzo[cy + 1][cx + 1] = celdas[cy][cx]

    cola, vistos = deque([(0, 0)]), set()
    while cola:
        x, y = cola.popleft()
        if not (0 <= x < W and 0 <= y < H) or (x, y) in vistos:
            continue
        r, g, b, _ = lienzo[y][x]
        if min(r, g, b) < 255 - TOLERANCIA_FONDO:
            continue
        vistos.add((x, y))
        lienzo[y][x] = (0, 0, 0, 0)
        cola.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return W, H, lienzo


def centrar(ancho, alto, lienzo, lado_logico):
    """Al lienzo lógico cuadrado, centrado. Recorta si algo se pasa de tamaño."""
    salida = [[(0, 0, 0, 0)] * lado_logico for _ in range(lado_logico)]
    despX = (lado_logico - ancho) // 2
    despY = (lado_logico - alto) // 2
    for y in range(alto):
        for x in range(ancho):
            dy, dx = y + despY, x + despX
            if 0 <= dx < lado_logico and 0 <= dy < lado_logico:
                salida[dy][dx] = lienzo[y][x]
    return salida


def main():
    png = _png()
    for hoja in HOJAS:
        ruta = os.path.join(ASSETS, hoja['fichero'])
        ancho, alto, canales, pixeles = png.leer_png(ruta)

        def leer(x, y, _a=ancho, _c=canales, _p=pixeles):
            i = (y * _a + x) * _c
            return (_p[i], _p[i + 1], _p[i + 2])

        grupos = columnas_de_iconos(leer, ancho, alto)
        assert len(grupos) == len(hoja['ids']), \
            f"{hoja['fichero']}: encontrados {len(grupos)} iconos y esperaba {len(hoja['ids'])}"

        carpeta = os.path.join(ASSETS, hoja['destino'])
        os.makedirs(carpeta, exist_ok=True)

        for (x0, x1), nombre in zip(grupos, hoja['ids']):
            filas = [y for y in range(alto) if any(not es_fondo(leer(x, y)) for x in range(x0, x1 + 1))]
            # Solo el tramo CONTINUO más alto: las manchas sueltas del JPEG estiran la
            # caja hacia abajo y el icono acababa pegado al techo de su lienzo.
            tramos, ini, ant = [], filas[0], filas[0]
            for y in filas[1:]:
                if y - ant > 12:
                    tramos.append((ini, ant))
                    ini = y
                ant = y
            tramos.append((ini, ant))
            y0, y1 = max(tramos, key=lambda t: t[1] - t[0])

            paso = paso_logico(leer, x0, x1, y0, y1)
            lado = hoja['lado']
            w, h, lienzo = recortar_icono(leer, (x0, y0, x1, y1), paso, lado)
            if max(w, h) > lado:
                print(f'  ⚠️  {nombre}: la rejilla ({w}x{h}) no cabe en {lado}; sube `lado` de esa hoja')
            cuadrado = centrar(w, h, lienzo, lado)

            escala = hoja['escala']
            datos = bytearray()
            for fila in cuadrado:
                linea = bytearray()
                for celda in fila:
                    linea += bytes(celda) * escala
                datos += linea * escala

            destino = os.path.join(carpeta, f'{nombre}.png')
            png.escribir_png_rgba(destino, lado * escala, lado * escala, bytes(datos))
            print(f'  {hoja["destino"]}/{nombre}.png  (rejilla {w}x{h}, paso {paso}px)')


if __name__ == '__main__':
    main()
