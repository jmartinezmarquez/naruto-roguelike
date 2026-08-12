// Sprite de cada transformación, recortado de `assets/sprites-transformaciones.png`
// con `scripts/generar-sprites-transformaciones.py`. La clave es
// `<personajeId>_<indice del modo en su array `modos`>`.
//
// **Los tier 2 de nueve personajes no están dibujados** (la hoja solo trae el
// segundo modo de Naruto, Sasuke, Sakura y los jefes), así que `spriteDeModo`
// cae al tier 1 del mismo personaje: ya lleva su aura y se lee como "está
// transformado", que es lo que tiene que comunicar la pantalla. Es un
// placeholder declarado — está en la sección "Pendiente de arte" del roadmap.
//
// Sai y Yamato no tienen ninguno y devuelven `null`: quien lo pinte cae a su
// sprite normal.

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

const SPRITE_MODO = {
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
};

/** El sprite de un modo concreto, cayendo al primer modo del personaje si ese no está dibujado. */
export function spriteDeModo(personajeId, indiceModo) {
  return SPRITE_MODO[`${personajeId}_${indiceModo}`]
    ?? SPRITE_MODO[`${personajeId}_0`]
    ?? null;
}
