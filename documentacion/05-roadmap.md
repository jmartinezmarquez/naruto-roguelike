# Roadmap

## Hecho

- [x] Definición de concepto y referencias (Pokelike / Slay the Spire).
- [x] Decisión de temática: Naruto, arco tutorial/chunin, Haku mini-jefe, Gaara jefe final.
- [x] Diseño del sistema de tipos (naturalezas de chakra).
- [x] Diseño de personajes (stats, jutsu, modo) — 12 personajes + 2 jefes.
- [x] Scaffolding inicial del proyecto (Vite + React + Zustand + Tailwind v4).
- [x] JSON de datos: `types.json`, `characters.json`, `enemies.json`, `common-enemies.json`, `items.json`, `config.json`, `arcs/tutorial-chunin.json`, `events.json`.
- [x] Motor de reglas en JS puro: `engine/leveling.js`, `engine/combat.js` (combate 1vs1 automático — ver [09](./09-motor-engine.md)).
- [x] `store/useGameStore.js` — estado global de la run y orquestación del combate.
- [x] `engine/mapGenerator.js` — generación de grafo por pisos y resolución de enemigo por nodo.
- [x] Progresión de nivel definida para los 3 arcos del MVP (1→15→55→100), esquema `modos` extendido a 2 transformaciones por personaje. Ver [11 - Progresión y arcos](./11-progresion-y-arcos.md).
- [x] Bug de balance de jefes corregido (doble escalado) — ratios fijos sobre personaje medio. Niveles de transformación reajustados por arco de reclutamiento. Fix de nivel inicial al reclutar tardíamente.
- [x] Diseño (sin implementar) del sistema de logros/meta-progresión y de la cadena de jefes (combates de grupo sin romper el motor 1v1) — ver [12](./12-cadena-de-jefes.md).
- [x] Curva de XP validada por simulación real (la original era matemáticamente inviable: pedía 24,8M de XP para un presupuesto de ~5.082 XP en toda la run) y corregida. Añadido reparto de XP con el banquillo (40%) para que los personajes no activos también progresen.

## Próximos pasos (en orden sugerido)

1. **Pantallas mínimas** — Mapa, Combate, Evento, Equipo/Inventario. El store necesita ampliarse para guardar el `mapa` generado y el `nodoActualId` real (avanzar de nodo, marcar visitado/completado).
2. **Conectar `guardarRun`/`cargarRun`** a un hook de autoguardado tras cada nodo.
3. **Playtest interno del MVP** y ajuste de balance (stats, curva de XP, pesos de nodos, nivel por piso).

## Backlog (post-MVP)

- Sistema de logros/meta-progresión (esquema diseñado en `achievements-DISEÑO.json`, no implementado).
- Cadena de jefes / combates de grupo (diseño en [12](./12-cadena-de-jefes.md), pendiente de conectar al flujo real de nodos).
- Interpretar `recompensa.finDeLaRun` (Pain) en `useGameStore.js` para marcar `runGanada: true` — hoy `runTerminada` solo cubre la derrota.
- Modo Nuzlocke.
- Sistema de cuentas / guardado remoto.
- Arte propio (sustituir placeholders).