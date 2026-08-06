# Estructura de datos (JSON)

Ubicación: `src/data/`

## `types.json`

Define los 5 elementos, sus nombres visibles y la matriz de eficacias (`tablaEficacias[atacante][defensor] = multiplicador`).

## `characters.json`

Array `personajes`, cada uno con:
- `id`, `nombre`, `tipo`, `rareza`
- `statsBase`: `{ hp, ataque, defensa, velocidad }`
- `curvaXp`: `{ xpParaSiguienteNivel, crecimiento }`
- `jutsu`: `{ nombre, descripcion, danoBase, efectoEstado: { stat, objetivo, cantidad, duracionTurnos } }`
- `modo`: `{ nombre, nivelDesbloqueo, multiplicadores: { ataque, defensa, velocidad, hp } }`

## `enemies.json`

Array `jefesDelArco` con la misma forma que un personaje pero con `rol` (`miniJefe` / `jefeFinal`) y `recompensa`. Los enemigos genéricos de nodos de combate normal no están definidos aquí (pendiente: generación procedural escalando algún roster base).

## `arcs/tutorial-chunin.json`

Configuración genérica que el generador de mapa debe leer:
- `numeroPisos`, `nodosPorPiso`
- `poolTiposNodo` (con pesos de probabilidad)
- `pisoMiniJefe` / `miniJefeId`, `pisoJefeFinal` / `jefeFinalId`
- `personajesInicialesIds`, `personajesReclutablesIds`
- `nivelEnemigoBase`, `escaladoNivelPorPiso`

> Añadir un arco nuevo = crear otro archivo con esta misma forma. El motor de generación de mapa no debe tener ninguna referencia hardcodeada a "tutorial-chunin".

## `events.json`

Array `eventos`, cada uno con `titulo`, `descripcion` y 2-3 `elecciones`, cada elección con un campo `efecto` (tipo + parámetros) que el motor interpreta.
