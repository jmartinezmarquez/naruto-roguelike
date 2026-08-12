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
