// src/engine/pergaminos.js
// Pergaminos de invocación: cuántos da una run al acabar. Puro: recibe lo que ha
// pasado en la run y las reglas, y devuelve el total y de dónde sale cada parte
// (la pantalla de fin de run lo enseña desglosado). Ver documentacion/42.

/**
 * `run`: { miniJefes, jefesFinales, ganada, ascension, primerasVeces }
 *   - miniJefes / jefesFinales: cuántos se han derrotado en esta run.
 *   - primerasVeces: cuántos de esos jefes no se habían derrotado NUNCA antes.
 * `reglas`: config.pergaminos.
 *
 * El multiplicador de ascensión se aplica a lo ganado JUGANDO (jefes y victoria),
 * no al extra de primera vez: ese es un premio a descubrir, y descubrir no es más
 * difícil en A5. Se redondea hacia arriba para que la ascensión nunca dé lo mismo
 * que A0 por culpa del redondeo en runs cortas.
 */
export function pergaminosDeLaRun(run, reglas) {
  const porJefes = run.miniJefes * reglas.porMiniJefe + run.jefesFinales * reglas.porJefeFinal;
  const porVictoria = run.ganada ? reglas.porRunGanada : 0;
  const base = porJefes + porVictoria;
  const multiplicador = 1 + reglas.multiplicadorPorAscension * (run.ascension ?? 0);
  const conAscension = base > 0 ? Math.ceil(base * multiplicador) : 0;
  // Los retos opcionales suman al mismo multiplicador (no se multiplican entre sí).
  const conRetos = base > 0
    ? Math.ceil(base * (multiplicador + (reglas.multiplicadorPorReto ?? 0) * (run.retos ?? 0)))
    : 0;
  const porPrimerasVeces = (run.primerasVeces ?? 0) * reglas.primeraVezPorJefe;
  return {
    total: conRetos + porPrimerasVeces,
    desglose: {
      jefes: porJefes,
      victoria: porVictoria,
      ascension: conAscension - base,
      retos: conRetos - conAscension,
      primerasVeces: porPrimerasVeces,
    },
  };
}
