# UI: dirección visual y pantalla de Mapa

## Dirección visual (tokens en `src/index.css` → `@theme`)

- **Paleta**: fondo tinta casi negra (`tinta-950` `#151210`), paneles pergamino (`pergamino-100` `#EDE3CC`), acento sello rojo (`sello-600` `#B23A2E`) reservado para el nodo actual y elementos de foco. Colores propios por naturaleza de chakra: `katon`, `fuuton`, `raiton`, `doton`, `suiton`.
- **Tipografía**: `Shippori Mincho` (serif japonesa) para títulos, `Zen Kaku Gothic New` para UI/datos. Cargadas vía Google Fonts en `index.css`.
- **Motivo evitado a propósito**: nada de fondo crema + serif + acento terracota (paleta por defecto de IA), ni negro con acento neón — se ancla en estética de tinta/pergamino ninja en su lugar.

## `components/Map/MapScreen.jsx`

- Lee `mapa`, `nodoActualId`, `arcoActualDatos` del store; usa `avanzarANodo` y `obtenerNodosDisponibles`.
- Layout: pisos apilados de abajo (nivel 1) hacia arriba (jefe), como si se escalara un pergamino. Conexiones dibujadas con `<path>` curvos (SVG), no líneas rectas de diagrama de flujo — el camino ya recorrido se resalta en rojo sello, el resto queda tenue.
- Nodos: círculo con glifo kanji por tipo (combate/evento/reclutamiento/tienda/descanso), color según tipo; el nodo de jefe usa un cuadrado con borde doble en vez de círculo, para diferenciarlo sin depender de un asset externo.
- Nodos no alcanzables desde la posición actual aparecen atenuados y no son clicables.

## Flujo actual (parcial)

Pulsar un nodo llama a `avanzarANodo`, que lo marca visitado y, si es de tipo `combate`/`miniJefe`/`jefe`, resuelve el combate automáticamente vía `jugarCombate` — pero **todavía no hay pantalla de Combate** que muestre el resultado (`ultimoResultadoCombate` del store), así que ahora mismo el combate ocurre "a ciegas". Eventos/tienda/descanso/reclutamiento tampoco tienen pantalla propia aún.

## `App.jsx` (temporal)

El `App.jsx` actual solo llama a `iniciarRun` con el equipo inicial fijo y renderiza `MapScreen`, para poder probar el mapa visualmente. Se sustituirá por un flujo real (pantalla de selección de personajes iniciales → mapa → combate/evento → ...) cuando se construyan las demás pantallas.