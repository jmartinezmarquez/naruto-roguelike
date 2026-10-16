# Meta-progresión: pergaminos, gacha, maestría y actos variables (diseño)

> **Estado: en marcha** (2026-10-15), fase a fase y un cambio por commit. Recoge lo acordado con el usuario tras el
> playtest: *"el juego se siente bien, pero falta un gancho que te haga volver a jugar"*. Los números
> son un punto de partida calculado sobre la estructura actual de la run; se ajustan midiendo, como el
> resto del balance.

## El problema

Lo que hoy hace volver: 28 logros (18 de ellos **sin recompensa**), la ascensión (5 escalones), el
Bingo Book y el Salón de la Fama. Falta lo que tienen los roguelites que enganchan: **algo que avance
en cada partida, también al perder**, y **variedad** — hoy la run son siempre los mismos tres arcos, con
los mismos jefes, en el mismo orden.

## Las cinco piezas

1. **Pergaminos de invocación**: la moneda. Se ganan en cada run según hasta dónde llegas.
2. **El gacha** ("Invocación"): se gastan en tiradas que dan personajes, objetos iniciales y otras
   cosas **nuevas**. Puede dar duplicados.
3. **Nivel de ninja (maestría)**: cada personaje acumula XP entre runs; los duplicados del gacha le
   suben de nivel. Los **aspectos y títulos salen de la maestría**, no del gacha.
4. **Más logros**, que dan pergaminos.
5. **Más contenido y actos variables**: héroes y villanos nuevos, y una campaña donde cada acto puede
   salir de varios arcos.

Y dos extras baratos para volver cada día: el **desafío diario** y los **retos opcionales** por run.

⚠️ **Regla de oro: el gacha reparte cosas NUEVAS, nunca encierra lo que hoy está abierto.** Todos los
comunes se pueden reclutar desde la primera run; meterlos detrás del gacha quitaría algo que el jugador
ya tenía, y eso se vive como un castigo, no como un aliciente.

---

## 1. Pergaminos de invocación

### Cuántos se ganan

| Fuente | Pergaminos |
|---|---|
| Mini-jefe derrotado | 2 |
| Jefe final derrotado | 4 |
| Run ganada | +6 |
| Ascensión | ×(1 + 0,2 × nivel): A5 dobla |
| Reto opcional activo | +25% por reto (ver §6) |
| Desafío diario (primera vez del día, gane o pierda) | +5 |
| Primera vez que derrotas a un jefe | +3 (una vez por jefe, en toda la partida guardada) |
| Logros | 2-6 cada uno, todos (ver §4) |

Con la estructura actual (3 arcos, mini-jefe y jefe final en cada uno):

| Run típica | Pergaminos |
|---|---|
| Cae en el arco 1 antes de Zabuza | 2 |
| Cae en el arco 2, contra Gaara | 2 + 4 + 2 = **8** |
| Cae en el arco 3, contra Pain | 2 + 4 + 2 + 4 + 2 = **14** |
| Gana la run (A0) | 18 + 6 = **24** |
| Gana en A5 | **48** |

⚠️ **Doblado el 2026-10-16** para que el summon sea la mecánica recurrente: una run ganada pasa de 2 a ~5 tiradas, y caer contra Gaara ya da para una y media. La maestría también se aceleró (XP por combate 1 → 2, coste por nivel 40 → 30): el primer aspecto, a nivel 4, llega en unas tres runs ganadas con el mismo ninja en vez de seis.

Los primeros jefes derrotados y los logros fáciles dan además un empujón inicial de ~40-60 pergaminos
en las primeras runs, que es justo cuando más hay que enganchar.

### Por qué así

- **Perder también suma.** Una run perdida en el arco 2 da casi una tirada: la sensación de "una más".
- **Ganar cuenta mucho más** (12 frente a 4) sin que perder sea inútil.
- **La ascensión paga**: es el motivo para subir de escalón además del logro.

---

## 2. El gacha: "Invocación"

Una pantalla nueva en el Home (junto a Missions, Bingo Book y Hall of Fame).

### Precio y probabilidades

| | |
|---|---|
| Una tirada | 5 pergaminos |
| Diez tiradas | 45 pergaminos (una gratis) |
| Probabilidades | Común 60% · Raro 30% · Legendario 10% |
| Garantía de raro | como mínimo un raro o mejor cada 10 tiradas |
| Garantía de legendario | un legendario como mucho cada 30 tiradas |

**Probabilidades a la vista** en la propia pantalla, con el contador de la garantía. Es la regla de los
eventos (documentacion/35): esconder las reglas no es tensión, es trampa.

### Qué puede salir

| Categoría | Ejemplos | Rareza | Disponible |
|---|---|---|---|
| **Personaje nuevo** (entra en el pool de reclutables y como inicial) | Gai, Asuma, Kurenai, Jiraiya, Tsunade, Temari, Kankurō, Konohamaru | raro / legendario | fase 3 |
| **Personaje como inicial** (los que hoy solo se consiguen jugando) | Yamato, Kakashi, los jefes desbloqueados por logro | raro / legendario | fase 2 |
| **Objeto inicial** (se elige uno al empezar la run) | Soldier Pill, Chakra Seal, Ankle Weights… | común | fase 2 |
| **Página del Bingo Book** con historia del personaje | — | común | fase 2 |

Al estrenar el gacha (fase 2) el catálogo tiene **~25 cosas**; con la primera tanda de personajes
nuevos (fase 3), **~35**.

### Duplicados

**Puede dar duplicados**, y no se tiran:

- **Personaje repetido → +1 nivel de ninja** (§3). Es la forma rápida de subir a tu favorito.
- **Objeto o página repetidos → se devuelven 2 pergaminos** (el 40% de la tirada).

### Cuánto dura

Con ~35 cosas, probabilidades por rareza y duplicados, sacar todo el catálogo cuesta del orden de
**100-120 tiradas** (≈ 500-600 pergaminos). A una media de 6-8 pergaminos por run más los logros,
son **~60-80 runs**: más o menos lo que dura el desbloqueo completo de un roguelite como Slay the Spire,
y cada tanda nueva de personajes lo alarga. Las primeras runs dan una tirada casi cada partida, que es
lo que engancha al principio.

---

## 3. Nivel de ninja (maestría)

Cada personaje tiene un **nivel de ninja** propio, entre runs, distinto del nivel dentro de la run.

### Cómo sube

| Fuente | XP de ninja |
|---|---|
| Combate ganado con él en el equipo | 1 |
| Jefe derrotado con él en el equipo | 5 |
| Run ganada con él en el equipo | 20 |
| **Duplicado en el gacha** | **+1 nivel directamente** |

Nivel *n* → *n+1* cuesta 40 × *n* XP. Tope: nivel 10.

✅ *Hecho (XP y niveles): `engine/maestria.js`, `config.maestria`, XP por personaje en
`useAchievementsStore.maestria` (octava clave persistida; solo se guarda la XP, el nivel se deduce) y
el panel "Ninja mastery" del Game Over. Una run ganada lleva a un ninja hacia el nivel 2; el 10 son unas
30 runs ganadas con él, menos con duplicados. Un duplicado da exactamente la XP que falta para subir un
nivel (`xpParaSubirUnNivel`), así no hay un segundo contador que pueda discrepar.*

✅ *Hecho (títulos y marco): `src/data/maestria.json` (títulos genéricos en los niveles 2, 6 y 10, y
propios de algunos ninjas en el 10: "Copy Ninja", "Handsome Green Beast"…; `nivelMarco: 8`),
`tituloDeMaestria` en el motor, la insignia "Ninja Lv.N · título" en la selección y en el Bingo Book, y
el marco dorado en la tarjeta de selección. ⚠️ Las funciones van en `common/nivelDeNinja.js` y no en un
`maestria.js` junto a `Maestria.jsx`: en Windows serían el mismo fichero y el import se cruzaba.*

✅ *Hecho (aspectos, código): `aspectos` en `maestria.json` (nivel 4 y 10), `aspectosDesbloqueados` en
el motor, el aspecto elegido de cada ninja en `useAchievementsStore.aspectosElegidos` (novena clave
persistida, la borra `reiniciarLogros`) y `SelectorAspecto` en la ficha del Bingo Book. `spriteDeLuchador`
devuelve el aspecto elegido en TODAS las pantallas, combate incluido; las transformaciones no cambian.
Los dibujos se buscan con `import.meta.glob` en `assets/aspects/`: **un aspecto sin dibujo no se
ofrece**, y un ninja sin ninguno no enseña selector. ⏳ Arte: hojas 36-42 del documento 41 (21 ninjas ×
2, villanos incluidos).*

### Qué da

| Nivel | Recompensa |
|---|---|
| 2 | Primer título ("Genin de la Hoja", "Bestia Verde de Konoha"…) |
| 4 | **Primer aspecto alternativo** (traje de Shippūden) |
| 6 | Segundo título |
| 8 | Marco de tarjeta especial en el Bingo Book y en la selección |
| 10 | **Segundo aspecto** (versión de élite) y título de maestro |

✅ **Decidido: la maestría NO da poder**, solo aspectos, títulos y marcos. El juego está calibrado contra niveles de enemigo fijos (documentacion/11), y un ninja que se
hace más fuerte entre runs rompe esa calibración y vacía de sentido la ascensión. Si se quiere algo de
poder, el límite razonable sería **elegir un objeto inicial propio** del personaje al nivel 8, medido con
el simulador antes de darlo por bueno.

---

## 4. Más logros

Los 18 logros "de honor" pasan a dar **2-5 pergaminos** según su dificultad. Y unos 20 nuevos:

**Por personaje** (dan ganas de probar a cada ninja):
- Gana una run con Shikamaru de líder.
- Derrota a Zabuza con Sasuke en el equipo.
- Completa un arco sin que caiga Hinata.
- Gana una run con un equipo de tres comunes.
- Llega al nivel de ninja 5 con cualquier personaje · con 5 personajes distintos.

**De reto:**
- Gana una run sin pisar ninguna tienda.
- Derrota a un jefe final sin relevos (el primero lo gana solo).
- Gana una run sin usar ningún consumible.
- Supera el desafío diario 7 días distintos.

**De colección:**
- Completa el Bingo Book (todo visto).
- Consigue los dos aspectos de un personaje.
- Saca 10 legendarios en el gacha.

Hacen falta **tres condiciones nuevas** en `engine/achievements.js` (hoy hay cinco): "con este personaje
en el equipo / de líder", "sin X en la run" (tiendas, consumibles, relevos) y "nivel de ninja mínimo".
Con ellas, cada logro nuevo vuelve a ser solo datos.

---

## 5. Más contenido y actos variables

### La campaña pasa de lista de arcos a lista de ACTOS

Hoy `campaigns.json` es una lista fija de tres arcos. Pasa a ser una lista de **actos**, y cada acto, un
**pool de arcos**; al empezar la run se sortea uno por acto:

| Acto | Niveles | Arcos posibles |
|---|---|---|
| 1 | 1-10 | País de las Olas · *(más adelante: una misión de rango C)* |
| 2 | 17-27 | Examen Chūnin · **Persecución de Sasuke** (nuevo) |
| 3 | 33-44 | Invasión de Pain · **Rescate de Gaara** (nuevo) · **Hidan y Kakuzu** (nuevo) |

⚠️ **Un arco se calibra para su ACTO, no por su cuenta.** Los niveles de enemigo son fijos
(documentacion/11): un arco nuevo del acto 2 tiene que pelearse a los niveles del acto 2, o la curva de
niveles de la run se rompe. Por eso cada arco nuevo nace con su acto decidido y se mide con el
simulador como los que hay.

### Villanos para los arcos nuevos

| Arco (acto) | Mini-jefe | Jefe final | Enemigos nombrados |
|---|---|---|---|
| Persecución de Sasuke (2) | Jirōbō o Kidōmaru | **Kimimaro** | Sakon/Ukon, Tayuya |
| Rescate de Gaara (3) | Sasori | **Deidara** | Marionetas, arcilla |
| Hidan y Kakuzu (3) | Hidan | **Kakuzu** | — |

Más adelante: **Itachi y Kisame** (acto 2 o 3) y **Orochimaru** (la invasión de Konoha durante el
examen). Como los jefes de hoy, los villanos se pueden **desbloquear como reclutables** por logro o, como
legendarios, por el gacha.

### Héroes nuevos

Gai, Asuma, Kurenai, Jiraiya, Tsunade, Temari, Kankurō, Konohamaru. Entran en el gacha (§2) y, una vez
sacados, en el pool de reclutables de su acto.

**Coste de un personaje nuevo**: datos (personaje, jutsu, modos con pasivas del catálogo) más **una
hoja de arte** (base + transformaciones en la misma hoja, ver documentacion/41) y un proyectil. Con
Kakashi fueron tres ficheros de datos; el arte ya tiene su proceso montado. Cada uno se calibra por su
**puesto** entre los candidatos a la posición 1 (la regla de Kakashi, documentacion/11) y con el bloque
"Fuerza de cada personaje" del simulador.

---

## 6. Para volver cada día

- **Desafío diario**: una run con el mapa y las ofertas generados con la **fecha como semilla**. El mismo
  para cualquiera ese día, sin servidor. Da +3 pergaminos la primera vez y tiene su propio récord.
- **Retos opcionales al empezar** ("enemigos +20%", "sin descansos", "solo dos personajes"…): cada uno
  activo da **+25% de pergaminos**. La ascensión es una escalera; esto son elecciones, y se combinan.

---

## Plan por fases

| Fase | Qué | Tamaño |
|---|---|---|
| **1** | Pergaminos (fuentes y tabla de §1), recompensa al acabar la run, logros con recompensa y ~20 nuevos con sus 3 condiciones | 1-2 sesiones |
| | ✅ *14 logros nuevos (por personaje y de reto) con `derrotarJefe` ampliado y el tipo nuevo `ganarRun`. Los de maestría, gacha y diario, con su fase.* | |
| | ✅ *Los 18 logros de honor dan pergaminos (2-5), cobrados una vez, retroactivos al cargar.* | |
| | ✅ *Pergaminos por run: hechos (`engine/pergaminos.js`, `config.pergaminos`, saldo en `useAchievementsStore.pergaminos`, desglose en el Game Over, saldo en el Home).* | |
| | ✅ *Fase 1 completa.* | |
| **2** | Pantalla de Invocación con probabilidades, garantías y duplicados; catálogo inicial (iniciales, objetos iniciales, páginas); nivel de ninja y sus recompensas | 2 sesiones |
| | ✅ *Gacha: `engine/invocacion.js` (tiradas y garantías, puro), `data/invocacion.json` (precios, probabilidades y catálogo: 8 ninjas como inicial —Yamato, Kakashi y los seis jefes— y 9 objetos iniciales), `useAchievementsStore.invocar` (cobra, aplica duplicados, décima clave persistida) y la ventana `Summon/InvocacionScreen.jsx` desde el Home. Lo ya conseguido por un logro cuenta como repetido. Los jefes, por primera vez, se pueden elegir como inicial. Icono: hoja 43 del documento 41.* | |
| | ✅ *Objeto inicial: uno al azar entre los desbloqueados (logros + gacha), anunciado en el toast del mapa.* | |
| | ✅ *Páginas del Bingo Book: 21 historias (`data/bingo-book-pages.json`) como premio común; se leen en la ficha del ninja.* | |
| | ✅ *Logros de maestría y gacha (6): nivel de ninja 5 y 10, 50 tiradas, 10 legendarios, Bingo Book completo, colección completa. **Fase 2 completa**, salvo el arte (hojas 36-43).* | |
| **3** | Primera tanda de personajes nuevos (3-4 héroes) con su arte | 1 sesión + arte |
| | ✅ *Datos de Might Guy y Jiraiya (legendarios) y Asuma y Kurenai (raros), calibrados en el bloque 5 del simulador (Gai 0,82 y Jiraiya 0,83 frente a Kakashi 0,80; Asuma 0,66 y Kurenai 0,62 frente a Yamato 0,68), con su página del Bingo Book. Solo salen del gacha y, una vez conseguidos, se reclutan en cualquier arco. ⏳ Arte: hojas 44-48 del documento 41; hasta entonces llevan `pendienteDeArte` y el juego no los enseña.* | |
| | ✅ *Segunda tanda: Tsunade (legendaria, 0,85), Temari (0,65), Kankuro (0,69) y Konohamaru (0,62), con sus páginas y su entrada en el gacha. **Los ocho héroes del plan están en datos.** ⏳ Arte: hojas 66-70.* | |
| **4** | Actos variables (campaña por actos) y el primer arco nuevo con sus villanos | 2 sesiones + arte |
| | ✅ *Campaña por actos: `actos[].arcoIds` en `campaigns.json`, sorteo de un arco por acto al empezar la run (`engine/campanas.js`), con test de que los arcos de un acto comparten niveles. Falta el primer arco nuevo.* | |
| | ✅ *Arco **Sasuke Retrieval** (acto 2, alternativo al Examen Chunin) en datos: Jirobo (mini-jefe, raro), Kimimaro (jefe final, legendario), tres entrenadores del Sonido con `arcoId` (solo salen en su arco: `entrenadoresDelArco`), cinco eventos, páginas y entrada en el gacha. Medido con `node scripts/simular-combates.mjs persecucion_de_sasuke`: Jirobo como Kabuto (36% 1 vs 1, 90% en cadena frente a 92%) y Kimimaro como Gaara (14% los dos; 89% en cadena frente a 96%; 100% con el equipo de primera run frente a 91%). ⏳ Arte: hojas 49-54; hasta entonces no está en la campaña. Pendiente al activarlo: logros "derrota a Jirobo/Kimimaro" que los desbloqueen como reclutables (si se añaden antes, Missions pide algo imposible).* | |
| | ✅ *Arco **Kazekage Rescue** (acto 3, alternativo a la Invasión de Pain) en datos: Sasori (mini-jefe, raro), Deidara (jefe final, legendario, acaba la run como Pain), dos entrenadores (Puppet Brigade, Clay Spiders), cinco eventos. Medido: Sasori 36% 1 vs 1 y 100% en cadena (Camino Animal 43% y 98%); Deidara 21% y 98% (Pain 21% y 93%), algo más duro en A3-A5 (82% frente a 89%). ⏳ Arte: hojas 55-60.* | |
| | ✅ *Arco **The Immortal Duo** (acto 3, alternativo a la Invasión de Pain): Hidan (mini-jefe, raro) y Kakuzu (jefe final, legendario, acaba la run), sin entrenadores propios, cinco eventos. Medido: Hidan 29% 1 vs 1 y 100% en cadena; Kakuzu 21% y 91% (Pain 21% y 93%). ⚠️ Kakuzu es el jefe final más duro en A3-A5 (68% frente a 89%): su aguante pesa más cuando la ascensión endurece al jefe. Si en playtest molesta, se toca su modo de nivel 40. ⏳ Arte: hojas 61-65. **Con esto, cada acto 2 y 3 tiene dos y tres arcos posibles en cuanto llegue el arte.*** | |
| | ✅ *Arco **Land of Snow** (acto 1, alternativo al País de las Olas): Fubuki (mini-jefe, como Haku) y Doto Kazahana (jefe final, como Zabuza, con dos modos a nivel 8 y 20), Nadare y Mizore de entrenadores, cinco eventos. Como es el acto de la primera run, calca a Haku y Zabuza: el simulador da lo mismo en todos los bloques (Fubuki 86% 1 vs 1, Doto 71%; sin muros en primera run). ⏳ Arte: hojas 75-80.* | |
| **5** | Desafío diario y retos opcionales | 1 sesión |
| | ✅ *Retos opcionales: `data/retos.json` (enemigos duros, descansos al 50%, mitad de oro, equipo de dos), `engine/retos.js`. Usan las claves de la ascensión y se multiplican con ella; `tamanoEquipo` baja el equipo máximo (`obtenerTamanoEquipo`). Cada uno da +25% de pergaminos (`config.pergaminos.multiplicadorPorReto`). Se eligen en el Home, bajo la ascensión, y se abren con ella (ganando una run).* | |
| | ✅ *Desafío diario: `engine/azar.js` (semilla FNV-1a de la fecha + mulberry32), un azar por run en el store (`azarDeLaRun`) que pasa al generador de mapa, al combate, a los eventos y a las ofertas; sin ascensión ni retos. +3 pergaminos la primera vez del día (`config.pergaminos.porDesafioDiario`) y récord del día en `useAchievementsStore.diario` (undécima clave). Panel en el Home. ⚠️ El mapa es el mismo para todos, pero lo que depende de tu colección (el objeto inicial, los reclutables) no puede serlo. **Fase 5 completa.*** | |

Cada fase se juega sola: la 1 ya da progreso; la 2 ya engancha con lo que hay; la 3 y la 4 son las que
lo mantienen vivo.

✅ **Arte integrado el 2026-10-16** (hojas 36-71): aspectos de los 21 ninjas, los ocho héroes, los tres
arcos nuevos con sus jefes y entrenadores, el icono del Summon y la ilustración del diario. Ya no queda nada
con `pendienteDeArte`, y la campaña sortea **dos arcos en el acto 2** (Chunin Exams / Sasuke Retrieval) y
**tres en el acto 3** (Pain's Invasion / Kazekage Rescue / The Immortal Duo).

## Decisiones (tomadas el 2026-10-15)

1. **La maestría NO da poder**: solo aspectos, títulos y marcos. Protege la calibración de niveles fijos
   y el sentido de la ascensión.
2. **El objeto inicial sale AL AZAR** entre los desbloqueados, sin elegir.
3. **Los villanos reclutables también tienen aspecto alternativo**, no solo los héroes.

4. **Todo logro paga en pergaminos** (2026-10-16): el gacha es la mecánica principal. Lo que los logros
   desbloqueaban (jefes, Yamato, objetos iniciales) sale ahora del gacha. Ver documentacion/18.

El arte que va haciendo falta se pide en documentacion/41, como hojas numeradas.
