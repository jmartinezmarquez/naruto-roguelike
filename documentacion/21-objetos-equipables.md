# Objetos equipables y consumibles (aplicación real de efectos)

## De dónde viene esto

En la sesión anterior se construyó `PanelObjetos` (hover con descripción + efecto exacto de cada
objeto), y al escribirlo salió a la luz que **ningún objeto aplicaba su efecto de verdad** — solo
se guardaba el id en el inventario. Quedó anotado como pendiente con dos preguntas de diseño sin
resolver: ¿los pasivos de "todo el equipo" alcanzan a reclutas futuros?, ¿dónde se usa un
consumible? Esta sesión resuelve ambas.

## Decisión: equipables por personaje, no pasivos de "todo el equipo"

El diseño original (`buffPermanenteEquipo`) decía "aumenta permanentemente el ataque de TODO EL
EQUIPO". Se descartó a favor de un **sistema de equipo (gear)**: cada objeto no-consumible se
asigna a un personaje concreto (un hueco por personaje) y solo beneficia a quien lo lleve puesto.
Si lo desequipas o reemplazas a ese personaje en la tienda, el objeto vuelve al inventario listo
para volver a ponerlo — salvo `revivirUnaVez`, que se consume al activarse y no vuelve.

Por qué esta opción y no un "pasivo de verdad" recalculado desde el inventario en cada combate
(alcanzando también a reclutas futuros): el modelo de equipo es **arquitectónicamente más simple**
— la bonificación vive en el propio personaje (`instancia.objetoEquipadoId`), igual que ya vivían
las `bonificaciones` permanentes de eventos, así que `personajeBaseConBonificaciones` solo necesitó
sumar una fuente más, sin tener que enhebrar el inventario completo por todas las funciones que
calculan stats (`calcularHpMaximo`, `crearInstanciaPersonaje`, `aplicarXpYActualizarHp`, el
selector `obtenerHpMaximo`...). Además es más legible para el jugador: ves quién lleva qué, en vez
de un bonus invisible flotando sobre "el equipo" en abstracto.

## Cambios en `items.json`

- `tipo: "pasivo"` → `tipo: "equipable"` en los 9 objetos que no son la Píldora del Soldado.
- Tipos de efecto renombrados para reflejar que ya no son "de todo el equipo":
  `buffPermanenteEquipo` → `buffEquipable`, `buffYDebuffPermanenteEquipo` → `buffYDebuffEquipable`.
- Descripciones reescritas: "aumenta el ataque de todo el equipo" → "aumenta el ataque de quien lo
  lleve equipado" (y así con el resto).
- `revivirUnaVez` y `curacionPostCombate` mantienen su nombre (ya encajaban con "quien lo lleva"
  sin cambiarlo), pero su alcance pasó de "todo el equipo" a "quien lo lleve equipado".

## `engine/items.js` (puro)

- `calcularBonificacionDeEfecto(efecto)` — la bonificación de stats de UN efecto (`buffEquipable`/
  `buffYDebuffEquipable`; cualquier otro tipo devuelve la bonificación vacía, se resuelven en el
  store en el momento del evento que los dispara).
- `calcularBonificacionDeObjetoEquipado(objetoEquipadoId, objetosDisponibles)` — la bonificación
  del objeto que lleva puesto un personaje concreto (o vacía si no lleva nada).

## Store (`useGameStore.js`)

- **Nuevo campo de instancia**: `objetoEquipadoId` (`null` por defecto, en `crearInstanciaPersonaje`).
- **`personajeBaseConBonificaciones(instancia)`** ahora suma también la bonificación del objeto
  equipado — se relee de `itemsData` cada vez, no se hornea en la instancia, así que
  equipar/desequipar/reemplazar se nota al instante en cualquier cálculo de stats sin tocar nada
  más (HP máximo, daño en combate...).
- **`equiparObjeto(itemId, idPersonaje)`**: saca el objeto del inventario y lo pone en el hueco del
  personaje. Si ya llevaba algo, ese objeto anterior vuelve al inventario (se reemplaza, no se
  pierde ni hace falta desequipar antes).
- **`desequiparObjeto(idPersonaje)`**: libera el hueco, el objeto vuelve al inventario.
- **`reclutarPersonaje(..., idAReemplazar)`**: si el reemplazado llevaba algo equipado, ese objeto
  vuelve al inventario antes de que el personaje salga de la run — no desaparece con él.
- **`_aplicarDerrota`**: si quien cae lleva equipado un `revivirUnaVez`, en vez de derrotarlo lo
  revive con `hpAlRevivir` HP y consume el objeto (`objetoEquipadoId: null`, no vuelve al
  inventario). El bucle de `jugarCombate` lo vuelve a poner como activo automáticamente — mismo
  personaje, sobrevivió por los pelos. Si vuelve a caer más tarde sin el objeto (ya gastado), se
  derrota con normalidad.
- **`_aplicarVictoria`**: si el ganador lleva equipado un `curacionPostCombate`, se le suma esa
  curación extra por encima de su HP final de combate, tope su HP máximo.
- **`usarConsumible(itemId, idPersonaje)`** (nueva): aplica `curarPersonaje` (único efecto de
  consumible implementado) sobre un personaje del equipo — cura un % de su HP máximo, revive si
  estaba derrotado (a ese %, no a HP completo), y gasta 1 copia del objeto. Es el único flujo real
  para "usar" algo — antes existía una acción `curarPersonaje(id)` en el store que curaba al 100%,
  pero no la llamaba ninguna pantalla; sigue ahí sin usar, no se ha tocado.

## UI

- **`PanelObjetos`** (`MapScreen.jsx`): tocar un objeto del inventario abre un selector de
  personaje — "Equipar en..." si es equipable, "Usar en..." si es consumible. Los objetos ya
  equipados NO aparecen en esta lista (están "puestos", no en la mochila) — se ven y se desequipan
  desde `PanelEquipo`.
- **`PanelEquipo`**: cada tarjeta de personaje muestra debajo el objeto equipado (si lleva alguno,
  "🎒 {nombre}") con un enlace "quitar" que llama a `desequiparObjeto` directamente, sin
  confirmación (reversible en cualquier momento volviendo a equiparlo).
- **`ItemHoverCard`/`FichaObjeto`**: `textoEfecto` reescrito para los nuevos tipos de efecto
  (`buffEquipable`/`buffYDebuffEquipable`), y acepta un `equipadoEnNombre` opcional para mostrar
  "Equipado en X" cuando aplica.

## Testing

`engine/items.test.js` — `calcularBonificacionDeEfecto` para cada tipo de efecto (incluidos los que
no dan bonificación de stats), `calcularBonificacionDeObjetoEquipado` con/sin objeto/id desconocido.

`store/useGameStore.test.js`, varias secciones nuevas:
- `equiparObjeto`/`desequiparObjeto` — equipar saca del inventario, equipar un segundo objeto
  devuelve el anterior, falla con objeto no encontrado o consumible, afecta a stats reales
  (`obtenerHpMaximo` con Pergamino de Reserva de Chakra).
- Reemplazar a alguien con algo equipado devuelve el objeto al inventario.
- `revivirUnaVez` vía `_aplicarDerrota`: revive con el HP indicado y consume el objeto; la
  siguiente derrota del mismo personaje (ya sin el objeto) es normal.
- `curacionPostCombate` vía `_aplicarVictoria`: cura un % extra por encima del HP final de combate.
- `usarConsumible`: cura/revive y gasta 1 copia; falla si no está en el inventario o no es
  consumible.
