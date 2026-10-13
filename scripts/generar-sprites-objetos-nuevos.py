"""
Sprites de los 8 objetos añadidos el 2026-10-14, en `src/assets/items/<id>.png`.

Uso:  python scripts/generar-sprites-objetos-nuevos.py      (necesita Pillow)

Recorta los ocho de dos fuentes:

1. **La hoja `src/assets/sprite-objetos-nuevos.png`**, con siete. Si no trae
   transparencia (la que llegó tenía el damero pintado), primero borra el fondo. Los
   dibujos se leen en orden de lectura —por filas y, dentro de cada fila, de izquierda a
   derecha—, separados por filas y columnas vacías, y se asignan a `IDS_EN_LA_HOJA`.
2. **Las imágenes sueltas de `SUELTOS`**, una por objeto y con transparencia de verdad:
   las pesas de Lee, que llegaron después.

Cada uno sale en un cuadrado con margen, reducido a 116 px como el resto de
`assets/items/` — el mismo método que `generar-sprites-pergaminos.py`. Hasta que llegó
el arte, este script dibujaba iconos provisionales; ya no hace falta y se quitó.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.
"""

import os

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'sprite-objetos-nuevos.png')
# Dibujos que llegaron sueltos, uno por imagen, después de la hoja.
SUELTOS = {
    'pesas_de_lee': os.path.join(RAIZ, 'src', 'assets', 'sprite-pesas-de-lee.png'),
}
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'items')

# Todos los objetos de esta tanda: cada uno sale de la hoja o de SUELTOS.
IDS = [
    'unguento_curativo',
    'kit_ninja_medico',
    'manual_jonin',
    'pesas_de_lee',
    'cuchillas_de_asuma',
    'chaleco_chunin',
    'bolsa_de_sellos_explosivos',
    'talisman_ocho_puertas',
]

# Qué hay en la hoja, en orden de lectura. La que llegó el 2026-10-14 trae 7 de los 8
# —las pesas de Lee llegaron después, sueltas (SUELTOS)— y en otro orden que el
# encargado, así que se asignan por lo que se ve en cada dibujo.
IDS_EN_LA_HOJA = [
    'cuchillas_de_asuma',          # dos kunai con cinta roja
    'chaleco_chunin',              # chaleco verde
    'bolsa_de_sellos_explosivos',  # bolsa con sellos 爆
    'talisman_ocho_puertas',       # talismán 八門 en llamas
    'unguento_curativo',           # tarro abierto
    'kit_ninja_medico',            # bolsa con la cruz roja
    'manual_jonin',                # libro verde
]

LADO_FINAL = 116
MARGEN = 0.04
ALFA_MINIMO = 16
# Entre el kunai y el chaleco hay muy poco aire: con 8 columnas los dos salían pegados.
HUECO_MINIMO = 3
# Lo que no llega a esto de ancho es una mota suelta (una brasa del talismán), no un dibujo.
ANCHO_MINIMO = 40



def tramos(lleno):
    """Rangos [a, b) de posiciones llenas separados por al menos HUECO_MINIMO vacías."""
    resultado, inicio, vacias = [], None, 0
    for i, hay in enumerate(lleno):
        if hay:
            if inicio is None:
                inicio = i
            vacias = 0
        elif inicio is not None:
            vacias += 1
            if vacias >= HUECO_MINIMO:
                resultado.append((inicio, i - vacias + 1))
                inicio, vacias = None, 0
    if inicio is not None:
        resultado.append((inicio, len(lleno)))
    return resultado


def cuadrar(dibujo):
    # El halo casi invisible que traen algunas hojas (alfa < ALFA_MINIMO) se pone a
    # cero: no se ve, pero dejaría una sombra sucia al reducir.
    dibujo = dibujo.copy()
    dibujo.putalpha(dibujo.getchannel('A').point(lambda a: a if a >= ALFA_MINIMO else 0))
    lado = round(max(dibujo.size) * (1 + 2 * MARGEN))
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(dibujo, ((lado - dibujo.width) // 2, (lado - dibujo.height) // 2), dibujo)
    return lienzo.resize((LADO_FINAL, LADO_FINAL), Image.Resampling.LANCZOS)


def quitar_fondo_pintado(hoja):
    """
    La hoja llegó en RGB con el damero gris PINTADO, no con transparencia (como las de
    chakra, ver generar-sprites-iconos.py). Se borra por **inundación desde el borde**
    sobre lo claro y sin color: el contorno negro de cada dibujo frena el relleno, así
    que los blancos de DENTRO —la venda del kit, la etiqueta del tarro— no se tocan,
    que es lo que haría un umbral global.
    """
    rgb = hoja.convert('RGB')
    ancho, alto = rgb.size
    px = rgb.load()

    def es_fondo(x, y):
        r, g, b = px[x, y]
        return min(r, g, b) >= 190 and max(r, g, b) - min(r, g, b) <= 18

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


def recortar_hoja():
    hoja = Image.open(HOJA)
    hoja = hoja.convert('RGBA') if 'A' in hoja.getbands() else quitar_fondo_pintado(hoja)
    alfa = hoja.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0)
    datos = alfa.load()
    filas = tramos([any(datos[x, y] for x in range(hoja.width)) for y in range(hoja.height)])
    trozos = []
    for y0, y1 in filas:
        alturas = [sum(1 for y in range(y0, y1) if datos[x, y]) for x in range(hoja.width)]
        for x0, x1 in tramos([h > 0 for h in alturas]):
            if x1 - x0 >= ANCHO_MINIMO:
                trozos.append((x0, x1, y0, y1, alturas))

    # ⚠️ **Dos dibujos que se tocan no se separan por huecos**: en la hoja del
    # 2026-10-14 la cinta del kunai roza el chaleco y salían como uno solo. Mientras
    # falten dibujos, el trozo más ancho se parte por su columna MÁS FINA de la zona
    # central — una cinta que roza no es un hueco, pero se mide igual de bien. Es lo
    # mismo que hace generar-sprites-proyectiles.py con el fuego que sale del puño.
    while len(trozos) < len(IDS_EN_LA_HOJA):
        i = max(range(len(trozos)), key=lambda k: trozos[k][1] - trozos[k][0])
        x0, x1, y0, y1, alturas = trozos[i]
        margen = (x1 - x0) // 5
        corte = min(range(x0 + margen, x1 - margen), key=lambda x: alturas[x])
        trozos[i:i + 1] = [(x0, corte, y0, y1, alturas), (corte, x1, y0, y1, alturas)]

    dibujos = []
    for x0, x1, y0, y1, _ in trozos:
            trozo = hoja.crop((x0, y0, x1, y1))
            dibujos.append(trozo.crop(trozo.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0).getbbox()))
    if len(dibujos) != len(IDS_EN_LA_HOJA):
        raise SystemExit(f'La hoja tiene {len(dibujos)} dibujos y IDS_EN_LA_HOJA dice {len(IDS_EN_LA_HOJA)}: {IDS_EN_LA_HOJA}')
    return dict(zip(IDS_EN_LA_HOJA, map(cuadrar, dibujos)))


def recortar_suelto(ruta):
    """Una imagen con un solo dibujo y transparencia de verdad: se recorta a su caja."""
    imagen = Image.open(ruta).convert('RGBA')
    caja = imagen.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0).getbbox()
    return cuadrar(imagen.crop(caja))


if __name__ == '__main__':
    sprites = recortar_hoja()
    for ident, ruta in SUELTOS.items():
        sprites[ident] = recortar_suelto(ruta)
    faltan = [i for i in IDS if i not in sprites]
    if faltan:
        raise SystemExit(f'Sin dibujo: {faltan}')
    for ident in IDS:
        sprites[ident].save(os.path.join(DESTINO, f'{ident}.png'))
        print('ok', ident)
