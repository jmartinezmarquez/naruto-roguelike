// Sprite de cada luchador, recortado de `assets/map-sprites-idle-all-characters.png`
// con `scripts/generar-sprites-personajes.py` (fondo transparente, lienzo cuadrado).
// La clave es el id de `data/characters.json`, `data/enemies.json` o
// `data/common-enemies.json` — los tres comparten espacio de nombres aquí, porque
// un jefe puede acabar en tu equipo por logro y un personaje puede ser el enemigo.
//
// Un id sin sprite devuelve `null` y quien lo pinte tiene que aguantarlo.

import naruto from '../../assets/characters/naruto.png';
import sasuke from '../../assets/characters/sasuke.png';
import sakura from '../../assets/characters/sakura.png';
import rockLee from '../../assets/characters/rock_lee.png';
import neji from '../../assets/characters/neji.png';
import tenten from '../../assets/characters/tenten.png';
import shikamaru from '../../assets/characters/shikamaru.png';
import ino from '../../assets/characters/ino.png';
import choji from '../../assets/characters/choji.png';
import kiba from '../../assets/characters/kiba.png';
import hinata from '../../assets/characters/hinata.png';
import shino from '../../assets/characters/shino.png';
import sai from '../../assets/characters/sai.png';
import yamato from '../../assets/characters/yamato.png';
import haku from '../../assets/characters/haku.png';
import zabuza from '../../assets/characters/zabuza.png';
import kabuto from '../../assets/characters/kabuto.png';
import gaara from '../../assets/characters/gaara.png';
import caminoAnimalPain from '../../assets/characters/camino_animal_pain.png';
import painCaminoDeva from '../../assets/characters/pain_camino_deva.png';
import geninKaton from '../../assets/characters/genin_rival_katon.png';
import geninFuuton from '../../assets/characters/genin_rival_fuuton.png';
import geninRaiton from '../../assets/characters/genin_rival_raiton.png';
import geninDoton from '../../assets/characters/genin_rival_doton.png';
import geninSuiton from '../../assets/characters/genin_rival_suiton.png';
import zaku from '../../assets/characters/zaku.png';
import dosu from '../../assets/characters/dosu.png';
import kin from '../../assets/characters/kin.png';

export const SPRITE_LUCHADOR = {
  naruto,
  sasuke,
  sakura,
  rock_lee: rockLee,
  neji,
  tenten,
  shikamaru,
  ino,
  choji,
  kiba,
  hinata,
  shino,
  // Sai y Yamato no están en la hoja del artista: llevan de placeholder el genin
  // de su naturaleza de chakra (fuuton y doton). Declarado en el script, no un
  // descuido — ver PLACEHOLDERS en `scripts/generar-sprites-personajes.py`.
  sai,
  yamato,
  haku,
  zabuza,
  kabuto,
  gaara,
  // Camino Animal comparte sprite con Camino Deva, que es el único Pain de la hoja.
  camino_animal_pain: caminoAnimalPain,
  pain_camino_deva: painCaminoDeva,
  genin_rival_katon: geninKaton,
  genin_rival_fuuton: geninFuuton,
  genin_rival_raiton: geninRaiton,
  genin_rival_doton: geninDoton,
  genin_rival_suiton: geninSuiton,
  zaku,
  dosu,
  kin,
};

export function spriteDeLuchador(id) {
  return SPRITE_LUCHADOR[id] ?? null;
}
