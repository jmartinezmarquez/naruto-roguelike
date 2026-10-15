// Proyectil de jutsu de cada luchador, recortado por `scripts/generar-sprites-estilo-nuevo.py`
// (estilo nuevo, documentacion/41). La clave es el id del luchador.
//
// El ataque BÁSICO es un kunai para todos (así está el juego: un único
// `ataqueBasicoPorDefecto` en config.json, ver documentacion/29), así que solo
// los jutsus tienen proyectil propio.
//
// Quien no aparezca aquí lanza el kunai también en su jutsu, y es correcto: Rock Lee
// y Kakashi (Raikiri) son cuerpo a cuerpo a propósito. Neji, Shikamaru, Kiba, Sai y
// Yamato, que faltaban en la hoja del artista, llegaron con el estilo nuevo.
//
// Los cinco genin rivales tienen el suyo (hoja 12): son los proyectiles que más se
// ven del juego, porque los genin son la mayoría de los combates.

import kunai from '../../assets/projectiles/kunai.png';
// Estilo nuevo (2026-10-14), de `scripts/generar-sprites-estilo-nuevo.py`.

export const SPRITE_KUNAI = kunai;

// ⚠️ Con `import.meta.glob` y no un `import` por fichero (2026-10-15): la clave es
// el nombre del PNG, que es el id, así que un dibujo nuevo entra en el juego solo con
// dejarlo en la carpeta — y un personaje cuyo arte aún no ha llegado no rompe el build.
const SPRITE_JUTSU = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/projectiles/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]).filter(([clave]) => clave !== 'kunai'),
);

/** El proyectil de un golpe: el jutsu propio si lo tiene, y si no el kunai de siempre. */
export function spriteDeProyectil(id, esJutsu) {
  return (esJutsu && SPRITE_JUTSU[id]) || kunai;
}
