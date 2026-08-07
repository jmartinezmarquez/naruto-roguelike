# Pantalla de Game Over (`components/GameOver/GameOverScreen.jsx`)

## Por qué existía el hueco

Hasta ahora, cuando todo el equipo caía (`runTerminada: true`), `CombatScreen` mostraba un simple
mensaje ("Todo tu equipo ha caído. La run ha terminado.") y un botón "Nueva Run" **dentro** de la
propia pantalla de combate, sin mostrar el estado final del equipo ni navegar a ningún sitio.

## Flujo actual

1. `jugarCombate` (store) detecta que no queda ningún personaje vivo y pone `runTerminada: true`.
   `CombatScreen` sigue mostrando la animación de la última ronda con normalidad — esto no cambió.
2. Al terminar la animación, `CombatScreen` decide entre 3 botones según el resultado:
   `runTerminada` (derrota total O victoria real sobre Pain) → **"Ver resultado"** → `irAGameOver()`
   → `pantalla: 'gameover'`; `resultado.arcoCompletado` sin `runTerminada` (jefe de un arco
   intermedio) → **"Continuar al siguiente arco"** → `avanzarSiguienteArco()`; cualquier otro
   combate → **"Continuar"** → `volverAlMapa()` de siempre. `App.jsx` renderiza `<GameOverScreen />`
   cuando la pantalla es `'gameover'`. Ver [20 - Arcos encadenados](./20-arcos-encadenados.md).
3. `GameOverScreen` lee `equipo`, `oro`, `runGanada`, `arcoActualDatos`, `mapa`/`nodoActualId` (para
   el piso alcanzado) y `obtenerHpMaximo` del store, y muestra:
   - Arco y piso donde cayó el equipo (`"en {arco.nombre}, piso X de Y"`) — solo si `runGanada` es
     `false`; si es `true` (venció a Pain), muestra un mensaje de victoria en su lugar.
   - Una tarjeta por personaje: nombre, nivel, "Caído"/"En pie" (ya no siempre "Caído" — con
     `runGanada` puede haber supervivientes), HP.
   - Oro acumulado en la run.
   - Botón **"Nueva Run"** → `reiniciarRun()` (sin cambios: pone `mapa: null`, lo que hace que el
     `useEffect` de `App.jsx` arranque una run nueva automáticamente).

**`runTerminada` ya no significa "derrota"**, significa "la run se acabó" — puede ser por derrota
(`runGanada: false`, cuando cae todo el equipo) o por victoria real (`runGanada: true`, al derrotar
a Pain en el tercer arco) — ver [20 - Arcos encadenados](./20-arcos-encadenados.md).

## Decisiones de diseño

- **No se reemplaza la animación de combate final** — el jugador sigue viendo cómo cae su último
  personaje antes de pasar al resumen. Game Over es una pantalla aparte a la que se navega
  explícitamente, no un estado dentro de `CombatScreen`.
- **Reutiliza `obtenerHpMaximo` y el patrón visual del panel de equipo** de `MapScreen.jsx`
  (`PanelEquipo`) en vez de inventar un componente nuevo desde cero.
- **`pantalla` ahora acepta `'gameover'`** además de `'mapa' | 'combate' | 'evento' | 'tienda'`.

## Testing

`store/useGameStore.test.js` — sección `irAGameOver`: comprueba que la pantalla cambia a
`'gameover'` tras una derrota total, y que `reiniciarRun()` tras un game over deja `mapa`/`pantalla`
listos para una run nueva. No hay tests de componentes React todavía (ver
[16 - Testing](./16-testing.md)), así que `GameOverScreen.jsx` en sí no tiene test propio, solo la
lógica de store que lo alimenta.
