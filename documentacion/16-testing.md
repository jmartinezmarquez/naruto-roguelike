# Testing (Vitest)

## Por qué ahora

Dos bugs reales en producción que un test habría atrapado al instante: `resolverTurno` borrado
por accidente al introducir `resolverCombateCompleto` (quedó una llamada a una función
inexistente), y `EventScreen` sin importar en `App.jsx` (la pantalla de evento nunca se
renderizaba). El motor (`engine/`) es código puro sin React — el más barato y rentable de testear,
sin mocks ni DOM.

## Setup

- `npm install -D vitest`
- `vite.config.js` — bloque `test: { environment: 'node' }` (no hace falta `jsdom`: ni el motor ni
  el store tocan el DOM) más `setupFiles: ['./src/test-setup.js']`, un polyfill mínimo de
  `localStorage` en memoria — Node no lo expone por defecto, y `useGameStore`
  (`guardarRun`/`cargarRun`) y `useAchievementsStore` lo usan para persistir entre sesiones.
- `package.json` — scripts `"test": "vitest run"`, `"test:watch": "vitest"`.
- Los tests viven junto al archivo que testean, con sufijo `.test.js` (convención de Vitest, no
  hace falta carpeta `__tests__/` separada).

## Cobertura actual (72 tests)

- **`engine/leveling.test.js`** — curva de XP, subida de nivel (incluye subir varios niveles de
  golpe, no mutar el objeto de entrada), `obtenerModoActivo` (elige el de mayor nivel, no el
  primero de la lista), `aplicarMultiplicadores`.
- **`engine/combat.test.js`** — eficacias de tipo, `crearLuchador` (HP persistido y su recorte al
  máximo), daño mínimo de 1, `resolverTurno` termina con un ganador, `resolverCombateCompleto`
  siempre devuelve ganador y el perdedor queda a 0 HP.
- **`engine/mapGenerator.test.js`** — el piso 1 nunca tiene descanso (el bug real, repetido 30
  veces por la aleatoriedad), el último piso siempre 1 nodo `jefe`, el piso de mini-jefe siempre
  tiene exactamente un nodo `miniJefe`, todo nodo (salvo el inicial) tiene conexión entrante,
  `calcularNivelPorPiso` y `resolverEnemigoDeNodo` con niveles fijos correctos.
- **`engine/achievements.test.js`** — qué condiciones desbloquean qué logros, no repetir un logro
  ya desbloqueado, extraer las recompensas de personaje reclutable/objeto inicial de los logros ya
  conseguidos.
- **`store/useGameStore.test.js`** — `iniciarRun` crea el equipo correcto, `jugarCombate` en
  victoria y en derrota (incluida la cadena completa de rondas hasta que cae todo el equipo),
  `reordenarEquipo`, `reiniciarRun`, la tienda (comprar, fondos insuficientes, objeto gratuito,
  reclutar descarta la otra opción, nivel de reclutamiento correcto, equipo lleno), `irAGameOver`,
  y la integración con logros (desbloqueo al derrotar un jefe, `completarArcoSinDerrotas` con y sin
  derrota previa, el reclutable/objeto desbloqueados apareciendo en tienda/inventario).
- **`store/useAchievementsStore.test.js`** — desbloqueo y persistencia en `localStorage`, no repetir
  un logro ya conseguido, `cargarLogros()` recupera lo guardado en una sesión anterior.

## Convención para nuevos tests

Cada `describe` cubre una función o flujo concreto. Los tests de store usan `beforeEach` para
reiniciar la run entera (`iniciarRun`) y evitar que el estado se arrastre entre tests — al ser un
store global de Zustand (no una instancia nueva por test), esto es obligatorio o los tests se
contaminan entre sí.

## Pendiente

No hay tests de componentes React todavía (`MapScreen`, `CombatScreen`, etc.) — de momento toda la
cobertura es de lógica pura (motor + store), que es donde han estado los bugs reales hasta ahora.
Si en el futuro se necesitan tests de UI, haría falta añadir `@testing-library/react` y cambiar
`environment` a `'jsdom'` para esos archivos concretos (Vitest permite mezclar entornos por
archivo).
