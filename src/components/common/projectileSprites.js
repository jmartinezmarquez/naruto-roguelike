// Proyectil de jutsu de cada luchador, recortado de `assets/projectile-sprites.png`
// con `scripts/generar-sprites-proyectiles.py`. La clave es el id del luchador.
//
// El ataque BÁSICO es un kunai para todos (así está el juego: un único
// `ataqueBasicoPorDefecto` en config.json, ver documentacion/29), así que solo
// los jutsus tienen proyectil propio.
//
// Quien no aparezca aquí lanza el kunai también en su jutsu, y es correcto:
// Rock Lee es cuerpo a cuerpo a propósito, y Neji, Shikamaru, Kiba, Sai, Yamato
// y los genin rivales no están dibujados en la hoja del artista.

import kunai from '../../assets/projectiles/kunai.png';
import naruto from '../../assets/projectiles/naruto.png';
import sasuke from '../../assets/projectiles/sasuke.png';
import sakura from '../../assets/projectiles/sakura.png';
import tenten from '../../assets/projectiles/tenten.png';
import ino from '../../assets/projectiles/ino.png';
import choji from '../../assets/projectiles/choji.png';
import hinata from '../../assets/projectiles/hinata.png';
import shino from '../../assets/projectiles/shino.png';
import haku from '../../assets/projectiles/haku.png';
import zabuza from '../../assets/projectiles/zabuza.png';
import kabuto from '../../assets/projectiles/kabuto.png';
import gaara from '../../assets/projectiles/gaara.png';
import caminoAnimalPain from '../../assets/projectiles/camino_animal_pain.png';
import painCaminoDeva from '../../assets/projectiles/pain_camino_deva.png';
import zaku from '../../assets/projectiles/zaku.png';
import dosu from '../../assets/projectiles/dosu.png';
import kin from '../../assets/projectiles/kin.png';

export const SPRITE_KUNAI = kunai;

const SPRITE_JUTSU = {
  naruto,
  sasuke,
  sakura,
  tenten,
  ino,
  choji,
  hinata,
  shino,
  haku,
  zabuza,
  kabuto,
  gaara,
  camino_animal_pain: caminoAnimalPain,
  pain_camino_deva: painCaminoDeva,
  zaku,
  dosu,
  kin,
};

/** El proyectil de un golpe: el jutsu propio si lo tiene, y si no el kunai de siempre. */
export function spriteDeProyectil(id, esJutsu) {
  return (esJutsu && SPRITE_JUTSU[id]) || kunai;
}
