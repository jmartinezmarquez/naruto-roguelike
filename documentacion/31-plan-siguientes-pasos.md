# Plan de los siguientes pasos

Preparado el 2026-08-12 para arrancar la sesión siguiente sin tener que redescubrir el estado.
No es un documento de diseño: es el **orden de trabajo** de lo que queda del
[05-roadmap.md](./05-roadmap.md) y el desglose de cada punto en fases con su verificación.

Lo que queda abierto son los puntos **5, 6, 7, 9 y 10**. Los huecos de numeración (1-4, 8, 11, 12,
13) son puntos hechos que se movieron a "Hecho" conservando su número — no faltan.

---

> ## Estado al cerrar la sesión del 2026-08-13
>
> **Hechos desde que se escribió este plan**: el **13** (Kakashi y los cascabeles), el **10**
> (enciclopedia / Bingo Book, con el gateo de "solo lo ya visto"), el **5c** (la pantalla de logros, que
> entró dentro del lavado de cara) y el **14** (ajustes, con el modo claro/oscuro y su segundo pase). El
> desarrollo de cada uno está en [05-roadmap.md](./05-roadmap.md), sección "Hecho".
>
> **El 7 (playtest) sigue aparcado, no descartado.** Es del usuario y no hay tiempo de jugar; los
> resultados se anotan en el roadmap cuando los haya. Sigue siendo el punto con más valor por hora
> invertida, y desde el último han cambiado el balance de los jefes, el roster, el final del combate y
> **las ocho pantallas**. Nada de lo que se haga mientras tanto lo sustituye.
>
> **Actualización (2026-08-15).** Desde entonces se han cerrado también el **6** (eventos, con su
> documento MVP nuevo — [35](./35-diseño-de-eventos.md)) y la **música** ([36](./36-musica.md)), que
> resultó no ser el sistema que decía el backlog sino una pista en bucle.
>
> **Actualización (2026-08-15, misma tarde): se han cerrado el 9 y el 5a, y con ellos la lista entera.**
> No queda ningún punto de código abierto del MVP. Lo que sigue es playtest, la pista de música y la
> tanda de arte. El plan del 5a se queda al final de este documento **como registro de lo que se
> decidió** —sus cuatro preguntas abiertas están contestadas en el propio plan y en
> [18](./18-sistema-de-logros.md)—, no como trabajo pendiente. Y ojo, que la sección "5 — Logros" de más
> abajo se escribió antes de que existiera la pantalla: **5c ya está hecho y el campo `categoria` se
> decidió NO añadirlo** — lo dice también ahí, corregido en su sitio.

## Orden recomendado

| # | Punto | Por qué ahí | Tamaño | ¿Toca motor/store/datos? |
|---|---|---|---|---|
| 1.º | **7 — Playtest** | Va en paralelo y lo hace el usuario: desde el último han cambiado el balance de los jefes, la frecuencia y rareza de los reclutas, el final del combate, todas las tarjetas de personaje y el roster. Su triaje entra por delante de cualquier punto empezado | 1 sesión corta (jugar) + lo que salga | No (salvo lo que aparezca) |
| ~~2.º~~ | ~~**13 — Kakashi + cascabeles**~~ | **HECHO el 2026-08-13** — desarrollo en [05-roadmap.md](./05-roadmap.md) y calibración en [11](./11-progresion-y-arcos.md) | — | Fueron tres ficheros de datos |
| ~~3.º~~ | ~~**10 — Enciclopedia**~~ | **HECHO el 2026-08-13** — ver [32](./32-enciclopedia.md) | — | No (solo lectura) |
| ~~2.º~~ | ~~**5a — Logros: contenido y condiciones**~~ | **HECHO el 2026-08-15** — ver [18](./18-sistema-de-logros.md). El plan acertó en lo importante: el trabajo eran **los enganches, no el JSON**, y el registro de vistos era en efecto el patrón a copiar (tanto, que cuatro logros salen de él sin contador propio) | — | Sí — `achievements.json`, `engine/achievements.js`, los dos stores |
| 5.º | **6 — Eventos** | No se puede planificar todavía: es el **único punto sin documento MVP**. Antes hay que escribir qué se quiere de esa pantalla | Pequeña + doc previo | No |
| ~~6.º~~ | ~~**9 — Columna central**~~ | **HECHO el 2026-08-15** — ver [13](./13-ui-mapa-y-combate.md). No fue tan cosmético: el fondo pasó a dibujarse en vez de recortarse, y la queja de "el mapa es pequeño" se resolvió por la altura del lienzo, no por el ancho | — | No |

~~**Fuera de la lista y más importante que la mitad de ella: el sonido.**~~ **HECHO**, y la estimación
estaba mal: no era un sistema (assets, precarga, mezcla) sino **una pista en bucle**, porque la
referencia no tiene efectos de sonido. Ver [36](./36-musica.md). ⚠️ La lección se guarda porque volverá a
pasar: **antes de estimar un sistema, comprobar qué hace de verdad la referencia.**

---

## Cómo se reparte el trabajo

**El playtest es tuyo y va en paralelo, no en serie.** Es lo único de esta lista que no puedo hacer
yo, y aparcarlo no lo sustituye nada: las dos últimas tandas de mejoras salieron enteras de partidas
reales. Cuando puedas jugar, los hallazgos van al roadmap con la plantilla de abajo, y el triaje es
lo primero que se hace en la sesión siguiente — por delante de cualquier punto empezado.

**Lo que se implementa mientras tanto** se elige por una regla: que no dependa del playtest y que se
pueda dejar a medias sin romper una run. El punto 13 cumplía las dos (hasta que Kakashi no entraba en
un pool, existía en el JSON y no aparecía en ninguna partida) y el 10 también, porque es una pantalla
nueva a la que solo se llega por un botón que se añade al final.

---

## 7 — Playtest

No es una formalidad y no lo puede hacer un script. El simulador da la **run promedio**: usa la XP
esperada de cada piso, no un sorteo, y da por hecho un trío desde el principio cuando el arco 1
empieza con uno.

### Lista de sospechosos (mirar activamente, no solo "jugar a ver")

1. **Arco 1 con un solo personaje.** Los "inicial" no elegidos solo salen por el pergamino verde.
   ¿Se llega a Haku (piso 4) con equipo de 3 o con uno y medio?
2. **Haku es el nodo más justo del juego** (80% en simulación, y cuesta ~2 de los 3 personajes).
   ¿Se siente como el pico de dificultad del arco, o como un muro?
3. **Combates de ~4,5 turnos**: el jutsu apenas sale una vez. Los perfiles de carga lenta castigan
   más de lo que dice la media (ver [29](./29-sistema-de-jutsus-automaticos.md)). ¿Se nota la
   diferencia entre Rock Lee y Shikamaru al jugarlos, o es invisible?
4. **Un camino real con mala suerte** (dos tiendas seguidas, ningún combate) llega al mini-jefe
   bastante más flojo que la run promedio. ¿Cuánto?
5. **El desafío legendario** (pergamino dorado): 40-53% en el piso 3 y 71-89% en el 6. ¿Se lee desde
   el mapa que es una apuesta, o sorprende?
   - **Kakashi, nuevo**: en el arco 1 el pergamino dorado ya sale en la primera run y es él. El
     simulador da ese combate al **52% en el piso 3 y 87% en el 6**. ¿Se siente como una apuesta justa?
     ¿Y compensa el premio, sabiendo que los dos jefes del arco 1 son suiton y él es raiton — o sea que
     no ayuda con Zabuza sino con los arcos 2 y 3?
6. **El relevo contra un jefe**: cuando cae el activo y entra el banquillo contra un jefe con la
   barra de jutsu ya cargada (la conserva entre rondas, a propósito). ¿Se siente injusto?
7. **Las tarjetas rehechas** (puntos 8, 11 y 12) en una partida entera, no en capturas sueltas.
8. **La pantalla de transformación**: ¿aparece cuando toca y se entiende lo que acaba de pasar?

### Plantilla de captura

Anotar cada incidencia en una línea, directamente en el roadmap bajo un bloque nuevo
`### Playtest <fecha>`:

```
- [ ] <qué pasó> — <dónde: pantalla/nodo/arco> — <se rompe / molesta / se siente mal>
```

La tercera columna es la que ordena el triaje del bloque B y evita la discusión de después.

---

## 13 — Kakashi + los cascabeles (HECHO)

El plan que había aquí ya no sirve de nada: se ejecutó el 2026-08-13 y lo que se aprendió no estaba
en él. El registro de verdad está en dos sitios, y conviene leerlos antes de añadir el siguiente
personaje:

- **[05-roadmap.md](./05-roadmap.md)**, sección "Hecho" → qué se añadió y por qué fueron tres ficheros
  de datos.
- **[11-progresion-y-arcos.md](./11-progresion-y-arcos.md)** → cómo se calibra un personaje nuevo, que
  es la parte que costó. Resumen: **por su puesto** entre todos los candidatos a la posición 1, jefe a
  jefe. Un Δ contra la media de tríos da conclusiones falsas, y con un solo personaje de control
  también, porque cuela su propio emparejamiento de tipos.

## 10 — Enciclopedia (el siguiente)

Es el sitio donde vive todo lo que se ha ido **sacando** de las tarjetas para que quepan, y la deuda
crece cada vez que se adelgaza una ficha — el punto 13 acaba de añadirle cuatro textos más.

**El plan detallado está al final de este documento**, con lo que existe ya verificado uno a uno, las
fases y las trampas. La decisión que lo bloqueaba —qué se enseña de lo que el juego esconde a
propósito— está **tomada**: solo lo ya visto.

---

## 5 — Logros: partirlo en tres antes de empezar

El [25](./25-diseño-pantalla-logros.md) está escrito para un juego que todavía no existe. Contra lo
que hay hoy:

| El documento pide | Hoy hay |
|---|---|
| "12 / 38 desbloqueados" | **7 logros** |
| Categorías (Generales / Acto 1 / 2 / 3) | ningún campo `categoria` |
| Ejemplos tipo "recluta 10 ninjas", "consigue 1000 de oro", "completa 30 combates" | 2 tipos de condición: `derrotarJefe` y `completarArcoSinDerrotas` — **no hay contadores acumulados entre runs** |
| Recompensa inmediata (🪙 50, 📜 x1) | 2 tipos de recompensa, las dos de desbloqueo: `desbloquearPersonajeReclutable`, `desbloquearObjetoInicial` |
| Hitos globales: +5% oro, +5% XP, +1 hueco de inventario, más probabilidad de raros | **ninguno de esos sistemas existe** |
| Un sprite propio por logro | no hay arte |

Hacer solo la pantalla dejaría una interfaz de meta-progresión con siete tarjetas, un único filtro
con contenido y una barra de hitos vacía. Por eso va partido:

- **5a — contenido y condiciones** *(lo siguiente; plan detallado al final del documento)*. Contadores
  acumulados en `useAchievementsStore` (combates, reclutas, oro) y los tipos de condición que los usan.
  Es lo que llena la pantalla; sin esto lo demás no tiene qué enseñar. ⚠️ **El campo `categoria` que
  pedía este plan ya no hace falta**: al construir la pantalla se vio que toda condición apunta ya a un
  arco —por `arcoId` o por el `jefeId` de su mini-jefe o jefe final—, así que `arcoDelLogro()` lo calcula
  y el dato no se duplica en dos sitios libres de desincronizarse.
- **5b — recompensas nuevas.** Oro inicial, modificadores permanentes (+% oro, +% XP), hitos
  globales por número de logros. **Ojo: esto toca el balance de la run entera**, y los invariantes de
  arco de `leveling.test.js` están para cazar justo eso — un +5% de XP permanente mueve la curva de
  niveles. Hay que decidir si un roguelike con runs cortas quiere meta-progresión que cambia números.
- ~~**5c — la pantalla**~~, **HECHA** dentro del lavado de cara (ver [33](./33-direccion-visual.md)):
  ventana sobre el mapa, pestañas por acto con contador, icono sacado de la recompensa a falta de arte
  propio. Se adelantó a 5a porque el kit pasaba por ahí de todas formas.

**Mi recomendación**: hacer 5a + 5c y **saltarse 5b** para el MVP, o dejar los hitos como
desbloqueos de contenido (personajes, objetos) en vez de modificadores numéricos. Confirmarlo antes
de escribir código.

~~Y de paso, en 5c: quitar el botón `[DEV] Reset achievements`.~~ **Hecho en el punto 14**: es una
opción de verdad de la pantalla de ajustes, con confirmación.

---

## 6 — Eventos: escribir el documento primero

Es el único punto sin documento MVP, así que no se puede planificar todavía. El siguiente paso no es
código sino escribir `32-diseño-pantalla-eventos.md`, como se hizo con el 23, el 24 y el 25.

Lo que hay hoy: `EventScreen.jsx`, 66 líneas, una tarjeta centrada con título, descripción y los
botones de elección, cada uno con su pista automática generada por `generarPista`. Funciona y no
tiene bugs conocidos; lo que le falta es carácter — es la única pantalla que sigue pareciendo una web.

Preguntas que el documento tiene que responder antes de tocar nada:

- ¿Ilustración por evento, o un fondo por arco? (12 eventos × 1 dibujo es mucho arte)
- ¿La pista del resultado se sigue viendo antes de elegir, o se descubre después? Hoy se ve, y eso
  convierte el evento en una elección informada en vez de una apuesta. Cambiarlo es un cambio de
  **diseño de juego**, no de pantalla.
- ¿Hay consecuencia visible al elegir (animación, toast) o se vuelve al mapa directamente?
- ¿Encaja aquí la bifurcación de riesgo/recompensa que hay en el backlog?

---

## 9 — Columna central del mapa

El más pequeño y el más acotado. Tres cosas, tal como las escribiste:

1. **Nodos más grandes → la columna central puede volver a su tamaño anterior**, manteniendo
   proporciones y cabiendo en pantalla. Tocar `tamanoNodo()` y el escalado con `ResizeObserver` de
   `MapScreen.jsx`. Cuidado: el mínimo de 44 px es **en pantalla**, no en lienzo — ya hubo un bug de
   nodos de 48 px que acababan en ~31 al escalar.
2. **Sprite de columna más simple y más representativo del arco.** Se regenera con
   `scripts/generar-columnas-mapa.py` desde `map-columns/originales/*.png`; los generados no se
   editan a mano.
3. ~~**El nombre del arco con el estilo Naruto**: negro con reborde blanco.~~ **HECHO**, y para todos
   los títulos a la vez, no solo el del arco: el contorno vive dentro de la clase `font-naruto`
   (ver [33](./33-direccion-visual.md)). Salió con `text-shadow` a 8 direcciones y no con
   `-webkit-text-stroke`, que sin `paint-order` adelgaza la letra en vez de rodearla.
   ⚠️ Si se toca `index.css`, comprobar que la regla **llega al bundle**
   (`grep -o "mi-clase[^{]*{[^}]*}" dist/assets/*.css`): que `npm run build` pase no quiere decir que
   el CSS sea válido — un comentario mal cerrado ya descartó en silencio todas las reglas siguientes.

---

## Verificación, igual para todos los puntos

1. `npm test` — **obligatorio** si el cambio toca `engine/` o `store/`. Son **225** tests y existen
   para este tipo de regresión.
2. `node scripts/simular-combates.mjs` — solo si el cambio toca balance, datos de personaje/enemigo,
   objetos o pasivas. Antes y después, que es determinista.
3. `npx eslint src` — limpio salvo el warning preexistente de `useMemo` en `MapScreen.jsx`.
4. `npm run build`, y el `grep` al bundle si se tocó `index.css`.
5. **Prueba manual tuya en el navegador.** Nada headless, nunca. Y para la pantalla de combate
   además: una cadena de rondas encadenando las tres tarjetas, una pasiva saltando visiblemente
   (Naruto o Sakura con `heal_on_kill` es la más fácil de provocar) y "Skip animation" sin dejar
   barras a medias. Ahí `npm test` no cubre nada.

---

---

# Plan del punto 5a — Contenido y condiciones de los logros

> ✅ **HECHO el 2026-08-15.** Se conserva porque explica **por qué** el punto tiene la forma que tiene, y
> ese razonamiento vuelve a hacer falta la próxima vez que se añada un logro. Cómo quedó, en
> [18](./18-sistema-de-logros.md). Las cuatro decisiones se tomaron **por la recomendación**: una
> condición genérica de contador; siete contadores (los cuatro recomendados más eventos, compras y runs
> perdidas); **sí, un logro puede no dar nada**; y 23 logros. Lo único que el plan no vio venir es que la
> mitad del contenido nuevo **no necesitaba contador ninguno**: `coleccionMinima` lee el registro de la
> enciclopedia, que ya estaba, y por eso hay cuatro logros más sin un solo enganche nuevo.


Preparado el 2026-08-13 para arrancar la sesión siguiente. La pantalla (5c) ya está hecha y en estilo:
lo que falta es **material que enseñar**, y el trabajo de verdad no está en el JSON.

## Lo que ya existe (verificado uno a uno, no supuesto)

| Pieza | Estado hoy |
|---|---|
| `src/data/achievements.json` | **7 logros** |
| `engine/achievements.js` | 2 tipos de condición: `derrotarJefe`, `completarArcoSinDerrotas` |
| Recompensas | 3 tipos, las tres de desbloqueo: personaje reclutable, personaje inicial, objeto inicial |
| `useAchievementsStore` | Guarda logros y `vistos` en **dos** claves de `localStorage`, con cola de notificaciones y toast ya funcionando |
| `AchievementsScreen` | Ventana sobre el mapa, pestañas por acto **calculadas** (`arcoDelLogro`), icono sacado de la recompensa |
| Tests | `engine/achievements.test.js` y `store/useAchievementsStore.test.js` ya existen |

⚠️ **El hallazgo que cambia el plan: hoy hay UN SOLO punto de evaluación.**
`useGameStore._evaluarLogrosPorVictoria()` se llama desde `jugarCombate` al ganar, y el contexto que
arma es siempre "acaba de morir este jefe". **Ningún logro que no sea "derrota a X" tiene hoy dónde
dispararse**, por muy bien escrito que esté en el JSON. Ahí está el trabajo de 5a, no en el contenido.

Y una pieza a favor: **`registrarVistos` es exactamente el patrón que necesitan los contadores** —lote,
idempotente, una sola escritura en `localStorage`, no toca el estado si no hay novedad—. No hay que
inventarlo, hay que copiarlo.

## Decisiones antes de tocar código (contestar en la sesión, no ahora)

**1. ¿Una condición genérica de contador, o una por métrica?**
→ *Recomendación: una sola*, `contadorMinimo` con `{ contador, cantidad }`. El motor se queda agnóstico
del contenido —que es la regla del proyecto— y añadir un logro vuelve a ser **solo datos**. Con un tipo
por métrica (`ganarNCombates`, `reclutarNNinjas`…), cada logro nuevo obliga a tocar `engine/`.

**2. ¿Qué contadores?** Cada uno cuesta un enganche, y un enganche es un sitio donde olvidarse.
→ *Recomendación mínima viable*: `combatesGanados`, `reclutas`, `oroGanado`, `runsCompletadas`. Los
"jefes distintos derrotados" no hacen falta: ya se deducen de los logros desbloqueados.

**3. ⚠️ ¿Puede un logro no dar nada?** Es la pregunta que **vuelve a bloquear 5a si no se contesta**, y
la misma que apareció al planificar el punto 14: los tipos de recompensa que existen son de desbloqueo,
y ya quedan pocos personajes y objetos que desbloquear. Veinte logros nuevos no tienen premio que dar.
→ *Recomendación: sí*, con `recompensa: { tipo: 'ninguna' }` pintada como marca de honor. La alternativa
es meter 5b (oro, +% XP), que **toca el balance de la run entera** y para el que ya hay una recomendación
en contra en este mismo documento. Un juego con runs cortas no quiere meta-progresión que cambie números.

**4. ¿Cuántos logros?** El [25](./25-diseño-pantalla-logros.md) pide 38 y hoy hay 7.
→ *Recomendación: 18-22*. Suficiente para que las cinco pestañas tengan contenido, y todos alcanzables
de verdad — un logro que nadie va a ver es peor que no tenerlo.

## Fases

0. **Contadores en `useAchievementsStore`**, con su propia clave de `localStorage`, copiando la forma de
   `vistos` (objeto con todas las claves, mezclado con un `CONTADORES_VACIO` al cargar para que añadir uno
   nuevo no rompa lo guardado por una versión anterior).
1. **La condición genérica en `engine/achievements.js`** + sus tests. Los contadores entran **por el
   contexto**, como todo lo demás: el motor no lee stores.
2. **Los enganches**, que es la fase delicada — dónde se incrementa cada contador y dónde se vuelve a
   evaluar. Ver las trampas.
3. **El contenido** en `achievements.json`, y comprobar que cada logro cae en la pestaña que se espera
   (lo decide `arcoDelLogro`, no un campo).
4. **La pantalla**: `textoRecompensa` para el tipo `ninguna`, y **progreso en la tarjeta** ("12 / 30") para
   los de contador, que sin eso son una condición a ciegas.
5. **Documentación**: [18-sistema-de-logros.md](./18-sistema-de-logros.md), el roadmap y `CLAUDE.md`.

## Trampas concretas de este punto

- ⚠️ **`reiniciarLogros` tiene que borrar también los contadores.** Hoy borra dos claves; con la tercera
  sin borrar, reiniciar la meta-progresión dejaría los contadores llenos y los logros se volverían a
  desbloquear **en el acto**, que es peor que no reiniciar.
- ⚠️ **Una cadena de rondas es UN combate, no tres.** `jugarCombate` resuelve el nodo entero, relevos
  incluidos. Incrementar por ronda inflaría el contador ~2× y ningún test lo cazaría.
- ⚠️ **El oro se suma en cuatro sitios** (`_aplicarVictoria`, dos ramas de eventos y la venta). O se
  engancha un helper único `_sumarOro` —recomendado—, o el logro se redacta para el oro **de combate** y
  se dice en su descripción. Lo que no puede pasar es que cuente tres de las cuatro.
- ⚠️ **Evaluar después de incrementar, pero notificar cuando toque.** Un logro que salta a mitad de la
  animación de combate no puede abrir su toast encima: el patrón que ya existe es devolver los logros
  desbloqueados y que `CombatScreen` los notifique al terminar. Para los que saltan fuera de combate
  (reclutar, tienda) el toast es inmediato y no hay problema.
- **La pantalla no revienta con un tipo de recompensa nuevo**, pero se queda **muda**: `textoRecompensa`
  devuelve `''` y `iconoDeLogro` no encuentra sprite. Es un fallo silencioso, del tipo que ya nos ha
  costado dos bugs — hay que tocar las dos funciones a la vez que se añade el tipo.

## Verificación

La de siempre (arriba), más una específica: **`npm test` es obligatorio** —esto toca `engine/` y los dos
stores— y conviene un test de invariante nuevo en la línea de los que ya hay: *todo logro declara un tipo
de condición y uno de recompensa que el motor y la pantalla conocen*. Es exactamente el fallo que el
proyecto ya ha tenido dos veces (ids contra nombres, pasivas fuera del catálogo) y el más barato de
prevenir.

---

# Plan del punto 10 — Enciclopedia

Es el siguiente porque el 7 está aparcado y de los que quedan es el único que **no necesita ni
contenido nuevo ni decisiones de balance**: toda la información existe ya en los JSON y en el motor,
y hoy no se pinta en ninguna parte. Es solo-lectura, no toca `engine/` ni `store/` (salvo una línea
de `pantalla`), y por tanto no puede romper una run.

Y el punto 13 acaba de agrandar la deuda: la descripción del Raikiri, la de los cascabeles y dos
modos nuevos (Sharingan y Mangekyō) se han escrito en los JSON y **no hay ninguna pantalla donde se
lean**.

## Lo que ya existe (verificado, no supuesto)

| Contenido | De dónde sale | Estado |
|---|---|---|
| Descripción narrativa de cada jutsu | `characters.json` / `enemies.json` | **15/15 y 6/6 la tienen**. No se pinta en ningún sitio desde que se adelgazó la ficha |
| Descripción narrativa de cada objeto | `items.json` | **11/11**. Tampoco se pinta ya |
| Potencia del jutsu | `jutsu.danoBase` | Existe |
| Turnos exactos de carga | `turnosParaCargarJutsu(luchador)` en `engine/combat.js` | Existe, con trampa (ver abajo) |
| Qué hace cada pasiva | `describirPasiva` + `data/passives.json` | Existe, es la fuente única de esas frases |
| Tabla de eficacias de chakra | `data/types.json` (`tablaEficacias`) | Existe, y `RuedaChakra` ya pinta el ciclo |
| Retrato de cada luchador | `assets/characters/` + `characterSprites.js` | Existe |
| Ficha completa de personaje | `FichaPersonaje` | Existe y es la única tarjeta del juego |

**Lo que NO existe y no hay que inventar**: los modos **no tienen campo `descripcion`** — 0 de 31.
Sus claves son `nombre`, `nivelDesbloqueo`, `multiplicadores` y `pasivas`. La pantalla de
transformación ya resuelve esto generando el texto con `describirPasiva` y los multiplicadores, y la
enciclopedia tiene que hacer lo mismo. **No añadir un `descripcion` a 31 modos**: sería contenido
nuevo que hay que escribir, mantener y traducir, para decir lo que el catálogo ya sabe decir.

## ✅ Decidido (2026-08-13): la enciclopedia enseña **solo lo ya visto**

Opción 1 de las tres de abajo. Consecuencias concretas para la implementación:

- Hace falta un **registro de "visto"** persistido, y el sitio es `useAchievementsStore` — ya guarda en
  `localStorage` y ya es el store de meta-progresión entre runs, que es exactamente lo que esto es. No
  va en `useGameStore`: eso se reinicia con cada run y el registro tiene que sobrevivir a perder.
- Cuatro cosas que registrar, cada una en su momento y en el sitio donde ya se sabe: personaje **al
  entrar en el equipo** (`iniciarRun` y `reclutarPersonaje`), enemigo **al pelearlo** (`jugarCombate`),
  modo **al activarse** (el store ya lo detecta para la pantalla de transformación,
  `transformacionesDesbloqueadas`), objeto **al entrar en el inventario**.
- Lo no visto se pinta como silueta con "???", no se oculta: un hueco vacío no dice que haya algo que
  encontrar, y la gracia de la Pokédex es justamente que se vea lo que falta.
- **Orden de trabajo**: las fases 1-3 se hacen con el registro detrás de una constante que lo marque
  todo como visto, y el gateo real es la fase 4. Así la pantalla se ve funcionando antes de tocar un
  store, y si hay que dejarlo a medias se deja en un punto que no rompe nada.

Lo de abajo se conserva porque explica **por qué**, y ese razonamiento vuelve a hacer falta la próxima
vez que se quiera enseñar algo que el juego esconde a propósito.

## La decisión que había que tomar: los spoilers

Es la única pregunta de verdad de este punto, y no es de UI. Las transformaciones se quitaron de las
tarjetas **a propósito**, porque son una sorpresa (ver [30](./30-sistema-de-pasivas.md)), y la
pantalla de transformación existe justamente para ser el momento en que el jugador se entera. Una
enciclopedia que liste los 31 modos de los 15 personajes deshace esa decisión de un plumazo — y con
ella, media razón de ser del punto 4.

Lo mismo, más suave, con los jefes: una ficha de Pain con sus stats y su modo cuenta el final del
juego antes de llegar.

Tres opciones, de menos a más trabajo:

1. **Solo lo visto** (recomendada). Cada entrada se desbloquea al haberla visto en juego: un personaje
   al haberlo tenido en el equipo, un enemigo al haberlo peleado, un modo al haberlo activado, un
   objeto al haberlo tenido. Lo no visto sale como silueta con "???". Convierte la enciclopedia en
   **meta-progresión de verdad** —la misma función que cumple la Pokédex— en vez de un volcado de los
   JSON, y encaja con el punto 5, que va justo detrás. Coste: hace falta persistir qué se ha visto en
   `useAchievementsStore` (que ya persiste en `localStorage`), y eso es lo único de este punto que
   toca un store.
2. **Todo visible menos las transformaciones y los jefes.** Sin estado nuevo, y no estropea ninguna
   sorpresa. Pero deja fuera precisamente "qué hace cada transformación", que es lo que el punto 10
   dice que quiere recuperar.
3. **Todo visible.** Es la más barata y la que contradice el punto 4.

**Mi recomendación es la 1**, y si se quiere partir la sesión: fase 1-3 con la enciclopedia completa
detrás de un registro de "visto" que al principio lo marque todo como visto (una constante), y la
persistencia real como fase 4. Así la pantalla se puede ver funcionando antes de decidir el gateo.

## Fases

**Fase 1 — el hueco de pantalla.** `pantalla: 'enciclopedia'` en el store (la lista de valores está
documentada en un comentario en `useGameStore.js:311`, hay que ampliarla), acción `abrirEnciclopedia`
al lado de `abrirLogros` (`useGameStore.js:791`), rama en `App.jsx` junto a las otras ocho, y un
cuarto icono en `MenuIconos` (`MapScreen.jsx:650`), que hoy tiene Logros, Pantalla completa y
Reiniciar. Vuelve con `volverAlMapa`, que ya existe. Es la fase de 20 líneas que hay que hacer primero
para poder ver cualquier cosa.

**Fase 2 — Ninjas.** Rejilla de retratos → ficha. Reutiliza `FichaPersonaje` tal cual y le añade
debajo lo que la ficha se quitó a propósito: la descripción del jutsu, su potencia y sus turnos de
carga. Aquí es donde vive el 80% del valor del punto.

**Fase 3 — Jutsus y transformaciones, Objetos, Chakra.** Las otras tres secciones. Objetos es casi
gratis (`itemSprites.js` ya tiene sprite, `lineasDeEfecto` ya genera las líneas, y falta solo la
descripción narrativa). Chakra es la `tablaEficacias` en una rejilla de 5×5 más la `RuedaChakra` que
ya existe.

**Fase 4 — el registro de "visto"** (si se elige la opción 1) y la documentación:
`documentacion/32-enciclopedia.md`, más el roadmap y el bloque de estado de `CLAUDE.md`. Si se hace
antes el punto 6, el número libre para su documento de diseño sería el 33.

## Trampas concretas de esta pantalla

- **`turnosParaCargarJutsu` recibe un `luchador`, no un personaje de JSON**, y el resultado **depende
  del nivel y del modo activo** (un modo puede traer `multiplicadorCarga`). O sea que "turnos de carga"
  no es un dato del personaje: es un dato de un personaje **a un nivel**. Hay que elegir un nivel de
  referencia y decirlo en pantalla, o el número miente en cuanto el jugador sube. Lo coherente con el
  resto del juego es enseñarlo al nivel al que lo tiene el jugador si está en su equipo, y a nivel 1
  si no.
- **`describirPasiva` necesita pasivas normalizadas** (`normalizarPasivas` primero). Y `normalizarPasivas`
  **deduplica por id quedándose la mayor cantidad**, así que una lista mezclada de modo + objeto no
  sirve para explicar el modo por separado: hay que normalizar cada fuente por su cuenta.
- **Es una pantalla nueva y `npm test` no cubre React.** La red de seguridad es la prueba manual. Lo
  concreto a mirar: que se abra y se cierre desde el mapa sin perder la run, y que un personaje sin
  sprite de transformación (Kakashi, Sai, Yamato) no deje un hueco roto sino su sprite normal —
  `spriteDeModo` devuelve `null` a propósito para ellos.
- Si se toca `index.css`, la regla de siempre: comprobar que llega al bundle
  (`grep -o "mi-clase[^{]*{[^}]*}" dist/assets/*.css`). Que `npm run build` pase no dice nada.

## Verificación

`npm test` (no debería cambiar: 191, ninguna lógica nueva en motor ni store salvo la línea de
`pantalla`), `npx eslint src` limpio salvo el warning conocido de `MapScreen.jsx`, `npm run build`, y
prueba manual tuya. El simulador no aplica: no hay balance en juego.

---

## Decisiones que hacen falta (contestar antes de implementar, no ahora)

1. ~~**Punto 10 — ¿la enciclopedia enseña todo, o solo lo ya visto?**~~ **Contestado el 2026-08-13:
   solo lo ya visto.** Ver el plan del punto 10, arriba.
2. **Punto 5** — ¿meta-progresión con modificadores numéricos (5b), o solo desbloqueos de contenido?
   Los modificadores mueven el balance de la run entera.
3. **Punto 6** — ¿la pista del efecto se sigue viendo antes de elegir?
4. **Sonido** — sigue en backlog. Es lo que más notaría el jugador de todo lo que queda; si el MVP
   tiene fecha, merece decidirse a propósito y no por omisión.

---

# Plan — Qué del post-MVP debería entrar en el MVP (2026-08-15)

> ⚖️ **Veredicto del usuario, el mismo día: NO a las dos propuestas.** Guardar/continuar la run no entra;
> la transición entre arcos tampoco, *"no sé muy bien cómo llevarlo"* — que es un motivo mejor que un
> problema de tamaño: lo que le falta a ese punto es la **idea** de qué pasa en esa pantalla, no las
> horas. En cambio salió de aquí un punto que no estaba en ninguna lista y que sí entra: el **18, Home
> con selector de campañas** (ver el roadmap).
>
> El documento se conserva entero porque **el análisis sigue siendo cierto aunque la respuesta sea que
> no**, y en dos sitios ya está dando fruto: el hallazgo de que `guardarRun` no guarda el `mapa` está
> anotado en "Descartado", y el de que sin guardado **toda salida de la run la pierde** es lo que obliga
> a que el Home del punto 18 confirme antes de irse. Lo que NO hay que volver a hacer es re-proponer los
> dos puntos: están contestados.

Escrito el día que la lista de puntos se quedó vacía. La pregunta del usuario fue *"de lo que está en
post-MVP, ¿qué recomiendas que sea parte del MVP?"*, y contestarla bien exige un criterio antes que una
lista, porque el backlog está lleno de cosas buenas y **casi ninguna es del MVP**.

## El criterio (tres filtros, y hay que pasar los tres)

1. **Arregla algo que el juego hace MAL hoy**, no algo que todavía no tiene. Un juego al que le falta
   una idea está incompleto; un juego que pierde tu partida está roto. Solo lo segundo es del MVP.
2. **No toca el balance.** Se acaba de recalibrar entero (punto 1 fase 4) y el playtest está a medias:
   meter ahora un nodo nuevo o modificadores de dificultad es invalidar la medición en curso.
3. **No trae contenido que escribir.** Si hay que redactar 15 textos nuevos, es un punto de contenido y
   compite con el playtest, que es lo único que puede decir si el juego se siente bien.

## Recomendación

**Entran dos puntos: el 15 (grande, con dos mitades que se necesitan) y el 16 (pequeño).** El resto del
backlog se queda donde está, y abajo digo por qué uno a uno — que es la parte útil, porque las razones
volverán a hacer falta la próxima vez que alguien mire esa lista.

---

## Punto 15 — La puerta de entrada y continuar la run

Son dos cosas y las presento como una sola porque **la segunda no tiene dónde vivir sin la primera**: si
la run se puede continuar, hace falta un sitio donde pulsar "Continue".

### 15a — La run se pierde entera al recargar

Está en **"Descartado"** con esta razón: *"no compensa la complejidad — las runs son cortas, no hay tanto
que perder si se cierra la pestaña a mitad"*. ⚠️ **Esa frase se escribió cuando la run era UN arco.** Hoy
son tres, ~24 nodos, con animación de combate, pantallas de transformación y de recompensa: entre media
hora y tres cuartos. Perder eso por un F5 no es "no compensa la complejidad", es el peor momento que
puede tener el juego, y encima uno que el jugador no provoca a propósito.

⚠️ **Y hay un descubrimiento que deshace el consuelo del descarte.** El texto dice que *"las funciones ya
existen en el store por si hiciera falta"*, y las funciones existen pero **no pueden funcionar**:
`guardarRun` no guarda el `mapa`, y `App.jsx` decide si hay run mirando precisamente `mapa`. O sea que
cargar una run guardada deja al jugador en la pantalla de selección de personaje, con el equipo cargado y
sin tablero. No es "conectar un hook": es escribir el guardado de verdad, y por eso el punto no es de
media hora.

**Qué se guarda y qué no** — la regla es *guardar el estado, no la pantalla*:

- **Sí**: `equipo`, `oro`, `inventario`, `buffsTemporales`, `mapa`, `nodoActualId`, `arcoActualId`,
  `huboDerrotaEnEsteArco` (si no, se regala el logro de arco sin bajas recargando).
- **No**: `arcoActualDatos` — es el JSON del arco y se **rehace** desde `arcoActualId` con `ORDEN_ARCOS`
  al cargar. Guardar datos derivados es cómo se desincronizan dos copias, la misma razón por la que
  `arcoDelLogro` se calcula y no es un campo.
- **No**: `pantalla`, `ultimoResultadoCombate`, `cadenaEnemigos`, `eventoActual`, `tiendaActual`…
  **Se vuelve SIEMPRE al mapa.** Un combate a medias no se puede reanudar (su resumen es transitorio) y
  no merece la pena inventarlo: el mapa es el único punto estable de la run.

⚠️ **Dónde se guarda es una decisión de diseño, no de implementación: es lo que decide si se puede hacer
trampa.** Si se guarda solo al volver al mapa, recargar a mitad de un nodo devuelve al jugador al mapa
con ese nodo **sin resolver** — o sea, **repetir cualquier jefe hasta que salga bien**. Recomendación:
guardar **dos veces**, al entrar en el nodo (ya marcado como visitado) y al volver al mapa. El coste es
que recargar en mitad de un combate pierde la recompensa de ese nodo; a cambio, no se puede repetir un
combate perdido, que es lo que se llevaría por delante la tensión de la run entera.

### 15b — La meta-progresión solo se ve DURANTE una run

Al arrancar, `App.jsx` va directo a `CharacterSelectScreen`, y esa pantalla no tiene ningún botón:
**Missions, el Bingo Book y los Ajustes solo se abren desde el menú del mapa**. O sea que las tres
pantallas que existen para mirarse *entre* partidas solo son accesibles *dentro* de una partida — justo
cuando el jugador está a otra cosa. Y tras un game over, "New Run" devuelve a la selección de personaje
sin pasar por ninguna de ellas: se acaba de desbloquear un logro y no hay forma de ir a verlo.

Una pantalla de título lo resuelve y de paso es donde vive "Continue" (15a), donde el usuario elige tema
y volumen antes de jugar, y **donde por fin tiene sentido `menu.mp3`**, la pista que `MusicaDeFondo` ya
sabe usar cuando no hay arco y que hoy no se oye nunca porque la selección de personaje dura diez
segundos.

Entradas: **Continue** (solo si hay run guardada), **New Run**, **Missions**, **Bingo Book**,
**Settings**. Reutiliza el kit entero; no hay nada nuevo que dibujar.

### Fases

0. **Guardado real**: reescribir `guardarRun`/`cargarRun` con la lista de arriba, `arcoActualDatos`
   rehecho al cargar, `hayRunGuardada()` para que el título sepa si pintar "Continue". Tests: que una run
   guardada y cargada tiene el mismo mapa y el mismo equipo, que **no** conserva `pantalla`, y que
   `iniciarRun` y el game over **borran** la guardada (o "Continue" resucitaría una run muerta).
1. **Los enganches del guardado**, con la regla anti-trampa: al entrar en el nodo y al volver al mapa.
2. **`TitleScreen`** + `pantalla: 'titulo'` como estado inicial, y las cinco entradas. Las tres pantallas
   de consulta ya existen; lo único que hay que mirar es que **no den por hecho que hay run** (hoy se
   dibujan sobre el mapa: `AchievementsScreen` y `EncyclopediaScreen` usan `volverAlMapa` para cerrarse,
   y desde el título tienen que volver al título).
3. **Salida de la run**: "Abandon run" en Ajustes, con confirmación, que devuelve al título. Sin esto la
   única forma de salir de una run es perderla.
4. Documentación: doc nuevo del guardado + título, roadmap, `CLAUDE.md`.

⚠️ **Trampa conocida**: `localStorage` guarda el mapa entero, que es el objeto más grande de la run.
Conviene mirar el tamaño real una vez (unos pocos KB, no hay problema), pero **más importante es la
versión**: una run guardada por una versión anterior del juego puede tener un mapa con otra forma. Como
mínimo, un número de versión en el guardado y descartarlo si no coincide — es más barato que un bug
irreproducible dentro de tres meses.

---

## Punto 16 — La transición entre arcos

El único del backlog que recomiendo subir tal cual. Hoy, derrotar a Zabuza —el momento más grande de la
run después de ganarla— es **un `<p>` y un botón dentro del cartel de victoria del combate**:
*"You have beaten Land of Waves. A new arc begins."* Y ahí mismo pasan dos cosas que el jugador no ve:
el equipo **revive y se cura entero** (regalo estilo Slay the Spire) y cambia la música.

Es la definición de lo que sí es del MVP: **no falta una idea, está mal contado algo que ya ocurre.** No
toca balance, no toca motor, no hay contenido que escribir más allá de una línea por arco, y reutiliza
lo que ya hizo la pantalla de transformación (que es exactamente el mismo problema resuelto: dar su
momento a algo que se resolvía en un renglón).

Alcance mínimo: pantalla propia entre el combate y el mapa nuevo, con el nombre del arco que se cierra y
el que se abre, el equipo curado a la vista (que es lo que **hoy no se ve**) y el fondo/columna del arco
siguiente. Ni cinemática ni texto narrativo largo.

---

## Lo que NO entra, y por qué

- **Bifurcación riesgo/recompensa (nodo élite).** ⚠️ **Ya existe y se llama pergamino dorado**: un
  combate opcional a nivel fijo contra un legendario, que se gana el 52% en el piso 3 y el 87% en el 6.
  Añadir otro nodo de riesgo no añade una decisión, **duplica la que ya hay** — y encima tocando las
  proporciones de nodo que se acaban de calibrar contra las de Slay the Spire.
- **Nodo `?` (un evento que a veces es combate).** Idea del jugador, y buena, pero llega en el peor
  momento: los eventos **acaban de rediseñarse para ser decisiones con su precio a la vista**, y
  convertirlos a veces en una pelea los devuelve a ser una tirada. Además mueve otra vez los ratios de
  nodo. Se queda aparcado con la razón escrita en [10](./10-generador-de-mapa.md).
- **Modificadores de dificultad entre runs ("ascensión").** Necesita que el balance esté **cerrado**, y
  hoy está en playtest. Es el clásico multiplicador sobre una base que todavía se mueve.
- **Más logros.** Ya no es un punto: con `contadorMinimo` y `coleccionMinima` es escribir datos. Se hace
  cuando apetezca, sin plan.
- **5b — recompensas numéricas permanentes.** Sigue descartado, y con más razón desde que el 5a
  demostró que la pantalla funciona sin ellas.
- **Campañas, cuentas/guardado remoto, tests de componentes React.** Post-MVP de verdad: los dos primeros
  son productos distintos y el tercero es infraestructura para bugs que este proyecto no ha tenido — los
  suyos han estado todos en motor y store, que es donde están los 275 tests.

## Orden sugerido

**El playtest sigue siendo el 1.º** — nada de esto es más urgente que saber si el juego se siente bien, y
además el 15 es justo lo que hace cómodo jugar runs largas seguidas. Luego el **15** (que es el que
convierte "una demo que se abre y juegas" en "un juego que abres, sigues y cierras") y por último el
**16**, que es una tarde.

⚠️ Y una advertencia de método, porque este documento ya se ha equivocado dos veces igual: **el 15 parece
pequeño y no lo es** (el guardado que "ya existía" no funciona), y **el 16 parece grande y no lo es**
(una pantalla sin lógica). Es el mismo error que con el sonido, al revés y del derecho.

---

# Plan de cierre — de aquí al 6 de septiembre (escrito el 2026-08-15)

**El objetivo cambia las prioridades, así que va primero.** Esto no es "terminar un juego": es
**demostrar qué da un mes de trabajo intermitente con Claude**. Primer commit el 2026-08-06, entrega el
2026-09-06. Hoy quedan **22 días** y se ha trabajado en **10 días distintos** (53 commits), o sea que lo
realista es **entre 8 y 12 sesiones más**.

## Qué es el entregable de verdad (y por eso se reordena el roadmap)

No es el juego más completo posible. Son tres cosas, y solo la primera está a medias:

1. **Un enlace que un desconocido abre y juega en cinco minutos.** Hoy el juego **solo existe en
   `npm run dev`**: nadie que no clone el repositorio puede verlo.
2. **Una portada que se pueda juzgar sin ejecutar nada.** Hoy el `README.md` es la plantilla de Vite.
3. **Un juego que no parezca sin terminar en los cinco primeros minutos** — que no es lo mismo que estar
   equilibrado hasta Pain.

De ahí salen dos reordenaciones que van contra el orden "natural" del roadmap:

- ⚠️ **El punto 17 (publicar) pasa de último a PRIMERO.** Un despliegue desconocido a 22 días es un
  riesgo; a un día, es el fracaso. El bug del `base` —página en blanco, sin error— se lleva una tarde
  entera él solo. Y publicar pronto tiene un segundo efecto más grande que el primero: **a partir de
  ahí cada sesión publica**, y se le puede pasar el enlace a otra gente, que es la única forma de
  conseguir playtest que no sea el del propio autor.
- **El punto 19 (README) es el segundo entregable, no un adorno.** Los números ya existen y no hay que
  inflarlos: 275 tests, 38 documentos de diseño, ~9.700 líneas de código y ~3.200 de tests, 53 commits
  en 10 días de trabajo.

## El arte, que es la pieza lenta — y la mitad no es arte

⚠️ **Parte de lo que está en "Pendiente de arte" es trabajo de script disfrazado de dibujo**, y eso
cambia quién lo hace y cuánto cuesta. El caso claro: **el proyectil de jutsu de los genin rivales ya
está dibujado** (última casilla de cada panel de la fila 5) y lo que falla es que el script coge el
primer fotograma. Son los enemigos de la mayoría de los combates, o sea el sprite que más se ve del
juego, y no hace falta dibujar nada.

Lo que sí es dibujo de verdad son **los 9 iconos** (5 de chakra + 4 del menú). Y aquí va la
recomendación incómoda: **si el calendario aprieta, se entregan con emoji**. Es lo único de la interfaz
sin dibujar, casi nadie lo mira, y sacrificarlo cuesta mucho menos que quedarse sin portada o sin
enlace. **Fecha de corte: si el 25 de agosto no están, no entran**, y el punto 16 se hace igual con los
iconos actuales (el marco a CSS no depende de ellos).

## Orden propuesto

| Sesión | Qué | Por qué ahí |
|---|---|---|
| **1 (la siguiente)** | **17 — publicar** + el proyectil de los genin si sobra rato | Convierte el proyecto en algo que se puede enseñar. Desactiva el riesgo del despliegue cuando todavía da igual |
| **2** | **19 — README** | Segundo entregable. Con el enlace ya existiendo, se escribe una vez |
| **3** | **16 — menú vertical** | Requisito del 18 y mata el último `window.confirm` del juego |
| **4** | **18 — Home + `campaigns.json`** | La primera pantalla que ve un visitante. Es lo que hace que parezca un producto y no una demo |
| **5-7** | **15 — arte que llegue** + **7 — playtest** | En paralelo: el dibujo es suyo, la integración es de script |
| **1-6 sept** | **Congelación** | Ni un sistema nuevo. Solo bugs del playtest, retoques y volver a publicar |

⚠️ **La congelación no es prudencia, es la lección de este propio roadmap**: los últimos cinco puntos
han descubierto trabajo al abrirlos (el guardado que no guardaba, el menú clavado a cuatro entradas, la
evaluación única de los logros). Un punto nuevo abierto el 2 de septiembre no se sabe lo que mide.

## Dónde poner el playtest, que es lo único sin fecha

Con el enlace publicado, el playtest deja de ser una tarea de sesión y pasa a ser continuo. Y para este
objetivo se mira **una cosa concreta**: **los diez primeros minutos**. Un visitante ve el arco 1 y poco
más; que Pain esté equilibrado al 85% no lo va a comprobar nadie. Zabuza sí — es el jefe con menos
margen y el único que casi todo el mundo va a pelear.
