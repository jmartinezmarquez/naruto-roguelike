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
- `modos`: array de **0 a 2** transformaciones, cada una `{ nombre, nivelDesbloqueo, multiplicadores: { ataque, defensa, velocidad, hp } }`, ordenadas de menor a mayor `nivelDesbloqueo`. El motor activa siempre la de mayor nivel desbloqueado (`obtenerModoActivo` en `engine/leveling.js`).

## `enemies.json`

Array `jefes`: catálogo **reutilizable entre arcos** (no exclusivo de uno solo), mismo esquema que un personaje (`statsBase`, `jutsu`, `modos`). Cada arco referencia los ids que necesita vía `miniJefeId`/`jefeFinalId` en su config. Contiene: Haku y Zabuza (arco 1), Kabuto y Gaara (arco 2), Camino Animal de Pain y Pain — Camino Deva (arco 3).

## `common-enemies.json`

Dos categorías, **mismo esquema que un personaje** (`statsBase`, `jutsu`, `modos`), sin necesidad de normalización antes de pasarlo al motor:
- `plantillasGenericas`: una por elemento, escalada por `calcularNivelPorPiso` del generador de mapa. Rellenan los nodos de combate normal. `modos: []` — no transforman.
- `enemigosNombrados`: enemigos fijos con más peso narrativo (Zaku, Dosu, Kin), con stats ya definidos y recompensa propia.

## `items.json`

Array `objetos`, cada uno con `tipo` (`pasivo` — se queda activo toda la run, o `consumible` — se gasta al usarse), `rareza`, `precioTienda` (`null` si no es comprable, solo se obtiene como recompensa) y `efecto` (tipo + parámetros que el motor interpreta).

## `config.json`

Parámetros globales independientes de cualquier arco: tamaño de equipo, economía (oro inicial y por combate/evento), reglas de combate, progresión (**nivel máximo 100**, cubriendo los 3 arcos del MVP — ver [11 - Progresión y arcos](./11-progresion-y-arcos.md) — y multiplicadores de eficacia) y ajustes de tienda/guardado.

## `arcs/*.json`

Tres arcos en el MVP, mismo esquema entre ellos: `pais-de-las-olas.json`, `examen-chunin.json`, `invasion-de-pain.json`.

Configuración genérica que el generador de mapa debe leer:
- `numeroPisos`, `nodosPorPiso`
- `poolTiposNodo` (con pesos de probabilidad)
- `pisoMiniJefe` / `miniJefeId`, `pisoJefeFinal` / `jefeFinalId`
- `personajesInicialesIds` (solo relevante en el primer arco de la run), `personajesReclutablesIds`
- `nivelEnemigoBase`, `escaladoNivelPorPiso`

> Añadir un arco nuevo = crear otro archivo con esta misma forma. El motor de generación de mapa no debe tener ninguna referencia hardcodeada a ningún arco concreto. Detalle de la progresión de nivel en [11 - Progresión y arcos](./11-progresion-y-arcos.md).

## `events.json`

Array `eventos`, cada uno con `titulo`, `descripcion` y 2-3 `elecciones`, cada elección con un campo `efecto` (tipo + parámetros) que el motor interpreta.
