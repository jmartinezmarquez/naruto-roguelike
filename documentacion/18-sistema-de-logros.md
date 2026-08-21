# Sistema de logros (`engine/achievements.js` + `store/useAchievementsStore.js`)

## Alcance

Motor + persistencia (evaluar condiciones, desbloquear logros, aplicar recompensas) más UI:
pantalla dedicada de Logros y notificación al desbloquear uno. Los tres tipos de recompensa del
diseño original ya están implementados: `desbloquearPersonajeReclutable`, `desbloquearObjetoInicial`
y `desbloquearPersonajeInicial` — este último quedó pendiente en la sesión en la que se construyó
el motor (no existía todavía la pantalla de selección de personaje inicial donde engancharlo) y se
completó al construir `CharacterSelectScreen.jsx` — ver
[19 - Selección de personaje](./19-seleccion-de-personaje.md). Estuvo meses **sin que ningún logro lo
usara** —tipo de recompensa implementado y nadie lo declaraba—; desde el punto 5a lo usa "Three Times a
Hero", que abre a Yamato como elección de partida al completar 3 runs.

## Por qué un store separado (`useAchievementsStore`)

Los logros son **meta-progresión entre runs**: sobreviven a un Game Over y a `reiniciarRun()`, al
contrario que todo lo demás en `useGameStore` (equipo, oro, mapa...), que es efímero por run.
Mezclarlos en el mismo store habría significado excluirlos a mano de cada reset. Persiste en su
propia clave de `localStorage` (`naruto-roguelike-logros`), separada de la del guardado de run
(`config.guardado.claveLocalStorage`).

Sigue el mismo patrón que `guardarRun`/`cargarRun` en `useGameStore`: no se auto-carga al crear el
store (evita tocar `localStorage` en el arranque del módulo, lo que rompería los tests en
`environment: 'node'` sin querer), sino que expone una acción explícita `cargarLogros()` que
`App.jsx` llama una vez al montar, **antes** de `iniciarRun` (el inventario inicial puede depender
de un logro ya desbloqueado).

## `src/data/achievements.json`

Antes vivía en `src/achievements-DISEÑO.json` (fuera de `src/data/`, sin implementar). Se movió
aquí siguiendo la regla del proyecto de que todo el contenido vive en `src/data/*.json`. Cada
logro:

```json
{
  "id": "derrotar_haku",
  "nombre": "El Espejo Roto",
  "descripcion": "Derrota a Haku en cualquier run.",
  "condicion": { "tipo": "derrotarJefe", "jefeId": "haku" },
  "recompensa": { "tipo": "desbloquearPersonajeReclutable", "personajeId": "haku" }
}
```

Tipos de condición implementados: `derrotarJefe` (jefeId), `completarArcoSinDerrotas` (arcoId),
`contadorMinimo` (contador + cantidad) y `coleccionMinima` (categoría + cantidad).
Tipos de recompensa implementados: `desbloquearPersonajeReclutable`, `desbloquearObjetoInicial`,
`desbloquearPersonajeInicial` y `ninguna`. El resto de tipos propuestos en el diseño original quedan
documentados en `_pendienteDeImplementar` dentro del propio JSON, sin código muerto en `engine/`.

Los cuatro tipos, y los dos que exportan `TIPOS_DE_CONDICION`/`TIPOS_DE_RECOMPENSA`, están cubiertos
por un **test de invariante** (en `useAchievementsStore.test.js`): ningún logro puede declarar un tipo
que el motor no evalúe, un contador que no exista o un personaje/objeto que no esté en los JSON.
⚠️ Es el fallo más barato de prevenir y el más caro de encontrar: **un tipo desconocido no revienta**,
simplemente no se cumple JAMÁS y la pantalla se queda muda. Este proyecto ya lo ha pagado dos veces
(pasivas fuera del catálogo, ids comparados contra nombres).

### El punto 5a: contenido, contadores y "no dar nada"

La pantalla llevaba meses hecha con **7 logros**, y lo que faltaba no era diseño sino material. Al
ampliarla salieron tres cosas que no se ven mirando el JSON:

**1. ⚠️ Había UN SOLO punto de evaluación.** `_evaluarLogrosPorVictoria` se llamaba al ganar un
combate y armaba siempre un contexto de "acaba de morir este jefe", así que **ningún logro que no
fuera "derrota a X" tenía dónde dispararse**, por muy bien escrito que estuviera. Se arregló donde
menos ruido hace: `evaluarLogros` **completa el contexto por su cuenta** con los contadores y los
vistos, y quien llama solo pasa lo del momento. Con eso, un logro de contador salta desde cualquier
punto de evaluación sin que ese punto sepa que existe.

**2. Una condición genérica, no una por métrica.** `contadorMinimo` con `{ contador, cantidad }` en vez
de `ganarNCombates`, `reclutarNNinjas`… Con un tipo por métrica, cada logro nuevo obligaría a tocar
`engine/`; así **añadir un logro vuelve a ser solo datos**, que es la regla del proyecto.

**3. Sí, un logro puede no dar nada** (`recompensa: { tipo: 'ninguna' }`). Los tres tipos de premio son
de desbloqueo y quedan pocos ninjas y pocos objetos que desbloquear: veinte logros nuevos no tienen
qué dar. La alternativa era meter recompensas numéricas (+% oro, +% XP), que **mueven la curva de
niveles de toda la run** y están descartadas en el punto 5b — un juego de runs cortas no quiere
meta-progresión que cambie números. La pantalla lo dice con todas las letras ("A mark of honour"), que
no es lo mismo que dejar el hueco vacío: un hueco no dice "esto es una marca de honor", dice "aquí
falta algo".

## Contadores acumulados (`contadores` en `useAchievementsStore`)

Siete, con su **propia clave de `localStorage`** (`naruto-roguelike-contadores`) y la misma forma que
el registro de vistos: se mezclan con `CONTADORES_VACIO` al cargar, para que añadir un contador nuevo
no invalide lo que el jugador ya tenga guardado.

| Contador | Dónde se incrementa |
|---|---|
| `combatesGanados` | `jugarCombate`, en la rama de victoria |
| `oroGanado` | `jugarCombate` (el oro del combate) y el efecto de evento `ganarOro` |
| `reclutas` | `reclutarPersonaje`, en sus **dos** salidas con éxito |
| `eventosResueltos` | `resolverEventoEleccion` |
| `objetosComprados` | `comprarItemTienda` |
| `runsCompletadas` | `jugarCombate`, al caer Pain (`recompensa.finDeLaRun`) |
| `runsPerdidas` | `jugarCombate`, tras el bucle, si la run ha terminado sin ganar |

Tres reglas que costaron trabajo y no se ven en la tabla:

- ⚠️ **Un contador cuesta un enganche, y un enganche es un sitio donde olvidarse.** Por eso son siete
  y no quince: lo que se puede **deducir** de lo ya guardado no lleva contador. "Cuántos ninjas
  distintos has llevado" o "cuántas transformaciones has visto" salen del registro de la enciclopedia
  con `coleccionMinima`, sin tocar nada — y además contestan la pregunta correcta: pelear doce veces
  contra el mismo bandido no es haber visto doce enemigos.
- ⚠️ **Una cadena de rondas es UN combate, no tres.** `jugarCombate` resuelve el nodo entero, relevos
  incluidos, y hay un solo punto por el que se sale ganando. Contar por ronda inflaría el contador
  ~2× y ningún test de combate lo habría cazado.
- ⚠️ **Los contadores se suman ANTES de evaluar**, o "gana 10 combates" saltaría en el combate 11.
- **El oro se cuenta GANADO, no acumulado**: baja al comprar, y un logro que midiera el saldo mediría
  la avaricia en vez del recorrido.

⚠️ **Y una red de seguridad al abrir la pantalla** (`abrirLogros`), por el hueco que dejan los puntos de
evaluación: se mira cuando **pasa algo**, así que el progreso que ya estaba guardado el día que se añade
un logro no lo ha visto nadie. Al estrenar el 5a, quien tuviera 8 objetos en la enciclopedia veía la
barra llena y "Locked" al lado — **el juego diciendo dos cosas contrarias en la misma línea**, y
volvería a pasar con cada logro nuevo. Es el mismo catch-all que `abrirEnciclopedia`, y se apoya en lo
mismo: `evaluarLogros` no toca el estado si no hay novedad. Desbloquea **en silencio**: el jugador está
mirando la lista, y que la fila cambie a "Unlocked" delante de él es el aviso — cinco toasts encima de
la pantalla que los explica serían taparla con su propio contenido.

⚠️ Y la trampa gorda, con test propio: **`reiniciarLogros` borra las TRES claves**. Con los contadores
intactos, los logros de contador se volverían a desbloquear en el acto en el primer combate y el
jugador vería su reinicio deshacerse solo — peor que no reiniciar. Lo mismo vale para los tests: el
`beforeEach` de `useGameStore.test.js` resetea los contadores, o los combates de un test se suman a
los del siguiente.

## `engine/achievements.js` (puro, sin store ni React)

- `evaluarLogrosDesbloqueables(logros, idsYaDesbloqueados, contexto)` — de los logros no
  desbloqueados aún, cuáles cumple el `contexto`. Trae dos cosas de naturaleza distinta: lo que
  **acaba de pasar** (`jefeDerrotadoId`, `arcoCompletadoId`, `arcoCompletadoSinDerrotas`) y lo
  **acumulado** (`contadores`, `vistos`), que viene siempre porque lo añade el store.
- `progresoDeLogro(logro, contexto)` — `{ actual, objetivo }` para los logros que se miden
  acumulando, y `null` para los de suceso. Sin esto, "gana 50 combates" sin decir por cuántos vas no
  es una meta, es un rumor; y una barra al 0% de algo binario dice menos que el propio "Locked".
- `obtenerPersonajesReclutablesDesbloqueados(logros, idsDesbloqueados)` — ids de personaje a añadir
  a la pool de reclutamiento de cualquier tienda futura.
- `obtenerObjetosInicialesDesbloqueados(logros, idsDesbloqueados)` — ids de objeto a añadir al
  inventario inicial de cualquier run futura.

## Integración en `useGameStore`

- **`encontrarPersonajeBase(id)`** ahora busca primero en `characters.json` y, si no está, en los
  jefes de `enemies.json` marcados `desbloqueablePorLogro: true` (mismo esquema que un personaje —
  ver el comentario de `enemies.json`). Así un jefe desbloqueado por logro se recluta exactamente
  igual que cualquier otro, sin duplicar sus datos en `characters.json`.
- **`jugarCombate`** llama a `_evaluarLogrosPorVictoria(enemigoBase)` justo tras cada victoria
  (dentro del bucle de rondas, no solo al ganar el combate completo — cubre mini-jefes y
  combates normales igual que al jefe final). Esa función interna decide si el enemigo vencido era
  el jefe final del arco en curso (`enemigoBase.id === arcoActualDatos.jefeFinalId`) para construir
  el contexto de `completarArcoSinDerrotas`, y **devuelve** los logros recién desbloqueados en vez
  de notificarlos ella misma — quedan colgados de `ultimoResultadoCombate.logrosDesbloqueados`. El
  desbloqueo (persistencia + efecto en tienda/inventario) ocurre al instante, pero el **aviso**
  (toast) se retrasa a propósito: ver "Timing del toast" más abajo.
- **`huboDerrotaEnEsteArco`** (nuevo campo del store, `false` en `iniciarRun`): se pone a `true` en
  `_aplicarDerrota`. Es lo que permite saber si el arco se completó "sin bajas" — el flag de
  `derrotado` de cada personaje no sirve para esto porque se puede revivir en un nodo de descanso a
  mitad de arco.
- **`generarOfertaTienda`** añade a `personajesReclutablesIds` del arco los ids que devuelve
  `obtenerPersonajesReclutablesDesbloqueados`, antes de filtrar por quién ya está en el equipo.
- **`iniciarRun`** rellena el inventario inicial con `obtenerObjetosInicialesDesbloqueados` en vez
  de empezar siempre vacío.

## UI

- **`components/Achievements/AchievementsScreen.jsx`** — pantalla nueva (`pantalla: 'logros'` en
  `useGameStore`, abierta con la acción `abrirLogros()` y cerrada con el `volverAlMapa()` que ya
  existía). Lista **todos** los logros del JSON, no solo los desbloqueados — cada tarjeta muestra
  `nombre`, `descripcion` (la condición para desbloquearlo, en texto plano ya pensado para esto) y
  una frase generada a partir de `recompensa` con el nombre real del personaje/objeto que
  desbloquea. Los no conseguidos se ven atenuados (`opacity-60`) pero con la misma información —
  nada oculto, no es un sistema "misterio". Los de contador y colección llevan además **barra de
  progreso con "12 / 30"**, y solo mientras se persiguen: una vez conseguido, "50 / 50" no añade nada
  a la palabra "Unlocked" de al lado. El icono sigue saliendo de la recompensa, y los de tipo
  `ninguna` llevan el **rango S** del escalafón ninja (`RANGO_S`, prop `glifo` de `IconoEnmarcado`):
  tipografía y no sprite, porque una letra es exactamente lo que llevaría una hoja de misión y no hace
  falta arte para ella. Dice algo —"esto no da objeto, da rango"— en vez de parecer un icono que falta.
  Bloqueado se **atenúa**, no se ensombrece como un sprite: el `brightness(0)` es para lo que hay que
  descubrir, y esta pantalla no esconde nada.
- **`components/Achievements/LogroToast.jsx`** — notificación flotante montada en `App.jsx` junto a
  la pantalla activa (no dentro de una pantalla concreta), para que aparezca sin importar qué se
  esté viendo. Consume la cola `notificacionesPendientes` de `useAchievementsStore` de una en una:
  se muestra 3s y se desvanece en 0.5s (transición CSS de opacidad) antes de pasar a la siguiente
  si hay más de un logro desbloqueado a la vez (p. ej. derrotar al jefe final dispara
  "derrotar_zabuza" y "run_sin_bajas" juntos). El ajuste de `visible` al cambiar de notificación se
  hace durante el render, no en un efecto — mismo patrón que `CombatScreen.jsx` (ver nota en
  `CLAUDE.md`).
- **Botón "Logros"** en la esquina superior derecha de `MapScreen.jsx`.

### Timing del toast: desbloqueo instantáneo, aviso diferido

`jugarCombate` resuelve el combate entero de golpe (rondas, HP, victoria/derrota) — la animación
de `CombatScreen` solo reproduce ese resultado ya calculado turno a turno. Si `useAchievementsStore`
encolara la notificación en el momento del desbloqueo (como hacía al principio), el toast de
"Logro desbloqueado" aparecería casi al iniciar el combate, muy por delante de la animación —
matando el suspense de la pelea que lo causó.

Por eso `evaluarLogros` (motor de desbloqueo) y `notificar` (encolar el toast) están separados:
- `useGameStore._evaluarLogrosPorVictoria` desbloquea y persiste al instante (correcto: la tienda y
  el inventario inicial ya deben reflejarlo aunque el jugador no haya visto la animación aún), y
  deja el resultado en `ultimoResultadoCombate.logrosDesbloqueados`.
- `CombatScreen` es quien llama a `useAchievementsStore.notificar(...)`, en un `useEffect` que
  dispara solo cuando `combateTotalTerminado` pasa a `true` — es decir, cuando ya se reprodujo toda
  la animación (incluida la cadena de rondas si el activo cayó) y se muestra el banner de
  Victoria/Derrota.

## Rangos: de misión (D-S) y ninja (Genin-Kage) — punto 19, 2026-08-22

Naruto tiene **dos escaleras** y el juego usa las dos, que es lo que evitó tener que inventarse un
vocabulario:

| | Qué mide | Dónde vive |
|---|---|---|
| **Rango de misión** `D C B A S` | Lo difícil que es una tarea | Campo `rango` en cada logro de `achievements.json`, y calculado para la run recién jugada (`rangoDeMision`) |
| **Rango ninja** Genin → Chunin → Jonin → ANBU → Kage | Lo que eres tú, acumulado | Derivado (`rangoNinja`), nunca guardado |

La escala D-S es la que la propia serie usa para las misiones, y la pantalla **ya se llamaba
"Missions"** de cara al jugador: el vocabulario estaba elegido desde hacía meses y sin explotar.

### Las cuatro decisiones que no son obvias

**1. El rango mide DIFICULTAD, no recompensa.** 13 de los 23 logros dan `recompensa: 'ninguna'` a
propósito (ver "no dar nada", más arriba) y varios de esos son de los más duros del juego — ganar la
run tres veces, terminar el arco 3 sin una sola baja. Si el rango siguiera al premio, los más
difíciles saldrían como los más baratos.

**2. La curva de puntos es convexa**: `D`=1, `C`=2, `B`=4, `A`=7, `S`=12. Una S vale más que seis D.
Con un reparto lineal, la forma óptima de subir de rango ninja sería **no intentar nunca nada duro**, y
la cima dejaría de significar algo.

**3. Los umbrales del rango ninja son ABSOLUTOS, no un porcentaje del total disponible.** Con
porcentajes, añadir un logro nuevo **degradaría** a quien ya jugó: sus puntos siguen ahí y el total
sube. Bajarle el rango a alguien por una actualización no es aceptable. El riesgo del absoluto es el
contrario —la inflación— y se tapa con una **pinza de dos invariantes** en
`useAchievementsStore.test.js`:

- `puntosMaximos > umbral(Kage)` — la cima es alcanzable;
- `puntosMaximos * 0,6 < umbral(Kage)` — y no se regala.

El segundo es el interesante: si un día se añaden logros a puñados, salta y **obliga a revisar los
umbrales a conciencia** en vez de dejar que la escalera se infle sola.

**4. El rango ninja NO se persiste, se deriva** de los logros ya guardados. Un dato derivado que
además se guarda es un dato que se puede desincronizar, y aquí lo haría justo al reiniciar la
meta-progresión — que es cuando más se nota. Por eso no hay una quinta clave de `localStorage`.

### ⚠️ La pantalla ya hablaba este idioma, pero con el dato inventado

Antes del punto 19, `AchievementsScreen` tenía un `RANGO_S`: una **S dibujada para TODOS** los logros
sin recompensa material, porque el marco del icono no podía quedarse vacío. O sea que "pierde 7 runs"
lucía la misma letra que ganarse la partida entera.

La lección no es sobre esa S: **el vocabulario estaba bien elegido desde el principio y lo que faltaba
era que el dato existiera.** Cuando una interfaz finge un dato para no dejar un hueco, normalmente está
señalando el campo que hay que añadir.

### Dónde se pinta cada rango (y dónde NO)

- **Rango de misión**: insignia por fila en Missions, y la nota grande de la run en la pantalla de
  derrota. ⚠️ **La insignia lleva DOS elementos anidados**, no uno: la corrección óptica centra la
  letra dentro de su caja de línea, pero esa caja hay que centrarla a su vez en el hueco que le da
  quien la usa — y las cinco letras no miden lo mismo de ancho. Sin la caja exterior cada rango se
  colocaba en un sitio distinto de su fila, y se leía como "la letra está descentrada": no lo estaba
  dentro de sí misma, lo estaba **respecto a la fila**.
- **Rango ninja**: cabecera de Missions, y nada más.
  ⚠️ **Se probó en la tarjeta de campaña del Home y se quitó el mismo día (2026-08-22)**, a petición
  del usuario y con razón: es meta-progresión de la **cuenta**, no de esa campaña. Metido en una
  tarjeta que es *por campaña*, el día que haya dos el mismo rango saldría repetido en cada una como si
  fueran cosas distintas — y esa tarjeta ya arrastra el mismo problema con los contadores globales, que
  está avisado en el código. **Un dato global dentro de una tarjeta por instancia miente en cuanto hay
  dos instancias.**

### ⚠️ El nombre de un logro es un guiño, no una instrucción

En la pantalla de derrota, "Full Purse — 175 to go" no dice 175 **de qué**. La condición ya estaba
escrita en `descripcion` desde el punto 5a, y ahí no cabía: por eso cada fila lleva un hover con el
nombre, la condición entera y el "actual / objetivo" exacto. Es la misma decisión que la ficha de
personaje — lo que no cabe no se recorta, se mueve al hover.

### El rango como recompensa

`_pendienteDeImplementar` de `achievements.json` llevaba desde el principio un tipo de recompensa
`cosmetico (aún sin definir — título, color de UI, etc.)`. Ya está definido: **el título es el rango
ninja**, y no hace falta declararlo logro a logro porque sale solo de lo que cada uno vale.

## Testing

- `engine/achievements.test.js` — las 3 funciones puras, con datos de prueba locales.
- `store/useAchievementsStore.test.js` — desbloqueo, persistencia en `localStorage`,
  `cargarLogros()`, no repetir un logro ya conseguido, la cola `notificacionesPendientes` (se
  encola al desbloquear, `descartarNotificacion()` quita solo la más antigua).
- `store/useGameStore.test.js` (sección "logros") — integración de extremo a extremo vía
  `jugarCombate`: desbloqueo de jefe individual, `run_sin_bajas` con y sin derrota previa, el
  personaje desbloqueado apareciendo en una oferta de tienda, el objeto desbloqueado apareciendo en
  el inventario de una run nueva.
- `store/useGameStore.test.js` (sección "contadores de logros — enganches") — lo que se prueba **no
  es el contador** sino que cada cosa se cuente en el sitio donde ocurre de verdad y **una sola vez**:
  una cadena de tres rondas suma un combate, perder suma una caída, reclutar cuenta tanto en hueco
  libre como reemplazando, y el oro entra tanto por combate como por evento.
- Se añadió `src/test-setup.js` (registrado en `vite.config.js` → `test.setupFiles`) con un
  polyfill mínimo de `localStorage` en memoria — necesario porque Vitest corre con
  `environment: 'node'` (sin jsdom) y Node no expone `localStorage` por defecto. Esto también deja
  testeable, si hiciera falta en el futuro, `guardarRun`/`cargarRun` de `useGameStore`, que ya
  usaban `localStorage` sin tests propios.
