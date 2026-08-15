# Música de fondo (`components/common/MusicaDeFondo.jsx`)

**Una pista por arco, en bucle, y nada más.** Sin efectos de sonido, sin mezcla, sin enganches por
golpe o por evento.

## Por qué es mucho más pequeño de lo que parecía

Durante meses el sonido estuvo en el backlog descrito como "un sistema entero (assets, precarga, mezcla,
volumen)" y como *lo más grande que le falta al MVP*. Eso era un error de encuadre, y lo deshizo una frase
del usuario: **la referencia no tiene efectos de sonido**. Pokelike es un juego para jugar con calma, con
una pista lo-fi por región y ya está.

Con eso, lo que quedaba no era un sistema: era un `<audio>` con tres reglas. La lección es de método —
**antes de estimar un sistema, comprobar qué hace de verdad la referencia**; "sonido" y "un bucle por
arco" se parecen en la lista de tareas y no se parecen en nada al implementarlos.

## Cómo se añaden las pistas

Van en `src/assets/music/`, y **el nombre del fichero es el `id` del arco** — la misma convención que
`assets/map-columns/`. Hay un `LEEME.md` en la carpeta con la tabla.

| Fichero | Cuándo suena |
|---|---|
| `principal.mp3` | **El respaldo**: todo lo que no tenga pista propia |
| `pais_de_las_olas.mp3` | Arco 1 |
| `examen_chunin.mp3` | Arco 2 |
| `invasion_de_pain.mp3` | Arco 3 |
| `menu.mp3` | Selección de personaje, antes de que haya run |

**El MVP sale con una sola canción**: basta `principal.mp3` y suena en todo el juego. Que sea un
**respaldo** y no un caso aparte es lo que hace que pasar a una pista por campaña más adelante no exija
tocar código — el día que exista `examen_chunin.mp3`, ese arco deja de caer al respaldo y ya está.

⚠️ Y mientras dos pantallas comparten pista, la URL no cambia al pasar de una a otra, así que la música
**no se reinicia ni se funde**: sigue sonando por donde iba. Sale gratis de la guarda del efecto, pero
conviene saberlo — es lo que hace que hoy, con una sola canción, el juego entero suene como una pieza
continua.

⚠️ **La carpeta puede estar vacía y el juego funciona igual, en silencio.** Es como nació esto: el
sistema montado y los huecos por rellenar. Lo permite `import.meta.glob`, que resuelve en build lo que
haya — con un `import` normal, **un fichero que falta rompe el build**, y entonces no se podría dejar
montado sin las pistas. Si falta uno solo, ese arco va callado y los demás suenan.

## Las tres reglas del componente

1. ⚠️ **Cuelga de `App`, no de una pantalla.** Colgado de la pantalla, React lo desmonta y lo vuelve a
   montar en cada cambio —mapa → combate → mapa— y la música empieza de cero cada vez.
2. ⚠️ **El navegador bloquea el autoplay hasta que el usuario toca algo.** El `play()` de la carga se
   rechaza casi siempre, así que hay un reintento enganchado al primer `pointerdown`/`keydown`, que se
   desengancha solo. **Sin eso el sistema entero no suena en Chrome** y parecería simplemente roto. Por
   lo mismo, todos los `play()` llevan `.catch(() => {})`: el rechazo es lo normal, no un error.
3. **Al cambiar de arco hay un fundido de 600 ms**, hecho a mano bajando `volume` por pasos. No se usa la
   Web Audio API: montar un `AudioContext` para esto sería traer un sistema de sonido a un juego que ha
   decidido no tenerlo.

Y un detalle que no es obvio: **a volumen 0 se PAUSA**, no se queda sonando en mudo. Una pista muda sigue
avanzando, y al subir el volumen entraría por donde se hubiera quedado en vez de por donde la dejaste.

## El ajuste

`volumenMusica` (0 a 1) vive en `useSettingsStore` con el resto, y se persiste igual. En Ajustes hay una
sección **Sound** con cuatro pasos —OFF / LOW / MID / HIGH— y no un deslizador: un slider es de interfaz
de móvil y esto quiere parecerse a un menú de GBA. Reutiliza el `SelectorOpciones` que ya existía.

**Arranca sonando** (0,5), con test: la música es la mitad del tono que busca el juego, no un extra que
haya que ir a encender. Y la sección de sonido **solo tiene música**, porque no hay efectos que controlar
— la misma regla que la mantuvo entera fuera de Ajustes hasta que hubo sistema.

⚠️ El store **no toca el DOM**: quien tiene el `<audio>` es el componente. Es la misma separación que el
tema y el factor de animación (ver [34](./34-ajustes.md)), y la que permite que los tests corran en
`environment: 'node'`.
