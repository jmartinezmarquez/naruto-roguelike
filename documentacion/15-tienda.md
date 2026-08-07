# Tienda (`components/Shop/ShopScreen.jsx`)

## Restricciones de aparición en el mapa

- Nunca en el piso 1 (sin oro todavía) — filtrado en `generarMapa`.
- Máximo 2 nodos de tienda por piso — reasignación post-sorteo en `generarMapa`.
- Detalle en [10 - Generador de mapa](./10-generador-de-mapa.md).

## Qué ofrece (al estilo Slay the Spire)

Cada visita genera una oferta **fijada al entrar** (no se regenera al re-renderizar):
- **2 objetos consumibles comprables**, independientes entre sí (comprar uno no afecta al otro).
- **1 objeto pasivo gratuito**, se reclama sin coste.
- **2 personajes reclutables — elegir uno descarta automáticamente el otro** (`tiendaActual.reclutables` se vacía tras reclutar a cualquiera de los dos).

Generado por `generarOfertaTienda` (interna del store), llamada desde `avanzarANodo` cuando el
nodo es de tipo `tienda`.

## Precio y stats por rareza

Reutiliza el diseño ya preparado en `config.economia.precioReclutamientoPorRareza`
(`comun: 40, raro: 70, legendario: 120`) y `characters.json[].rareza` — nada nuevo que diseñar,
ya estaba listo desde la sesión de reclutamiento/rareza (ver
[14 - Reclutamiento y rareza](./14-reclutamiento-y-rareza.md)).

## Nivel de reclutamiento

El personaje reclutado en tienda entra al nivel del piso donde está la tienda
(`calcularNivelPorPiso(nodo.piso, arco)`), igual que un reclutamiento tardío de recompensa de
jefe — no entra indefenso si es tarde en la run.

## Acciones del store

- `comprarConsumibleTienda(itemId)` — descuenta oro, añade al inventario, quita el item de la oferta.
- `reclamarObjetoGratuitoTienda()` — añade el objeto gratuito sin coste, una sola vez por visita.
- `reclutarDeTienda(personajeId)` — llama a `reclutarPersonaje(id, nivelReclutamiento)`, descuenta
  el oro, y vacía `reclutables` (descarta la otra opción). No cobra si el equipo está lleno (la
  llamada a `reclutarPersonaje` falla primero).

## Dirección visual

Puesto de mercader ambulante con farolillo (🏮), mismos tokens de tinta/pergamino que el resto de
la UI. El texto de ambientación cambia según `arcoActualDatos.id` (`AMBIENTACION_POR_ARCO` en
`ShopScreen.jsx`) — mismo diseño visual en los 3 arcos, pero el sabor narrativo varía (mercader
huyendo de Gato en País de las Olas, comerciante furtivo en el Bosque de la Muerte, superviviente
entre los escombros en la Invasión de Pain).
