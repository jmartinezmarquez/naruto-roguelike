// Los sprites de efecto del combate (tiras de fotogramas en `assets/effects/`,
// recortadas por `scripts/generar-sprites-estilo-nuevo.py` (estilo nuevo, documentacion/41)) y cuál toca en cada golpe.
//
// ⚠️ `lado` y `fotogramas` tienen que coincidir con lo que dibuja el script: la tira
// se reproduce desplazando el fondo a saltos de `lado` píxeles, y con un número mal
// puesto se vería medio fotograma o se saltaría el último.

import humo from '../../assets/effects/humo.png';
import corte from '../../assets/effects/corte.png';
import estrella from '../../assets/effects/estrella.png';
import estrellaMetal from '../../assets/effects/estrella-metal.png';
import explosionKaton from '../../assets/effects/explosion-katon.png';
import explosionFuuton from '../../assets/effects/explosion-fuuton.png';
import explosionRaiton from '../../assets/effects/explosion-raiton.png';
import explosionDoton from '../../assets/effects/explosion-doton.png';
import explosionSuiton from '../../assets/effects/explosion-suiton.png';

export const EFECTOS = {
  humo: { src: humo, lado: 80, fotogramas: 6, ms: 480 },
  corte: { src: corte, lado: 64, fotogramas: 4, ms: 220 },
  estrella: { src: estrella, lado: 64, fotogramas: 4, ms: 260 },
  estrellaMetal: { src: estrellaMetal, lado: 64, fotogramas: 4, ms: 260 },
  explosionKaton: { src: explosionKaton, lado: 96, fotogramas: 6, ms: 540 },
  explosionFuuton: { src: explosionFuuton, lado: 96, fotogramas: 6, ms: 540 },
  explosionRaiton: { src: explosionRaiton, lado: 96, fotogramas: 6, ms: 540 },
  explosionDoton: { src: explosionDoton, lado: 96, fotogramas: 6, ms: 540 },
  explosionSuiton: { src: explosionSuiton, lado: 96, fotogramas: 6, ms: 540 },
};

const EXPLOSION_POR_TIPO = {
  katon: 'explosionKaton',
  fuuton: 'explosionFuuton',
  raiton: 'explosionRaiton',
  doton: 'explosionDoton',
  suiton: 'explosionSuiton',
};

/**
 * El efecto que pinta un golpe al impactar, por nombre de `EFECTOS` (o null).
 *
 * Uno por golpe, elegido por lo MÁS importante que ha pasado, en el mismo orden que
 * el sonido (`sonidosDeImpacto`) — lo que se ve y lo que se oye cuentan lo mismo:
 * - bloqueado → chispa de metal (kunai contra kunai);
 * - jutsu → explosión del color de la naturaleza de quien lo lanza;
 * - básico muy eficaz → estrella de impacto;
 * - básico corriente o flojo → el tajo.
 */
export function efectoDelGolpe(golpe, tipoAtacante) {
  if (!golpe) return null;
  if (!(golpe.dano > 0)) return 'estrellaMetal';
  if (golpe.tipoAtaque === 'jutsu') return EXPLOSION_POR_TIPO[tipoAtacante] ?? 'estrella';
  if (golpe.eficacia > 1) return 'estrella';
  return 'corte';
}
