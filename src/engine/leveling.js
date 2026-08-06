// src/engine/leveling.js
// Lógica pura de progresión de personajes. Sin imports de React ni del store:
// solo recibe datos y devuelve datos nuevos, para poder testearse desde Node.

import configGlobal from '../data/config.json';

/**
 * XP necesaria para pasar del nivel actual al siguiente.
 * curvaXp = { xpParaSiguienteNivel, crecimiento } (viene de characters.json)
 */
export function xpParaSiguienteNivel(curvaXp, nivelActual) {
  const { xpParaSiguienteNivel: base, crecimiento } = curvaXp;
  return Math.round(base * Math.pow(crecimiento, nivelActual - 1));
}

/**
 * Estadísticas actuales de un personaje según su nivel, a partir de sus
 * stats base (nivel 1). Crecimiento lineal simple, parametrizado en config.json.
 */
export function calcularStatsPorNivel(statsBase, nivel) {
  const crecimiento = configGlobal.progresion.crecimientoStatsPorNivel;
  const factor = 1 + (nivel - 1) * crecimiento;
  return {
    hp: Math.round(statsBase.hp * factor),
    ataque: Math.round(statsBase.ataque * factor),
    defensa: Math.round(statsBase.defensa * factor),
    velocidad: Math.round(statsBase.velocidad * factor),
  };
}

/**
 * Aplica una cantidad de XP a un personaje y resuelve tantas subidas de
 * nivel como correspondan. No muta el objeto de entrada (devuelve uno nuevo).
 *
 * personajeEstado = { nivel, xpActual, ...resto de campos de la instancia en la run }
 */
export function ganarXp(personajeEstado, cantidadXp, curvaXp) {
  let { nivel, xpActual } = personajeEstado;
  let xpRestante = xpActual + cantidadXp;
  let subioNivel = false;
  const nivelMaximo = configGlobal.progresion.nivelMaximo;

  while (nivel < nivelMaximo) {
    const requerida = xpParaSiguienteNivel(curvaXp, nivel);
    if (xpRestante < requerida) break;
    xpRestante -= requerida;
    nivel += 1;
    subioNivel = true;
  }

  return {
    ...personajeEstado,
    nivel,
    xpActual: nivel >= nivelMaximo ? 0 : xpRestante,
    subioNivel,
  };
}

/**
 * Devuelve el modo (transformación) de mayor nivel que esté desbloqueado
 * para el nivel actual, o null si ninguno lo está todavía.
 * personajeBase.modos = array ordenado de menor a mayor nivelDesbloqueo.
 */
export function obtenerModoActivo(personajeBase, nivelActual) {
  if (!personajeBase.modos || personajeBase.modos.length === 0) return null;
  const desbloqueados = personajeBase.modos.filter((m) => nivelActual >= m.nivelDesbloqueo);
  if (desbloqueados.length === 0) return null;
  // El último desbloqueado es el de mayor nivelDesbloqueo (asumiendo array ordenado).
  return desbloqueados[desbloqueados.length - 1];
}

/**
 * Aplica un objeto de multiplicadores {ataque, defensa, velocidad, hp} a unas
 * stats ya calculadas. Genérico: lo usan tanto los modos/transformaciones
 * como los buffs temporales de eventos (mismo mecanismo, distinta duración).
 * Los stats no presentes en el objeto de multiplicadores no se tocan (x1).
 */
export function aplicarMultiplicadores(stats, multiplicadores) {
  if (!multiplicadores) return stats;
  return {
    hp: Math.round(stats.hp * (multiplicadores.hp ?? 1)),
    ataque: Math.round(stats.ataque * (multiplicadores.ataque ?? 1)),
    defensa: Math.round(stats.defensa * (multiplicadores.defensa ?? 1)),
    velocidad: Math.round(stats.velocidad * (multiplicadores.velocidad ?? 1)),
  };
}

/** Aplica los multiplicadores de un modo (transformación) a unas stats ya calculadas. */
export function aplicarMultiplicadoresModo(stats, modo) {
  if (!modo) return stats;
  return aplicarMultiplicadores(stats, modo.multiplicadores);
}
