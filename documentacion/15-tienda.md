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
(`inicial: 40, comun: 40, raro: 70, legendario: 120`) y `characters.json[].rareza` — nada nuevo que
diseñar, ya estaba listo desde la sesión de reclutamiento/rareza (ver
[14 - Reclutamiento y rareza](./14-reclutamiento-y-rareza.md)). `inicial` se añadió al mismo precio
que `comun` cuando los "inicial" no elegidos empezaron a poder reclutarse (ver más abajo).

## Nivel de reclutamiento

El personaje reclutado entra al nivel del miembro más fuerte del equipo actual
(`Math.max(...equipo.map(p => p.nivel))`, calculado en `avanzarANodo` al entrar al nodo) — **no**
al nivel del piso (`calcularNivelPorPiso`), que se usó al principio y daba reclutas muy por debajo
del resto del equipo nada más empezar la run a jugarse en serio (p. ej. nivel 2 con el equipo ya en
nivel 8). Si además reemplaza a alguien (equipo lleno), suma `config.equipo.bonusNivelAlReemplazar`
— reemplazar da una ventaja real, no es solo lateral a rellenar un hueco vacío. Ver
[19 - Selección de personaje](./19-seleccion-de-personaje.md).

## Acciones del store

- `comprarConsumibleTienda(itemId)` — descuenta oro, añade al inventario, quita el item de la oferta.
- `reclamarObjetoGratuitoTienda()` — añade el objeto gratuito sin coste, una sola vez por visita.
- `reclutarDeTienda(personajeId, idAReemplazar = null)` — llama a
  `reclutarPersonaje(id, nivelReclutamiento, idAReemplazar)`, descuenta el oro, y vacía
  `reclutables` (descarta la otra opción). No cobra si `reclutarPersonaje` falla.

## Reclutar con el equipo lleno: reemplazo, no bloqueo

Desde que la run empieza con 1 solo personaje (ver
[19 - Selección de personaje](./19-seleccion-de-personaje.md)), llegar a `tamanoMaximo` reclutando
y luego querer reclutar OTRO más es el caso normal, no una excepción — así que ya no se bloquea el
botón. `reclutarPersonaje(id, nivelInicial, idAReemplazar)`: si hay hueco, añade igual que siempre;
si no, exige `idAReemplazar` (si no se pasa, no hace nada — así la UI puede pedírselo al jugador en
vez de fallar en silencio) y sustituye a ese personaje **en su misma posición** del equipo. El
reemplazado sale de la run tal cual estaba, no hay banquillo aparte donde guardarlo.

En `ShopScreen.jsx`, pulsar "Reclutar" con el equipo lleno abre un panel `ElegirReemplazo` con los
3 miembros actuales (cada uno con su tarjeta de hover, igual que en cualquier otro sitio donde se
muestra un personaje) para elegir a quién sacar, o cancelar sin cobrar nada.

## Quién puede aparecer para reclutar en el primer arco

`pais_de_las_olas.personajesReclutablesIds` está vacío a propósito (ver
[19 - Selección de personaje](./19-seleccion-de-personaje.md)) — el primer arco no tiene ningún
recluta "normal" propio. `generarOfertaTienda` construye el pool de reclutables con tres fuentes:

1. `arcoActualDatos.personajesReclutablesIds` (vacío en País de las Olas).
2. Personajes desbloqueados por logro (`desbloquearPersonajeReclutable`) — p. ej. Haku o Zabuza si
   ya se derrotaron en una run anterior.
3. **Los personajes `rareza: 'inicial'` que NO se eligieron al empezar la run** (Naruto, Sasuke,
   Sakura menos el elegido). Sin esto, un jugador que nunca ha desbloqueado ningún logro no podría
   formar un equipo de 3 hasta llegar al segundo arco — con esto, siempre hay 2 candidatos válidos
   para completar el equipo aunque sea la primerísima run.

El resto del roster "normal" (Rock Lee, Neji, etc.) vive en `examen_chunin.personajesReclutablesIds`,
inalcanzable hoy porque los arcos todavía no están encadenados en una sola run (`App.jsx` solo
arranca `pais_de_las_olas`, ver el punto de encadenar arcos en [05 - Roadmap](./05-roadmap.md)).

## Dirección visual

Puesto de mercader ambulante con farolillo (🏮), mismos tokens de tinta/pergamino que el resto de
la UI. El texto de ambientación cambia según `arcoActualDatos.id` (`AMBIENTACION_POR_ARCO` en
`ShopScreen.jsx`) — mismo diseño visual en los 3 arcos, pero el sabor narrativo varía (mercader
huyendo de Gato en País de las Olas, comerciante furtivo en el Bosque de la Muerte, superviviente
entre los escombros en la Invasión de Pain).
