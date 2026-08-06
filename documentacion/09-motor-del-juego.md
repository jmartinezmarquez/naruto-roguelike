# Motor del juego (`src/engine/`)

## `leveling.js`

- `xpParaSiguienteNivel(curvaXp, nivelActual)` — XP requerida para el siguiente nivel.
- `calcularStatsPorNivel(statsBase, nivel)` — stats actuales, crecimiento lineal simple (`config.progresion.crecimientoStatsPorNivel`, valor inicial 0.08 = +8% por nivel sobre base).
- `ganarXp(personajeEstado, cantidadXp, curvaXp)` — aplica XP y resuelve subidas de nivel (puede subir varios niveles de golpe). No muta el objeto de entrada.
- `modoDesbloqueado(personajeBase, nivelActual)` — comprueba disponibilidad del modo/transformación (no lo activa).
- `aplicarMultiplicadoresModo(stats, modo)` — aplica los multiplicadores del modo a unas stats ya calculadas.

## `combat.js`

- `obtenerEficacia(tipoAtacante, tipoDefensor)` — lee la matriz de `types.json`.
- `crearLuchador(personajeBase, nivel, modoActivo)` — instancia de combate con stats calculadas.
- `calcularDano(atacante, defensor, jutsu)` — fórmula: `ataqueEfectivo * jutsu.danoBase * eficacia - defensaEfectiva * 0.5`, mínimo 1.
- `aplicarEfectoEstado` / `reducirDuracionModificadores` — buffs/debuffs temporales con contador de turnos.
- `resolverTurno(luchador1, luchador2)` — resuelve un turno completo (orden por velocidad, ambos ataques, reduce duración de efectos).

## `store/useGameStore.js`

Store de Zustand. Es el "pegamento" entre el motor puro (`engine/`) y la UI: decide qué llamar y cuándo, no cómo se calcula nada.

**Estado:** `equipo` (instancias de run: id, nivel, xpActual, derrotado), `oro`, `inventario`, `arcoActualId`, `nodoActualId`, `ultimoResultadoCombate`, `runTerminada`, `runGanada`.

**Acciones principales:**
- `iniciarRun(personajesInicialesIds, arcoId)`
- `reclutarPersonaje(id)` / `reordenarEquipo(nuevoOrdenIds)`
- `jugarCombate(enemigoBase, nivelEnemigo)` — construye los luchadores con `crearLuchador`, resuelve con `resolverCombateCompleto`, y aplica el resultado (XP/oro/objeto si se gana, derrota si se pierde).
- `curarPersonaje(id)` — revive a un personaje derrotado (uso: nodo de descanso).
- `guardarRun()` / `cargarRun()` / `borrarRunGuardada()` — persistencia en `localStorage`.

### Decisión de diseño: qué pasa al perder un combate

El personaje activo derrotado pasa al final del orden del equipo (no muere permanentemente — no hay Nuzlocke en el MVP) y no puede volver a luchar hasta curarse en un nodo de descanso. El siguiente personaje vivo sube a posición 1 automáticamente. Si los 3 caen, la run termina (`runTerminada: true`).

### Decisión de diseño: activación de modo/transformación

Como el combate es 100% automático (sin input del jugador durante la pelea), el modo se activa automáticamente en cuanto está desbloqueado por nivel (`modoDesbloqueado()`), tanto para el jugador como para el enemigo. No hay decisión de "transformarse" a mitad de combate.

### Pendiente para más adelante

- `comprarObjeto` / `usarObjetoConsumible` — se añaden al construir la pantalla de tienda/inventario.
- El generador de mapa debe decidir qué `enemigoBase` pasarle a `jugarCombate` (plantilla genérica, enemigo nombrado, o jefe), ya que el store no lo resuelve por sí solo.