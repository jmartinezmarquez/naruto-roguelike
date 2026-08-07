# UI: dirección visual, pantalla de Mapa, Combate y Evento

## Dirección visual (tokens en `src/index.css` → `@theme`)

- **Paleta**: fondo tinta casi negra (`tinta-950` `#151210`), paneles pergamino (`pergamino-100` `#EDE3CC`), acento sello rojo (`sello-600` `#B23A2E`) reservado para el nodo actual y elementos de foco. Colores propios por naturaleza de chakra: `katon`, `fuuton`, `raiton`, `doton`, `suiton`.
- **Tipografía**: `Shippori Mincho` (serif japonesa) para títulos, `Zen Kaku Gothic New` para UI/datos. Cargadas vía Google Fonts en `index.css`.
- **Motivo evitado a propósito**: nada de fondo crema + serif + acento terracota (paleta por defecto de IA), ni negro con acento neón — se ancla en estética de tinta/pergamino ninja en su lugar.

## Navegación entre pantallas

El store tiene un campo `pantalla` (`'mapa' | 'combate' | 'evento' | 'tienda' | 'gameover' | 'logros'`), que `App.jsx` usa para decidir qué componente renderizar. `avanzarANodo` cambia de pantalla según el tipo de nodo:
- `combate`/`miniJefe`/`jefe` → `'combate'`.
- `evento` → `'evento'` (elige un evento al azar del pool del arco actual, filtrado por `arcoId`).
- `descanso` → se resuelve automáticamente (cura y revive a todo el equipo), sin cambiar de pantalla — solo deja un aviso breve en el mapa.
- `tienda` → `'tienda'` (ver [15 - Tienda](./15-tienda.md)).
- `reclutamiento` → sin pantalla propia (ya no existe como nodo — ver [14](./14-reclutamiento-y-rareza.md)).

`volverAlMapa()` vuelve a `'mapa'` desde combate/evento/tienda/logros. Si el combate termina con
`runTerminada: true`, el jugador pasa en su lugar a `'gameover'` vía `irAGameOver()` — ver
[17 - Pantalla de Game Over](./17-game-over.md). El botón "Logros" del mapa abre `'logros'` vía
`abrirLogros()` — ver [18 - Sistema de logros](./18-sistema-de-logros.md). `LogroToast` (la
notificación de logro desbloqueado) se monta aparte en `App.jsx`, fuera de este enrutado por
pantalla, para que aparezca sin importar cuál esté activa.

## `components/Map/MapScreen.jsx`

- Lee `mapa`, `nodoActualId`, `arcoActualDatos`, `equipo` del store; usa `avanzarANodo` y `obtenerNodosDisponibles`.
- Layout: pisos apilados de abajo (nivel 1) hacia arriba (jefe), como si se escalara un pergamino. Conexiones dibujadas con `<path>` curvos (SVG), no líneas rectas de diagrama de flujo — el camino ya recorrido se resalta en rojo sello, el resto queda tenue.
- Nodos: círculo con glifo kanji por tipo (combate/evento/reclutamiento/tienda/descanso), color según tipo; el nodo de jefe usa un cuadrado con borde doble en vez de círculo, para diferenciarlo sin depender de un asset externo.
- Nodos no alcanzables desde la posición actual aparecen atenuados y no son clicables.
- **Tira de HP del equipo** (nuevo): muestra cada personaje con nivel, barra de HP real (vía el selector `obtenerHpMaximo` del store) y si está derrotado — necesario ahora que el HP persiste entre combates, para que el jugador sepa cuándo curarse.
- Aviso temporal para nodos sin pantalla implementada todavía (tienda/reclutamiento), y aviso de "equipo curado" tras un nodo de descanso.

## `components/Combat/CombatScreen.jsx`

- Lee `ultimoResultadoCombate` del store (resumen enriquecido: nombres, HP máximo, modo activo).
- Reproduce `historial` turno a turno con auto-avance (900ms/turno), reconstruyendo el HP de cada lado restando el daño acumulado de los turnos ya revelados. Botón "Saltar animación".
- Barras de HP con color según % restante (`fuuton` >50%, `raiton` 20-50%, `sello` <20%).
- Al completarse: banner de Victoria/Derrota y botón "Continuar" → `volverAlMapa()`. Si `runTerminada` es `true`, el botón dice "Ver resultado" y navega a `GameOverScreen` en su lugar (ver [17](./17-game-over.md)).

## `components/Event/EventScreen.jsx` (nuevo)

- Lee `eventoActual` del store (`{ titulo, descripcion, elecciones }`) y `resolverEventoEleccion`.
- Muestra título, descripción, y un botón por elección — al pulsar una, el store aplica el efecto y vuelve al mapa. Sin animación, es una pantalla de decisión simple al estilo Slay the Spire.

## Cambio en `jugarCombate` (store): resumen enriquecido

Antes, `ultimoResultadoCombate` era el resultado crudo del motor (`{ historial, ganadorId, turnosUsados }`), con solo IDs. Ahora `jugarCombate` construye un resumen con `jugador`/`enemigo` (`{ id, nombre, hpMaximo, hpFinal, modoActivoNombre }`) además del historial. El motor (`engine/combat.js`) no cambió — esto es una capa de presentación añadida en el store.

## `App.jsx` (temporal)

El `App.jsx` actual solo llama a `iniciarRun` con el equipo inicial fijo y alterna entre `MapScreen`/`CombatScreen`/`EventScreen` según `pantalla`, para poder probar el flujo. Se sustituirá por un flujo real (pantalla de selección de personajes iniciales → mapa → ...) cuando se construya esa pantalla.
