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

/**
 * Datos base de cualquier luchador, mire donde haya que mirar: personajes, jefes,
 * plantillas de enemigo común y enemigos nombrados. Los cuatro comparten espacio
 * de nombres porque un jefe puede acabar en tu equipo por logro y un personaje
 * puede ser el enemigo de un desafío.
 *
 * Exportada porque tenerla duplicada ya salió mal: `FichaPersonaje` llevaba su
 * propia copia que solo miraba personajes y jefes, así que devolvía null para un
 * genin rival y la tarjeta no se pintaba. Es el mismo problema que tuvo
 * `nombrePersonaje` antes de unificarse en `nombres.js`.
 */
export function encontrarBaseDeLuchador(id) {
  return personajesData.personajes.find((p) => p.id === id)
    ?? enemiesData.jefes.find((j) => j.id === id)
    ?? commonEnemiesData.plantillasGenericas.find((e) => e.id === id)
    ?? commonEnemiesData.enemigosNombrados.find((e) => e.id === id)
    ?? null;
}

const encontrarBase = encontrarBaseDeLuchador;

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
 * El nombre de la transformación activa a ese nivel, o null si todavía no tiene
 * ninguna. Misma cuenta que `spriteDeCombate` —el modo es función del nivel, no
 * un estado que alguien encienda— para que sprite y rótulo no puedan discrepar.
 *
 * Existe porque el rótulo del modo salía del resumen de combate
 * (`ronda.jugador.modoActivoNombre`), que solo tiene al que peleó: un personaje
 * del banquillo que desbloqueaba su transformación no la enseñaba hasta que le
 * tocaba pelear.
 */
export function nombreDeModo(id, nivel) {
  if (!id) return null;
  const base = encontrarBase(id);
  return base ? obtenerModoActivo(base, nivel)?.nombre ?? null : null;
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
  // `normalizarPasivas` ya deduplica por id quedándose con la más fuerte, que es
  // exactamente lo que hace el motor al crear el luchador. Esta lista y la que se
  // aplica en combate salen de la misma función a propósito: cuando eran dos
  // reglas distintas, la tarjeta enseñaba una cosa y la pelea hacía otra.
  return normalizarPasivas([...(modo?.pasivas ?? []), ...delObjeto]);
}
