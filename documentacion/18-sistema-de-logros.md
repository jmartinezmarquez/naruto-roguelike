# Sistema de logros (`engine/achievements.js` + `store/useAchievementsStore.js`)

## Alcance

Motor + persistencia (evaluar condiciones, desbloquear logros, aplicar los dos tipos de recompensa
usables con el código actual) **más UI**: pantalla dedicada de Logros y notificación al
desbloquear uno. `desbloquearPersonajeInicial` (aparecer como opción al elegir equipo inicial)
queda sin implementar a propósito: no existe pantalla de selección de personajes iniciales en
`App.jsx` todavía (arranca fijo con Naruto/Sasuke/Sakura) y esa recompensa no tendría dónde
engancharse — es el siguiente paso del roadmap.

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

Tipos de condición implementados: `derrotarJefe` (jefeId), `completarArcoSinDerrotas` (arcoId).
Tipos de recompensa implementados: `desbloquearPersonajeReclutable`, `desbloquearObjetoInicial`.
El resto de tipos propuestos en el diseño original quedan documentados en
`_pendienteDeImplementar` dentro del propio JSON, sin código muerto en `engine/`.

## `engine/achievements.js` (puro, sin store ni React)

- `evaluarLogrosDesbloqueables(logros, idsYaDesbloqueados, contexto)` — de los logros no
  desbloqueados aún, cuáles cumple el `contexto` de un evento de juego:
  `{ jefeDerrotadoId, arcoCompletadoId, arcoCompletadoSinDerrotas }`.
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
  nada oculto, no es un sistema "misterio".
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

## Testing

- `engine/achievements.test.js` — las 3 funciones puras, con datos de prueba locales.
- `store/useAchievementsStore.test.js` — desbloqueo, persistencia en `localStorage`,
  `cargarLogros()`, no repetir un logro ya conseguido, la cola `notificacionesPendientes` (se
  encola al desbloquear, `descartarNotificacion()` quita solo la más antigua).
- `store/useGameStore.test.js` (sección "logros") — integración de extremo a extremo vía
  `jugarCombate`: desbloqueo de jefe individual, `run_sin_bajas` con y sin derrota previa, el
  personaje desbloqueado apareciendo en una oferta de tienda, el objeto desbloqueado apareciendo en
  el inventario de una run nueva.
- Se añadió `src/test-setup.js` (registrado en `vite.config.js` → `test.setupFiles`) con un
  polyfill mínimo de `localStorage` en memoria — necesario porque Vitest corre con
  `environment: 'node'` (sin jsdom) y Node no expone `localStorage` por defecto. Esto también deja
  testeable, si hiciera falta en el futuro, `guardarRun`/`cargarRun` de `useGameStore`, que ya
  usaban `localStorage` sin tests propios.
