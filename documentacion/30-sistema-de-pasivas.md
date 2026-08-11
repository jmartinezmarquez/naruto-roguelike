# Sistema de pasivas

Implementa las fases 1, 2 y 3 del punto 1 del [roadmap](./05-roadmap.md), a partir del
[27](./27-sistema-de-balance.md). Queda la fase 4 (curva de niveles y recalibración).

## Por qué

Niveles, transformaciones y objetos subían los mismos cuatro números, así que la única palanca de
balance era "más grande" y el juego hacía bola de nieve. Medido: con `crecimientoStatsPorNivel: 0.08`
lineal, un Naruto de nivel 100 tiene 80 de ataque frente a 9 en el nivel 1, y el mejor objeto
legendario del juego da **+4 planos**. Los objetos son más fuertes al empezar la run que al
terminarla, justo al revés de lo que se quiere.

Una pasiva no escala con el nivel: "el primer golpe recibido hace un 50% menos de daño" vale lo
mismo en el nivel 3 que en el 90. Por eso el reparto 40/30/30 del doc 27 depende de esto.

## Piezas

- **`engine/passives.js`** — el catálogo y los despachadores. Lógica pura.
- **`src/data/passives.json`** — el texto de cara al jugador de cada pasiva. Separado a propósito:
  `engine/` es agnóstico del contenido y no lleva texto de UI dentro. Un test comprueba que los dos
  archivos tienen exactamente los mismos ids, para que no pueda existir una pasiva sin su frase.

## Cómo se declara

Modos y objetos declaran pasivas **por su id**, y comparten las mismas implementaciones — que es lo
que pide el doc 27 para no duplicar la lógica en dos sitios. Dos formas admitidas:

```json
"pasivas": [
  "priority",
  { "id": "first_hit_reduction", "cantidad": 0.8 }
]
```

La forma corta usa los valores por defecto del catálogo. La larga los pisa. Se admiten las dos
porque la mayoría de declaraciones no necesitan tocar nada y obligar a un objeto para todas ensucia
los JSON de 14 personajes.

**Un id desconocido revienta** (`normalizarPasivas` lanza) en vez de ignorarse. Es deliberado: una
pasiva que no hace nada en silencio es el peor fallo posible aquí, porque el personaje parecería
funcionar y estaría desbalanceado sin que nada lo delatara. Y revienta al **crear el luchador**, no a
mitad de la pelea.

## Enganches

Cada pasiva vive en un solo enganche, y el enganche determina la forma de su función.

| Enganche | Quién lo consulta | Forma |
|---|---|---|
| `DEFENSA_EFECTIVA` | el **atacante** | pliega un valor |
| `DANO_INFLIGIDO` | el **atacante** | pliega un valor |
| `DANO_RECIBIDO` | el **defensor** | pliega un valor |
| `PRIORIDAD` | cada luchador | sí/no |
| `ATAQUE_EXTRA` | el atacante | sí/no |
| `AL_DERROTAR` | el atacante | efecto (muta) |
| `TRAS_COMBATE` | **el store, no `combat.js`** | solo lleva una cantidad |

Que `ignore_defense` la consulte el atacante y no el defensor no es un detalle: la pasiva es **suya**,
lo que hace es perforar la defensa ajena.

## Orden dentro de un ataque

1. `calcularDano` — la defensa del rival pasa por `DEFENSA_EFECTIVA`. Devuelve también `danoBruto`,
   el daño **antes** de restar defensa, porque `damage_floor` lo necesita: un suelo sobre el daño ya
   restado no significaría nada.
2. El daño pasa por `DANO_INFLIGIDO` (pasivas del atacante) y luego por `DANO_RECIBIDO` (del
   defensor).
3. Se redondea con **mínimo 0, no 1**. El mínimo de 1 de `calcularDano` queda deliberadamente atrás:
   una pasiva sí puede dejar un golpe en 0 (Susanoo bloquea el primero entero). Un golpe de 0 no
   carga la barra del defensor, cosa que el motor ya respetaba.
4. Se actualizan los contadores y, si el defensor cae, se dispara `AL_DERROTAR`.

## Los contadores viven en el luchador

`estadoCombate: { ataquesLanzados, jutsusLanzados, golpesRecibidos }` es lo que hace posible "el
PRIMER jutsu" o "el PRIMER golpe recibido".

Están en el luchador y no en el bucle de turnos por una razón concreta: **el enemigo de un nodo es
uno solo para toda la cadena de rondas**, igual que conserva el HP y la barra de jutsu (ver
[29](./29-sistema-de-jutsus-automaticos.md)). Si los contadores se reiniciaran por combate, un jefe
con Susanoo bloquearía un primer golpe contra cada personaje del equipo que fuera entrando. Hay un
test que lo fija.

## `objetivo`, y por qué existe ya

Cada pasiva declara a quién afecta (`uno_mismo` / `enemigo_actual`). Hoy el MVP no necesita más, pero
el campo existe desde el principio porque el doc 27 quiere poder crecer a encuentros con varios
enemigos (`todos_los_enemigos`, `siguiente_enemigo`) sin rehacer el motor. Añadir un objetivo nuevo
será tocar la resolución del objetivo, no cada pasiva una por una.

## El catálogo

Catorce pasivas, y **ninguna es especulativa**: todas tienen hoy al menos un modo o un objeto que las
usa. Se implementan solo las que algún dato vaya a usar — una pasiva sin usuario es código muerto que
hay que mantener y testear.

| id | Quién la pide |
|---|---|
| `first_jutsu_bonus` | Manto del Kyūbi, Chakra Seal |
| `first_attack_bonus` | Ino, Tenten, Sai, Zabuza |
| `basic_attack_bonus` | Sakura, Rock Lee, Tenten, Sai |
| `jutsu_bonus` | Cursed Seal Shard |
| `ignore_defense` | Modo Sabio, Neji, Hinata, Rinnegan Shard, Pain |
| `damage_floor` | Modo Sabio ("el daño mínimo nunca baja de un porcentaje"), Choji |
| `first_hit_reduction` | Susanoo (100 %), Escudo Absoluto de Gaara (80 %), Yamato (60 %) |
| `reduce_damage_taken` | Shikamaru, Choji, Shino, Yamato, Kabuto |
| `increase_damage_taken` | Cursed Seal Shard (su contrapartida) |
| `low_hp_reduction` | Sand Gourd |
| `priority` | Puertas Internas, Wind Scroll, Kiba, Shikamaru, Pain |
| `heal_on_kill` | Manto del Kyūbi, Kubikiribōchō, Sakura, Shino, Sage Hermit's Seed |
| `heal_after_battle` | Reserve Scroll |
| `repeat_basic_chance` | Marca Maldita, Kiba |

`first_hit_reduction` cubriendo Susanoo, Gaara y Yamato con un solo efecto y tres cantidades
distintas es exactamente para lo que sirve tener catálogo.

**Sin implementar**: `bonus_gold` y `bonus_experience`, la categoría económica del doc 27. Los
enganches serían triviales (`_aplicarVictoria`), pero no hay **sprite** para objetos nuevos y sin
objeto que las use serían pasivas muertas. Hace falta arte antes que código.

## Aleatoriedad

`repeat_basic_chance` es la primera regla de combate con azar. `resolverTurno` y
`resolverCombateCompleto` aceptan un parámetro `azar = Math.random` para poder inyectarlo desde los
tests y no depender de la suerte. Como mucho **una repetición por ataque**: encadenar repeticiones
sin tope podría no terminar nunca, y un turno con tres golpes ya no se lee en pantalla.

## Lo que se le pasa a la UI

El evento de cada ataque gana dos campos pensados para el rediseño de la pantalla de combate
(punto 2 del roadmap):

- **`pasivasActivadas`** — qué pasivas han hecho algo en ESE golpe. Sin esto la animación vería un
  golpe de 0 y no sabría explicar por qué. Solo se anota la pasiva si cambió algo de verdad: una
  pasiva de primer jutsu no "se activa" en los turnos en que no toca.
- **`hpAtacante`** — el HP del atacante después del golpe.

La trampa que evita `hpAtacante`: `CombatScreen` reconstruía el HP restando el daño acumulado del
historial, y en cuanto `heal_on_kill` entró en los datos (fase 2) eso dejó de ser cierto — el
atacante **sube** de HP al rematar. El replay ya usa el valor resuelto del evento. Es exactamente el
mismo caso que la barra de carga, que tampoco se puede reconstruir sumando porque lanzar el jutsu la
pone a cero (ver [13](./13-ui-mapa-y-combate.md)).

---

# Fase 2 — Transformaciones

Los 31 modos de `characters.json` y `enemies.json` pasan a declarar pasivas, y sus multiplicadores
se acercan a 1 (`nuevo = 1 + (viejo − 1) · 0,4`). La transformación deja de ser "los mismos números
más grandes" y pasa a ser una regla, que es lo que pide el doc 27. Se conserva la identidad de cada
personaje, penalizaciones incluidas: la defensa de Rock Lee sigue bajando al abrir las Puertas y la
velocidad de Gaara sigue cayendo bajo la arena.

Los siete ejemplos del doc 27 están literalmente implementados (Manto del Kyūbi, Modo Sabio, Marca
Maldita, Susanoo, Escudo Absoluto, Puertas Internas, Shikamaru). Los otros 24 modos se han diseñado
en el mismo espíritu: Neji y Hinata perforan defensa (Puño Suave), Kiba repite golpes (Colmillo sobre
Colmillo), Shino se cura al rematar (los insectos drenan chakra), Yamato aguanta el primer impacto.

## El bug que destapó esta fase: transformaciones que nadie veía

Los **segundos modos se desbloqueaban entre el nivel 60 y el 85**, y una run completa termina sobre
el **49**. No se activaban nunca. Sai y Yamato, con un único modo a nivel 75 y 80, **no tenían
transformación en absoluto** en toda la partida.

Era contenido escrito, balanceado y muerto, y nada avisaba: el juego funcionaba, simplemente esa
mitad del diseño no existía. Los segundos modos se han remapeado a la banda **40-45**, conservando el
orden relativo entre personajes, para que existan durante el arco 3. Hay un **test de invariante**
(`passives.test.js`) que falla si algún modo de personaje vuelve a quedar por encima del nivel del
jefe final más alto.

**Los modos de los jefes se dejan intactos a propósito.** También están fuera de alcance (Zabuza se
desbloquea a nivel 15 y se pelea con él a nivel 4; Pain, a 90 contra 49), pero bajarlos es
rebalancear jefes, y eso es la fase 4. Sus pasivas sí se han rellenado para que el dato esté completo
cuando esa fase llegue.

## Efecto en el balance

Medido con `scripts/simular-combates.mjs`:

| | antes de la fase 2 | después |
|---|---|---|
| arco 1 (Nv. 1-4) | 96-97 %, 4,8-4,9 turnos, 80-83 % HP | **idéntico** |
| arco 2 (Nv. 21-23) | 96 %, 4,6-4,7 turnos, 86-88 % HP | 96 %, 4,7-4,8 turnos, 85-87 % HP |
| arco 3 (Nv. 46-49) | 97 %, 4,4-4,5 turnos, 90-92 % HP | 97 %, 4,1-4,2 turnos, 93-94 % HP |
| jefe final Pain | 14 % | 21 % |

El arco 1 sale **exactamente igual**, y es la comprobación de que nada se ha movido por error: a
nivel 1-4 no hay ninguna transformación activa, así que no debía cambiar nada.

El arco 2 queda un pelín más difícil (los multiplicadores bajan y las pasivas de primer tier no
compensan del todo) y el arco 3 bastante más fácil, porque los segundos modos han pasado de no
existir a estar activos toda la fase final. **Es una diferencia real que la fase 4 tiene que
absorber**, no ruido.

## El simulador ahora es determinista

`repeat_basic_chance` es la primera regla de combate con azar, y con `Math.random` dos ejecuciones
seguidas del simulador daban 14 % y 21 % de victorias en el mismo combate. Así no se puede comparar
un balance antes y después, que es exactamente para lo que existe el script. Ahora usa un mulberry32
con semilla fija (`SEMILLA` en `scripts/simular-combates.mjs`): cualquier diferencia que salga es del
cambio, no de la suerte.

## Lo que ve el jugador: nada, son una sorpresa

**Las transformaciones no aparecen en ninguna tarjeta.** Ni su descripción ni su nombre.

Se llegó ahí en dos pasos y con dos razones distintas, y la segunda es la que manda.

Primero se probó con una línea por pasiva debajo del nombre (generada con `describirPasiva`) y la
tarjeta se desbordaba. Se dejó solo el nombre… y también se cortaba, porque los nombres son largos y
muy desiguales: `◈ Nine-Tails Chakra…` no es sabor, es una tarjeta rota.

Pero el motivo de fondo no es el espacio: **todos los personajes tienen transformación**, y hay un
test de invariante que lo garantiza desde la fase 2. Decir que la tienen no distingue a nadie — sale
igual en las 14 tarjetas, así que es ruido en todas. Y en un Pokelike tampoco se te cuenta qué hace
una evolución antes de que ocurra; la sorpresa es parte de lo que hace que el momento valga.

Las transformaciones se descubren en **tres sitios**, todos en el roadmap:

1. **La pantalla de transformación** (punto 4) — el momento en que se desbloquea. Hoy ese momento no
   existe: un personaje sube a nivel 12 y aparece con el Manto del Kyūbi sin aviso, sin pantalla, sin
   una línea de texto. Es el momento más importante de su progresión y es invisible.
2. **El combate** (punto 2) — cuando la pasiva salta. Los eventos ya traen `pasivasActivadas` para
   eso.
3. **La enciclopedia** (punto 10) — para quien quiera el detalle, en frío.

`describirPasiva` sigue exportada y probada, esperando a esos tres sitios.

> ⚠️ **Deuda que esto crea, y hay que decirla clara**: mientras los puntos 2 y 4 no existan, las
> transformaciones son **completamente invisibles**. Ya se aplicaban en silencio (nada avisa hoy de
> que un personaje ha desbloqueado la suya), y ahora tampoco se nombran en ninguna parte. La decisión
> es correcta, pero convierte esos dos puntos en obligatorios, no en mejoras: sin ellos, medio
> rediseño del balance existe solo en los JSON. Si hubiera que recortar alcance, **la pantalla de
> transformación es lo último que se puede caer**.

---

# Fase 3 — Objetos

Los objetos dejan de dar estadísticas planas y pasan a declarar pasivas, **el mismo catálogo que las
transformaciones**. Los 10 ids se conservan tal cual: los referencian `achievements.json`,
`enemies.json` (recompensa de jefe) y los sprites de `assets/items/<id>.png`.

## El problema que arregla, con números

El mejor objeto legendario del juego (Kubikiribōchō) daba **+4 de ataque plano**. Un Naruto de nivel
100 tiene 80 de ataque. Un 5 %.

Y lo peor no es que fuera poco: como los bonus eran planos y las stats crecen ×8,9 con el nivel, los
objetos eran **más fuertes al empezar la run que al terminarla**, justo al revés de lo que se quiere
en un roguelike, donde la build se cierra al final. Por eso los objetos aportaban ~1,5 % del poder de
una partida frente al 40 % que pide el doc 27.

Una pasiva no se diluye: "el primer golpe recibido hace un 50 % menos de daño" vale lo mismo en el
nivel 3 que en el 90. Hay un test que falla si alguien vuelve a meter un `buffEquipable`.

## Las cinco categorías del doc 27

| Categoría | Objetos | Qué hacen |
|---|---|---|
| **combate** | Chakra Seal, Wind Scroll | `first_jutsu_bonus`, `priority` |
| **supervivencia** | Reserve Scroll, Sage Hermit's Seed, Spare Headband | `heal_after_battle`, `heal_on_kill`, revivir |
| **riesgo** | Cursed Seal Shard | `jutsu_bonus` +30 % **y** `increase_damage_taken` +15 % |
| **jefe** | Kubikiribōchō, Sand Gourd, Rinnegan Shard | `heal_on_kill`, `low_hp_reduction`, `ignore_defense` total en el primer jutsu |
| **consumible** | Soldier Pill | cura, lo resuelve el store |

Falta la categoría **económica** (más oro, más XP, descuentos). Las pasivas encajan sin problema en
`_aplicarVictoria`, pero **no hay sprite para objetos nuevos**: los 10 actuales agotan
`sprite-objetos-iniciales.png`. Se ha dejado fuera antes que meter pasivas sin usuario o objetos sin
arte. Queda anotado en el roadmap.

## Pasivas nuevas, todas con usuario

`jutsu_bonus`, `increase_damage_taken`, `low_hp_reduction`, `heal_after_battle`, más un parámetro
`soloPrimero` en `ignore_defense` (el Fragmento del Rinnegan perfora la defensa **entera**, pero solo
en el primer jutsu del combate: hacerlo cada turno rompería el combate).

`increase_damage_taken` existe en vez de usar `reduce_damage_taken` con cantidad negativa porque su
frase es otra: "recibes un 15 % más de daño" se entiende; "recibes un −15 % menos" no.

## Dos clases de efecto, y por qué

- **`pasivas`** — las resuelve el motor durante el combate.
- **`efecto`** — las resuelve el store: el consumible que cura y el revivir de un solo uso. Ese
  último no es una pasiva de combate porque pasa **entre** rondas y consume el objeto del personaje;
  meterlo en el motor obligaría a que `engine/` supiera de inventarios.

`heal_after_battle` es el caso intermedio: está en el catálogo (para tener id validado y frase), pero
su enganche es `TRAS_COMBATE` y **`combat.js` no lo consulta nunca** — lo lee el store con
`cantidadDePasiva` al resolver la victoria.

Un test comprueba que todo objeto tiene **o pasivas o efecto, nunca los dos ni ninguno**.

## `engine/items.js` borrado

Solo servía para sumar `buffEquipable`/`buffYDebuffEquipable` a las stats. Sin objetos que den stats,
el módulo entero (y sus 9 tests) quedó muerto. Borrado en vez de dejado "por si acaso": las
bonificaciones permanentes de eventos (`mejoraPermanenteAleatoria`) siguen por su camino, que nunca
pasó por ahí.

## El simulador es ciego a esta fase

`scripts/simular-combates.mjs` da **exactamente los mismos números** que antes de la fase 3, y no es
que no haya cambiado nada: es que el simulador **nunca equipa objetos**. Mide personajes desnudos.

No es un fallo de esta fase, es el trabajo que la fase 4 tiene pendiente: para comprobar el reparto
40/30/30 hay que poder medir de dónde viene el poder, y hoy el script no sabe simular una run con
objetos encima. Es lo primero que hay que hacerle.

## Estado

Fases 1, 2 y 3 terminadas. `npm test` da 153 (bajó de 157 al borrar `items.test.js`, y subió con
cuatro invariantes de objeto). Queda la **fase 4**: curva de niveles aplanada y recalibración de los
tres arcos.
