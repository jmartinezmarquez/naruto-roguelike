// src/engine/achievements.js
// Lógica pura de logros: qué condiciones se cumplen y qué recompensas están
// activas. No importa React ni el store — recibe listas de datos y contexto,
// devuelve datos, nunca toca localStorage ni el estado global.

/**
 * Los tipos que el motor sabe evaluar y pintar. Se exportan para que el test de
 * invariante pueda comprobar que **ningún logro del JSON declara algo que nadie
 * entiende**: un tipo desconocido no revienta, simplemente no se cumple JAMÁS y
 * la pantalla se queda muda. Es el fallo silencioso que este proyecto ya ha
 * pagado con las pasivas fuera de catálogo y con los ids contra nombres.
 */
export const TIPOS_DE_CONDICION = [
  'derrotarJefe',
  'completarArcoSinDerrotas',
  'contadorMinimo',
  'coleccionMinima',
  'ascensionMinima',
];

export const TIPOS_DE_RECOMPENSA = [
  'desbloquearPersonajeReclutable',
  'desbloquearPersonajeInicial',
  'desbloquearObjetoInicial',
  'ninguna',
];

/**
 * ¿La condición de un logro se cumple con este contexto?
 *
 * El contexto trae dos cosas de naturaleza distinta: lo que **acaba de pasar**
 * (`jefeDerrotadoId`, `arcoCompletadoId`) y lo **acumulado** (`contadores`,
 * `vistos`), que viene siempre. Por eso un logro de contador salta desde
 * cualquier punto de evaluación sin que ese punto sepa nada de él.
 */
function cumpleCondicion(condicion, contexto) {
  switch (condicion.tipo) {
    case 'derrotarJefe':
      return contexto.jefeDerrotadoId === condicion.jefeId;
    case 'completarArcoSinDerrotas':
      return contexto.arcoCompletadoId === condicion.arcoId && contexto.arcoCompletadoSinDerrotas === true;
    // Genérica a propósito: `{ contador, cantidad }` en vez de un tipo por
    // métrica (`ganarNCombates`, `reclutarNNinjas`...). Con un tipo por métrica,
    // cada logro nuevo obligaría a tocar `engine/`; así añadir uno vuelve a ser
    // **solo datos**, que es la regla del proyecto.
    case 'contadorMinimo':
      return (contexto.contadores?.[condicion.contador] ?? 0) >= condicion.cantidad;
    // "Cuántas cosas DISTINTAS has visto", leído del registro de la enciclopedia.
    // No lleva contador propio porque ya está guardado, y un contador que suma
    // repetidos contestaría otra pregunta: haber peleado 12 veces contra el mismo
    // bandido no es haber visto 12 enemigos.
    case 'coleccionMinima':
      return (contexto.vistos?.[condicion.categoria]?.length ?? 0) >= condicion.cantidad;
    // "Gana una run en la ascensión N o más", en cualquier campaña. Lo completa
    // `evaluarLogros` desde lo guardado (`ascensionMaximaGanada`, -1 si ninguna),
    // como los contadores: ganar A3 sin haber pasado por A2 no puede pasar, pero
    // si pasara, el logro de A2 tiene que saltar igual.
    case 'ascensionMinima':
      return (contexto.ascensionMaximaGanada ?? -1) >= condicion.nivel;
    default:
      return false;
  }
}

/**
 * Cuánto llevas de un logro que se mide por acumulación, para poder pintar
 * "12 / 30" en su tarjeta. Devuelve `null` para los que no son de progreso: una
 * condición de suceso (derrotar a Zabuza) no tiene medias tintas, y una barra al
 * 0% de algo binario dice menos que el propio "Locked".
 */
export function progresoDeLogro(logro, contexto) {
  const { condicion } = logro;
  if (condicion.tipo === 'contadorMinimo') {
    return { actual: contexto.contadores?.[condicion.contador] ?? 0, objetivo: condicion.cantidad };
  }
  if (condicion.tipo === 'coleccionMinima') {
    return { actual: contexto.vistos?.[condicion.categoria]?.length ?? 0, objetivo: condicion.cantidad };
  }
  return null;
}

/**
 * De entre los logros aún no desbloqueados, cuáles cumple el contexto dado.
 * contexto: { jefeDerrotadoId, arcoCompletadoId, arcoCompletadoSinDerrotas }
 * (cualquier campo puede ser null si no aplica a este evento).
 */
export function evaluarLogrosDesbloqueables(logros, idsYaDesbloqueados, contexto) {
  return logros.filter(
    (logro) => !idsYaDesbloqueados.includes(logro.id) && cumpleCondicion(logro.condicion, contexto),
  );
}

/** Ids de personaje desbloqueados como reclutables (recompensa desbloquearPersonajeReclutable) entre los logros ya conseguidos. */
export function obtenerPersonajesReclutablesDesbloqueados(logros, idsDesbloqueados) {
  return logros
    .filter((l) => idsDesbloqueados.includes(l.id) && l.recompensa.tipo === 'desbloquearPersonajeReclutable')
    .map((l) => l.recompensa.personajeId);
}

/** Ids de objeto desbloqueados como parte del inventario inicial (recompensa desbloquearObjetoInicial) entre los logros ya conseguidos. */
export function obtenerObjetosInicialesDesbloqueados(logros, idsDesbloqueados) {
  return logros
    .filter((l) => idsDesbloqueados.includes(l.id) && l.recompensa.tipo === 'desbloquearObjetoInicial')
    .map((l) => l.recompensa.objetoId);
}

/** Ids de personaje desbloqueados como opción de equipo inicial (recompensa desbloquearPersonajeInicial) entre los logros ya conseguidos. */
export function obtenerPersonajesInicialesDesbloqueados(logros, idsDesbloqueados) {
  return logros
    .filter((l) => idsDesbloqueados.includes(l.id) && l.recompensa.tipo === 'desbloquearPersonajeInicial')
    .map((l) => l.recompensa.personajeId);
}

/**
 * Las rarezas de "una estrella": las que se pueden elegir como inicial en cuanto
 * se han tenido en el equipo alguna vez. Raros y legendarios no — esos se ganan
 * con un logro, o el reto de conseguirlos (el pergamino dorado) dejaría de existir.
 */
export const RAREZAS_DE_UNA_ESTRELLA = ['inicial', 'comun'];

/**
 * El roster de la pantalla de selección: los "inicial" de siempre, los que haya
 * desbloqueado un logro (`desbloquearPersonajeInicial`) y **los de una estrella
 * que ya hayan estado en tu equipo en alguna run** (`idsVistos`, el registro de
 * ninjas del Bingo Book). Reclutar a alguien es lo que lo desbloquea.
 *
 * En la primera run `idsVistos` está vacío y salen solo los tres iniciales, así que
 * la calibración de la primera run (documentacion/11, "v5") no se mueve.
 * Conserva el orden de `personajes`, que es el del JSON.
 */
export function rosterInicial(personajes, idsDesbloqueadosPorLogro, idsVistos) {
  return personajes.filter((p) => p.rareza === 'inicial'
    || idsDesbloqueadosPorLogro.includes(p.id)
    || (RAREZAS_DE_UNA_ESTRELLA.includes(p.rareza) && idsVistos.includes(p.id)));
}
