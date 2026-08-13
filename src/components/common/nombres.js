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
  const nombre = (
    personajesData.personajes.find((p) => p.id === id)?.nombre
    ?? enemiesData.jefes.find((j) => j.id === id)?.nombre
    ?? commonEnemiesData.plantillasGenericas.find((e) => e.id === id)?.nombre
    ?? commonEnemiesData.enemigosNombrados.find((e) => e.id === id)?.nombre
    ?? id
  );
  return sinParentesis(nombre);
}

/**
 * Se queda con lo de delante del paréntesis: "Pain (Deva Path)" → "Pain".
 *
 * El paréntesis existe en los datos porque hay varios Caminos de Pain y hay que
 * distinguirlos ahí dentro, pero en pantalla es la parte que sobra: ocupa el
 * doble que el nombre y es lo primero que se corta al truncar, así que el jugador
 * acababa leyendo "Pain (Deva…" — el paréntesis abierto sin cerrar, que es peor
 * que no ponerlo. El dato no se toca; esto es solo cómo se muestra.
 */
function sinParentesis(nombre) {
  const corte = nombre.indexOf('(');
  return corte === -1 ? nombre : nombre.slice(0, corte).trim();
}

/**
 * Nombre abreviado al estilo lista de equipo: "Naruto Uzumaki" → "Naruto U.".
 *
 * Existe porque el panel de equipo del mapa es estrecho y los nombres completos
 * o se truncaban a mitad de palabra ("Kakashi Hatak…") o forzaban una fuente tan
 * pequeña que no se leía. Abreviar el apellido gana la línea entera sin perder a
 * quién estás mirando: el nombre de pila es el que identifica.
 *
 * Un nombre de una sola palabra (Gaara, Haku) se queda como está, y uno con
 * paréntesis o más de dos partes —"Pain (Deva Path)"— también: partirlo por la
 * primera inicial daría "Pain (." La regla solo se aplica donde tiene sentido.
 */
export function nombreCorto(id) {
  const partes = nombrePersonaje(id).split(' '); // ya viene sin el paréntesis
  if (partes.length === 1) return partes[0]; // Gaara, Haku, Pain
  if (partes.length === 2) return `${partes[0]} ${partes[1][0]}.`; // Naruto U.
  // Tres o más: las dos primeras palabras enteras. Sale de "Pain: Animal Path",
  // donde abreviar por iniciales daría "Pain: A.P." y quedarse solo con la
  // primera lo confundiría con el otro Pain del mismo arco.
  return `${partes[0]} ${partes[1]}`;
}

/**
 * Rareza de un luchador reclutable (`comun` | `inicial` | `raro` | `legendario`),
 * o null. Mira también en los jefes: se desbloquean como reclutables por logro.
 */
export function rarezaDeLuchador(id) {
  return (
    personajesData.personajes.find((p) => p.id === id)?.rareza
    ?? enemiesData.jefes.find((j) => j.id === id)?.rareza
    ?? null
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

/** El nombre de la naturaleza como etiqueta ("Katon"), o '' si no se encuentra. */
export function nombreDeTipo(id) {
  const tipo = tipoDeLuchador(id);
  return tipo ? tipo[0].toUpperCase() + tipo.slice(1) : '';
}

// Clases de la pastilla de naturaleza, una por tipo. Van escritas enteras y no
// compuestas (`bg-${tipo}/15`) porque Tailwind escanea el código como texto: una
// clase construida en tiempo de ejecución no existe en el bundle y la pastilla
// saldría transparente.
const CLASE_TIPO = {
  katon: 'bg-katon/15 border-katon/60 text-katon',
  fuuton: 'bg-fuuton/15 border-fuuton/60 text-fuuton',
  raiton: 'bg-raiton/15 border-raiton/60 text-raiton',
  doton: 'bg-doton/15 border-doton/60 text-doton',
  suiton: 'bg-suiton/15 border-suiton/60 text-suiton',
};

const CLASE_TIPO_NEUTRA = 'bg-pergamino-100/10 border-marco text-pergamino-200';

/** Clases de color de la pastilla de naturaleza de un luchador. */
export function clasePastillaDeTipo(id) {
  return clasePastillaDeNaturaleza(tipoDeLuchador(id));
}

/**
 * Igual, pero por naturaleza directamente ("katon") en vez de por luchador. La
 * tabla de eficacias de la enciclopedia pinta los cinco elementos, que no son de
 * nadie: pedirle un id de luchador la obligaría a inventarse uno por tipo.
 */
export function clasePastillaDeNaturaleza(tipo) {
  return CLASE_TIPO[tipo] ?? CLASE_TIPO_NEUTRA;
}

/** El emoji de una naturaleza directamente, sin pasar por un luchador. */
export function emojiDeNaturaleza(tipo) {
  return EMOJI_TIPO[tipo] ?? '';
}

export function nombreObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id)?.nombre ?? id;
}
