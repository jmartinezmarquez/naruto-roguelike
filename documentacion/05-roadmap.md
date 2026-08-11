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
- [x] Barra de jutsu en `CombatScreen` y ritmo de carga ("Jutsu about every N turns") en la ficha de
  personaje y en la tarjeta de reclutar — sin eso no hay forma de saber en qué se diferencian.
- [ ] **Fuera de alcance a propósito**: el [27](./27-sistema-de-balance.md) es ahora el punto 6 bis
  de abajo. Solo se han dejado sus dos enganches (`multiplicadorCarga` en modos, `carga.inicial`
  para objetos).

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

## Próximos pasos (en orden sugerido)

6 bis. **Rediseño del balance** — catálogo de pasivas reutilizables (`first_jutsu_bonus`,
   `ignore_defense`, `heal_on_kill`…), transformaciones que cambian reglas en vez de multiplicar
   stats, objetos que definen el estilo de la run, y reparto del poder 40% objetos / 30%
   transformaciones / 30% niveles. No se podía abordar hasta tener la barra de jutsu.
   (Leer MVP [27](./27-sistema-de-balance.md))


7. **Actualizar interfaz de combate** — Todo el equipo debería aparecer en pantalla aunque solo
   el primero esté peleando. Sprites de los personajes visibles. Los logs de texto se sustituyen
   por una animación: el ninja lanza un kunai al enemigo y al impactar la barra de HP baja.
   Personajes caídos → card apagada (estilo Pokelike). Efecto de sacudida al recibir golpe.

7 bis. **Nodo de reclutar con rareza visible y recluta legendario por combate** — la hoja
   `assets/sprite-nodos-mapa.png` trae tres pergaminos (verde común, azul raro, dorado legendario) y
   hoy solo se usa uno, porque el nodo no sabe qué rareza ofrece: `generarOfertaReclutar` sortea los
   candidatos al **entrar** en el nodo, no al generar el mapa. Hay que subir la rareza al nodo
   (`mapGenerator.js`) para poder pintar el pergamino correcto desde el mapa.
   Encima, el legendario deja de ser una elección: se convierte en un combate contra ese personaje y
   solo se recluta si lo ganas — flujo nuevo (pantalla de combate con `alGanar: reclutar`), no una
   variante de `RecruitScreen`. Es el único de los ajustes visuales de esta tanda que toca motor,
   store y datos, por eso va aparte.

8. **Actualizar interfaz de logros** — (Leer MVP [25](./25-diseño-pantalla-logros.md))


9. **Playtest y ajuste de balance** — con `scripts/simular-combates.mjs` ya hay con qué medirlo.
    Lo que canta hoy: los combates normales se ganan al 96-99% y los jefes 1 vs 1 al 7-21%, un salto
    demasiado brusco; y los combates duran ~4,5 turnos, tan poco que el jutsu apenas sale una vez
    (ver [29](./29-sistema-de-jutsus-automaticos.md)). Además, los tres arcos pasaron a 8 pisos
    (antes 10 y 12) por legibilidad del mapa, y eso recorta los combates —y por tanto la XP— de los
    arcos 2 y 3 sin haber recalibrado `nivelEnemigoBase` ni los niveles fijos de jefe. Ver
    [11](./11-progresion-y-arcos.md). Además, revisar el salto de dificultad cuando un
    personaje de banquillo entra en una ronda encadenada contra un jefe (ver nota en
    [11](./11-progresion-y-arcos.md)), y ahora también el ritmo de empezar solo (1 personaje) en
    un arco sin reclutas (`pais_de_las_olas` tiene `personajesReclutablesIds: []`).
    (Leer MVP [27](./27-sistema-de-balance.md))

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
