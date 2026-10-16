// Las animaciones dibujadas de la ceremonia del gacha (hojas 72-73, 81-87 del documento
// 41). Con `import.meta.glob` para que falten sin romper el build: un plano sin dibujo
// se salta, y la marca y el humo tienen respaldo en código.
const EFECTOS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/effects/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

const FONDOS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/summon/*.{png,jpg}', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.[^.]+$/, ''), url]),
);

function tira(nombre, lado) {
  return EFECTOS[nombre] ? { src: EFECTOS[nombre], lado, fotogramas: 8 } : null;
}

export const ANIMACIONES_INVOCACION = {
  manos: tira('manos-invocacion', 128),
  golpe: tira('golpe-invocacion', 160),
  sello: tira('sello-invocacion', 128),
  columna: tira('columna-invocacion', 160),
  humo: tira('humo-invocacion', 160),
  auraComun: tira('aura-comun', 160),
  auraRaro: tira('aura-raro', 160),
  auraLegendario: tira('aura-legendario', 160),
};

/** El fondo del cartel del Summon (hoja 74); null mientras no exista. */
export const FONDO_CARTEL_INVOCACION = FONDOS.cartel ?? null;
