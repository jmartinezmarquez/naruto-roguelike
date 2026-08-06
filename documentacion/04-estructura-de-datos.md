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

Array `jefesDelArco` con la misma forma que un personaje pero con `rol` (`miniJefe` / `jefeFinal`) y `recompensa`.

## `common-enemies.json`

Dos categorías:
- `plantillasGenericas`: una por elemento, con `statsBaseNivel1` que el motor escala según `nivelEnemigoBase` y `escaladoNivelPorPiso` del arco. Rellenan los nodos de combate normal sin tener que definir cada enemigo a mano.
- `enemigosNombrados`: enemigos fijos con más peso narrativo (Zaku, Dosu, Kin), con stats ya definidos y recompensa propia.

## `items.json`

Array `objetos`, cada uno con `tipo` (`pasivo` — se queda activo toda la run, o `consumible` — se gasta al usarse), `rareza`, `precioTienda` (`null` si no es comprable, solo se obtiene como recompensa) y `efecto` (tipo + parámetros que el motor interpreta).

## `config.json`

Parámetros globales independientes de cualquier arco: tamaño de equipo, economía (oro inicial y por combate/evento), reglas de combate, progresión (nivel máximo, multiplicadores de eficacia) y ajustes de tienda/guardado.

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
