# Motor del juego (`src/engine/`)

## `leveling.js`

- `xpParaSiguienteNivel(curvaXp, nivelActual)` — XP requerida para el siguiente nivel.
- `calcularStatsPorNivel(statsBase, nivel)` — stats actuales, crecimiento lineal simple (`config.progresion.crecimientoStatsPorNivel`, valor inicial 0.08 = +8% por nivel sobre base).
- `ganarXp(personajeEstado, cantidadXp, curvaXp)` — aplica XP y resuelve subidas de nivel (puede subir varios niveles de golpe). No muta el objeto de entrada.
- `obtenerModoActivo(personajeBase, nivelActual)` — de `personajeBase.modos` (array, 0 a 2 tiers), devuelve el de mayor `nivelDesbloqueo` que esté disponible, o `null`. Sustituye al antiguo `modoDesbloqueado` (que solo soportaba 1 modo booleano).
- `aplicarMultiplicadoresModo(stats, modo)` — aplica los multiplicadores del modo a unas stats ya calculadas.

## `combat.js`

- `obtenerEficacia(tipoAtacante, tipoDefensor)` — lee la matriz de `types.json`.
- `crearLuchador(personajeBase, nivel)` — instancia de combate con stats calculadas. Calcula el modo activo **internamente** con `obtenerModoActivo` — ya no recibe `modoActivo` como parámetro, no hace falta decidirlo por fuera.
- `calcularDano(atacante, defensor, jutsu)` — fórmula: `ataqueEfectivo * jutsu.danoBase * eficacia - defensaEfectiva * 0.5`, mínimo 1.
- `aplicarEfectoEstado` / `reducirDuracionModificadores` — buffs/debuffs temporales con contador de turnos.
- `resolverTurno(luchador1, luchador2)` — resuelve un turno completo (orden por velocidad, ambos ataques, reduce duración de efectos). Usada internamente por `resolverCombateCompleto`.
- `resolverCombateCompleto(luchador1, luchador2)` — encadena turnos automáticamente hasta que uno caiga o se alcance `config.combate.turnosMaximos` (empate resuelto por % de HP restante).

> Bug corregido: al introducir `resolverCombateCompleto`, un `str_replace` sustituyó por completo la función `resolverTurno` sin darse cuenta de que la nueva función la sigue llamando internamente en su bucle — quedó una llamada a una función inexistente (`ReferenceError: resolverTurno is not defined`). Reinsertada. Lección: al reemplazar una función que otra sigue usando, verificar las llamadas internas antes de dar el cambio por bueno.

## `store/useGameStore.js`

Store de Zustand. Es el "pegamento" entre el motor puro (`engine/`) y la UI: decide qué llamar y cuándo, no cómo se calcula nada.

**Estado:** `equipo` (instancias de run: id, nivel, xpActual, derrotado), `oro`, `inventario`, `arcoActualId`, `nodoActualId`, `ultimoResultadoCombate`, `runTerminada`, `runGanada`.

**Acciones principales:**
- `iniciarRun(personajesInicialesIds, arcoId)`
- `reclutarPersonaje(id)` / `reordenarEquipo(nuevoOrdenIds)`
- `jugarCombate(enemigoBase, nivelEnemigo)` — construye los luchadores con `crearLuchador` (que ya resuelve el modo activo internamente), resuelve con `resolverCombateCompleto`, y aplica el resultado (XP/oro/objeto si se gana, derrota si se pierde).
- `curarPersonaje(id)` — revive a un personaje derrotado (uso: nodo de descanso).
- `guardarRun()` / `cargarRun()` / `borrarRunGuardada()` — persistencia en `localStorage`.

### Decisión de diseño: qué pasa al perder un combate

El personaje activo derrotado pasa al final del orden del equipo (no muere permanentemente — no hay Nuzlocke en el MVP) y no puede volver a luchar hasta curarse en un nodo de descanso. El siguiente personaje vivo sube a posición 1 automáticamente. Si los 3 caen, la run termina (`runTerminada: true`).

### Decisión de diseño: activación de modo/transformación (regla única, sin excepciones)

Como el combate es 100% automático (sin input del jugador durante la pelea), el modo se activa **solo por nivel** (`modoDesbloqueado()`), tanto para el jugador como para cualquier enemigo o jefe, y se decide **antes** de empezar el combate. No existe activación por condiciones durante la pelea (como HP) — coherente con que una run recorra un rango amplio de niveles (1-100) a través de varios arcos, no un único nivel fijo por arco.

### Pendiente para más adelante

- `comprarObjeto` / `usarObjetoConsumible` — se añaden al construir la pantalla de tienda/inventario.
