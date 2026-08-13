# Tienda (`components/Shop/ShopScreen.jsx`)

## Restricciones de aparición en el mapa

- Nunca en el piso 1 (sin oro todavía) — filtrado en `generarMapa`.
- Máximo 2 nodos de tienda por piso — reasignación post-sorteo en `generarMapa`.
- Detalle en [10 - Generador de mapa](./10-generador-de-mapa.md).

## Qué ofrece (rediseño — antes tenía reclutar y objeto gratuito)

Cada visita genera **3 objetos aleatorios** (consumibles o equipables mezclados) con su precio.
El jugador puede comprar los que quiera con el oro disponible, sin límite ni orden.

- Generado por `generarOfertaTienda()` (interna del store) — toma el pool de `items.json` donde
  `precioTienda !== null` y elige 3 al azar.
- `tiendaActual` = `{ items: [{ id, precio }, ...] }` — la carta desaparece de la oferta al comprarla.
- El reclutamiento **ya no vive en la tienda** — tiene su propio nodo de tipo `reclutar`
  (ver [28 - Nodo de reclutar](./28-nodo-reclutar.md)).
- Los objetos exclusivos de mini-jefe (`precioTienda: null`) **no aparecen en la tienda**.
  Solo se obtienen como recompensa de combate (ver más abajo).

## Acciones del store

- `comprarItemTienda(itemId)` — descuenta el oro del item, lo añade al inventario y lo retira de
  la oferta. Falla si no hay oro suficiente o el item no está en la oferta actual.

## Objetos de recompensa de mini-jefe

Al derrotar a un mini-jefe, se muestra una pantalla `ItemRewardScreen` con **1 objeto aleatorio**
(el `objetoGarantizado` del jefe en `enemies.json`). El jugador pulsa "Recoger" para añadirlo al
inventario o "Saltar" para ignorarlo.

- `recompensaMiniJefe` en el store = `{ item: id }`.
- Acciones: `reclamarRecompensaMiniJefe()` y `saltarRecompensaMiniJefe()`.
- Los jefes finales (Zabuza, Gaara, Pain) auto-añaden su `objetoGarantizado` sin pantalla extra
  (la transición de arco ya es suficiente pantalla).

## Dirección visual

Puesto de mercader ambulante, mismos tokens de tinta/pergamino que el resto de la UI. El texto de
ambientación cambia según `arcoActualDatos.id` (`AMBIENTACION_POR_ARCO` en `ShopScreen.jsx`) —
mismo diseño visual en los 3 arcos, sabor narrativo distinto.
