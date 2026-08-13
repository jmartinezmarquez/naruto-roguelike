# Motor del juego (`src/engine/`)

## `leveling.js`

- `xpParaSiguienteNivel(curvaXp, nivelActual)` — XP requerida para el siguiente nivel.
- `calcularStatsPorNivel(statsBase, nivel)` — stats actuales, crecimiento lineal simple (`config.progresion.crecimientoStatsPorNivel`, hoy 0.03 = +3% por nivel sobre base; era 0.08 y se aplanó en la fase 4 del rediseño de balance).
- `ganarXp(personajeEstado, cantidadXp, curvaXp)` — aplica XP y resuelve subidas de nivel (puede subir varios niveles de golpe). No muta el objeto de entrada.
- `obtenerModoActivo(personajeBase, nivelActual)` — de `personajeBase.modos` (array, 0 a 2 tiers), devuelve el de mayor `nivelDesbloqueo` que esté disponible, o `null`. Sustituye al antiguo `modoDesbloqueado` (que solo soportaba 1 modo booleano).
- `aplicarMultiplicadoresModo(stats, modo)` — aplica los multiplicadores del modo a unas stats ya calculadas.

- `aplicarMultiplicadores(stats, multiplicadores)` — genérico: aplica un objeto `{ataque, defensa, velocidad, hp}` a unas stats ya calculadas. Lo usan tanto los modos como los buffs temporales de eventos (mismo mecanismo, distinta duración).
- `aplicarMultiplicadoresModo(stats, modo)` — wrapper fino sobre `aplicarMultiplicadores`, para modos/transformaciones.
- `nivelesEstimadosDeLaRun(curvaXp, arcos, xpDeJefe)` — a qué nivel llega un personaje a cada piso
  de la run, jugando un camino: un nodo por piso con la XP que cabe esperar de él, la XP entera de
  los dos jefes, y arrastrando el nivel de un arco al siguiente. Devuelve `{ [arcoId]: Map<piso, nivel> }`.
  Sigue siendo agnóstico del contenido: los arcos entran por parámetro. Vive aquí y no en el
  simulador porque la pregunta "¿a qué nivel llega el jugador a este jefe?" se hace en dos sitios —
  el script de balance y el test de invariante que impide que los niveles fijos de los arcos se
  separen otra vez de la realidad, que es un error que ya pasó dos veces
  (ver [11](./11-progresion-y-arcos.md)).

## `combat.js`

> **El evento de ataque lleva el estado RESUELTO, no los deltas.** `hpAtacante`, `hpDefensor`,
> `cargaAtacante` y `cargaDefensor` vienen ya calculados. Quien reproduce el historial no debe
> deducirlos con aritmética: la carga se pone a cero al lanzar el jutsu (no se puede sumar
> incrementos) y el HP sube con `heal_on_kill` (no se puede restar daño). Las dos cosas ya rompieron
> el replay una vez cada una. Si mañana hay un jutsu con robo de vida o una pasiva que cure al
> recibir un golpe, el replay sigue funcionando sin tocar nada.

- `obtenerEficacia(tipoAtacante, tipoDefensor)` — lee la matriz de `types.json`.
- `crearLuchador(personajeBase, nivel, hpActualInicial, multiplicadoresExtra, multiplicadorCargaExtra)` — instancia de combate. **`hpActualInicial`**: si se pasa, el luchador empieza con ese HP en vez de a HP completo — es lo que permite que el HP persista entre combates. **`multiplicadoresExtra`**: multiplicadores aplicados después del modo, para los buffs temporales de eventos ("+20% ataque, 3 combates"). **`multiplicadorCargaExtra`**: acelera o frena la barra de jutsu, se combina con `modoActivo.multiplicadorCarga`. El modo activo se sigue calculando internamente con `obtenerModoActivo`.
- `calcularDano(atacante, defensor, ataque)` — fórmula: `ataqueEfectivo * ataque.danoBase * eficacia - defensaEfectiva * 0.5`, mínimo 1. `ataque` es indistintamente el ataque básico o el `jutsu`. El básico sale siempre de
`config.combate.jutsu.ataqueBasicoPorDefecto` — es el mismo para todos los luchadores, ver
[29](./29-sistema-de-jutsus-automaticos.md).
- `ejecutarAtaque(atacante, defensor)` — el atacante no elige: lanza su **jutsu** si la barra está llena (y la vacía), o su **ataque básico** si no (y la carga). Sustituyó a `ejecutarJutsu`. Ver [29](./29-sistema-de-jutsus-automaticos.md) para las reglas completas de carga.
- `turnosParaCargarJutsu(luchador)` — estimación del ritmo de un personaje, solo para la UI. El
  número exacto no llega a la pantalla: la ficha lo traduce a 3 puntitos (`RitmoCarga`).
- `aplicarEfectoEstado` / `reducirDuracionModificadores` — buffs/debuffs temporales con contador de turnos. **Desactivado para el MVP**: todos los `jutsu.efectoEstado` de `characters.json`/`enemies.json`/`common-enemies.json` están a `null` — añadían complejidad de cálculo y no tenían sentido narrativo en todos los personajes. El motor sigue soportándolos tal cual (`aplicarEfectoEstado` ya es null-safe, `if (!efecto) return`) por si se rellenan de nuevo más adelante — no hace falta tocar `engine/` para reactivarlos, solo los datos.
- `resolverTurno(luchador1, luchador2)` — resuelve un turno completo (orden por velocidad, ambos ataques, reduce duración de efectos). Usada internamente por `resolverCombateCompleto`.
- `resolverCombateCompleto(luchador1, luchador2)` — encadena turnos automáticamente hasta que uno caiga o se alcance `config.combate.turnosMaximos` (empate resuelto por % de HP restante).

> Al sustituir `ejecutarJutsu` por `ejecutarAtaque` se hizo el `grep` que pide `CLAUDE.md` antes de borrar nada: solo la llamaba `resolverTurno`, dentro del propio `combat.js`. La lección de abajo salió cara una vez.

> Bug corregido: al introducir `resolverCombateCompleto`, un `str_replace` sustituyó por completo la función `resolverTurno` sin darse cuenta de que la nueva función la sigue llamando internamente en su bucle — quedó una llamada a una función inexistente (`ReferenceError: resolverTurno is not defined`). Reinsertada. Lección: al reemplazar una función que otra sigue usando, verificar las llamadas internas antes de dar el cambio por bueno.

## `passives.js`

Catálogo de pasivas: efectos con nombre que cambian **reglas** del combate en vez de estadísticas.
Modos y objetos los declaran por id y comparten implementación. Seis enganches
(`DEFENSA_EFECTIVA`, `DANO_INFLIGIDO`, `DANO_RECIBIDO`, `PRIORIDAD`, `ATAQUE_EXTRA`, `AL_DERROTAR`)
que `combat.js` consulta. Documentación completa en [30](./30-sistema-de-pasivas.md).

> `normalizarPasivas` **lanza** con un id que no está en el catálogo, a propósito: una pasiva
> ignorada en silencio deja al personaje desbalanceado sin que nada lo delate.

## `store/useGameStore.js`

Store de Zustand. Es el "pegamento" entre el motor puro (`engine/`) y la UI: decide qué llamar y cuándo, no cómo se calcula nada.

**Estado:** `equipo` (instancias: id, nivel, xpActual, derrotado, **hpActual**, **bonificaciones**), `oro`, `inventario`, **`buffsTemporales`**, `arcoActualId`, `arcoActualDatos`, `mapa`, `nodoActualId`, `pantalla`, `ultimoResultadoCombate`, **`eventoActual`**, `runTerminada`, `runGanada`.

**HP persistente entre combates (cambio importante):** antes, cada combate empezaba a HP completo. Ahora `equipo[].hpActual` se mantiene entre combates — solo se restaura con curación explícita (nodo de descanso, o el efecto `curarEquipoPorcentaje` de un evento). Al subir de nivel, `hpActual` sube en la misma cantidad que sube `hpMaximo` (no cura de regalo, pero tampoco se queda atrás respecto a la nueva vida máxima). Esto se calcula en `aplicarXpYActualizarHp` (interna).

**`bonificaciones`** (nuevo campo de instancia): `{ ataque, defensa, velocidad, hp }`, permanentes, ganadas por el evento `mejoraPermanenteAleatoria`. Se suman a `statsBase` justo antes de crear el luchador (`personajeBaseConBonificaciones`, interna).

**`buffsTemporales`** (nuevo, a nivel de run, no por personaje): `[{ multiplicadores, combatesRestantes }]`, del efecto de evento `buffTemporalEquipo`. Se combinan todos con `combinarMultiplicadoresTemporales` (interna) y se pasan como `multiplicadoresExtra` a `crearLuchador`. Se consumen 1 uso por combate jugado (ganado o perdido), vía `_consumirUsoBuffsTemporales`.

**Acciones principales:**
- `iniciarRun(personajesInicialesIds, arco)`
- `reclutarPersonaje(id, nivelInicial, idAReemplazar)` / `reordenarEquipo(nuevoOrdenIds)` — ver [19](./19-seleccion-de-personaje.md) para el reemplazo con equipo lleno.
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

**XP de un personaje caído**: no gana XP en ningún combate mientras siga derrotado de un combate ANTERIOR (hasta curarse). Si cae DURANTE el combate actual (rondas encadenadas y luego gana un compañero), sí cuenta la XP de banquillo de esa victoria — participó, aunque perdiera — pero su HP se queda a 0 (ganar XP no lo "revive" de regalo si sube de nivel). `jugarCombate` toma una foto de quién estaba ya derrotado ANTES de empezar (`idsYaDerrotadosAntesDelCombate`) para poder distinguir los dos casos en `_aplicarVictoria`.

### Decisión de diseño: activación de modo/transformación (regla única, sin excepciones)

Como el combate es 100% automático (sin input del jugador durante la pelea), el modo se activa **solo por nivel** (`modoDesbloqueado()`), tanto para el jugador como para cualquier enemigo o jefe, y se decide **antes** de empezar el combate. No existe activación por condiciones durante la pelea (como HP) — coherente con que una run recorra un rango amplio de niveles (1-100) a través de varios arcos, no un único nivel fijo por arco.

### Pendiente para más adelante

- `comprarObjeto` / `usarObjetoConsumible` — se añaden al construir la pantalla de tienda/inventario.
