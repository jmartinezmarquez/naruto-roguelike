# UI: dirección visual, pantalla de Mapa, Combate y Evento

## Dirección visual (tokens en `src/index.css` → `@theme`)

- **Paleta**: fondo tinta casi negra (`tinta-950` `#151210`), paneles pergamino (`pergamino-100` `#EDE3CC`), acento sello rojo (`sello-600` `#B23A2E`) reservado para el nodo actual y elementos de foco. Colores propios por naturaleza de chakra: `katon`, `fuuton`, `raiton`, `doton`, `suiton`.
- **Tipografía**: `Shippori Mincho` (serif japonesa) para títulos, `Zen Kaku Gothic New` para UI/datos. Cargadas vía Google Fonts en `index.css`.
- **Motivo evitado a propósito**: nada de fondo crema + serif + acento terracota (paleta por defecto de IA), ni negro con acento neón — se ancla en estética de tinta/pergamino ninja en su lugar.

## Navegación entre pantallas

El store tiene un campo `pantalla` (`'mapa' | 'combate' | 'evento' | 'tienda' | 'gameover' | 'logros'`), que `App.jsx` usa para decidir qué componente renderizar. `avanzarANodo` cambia de pantalla según el tipo de nodo:
- `combate`/`miniJefe`/`jefe` → `'combate'`.
- `evento` → `'evento'` (elige un evento al azar del pool del arco actual, filtrado por `arcoId`).
- `descanso` → se resuelve automáticamente (cura y revive a todo el equipo), sin cambiar de pantalla — solo deja un aviso breve en el mapa.
- `tienda` → `'tienda'` (ver [15 - Tienda](./15-tienda.md)).
- `reclutamiento` → sin pantalla propia (ya no existe como nodo — ver [14](./14-reclutamiento-y-rareza.md)).

`volverAlMapa()` vuelve a `'mapa'` desde combate/evento/tienda/logros. Si el combate termina con
`runTerminada: true`, el jugador pasa en su lugar a `'gameover'` vía `irAGameOver()` — ver
[17 - Pantalla de Game Over](./17-game-over.md). `LogroToast` (notificación de logro desbloqueado)
y `AvisoToast` (avisos breves: curación en descanso o evento, etc.) se montan aparte en `App.jsx`,
fuera de este enrutado por pantalla, para que aparezcan sin importar cuál esté activa.

## `components/Map/MapScreen.jsx`

- Lee `mapa`, `nodoActualId`, `arcoActualDatos`, `equipo` del store; usa `avanzarANodo` y `obtenerNodosDisponibles`.
- Layout: pisos apilados de abajo (nivel 1) hacia arriba (jefe), como si se escalara un pergamino.
  Conexiones dibujadas con `<path>` curvos (SVG), con 4 estados visuales bien diferenciados en vez
  de solo "recorrido/resto":
  - **Recorrido de verdad**: rojo sello sólido. Como solo hay un nodo visitado por piso, si origen
    y destino de una arista están ambos visitados, esa es exactamente la arista que se tomó — sin
    ambigüedad.
  - **Elegible ahora** (sale del nodo actual): pergamino sólido y opaco.
  - **Descartado** (sale de un nodo ya visitado, pero no es la rama que se tomó): negro sólido
    (`tinta-950`) — simboliza que ya no se puede volver atrás a por esa rama.
  - **Todavía fuera de alcance** (más adelante en el mapa, ninguno de los dos extremos visitado ni
    es el nodo actual): línea de puntos, muy tenue.
- Nodos: **sprite pixel art por tipo** (`SPRITE_NODO` en `MapScreen.jsx`), recortado en círculo,
  con borde de color según tipo. Sustituye a los glifos kanji provisionales (`⚔ ? ¥ ♨ ✚ ☠ 危`), que
  eran un apaño hasta tener arte propio. 4 estados igual de diferenciados que las aristas: nodo
  actual (anillo sello), visitado (`opacity-65` + tick), disponible (brillante, clicable, con
  mini-zoom y halo al hover), fuera de alcance (`opacity-40`, no clicable).
  - Los estados apagados usan **`opacity` + `cursor-not-allowed`**. Se probó lo contrario primero
    —filtros `grayscale brightness-[0.35]`, para que el sprite siguiera siendo opaco como en un
    Pokelike de verdad— y el problema no era el sprite suelto sino el conjunto: con la mayoría de
    nodos del mapa fuera de alcance, la pantalla entera quedaba oscurísima. Transparentar deja
    asomar el fondo del arco por debajo, y eso es preferible a un mapa negro.
  - **Tamaño garantizado en pantalla** (`tamanoNodo()`): el lienzo es de 520 × 120·pisos y se escala
    entero para caber sin scroll, así que un tamaño fijo en coordenadas de lienzo se traduce en un
    tamaño variable en pantalla. Los 48 px de antes acababan en ~31 px reales a escala 0,65 y el
    icono no se distinguía. Ahora el lado se calcula contra la escala para no bajar nunca de 44 px
    reales (Pokelike no baja de 32), con un tope de 76 px de lienzo para que en un piso de 5 nodos
    no se toquen: la separación horizontal es `ANCHO/6` ≈ 87 px.
  - **Hover**: mini-zoom (`scale-110`) + halo rojo (`shadow-[0_0_16px_...]`). El tooltip lleva
    **solo el título** del tipo de nodo (`ETIQUETA_NODO`). La descripción larga que había antes
    (`INFO_NODO`, "Random enemy — win XP and gold on victory"…) se quitó: ocupaba media pantalla
    para algo que se lee una vez y se aprende jugando.
  - **Tick `✓` en todo nodo visitado**, superpuesto al sprite con su propio velo para que se lea
    encima de cualquier dibujo. Va también en el nodo actual (con velo más suave, porque el anillo
    rojo ya lo distingue): al llegar a un nodo se resuelve al instante, así que estar en él ya
    significa haberlo jugado. El nodo `inicio` nace visitado, así que sale ticado desde el principio.
  - **El nodo `inicio` no tiene sprite a propósito** (`SPRITE_NODO.inicio = null`): se pinta como un
    disco oscuro con su tick. Por eso el sprite se busca con `in` y no con `??` — con `??` el `null`
    habría caído al sprite de combate.
  - Los sprites salen de `assets/sprite-nodos-mapa.png` (la hoja del artista trae los 5 juntos, con
    sus etiquetas). Los recortes individuales están en `assets/nodes/*.png`, a media resolución
    (~100 px, se pintan a 48) para no arrastrar 1,4 MB de hoja entera por 5 iconos de 48 px.
    Coordenadas del recorte sobre la hoja original, por si hay que rehacerlo con una hoja nueva:
    combate `(60, 27) 200×198`, evento `(60, 537) 200×197`, tienda `(60, 746) 200×197`,
    descanso `(58, 947) 201×197`, reclutar (pergamino común) `(438, 283) 244×245`.
  - **Reclutar va en marco cuadrado**, no circular: el pergamino no es redondo y un recorte
    circular le cortaría las varillas de arriba y abajo.
  - **Mini-jefe y jefe pintan el sprite del personaje que hay dentro** (`spriteDeLuchador`, del
    `miniJefeId`/`jefeFinalId` del arco), con `image-rendering: pixelated` porque se amplían. El
    **entrenador no puede**: su enemigo nombrado se sortea al ENTRAR en el nodo
    (`resolverEnemigoDeNodo`), no al generar el mapa, así que al pintarlo todavía no se sabe quién
    es — se queda con el sprite de combate genérico. A los tres los distingue además el color del
    borde y un badge de rango (`BADGE_NODO`: `★` entrenador, `☠` mini-jefe, `危` jefe) en la esquina
    inferior derecha, y el jefe va más grande con borde doble. El recorte circular se aplica a la
    `<img>`, no al `<button>`: si lo llevara el botón con `overflow-hidden`, cortaría el badge.
- **Fondo de la columna central, uno por arco** (`FONDO_COLUMNA`, keyed por `id` de arco): País de
  las Olas, Examen Chunin e Invasión de Pain tienen cada uno su paisaje detrás del mapa; un arco
  sin entrada en el mapeo se queda con la columna negra en vez de romperse.
  - **Estructura Pokelike, no paisaje completo**: tierra lisa en el centro, donde caen los nodos, y
    el detalle del arco (vegetación, ruinas) solo en dos bandas de 56 px en los laterales. El
    paisaje entero de lado a lado se probó primero y los nodos se perdían encima: por eso el velo
    tenía que ser tan opaco que ya no se distinguía un arco de otro.
  - Se generan con `scripts/generar-columnas-mapa.py` (Python de librería estándar, sin
    dependencias, determinista). Entrada: `assets/map-columns/originales/*.png`, que son los
    recortes del paisaje completo. Salida: `assets/map-columns/*.png`, lo que importa `MapScreen`.
    El color de tierra de cada arco no está a mano: lo saca del propio original, cogiendo el color
    más repetido de la banda central **entre los píxeles poco saturados y de luminosidad media**.
    Una mediana a secas salía azulada, porque los tres originales son escenas nocturnas con niebla
    y agua por el medio.
  - El tope de 56 px para las bandas no es estético: el nodo más a la izquierda que puede generar
    el mapa cae en x ≈ 87 y mide 48 px, así que su borde llega a x ≈ 63. Más ancho y la vegetación
    se le mete debajo.
  - Los originales vienen de `map-column-backgrounds.png`. Ojo: ese asset es una **hoja de
    referencia** con marcos, etiquetas ("ACTO 1", "520×960px") y una cuarta columna de fondo
    genérico — no un sprite sheet de columnas iguales. El primer intento la posicionaba por
    porcentajes (`background-size: 400% auto` + `background-position-x`), y por eso salían los
    rótulos y los bordes.
  - Se pinta con `background-size: 100% 100%`: las columnas se generan a 520×960, que es
    exactamente el lienzo (`ANCHO` × `ALTO_POR_PISO` × 8 pisos), así que encajan sin recortar ni
    deformar. Si algún arco dejara de tener 8 pisos, hay que regenerarlas.
  - **El marco (fondo + `box-shadow`) lo pinta el div ya escalado, no el contenedor de fuera.** El
    contenedor solo mide el hueco disponible. Cuando el marco lo pintaba él, sobraban bandas negras
    a los lados: el lienzo casi nunca es tan ancho como el hueco, porque la escala la manda la
    altura. Y el marco va por `box-shadow` y no por `border` porque un borde real se comería 8 px
    del ancho útil (`box-sizing: border-box`) y el lienzo, que mide exactamente `ANCHO*escala`, se
    saldría por los lados.
  - Encima va un **velo `bg-tinta-950/15`** antes de los nodos, solo para bajar un punto de brillo
    y que se lean las líneas. Con el paisaje completo detrás hacía falta el triple (`/45`).
  - El velo y el fondo van en el div del lienzo, que **no lleva `overflow-hidden`**: recortaría los
    tooltips de hover de los nodos, que se renderizan dentro de cada nodo.
- **Hover en cada nodo** en vez de una leyenda fija (`LeyendaMapa` se quitó): pasar el ratón sobre
  cualquier nodo muestra su tipo, qué hace (`INFO_NODO`, texto tipo "Compra objetos y recluta...")
  y su estado actual (Visitado/Estás aquí/Todavía no alcanzable) — la vieja leyenda ocupaba sitio
  siempre visible para algo que solo hace falta consultar de vez en cuando. Usa `HoverTooltip`
  (`components/common/HoverTooltip.jsx`, extraído de `PersonajeHoverCard` para no repetir la
  mecánica CSS del hover en cada sitio nuevo que la necesite).
- **Los tres arcos miden 8 pisos.** No es un número de diseño de contenido, es un límite de esta
  pantalla: el mapa se escala para caber entero, así que cuantos más pisos, más pequeño todo. A
  partir de 8 los nodos dejan de leerse. Si algún día se quieren arcos más largos, hace falta antes
  otra solución de encuadre (scroll vertical, cámara que sigue al jugador...). Tiene coste de
  balance, anotado en [11](./11-progresion-y-arcos.md).
- **Paneles laterales compactos** (`w-32`, texto de 8-10 px): son HUD, no la pantalla. La
  referencia es Pokelike, donde las tarjetas de equipo/objetos ocupan bastante menos que el mapa.
- **Cabe siempre en el viewport, sin scroll** (estilo Pokelike: su `<svg>` escala nativamente vía
  `viewBox` + `width:100%;height:100%`). Como aquí los nodos son `<button>` de verdad superpuestos
  al SVG (no vive todo dentro del propio SVG), no se puede usar ese truco nativo directamente —
  en su lugar, `MapScreen` mide con `ResizeObserver` el espacio disponible del contenedor central
  y aplica un `transform: scale(...)` al bloque entero SVG+nodos, calculado como
  `Math.min(anchoDisponible / ANCHO, altoDisponible / alturaLienzo)`.
  El wrapper exterior se dimensiona ya al tamaño escalado (`ANCHO*escala`/`alturaLienzo*escala`) para
  que el layout no deje hueco en blanco. La página entera es `h-screen overflow-hidden` (ya no
  `min-h-screen`) — todo el contenido tiene que caber, en vez de crecer y scrollear.
- **Tira de HP del equipo**: muestra cada personaje con nivel, barra de HP real (vía el selector `obtenerHpMaximo` del store) y si está derrotado — necesario ahora que el HP persiste entre combates, para que el jugador sepa cuándo curarse. Cada entrada envuelta en `PersonajeHoverCard` (ver más abajo).
- **`PanelObjetos`**, en la columna **derecha**, encima de `RuedaChakra`: los objetos del inventario
  (solo lo que está suelto — lo ya equipado vive en `PanelEquipo`, no aquí), agrupados por id con el
  número en una esquina si hay repetidos. Tocar uno abre la mochila con ese objeto ya seleccionado.
  - **Rejilla de sprites, sin nombre**: una fila con texto por objeto crecía sin parar y no cabía.
    El nombre lo cuenta el hover.
  - **El oro va en la misma línea que el título "ITEMS"**, no dentro de la lista: no es un objeto de
    la mochila, es el contador de la run. Dentro del panel solo entran sprites de objeto.
  - El hover usa la variante **compacta** de `ItemHoverCard` (`compacto`): una sola línea
    "Nombre: efecto". La tarjeta completa (rareza, tipo, descripción, equipado-en) era una ventana
    enorme colgando de un icono de 28 px.
  - Está a la derecha y no debajo del equipo porque las dos columnas tienen papeles distintos: la
    izquierda es la que se toca para jugar (reordenar el equipo), la derecha es consulta rápida
    (qué llevo, qué le gana a qué).
- **`RuedaChakra`**: pictograma del ciclo de ventajas de chakra, debajo de `PanelObjetos` —
  ver [19 - Selección de personaje](./19-seleccion-de-personaje.md).
- **`MenuIconos`**: esquina superior derecha, estilo Pokelike — Logros (🏆), Pantalla completa (⛶,
  Fullscreen API del navegador) y Reiniciar Run (⟲, con `window.confirm` porque borra la run actual
  sin posibilidad de deshacerlo). Sin "Ajustes" todavía — no hay ninguna opción real que poner ahí.
- El viejo aviso "este nodo no tiene pantalla propia todavía" se quitó — ya no existe ningún tipo de
  nodo sin pantalla o resolución propia (descanso se auto-resuelve, el resto tiene pantalla).

## `components/Combat/CombatScreen.jsx`

- Lee `ultimoResultadoCombate` del store (resumen enriquecido: nombres, HP máximo, modo activo).
- **Reproduce el combate golpe a golpe, no turno a turno.** Un turno del motor trae 2-4 eventos (los
  dos luchadores, más algún ataque extra) y resolverlos de una vez hacía imposible animarlos: la
  barra bajaba dos veces a la vez y no se sabía quién había pegado. La unidad del replay es el
  evento (`golpes` = `historial.flatMap(t => t.eventos)`).
- Cada golpe tiene **dos tiempos**: el proyectil vuela (`MS_VUELO_PROYECTIL`) y luego impacta, y
  **el daño solo cuenta en el impacto** (`golpesAplicados = impactado ? golpesEmpezados : golpesEmpezados - 1`).
  Sin esa separación la barra de HP empezaba a bajar mientras el kunai seguía en el aire.
- **Proyectil** (`assets/projectiles/kunai.png`, recortado con `scripts/generar-sprites-proyectiles.py`)
  cruzando entre los dos luchadores, **sacudida** del que recibe (solo si el daño fue > 0: un golpe
  bloqueado a 0 no debe verse igual que uno que ha dolido) y **número de daño flotante** sobre el
  objetivo, que es lo que hace que la animación se entienda sin leer el registro. Un golpe de 0 sale
  como `Blocked`, que es justo cuando el jugador necesita más explicación, no menos.
  Las animaciones se reinician **remontando el elemento con `key`**, no quitando y poniendo clases:
  con clases, el segundo golpe no animaba.
- **Las pasivas se enseñan cuando saltan**: `pasivasActivadas` viaja en cada evento desde la fase 1
  del rediseño de balance y hasta ahora no se leía en ninguna parte, así que todo el sistema era
  invisible. Etiqueta sobre el luchador al que pertenece la pasiva (`duenoDePasiva` en
  `engine/passives.js` lo deduce del enganche: solo `DANO_RECIBIDO` es del defensor) más el nombre
  en la línea del registro. Ojo: `priority` y `repeat_basic_chance` **nunca** aparecen ahí, porque se
  consultan fuera del contexto del golpe — el ataque extra se enseña con `esAtaqueExtra`.
- **Distribución en dos cajas, estilo Pokelike** (`PanelBando`): tu equipo a la izquierda, el enemigo
  a la derecha, cada bando en su caja con su rótulo. No hay una "fila de duelo" separada del
  banquillo — el que pelea es una de las tarjetas del equipo, solo que encendida.
- **Una sola `TarjetaLuchador` para todos**, equipo y enemigo. Antes había dos componentes (una barra
  grande para el duelo y una tarjeta chica para el banquillo) y había que mantener el mismo diseño
  por duplicado. Lleva nombre, nivel, barra de HP con números, sprite sobre una sombra elíptica que
  hace de suelo, y —solo en quien pelea— la barra de jutsu y las pasivas que acaban de saltar. Tres
  estados: activo (borde encendido y halo), en espera y caído (`opacity`, nunca filtros — con
  `grayscale` la tarjeta se quedaba casi negra, el mismo error que ya se corrigió en el mapa).
- El contenido de cada caja va **centrado en vertical**: las dos tienen distinto número de tarjetas
  (tres contra una) y así los luchadores activos quedan a la misma altura, que es por donde cruza el
  proyectil.
- El estado del equipo **se reconstruye del replay, no se lee del store**: para cuando la animación
  empieza, `jugarCombate` ya ha aplicado victoria o derrota, así que `equipo` contiene el estado
  FINAL y pintarlo destriparía quién cae. Por eso el resumen lleva `equipoAlEmpezar`, una foto
  tomada antes de la primera ronda.
- **El registro de texto es solo de desarrollo**, plegado tras un `<details>` "[DEV] Combat log" y
  envuelto en `import.meta.env.DEV`. Vite sustituye eso por `false` al construir y elimina el bloque
  entero del bundle, así que no hay que acordarse de quitarlo antes de publicar (comprobado: el
  texto no aparece en `dist/`). La partida la cuenta la animación; el registro es para depurar un
  combate raro.
- **Sprite de cada luchador** (`components/common/characterSprites.js`, recortados con
  `scripts/generar-sprites-personajes.py`): en la tarjeta del que pelea (el enemigo volteado con
  `-scale-x-100`, para que se miren) y pequeño en las tres tarjetas de equipo. Siempre con
  `image-rendering: pixelated` — son dibujos de ~37×63 px que se amplían y sin eso salen borrosos.
- Botón "Skip animation" para saltar al final de la ronda.
- Barras de HP con color según % restante (`fuuton` >50%, `raiton` 20-50%, `sello` <20%). Cada `BarraLuchador` envuelta en `PersonajeHoverCard` (jugador se abre hacia la derecha, enemigo hacia la izquierda, para no salirse de la pantalla).
- **Barra de jutsu** bajo la de HP, fina y sin números: lo que importa no es cuánto chakra hay sino
  cuánto falta. Al llenarse pulsa en color raiton con `JUTSU READY`, y en el log el jutsu sale con 🌀
  y el nombre destacado frente al ataque básico, apagado. Ver
  [29](./29-sistema-de-jutsus-automaticos.md). La carga no se reconstruye sumando incrementos como el
  HP: cada evento del historial trae ya el valor resultante, porque lanzar el jutsu la pone a cero.
- Al completarse: banner de Victoria/Derrota y uno de 3 botones según el resultado — "Continuar"
  (`volverAlMapa()`, combate normal), "Continuar al siguiente arco" (`avanzarSiguienteArco()`, se
  ganó el jefe final de un arco intermedio) o "Ver resultado" (`irAGameOver()`, la run terminó — por
  derrota o por vencer a Pain) → `GameOverScreen` (ver [17](./17-game-over.md) y
  [20](./20-arcos-encadenados.md)).

## `components/Event/EventScreen.jsx` (nuevo)

- Lee `eventoActual` del store (`{ titulo, descripcion, elecciones }`) y `resolverEventoEleccion`.
- Muestra título, descripción, y un botón por elección — al pulsar una, el store aplica el efecto y vuelve al mapa. Sin animación, es una pantalla de decisión simple al estilo Slay the Spire.

## Cambio en `jugarCombate` (store): resumen enriquecido

Antes, `ultimoResultadoCombate` era el resultado crudo del motor (`{ historial, ganadorId, turnosUsados }`), con solo IDs. Ahora `jugarCombate` construye un resumen con `jugador`/`enemigo` (`{ id, nombre, hpMaximo, hpFinal, modoActivoNombre }`) además del historial. El motor (`engine/combat.js`) no cambió — esto es una capa de presentación añadida en el store.

## `components/common/HoverTooltip.jsx` + tarjetas que lo usan

`HoverTooltip` es la mecánica genérica de "mostrar algo al hacer hover" (CSS puro, named group de
Tailwind `group/hover`, sin JS de posicionamiento) — extraída para no repetirla cada vez que hace
falta un tooltip nuevo. Tres usos hoy:

- **`PersonajeHoverCard.jsx`** — tarjeta de detalle (tipo de chakra, stats, HP, jutsu) al hacer
  hover sobre cualquier trigger que represente a un personaje o jefe. Usada en `MapScreen`,
  `CombatScreen`, `ShopScreen` y `CharacterSelectScreen`. Detalle completo en
  [19 - Selección de personaje](./19-seleccion-de-personaje.md).
- **`ItemHoverCard.jsx`** — tarjeta de detalle de un objeto (`items.json`): tipo, rareza,
  descripción en prosa y el efecto exacto en números (`textoEfecto`, traduce `item.efecto` a texto
  legible: "+2 ATQ permanente", "Cura un 15% de HP tras cada combate ganado", etc.), más un
  `equipadoEnNombre` opcional ("Equipado en X"). El efecto ya se aplica de verdad, no es solo
  texto — ver [21 - Objetos equipables](./21-objetos-equipables.md).
  - Con `compacto`, en cambio, renderiza `FichaObjetoCompacta`: una línea, "Nombre: efecto". Es la
    que usa la rejilla del mapa, donde la tarjeta completa era desproporcionada.
- **Hover de nodo del mapa** (dentro de `NodoMapa`, `MapScreen.jsx`) — solo el nombre del tipo de
  nodo. Sustituye a la vieja `LeyendaMapa` fija.

## `components/common/nombres.js`

`nombrePersonaje(id)` / `nombreObjeto(id)`, compartidos. Existen porque cada pantalla se había hecho
su propia copia de `nombrePersonaje` mirando **solo** `characters.json`, y los jefes se pueden
reclutar por logro: el panel de equipo, la mochila y el game over enseñaban `pain_camino_deva` tal
cual en cuanto llevabas a uno. La versión compartida busca también en `enemies.json`.

## `.elevar-hover` (`src/index.css`)

Clase compartida: la pieza sube 4 px al pasar por encima, como en Pokelike — el hover no solo cambia
de color, la tarjeta se despega del fondo. Se **combina** con el resaltado por borde/glow que ya
existía, no lo sustituye. Va como clase propia y no como utilidad suelta de Tailwind porque la
comparten tarjetas de tienda, de reclutar, de selección de personaje y botones de acción, y así el
"cuánto sube" se toca en un sitio. Su `transition-property` lista también los colores para no pisar
el `transition-colors` de los sitios donde ya estaba.

**Dónde va**: en lo que el jugador *elige* — tarjetas de tienda, de reclutar, de selección de
personaje, sprites del panel de objetos, y el "Collect" de la recompensa de mini-jefe. Son
decisiones, y el rebote las hace apetecibles.

**Dónde NO va**, decidido tras verlo en marcha:
- Botones **dentro** de una tarjeta que ya se eleva (el "N gold" de la tienda): los dos a la vez dan
  un salto doble.
- Botones de **acción o de salida** dentro de una pantalla: `Equip`/`Use`/`Replace`/`Unequip` y
  `Close` de la mochila, `SKIP` de reclutar. Son ejecutar y salir, no elegir; el rebote los ponía al
  mismo nivel de importancia que la elección de verdad y distraía.
- Enlaces de texto subrayado (`Skip animation` en combate, `Skip` de la recompensa): nunca lo
  llevaron — un enlace que salta no se lee como enlace.

## `App.jsx`

Flujo real: mientras `mapa` es `null` (arranque, o tras `reiniciarRun()` desde Game Over) se
muestra `CharacterSelectScreen` en vez de cualquier pantalla del store — ahí el jugador elige su
personaje inicial y `onConfirmar` llama a `iniciarRun`. Con `mapa` ya creado, alterna entre
`MapScreen`/`CombatScreen`/`EventScreen`/`ShopScreen`/`GameOverScreen`/`AchievementsScreen` según
`pantalla`, más `LogroToast` montado aparte. Antes de todo esto, un efecto llama a
`cargarLogros()` una vez al montar — el roster de `CharacterSelectScreen` depende de qué logros
ya estén desbloqueados. Ver [19 - Selección de personaje](./19-seleccion-de-personaje.md).
