// src/engine/maestria.js
// Nivel de ninja (maestría): a qué nivel corresponde una XP acumulada entre runs.
// Puro: recibe la XP y las reglas (config.maestria). Ver documentacion/42.
//
// Se guarda solo la XP total de cada personaje y el nivel se DEDUCE. Un duplicado
// del gacha no lleva un contador aparte: da exactamente la XP que falta para el
// siguiente nivel (`xpParaSubirUnNivel`), así hay un único número que guardar y
// ninguna forma de que XP y nivel discrepen.

/** XP total necesaria para llegar al nivel `nivel` desde el 1. */
export function xpTotalParaNivel(nivel, reglas) {
  let total = 0;
  for (let n = 1; n < nivel; n += 1) total += reglas.costePorNivel * n;
  return total;
}

/** { nivel, xpEnNivel, xpParaSiguiente } de una XP acumulada. En el tope, xpParaSiguiente es 0. */
export function nivelDeMaestria(xp, reglas) {
  let nivel = 1;
  while (nivel < reglas.nivelMaximo && xp >= xpTotalParaNivel(nivel + 1, reglas)) nivel += 1;
  const base = xpTotalParaNivel(nivel, reglas);
  const siguiente = nivel < reglas.nivelMaximo ? xpTotalParaNivel(nivel + 1, reglas) - base : 0;
  return { nivel, xpEnNivel: xp - base, xpParaSiguiente: siguiente };
}

/** La XP que le falta a quien tiene `xp` para subir UN nivel (0 en el tope). */
export function xpParaSubirUnNivel(xp, reglas) {
  const { xpEnNivel, xpParaSiguiente } = nivelDeMaestria(xp, reglas);
  return xpParaSiguiente === 0 ? 0 : xpParaSiguiente - xpEnNivel;
}
