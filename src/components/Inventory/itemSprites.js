// Sprite de cada objeto, recortado de `assets/sprite-objetos-iniciales.png`
// con `scripts/generar-sprites-objetos.py` (fondo transparente, lienzo cuadrado).
// La clave es el id de `data/items.json`. Un objeto sin sprite cae al
// emoji/marco vacío en la UI, no rompe nada.

import { normalizarPasivas, describirPasiva } from '../../engine/passives';
import pildoraSoldado from '../../assets/items/pildora_soldado.png';
import bandaRepuesto from '../../assets/items/banda_repuesto.png';
import selloChakra from '../../assets/items/sello_chakra.png';
import pergaminoReserva from '../../assets/items/pergamino_reserva.png';
import semillaSabio from '../../assets/items/semilla_sabio.png';
import fragmentoSelloMaldito from '../../assets/items/fragmento_sello_maldito.png';
import pergaminoViento from '../../assets/items/pergamino_viento.png';
import kubikiribochoFragmento from '../../assets/items/kubikiribocho_fragmento.png';
import calabazaArena from '../../assets/items/calabaza_arena.png';
import anilloRinneganFragmento from '../../assets/items/anillo_rinnegan_fragmento.png';

export const SPRITE_OBJETO = {
  pildora_soldado: pildoraSoldado,
  banda_repuesto: bandaRepuesto,
  sello_chakra: selloChakra,
  pergamino_reserva: pergaminoReserva,
  semilla_sabio: semillaSabio,
  fragmento_sello_maldito: fragmentoSelloMaldito,
  pergamino_viento: pergaminoViento,
  kubikiribocho_fragmento: kubikiribochoFragmento,
  calabaza_arena: calabazaArena,
  anillo_rinnegan_fragmento: anilloRinneganFragmento,
};

// Color por rareza, el mismo código que usa la hoja de sprites del artista:
// verde común, azul raro, morado legendario.
export const COLOR_RAREZA = {
  comun: 'text-[#7cbf5a]',
  raro: 'text-[#4f9dd9]',
  legendario: 'text-[#b07cd9]',
};

export const BORDE_RAREZA = {
  comun: 'border-[#7cbf5a]/60',
  raro: 'border-[#4f9dd9]/60',
  legendario: 'border-[#b07cd9]/60',
};

export const ETIQUETA_RAREZA = {
  comun: 'Common',
  raro: 'Rare',
  legendario: 'Legendary',
};

/**
 * Traduce el `efecto` del JSON a una línea visual corta ("⚔ +2 Attack"), que
 * es lo que se enseña en la ficha — leer el efecto en crudo no dice nada.
 * Devuelve un array porque un objeto puede tener buff y debuff a la vez.
 */
// Icono por pasiva. No es decoración: la rejilla del inventario se lee de un
// vistazo por el icono, no leyendo tres frases.
const ICONO_PASIVA = {
  first_jutsu_bonus: '🌀',
  first_attack_bonus: '⚔',
  basic_attack_bonus: '⚔',
  jutsu_bonus: '🌀',
  ignore_defense: '💥',
  damage_floor: '💥',
  first_hit_reduction: '🛡',
  reduce_damage_taken: '🛡',
  low_hp_reduction: '🛡',
  increase_damage_taken: '☠',
  priority: '⚡',
  heal_on_kill: '❤',
  heal_after_battle: '❤',
  repeat_basic_chance: '⚔',
};

/**
 * Líneas de efecto de un objeto, para pintarlas en la mochila y en la tienda.
 *
 * Casi todo viene ya del catálogo de pasivas (`describirPasiva`), que es la
 * única fuente de esas frases — un objeto y una transformación con la misma
 * pasiva dicen exactamente lo mismo. Solo quedan a mano los dos efectos que no
 * son pasivas de combate porque los resuelve el store: el consumible que cura y
 * el revivir de un solo uso.
 */
export function lineasDeEfecto(objeto) {
  if (objeto?.pasivas?.length) {
    return normalizarPasivas(objeto.pasivas).map((pasiva) => ({
      icono: ICONO_PASIVA[pasiva.id] ?? '✦',
      texto: describirPasiva(pasiva),
      positivo: pasiva.id !== 'increase_damage_taken',
    }));
  }

  const efecto = objeto?.efecto;
  if (!efecto) return [];

  switch (efecto.tipo) {
    case 'curarPersonaje':
      return [{ icono: '❤', texto: `Heals ${parseInt(efecto.cantidad, 10)}% HP`, positivo: true }];
    case 'revivirUnaVez':
      return [{ icono: '✨', texto: `Revives once with ${efecto.hpAlRevivir} HP`, positivo: true }];
    default:
      return [];
  }
}
