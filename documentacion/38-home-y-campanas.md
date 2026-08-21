# Home y campañas (punto 18)

La puerta del juego: una pantalla que lista las campañas y desde la que se empieza a jugar.
`components/Home/HomeScreen.jsx`, `pantalla: 'home'`, y los datos en `src/data/campaigns.json`.

## Por qué existe con UNA sola campaña

Porque el punto no es la pantalla, es **que la campaña pase a ser un dato**. Hasta ahora estaba escrita
a medias en dos sitios:

- `ORDEN_ARCOS`, una constante de `useGameStore` con los tres arcos del MVP en su orden;
- una llamada de `App.jsx` que arrancaba la run **en el arco 1 a pelo**.

O sea que añadir una segunda campaña era tocar código en dos ficheros distintos, que es justo lo que la
regla del proyecto prohíbe ("el motor es agnóstico del contenido"). Ahora el store solo resuelve
`id → JSON` (`ARCOS_POR_ID`) y **quién juega qué, en qué orden, lo declara `campaigns.json`**. Hacerlo
con una campaña es cuando sale barato; con dos ya habría que desmontar algo.

## Lo que arregla de paso, y no es pequeño

⚠️ **Missions, el Bingo Book y los Ajustes solo se abrían desde el menú del mapa**, o sea **solo dentro
de una partida** — que es exactamente cuando no interesan. Las tres son meta-progresión: se miran
*entre* partidas. Y tras un game over, "New Run" devolvía a elegir personaje sin pasar por ninguna, así
que se podía desbloquear un logro y no tener forma de ir a verlo sin empezar otra run.

Con el Home tienen su sitio — y por eso el game over lleva también su botón: era **el momento exacto**
en que más apetece mirar Missions (acabas de desbloquear algo) y el único desde el que no se podía.

Y eso obligó a una regla nueva en el store:

> ⚠️ **Si no hay run, `volverAlMapa` lleva al Home.** Las tres pantallas se cierran con esa acción, y
> desde el Home cerrarlas llevaba a un mapa que no existe: pantalla en blanco. "Volver" significa *a
> donde estabas*, y sin partida eso es el Home.

## Las tres salidas de una run, que no son la misma

| Acción | A dónde | Pregunta antes |
|---|---|---|
| `reiniciarRun` (menú · Restart run, y "New Run" del game over) | Selección de personaje, **misma campaña** | Sí, salvo tras un game over (ahí la run ya está perdida) |
| `irAlHome` (menú · Home) | Home | Sí |
| Selección de personaje → **← Back** | Home | No: todavía no hay run |
| Game over → **New Run** | Selección de personaje, misma campaña | No: la run ya está perdida |
| Game over → **Home** | Home | No, por lo mismo |

⚠️ **Reiniciar NO lleva al Home**, y la diferencia importa: quien acaba de perder quiere volver a
intentarlo, no volver a escoger campaña. Meterle el selector en medio es un paso de más en el momento
en que menos paciencia hay.

⚠️ **En el game over ninguna de las dos pregunta**, y la asimetría con el menú del mapa es
deliberada: allí salir cuesta la partida en curso, y aquí ya no hay partida que perder. **Una
confirmación sin nada que confirmar es ruido**, y de paso enseña al jugador a decir que sí sin leer —
que es justo lo que no quieres el día que la confirmación sí importe.

⚠️ **Y las dos salidas voluntarias preguntan**, porque **no hay guardado** (ver "Descartado" en el
roadmap): salir de una run es perderla. Las dos usan la misma ventana (`PanelAbandonarRun`) con distinto
texto — decir lo mismo con otras palabras en dos sitios es la forma barata de que parezcan dos mecánicas.

## La quinta entrada del menú, que es la prueba del punto 16

El Home se abre desde el menú vertical del mapa, y esa entrada **no habría cabido** hasta hace un rato:
el menú era una sola imagen con cuatro huecos pintados (ver [13](./13-ui-mapa-y-combate.md)). Es el mejor
argumento posible de por qué el 16 tenía que ir antes que el 18, y por eso se ordenaron así.

Su icono es **una casa dibujada por script** (`scripts/generar-icono-home.py`), el segundo sprite del
juego que no sale de una hoja del artista — el otro son los cascabeles. No había de dónde recortarlo:
los cuatro iconos del menú son objetos (pergamino, libro, engranaje, torii) y "volver al inicio" no
tiene objeto.

⚠️ El primer intento fue **el símbolo de Konoha**, reutilizando el recorte del favicon con el argumento
de que "volver a la aldea" y "volver al inicio" son la misma idea. No funcionaba, por dos motivos que
merece la pena recordar: **a 32 px un remolino es una mancha**, y el mismo dibujo acababa significando
dos cosas distintas en la misma sesión (la pestaña y una entrada de menú). Una casa se lee al tamaño al
que hay que verla y dice "inicio" sin que haya que aprendérselo.

⚠️ Y se exporta a **32×32 exactos, sin ampliar**: el menú lo pinta a 32 px, así que a tamaño natural no
hay reescalado y no puede estropearlo ni el `pixelated` global ni el `.imagen-suave`. Los otros cuatro
sí se amplían, porque vienen de una hoja con mucho más detalle.

## Lo que NO hace, a propósito

- **No escribe una segunda campaña.** Eso es contenido nuevo —arcos, enemigos, objetos— y sigue en el
  backlog.
- **No hay campañas bloqueadas.** El campo está anotado en `_pendienteDeImplementar` del JSON: con una
  sola, un candado que nunca se abre es peor que no tenerlo.
- **No guarda la run.** Descartado y revisado dos veces; es lo que obliga a que salir pregunte.

## "Furthest": hasta dónde llegaste

La primera fila del marcador, y la que más importa. Salió de comparar la pantalla con la de Pokelike:
allí *"Classic wins 1"* basta porque **su campaña se termina**; en un roguelike casi nadie gana. Un
jugador con seis runs perdidas ve `Runs won 0 · Runs lost 6` y **no ve ningún progreso**, cuando a lo
mejor llegó a pelear contra Pain. "Furthest: Chunin Exams · floor 5" sí lo cuenta.

⚠️ **Vive aparte de los contadores porque su semántica es la contraria**: los contadores SUMAN y esto es
un MÁXIMO. Mezclarlos en el mismo objeto es cómo se acaba sumando un récord. Es la misma razón por la
que `achievements.json` dice que no hay condición de logro por nivel alcanzado: no había dónde guardar
un máximo, y ahora sí — si algún día se quiere ese logro, este es el sitio.

⚠️ **La marca lleva el `orden` del arco dentro de su campaña**, y no es redundante: sin él no se puede
comparar "arco 3, piso 1" con "arco 2, piso 8" (gana el primero). Lo pone `useGameStore`, que sabe de
campañas; `useAchievementsStore` no, y no debe.

**Se apunta en cada nodo** (`avanzarANodo`), no al terminar la run. No es pereza: una run se acaba de
**tres** formas —morir, ganar y abandonar— y solo la primera pasa por un sitio común; así se capturan las
tres, incluida cerrar la pestaña a mitad. Sale gratis porque `registrarMarca` **solo escribe cuando
mejora el récord**: en una partida normal son unas pocas escrituras, y ninguna a partir de la segunda
hasta pasar del punto anterior. Es el mismo patrón que `registrarVistos`.

⚠️ Y con esto `reiniciarLogros` borra **cuatro** claves de `localStorage`. Cada cosa nueva que se
persista en ese store obliga a volver ahí; van cuatro y las cuatro tienen test.

## El callejón sin salida que dejó el punto

Con el Home delante, la selección de personaje pasó a ser **una pantalla intermedia**, y nació sin
salida: elegías campaña, cambiabas de idea y la única forma de volver era **elegir un ninja igualmente y
abandonar la run desde el mapa**. Antes no se notaba porque era la primera pantalla del juego y no había
de dónde venir.

Es la lección de método: **meter una pantalla delante convierte a la siguiente en un paso, y todo paso
necesita marcha atrás.** Ahora lleva un `← Back` arriba a la izquierda, como la referencia — y sin
preguntar, porque todavía no hay run que perder.
