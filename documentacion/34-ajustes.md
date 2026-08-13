# Ajustes (`components/Settings/SettingsScreen.jsx`)

Punto 14 del roadmap. Ventana sobre el mapa, como Missions y el Bingo Book: es una consulta, no un
momento de la run (criterio del [33](./33-direccion-visual.md)). Se abre con el **engranaje** del menú
vertical.

## Por qué este punto valía la pena antes que otros

No por lo que añade, sino por **lo que retira**. Tres cosas que estaban a medias se cierran aquí:

- **El engranaje del menú tenía un significado prestado.** La maqueta lo dibujó como "ajustes" y hacía
  de pantalla completa porque no había pantalla de ajustes. Ahora abre lo que dibuja, y **pantalla
  completa se muda dentro**.
- **El botón `[DEV] Reset progress`** vivía en la pantalla de logros con un "quitar antes de publicar"
  pegado desde que existe el sistema de logros. Se convierte en una opción de verdad, con confirmación
  y en el sitio donde un jugador la buscaría.
- **El modo claro/oscuro** era una decisión aplazada sin sitio donde caer.

## La lista es propia, no la de la referencia

El criterio para que una opción entre: **que exista algo real que activar, y que un jugador quiera
cambiarlo más de una vez.**

| Sección | Opción | Notas |
|---|---|---|
| Display | Tema oscuro / claro | Ver abajo |
| Display | Pantalla completa | Se mudó del menú. El estado se sigue del evento `fullscreenchange` porque se puede salir con F11 o Escape sin pasar por el botón |
| Combat | Velocidad de animación (×1 / ×2 / instantánea) | Ver abajo |
| Combat | Saltar la pantalla de transformación | ⚠️ **Desactivada por defecto**, con test que lo fija |
| Progress | Reiniciar la meta-progresión | Logros + Bingo Book, con confirmación. No toca la run en curso |
| Sonido | — | **No se pinta.** No existe el sistema (backlog), y un interruptor que no hace nada es peor que no tenerlo. Misma regla que dejó fuera el raíl del 5b |

**Lo que se quedó fuera, para no volver a plantearlo:** idioma (el juego está escrito directamente en
inglés, en una sola versión y sin i18n; un selector no es una opción de ajustes, es construir i18n),
efectos de clima (no existen), mostrar atajos de teclado (el único es Escape) y saltar la confirmación de
reiniciar run (guarda algo irreversible y solo ahorra un clic).

## Dónde vive la configuración, y por qué en un store nuevo

`useSettingsStore`, con su propia clave de `localStorage`. Por descarte:

- **`useGameStore` no**: muere con la run, y el tema no puede reiniciarse al perder.
- **`useAchievementsStore` tampoco**, aunque sí sobreviva: es **progresión**. Lo que has desbloqueado y
  cómo prefieres ver el juego son cosas distintas, y mezclarlas haría que "reiniciar la meta-progresión"
  te cambiara además el tema.

⚠️ **El store no toca el DOM.** Aplicar el tema (`data-tema`) y la velocidad (`--factor-animacion`) es
trabajo de un `useEffect` en `App.jsx`. Dos razones: el store se mantiene puro y testeable, y los tests
corren con `environment: 'node'` — no hay `document`, así que un store que lo tocara reventaría al
importarlo.

## El tema: redefinir variables, no repasar pantallas

Las utilidades de Tailwind v4 compilan a `background-color: var(--color-tinta-900)` (verificado en el
bundle), así que un bloque `[data-tema='claro']` en `index.css` que redefina los tokens cambia las ocho
pantallas de golpe, sin tocar un componente. Cubre también `body` y `.scroll-pixel`, que ya leen los
tokens con `var()`.

⚠️ **Desde que hay dos temas, los nombres de los tokens significan el ROL y no el color**: `tinta-*` es
la superficie y `pergamino-*` el contenido que va encima, así que en modo claro `pergamino-100` es tinta
oscura. Se decidió conservar los nombres en vez de renombrar ~240 usos en 15 archivos; el precio es esta
nota.

⚠️ **Lo que NO cambia entre temas**: los colores de elemento (katon…) y los de acento (`exito`, `oro`,
`sello`). Son del **contenido**, no de la interfaz — un jutsu de fuego es rojo en los dos.

### La rampa de superficies conserva su DIRECCIÓN, no sus valores

⚠️ Este fue el error de fondo del primer pase, y explica por qué el tema claro se veía plano en las ocho
pantallas aunque los bordes ya fueran oscuros.

`tinta-950 → 900 → 800` no son "tres oscuros": son **hundido → panel → realzado**. En oscuro eso va de
oscuro a claro, y de ese sentido dependen todas las relaciones del kit: el panel se despega del fondo de
página, `tono="hueco"` (`bg-tinta-950/60`) se lee como un agujero dentro del panel, y `hover:bg-tinta-800`
aclara al pasar por encima.

El primer pase **invirtió los tres valores uno a uno**, dejando 950 como el más claro. Eso no le da la
vuelta al tema, le da la vuelta a las relaciones:

| | Oscuro | Claro, primer pase | Claro, ahora |
|---|---|---|---|
| Panel contra el fondo de página | más claro → se despega | más **oscuro** → se hunde en él | más claro → se despega |
| `tono="hueco"` dentro del panel | más oscuro → agujero | más **claro** → sobresale | más oscuro → agujero |
| `hover:bg-tinta-800` | aclara | **oscurece** | aclara |

De ahí la sensación de "los bordes no resaltan": el borde ya estaba en `marco` y era oscuro: **lo que no
separaba era la superficie**. Un panel del mismo valor que la página no se ve como una caja por muy fina
y oscura que sea su línea.

La regla, para el próximo token que se añada: **preguntarse si el token es un valor o una relación.** Si
significa "más hundido que" o "más realzado que", el tema no puede invertirlo — tiene que reescribir sus
valores conservando el orden.

### El marco no se invierte: es siempre del lado opuesto a la superficie

⚠️ `--color-marco` **no aparece en el bloque `[data-tema='claro']`, y la ausencia es deliberada.** El
primer pase lo aclaraba a un tostado (`#A9906B`) por simetría con el resto de la tabla, y el tema claro
salió **sin bordes**: todos los paneles fundidos en la misma mancha crema, justo el contraste que hace
bonito al oscuro. Con un único `#4D463B` para los dos temas, el mismo color se lee como una línea que
aclara sobre tinta y como una línea oscura sobre pergamino.

Vale para cualquier token que se añada: **antes de darle un valor por tema, comprobar si su papel es
contrastar con la superficie.** Si lo es, el valor constante ya hace el trabajo, y además no puede
quedarse a medias en uno de los dos temas.

### `.escena-oscura`: lo que se pinta encima de un dibujo no sigue al tema

Un PNG de arte no cambia con el tema, así que lo que se superpone a él tampoco puede. Tres sitios llevan
la clase, y basta con eso porque lo único que hace es **redefinir los tokens en ese subárbol** — las
utilidades ya leen `var()`, así que no hubo que tocar una docena de clases:

| Dónde | Qué se rompía en claro |
|---|---|
| El lienzo del mapa (`MapScreen`) | El fondo del nodo pasaba a ser un disco crema —se ve por los bordes del sprite, y entero en el nodo de inicio, que no tiene— y las líneas de camino quedaban en tinta oscura sobre roca oscura |
| La columna del menú vertical | El realce del hover se pinta encima de un menú ya dibujado: tiene que aclararlo, no mancharlo |
| `TransformationScreen` | Es espectáculo, no interfaz. Su destello ya va en un claro **fijo**, y sobre un velo crema no existiría |

De paso, `AdornoMarco` se movió **dentro** del lienzo del mapa: sus piezas son `absolute` y el contenedor
de fuera no es `relative`, así que se anclaban al div raíz de la pantalla y los cuatro corchetes se
pintaban en las esquinas de la **pantalla** en vez de abrazar al mapa. Llevaba así desde que se compuso a
mano, y no se notó porque un corchete de 10 px en la esquina de la ventana no parece un error.

### Lo que hubo que arreglar antes de que el tema fuera posible

Invertir los tokens destapa todo sitio que asumía un fondo fijo. Se limpiaron antes:

- **Un bug real que ya se veía**: `COLOR_RAREZA.comun` era `text-pergamino-200/70` dentro de la caja
  crema de `ItemHoverCard` → crema sobre crema. La línea de rareza era casi invisible en la ficha de
  cualquier objeto común, y hay varios.
- **Los últimos tres restos de la paleta invertida** (fondo claro con texto oscuro, anteriores al kit):
  las dos fichas de `ItemHoverCard` y el tooltip de pasiva de `CombatScreen`. Pasan a `PanelMarco`.
- **`--color-sobre-acento`**, un token nuevo **igual en los dos temas**, para el texto que va encima de
  un color vivo y antes usaba `text-tinta-950`: el botón RECRUIT sobre verde, la pastilla de pasiva sobre
  oro, y las tres piezas de `BotonCerrar`. Al invertir el tema se habrían vuelto claro sobre claro.
- El **destello** de la transformación pasa a un color fijo: un destello es claro en los dos modos, y con
  `pergamino-100` se habría convertido en un fogonazo de tinta oscura.

### Los bordes que no eran `marco`

`marco` se creó para que el borde de los paneles se tocara en un sitio, pero quedaban **ocho bordes
escritos a mano** con un `pergamino-*` a poca opacidad, de antes de que el token existiera: el botón
`sobreFondo` (el SKIP de reclutar y el LEAVE de la tienda), las barras de HP y de jutsu, la sombra del
sprite en combate, la pastilla de tipo neutra y el registro de desarrollo. En oscuro un crema al 10-30%
sobre fondo oscuro pasa por una línea tenue aceptable; en claro es tinta al 10-30% sobre pergamino, o sea
un gris lavado — y encima cada uno con su opacidad, así que ninguno igual al de al lado.

Todos pasan a `marco`. La regla que queda: **`pergamino-*` es para texto y glifos; un borde es `marco` o
un color de acento.** Dos excepciones a propósito, las dos con su comentario en el código:
`EtiquetaFlotante` (marco crema, porque es una anotación sobre el dibujo del mapa) y los corchetes de
`AdornoMarco` (son la firma del kit y funcionan simétricos: crema sobre tinta, tinta sobre pergamino).

⚠️ **Caveat conocido y aceptado**: las clases con modificador de opacidad (`bg-tinta-950/60`) emiten dos
reglas, una literal de respaldo y otra con `color-mix(… var(…) …)`. En un navegador sin `color-mix` gana
la literal y esa superficie se queda oscura. En los navegadores actuales se aplica la buena.

## La velocidad: un solo factor para los dos relojes

Las duraciones de las animaciones de combate estaban **duplicadas**: trece reglas `animation:` en
`index.css` y nueve constantes `MS_*` en JS, con un comentario que pedía acordarse de cambiar las dos.
Ahora las de CSS son `calc(320ms * var(--factor-animacion, 1))` y las de JS se multiplican por el mismo
número, que sale de `FACTOR_ANIMACION`. El ajuste mueve los dos a la vez y no pueden separarse.

⚠️ **"Instantánea" no se implementa con factor 0 como duración.** Eso dejaría el replay avanzando golpe a
golpe, solo muy rápido. `CombatScreen` lee el 0 como "la ronda ya está reproducida" y lo **deriva**
(`golpesVistos`, `yaImpactado`) en vez de forzar el estado. La primera versión lo hacía con un `setState`
dentro de un efecto y `react-hooks/set-state-in-effect` lo rechazó — es la misma lección que ya estaba
apuntada para el reset de estado al cambiar de combate: **lo que depende de otro valor se calcula al
renderizar, no se guarda.**

## Saltar la transformación

Lo que se salta es la **celebración**, no el modo: el desbloqueo cuenta igual. Y como
`transformacionesYaContadas` mira cuántas pantallas se han cerrado —que con el ajuste puesto son cero—,
con el ajuste activo se dan por vistas todas de golpe, o las tarjetas se quedarían pintadas con el nivel
viejo.

## Tests

`src/store/useSettingsStore.test.js`: valores por defecto (incluido que **no** salta la transformación),
que persiste los tres ajustes juntos y no solo el que cambia, que **revienta con un ajuste desconocido**
en vez de guardarlo en silencio (mismo criterio que las pasivas), que `cargarAjustes` completa las claves
que falten en lo guardado por una versión anterior, y que cada velocidad traduce a su multiplicador.

No hay tests de la pantalla: el proyecto no tiene tests de componentes React, así que su red de seguridad
es la prueba manual.
