# Roadmap

## Hecho

**Fundamentos**
- [x] Concepto, temática (Naruto), 3 arcos del MVP definidos.
- [x] Datos completos: `types`, `characters` (15 personajes), `enemies` (6 jefes/minijefes),
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
  sin coste de oro. Ver [28](./28-nodo-reclutar.md).
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

**Interfaz de combate (punto 2, las 6 fases) — ver [13](./13-ui-mapa-y-combate.md)**

Fueron en este orden porque el riesgo crecía: las dos primeras solo añadían, la tercera reescribía el
reloj de la pantalla. **Ninguna tocó el motor** — todo lo que hacía falta ya viajaba en los eventos
desde la fase 3 del punto 1 (`pasivasActivadas`, `esAtaqueExtra`, `hpAtacante`,
`cargaAtacante`/`cargaDefensor`, `tipoAtaque`, `eficacia`). Si algún día hace falta tocar
`engine/combat.js` para esta pantalla, es señal de que se está inventando un suceso nuevo: parar y
replantear.

- [x] **Equipo entero en pantalla.** Antes `CombatScreen` pintaba un 1 vs 1 y de los otros dos
  personajes no había ni rastro, ni siquiera cuando entraban por la cadena de rondas. Ahora las tres
  tarjetas con HP y nivel: la activa resaltada, las caídas apagadas, las que esperan en tono normal.
- [x] **Pasivas visibles.** La fase con más valor por línea escrita y la que justificaba el punto
  entero: `pasivasActivadas` venía en cada evento y **no se leía en ninguna parte**, así que el
  sistema del punto 1 era invisible. Etiqueta sobre el luchador cuando salta, con el nombre y la
  frase de `data/passives.json` (`describirPasiva`, el mismo texto de los hovers de objeto). Aquí
  entró también el `esAtaqueExtra`, que se pintaba como un golpe normal y confundía.
- [x] **Animación en vez de registro de texto.** El trabajo real no fue la animación sino **cambiar
  la unidad del replay**: se avanzaba de turno en turno y un turno trae 2-4 eventos, así que se
  resolvían todos de golpe. Pasó a granularidad de golpe (`golpesEmpezados` + `impactado`), con el
  daño aplicándose en el impacto y no al lanzar.
  ⚠️ Dos sitios que ya han mordido: el HP del atacante **no** se reconstruye restando daño
  (`heal_on_kill` lo sube) y la barra de carga tampoco se reconstruye sumando (lanzar el jutsu la
  pone a cero). Y el reset de estado al cambiar de combate se hace **durante el render**, no en un
  `useEffect` — está comentado en el propio archivo.
- [x] **Sprites por personaje.** `scripts/generar-sprites-personajes.py` recorta los 25 sprites de
  `map-sprites-idle-all-characters.png` a `assets/characters/<id>.png`, mapeados por
  `components/common/characterSprites.js`. Se usan en el luchador que pelea (el enemigo volteado para
  que se miren), en las tarjetas de equipo y —desbloqueando un pendiente de arte— en los nodos de
  **mini-jefe y jefe** del mapa. El de **entrenador** no puede: su enemigo nombrado se sortea al
  ENTRAR en el nodo, no al generar el mapa.
  El script **no lleva ni una coordenada escrita a mano**. Tres cosas que costaron y conviene no
  repetir: el borde interior del panel no es papel y aparecía en *todas* las filas y columnas, así
  que no se separaba ninguna banda (`MARGEN_PANEL` lo arregla); el papel está texturizado (decenas
  de variantes de 237,225,204) y contando color a color el "fondo" ganador salía el NEGRO de los
  contornos, con lo que el borrado se llevaba los contornos y dejaba el papel; y en tres paneles
  (Sakura, Gaara, Kiba) los fotogramas se tocan, resuelto con la **mediana** de las cajas como
  calibre y `FACTOR_FUSION` en vez de escribir la caja a mano.
  También se recortaron los enemigos nombrados (Zaku, Dosu, Kin) y, de `projectile-sprites.png`, el
  proyectil de jutsu de cada personaje además del kunai. Lo que falta de arte está en "Pendiente de
  arte", no aquí: un apartado marcado `[x]` no es sitio donde nadie vaya a buscar trabajo por hacer.
- [x] **Rediseño de la distribución, estilo Pokelike.** Los dos bandos en cajas a izquierda y
  derecha en vez de una fila de duelo con el banquillo debajo, y una sola `TarjetaLuchador` para
  equipo y enemigo — antes eran dos componentes con el mismo diseño duplicado. El **registro de
  texto pasó a ser solo de desarrollo** (`import.meta.env.DEV`, que Vite convierte en `false` y
  elimina del bundle): la partida la cuenta la animación.
- [x] **Juiciness.** La tanda que convierte el combate en algo que se mira: **estela de HP** (dos
  barras al mismo porcentaje, la de detrás lenta y con retraso, así que el hueco es el mordisco);
  **telegrafiado del jutsu**, que se llena un turno ANTES de disparar
  ([29](./29-sistema-de-jutsus-automaticos.md)) y ese hueco no se veía; **ritmo variable** (el jutsu
  vuela más lento y con aire antes y después — con todo a la misma velocidad sonaba a metrónomo);
  **desplome al caer** y **entrada deslizante del relevo**, que era el momento más dramático y se
  contaba con una línea de texto; **números flotantes** de daño coloreados por eficacia (escala de
  calor, no semáforo — el mismo número sale sobre los dos bandos) y de **curación en verde**,
  detectada por la diferencia de HP y no por el mecanismo, así que un futuro jutsu con robo de vida
  saldría solo; y **subida de nivel** con cartel, destello dorado y el nivel nuevo en el título, con
  la pantalla de transformación esperando a que se vea (el orden cuenta la historia: subes de nivel,
  *por eso* desbloqueas el modo).
- [x] De aquí salió una regla para el motor, ya escrita en [09](./09-motor-engine.md): **el evento de
  ataque lleva el estado resuelto, no los deltas**. La carga se pone a cero al lanzar el jutsu y el
  HP sube con `heal_on_kill`, así que ninguno de los dos se reconstruye con aritmética. Rompió el
  replay una vez cada uno; ahora el evento trae `hpAtacante` y `hpDefensor` y el replay no calcula.

⚠️ **La red de seguridad de esta pantalla es la prueba manual, no `npm test`** (los tests son de
`engine/` y `store/`). Lo concreto que mirar al tocarla: que una cadena de rondas encadene bien las
tres tarjetas, que una pasiva salte visiblemente al menos una vez (Naruto o Sakura con
`heal_on_kill` es la más fácil de provocar), y que "Skip animation" siga saltando al final sin dejar
barras a medias.

⚠️ Y una que **no** cubre `npm run build`: si tocas `index.css`, comprueba que la regla llega al
bundle (`grep -o "mi-clase[^{]*{[^}]*}" dist/assets/*.css`). Un comentario mal cerrado hizo que
Tailwind descartara en silencio todas las reglas siguientes —el build daba OK— y los tooltips
salieron abiertos por defecto en todas las pantallas.

**Nodo de reclutar con rareza y desafío legendario (punto 3) — ver [28](./28-nodo-reclutar.md)**

- [x] Los tres pergaminos de `assets/sprite-nodos-mapa.png` (verde común, azul raro, dorado
  legendario) ya se usan los tres: la rareza se sortea **al generar el mapa** (`elegirRarezaReclutar`,
  pesos en `poolRarezaReclutar` de cada arco) y no al entrar en el nodo, que era exactamente lo que
  impedía pintar el pergamino correcto.
- [x] **El motor no puede saber qué rarezas hay**: quién está disponible depende del equipo y de los
  logros, y `engine/` es puro y agnóstico del contenido. Se lo pasa el store
  (`generarMapa(arco, { rarezasReclutarDisponibles })`), y por defecto solo `comun` — sin eso, la
  primera run pintaría pergaminos dorados que al abrirlos no tienen a nadie dentro.
- [x] **El dorado no es una elección, es un combate**: un solo rival, con su sprite y sus stats al
  nivel al que va a pelear, y el aviso de que si cae el equipo entero se acaba la run. Al ganar,
  `CombatScreen` no ofrece "Continue" sino "Recruit them" y vuelve al pergamino
  (`iniciarDesafioLegendario` / `irAReclutaDesafio` / `desafioRecluta`).
- [x] **Nivel FIJO por arco** (`nivelDesafioLegendario`: 6 / 23 / 41), como los jefes. Un desafío que
  escalara con el equipo sería siempre igual de difícil, y entonces no sería una decisión sino un
  peaje. Medido con un bloque nuevo del simulador ("Desafío legendario"): 40-53% en el piso 3 y
  71-89% en el 6. El abanico es inherente al nivel fijo, y se acepta porque el nodo es **opcional y
  se ve desde el mapa** — el jugador decide con la información delante.
- [x] **El jefe y el mini-jefe del arco en curso quedan fuera del pool de reclutas.** No es estética:
  ganarle al `jefeFinalId` en un nodo de reclutar habría disparado `arcoCompletado` dentro de
  `jugarCombate` y la run habría saltado de arco desde un pergamino.
- [x] Sprites con `scripts/generar-sprites-nodo-reclutar.py`, que **mide las tres posiciones sobre la
  propia hoja** en vez de llevarlas escritas.
- [x] 181 tests (eran 175): rareza siempre presente, nunca una rareza sin candidatos, degradación a
  común, el desafío como combate real, perderlo termina la run, y el jefe del arco excluido.

**Pantalla de transformación (punto 4) — ver [13](./13-ui-mapa-y-combate.md)**

- [x] ⚠️ **No era opcional.** Desde que las transformaciones se quitaron de las tarjetas (son una
  sorpresa, ver [30](./30-sistema-de-pasivas.md)), esta pantalla y el punto 2 son los **únicos**
  sitios donde el jugador se entera de que existen. Sin ellas, medio rediseño del balance vivía solo
  en los JSON: un personaje alcanzaba el nivel de su modo y **no pasaba absolutamente nada** — de
  repente tenía el Manto del Kyūbi, sin aviso, sin pantalla, sin una línea de texto.
- [x] Pantalla propia al terminar el combate en que sube, estilo evolución de Pokémon: carga de
  chakra con parpadeo de silueta, estallido, y luego quietud con el nombre del modo y **aquí sí** la
  descripción de lo que hace, que se quitó de la tarjeta a propósito — es el momento en que esa
  información importa y en que el jugador está mirando.
- [x] El store detecta el desbloqueo comparando `obtenerModoActivo` antes y después de aplicar la XP
  (no hay evento de "subir de modo") y lo manda en el resumen del combate como
  `transformacionesDesbloqueadas`, igual que los logros. Sprites en `assets/transformations/`,
  generados con `scripts/generar-sprites-transformaciones.py`.

**Tanda de playtest tras el punto 3 (bugs y ajustes de una partida real)**

- [x] **Los caminos que aún no están a tu alcance se ven.** Iban a opacidad 0,15, o sea que estaban
  ahí sin verse, y el mapa parecía terminar en el piso siguiente. Ahora van en blanco a 0,65: lo que
  los distingue de un camino elegible ya no es que se vean menos, sino que van discontinuos.
- [x] **El desafío legendario no suelta el objeto característico de su jefe.** Ya paga con el propio
  legendario; darle encima el Kubikiribōchō o la calabaza de arena es un pico de poder que se lleva
  por delante el resto del arco. Además esos objetos son recompensa de un **nodo de jefe**, y este
  no lo es.
- [x] **El legendario entra al nivel MEDIO del equipo y sin `bonusNivelAlReemplazar`**, no al del más
  fuerte como el resto de reclutas. Sus stats base ya son de jefe (90 de HP contra 38); con el nivel
  del mejor del equipo ganaba él solo lo que quedaba de run, sobre todo saliendo pronto.
- [x] **Uno o dos nodos de reclutar por arco, no cinco.** `reclutar` sale de `poolTiposNodo` y pasa a
  colocarse a mano (`colocarNodosDeReclutar`): uno garantizado y un segundo con probabilidad 0,15. El
  equipo tiene 3 huecos para toda la run, así que a partir del segundo pergamino la decisión ya no
  existe. El peso liberado se repartió entre evento/tienda/descanso **sin tocar el de combate**,
  porque `nivelesEstimadosDeLaRun` calcula la XP esperada de un piso como `pesoCombate / pesoTotal` —
  moverlo habría descolocado la curva de niveles entera, y de hecho el primer intento lo hizo y los
  invariantes de arco lo cazaron al momento.
- [x] **Dos pergaminos en vez de tres**: verde (común + inicial + raro) y dorado (legendario). Lo que
  los separa no es el poder sino cómo se consigue al ninja — el verde es una elección entre tres
  cartas, el dorado un combate. El azul se retira; con un solo nodo por arco casi no aparecía.
- [x] **Una pasiva que dan el modo Y el objeto se aplica una sola vez**, la de mayor cantidad. Antes
  se aplicaban las dos, lo que multiplicaba el efecto y hacía de esa combinación la única jugada
  buena del juego sin que nada lo dijera. Fuera también el marcador "×2" de la pastilla: la
  explicación va a la enciclopedia (punto 10).
- [x] **Bug gordo encontrado de camino: `normalizarPasivas` no era idempotente.** El store normaliza
  las pasivas del objeto equipado y `crearLuchador` las volvía a normalizar al juntarlas con las del
  modo; la segunda pasada enterraba `parametros` dentro de sí mismo y la `cantidad` acababa siendo la
  del catálogo. **Ningún objeto estaba aplicando su valor real.** No saltó nunca porque
  `simular-combates.mjs` pasa las pasivas en crudo y normaliza una sola vez: el simulador medía los
  números buenos y el juego corría con otros. Ver [30](./30-sistema-de-pasivas.md).
- [x] **Spare Ninja Headband**: el store siempre estuvo bien (revive una vez y se consume, con dos
  tests). Lo que fallaba era la tarjeta — `estadoDelEquipo` buscaba la ronda del personaje con
  `findIndex`, y quien revive pelea **dos** rondas del mismo combate, así que en la segunda su tarjeta
  salía muerta mientras él estaba peleando. Se leía como que el objeto no había funcionado.
- [x] **Otro de camino: la pastilla de pasiva no se encendía nunca.** `pasivasDelUltimoGolpe` devolvía
  nombres y `EtiquetasPasivas` comparaba contra ids, así que no coincidían jamás. La fase de "pasivas
  visibles" pintaba la lista pero no el momento en que una hace algo.
- [x] **Textos flotantes con la fuente 2p**, no con la de Naruto: esa se reserva para titulares
  ("Victory", el nombre del arco) y estos números son anotaciones sobre el sprite.
- [x] **La transformación se ve en la tarjeta al salir de su pantalla**, no en el combate siguiente, y
  **también en el banquillo**. El rótulo salía de `ronda.jugador.modoActivoNombre`, que solo tiene al
  que peleó; ahora se calcula del nivel (`nombreDeModo`), igual que el sprite, así que no pueden
  discrepar.
- [x] **Deslizado del relevo más corto** (28 px/420 ms → 12 px/260 ms) y solo cuando entra OTRO
  personaje. El tirón de verdad, eso sí, no era la animación: el `key` de las tres tarjetas llevaba el
  número de ronda, así que en cada relevo se remontaban también las del banquillo y sus barras y
  estelas volvían a empezar de cero.

**Tarjeta de equipo del mapa (punto 8) — ver [13](./13-ui-mapa-y-combate.md)**

Hecho junto con el 11: los dos rediseñaban la misma tarjeta y por separado habría sido tocarla dos
veces. El panel de equipo es la vista que el jugador tiene delante casi toda la partida y era texto
puro cuando ya existían los sprites.

- [x] **Sprite** con el nivel en la esquina, **nombre abreviado** (`nombreCorto`, "Naruto U.") en su
  propia línea a lo ancho de la tarjeta, los **números de HP** debajo de la barra, el **objeto
  equipado en su propia fila** con sprite, nombre y X, y el panel más ancho (`w-32` → `w-40`) para no
  tener que achicar la letra.
- [x] **El nombre necesita la fila entera**: compartiéndola con el sprite le quedaban 60 px y hasta
  "Naruto U." se truncaba en "Nar…". Por eso el nivel va superpuesto al sprite y no en una columna.
- [x] **El objeto se probó en la esquina del retrato y se movió abajo**: tapaba justo al ninja, que
  es lo primero que identifica la tarjeta. Y debajo de la barra van los **números de HP** en vez de
  la naturaleza de chakra — en el mapa lo que se consulta a cada paso es cuánta vida queda.
- [x] **Reordenar es drag and drop**, y no solo por comodidad: el clic solo sabía hacer "al frente",
  así que ordenar el segundo y el tercero entre sí era imposible. Al soltar se **saca y se
  reinserta**, no se intercambia — intercambiar deja el orden intermedio como estaba y el gesto no
  cuadra con lo que ve el jugador.
- [x] Los sprites placeholder que pedía el punto ya no hacen falta: los reales existen desde el 2.

**Tarjetas de personaje con sprite (punto 11) — ver [22](./22-diseño-tarjeta-de-personaje.md)**

Las tarjetas se diseñaron sin arte, con el nombre y las barras haciendo todo el trabajo. Con
`assets/characters/` y `assets/transformations/` poblados, se rehízo `FichaPersonaje` siguiendo el
[22](./22-diseño-tarjeta-de-personaje.md).

- [x] **Sprite grande** sobre su claro de tierra, nombre con nivel, **rareza en estrellas** (solo las
  estrellas y su color — la palabra "Legendary" repetía el dato y era lo más largo de la fila; se
  conserva en el `title`) y afinidad
  de chakra en pastilla de color, barra de HP con color por tramos y su cifra centrada, estadísticas
  **en lista alineada, sin barras y con abreviaturas** (ATT/DEF/SPE/HP), jutsu con su ritmo de carga
  y el objeto equipado con su sprite.
- [x] **Una sola ficha para todo el juego.** La pantalla de reclutar tenía su propio diseño en
  paralelo —con una barra por estadística, justo lo que el doc 22 descarta, y sin sprite—, así que
  reclutar enseñaba a un ninja distinto del que salía en el hover del mapa. Ahora las tres cartas del
  pergamino y la ficha del desafío legendario son `FichaPersonaje` dentro de un botón.
- [x] Sprites también en la **mochila al equipar**, en el **panel de reemplazo** al reclutar y en el
  **game over**, que era una tabla de nombres siendo la foto final de la run.
- [x] **Lo que NO se hizo del doc 22**: la sección de transformación en la tarjeta. Sigue fuera a
  propósito y por un motivo posterior al documento — todos los personajes tienen transformación (hay
  un test de invariante), así que decirlo no distingue a nadie, y son una sorpresa. Ver
  [30](./30-sistema-de-pasivas.md).

✅ **Y el ⚠️ que arrastraba: ninguna transformación de jefe se activaba jamás.** Sus modos se
desbloqueaban por encima del nivel al que se pelean — Zabuza a 15 peleándose a 10, Kabuto a 33
peleándose a 19, Gaara a 30 peleándose a 27 y Pain a **90** peleándose a 44 — con arte recortado que
nadie iba a ver. Bajados a 8 / 17 / 24 / 40, y el tier 2 de Gaara de 50 a 40 para que exista si lo
reclutas. Como el modo aporta multiplicadores y pasivas, **se compensó el `statsBase` de los cuatro
dividiéndolo por los multiplicadores de su propio modo**: el jefe pesa lo mismo que antes, pero ahora
parte de ese peso viene de la transformación en vez de números en crudo — el mismo reparto que se le
hizo al jugador en el punto 1.
Re-simulado: los nodos de jefe pasan de 80-93% a **77-92%** de victorias, dentro de la banda.
Hay un **test de invariante nuevo** que exige que todo jefe con modo llegue transformado a su
combate; el que ya existía solo miraba `characters.json` y por eso esto vivió tanto. Haku y Camino
Animal siguen sin modo a propósito: no hay arte para ellos, y el test se los salta.


**El final del combate (punto 12) — ver [13](./13-ui-mapa-y-combate.md)**

El cierre era un `Victory` de texto con un botón: el oro cambiaba en un panel de otra pantalla y el
objeto aparecía en la mochila sin que nadie lo dijera. Ganar no se celebraba en ningún sitio.

- [x] **`PanelRecompensas`** entre el rótulo y el botón, que es donde el ojo ya está: `+N Gold` y el
  objeto con su sprite. El objeto **solo sale si ha entrado de verdad en la mochila**: el del
  mini-jefe tiene su propia pantalla de recogida y anunciarlo aquí además sería contarlo dos veces.
  Viaja en el resumen del combate (`recompensas`) y no se lee del store, misma regla que
  `equipoAlEmpezar`: cuando la animación empieza, el store ya tiene el estado final.
- [x] **La XP no se enseña, y es una decisión tomada probándola.** Hubo una barra de XP en la tarjeta
  y un `+N XP` en el panel, y se quitaron los dos: con la economía de XP actual **casi cada combate
  sube un nivel**, así que la barra vivía siempre a punto de llenarse y el número no cambiaba
  ninguna decisión. Lo que se ve de la XP es su consecuencia — el cartel de subida de nivel y,
  detrás, la transformación.
- [x] ⚠️ De aquella barra salió un bug que conviene no repetir: `{progresoXp && <barra/>}` con
  `progresoXp === 0` **pinta un `0`**. En el primer combate de la run todos tienen 0 de XP, así que
  aparecía un cero suelto en la tarjeta sin explicación. En JSX un guard numérico con `&&` renderiza
  el número cuando vale 0.
- [x] 189 tests: que el resumen trae el oro y coincide con el que se suma, que la XP **no** viaja en
  él, y que el objeto del mini-jefe no se anuncia ahí.

**Sin hacer, a propósito**: cualquier barra de XP, ni dentro ni fuera del combate. Si algún día se
decide que la XP merece verse, el sitio es `FichaPersonaje`.


**Segunda tanda de playtest (sobre las tarjetas de personaje ya rehechas)**

- [x] **El nombre nunca se trunca ni se parte en dos líneas**: si no cabe entero se usa su versión
  corta. **Se mide, no se estima** (`NombreQueCabe`): el primer intento contaba caracteres contra un
  máximo fijo y falló en cuanto la misma ficha se usó en tres anchuras distintas — cabía en el hover
  del mapa y no en la de selección de personaje. Ahora se pregunta al DOM y solo se cambia en un
  sentido, porque volver al largo al ensanchar sería un bucle.
- [x] **El nombre del jutsu parte de línea** en vez de truncarse: llegan a 29 caracteres ("Super
  Beast Imitation Drawing") y son nombres propios, no hay forma de abreviarlos. La fila pasa a ser
  **tres columnas** (icono / nombre / ritmo) para que la espiral y los puntitos se centren contra un
  nombre de dos líneas, y **reserva la altura de dos líneas** para que las tarjetas de jutsu corto no
  se queden con un hueco abajo al estirarse la rejilla.
- [x] **Los paréntesis del nombre se cortan** ("Pain (Deva Path)" → "Pain") en todas las pantallas,
  desde `nombrePersonaje`. Los **dos puntos no**: "Pain: Animal Path" es el otro jefe del mismo arco.
- [x] **Estadísticas con abreviaturas y sin iconos** (ATT/DEF/SPE/HP). Con "⚔ Attack" y "❤ Max HP" la
  etiqueta no cabía en media columna, se partía en dos líneas y descuadraba la rejilla entera.
- [x] **La afinidad de chakra en pastilla del color de su naturaleza**, en vez de un emoji suelto.
  ⚠️ Las clases van escritas enteras (`bg-katon/15`…) y no compuestas (`bg-${tipo}/15`): Tailwind
  escanea el código como texto, así que una clase construida en tiempo de ejecución no llega al
  bundle y la pastilla saldría transparente.
- [x] **Los números de HP, centrados** bajo la barra: pegados a un extremo parecían el final de otra
  cosa en vez de la lectura de la barra entera.


**Añadir personaje y objeto: Kakashi y los cascabeles (punto 13) — ver [11](./11-progresion-y-arcos.md) y [28](./28-nodo-reclutar.md)**

El punto tenía dos intenciones: **contenido** (el arco 1 no tenía reclutables propios ni ningún
legendario) y **experimento** (cuánto cuesta parchear el juego con cosas nuevas).

- [x] **Kakashi Hatake**, primer legendario **jugable** — hasta ahora los legendarios eran solo jefes
  desbloqueables por logro. Raiton, `42/11/8/10`, Raikiri con carga rápida, **Sharingan a nivel 6** y
  **Mangekyō a 35** (los dos dentro de la run, y en ese orden por la ficción: en el País de las Olas
  todavía no tiene el Mangekyō).
- [x] **Los cascabeles** (`cascabeles`, equipable raro de 70): `first_attack_bonus` 0,6 +
  `first_hit_reduction` 0,35 — el intercambio de apertura, que es de lo que va la prueba de los
  cascabeles. Ninguna de las dos pasivas la usaba ningún otro objeto. La primera versión llevaba solo
  la ofensiva y daba +1,1 puntos en jefes contra los +8,3 del Sello de Chakra: demasiado poco para su
  precio.
- [x] **El experimento salió bien: fueron tres ficheros de datos.** Kakashi es legendario, así que el
  pergamino verde no lo ofrece nunca y su única puerta es el dorado — eso no hay que programarlo, sale
  de `RAREZAS_POR_PERGAMINO`. Y los invariantes que ya existían lo validaron solos, sin escribir un
  test para él: todo personaje tiene transformación, todo modo se desbloquea dentro de la run, nadie
  define su propio `ataqueBasico`, ningún objeto da estadísticas planas, y una pasiva con id
  inválido revienta en vez de ignorarse.
- [x] **Y de paso tapó un agujero que no se veía**: `personajesReclutablesIds` del arco 1 estaba
  vacío, así que en una **primera run** el pergamino dorado no tenía a nadie que ofrecer y degradaba
  siempre. El nodo y su sprite existían y el jugador no los veía hasta terminarse un arco entero.
- [x] ⚠️ **Lo que de verdad costó fue la MEDIDA, no los números** — está contado entero en
  [11](./11-progresion-y-arcos.md). Dos lecturas seguidas dieron conclusiones opuestas y las dos eran
  falsas: "gana los seis jefes al 100% él solo" (sesgo de la posición 1 más una media que arrastra a
  los mal emparejados de tipo) y luego un control de un solo personaje que colaba su propio
  emparejamiento. Lo que funciona es el **puesto** entre todos los candidatos a la posición 1, y con él
  Kakashi es 2.º-6.º de 15, nunca primero. Se llegó ahí bajándolo desde `45/12/9/11`, que sí barría.
- [x] **Consecuencia de diseño que no se buscó y que no hay que "arreglar"**: Kakashi es raiton y los
  dos jefes del arco 1 son suiton, así que el premio del pergamino no ayuda con el jefe que viene
  detrás — se cobra en los arcos 2 y 3, donde tres de los cuatro jefes son doton. Es una inversión, no
  un atajo.
- [x] 191 tests (eran 190). El nuevo fija la garantía que importa: **el arco 1 ofrece un desafío
  legendario sin ningún logro desbloqueado.** Y tres de los que ya había pasaron a no depender de un id
  concreto — con dos legendarios en la pool, `personajes[0].personajeId === 'gaara'` se había vuelto
  aleatorio, que es peor que estar en rojo.

**Enciclopedia (punto 10) — ver [32](./32-enciclopedia.md)**

Era deuda real, no un "ya lo pondremos": la descripción de cada jutsu, su potencia, el ritmo de carga,
qué hace cada transformación y la descripción narrativa de los objetos estaban **escritos en los JSON
y sin pintarse en ninguna pantalla**. Y la deuda crecía cada vez que se adelgazaba una ficha — el
punto 13 le añadió cuatro textos de golpe.

- [x] Pantalla propia (`pantalla: 'enciclopedia'`, icono 📖 en el menú del mapa) con cuatro secciones:
  Ninjas, Enemigos, Objetos y Chakra. Dos vistas y nunca las dos a la vez —rejilla o ficha—, el mismo
  patrón que la mochila.
- [x] **Solo enseña lo ya visto**, y esa era la única decisión que bloqueaba el código: las
  transformaciones se quitaron de las tarjetas a propósito porque son una sorpresa, así que listarlas
  todas habría deshecho media razón de ser del punto 4. Lo no visto sale en **silueta negra** con
  "???" y el mensaje de qué hacer para abrirlo — no oculto: la gracia de una Pokédex es ver lo que
  falta.
- [x] Registro de vistos en `useAchievementsStore` (clave propia de `localStorage`), porque es
  meta-progresión: en la run, un game over habría borrado la enciclopedia entera. Cuatro categorías, y
  los modos identificados por su índice (`naruto_1`) porque **un modo no tiene id propio** en los JSON.
- [x] `registrarVistos` es **idempotente y no toca el estado si no hay novedad**. No es cosmético: hay
  una llamada de red de seguridad dentro de `abrirEnciclopedia`, y sin eso cada apertura provocaría un
  `set` y un bucle de renders en quien esté suscrito. Tiene test propio.
- [x] **No se añadió `descripcion` a los 31 modos** — no lo tiene ninguno, y no hace falta: el texto se
  genera con `describirPasiva` y los multiplicadores, igual que en la pantalla de transformación.
- [x] ⚠️ **Bug destapado de camino: `FichaPersonaje` no encontraba a los enemigos comunes.** Llevaba su
  propia copia de la búsqueda del personaje base, que solo miraba `characters.json` y los jefes, así
  que devolvía `null` para un genin rival y la tarjeta no se pintaba. Unificada con
  `encontrarBaseDeLuchador` en `datosDeLuchador.js`. Mismo problema que tuvo `nombrePersonaje`: la
  tercera vez que aparece una búsqueda duplicada ya no es casualidad.
- [x] 211 tests (eran 191): el registro de vistos entero (persistencia, deduplicación, idempotencia,
  carga de una versión anterior sin una categoría) y sus ganchos en el juego, incluido que **apunta al
  enemigo aunque se pierda el combate**. Más dos invariantes de datos que es lo único automatizable de
  una pantalla sin tests de React: todo luchador de los tres JSON se puede construir y tiene jutsu con
  nombre, potencia y carga finita, y ningún luchador repite el nombre de un modo — si los repitiera, el
  índice reconstruido por nombre daría siempre el primero y la segunda transformación no se
  desbloquearía jamás.

**Lavado de cara: el kit de piezas compartidas (incluye el punto 5c, la pantalla de logros) — ver [33](./33-direccion-visual.md)**

Salió de comparar las dos maquetas (`layoutPantallaLogros.png` y la de enciclopedia) con lo que había:
ocho pantallas que compartían paleta pero **ningún lenguaje** — bordes de tres grosores, cabeceras con
tres jerarquías, y en ningún sitio las esquinas en corchete de las maquetas.

- [x] **Seis piezas, no dos pantallas rediseñadas**: `PanelMarco` (con las esquinas en corchete),
  `CabeceraPantalla`, `FilaPestanas` (con contador por pestaña), `IconoEnmarcado`, `TituloBloque` /
  `CampoDato` y los dos botones. En `components/common/PiezasUI.jsx`. Rediseñar pantalla a pantalla
  habría producido otros ocho dialectos.
- [x] ⚠️ **Colores semánticos, que era el arreglo previo obligatorio**: la paleta tenía colores de
  elemento y ninguno de significado, así que el verde de "desbloqueado / victoria / eficaz" era
  `fuuton` —el chakra de viento— y el oro de "legendario" era `raiton`. Se rompía de verdad en la tabla
  de eficacias, que pinta los cinco elementos y a la vez tiene que decir bueno/malo. Nuevos
  `--color-exito`, `--color-oro` y `--color-marco`.
- [x] Aplicado a **Logros** y **Enciclopedia**, las dos que tienen maqueta. En Logros, las
  **categorías por acto se calculan** de los JSON de arco en vez de añadir un campo `categoria` a los
  logros (dos copias del mismo dato se desincronizan), y el **icono de cada logro sale de su
  recompensa** en vez de arte que no existe. En la Enciclopedia, **filtro por naturaleza de chakra**.
- [x] **Fuera a propósito** (está razonado en el doc 33): el raíl de recompensas globales —que es el
  punto 5b, no diseño—, el shell de navegación lateral/inferior, y los campos "Aldea"/"Afiliación",
  que serían 29 entradas de contenido nuevo.
- [x] **Logros y Enciclopedia se abren como ventana sobre el mapa** (`VentanaModal`), estilo Pokelike:
  barra de título con la X en la esquina, el mapa visible detrás y **scroll propio del cuerpo** en vez
  del de la página, así que las pestañas no se van hacia arriba al bajar. Se cierra con la X o con
  Escape, y **no** al pulsar fuera: es una ventana grande con muchos clics dentro, y un clic perdido en
  el borde no debe tirar por tierra dónde estabas. La barra de scroll va dibujada (`.scroll-pixel`).
- [x] **Botón de cerrar propio** (`BotonCerrar`): caja crema con borde grueso y un bloque de sombra
  **opaco** detrás —nunca un `box-shadow` difuso, que es lo único que no puede existir en una rejilla de
  píxeles— que se separa al hacer hover y se hunde al pulsar. La X son dos barras giradas y no el
  carácter `✕`, que en `PressStart2P` sale fino al lado de un borde de 2 px.
- [x] **Renombradas de cara al jugador**: Achievements → **Missions**, Encyclopedia → **Bingo Book** (el
  registro de ninjas fichados de la serie). Los ids internos no se tocan: son claves lógicas, no texto.
- [x] **El tooltip vuelve al marco crema** y se extrae a `EtiquetaFlotante`, compartida por el hover de
  nodo del mapa y por los cuatro botones del menú vertical (a la izquierda, porque el menú vive pegado al
  borde derecho). El crema aquí no es un despiste del kit: una anotación que aparece **encima** de otra
  cosa —a veces encima del propio lienzo— necesita despegarse de lo que tiene debajo, y con el borde fino
  en color de marco se perdía. Sustituye de paso al `title` del navegador en el menú, que tardaba un
  segundo en salir y no se parecía al juego.
- [x] **Las tres piezas que quedaban sueltas**: el **lienzo del mapa** (el elemento más grande de la
  pantalla y el único sin marco — no puede ser un `PanelMarco` porque mide exactamente `ANCHO × escala` y
  un borde real le comería ancho útil, así que su marco es un `box-shadow` y los corchetes salen de
  `AdornoMarco`, extraído para no duplicarlos), **`EventScreen`** (solo el kit: su rediseño es el punto 6
  y necesita documento MVP antes) y **los dos toasts**, que eran lo último con forma de notificación web
  — el color pasa al borde y al texto en vez de al fondo.
- [x] **La ficha de personaje y el combate.** `FichaPersonaje` —la tarjeta de personaje de TODO el juego:
  hover del mapa, las tres cartas de reclutar, el desafío legendario, la selección inicial y el Bingo
  Book— pasa a `PanelMarco` con esquinas. Y en combate, las dos cajas de bando llevan corchetes y las
  tarjetas de luchador de dentro no: ⚠️ **los corchetes marcan el contenedor, no cada cosa que hay
  dentro**. Era la pantalla que daba miedo por sobrecarga y resultó que el problema no era el marco sino
  anidarlo (`esquinas={false}` en `PanelMarco`).
- [x] ⚠️ **Los títulos de panel pasan de rojo a crema.** `TituloBloque` gana dos jerarquías: `panel`
  (crema) para el título DE una caja y `seccion` (rojo) para una etiqueta DENTRO de una tarjeta que ya
  tiene título, que es el único uso que le dan las maquetas al rojo en versalitas. Con todo en rojo el
  mapa tenía **cuatro rojos compitiendo** y, peor, el rojo **ya significa algo** en esta paleta: es el
  mini-jefe y la derrota. Un título de panel no es una alarma.
- [x] **Los tres paneles del mapa y el menú.** Equipo y objetos estaban en crema y la rueda de chakra
  en oscuro; los tres pasan a `PanelMarco`, así que el mapa comparte por fin lenguaje con las ventanas.
  Y el menú de iconos pasa de horizontal a **vertical** estilo Pokelike, siguiendo
  `LayoutMenuVertical.png`. ⚠️ La columna es **una imagen** con cuatro botones transparentes encima, no
  cuatro sprites: esa hoja no es una hoja de sprites sino un menú ya terminado, y todo intento de
  recortar los iconos se llevaba el marco o agujereaba el sombreado (de paso: la columna **no está
  centrada** en la hoja, así que un margen lateral simétrico no vale). El precio es que los huecos van
  pintados — añadir una entrada exige redibujar la columna.
- [x] **Las ocho pantallas ya llevan el kit.** Al aplicarlo salió el criterio de forma, que vale para la
  siguiente que se añada: **ventana sobre el mapa** si es una consulta o una decisión corta dentro de un
  nodo (Missions, Bingo Book, Mochila, Recompensa de mini-jefe); **pantalla completa** si es un momento
  propio de la run (Combate, Tienda, Reclutar, Game Over, Selección). Dos consecuencias: la mochila
  **dejó de cerrarse al tocar fuera** (dentro se eligen personajes con varios clics y uno escapado al
  borde la cerraba a mitad de la decisión) y en la recompensa de mini-jefe **cerrar es saltar, no
  coger** — cerrar una ventana nunca debe regalar nada.
- [x] **Tanda de ajuste tras verlo en pantalla**: el panel de recompensas del combate era un
  `inline-flex` y el botón "Continue" también es inline, así que salían **en la misma línea** y el premio
  parecía otro botón; ahora es un panel de bloque centrado con el oro y el objeto enmarcados. La
  recompensa de mini-jefe **pierde la X** (sus dos salidas ya son botones, y una X obliga a decidir qué
  hace cerrar: si coge, regala un objeto; si salta, Escape lo tira sin avisar) y los pone **en fila**. Y
  en la tienda, las tarjetas pasan de rejilla de 3 columnas a `flex justify-center`, porque al comprar
  una las restantes se agarraban a las columnas 1 y 2 y el escaparate se iba a la izquierda.
- [x] **Las recompensas de una cadena de entrenador se acumulan y salen una sola vez, al final**
  (`recompensasAcumuladas` en `cadenaEnemigos`). Salían en cada eslabón con lo de ese combate: tres
  carteles de 1,6 s y ninguno decía el total. **El comportamiento venía de antes** —el comentario del
  código lo declaraba intencionado— y lo que lo destapó fue convertir la recompensa en un panel con
  marco: mientras era una línea inline no se notaba. `recompensas.objeto` pasa a `objetos` (lista):
  hoy ningún enemigo encadenado lleva objeto, pero con un campo singular el segundo se habría perdido
  en silencio el día que lo lleve. 215 tests (eran 211).
- [x] ⚠️ **`tono="hueco"` no vale para "deshabilitado"**: las tarjetas de tienda que no podías pagar
  usaban `hueco` más `opacity-60` y sobre el fondo de Konoha salían casi transparentes — no se leía ni
  el nombre. Que no puedas comprar algo no es motivo para no poder leerlo. `hueco` queda para contenido
  que **no existe todavía** (una entrada sin descubrir), y lo deshabilitado se dice con el precio en
  rojo y el botón apagado.
- [x] **15 usos semánticos de `fuuton`/`raiton` sustituidos** por `exito`/`oro`: barras de HP, rareza,
  victoria, curación, subida de nivel, pasiva que salta, transformación, pergamino del mapa y pastilla
  de consumible. ⚠️ **No se tocó `colorDelDano`**: ahí los colores de elemento son una **escala de
  calor** deliberada y documentada (katon = golpe eficaz, suiton = bloqueado), no un semáforo. Tampoco
  la barra de carga del jutsu (juiciness afinada a ojo) ni el registro de texto, que solo existe en
  desarrollo.

**Pantalla de ajustes (punto 14) — ver [34](./34-ajustes.md)**

No valía por lo que añade sino por **lo que retira**: tres cosas a medias se cierran aquí.

- [x] `SettingsScreen` como ventana sobre el mapa y `useSettingsStore` con su propia clave de
  `localStorage` (ni en `useGameStore`, que muere con la run, ni en `useAchievementsStore`, que es
  progresión y no preferencias: mezclarlas haría que "reiniciar la meta-progresión" te cambiara el tema).
- [x] **El engranaje del menú abre por fin lo que dibuja.** Hacía de pantalla completa porque no había
  pantalla de ajustes; ahora pantalla completa vive dentro de ella.
- [x] **Fuera el botón `[DEV] Reset progress`** y su "quitar antes de publicar", que arrastraba desde que
  existe el sistema de logros. Es una opción de verdad, con confirmación y donde un jugador la buscaría.
- [x] **Modo claro / oscuro**, que era la decisión aplazada sin sitio donde caer. Un bloque
  `[data-tema='claro']` en `index.css` redefine los tokens y cambia las ocho pantallas sin tocar un
  componente, porque las utilidades de Tailwind v4 compilan a `var()`. ⚠️ Desde que hay dos temas los
  nombres significan el **rol**: `tinta-*` es superficie y `pergamino-*` contenido, así que en modo claro
  `pergamino-100` es tinta oscura. Se conservaron los nombres en vez de renombrar ~240 usos. **Las
  correcciones que hicieron falta después de verlo funcionando están en el bloque siguiente**, y una de
  ellas es de fondo.
- [x] ⚠️ **Lo que hubo que limpiar antes de que el tema fuera posible**, porque invertir los tokens
  destapa todo sitio con un fondo fijo: un **bug real que ya se veía** (`COLOR_RAREZA.comun` era crema
  sobre crema, así que la rareza era casi invisible en la ficha de cualquier objeto común), los **últimos
  tres restos de la paleta anterior al kit** (las dos fichas de `ItemHoverCard` y el tooltip de pasiva del
  combate) y un token nuevo **`sobre-acento`**, igual en los dos temas, para el texto que va encima de un
  color vivo — sin él, el botón RECRUIT y la X de cerrar se volvían claro sobre claro.
- [x] **Velocidad de animación ×1 / ×2 / instantánea con un solo factor para los dos relojes.** Las
  duraciones estaban **duplicadas** —13 reglas `animation:` en `index.css` y 9 constantes `MS_*` en JS, con
  un comentario que pedía acordarse de cambiar las dos—; ahora las de CSS son
  `calc(320ms * var(--factor-animacion, 1))` y las de JS se multiplican por el mismo número, así que no
  pueden separarse.
- [x] ⚠️ **"Instantánea" se DERIVA, no se fuerza.** El primer intento saltaba al final con un `setState`
  dentro de un efecto y `react-hooks/set-state-in-effect` lo rechazó: es la misma lección que ya estaba
  apuntada para el reset de estado al cambiar de combate — lo que depende de otro valor se calcula al
  renderizar, no se guarda.
- [x] **La sección de sonido no se pinta** hasta que exista el sistema (backlog): un interruptor que no
  hace nada es peor que no tenerlo, misma regla que dejó fuera el raíl del 5b. Y quedan fuera, razonados,
  el idioma (exigiría construir i18n), los efectos de clima (no existen), los atajos de teclado (solo hay
  Escape) y saltar la confirmación de reiniciar run.
- [x] 225 tests (eran 215): los diez del store de ajustes.

**Segundo pase del modo claro, y el contorno de la fuente de Naruto — ver [34](./34-ajustes.md) y [33](./33-direccion-visual.md)**

El tema claro se entregó "funcionando" y al jugarlo se veía **plano en las ocho pantallas**. La causa no
era ningún color suelto: era haber tratado como valores unos tokens que son relaciones.

- [x] ⚠️ **La rampa de superficies conserva su DIRECCIÓN, no sus valores.** `tinta-950 → 900 → 800` no son
  tres oscuros: son **hundido → panel → realzado**. El primer pase invirtió los tres uno a uno, y eso no le
  da la vuelta al tema sino a las relaciones — el panel salía más oscuro que la página (se hundía en ella
  en vez de despegarse), `tono="hueco"` más claro que el panel que lo contiene y `hover:bg-tinta-800`
  oscurecía. **Se leía como "en claro los bordes no resaltan", y el borde no tenía nada que ver: lo que no
  separaba era la superficie.** La regla que queda: preguntarse si un token es un valor o una relación.
- [x] **El marco tampoco se invierte**: es siempre del lado opuesto a la superficie, así que `--color-marco`
  **no aparece** en el bloque de modo claro. Un único `#4D463B` se lee como línea que aclara sobre tinta y
  como línea oscura sobre pergamino. Aclararlo a un tostado dejaba un tema sin bordes.
- [x] **`.escena-oscura`: lo que se pinta encima de un DIBUJO no sigue al tema.** El lienzo del mapa (el
  fondo del nodo salía como un disco crema y las líneas de camino en tinta sobre roca oscura), la columna
  del menú vertical (el realce del hover tiene que aclarar el dibujo) y la pantalla de transformación (es
  espectáculo, y su destello ya iba en un claro fijo). Se resuelve **redefiniendo los tokens en ese
  subárbol**, no cambiando una docena de clases a colores fijos.
- [x] **Los ocho bordes que no eran `marco`**, escritos a mano con un `pergamino-*` a poca opacidad de antes
  de que el token existiera: el botón `sobreFondo` (el SKIP de reclutar y el LEAVE de la tienda), las barras
  de HP y de jutsu, la sombra del sprite en combate, la pastilla de tipo neutra y el registro de desarrollo.
  Regla nueva: **`pergamino-*` es para texto y glifos; un borde es `marco` o un color de acento.**
- [x] 🐛 **`AdornoMarco` no abrazaba al mapa**: sus piezas son `absolute` y el contenedor de fuera no es
  `relative`, así que se anclaban al div raíz y los cuatro corchetes se pintaban en las esquinas de la
  **pantalla**. Llevaba así desde que se compuso a mano.
- [x] **Contorno en todo título en `font-naruto`**, como el logo de la serie, y **dentro de la propia clase**
  para que lo tenga cualquier título nuevo sin acordarse. ⚠️ **El contorno es el negativo del RELLENO, no
  del fondo**: por defecto sigue al tema (`tinta-950`, que es siempre el lado opuesto a `pergamino-*`) y los
  rellenos fijos —oro, verde, rojo, crema— llevan `.contorno-fijo`. Con `text-shadow` a 8 direcciones y no
  con `-webkit-text-stroke`, que sin `paint-order` adelgaza la letra en vez de rodearla. Sustituye a los
  `drop-shadow-[...]` puestos a mano, que eran tres valores distintos entre cinco títulos.
- [x] **Token `sobre-sello`** (crema constante), la pareja de `sobre-acento`: el rojo de sello es el único
  acento **oscuro**, y encima de él el texto tiene que ser crema fijo. Con `pergamino-100` la barra de
  título de las ventanas, el botón principal, el BUY de la tienda y los tres botones de la mochila salían en
  modo claro con **tinta oscura sobre granate**.
- [x] Fuera el rótulo **"Rewards"** de la tarjeta de recompensas: va debajo de un "Victory" enorme y sus dos
  líneas son "+N Gold" y el nombre de un objeto. Un `TituloBloque` sirve para distinguir bloques dentro de
  una caja con varios, y ahí no hay más que uno.

### Playtest 2026-08-14 — triaje y arreglos

El primer playtest desde que cambiaron el balance de los jefes, el roster y las ocho pantallas. Seis
hallazgos, **cuatro de ellos bugs de verdad** (dos confirmados leyendo el código, no por sensación).
El triaje entra por delante del 5a, como dice el [31](./31-plan-siguientes-pasos.md).

- [x] 🐛 **El equipo se reordenaba solo.** Se veía al curar al equipo tras un jefe, pero la curación no
  tenía la culpa: `_aplicarDerrota` hacía `[...vivos, ...caidos]` y ese reorden era **permanente**. El
  jugador colocaba su equipo arrastrando, se le moría alguien y veinte minutos después se encontraba
  otro orden que no había elegido. **Y no hacía ninguna falta**: `obtenerPersonajeActivo` ya es
  `equipo.find((p) => !p.derrotado)`, o sea que "posición 1" nunca quiso decir índice 0, quiso decir
  *el primero en pie*. Se borra el reorden. Dos tests nuevos, uno por cada mitad de la frase anterior.
- [x] 🐛 **El pergamino dorado podía ser un peaje obligatorio.** Dos vetos nuevos, los dos porque el
  dorado no es una elección sino un **combate a nivel fijo**: nunca antes del piso del mini-jefe (el
  mismo combate está al 52% en el piso 3 y al 87% en el 6) y **nunca si es el único nodo de su piso**
  — `nodosPorPiso.min` es 1, así que eso podía pasar y el jugador lo sufrió. Ver
  [28](./28-nodo-reclutar.md). Efecto medido: los mapas con dorado bajan del 20% al 13,9% en el arco 1,
  y lo que se ha quitado son justo los casos injustos.
- [x] 🐛 **Los ataques básicos eran negligibles** ("-1, -3 de daño y luego el jutsu hace muchísimo
  más"). La causa no era la potencia del jutsu sino que **la defensa se restaba plana**, y una resta
  plana no es neutral entre golpes de tamaños distintos: el mismo escudo se comía el **59% de un
  básico y el 16% de un jutsu**, así que una diferencia de 3,6× en los datos salía a 7,4× en pantalla y
  el básico caía al suelo de 1. Ahora la defensa se resta **en proporción a la potencia del ataque**.
  Ver [09](./09-motor-engine.md).
  - **Medido con `simular-combates.mjs` antes y después**, que para eso es determinista: los jefes en
    cadena pasan de 80/77/76/88/91/84% a **85/83/79/87/93/84%** —dentro del objetivo—, los comunes se
    quedan igual (96-99%), el reparto del poder no se mueve (≈50/25/25) y **desaparece uno de los dos
    combates que llegaban al tope de turnos**. No hizo falta recalibrar nada.
  - ⚠️ El test que saltó era bueno: pedía `jutsu > basico` y eso **también lo cumplía la versión rota**.
    Ahora fija la **proporción** contra los `danoBase` declarados, que es lo que estaba mal, y hay un
    segundo test para la única esquina donde los dos empatan (cuando la defensa se traga el ataque
    entero, los dos caen al mínimo de 1 — contra ese rival la respuesta del juego es cambiar de
    personaje, no pegar más).
- [x] **Equipar arrastrando el objeto encima del personaje.** El mapa ya dejaba arrastrar objetos y no
  dejaba equiparlos así. Ver [13](./13-ui-mapa-y-combate.md).
- [x] **El cursor de escritura en la rueda de chakra**: los emojis viven en un `foreignObject`, o sea
  HTML de verdad dentro del SVG, así que el navegador los trataba como un párrafo. `pointerEvents: none`.
- [x] `simular-combates.mjs` medía el desafío legendario en el **piso 3**, que desde el veto ya no
  existe: pasa a medir el piso del mini-jefe. Un simulador que mide un caso que el generador no produce
  es exactamente el fallo de las pasivas sin normalizar, otra vez.

- [x] 🐛 **La transformación no se veía si pulsabas rápido.** El desbloqueo se celebra con retraso
  —primero el cartel de subida de nivel, `MS_CELEBRAR_NIVEL`— pero el bloque de cierre del combate se
  pintaba en cuanto terminaba la pelea, así que durante ese segundo y medio había un botón de
  "Continue" en pantalla: quien lo pulsaba se iba del combate y **no veía nunca su transformación**.
  Ahora la salida no se pinta mientras quede alguna por enseñar (la cola entera, no solo la primera:
  dos personajes pueden cruzar su umbral en la misma victoria). Es un fallo de los que solo pasan "a
  veces" porque dependen de lo deprisa que pulse el jugador — de ahí que no saliera en ningún test.
- [x] **Texto ilegible en modo claro sobre el fondo del juego** ("65 gold available", el reclamo del
  mercader). No era un color mal elegido sino **apagar texto con alpha sobre una ilustración**: sin una
  superficie con la que mezclarse, un 45-60% de tinta es un gris lavado. Ocho textos sueltos con cuatro
  opacidades distintas, todos de cuando el fondo era oscuro. Ver [33](./33-direccion-visual.md).

- [x] **La cadena de entrenador cantaba "Victory" en cada eslabón** (y un "Next up..." debajo), tres
  veces por nodo y cada cartel tapado 0,7 s después por el rival siguiente. Una cadena es **UN combate
  con relevos**: el cierre es el del nodo, no el de cada rival. De paso, el respiro entre eslabones era
  un **1600 ms fijo** —lo único de la pantalla que no obedecía al ajuste de velocidad de animación— y
  ahora sigue el factor como todo lo demás. ⚠️ Acortarlo obligó a que el temporizador esperase también a
  la transformación y al cartel de nivel: sin eso se reintroducía el bug de arriba dentro de la cadena.
- [x] **"Victory" ya no va en verde.** `exito` es un color **semántico** ("esto es bueno",
  "desbloqueado", "eficaz") y como rótulo gigante era lo único de la pantalla que no parecía del mismo
  juego. Pasa a `pergamino-100`, que sigue al tema. "Defeat" se queda en rojo de sello, que sí es un
  color propio de la paleta.
- [x] 🐛 **Arrastrar un objeto sobre alguien que ya llevaba otro no preguntaba nada.** La mochila lo
  preguntaba desde que existe; al abrir la segunda puerta para equipar se coló sin la guarda. **Las
  guardas van con la acción, no con el camino** — cada camino nuevo hacia una acción vieja hay que
  mirarlo con la lista de guardas en la mano. Misma ventana y mismo texto que la mochila.

**Lo que queda de esta tanda, y no es código:**

- [ ] **Pictogramas propios para los 5 tipos de chakra**, en vez de los emojis de la rueda. Va con los
  cuatro iconos del menú vertical, en "Pendiente de arte" — de una tacada, que es la única forma de que
  salgan del mismo estilo.
- [ ] **El mapa se ve pequeño** comparado con Pokelike: es el **punto 9**, que ya lo tenía anotado.

**Eventos (punto 6) — ver [35](./35-diseño-de-eventos.md)**

Era el único punto **sin documento MVP**, y por eso llevaba meses sin poder planificarse. El documento se
escribió con libertad creativa delegada por el usuario; lo único que se consultó antes de tocar nada fue
meter azar de verdad.

- [x] **El diagnóstico cambió el punto entero: la pantalla no era el problema.** El lavado de cara ya
  había pasado por `EventScreen`, así que "es la única que parece una web" estaba caducado. Lo que había
  eran **12 eventos donde 4 de las 24 opciones no hacían literalmente nada** y donde la pista decía
  exactamente lo que te llevabas: un evento no era una decisión, era **un regalo con dos envoltorios**.
- [x] **Regla nueva: un evento es un intercambio, no un regalo.** Toda opción cuesta algo. Con test: si
  una elección de primer nivel es `ninguno`, falla.
- [x] **15 eventos, 5 por arco, cada uno pegado a la ficción del suyo** (la niebla de Zabuza, el Bosque
  de la Muerte, los escombros y la voz de Pain). Los 8 que ya existían conservan título e `id`; lo que
  cambia es que ahora cuestan algo.
- [x] **Azar de verdad en 9 de los 15**, con las **probabilidades a la vista antes de elegir**: una
  apuesta a ciegas no es una decisión, es una trampa. Lo que se esconde es el resultado del dado, no las
  reglas.
- [x] ⚠️ **Un evento NUNCA mata** (suelo de 1 HP) y **su daño no pasa del 25%** de la vida. Las dos con
  test. Es la condición que hizo aceptable el azar: perder una run por un dado, en runs cortas, no es
  tensión sino un castigo por jugar.
- [x] **Pantalla de resultado**: el evento ya no se resuelve en silencio. Con tiradas, devolver al
  jugador al mapa le escondía justo lo que acababa de apostar. Se lleva por delante el toast de curación
  del mapa, que desde entonces contaba lo mismo dos veces y encima después.
- [x] **Dos tipos de efecto nuevos que son contenedores** (`azar` y `varios`) más `perderHpEquipo`, y
  `_aplicarEfectoDeEvento` pasa a ser **recursivo**: una rama de una tirada es un efecto, una parte de un
  `varios` es un efecto, y una rama puede llevar un `varios` dentro. Con un `switch` plano habría hecho
  falta un tipo por combinación.
- [x] **El store devuelve datos y la pantalla escribe el texto** (`describirResultado`), separado de la
  promesa que se lee antes de elegir (`generarPista`): una es futuro y la otra pasado.
- [x] 🐛 **Primera versión de los números, corregida tras verla**: *"la opción sin azar es demasiado
  potente, apenas vale la pena la otra"*. Medido: **5 de las 9 apuestas no compensaban**, y la peor
  —*Forbidden Scroll Merchant*— estaba a **×0,08** porque el fallo cobraba **tres veces** (perdías el
  objeto, el dinero y vida). ⚠️ Regla nueva, con test: **una apuesta tiene que pagar una prima sobre la
  opción segura de su propio evento** (≥ ×1,2; hoy están entre ×1,32 y ×2,19), porque la varianza es en
  sí misma un coste y una apuesta que solo empata no la coge nadie. Y dos lecciones de método: el error
  no estaba en la probabilidad sino en la **estructura** del fallo, y en un caso lo que desequilibraba
  era la **opción segura** (comprar a ciegas por 30 algo que vale 55 de media ya era un chollo).
- [x] 242 tests (eran 230): 6 de resolución y 6 de invariantes de los datos.

## Próximos pasos (en orden sugerido)

> 📋 **El plan de trabajo de estos puntos —fases, verificación y las decisiones que hacen falta antes
> de tocar código— está en [31](./31-plan-siguientes-pasos.md).** Esta sección se queda como el
> enunciado de cada punto; el cómo vive allí.
>
> **La numeración está congelada a propósito.** Hay referencias a "punto N del roadmap" repartidas por
> comentarios de código y otros documentos, y ya se han desincronizado dos veces al renumerar. Los
> huecos (1-4, 8, 10-14) son puntos hechos que se han movido a "Hecho" **conservando su número en el
> título**, no errores de numeración. Un punto nuevo coge el siguiente número libre y nunca uno de los
> huecos.

### Por dónde seguir

**1.º — el 7 (playtest), y no como formalidad.** Es lo único de esta lista que no puedo hacer yo, y
nada de lo demás lo sustituye: las tres últimas tandas de mejoras salieron enteras de partidas reales,
no de la lista. Desde el último playtest han cambiado el balance de los jefes, el roster (Kakashi), la
frecuencia y rareza de los reclutas, el final del combate y **las ocho pantallas del juego**. Cualquier
punto que se elija sin haber jugado se elige a ciegas. Los hallazgos van al roadmap con la plantilla del
[31](./31-plan-siguientes-pasos.md) y su triaje entra por delante de cualquier punto empezado.

**2.º — el 5a (contenido de logros).** La pantalla ya está hecha y en estilo; lo que le falta no es
diseño, es **material que enseñar**: hay 7 logros y su documento MVP está escrito para 38. Es también
lo que más rendimiento le saca a lo ya construido, porque el registro de vistos del Bingo Book ya metió
contadores persistidos en `useAchievementsStore`, que es exactamente donde 5a necesita los suyos.

**3.º — el 9 (columna central).** Cosmético y acotado; buen relleno cuando quede medio hueco. Va con la
tanda de arte pendiente (iconos de chakra y del menú vertical), que es lo único que le queda a la
interfaz por depender de algo externo.

*(El 6 —eventos— está hecho: ver [35](./35-diseño-de-eventos.md).)*

**Lo más grande que le falta al MVP y no es un punto de esta lista: el sonido.** Está en el backlog
porque no es un retoque de pantalla sino un sistema entero (assets, precarga, mezcla, volumen). Es, con
diferencia, lo que más notaría el jugador ahora que lo visual está resuelto.

**De la interfaz solo queda una cosa que espere a algo externo**: los **cuatro sprites del menú vertical**
(ver "Pendiente de arte" — su etiqueta flotante ya está hecha). El modo claro/oscuro ya está (punto 14) y
el rediseño de fondo de eventos es el 6.

---

5. **Interfaz de logros** — (MVP en [25](./25-diseño-pantalla-logros.md)). ⚠️ **Partido en tres, y solo
   la pantalla está hecha.** El documento está escrito para un juego que todavía no existe: pide 38
   logros, categorías, recompensas de oro y una barra de hitos permanentes, y hoy hay **7 logros**, dos
   tipos de condición y dos de recompensa, las dos de desbloqueo.
   - **5a — contenido y condiciones** (*lo siguiente a hacer*): más logros, y los tipos de condición que
     necesitan **contadores acumulados entre runs** (combates ganados, reclutas, oro total). Sin esto la
     pantalla es una interfaz de meta-progresión con siete tarjetas. Las **categorías por acto NO hacen
     falta como campo**: se calculan de los JSON de arco, ya está hecho.
   - **5b — recompensas numéricas permanentes** (+% oro, +% XP, +1 hueco de inventario). **Decidido:
     fuera del MVP.** Mueven la curva de niveles que vigilan los invariantes de arco de
     `leveling.test.js`, y el raíl de la maqueta no se pinta hasta que se decida — pintar premios que no
     existen es peor que no tenerlos.
   - **5c — la pantalla**: hecha (ver "Hecho"), incluidas las pestañas por acto con su contador y el
     icono de cada logro sacado de su recompensa.

~~6. **Interfaz de eventos**~~ — **HECHO**, ver [35](./35-diseño-de-eventos.md) y la sección "Hecho".
   El diagnóstico dio la vuelta al punto: la pantalla ya estaba en estilo y lo que fallaba era el
   **contenido**. La pregunta de diseño de juego que lo bloqueaba está contestada: la pista **sigue a la
   vista**, incluidas las probabilidades — lo que se esconde es el resultado del dado, no las reglas.

7. **Playtest jugando** — la recalibración numérica está hecha (punto 1 fase 4, con el simulador contra
    los datos rediseñados). Lo que queda es lo que un script no puede medir: jugar runs enteras y ver
    qué se siente mal. Lista de sospechosos, que es para mirar activamente y no solo "jugar a ver":
    - Los combates normales se ganan al 94-99%. Los jefes se miden con el equipo de 3 en cadena, que es
      como se pelean, y llegando al mini-jefe con el HP que deje el camino: mini-jefes al 80-93% y jefes
      finales al 82-88%. El nodo más justo es Haku (80%), y cuesta ~2 de los 3 personajes.
    - Los combates duran ~4,5 turnos, tan poco que el jutsu apenas sale una vez
      (ver [29](./29-sistema-de-jutsus-automaticos.md)). Con combates tan cortos **cargar lento castiga
      más de lo que dice la media**: un jefe con `T`=4 se come tres básicos flojos antes de su golpe
      gordo y la pelea ya se acabó. Los perfiles de carga mueven la dificultad real, no son sabor.
    - El simulador da la run **promedio**: usa la XP esperada de cada piso, no un sorteo. Un camino real
      con dos tiendas seguidas llega al mini-jefe bastante más flojo, y eso solo se ve jugando.
    - En el arco 1 se empieza con **un solo personaje** y el equipo se completa reclutando, pero el
      simulador da por hecho un trío desde el principio. Zabuza es el jefe con menos margen y puede ser
      el que peor se sienta.
    - **Kakashi, nuevo**: en el arco 1 el pergamino dorado ya sale en la primera run y es él. Ese combate
      se gana el **52% en el piso 3 y el 87% en el 6**. ¿Se siente como una apuesta justa? ¿Y compensa el
      premio, sabiendo que los dos jefes del arco 1 son suiton y él raiton — o sea que no ayuda con
      Zabuza sino con los arcos 2 y 3?
    - El salto de dificultad cuando un personaje de banquillo entra en una ronda encadenada contra un
      jefe con la barra de jutsu ya cargada (la conserva a propósito, ver [11](./11-progresion-y-arcos.md)).
    - Y ahora también **las ocho pantallas rediseñadas en una partida entera**, no en capturas: si el
      mapa en oscuro resulta lúgubre, eso decide cuánta prisa tiene el modo claro.

9. **Diseño de la columna central** — Con unos nodos más grandes la columna central puede volver a su
   tamaño anterior, manteniendo las proporciones y ajustándose a la pantalla. El sprite de la columna
   tiene que ser más sencillo y más representativo del arco actual. Y el nombre del arco debería llevar
   ese estilo tan característico de Naruto: fuente negra con reborde blanco.
   *(Del punto, ya hecho: el lienzo del mapa lleva el marco del kit con sus esquinas en corchete y se le
   quitó el redondeo — ver [33](./33-direccion-visual.md). Lo de arriba sigue pendiente.)*

### Pendiente de arte

Cosas que no están hechas por falta de dibujo, no por falta de código. Van juntas aquí y no dentro
del punto que las dejó a medias, porque los puntos terminados se marcan `[x]` y nadie vuelve a
leerlos buscando trabajo.

- **El menú vertical no tiene sprites propios de icono.** Usa la maqueta entera
  (`assets/menu/columna-menu.png`) con cuatro botones transparentes encima, porque esa hoja es un menú
  ya dibujado —marco, huecos e iconos juntos— y recortarla se lleva el marco o agujerea el sombreado.
  **Lo que hace falta**: cuatro PNG en `src/assets/menu/` (pergamino, libro, engranaje, torii) en un
  lienzo común y con fondo transparente. Lo que se gana con ellos:
  - el marco de la columna pasa a CSS, así que el menú deja de depender de que haya **exactamente
    cuatro** entradas (hoy los huecos van pintados: añadir una exige redibujar la hoja);
  - el hover puede realzar **el icono** en vez de su hueco, que es lo que se realza ahora.
  La etiqueta flotante de cada botón **ya está hecha** (`EtiquetaFlotante`, a la izquierda porque el menú
  vive pegado al borde derecho): no depende de los sprites y no hay que volver a ella.
  Y el reparto de iconos deja de ser un apaño en el **punto 14**: el engranaje pasa a ser Ajustes —que es
  lo que la maqueta dibujó— y pantalla completa se muda dentro de esa pantalla.
- **Los 5 tipos de chakra se dibujan con emoji.** La rueda del mapa (`RuedaChakra`) y las pastillas de
  tipo usan 🔥💨⚡🪨💧, que es lo único de la interfaz que no está dibujado — se ve sobre todo al lado de
  los sprites, que sí lo están. **Lo que hace falta**: cinco PNG en un lienzo común, en el mismo estilo
  que los iconos de nodo. Van **con los cuatro del menú vertical, de una tacada**: hacerlos por
  separado es la forma segura de que salgan de dos estilos distintos. Salió del playtest del
  2026-08-14; el cursor de escritura que los delataba ya está arreglado, que era la mitad de código.
- **Sai y Yamato no tienen sprite propio.** Llevan de placeholder el genin rival de su naturaleza de
  chakra (fuuton y doton). Declarado en `PLACEHOLDERS` de `scripts/generar-sprites-personajes.py`.
- **Kakashi tampoco**, y con él un copia-y-pega no valía: es legendario y se pelea contra él en el
  pergamino dorado, así que con el sprite exacto del genin raiton el desafío parecería un combate
  común. Lleva ese mismo sprite **con el pelo recoloreado a plata** (`RECOLOREADOS` en el mismo
  script). El recolor va por **ventana de luminosidad, no por color exacto**: el dibujo está
  antialiaseado y el pelo son decenas de variantes de un tono, así que contar colores cambiaba 12
  píxeles de 96×96 y el "color dominante" de la coronilla salía siendo el negro del contorno — el
  mismo problema que el papel texturizado de la hoja.
- **Kakashi no tiene sprite de transformación ni proyectil de jutsu.** Cae a su sprite normal y a
  kunai, como Sai y Yamato. El kunai chirría más en su caso porque el Raikiri es cuerpo a cuerpo; el
  sitio donde se resolvería es el tratamiento de melé que ya tiene Rock Lee.
- **Los cascabeles están dibujados por script, no por un artista**
  (`scripts/generar-sprite-cascabeles.py`): dos esferas de cuatro tonos con su ranura y una cuerda
  roja, en rejilla lógica de 28×28 ampliada ×4. Es el **único** sprite del juego que no sale de una
  hoja. Cuando exista el dibujo de verdad, ese script se borra y el objeto pasa a
  `generar-sprites-objetos.py` como todos los demás.
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
- **Los tier 2 de nueve personajes no tienen sprite de transformación** (la hoja solo trae el
  segundo modo de Naruto, Sasuke, Sakura y los jefes). `spriteDeModo` cae al tier 1 del mismo
  personaje, que ya lleva aura y se lee como "está transformado". Sai y Yamato no tienen ninguno y
  caen a su sprite normal — que además ya es un placeholder, así que son los dos que peor se ven.
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

- **Sonido.** Lo que más juice añadiría de todo lo que queda, y por eso está aquí y no en los
  próximos pasos: no es un retoque de pantalla sino un sistema entero (assets, precarga, mezcla,
  ajuste de volumen, y decidir qué pasa cuando el jugador silencia la pestaña). El combate ya tiene
  los ganchos donde irían los golpes: cada evento del historial dice si fue básico o jutsu, si
  impactó, y qué pasivas saltaron.

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
