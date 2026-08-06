# Motor del juego (`src/engine/`)

## `leveling.js`

- `xpParaSiguienteNivel(curvaXp, nivelActual)` — XP requerida para el siguiente nivel.
- `calcularStatsPorNivel(statsBase, nivel)` — stats actuales, crecimiento lineal simple (`config.progresion.crecimientoStatsPorNivel`, valor inicial 0.08 = +8% por nivel sobre base).
- `ganarXp(personajeEstado, cantidadXp, curvaXp)` — aplica XP y resuelve subidas de nivel (puede subir varios niveles de golpe). No muta el objeto de entrada.
- `obtenerModoActivo(personajeBase, nivelActual)` — de `personajeBase.modos` (array, 0 a 2 tiers), devuelve el de mayor `nivelDesbloqueo` que esté disponible, o `null`. Sustituye al antiguo `modoDesbloqueado` (que solo soportaba 1 modo booleano).
- `aplicarMultiplicadoresModo(stats, modo)` — aplica los multiplicadores del modo a unas stats ya calculadas.

- `aplicarMultiplicadores(stats, multiplicadores)` — genérico: aplica un objeto `{ataque, defensa, velocidad, hp}` a unas stats ya calculadas. Lo usan tanto los modos como los buffs temporales de eventos (mismo mecanismo, distinta duración).
- `aplicarMultiplicadoresModo(stats, modo)` — wrapper fino sobre `aplicarMultiplicadores`, para modos/transformaciones.

## `combat.js`

- `obtenerEficacia(tipoAtacante, tipoDefensor)` — lee la matriz de `types.json`.
- `crearLuchador(personajeBase, nivel, hpActualInicial, multiplicadoresExtra)` — instancia de combate. **`hpActualInicial`** (nuevo): si se pasa, el luchador empieza con ese HP en vez de a HP completo — es lo que permite que el HP persista entre combates. **`multiplicadoresExtra`** (nuevo): multiplicadores aplicados después del modo, para los buffs temporales de eventos ("+20% ataque, 3 combates"). El modo activo se sigue calculando internamente con `obtenerModoActivo`.
- `calcularDano(atacante, defensor, jutsu)` — fórmula: `ataqueEfectivo * jutsu.danoBase * eficacia - defensaEfectiva * 0.5`, mínimo 1.
- `aplicarEfectoEstado` / `reducirDuracionModificadores` — buffs/debuffs temporales con contador de turnos.
- `resolverTurno(luchador1, luchador2)` — resuelve un turno completo (orden por velocidad, ambos ataques, reduce duración de efectos). Usada internamente por `resolverCombateCompleto`.
- `resolverCombateCompleto(luchador1, luchador2)` — encadena turnos automáticamente hasta que uno caiga o se alcance `config.combate.turnosMaximos` (empate resuelto por % de HP restante).

> Bug corregido: al introducir `resolverCombateCompleto`, un `str_replace` sustituyó por completo la función `resolverTurno` sin darse cuenta de que la nueva función la sigue llamando internamente en su bucle — quedó una llamada a una función inexistente (`ReferenceError: resolverTurno is not defined`). Reinsertada. Lección: al reemplazar una función que otra sigue usando, verificar las llamadas internas antes de dar el cambio por bueno.

## `store/useGameStore.js`

Store de Zustand. Es el "pegamento" entre el motor puro (`engine/`) y la UI: decide qué llamar y cuándo, no cómo se calcula nada.

**Estado:** `equipo` (instancias: id, nivel, xpActual, derrotado, **hpActual**, **bonificaciones**), `oro`, `inventario`, **`buffsTemporales`**, `arcoActualId`, `arcoActualDatos`, `mapa`, `nodoActualId`, `pantalla`, `ultimoResultadoCombate`, **`eventoActual`**, `runTerminada`, `runGanada`.

**HP persistente entre combates (cambio importante):** antes, cada combate empezaba a HP completo. Ahora `equipo[].hpActual` se mantiene entre combates — solo se restaura con curación explícita (nodo de descanso, o el efecto `curarEquipoPorcentaje` de un evento). Al subir de nivel, `hpActual` sube en la misma cantidad que sube `hpMaximo` (no cura de regalo, pero tampoco se queda atrás respecto a la nueva vida máxima). Esto se calcula en `aplicarXpYActualizarHp` (interna).

**`bonificaciones`** (nuevo campo de instancia): `{ ataque, defensa, velocidad, hp }`, permanentes, ganadas por el evento `mejoraPermanenteAleatoria`. Se suman a `statsBase` justo antes de crear el luchador (`personajeBaseConBonificaciones`, interna).

**`buffsTemporales`** (nuevo, a nivel de run, no por personaje): `[{ multiplicadores, combatesRestantes }]`, del efecto de evento `buffTemporalEquipo`. Se combinan todos con `combinarMultiplicadoresTemporales` (interna) y se pasan como `multiplicadoresExtra` a `crearLuchador`. Se consumen 1 uso por combate jugado (ganado o perdido), vía `_consumirUsoBuffsTemporales`.

**Acciones principales:**
- `iniciarRun(personajesInicialesIds, arco)`
- `reclutarPersonaje(id, nivelInicial)` / `reordenarEquipo(nuevoOrdenIds)`
- `avanzarANodo(nodoId)` — resuelve combate, evento, o descanso automático según el tipo de nodo (ver `13-ui-mapa-y-combate.md`).
- `jugarCombate(enemigoBase, nivelEnemigo)` — construye los luchadores con `crearLuchador` (pasando `hpActual` persistido y los buffs temporales activos), resuelve con `resolverCombateCompleto`, aplica XP/oro/objeto (`_aplicarVictoria`) o derrota (`_aplicarDerrota`), y consume 1 uso de los buffs temporales.
- `resolverEventoEleccion(indiceEleccion)` — intérprete de efectos de evento (ver más abajo).
- `curarPersonaje(id)` / `_curarEquipoCompleto()` — curan a HP completo y revive si estaba derrotado.
- `obtenerHpMaximo(id)` — selector para que la UI pueda pintar barras de HP reales.
- `guardarRun()` / `cargarRun()` / `borrarRunGuardada()` — persistencia en `localStorage`.

### Efectos de evento soportados (`resolverEventoEleccion`)

`curarEquipoPorcentaje`, `buffTemporalEquipo`, `ganarXpEquipo`, `ganarOro`, `perderOro`, `comprarObjetoAleatorio`, `mejoraPermanenteAleatoria`, `ninguno`. **Ningún efecto de evento desencadena combate** — ya hay suficientes combates por piso en `poolTiposNodo` (decisión explícita, se quitó `combateSorpresa` del diseño original).

### Decisión de diseño: qué pasa al perder un combate

El personaje activo derrotado pasa al final del orden del equipo (no muere permanentemente — no hay Nuzlocke en el MVP) y no puede volver a luchar hasta curarse en un nodo de descanso. El siguiente personaje vivo sube a posición 1 automáticamente. Si los 3 caen, la run termina (`runTerminada: true`).

### Decisión de diseño: activación de modo/transformación (regla única, sin excepciones)

Como el combate es 100% automático (sin input del jugador durante la pelea), el modo se activa **solo por nivel** (`modoDesbloqueado()`), tanto para el jugador como para cualquier enemigo o jefe, y se decide **antes** de empezar el combate. No existe activación por condiciones durante la pelea (como HP) — coherente con que una run recorra un rango amplio de niveles (1-100) a través de varios arcos, no un único nivel fijo por arco.

### Pendiente para más adelante

- `comprarObjeto` / `usarObjetoConsumible` — se añaden al construir la pantalla de tienda/inventario.
