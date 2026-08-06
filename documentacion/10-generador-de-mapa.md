# Generador de mapa (`src/engine/mapGenerator.js`)

## `generarMapa(arco)`

Genera un grafo de nodos por pisos a partir de la config de un arco (cualquiera de los 3 del MVP: `arcs/pais-de-las-olas.json`, `arcs/examen-chunin.json`, `arcs/invasion-de-pain.json`):

- Cada piso tiene entre `nodosPorPiso.min` y `nodosPorPiso.max` nodos (excepto el último, que es siempre 1 solo nodo de tipo `jefe`).
- El tipo de cada nodo normal se elige por peso según `poolTiposNodo`.
- El piso `pisoMiniJefe` fuerza a que uno de sus nodos sea de tipo `miniJefe`.
- Cada nodo se conecta con 1-2 nodos del piso siguiente (por proximidad de índice), y se garantiza que ningún nodo se quede sin conexión entrante.

Devuelve `{ arcoId, pisos, nodos, nodosIniciales }`.

## `calcularNivelPorPiso(piso, arco)`

**Escalado aditivo, no exponencial**: `nivel = nivelEnemigoBase + (piso - 1) * escaladoNivelPorPiso`. Detalle completo de la progresión por arco en [11 - Progresión y arcos](./11-progresion-y-arcos.md) — el jefe final de la run (Pain, arco 3) sale a nivel 100, coincidiendo con `config.progresion.nivelMaximo`.

## `resolverEnemigoDeNodo(nodo, arco)`

Devuelve `{ enemigoBase, nivel }` listo para pasar a `store.jugarCombate()`. Como `common-enemies.json` y `enemies.json` usan el mismo esquema que un personaje (`statsBase`, `jutsu`, `modo`), **no hace falta normalizar nada** antes de pasarlo a `crearLuchador`:

- Nodo `jefe` → busca en `enemies.json → jefes` por `arco.jefeFinalId` (Zabuza, en el arco del MVP).
- Nodo `miniJefe` → busca en `enemies.json → jefes` por `arco.miniJefeId` (Haku).
- Nodo `combate` → 20% de probabilidad de enemigo nombrado (`common-enemies.json → enemigosNombrados`), 80% plantilla genérica aleatoria (`plantillasGenericas`).
- Nodo evento/tienda/descanso/reclutamiento → `null`.

