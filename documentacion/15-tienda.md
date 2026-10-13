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

## El oro sobraba: pergaminos, servicios y más tiendas (playtest 2026-10-14)

Con tres personajes y un hueco de equipo cada uno, a partir del arco 2 el oro no tenía en qué gastarse.
Medido con el bloque **"Economía"** de `scripts/simular-combates.mjs`, el diagnóstico tenía dos mitades:
entraban ~264 de oro por run y **solo se pisaban ~1,3 tiendas** (peso del 8-9% en el mapa). Bajar el oro
no arreglaba nada —sin nada que comprar, menos oro solo aburre antes—, así que se hicieron sumideros y
se subió la frecuencia de la tienda:

- **Pergaminos de entrenamiento** (consumibles comunes, 35 de oro): el `buffTemporalEquipo` que ya daban
  tres eventos, comprado — ATK +15%, DEF +20% o SPD +20% para **todo el equipo** durante 3 combates. La
  mochila los usa con un solo botón (no pide personaje) y el mapa ya enseñaba los buffs activos. Sprites recortados
  de `assets/sprite-pergaminos-entrenamiento.png` por `scripts/generar-sprites-pergaminos.py` (el primer
  día los dibujaba el propio script con formas geométricas, hasta que llegó la hoja).
- **Servicios** (`config.tienda`):
  - **New wares**: cambia lo que queda por otros objetos; 15 de oro y +10 cada vez en la misma tienda,
    para que sea un gasto con fondo y no un "tira hasta que salga el legendario".
  - **Field medic**: cura y revive a todo el equipo, 40 de oro, **una vez por tienda**. Convierte oro en
    lo que de verdad escasea —vida—, y más en ascensión, donde el descanso ya no cura del todo. No deja
    pagar si nadie lo necesita.
  - **Sell**: lo suelto de la mochila a la mitad de su precio (lo equipado, no: hay que quitárselo antes
    a quien lo lleva). Los objetos de jefe, sin precio de tienda, se valoran a 100.
- **Más tiendas**: 5 puntos de peso del evento a la tienda en los tres arcos. De ~1,3 a **~2,1 tiendas por
  run**, sin tocar el peso del combate, así que la XP y la curva de niveles no cambian.

Con eso, lo gastable (~165 en equipables + ~80 por tienda en servicios + pergaminos) pasa de lo que entra:
el oro deja de sobrar **sin bajarlo**. La ascensión 4 ya lo recorta otro 30%.

De paso se borraron dos parámetros de `config.economia` que no leía nadie
(`precioReclutamientoPorRareza`, de cuando la tienda reclutaba, y `oroPorEventoPositivo`).
⚠️ **`config.tienda.probabilidadRareza` tampoco se usa**: la oferta es un sorteo uniforme entre los
objetos con precio. Usarla cambiaría qué sale en la tienda y queda como decisión pendiente.

## Dirección visual

Puesto de mercader ambulante, mismos tokens de tinta/pergamino que el resto de la UI. El texto de
ambientación cambia según `arcoActualDatos.id` (`AMBIENTACION_POR_ARCO` en `ShopScreen.jsx`) —
mismo diseño visual en los 3 arcos, sabor narrativo distinto.
