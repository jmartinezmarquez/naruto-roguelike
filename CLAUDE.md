# Naruto Roguelike — contexto del proyecto

Roguelike de mapa ramificado inspirado en Pokelike/Slay the Spire, temática Naruto.
MVP con 3 arcos jugados en una sola run continua, de nivel 1 a ~51 (`nivelMaximo: 100` es solo un
techo teórico que nadie alcanza jugando):
1. País de las Olas (niveles 1-10) — mini-jefe Haku (nivel fijo 3), jefe final Zabuza (10).
2. Examen Chunin (17-27) — mini-jefe Kabuto (19), jefe final Gaara (27).
3. Invasión de Pain (licencia creativa) (33-44) — mini-jefe Camino Animal de Pain (36), jefe final Pain, Camino Deva (44).

Documentación completa en `documentacion/` — índice en `documentacion/00-indice.md`. Antes de
explorar el código a ciegas, comprueba si el documento correspondiente ya explica el porqué.

## Stack

- React (Vite) + Zustand (estado global) + Tailwind CSS v4 (vía `@tailwindcss/vite`, sin `tailwind.config.js`)
- Vitest para testing (`npm test`), `environment: 'node'` — el motor y el store no tocan el DOM.
- Sistema operativo de desarrollo: **Windows**. Comandos de terminal en CMD/PowerShell, no sintaxis Unix.
- **No probar la UI con chromium-cli/Playwright ni herramientas headless similares.** El usuario
  prefiere probar manualmente él mismo. Si quieres verificar visualmente un cambio, pídeselo en
  vez de lanzar un navegador headless.

## Estructura de carpetas

```
src/
├── data/        → JSON de contenido (personajes, tipos, arcos, eventos, items, config, enemies)
├── engine/      → lógica pura del juego, SIN imports de React ni del store. Tiene *.test.js junto a cada archivo.
├── store/       → estado global (Zustand) — useGameStore.js, con su propio *.test.js
├── components/  → UI por pantalla: Map/, Combat/, Event/, Shop/
└── App.jsx      → temporal: arranca fijo con Naruto/Sasuke/Sakura, alterna pantalla según store.pantalla
```

Regla estricta: `engine/` nunca importa de `react` ni de `store/`. Son funciones puras.

## Reglas de diseño clave

- **Motor agnóstico del contenido**: nada en `engine/` tiene referencias hardcodeadas a Naruto ni a
  ningún arco concreto. Todo el contenido vive en `src/data/*.json`.
- **Combate**: automático, 1 vs 1 (personaje en posición 1 del equipo contra el enemigo del nodo),
  sin decisiones del jugador durante la pelea. Cada luchador tiene **dos ataques**: un ataque básico
  que lanza cada turno y su `jutsu`, que se carga (`jutsu.carga.alAtacar` / `alRecibirDano` sobre
  `config.combate.jutsu.cargaMaxima`) y sale solo al llenarse la barra, vaciándola. La barra NO
  dispara en el mismo turno en que se llena.
  **El ataque básico es único para todos** (`config.combate.jutsu.ataqueBasicoPorDefecto`): ningún
  personaje ni enemigo define el suyo, y hay un test de invariante que falla si alguien añade uno.
  Lo que diferencia el daño básico de un personaje a otro es su stat de ataque.
  Ver `documentacion/29-sistema-de-jutsus-automaticos.md`. **Si el activo cae, el siguiente personaje vivo
  entra automáticamente contra el MISMO enemigo** (que conserva el daño ya recibido) — es una
  secuencia de "rondas" dentro de un mismo combate, no combates separados. Ver `useGameStore.jugarCombate`.
- **HP persistente entre combates**: `equipo[].hpActual` NO se resetea al ganar un combate. Solo se
  cura con descanso, eventos de curación, o (más adelante) consumibles.
- **Nivel de enemigo: FIJO, no relativo al jugador.** Se intentó escalado dinámico y se descartó —
  rompe el sentido de subir de nivel. Ver la historia completa en `documentacion/11-progresion-y-arcos.md`
  antes de tocar esto, para no repetir el ciclo de errores. **Pero fijo no quiere decir "sin
  comprobar"**: los niveles que declara un arco solo significan algo si el jugador llega ahí de
  verdad, y eso hay que calcularlo (`nivelesEstimadosDeLaRun` en `engine/leveling.js`), no suponerlo.
  Se dio por supuesto durante meses y el jugador llegaba a Pain (Nv.49) siendo nivel 70. Hay cuatro
  tests de invariante en `leveling.test.js` que lo protegen.
- **Modos/transformaciones**: array `modos` (0 a 2 tiers), se activa siempre el de mayor
  `nivelDesbloqueo` disponible, calculado internamente por `crearLuchador` — nunca cambia a mitad
  de combate.
- **Pasivas**: catálogo de efectos con nombre (`engine/passives.js` + textos en
  `src/data/passives.json`) que cambian **reglas** del combate en vez de estadísticas. Modos y
  objetos los declaran por id y comparten implementación. Un id que no esté en el catálogo **revienta**
  al crear el luchador, no se ignora. Las declaran los 31 modos y los 10 objetos (fases 1-3 de las 4
  del rediseño de balance). Ver `documentacion/30-sistema-de-pasivas.md`.
- **Una pasiva por id**: si el modo y el objeto dan la misma, se aplica UNA vez (la de mayor
  cantidad), y `normalizarPasivas` es **idempotente** — normalizar dos veces enterraba `parametros`
  dentro de sí mismo y todos los objetos acababan usando la cantidad por defecto del catálogo en vez
  de la suya. Ver `documentacion/30-sistema-de-pasivas.md`.
- **Los objetos NO dan estadísticas**, dan pasivas. Un bonus plano se diluye con el nivel (+4 de
  ataque contra 80 al final de la run) y hacía que los objetos valieran más al empezar la partida
  que al acabarla. Hay un test de invariante que lo protege. `engine/items.js` se borró al quedarse
  sin uso.
- **Todo modo tiene que desbloquearse dentro de la run** (nivel ≤ 49, el del jefe final del arco 3).
  Los segundos modos estaban a nivel 60-85 y no se activaban NUNCA; Sai y Yamato no tenían
  transformación en absoluto. Hay un test de invariante que lo protege.
- **Sistema de tipos**: 5 naturalezas de chakra (katon, fuuton, raiton, doton, suiton), tabla en `src/data/types.json`.
- **Los 3 arcos tienen 8 pisos** (`numeroPisos`, con `pisoMiniJefe: 4` y `pisoJefeFinal: 8`). Es un
  límite de la pantalla de mapa, que escala el lienzo para que quepa entero sin scroll: con más de
  8 pisos los nodos se vuelven ilegibles. No subirlo sin cambiar antes el encuadre del mapa.
  Pendiente de recalibrar el balance de los arcos 2 y 3, que eran de 10 y 12 pisos —
  ver `documentacion/11-progresion-y-arcos.md`.
- **Generación de mapa**: piso 1 = un único nodo `inicio` que nace ya visitado (casilla de salida
  estilo Pokelike; el store arranca la run en `mapa.nodoInicialId`), forma de diamante por piso
  (`anchoDelPiso`) con la regla de que dos pisos seguidos nunca miden lo mismo (`anchosDeLosPisos`),
  el piso 2 —primer piso jugable— nunca tiene `descanso` ni `tienda`, máximo 2 nodos de `tienda`
  por piso, y el piso inmediatamente anterior al jefe final siempre tiene un nodo de `descanso`
  (`garantizarDescansoAntesDelJefe`).

## Convenciones de Git

- Ramas: `tipo/descripcion-en-kebab-case` (sin paréntesis, sin espacios, sin `+`).
- Commits: `tipo(alcance): descripción en presente` (feat, fix, data, docs, style, refactor, chore).
- Un commit = un cambio lógico coherente.

## Eficiencia de contexto (para sesiones largas, gastar menos tokens)

- **Antes de leer un archivo entero, usa `grep`/búsqueda dirigida** para encontrar la función o
  sección concreta que necesitas. No releas `useGameStore.js` completo para un cambio de 3 líneas.
- **Consulta primero `documentacion/00-indice.md`** para saber qué documento cubre el tema antes de
  explorar el código a ciegas.
- **Agrupa cambios relacionados en menos operaciones.**
- **No repitas explicaciones de diseño ya cubiertas en `documentacion/`** — enlaza al documento.
- **Verifica llamadas internas antes de reemplazar una función.** Ya hemos tenido bugs reales por
  borrar una función que otra seguía llamando (`resolverTurno` desapareció al introducir
  `resolverCombateCompleto`, y quedó una llamada a una función inexistente). Un `grep` del nombre
  antes de tocarla es más barato que el bug después. **Corre `npm test` tras cualquier cambio en
  `engine/` o `store/`** — hay 225 tests que cubren justo este tipo de regresión.
- **Antes de una respuesta grande y ambigua, plantea primero el plan** en un mensaje corto.

## Estado actual (actualizar tras cada sesión relevante)

- [x] Datos completos, motor puro, store, y las 4 pantallas principales: Mapa, Combate, Evento, Tienda.
- [x] Testing con Vitest — 225 tests en `engine/*.test.js` y `store/*.test.js`. Correr `npm test` antes de dar por bueno cualquier cambio en esas dos carpetas. Requiere `src/test-setup.js` (polyfill de `localStorage`, registrado en `vite.config.js`).
- [x] Balance revisado varias veces con simulaciones reales (ver `documentacion/11-progresion-y-arcos.md`) — sigue pendiente de más ajuste tras playtest (ver nota sobre rondas encadenadas + banquillo).
- [x] Pantalla de Game Over dedicada (`components/GameOver/GameOverScreen.jsx`) — ver `documentacion/17-game-over.md`.
- [x] Sistema de logros completo, incluida la recompensa `desbloquearPersonajeInicial` (`engine/achievements.js`, `store/useAchievementsStore.js`, `src/data/achievements.json`, `components/Achievements/`) — ver `documentacion/18-sistema-de-logros.md`.
- [x] `App.jsx` real: `CharacterSelectScreen` (elige 1 personaje inicial, roster = "inicial" + desbloqueados por logro; el resto del equipo se completa reclutando) sustituye al arranque fijo con Naruto/Sasuke/Sakura — ver `documentacion/19-seleccion-de-personaje.md`.
- [x] Reclutar con el equipo lleno deja elegir a quién reemplazar (`RecruitScreen.jsx` → `PanelReemplazo`, `reclutarPersonaje(id, nivel, idAReemplazar)`) — ver `documentacion/19-seleccion-de-personaje.md`.
- [x] Tarjeta de hover con stats/tipo/jutsu/HP en todo sitio donde se muestra un personaje (`components/common/PersonajeHoverCard.jsx` / `FichaPersonaje`), y pictograma del ciclo de ventaja de chakra en el mapa (`RuedaChakra`).
- [x] Ronda de bugfixing/ajustes de diseño (ver `documentacion/05-roadmap.md`, sección "Hecho — Bugfixing"): nivel de reclutamiento equilibrado con el equipo, líneas del mapa con 4 estados, nodo de descanso garantizado en el piso anterior al jefe, XP de caídos, efectos de estado desactivados, menú de iconos, toast de curación, selección de personaje con ficha completa, mapa escalado con `ResizeObserver` para caber sin scroll.
- [x] Los "inicial" (Naruto/Sasuke/Sakura) no elegidos al empezar la run entran en el pool de
  reclutables, así que siempre se puede formar un equipo de 3 aunque no se haya desbloqueado ningún
  logro. **Se reclutan en el nodo `reclutar` (pergamino verde), no en la tienda**: la tienda se
  rediseñó a 3 objetos comprables y ya no recluta a nadie (`candidatosReclutables` en
  `useGameStore.js` es el único sitio donde se arma ese pool, y lo consume el nodo). Ver
  `documentacion/28-nodo-reclutar.md` y `15-tienda.md`.
- [x] Los 3 arcos se juegan en una sola run: al derrotar al jefe final de uno, continúa
  automáticamente con el siguiente (`avanzarSiguienteArco`, `ORDEN_ARCOS` en `useGameStore.js`).
  Derrotar a Pain (`recompensa.finDeLaRun: true`) marca la run como ganada de verdad —
  `GameOverScreen` ya distingue victoria de derrota. Ver `documentacion/20-arcos-encadenados.md`.
  Al superar el jefe de un arco, el equipo se cura y revive por completo (estilo Slay the Spire).
- [x] `PanelObjetos` (mapa): oro + inventario agrupado con hover de descripción/efecto exacto por
  objeto (`ItemHoverCard`); `LeyendaMapa` sustituida por hover en cada nodo del mapa. Mecánica de
  hover extraída a `components/common/HoverTooltip.jsx` (la reutilizan `PersonajeHoverCard`,
  `ItemHoverCard` y el hover de nodo). Ver `documentacion/13-ui-mapa-y-combate.md`.
- [x] Mochila como pantalla propia (`components/Inventory/InventoryScreen.jsx`, `pantalla: 'mochila'`):
  lista + ficha, botón contextual Use/Equip/Unequip y elección de personaje en tarjetas. Sprites de
  objeto en `assets/items/<id>.png`, generados con `scripts/generar-sprites-objetos.py` y usados
  también en tienda, recompensa de mini-jefe y hovers — ver `documentacion/28-mochila.md`.
- [x] Objetos equipables y consumibles con efecto real (ya no solo texto): un hueco de equipo por
  personaje (`instancia.objetoEquipadoId`), solo beneficia a quien lo lleve puesto y vuelve al
  inventario si lo desequipas o reemplazas a ese personaje (`equiparObjeto`/`desequiparObjeto` en
  `useGameStore.js`); `revivirUnaVez` y `curacionPostCombate` ya se disparan de verdad en combate;
  consumibles se usan desde `PanelObjetos` (`usarConsumible`). Ver `documentacion/21-objetos-equipables.md`.
- [x] Sprites de nodo en el mapa (`assets/nodes/*.png`, recortados de `sprite-nodos-mapa.png`) en
  vez de glifos kanji. Entrenador/mini-jefe/jefe todavía reutilizan el sprite de combate + badge de
  rango, a falta de arte por personaje — ver `documentacion/13-ui-mapa-y-combate.md`.
- [x] Fondo de columna central del mapa por arco (`FONDO_COLUMNA`, `assets/map-columns/*.png`), con
  estructura Pokelike: tierra lisa en el centro y vegetación del arco solo en los laterales. Se
  generan con `scripts/generar-columnas-mapa.py` a partir de `map-columns/originales/*.png` (no
  editar los generados a mano, se pisan al regenerar) — ver `documentacion/13-ui-mapa-y-combate.md`.
- [x] Sistema de jutsus automáticos: ataque básico común + barra de jutsu por luchador
  (`engine/combat.js` → `ejecutarAtaque`, `turnosParaCargarJutsu`), con perfil de carga por
  personaje en los JSON. Daño recalibrado dos veces (al partir el ataque en dos, y al unificar el
  básico) y `turnosMaximos` 20 → 30. La ficha de personaje enseña solo el nombre del jutsu y tres
  puntitos de ritmo (`RitmoCarga`), no potencias ni turnos exactos: eso es material de la futura
  enciclopedia (punto 10 del roadmap) — ver `documentacion/29-sistema-de-jutsus-automaticos.md`.
- [x] `scripts/simular-combates.mjs`: el instrumento de balance. Cuatro bloques — nivel real del
  jugador piso a piso, balance por arco, jefes con el equipo de 3 **en cadena**, peso de cada objeto,
  y de dónde viene el poder (niveles/transformación/objeto). Correrlo antes y después de cualquier
  cambio de balance. Se ejecuta con `node scripts/simular-combates.mjs` (lleva un hook de Node para
  poder importar el motor, escrito para Vite, sin pasar por Vitest).
- [x] Pulido visual estilo Pokelike: nodos del mapa con tamaño mínimo garantizado **en pantalla**
  (`tamanoNodo()`, el lienzo se escala y 48 px acababan en 31), apagados con `opacity` en vez de
  filtros (el mapa quedaba negro), hover con mini-zoom + halo y tooltip de solo el título;
  `.elevar-hover` en `index.css` para que tarjetas y botones suban al pasar por encima;
  `PanelObjetos` movido a la columna derecha como rejilla de sprites con hover de una línea;
  `nombrePersonaje` unificado en `components/common/nombres.js` (los jefes reclutados por logro
  salían con el id crudo). Ver `documentacion/13-ui-mapa-y-combate.md`.
- [x] **Rediseño del balance, las 4 fases** (`documentacion/30-sistema-de-pasivas.md`): motor de
  pasivas, transformaciones, objetos y recalibración. La fase 4 encontró que el problema no era la
  curva de stats sino la **economía de XP**: el jugador llegaba a los jefes 5, 10 y 21 niveles por
  encima, y los combates comunes se ganaban al 99% con el HP casi intacto. Recalibrados XP común por
  arco (`xpCombateComun`), XP de jefe, bandas de nivel de los tres arcos, stats de jefe, niveles de
  desbloqueo de las transformaciones y `crecimientoStatsPorNivel` (0,08 → 0,03). El reparto del poder
  pasó de 92/0/8 a ~50/30/20 (niveles/transformación/objetos). Ver
  `documentacion/11-progresion-y-arcos.md` sección "v4".
- [x] `scripts/simular-combates.mjs` es **determinista** (semilla fija): desde que hay pasivas con
  probabilidad, con `Math.random` dos ejecuciones daban 14% y 21% en el mismo combate.
- [x] **Interfaz de combate (punto 2 del roadmap), las 4 fases + rediseño Pokelike + juiciness**: los dos bandos
  en sendas cajas (izquierda tu equipo, derecha el enemigo) con una única `TarjetaLuchador` para
  todos; equipo entero en pantalla (con
  `equipoAlEmpezar` en el resumen del combate, porque el store ya tiene el estado FINAL cuando la
  animación empieza), pasivas visibles cuando saltan (`nombrePasiva`/`duenoDePasiva` en
  `engine/passives.js`), replay **golpe a golpe** en vez de turno a turno con kunai, sacudida y
  número de daño flotante, y sprites por personaje. El registro de texto quedó **solo para
  desarrollo** (`import.meta.env.DEV`): Vite lo elimina del build de producción, no hay que quitarlo
  a mano. La tanda de juiciness añadió estela de HP, telegrafiado del jutsu, ritmo variable por tipo
  de golpe, desplome al caer, entrada deslizante del relevo, números flotantes de daño (por eficacia)
  y de curación, y cartel de subida de nivel. Ver `documentacion/13-ui-mapa-y-combate.md`.
- **Regla del motor que salió de ahí**: el evento de ataque lleva el **estado resuelto**, no los
  deltas (`hpAtacante`, `hpDefensor`, `cargaAtacante`, `cargaDefensor`). Quien reproduce el historial
  no debe deducirlos con aritmética — la carga se pone a cero al lanzar el jutsu y el HP sube con
  `heal_on_kill`. Ya rompió el replay una vez cada uno. Ver `documentacion/09-motor-engine.md`.
- [x] Sprites de personaje (`assets/characters/*.png`, `components/common/characterSprites.js`) y
  proyectiles —kunai para el ataque básico de todos, más el jutsu propio de cada uno—
  (`assets/projectiles/`, `components/common/projectileSprites.js`). Generados con
  `scripts/generar-sprites-personajes.py` y `generar-sprites-proyectiles.py`. **No editar a mano los
  PNG generados**, se pisan al regenerar. Todos salen en un **lienzo común de 96×96** y se pintan a
  múltiplos enteros de él: el pixel art a escalas no enteras duplica unas columnas de píxeles y
  otras no, y con lienzos distintos las proporciones entre personajes salían mal. Lo que sigue faltando por falta de dibujo está junto en
  `documentacion/05-roadmap.md`, sección "Pendiente de arte" — no repartido por los puntos ya
  cerrados.
- [x] **Pantalla de transformación** (`components/Combat/TransformationScreen.jsx`, punto 4 del
  roadmap): carga de chakra con parpadeo de silueta, estallido y luego quietud con el nombre del
  modo y sus pasivas. El store detecta el desbloqueo comparando `obtenerModoActivo` antes y después
  de aplicar la XP (no hay evento de "subir de modo"), y lo manda en el resumen del combate como
  `transformacionesDesbloqueadas`, igual que los logros. Sprites en `assets/transformations/`,
  generados con `scripts/generar-sprites-transformaciones.py`.
- [x] **Nodo de reclutar con rareza y desafío legendario** (punto 3 del roadmap): el pergamino del
  mapa es verde, azul o dorado según `nodo.rareza`, sorteada **al generar el mapa**
  (`elegirRarezaReclutar`, pesos en `poolRarezaReclutar` de cada arco) porque el icono se pinta antes
  de que el jugador elija. Como el motor no sabe de equipo ni de logros, el store le pasa qué rarezas
  tienen candidatos (`generarMapa(arco, { rarezasReclutarDisponibles })`). El dorado **no es una
  elección sino un combate**: se pelea contra el legendario al nivel FIJO del arco
  (`nivelDesafioLegendario`) y solo se recluta al ganar. El jefe y el mini-jefe del arco en curso
  quedan fuera del pool — ganarle al jefe final en un nodo de reclutar habría marcado el arco como
  completado. Tras el playtest: **uno o dos pergaminos por arco** (`colocarNodosDeReclutar`, no salen
  del sorteo por peso — el equipo tiene 3 huecos para toda la run), **solo dos rarezas** (verde =
  común/inicial/raro, dorado = legendario; lo que las separa es cómo se consigue al ninja, no lo bueno
  que sea), el desafío **no suelta el objeto** de su jefe y el legendario entra al **nivel medio** del
  equipo sin bonus de reemplazo. Ver `documentacion/28-nodo-reclutar.md`.
- [x] **El final del combate** (punto 12 del roadmap): `PanelRecompensas` con el oro y el objeto,
  entre el rótulo de victoria y el botón. Viaja en el resumen (`recompensas`) y **no se lee del
  store**: cuando la animación empieza, el store ya tiene el estado final. El objeto solo se anuncia
  si ha entrado de verdad en la mochila — el del mini-jefe tiene su propia pantalla.
  **La XP no se enseña a propósito**: casi cada combate sube un nivel, así que el número no cambia
  ninguna decisión; se ve su consecuencia (cartel de subida de nivel). Se probó con barra de XP y se
  quitó.
- [x] **Tarjetas de personaje con sprite** (puntos 8 y 11 del roadmap): `FichaPersonaje` es la
  **única** tarjeta de personaje del juego (hover del mapa, selección, las tres cartas de reclutar y
  el desafío legendario) — reclutar tenía su propio diseño en paralelo. Sprite grande sobre su suelo,
  rareza en estrellas, afinidad de chakra, stats en lista sin barras, jutsu y objeto equipado; sin
  sección de transformación, que sigue siendo sorpresa. El **panel de equipo del mapa** lleva sprite,
  nombre abreviado (`nombreCorto`), el tipo como etiqueta, el objeto con su sprite y una X, y se
  reordena con **drag and drop** (el clic solo sabía hacer "al frente"). Ver
  `documentacion/22-diseño-tarjeta-de-personaje.md` y `13-ui-mapa-y-combate.md`.
- [x] **Las transformaciones de jefe ya se activan**: sus umbrales estaban por encima del nivel al que
  se pelean (Pain a 90, peleándose a 44) y no se veía ninguna. Bajados a 8/17/24/40, con el
  `statsBase` de los cuatro dividido por los multiplicadores de su propio modo para que el jefe pese
  lo mismo pero parte de su poder venga de la transformación. Test de invariante nuevo — el que había
  solo miraba `characters.json`. Ver `documentacion/11-progresion-y-arcos.md`.
- [x] **Kakashi y los cascabeles** (punto 13 del roadmap): primer legendario **jugable** — hasta ahora
  los legendarios eran solo jefes desbloqueables por logro. Está en `personajesReclutablesIds` del arco
  1 y **solo de ese**, así que su única puerta es el pergamino dorado (el verde acepta
  `comun`/`inicial`/`raro`): eso no hay que programarlo, sale de `RAREZAS_POR_PERGAMINO`. Antes ese
  array estaba vacío y en una **primera run** el pergamino dorado del arco 1 no tenía a nadie que
  ofrecer y degradaba siempre. Añadir personaje y objeto fueron **tres ficheros de datos**, y los
  invariantes que ya existían los validaron solos. Ver `documentacion/11-progresion-y-arcos.md` y
  `28-nodo-reclutar.md`.
- **Regla de medida que salió de ahí — para el siguiente personaje que se añada**: un personaje nuevo
  se calibra por su **PUESTO** entre todos los candidatos a la posición 1 del equipo, jefe a jefe, no
  por un Δ contra la media de tríos. Dos lecturas seguidas dieron conclusiones opuestas y las dos eran
  falsas: la posición 1 vale por sí misma (quien pelea la primera ronda llega con el HP entero) y la
  media arrastra a los mal emparejados de tipo, así que cualquiera bien emparejado saca +20 puntos. Con
  un solo personaje de control tampoco vale: cuela su propio emparejamiento. Y los legendarios **no
  entran en la media del roster** del simulador, porque hay que ganarles un combate para tenerlos.
- [x] **Enciclopedia** (punto 10 del roadmap), que de cara al jugador se llama **"Bingo Book"** (y la
  de logros, **"Missions"**) — los ids y ficheros siguen siendo `enciclopedia`/`logros`, que son claves
  lógicas y no texto de display: `components/Encyclopedia/EncyclopediaScreen.jsx`,
  `pantalla: 'enciclopedia'`, icono 📖 en el menú del mapa. Cuatro secciones (Ninjas, Enemigos,
  Objetos, Chakra) y **solo enseña lo ya visto**: lo no visto sale en silueta negra
  (`filter: brightness(0)`) con "???" y el mensaje de cómo desbloquearlo. Es donde vive por fin lo que
  se fue sacando de las tarjetas — descripción del jutsu, potencia, turnos de carga y qué hace cada
  transformación. Ver `documentacion/32-enciclopedia.md`.
- **El registro de vistos vive en `useAchievementsStore`**, no en `useGameStore`: es meta-progresión y
  un game over habría borrado la enciclopedia entera. `registrarVistos` es **idempotente y no toca el
  estado si no hay novedad** — hay una llamada de red de seguridad en `abrirEnciclopedia` y sin eso
  cada apertura sería un bucle de renders. Un modo se identifica por su ÍNDICE (`naruto_1`) porque no
  tiene id propio en los JSON, con un test de invariante que prohíbe dos modos homónimos en el mismo
  personaje.
- [ ] `guardarRun`/`cargarRun` no están conectados a ningún hook automático todavía (decidido: no hace falta, runs cortas).
- [x] **Pantalla de ajustes** (punto 14): `components/Settings/SettingsScreen.jsx` + `useSettingsStore`
  (store propio, clave propia de `localStorage`). Tema **claro/oscuro**, pantalla completa (mudada desde el
  menú), velocidad de animación ×1/×2/instantánea, saltar la pantalla de transformación y reiniciar la
  meta-progresión. **El engranaje del menú abre por fin lo que dibuja** y el botón `[DEV] Reset progress`
  ya no existe: es una opción de verdad. Ver `documentacion/34-ajustes.md`.
- **El store de ajustes NO toca el DOM**: `data-tema` y `--factor-animacion` los aplica un `useEffect` de
  `App.jsx`. Los tests corren en `environment: 'node'` y no hay `document`. Y el **tema es redefinir
  variables** en `index.css`, no repasar pantallas: las utilidades de Tailwind v4 compilan a `var()`. Desde
  que hay dos temas, `tinta-*` significa *superficie* y `pergamino-*` *contenido* — en modo claro
  `pergamino-100` es tinta oscura.
- **La regla del tema que costó dos intentos** (`documentacion/34-ajustes.md`): un token puede ser un
  **valor** o una **relación**, y una relación no se invierte. `tinta-950 → 900 → 800` no son tres
  oscuros, son *hundido → panel → realzado*; el primer pase invirtió los tres uno a uno y con eso el
  panel salía más oscuro que la página (se hundía en ella en vez de despegarse), `tono="hueco"` más claro
  que el panel que lo contiene y `hover:bg-tinta-800` oscurecía. Se veía como "en claro los bordes no
  resaltan", y el borde no tenía nada que ver: **lo que no separaba era la superficie.**
- **Y las otras dos del tema**: el **marco NO
  se invierte** (`--color-marco` no está en el bloque de modo claro a propósito — es siempre del lado
  opuesto a la superficie, y aclararlo dejaba un tema claro sin bordes, todos los paneles fundidos en la
  misma mancha crema); y **`.escena-oscura`**, para lo que se pinta encima de un DIBUJO —lienzo del mapa,
  columna del menú vertical, pantalla de transformación—, que se queda oscuro en los dos temas porque el
  PNG de debajo no cambia. Se hace redefiniendo los tokens en ese subárbol, no cambiando clases a colores
  fijos.

## Bugs ya resueltos (para no repetirlos)

- **Función de normalización no idempotente** (`normalizarPasivas`): el store normalizaba las pasivas
  del objeto equipado y `crearLuchador` las volvía a normalizar al juntarlas con las del modo. La
  segunda pasada metía `{enganche, objetivo, parametros}` DENTRO de `parametros`, así que la
  `cantidad` declarada quedaba tapada por la del catálogo y **ningún objeto aplicaba su valor real**.
  No saltó en meses porque `simular-combates.mjs` pasa las pasivas en crudo y normaliza una sola vez:
  **el simulador medía unos números y el juego corría con otros**. Si una función transforma datos y
  alguien puede llamarla dos veces sobre lo mismo, tiene que ser idempotente — y si hay un script que
  mide balance, comprobar que construye los objetos por el mismo camino que el juego.
- **Guard numérico en JSX**: `{progresoXp && <barra/>}` con `progresoXp === 0` **pinta un `0`** en
  pantalla. Salió un cero suelto en las tarjetas del primer combate de cada run, donde todos tienen
  0 de XP. Con números hay que comparar (`> 0`) o normalizar a booleano, nunca usar el valor de guard.
- **Comparar ids contra nombres**: `pasivasDelUltimoGolpe` devolvía nombres de pasiva y
  `EtiquetasPasivas` comparaba contra `pasiva.id`. No coincidían nunca, así que la pastilla no se
  encendía jamás y toda la fase de "pasivas visibles" pintaba la lista pero no el momento en que una
  hace algo. Nada falla en un fallo así: solo no pasa nunca nada.
- **`findIndex` para "en qué ronda pelea este personaje"**: devuelve la PRIMERA, y un personaje puede
  pelear dos rondas del mismo combate si revive con la Spare Ninja Headband. En la segunda su tarjeta
  salía muerta mientras él estaba peleando, y se leía como que el objeto estaba roto.
- `resolverTurno` borrado por accidente al introducir `resolverCombateCompleto` — verificar llamadas internas antes de reemplazar una función.
- `EventScreen` sin importar en `App.jsx` — la pantalla nunca se renderizaba, ningún error visible.
- Piso 1 podía generar un nodo de `descanso` (desventaja de partida) — ahora hay un test específico para esto.
- `setState` síncrono dentro del cuerpo de un `useEffect` (React) — el patrón correcto para resetear estado al cambiar una prop/valor es ajustarlo durante el render, no en un efecto (ver `CombatScreen.jsx`, comentarios en el código).
- Nivel de reclutamiento calculado con `calcularNivelPorPiso` (nivel del piso) en vez del nivel del equipo — con la run empezando en 1 solo personaje, daba reclutas muy por debajo del resto (ej. nivel 2). Ahora se usa el nivel del personaje más fuerte del equipo — ver `documentacion/19-seleccion-de-personaje.md`.
- SVG: un `markerEnd` (punta de flecha) que termina justo en el centro de una forma dibujada DESPUÉS (p. ej. un círculo) queda completamente tapado por esa forma, aunque el trazo de la línea sí se vea. Hay que recortar el final del trazo al borde de la forma destino, no al centro — ver el bug de `RuedaChakra` en `documentacion/19-seleccion-de-personaje.md`.
- CSS mal formado que **el build no detecta**: al editar `index.css` quedó texto de comentario fuera
  de su bloque `/* */` y un `*/` suelto. Tailwind no falló — `npm run build` dio OK — pero descartó
  en silencio todas las reglas siguientes, y los tooltips (que se ocultan con `opacity: 0`) salieron
  abiertos por defecto en todas las pantallas. **Que el build pase no quiere decir que el CSS sea
  válido**: si tocas `index.css`, comprueba que la regla llega al bundle
  (`grep -o "mi-clase[^{]*{[^}]*}" dist/assets/*.css`), no solo que compila.
- HP al subir de nivel: `aplicarXpYActualizarHp` sumaba correctamente el incremento de vida, pero
  `_aplicarVictoria` pisaba después el `hpActual` del personaje activo con el HP del final del
  combate, tirando ese incremento. Resultado: el banquillo cobraba la vida del nivel y **el que
  peleaba no** — justo el que gana la XP completa y más sube de nivel. Invisible en pantalla (la
  barra sube de máximo y nada indica que faltan puntos). El patrón del fallo es genérico: **si una
  función devuelve un campo calculado, no lo sobrescribas después con un valor "más fresco"** —
  pásaselo como entrada. Ahora `aplicarXpYActualizarHp` recibe `hpDePartida`.
- XP de personajes caídos: `_aplicarVictoria` comprobaba `p.derrotado` en el momento de ganar el combate, no en el momento en que empezó — un personaje que cae a mitad de una cadena de rondas (rondas encadenadas) y luego gana otro compañero se quedaba sin su XP de esa misma victoria, aunque hubiera participado. Solución: `jugarCombate` toma una foto de quién estaba derrotado ANTES de empezar (`idsYaDerrotadosAntesDelCombate`) y esa foto es la que decide quién se salta la XP, no el estado en vivo al final.
