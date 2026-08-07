// src/engine/achievements.js
// Lógica pura de logros: qué condiciones se cumplen y qué recompensas están
// activas. No importa React ni el store — recibe listas de datos y contexto,
// devuelve datos, nunca toca localStorage ni el estado global.

/** ¿La condición de un logro se cumple con este contexto de evento? */
function cumpleCondicion(condicion, contexto) {
  if (condicion.tipo === 'derrotarJefe') {
    return contexto.jefeDerrotadoId === condicion.jefeId;
  }
  if (condicion.tipo === 'completarArcoSinDerrotas') {
    return contexto.arcoCompletadoId === condicion.arcoId && contexto.arcoCompletadoSinDerrotas === true;
  }
  return false;
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
