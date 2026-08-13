"""
Genera los fondos de columna del mapa con la estructura de Pokelike:
tierra lisa en el centro (donde van los nodos) y la vegetación/arquitectura
del arco solo en el perímetro.

Entrada : src/assets/map-columns/originales/<arco>.png  (recortes del asset
          original del artista, paisaje completo con el camino por el medio)
Salida  : src/assets/map-columns/<arco>.png             (lo que importa MapScreen)

Uso:  python scripts/generar-columnas-mapa.py

Sin dependencias: lee y escribe PNG con zlib de la librería estándar, así que
funciona igual en Windows que en macOS. Es determinista (semilla fija), así que
volver a correrlo da exactamente el mismo resultado.

Por qué compuesto y no dibujado a mano: el asset original es un paisaje denso de
arriba abajo, y los nodos encima se perdían. Pokelike resuelve esto poniendo el
detalle en los bordes y dejando el centro plano. Ver documentacion/13.
"""

import os
import struct
import zlib

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
ORIGEN = os.path.join(RAIZ, 'src', 'assets', 'map-columns', 'originales')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'map-columns')

# El lienzo del mapa es ANCHO x (ALTO_POR_PISO * pisos) = 520 x 960 con los 8
# pisos que tienen hoy los tres arcos (ver MapScreen.jsx). Generar justo a esa
# medida evita que el `cover` recorte nada.
ANCHO, ALTO = 520, 960

# Ancho de la banda de vegetación a cada lado. Tope duro: el nodo más a la
# izquierda que puede generar el mapa está en x = 520/6 ≈ 87 y mide 48 px, así
# que su borde llega a x ≈ 63. Por encima de ~56 la vegetación se le metería debajo.
BORDE = 56
# Franja donde la vegetación se funde con la tierra, para que no quede un corte recto.
DIFUMINADO = 26

ARCOS = ['pais_de_las_olas', 'examen_chunin', 'invasion_de_pain']


def leer_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n', path
    pos, idat, w, h, ct = 8, b'', None, None, None
    while pos < len(d):
        ln, typ = struct.unpack('>I4s', d[pos:pos + 8])
        data = d[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, bd, ct, _, _, il = struct.unpack('>IIBBBBB', data)
            assert bd == 8 and il == 0, 'solo PNG 8 bits sin entrelazar'
        elif typ == b'IDAT':
            idat += data
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0: 1, 2: 3, 4: 2, 6: 4}[ct]
    stride = w * ch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if f == 1:
            for i in range(ch, stride):
                line[i] = (line[i] + line[i - ch]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b, c = prev[i], (prev[i - ch] if i >= ch else 0)
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, ch, bytes(out)


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


def color_tierra(w, h, ch, px):
    """
    Color del camino del arco: color más repetido de la banda central, pero solo
    entre los píxeles que "parecen suelo".

    La mediana a secas no vale: los tres originales son escenas nocturnas y la
    banda central lleva niebla, agua y copas de árbol, así que la mediana salía
    azulada en vez de tierra. El filtro se queda con píxeles poco saturados
    (`max-min` corto: gris o marrón, no verde ni azul) y de luminosidad media
    (ni las sombras negras ni las luces de las farolas). Lo que queda es camino.
    """
    cuentas = {}
    x0, x1 = int(w * 0.30), int(w * 0.70)
    for y in range(10, h - 10, 2):
        for x in range(x0, x1):
            i = (y * w + x) * ch
            r, g, b = px[i], px[i + 1], px[i + 2]
            if max(r, g, b) - min(r, g, b) > 40:
                continue
            lum = (r * 30 + g * 59 + b * 11) // 100
            if not 45 <= lum <= 180:
                continue
            clave = (r // 12 * 12, g // 12 * 12, b // 12 * 12)
            cuentas[clave] = cuentas.get(clave, 0) + 1
    if not cuentas:
        return (90, 80, 70)
    # +6 para caer en el centro del cubo de cuantización, no en su esquina baja.
    return tuple(c + 6 for c in max(cuentas, key=cuentas.get))


def ruido(x, y, semilla):
    """PRNG entero determinista, en bloques de 3 px para que se note a esta escala."""
    n = (x // 3) * 73856093 ^ (y // 3) * 19349663 ^ semilla * 83492791
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return (n >> 16) & 0xFF


def generar(arco, indice):
    w, h, ch, px = leer_png(os.path.join(ORIGEN, f'{arco}.png'))
    base = color_tierra(w, h, ch, px)
    salida = bytearray(ANCHO * ALTO * 3)

    # 1) Tierra lisa en todo el lienzo, con grano suave para que no sea un
    #    plano de color muerto (a 3 px por bloque se lee como textura, no como
    #    ruido de vídeo).
    for y in range(ALTO):
        for x in range(ANCHO):
            r = ruido(x, y, indice)
            delta = (r % 13) - 6
            if r > 246:            # pedruscos sueltos
                delta -= 14
            elif r < 8:            # brillos sueltos
                delta += 10
            i = (y * ANCHO + x) * 3
            for c in range(3):
                salida[i + c] = max(0, min(255, base[c] + delta))

    # 2) Vegetación del arco pegada a los dos bordes, tomada del original a
    #    tamaño real (sin escalar en X, que deformaría el pixel art) y sólo
    #    reescalada en Y para cuadrar 950 -> 960.
    for y in range(ALTO):
        sy = min(h - 1, y * h // ALTO)
        for k in range(BORDE):
            # k = distancia al borde; se funde con la tierra en los últimos px.
            peso = 1.0 if k < BORDE - DIFUMINADO else (BORDE - k) / DIFUMINADO
            for lado in (0, 1):
                sx = k if lado == 0 else w - 1 - k
                dx = k if lado == 0 else ANCHO - 1 - k
                si = (sy * w + sx) * ch
                di = (y * ANCHO + dx) * 3
                for c in range(3):
                    salida[di + c] = int(px[si + c] * peso + salida[di + c] * (1 - peso))

    escribir_png(os.path.join(DESTINO, f'{arco}.png'), ANCHO, ALTO, bytes(salida))
    print(f'{arco}: tierra rgb{base} -> {ANCHO}x{ALTO}')


if __name__ == '__main__':
    for i, arco in enumerate(ARCOS):
        generar(arco, i + 1)
