"""
Recorta los PERGAMINOS DE ENTRENAMIENTO de la tienda de
`src/assets/sprite-pergaminos-entrenamiento.png` (la hoja del artista trae los tres
juntos, de izquierda a derecha: ataque, defensa, velocidad) a un PNG por objeto en
`src/assets/items/<id>.png`.

Uso:  python scripts/generar-sprites-pergaminos.py      (necesita Pillow)

Hasta el 2026-10-14 este script DIBUJABA los pergaminos con formas geométricas,
porque no había arte; ahora recorta el de verdad y los nombres de los PNG (el `id`
del objeto en items.json) se mantienen.

- La hoja ya trae **fondo transparente**, así que no hace falta el relleno por
  inundación de `generar-sprites-objetos.py`: los tres dibujos se separan por las
  **columnas de alfa vacías** entre ellos.
- Cada uno sale en un lienzo **cuadrado** con el dibujo centrado y un margen, como el
  resto de `assets/items/`, y reducido a 116 px — el tamaño de los demás objetos, para
  que en la tienda y la mochila se vean a la misma escala.

**No editar a mano los PNG generados**: se pisan al volver a correr esto.
"""

import os

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
HOJA = os.path.join(RAIZ, 'src', 'assets', 'sprite-pergaminos-entrenamiento.png')
DESTINO = os.path.join(RAIZ, 'src', 'assets', 'items')

# En el orden en que aparecen en la hoja, de izquierda a derecha.
IDS = [
    'pergamino_entrenamiento_ataque',
    'pergamino_entrenamiento_defensa',
    'pergamino_entrenamiento_velocidad',
]

LADO_FINAL = 116      # el lienzo del resto de assets/items/
MARGEN = 0.04         # aire alrededor del dibujo, en fracción del lado del cuadrado
ALFA_MINIMO = 16      # por debajo de esto un píxel cuenta como vacío (restos de antialias)
HUECO_MINIMO = 8      # columnas vacías seguidas que separan dos dibujos


def tramos_de_columnas(alfa, ancho, alto):
    """Los rangos [x0, x1) de columnas con algo pintado, separados por huecos vacíos."""
    datos = alfa.load()
    llena = [any(datos[x, y] >= ALFA_MINIMO for y in range(alto)) for x in range(ancho)]
    tramos, inicio, vacias = [], None, 0
    for x, hay in enumerate(llena):
        if hay:
            if inicio is None:
                inicio = x
            vacias = 0
        elif inicio is not None:
            vacias += 1
            if vacias >= HUECO_MINIMO:
                tramos.append((inicio, x - vacias + 1))
                inicio, vacias = None, 0
    if inicio is not None:
        tramos.append((inicio, ancho))
    return tramos


def recortar(hoja, x0, x1):
    trozo = hoja.crop((x0, 0, x1, hoja.height))
    caja = trozo.getchannel('A').point(lambda a: 255 if a >= ALFA_MINIMO else 0).getbbox()
    dibujo = trozo.crop(caja)
    lado = round(max(dibujo.size) * (1 + 2 * MARGEN))
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(dibujo, ((lado - dibujo.width) // 2, (lado - dibujo.height) // 2), dibujo)
    # LANCZOS y no NEAREST: la hoja viene a ~6× de su tamaño final y NEAREST se
    # comería líneas sueltas del contorno al reducir tanto.
    return lienzo.resize((LADO_FINAL, LADO_FINAL), Image.Resampling.LANCZOS)


if __name__ == '__main__':
    hoja = Image.open(HOJA).convert('RGBA')
    tramos = tramos_de_columnas(hoja.getchannel('A'), hoja.width, hoja.height)
    if len(tramos) != len(IDS):
        raise SystemExit(f'Se esperaban {len(IDS)} dibujos en la hoja y salen {len(tramos)}: {tramos}')
    for ident, (x0, x1) in zip(IDS, tramos):
        ruta = os.path.join(DESTINO, f'{ident}.png')
        recortar(hoja, x0, x1).save(ruta)
        print('ok', ident, (x0, x1))
