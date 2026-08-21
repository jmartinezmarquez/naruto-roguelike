# Ilustración de cada campaña

Una imagen por campaña, con **el `id` de la campaña como nombre de fichero** — la misma convención que
`assets/music/` y `assets/map-columns/`:

| Fichero | Campaña |
|---|---|
| `camino_ninja.png` (o `.jpg`) | The Ninja Road — los tres arcos del MVP |

Es la miniatura de la tarjeta del Home, al estilo del mapa de región de Pokelike. Se pinta con `cover`
en una caja apaisada, así que lo importante tiene que estar **en el centro**: los bordes se recortan
según el ancho de la ventana. Y encima va el nombre de la campaña en la fuente de Naruto, así que
conviene que la mitad inferior izquierda no sea lo más detallado del dibujo.

⚠️ **La carpeta puede estar vacía y el juego funciona igual**: la tarjeta cae a un fondo liso con el
nombre. Lo permite `import.meta.glob` — con un `import` normal, un fichero que falta **rompe el build**.
Es la misma decisión que con la música, y por el mismo motivo: que se pueda montar el sistema antes de
tener el arte.

**JPEG vale aquí** (es una ilustración grande, no pixel art con transparencia) y además pesa mucho
menos. Los fondos de pantalla del juego están en JPEG por lo mismo — ver
`documentacion/37-publicacion-web.md`.
