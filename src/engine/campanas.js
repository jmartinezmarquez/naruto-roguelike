// Campañas por ACTOS (documentacion/42 §5): una campaña es una lista de actos y cada
// acto, un pool de arcos. Al empezar la run se sortea uno por acto. Puro: recibe la
// campaña (de campaigns.json) y el azar.
//
// ⚠️ Un arco se calibra para su ACTO: los niveles de enemigo son fijos
// (documentacion/11), así que todos los arcos de un mismo acto se pelean en la misma
// banda. Lo comprueba un test de invariante sobre los datos.

/** Los actos de una campaña, cada uno con sus `arcoIds` posibles. */
export function actosDeCampana(campana) {
  return campana?.actos ?? [];
}

/** Los arcos de una run: uno al azar de cada acto, en orden. */
export function sortearArcosDeLaRun(campana, azar) {
  return actosDeCampana(campana).map((acto) => acto.arcoIds[Math.floor(azar() * acto.arcoIds.length)]);
}

/** Los arcos de una run cuando no se ha sorteado (o para enseñar): el primero de cada acto. */
export function primerosArcosDeCampana(campana) {
  return actosDeCampana(campana).map((acto) => acto.arcoIds[0]);
}
