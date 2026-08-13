# Testing (Vitest)

## Por qué ahora

Dos bugs reales en producción que un test habría atrapado al instante: `resolverTurno` borrado
por accidente al introducir `resolverCombateCompleto` (quedó una llamada a una función
inexistente), y `EventScreen` sin importar en `App.jsx` (la pantalla de evento nunca se
renderizaba). El motor (`engine/`) es código puro sin React — el más barato y rentable de testear,
sin mocks ni DOM.

## Setup

- `npm install -D vitest`
- `vite.config.js` — bloque `test: { environment: 'node' }` (no hace falta `jsdom`: ni el motor ni
  el store tocan el DOM) más `setupFiles: ['./src/test-setup.js']`, un polyfill mínimo de
  `localStorage` en memoria — Node no lo expone por defecto, y `useGameStore`
  (`guardarRun`/`cargarRun`) y `useAchievementsStore` lo usan para persistir entre sesiones.
- `package.json` — scripts `"test": "vitest run"`, `"test:watch": "vitest"`.
- Los tests viven junto al archivo que testean, con sufijo `.test.js` (convención de Vitest, no
  hace falta carpeta `__tests__/` separada).

## Cobertura actual (211 tests)

- **`engine/leveling.test.js`** — curva de XP, subida de nivel (incluye subir varios niveles de
  golpe, no mutar el objeto de entrada), `obtenerModoActivo` (elige el de mayor nivel, no el
  primero de la lista), `aplicarMultiplicadores`, y `nivelesEstimadosDeLaRun` (empieza a nivel 1, un
  piso normal solo aporta la XP *esperada* y no la de un combate entero, el nivel se arrastra entre
  arcos). Más cuatro **invariantes de arco**, todos contra el mismo error: que los niveles fijos que
  declara un arco se separen de donde el jugador llega de verdad. Los tres arcos declaran su
  `xpCombateComun`; el jugador llega a cada jefe con ±2 niveles de diferencia; nunca va más de 5
  niveles por encima del enemigo de un piso normal; y todo personaje con dos modos desbloquea el
  primero dentro del arco 1, y **todo jefe con transformación llega transformado a su combate**
  (este último es nuevo: el anterior solo miraba `characters.json`, y por eso Zabuza desbloqueaba su
  modo a nivel 15 peleándose a 10, y Pain a **90** peleándose a 44, sin que nadie se enterara —
  meses de arte recortado que no se veía). Sin ellos el juego se descalibra en silencio: llegó a estar en Zabuza
  (Nv.4) peleado a nivel 9 y Pain (Nv.49) a nivel 70, con los combates comunes al 99% de victorias.
- **`engine/combat.test.js`** — eficacias de tipo, `crearLuchador` (HP persistido y su recorte al
  máximo), daño mínimo de 1, `resolverTurno` termina con un ganador, `resolverCombateCompleto`
  siempre devuelve ganador y el perdedor queda a 0 HP. **Barra de jutsu**: se carga al atacar y al
  recibir daño, topa en `cargaMaxima`, con la barra llena el siguiente ataque es el jutsu y la deja
  a cero, el básico pega menos y no aplica `efectoEstado`, un modo con `multiplicadorCarga` acelera
  la barra, y un luchador sin `ataqueBasico`/`carga` propios cae a los valores de `config.json` (que
  desde la unificación del ataque básico es el camino normal, no el excepcional). Además, un
  **invariante de datos**: ningún personaje ni enemigo de los tres JSON define su propio
  `ataqueBasico`, y todos acaban con el mismo. Sin este test la decisión se rompería en silencio —
  un personaje nuevo con básico propio funcionaría, solo que pegaría distinto al resto.
- **`engine/passives.test.js`** — las pasivas del catálogo probadas en combate real, no en
  aislamiento: que `first_hit_reduction` al 100% deja el golpe en 0 y no carga la barra del defensor,
  que `first_jutsu_bonus` solo sube el primero, que `priority` gana a la velocidad (y se anula si la
  tienen los dos), que el jutsu nunca se repite, que `heal_on_kill` no pasa del máximo. Más:
  `normalizarPasivas` con las dos formas de declaración y **reventando** con un id inválido, que modo
  y objeto se acumulan, que los contadores no se reinician entre atacantes distintos (el caso de la
  cadena de rondas), y el **invariante** de que `engine/passives.js` y `data/passives.json` tienen
  los mismos ids. La aleatoriedad de `repeat_basic_chance` se inyecta (`azar`) para no depender de la
  suerte. Más las dos reglas que salieron del playtest: una pasiva que dan el modo **y** el objeto se
  aplica una sola vez quedándose la más fuerte, y **normalizar dos veces no tira la cantidad
  declarada** — sin idempotencia ningún objeto estaba aplicando su valor real, solo el del catálogo.
  Además, **invariantes de datos** que protegen decisiones de contenido que se romperían sin
  hacer ruido: todo modo declara pasivas válidas, **todo modo se desbloquea dentro de la run**
  (estaban a nivel 60-85 con la run acabando en 49, así que no se veían nunca), todo personaje tiene
  transformación, y ningún objeto da bonificaciones planas de estadísticas.
- **`store/useGameStore.test.js`** (además de lo ya cubierto) — **HP al subir de nivel**: el
  personaje que ha peleado gana el incremento de vida sobre el HP con el que terminó el combate, y
  ese incremento nunca lo deja por encima del nuevo máximo. Los dos fallan sin el arreglo. Cubren un
  bug invisible en pantalla: el banquillo cobraba la vida del nivel y el que peleaba no.
- **`engine/mapGenerator.test.js`** — el piso 1 nunca tiene descanso (el bug real, repetido 30
  veces por la aleatoriedad), el último piso siempre 1 nodo `jefe`, el piso de mini-jefe siempre
  tiene exactamente un nodo `miniJefe`, todo nodo (salvo el inicial) tiene conexión entrante,
  `calcularNivelPorPiso` y `resolverEnemigoDeNodo` con niveles fijos correctos. Más la **rareza de
  los nodos de reclutar**: todo `reclutar` sale del generador con una, nunca se sortea una rareza sin
  candidatos en la run (la invariante que impide que el mapa pinte un pergamino dorado vacío), sin
  `opciones` se asume que solo hay comunes, y con muchas tiradas aparecen las dos. Y la **colocación**:
  todo arco tiene entre uno y dos nodos de reclutar, nunca pisan `inicio`/`jefe`/`miniJefe`/`descanso`
  (las garantías anteriores siguen en pie después de colocarlos) y cuando hay dos van en pisos
  distintos.
- **`engine/achievements.test.js`** — qué condiciones desbloquean qué logros, no repetir un logro
  ya desbloqueado, extraer las recompensas de personaje reclutable/objeto inicial de los logros ya
  conseguidos.
- **`store/useGameStore.test.js`** — `iniciarRun` crea el equipo correcto, `jugarCombate` en
  victoria y en derrota (incluida la cadena completa de rondas hasta que cae todo el equipo),
  `reordenarEquipo`, `reiniciarRun`, la tienda (comprar, fondos insuficientes, objeto gratuito,
  reclutar descarta la otra opción, nivel de reclutamiento correcto, equipo lleno), `irAGameOver`,
  y la integración con logros (desbloqueo al derrotar un jefe, `completarArcoSinDerrotas` con y sin
  derrota previa, el reclutable/objeto desbloqueados apareciendo en tienda/inventario). También que
  el enemigo **conserva su barra de jutsu** entre rondas encadenadas (igual que el HP) mientras que
  cada personaje del jugador entra con la suya a cero. Y el **desafío legendario**: el pergamino
  dorado ofrece a uno solo y como desafío, degrada a común si no queda ningún legendario, pelea de
  verdad al nivel fijo del arco, perderlo termina la run, ganar deja reclutarlo desde el mismo
  pergamino, y ni el jefe ni el mini-jefe del arco en curso pueden salir como recluta — esto último
  porque ganarle al jefe final ahí habría marcado el arco como completado. Y, desde que Kakashi
  existe, que **el arco 1 ofrece un desafío legendario sin ningún logro desbloqueado** — antes su
  `personajesReclutablesIds` estaba vacío y en una primera run el pergamino dorado degradaba siempre.
  Añadirlo obligó a **quitar los ids escritos a mano** de tres tests de este bloque: con dos
  legendarios en la pool, `personajes[0].personajeId === 'gaara'` pasó a ser una tirada de dados, que
  es peor que estar en rojo. Ahora se lee de la oferta quién ha salido, o se arranca la run con una
  copia del arco sin pool propia cuando el test necesita un rival concreto. Y la **Spare Ninja
  Headband dentro de un combate real** (`jugarCombate`, no `_aplicarDerrota` a mano): el que revive
  pelea dos rondas seguidas, así que hay que comprobar que no revive en las dos. Y el **final del
  combate**: el resumen trae XP, oro y XP de banquillo, el objeto del mini-jefe NO se anuncia ahí
  (tiene su propia pantalla y contarlo dos veces sería mentir), y el progreso de XP trae el antes y el
  después de los tres del equipo — la barra tiene que poder pintarse sin leer el store, que para
  cuando la animación empieza ya tiene el estado final.
- **`store/useAchievementsStore.test.js`** — desbloqueo y persistencia en `localStorage`, no repetir
  un logro ya conseguido, `cargarLogros()` recupera lo guardado en una sesión anterior. Y el **registro
  de vistos de la enciclopedia** (ver [32](./32-enciclopedia.md)): persiste por categoría, acumula sin
  duplicar, ignora ids vacíos, recupera lo guardado por una versión anterior a la que le falta una
  categoría (debe salir `[]` y no `undefined`, o la pantalla revienta al hacer `.includes`), y **no
  cambia la referencia del estado si no hay novedad** — ese último no es cosmético: hay una llamada de
  red de seguridad en `abrirEnciclopedia` y sin idempotencia cada apertura sería un bucle de renders.
  Los ganchos del lado del juego están en `useGameStore.test.js`, incluido que se apunta al enemigo
  **aunque se pierda** el combate y que el modo apuntado es el que usó en la pelea, no el que tenga
  después.

## Convención para nuevos tests

Cada `describe` cubre una función o flujo concreto. Los tests de store usan `beforeEach` para
reiniciar la run entera (`iniciarRun`) y evitar que el estado se arrastre entre tests — al ser un
store global de Zustand (no una instancia nueva por test), esto es obligatorio o los tests se
contaminan entre sí.

## Pendiente

No hay tests de componentes React todavía (`MapScreen`, `CombatScreen`, etc.) — de momento toda la
cobertura es de lógica pura (motor + store), que es donde han estado los bugs reales hasta ahora.
Si en el futuro se necesitan tests de UI, haría falta añadir `@testing-library/react` y cambiar
`environment` a `'jsdom'` para esos archivos concretos (Vitest permite mezclar entornos por
archivo).
