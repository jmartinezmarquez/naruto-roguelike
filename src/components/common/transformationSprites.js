// Sprite de cada transformación, recortado por `scripts/generar-sprites-estilo-nuevo.py`
// (estilo nuevo, documentacion/41). La clave es
// `<personajeId>_<indice del modo en su array `modos`>`.
//
// Los que la hoja original no traía —los tier 2 de los comunes, Kakashi, Sai, Yamato
// y el segundo modo de Zabuza— llegaron con el estilo nuevo
// (`scripts/generar-sprites-estilo-nuevo.py`). Hay un test que exige sprite para
// cada modo de cada luchador; la caída al tier 1 de `spriteDeModo` queda solo como
// red de seguridad para el próximo modo que se añada sin dibujo.

// Estilo nuevo (2026-10-14), de `scripts/generar-sprites-estilo-nuevo.py`: los que faltaban.

// ⚠️ Con `import.meta.glob` y no un `import` por fichero (2026-10-15): la clave es
// el nombre del PNG, que es el id, así que un dibujo nuevo entra en el juego solo con
// dejarlo en la carpeta — y un personaje cuyo arte aún no ha llegado no rompe el build.
export const SPRITE_MODO = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/transformations/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

/** El sprite de un modo concreto, cayendo al primer modo del personaje si ese no está dibujado. */
export function spriteDeModo(personajeId, indiceModo) {
  return SPRITE_MODO[`${personajeId}_${indiceModo}`]
    ?? SPRITE_MODO[`${personajeId}_0`]
    ?? null;
}
