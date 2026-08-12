import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import commonEnemiesData from '../../data/common-enemies.json';
import itemsData from '../../data/items.json';

/**
 * Nombre legible de cualquier luchador que pueda acabar en el equipo.
 *
 * Busca también en `enemies.json` a propósito: los jefes (Zabuza, Pain...) se
 * desbloquean como reclutables por logro, así que pueden estar en el equipo
 * sin aparecer en `characters.json`. Cada pantalla tenía su propia copia de
 * esta función mirando SOLO characters.json, y por eso el panel de equipo, la
 * mochila y el game over enseñaban el id crudo ("pain_camino_deva") en cuanto
 * reclutabas a un jefe.
 */
export function nombrePersonaje(id) {
  return (
    personajesData.personajes.find((p) => p.id === id)?.nombre
    ?? enemiesData.jefes.find((j) => j.id === id)?.nombre
    ?? id
  );
}

/**
 * Naturaleza de chakra de un luchador (katon, fuuton...), o null si no se
 * encuentra. Mira en los tres archivos por el mismo motivo que `nombrePersonaje`,
 * y además en los enemigos comunes: la pantalla de combate pinta a un genin
 * rival igual que a un personaje del equipo.
 */
export function tipoDeLuchador(id) {
  return (
    personajesData.personajes.find((p) => p.id === id)?.tipo
    ?? enemiesData.jefes.find((j) => j.id === id)?.tipo
    ?? commonEnemiesData.plantillasGenericas.find((e) => e.id === id)?.tipo
    ?? commonEnemiesData.enemigosNombrados.find((e) => e.id === id)?.tipo
    ?? null
  );
}

// El icono de cada naturaleza de chakra. Vive aquí, junto a `tipoDeLuchador`,
// porque lo usan dos pantallas (la tarjeta de hover y la de combate) y tenerlo
// duplicado era garantía de que un día dejaran de coincidir.
const EMOJI_TIPO = {
  katon: '🔥',
  fuuton: '🌪️',
  raiton: '⚡',
  doton: '🪨',
  suiton: '💧',
};

/** Icono de la naturaleza de chakra de un luchador, o '' si no se encuentra. */
export function emojiDeTipo(id) {
  return EMOJI_TIPO[tipoDeLuchador(id)] ?? '';
}

export function nombreObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id)?.nombre ?? id;
}
