# Nodo de reclutar (`components/Recruit/RecruitScreen.jsx`)

Nodo dedicado al reclutamiento, separado de la tienda desde la sesión de rediseño del roadmap punto 1.
Cubre la necesidad central de la run: empiezas con 1 solo personaje y reclutar es obligatorio para
sobrevivir los arcos siguientes.

Desde el punto 3 del roadmap el nodo tiene **dos versiones**, una por rareza de pergamino, y la
dorada no es una elección sino un combate.

## Aparición en el mapa

**Uno por arco, garantizado. Un segundo solo con `probabilidadSegundoNodoReclutar` (0,15).**

No sale del sorteo por peso como el resto de tipos: lo coloca `colocarNodosDeReclutar` a mano
(ver [10](./10-generador-de-mapa.md)). El motivo es que el equipo tiene **3 huecos para toda la
run**: con `reclutar` en `poolTiposNodo` (pesaba 22/16/12) salían cuatro y cinco pergaminos por arco,
y a partir del segundo la decisión ya no existe — o no tienes a quién meter, o estás tirando a
alguien que acabas de reclutar. Un nodo que casi siempre se salta es un nodo muerto.

El peso que dejó libre se repartió entre `evento`, `tienda` y `descanso`, **sin tocar el de
`combate`**: `nivelesEstimadosDeLaRun` calcula la XP esperada de un piso como
`pesoCombate / pesoTotal`, así que subirlo habría movido la curva de niveles de la run entera. Con
los pesos de combate intactos, los cuatro invariantes de arco siguen pasando sin recalibrar nada.

Detalles de colocación: nunca pisa un nodo que ya significa algo (`inicio`, `jefe`, `miniJefe`,
`descanso` — los tres primeros no se pueden reemplazar y el cuarto es una garantía que este código
no debe deshacer), y cuando hay dos van en pisos distintos.

Sprite del pergamino de su rareza (`assets/nodes/reclutar-<rareza>.png`), en marco cuadrado: el
pergamino no es redondo y un recorte circular le cortaría las varillas.

## Los dos pergaminos

| Pergamino | Ofrece | Personajes que puede traer |
|---|---|---|
| Verde (`comun`) | 3 cartas, eliges 1 | `comun` + `inicial` + `raro` |
| Dorado (`legendario`) | 1 rival, hay que ganarle | `legendario` |

**Lo que separa los dos pergaminos no es el poder, es cómo se consigue al ninja**: el verde es una
elección entre tres cartas, el dorado es un combate. Por eso `raro` no tiene pergamino propio — un
ninja raro no cambia la naturaleza de la decisión, solo es una carta mejor entre las tres. El azul
existió y se retiró: con un único nodo de reclutar por arco casi no llegaba a aparecer.
`assets/nodes/reclutar-raro.png` se sigue generando por si vuelve a hacer falta.

Los `inicial` (Naruto/Sasuke/Sakura) van con los comunes a propósito: son genin novatos, y además
son la red de seguridad que garantiza candidatos en la primerísima run, cuando no hay ningún logro
desbloqueado. Ver la jerarquía completa en [14](./14-reclutamiento-y-rareza.md).

**La rareza se decide al GENERAR EL MAPA** (`elegirRarezaReclutar` en `engine/mapGenerator.js`), no
al entrar en el nodo: el mapa pinta el pergamino, así que la rareza tiene que existir antes de que el
jugador elija a dónde va. Es justamente lo que faltaba antes — el nodo no sabía qué rareza ofrecía y
por eso los pergaminos de la hoja del artista llevaban meses sin usarse.

Los pesos por arco están en `poolRarezaReclutar` (arcs/*.json): el dorado va del 20% en el arco 1 al
30% en el 3. Son altos comparados con los de un sorteo por nodo porque **solo hay uno o dos nodos de
reclutar en todo el arco**: con los pesos de cuando el nodo salía cinco veces (5/8/14%) el desafío
legendario no se habría visto casi nunca.

### Por qué el motor necesita que le digan qué rarezas hay

`generarMapa(arco, { rarezasReclutarDisponibles })`. El motor no sabe nada del equipo ni de los
logros —regla del proyecto: `engine/` es puro y agnóstico del contenido—, así que la lista de
rarezas que de verdad tienen a alguien detrás se la calcula el store
(`rarezasReclutarDisponibles`) y se la pasa. Sin eso, una run recién empezada pintaría pergaminos
dorados que al abrirlos no tendrían a nadie dentro: en la primera partida no hay ni un legendario
desbloqueado.

Por defecto, sin ese parámetro, solo se sortea `comun` — un mapa generado a ciegas (tests) no promete
lo que no puede cumplir.

## Pool de candidatos

`candidatosReclutables(equipo, arco)` en el store:
1. `arcoActualDatos.personajesReclutablesIds` (vacío en País de las Olas — sin roster propio).
2. Personajes desbloqueados por logro (`desbloquearPersonajeReclutable`).
3. Los `rareza: 'inicial'` no elegidos al empezar la run.

Menos los que ya están en el equipo y menos **el jefe final y el mini-jefe del arco en curso**.

Esa última exclusión no es estética. El desafío legendario resuelve un combate de verdad, y ganarle
al `jefeFinalId` del arco en un nodo de reclutar habría disparado `arcoCompletado` dentro de
`jugarCombate`: la run habría saltado al arco siguiente desde un pergamino. Aparte de eso, reclutar
en el piso 2 a quien te espera en el 8 no se sostiene ni jugando ni en la ficción. Hay dos tests que
lo protegen.

### Degradación cuando la rareza se queda sin gente

Puede pasar a mitad de arco: dos pergaminos dorados y un solo legendario en la pool. La oferta
**degrada** a común en vez de salir vacía, y devuelve en `rareza` la que ha usado de verdad, así que
la pantalla no miente. El mapa sí se queda con el pergamino dorado dibujado — es el único punto donde
el icono puede prometer de más, y se acepta a cambio de no dejar un nodo muerto.

## El desafío legendario

`generarOfertaReclutar` marca `esDesafio: true`. La pantalla enseña **un solo rival** con su sprite,
sus stats al nivel al que va a pelear, su jutsu y su ritmo de carga: todo lo que hace falta para que
aceptar sea una decisión informada. Dos botones, `FIGHT` y `WALK AWAY`, y un aviso en rojo de que si
cae el equipo entero se acaba la run.

- **Nivel FIJO por arco** (`nivelDesafioLegendario`: 6 / 23 / 41), no relativo al equipo. Es la misma
  regla que rige a los jefes ([11](./11-progresion-y-arcos.md)): un desafío que escalara contigo
  sería siempre igual de difícil, y entonces no sería una decisión sino un peaje.
- `iniciarDesafioLegendario()` llama a `jugarCombate` como cualquier otro nodo: rondas encadenadas,
  HP el que traigas, buffs temporales consumidos.
- Al ganar, `CombatScreen` no ofrece "Continue" sino **"Recruit them"** → `irAReclutaDesafio()`
  vuelve al pergamino con `desafioGanado: true`, y ahí ya se recluta con el panel de reemplazo de
  siempre si el equipo está lleno.
- **No suelta el objeto característico de su jefe.** Ya paga con el propio legendario, que es el
  premio más gordo del juego; darle encima el Kubikiribōchō de Zabuza o la calabaza de Gaara es un
  pico de poder que se lleva por delante el resto del arco. Además esos objetos están puestos como
  recompensa de un **nodo de jefe**, y este no lo es.
- **Entra al nivel MEDIO del equipo, no al del más fuerte** como el resto de reclutas, y **sin**
  `bonusNivelAlReemplazar`. Sus stats base ya son de jefe (90 de HP y 14 de ataque contra los 38 y
  8,5 de un común); con el nivel del mejor del equipo se convertía en un personaje que gana él solo
  lo que queda de run, sobre todo si el pergamino salía pronto. El bonus de reemplazo se salta
  porque existe para que reemplazar compense frente a rellenar un hueco vacío, y un legendario no
  necesita ese incentivo — sumárselo le devolvía justo el nivel que se le acaba de quitar.
- Al perder, no hay nada especial que hacer: si ha caído todo el equipo la run termina igual que en
  cualquier otro combate.

`desafioRecluta` (estado del store) es lo que sobrevive al combate para que la pantalla de combate
sepa que al ganar hay alguien a quien reclutar. Lo limpian `volverAlMapa`, `avanzarSiguienteArco` y
`reiniciarRun`.

### Balance medido

`node scripts/simular-combates.mjs`, bloque **"Desafío legendario"**: se mide igual que un jefe
—trío en cadena y con el HP que deje el camino— porque mecánicamente *es* un jefe metido en mitad
del arco.

| Arco | Nivel | Piso 3 | Piso 6 |
|---|---|---|---|
| País de las Olas | 6 | 40-53% | 71-84% |
| Examen Chunin | 23 | 44-65% | 54-77% |
| Invasión de Pain | 41 | 40-61% | 68-89% |

(Medido antes de quitarle el objeto de recompensa, que no cambia el combate: el objeto se daba al
ganar. Lo que sí cambia es lo que vale ganarlo.)

El abanico entre el piso 3 y el 6 es enorme, y es inherente a que el nivel del enemigo sea fijo
mientras el jugador sube: el mismo pergamino es una trampa temprano y un regalo tarde. Se acepta
porque **el nodo es opcional y se ve desde el mapa** — el jugador decide con la información delante,
que es exactamente lo que no pasaría si el desafío fuera obligatorio.

## Interacción (pergaminos verde y azul)

- Un solo clic en la carta recluta al ninja directamente.
- Si el equipo ya está lleno (`tamanoMaximo`), se muestra un panel `PanelReemplazo` modal pidiendo
  a quién expulsar antes de confirmar. Cancelar vuelve a las 3 cartas sin coste.
- Al reemplazar, se aplica `bonusNivelAlReemplazar` sobre el nivel base — reemplazar sigue siendo
  mejor que rellenar un hueco vacío.
- El nivel de entrada es `Math.max(1, ...equipo.map(p => p.nivel))`, para que el recluta no entre muy
  por debajo del resto.

## Sprites

`scripts/generar-sprites-nodo-reclutar.py` recorta los tres pergaminos de
`assets/sprite-nodos-mapa.png` a `assets/nodes/reclutar-<rareza>.png`. No editarlos a mano, se pisan
al regenerar. Dos decisiones del recorte:

- **El resplandor entra**. Es lo único que distingue las tres rarezas a 48 px, que es el tamaño al
  que se pintan: las volutas verdes, azules o de fuego se leen antes que el color de la varilla.
- **Los tres salen en el mismo lienzo cuadrado** y no en su caja justa. Las cajas justas no miden lo
  mismo —el fuego del legendario ocupa más que las volutas del común— y al pintarlos todos a 48 px el
  dorado habría salido más pequeño que los otros dos sin ninguna razón de diseño.

Las posiciones se miden solas sobre la hoja (rachas de columnas que no son fondo), así que una hoja
nueva con los pergaminos en otro sitio sigue funcionando mientras vayan en fila.

## Acciones del store

- `elegirReclutaDeNodo(personajeId, idAReemplazar = null)` — recluta. No cobra oro.
- `iniciarDesafioLegendario()` — acepta el desafío del pergamino dorado y lanza el combate.
- `irAReclutaDesafio()` — vuelve del combate ganado al pergamino, en modo "recluta a tu rival".
