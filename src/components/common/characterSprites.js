// Sprite de cada luchador, recortado por `scripts/generar-sprites-estilo-nuevo.py`
// (estilo nuevo, documentacion/41; fondo transparente, lienzo común de 96×96).
// La clave es el id de `data/characters.json`, `data/enemies.json` o
// `data/common-enemies.json` — los tres comparten espacio de nombres aquí, porque
// un jefe puede acabar en tu equipo por logro y un personaje puede ser el enemigo.
//
// Un id sin sprite devuelve `null` y quien lo pinte tiene que aguantarlo.

import { useAchievementsStore } from '../../store/useAchievementsStore';
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
import kakashi from '../../assets/characters/kakashi.png';
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
  // Sai y Yamato llevaron de placeholder un genin hasta el estilo nuevo (2026-10-14).
  sai,
  yamato,
  // Kakashi tampoco está en la hoja, y como es legendario y se pelea contra él en
  // el pergamino dorado, una copia exacta del genin raiton habría hecho que el
  // desafío pareciera un combate común. Lleva el mismo sprite con el pelo
  // recoloreado a plata — ver RECOLOREADOS en el script.
  kakashi,
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
  return (elegido && SPRITE_ASPECTO[`${id}_${elegido}`]) || SPRITE_LUCHADOR[id] || null;
}
