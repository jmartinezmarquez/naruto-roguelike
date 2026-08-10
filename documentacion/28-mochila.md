# Mochila (`components/Inventory/`)

Implementación de los diseños [23](./23-diseño-tarjeta-de-inventario.md) (tarjeta de inventario) y
[24](./24-diseño-tarjeta-equipar-objeto.md) (pantalla de equipar). Sustituye al selector en línea
que vivía dentro del panel de objetos del mapa: aquello resolvía la mecánica, pero se sentía un
formulario web y no un inventario de RPG.

## Pantalla

`pantalla: 'mochila'` en el store, con `abrirMochila(itemIdInicial)` para entrar y `volverAlMapa()`
para salir (que además limpia `mochilaItemId`).

Es **una sola tarjeta estrecha y centrada** (360 px) **dibujada ENCIMA del mapa**, no una pantalla
que lo sustituya: `App.jsx` renderiza `<MapScreen />` y `<InventoryScreen />` a la vez cuando
`pantalla === 'mochila'`, y la tarjeta va en una capa `fixed`. El jugador sigue viendo dónde está
mientras decide, como el diálogo de objeto de un Pokelike. Tocar fuera de la tarjeta cierra.

La primera versión ocupaba todo el viewport en dos columnas y se comía la pantalla; la referencia
de Pokelike es una ventanita pequeña, y eso es lo que la hace rápida de leer.

Dos vistas, nunca las dos a la vez:

1. **La lista.** Una fila por objeto: sprite, nombre y rareza. Sin descripción — es lo que llena de
   ruido la lista, y la ficha ya lo cuenta.
2. **La ficha del objeto.** Sprite, nombre, rareza · tipo, efecto en una línea visual
   (`⚔ +2 Attack`), descripción y, **justo debajo, un personaje por fila con su propio botón**
   (`Equip` / `Use`, o `Worn` desactivado si ya lo lleva). No hay paso intermedio de "elegir
   personaje": equipar es un solo clic desde la ficha. Si el objeto ya está puesto, en lugar de la
   lista de personajes sale quién lo lleva y un único `Unequip`.

**Aviso al reemplazar.** Cada fila enseña el hueco del personaje (`empty slot` o el objeto que ya
lleva) y su botón dice `Replace` en vez de `Equip` cuando el hueco está ocupado. Además, ahí no se
equipa directamente: primero sale una confirmación que dice qué objeto sale y que vuelve a la
mochila. Equipar encima desplaza el objeto anterior, y eso no se ve venir desde una fila con un
botón.

**Al equipar, usar o desequipar se vuelve al mapa.** La mochila es un gesto corto; colocar dos
objetos significa abrirla dos veces, igual que en Pokelike. Es a propósito: es lo que permite que
sea así de pequeña.

## Sprites de objeto

`scripts/generar-sprites-objetos.py` recorta los 10 sprites de
`assets/sprite-objetos-iniciales.png` (la hoja del artista los trae juntos, con título y rareza) a
`assets/items/<id>.png`, con el id de `data/items.json` como nombre. Dos detalles del recorte:

- El fondo se quita con **relleno por inundación desde el borde**, no con un umbral global de "casi
  negro": los sprites tienen contornos oscuros dentro (la botella, el pergamino) y un umbral global
  los habría agujereado.
- Cada sprite sale en un lienzo **cuadrado** con el dibujo centrado. Las cajas originales tienen
  proporciones muy distintas (la banda es apaisada, el sello es alto) y sin cuadrarlas la lista
  bailaba de fila en fila.

El mapeo id → sprite vive en `components/Inventory/itemSprites.js`, junto con los colores de rareza
(verde común, azul raro, morado legendario — el mismo código que usa la hoja del artista) y
`lineasDeEfecto()`, que traduce el `efecto` del JSON a la línea visual. Un objeto sin sprite cae a
un emoji genérico, no rompe nada.

Los mismos sprites se usan en la tienda, en la recompensa de mini-jefe, en el hover de objeto y en
el resumen del mapa, así que un objeto se reconoce por su dibujo en todas partes.

## El panel del mapa se queda como resumen

`PanelObjetos` (en `MapScreen.jsx`) ya no equipa nada: enseña oro y los objetos sueltos con su
sprite. **La única forma de abrir la mochila es tocar un objeto**, y se abre directamente en su
ficha (`abrirMochila(id)`), sin pasar por la lista.

Ni botón "abrir mochila" ni cabecera clicable: el botón repetía lo que ya hace tocar un objeto, y
que "ITEMS" y el oro abrieran también la mochila solo provocaba aperturas sin querer.
