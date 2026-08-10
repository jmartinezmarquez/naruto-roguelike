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
  actual (anillo sello), visitado (apagado, escala de grises al 55 % de brillo), disponible
  (brillante, clicable), fuera de alcance (más apagado todavía, 35 % de brillo, no clicable).
  - Los estados apagados usan **filtros (`grayscale` + `brightness`), nunca `opacity`**: en un
    Pokelike los nodos son sprites opacos, y bajarles el alpha deja ver el fondo y las líneas del
    mapa a través del sprite. Apagados siguen siendo opacos; la jerarquía la marca el brillo.
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
  - **Combate entrenador, mini-jefe y jefe comparten el sprite de combate** — la hoja no trae arte
    por personaje todavía. Lo que los distingue es el color del borde más un badge de rango
    (`BADGE_NODO`: `★` entrenador, `☠` mini-jefe, `危` jefe) en la esquina inferior derecha, y el
    jefe además va más grande (56 px) con borde doble. El recorte circular se aplica a la `<img>`,
    no al `<button>`: si lo llevara el botón con `overflow-hidden`, cortaría el badge.
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
- **`PanelObjetos`**, debajo del panel de equipo: oro y objetos del inventario (solo lo que está
  suelto — lo ya equipado vive en `PanelEquipo`, no aquí), agrupados por id con "×N" si hay
  repetidos. Cada objeto envuelto en `ItemHoverCard` (ver más abajo) — descripción en prosa más el
  efecto exacto en números, no solo "aumenta el ataque" sino "+2 ATQ permanente". Tocar un objeto
  abre un selector inline de personaje ("Equipar en..." si es `equipable`, "Usar en..." si es
  `consumible`) que despacha a `equiparObjeto`/`usarConsumible` en el store — ver
  [21 - Objetos equipables](./21-objetos-equipables.md).
- **`RuedaChakra`**: pictograma del ciclo de ventajas de chakra, junto al mapa —
  ver [19 - Selección de personaje](./19-seleccion-de-personaje.md).
- **`MenuIconos`**: esquina superior derecha, estilo Pokelike — Logros (🏆), Pantalla completa (⛶,
  Fullscreen API del navegador) y Reiniciar Run (⟲, con `window.confirm` porque borra la run actual
  sin posibilidad de deshacerlo). Sin "Ajustes" todavía — no hay ninguna opción real que poner ahí.
- El viejo aviso "este nodo no tiene pantalla propia todavía" se quitó — ya no existe ningún tipo de
  nodo sin pantalla o resolución propia (descanso se auto-resuelve, el resto tiene pantalla).

## `components/Combat/CombatScreen.jsx`

- Lee `ultimoResultadoCombate` del store (resumen enriquecido: nombres, HP máximo, modo activo).
- Reproduce `historial` turno a turno con auto-avance (900ms/turno), reconstruyendo el HP de cada lado restando el daño acumulado de los turnos ya revelados. Botón "Saltar animación".
- Barras de HP con color según % restante (`fuuton` >50%, `raiton` 20-50%, `sello` <20%). Cada `BarraLuchador` envuelta en `PersonajeHoverCard` (jugador se abre hacia la derecha, enemigo hacia la izquierda, para no salirse de la pantalla).
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
  `equipadoEnNombre` opcional ("Equipado en X"). Usada en `PanelObjetos` de `MapScreen`. El efecto
  ya se aplica de verdad, no es solo texto — ver [21 - Objetos equipables](./21-objetos-equipables.md).
- **Hover de nodo del mapa** (dentro de `NodoMapa`, `MapScreen.jsx`) — tipo de nodo, qué hace, y su
  estado actual. Sustituye a la vieja `LeyendaMapa` fija.

## `App.jsx`

Flujo real: mientras `mapa` es `null` (arranque, o tras `reiniciarRun()` desde Game Over) se
muestra `CharacterSelectScreen` en vez de cualquier pantalla del store — ahí el jugador elige su
personaje inicial y `onConfirmar` llama a `iniciarRun`. Con `mapa` ya creado, alterna entre
`MapScreen`/`CombatScreen`/`EventScreen`/`ShopScreen`/`GameOverScreen`/`AchievementsScreen` según
`pantalla`, más `LogroToast` montado aparte. Antes de todo esto, un efecto llama a
`cargarLogros()` una vez al montar — el roster de `CharacterSelectScreen` depende de qué logros
ya estén desbloqueados. Ver [19 - Selección de personaje](./19-seleccion-de-personaje.md).
