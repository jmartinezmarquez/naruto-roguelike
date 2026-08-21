# Dirección visual: el kit de piezas compartidas (`components/common/PiezasUI.jsx`)

## Por qué existe

Cada pantalla de menú se había escrito por su cuenta con utilidades de Tailwind sueltas. El resultado
eran ocho pantallas que compartían **paleta** pero ningún **lenguaje**: bordes de tres grosores
distintos, cabeceras con tres jerarquías distintas, botones de vuelta con tres formas, y ningún sitio
con las esquinas en corchete de las maquetas.

Las dos maquetas de referencia —`layoutPantallaLogros.png` (doc [25](./25-diseño-pantalla-logros.md)) y
la de enciclopedia que trajo el usuario— comparten un lenguaje muy concreto. La conclusión que importa
es que ese lenguaje son **seis piezas reutilizables, no dos pantallas rediseñadas**. Rediseñar pantalla
a pantalla habría vuelto a producir ocho dialectos; con el kit, cada pantalla nueva sale ya en estilo.

**Regla al añadir una pieza**: si solo la usa una pantalla, no es una pieza — se queda en su archivo.
Esto no es una librería de componentes, es el mínimo común de las que ya existen.

## Colores semánticos: el arreglo que había que hacer antes de pintar nada

La paleta tenía colores de **elemento** (katon, fuuton, raiton, doton, suiton) y ninguno **semántico**.
Consecuencia real, no teórica: el verde de "desbloqueado / victoria / eficaz" era `fuuton` —el color del
chakra de viento— y el oro de "legendario / crítico" era `raiton`. Ocho sitios usaban un color de
elemento para decir algo que no tiene nada que ver con el elemento.

Donde se rompía de verdad es en la **tabla de eficacias de la enciclopedia**: pinta los cinco elementos
y a la vez tiene que decir "esto es bueno / esto es malo", así que el significado y el elemento
acababan en la misma casilla con el mismo color.

Tokens nuevos en `index.css`:

| Token | Valor | Para qué |
|---|---|---|
| `--color-exito` | `#62B36F` | desbloqueado, victoria, eficacia alta, pasiva beneficiosa |
| `--color-oro` | `#D4A93A` | recompensa, rareza alta, pestaña activa, transformación |
| `--color-marco` | `#4D463B` | el borde de todos los paneles |

`marco` existe porque el borde estaba escrito como `pergamino-100/20` en cada pantalla: cambiar el
grosor o el tono obligaba a un buscar-y-reemplazar por todo el proyecto.

⚠️ **Un color semántico no sirve como color de rótulo.** `exito` significa "esto es bueno / desbloqueado
/ eficaz", y de rótulo gigante ("Victory" al ganar un combate) competía con toda la paleta de pergamino y
tinta: era lo único de la pantalla que no parecía del mismo juego. Los rótulos van en la paleta base, que
además sigue al tema; los semánticos se quedan para marcar estados dentro de una lista o una tabla.

⚠️ Los colores de elemento **siguen usándose como elemento** (el marco de una casilla por naturaleza de
chakra, la rueda, las pastillas de tipo). Lo que ya no se hace es usarlos como significado.

⚠️ **Desde que hay dos temas (punto 14, ver [34](./34-ajustes.md)), los nombres de estos tokens
significan el ROL y no el color**: `tinta-*` es la superficie y `pergamino-*` el contenido que va encima,
así que en modo claro `pergamino-100` es tinta oscura. Se conservaron los nombres en vez de renombrar
~240 usos en 15 archivos, y el precio es tenerlo escrito aquí. Hay un token más que **no cambia entre
temas**, `sobre-acento`: es el texto que va encima de un color vivo (el botón RECRUIT sobre verde, la
pastilla de pasiva sobre oro, la X de `BotonCerrar`), y si siguiera a `tinta-*` se volvería claro sobre
claro al cambiar de tema.

## El contorno de la fuente de Naruto

El logo de la serie son letras de color con un **contorno grueso alrededor**, y es lo que las hace
legibles encima de un cielo, de una calle o de lo que sea. Nuestros títulos van casi siempre sobre el
fondo de juego o sobre una barra de color, así que llevan el mismo tratamiento.

Va **en la propia clase `font-naruto`**, no en una clase de adorno: así lo tiene todo título por el hecho
de usar la fuente, y no es algo que haya que acordarse de añadir en la siguiente pantalla. Antes cada
título llevaba su propio `drop-shadow-[...]` a mano, con tres valores distintos entre cinco usos.

⚠️ **La regla es que el contorno es el negativo del RELLENO, no del fondo.** De ahí las dos variantes, y
elegir mal la variante es lo único que puede salir mal:

| Relleno | Contorno | Quién |
|---|---|---|
| Sigue al tema (`text-pergamino-100`) | Por defecto: `tinta-950`, que sigue al tema también | `CabeceraPantalla`, el nombre del arco en el mapa |
| Fijo (oro, verde, rojo, crema) | `.contorno-fijo`: tinta oscura constante | Victory/Defeat, el nombre de una transformación, la barra de título |

Que el caso por defecto funcione no es casualidad: `tinta-*` y `pergamino-*` son **las dos caras** de la
misma decisión de tema, así que `tinta-950` es siempre el lado opuesto a `pergamino-100`, en los dos
modos. Y si el relleno es constante, su contorno tiene que serlo también.

Se hace con `text-shadow` en ocho direcciones y no con `-webkit-text-stroke`, que daría una línea más
limpia: el `stroke` se pinta **encima** del relleno salvo que el navegador soporte `paint-order`, y donde
no lo soporte adelgaza la letra en vez de rodearla. Ocho sombras sin difuminado funcionan en todas partes
y además son nítidas, que es lo que pide el resto de la interfaz.

### `sobre-sello`, la pareja de `sobre-acento`

Hizo falta un token más al hacer esto: `--color-sobre-sello` (`#EDE3CC`, **igual en los dos temas**), el
contenido que va encima del **rojo de sello** — el único acento oscuro de la paleta. `sobre-acento` cubría
el caso contrario (tinta sobre verde u oro), y este faltaba: con `pergamino-100`, en modo claro la barra de
título de las ventanas, el botón principal, BUY y los tres botones de la mochila salían con **tinta oscura
sobre granate**, que es la peor de las dos combinaciones que caben. Son seis sitios, todos con el mismo
patrón `bg-sello-600 text-…`.

## Las seis piezas

### `PanelMarco`
Fondo oscuro, borde fino, una línea interior a 3 px y **cuatro esquinas en corchete**. Es la pieza que
más hace por que esto parezca un juego y no una web.

Los corchetes van como cuatro `<span>` absolutos y no como pseudoelementos porque hacen falta cuatro:
`::before` y `::after` solo dan dos, y con `border-image` no se controla el grosor por esquina. La línea
interior es un `inset-[3px]` aparte: dos bordes concéntricos con hueco entre ellos no se pueden hacer
con una sola caja.

Tres tonos: `panel` (contenido), `hueco` (bloqueado o vacío, más apagado) y `activo` (corchetes en rojo
de sello para lo seleccionado).

⚠️ **`esquinas={false}` quita los corchetes, y hace falta más de lo que parece: los corchetes marcan el
CONTENEDOR, no cada cosa que hay dentro.** Una caja con corchetes que contiene cuatro tarjetas con
corchetes cada una es exactamente lo que convierte un marco bonito en ruido. Se vio al llevar el kit a
la pantalla de combate, que era la que daba miedo por sobrecarga: las dos cajas de bando llevan
corchetes y las hasta cuatro tarjetas de luchador de dentro se quedan con el borde fino. Con eso la
pantalla no se abarrota — el problema no era el marco, era anidarlo.

### `VentanaModal`
Ventana flotante con barra de título y X en la esquina, estilo sistema operativo antiguo — la forma en
que Pokelike abre sus pantallas de Logros y Pokédex. Tres cosas la definen:

1. **Se dibuja encima del mapa**, no en su lugar. El jugador no pierde de vista dónde está mientras
   consulta, y por eso consultar no interrumpe la partida. Es el patrón que ya usaba la mochila, ahora
   compartido: `App.jsx` tiene una sola tabla de pantallas que van "encima del mapa".
2. **La barra de título ocupa el borde de arriba.** Por eso esta pieza **no usa `PanelMarco`**: su línea
   interior y sus esquinas en corchete cruzarían la barra de color y se pelearían con ella. La ventana
   es el marco; `PanelMarco` se usa para los bloques de dentro. Esa división es la que mantiene las dos
   piezas simples.
3. **El scroll es del cuerpo, no de la página.** La barra de título y la `cabeceraFija` —las pestañas—
   se quedan quietas mientras la lista corre debajo, así que nunca se pierde de vista en qué pestaña
   estás. Antes el scroll era de la ventana del navegador y las pestañas se iban hacia arriba.

**No se cierra al pulsar fuera**, al contrario que la mochila. Esa es pequeña y de un gesto; esta es
grande, se navega con pestañas y se hacen muchos clics dentro, así que un clic perdido en el borde no
debería tirar por tierra dónde estabas. Se cierra con la X o con **Escape**.

La barra de scroll va dibujada (`.scroll-pixel` en `index.css`): con el aspecto por defecto del
navegador rompe la ilusión más que cualquier otro detalle, porque es lo único en pantalla que no está
dibujado. Solo WebKit/Blink más `scrollbar-color` para Firefox; donde no se aplique se ve la del
sistema y la ventana funciona igual.

### `BotonCerrar`
La X de una ventana: caja crema con borde negro grueso, la X dibujada dentro y **un bloque de sombra
sólido detrás, desplazado**. Al pasar por encima la caja se levanta y el hueco con la sombra crece —
el botón se despega del panel en vez de solo cambiar de color— y al pulsar se hunde hasta tocarla, el
recorrido completo del gesto.

Dos detalles que parecen menores y no lo son:

- **La sombra es un bloque opaco, no un `box-shadow` difuso.** El desenfoque es lo único de una
  interfaz de pixel art que no puede existir en la rejilla de píxeles: basta un `blur` para que el
  conjunto deje de parecer dibujado.
- **La X son dos barras giradas, no el carácter `✕`.** En `PressStart2P` sale fina y desproporcionada
  frente al grosor del borde, y aquí el grosor es justo lo que la hace leerse como un botón de ventana
  antigua.

La sombra se dibuja **dentro** de la caja del botón (un contenedor de 40 px con la caja de 36 px
arriba-izquierda) y no desbordando, para que no se salga del borde de la barra de título en una ventana
estrecha.

### `CabeceraPantalla`
Antetítulo en versalitas espaciadas + título en `font-naruto` + contador opcional. El antetítulo no es
decoración: dice de qué sistema forma parte la pantalla ("MISSIONS" sobre "Achievements", "RECORDS"
sobre "Encyclopedia"), y en las dos maquetas es la primera línea.

### `FilaPestanas`
Pestañas con icono opcional y **contador por pestaña**. El contador es lo que las hace útiles y no un
filtro a ciegas: en las maquetas cada acto dice cuánto le queda ("ACT 2 · 0/6"), así que la fila es a la
vez navegación y resumen de progreso. La activa va en `oro`.

### `IconoEnmarcado`
Un sprite en su cajita, donde **el color del marco significa algo** (naturaleza, rareza, estado). Con 29
entradas en rejilla, el color del marco se lee antes que cualquier nombre.

`bloqueado` lo deja en silueta con `filter: brightness(0)`, que pone el dibujo entero en negro
**conservando su transparencia** — o sea la forma exacta. Un cuadrado gris habría sido más fácil y no
promete que ahí haya alguien.

### `TituloBloque` y `CampoDato`
El rótulo en versalitas espaciadas y el par etiqueta-valor. Son las dos piezas que hacen que una ficha
se parezca a una ficha de personaje de JRPG y no a una lista de `<dl>`.

⚠️ **`TituloBloque` tiene dos jerarquías y confundirlas se ve enseguida:**

| `tono` | Color | Para qué |
|---|---|---|
| `panel` (por defecto) | crema | el título **DE** una caja, lo más fuerte que hay dentro: "TEAM", "ITEMS", "REWARDS" |
| `seccion` | rojo | una etiqueta **DENTRO** de una tarjeta que ya tiene título, subordinada a él: "BASE STATS", y en las maquetas "AFINIDAD" / "MODOS" |

La primera versión pintaba de rojo las dos cosas, porque el rojo en versalitas es lo que se ve en las
maquetas — pero ahí es siempre una etiqueta subordinada. Aplicado a títulos de panel, el mapa acabó con
**cuatro rojos compitiendo** ("CURRENT ARC" más los tres paneles) y con un problema de fondo: en esta
paleta el rojo **ya significa algo** — es el color del mini-jefe y de la derrota. Un título de panel no
es una alarma.

### `EtiquetaFlotante`
La cajita de una línea que sale al pasar por encima de algo: hover de nodo del mapa y botones del menú
vertical. **Va con marco crema**, no con el borde fino de los paneles, y no es un despiste: esto no es un
panel de contenido, es una anotación que aparece **encima** de otra cosa —a veces encima del propio
lienzo del mapa— y necesita despegarse de lo que tiene debajo. Con el borde en color de marco se perdía.

Sustituye al `title` del navegador donde se use: el nativo tarda un segundo en aparecer y no se parece al
juego. En el menú va a la **izquierda**, porque la columna está pegada al borde derecho de la pantalla.

### `BotonPrincipal` y `BotonSecundario`
El rojo de sello para la acción de la pantalla; el de borde fino para volver atrás. Ninguno lleva
`.elevar-hover`: el rebote va solo en lo que el jugador **elige**, no en lo que ejecuta o cierra (ver
[13](./13-ui-mapa-y-combate.md)).

⚠️ **`BotonSecundario` necesita `sobreFondo` cuando no está dentro de un panel.** Su versión normal es
un borde fino con texto apagado: funciona sobre `bg-tinta-900` y **desaparece** sobre el paisaje de
Konoha, que tiene luces y detalle por todas partes. Pasó dos veces —el "LEAVE" de la tienda y el "SKIP"
de reclutar— y por eso es una variante de la pieza y no un `className` que copiar: a la tercera habría
vuelto a pasar. La regla general, la misma que con `tono="hueco"`: **lo que flota sobre el fondo del
juego necesita fondo propio.**

## Aplicado hasta ahora

**Los nombres de cara al jugador son "Missions" y "Bingo Book"**, no "Achievements" y "Encyclopedia".
El Bingo Book es el registro de ninjas fichados del propio Naruto, así que la pantalla se llama en el
juego como se llamaría ahí dentro — es más de lo que hace por evocar la serie que cualquier borde.
⚠️ **Los ids internos siguen en su idioma lógico**: `pantalla: 'enciclopedia'`, `abrirLogros`,
`EncyclopediaScreen`, `documentacion/32-enciclopedia.md`. Es la misma regla que ya rige los JSON (las
claves son claves, no texto de display, ver `CLAUDE.md`), y evita renombrar ficheros, tests y
documentos por un cambio de rótulo.

**Logros y Enciclopedia se abren como `VentanaModal` sobre el mapa.** Ya no llevan botón "Back to map"
al final: la X de la barra de título lo sustituye, y el botón de más abajo obligaba a bajar el scroll
entero para cerrar.

- **Logros** (`AchievementsScreen`), siguiendo `layoutPantallaLogros.png`: cabecera con porcentaje,
  pestañas por acto con su contador, y filas con icono enmarcado + objetivo + recompensa + estado.
  - Las **categorías por acto se calculan, no se escriben**: `achievements.json` no tiene campo
    `categoria` y no le hace falta, porque toda condición apunta ya a un arco por su `arcoId` o por el
    `jefeId` de su mini-jefe o jefe final. Añadir el campo habría sido duplicar en los logros un dato
    que ya vive en los arcos, con las dos copias libres de desincronizarse.
  - El **icono de cada logro sale de su recompensa**, no de arte propio: un logro que desbloquea a Haku
    enseña a Haku, y uno que da un objeto enseña el objeto. Se lee igual de bien, no inventa nada y de
    paso dice el premio sin leer. Cuando haya arte, se cambia solo `iconoDeLogro`.
  - Una pestaña sin ningún logro **no se pinta**: con 7 logros repartidos, ofrecer un acto vacío es
    ofrecer una pantalla en blanco.
- **Enciclopedia** (`EncyclopediaScreen`, ver [32](./32-enciclopedia.md)): mismo marco, pestañas de
  sección con contador de descubiertas, **segunda fila de filtro por naturaleza de chakra** (con 29
  luchadores la rejilla se recorre mucho mejor por elemento que por orden de JSON), casillas con el
  marco del color de su tipo y fichas montadas con `TituloBloque` / `CampoDato`.

## Lo que las maquetas piden y NO se ha hecho, a propósito

- **El raíl de "recompensas de progreso global"** (+5% oro, +5% EXP, +1 hueco de inventario, más
  frecuencia de raros). **No es diseño, es el punto 5b del roadmap**: modificadores numéricos
  permanentes que desplazan la curva de niveles que vigilan los invariantes de arco de
  `leveling.test.js`. Pintar un raíl con premios que no existen es peor que no tenerlo. El hueco queda
  reservado.
- **El menú lateral vertical y la barra inferior** (Misiones / Enciclopedia / Ajustes / Salir). Eso es un
  **shell de navegación**, no un estilo: hoy cada pantalla es autónoma y se cierra con "Back to map".
  Decidido dejarlo fuera por ahora; si algún día entra, el kit ya estará hecho y el shell es un
  envoltorio por encima. "Ajustes" además sigue sin tener ninguna opción real que ofrecer.
- **"Aldea" y "Afiliación"** en la ficha de personaje: no existen en `characters.json`. Son 29 entradas
  de contenido nuevo por escribir, no un campo que pintar.
- **Los números de las maquetas** (68 ninjas, 28 logros): hay 29 luchadores y 7 logros. Los contadores
  dicen la verdad en vez de imitar la maqueta — una rejilla con 39 siluetas vacías cuenta una mentira.

## Los paneles del mapa y el menú vertical

**Los tres paneles del mapa ya son del kit.** Iban cada uno por su cuenta —equipo y objetos en
`bg-pergamino-100` (crema, con texto oscuro), la rueda de chakra en oscuro— y al lado de las ventanas de
Missions y el Bingo Book se veía que no eran del mismo juego. Ahora los tres son `PanelMarco` +
`TituloBloque`, con lo que el mapa entero comparte lenguaje con el resto.

**El menú pasó de horizontal a vertical**, como el de Pokelike, siguiendo `LayoutMenuVertical.png`.
Con cuatro entradas cabe algo bastante más grande que los iconos de 36 px de antes.

**Los sprites propios del menú están por llegar** (ver "Pendiente de arte" del roadmap): cuando existan,
esto vuelve a ser cuatro iconos sueltos con el marco de la columna dibujado por CSS, que es más flexible
—se puede añadir o quitar una entrada— y permite realzar el icono y no su hueco.

⚠️ Mientras tanto, **la columna es UNA imagen con cuatro botones transparentes encima**, uno por cuarto de alto, y no
cuatro sprites recortados. El primer intento fue recortarlos como el resto de los sprites del juego y
era pelearse con el dibujo: esa hoja **no es una hoja de sprites** con separaciones limpias, es un menú
ya terminado —marco, huecos e iconos dibujados juntos—, así que cualquier recorte se llevaba trozos del
marco o agujereaba el sombreado del icono. Tres intentos de detección (por color exacto, por
luminosidad, por mínimo de píxeles en línea) fallaron por lo mismo, más un detalle que costó ver: **la
columna no está centrada en la hoja** (rail izquierdo en x=13-20, derecho en x=104-112), así que un
margen lateral simétrico dejaba fuera uno y se comía medio del otro.

El precio de usarla entera: los cuatro huecos están **pintados**. Añadir o quitar una entrada exige
redibujar la columna. Los botones se reparten por índice sobre el número de entradas, así que el código
no se rompería — pero los iconos dejarían de coincidir con los huecos, y eso se ve.

El engranaje abre **Ajustes** —lo que la maqueta dibujó— y el torii **reinicia la run**: la maqueta traía
torii de "salir", y un torii es una puerta por la que se sale, que es lo que se hace al abandonar una run.
Hasta el punto 14 el engranaje hacía de pantalla completa, que era un apaño mientras ajustes no tenía
ninguna opción real que ofrecer; ahora pantalla completa vive dentro de ella (ver [34](./34-ajustes.md)).

## Modo claro y modo oscuro: hecho

Es el ancla del **punto 14** y ya está — ver [34](./34-ajustes.md) para el cómo, incluido lo que hubo que
limpiar antes de que invertir los tokens fuera posible (tres restos de la paleta anterior al kit, un bug
de crema sobre crema y el token `sobre-acento`).

Lo que hace que eso sea viable sin rehacer nada es el trabajo de tokens de este documento: si los
colores fueran `bg-tinta-900` escritos por todas partes no habría tema que cambiar, pero al estar el
significado separado del elemento —`exito`, `oro`, `marco`— y el marco concentrado en `PanelMarco`, un
tema es redefinir un puñado de variables en `index.css`, no repasar ocho pantallas. **Los colores de
elemento (katon…) NO cambian entre temas** — son del contenido, no de la interfaz.

### Las correcciones del primer pase, que son las que dejan el tema claro con carácter

Tras verlo funcionando salieron tres cosas. Las dos primeras son la misma idea —**un token puede ser un
valor o una relación, y una relación no se invierte**— y la tercera es que **no todo lo que hay en
pantalla es interfaz**.

- ⚠️ **Sobre el fondo del juego, el texto va a opacidad COMPLETA.** Apagar un texto con alpha da por
  hecho que debajo hay una superficie con la que mezclarse: dentro de un panel funciona, pero sobre la
  ilustración de fondo un 45-60% de tinta se queda en gris lavado, y "65 gold available" o el reclamo
  del mercader dejaban de leerse en modo claro. Eran **ocho textos sueltos con cuatro opacidades
  distintas** —el contador de `CabeceraPantalla` y la línea de subtítulo que cada pantalla completa
  escribía por su cuenta debajo—, todos de cuando el fondo era oscuro y el alpha no se notaba. El alpha
  es para el texto **de dentro de un panel**.
- ⚠️ **La rampa `tinta-950 → 800` conserva su DIRECCIÓN** (hundido → panel → realzado), no sus valores.
  El primer pase invirtió los tres uno a uno y con eso el panel salía más oscuro que la página —se hundía
  en ella en vez de despegarse—, los huecos más claros que el panel que los contiene y el hover
  oscurecía. Era la causa real de que el tema claro se viera plano en las ocho pantallas: el borde ya era
  oscuro, lo que no separaba era la superficie. Detalle y tabla en [34](./34-ajustes.md).

- ⚠️ **El marco NO se invierte: es siempre del lado opuesto a la superficie.** El primer pase aclaraba
  `marco` a un tostado (`#A9906B`) por simetría con el resto de la tabla, y el resultado era un tema sin
  bordes — todos los paneles fundidos en la misma mancha crema, sin el contraste que hace bonito al
  oscuro. Ahora `marco` **no se redefine**: el mismo `#4D463B` se lee como una línea que aclara sobre
  tinta y como una línea oscura sobre pergamino. Un solo color da las dos lecturas.
- **`.escena-oscura`: lo que se pinta ENCIMA DE UN DIBUJO se queda oscuro en los dos temas.** Un PNG de
  arte no cambia con el tema, así que lo superpuesto tampoco puede. Lo llevan el **lienzo del mapa** (el
  fondo del nodo salía como un disco crema —se ve por los bordes del sprite, y entero en el nodo de
  inicio, que no tiene— y las líneas de camino quedaban en tinta oscura sobre roca oscura), la **columna
  del menú vertical** (el realce del hover tiene que aclarar el dibujo, no mancharlo) y la **pantalla de
  transformación** (es espectáculo, no interfaz; su destello ya va en un claro fijo y sobre un velo crema
  no existiría). Se resuelve **redefiniendo los tokens en ese subárbol**, no cambiando una docena de
  clases a colores fijos: las utilidades ya leen `var()`, así que basta con darles otro valor.

## Ventana o pantalla completa: el criterio

Las ocho pantallas ya llevan el kit, y al aplicarlo hubo que decidir una por una si va como ventana
sobre el mapa o a pantalla completa. El criterio que salió, y que vale para la siguiente que se añada:

> **Ventana sobre el mapa** si es una consulta o una decisión corta **dentro de un nodo**.
> **Pantalla completa** si es un momento propio de la run.

| Pantalla | Forma | Por qué |
|---|---|---|
| Missions, Bingo Book | ventana | consulta voluntaria; el mapa detrás dice que no has salido de la partida |
| Mochila | ventana | decisión corta de un gesto |
| Recompensa de mini-jefe | ventana | coger o saltar un objeto, en el nodo donde estás |
| Combate, Tienda, Reclutar | pantalla completa | son la parada del camino, no una consulta sobre ella |
| Game Over, Selección de personaje | pantalla completa | el final y el principio; que no haya mapa detrás es parte del mensaje |

Tres detalles que salieron de aplicarlo:

- **La mochila dejó de cerrarse al tocar fuera.** Era un diálogo suelto y pasó a `VentanaModal`: dentro
  se elige personaje con varios clics, y uno que se escapara al borde cerraba la mochila a mitad de la
  decisión. Ahora X y Escape, igual que las otras tres.
- **La recompensa de mini-jefe se quedó SIN X** (`cerrable={false}`, que quita también Escape). Sus dos
  salidas ya están en pantalla como botones, y una X de más no es solo redundante: obliga a decidir qué
  hace cerrar, y cualquier respuesta es mala — si coge, cerrar regala un objeto; si salta, Escape lo
  tira sin avisar. Los dos botones van **en fila**, porque son las dos ramas de la misma decisión: uno
  debajo del otro se leían como acción principal y enlace de escape.
- **En la tienda, las tarjetas no se pueden colocar con una rejilla de 3 columnas.** Al comprar un
  objeto, los dos que quedaban se agarraban a las columnas 1 y 2 y el escaparate se iba a la izquierda
  con un hueco a la derecha. Va con `flex flex-wrap justify-center` y ancho fijo por tarjeta, así lo que
  quede se centra solo.

## Las tres últimas piezas sueltas

- **El lienzo del mapa** era el elemento más grande de la pantalla y el único sin el lenguaje del marco:
  un rectángulo con 12 px de radio y el borde a hueso. Ahora lleva el borde en color de marco y las
  esquinas en corchete. ⚠️ **No puede ser un `PanelMarco`**: mide exactamente `ANCHO × escala` y un
  `border` real le comería píxeles del ancho útil (`box-sizing: border-box`), así que su marco es un
  `box-shadow` de dos anillos. Para no duplicar el marcado de los corchetes se extrajo `AdornoMarco`,
  que es lo que `PanelMarco` usa por dentro. Va **después** del contenido para pintarse por encima de los
  nodos, y sus piezas llevan `pointer-events-none` para no robarles el clic.
- **`EventScreen`** era la única pantalla que no hablaba el idioma de las demás. Ahora lleva el kit.
  ⚠️ **Esto es el kit, no el rediseño**: el punto 6 del roadmap sigue abierto y es el único sin
  documento MVP. Lo que hay que decidir antes de tocarlo de verdad está anotado en el propio archivo,
  incluida la única pregunta que es de **diseño de juego** y no de pantalla: si la pista del efecto se
  sigue viendo antes de elegir (hoy sí, y eso hace del evento una decisión informada en vez de una
  apuesta).
- **Los dos toasts** eran lo último con forma de notificación web: una pastilla verde de color plano y
  un recuadro crema con texto oscuro —el último sitio del juego que invertía la paleta—. Los dos pasan a
  `PanelMarco`, y el color va al **borde y al texto** en vez de al fondo: un bloque verde sólido sobre el
  paisaje nocturno era lo más luminoso de la pantalla, y un aviso no es el suceso principal.

## Contraste: `tono="hueco"` no vale para "no puedes comprarlo"

Las tarjetas de la tienda usaban `tono="hueco"` más `opacity-60` cuando no llegaba el oro. Sobre el
fondo de Konoha —que tiene luces y detalle— la tarjeta salía **casi transparente**: no se leía ni el
nombre del objeto. **Que no puedas comprar algo no es motivo para no poder leerlo.** Ahora el panel va
siempre sólido y lo que dice "no te llega" es el precio en rojo y el botón apagado, que es información
en vez de falta de contraste.

La regla general: `tono="hueco"` es para **contenido que no existe todavía** (una entrada sin descubrir
en el Bingo Book), no para contenido legible que está deshabilitado. Y un botón que flota sobre el
fondo del juego en vez de dentro de un panel necesita fondo sólido — el borde fino de `BotonSecundario`
funciona dentro de un panel y desaparece fuera (le pasaba al "LEAVE" de la tienda).

## Los colores de elemento que quedan usados como paleta (y por qué se quedan)

Se sustituyeron 15 usos semánticos de `fuuton`/`raiton` por `exito`/`oro`: barras de HP (tres sitios),
rareza en las fichas, el verde de victoria y de curación, el oro de subida de nivel y de pasiva que
salta, el modo en la pantalla de transformación, el pergamino del mapa por rareza y la pastilla de
consumible.

Lo que **no** se tocó, a propósito:

- **`colorDelDano` en `CombatScreen`** es una **escala de calor** deliberada y ya documentada: katon
  para el golpe eficaz, suiton para el bloqueado. Ahí los colores de elemento no dicen "bueno/malo",
  dicen "caliente/frío", y cambiarlos habría roto una decisión tomada mirándolo.
- **La barra de carga del jutsu** (azul de chakra, con destello al estar lista): forma parte de la tanda
  de juiciness que se afinó a ojo. Tocarla es tocar el ritmo del combate, no la paleta.
- **El registro de texto del combate**, que solo existe en desarrollo (`import.meta.env.DEV`, Vite lo
  elimina del build): cambiarlo no lo ve ningún jugador.
- **`EventScreen`**, que se rehace entera en el punto 6 del roadmap.

## Pendiente

Nada del kit. Lo siguiente en interfaz es el **punto 6 (eventos)**, que necesita su documento de diseño
antes de tocar código, y el **5 (logros)**, cuya pantalla ya está en estilo pero le falta el contenido
(5a) y la decisión sobre los modificadores permanentes (5b).

## La regla del texto de apoyo (auditoría del 2026-08-19)

Salió de Ajustes —tres descripciones que no hacían falta— y se pasó luego por **todas** las pantallas.
La regla, que vale para cualquier texto pequeño debajo de otra cosa:

> **Una línea de apoyo existe para decir una consecuencia, un alcance o un aviso.** Si reformula la
> etiqueta, repite lo que pone el botón de al lado o adelanta lo que va a decir la pantalla siguiente,
> es ruido — y el ruido en interfaz no se paga una vez, se paga cada vez que se mira.

Lo que se quitó y por qué, que es más útil que la regla:

| Dónde | Decía | Por qué sobraba |
|---|---|---|
| Ajustes · Theme / Music / Animation speed | "Light mode uses the parchment palette…", etc. | Los **propios botones** lo dicen: `DARK`/`LIGHT`, `OFF`…`HIGH`, `×1`/`×2`/`INSTANT` |
| Ajustes · Reset meta-progress | "…Does not touch the run in progress." | Lo dice la **confirmación**, que es donde hace falta leerlo. Se queda el alcance ("Achievements and Bingo Book"), que define qué es "meta-progress" |
| Combate · mini-jefe | "You defeated the mini-boss! A reward awaits you." | El cartel ya dice **Victory** y el botón ya dice **Claim reward**: era las dos cosas otra vez, en medio |
| Combate · fin de arco | "…A new arc begins." | Lo dice el botón: *Continue to next arc* |
| Combate · fin de run | "…Konoha is safe." | Lo dice la pantalla de resultados **tres segundos después** |
| Logros · sin recompensa | "A mark of honour. **No reward beyond the telling.**" | Desde que hay **rango S** al lado, la segunda frase repetía el icono. Y salía en **13 de 23 filas**: una frase repetida trece veces en una pantalla se paga trece veces |

Y lo que se **mantuvo**, que es la otra mitad del criterio:

- **"Drag to reorder, or drop an item on a ninja"** (panel de equipo): enseña dos gestos **invisibles**.
  Sin la línea, nadie descubre que se puede arrastrar.
- **"Skip transformation screen"** y **"Reset meta-progress"** en Ajustes: una dice qué te pierdes, la
  otra qué borra. Consecuencias, no reformulaciones.
- **"The rest of your team is built by recruiting during the adventure"** (selección de personaje):
  explica por qué eliges **uno** y no tres, que es la pregunta que se hace todo el mundo ahí.
- **Las frases de la enciclopedia** ("Face them in battle to unlock this entry"): son la única forma de
  saber cómo se abre una entrada, y salen **de una en una**, no repetidas por la rejilla.
- **"You have earned their respect"** (desafío legendario): no lo dice nada más, y es el remate del
  único combate opcional del juego.

## `sobreFondo`: un botón encima de un dibujo no es el mismo botón

`BotonSecundario` tiene dos caras, y elegir mal la cara es el fallo que más se repite con esta pieza:

- **Dentro de un panel o una ventana** (lo normal): fondo transparente y texto al 60%. Correcto ahí,
  porque la superficie de detrás ya es opaca y un segundo relleno sería una caja dentro de otra caja.
- **`sobreFondo`**: relleno opaco (`bg-tinta-900`) y texto entero. Para lo que se pinta **directamente
  encima del dibujo de fondo** — la tienda, reclutar y los tres atajos del Home.

⚠️ Sin `sobreFondo`, el botón se lee bien en las capturas de diseño y se vuelve **ilegible sobre la
aldea de noche**, que es donde va a estar de verdad. Pasó con los atajos del Home. Es la misma familia
de problema que `.escena-oscura` y se resuelve con la misma idea: **lo que se pinta sobre un dibujo
necesita traerse su propia superficie**, porque no puede contar con la de debajo.

## Dos salidas del mismo rango van en el mismo botón (2026-08-21)

El game over ofrecía "New Run" y "Home" con un `BotonPrincipal` y un `BotonSecundario`, y **esos dos
no son variantes de lo mismo**: cambian de forma (`rounded-full` contra `rounded-sm`), de tamaño de
letra (11 contra 9) y de relleno. Puestos uno al lado del otro parecían **dos especies distintas**,
no dos opciones entre las que elegir.

La regla que sale de ahí:

- **`BotonSecundario` es para IRSE** —volver, cerrar, saltar— y por eso es pequeño y discreto. Su
  sitio natural es una esquina, no el centro al lado de la acción principal.
- **Cuando las dos cosas que ofreces son decisiones del mismo rango**, las dos van en
  `BotonPrincipal` y lo que las separa es el **relleno** (`variante="contorno"`), nunca la geometría.
  La forma dice "somos hermanas"; el relleno dice cuál se espera que pulses.

## Un solo título por pantalla (2026-08-21)

El game over decía "End of the road" **encima** de "Game Over": la misma frase dos veces, que es el
mismo ruido que ya se había quitado de la pantalla de evento (tres rótulos) y de la tienda ("TRADING
POST" sobre "SHOP"). `CabeceraPantalla` sigue aceptando `antetitulo`, así que esto puede volver — hay
un test que cuenta los rótulos del game over.

⚠️ **Y al quedarse uno, no tiene por qué ser el mismo en los dos casos.** Ganar pasa una vez cada
muchas runs y merece la palabra llana ("Victory", sin coquetear); perder pasa constantemente, y ahí
"GAME OVER" a la cara es lenguaje de máquina recreativa. **"End of the Road"** dice lo mismo desde
dentro de la ficción y además rima con el nombre de la campaña, *The Ninja Road*: lo que se acaba es
el camino que elegiste al empezar.
