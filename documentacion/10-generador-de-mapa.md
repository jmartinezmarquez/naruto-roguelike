# Generador de mapa (`src/engine/mapGenerator.js`)

## `generarMapa(arco, opciones)`

Genera un grafo de nodos por pisos a partir de la config de un arco (cualquiera de los 3 del MVP):

- **Piso 1: un único nodo `inicio`**, que nace ya `visitado: true` y no se juega — es la casilla de
  salida, como en un Pokelike. `generarMapa` devuelve su id en `mapa.nodoInicialId` y el store
  arranca la run plantado ahí (`iniciarRun`, `avanzarSiguienteArco`), así que las primeras opciones
  reales son sus conexiones, no el piso entero. En la UI se pinta como un disco oscuro con un tick.
- **Forma de diamante**: `anchoDelPiso(piso, ...)` propone el número de nodos del piso — estrecho
  en los extremos del arco, ancho en el centro (dentro de `arco.nodosPorPiso.min/max`), con algo
  de ruido aleatorio. El último piso es siempre 1 solo nodo de tipo `jefe`.
- **Dos pisos seguidos nunca tienen el mismo ancho** (`anchosDeLosPisos`): después de proponer los
  anchos se corrigen en una pasada — si un piso repite el ancho del anterior, sube uno y, si no
  cabe en `max`, baja uno. Sin esto el ruido repetía anchos y salían tramos rectos en vez de rombo.
  Dos casos aparte: el piso justo después de la salida se abre **como mucho a 3** (del nodo de
  inicio salen todas las aristas de ese piso, y con 4-5 el arranque parecía una estrella en vez del
  pico de un rombo), y el piso anterior al jefe se fuerza a ≥2, tanto para romper con el 1 del jefe
  como para que `garantizarDescansoAntesDelJefe` tenga dónde poner el descanso sin pisar al mini-jefe.
- El tipo de cada nodo normal se elige por peso según `poolTiposNodo`.
- **Piso 2 (el primer piso jugable): nunca `descanso` ni `tienda`.** Descanso no tiene sentido a HP
  completo; tienda no tiene sentido sin oro todavía. Se filtran del pool solo para ese piso. La
  regla era del piso 1 hasta que el 1 pasó a ser la casilla de salida.
- **Máximo 2 nodos de `tienda` por piso.** Si el sorteo por peso pone más, los nodos sobrantes se
  reasignan a otro tipo (pool sin tienda) en una pasada posterior.
- El piso `pisoMiniJefe` fuerza a que uno de sus nodos sea de tipo `miniJefe`.
- Cada nodo se conecta con 1-2 nodos del piso siguiente (por proximidad de índice), y se garantiza
  que ningún nodo se quede sin conexión entrante.
- **`garantizarDescansoAntesDelJefe`**: el piso INMEDIATAMENTE ANTERIOR al jefe final
  (`pisos[arco.pisoJefeFinal - 2]`, ya que `pisos` es 0-index) siempre tiene al menos un nodo de
  tipo `descanso` — igual que el Centro Pokémon justo antes del gimnasio en un Pokelike. Si ese
  piso ya tiene uno (por el sorteo normal), no toca nada; si no, convierte uno de sus nodos a
  `descanso` (cualquiera menos `miniJefe`, que no se puede reemplazar). Primer intento descartado:
  trazar un único camino concreto desde el inicio y forzar un descanso en algún punto de ese
  camino — funcionaba, pero no se correspondía con el patrón real de un Pokelike (el descanso está
  siempre pegado al jefe, no en cualquier punto del recorrido).

- **`colocarNodosDeReclutar`**: los pergaminos **no salen del sorteo por peso**. Se coloca uno
  seguro por arco, y un segundo solo con `arco.probabilidadSegundoNodoReclutar` (0,15). El equipo
  tiene 3 huecos para toda la run, así que a partir del segundo pergamino la decisión ya no existe:
  con `reclutar` en `poolTiposNodo` salían cuatro y cinco por arco y casi todos se saltaban.
  Colocándolos aquí el número es **exacto**, no una esperanza estadística. Van después del descanso
  garantizado, nunca pisan `inicio`/`jefe`/`miniJefe`/`descanso`, y cuando hay dos van en pisos
  distintos. Ver [28](./28-nodo-reclutar.md).
- **Rareza de los nodos de `reclutar`** (`elegirRarezaReclutar`): cada pergamino nace verde
  (`comun`) o dorado (`legendario`), sorteado con los pesos de `arco.poolRarezaReclutar`.
  Se decide **aquí y no al entrar en el nodo** porque el mapa pinta el pergamino: el jugador tiene
  que ver qué le espera antes de elegir a dónde va — y el dorado, además, es un combate
  (ver [28](./28-nodo-reclutar.md)).
  El reparto va en una pasada **al final**, cuando el tipo de cada nodo ya no va a cambiar: hasta
  entonces un `reclutar` todavía podía nacer del reparto de tiendas sobrantes o convertirse en el
  descanso garantizado.
  `opciones.rarezasReclutarDisponibles` son las rarezas que de verdad tienen candidatos en esta run.
  Las calcula el **store** (`rarezasReclutarDisponibles`), que es quien conoce equipo y logros; el
  motor no puede saberlo y sigue siendo agnóstico del contenido. Por defecto solo `comun`, para que
  un mapa generado a ciegas no prometa lo que no puede cumplir.

Devuelve `{ arcoId, pisos, nodos, nodosIniciales }`.

## `calcularNivelPorPiso(piso, arco)`

Escalado aditivo fijo por piso, usado solo para combates normales (`nivel = nivelEnemigoBase + (piso-1)*escaladoNivelPorPiso`).
Los mini-jefes/jefes usan un nivel fijo explícito (`arco.nivelMiniJefe`/`arco.nivelJefeFinal`), no
esta fórmula — ver [11 - Progresión y arcos](./11-progresion-y-arcos.md) para la historia completa
de por qué (incluye un intento de escalado dinámico que se descartó).

## `resolverEnemigoDeNodo(nodo, arco)`

Devuelve `{ enemigoBase, nivel }` listo para `store.jugarCombate()`, o `null` para
evento/tienda/descanso (sin combate):

- Nodo `jefe` → `enemies.json → jefes` por `arco.jefeFinalId`, nivel = `arco.nivelJefeFinal`.
- Nodo `miniJefe` → por `arco.miniJefeId`, nivel = `arco.nivelMiniJefe`.
- Nodo `combate` → 20% enemigo nombrado / 80% plantilla genérica, nivel = `calcularNivelPorPiso`.

Como `common-enemies.json` y `enemies.json` usan el mismo esquema que un personaje, no hace falta
normalizar nada antes de pasarlo a `crearLuchador`.
