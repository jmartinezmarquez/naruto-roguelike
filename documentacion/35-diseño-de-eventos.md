# Diseño de los eventos (punto 6)

Este es el documento MVP que le faltaba al punto 6 — el único de la lista que no lo tenía, y por eso
llevaba meses sin poder planificarse. Se escribió **con libertad creativa** delegada por el usuario, y
la única decisión que se consultó antes de tocar nada fue la de meter azar de verdad.

## El diagnóstico: la pantalla no era el problema

Al abrir el punto, lo primero fue mirar qué había. El lavado de cara (ver
[33](./33-direccion-visual.md)) ya había pasado por `EventScreen`, así que lo de "es la única pantalla
que parece una web" estaba caducado. Lo que había era esto:

| | Antes |
|---|---|
| Eventos | 12, cuatro por arco, siempre **2 opciones** |
| Opciones que hacían **literalmente nada** (`ninguno`) | **4 de 24** |
| Azar al resolver | **ninguno**: la pista decía exactamente lo que te llevabas |

Es decir: **un evento no era una decisión, era un regalo con dos envoltorios.** Tres de los doce eran
"cosa gratis contra nada", donde no hay nada que elegir; en el resto bastaba leer dos etiquetas y pulsar
la mejor. El trabajo del punto 6 no era la pantalla, era **el contenido y las reglas**.

## Las siete reglas

1. **Un evento es un intercambio, no un regalo.** Toda opción cuesta algo: HP por XP, oro por un objeto,
   riesgo por una mejora permanente. Hay un test que falla si una elección de primer nivel es `ninguno`.
2. **La mitad de los eventos llevan una tirada de azar** (9 de 15). Es lo que convierte un menú en una
   decisión, y en runs cortas es lo que hace que dos partidas no se parezcan.
3. ⚠️ **Las probabilidades se enseñan ANTES de elegir.** Una apuesta a ciegas no es una decisión, es una
   trampa: el jugador no puede saber que va a perder hasta que ya ha perdido. Con el porcentaje delante,
   equivocarse es suyo. (Esta era una de las preguntas abiertas del punto: se responde que **sí**, la
   información sigue a la vista, y lo que se esconde es el resultado del dado, no las reglas.)
4. ⚠️ **Un evento NUNCA mata.** El HP baja como mucho a 1 y quien ya estaba caído no cae "más". Es la
   condición que hizo aceptable meter azar: perder una run por un dado, en un roguelike de runs cortas,
   no es tensión — es un castigo por jugar. Con el suelo en 1 la tirada mala duele de verdad (llegas al
   siguiente combate hecho polvo) pero la decisión sigue siendo tuya.
5. **El daño de un evento no pasa del 25% de la vida**, con test. Un evento no puede dejar al equipo tan
   tocado que el combate siguiente esté perdido de antemano.
6. **El resultado siempre se ve.** Antes el evento se resolvía en silencio y devolvía al jugador al mapa;
   con tiradas eso le escondería justo lo que acaba de apostar.
7. ⚠️ **Una apuesta tiene que pagar una PRIMA sobre la opción segura del mismo evento** — en valor
   esperado, al menos ×1,2, y las 9 están hoy entre ×1,32 y ×2,19. La varianza es en sí misma un coste:
   en un roguelike una mala tirada se arrastra al combate siguiente, así que una apuesta que solo empata
   no la coge nadie, y **un botón que nadie pulsa es contenido muerto** — exactamente lo que le pasaba a
   las opciones `ninguno` de la versión anterior. Con test.

**"Márcharse sin nada" solo existe dentro de una tirada** (el mercader al que le regateas se ofende y se
va). De primeras nunca, porque nadie pulsa ese botón.

## Los 15 eventos

Cinco por arco, y **cada uno pegado a la ficción de su arco** — no eran intercambiables antes y ahora
menos: la niebla de Zabuza en las Olas, el Bosque de la Muerte en el Examen, los escombros y la voz de
Pain en la Invasión. Los ocho que ya existían se conservan por título y por `id`; lo que cambia es que
ahora **cuestan algo**.

| Arco | Evento | La decisión que plantea |
|---|---|---|
| Olas | The Sannin on the Road | Pagar por curarte, o entrenar hasta reventar por un buff |
| Olas | The Bridge Under Construction | Trabajar (XP, agotamiento) o dormir (curación) |
| Olas | Traveling Merchant | Comprar a ciegas (40 monedas), o **regatear** (50%: por 10 / se va) |
| Olas | Abandoned Scroll | **60%** mejora permanente / **40%** el sello te quema — o venderlo sin abrir |
| Olas | Mist Over the Water | Cruzar la niebla (**55%** oro / emboscada) o rodear, tranquilo |
| Chunin | Anko Puts You to the Test | Su prueba (mucha XP, paliza) o mirar a los demás (poca XP) |
| Chunin | A Stolen Scroll | Robarlo (**55%**) o entregarlo (XP segura) |
| Chunin | Forbidden Scroll Merchant | Pergamino sellado: el objeto es seguro, pero **30%** de que esté maldito — o delatarlo por la recompensa |
| Chunin | Forest of Death Trap | Desarmar la trampa (**60%** oro) o rodearla (XP) |
| Chunin | A Rival Team Watches You | Pelear un asalto (XP, daño) o estudiarlos (buff de defensa) |
| Pain | Katsuyu | Que te cure, o robarle chakra (mucha XP, daño) |
| Pain | Konoha Rubble | Escarbar (**60%** objeto gratis / derrumbe) o atender heridos (curación) |
| Pain | Fukasaku | Senjutsu (**50%** mejora permanente / sobrecarga) o pedirle un ungüento |
| Pain | Survivor Merchant | Comprarle, o pagar medicinas para la calle (oro por curación) |
| Pain | The Voice of the Deva Path | Escuchar el sermón (**50%** buff de ataque / desánimo) o taparte los oídos (45 de XP) |

### La primera versión de los números estaba mal, y el patrón es aprovechable

El playtest lo vio antes que ningún cálculo: *"la opción sin azar es demasiado potente, apenas vale la
pena la otra"*. Medido, **5 de las 9 apuestas no compensaban**, y la peor por goleada era *Forbidden
Scroll Merchant* a **×0,08**: pagabas 35 monedas por delante y en la rama mala perdías el objeto **y** el
dinero **y** vida. Tres castigos por una tirada.

Lo que enseña, para el próximo evento que se añada:

- **El error no fue la probabilidad, fue la estructura.** Un 70% suena generoso; lo que rompía el evento
  era que el fallo cobrara tres veces. Se arregló haciendo que **el objeto sea seguro** y que lo que se
  sortee sea si además te muerde — la apuesta pasa a ser "¿está maldito?" en vez de "¿tiro el dinero?".
- **Ojo con la opción segura, que es la mitad de la comparación.** En *Traveling Merchant* la apuesta
  estaba bien: lo que desequilibraba era que comprar a ciegas por 30 monedas un objeto que vale 55 de
  media ya era un chollo. Subir el precio arregló el evento sin tocar el dado.
- **La prima hay que medirla contra la opción de al lado**, no contra una escala absoluta. Por eso el
  test compara las dos elecciones del mismo evento: aunque la tabla de valores sea discutible, las dos se
  miden con la misma vara y el error se cancela en el cociente.

## Cómo está montado

Dos tipos de efecto nuevos, y los dos son **contenedores**, no efectos:

- **`azar`** — `{ probabilidad, exito, fallo }`. Cada rama es un efecto normal y corriente.
- **`varios`** — `{ efectos: [...] }`. Es lo que permite que una opción tenga precio; sin él, una
  elección solo podía dar o solo podía quitar, y de ahí venían los regalos.

Más uno de verdad: **`perderHpEquipo`** (`{ porcentaje }`), el precio en carne.

⚠️ **`_aplicarEfectoDeEvento` es recursivo, y es lo que hace que esto no explote en casos.** Una rama de
una tirada es un efecto; una parte de un `varios` es un efecto; una rama puede contener un `varios`. Con
un `switch` plano habría hecho falta un tipo por combinación. Y `varios` aplica sus partes **leyendo el
estado en cada paso**, no todas contra la foto inicial: si una cura y la siguiente cobra, la segunda
tiene que ver lo que hizo la primera.

⚠️ **El store devuelve datos, no prosa.** `_aplicarEfectoDeEvento` devuelve `{ tipo, ...qué pasó }` —
quién recibió la mejora, qué objeto salió, cuánto oro se pagó **de verdad**— y el texto lo escribe la
pantalla (`describirResultado`). Son dos funciones parecidas y separadas a propósito: `generarPista` es
una promesa en futuro y `describirResultado` una crónica en pasado.

De paso desapareció el **toast** de curación en el mapa: desde que hay pantalla de resultado contaba lo
mismo dos veces, y encima después, ya en el mapa.

## Tests

En `store/useGameStore.test.js`, dos bloques. **Resolución**: que no vuelve al mapa al elegir, que
`varios` aplica todas sus partes, que la rama aplicada y lo que dice la tirada son la misma cosa (si no,
el jugador leería "sale bien" y cobraría el castigo), que **un evento nunca mata**, y que comprar sin oro
ni compra ni cobra. **Invariantes de los datos**: que todo tipo de efecto es uno que el store sabe
aplicar (un tipo mal escrito caería en el `default` y no pasaría nada — el fallo silencioso de siempre),
que ninguna elección de primer nivel es `ninguno`, que las tiradas declaran probabilidad y dos ramas, y
que ningún daño pasa del 25%.

## Lo que queda fuera, y por qué

- **Ilustración por evento.** 15 eventos × 1 dibujo es mucho arte para lo que aporta; y el fondo por arco
  ya lo pone el fondo de juego. Está en "Pendiente de arte" con los iconos de chakra y los del menú.
- **Tres opciones en algún evento.** Se dejó en dos a propósito: con precio y azar, dos opciones ya son
  una decisión. Una tercera se añade cuando sea un camino de verdad, no para rellenar.
- **Eventos que encadenan combate.** Hay ya suficientes combates por piso.
