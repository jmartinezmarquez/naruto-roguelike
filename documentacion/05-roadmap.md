# Roadmap

## Hecho

- [x] Definición de concepto y referencias (Pokelike / Slay the Spire).
- [x] Decisión de temática: Naruto, arco tutorial/chunin, Haku mini-jefe, Gaara jefe final.
- [x] Diseño del sistema de tipos (naturalezas de chakra).
- [x] Diseño de personajes (stats, jutsu, modo) — 12 personajes + 2 jefes.
- [x] Scaffolding inicial del proyecto (Vite + React + Zustand + Tailwind v4).
- [x] JSON de datos: `types.json`, `characters.json`, `enemies.json`, `common-enemies.json`, `items.json`, `config.json`, `arcs/tutorial-chunin.json`, `events.json`.

## Próximos pasos (en orden sugerido)

1. **Motor de reglas en JS puro** — funciones `calcularDano`, `resolverTurnoCombate`, `subirNivel`, que lean los JSON. Sin React todavía, testeable desde Node.
2. **Gestión de estado global** — store de Zustand con el estado de la run (mapa, equipo, inventario, nodo actual).
3. **Generador de mapa** — algoritmo de grafo dirigido por capas que lea `arcs/tutorial-chunin.json`.
4. **Pantallas mínimas** — Mapa, Combate, Evento, Equipo/Inventario.
5. **Persistencia local** — guardar la run en curso con `localStorage`.
6. **Playtest interno del MVP** y ajuste de balance (stats, curva de XP, pesos de nodos).

## Backlog (post-MVP)

- Arcos adicionales (fuera del tutorial/chunin).
- Modo Nuzlocke.
- Sistema de cuentas / guardado remoto.
- Arte propio (sustituir placeholders).
