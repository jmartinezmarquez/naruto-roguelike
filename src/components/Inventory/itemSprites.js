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
// El único sprite del juego que no sale de una hoja del artista: los cascabeles no
// están dibujados en ninguna y son dos esferas con una ranura, así que se dibujan
// (`scripts/generar-sprite-cascabeles.py`). Placeholder declarado.
import cascabeles from '../../assets/items/cascabeles.png';
// Los pergaminos de entrenamiento tienen su propia hoja
// (`assets/sprite-pergaminos-entrenamiento.png`), que recorta
// `scripts/generar-sprites-pergaminos.py`.
import pergaminoEntrenamientoAtaque from '../../assets/items/pergamino_entrenamiento_ataque.png';
import pergaminoEntrenamientoDefensa from '../../assets/items/pergamino_entrenamiento_defensa.png';
import pergaminoEntrenamientoVelocidad from '../../assets/items/pergamino_entrenamiento_velocidad.png';
// Los 8 objetos del 2026-10-14, recortados de `assets/sprite-objetos-nuevos.png` por
// `scripts/generar-sprites-objetos-nuevos.py`. La hoja trae 7: las pesas de Lee
// siguen con el icono provisional que dibuja el mismo script.
import unguentoCurativo from '../../assets/items/unguento_curativo.png';
import kitNinjaMedico from '../../assets/items/kit_ninja_medico.png';
import manualJonin from '../../assets/items/manual_jonin.png';
import pesasDeLee from '../../assets/items/pesas_de_lee.png';
import cuchillasDeAsuma from '../../assets/items/cuchillas_de_asuma.png';
import chalecoChunin from '../../assets/items/chaleco_chunin.png';
import bolsaDeSellosExplosivos from '../../assets/items/bolsa_de_sellos_explosivos.png';
import talismanOchoPuertas from '../../assets/items/talisman_ocho_puertas.png';

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
  cascabeles,
  pergamino_entrenamiento_ataque: pergaminoEntrenamientoAtaque,
  pergamino_entrenamiento_defensa: pergaminoEntrenamientoDefensa,
  pergamino_entrenamiento_velocidad: pergaminoEntrenamientoVelocidad,
  unguento_curativo: unguentoCurativo,
  kit_ninja_medico: kitNinjaMedico,
  manual_jonin: manualJonin,
  pesas_de_lee: pesasDeLee,
  cuchillas_de_asuma: cuchillasDeAsuma,
  chaleco_chunin: chalecoChunin,
  bolsa_de_sellos_explosivos: bolsaDeSellosExplosivos,
  talisman_ocho_puertas: talismanOchoPuertas,
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
const ICONO_STAT = { ataque: '⚔', defensa: '🛡', velocidad: '⚡', hp: '❤' };
const NOMBRE_STAT = { ataque: 'ATK', defensa: 'DEF', velocidad: 'SPD', hp: 'HP' };

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
      return [{
        icono: '❤',
        // Curar el 100% revive (`usarConsumible` levanta al caído a esa fracción): decirlo,
        // porque es lo que distingue al kit médico de la píldora.
        texto: parseInt(efecto.cantidad, 10) >= 100 ? 'Fully heals, even a fallen ally' : `Heals ${parseInt(efecto.cantidad, 10)}% HP`,
        positivo: true,
      }];
    case 'revivirUnaVez':
      return [{ icono: '✨', texto: `Revives once with ${efecto.hpAlRevivir} HP`, positivo: true }];
    // El mismo efecto que dan algunos eventos ("ATK +20% durante 3 combates"),
    // comprado. Para todo el equipo: por eso la mochila no pide a quién.
    case 'ganarXpEquipo':
      return [{ icono: '📜', texto: `Squad gains ${efecto.cantidad} XP`, positivo: true }];
    case 'buffTemporalEquipo':
      return [{
        icono: ICONO_STAT[efecto.stat] ?? '✦',
        texto: `Squad ${NOMBRE_STAT[efecto.stat] ?? efecto.stat} +${Math.round((efecto.multiplicador - 1) * 100)}% for ${efecto.combates} battles`,
        positivo: true,
      }];
    default:
      return [];
  }
}
