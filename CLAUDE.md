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

## Estado actual (actualizar tras cada sesión relevante)

- [x] Datos completos: types, characters (14 personajes, curva de XP corregida y validada por simulación), enemies (6 jefes/minijefes, balance corregido con ratios fijos), common-enemies, items, config (nivelMaximo 100, porcentajeXpBanquillo 0.4), events, arcs/{pais-de-las-olas, examen-chunin, invasion-de-pain}
- [x] `engine/leveling.js`, `engine/combat.js` (combate automático 1v1, `obtenerModoActivo` soporta hasta 2 tiers)
- [x] `store/useGameStore.js` (equipo, oro, inventario, `jugarCombate`, `reclutarPersonaje(id, nivelInicial)`, reparto de XP con banquillo, persistencia en localStorage)
- [x] `engine/mapGenerator.js` (`generarMapa`, `resolverEnemigoDeNodo`, `calcularNivelPorPiso`)
- [x] `components/Map/MapScreen.jsx` — pantalla de Mapa con dirección visual propia (tinta/pergamino). Store ampliado con `mapa`, `avanzarANodo`, `obtenerNodosDisponibles`.
- [ ] Pantalla de Combate — próximo paso. `avanzarANodo` ya resuelve el combate en el store, pero no hay UI que muestre `ultimoResultadoCombate` todavía.
- [ ] Pantallas de Evento, Tienda, Descanso, Reclutamiento, Equipo/Inventario.
- [ ] `App.jsx` real (el actual es temporal, solo para probar el mapa).

Diseños documentados pero NO implementados: sistema de logros/meta-progresión
(`project-data/achievements-DISEÑO.json`), cadena de jefes para combates de grupo
(`documentacion/12-cadena-de-jefes.md`).

Roadmap completo en `documentacion/05-roadmap.md`.