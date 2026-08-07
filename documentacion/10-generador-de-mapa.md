# Generador de mapa (`src/engine/mapGenerator.js`)

## `generarMapa(arco)`

Genera un grafo de nodos por pisos a partir de la config de un arco (cualquiera de los 3 del MVP):

- **Forma de diamante**: `anchoDelPiso(piso, ...)` calcula el número de nodos del piso — estrecho
  en los extremos del arco, ancho en el centro (dentro de `arco.nodosPorPiso.min/max`), con algo
  de ruido aleatorio. El último piso es siempre 1 solo nodo de tipo `jefe`.
- El tipo de cada nodo normal se elige por peso según `poolTiposNodo`.
- **Piso 1: nunca `descanso` ni `tienda`.** Descanso no tiene sentido a HP completo; tienda no
  tiene sentido sin oro todavía. Se filtran del pool solo para ese piso.
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
