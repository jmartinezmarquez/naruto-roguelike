// Lo que la pantalla de combate necesita saber de un luchador y no viene dado:
// con qué sprite pintarlo y qué pasivas lleva encima. Las dos respuestas salen
// del mismo sitio —su modo activo, que es función del nivel— y por eso viven
// juntas en vez de repetir la búsqueda del personaje base en dos módulos.

import { obtenerModoActivo } from '../../engine/leveling';
import { normalizarPasivas } from '../../engine/passives';
import itemsData from '../../data/items.json';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import commonEnemiesData from '../../data/common-enemies.json';
import { spriteDeLuchador } from './characterSprites';
import { spriteDeModo } from './transformationSprites';

function encontrarBase(id) {
  return personajesData.personajes.find((p) => p.id === id)
    ?? enemiesData.jefes.find((j) => j.id === id)
    ?? commonEnemiesData.plantillasGenericas.find((e) => e.id === id)
    ?? commonEnemiesData.enemigosNombrados.find((e) => e.id === id)
    ?? null;
}

/**
 * El sprite con el que hay que pintar a un luchador de nivel N: el de su
 * transformación si a ese nivel ya tiene una activa, y si no el normal.
 *
 * El modo activo **no es un estado que alguien encienda**: es una función del
 * nivel (`obtenerModoActivo`), así que un personaje por encima del umbral está
 * transformado siempre, también en el banquillo. Por eso se calcula aquí a
 * partir del nivel y no se lee de ningún sitio: era el bug de que Naruto
 * desbloqueaba el Manto de Chakra, la pantalla de transformación lo celebraba,
 * y acto seguido volvía a salir con su sprite de siempre en todos los combates.
 */
export function spriteDeCombate(id, nivel) {
  if (!id) return null;
  const base = encontrarBase(id);
  const modo = base ? obtenerModoActivo(base, nivel) : null;
  if (!modo) return spriteDeLuchador(id);
  return spriteDeModo(id, base.modos.indexOf(modo)) ?? spriteDeLuchador(id);
}

/**
 * Las pasivas que lleva un luchador: las de su transformación activa más las de
 * su objeto equipado. Es la misma suma que hace el store al crear al luchador
 * (`crearLuchador` recibe las del modo y las del objeto por separado), aquí solo
 * para poder enseñarlas.
 *
 * Son las que TIENE, no las que acaban de dispararse: la tarjeta las enseña
 * siempre y las resalta cuando saltan. Enseñar solo las que saltan hacía que la
 * fila apareciera y desapareciera cada golpe, y el jugador no llegaba a leer
 * qué tenía su personaje.
 */
export function pasivasDeLuchador(id, nivel, objetoEquipadoId) {
  const base = encontrarBase(id);
  const modo = base ? obtenerModoActivo(base, nivel) : null;
  const delObjeto = objetoEquipadoId
    ? itemsData.objetos.find((o) => o.id === objetoEquipadoId)?.pasivas ?? []
    : [];
  const todas = normalizarPasivas([...(modo?.pasivas ?? []), ...delObjeto]);

  // Una pasiva por id, aunque la den dos fuentes. Pasa de verdad: el Manto de
  // Chakra de Naruto y el Sello de Chakra dan los dos `first_jutsu_bonus`, y la
  // tarjeta enseñaba "FOCUSED CHAKRA" dos veces sin explicar por qué.
  //
  // Se queda la de mayor cantidad y se cuenta cuántas fuentes hay, porque en el
  // motor **las dos se aplican** (`aplicarModificadores` pliega todas las del
  // enganche, una detrás de otra). Ocultar la segunda sin decirlo sería mentir
  // sobre lo fuerte que es el personaje, así que la pastilla lleva su marca.
  const porId = new Map();
  for (const pasiva of todas) {
    const previa = porId.get(pasiva.id);
    if (!previa) {
      porId.set(pasiva.id, { ...pasiva, fuentes: 1 });
      continue;
    }
    const gana = (pasiva.parametros.cantidad ?? 0) > (previa.parametros.cantidad ?? 0);
    porId.set(pasiva.id, { ...(gana ? pasiva : previa), fuentes: previa.fuentes + 1 });
  }
  return [...porId.values()];
}
