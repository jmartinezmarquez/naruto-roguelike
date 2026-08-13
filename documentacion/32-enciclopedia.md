# Enciclopedia (`components/Encyclopedia/EncyclopediaScreen.jsx`)

Punto 10 del roadmap. Es el sitio donde vive todo lo que se fue **sacando** de las tarjetas para que
cupieran en pantalla: la descripción narrativa de cada jutsu, su potencia, el ritmo exacto de carga,
qué hace cada transformación, la descripción de cada objeto y la tabla de eficacias de chakra.

Hasta que existió, esa información **no estaba en ninguna parte** — estaba escrita en los JSON y no
se pintaba en ninguna pantalla. Era deuda real, no un "ya lo pondremos", y crecía cada vez que se
adelgazaba una ficha: la última tanda le añadió cuatro textos de golpe (el Raikiri, los cascabeles y
los dos modos de Kakashi).

Se abre desde el menú de iconos del mapa (📖), como Logros, y se cierra con `volverAlMapa`. Es
consulta voluntaria: nunca se cruza en medio de una run.

## Solo enseña lo que el jugador ya ha visto

La decisión de fondo, y no es de UI. Las transformaciones se quitaron de las tarjetas **a propósito**
porque son una sorpresa (ver [30](./30-sistema-de-pasivas.md)), y la pantalla de transformación
existe justamente para ser el momento en que el jugador se entera. Una enciclopedia que liste los 31
modos de los 15 personajes deshace eso de un plumazo, y con ello media razón de ser del punto 4. Lo
mismo, más suave, con los jefes: una ficha de Pain con sus stats cuenta el final antes de llegar.

Así que cada entrada se desbloquea al verla en juego. Lo no visto **no se oculta**: sale en silueta
negra, con "???" en vez del nombre y con el mensaje de qué hay que hacer para abrirla. Un hueco vacío
no dice que haya algo que encontrar, y la gracia de una Pokédex es precisamente ver lo que falta.

La silueta se hace con `filter: brightness(0)` sobre el sprite más `opacity-40`: eso deja el dibujo
entero en negro **conservando su transparencia**, o sea la forma exacta del personaje. Un cuadrado
gris habría sido más fácil y no dice lo mismo — la silueta es la que promete que ahí hay alguien.

| Categoría | Cuándo se desbloquea | Mensaje |
|---|---|---|
| `personajes` | al tenerlo en el equipo | "Have them in your team to unlock this entry." |
| `enemigos` | al pelear contra él (se gane o se pierda) | "Face them in battle to unlock this entry." |
| `modos` | al verle transformado en un combate | "See them transform in battle to unlock this form." |
| `objetos` | al entrar en la mochila | "Find or buy it to unlock this entry." |

**La tabla de chakra no se desbloquea.** Son las reglas del combate, no contenido que se descubra;
esconderlas sería esconder cómo funciona el juego.

## Dónde vive el registro, y por qué ahí

En **`useAchievementsStore`**, con su propia clave de `localStorage`
(`naruto-roguelike-vistos`), no en `useGameStore`. Es meta-progresión, igual que los logros: si
viviera en la run, un game over borraría la enciclopedia entera.

```js
vistos: { personajes: [], enemigos: [], modos: [], objetos: [] }
```

Un modo **no tiene id propio** en los JSON, así que se identifica por su posición dentro de `modos`
(`naruto_1`) — la misma convención que ya usa `spriteDeModo`. Hay un test de invariante que exige que
ningún luchador repita el nombre de dos de sus modos, porque el store reconstruye ese índice **por
nombre** desde el resumen del combate: con dos modos homónimos, `findIndex` devolvería siempre el
primero y la segunda transformación no se desbloquearía nunca.

`registrarVistos(lote)` recibe un lote (`{ personajes, enemigos, modos, objetos }`, todas opcionales)
en vez de un id suelto, porque quien llama suele tener varias cosas a la vez —el equipo entero, el
enemigo y su modo— y así se escribe en `localStorage` una sola vez. Y es **idempotente**: deduplica y
**no toca el estado si no hay novedad**. Eso último no es cosmético: sin ello, la llamada de red de
seguridad que hay dentro de `abrirEnciclopedia` provocaría un `set` en cada apertura y cualquier
componente suscrito a `vistos` entraría en bucle de renders. Hay un test que comprueba que la
referencia del estado no cambia cuando no hay nada nuevo.

## Los ganchos: dónde el juego "ve" algo

Dos tipos, y la diferencia importa:

- **Lo transitorio hay que apuntarlo en el momento.** Un enemigo peleado no queda en el estado: en
  cuanto acaba el combate, no hay forma de saber contra quién fue. Por eso se apunta dentro de
  `jugarCombate`, junto con el modo con el que peleó cada personaje —sacado de las **rondas**, no del
  equipo actual, porque el que peleó pudo caer y aun así le viste transformarse.
- **Lo que está en el estado se puede leer cuando sea**, y de eso se encarga
  `_registrarVistosDeLaRun()`: equipo, modos ya activos, objetos equipados y mochila. Se llama desde
  `iniciarRun`, `reclutarPersonaje`, `comprarItemTienda`, `reclamarRecompensaMiniJefe`, el efecto de
  evento que da un objeto, y al final de `jugarCombate` (que es donde el jefe final auto-añade el
  suyo).

Y además desde **`abrirEnciclopedia` como red de seguridad**: si algún día se añade una vía nueva de
conseguir objetos y se olvida el gancho, al abrir la pantalla se apunta lo que el jugador tenga. Es
gratis por la idempotencia de arriba. Lo que esa red **no** puede tapar es un consumible ya gastado o
un personaje ya reemplazado, y por eso los ganchos concretos siguen haciendo falta.

## Trampas que ya han mordido aquí

- **`turnosParaCargarJutsu` recibe un luchador, no un personaje de JSON**, y su resultado depende del
  nivel y del modo activo (un modo puede traer `multiplicadorCarga`). O sea que "turnos de carga" no
  es un dato del personaje: es un dato de un personaje **a un nivel**. La pantalla lo mide a nivel 1
  sin objeto y **lo dice en pantalla**; sin esa nota el número mentiría en cuanto el jugador subiera.
- **`normalizarPasivas` se llama por modo, nunca sobre una lista mezclada.** Deduplica por id
  quedándose la cantidad mayor (ver [30](./30-sistema-de-pasivas.md)), así que juntar las de dos modos
  —o las de un objeto— daría cifras que no son las de este modo.
- **`FichaPersonaje` no encontraba a los enemigos comunes.** Llevaba su propia copia de la búsqueda
  del personaje base que solo miraba `characters.json` y los jefes, así que devolvía `null` para un
  genin rival y la tarjeta no se pintaba. Se unificó con `encontrarBaseDeLuchador` en
  `datosDeLuchador.js`, que ya miraba en los cuatro sitios. Es exactamente el mismo problema que tuvo
  `nombrePersonaje` antes de unificarse en `nombres.js`: **la tercera vez que aparece una búsqueda
  duplicada, ya no es casualidad.**
- **La ficha se pinta a nivel 1 a propósito.** `FichaPersonaje` usa `spriteDeCombate`, que devuelve el
  sprite del modo activo a ese nivel: con el nivel real, un personaje ya transformado destriparía su
  transformación desde la propia ficha, que es justo lo que esta pantalla evita.

## Lo que NO se hizo

- **No se añadió un campo `descripcion` a los modos.** No lo tiene ninguno de los 31, y se comprobó
  antes de empezar. La pantalla de transformación ya resuelve esto generando el texto con
  `describirPasiva` y los multiplicadores, y la enciclopedia hace lo mismo. Añadirlo habría sido
  contenido nuevo que escribir y mantener para decir lo que el catálogo ya sabe decir.
- **No hay iconos propios por entrada**: se reutilizan los sprites de personaje y de objeto que ya
  existen.
- **No hay tests de componentes React** (el proyecto no tiene ninguno). La red de seguridad de esta
  pantalla es la prueba manual, más dos invariantes de datos en `engine/combat.test.js` que cubren lo
  que sí se puede automatizar: que todo luchador de los tres JSON se puede construir y tiene jutsu con
  nombre, potencia y carga finita, y que ningún luchador repite el nombre de un modo.
