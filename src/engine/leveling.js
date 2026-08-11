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
 * Nivel al que llega un personaje a cada piso de una run, jugando un camino: un
 * nodo por piso, con la XP que cabe esperar de él según los pesos del arco, la XP
 * entera de los dos jefes, y arrastrando el nivel de un arco al siguiente.
 *
 * Vive en el motor y no en el simulador porque es la ÚNICA respuesta a "¿a qué
 * nivel llega el jugador a este jefe?", y esa pregunta se hace en dos sitios: el
 * script de balance y el test de invariante que impide que los niveles fijos de
 * los arcos se separen otra vez de la realidad. Ya pasó: los arcos declaraban
 * Zabuza a nivel 4 y el jugador llegaba a nivel 9, y nada avisaba.
 *
 * Agnóstico del contenido, como el resto del motor: `arcos` y `xpDeJefe` entran
 * por parámetro, aquí no se importa ningún JSON de arco.
 *
 * Es esperanza y no un sorteo: da la run promedio, sin la varianza de si en ese
 * camino concreto salieron dos tiendas seguidas.
 */
export function nivelesEstimadosDeLaRun(curvaXp, arcos, xpDeJefe) {
  let estado = { nivel: 1, xpActual: 0 };
  const porArco = {};

  for (const arco of arcos) {
    const pesoTotal = arco.poolTiposNodo.reduce((acc, t) => acc + t.peso, 0);
    const pesoCombate = arco.poolTiposNodo.find((t) => t.tipo === 'combate')?.peso ?? 0;
    const xpPorPisoNormal = (pesoCombate / pesoTotal) * (arco.xpCombateComun ?? 0);
    const nivelEnPiso = new Map([[1, estado.nivel]]);

    for (let piso = 2; piso <= arco.numeroPisos; piso += 1) {
      nivelEnPiso.set(piso, estado.nivel);

      const xp = piso === arco.pisoMiniJefe
        ? xpDeJefe(arco.miniJefeId, arco)
        : piso === arco.pisoJefeFinal
          ? xpDeJefe(arco.jefeFinalId, arco)
          : xpPorPisoNormal;

      estado = ganarXp(estado, xp, curvaXp);
    }

    porArco[arco.id] = nivelEnPiso;
  }

  return porArco;
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
