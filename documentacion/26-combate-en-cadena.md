# Combate en cadena (entrenadores)

Mecánica inspirada en los entrenadores de Pokémon: algunos nodos de combate
encadenan varios enemigos uno tras otro, con el HP del equipo persistiendo
entre peleas. El jugador no puede curarse ni volver al mapa entre peleas de
la cadena.

## Tipos de encuentro

| Tipo | Cadena | Ejemplo |
|------|--------|---------|
| Encuentro aleatorio | 1 genin (solo) | Genin Rival katon |
| Entrenador | N genins + 1 nombrado | Genin + Genin + Zaku |
| Mini-jefe | 1 combate (hardcodeado en arc) | Haku, Kabuto, Camino Animal |
| Jefe final | 1 combate (hardcodeado en arc) | Zabuza, Gaara, Pain |

El 20% de los nodos de `combate` resuelven a un enemigo nombrado
(`resolverEnemigoDeNodo` en `mapGenerator.js`). Si el enemigo tiene
`esEntrenador: true`, se genera la cadena.

## Datos (`common-enemies.json`)

Campos añadidos a `enemigosNombrados`:
- `esEntrenador: true` — activa la cadena.
- `geninAntes: N` — cuántos genins del pool `plantillasGenericas` preceden al
  nombrado. Zaku y Dosu tienen 2; Kin tiene 1.

## Lógica del store

`generarCadenaEntrenador(namedEnemy, nivel)` construye el array de combates:
```
[{ enemigoBase: genin1, nivel }, { enemigoBase: genin2, nivel }, { enemigoBase: namedEnemy, nivel }]
```

Los genins son elegidos al azar de `plantillasGenericas` (sin repetir) con
el mismo nivel de piso que el nombrado.

**Estado:** `cadenaEnemigos: { enemigos: [...], indiceActual: 0, recompensasAcumuladas }` —
persiste mientras dure el nodo. Se limpia en `volverAlMapa`, `avanzarSiguienteArco` e `iniciarRun`.

**Recompensas: se acumulan y se enseñan UNA vez, al final.** `recompensasAcumuladas`
(`{ oro, objetos }`) va sumando lo de cada eslabón dentro de `jugarCombate`, y el resumen del combate
lleva el total en curso en vez de solo lo de ese eslabón. Vive en `cadenaEnemigos` y no en la run
porque es de la cadena: al limpiarla se tira con ella.

Antes el resumen traía solo lo de ese combate y `CombatScreen` lo pintaba en cada eslabón — tres
carteles de "+N Gold" que aparecían y se iban en 1,6 s, y ninguno decía cuánto llevabas ganado. No se
notaba mientras la recompensa era una línea inline; al convertirla en un panel con marco quedó a la
vista. `recompensas.objetos` es una **lista** justo por esto: hoy ningún enemigo encadenado lleva
objeto, pero con un campo singular el segundo objeto de una cadena se habría perdido en silencio el
día que lo lleve.

**Buffs temporales:** `_consumirUsoBuffsTemporales` solo se llama al final del
último combate de la cadena (`jugarCombate(..., consumirBuffs = true/false)`).
Toda la cadena cuenta como 1 solo "combate" a efectos del desgaste de buffs.

**Acciones:**
- `avanzarANodo` detecta `esEntrenador`, inicializa `cadenaEnemigos` y llama
  `jugarCombate` con `consumirBuffs = false` para el primer genin.
- `continuarCadena()` incrementa `indiceActual`, llama `jugarCombate` con
  `consumirBuffs = true` solo si es el último de la cadena.

## CombatScreen

Cuando `cadenaEnemigos.enemigos.length > 1`:
- Indicador en cabecera: "COMBATE 1 / 3" (en rojo tenue).
- Al ganar un combate no final: mensaje pulsante "Siguiente enemigo (2/3)..." —
  **auto-avance** automático a los 1600 ms via `useEffect`, sin botón.
- Al ganar el último combate: botón **Continuar** normal (vuelve al mapa) y, ahí sí, el panel de
  recompensas con el total de la cadena.
- Si el jugador muere en cualquier pelea de la cadena, el flujo de Game Over
  normal tiene prioridad (`runTerminada` se chequea antes en la UI).

## Nodo en el mapa

El tipo de encuentro se pre-determina al generar el mapa (`generarMapa`):
`subtipo: 'entrenador'` (20%) o `subtipo: 'aleatorio'` (80%) en cada nodo
de tipo `combate`. `resolverEnemigoDeNodo` lee `nodo.subtipo` en vez de tirar
el dado al entrar — el icono del mapa ya refleja lo que hay dentro.

`MapScreen` convierte `tipo === 'combate' && subtipo === 'entrenador'` en el
tipo visual `combateEntrenador`: icono `★`, color naranja-rojo (borde katon),
tooltip "Ninja nombrado con escolta de genins — combate encadenado."
Placeholder hasta sprites dedicados (roadmap punto 7).

## Rondas encadenadas dentro de un combate vs. cadena de combates

Son dos niveles distintos que coexisten:
- **Rondas** (dentro de `jugarCombate`): tu personaje activo cae → entra el
  siguiente contra el MISMO enemigo. Contador "Ronda X de N" en CombatScreen.
- **Cadena** (entre llamadas a `jugarCombate`): el enemigo cae → siguiente
  enemigo del nodo entra con sus HP completos. Contador "Combate X/N".
