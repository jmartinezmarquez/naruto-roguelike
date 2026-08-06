# Naruto Roguelike — contexto del proyecto

Roguelike de mapa ramificado inspirado en Pokelike/Slay the Spire, temática Naruto.
MVP con 3 arcos jugados en una sola run continua, nivel 1 a 100:
1. País de las Olas (nivel ~1-15) — mini-jefe Haku, jefe final Zabuza.
2. Examen Chunin (nivel ~16-55) — mini-jefe Kabuto, jefe final Gaara.
3. Invasión de Pain (nivel ~56-100, licencia creativa) — mini-jefe Camino Animal de Pain, jefe final Pain (Camino Deva).
Detalle completo: `documentacion/11-progresion-y-arcos.md`.

Documentación completa y detallada en `documentacion/` — consulta esos archivos cuando
necesites contexto de diseño que no esté en el código. Índice: `documentacion/00-indice.md`.

## Stack

- React (Vite) + Zustand (estado global) + Tailwind CSS v4 (vía `@tailwindcss/vite`, sin `tailwind.config.js`)
- Sistema operativo de desarrollo: **Windows**. Todos los comandos de terminal deben ser CMD/PowerShell, no sintaxis Unix.

## Estructura de carpetas

```
src/
├── data/        → JSON de contenido (personajes, tipos, arcos, eventos, items, config)
├── engine/      → lógica pura del juego, SIN imports de React ni del store
├── store/       → estado global (Zustand)
├── components/  → UI, organizada por área (Map/, Combat/, Events/, Team/)
└── utils/
```

Regla estricta: `engine/` nunca importa de `react` ni de `store/`. Son funciones puras
que reciben datos y devuelven datos nuevos. Detalle en `documentacion/09-motor-engine.md`.

## Reglas de diseño clave

- **Motor agnóstico del contenido**: nada en `engine/` debe tener referencias hardcodeadas
  a Naruto, a "pais-de-las-olas", ni a ningún personaje o arco concreto. Todo el contenido
  vive en `src/data/*.json`. Ver `documentacion/02-diseno-de-juego.md`.
- **Combate**: automático, 1 vs 1 (personaje en posición 1 del equipo del jugador contra
  el enemigo del nodo), sin decisiones del jugador durante la pelea — cada personaje tiene
  un único jutsu fijo. Ver `documentacion/09-motor-engine.md`.
- **Modos/transformaciones**: array `modos` (0 a 2 tiers), multiplican estadísticas pero nunca
  cambian el jutsu del personaje. El motor activa siempre el de mayor `nivelDesbloqueo`
  disponible (`obtenerModoActivo` en `engine/leveling.js`), calculado internamente por
  `crearLuchador` — nunca hay que decidirlo por fuera, y nunca cambia a mitad de combate.
- **Sistema de tipos**: 5 naturalezas de chakra (katon, fuuton, raiton, doton, suiton) con
  ciclo de eficacias fijo, tabla en `src/data/types.json`.

## Convenciones de Git

- Ramas: `tipo/descripcion-en-kebab-case` (sin paréntesis, sin espacios, sin `+`).
- Commits: `tipo(alcance): descripción en presente` (tipos: feat, fix, data, docs, style,
  refactor, chore). Un commit = un cambio lógico coherente. Detalle en
  `documentacion/08-git-y-github.md`.

## Eficiencia de contexto (para sesiones largas, gastar menos tokens)

- **Antes de leer un archivo entero, usa `grep`/búsqueda dirigida** para encontrar la función o sección concreta que necesitas. No releas `useGameStore.js` completo para un cambio de 3 líneas.
- **Consulta primero `documentacion/00-indice.md`** para saber qué documento cubre el tema antes de explorar el código a ciegas — la documentación ya explica el porqué de casi todas las decisiones, evita releer el código para inferirlo.
- **Agrupa cambios relacionados en menos operaciones** en vez de editar el mismo archivo muchas veces seguidas para cambios pequeños.
- **No repitas explicaciones de diseño ya cubiertas en `documentacion/`** — enlaza al documento en vez de reexplicar (ej. "ver 09-motor-engine.md" en vez de reescribir cómo funciona `crearLuchador`).
- **Verifica llamadas internas antes de reemplazar una función** con `str_replace`/similar — ya hemos tenido bugs reales por borrar una función que otra seguía llamando (`resolverTurno`, ver nota en `09-motor-engine.md`). Un `grep` del nombre de la función antes de tocarla es más barato que el bug después.
- **Antes de dar una respuesta larga con muchos archivos, plantea primero el plan en un mensaje corto** si el cambio es grande o ambiguo, en vez de generar todo y corregir después.



- [x] Datos completos: types, characters (14 personajes, curva de XP corregida y validada por simulación), enemies (6 jefes/minijefes, balance corregido con ratios fijos), common-enemies, items, config (nivelMaximo 100, porcentajeXpBanquillo 0.4), events, arcs/{pais-de-las-olas, examen-chunin, invasion-de-pain}
- [x] `engine/leveling.js`, `engine/combat.js` (combate automático 1v1, `obtenerModoActivo` soporta hasta 2 tiers)
- [x] `store/useGameStore.js` (equipo, oro, inventario, `jugarCombate`, `reclutarPersonaje(id, nivelInicial)`, reparto de XP con banquillo, persistencia en localStorage)
- [x] `engine/mapGenerator.js` (`generarMapa`, `resolverEnemigoDeNodo`, `calcularNivelPorPiso`)
- [x] `components/Map/MapScreen.jsx` — pantalla de Mapa con dirección visual propia (tinta/pergamino) y tira de HP del equipo. Store ampliado con `mapa`, `avanzarANodo`, `obtenerNodosDisponibles`, `obtenerHpMaximo`.
- [x] `components/Combat/CombatScreen.jsx` — animación turno a turno del combate.
- [x] `components/Event/EventScreen.jsx` — 12 eventos canónicos (4 por arco), sin combate. Nodo de descanso auto-resuelto (cura+revive todo el equipo).
- [x] HP persistente entre combates (`equipo[].hpActual`), buffs temporales de evento, bonificaciones permanentes de personaje.
- [x] Diseño (sin implementar): reclutamiento vía tienda con precio por rareza, jefes/minijefes desbloqueables como reclutables por logro. Ver `documentacion/14-reclutamiento-y-rareza.md`.
- [ ] Pantalla de Tienda (objetos + reclutamiento) — próximo paso, diseño ya cerrado.
- [ ] Pantalla de Game Over dedicada.
- [ ] `App.jsx` real (el actual es temporal, solo para probar Mapa/Combate/Evento).

Diseños documentados pero NO implementados: sistema de logros/meta-progresión
(`project-data/achievements-DISEÑO.json`), cadena de jefes para combates de grupo
(`documentacion/12-cadena-de-jefes.md`).

Roadmap completo en `documentacion/05-roadmap.md`.
