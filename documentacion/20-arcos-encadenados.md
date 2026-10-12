# Arcos encadenados en una sola run

## Antes de esto

`App.jsx` solo arrancaba `pais_de_las_olas` y no había ninguna transición al arco siguiente — al
derrotar a Zabuza (jefe final del primer arco), el combate terminaba y no pasaba nada más útil:
`volverAlMapa()` volvía... a un mapa que ya no tenía más nodos por delante. Ganar el primer arco no
llevaba a ningún sitio.

## `ORDEN_ARCOS` (interno de `useGameStore.js`)

```js
const ORDEN_ARCOS = [arcoPaisDeLasOlas, arcoExamenChunin, arcoInvasionDePain];
```

Orden fijo, hardcodeado — no hay ninguna razón para que sea configurable en el MVP (solo hay una
secuencia narrativa posible: País de las Olas → Examen Chunin → Invasión de Pain). `iniciarRun`
usa `ORDEN_ARCOS[0]` como arco por defecto si no se le pasa uno explícito (los tests siguen
pasando su propio arco de prueba sin que esto los afecte).

## Cómo se detecta "esto es el final de un arco" vs "esto es el final de LA RUN"

Dos preguntas distintas, cada una con su propia señal en los datos — no hay que inferir nada:

1. **¿Este combate acaba de cerrar un arco?** `enemigoBase.id === arcoActualDatos.jefeFinalId` — el
   enemigo derrotado era el jefe final del arco en curso (nodo `jefe`). Ya se calculaba así para el
   logro `completarArcoSinDerrotas` (`_evaluarLogrosPorVictoria`); ahora `jugarCombate` hace el
   mismo cálculo y lo expone en el resumen como `resumen.arcoCompletado`.
   **Además, `arcoCompletado` cura y revive a todo el equipo al instante** (`_curarEquipoCompleto`,
   la misma función que usa el nodo de descanso), estilo Slay the Spire: superar el jefe de un acto
   te deja el equipo a HP completo de regalo antes de continuar, sin tener que ir a buscar un nodo
   de descanso justo después de la pelea más dura del arco. Deja además un aviso en `AvisoToast`
   ("Equipo curado por completo al superar el arco.").
2. **¿Esto es el final de la run entera?** `enemigoBase.recompensa?.finDeLaRun === true`. Solo Pain
   (Camino Deva, `jefeFinalId` del tercer arco) lo lleva en `enemies.json`. Si se cumple a la vez
   que (1), `jugarCombate` marca `runTerminada: true, runGanada: true` en el momento mismo de la
   victoria — no hace falta ninguna lista de "es el último arco de `ORDEN_ARCOS`", el dato ya lo
   dice él solo. (Antes de esta sesión, `recompensa.finDeLaRun` no lo leía ningún código — estaba
   listado como pendiente en el backlog; ya no.)

## `avanzarSiguienteArco()` (store)

Se llama cuando `arcoCompletado` es `true` pero `runTerminada` no lo es (es decir: se ganó un arco
que NO era el último). Busca el arco actual en `ORDEN_ARCOS` y genera el mapa del siguiente:

```js
avanzarSiguienteArco() {
  const indiceActual = ORDEN_ARCOS.findIndex((a) => a.id === arcoActualId);
  const siguienteArco = indiceActual === -1 ? null : ORDEN_ARCOS[indiceActual + 1];
  if (!siguienteArco) return false;
  set({ arcoActualId: ..., arcoActualDatos: siguienteArco, mapa: generarMapa(siguienteArco), ... });
  return true;
}
```

**A propósito NO toca** `equipo`, `oro`, `inventario` ni `buffsTemporales` — esa es la razón de ser
de encadenar arcos: el progreso se mantiene, la run sigue siendo la misma, solo cambia el mapa.
Sí resetea `nodoActualId` (empiezas el arco nuevo desde su piso 1) y `huboDerrotaEnEsteArco`
(el logro `completarArcoSinDerrotas` es por arco, no acumulado entre arcos).

Devuelve `false` sin tocar nada si el arco actual no aparece en `ORDEN_ARCOS` (arco de prueba en
tests) o si ya era el último — así la UI puede comprobar el resultado sin arriesgarse a un estado
inconsistente.

## `CombatScreen.jsx`: tres desenlaces posibles tras un combate ganado

- `runTerminada` (venció a Pain, o cayó todo el equipo en cualquier combate) → botón **"Ver
  resultado"** → `irAGameOver()` → `GameOverScreen` (ver [17](./17-game-over.md), ahora distingue
  victoria de derrota con `runGanada`).
- `resultado.arcoCompletado` sin `runTerminada` (jefe de un arco intermedio) → botón **"Continuar
  al siguiente arco"** → `avanzarSiguienteArco()` → vuelve directo al mapa, ya en el arco nuevo.
- Cualquier otro combate ganado → botón **"Continuar"** de siempre → `volverAlMapa()`.

## Qué se dejó fuera a propósito

- **Evento narrativo de transición entre arcos** ("de paso, considerar un evento especial tras el
  jefe de cada arco" en el roadmap): no implementado en esta sesión. Hoy pasar de un arco al
  siguiente es instantáneo (un clic, "Continuar al siguiente arco" → mapa nuevo). Si se quiere
  añadir una pausa narrativa, el punto de enganche natural es sustituir la llamada directa a
  `avanzarSiguienteArco()` por una pantalla intermedia que la llame al terminar.

## Testing

`store/useGameStore.test.js`, sección "encadenar arcos":
- Derrotar al jefe final de un arco marca `arcoCompletado` en el resumen sin terminar la run.
- Derrotar a un enemigo con `recompensa.finDeLaRun` marca `runTerminada`/`runGanada` en `true`.
- Derrotar al jefe final de un arco cura y revive a todo el equipo (con alguien derrotado y otros a
  1 HP de antemano, todos acaban a HP completo y sin `derrotado`).
- `avanzarSiguienteArco()` pasa al siguiente arco de la secuencia manteniendo equipo y oro.
- `avanzarSiguienteArco()` no hace nada (devuelve `false`) si el arco actual no está en
  `ORDEN_ARCOS`, o si ya es el último.

## Pantalla de transición entre arcos (punto 19, 2026-10-12)

Al ganar al jefe final de un arco que no es el último, el combate ya no llama a
`avanzarSiguienteArco`: llama a `irATransicionArco()` y entra `TransicionArcoScreen`
(`components/ArcTransition/`), que es quien avanza de arco **al salir**. Tres tiempos, cada uno con
una sola cosa que contar y su sonido:

1. **Cierre** — el nombre del arco cae como un sello, con el jefe tumbado (`arcoSuperado`: redoble de
   taiko y campana).
2. **Curación** — las barras se llenan desde donde acabó la pelea y los caídos se levantan con el
   humo del shunshin (`curar` y `relevo`). Era lo que el jugador no veía: la curación de fin de arco
   existía desde siempre y se contaba con un `<p>`.
3. **Lo siguiente** — el nombre del arco que viene sobre el fondo de su columna del mapa
   (`FONDO_COLUMNA`, movido a `common/fondosDeArco.js` para compartirlo) y el botón "Begin"
   (`nuevoArco`: koto que sube y se queda abierto).

Avanza sola, se salta con clic o Espacio (al tercer tiempo, **sin** avanzar de arco: el segundo Espacio
es el que empieza), y con la velocidad instantánea sale ya en el tercero.

⚠️ **La curación ya ha ocurrido cuando la pantalla se pinta**: `_curarEquipoCompleto` corre al morir el
jefe. Lo que se enseña sale de `resumen.curacionDeArco`, la foto de justo antes que guarda
`jugarCombate` — la misma trampa que `equipoAlEmpezar`: **cuando la pantalla empieza, el store ya tiene
el estado final**. Con `equipo`, los caídos salían de pie desde el primer fotograma.

