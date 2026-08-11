# Naruto Roguelike — contexto del proyecto

Roguelike de mapa ramificado inspirado en Pokelike/Slay the Spire, temática Naruto.
MVP con 3 arcos jugados en una sola run continua, nivel 1 a 100:
1. País de las Olas — mini-jefe Haku (nivel fijo 3), jefe final Zabuza (nivel fijo 4).
2. Examen Chunin — mini-jefe Kabuto (22), jefe final Gaara (24).
3. Invasión de Pain (licencia creativa) — mini-jefe Camino Animal de Pain (48), jefe final Pain, Camino Deva (49).

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
  antes de tocar esto, para no repetir el ciclo de errores.
- **Modos/transformaciones**: array `modos` (0 a 2 tiers), se activa siempre el de mayor
  `nivelDesbloqueo` disponible, calculado internamente por `crearLuchador` — nunca cambia a mitad
  de combate.
- **Pasivas**: catálogo de efectos con nombre (`engine/passives.js` + textos en
  `src/data/passives.json`) que cambian **reglas** del combate en vez de estadísticas. Modos y
  objetos los declaran por id y comparten implementación. Un id que no esté en el catálogo **revienta**
  al crear el luchador, no se ignora. Las declaran los 31 modos y los 10 objetos (fases 1-3 de las 4
  del rediseño de balance). Ver `documentacion/30-sistema-de-pasivas.md`.
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
  `engine/` o `store/`** — hay 153 tests que cubren justo este tipo de regresión.
- **Antes de una respuesta grande y ambigua, plantea primero el plan** en un mensaje corto.

## Estado actual (actualizar tras cada sesión relevante)

- [x] Datos completos, motor puro, store, y las 4 pantallas principales: Mapa, Combate, Evento, Tienda.
- [x] Testing con Vitest — 153 tests en `engine/*.test.js` y `store/*.test.js`. Correr `npm test` antes de dar por bueno cualquier cambio en esas dos carpetas. Requiere `src/test-setup.js` (polyfill de `localStorage`, registrado en `vite.config.js`).
- [x] Balance revisado varias veces con simulaciones reales (ver `documentacion/11-progresion-y-arcos.md`) — sigue pendiente de más ajuste tras playtest (ver nota sobre rondas encadenadas + banquillo).
- [x] Pantalla de Game Over dedicada (`components/GameOver/GameOverScreen.jsx`) — ver `documentacion/17-game-over.md`.
- [x] Sistema de logros completo, incluida la recompensa `desbloquearPersonajeInicial` (`engine/achievements.js`, `store/useAchievementsStore.js`, `src/data/achievements.json`, `components/Achievements/`) — ver `documentacion/18-sistema-de-logros.md`.
- [x] `App.jsx` real: `CharacterSelectScreen` (elige 1 personaje inicial, roster = "inicial" + desbloqueados por logro; el resto del equipo se completa reclutando) sustituye al arranque fijo con Naruto/Sasuke/Sakura — ver `documentacion/19-seleccion-de-personaje.md`.
- [x] Reclutar con el equipo lleno deja elegir a quién reemplazar (`ShopScreen.jsx` → `ElegirReemplazo`, `reclutarPersonaje(id, nivel, idAReemplazar)`) — ver `documentacion/19-seleccion-de-personaje.md`.
- [x] Tarjeta de hover con stats/tipo/jutsu/HP en todo sitio donde se muestra un personaje (`components/common/PersonajeHoverCard.jsx` / `FichaPersonaje`), y pictograma del ciclo de ventaja de chakra en el mapa (`RuedaChakra`).
- [x] Ronda de bugfixing/ajustes de diseño (ver `documentacion/05-roadmap.md`, sección "Hecho — Bugfixing"): nivel de reclutamiento equilibrado con el equipo, líneas del mapa con 4 estados, nodo de descanso garantizado en el piso anterior al jefe, XP de caídos, efectos de estado desactivados, menú de iconos, toast de curación, selección de personaje con ficha completa, mapa escalado con `ResizeObserver` para caber sin scroll.
- [x] Los "inicial" (Naruto/Sasuke/Sakura) no elegidos al empezar la run se pueden reclutar en
  cualquier tienda, incluida la del primer arco (que no tiene `personajesReclutablesIds` propio) —
  así siempre se puede formar un equipo de 3 aunque no se haya desbloqueado ningún logro todavía.
  Ver `documentacion/15-tienda.md`.
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
- [x] `scripts/simular-combates.mjs`: simula los combates de los 3 arcos y saca turnos, victorias y
  jutsus lanzados. Correrlo antes y después de cualquier cambio de balance. Se ejecuta con
  `node scripts/simular-combates.mjs` (lleva un hook de Node para poder importar el motor, escrito
  para Vite, sin pasar por Vitest).
- [x] Pulido visual estilo Pokelike: nodos del mapa con tamaño mínimo garantizado **en pantalla**
  (`tamanoNodo()`, el lienzo se escala y 48 px acababan en 31), apagados con `opacity` en vez de
  filtros (el mapa quedaba negro), hover con mini-zoom + halo y tooltip de solo el título;
  `.elevar-hover` en `index.css` para que tarjetas y botones suban al pasar por encima;
  `PanelObjetos` movido a la columna derecha como rejilla de sprites con hover de una línea;
  `nombrePersonaje` unificado en `components/common/nombres.js` (los jefes reclutados por logro
  salían con el id crudo). Ver `documentacion/13-ui-mapa-y-combate.md`.
- [x] **Rediseño del balance, fases 1-3 de 4** (`documentacion/30-sistema-de-pasivas.md`): motor de
  pasivas, transformaciones y objetos. Falta la **fase 4** (curva de niveles + recalibración de los
  3 arcos). El arco 3 quedó más fácil al hacer alcanzables los segundos modos: es una diferencia
  real que absorbe la fase 4, no ruido. **Lo primero de la fase 4**: `simular-combates.mjs` no
  equipa objetos, así que hoy es ciego a la fase 3 y no puede comprobar el reparto 40/30/30.
- [x] `scripts/simular-combates.mjs` es **determinista** (semilla fija): desde que hay pasivas con
  probabilidad, con `Math.random` dos ejecuciones daban 14% y 21% en el mismo combate.
- [ ] `guardarRun`/`cargarRun` no están conectados a ningún hook automático todavía (decidido: no hace falta, runs cortas).
- [ ] **Quitar antes de publicar**: botón "[DEV] Reiniciar logros" en `AchievementsScreen.jsx` (llama a `useAchievementsStore.reiniciarLogros()`) — solo para probar el desbloqueo durante desarrollo.

## Bugs ya resueltos (para no repetirlos)

- `resolverTurno` borrado por accidente al introducir `resolverCombateCompleto` — verificar llamadas internas antes de reemplazar una función.
- `EventScreen` sin importar en `App.jsx` — la pantalla nunca se renderizaba, ningún error visible.
- Piso 1 podía generar un nodo de `descanso` (desventaja de partida) — ahora hay un test específico para esto.
- `setState` síncrono dentro del cuerpo de un `useEffect` (React) — el patrón correcto para resetear estado al cambiar una prop/valor es ajustarlo durante el render, no en un efecto (ver `CombatScreen.jsx`, comentarios en el código).
- Nivel de reclutamiento calculado con `calcularNivelPorPiso` (nivel del piso) en vez del nivel del equipo — con la run empezando en 1 solo personaje, daba reclutas muy por debajo del resto (ej. nivel 2). Ahora se usa el nivel del personaje más fuerte del equipo — ver `documentacion/19-seleccion-de-personaje.md`.
- SVG: un `markerEnd` (punta de flecha) que termina justo en el centro de una forma dibujada DESPUÉS (p. ej. un círculo) queda completamente tapado por esa forma, aunque el trazo de la línea sí se vea. Hay que recortar el final del trazo al borde de la forma destino, no al centro — ver el bug de `RuedaChakra` en `documentacion/19-seleccion-de-personaje.md`.
- XP de personajes caídos: `_aplicarVictoria` comprobaba `p.derrotado` en el momento de ganar el combate, no en el momento en que empezó — un personaje que cae a mitad de una cadena de rondas (rondas encadenadas) y luego gana otro compañero se quedaba sin su XP de esa misma victoria, aunque hubiera participado. Solución: `jugarCombate` toma una foto de quién estaba derrotado ANTES de empezar (`idsYaDerrotadosAntesDelCombate`) y esa foto es la que decide quién se salta la XP, no el estado en vivo al final.
