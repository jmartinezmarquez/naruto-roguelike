# UI: dirección visual, pantalla de Mapa y pantalla de Combate

## Dirección visual (tokens en `src/index.css` → `@theme`)

- **Paleta**: fondo tinta casi negra (`tinta-950` `#151210`), paneles pergamino (`pergamino-100` `#EDE3CC`), acento sello rojo (`sello-600` `#B23A2E`) reservado para el nodo actual y elementos de foco. Colores propios por naturaleza de chakra: `katon`, `fuuton`, `raiton`, `doton`, `suiton`.
- **Tipografía**: `Shippori Mincho` (serif japonesa) para títulos, `Zen Kaku Gothic New` para UI/datos. Cargadas vía Google Fonts en `index.css`.
- **Motivo evitado a propósito**: nada de fondo crema + serif + acento terracota (paleta por defecto de IA), ni negro con acento neón — se ancla en estética de tinta/pergamino ninja en su lugar.

## `components/Map/MapScreen.jsx`

- Lee `mapa`, `nodoActualId`, `arcoActualDatos` del store; usa `avanzarANodo` y `obtenerNodosDisponibles`.
- Layout: pisos apilados de abajo (nivel 1) hacia arriba (jefe), como si se escalara un pergamino. Conexiones dibujadas con `<path>` curvos (SVG), no líneas rectas de diagrama de flujo — el camino ya recorrido se resalta en rojo sello, el resto queda tenue.
- Nodos: círculo con glifo kanji por tipo (combate/evento/reclutamiento/tienda/descanso), color según tipo; el nodo de jefe usa un cuadrado con borde doble en vez de círculo, para diferenciarlo sin depender de un asset externo.
- Nodos no alcanzables desde la posición actual aparecen atenuados y no son clicables.

## Navegación entre pantallas

El store tiene un campo `pantalla` (`'mapa' | 'combate'`), que `App.jsx` usa para decidir qué componente renderizar. `avanzarANodo` cambia a `'combate'` cuando el nodo resuelve un enemigo; `volverAlMapa()` (llamado desde el botón "Continuar" de `CombatScreen`) vuelve a `'mapa'`. Es deliberadamente simple (sin router) porque solo hay 2 pantallas por ahora — cuando se añadan Evento/Tienda/Descanso/Reclutamiento, este campo seguirá bastando mientras no haga falta navegación con historial/atrás.

## `components/Combat/CombatScreen.jsx`

- Lee `ultimoResultadoCombate` del store (ahora un resumen enriquecido: nombres, HP máximo, modo activo — no solo IDs, ver más abajo).
- Reproduce `historial` turno a turno con auto-avance (900ms/turno), reconstruyendo el HP de cada lado restando el daño acumulado de los turnos ya revelados — no salta directo al HP final. Botón "Saltar animación" para revelarlo todo de golpe.
- Barras de HP con color según % restante (`fuuton` >50%, `raiton` 20-50%, `sello` <20%).
- Al completarse la animación: banner de Victoria/Derrota y botón "Continuar" → `volverAlMapa()`. Si `runTerminada` es `true` (equipo completo caído), no se ofrece continuar — mensaje de fin de run en su lugar (sin pantalla de Game Over dedicada todavía).

## Cambio en `jugarCombate` (store): resumen enriquecido

Antes, `ultimoResultadoCombate` era el resultado crudo del motor (`{ historial, ganadorId, turnosUsados }`), con solo IDs — insuficiente para que la UI muestre nombres o barras de HP. Ahora `jugarCombate` construye un resumen con `jugador`/`enemigo` (`{ id, nombre, hpMaximo, hpFinal, modoActivoNombre }`) además del historial. El motor (`engine/combat.js`) no cambió — esto es una capa de presentación añadida en el store.

## `App.jsx` (temporal)

El `App.jsx` actual solo llama a `iniciarRun` con el equipo inicial fijo y renderiza `MapScreen`, para poder probar el mapa visualmente. Se sustituirá por un flujo real (pantalla de selección de personajes iniciales → mapa → combate/evento → ...) cuando se construyan las demás pantallas.
