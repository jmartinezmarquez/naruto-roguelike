// Los iconos de las cinco naturalezas de chakra, dibujados.
//
// Sustituyen a los emojis (🔥💨⚡🪨💧), que eran **lo único de la interfaz que no
// estaba dibujado** y que además se veían siempre al lado de sprites que sí lo
// están. Salió del playtest del 2026-08-14 y es la tanda 1 del punto 15 del roadmap.
//
// Los PNG los recorta `scripts/generar-sprites-iconos.py` de la hoja del artista.
// ⚠️ **No editar los PNG a mano**: se pisan al regenerar.

import katon from '../../assets/chakra/katon.png';
import suiton from '../../assets/chakra/suiton.png';
import doton from '../../assets/chakra/doton.png';
import raiton from '../../assets/chakra/raiton.png';
import fuuton from '../../assets/chakra/fuuton.png';

export const SPRITE_CHAKRA = { katon, suiton, doton, raiton, fuuton };

