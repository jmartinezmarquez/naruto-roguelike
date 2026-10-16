// Las animaciones dibujadas de la ceremonia del gacha (hojas 72-73 del documento 41).
// Con `import.meta.glob` para que falten sin romper el build: mientras no existan, la
// ceremonia usa el sello en SVG y el humo del relevo.
const EFECTOS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/effects/*-invocacion.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

const FONDOS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/summon/*.{png,jpg}', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.[^.]+$/, ''), url]),
);

export const ANIMACIONES_INVOCACION = {
  sello: EFECTOS['sello-invocacion'] ? { src: EFECTOS['sello-invocacion'], lado: 128, fotogramas: 8 } : null,
  humo: EFECTOS['humo-invocacion'] ? { src: EFECTOS['humo-invocacion'], lado: 160, fotogramas: 8 } : null,
};

/** El fondo del cartel del Summon (hoja 74); null mientras no exista. */
export const FONDO_CARTEL_INVOCACION = FONDOS.cartel ?? null;
