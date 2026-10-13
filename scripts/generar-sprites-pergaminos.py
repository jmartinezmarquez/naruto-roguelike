"""
Dibuja los PERGAMINOS DE ENTRENAMIENTO de la tienda en `src/assets/items/<id>.png`.

Uso:  python scripts/generar-sprites-pergaminos.py      (necesita Pillow)

**Este script DIBUJA, no recorta**, como `generar-sprites-medallas.py`: la hoja de
objetos del artista no trae estos tres. Es un pergamino cerrado con su banda de color
y un símbolo geométrico por stat (puño, escudo, ráfaga); el color es lo que los
distingue de un vistazo en la tienda. Si llega dibujo de verdad, este archivo se borra
y el nombre del PNG (el `id` del objeto) se mantiene. Está en "Pendiente de arte".

Se dibujan a 29×29 lógicos ampliados ×4 = 116 px, el lienzo del resto de
`assets/items/`, para que se pinten a la misma escala que los demás objetos.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.
"""

import os

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'items')

LADO = 29
ESCALA = 4
CONTORNO = (34, 28, 30, 255)
PAPEL = (226, 210, 170, 255)
PAPEL_SOMBRA = (190, 168, 124, 255)
MADERA = (120, 78, 44, 255)
MADERA_LUZ = (160, 110, 64, 255)

PERGAMINOS = {
    # id: (color de la banda, color oscuro de la banda, símbolo)
    'pergamino_entrenamiento_ataque': ((196, 58, 48, 255), (140, 36, 30, 255), 'puno'),
    'pergamino_entrenamiento_defensa': ((58, 104, 178, 255), (36, 68, 128, 255), 'escudo'),
    'pergamino_entrenamiento_velocidad': ((70, 156, 84, 255), (42, 106, 54, 255), 'rafaga'),
}

SIMBOLOS = {
    # 5×5, '#' = trazo. Sencillos a propósito: a 116 px tienen que leerse.
    'puno': ['.###.', '#####', '#####', '.###.', '.#.#.'],
    'escudo': ['#####', '#####', '#####', '.###.', '..#..'],
    'rafaga': ['#....', '.##..', '..###', '.##..', '#....'],
}


def dibujar(banda, banda_oscura, simbolo):
    px = [[None] * LADO for _ in range(LADO)]

    def pintar(x0, y0, x1, y1, color):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if 0 <= x < LADO and 0 <= y < LADO:
                    px[y][x] = color

    # Cuerpo de papel enrollado, en diagonal suave no: recto y centrado, que es lo que
    # mejor se lee a este tamaño.
    pintar(5, 8, 23, 20, PAPEL)
    pintar(5, 18, 23, 20, PAPEL_SOMBRA)
    # Rodillos de madera a los lados, sobresaliendo.
    for x0 in (2, 24):
        pintar(x0, 6, x0 + 2, 22, MADERA)
        pintar(x0, 6, x0 + 2, 7, MADERA_LUZ)
    # Banda de color con el símbolo encima.
    pintar(11, 8, 17, 20, banda)
    pintar(11, 18, 17, 20, banda_oscura)
    for dy, fila in enumerate(SIMBOLOS[simbolo]):
        for dx, c in enumerate(fila):
            if c == '#':
                px[10 + dy][12 + dx] = PAPEL

    # Contorno de 1 px por fuera de todo lo pintado.
    dentro = lambda x, y: 0 <= x < LADO and 0 <= y < LADO and px[y][x] is not None
    borde = [
        (x, y) for y in range(LADO) for x in range(LADO)
        if px[y][x] is None and any(dentro(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    ]
    for x, y in borde:
        px[y][x] = CONTORNO

    im = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    for y in range(LADO):
        for x in range(LADO):
            if px[y][x]:
                im.putpixel((x, y), px[y][x])
    return im.resize((LADO * ESCALA, LADO * ESCALA), Image.NEAREST)


if __name__ == '__main__':
    for ident, (banda, oscura, simbolo) in PERGAMINOS.items():
        ruta = os.path.join(DESTINO, f'{ident}.png')
        dibujar(banda, oscura, simbolo).save(ruta)
        print('ok', ruta)
