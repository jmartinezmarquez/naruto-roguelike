# Progresión de nivel y arcos del MVP

El MVP tiene **3 arcos**, jugados en una única run continua de nivel 1 a 100 (`config.progresion.nivelMaximo`).

| Arco | Archivo | Pisos | Mini-jefe (nivel fijo) | Jefe final (nivel fijo) |
|---|---|---|---|---|
| País de las Olas | `arcs/pais-de-las-olas.json` | 8 | Haku (3) | **Zabuza (4)** |
| Examen Chunin | `arcs/examen-chunin.json` | 10 | Kabuto (22) | **Gaara (24)** |
| Invasión de Pain *(licencia creativa)* | `arcs/invasion-de-pain.json` | 12 | Camino Animal de Pain (48) | **Pain, Camino Deva (49)** |

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

## Curva de XP (corregida — la original era matemáticamente inviable)

La curva original (`crecimiento: 1.12`, exponencial) necesitaba **24,8 millones de XP** para
llegar a nivel 100. Toda la run genera, como mucho, ~5.000 XP. Corregida a `crecimiento: 1.015`
(bases 17-24 según personaje).

## Reparto de XP con el banquillo

Con combate 1vs1, solo el personaje activo (posición 1) ganaba XP. `config.progresion.porcentajeXpBanquillo`
(actualmente **0.6**, subido desde 0.4 tras detectar que dejaba a los personajes en banco
peligrosamente atrás — un one-shot de Zabuza en playtest venía de aquí) da al resto del equipo
vivo ese % de la XP de cada combate ganado, aunque no haya participado.

## Balance de jefes/minijefes: ratios fijos, no valores absolutos

Las `statsBase` de los jefes son un múltiplo fijo de un personaje medio (hp41/ataque9/defensa7/velocidad8):
- **Mini-jefe**: ×1.8 hp, ×1.3 ataque/defensa, ×1.2 velocidad.
- **Jefe final**: ×2.2 hp, ×1.5 ataque, ×1.4 defensa, ×1.2 velocidad.

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
| Naruto | 12 | 62 |
| Sasuke | 12 | 68 |
| Sakura | 20 | 60 |
| Rock Lee | 22 | 70 |
| Neji | 24 | 75 |
| Tenten | 20 | 78 |
| Shikamaru | 26 | 80 |
| Ino | 23 | 72 |
| Choji | 28 | 85 |
| Kiba | 21 | 74 |
| Hinata | 25 | 82 |
| Shino | 27 | 79 |
| Sai | 75 (único tier) | — |
| Yamato | 80 (único tier) | — |

## Nivel inicial al reclutar

`reclutarPersonaje(id, nivelInicial)` acepta el nivel al que entra el personaje — usado tanto por
recompensas de jefe como por el reclutamiento de tienda (`calcularNivelPorPiso` del nodo), para
que un reclutamiento tardío en la run no entre indefenso.

## Jefes como reclutables (rareza, curvaXp)

Cada jefe/mini-jefe en `enemies.json` tiene `rareza` (`raro` mini-jefes, `legendario` jefes
finales), `curvaXp` y `desbloqueablePorLogro: true`. Detalle completo en
[14 - Reclutamiento y rareza](./14-reclutamiento-y-rareza.md).

## Pendiente

`recompensa.finDeLaRun` (en Pain) todavía no lo lee ningún código — falta conectar en
`useGameStore.js` para marcar `runGanada: true` al completar la run (hoy `runTerminada` solo
cubre la derrota).
