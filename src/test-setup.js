// Polyfill mínimo de localStorage para vitest (environment: 'node', sin jsdom).
// No es DOM — es la Web Storage API, que usan useGameStore (guardarRun/cargarRun)
// y useAchievementsStore para persistir entre sesiones. Sin esto, cualquier test
// que ejercite esas rutas lanzaría "localStorage is not defined".
if (typeof globalThis.localStorage === 'undefined') {
  const almacen = new Map();
  globalThis.localStorage = {
    getItem: (clave) => (almacen.has(clave) ? almacen.get(clave) : null),
    setItem: (clave, valor) => almacen.set(clave, String(valor)),
    removeItem: (clave) => almacen.delete(clave),
    clear: () => almacen.clear(),
  };
}
