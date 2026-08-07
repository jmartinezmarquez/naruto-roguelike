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
- `modos`: array de 0 a 2 transformaciones, cada una `{ nombre, nivelDesbloqueo, multiplicadores: { ataque, defensa, velocidad, hp } }`. El motor activa siempre la de mayor nivel desbloqueado.

`rareza` sigue una jerarquía de stats validada: `comun` < `inicial` < `raro` < `legendario` (ver [11 - Progresión y arcos](./11-progresion-y-arcos.md)).

## `enemies.json`

Array `jefes`: catálogo reutilizable entre arcos, mismo esquema que un personaje (`statsBase`, `jutsu`, `modos`) **más** `rareza`, `curvaXp` y `desbloqueablePorLogro: true` — con esto, un jefe puede convertirse directamente en personaje reclutable si se desbloquea vía logro, sin duplicar sus datos en `characters.json`. Contiene: Haku y Zabuza (arco 1), Kabuto y Gaara (arco 2), Camino Animal de Pain y Pain — Camino Deva (arco 3).

## `common-enemies.json`

Dos categorías, mismo esquema que un personaje (`statsBase`, `jutsu`, `modos: []`):
- `plantillasGenericas`: una por elemento, escalada por `calcularNivelPorPiso`. Rellenan los nodos de combate normal.
- `enemigosNombrados`: enemigos fijos con más peso narrativo (Zaku, Dosu, Kin).

## `items.json`

Array `objetos`, cada uno con `tipo` (`equipable`/`consumible`), `rareza`, `precioTienda` (`null` si no es comprable) y `efecto`. Tipos de `efecto`: `curarPersonaje` (consumible), `revivirUnaVez`, `buffEquipable`, `curacionPostCombate`, `buffYDebuffEquipable` (equipables).

Los `equipable` se asignan a un personaje concreto del equipo (un hueco por personaje,
`instancia.objetoEquipadoId`) y solo benefician a quien los lleve puesto — ver
[21 - Objetos equipables](./21-objetos-equipables.md) para el porqué de este diseño (se descartó un
modelo de "pasivo de todo el equipo") y cómo se aplican de verdad los efectos (antes de esa sesión,
ningún efecto se aplicaba, solo se guardaba el id en el inventario).

## `events.json`

Array `eventos`, 12 eventos canónicos (4 por arco), cada uno con `id`, `arcoId` (para filtrar el pool por arco actual), `titulo`, `descripcion` y 2 `elecciones`, cada una con un `efecto`. Tipos de efecto soportados: `curarEquipoPorcentaje` (cantidad = fracción 0-1), `buffTemporalEquipo` (`stat`, `multiplicador`, `combates`), `ganarXpEquipo`, `ganarOro`, `perderOro`, `comprarObjetoAleatorio` (`coste`), `mejoraPermanenteAleatoria`, `ninguno`. **Ningún efecto desencadena combate.**

## `config.json`

Parámetros globales: tamaño de equipo, economía (oro inicial, oro por combate/evento, y **`precioReclutamientoPorRareza`**: `{ comun: 40, raro: 70, legendario: 120 }` — diseño preparado para el reclutamiento vía tienda), reglas de combate, progresión (nivel máximo 100, `porcentajeXpBanquillo`) y ajustes de tienda/guardado.

## `arcs/*.json`

Tres arcos: `pais-de-las-olas.json`, `examen-chunin.json`, `invasion-de-pain.json`. `poolTiposNodo` ya no incluye `reclutamiento` como nodo independiente (su peso se repartió a `tienda`) — el reclutamiento pasó a ser una función de la tienda, no un nodo propio (ver [11 - Progresión y arcos](./11-progresion-y-arcos.md)).

Configuración genérica que el generador de mapa debe leer:
- `numeroPisos`, `nodosPorPiso`
- `poolTiposNodo` (con pesos de probabilidad)
- `pisoMiniJefe` / `miniJefeId`, `pisoJefeFinal` / `jefeFinalId`
- `personajesInicialesIds` (solo relevante en el primer arco de la run), `personajesReclutablesIds`
- `nivelEnemigoBase`, `escaladoNivelPorPiso`

> Añadir un arco nuevo = crear otro archivo con esta misma forma. El motor de generación de mapa no debe tener ninguna referencia hardcodeada a ningún arco concreto.
