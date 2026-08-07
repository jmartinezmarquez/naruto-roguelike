# Selección de personaje inicial y reclutar-con-reemplazo

## Diseño: empiezas con 1, el resto se rellena reclutando

`config.json` ya tenía `equipo.numeroPersonajesInicialesAElegir: 1` desde el principio, sin usar
todavía. Se respeta tal cual: la run arranca con **1** personaje elegido por el jugador (no los 3
"inicial" fijos de antes) — estilo Pokémon, no estilo "equipo ya formado". Los otros
`tamanoMaximo - 1` huecos del equipo se quedan vacíos y se rellenan reclutando en tiendas durante
la run (ver [15 - Tienda](./15-tienda.md)).

Nota de diseño real que ya encaja con esto sin cambiar nada: `personajesReclutablesIds` de
`pais_de_las_olas.json` está vacío — el primer arco no tiene reclutas, así que el jugador va solo
con su elegido hasta el examen Chunin. No es un descuido, es coherente con este diseño.

## `components/CharacterSelect/CharacterSelectScreen.jsx`

Nueva pantalla, la primera que ve el jugador — `App.jsx` la renderiza siempre que `mapa` es `null`
(arranque, o tras `reiniciarRun()` desde Game Over: cada run nueva vuelve a preguntar). Sustituye
la llamada automática a `iniciarRun(['naruto', 'sasuke', 'sakura'], arco)` que había antes.

- **Roster**: personajes con `rareza: 'inicial'` en `characters.json` (Naruto, Sasuke, Sakura) más
  los que haya desbloqueado algún logro con recompensa `desbloquearPersonajeInicial` —
  `engine/achievements.js` → `obtenerPersonajesInicialesDesbloqueados`. Ningún logro usa ese tipo
  de recompensa todavía en `achievements.json` (queda para cuando se diseñe uno), pero el mecanismo
  ya funciona end-to-end si se añade.
- Selección genérica sobre `numeroPersonajesInicialesAElegir` (hoy 1, se comporta como radio:
  elegir otro cambia la selección en vez de acumular). Si algún día se sube ese número, el mismo
  código soporta elegir varios sin tocarlo.
- `App.jsx` pasa `onConfirmar={(ids) => iniciarRun(ids, arcoPaisDeLasOlas)}` — la pantalla no llama
  a `iniciarRun` directamente, así se mantiene desacoplada del store de la run.
- Los logros deben estar cargados ANTES de montar esta pantalla (el roster depende de ellos) —
  `App.jsx` llama `cargarLogros()` en un efecto al montar, ya no encadenado a `iniciarRun` como
  antes.

## Reclutar con equipo lleno: elegir a quién reemplazar

Antes, `reclutarPersonaje`/`reclutarDeTienda` simplemente no hacían nada si el equipo ya estaba a
`tamanoMaximo` (el botón de la tienda aparecía deshabilitado). Ahora que la run empieza con 1 solo
personaje, reclutar hasta completar el equipo (y seguir reclutando después, reemplazando) es la
vía normal de crecer el equipo, así que hacía falta un flujo real:

- **`useGameStore.reclutarPersonaje(id, nivelInicial, idAReemplazar = null)`**: si hay hueco libre,
  añade igual que antes. Si el equipo está lleno, **requiere** `idAReemplazar` — sin él, no hace
  nada y devuelve `false` (para que la UI se lo pida al jugador en vez de fallar en silencio). El
  personaje reemplazado sale del equipo (y de la run) tal cual estaba — no hay banquillo fuera del
  equipo, así que no vuelve.
- **`reclutarDeTienda(personajeId, idAReemplazar = null)`** pasa el parámetro tal cual.
- **Nivel del reclutado**: `avanzarANodo` calcula `nivelReclutamiento` como el nivel del personaje
  más fuerte del equipo actual (`Math.max(...equipo.map(p => p.nivel))`), NO con
  `calcularNivelPorPiso` como antes — ese cálculo daba niveles muy bajos en pisos tempranos (p. ej.
  nivel 2) sin relación con lo subido de nivel que ya estuviera el equipo por el propio combate, lo
  que hacía que reclutar fuera casi siempre peor que quedarse con quien ya tenías. Además, si el
  reclutamiento reemplaza a alguien (`idAReemplazar`), se suma
  `config.equipo.bonusNivelAlReemplazar` (2) — así reemplazar da una ventaja real sobre rellenar un
  hueco vacío, no es solo una decisión lateral.
- **`ShopScreen.jsx`**: al pulsar "Reclutar" con el equipo lleno, en vez de reclutar directamente
  se abre un panel `ElegirReemplazo` con los 3 miembros actuales (con su tarjeta de hover igual que
  en cualquier otro sitio) para elegir a quién sacar. Cancelar vuelve a la oferta sin cobrar nada.

## Tarjeta de hover (`components/common/PersonajeHoverCard.jsx`)

Envuelve cualquier trigger (un botón, un icono...) y muestra al pasar el ratén una tarjeta de
detalle — tipo de chakra, stats (ataque/defensa/velocidad/HP), HP actual/máximo si se pasa, y el
jutsu con su descripción — igual que la tarjeta de un Pokelike. Usa un "named group" de Tailwind
(`group/hover`) para no chocar con otros `group` que ya tenga el elemento envuelto, y CSS puro
(`opacity`/`scale` en hover) en vez de JS de posicionamiento.

- Si se pasa `nivel`, las stats se calculan escaladas a ese nivel con el motor puro
  (`engine/combat.js` → `crearLuchador`); si no, se muestran las stats base (nivel 1) — útil en
  sitios donde solo hay una oferta de tienda sin instancia de run todavía.
- **Daño de referencia del jutsu**: junto a la descripción se muestra "~XX dmg", calculado con
  `engine/combat.js` → `calcularDano(luchador, luchador, jutsu)` — el propio luchador como rival de
  referencia (mismo tipo y stats), así el número sale del mismo cálculo real que usa el motor en
  combate, no de un valor inventado aparte. `jutsu.danoBase` en los datos es un multiplicador
  (p. ej. `1.3`), no un número de daño por sí solo — mostrar solo ese multiplicador no le decía
  nada al jugador sobre cuánto pega realmente el jutsu.
- Busca primero en `characters.json` y si no está, en los jefes de `enemies.json` — así funciona
  igual para el equipo del jugador que para los enemigos de un combate. Si el id no aparece en
  ninguno (enemigos comunes sin ficha completa), no rompe: simplemente no envuelve nada y devuelve
  el trigger tal cual, sin tooltip.
- Integrado en: `MapScreen.jsx` (panel de equipo), `CombatScreen.jsx` (las dos barras de luchador),
  `ShopScreen.jsx` (tarjetas de reclutamiento y el panel de elegir a quién reemplazar), y
  `CharacterSelectScreen.jsx` (cada candidato del roster).

## Pictograma de ventaja de chakra (`RuedaChakra`, dentro de `MapScreen.jsx`)

Debajo de la leyenda del mapa: un pentágono SVG con los 5 elementos de `types.json` en el orden del
ciclo (`elementos`, ya viene en orden de ventaja: Katon → Fuuton → Raiton → Doton → Suiton →
Katon), con una flecha de cada uno al elemento contra el que es fuerte. Pensado para quien no tenga
memorizado el sistema de naturalezas de Naruto — la tabla `tablaEficacias` por sí sola no es
intuitiva sin verla dibujada como ciclo. Coordenadas calculadas con trigonometría simple (mismo
enfoque que `calcularPosiciones` para el propio mapa), sin ninguna librería de gráficos.

**Bug real: las flechas no se veían.** Cada curva terminaba justo en el centro del círculo
destino, y los círculos se dibujan DESPUÉS que las curvas (para quedar por encima) — la punta de
flecha (`markerEnd`) quedaba pintada en el centro del círculo y el propio círculo la tapaba por
completo. La curva en sí (el trazo) sí se veía, pero sin ninguna punta no se distinguía el sentido.
Arreglado recortando el final de cada curva al borde del círculo (a `RADIO_NODO_CHAKRA` de
distancia, en la dirección control→destino, es decir la tangente de la curva en ese punto), para
que la flecha quede visible justo fuera del círculo. De paso, los `<marker>` pasaron a
`markerUnits="userSpaceOnUse"` — con el valor por defecto (`strokeWidth`) el tamaño de la flecha
dependía del grosor de línea de cada trazo, más difícil de razonar que un tamaño fijo.

## Testing

- `engine/achievements.test.js` — `obtenerPersonajesInicialesDesbloqueados`.
- `store/useGameStore.test.js` (sección "tienda") — `reclutarDeTienda` con `idAReemplazar`: sí
  reemplaza en su misma posición y cobra, no hace nada si el id a reemplazar no está en el equipo,
  y el bonus de nivel al reemplazar (`bonusNivelAlReemplazar`) se suma correctamente.
- `store/useGameStore.test.js` (sección "nivel de reclutamiento al entrar en un nodo de tienda") —
  `avanzarANodo` usa el nivel del equipo, no `calcularNivelPorPiso`.
- No hay tests de componentes React (`CharacterSelectScreen`, `PersonajeHoverCard`...) — sigue
  siendo una limitación conocida del proyecto, ver [16 - Testing](./16-testing.md). En particular,
  el bug de las flechas invisibles de `RuedaChakra` y el de `PersonajeHoverCard` no habrían sido
  detectables por ningún test aquí — son bugs puramente visuales/SVG.
