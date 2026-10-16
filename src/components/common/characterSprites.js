// Sprite de cada luchador, recortado por `scripts/generar-sprites-estilo-nuevo.py`
// (estilo nuevo, documentacion/41; fondo transparente, lienzo común de 96×96).
// La clave es el id de `data/characters.json`, `data/enemies.json` o
// `data/common-enemies.json` — los tres comparten espacio de nombres aquí, porque
// un jefe puede acabar en tu equipo por logro y un personaje puede ser el enemigo.
//
// Un id sin sprite devuelve `null` y quien lo pinte tiene que aguantarlo.

import { useAchievementsStore } from '../../store/useAchievementsStore';

// ⚠️ Con `import.meta.glob` y no un `import` por fichero (2026-10-15): la clave es
// el nombre del PNG, que es el id, así que un dibujo nuevo entra en el juego solo con
// dejarlo en la carpeta — y un personaje cuyo arte aún no ha llegado no rompe el build.
export const SPRITE_LUCHADOR = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/characters/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

/**
 * Los aspectos alternativos (nivel de ninja, documentacion/42), con
 * `<id>_<n>.png` como nombre. `import.meta.glob` y no `import` para que la carpeta
 * pueda estar a medias: un aspecto sin dibujo simplemente no se ofrece.
 */
const SPRITE_ASPECTO = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/aspects/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

/** Los aspectos (1, 2…) de un ninja que tienen dibujo. */
export function aspectosDibujados(id) {
  return Object.keys(SPRITE_ASPECTO)
    .filter((clave) => clave.startsWith(`${id}_`))
    .map((clave) => Number(clave.slice(id.length + 1)))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

/** El sprite de siempre, sin aspecto: el selector enseña cada opción tal cual. */
export function spriteBaseDeLuchador(id) {
  return SPRITE_LUCHADOR[id] ?? null;
}

export function spriteDeAspecto(id, n) {
  return SPRITE_ASPECTO[`${id}_${n}`] ?? null;
}

/**
 * El sprite base de un luchador, con el aspecto que el jugador haya elegido para él
 * si lo tiene dibujado. Se lee el store sin suscribirse (no es un hook): las
 * pantallas que dejan cambiar el aspecto ya se repintan por su cuenta, y las demás
 * lo leen al montarse. Las transformaciones no cambian con el aspecto.
 */
export function spriteDeLuchador(id) {
  const elegido = useAchievementsStore.getState().aspectosElegidos?.[id];
  if (elegido === 'ultimate') return SPRITE_ULTIMATE[id] || SPRITE_LUCHADOR[id] || null;
  return (elegido && SPRITE_ASPECTO[`${id}_${elegido}`]) || SPRITE_LUCHADOR[id] || null;
}

/**
 * Las skins Ultimate (documentacion/42, hojas 88-89): una por ninja, en
 * `assets/ultimates/<id>.png`. Se eligen como un aspecto más (`'ultimate'`).
 */
const SPRITE_ULTIMATE = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/ultimates/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

export function spriteDeUltimate(id) {
  return SPRITE_ULTIMATE[id] ?? null;
}
