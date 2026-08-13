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
  - **Alcanzable más adelante** (sale de un nodo al que todavía se puede llegar): pergamino
    discontinuo a media opacidad. Se ven **bien**, no insinuados: son los que dejan leer el mapa por
    delante y decidir a dónde te lleva cada rama. Lo que los distingue de un camino elegible no es
    que se vean menos, sino que van discontinuos.
  - **Inalcanzable** (ni por detrás ni por delante se puede llegar ya): pergamino sólido muy tenue.
    Aquí entran dos cosas que antes se trataban distinto: la rama que descartaste al pasar de piso
    y **el subárbol entero que colgaba de ella**. Ese segundo caso no se detectaba —solo se miraba
    si el origen estaba visitado—, así que medio mapa muerto seguía pintándose como futuro. Ahora
    los dos salen de la misma pregunta, `alcanzables`: un BFS hacia adelante desde `nodoActualId`
    que responde *¿puedo llegar todavía al nodo del que sale este camino?*
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
    descanso `(58, 947) 201×197`. Los tres pergaminos de reclutar ya no llevan coordenadas escritas:
    los recorta `scripts/generar-sprites-nodo-reclutar.py`, que **mide sus posiciones sobre la propia
    hoja** (ver [28](./28-nodo-reclutar.md)).
  - **Reclutar va en marco cuadrado**, no circular: el pergamino no es redondo y un recorte
    circular le cortaría las varillas de arriba y abajo.
  - **Un pergamino por rareza** (`SPRITE_RECLUTAR`, keyed por `nodo.rareza`): verde y dorado, cada
    uno con su color de borde (`COLOR_RECLUTAR`) y su etiqueta de hover (`ETIQUETA_RECLUTAR`:
    Recruit / **Legendary Challenge**). El dorado no es un premio más gordo, es un **combate** contra
    el ninja que hay dentro, así que el jugador tiene que poder verlo venir desde el mapa y decidir
    si va — por eso la rareza se sortea al generar el mapa y no al entrar en el nodo. Un nodo sin
    `rareza` (mapas viejos, tests que montan el nodo a mano) se lee como el pergamino común.
    El azul de la hoja (`reclutar-raro.png`) se sigue generando pero **no se usa**: común, inicial y
    raro comparten pergamino, porque lo que separa los dos no es el poder del ninja sino cómo se
    consigue — ver [28](./28-nodo-reclutar.md).
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

### Panel de equipo (`PanelEquipo`)

La vista que el jugador tiene delante casi toda la partida, y la que más se había quedado atrás: era
texto puro cuando ya existían los sprites. Rehecha con los puntos 8 y 11 del roadmap.

- **El nombre va en su propia línea, a lo ancho de la tarjeta.** Compartiendo fila con el sprite le
  quedaban unos 60 px y hasta "Naruto U." se cortaba en "Nar…", que no identifica a nadie.
- **Sprite** debajo, a media resolución de su lienzo (96 → 48, múltiplo entero) y con el nivel real,
  así que un personaje transformado se ve transformado también aquí. **El nivel va encima del
  sprite**, en la esquina: es un dato de una o dos cifras y no merece una columna propia en una
  tarjeta tan estrecha.
- **Nombre abreviado** (`nombreCorto`: "Naruto Uzumaki" → "Naruto U."). El panel es estrecho y los
  nombres completos o se truncaban a mitad de palabra o forzaban una letra ilegible; el nombre de
  pila es el que identifica. Un nombre de una palabra (Gaara) o con paréntesis ("Pain (Deva Path)")
  se queda entero — partirlo por la primera inicial daría "Pain (.".
- **Debajo de la barra van los NÚMEROS de HP**, no la naturaleza de chakra. En el mapa lo que se
  consulta a cada paso es cuánta vida le queda a cada uno, para decidir si toca buscar un descanso;
  el tipo es de leer una vez y sigue en el hover, con su pastilla de color.
- **Reordenar con drag and drop.** No es solo comodidad: el clic solo sabía hacer "al frente", así
  que ordenar el segundo y el tercero entre sí era imposible. Al soltar se **saca y se reinserta**,
  no se intercambia — intercambiar deja el orden intermedio como estaba y el gesto no cuadra con lo
  que ve el jugador, que es "he metido a este aquí". El id que se arrastra es estado local del
  componente, no del store: no es información de la run, solo del gesto en curso.
- **El objeto equipado va en su propia fila debajo**, con su sprite, su nombre y una X para quitarlo.
  Se probó en la esquina del retrato y tapaba justo al ninja: el sprite es lo primero que identifica
  la tarjeta y el objeto le caía encima con su botón. Abajo cabe entero y la X no pisa nada.
- Panel más ancho (`w-32` → `w-40`): había sitio y la letra no tiene por qué ser diminuta.

## `components/Combat/CombatScreen.jsx`

- Lee `ultimoResultadoCombate` del store (resumen enriquecido: nombres, HP máximo, modo activo).
- **Reproduce el combate golpe a golpe, no turno a turno.** Un turno del motor trae 2-4 eventos (los
  dos luchadores, más algún ataque extra) y resolverlos de una vez hacía imposible animarlos: la
  barra bajaba dos veces a la vez y no se sabía quién había pegado. La unidad del replay es el
  evento (`golpes` = `historial.flatMap(t => t.eventos)`).
- Cada golpe tiene **dos tiempos**: el proyectil vuela (`MS_VUELO_PROYECTIL`) y luego impacta, y
  **el daño solo cuenta en el impacto** (`golpesAplicados = impactado ? golpesEmpezados : golpesEmpezados - 1`).
  Sin esa separación la barra de HP empezaba a bajar mientras el kunai seguía en el aire.
- **Proyectil** —el kunai del ataque básico o el jutsu propio del atacante, ver
  `components/common/projectileSprites.js`— que sale del **centro del que lanza** y llega al centro
  del que recibe. Esas dos posiciones no se pueden escribir en el CSS: la tarjeta activa del equipo
  puede ser la primera, la segunda o la tercera, así que su altura cambia de una ronda a otra. Se
  miden con `getBoundingClientRect` y se inyectan como variables CSS **antes del primer pintado**
  (`useLayoutEffect`), que es lo que evita ver un fotograma en la posición equivocada; no pasan por
  estado de React a propósito, sería un render de más por golpe. Los **números flotantes** (daño y
  curación) se colocan igual, midiendo la tarjeta del objetivo, y va **coloreado por la eficacia de tipo**: verde flojo,
  amarillo normal, rojo fuerte (`--color-fuuton` / `--color-raiton` / `--color-katon`). Es una
  escala de calor y no un semáforo — habla de cuánto ha dolido, porque el mismo número sale sobre
  tu personaje y sobre el enemigo. El azul de `Blocked` se queda fuera de la escala a propósito: un
  golpe anulado por una pasiva no es "poco efectivo", y meterlo dentro lo haría pasar por flojo.
  El jutsu ya no se distingue por color sino **por tamaño**, que además pega más con "ha sido un
  golpe gordo".
- **La curación dentro del combate sale como `+N` en verde** y en la tipografía de la interfaz, no
  en la de los daños: es otra cosa que un golpe y tiene que leerse distinto de un vistazo. La cura
  por subir de nivel no aparece aquí — esa pasa después del combate y ya la cuenta el cartel "Lv. N!".
  Se detecta mirando la **diferencia de HP** entre golpes, no el mecanismo que la produjo, así que
  vale para lo que hay hoy (`heal_on_kill`) y para lo que venga: un jutsu con robo de vida o una
  pasiva que cure al recibir saldrían solos, sin tocar la pantalla.
- **La barra de HP lleva estela**: dos barras con el MISMO porcentaje, la pálida de detrás con una
  transición lenta y con retraso. El hueco entre las dos es el mordisco del último golpe, así que se
  percibe **cuánto ha quitado**, no solo cuánto queda. No necesita estado: es la misma cifra pintada
  dos veces a velocidades distintas.
- **El jutsu se telegrafía.** La barra de chakra se llena un turno ANTES de que el jutsu salga —es
  una regla del motor (ver [29](./29-sistema-de-jutsus-automaticos.md)), no un efecto— y ese hueco
  existía sin verse. Ahora quien lo tiene listo respira y brilla, y el turno pasa a ser tensión:
  sabes que viene y si te da tiempo a tumbarlo antes.
- **El ritmo no es constante.** Con todos los golpes durando lo mismo el combate sonaba a metrónomo.
  Un jutsu vuela más lento (560 ms contra 320) y se le deja aire antes (620 ms) y después (520);
  los básicos se encadenan en 200. La duración del vuelo la fija `Proyectil` desde JS sobre la
  animación CSS, porque si el CSS se quedara con la suya el impacto y la llegada se separarían.
- **El que cae se desploma** (gira y se desvanece) en vez de solo apagarse, y **el relevo de la
  cadena de rondas entra deslizándose**: es el momento más dramático del combate y se contaba con
  una línea de texto.
  Las tarjetas llevan **dos envoltorios**: el de fuera es estable dentro de una ronda (identidad,
  ref y animación de relevo) y el de dentro se remonta con cada impacto para relanzar la sacudida.
  Con uno solo pasaban las dos cosas a la vez: cada impacto reiniciaba la animación de entrada del
  que acababa de salir, y dos golpes seguidos al mismo objetivo no volvían a sacudirlo porque la
  clase no llegaba a quitarse entre uno y otro.
  El desplome se anima **solo en quien cae peleando** (`cayendoAhora`), no en todo el que esté
  caído: al cambiar de ronda se remontan las tres tarjetas del equipo, y con `estado === 'caido'` los
  que ya habían caído repetían su desplome cada vez que entraba el relevo.
- **Sacudida** del que recibe, solo si el daño fue > 0: un golpe bloqueado a 0 no debe verse igual
  que uno que ha dolido. Un golpe de 0 saca `Blocked` en vez del número, que es justo cuando el
  jugador necesita más explicación, no menos.
  Las animaciones se reinician **remontando el elemento con `key`**, no quitando y poniendo clases:
  con clases, el segundo golpe no animaba.
- **La tarjeta de combate NO abre `PersonajeHoverCard`.** Ya enseña nombre, nivel, HP, tipo,
  transformación y pasivas, así que el hover solo repetía lo mismo en una ventana encima de la
  pantalla. El hover se queda donde sí aporta: mapa, tienda y reclutar.
- **Las pasivas se enseñan siempre, y se resaltan cuando saltan.** Cada luchador lleva bajo su barra
  de chakra las pasivas que TIENE —las de su transformación activa y las de su objeto equipado,
  `pasivasDeLuchador` en `components/common/datosDeLuchador.js`— y con hover sale su descripción,
  la misma frase de `data/passives.json` que usan los objetos. La que acaba de dispararse se
  enciende. **Una pastilla por pasiva aunque la den dos fuentes**: el Manto de Chakra de Naruto y el
  Sello de Chakra dan los dos `first_jutsu_bonus` y salía repetida. Se queda la de mayor cantidad y
  lleva una marca `×2`, porque en el motor **se aplican las dos** (`aplicarModificadores` pliega
  todas las del enganche): esconder la segunda en silencio sería mentir sobre lo fuerte que es el
  personaje. La primera versión enseñaba solo las que saltaban y la fila aparecía y desaparecía en
  cada golpe: no daba tiempo a leer qué tenía tu personaje. El resalte es lo que se conserva de
  aquello, y sigue siendo necesario — sin él el sistema de pasivas vuelve a ser invisible.
  Quién es el dueño de una pasiva que salta lo deduce `duenoDePasiva` (`engine/passives.js`) del
  enganche: solo `DANO_RECIBIDO` es del defensor. Ojo: `priority` y `repeat_basic_chance` **nunca**
  aparecen entre las activadas, porque se consultan fuera del contexto del golpe — el ataque extra
  se enseña con `esAtaqueExtra`.
- **La barra de chakra va en azules** (`suiton`, y `fuuton` claro al llenarse) y **sin rótulo**: el
  color ya la separa de la de HP, y el pulso al estar llena dice "lista" sin escribirlo.
- **Subida de nivel**: al terminar el combate, quien haya subido saca un cartel "Lv. N!" sobre su
  sprite, su tarjeta suelta un destello dorado y **el título pasa a enseñar el nivel nuevo** con una
  marca ▲. El sprite y las pasivas se siguen calculando con el nivel viejo a propósito: si no, un
  personaje que acaba de cruzar el umbral de su modo aparecería ya transformado y destriparía la
  pantalla que viene justo detrás. El store lo detecta comparando el nivel antes y
  después de aplicar la XP (`subidasDeNivel` en el resumen, igual que `transformacionesDesbloqueadas`)
  y viaja en el resumen para celebrarlo **cuando acaba la animación**, no al recibir el resultado.
  La pantalla de transformación **espera** a que el cartel se haya visto: si no, el overlay salía
  encima y el jugador no llegaba a enterarse de que había subido, que es justo lo que explica de
  dónde sale la transformación.
- **El panel enemigo enseña la cadena entera.** Un nodo de entrenador encadena varios combates (N
  genins y luego el nombrado) y antes se veía solo al de turno, con un "Battle 1/3" encima: el
  jugador no sabía a qué se enfrentaba ni cuánto le quedaba del nodo. Ahora se pintan todos, como el
  equipo — el de turno encendido, los ya derrotados apagados (que también es información: dice
  cuánto llevas) — y esos textos sobran.
- **Distribución en dos cajas, estilo Pokelike** (`PanelBando`): tu equipo a la izquierda, el enemigo
  a la derecha, cada bando en su caja con su rótulo. No hay una "fila de duelo" separada del
  banquillo — el que pelea es una de las tarjetas del equipo, solo que encendida.
- **Una sola `TarjetaLuchador` para todos**, equipo y enemigo. Antes había dos componentes (una barra
  grande para el duelo y una tarjeta chica para el banquillo) y había que mantener el mismo diseño
  por duplicado. Lleva nombre, nivel, barra de HP con números, sprite sobre una sombra elíptica que
  hace de suelo, y —solo en quien pelea— la barra de jutsu y las pasivas que acaban de saltar. Tres
  estados: activo (borde encendido y halo), en espera y caído (`opacity`, nunca filtros — con
  `grayscale` la tarjeta se quedaba casi negra, el mismo error que ya se corrigió en el mapa).
- **El suelo bajo cada personaje va en dos capas**: un disco de pergamino (el "claro de tierra"
  tipo Pokelike) y, encima, la sombra de contacto. Hubo un tercer disco con el color de la
  naturaleza de chakra, y se quitó: competía con el resto del suelo y no se entendía qué
  significaba. Esa información ahora va **junto al nombre**, con el mismo icono que usa la tarjeta
  de hover (`emojiDeTipo` en `components/common/nombres.js`, compartido para que las dos pantallas
  no se separen).
- **El sprite es el de la transformación si el personaje tiene una activa** (`spriteDeCombate`).
  El modo activo no es un estado que alguien encienda: es una función del nivel
  (`obtenerModoActivo`), así que quien esté por encima del umbral está transformado siempre, también
  en el banquillo. Se calcula a partir del nivel de la tarjeta y no se lee de ningún sitio — era el
  bug de que Naruto desbloqueaba el Manto de Chakra, la pantalla de transformación lo celebraba, y
  acto seguido volvía a salir con su sprite de siempre en todos los combates.
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
  `scripts/generar-sprites-personajes.py`), siempre con `image-rendering: pixelated`.
  **Todos los PNG comparten un lienzo de 96×96** y se pintan a un **múltiplo entero** suyo — hoy ×1
  (96 px) en todas las tarjetas, iguales entre sí. Se probó a pintar al doble el que pelea y las
  cajas dejaban de cuadrar: quien está en combate se distingue por el borde encendido y el halo, no
  por el tamaño. Las dos reglas de abajo son necesarias, y la segunda no funciona sin la primera:
  - El pixel art solo se ve limpio a escalas enteras. Los lienzos iban de 70 a 94 px y se pintaban
    todos a 80: eso son factores como ×1,07, donde unas columnas de píxeles se duplican y otras no.
    Se percibía como falta de nitidez, y agrandar sin más no lo arreglaba.
  - Con lienzos distintos, además, **las proporciones entre personajes estaban mal**: un dibujo
    pequeño acababa en un lienzo pequeño y luego se ampliaba hasta el mismo tamaño que uno grande,
    así que Chōji salía del tamaño de Naruto. Al encuadrarlos todos en 96×96 sin reescalar, cada uno
    conserva su tamaño real.
  El lienzo común es 96 porque el dibujo más grande de las dos hojas mide 77×82 px; lo que sobra es
  margen transparente, y eso es justo lo que mantiene las proporciones.
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

## `components/Combat/TransformationScreen.jsx`

El momento en que un personaje desbloquea un modo. Existe porque las transformaciones se quitaron a
propósito de las tarjetas de personaje, para que fueran una sorpresa (ver
[30](./30-sistema-de-pasivas.md)): esta pantalla y las etiquetas de pasiva del combate son los
**únicos** sitios donde el jugador se entera de que existen.

- **Dos tiempos y luego quietud.** Carga (~1,4 s): el personaje tiembla, dos anillos de chakra
  desfasados se cierran sobre él y su sprite parpadea entre la forma normal y la transformada — el
  guiño a la evolución de Pokémon, que sale casi gratis porque tenemos los dos sprites (la silueta
  es `brightness(0) invert(1)`, y alterna con `steps()` para que el corte sea seco, no un fundido).
  Estallido (~0,5 s): destello blanco y entra el sprite transformado. Y a partir de ahí **la
  pantalla se queda fija** con el nombre y las pasivas: lo que tiene que quedarse es qué hace la
  transformación, y eso no se lee mientras algo parpadea.
- **Aquí sí va la descripción de las pasivas**, que es justo la que se quitó de la tarjeta de
  personaje. Este es el momento en que esa información importa y en que el jugador está mirando.
  Los multiplicadores no: no son un dato comparable, son material de enciclopedia.
- **Siempre saltable**, y el botón lleva al final del efecto, no cierra la pantalla: las runs son
  cortas y esto se repite entre partidas, pero lo que no puede perderse es qué hace el modo.
- **Es una cola.** El banquillo también gana XP, así que dos personajes pueden cruzar el umbral de
  su modo en la misma victoria; se enseñan de uno en uno.
- Aparece **al terminar la animación de combate**, no al recibir el resultado: el store desbloqueó el
  modo antes de que el combate se reprodujera, y sacarla entonces destriparía que has ganado. Mismo
  criterio que los logros.
- El estado es un **contador** de cuántas ha visto el jugador, y la cola se deriva en el render.
  Guardar la lista en estado obligaba a sembrarla desde un `useEffect`, y hacer `setState` síncrono
  dentro de un efecto es un patrón que ya nos mordió una vez (está en CLAUDE.md, y el linter lo caza).

### El final del combate (`PanelRecompensas`)

Todo lo de dentro de la pelea estaba cuidado y el cierre era un `Victory` de texto con un botón: el
oro cambiaba en un panel de otra pantalla y el objeto aparecía en la mochila sin que nadie lo
dijera. Ganar no se celebraba en ningún sitio.

`PanelRecompensas` va entre el rótulo de victoria y el botón, que es donde el ojo ya está: `+N Gold`
y el objeto con su sprite.

⚠️ **Era un `inline-flex`, y el botón de "Continue" también es inline**, así que los dos acababan en la
MISMA línea: la recompensa parecía otro botón puesto al lado del botón. Ahora es un `PanelMarco` de
bloque centrado con el oro y el objeto en `IconoEnmarcado`, y todo el bloque de cierre es una columna
con separación propia, así que nada depende del flujo inline. Ver
[33](./33-direccion-visual.md). El objeto **solo se anuncia si ha entrado de verdad en la mochila** — el
del mini-jefe tiene su propia pantalla de recogida (`ItemRewardScreen`), así que ahí se calla:
prometerlo en los dos sitios sería contarlo dos veces. Viaja en el resumen del combate
(`recompensas`) y no se lee del store, misma regla que `equipoAlEmpezar`.

**La XP no se enseña, y es una decisión.** Hubo una barra de XP en la tarjeta y un `+N XP` en el
panel, y se quitaron los dos tras probarlo: con la economía de XP actual **casi cada combate sube un
nivel**, así que la barra vivía siempre a punto de llenarse y el número no cambiaba ninguna decisión.
Lo que sí se ve es la consecuencia — el cartel de subida de nivel y, detrás, la transformación. La
progresión de este juego se lee en el número de nivel, no en el trayecto hasta el siguiente.

> ⚠️ De aquella barra salió un bug que conviene no repetir: `{progresoXp && <barra/>}` con
> `progresoXp === 0` **pinta un `0`** en la tarjeta. En el primer combate de la run todos tienen 0 de
> XP, así que aparecía un cero suelto sin explicación. En JSX, un guard numérico con `&&` renderiza
> el número cuando vale 0 — hay que comparar (`> 0`) o normalizar a booleano.

## `components/Event/EventScreen.jsx` (nuevo)

- Lee `eventoActual` del store (`{ titulo, descripcion, elecciones }`) y `resolverEventoEleccion`.
- Muestra título, descripción, y un botón por elección — al pulsar una, el store aplica el efecto y vuelve al mapa. Sin animación, es una pantalla de decisión simple al estilo Slay the Spire.

## Cambio en `jugarCombate` (store): resumen enriquecido

Antes, `ultimoResultadoCombate` era el resultado crudo del motor (`{ historial, ganadorId, turnosUsados }`), con solo IDs. Ahora `jugarCombate` construye un resumen con `jugador`/`enemigo` (`{ id, nombre, hpMaximo, hpFinal, modoActivoNombre }`) además del historial. El motor (`engine/combat.js`) no cambió — esto es una capa de presentación añadida en el store.

## `components/common/HoverTooltip.jsx` + tarjetas que lo usan

> **Se muestra con el combinador de hijo directo (`.hover-envoltorio:hover > .hover-contenido`), no
> con el `group-hover` de Tailwind.** Un `group/hover` con nombre lo activa **cualquier** ancestro
> que lo lleve, y eso rompía el anidamiento: en combate la tarjeta entera tenía hover y dentro
> llevaba una pastilla por pasiva con el suyo, así que al pasar por encima de la tarjeta se abrían
> todos los tooltips a la vez, unos encima de otros. Con `>` cada tooltip solo responde a su propio
> envoltorio. El zoom usa la propiedad `scale` y no `transform: scale()`, porque las posiciones
> `arriba`/`abajo` se centran con el `-translate-x-1/2` de Tailwind, que ya ocupa `transform`.

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
