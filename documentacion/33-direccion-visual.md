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

⚠️ Los colores de elemento **siguen usándose como elemento** (el marco de una casilla por naturaleza de
chakra, la rueda, las pastillas de tipo). Lo que ya no se hace es usarlos como significado.

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
El título de sección dentro de una ficha ("AFINIDAD", "MODOS") en versalitas rojas, y el par
etiqueta-valor con la etiqueta apagada y el valor no. Son las dos piezas que hacen que una ficha se
parezca a una ficha de personaje de JRPG y no a una lista de `<dl>`.

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
