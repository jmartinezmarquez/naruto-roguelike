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
  sin decisiones del jugador durante la pelea. **Si el activo cae, el siguiente personaje vivo
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
- **Sistema de tipos**: 5 naturalezas de chakra (katon, fuuton, raiton, doton, suiton), tabla en `src/data/types.json`.
- **Generación de mapa**: forma de diamante por piso (`anchoDelPiso`), piso 1 nunca tiene
  `descanso` ni `tienda`, máximo 2 nodos de `tienda` por piso.

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
  `engine/` o `store/`** — hay 74 tests que cubren justo este tipo de regresión.
- **Antes de una respuesta grande y ambigua, plantea primero el plan** en un mensaje corto.

## Estado actual (actualizar tras cada sesión relevante)

- [x] Datos completos, motor puro, store, y las 4 pantallas principales: Mapa, Combate, Evento, Tienda.
- [x] Testing con Vitest — 75 tests en `engine/*.test.js` y `store/*.test.js`. Correr `npm test` antes de dar por bueno cualquier cambio en esas dos carpetas. Requiere `src/test-setup.js` (polyfill de `localStorage`, registrado en `vite.config.js`).
- [x] Balance revisado varias veces con simulaciones reales (ver `documentacion/11-progresion-y-arcos.md`) — sigue pendiente de más ajuste tras playtest (ver nota sobre rondas encadenadas + banquillo).
- [x] Pantalla de Game Over dedicada (`components/GameOver/GameOverScreen.jsx`) — ver `documentacion/17-game-over.md`.
- [x] Sistema de logros completo: motor + persistencia entre runs + pantalla de Logros + notificación al desbloquear (`engine/achievements.js`, `store/useAchievementsStore.js`, `src/data/achievements.json`, `components/Achievements/`) — ver `documentacion/18-sistema-de-logros.md`. Sin la recompensa `desbloquearPersonajeInicial` (depende del punto de abajo).
- [ ] `App.jsx` real con selección de personajes iniciales (hoy arranca fijo) — próximo paso.
- [ ] `guardarRun`/`cargarRun` no están conectados a ningún hook automático todavía.
- [ ] `recompensa.finDeLaRun` (Pain) no lo lee ningún código — falta marcar `runGanada: true`.
- [ ] **Quitar antes de publicar**: botón "[DEV] Reiniciar logros" en `AchievementsScreen.jsx` (llama a `useAchievementsStore.reiniciarLogros()`) — solo para probar el desbloqueo durante desarrollo.

## Bugs ya resueltos (para no repetirlos)

- `resolverTurno` borrado por accidente al introducir `resolverCombateCompleto` — verificar llamadas internas antes de reemplazar una función.
- `EventScreen` sin importar en `App.jsx` — la pantalla nunca se renderizaba, ningún error visible.
- Piso 1 podía generar un nodo de `descanso` (desventaja de partida) — ahora hay un test específico para esto.
- `setState` síncrono dentro del cuerpo de un `useEffect` (React) — el patrón correcto para resetear estado al cambiar una prop/valor es ajustarlo durante el render, no en un efecto (ver `CombatScreen.jsx`, comentarios en el código).
