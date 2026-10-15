import { describe, it, expect } from 'vitest';
import { pergaminosDeLaRun } from './pergaminos';
import configGlobal from '../data/config.json';

const reglas = configGlobal.pergaminos;
const run = (o) => ({ miniJefes: 0, jefesFinales: 0, ganada: false, ascension: 0, primerasVeces: 0, ...o });

describe('pergaminosDeLaRun', () => {
  it('perder también suma: lo que vale cada jefe derrotado', () => {
    // Cae contra Gaara: Haku, Zabuza y Kabuto derrotados.
    const r = pergaminosDeLaRun(run({ miniJefes: 2, jefesFinales: 1 }), reglas);
    expect(r.total).toBe(2 * reglas.porMiniJefe + reglas.porJefeFinal);
  });

  it('una run ganada en A0 da lo de los seis jefes más la victoria', () => {
    const r = pergaminosDeLaRun(run({ miniJefes: 3, jefesFinales: 3, ganada: true }), reglas);
    expect(r.total).toBe(3 * reglas.porMiniJefe + 3 * reglas.porJefeFinal + reglas.porRunGanada);
    expect(r.desglose.victoria).toBe(reglas.porRunGanada);
  });

  it('la ascensión multiplica lo jugado, y nunca da lo mismo que A0', () => {
    const a0 = pergaminosDeLaRun(run({ miniJefes: 1 }), reglas).total;
    const a1 = pergaminosDeLaRun(run({ miniJefes: 1, ascension: 1 }), reglas).total;
    expect(a1).toBeGreaterThan(a0);
    const a5 = pergaminosDeLaRun(run({ miniJefes: 3, jefesFinales: 3, ganada: true, ascension: 5 }), reglas);
    expect(a5.total).toBe(Math.ceil(12 * (1 + 5 * reglas.multiplicadorPorAscension)));
  });

  it('el extra de primera vez no se multiplica por la ascensión', () => {
    const r = pergaminosDeLaRun(run({ ascension: 5, primerasVeces: 2 }), reglas);
    expect(r.total).toBe(2 * reglas.primeraVezPorJefe);
    expect(r.desglose.ascension).toBe(0);
  });

  it('una run que no derrota a nadie no da nada', () => {
    expect(pergaminosDeLaRun(run({}), reglas).total).toBe(0);
  });
});

describe('retos opcionales', () => {
  it('cada reto activo suma un 25% a lo jugado', () => {
    const r = pergaminosDeLaRun(run({ miniJefes: 3, jefesFinales: 3, ganada: true, retos: 2 }), reglas);
    expect(r.total).toBe(Math.ceil(12 * (1 + 2 * reglas.multiplicadorPorReto)));
    expect(r.desglose.retos).toBe(r.total - 12);
  });
});
