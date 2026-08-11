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

> **Por dónde seguir ahora mismo: la fase 4 del punto 1.** Es lo único que queda tocando motor y
> datos; todo lo demás de la lista es interfaz. Terminarla deja el proyecto en un sitio limpio —
> sistemas cerrados, el resto es pintar— y sobre todo **cierra el problema que motivó el punto
> entero**: las fases 1-3 han cambiado de dónde viene el poder de objetos y transformaciones, pero
> la curva de niveles sigue intacta (`crecimientoStatsPorNivel: 0.08` lineal = ×8,9 a lo largo de
> una run). La bola de nieve que el doc 27 quería matar sigue ahí, y como los multiplicadores de las
> transformaciones bajaron un 60 %, es probable que hoy los niveles pesen **más** que antes en
> términos relativos. Cualquier cosa que se pruebe o se balancee antes de esa fase es sobre números
> que van a moverse.
>
> Después, **punto 2 y punto 4**: son los que sacan de la invisibilidad todo lo hecho en las fases
> 1-3, que hoy el jugador no percibe en ninguna parte.
>
> Si hace falta algo corto y visible entre medias, el **punto 8** (tarjeta de equipo) es el más
> barato y el que está mejor especificado.

1. **Rediseño del balance** — catálogo de pasivas reutilizables (`first_jutsu_bonus`,
   `ignore_defense`, `heal_on_kill`…), transformaciones que cambian reglas en vez de multiplicar
   stats, objetos que definen el estilo de la run, y reparto del poder 40% objetos / 30%
   transformaciones / 30% niveles. No se podía abordar hasta tener la barra de jutsu.
   (Leer MVP [27](./27-sistema-de-balance.md))

   **Va el primero, por delante de la interfaz de combate, por dos motivos.**

   El de fondo: **hoy los objetos no existen**. Con `crecimientoStatsPorNivel: 0.08` lineal, un
   Naruto de nivel 100 tiene 80 de ataque frente a los 9 del nivel 1, y el mejor objeto legendario
   del juego (Kubikiribōchō) da **+4 planos** — un 5%. Como los bonus son planos y las stats crecen
   ×8,9, los objetos son **más fuertes al principio de la run que al final**, justo al revés de lo
   que se quiere en un roguelike. El reparto real de ese Naruto es ~52% niveles / 47% transformación
   / **1,5% objetos**: el 40/30/30 no consiste tanto en bajar los niveles como en **hacer que los
   objetos importen**, y eso lo arreglan los efectos por regla del doc 27 ("el primer golpe recibido
   hace un 50% menos de daño"), que no se diluyen con el nivel.

   El práctico: las pasivas no son números, son **sucesos de combate** (un primer golpe bloqueado, un
   básico repetido, curarse al matar, atacar primero) y la animación del punto 2 tiene que
   enseñarlos. Montar el punto 2 sobre el vocabulario de eventos actual y meter las pasivas después
   obliga a rehacer el replay — que ya mordió una vez con la barra de carga, que no se podía
   reconstruir sumando.

   > **Este segundo motivo ya está cumplido** (fases 1-3): el vocabulario de eventos está cerrado y
   > el punto 2 se puede hacer cuando se quiera. Lo que sostiene el orden a partir de aquí es solo el
   > primer motivo — no dejar el balance a medias.

   **Cuidado con la complejidad**: el juego es deliberadamente sencillo (runs cortas), así que la
   complejidad va **en el motor, no en la pantalla** — el jugador ve una línea corta por
   transformación y por objeto, nunca un catálogo. Y se implementan **solo las pasivas que algún dato
   use de verdad**: el doc lista 12 y sus ejemplos usan unas 8; una pasiva sin usuario es código
   muerto que hay que mantener y testear.

   Fases (cada una deja el juego jugable):
   1. [x] **Motor de pasivas** — `engine/passives.js` (el catálogo, todo salido de los ejemplos del
      doc 27, ninguna especulativa), textos en `src/data/passives.json`, y los enganches en
      `combat.js`. Un id desconocido revienta al crear el luchador en vez de ignorarse en silencio.
      Los contadores de "primer golpe / primer jutsu" viven en el luchador, no en el bucle de turnos,
      para que el enemigo de un nodo no vuelva a bloquear un primer golpe con cada personaje que
      entra en la cadena de rondas. El evento de ataque gana `pasivasActivadas` y `hpAtacante` para
      el punto 2. 23 tests nuevos; el simulador da los mismos números que antes, que es la prueba de
      que la fase no ha cambiado el juego. Ver [30](./30-sistema-de-pasivas.md).
   2. [x] **Transformaciones** — los 31 modos declaran pasivas y sus multiplicadores se acercan a 1
      (`nuevo = 1 + (viejo − 1)·0,4`). Los siete ejemplos del doc 27 implementados literalmente.
      **Destapó un bug de contenido**: los segundos modos se desbloqueaban entre el nivel 60 y el 85
      cuando una run termina sobre el 49, así que no se activaban nunca — y Sai y Yamato, con un
      único modo a nivel 75/80, no tenían transformación en absoluto. Remapeados a la banda 40-45,
      con test de invariante para que no vuelva a pasar. Los modos de los **jefes** se dejan intactos
      a propósito: también están fuera de alcance, pero bajarlos es rebalancear jefes y eso es la
      fase 4. El simulador pasa a ser **determinista** (semilla fija), porque con azar en el combate
      dos ejecuciones daban 14% y 21% en el mismo combate y así no se puede comparar nada.
      Ver [30](./30-sistema-de-pasivas.md).
      - Arreglado de paso el replay de `CombatScreen`: con `heal_on_kill` en los datos (Naruto,
        Sakura, Shino…) reconstruir el HP restando daño dejó de ser correcto, porque el atacante
        **sube** de HP al rematar. Ahora usa el `hpAtacante` que ya trae el evento. Es el mismo error
        que ya nos pasó con la barra de carga, y esta vez se ha visto venir.
   3. [x] **Objetos** — los 10 objetos declaran pasivas del mismo catálogo que las transformaciones,
      repartidos en las categorías del doc 27 (combate, supervivencia, riesgo, exclusivos de jefe,
      consumible). Los `buffEquipable` planos desaparecen, con test que lo protege: daban +4 de
      ataque contra un ataque de 80 al final de la run, y al ser planos **valían más al empezar la
      partida que al acabarla**. `engine/items.js` borrado entero (solo servía para sumar esas stats).
      Ver [30](./30-sistema-de-pasivas.md).
      - **Falta la categoría económica** (más oro, más XP, descuentos): las pasivas encajan en
        `_aplicarVictoria` sin problema, pero **no hay sprite** para objetos nuevos — los 10 actuales
        agotan `sprite-objetos-iniciales.png`. Hace falta arte antes que código.
      - ⚠️ **El simulador es ciego a esta fase**: da los mismos números que antes porque **nunca
        equipa objetos**, mide personajes desnudos. Enseñarle a simular una run con objetos encima es
        lo primero que hay que hacer en la fase 4, o el 40/30/30 no se puede comprobar.
   4. **Curva de niveles y recalibración** ← **lo siguiente**. En este orden:
      1. **Enseñar al simulador a equipar objetos y a reportar de dónde viene el poder.** Hoy mide
         personajes desnudos, y por eso fue completamente ciego a la fase 3. Sin esto el 40/30/30 no
         se puede comprobar: es a ojo.
      2. **Aplanar la curva**: `crecimientoStatsPorNivel: 0.08` lineal da ×8,9 sobre una run entera.
         Pasa a incrementos pequeños (`+2 HP / +1 ATK / +1 DEF / +1 SPD`). Es LA causa de la bola de
         nieve, y sigue intacta después de las fases 1-3.
      3. **Recalibrar los tres arcos** con el simulador ya fiable, absorbiendo de paso lo que dejaron
         abiertas las fases anteriores: el arco 3 se quedó más fácil al hacer alcanzables los
         segundos modos, los jefes se ganan al 14 % planos, los combates duran 4,5 turnos (el jutsu
         apenas sale una vez) y los arcos 2 y 3 nunca se recalibraron tras pasar de 10/12 a 8 pisos.
         **Absorbe buena parte del punto 7.**

      Hasta la fase 3 los cambios eran aditivos; a partir de aquí no hay vuelta atrás sin re-simular.
      Es la fase con más iteración de las cuatro.

   **Verificación**: `npm test` en cada fase (toca `engine/` y `store/`, es obligatorio), el
   simulador antes y después de cada cambio de balance, y prueba manual.


2. **Actualizar interfaz de combate** — Todo el equipo debería aparecer en pantalla aunque solo
   el primero esté peleando. Sprites de los personajes visibles. Los logs de texto se sustituyen
   por una animación: el ninja lanza un kunai al enemigo y al impactar la barra de HP baja.
   Personajes caídos → card apagada (estilo Pokelike). Efecto de sacudida al recibir golpe.
   Y **enseñar las pasivas cuando saltan** (`pasivasActivadas` viene en cada evento): sin eso el
   sistema entero del punto 1 es invisible — ver [30](./30-sistema-de-pasivas.md).

   > **Cambio de criterio: este punto ya NO está bloqueado por el 1.** La razón original para
   > ponerlo detrás era que las pasivas iban a crear sucesos nuevos que la animación tendría que
   > enseñar, y el vocabulario de eventos podía cambiar bajo los pies. Ese vocabulario **ya está
   > cerrado** desde la fase 3: `pasivasActivadas`, `esAtaqueExtra` y `hpAtacante` están en los
   > eventos, y la fase 4 solo mueve números, no añade tipos de suceso. Se puede hacer antes que la
   > fase 4 sin arriesgar rehacer trabajo — y es lo que haría visible todo lo construido hasta ahora.
   > Se recomienda igualmente cerrar la fase 4 primero, pero por coherencia del balance, no por
   > dependencia técnica.

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

4. **Pantalla de transformación** — ⚠️ **no es opcional**: desde que las transformaciones se quitaron
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

7. **Playtest jugando** — la recalibración numérica se hace en la **fase 4 del punto 1** (con el
    simulador, contra los datos ya rediseñados); recalibrar antes sería trabajo tirado. Lo que queda
    aquí es lo que un script no puede medir: sentarse a jugar runs enteras y ver qué se siente mal.
    Con lo ya detectado como lista de sospechosos:
    - Los combates normales se ganan al 96-97% y los jefes 1 vs 1 al 14%: un salto demasiado brusco.
    - Los combates duran ~4,5 turnos, tan poco que el jutsu apenas sale una vez
      (ver [29](./29-sistema-de-jutsus-automaticos.md)). Y con combates tan cortos **cargar lento
      castiga más de lo que dice la media** — un jefe con `T`=4 se come tres básicos flojos antes de
      su golpe gordo y el combate ya se acabó. Los perfiles de carga mueven la dificultad real, no
      son solo sabor.
    - Los tres arcos pasaron a 8 pisos (antes 10 y 12) por legibilidad del mapa, y eso recorta los
      combates —y por tanto la XP— de los arcos 2 y 3 sin haber recalibrado `nivelEnemigoBase` ni los
      niveles fijos de jefe. Ver [11](./11-progresion-y-arcos.md).
    - El salto de dificultad cuando un personaje de banquillo entra en una ronda encadenada contra un
      jefe (ver nota en [11](./11-progresion-y-arcos.md)).
    - El ritmo de empezar solo (1 personaje) en un arco sin reclutas (`pais_de_las_olas` tiene
      `personajesReclutablesIds: []`).

8. **Actualizar tarjeta de equipo** — Los nombres deberian estar acortados a "Naruto U." para no ocupar tanto en la pantalla de equipo. La fuente debería ser de un tamaño más pequeño para que tanto en la tarjeta de equipo como en la de reclutamiento el nombre quepa en una linea. Ahora que no tenemos descripción de nada podemos poner el tipo del luchador (Katon) como una etiqueta debajo del nombre debajo de la HP y eliminarlo del nombre. Mover el orden de los peleadores del equipo deberia ser un drag and drop, no un click. El objeto equipado en cada uno de ellos debería enseñar el sprite del objeto con una X para desequiparlo. Podemos ensanchar la tarjeta del equipo para no tener que hacer la fuente tan pequeña que sea dificil de ver, hay espacio. 

9. **Diseño de la columna central** — Con unos nodos mas grandes la columna central puede volver a su tamaño anterior, manteniendo las proporciones y ajustandose a la pantalla. También el sprite usado en la columna central tiene que ser mas sencillo y representativo del arco actual. "Current arc" tiene que eliminarse, y el nombre del arco actual tendría uqe estar con ese estilo caracteristico de Naruto en el que la fuente tiene color negro con ese reborde blanco tan caracteristico

10. **Enciclopedia** — el sitio donde vive la información que se ha ido sacando de las tarjetas para
    que quepan en una pantalla: descripción de cada jutsu, potencia, turnos exactos de carga, **qué
    hace cada transformación** (`describirPasiva` ya genera esas líneas), **la descripción narrativa
    de cada objeto** (sigue en `items.json`, ya no se pinta en ninguna tarjeta), tabla de eficacias
    de chakra, y ficha de cada personaje y enemigo. Es consulta voluntaria, no algo que se cruce en
    medio de una run — pantalla propia desde el menú de iconos del mapa, como Logros.
    Ojo: hoy esa información **no está en ninguna parte**, así que hasta que esto exista hay una deuda
    real, no solo un "ya lo pondremos". Y crece cada vez que se adelgaza una tarjeta.

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
