# Música de fondo

Una pista en bucle. **Esta carpeta puede estar vacía**: el juego funciona igual, en
silencio (`MusicaDeFondo.jsx` resuelve con `import.meta.glob` lo que haya).

## Ahora mismo (MVP): una sola canción

Deja tu pista aquí con este nombre y suena en todo el juego:

```
src/assets/music/principal.mp3
```

## Más adelante: una por campaña

El sistema ya lo soporta. El nombre del fichero **es el `id` del arco**, igual que en
`assets/map-columns/`. En cuanto exista, ese arco deja de usar el respaldo — no hay
que tocar código.

| Fichero | Cuándo suena |
|---|---|
| `principal.mp3` | **El respaldo**: todo aquello que no tenga pista propia |
| `pais_de_las_olas.mp3` | Arco 1 — País de las Olas |
| `examen_chunin.mp3` | Arco 2 — Examen Chunin |
| `invasion_de_pain.mp3` | Arco 3 — Invasión de Pain |
| `menu.mp3` | Selección de personaje, antes de que empiece la run |

Valen `.mp3`, `.ogg` y `.m4a`.

⚠️ Mientras dos pantallas compartan pista, la música **no se corta ni se reinicia** al
pasar de una a otra: sigue sonando por donde iba. El fundido de 600 ms solo aparece
cuando la pista cambia de verdad.

**Qué buscar**: lo-fi tranquilo y en bucle, sin final marcado — suena durante toda la
partida, así que lo que canse a la tercera vuelta canse mucho. Sin efectos de sonido:
el juego no los tiene a propósito.

⚠️ Usa pistas cuyos derechos te permitan distribuirlas.
