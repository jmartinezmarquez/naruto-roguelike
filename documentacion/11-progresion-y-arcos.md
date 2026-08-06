# Progresión de nivel y arcos del MVP

El MVP tiene **3 arcos**, jugados en una única run continua de nivel 1 a 100 (`config.progresion.nivelMaximo`).

| Arco | Archivo | Pisos | Nivel inicial | Mini-jefe | Jefe final (nivel) |
|---|---|---|---|---|---|
| País de las Olas | `arcs/pais-de-las-olas.json` | 8 | ~3 | Haku | **Zabuza (15)** |
| Examen Chunin | `arcs/examen-chunin.json` | 10 | ~16 | Kabuto | **Gaara (55)** |
| Invasión de Pain *(licencia creativa)* | `arcs/invasion-de-pain.json` | 12 | ~56 | Camino Animal de Pain | **Pain, Camino Deva (100)** |

## Por qué esta curva

El escalado (`escaladoNivelPorPiso`) se acelera arco a arco (1.7 → 4.3 → 4.0): cuantos más pisos lleva recorridos el jugador, más rápido debe subir el poder de los rivales para que el tramo final de cada arco se sienta intenso, en vez de una progresión plana. Fórmula en `engine/mapGenerator.js → calcularNivelPorPiso`: `nivel = nivelEnemigoBase + (piso - 1) * escaladoNivelPorPiso`.

## Resolución de una inconsistencia anterior

El roster reclutable (Rock Lee, Neji, Tenten, Shikamaru, Ino, Choji, Kiba, Hinata, Shino) estaba antes en el arco de País de las Olas, donde no aparecen en el canon. Al crear el arco de Examen Chunin, se movió `personajesReclutablesIds` allí — es literalmente donde esos personajes aparecen en el manga. País de las Olas se queda solo con el equipo inicial (Naruto, Sasuke, Sakura).

## Personajes nuevos para el arco 3

Como el roster de los 12 personajes del Examen Chunin ya estaría reclutado antes de llegar a la Invasión de Pain, se añadieron **Sai** y **Yamato** como reclutables de ese arco (`personajesReclutablesIds` en `invasion-de-pain.json`), para que el tramo final de la run también tenga algo nuevo que reclutar, no solo enemigos más difíciles.

## Curva de XP (corregida — la original era matemáticamente inviable)

La curva original (`crecimiento: 1.12`, exponencial) necesitaba **24,8 millones de XP** para llegar a nivel 100. Toda la run genera, como mucho, ~5.082 XP (calculado sumando la recompensa de cada combate esperado en los 3 arcos). Corregida a `crecimiento: 1.015` (bases 17-24 según personaje) — cumulativo a nivel 100 ≈ 5.158 XP, ajustado al presupuesto real.

**Validación por simulación** (usando los propios JSON del proyecto, no cálculo a mano):

| Escenario | País de las Olas (obj. 15) | Examen Chunin (obj. 55) | Invasión de Pain (obj. 100) |
|---|---|---|---|
| Personaje fijo en posición 1 (100% XP) | 26 | 56 | 97 |
| Personaje en banquillo todo el rato (40% XP) | — | — | 56 |
| Sai (recluta tardío, arco 3) | — | — | 100 activo / 81 en banquillo (modo pide 75, alcanzable en ambos casos) |

## Reparto de XP con el banquillo (nuevo)

Con combate 1vs1, solo el personaje activo (posición 1) ganaba XP — los otros 2 casi nunca subían de nivel salvo reordenación manual constante. Se añadió `config.progresion.porcentajeXpBanquillo` (0.4): el resto del equipo vivo gana un 40% de la XP de cada combate ganado, aunque no haya participado. Implementado en `useGameStore._aplicarVictoria`. Inspirado en que Pokelike describe su combate como dependiente "del posicionamiento del equipo", no de un único luchador aislado.

Las `statsBase` de los jefes se calculan como un múltiplo fijo de un personaje medio
(hp41/ataque9/defensa7/velocidad8), no como valores absolutos:
- **Mini-jefe**: ×1.8 hp, ×1.3 ataque/defensa, ×1.2 velocidad.
- **Jefe final**: ×2.2 hp, ×1.5 ataque, ×1.4 defensa, ×1.2 velocidad.

Como jugador y enemigo se escalan con la misma fórmula de nivel (`calcularStatsPorNivel`), este
ratio se mantiene constante en cualquier punto de la run. Antes de esta corrección, las stats de
Gaara/Pain estaban puestas como si ya fueran "finales" y el escalado por nivel las multiplicaba
otra vez encima — a nivel 55, Gaara llegaba a ~1574 HP frente a ~200 HP de un personaje jugador,
un enemigo prácticamente imbatible en 1 vs 1.

## Niveles de transformación por personaje

Ajustados para que cada tier de transformación caiga dentro del rango de niveles donde el
personaje realmente puede estar jugando (según su arco de reclutamiento):

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

## Fix relacionado: nivel inicial al reclutar

Se detectó que `reclutarPersonaje` siempre creaba al personaje a nivel 1, sin importar el punto
de la run. Un reclutamiento tardío (ej. Shino a mitad del Examen Chunin) entraría indefenso
frente a rivales ya de nivel ~35. `reclutarPersonaje(id, nivelInicial)` acepta ahora el nivel del
piso donde se recluta — pendiente de que el flujo de nodos (aún sin construir) se lo pase.

- **Zabuza Momochi** — jefe final de País de las Olas.
- **Kabuto Yakushi** — mini-jefe de Examen Chunin (piso 5).
- **Camino Animal de Pain** — mini-jefe de Invasión de Pain (piso 6).
- **Pain (Camino Deva)** — jefe final de la run completa. Su recompensa incluye `finDeLaRun: true` en `recompensa`, un campo nuevo que el store deberá interpretar para marcar la run como completada con éxito (`runGanada: true`), no solo terminada.

> Nota: `recompensa.finDeLaRun` es un campo nuevo, todavía no leído por ningún código — pendiente de conectar en `useGameStore.js` cuando se implemente el flujo completo de "victoria de la run" (distinto de `runTerminada`, que hoy solo cubre la derrota).
