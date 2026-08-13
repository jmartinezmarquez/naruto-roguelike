# Sistema de pasivas

Implementa el punto 1 del [roadmap](./05-roadmap.md) entero (fases 1 a 4), a partir del
[27](./27-sistema-de-balance.md).

## Por qué

Niveles, transformaciones y objetos subían los mismos cuatro números, así que la única palanca de
balance era "más grande" y el juego hacía bola de nieve. Medido: con `crecimientoStatsPorNivel: 0.08`
lineal (hoy 0,03, ver fase 4), un Naruto de nivel 100 tenía 80 de ataque frente a 9 en el nivel 1, y
el mejor objeto legendario del juego daba **+4 planos**. Los objetos eran más fuertes al empezar la
run que al terminarla, justo al revés de lo que se quiere.

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

### Una pasiva por id, y `normalizarPasivas` es idempotente

Dos reglas que viven en `normalizarPasivas` y que salieron las dos del mismo playtest:

- **Si el modo y el objeto dan la misma pasiva, se aplica UNA vez** — se queda la de mayor
  `cantidad`. Pasa de verdad: el Manto de Chakra de Naruto y el Sello de Chakra dan los dos
  `first_jutsu_bonus`, y antes se aplicaban las dos (`aplicarModificadores` pliega todas las del
  enganche, una detrás de otra). Eso multiplicaba el efecto y convertía esa combinación concreta en
  la única jugada buena del juego, sin que nada lo dijera. Se queda la más fuerte y no la primera
  para que equipar un objeto nunca pueda empeorar a un personaje: o mejora, o no hace nada.
- **Normalizar dos veces no puede tirar la cantidad declarada.** Era un bug real y silencioso: el
  store normaliza las pasivas del objeto equipado (`pasivasDeObjetoEquipado`) y `crearLuchador` las
  vuelve a normalizar al juntarlas con las del modo. La segunda pasada metía
  `{enganche, objetivo, parametros}` **dentro** de `parametros`, así que `parametros.cantidad`
  acababa siendo la del catálogo. Traducido: **ningún objeto estaba aplicando su valor real** — el
  `heal_on_kill: 0.28` de la Semilla del Sabio curaba 0,10. Y no saltó en ningún sitio porque
  `simular-combates.mjs` pasa las pasivas **en crudo** y normaliza una sola vez: el simulador medía
  los números buenos y el juego corría con otros. Hay un test por cada una de las dos reglas.

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

## Fase 4 — Curva de niveles y recalibración

### Primero, hacer que el simulador mida

`scripts/simular-combates.mjs` daba **exactamente los mismos números** antes y después de la fase 3,
y no era que no hubiera cambiado nada: es que **nunca equipaba objetos**. Medía personajes desnudos.
Peor todavía, *suponía* el nivel del jugador interpolando entre los niveles de jefe del arco, o sea
que daba por buena justo la conclusión que hacía falta demostrar.

Ahora imprime cuatro bloques:

| Bloque | Qué mide | Para qué |
|---|---|---|
| 0 | Nivel real del jugador piso a piso, con la XP simulada | Que los niveles fijos del arco signifiquen algo |
| 1 | Balance por arco, personajes desnudos | El histórico, comparable antes/después |
| 1b | Los 6 jefes con el equipo de 3 **en cadena** | La única medida honesta de un jefe |
| 2 | Peso de cada objeto en combate real | Si un objeto se nota o no |
| 3 | De dónde viene el poder: niveles / transformación / objeto | El reparto 40/30/30 |

Dos decisiones del instrumento que importan:

- **El bloque 1b existe porque el 1 vs 1 no dice nada de un jefe.** Zabuza se ganaba el 7% de las
  veces en 1 vs 1, un número del que no se puede concluir absolutamente nada: lo que decide la run
  es si tres personajes en cadena lo tumban. Se simulan los 364 tríos posibles del roster, y el
  trío llega al mini-jefe **con el HP que le deje el camino** (los pisos anteriores se juegan, y el
  HP persiste entre nodos como en el juego). Al jefe final sí llega curado, porque el generador
  garantiza un descanso en el piso anterior. Medir un mini-jefe con el equipo intacto era medir un
  combate que no existe: Haku pasó del 87% al 80% al dejar de suponerlo.
- **El bloque 3 mide contra un maniquí inmortal**, no contra enemigos del juego. Poder = daño que
  repartes antes de caer, que multiplica ofensa por supervivencia en un solo número y hace
  comparables cosas tan distintas como "+45% al primer jutsu" y "el primer golpe recibido hace la
  mitad". Inmortal porque si pudiera morir, todo personaje de sobra fuerte tocaría el mismo techo.
  El precio: las pasivas de rematar (`heal_on_kill`) no se disparan ahí, y se miden en el bloque 2.

El maniquí tiene el ataque de un jefe (12) y no la media del roster (9) por un motivo concreto: con
9, su golpe contra los personajes más defensivos del arco 3 caía al mínimo de 1, y ahí
`calabaza_arena` más la reducción del modo lo dejaban en 0. Chōji y Yamato se volvían literalmente
inmortales y su medida no terminaba nunca. Un patrón que no puede matarte no mide tu supervivencia.

### Lo que la medida encontró

Que el problema no era `crecimientoStatsPorNivel`, que es lo que esta fase venía a arreglar. Era la
**economía de XP**: el jugador llegaba a Zabuza (Nv.4) siendo nivel 9, a Gaara (Nv.24) siendo 34 y a
Pain (Nv.49) siendo 70. La recalibración completa está en
[11 - progresión y arcos](./11-progresion-y-arcos.md), sección "v4".

### Reparto del poder, antes y después

| Arco | Antes (niveles/transf./objetos) | Después |
|---|---|---|
| País de las Olas | 92 / 0 / 8 | **62 → 58 / 21 / 21** |
| Examen Chunin | 70 / 18 / 11 | **49 / 27 / 24** |
| Invasión de Pain | 48 / 37 / 15 | **31 / 47 / 22** |

Tres cambios lo movieron: aplanar `crecimientoStatsPorNivel` de 0,08 a 0,03, bajar los tier 1 de las
transformaciones al arco 1 (antes el primer arco entero se jugaba sin ninguna), y subir las
cantidades de las pasivas de objeto (`first_jutsu_bonus` 0,25 → 0,45; `heal_on_kill` 0,2 → 0,4;
`jutsu_bonus` 0,3 → 0,5; `ignore_defense` deja de ser solo del primer jutsu).

**Los objetos se quedan en el 21-24%, no en el 40% que pide el doc 27.** Es deliberado: llegar al 40%
exigiría que un único objeto equipado pesara más que la transformación entera del personaje, y solo
hay un hueco de equipo. Frente al **1,5% con el que empezó este rediseño**, el objetivo de fondo —que
los objetos existan— está cumplido. El 40% se puede revisar cuando haya más huecos o una categoría
económica.

## Estado

Las cuatro fases terminadas. `npm test` da 160 (153 más siete invariantes de progresión y de arco).
