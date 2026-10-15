# Progresión de nivel y arcos del MVP

El MVP tiene **3 arcos**, jugados en una única run continua. Una run va de nivel 1 a ~51;
`config.progresion.nivelMaximo: 100` es solo un techo teórico que nadie alcanza jugando.

| Arco | Archivo | Pisos | Niveles | Mini-jefe (nivel fijo) | Jefe final (nivel fijo) |
|---|---|---|---|---|---|
| País de las Olas | `arcs/pais-de-las-olas.json` | 8 | 1 → 10 | Haku (3) | **Zabuza (10)** |
| Examen Chunin | `arcs/examen-chunin.json` | 8 | 17 → 27 | Kabuto (19) | **Gaara (27)** |
| Invasión de Pain *(licencia creativa)* | `arcs/invasion-de-pain.json` | 8 | 33 → 44 | Camino Animal de Pain (36) | **Pain, Camino Deva (44)** |

Los saltos entre arcos (10 → 17, 27 → 33) los da la XP del jefe final del arco anterior. Dentro de
un arco el jugador va 1 nivel por debajo del enemigo en los primeros pisos y 2-4 por encima tras el
mini-jefe, y llega a los dos jefes **a su mismo nivel**.

## Historia del sistema de nivel de enemigo (importante para no repetir el error)

Este sistema pasó por 3 versiones. Documentado para que quien lo toque en el futuro no repita el mismo ciclo de errores.

**v1 — Fórmula aditiva por piso, mal calibrada.** `nivel = nivelEnemigoBase + (piso-1)*escaladoNivelPorPiso`.
El bug: se calibró contando **todos los nodos de todos los pisos** como si el jugador los
recorriera todos. En la realidad, un roguelike recorre **un único camino** (un nodo por piso, no
todos) — el número real de combates es mucho menor de lo que parecía mirando el mapa entero.
Resultado: llegabas a Zabuza (calibrado para nivel 15) siendo nivel 3. Imposible de ganar.

**v2 — Escalado dinámico según el nivel del jugador.** `nivel enemigo = nivel jugador + ajuste`.
Soluciona el crash inmediato, pero **rompe el sentido de subir de nivel**: si el rival siempre
escala contigo, nunca estás más preparado en términos relativos por mucho que subas (el
"problema de Oblivion"). Se descartó tras feedback directo: *"si el sistema de niveles pierde el
sentido porque siempre vas a tener combates más difíciles"*.

**v3 (actual) — Fórmula fija, recalibrada con el número REAL de combates.** Se volvió al sistema
fijo por piso, pero esta vez el cálculo usa combates de un único camino (`(pisos-1) * peso_combate
/ peso_total`), no la suma de todos los nodos. Los mini-jefes/jefes tienen un **nivel fijo
explícito** (`arco.nivelMiniJefe` / `arco.nivelJefeFinal`), calculado para que el "camino mínimo"
(un jugador que se salta todo lo opcional) siempre pueda ganarles, con solo +1 de margen sobre el
nivel que ese camino mínimo alcanza de forma garantizada. Ver la simulación completa más abajo.

`engine/mapGenerator.js`:
- `calcularNivelPorPiso(piso, arco)` — combates normales, escalado aditivo fijo.
- `resolverEnemigoDeNodo(nodo, arco)` — combate normal usa `calcularNivelPorPiso`; mini-jefe/jefe
  usan `arco.nivelMiniJefe`/`arco.nivelJefeFinal` directamente, sin fórmula.

## Los 3 arcos miden 8 pisos (decisión de UI, con coste de balance)

Los arcos 2 y 3 tenían 10 y 12 pisos. Se bajaron a 8, como el arco 1, porque el mapa se escala para
caber entero en el viewport (ver [13](./13-ui-mapa-y-combate.md)) y a partir de 8 pisos los nodos
salían demasiado pequeños para verse. `pisoMiniJefe` pasa a 4 y `pisoJefeFinal` a 8 en los tres.

**Recalibrado en la fase 4 del rediseño de balance** (ver más abajo). Durante mucho tiempo los
niveles de los arcos 2 y 3 siguieron siendo los de cuando medían 10 y 12 pisos.

## Curva de XP (corregida — la original era matemáticamente inviable)

La curva original (`crecimiento: 1.12`, exponencial) necesitaba **24,8 millones de XP** para
llegar a nivel 100. Toda la run genera, como mucho, ~5.000 XP. Corregida a `crecimiento: 1.015`
(bases 17-24 según personaje).

## v4 — Recalibración con el nivel del jugador CALCULADO, no supuesto

El error que cerró esta versión es el mismo de v1 con otra cara: nadie estaba comprobando a qué
nivel llega el jugador de verdad. `scripts/simular-combates.mjs` *interpolaba* el nivel del jugador
entre los niveles de jefe del arco — es decir, daba por buena la conclusión que tenía que demostrar.

Con la XP real medida (`nivelesEstimadosDeLaRun` en `engine/leveling.js`), el jugador llegaba a
**Zabuza (Nv.4) siendo nivel 9, a Gaara (Nv.24) siendo 34 y a Pain (Nv.49) siendo 70**. Los
combates comunes se ganaban el 99-100% de las veces con el 91-98% del HP intacto: no eran combates.
Y el mini-jefe era la pelea más dura de cada arco, porque se pelea *antes* de que caiga su propia
XP, que era la que te catapultaba.

La causa: **la economía de XP**, no la curva de stats. Un combate común daba 20 XP y un jefe entre
150 y 2000. Haku solo te subía de nivel 1 a 8.

Lo que se cambió:

- **XP común por arco** (`arco.xpCombateComun`: 65 / 80 / 100). Las 5 plantillas genéricas se
  reutilizan en los tres arcos y no declaran `recompensa`, así que sin esto un enemigo del arco 3
  daba lo mismo que uno del 1. El store lo lee en `_aplicarVictoria`, detrás de lo que declare el
  enemigo. Los enemigos nombrados (Zaku, Dosu, Kin) perdieron su XP propia y cobran la del arco:
  eran comunes con nombre y daban menos que un genérico.
- **XP de jefe** bajada de 150/450/220/900/700/2000 a 100/165/125/210/160/300. La del jefe final de
  arco sigue siendo grande a propósito: es el puente al arco siguiente.
- **Bandas de nivel de los arcos** ensanchadas a ~10 niveles cada una. Las viejas (1→4, 20→24,
  46→49) eran aritméticamente imposibles: 8 pisos dan ~5 nodos con XP, y no hay forma de que sumen
  solo 3 niveles salvo que den casi cero.
- **`escaladoNivelPorPiso` a 1.0** en los tres, para que el enemigo común suba al ritmo del jugador.
- **`crecimientoStatsPorNivel` de 0,08 a 0,03.** Esta sí es la curva de stats, y se aplanó por otro
  motivo: con 0,08 el 92% del poder de un personaje venía de subir de nivel (ver
  [30](./30-sistema-de-pasivas.md), fase 4).
- **Stats de los jefes** bajadas (mini 74/12/9/10 → 59/9/8/10; final 90/14/10/10 → 63/10/9/10). Con
  los niveles ya alineados, un nodo de jefe se ganaba solo el 38-57% de las veces **con el equipo de
  3 entero y a HP completo**: una run completa salía al ~1%.

Hay tres tests de invariante en `engine/leveling.test.js` que impiden que esto se vuelva a separar:
todos los arcos declaran su `xpCombateComun`, el jugador llega a cada jefe con ±2 niveles de
diferencia, y nunca va más de 5 niveles por encima del enemigo de un piso normal.

## Reparto de XP con el banquillo

Con combate 1vs1, solo el personaje activo (posición 1) ganaba XP. `config.progresion.porcentajeXpBanquillo`
(actualmente **0.6**, subido desde 0.4 tras detectar que dejaba a los personajes en banco
peligrosamente atrás — un one-shot de Zabuza en playtest venía de aquí) da al resto del equipo
vivo ese % de la XP de cada combate ganado, aunque no haya participado.

## Balance de jefes/minijefes: ratios fijos, no valores absolutos

Las `statsBase` de los jefes son un múltiplo fijo de un personaje medio (hp39/ataque9/defensa7/velocidad8):
- **Mini-jefe** (Haku, Kabuto, Camino Animal) — 59/9/8/10: ×1.5 hp, ×1.1 defensa, ×1.3 velocidad,
  ataque igual que un personaje.
- **Jefe final** (Zabuza, Gaara, Pain) — 63/10/9/10: ×1.6 hp, ×1.15 ataque, ×1.2 defensa, ×1.3 velocidad.

Los múltiplos anteriores eran bastante más altos (×1.8/×2.2 de HP y ×1.3/×1.5 de ataque). Se
bajaron en la fase 4 al medir un nodo de jefe como se pelea de verdad —el equipo de 3 en cadena, no
un 1 vs 1— y ver que se ganaba solo el 38-57% de las veces. Ahora los mini-jefes se ganan el 80-93%
y los jefes finales el 82-88%, con el trío llegando al mini-jefe tocado del camino (el HP persiste
entre nodos) y al jefe final curado por el descanso garantizado del piso anterior. El nodo más
justo es Haku, al 80%: es el primer mini-jefe de la run y al que se llega con menos recursos.

> Desde v5 (al final del documento) los jefes de los arcos 1 y 2 están por debajo de estos ratios: se
> calibran contra lo que el jugador puede tener al llegar a ellos, no contra un personaje medio.

Como jugador y enemigo se escalan con la misma fórmula de nivel, el ratio se mantiene constante en
cualquier nivel. (Bug histórico ya corregido: antes las stats de los jefes estaban puestas como si
ya fueran "finales" y el escalado por nivel las multiplicaba otra vez encima.)

> Feedback de playtest pendiente de ajustar: con la cadena de rondas (ver `09-motor-engine.md`),
> si el personaje activo cae, el siguiente entra contra el mismo jefe — si ese segundo personaje
> viene del banquillo (más atrasado en nivel), el salto de dificultad percibido puede sentirse
> mayor que el margen de diseño (+1) sugiere. Pendiente de más playtest.

## Niveles de transformación por personaje

| Personaje | Tier 1 | Tier 2 |
|---|---|---|
| Naruto | 5 | 34 |
| Sasuke | 5 | 35 |
| Sakura | 6 | 34 |
| Rock Lee | 7 | 35 |
| Neji | 7 | 36 |
| Tenten | 6 | 37 |
| Shikamaru | 8 | 37 |
| Ino | 7 | 35 |
| Choji | 9 | 38 |
| Kiba | 6 | 36 |
| Hinata | 8 | 37 |
| Shino | 8 | 37 |
| Sai | — | 36 (único tier) |
| Yamato | — | 37 (único tier) |

Remapeados dos veces, las dos por el mismo motivo: **un modo que se desbloquea por encima del nivel
al que termina la run es contenido muerto**, escrito y balanceado pero que nadie ve.

La primera vez estaban en 60-85 con runs que acababan sobre el 49 (fase 2 del rediseño de balance).
La segunda fue efecto colateral de la fase 4: al recalibrar la XP, el arco 1 pasó a terminar sobre
el nivel 10 y los tier 1 seguían en 12-28, así que **el primer arco entero se jugaba sin ninguna
transformación** — y ahí el 92% del poder venía de subir de nivel y nada más. Ahora el tier 1 cae
dentro del arco 1 (5-9) y el tier 2 dentro del arco 3 (34-38).

Hay un test de invariante por cada uno de los dos errores: que ningún modo pase del nivel final de
la run, y que todo personaje con dos modos desbloquee el primero dentro del arco 1. Sai y Yamato
tienen un único modo, tardío a propósito, y quedan fuera del segundo.

## Nivel del desafío legendario (`nivelDesafioLegendario`)

El pergamino dorado del nodo de reclutar es un combate contra un legendario
(ver [28](./28-nodo-reclutar.md)), y su nivel es **fijo por arco** como el de cualquier jefe: 6, 23
y 41. Un desafío que escalara con el equipo sería siempre igual de difícil, y entonces dejaría de
ser una decisión para ser un peaje.

Medido con el bloque **"Desafío legendario"** de `scripts/simular-combates.mjs`, con el mismo método
que los jefes (trío en cadena y con el HP que deje el camino):

| Arco | Nivel | Piso 3 | Piso 6 |
|---|---|---|---|
| País de las Olas | 6 | 40-53% | 71-84% |
| Examen Chunin | 23 | 44-65% | 54-77% |
| Invasión de Pain | 41 | 40-61% | 68-89% |

El abanico entre el piso 3 y el 6 es enorme y **es inherente al nivel fijo**: el mismo pergamino es
una trampa temprano y casi un regalo tarde. Se acepta —y no se corrige escalando— porque el nodo es
opcional y se ve desde el mapa antes de entrar: el jugador decide con la información delante. Si
alguna vez se quiere aplanar, la palanca no es el nivel sino los pesos de `poolRarezaReclutar` por
piso, que hoy son iguales para todo el arco.

## Calibrar un personaje nuevo: el caso de Kakashi (y cómo se mide mal)

Kakashi es el primer personaje **legendario jugable** (los legendarios eran hasta ahora solo jefes
desbloqueables por logro). Se pidió que "sus números se sintieran fuertes sin desbalancear la run", y
lo que costó no fue elegir los números: fue **construir la medida**. Las dos primeras lecturas dieron
conclusiones opuestas y las dos eran falsas.

**Intento 1 — el legendario contra la media de tríos.** Se le puso en la posición 1 y se comparó con
la media de todos los tríos del roster. Salió que ganaba los seis nodos de jefe al 100% gastando un
solo personaje, con Δ de +7 a +27 puntos. Conclusión: roto. **Falso**, por dos sesgos que empujan en
la misma dirección:

- **La posición 1 vale por sí misma.** Quien pelea la primera ronda llega con el HP entero y, si
  gana, el combate se acaba sin que nadie más entre. Un común cualquiera puesto delante también barre
  los jefes.
- **La media arrastra a los mal emparejados.** Con la tabla de tipos, cualquier personaje bien
  emparejado saca +20 puntos sobre una media que incluye a los que pegan a 0,5×.

**Intento 2 — control con un solo personaje de referencia.** Se comparó contra el mejor no legendario
(Yamato) puesto en el mismo sitio. Salió Δ+33 contra Pain… porque Pain es raiton y Yamato doton. El
control traía su propio emparejamiento de tipos.

**Lo que funciona: el PUESTO.** Simular cada candidato a la posición 1 contra el mismo jefe y ordenar.
Cancela los dos sesgos de golpe, y los empates a 100% se rompen por personajes gastados, que es lo
único que discrimina cuando el nodo está saturado. Es el bloque **"Lo que cambia si ganas el pergamino
dorado"** de `scripts/simular-combates.mjs`.

Con esa medida la lectura se dio la vuelta: Kakashi es **puesto 2-6 de 15**, nunca primero.

| Nodo | Puesto de Kakashi | Por delante |
|---|---|---|
| Haku (suiton) | 3.º — 98% / 1,2 pers | rock_lee, yamato (doton, 1,5× a suiton) |
| Zabuza (suiton) | 4.º — 100% / 1,0 | rock_lee, shino, yamato |
| Kabuto (doton) | 2.º — 100% / 1,0 | neji (el otro raiton) |
| Gaara (doton) | 4.º — 100% / 1,0 | neji, choji, kiba |
| Pain: Animal (doton) | 4.º — 100% / 1,0 | neji, kiba, yamato |
| Pain Deva (raiton) | 6.º — 92% / 2,2 | naruto, tenten, choji, sai (fuuton, 1,5× a raiton) |

> Desde v5 (abajo) Haku es fuuton y Kakashi queda en desventaja contra él: la tabla es de antes.

Y sale una **consecuencia de diseño que no se buscó y conviene no "arreglar"**: Kakashi es raiton, se
consigue en el arco 1 y **los dos jefes del arco 1 son suiton**. O sea que el premio del pergamino
dorado no ayuda con el jefe que viene justo después — se cobra en los arcos 2 y 3, donde tres de los
cuatro jefes son doton. Ganarlo es una inversión, no un atajo.

Sus números finales: `42/11/8/10` (hp/atk/def/spe), jutsu Raikiri a 2,5 con carga 36/10, Sharingan a
nivel 6 —7 desde v5, ver abajo— (`first_hit_reduction` 0,4 + `ignore_defense` 0,2) y Mangekyō a 35 (`ignore_defense` 0,55 +
`priority`). Se llegó ahí bajando desde `45/12/9/11`, que sí barría de verdad: era mejor que todo el
roster en las cuatro estadísticas **y** en pasivas **y** en jutsu, que no es "legendario" sino
"dominante". El desafío para conseguirlo se gana el 52% de las veces en el piso 3 y el 87% en el 6.

**Dos reglas que salen de aquí y valen para el siguiente personaje que se añada:**

1. Los legendarios **no entran en la media del roster** del simulador (`roster` los filtra). No se
   reclutan como los demás —hay que ganarles un combate—, así que la mayoría de las runs no los
   tienen; meterlos subiría todas las medias del informe y dejaría de poder compararse con las cifras
   de este documento.
2. Un personaje legendario en `characters.json` era **invisible** para el bloque del desafío
   legendario, que solo miraba `enemies.json`. Medía el arco 1 contra Gaara y Pain —dos rivales que en
   una primera run no pueden salir— y no contra el único que sale de verdad. Es el mismo fallo que las
   pasivas sin normalizar: **el simulador midiendo un juego distinto del que se juega.**

## Transformaciones de jefe: activarlas y compensar sus stats

Durante meses **ninguna transformación de jefe se activó jamás**: sus modos se desbloqueaban por
encima del nivel al que se pelean — Zabuza a 15 peleándose a 10, Kabuto a 33 peleándose a 19, Gaara a
30 peleándose a 27 y Pain a **90** peleándose a 44. Había arte recortado (`assets/transformations/`)
que nadie iba a ver nunca. Es el mismo error que la fase 2 arregló para los personajes jugables, y en
los jefes sobrevivió porque el test de invariante que lo protege solo mira `characters.json`.

Umbrales nuevos: **8 / 17 / 24 / 40**, y el tier 2 de Gaara de 50 a 40 para que exista si lo reclutas.
Un jefe tiene un solo combate, así que la regla no es "dentro de la run" como en los personajes: o
llega transformado, o su modo no existe.

**La compensación importa tanto como el umbral.** El modo aporta multiplicadores y pasivas, así que
activarlo sin más subía a los jefes de golpe: Zabuza pasó del 88% al 55% de nodos ganados y Kabuto del
90% al 62%. Se dividió el `statsBase` de los cuatro por los multiplicadores de su propio modo, así que
el jefe pesa aproximadamente lo mismo que antes pero **parte de ese peso viene ahora de la
transformación en vez de números en crudo** — exactamente el reparto que se le hizo al jugador en el
rediseño de balance.

| Nodo | Antes | Después |
|---|---|---|
| mini-jefe Haku (sin modo) | 80% | 80% |
| JEFE Zabuza | 88% | 77% |
| mini-jefe Kabuto | 90% | 77% |
| JEFE Gaara | 82% | 88% |
| mini-jefe Camino Animal (sin modo) | 93% | 92% |
| JEFE Pain | 84% | 84% |

Gaara **sube** porque su modo es defensivo (defensa ×1,24 y `first_hit_reduction`) y dividir su ataque
le quita más de lo que le da. Haku y Camino Animal siguen sin modo a propósito: no hay arte para
ellos, y el test de invariante nuevo se salta a los jefes que no tienen ninguno.

## v5 — Los jefes en una PRIMERA run (playtest 2026-10-13)

**Síntoma:** en el playtest, Zabuza se sentía imposible para alguien que acaba de llegar, "sin ventaja
de tipo ni transformación". El simulador decía lo contrario: 83% de nodos ganados.

**El simulador medía otro juego.** El bloque "Jefes con el equipo de 3 en cadena" promedia los 364
tríos del roster entero, y en el arco 1 de una primera run casi ninguno existe:

- El pergamino verde ofrece los iniciales no elegidos más `personajesReclutablesIds` **del arco en
  curso** (ver `candidatosReclutables`), y en el arco 1 esa lista solo tiene a Kakashi. Al llegar a
  Haku y Zabuza solo se puede tener a **Naruto, Sasuke y Sakura**.
- Ninguno de los tres es doton, el único tipo con ventaja contra suiton, y **los dos jefes del arco 1
  eran suiton**. Sasuke es katon: pega ×0,5 y recibe ×1,5. El jutsu de Zabuza le quitaba 47 de sus 50 HP.
- Se empieza con 1 personaje y hay uno o dos pergaminos por arco: a Haku se llega solo o en pareja, y a
  Zabuza casi siempre en **pareja**, no en trío.
- La estimación de nivel es una esperanza. Un combate común da ~2 niveles en el arco 1, así que quien
  prefiere eventos o tienda llega dos por debajo, y como el combate es casi determinista, eso no
  "baja un poco" la probabilidad: la lleva de 100% a 0%.

Medido con eso (bloque nuevo **"Jefes en una PRIMERA run"** del simulador; `DETALLE=1` lista los
equipos que se atascan):

| Nodo | Antes (estimado / −2 niveles) | Después |
|---|---|---|
| mini-jefe Haku | 17% / 0% — 5 de 6 equipos atascados | 100% / 83% |
| JEFE Zabuza | 33% / 0% — Naruto+Sasuke perdía incluso a Nv.12 | 100% / 100% |
| mini-jefe Kabuto | 70% / 69% — 7 de 27 atascados | 73% / 72% (sin tocarlo: lo mueve Sakura) |
| JEFE Gaara | 80% / 76% | 81% / 77% (ídem) |

**Cambios:**

1. **Haku pasa a fuuton.** Su Hyōton es agua + viento, y su recompensa ya era el pergamino de viento.
   Así el arco 1 deja de tener dos jefes del mismo tipo, y Sasuke pasa de lastre a ser **su contrapeso**,
   como en el puente. Contrapartida a sabiendas: Kakashi (raiton) queda en desventaja contra Haku, lo
   que refuerza que ganarlo sea una inversión y no un atajo (ver la sección de Kakashi).
2. **Haku 59/9/8 → 47/7/6** y **Zabuza 58/9/8 → 49/7/6** (hp/atk/def). Lo que más pesaba era la
   **defensa**: Sakura le hacía 2 de daño por básico a Haku.
3. **Sakura 40/7 → 44/8** (hp/atk). Era la inicial más floja (suma 62 contra 69 de Naruto), y
   **todos** los equipos atascados que quedaban, en los tres arcos, la llevaban: suiton recibe ×1,5 de
   los tres jefes doton. Elegir inicial no puede ser una trampa.
**Lo que se deja como está, a propósito: los jefes de los arcos 2 y 3.** Se probó a rebajar a Kabuto y
Gaara (al 85% y 93%) y se deshizo: ahí sí hay salida. Cada jefe tiene un contrarresto reclutable (Neji y
Kiba contra los doton; Naruto, Tenten y Sai contra Pain), el jugador ya lleva objetos —que el bloque de
primera run NO mide, así que sus cifras de esos arcos son pesimistas— y los equipos que se atascan son
siempre Sakura con un común flojo y sin raiton, p. ej. Naruto + Sakura + Ino: un segundo suiton contra un
arco de tres jefes doton. Esa elección el jugador la
hace en el arco 2, entre nueve comunes (dos de ellos raiton) y con el jefe visible en el mapa. El arco 1
era distinto: ahí no había nada que elegir.

**Protegido por test:** `leveling.test.js` → "jefes del arco 1 en una primera run" exige que cualquier
inicial solo gane a Haku y cualquier pareja, en cualquier orden, gane a Zabuza, al nivel estimado. Con
los datos de antes fallan los dos.

**Efecto secundario, y su arreglo — el segundo modo de Zabuza.** Los jefes reclutados por logro usan el
mismo `statsBase`, así que al rebajarlo, Zabuza como **desafío legendario** de los arcos 2 y 3 pasó a
ganarse el 93-100% (objetivo 45-70%; antes 62-93%). Se le dio un segundo modo, **Silent Killing**, a
**nivel 20**: nunca se activa en el arco 1 (se pelea a 10) y sí en los desafíos (23 y 41) y si lo reclutas.
`priority` (siempre ataca primero: no lo ves venir) + `ignore_defense` 0,4 + `heal_on_kill` 0,15, con
multiplicadores 1,4 de ataque y 1,32 de defensa. Desafío: **57% / 80%** en el arco 2 y **74% / 97%** en el
arco 3 (pisos 4 / 6) — de vuelta a sus cifras de antes. El arco 3 queda algo alto porque ahí el jugador ya
lleva su segunda transformación; no se apretó más para no convertir al Zabuza reclutado en el mejor
personaje del juego. Sin arte propio: `spriteDeModo` cae al de su primer modo, como los tier 2 sin dibujar.

**Kakashi: Sharingan de 6 a 7.** El desafío del arco 1 se pelea a nivel 6, justo cuando lo destapaba. A 7 lo
peleas sin él (le ganas "antes de que se descubra el ojo") y al unirse lo activa enseguida, porque el
equipo pasa de 7 a partir del piso 5. Desafío con el roster entero: **55% → 67%** en el piso 4 y 86% → 93%
en el 6; como recluta sigue en el puesto 2-5 en los arcos 2 y 3. Retocar su carga o su ataque no movía
nada en una primera run y sí lo debilitaba como recluta, así que se descartó.

**Lo que sigue duro a propósito:** en una primera run, el pergamino dorado del **piso 4** (el del
mini-jefe) se gana el 50%: los equipos con Naruto (fuuton, ventaja sobre raiton) siempre, y Sasuke y/o
Sakura nunca. Elegirlo ahí es saltarse a Haku y su XP para pelear contra un Kakashi tres niveles por
encima, y la pantalla del desafío avisa. Del piso 5 en adelante se gana el 100% de las veces.

**La lección, para el próximo jefe:** un jefe no se calibra contra el roster, sino contra **lo que el
jugador puede tener al llegar a él**. Y un tipo de jefe que ningún personaje disponible contrarresta no
es un jefe difícil, es un muro.

### v5, segunda parte — variación de daño, objetos en la medida y ventaja en el mapa

- **Variación de daño ±10%** (`config.combate.variacionDano`, en `ejecutarAtaque`). El combate era casi
  determinista y el balance, de todo o nada: Naruto + Sakura contra Zabuza saltaba del 0% al 100% de un
  nivel al siguiente. Con la variación los umbrales se vuelven rampas (Sakura sola contra Zabuza:
  0 → 36 → 58 → 100% de Nv.5 a Nv.8, antes 0 → 0 → 0 → 100%) y las medias del simulador apenas se
  mueven (±1-3 puntos), así que no hubo que recalibrar. Sin `azar` no varía: los tests unitarios que
  llaman a `ejecutarAtaque` a mano siguen midiendo números exactos. Si en el playtest se nota poco, el
  siguiente paso es 0,15.
- **El bloque de primera run mide también con objetos** (los `objetoGarantizado` de los jefes ya
  derrotados, un suelo). Casi no mueve nada: Kabuto 70 → 70%, Gaara 81 → 82%. **Lo que saca a un equipo
  de un muro es el tipo, no los objetos seguros.**
- Por eso mismo, **el hover del jefe en el mapa dice qué tal le va a cada uno de tu equipo**
  (Strong / Even / Weak), no solo el tipo del jefe.

## v6 — La tabla de tipos no significaba lo que decía (playtest 2026-10-13, segunda parte)

**Síntoma:** "Kakashi contra Gaara, yendo 10 niveles por encima, Gaara apenas hace 1 de daño". Parecía
cosa de niveles y **no lo era**: al MISMO nivel (27 contra 27) Gaara ya hacía 1 por golpe y 2 con el jutsu.

**Causa:** `calcularDano` multiplicaba el ataque por la eficacia y DESPUÉS restaba la defensa:
`(atk·eficacia − 0,5·def)·potencia`. Con ataque y defensa parecidos —lo normal—, eso deforma la tabla:
neutral = 0,5; ventaja ×1,5 → 1,0 (**×2**); desventaja ×0,5 → ≈0 (**inmunidad**, el suelo de 1). Gaara
es doton, Kakashi raiton. Es el mismo fallo que el de la defensa plana: un multiplicador aplicado antes
de una resta no es el multiplicador que declaran los datos. Y explica por qué en v5 "el tipo pesaba
más que dos niveles". Había un test que fijaba la inmunidad como correcta ("contra ese rival no funciona
ninguno de los dos golpes"); se reescribió para exigir ×0,5 y ×1,5 de verdad.

**Arreglo:** `(atk − 0,5·def)·potencia·eficacia`.

**Recalibración,** porque el arreglo hacía el juego más fácil en general (comunes al 99-100% y con el HP
casi intacto, el mismo síntoma que la fase 4 ya arregló una vez):

| | Antes del arreglo | Solo el arreglo | Final |
|---|---|---|---|
| Comunes, victorias / HP final | 94-99% / 79-93% | 99-100% / 85-96% | 96-100% / 71-93% |
| Gaara (primera run) | 81% | 94% | 82% |
| Camino Animal (primera run) | 91% | 100% | 87% |
| Pain (en cadena) | 85% | 91% | 87% |

- Genin genéricos: **ataque +1 y HP ×1,2**.
- Gaara 63/9/7 → **63/10/7**, Camino Animal 59/9/8 → **63/10/8**, Pain 56/8/8 → **60/9/8**.
- Arco 1 sin cambios: Haku y Zabuza siguen al 100% en primera run.

**Y el nivel de reclutamiento** pasa a ser el nivel **medio** del equipo para todos (antes, el del más
fuerte para los comunes): forzar combates con uno solo y reclutar después dejaba a todo el equipo a su
nivel, que es la otra mitad de "llegar diez niveles por encima".

**XP decreciente por ventaja de nivel** (`factorXpPorVentaja` en `engine/leveling.js`,
`config.progresion.xpPorVentaja`): a partir de **3 niveles** por encima del enemigo, cada nivel más
quita un 15% de la XP, sin bajar del 25%. Se aplica a cada personaje según SU nivel (también en el
banquillo) y también en `nivelesEstimadosDeLaRun`, para que el simulador siga midiendo el juego real. El
margen existe porque el camino normal ya va 2-4 por encima tras el mini-jefe. Efecto medido: el camino
normal no cambia (±1 nivel); el que lo pelea TODO llega a Gaara +2 y a Pain +2 (antes +4 y +5). **Ni
peleándolo todo se llegaba a diez por encima** —se pisa un nodo por piso—: esos diez del playtest venían
de reclutar al nivel del más fuerte y de la "inmunidad" de tipo, los dos ya arreglados arriba.

## v7 — Los comunes flojos (2026-10-15)

**Síntoma:** "Shikamaru tiene stats bastante bajos". Medido personaje a personaje (bloque nuevo **"Fuerza
de cada personaje"** del simulador: liga 1 vs 1 contra todo el roster, daño a los jefes y HP tras los
comunes, al nivel del jefe final de cada arco), no era solo él: el resto del informe **promedia el
roster**, y eso escondía a los flojos.

| | Antes | Después |
|---|---|---|
| Shikamaru | nota 0,26 — liga 7%, **perdía 1 de cada 5 contra genin comunes** (HP final 52%) | 0,55 — gana siempre a los comunes (HP 78-91%) |
| Ino | 0,21 — liga **0%**, jutsu más débil del juego (1,25) | 0,50 — liga ~30% |
| Sai | 0,44 | 0,54 |
| Hinata | 0,48 | 0,59 |
| Shino | 0,50 | 0,63 |
| Chōji (el común más fuerte, sin tocar) | 0,86 | 0,84 |

**Cambios** (stats hp/atk/def/spd, jutsu, carga al atacar):
- Shikamaru 34/6/7/6 → **42/8/8/7**, jutsu 1,65 → **2,2**, carga 18 → **28**, primer modo con ataque y vida ×1,12.
- Ino 33/7/6/7 → **40/9/7/8**, jutsu 1,25 → **2,2**, carga 28 → **34**, primer modo ataque ×1,16 y vida ×1,12.
- Sai 37/8/6/8 → **42/9/7/9**, jutsu 2,35 → **2,5**.
- Hinata 36/8/8/7 → **40/9/9/8**, jutsu 1,55 → **2,1**.
- Shino 35/8/8/6 → **41/9/9/6**, jutsu 1,7 → **2,1**, carga 24 → **28**.
- Tenten 36/9/6/8 → **38/9/7/8** (bajaba al subir los demás: la liga es de suma cero).

**Lo que no se tocó, a propósito**: los de arriba (Naruto, Chōji, Neji, Sasuke). Cerrar más la brecha
exigiría bajarlos, y dos son iniciales —la calibración de la primera run (v5) depende de ellos—. Queda
una banda de 0,50 a 0,84 entre comunes; lo que importa jugando ya está: los cinco ganan a los comunes
con holgura y le quitan a un jefe lo que cualquier otro. El daño bajo de Ino, Hinata y Sakura contra los
jefes del arco 2 es de tipo (suiton contra tres doton), no de stats.

**Efecto en los jefes**, porque el equipo medio es más fuerte: en cadena con el roster entero, Kabuto
85 → 92%, Gaara 84 → 96% y Pain 87 → 93%; en primera run, los equipos que se atascaban contra Kabuto
bajan de 7 a 3 de 27. El arco 1 no cambia (solo iniciales).
