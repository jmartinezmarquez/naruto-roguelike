"""
Recorta los tres pergaminos de reclutamiento de `src/assets/sprite-nodos-mapa.png`
(común verde, raro azul, legendario dorado) a `src/assets/nodes/reclutar-<rareza>.png`.

Uso:  python scripts/generar-sprites-nodo-reclutar.py

Sin dependencias (zlib de la librería estándar), igual que el resto de scripts
de sprites, para que corra en Windows sin instalar nada.

Dos decisiones que conviene no volver a discutir:

- **El resplandor entra en el recorte.** Es lo único que distingue las tres
  rarezas de un vistazo a 48 px, que es el tamaño al que se pintan en el mapa:
  las volutas verdes, azules o de fuego se leen antes que el color de la varilla.
- **Los tres salen en el MISMO lienzo cuadrado** (`LADO_RECORTE`), centrado en el
  pergamino, en vez de recortar cada uno a su caja justa. Las cajas justas no
  miden lo mismo —el fuego del legendario ocupa más que las volutas del común— y
  al pintarlos todos a 48 px el pergamino dorado habría salido más pequeño que
  los otros dos sin ninguna razón de diseño.

Las tres posiciones se miden solas sobre la hoja: se busca en la banda de los
pergaminos qué columnas no son fondo y se parten en tres rachas. Si algún día
llega una hoja nueva con los pergaminos en otro sitio, esto sigue funcionando
mientras sigan estando en fila y separados por fondo.
"""

import os
import struct
import zlib
from collections import deque

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'sprite-nodos-mapa.png')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'nodes')

# Banda vertical donde viven los tres pergaminos dentro de la hoja. Por encima
# están sus rótulos (COMÚN / RARO / LEGENDARIO), que no queremos recortar.
BANDA_Y = (280, 560)
LADO_RECORTE = 256   # lienzo común, en píxeles de la hoja original
CENTRO_Y = 404       # centro vertical del pergamino dentro de la banda
TOLERANCIA_FONDO = 26

# En orden de lectura, de izquierda a derecha en la hoja.
RAREZAS = ['comun', 'raro', 'legendario']


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


def escribir_png_rgba(path, w, h, px):
    stride = w * 4
    cuerpo = bytearray()
    prev = bytes(stride)
    for y in range(h):
        line = px[y * stride:(y + 1) * stride]
        cuerpo.append(2)  # filtro Up: suficiente y mucho más rápido que probar los cinco
        cuerpo += bytes((line[i] - prev[i]) & 255 for i in range(stride))
        prev = line

    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(cuerpo), 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)


def localizar_pergaminos(w, ch, px, fondo):
    """Centros en X de los tres pergaminos, midiéndolos sobre la propia hoja."""
    def es_fondo(x, y):
        o = (y * w + x) * ch
        return (abs(px[o] - fondo[0]) < TOLERANCIA_FONDO
                and abs(px[o + 1] - fondo[1]) < TOLERANCIA_FONDO
                and abs(px[o + 2] - fondo[2]) < TOLERANCIA_FONDO)

    y0, y1 = BANDA_Y
    rachas = []
    inicio = None
    for x in range(w):
        ocupada = sum(1 for y in range(y0, y1) if not es_fondo(x, y)) > 2
        if ocupada and inicio is None:
            inicio = x
        elif not ocupada and inicio is not None:
            rachas.append((inicio, x - 1))
            inicio = None
    if inicio is not None:
        rachas.append((inicio, w - 1))

    # El rótulo "RECLUTAR" de la izquierda también cae en la banda; los
    # pergaminos son las tres rachas más anchas, y van en orden de lectura.
    anchas = sorted(rachas, key=lambda r: r[1] - r[0], reverse=True)[:3]
    anchas.sort()
    assert len(anchas) == 3, f'esperaba 3 pergaminos, encontré {len(anchas)}'
    return [(a + b) // 2 for a, b in anchas]


def recortar(w, h, ch, px, centro_x, fondo):
    """Recorta el lienzo cuadrado alrededor del pergamino y borra el fondo."""
    lado = LADO_RECORTE
    x0 = centro_x - lado // 2
    y0 = CENTRO_Y - lado // 2

    salida = bytearray(lado * lado * 4)
    for y in range(lado):
        for x in range(lado):
            sx, sy = x0 + x, y0 + y
            o = ((y * lado) + x) * 4
            if not (0 <= sx < w and 0 <= sy < h):
                continue
            i = (sy * w + sx) * ch
            salida[o] = px[i]
            salida[o + 1] = px[i + 1]
            salida[o + 2] = px[i + 2]
            salida[o + 3] = 255

    def es_fondo(o):
        return (abs(salida[o] - fondo[0]) < TOLERANCIA_FONDO
                and abs(salida[o + 1] - fondo[1]) < TOLERANCIA_FONDO
                and abs(salida[o + 2] - fondo[2]) < TOLERANCIA_FONDO)

    # Inundación desde el borde: solo desaparece el fondo conectado al exterior,
    # así los negros del dibujo (el contorno del ninja, la sombra del sello) se
    # quedan donde están.
    vistos = bytearray(lado * lado)
    cola = deque()
    for x in range(lado):
        cola.append((x, 0))
        cola.append((x, lado - 1))
    for y in range(lado):
        cola.append((0, y))
        cola.append((lado - 1, y))
    while cola:
        x, y = cola.popleft()
        if not (0 <= x < lado and 0 <= y < lado):
            continue
        idx = y * lado + x
        if vistos[idx]:
            continue
        o = idx * 4
        if salida[o + 3] == 0:
            vistos[idx] = 1
        elif es_fondo(o):
            vistos[idx] = 1
            salida[o + 3] = 0
        else:
            continue
        cola.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return lado, bytes(salida)


def mitad_rgba(lado, px):
    """Media resolución: se pintan a 48 px, no hace falta arrastrar 280."""
    nuevo = lado // 2
    out = bytearray(nuevo * nuevo * 4)
    for y in range(nuevo):
        for x in range(nuevo):
            acumulado = [0, 0, 0, 0]
            for dy in (0, 1):
                for dx in (0, 1):
                    i = ((2 * y + dy) * lado + (2 * x + dx)) * 4
                    for c in range(4):
                        acumulado[c] += px[i + c]
            o = (y * nuevo + x) * 4
            for c in range(4):
                out[o + c] = acumulado[c] // 4
    return nuevo, bytes(out)


def main():
    w, h, ch, px = leer_png(HOJA)
    fondo = (px[0], px[1], px[2])
    os.makedirs(DESTINO, exist_ok=True)

    centros = localizar_pergaminos(w, ch, px, fondo)
    for rareza, centro_x in zip(RAREZAS, centros):
        lado, recorte = recortar(w, h, ch, px, centro_x, fondo)
        lado, recorte = mitad_rgba(lado, recorte)
        destino = os.path.join(DESTINO, f'reclutar-{rareza}.png')
        escribir_png_rgba(destino, lado, lado, recorte)
        print(f'{rareza:11s} centro x={centro_x:4d} -> {os.path.basename(destino)} ({lado}x{lado})')


if __name__ == '__main__':
    main()
