# Música de fondo (`components/common/MusicaDeFondo.jsx`)

**Una pista por arco, en bucle.** Y desde 2026-10-12, **efectos de sonido sintetizados** aparte — ver
"Efectos de sonido" al final: la decisión de no tenerlos se revirtió a petición del usuario.

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

## Efectos de sonido (2026-10-12)

⚠️ **Esto revierte una decisión escrita.** Hasta aquí el documento decía "sin efectos de sonido", porque
la referencia no los tiene. El usuario los pidió expresamente tras ver la tanda de juiciness del combate,
así que la decisión cambió. Lo que sigue en pie de aquel razonamiento es **qué** se hace: nada de ficheros
de audio ni de un sistema de mezcla con buses — una sola salida con compresor.

**Sintetizados en el navegador con la Web Audio API, sin ni un fichero** (`components/common/efectosDeSonido.js`):

- ⚠️ **La primera versión sonaba a consola, no a ninja**: los golpes estaban hechos con ondas cuadradas
  y barridos de tono, que el oído lee como "pitido de videojuego". Lo que hace que algo suene al mundo
  de Naruto es el **material**, así que el combate se rehízo con cuatro primitivas y ninguna onda
  cuadrada: `metal` (parciales inarmónicos de una barra golpeada: kunai, choques, campana),
  `taiko` (tambor: seno que cae de tono + bofetada de piel), `sellos` (chasquidos de madera, uno por
  sello de manos, **antes de cada jutsu**) y `cuerda` (koto por **Karplus-Strong**, con las fanfarrias
  en pentatónica mayor y la derrota en escala *in*). El fuego y el rayo son ruido y chasquidos
  (`crepitar`), no tonos. La interfaz (clics, monedas) sigue en cuadrada a propósito: ahí sí es un
  menú de juego.
- Pesan cero bytes: la primera carga ya se vigila (ver [37](./37-publicacion-web.md)).
- **Cada disparo varía un poco** (±5 % de tono). Un efecto que se oye cuarenta veces por combate cansa a
  la tercera si es siempre idéntico.
- Todo pasa por un **compresor** antes del altavoz: un jutsu que estalla a la vez que la caída del rival
  satura sin él. Los sonidos grandes (jutsus, fanfarrias) llevan además un eco corto y oscuro; un clic de
  menú con eco suena a cueva.
- El `AudioContext` se crea **al primer sonido**, no al importar: uno creado antes del primer gesto nace
  suspendido (la misma regla del autoplay que la música).

**Dónde suena cada cosa:**

| Momento | Dónde se engancha |
| --- | --- |
| Clic de cualquier botón | `EfectosDeSonidoGlobales` (un solo oyente en `App`, fase de captura) |
| Tic al pasar por un nodo elegible | atributo `data-sonido-hover` en el nodo |
| Elegir nodo / descanso | `data-sonido="elegirNodo"` / `"curar"` en el botón del nodo |
| Kunai, jutsu por naturaleza, impacto (según eficacia), bloqueo, KO, jutsu cargado, relevo, victoria/derrota, subida de nivel | `Combat/sonidosDeCombate.js` — sigue al **replay**, no al resultado |
| Carga y estallido de la transformación | `TransformationScreen`, una fase cada uno |
| Comprar (o no poder), equipar, desequipar, usar consumible | la pantalla, **según lo que devuelve el store** |
| Tirada de evento buena/mala | `EventScreen` — solo las tiradas; un efecto fijo ya se sabía al elegir |
| Reclutar, logro desbloqueado | `RecruitScreen`, `LogroToast` (con el toast, cuando se ve) |

**Un botón nuevo suena solo**, sin tocar nada: el oyente global es la alternativa a poner un `onClick` de
sonido botón a botón, que es la forma segura de que la mitad se queden mudos. Lo que cambia un botón se
declara en su JSX: `data-sonido="<nombre>"` para otro sonido, `data-sonido="ninguno"` cuando su manejador
pone el suyo según el resultado (comprar con o sin oro).

**Volumen propio** (`volumenEfectos` en `useSettingsStore`, fila "Effects" en Ajustes), separado de la
música. Los dos son **deslizadores** de 0 a 100 (eran cuatro pasos OFF/LOW/MID/HIGH; se cambiaron a
petición del usuario). `normalizarVolumen` los deja siempre entre 0 y 1 — fuera de ahí `audio.volume`
lanza. Al soltar el de efectos suena un golpe de muestra.

