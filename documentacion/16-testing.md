# Testing (Vitest)

## Por qué ahora

Dos bugs reales en producción que un test habría atrapado al instante: `resolverTurno` borrado
por accidente al introducir `resolverCombateCompleto` (quedó una llamada a una función
inexistente), y `EventScreen` sin importar en `App.jsx` (la pantalla de evento nunca se
renderizaba). El motor (`engine/`) es código puro sin React — el más barato y rentable de testear,
sin mocks ni DOM.

📌 De esos dos bugs de partida, **solo el primero era de motor**. El segundo —`EventScreen`— es el que
justificó los tests de componente, y no tuvo uno que lo cubriera hasta el 2026-08-21: ver "Tests de
componente" al final.

## Setup

- `npm install -D vitest`
- `vite.config.js` — bloque `test: { environment: 'node' }` más `setupFiles: ['./src/test-setup.js']`,
  un polyfill mínimo de `localStorage` en memoria — Node no lo expone por defecto, y `useGameStore`
  (`guardarRun`/`cargarRun`) y `useAchievementsStore` lo usan para persistir entre sesiones.
- `package.json` — scripts `"test": "vitest run"`, `"test:watch": "vitest"`.
- Los tests viven junto al archivo que testean, con sufijo `.test.js` / `.test.jsx` (convención de
  Vitest, no hace falta carpeta `__tests__/` separada).

⚠️ **El entorno global sigue siendo `node` aunque ya haya tests de componente.** Los de UI declaran el
suyo en la primera línea del archivo (`// @vitest-environment jsdom`) en vez de cambiarlo para todos.
Dos razones, y ninguna es el rendimiento: el motor **no debe necesitar un navegador** —es la regla del
proyecto, `engine/` no importa React ni el DOM— y con `jsdom` global esa regla dejaría de comprobarse
sola. Que los 290 tests de lógica no paguen el arranque de jsdom es un extra.

## Cobertura actual (459 tests: 294 de lógica + 165 de componente)

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
  conseguidos. Y las dos condiciones acumuladas: `contadorMinimo` se cumple **en la cantidad exacta**
  (no un combate después) y un contador ausente cuenta como 0 sin reventar; `coleccionMinima` mide una
  categoría de vistos y no mira las otras; `progresoDeLogro` devuelve `null` para los de suceso.
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
- **`store/useSettingsStore.test.js`** — las preferencias (ver [34](./34-ajustes.md)): valores por
  defecto —incluido que **no** salta la pantalla de transformación, que es lo único que le cuenta al
  jugador que las transformaciones existen—, que persiste los tres ajustes juntos y no solo el que cambia,
  que **revienta con un ajuste desconocido** en vez de guardarlo en silencio (mismo criterio que las
  pasivas: una opción que no hace nada es el peor fallo posible), que `cargarAjustes` completa las claves
  que falten en lo guardado por una versión anterior, y que cada velocidad traduce a su multiplicador.
- **`store/useAchievementsStore.test.js`** — desbloqueo y persistencia en `localStorage`, no repetir
  un logro ya conseguido, `cargarLogros()` recupera lo guardado en una sesión anterior. Y el **registro
  de vistos de la enciclopedia** (ver [32](./32-enciclopedia.md)): persiste por categoría, acumula sin
  duplicar, ignora ids vacíos, recupera lo guardado por una versión anterior a la que le falta una
  categoría (debe salir `[]` y no `undefined`, o la pantalla revienta al hacer `.includes`), y **no
  cambia la referencia del estado si no hay novedad** — ese último no es cosmético: hay una llamada de
  red de seguridad en `abrirEnciclopedia` y sin idempotencia cada apertura sería un bucle de renders.
  Los ganchos del lado del juego están en `useGameStore.test.js`, incluido que se apunta al enemigo
  **aunque se pierda** el combate y que el modo apuntado es el que usó en la pelea, no el que tenga
  después. Más los **contadores** (punto 5a): acumulan y persisten, no escriben si el lote no suma,
  **revientan con un contador desconocido** (una errata lo dejaría a cero para siempre y el logro no
  saltaría nunca), `cargarLogros` completa las claves que falten, y `reiniciarLogros` los borra —con
  test propio, porque dejarlos llenos haría que los logros se redesbloquearan en el acto. Y seis
  **invariantes sobre `achievements.json`**: ids únicos, tipos de condición y de recompensa que el
  motor y la pantalla conocen, contadores y categorías que existen de verdad, e ids de
  personaje/objeto que están en los JSON.

## Convención para nuevos tests

Cada `describe` cubre una función o flujo concreto. Los tests de store usan `beforeEach` para
reiniciar la run entera (`iniciarRun`) y evitar que el estado se arrastre entre tests — al ser un
store global de Zustand (no una instancia nueva por test), esto es obligatorio o los tests se
contaminan entre sí.

⚠️ **Y hay que reiniciar TODO lo persistido, no solo la run.** `useAchievementsStore` guarda tres
cosas —logros, vistos y contadores— y el `beforeEach` tiene que vaciar las tres. Se descubrió
dejándose los contadores: los combates y eventos de cada test se sumaban a los del siguiente y
acababan desbloqueando "gana 10 combates" en mitad de una prueba que iba de otra cosa. Es la misma
trampa que en el juego, donde reiniciar la meta-progresión tiene que borrar las tres claves de
`localStorage`.

## Tests de componente (2026-08-21)

Se añadieron con un argumento concreto, no por completismo: **casi todos los bugs anotados en este
proyecto están en la única capa que no tenía tests.** El guard numérico que pintaba un `0` suelto,
comparar ids contra nombres, el `findIndex` que devolvía la ronda equivocada, `EventScreen` sin
importar, el `setState` dentro de un `useEffect`, el `markerEnd` tapado del SVG, el tooltip que se
salía de su pastilla. Los 290 tests de motor y store cubrían la parte donde casi no ha fallado nada.

⚠️ **Y lo que tienen en común esos bugs es que no fallan.** No hay excepción, ni pantalla en rojo, ni
build roto: simplemente no pasa lo que tenía que pasar, o pasa algo feo. Se descubren jugando, que es
el recurso más caro del proyecto. Por eso los tests de componente de aquí no comprueban que "se ve
bien", sino **reglas que se pueden romper en silencio**:

- **`App.test.jsx`** — el enrutado: cada valor de `pantalla` pinta la suya, y la regla de
  `encimaDelMapa` (las consultas cortas se dibujan SOBRE el mapa; los momentos propios de la run lo
  sustituyen). Recorre TODOS los nombres de pantalla, también los que hoy funcionan: el valor está en
  que añadir una pantalla nueva sin engancharla salte aquí. Es el test que le faltaba al bug de
  `EventScreen`.
- **`EncyclopediaScreen.test.jsx`** — que el Bingo Book **solo enseñe lo ya visto**. Es una regla de
  spoilers: si `vistos` deja de consultarse, la pantalla se sigue pintando perfectamente, solo que con
  todo el juego destapado. "Se ve bien" es exactamente el fallo.
- **`AchievementsScreen.test.jsx`** — que no exista ninguna fila con **la barra llena y "Locked"** al
  lado. Se prueba la contradicción y no el arreglo (el catch-all de `abrirLogros`), así que el test
  sigue valiendo si mañana se arregla de otra forma, y salta con cada logro nuevo.
- **`GameOverScreen.test.jsx`** — las dos salidas. Quitar la del Home no rompe nada: el juego sigue
  siendo jugable, solo que quien acaba de desbloquear un logro se queda sin puerta para ir a verlo.
- **`CharacterSelectScreen.test.jsx`** — que haya marcha atrás, y que el roster crezca con los logros.
- **`PersonajeHoverCard.test.jsx`** — la tarjeta que usan cinco pantallas, y sobre todo **lo que calla
  a propósito**: que falte algo se ve, que SOBRE no. Destapar la transformación no rompe nada, solo
  estropea la pantalla que existe para ese momento.
- **`nombres.test.js`** y **`projectileSprites.test.js`** — sin jsdom, son funciones puras. Recorren
  **todos** los luchadores de los tres ficheros de datos, que es la única forma de garantizar que
  ningún id acabe en pantalla sin traducir ni ningún jutsu caiga al kunai por una errata.

### Cómo se escriben

- Primera línea del archivo: `// @vitest-environment jsdom`.
- Se importa de **`src/test-dom.js`**, no de `@testing-library/react` directamente. Ese archivo trae
  los matchers, el `cleanup` entre tests y los tres huecos de jsdom que el juego pisa:
  `HTMLMediaElement.play` (sin él no se puede ni renderizar `App`, porque `MusicaDeFondo` hace
  `audio.play().catch(...)` y en jsdom `play()` no devuelve promesa), `ResizeObserver` (el mapa y la
  tarjeta de hover) y `scrollIntoView` (el registro de combate).
- ⚠️ **`cleanup` hay que registrarlo a mano.** Testing Library solo lo hace sola si `afterEach` es
  global, y aquí no lo es. Sin él, el segundo test de un archivo encuentra dos botones con el mismo
  texto y el fallo parece del componente.

### Dos trampas que costaron una vuelta

- ⚠️ **`jsdom` está pinado a `^26` a propósito.** El 30 hace `require()` de un módulo ESM, que solo
  funciona en Node ≥22.12. El CI usa `node-version: 22` (o sea, la última), así que **habría pasado en
  CI y fallado en la máquina de desarrollo** — la peor combinación posible para unos tests cuyo
  sentido es que se corran mientras se programa.
- ⚠️ **Los tests ensuciaban el CSS de producción.** Tailwind v4 detecta las clases leyendo el proyecto
  entero, y un `closest('div.flex-1')` o una clase citada en un comentario cuentan como fuente: 277
  bytes de reglas que ningún jugador puede ver, y creciendo con cada test. Se corta con
  `@source not "**/*.test.{js,jsx}"` en `index.css`. Comprobado como manda la regla de este proyecto —
  mirando el bundle, no que compile: el CSS vuelve al **hash idéntico** al de antes de los tests.

### Segunda tanda (las cinco pantallas que faltaban) — y el primer bug que encuentran

La primera tanda cubrió las pantallas donde habían estado los bugs **documentados**. Esta cubre las
cinco que quedaban —Mochila, Tienda, Reclutar, Evento y Ajustes—, elegidas por lo contrario: por
dónde es más probable que haya bugs **vivos**. Son las que menos se miran y las que más reglas con
esquina tienen.

🐛 **Y encontraron uno.** `usarConsumible` no comprueba si el personaje está ya al máximo: cura de 45
a 45, devuelve `true`, borra el objeto del inventario y la mochila se cierra sola. **El jugador pierde
un objeto sin llegar a enterarse.** Chirriaba el doble porque esa misma pantalla SÍ para y avisa antes
de reemplazar algo equipado, que encima es reversible —el objeto vuelve a la bolsa— y esto no lo es.
Arreglado en la UI (el botón sale apagado y dice `Full`) y no en el store, porque el store hace lo que
le piden: quien no debía dejar pedirlo era la pantalla.

Qué protege cada archivo:

- **`InventoryScreen.test.jsx`** — el bug de arriba, que lo suelto y lo equipado sean entradas
  distintas (si se agruparan por id, la copia libre quedaría escondida detrás de la equipada), y que
  equipar encima pare y avise.
- **`ShopScreen.test.jsx`** — que no se pueda pulsar "Buy" sin oro, que con el oro **justo** sí (el
  límite es `>=`, no `>`), y que lo comprado salga del escaparate — que es lo que impide comprarlo dos
  veces con un doble clic.
- **`RecruitScreen.test.jsx`** — ⚠️ **que el pergamino dorado no se pueda reclutar sin pelear.** Es la
  regla entera del nodo: lo que separa al legendario del resto no es lo bueno que sea, es que hay que
  ganarle. Un botón de más y el desafío se convierte en un regalo. Y que el objeto del personaje
  sustituido vuelva a la mochila en vez de irse de la run con él.
- **`EventScreen.test.jsx`** — el `default` de los dos `switch` que escriben el texto. ⚠️ Un tipo de
  efecto que falte **no da error: cae en el `default` y le dice al jugador que no pasa nada mientras
  el store le quita 20 de oro.** El test **cuenta en vez de buscar** —"Nothing happens" es legítimo en
  la rama mala de una tirada al 50%— y exige que aparezca exactamente tantas veces como efectos
  `ninguno` hay de verdad. Cada sobra es un tipo que la pantalla está tapando con una mentira.
- **`SettingsScreen.test.jsx`** — que cada control mueva SU ajuste (un copia y pega entre dos
  selectores deja el botón de la velocidad cambiando el tema, y no falla nada), y que reiniciar la
  meta-progresión borre **las cuatro** cosas. Dejarse los contadores es peor que no reiniciar: los
  logros de "gana 50 combates" se redesbloquean en el primer combate y el jugador ve su reinicio
  deshacerse solo.

### Lo que sigue sin tener test, y a propósito

`MapScreen`, y de `CombatScreen` **todo lo que se ve**. Son las dos pantallas con medidas de
maquetación (el lienzo que se escala con `ResizeObserver`) y con relojes, y jsdom **no maqueta**:
todas las medidas salen 0. Un test de aspecto ahí probaría el lienzo falso, no el juego.

📌 **Matiz añadido el 2026-08-21**: `CombatScreen.test.jsx` sí existe, y no contradice lo anterior
porque no prueba nada de lo que se ve — prueba **a dónde te lleva el final de un combate y cuándo**,
que es lógica de navegación. La tanda de ritmo le quitó dos botones y le puso un auto-avance, y las
dos cosas se estropean en silencio: un botón que vuelve, o un auto-avance que se dispara donde había
algo que leer y te roba la recompensa sin que nada falle.

⚠️ Y una trampa práctica que costó una vuelta: **con la velocidad normal la animación no termina
dentro de un test**, porque encadena un `setTimeout` por golpe desde un efecto y adelantar el reloj a
saco no la completa. Esos tests usan la velocidad **instantánea**, donde `rondaCompleta` sale `true`
en el primer render sin relojes. El suelo del auto-avance (`MS_MINIMO_AUTO`) se sigue aplicando, que
es lo que impide que la prueba se vuelva trampa.
