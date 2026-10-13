// src/engine/ascension.js
// Niveles de ascensión: qué modificadores rigen una run jugada en el nivel N.
// Puro y agnóstico del contenido — recibe la lista de niveles por parámetro.

/** Los modificadores de una run sin ascensión: ninguno cambia nada. */
export const MODIFICADORES_NEUTROS = Object.freeze({
  statsComunes: 1,
  statsJefes: 1,
  curacionDescanso: 1,
  curacionFinDeArco: 1,
  multiplicadorOro: 1,
});

/**
 * Los modificadores de una run en el nivel `nivel`, que son los de ese nivel Y
 * todos los anteriores (la ascensión es acumulativa, como en Slay the Spire).
 *
 * Si dos niveles tocan la misma clave se MULTIPLICAN: "comunes +15%" en A1 y
 * otro "+10%" en un nivel posterior dan ×1,265, no ×1,10. Así un nivel nuevo
 * nunca puede hacer más fácil algo que uno anterior ya endureció.
 *
 * Una clave que no está en MODIFICADORES_NEUTROS revienta: un typo en el JSON
 * no debe convertirse en un nivel de ascensión que en silencio no hace nada.
 */
export function modificadoresDeAscension(niveles, nivel) {
  const resultado = { ...MODIFICADORES_NEUTROS };
  for (const definicion of niveles) {
    if (definicion.nivel > nivel) continue;
    for (const [clave, valor] of Object.entries(definicion.modificadores ?? {})) {
      if (!(clave in MODIFICADORES_NEUTROS)) {
        throw new Error(`Modificador de ascensión desconocido en A${definicion.nivel}: ${clave}`);
      }
      resultado[clave] *= valor;
    }
  }
  return resultado;
}

/**
 * Los multiplicadores que se le pasan a `crearLuchador` para un enemigo, o null
 * si no hay que tocarlo. La velocidad NO se toca: decide quién pega primero, y
 * un +15% de velocidad le daría la iniciativa a cada enemigo empatado, que es
 * un cambio de reglas y no de dureza.
 */
export function multiplicadoresDeEnemigo(modificadores, esJefe) {
  const factor = esJefe ? modificadores.statsJefes : modificadores.statsComunes;
  if (factor === 1) return null;
  return { hp: factor, ataque: factor, defensa: factor };
}

/** El nivel más alto que se puede elegir: uno por encima del más alto ganado, sin pasarse del último. */
export function ascensionMaximaDisponible(niveles, maximaGanada) {
  const tope = niveles.reduce((acc, n) => Math.max(acc, n.nivel), 0);
  return Math.min(tope, (maximaGanada ?? -1) + 1);
}
