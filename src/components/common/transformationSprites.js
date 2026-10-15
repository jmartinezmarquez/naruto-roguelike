// Sprite de cada transformación, recortado por `scripts/generar-sprites-estilo-nuevo.py`
// (estilo nuevo, documentacion/41). La clave es
// `<personajeId>_<indice del modo en su array `modos`>`.
//
// Los que la hoja original no traía —los tier 2 de los comunes, Kakashi, Sai, Yamato
// y el segundo modo de Zabuza— llegaron con el estilo nuevo
// (`scripts/generar-sprites-estilo-nuevo.py`). Hay un test que exige sprite para
// cada modo de cada luchador; la caída al tier 1 de `spriteDeModo` queda solo como
// red de seguridad para el próximo modo que se añada sin dibujo.

import naruto0 from '../../assets/transformations/naruto_0.png';
import naruto1 from '../../assets/transformations/naruto_1.png';
import sasuke0 from '../../assets/transformations/sasuke_0.png';
import sasuke1 from '../../assets/transformations/sasuke_1.png';
import sakura0 from '../../assets/transformations/sakura_0.png';
import sakura1 from '../../assets/transformations/sakura_1.png';
import rockLee0 from '../../assets/transformations/rock_lee_0.png';
import neji0 from '../../assets/transformations/neji_0.png';
import tenten0 from '../../assets/transformations/tenten_0.png';
import shikamaru0 from '../../assets/transformations/shikamaru_0.png';
import ino0 from '../../assets/transformations/ino_0.png';
import choji0 from '../../assets/transformations/choji_0.png';
import kiba0 from '../../assets/transformations/kiba_0.png';
import hinata0 from '../../assets/transformations/hinata_0.png';
import shino0 from '../../assets/transformations/shino_0.png';
import zabuza0 from '../../assets/transformations/zabuza_0.png';
import kabuto0 from '../../assets/transformations/kabuto_0.png';
import gaara0 from '../../assets/transformations/gaara_0.png';
import gaara1 from '../../assets/transformations/gaara_1.png';
import painDeva0 from '../../assets/transformations/pain_camino_deva_0.png';
// Estilo nuevo (2026-10-14), de `scripts/generar-sprites-estilo-nuevo.py`: los que faltaban.
import kakashi0 from '../../assets/transformations/kakashi_0.png';
import kakashi1 from '../../assets/transformations/kakashi_1.png';
import sai0 from '../../assets/transformations/sai_0.png';
import yamato0 from '../../assets/transformations/yamato_0.png';
import rockLee1 from '../../assets/transformations/rock_lee_1.png';
import neji1 from '../../assets/transformations/neji_1.png';
import tenten1 from '../../assets/transformations/tenten_1.png';
import shikamaru1 from '../../assets/transformations/shikamaru_1.png';
import ino1 from '../../assets/transformations/ino_1.png';
import choji1 from '../../assets/transformations/choji_1.png';
import kiba1 from '../../assets/transformations/kiba_1.png';
import hinata1 from '../../assets/transformations/hinata_1.png';
import shino1 from '../../assets/transformations/shino_1.png';
import zabuza1 from '../../assets/transformations/zabuza_1.png';

export const SPRITE_MODO = {
  naruto_0: naruto0,
  naruto_1: naruto1,
  sasuke_0: sasuke0,
  sasuke_1: sasuke1,
  sakura_0: sakura0,
  sakura_1: sakura1,
  rock_lee_0: rockLee0,
  neji_0: neji0,
  tenten_0: tenten0,
  shikamaru_0: shikamaru0,
  ino_0: ino0,
  choji_0: choji0,
  kiba_0: kiba0,
  hinata_0: hinata0,
  shino_0: shino0,
  zabuza_0: zabuza0,
  kabuto_0: kabuto0,
  gaara_0: gaara0,
  gaara_1: gaara1,
  pain_camino_deva_0: painDeva0,
  kakashi_0: kakashi0,
  kakashi_1: kakashi1,
  sai_0: sai0,
  yamato_0: yamato0,
  rock_lee_1: rockLee1,
  neji_1: neji1,
  tenten_1: tenten1,
  shikamaru_1: shikamaru1,
  ino_1: ino1,
  choji_1: choji1,
  kiba_1: kiba1,
  hinata_1: hinata1,
  shino_1: shino1,
  zabuza_1: zabuza1,
};

/** El sprite de un modo concreto, cayendo al primer modo del personaje si ese no está dibujado. */
export function spriteDeModo(personajeId, indiceModo) {
  return SPRITE_MODO[`${personajeId}_${indiceModo}`]
    ?? SPRITE_MODO[`${personajeId}_0`]
    ?? null;
}
