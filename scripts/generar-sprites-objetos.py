"""
Recorta los sprites de objeto de `src/assets/sprite-objetos-iniciales.png`
(la hoja del artista trae los 10 juntos, con título y rareza) a un PNG por
objeto en `src/assets/items/<id>.png`, con fondo transparente.

Uso:  python scripts/generar-sprites-objetos.py

Sin dependencias (zlib de la librería estándar), así que corre igual en Windows.

Dos detalles que importan:

- El fondo se quita con **relleno por inundación desde el borde**, no con un
  umbral global de "casi negro": los sprites tienen contornos oscuros dentro
  (la botella, el pergamino) y un umbral global los habría agujereado.
- Cada sprite sale en un lienzo **cuadrado** con el dibujo centrado. Las cajas
  originales son de proporciones muy distintas (la banda es apaisada, el sello
  es alto), y sin cuadrarlas la lista de la mochila bailaba de fila en fila.
"""

import os
import struct
import zlib
from collections import deque

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'sprite-objetos-iniciales.png')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'items')

# Cajas medidas sobre la hoja original (1536×1024), en orden de lectura.
# El id es el de src/data/items.json.
RECORTES = {
    'pildora_soldado': (78, 139, 162, 202),
    'banda_repuesto': (349, 177, 226, 144),
    'sello_chakra': (649, 129, 177, 207),
    'pergamino_reserva': (908, 138, 221, 212),
    'semilla_sabio': (1265, 157, 157, 183),
    'fragmento_sello_maldito': (64, 547, 181, 196),
    'pergamino_viento': (336, 551, 216, 202),
    'kubikiribocho_fragmento': (633, 547, 182, 208),
    'calabaza_arena': (917, 547, 193, 201),
    'anillo_rinnegan_fragmento': (1238, 551, 216, 197),
}

MARGEN = 6        # aire alrededor del dibujo dentro del lienzo cuadrado
TOLERANCIA = 34   # cuánto puede alejarse del color de fondo y seguir siendo fondo


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
        mejor = None
        for f in range(5):
            if f == 0:
                cand = bytes(line)
            elif f == 1:
                cand = bytes((line[i] - (line[i - 4] if i >= 4 else 0)) & 255 for i in range(stride))
            elif f == 2:
                cand = bytes((line[i] - prev[i]) & 255 for i in range(stride))
            elif f == 3:
                cand = bytes((line[i] - (((line[i - 4] if i >= 4 else 0) + prev[i]) >> 1)) & 255 for i in range(stride))
            else:
                c = bytearray(stride)
                for i in range(stride):
                    a = line[i - 4] if i >= 4 else 0
                    b = prev[i]
                    cc = prev[i - 4] if i >= 4 else 0
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
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(cuerpo), 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)


def recortar(w, h, ch, px, caja, fondo):
    """Recorta la caja a un lienzo cuadrado RGBA y borra el fondo por inundación."""
    x0, y0, ancho, alto = caja
    lado = max(ancho, alto) + MARGEN * 2
    despX = (lado - ancho) // 2
    despY = (lado - alto) // 2

    salida = bytearray(lado * lado * 4)
    for y in range(alto):
        for x in range(ancho):
            i = ((y0 + y) * w + (x0 + x)) * ch
            o = (((y + despY) * lado) + (x + despX)) * 4
            salida[o] = px[i]
            salida[o + 1] = px[i + 1]
            salida[o + 2] = px[i + 2]
            salida[o + 3] = 255

    def es_fondo(o):
        return (abs(salida[o] - fondo[0]) < TOLERANCIA
                and abs(salida[o + 1] - fondo[1]) < TOLERANCIA
                and abs(salida[o + 2] - fondo[2]) < TOLERANCIA)

    # Inundación desde el borde: solo se borra el fondo conectado al exterior,
    # así los contornos oscuros de dentro del dibujo se quedan.
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
    nuevo = lado // 2
    out = bytearray(nuevo * nuevo * 4)
    for y in range(nuevo):
        for x in range(nuevo):
            acumulado = [0, 0, 0, 0]
            for dy in (0, 1):
                for dx in (0, 1):
                    i = ((2 * y + dy) * lado + (2 * x + dx)) * 4
                    a = px[i + 3]
                    for c in range(3):
                        acumulado[c] += px[i + c] * a
                    acumulado[3] += a
            o = (y * nuevo + x) * 4
            if acumulado[3] == 0:
                continue
            for c in range(3):
                out[o + c] = min(255, acumulado[c] // acumulado[3])
            out[o + 3] = (acumulado[3] + 2) // 4
    return nuevo, bytes(out)


if __name__ == '__main__':
    os.makedirs(DESTINO, exist_ok=True)
    w, h, ch, px = leer_png(HOJA)
    fondo = (px[0], px[1], px[2])
    for item_id, caja in RECORTES.items():
        lado, recorte = recortar(w, h, ch, px, caja, fondo)
        lado, recorte = mitad_rgba(lado, recorte)
        escribir_png_rgba(os.path.join(DESTINO, f'{item_id}.png'), lado, lado, recorte)
        print(f'{item_id}: {lado}x{lado}')
