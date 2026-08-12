# Roadmap

## Hecho

**Fundamentos**
- [x] Concepto, temática (Naruto), 3 arcos del MVP definidos.
- [x] Datos completos: `types`, `characters` (14 personajes), `enemies` (6 jefes/minijefes),
  `common-enemies`, `items`, `config`, `events` (12, 4 por arco), `arcs/*` (3).
- [x] Motor puro (`engine/`): `leveling.js`, `combat.js`, `mapGenerator.js`. Combate 1vs1
  automático, con rondas encadenadas si el activo cae (ver [09](./09-motor-engine.md)).
- [x] `store/useGameStore.js`: equipo, oro, inventario, mapa, HP persistente, buffs temporales,
  bonificaciones permanentes.

**Balance (varias iteraciones, ver [11](./11-progresion-y-arcos.md) para la historia completa)**
- [x] Curva de XP corregida (la original pedía 24,8M de XP para un presupuesto real de ~5.000).
- [x] Reparto de XP con el banquillo (0.6) para que los personajes no activos no se queden atrás.
- [x] Balance de jefes con ratios fijos sobre personaje medio (no valores absolutos).
- [x] Sistema de nivel de enemigo: se probó dinámico (relativo al jugador) y se descartó por quitarle sentido a subir de nivel — vuelto a fijo por piso, recalibrado con el número real de combates de un único camino (no todos los nodos del piso).
- [x] Niveles de transformación por personaje, ajustados por arco de reclutamiento.

**UI**
- [x] Dirección visual propia (tinta/pergamino ninja, tipografía japonesa) — ver [13](./13-ui-mapa-y-combate.md).
- [x] Pantalla de Mapa: forma de diamante por piso, panel de equipo reordenable, leyenda de nodos,
  pictograma de ventaja de chakra debajo de la leyenda.
- [x] Pantalla de Combate: animación por rondas, HP real (no siempre lleno), botón Nueva Run al perder.
- [x] Pantalla de Evento: 12 eventos canónicos, pistas automáticas por elección, sin combate.
- [x] Pantalla de Tienda: consumibles, objeto gratuito, reclutamiento exclusivo con reemplazo si el
  equipo está lleno — ver [15](./15-tienda.md).
- [x] Nodo de descanso auto-resuelto (cura y revive a todo el equipo).
- [x] Pantalla de Game Over dedicada, con el estado final del equipo — ver [17](./17-game-over.md).
- [x] Tarjeta de hover con stats/tipo/jutsu/HP en todo sitio donde se muestra un personaje (mapa,
  combate, tienda, selección) — `components/common/PersonajeHoverCard.jsx`.

**Flujo real de la run**
- [x] `App.jsx` real: pantalla de selección de personaje inicial (`CharacterSelectScreen.jsx`) en
  vez de arrancar fijo con Naruto/Sasuke/Sakura — se elige 1 y el resto del equipo se completa
  reclutando durante la run — ver [19](./19-seleccion-de-personaje.md).
- [x] Reclutar con el equipo lleno ahora deja elegir a quién reemplazar, en vez de bloquear el
  reclutamiento — ver [19](./19-seleccion-de-personaje.md).

**Sistema de logros**
- [x] Motor y persistencia (`engine/achievements.js` + `store/useAchievementsStore.js`), meta-progresión
  entre runs vía `localStorage` separado de la run en curso — ver [18](./18-sistema-de-logros.md).
- [x] Pantalla de Logros (`components/Achievements/AchievementsScreen.jsx`, botón desde el mapa) y
  notificación al desbloquear uno (`LogroToast.jsx`, se desvanece sola) — ver [18](./18-sistema-de-logros.md).
- [x] Cadena de jefes / combates de grupo (ver [12](./12-cadena-de-jefes.md)).
- [x] Reclutamiento vía tienda y jerarquía de rareza (ver [14](./14-reclutamiento-y-rareza.md)) — esto ya se implementó, este punto queda como referencia histórica del diseño previo.

**Calidad**
- [x] Testing con Vitest: 93 tests sobre motor y store — ver [16](./16-testing.md).

**Bugfixing y ajustes de diseño (ronda completa)**
- [x] Selección de personaje: ficha completa siempre visible (no hover), la run arranca al tocar
  una tarjeta — ver [19](./19-seleccion-de-personaje.md).
- [x] Líneas del mapa con 4 estados (recorrido, elegible ahora, descartado en negro, fuera de
  alcance con puntos) y nodos visitados en greyed out con `title="Visitado"` — ver [13](./13-ui-mapa-y-combate.md).
- [x] Nodo de descanso garantizado en el piso inmediatamente anterior al jefe final (no en
  cualquier punto de un camino trazado — ese primer intento no se parecía al patrón real de un
  Pokelike) — `garantizarDescansoAntesDelJefe` en `mapGenerator.js`, ver [10](./10-generador-de-mapa.md).
- [x] Daño del jutsu: se muestra el poder base (`jutsu.danoBase`) en vez de un daño estimado
  calculado, estilo Pokémon — ver [19](./19-seleccion-de-personaje.md).
- [x] Menú de iconos (Logros, Pantalla completa, Reiniciar Run) junto al mapa — `MenuIconos` en
  `MapScreen.jsx`. Sin "Ajustes" todavía, no hay ninguna opción real que poner ahí.
- [x] Diagnosticado (no es un bug de código): en País de las Olas solo aparecen reclutables los
  jefes ya desbloqueados por logro — el arco no tiene roster propio a propósito, y el roster real
  vive en el arco 2, inalcanzable hasta encadenar arcos (punto 1 de abajo) — ver [15](./15-tienda.md).
  **Actualización**: los "inicial" no elegidos al empezar la run también se pueden reclutar en
  cualquier tienda, incluida la del primer arco — así siempre se puede formar equipo de 3 aunque
  no haya ningún logro desbloqueado todavía.
- [x] Efectos de estado de jutsu desactivados para el MVP (`efectoEstado: null` en todos los datos)
  — el motor sigue soportándolos tal cual si se rellenan en el futuro — ver [09](./09-motor-engine.md).
- [x] Toast de curación (nodo de descanso y eventos de curación) que se desvanece solo, en vez del
  placeholder de texto fijo — `AvisoToast.jsx`.
- [x] XP: un personaje que cae DURANTE el combate actual (rondas encadenadas) sí gana su XP de esa
  victoria; uno que ya estaba caído de un combate anterior no gana nada hasta curarse — ver
  [09](./09-motor-engine.md).
- [x] El mapa cabe siempre en el viewport sin scroll (escalado con `ResizeObserver`, estilo
  Pokelike) — ver [13](./13-ui-mapa-y-combate.md).

**Arcos encadenados**
- [x] Los 3 arcos se juegan en una sola run: al derrotar al jefe final de uno (Zabuza → Gaara →
  Pain), la run continúa automáticamente con el siguiente en vez de terminar ahí. Derrotar a Pain
  (único con `recompensa.finDeLaRun: true`) marca la run como ganada de verdad —
  `GameOverScreen` ahora distingue victoria de derrota. Ver [20](./20-arcos-encadenados.md).
  **Sin implementar a propósito**: el evento narrativo de transición entre arcos (hoy es un botón
  directo "Continuar al siguiente arco", sin pausa) — queda anotado como posible mejora ahí mismo.
- [x] Al derrotar al jefe final de un arco, todo el equipo se cura y revive por completo (estilo
  Slay the Spire) antes de continuar — reutiliza `_curarEquipoCompleto`, mismo mecanismo que el
  nodo de descanso. Ver [20](./20-arcos-encadenados.md).

**Objetos y oro visibles, hover en nodos**
- [x] `PanelObjetos` (`MapScreen.jsx`) debajo del panel de equipo: oro + inventario agrupado por
  id con "×N", hover por objeto con descripción y efecto exacto en números (`ItemHoverCard`).
- [x] `LeyendaMapa` (fija, siempre visible) sustituida por hover en cada nodo del mapa: qué es y
  qué beneficio da, más su estado actual (visitado/aquí/fuera de alcance).
- [x] Extraída la mecánica de hover a `components/common/HoverTooltip.jsx` (antes vivía duplicada
  dentro de `PersonajeHoverCard`) — la reutilizan `PersonajeHoverCard`, `ItemHoverCard` y el hover
  de nodo. Ver [13](./13-ui-mapa-y-combate.md).

**Objetos equipables y consumibles (aplicación real de efectos)**
- [x] El hueco de la sesión anterior (ningún objeto aplicaba su efecto de verdad) está resuelto —
  se descartó el diseño original de "pasivo de todo el equipo" a favor de un sistema de equipo:
  cada objeto no-consumible se asigna a un personaje concreto (`equiparObjeto`/`desequiparObjeto`),
  solo beneficia a quien lo lleve puesto, y vuelve al inventario si lo desequipas o reemplazas a
  ese personaje. `revivirUnaVez` y `curacionPostCombate` ya se disparan de verdad en combate; los
  consumibles se usan desde `PanelObjetos` (`usarConsumible`). Ver [21](./21-objetos-equipables.md).

**Nodo de reclutar + rediseño de tienda + recompensa de mini-jefe**
- [x] Nodo `reclutar` dedicado en el mapa (icono `✚` verde, sin restricciones de piso ni cap):
  3 fichas de ninja a elegir, 1 clic para reclutar, panel de reemplazo si el equipo está lleno,
  sin coste de oro. Ver [25](./25-nodo-reclutar.md).
- [x] Tienda rediseñada: 3 objetos aleatorios comprables (consumibles o equipables mezclados), sin
  reclutar, sin objeto gratuito. Ver [15](./15-tienda.md).
- [x] Al derrotar a un mini-jefe, pantalla `ItemRewardScreen` con 1 objeto aleatorio (el
  `objetoGarantizado` del jefe): "Recoger" o "Saltar". Los jefes finales siguen auto-añadiendo su
  objeto sin pantalla extra.
- [x] Fichas de personaje (hover en todo el juego) rediseñadas: fondo oscuro, emoji de tipo junto
  al nombre (🔥⚡🌪️🪨💧), sin badge de tipo, sin tipo en el jutsu — más compactas.

**Combate en cadena (entrenadores)**
- [x] Nodos de combate con enemigo nombrado (Zaku, Dosu, Kin) encadenan N genins previos:
  `esEntrenador: true, geninAntes: N` en `common-enemies.json`. Zaku/Dosu = 2 genins, Kin = 1.
- [x] `cadenaEnemigos` en el store rastrea la posición dentro de la cadena; `continuarCadena()`
  avanza al siguiente combate. Los buffs temporales no se gastan hasta el último combate.
- [x] El avance entre combates de la cadena es **automático** (1,6 s de delay, sin botón):
  `CombatScreen` muestra "COMBATE X/N" y un texto pulsante "Siguiente enemigo...".
  Ver [26](./26-combate-en-cadena.md).
- [x] Icono de nodo entrenador distinto en el mapa (`★` rojo-naranja, color katon) para
  diferenciarlo visualmente del combate aleatorio antes de entrar.

**Visual / tipografía**
- [x] Fuente pixel art GBA (`PressStart2P`) aplicada a todo el texto del juego —
  registrada en `index.css` como `--font-body` y `--font-display`. `font-display: swap`
  para evitar FOIT (texto invisible mientras carga la fuente).
- [x] Fuente `NJNaruto` aplicada con `font-naruto` en los titulares de impacto:
  "Elige a tu ninja", "VICTORIA / GAME OVER", nombre del arco en el mapa.
- [x] Background de app: `game-background-dark-theme.png` (paisaje nocturno de Konoha) como
  fondo fijo via `backgroundAttachment: fixed` en el wrapper de `App.jsx`. El wrapper
  envuelve ahora también la pantalla de selección de personaje (antes era un early-return
  sin fondo, lo que causaba pantalla completamente negra).
- [x] Rueda de chakra rediseñada: panel oscuro `bg-tinta-900`, emoji en vez de abreviaturas
  de texto (via `foreignObject` SVG para compatibilidad cross-browser), bordes de color
  por elemento, flechas más finas.
- [x] Pantalla de Reclutar: badge de tipo con texto ("KATON") sustituido por emoji (🔥⚡🌪️🪨💧)
  coherente con el resto del juego.

**Traducción al inglés**
- [x] Todos los textos de cara al usuario reescritos directamente en inglés (una sola versión, sin
  i18n): datos JSON (`characters`, `enemies`, `common-enemies`, `events`, `items`, `achievements`,
  `types`, `arcs/*`), todos los componentes React (`MapScreen`, `CombatScreen`, `EventScreen`,
  `ShopScreen`, `RecruitScreen`, `CharacterSelectScreen`, `GameOverScreen`, `AchievementsScreen`,
  `ItemRewardScreen`, `PersonajeHoverCard`, `ItemHoverCard`, `LogroToast`) y el store
  (`avisoUltimoNodo`). Las claves JSON internas (ids de arco, `rareza`, `efecto.tipo`, etc.) se
  mantienen en español porque son claves lógicas, no texto de display.

**Sprites de nodos en el mapa**
- [x] Los glifos kanji provisionales de cada nodo sustituidos por los sprites reales de
  `sprite-nodos-mapa.png`. Como la hoja del artista trae los 5 iconos juntos y etiquetados, se
  recortaron a `assets/nodes/*.png` (media resolución) en vez de cargar la hoja de 1,4 MB entera;
  las coordenadas del recorte quedan anotadas en [13](./13-ui-mapa-y-combate.md) por si hay que
  rehacerlo. Cubiertos: combate, evento, tienda, descanso y reclutar.
- [ ] **Pendiente de arte**: combate entrenador, mini-jefe y jefe final deberían llevar el sprite
  del personaje concreto. Hoy comparten el sprite de combate y se distinguen por color de borde +
  badge de rango (`★` / `☠` / `危`) y, en el jefe, tamaño mayor con borde doble. El asset
  `map-sprites-idle-all-characters.png` tiene los personajes, pero en una hoja con paneles de
  tamaño irregular: hace falta recortarlos uno a uno antes de poder mapearlos por `enemigoId`.

**Fondo de columna central del mapa**
- [x] Cada arco pinta su propia columna de fondo detrás del mapa (`FONDO_COLUMNA` en
  `MapScreen.jsx`, keyed por `id` de arco). El primer intento (`background-size: 400% auto` +
  `background-position-x` sobre la hoja entera) se retiró porque `map-column-backgrounds.png` es
  una hoja de **referencia**, con marcos y etiquetas: al posicionarla por porcentajes salían los
  rótulos y los bordes. Ahora las 3 columnas están recortadas a `assets/map-columns/*.png` y se
  pintan con `cover`. El problema de contraste que motivó la retirada se resuelve con un velo
  oscuro (`bg-tinta-950/45`) entre el fondo y los nodos. Ver [13](./13-ui-mapa-y-combate.md).

**Mochila y sprites de objeto**
- [x] Mochila como pantalla propia en dos paneles (lista + ficha), con botón contextual
  Use/Equip/Unequip y elección de personaje en tarjetas — implementa [23](./23-diseño-tarjeta-de-inventario.md)
  y [24](./24-diseño-tarjeta-equipar-objeto.md). Ver [28](./28-mochila.md).
- [x] Los 10 sprites de `sprite-objetos-iniciales.png` recortados con
  `scripts/generar-sprites-objetos.py` a `assets/items/<id>.png` (fondo transparente), y usados en
  mochila, tienda, recompensa de mini-jefe, hover de objeto y panel del mapa.
- [x] El panel de objetos del mapa deja de equipar: es un resumen que abre la mochila (y tocar un
  objeto la abre con ese objeto ya seleccionado).

**Jutsus automáticos (estructura del combate)**
- [x] Cada luchador tiene ahora dos ataques: un **ataque básico** continuo y su **jutsu**, que se
  carga al atacar y al recibir daño y se lanza solo al llenarse la barra (estilo Pokémon GO). El
  combate sigue sin pedir ninguna decisión al jugador. Los personajes se diferencian por ritmo, no
  solo por stats: Rock Lee dispara cada 2 turnos, Shikamaru cada 4 pero mucho más fuerte, Gaara solo
  carga rápido si le pegan. Ver [29](./29-sistema-de-jutsus-automaticos.md).
- [x] Daño recalibrado para que la dificultad no se moviera, medido con el nuevo
  `scripts/simular-combates.mjs` contra el motor anterior. `turnosMaximos` 20 → 30. Corregido de
  paso el `danoBase: 5` de Naruto (dedazo: el resto del roster estaba entre 0,85 y 1,4).
- [x] Barra de jutsu en `CombatScreen` y ritmo de carga en la ficha de
  personaje y en la tarjeta de reclutar — sin eso no hay forma de saber en qué se diferencian.
- [x] **Ataque básico unificado**: ya no lo define nadie en los JSON, todos usan
  `config.combate.jutsu.ataqueBasicoPorDefecto` ("Kunai Throw", 0.65). Esos números nunca fueron
  diseño — salían de aplicar `básico = 0,6·D` en la calibración— y el daño real ya se diferencia por
  la stat de ataque. Jutsus recalibrados (`jutsu = T·D − (T−1)·0,65`) y test de invariante para que
  nadie vuelva a añadir uno propio en silencio.
- [x] Ficha de personaje adelgazada: fuera el ataque básico, fuera los "Power N" (no son daño, son un
  multiplicador contra una fórmula interna) y fuera el "Jutsu about every N turns". Queda el nombre
  del jutsu y **tres puntitos** de ritmo de carga (`RitmoCarga`) — cualitativo, porque reclutar es
  elegir entre tres ninjas que no has visto pelear y sin ninguna pista la decisión vuelve a ser solo
  stats. Ver [29](./29-sistema-de-jutsus-automaticos.md).
- [x] **Fue fuera de alcance a propósito**: el [27](./27-sistema-de-balance.md) se dejó para su
  propio punto (el 1, ya hecho), y de él solo se dejaron aquí los dos enganches
  (`multiplicadorCarga` en modos, `carga.inicial` para objetos).

**Pulido visual estilo Pokelike**
- [x] Nodos del mapa no clicables: se apagan con transparencia (`opacity-40` fuera de alcance,
  `opacity-65` visitado) + cursor de prohibido, en vez de `grayscale brightness-[0.35]`. Los filtros
  mantenían el sprite opaco pero dejaban el mapa entero casi negro.
- [x] Los nodos garantizan un tamaño **real en pantalla** (mínimo 44 px): antes eran 48 px de lienzo,
  y como el lienzo se escala para caber, acababan en ~31 px y el icono no se distinguía. Ver
  `tamanoNodo()` en `MapScreen.jsx`.
- [x] Hover de nodo: al mini-zoom que ya había se le suma un halo rojo, y el tooltip pasa a ser solo
  el título del tipo de nodo (se quitó `INFO_NODO`, la descripción larga).
- [x] Las tarjetas suben unos píxeles al pasar por encima (`.elevar-hover` en `index.css`),
  combinado con el resaltado por color/glow que ya teníamos. Va solo en lo que el jugador **elige**
  (tarjetas de tienda/reclutar/selección de personaje, sprites del panel de objetos, "Collect"), no
  en los botones de ejecutar o salir (`Equip`, `Close`, `SKIP`) — probado con los dos y el rebote los
  ponía al mismo nivel que la elección de verdad. Ver [13](./13-ui-mapa-y-combate.md).
- [x] Ficha de personaje sin la descripción del jutsu: ocupaba media tarjeta con texto narrativo que
  no cambia ninguna decisión. Irá a la futura enciclopedia.
- [x] `PanelObjetos` movido a la columna derecha, encima de la rueda de chakra: rejilla de sprites
  sin nombre, oro en la misma línea del título "ITEMS" (no es un objeto de la mochila), y hover
  compacto de una línea "Nombre: efecto" (`FichaObjetoCompacta` en `ItemHoverCard.jsx`).
- [x] `nombrePersonaje` unificado en `components/common/nombres.js`: cada pantalla tenía su copia
  mirando solo `characters.json`, así que un jefe reclutado por logro (Zabuza, Pain) salía con el id
  crudo en el panel de equipo, la mochila y el game over.

**Rediseño del balance (punto 1, las 4 fases) — ver [30](./30-sistema-de-pasivas.md)**
- [x] Fases 1-3: motor de pasivas (`engine/passives.js`, 14 pasivas con usuario real), los 31 modos
  y los 10 objetos declarando pasivas del mismo catálogo, y `engine/items.js` borrado al quedarse
  sin uso. Los objetos dejaron de dar estadísticas planas: se diluían con el nivel y valían más al
  empezar la run que al acabarla.
- [x] Fase 4 — **el simulador primero, la calibración después**. `simular-combates.mjs` era ciego a
  dos cosas: nunca equipaba objetos, y *suponía* el nivel del jugador interpolando entre los niveles
  de jefe del arco — o sea que daba por buena la conclusión que tenía que demostrar. Ahora calcula
  la XP real (`nivelesEstimadosDeLaRun` en `engine/leveling.js`), equipa objetos, mide los jefes con
  el equipo de 3 **en cadena** y con el HP que deje el camino, y reporta de dónde viene el poder.
- [x] Con eso midiendo, el diagnóstico cambió: **el problema no era la curva de stats, era la
  economía de XP.** Se llegaba a Zabuza (Nv.4) siendo 9, a Gaara (Nv.24) siendo 34 y a Pain (Nv.49)
  siendo 70; los combates comunes se ganaban al 99-100% con el HP casi intacto, y el mini-jefe era
  la pelea más dura de cada arco porque se pelea antes de que caiga su propia XP. Recalibrados: XP
  común por arco (`xpCombateComun`), XP de jefe, bandas de nivel de los tres arcos (las viejas eran
  aritméticamente imposibles: 8 pisos no caben en 3 niveles), stats de jefe, niveles de desbloqueo
  de las transformaciones y `crecimientoStatsPorNivel` 0,08 → 0,03. Ver
  [11](./11-progresion-y-arcos.md) sección "v4".
- [x] **Bug de HP al subir de nivel**: `aplicarXpYActualizarHp` sumaba bien el incremento de vida,
  pero `_aplicarVictoria` pisaba después el `hpActual` del activo con el HP del final del combate y
  se lo tiraba. El banquillo cobraba la vida del nivel y **el que peleaba no** — justo el que gana
  la XP completa. Invisible en pantalla. Arreglado pasando el HP de combate como entrada
  (`hpDePartida`) en vez de sobrescribir la salida.
- [x] 162 tests (eran 153): siete invariantes de progresión y arco, y dos del HP al subir de nivel.
  Los de arco existen porque los niveles fijos que declara un arco solo significan algo si alguien
  comprueba que el jugador llega ahí, y se dio por supuesto durante meses.

## Próximos pasos (en orden sugerido)

> **Por dónde seguir ahora mismo: el punto 4, la pantalla de transformación.** Los puntos 1 y 2
> están cerrados, y con ellos el motor y la pantalla de combate.
>
> El punto 4 va antes que el 3 aunque esté después en la lista, por dos motivos. Es **lo último que
> deja invisible el rediseño del balance**: las transformaciones se quitaron de las tarjetas a
> propósito, para que fueran una sorpresa, y ahora mismo no hay ningún sitio donde se descubran —
> un personaje alcanza el nivel de su modo y no pasa absolutamente nada. Y es **mucho más pequeño**
> que el 3, que toca generador de mapa, store y un flujo de combate nuevo; el 4 es una pantalla que
> se engancha al final del combate, que es justo lo que se acaba de reescribir.
>
> Lo que el punto 4 necesita decidir y no está escrito: **cómo se detecta que alguien ha
> desbloqueado un modo**. La vía natural es que `_aplicarVictoria` compare `obtenerModoActivo` antes
> y después de aplicar la XP, y lo anote en el resumen del combate igual que ya se hace con
> `logrosDesbloqueados` — que además ya tiene resuelto el problema de "no lo enseñes hasta que la
> animación termine, no destripes el combate".
>
> Después, el **3**. Y si hace falta algo corto y visible entre medias, el **8** (tarjeta de equipo)
> es el más barato y el mejor especificado.
>
> Lo único que el punto 1 deja abierto a propósito es el peso de los objetos: se quedaron en el
> 21-24% del poder, no en el 40% del doc 27. Llegar al 40% exigiría que un solo objeto pesara más
> que la transformación entera, y solo hay un hueco de equipo. Revisable si algún día hay más
> huecos o categoría económica. Frente al 1,5% de partida, el objetivo de fondo está cumplido.
>
> **La numeración está congelada a propósito.** Hay referencias a "punto N del roadmap" repartidas
> por comentarios de código y otros documentos, y ya se han desincronizado dos veces al renumerar.
> La lista empieza en 2 porque el 1 está hecho, no por error.

2. [x] **Actualizar interfaz de combate** — Todo el equipo debería aparecer en pantalla aunque solo
   el primero esté peleando. Sprites de los personajes visibles. Los logs de texto se sustituyen
   por una animación: el ninja lanza un kunai al enemigo y al impactar la barra de HP baja.
   Personajes caídos → card apagada (estilo Pokelike). Efecto de sacudida al recibir golpe.
   Y **enseñar las pasivas cuando saltan** (`pasivasActivadas` viene en cada evento): sin eso el
   sistema entero del punto 1 es invisible — ver [30](./30-sistema-de-pasivas.md).

   **No toca el motor.** Todo lo que hace falta ya viaja en los eventos desde la fase 3 del punto 1:
   `pasivasActivadas`, `esAtaqueExtra`, `hpAtacante`, `cargaAtacante`/`cargaDefensor`, `tipoAtaque`
   y `eficacia`. Si en algún momento hace falta tocar `engine/combat.js` para esta pantalla, es
   señal de que se está inventando un suceso nuevo — parar y replantear.

   ### Plan, en cuatro fases

   Cada una deja el juego jugable y se puede parar entre medias. Van en este orden porque el riesgo
   crece: las dos primeras solo añaden, la tercera reescribe el reloj de la pantalla.

   1. [x] **Equipo entero en pantalla.** Hoy `CombatScreen` pinta un 1 vs 1 y de los otros dos
      personajes no hay ni rastro, ni siquiera cuando entran por la cadena de rondas. Tres tarjetas
      del equipo con HP y nivel: la activa resaltada, las caídas apagadas (estilo Pokelike), las
      que esperan en tono normal. El dato ya está: `resultado.rondas[i].jugador` dice quién pelea
      cada ronda y el equipo vive en el store. Sin lógica nueva, solo layout.
   2. [x] **Pasivas visibles.** Es la fase con más valor por línea escrita y la que justifica el punto
      entero: `pasivasActivadas` viene en cada evento y hoy **no se lee en ninguna parte**. Etiqueta
      flotante sobre el luchador cuando salta ("¡Susanoo!") más una línea en el registro, con el
      nombre y la frase que ya están en `data/passives.json` (`describirPasiva`, el mismo texto que
      usan los hovers de objeto — sin duplicar textos). Aquí también entra el `esAtaqueExtra`, que
      ahora mismo se pinta como un golpe normal y confunde.
   3. [x] **Animación en vez de registro de texto.** La parte de verdad. El kunai vuela, impacta, la
      barra baja, el objetivo se sacude. `assets/projectile-sprites.png` ya existe.
      **El trabajo real no es la animación, es cambiar la unidad del replay**: hoy `turnosRevelados`
      avanza de turno en turno y un turno puede traer 2-4 eventos (los dos luchadores, más un
      ataque extra), así que todos se resuelven de golpe. Para animar hay que pasar a granularidad
      de evento, lo que toca `estadoEnTurnoActual` y los dos `useEffect` de autoplay.
      ⚠️ Con cuidado en dos sitios que ya han mordido: el HP del atacante **no** se reconstruye
      restando daño (`heal_on_kill` lo sube, por eso el evento trae `hpAtacante`) y la barra de
      carga tampoco se reconstruye sumando (lanzar el jutsu la pone a cero). Y el reset de estado al
      cambiar de combate se hace **durante el render**, no en un `useEffect` — está comentado en el
      propio archivo.
   4. [x] **Sprites por personaje.** `scripts/generar-sprites-personajes.py` recorta los 25 sprites
      de `map-sprites-idle-all-characters.png` a `assets/characters/<id>.png`, y
      `components/common/characterSprites.js` los mapea por id. Se usan en la tarjeta del luchador
      que pelea (el enemigo volteado para que se miren), en las tres tarjetas de equipo y —
      desbloqueando el pendiente de arte que había— en los nodos de **mini-jefe y jefe** del mapa,
      que hasta ahora compartían el icono genérico de combate. El nodo de **entrenador** no puede:
      su enemigo nombrado se sortea al ENTRAR en el nodo, no al generar el mapa, así que al pintarlo
      todavía no se sabe quién es.

      **Placeholders declarados** (no descuidos), en `PLACEHOLDERS` del script: Sai y Yamato no están
      en la hoja y llevan el genin de su naturaleza de chakra (fuuton y doton); Camino Animal
      comparte sprite con Camino Deva, el único Pain que hay. Pendientes de arte propio.

      El script **no lleva ni una coordenada escrita a mano** — mide la rejilla buscando los
      separadores oscuros, luego las bandas de fotograma dentro de cada panel. Tres cosas que
      costaron y conviene no repetir:
      - El borde interior del panel no es papel, así que aparecía en *todas* las filas y columnas y
        no se separaba ninguna banda: cada sprite salía siendo el panel entero. Se arregla metiendo
        el análisis unos píxeles hacia dentro (`MARGEN_PANEL`).
      - **El papel está texturizado**, son decenas de variantes de (237,225,204). Contando color a
        color, el "color de fondo" ganador salía el NEGRO plano de los contornos, y el borrado se
        llevaba los contornos dejando el papel. Hay que agrupar los tonos antes de contar.
      - En tres paneles (Sakura, Gaara, Kiba) los fotogramas se tocan y la banda se comía dos o tres
        filas. En vez de escribir la caja a mano, se usa la **mediana** de todas las cajas como
        calibre y se recorta lo que se pase de `FACTOR_FUSION`.

      También se recortaron los enemigos nombrados (Zaku, Dosu, Kin) y, de
      `projectile-sprites.png`, **el proyectil de jutsu de cada personaje** (Rasengan, Gran Bola de
      Fuego, Agujas de Hielo...) además del kunai, que es el ataque básico de todos. Lo que falta de
      arte está abajo, en "Pendiente de arte", no aquí: un apartado marcado `[x]` no es sitio donde
      nadie vaya a buscar trabajo por hacer.

   5. [x] **Rediseño de la distribución, estilo Pokelike.** Los dos bandos en cajas a izquierda y
      derecha en vez de una fila de duelo con el banquillo debajo, y una sola `TarjetaLuchador` para
      equipo y enemigo — antes eran dos componentes con el mismo diseño duplicado. El **registro de
      texto pasa a ser solo de desarrollo** (`import.meta.env.DEV`, que Vite convierte en `false` y
      elimina del bundle): la partida la cuenta la animación.

   ### Verificación

   `npm test` no cubre componentes (los tests son de `engine/` y `store/`), así que aquí la red de
   seguridad es **prueba manual tuya**, no automática. Lo concreto que hay que mirar: que una cadena
   de rondas encadene bien las tres tarjetas, que una pasiva salte visiblemente al menos una vez
   (Naruto o Sakura con `heal_on_kill` es la más fácil de provocar), y que "Skip animation" siga
   saltando al final sin dejar barras a medias.

3. **Nodo de reclutar con rareza visible y recluta legendario por combate** — la hoja
   `assets/sprite-nodos-mapa.png` trae tres pergaminos (verde común, azul raro, dorado legendario) y
   hoy solo se usa uno, porque el nodo no sabe qué rareza ofrece: `generarOfertaReclutar` sortea los
   candidatos al **entrar** en el nodo, no al generar el mapa. Hay que subir la rareza al nodo
   (`mapGenerator.js`) para poder pintar el pergamino correcto desde el mapa.
   Encima, el legendario deja de ser una elección: se convierte en un combate contra ese personaje y
   solo se recluta si lo ganas — flujo nuevo (pantalla de combate con `alGanar: reclutar`), no una
   variante de `RecruitScreen`. Es el único de los ajustes visuales de esta tanda que toca motor,
   store y datos, por eso va aparte.
   **Va detrás del 2 a propósito**: reutiliza la pantalla de combate nueva, no la vieja.

4. **Pantalla de transformación** ← **lo siguiente**. ⚠️ **No es opcional**: desde que las transformaciones se quitaron
   de las tarjetas (son una sorpresa, ver [30](./30-sistema-de-pasivas.md)), esta pantalla y el
   punto 2 son los **únicos** sitios donde el jugador se entera de que existen. Sin ellos, medio
   rediseño del balance vive solo en los JSON.
   Hoy, cuando un personaje alcanza el nivel de su modo, **no pasa
   absolutamente nada**: sube de nivel y de repente tiene el Manto del Kyūbi, sin aviso, sin pantalla,
   sin una línea de texto. Es el momento más importante de la progresión de un personaje y ahora
   mismo es invisible. Debería ser una pantalla propia al terminar el combate en que sube (estilo
   evolución de Pokémon): sprite del personaje, nombre de la transformación, y **aquí sí** la
   descripción de lo que hace, que se ha quitado de la tarjeta a propósito — es el momento en que
   esa información importa y en que el jugador está mirando.
   Va después del punto 2 porque encadena con el final del combate, que esa pantalla reescribe.

5. **Actualizar interfaz de logros** — (Leer MVP [25](./25-diseño-pantalla-logros.md))

6. **Actualizar interfaz de eventos** — es el único punto **sin documento MVP**. Antes de poder
   planificarlo hay que escribir qué se quiere de esa pantalla, como se hizo con
   [23](./23-diseño-tarjeta-de-inventario.md) o [25](./25-diseño-pantalla-logros.md).

7. **Playtest jugando** — la recalibración numérica ya está hecha (punto 1, fase 4, con el
    simulador contra los datos rediseñados). Lo que queda aquí es lo que un script no puede medir:
    sentarse a jugar runs enteras y ver qué se siente mal. Con lo ya detectado como lista de
    sospechosos:
    - Los combates normales se ganan al 94-99%. Los jefes ya no se miden 1 vs 1 sino con el equipo
      de 3 en cadena, que es como se pelean, y llegando al mini-jefe con el HP que deje el camino:
      mini-jefes al 80-93% y jefes finales al 82-88%. El nodo más justo es Haku (80%), y cuesta ~2
      de los 3 personajes.
    - Los combates duran ~4,5 turnos, tan poco que el jutsu apenas sale una vez
      (ver [29](./29-sistema-de-jutsus-automaticos.md)). Y con combates tan cortos **cargar lento
      castiga más de lo que dice la media** — un jefe con `T`=4 se come tres básicos flojos antes de
      su golpe gordo y el combate ya se acabó. Los perfiles de carga mueven la dificultad real, no
      son solo sabor.
    - El simulador da la run promedio: usa la XP **esperada** de cada piso, no un sorteo. Un camino
      real con dos tiendas seguidas llega al mini-jefe bastante más flojo, y eso solo se ve jugando.
    - En el arco 1 se empieza con **un solo personaje** y el equipo se completa reclutando, pero el
      simulador da por hecho un trío desde el principio. Zabuza es el jefe con menos margen y puede
      ser el que peor se sienta.
    - El salto de dificultad cuando un personaje de banquillo entra en una ronda encadenada contra un
      jefe (ver nota en [11](./11-progresion-y-arcos.md)).
    - El ritmo de empezar solo (1 personaje) en un arco sin reclutas (`pais_de_las_olas` tiene
      `personajesReclutablesIds: []`).

8. **Actualizar tarjeta de equipo** — Los nombres deberian estar acortados a "Naruto U." para no ocupar tanto en la pantalla de equipo. La fuente debería ser de un tamaño más pequeño para que tanto en la tarjeta de equipo como en la de reclutamiento el nombre quepa en una linea. Ahora que no tenemos descripción de nada podemos poner el tipo del luchador (Katon) como una etiqueta debajo del nombre debajo de la HP y eliminarlo del nombre. Mover el orden de los peleadores del equipo deberia ser un drag and drop, no un click. El objeto equipado en cada uno de ellos debería enseñar el sprite del objeto con una X para desequiparlo. Podemos ensanchar la tarjeta del equipo para no tener que hacer la fuente tan pequeña que sea dificil de ver, hay espacio. (ver [22](./22-diseño-tarjeta-de-personaje.md)) Y utiliza sprites placeholder para simular el espacio visual aunque no sean los definitivos

9. **Diseño de la columna central** — Con unos nodos mas grandes la columna central puede volver a su tamaño anterior, manteniendo las proporciones y ajustandose a la pantalla. También el sprite usado en la columna central tiene que ser mas sencillo y representativo del arco actual. El nombre del arco actual tendría uqe estar con ese estilo caracteristico de Naruto en el que la fuente tiene color negro con ese reborde blanco tan caracteristico

10. **Enciclopedia** — el sitio donde vive la información que se ha ido sacando de las tarjetas para
    que quepan en una pantalla: descripción de cada jutsu, potencia, turnos exactos de carga, **qué
    hace cada transformación** (`describirPasiva` ya genera esas líneas), **la descripción narrativa
    de cada objeto** (sigue en `items.json`, ya no se pinta en ninguna tarjeta), tabla de eficacias
    de chakra, y ficha de cada personaje y enemigo. Es consulta voluntaria, no algo que se cruce en
    medio de una run — pantalla propia desde el menú de iconos del mapa, como Logros.
    Ojo: hoy esa información **no está en ninguna parte**, así que hasta que esto exista hay una deuda
    real, no solo un "ya lo pondremos". Y crece cada vez que se adelgaza una tarjeta.

### Pendiente de arte

Cosas que no están hechas por falta de dibujo, no por falta de código. Van juntas aquí y no dentro
del punto que las dejó a medias, porque los puntos terminados se marcan `[x]` y nadie vuelve a
leerlos buscando trabajo.

- **Sai y Yamato no tienen sprite propio.** Llevan de placeholder el genin rival de su naturaleza de
  chakra (fuuton y doton). Declarado en `PLACEHOLDERS` de `scripts/generar-sprites-personajes.py`.
- **Camino Animal de Pain comparte sprite y proyectil con Camino Deva**, que es el único Pain que
  hay dibujado. Mismo sitio.
- **Los genin rivales no tienen proyectil de jutsu**, así que lanzan kunai también en su técnica.
  Sí existe el dibujo: está en la última casilla de cada panel de la fila 5 de
  `map-sprites-idle-all-characters.png` (fuego, hoja, rayo, roca, agua), pero el script coge el
  PRIMER fotograma de cada panel y habría que enseñarle a coger también el último.
  Es el que más se nota, porque los genins son la mayoría de los combates.
- **Neji, Shikamaru, Kiba, Sai y Yamato tampoco tienen proyectil de jutsu**: no están dibujados en
  `projectile-sprites.png`. Lanzan kunai. (Rock Lee no cuenta: es cuerpo a cuerpo a propósito, así
  lo marca la propia hoja.)
- **El nodo de entrenador del mapa** sigue con el icono genérico de combate. Este no es falta de
  arte sino de datos: su enemigo nombrado se sortea al ENTRAR en el nodo (`resolverEnemigoDeNodo`),
  no al generar el mapa, así que al pintarlo todavía no se sabe quién es. Arreglarlo es subir la
  elección al generador.

### Descartado

- **Hook de autoguardado tras cada nodo** (`guardarRun`/`cargarRun`): decidido que no compensa la
  complejidad — las runs son cortas, no hay tanto que perder si se cierra la pestaña a mitad. Las
  funciones ya existen en el store por si hiciera falta más adelante, simplemente no se conectan a
  ningún hook automático.

## Backlog (post-MVP)

Ideas nuevas pensadas para encajar con el formato Pokelike/Slay the Spire, marcadas aparte por ser
más grandes de lo que cabe en una sesión de bugfixing/ajuste:

- **Bifurcación de riesgo/recompensa** en algún nodo de evento: elegir entre un camino más difícil
  con mejor recompensa o uno seguro con menos, al estilo "elite fight" de Slay the Spire.

- **Evento narrativo de transición entre arcos** (ver [20](./20-arcos-encadenados.md)) — hoy es
  instantáneo, un botón directo al mapa del siguiente arco.
- Arte propio (sustituir placeholders).
- Ampliar sistema de logros
- Ampliar enemigos y objetos
- Sistema de campañas para incluir más niveles
- Sistema de cuentas / guardado remoto.
- Tests de componentes React (hoy solo motor + store).
- **Modificadores de dificultad entre runs** ("ascensión"): ligado a la condición de logro ya
  propuesta pero sin implementar `completarRunEnDificultad` en `achievements.json`.
