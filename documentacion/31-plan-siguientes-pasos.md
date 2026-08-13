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
> **Siguiente punto a implementar: el 5a (contenido y condiciones de logros).** Su plan está al final
> de este documento. Y ojo, que la sección "5 — Logros" de más abajo se escribió antes de que existiera
> la pantalla: **5c ya está hecho y el campo `categoria` se decidió NO añadirlo** — lo dice también ahí,
> corregido en su sitio.

## Orden recomendado

| # | Punto | Por qué ahí | Tamaño | ¿Toca motor/store/datos? |
|---|---|---|---|---|
| 1.º | **7 — Playtest** | Va en paralelo y lo hace el usuario: desde el último han cambiado el balance de los jefes, la frecuencia y rareza de los reclutas, el final del combate, todas las tarjetas de personaje y el roster. Su triaje entra por delante de cualquier punto empezado | 1 sesión corta (jugar) + lo que salga | No (salvo lo que aparezca) |
| ~~2.º~~ | ~~**13 — Kakashi + cascabeles**~~ | **HECHO el 2026-08-13** — desarrollo en [05-roadmap.md](./05-roadmap.md) y calibración en [11](./11-progresion-y-arcos.md) | — | Fueron tres ficheros de datos |
| ~~3.º~~ | ~~**10 — Enciclopedia**~~ | **HECHO el 2026-08-13** — ver [32](./32-enciclopedia.md) | — | No (solo lectura) |
| 2.º | **5a — Logros: contenido y condiciones** | *Lo siguiente.* La pantalla ya está (5c) y en estilo; lo que le falta no es diseño sino **material que enseñar**. Y el registro de vistos ya dejó montado en `useAchievementsStore` el patrón exacto que necesitan sus contadores | Media | Sí — `achievements.json`, `engine/achievements.js`, los dos stores |
| 5.º | **6 — Eventos** | No se puede planificar todavía: es el **único punto sin documento MVP**. Antes hay que escribir qué se quiere de esa pantalla | Pequeña + doc previo | No |
| 6.º | **9 — Columna central** | Cosmético y acotado. Buen cierre de sesión o relleno cuando quede medio hueco | Pequeña | No |

**Fuera de la lista y más importante que la mitad de ella: el sonido.** Vive en el backlog porque no
es un retoque de pantalla sino un sistema entero (assets, precarga, mezcla, volumen). Los ganchos ya
existen: cada evento del historial de combate dice si fue básico o jutsu, si impactó y qué pasivas
saltaron.

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
