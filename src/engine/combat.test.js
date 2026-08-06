import { describe, it, expect } from 'vitest';
import {
  obtenerEficacia,
  crearLuchador,
  calcularDano,
  resolverTurno,
  resolverCombateCompleto,
} from './combat';

const personajeDePrueba = {
  id: 'test_katon',
  nombre: 'Luchador de Prueba (Katon)',
  tipo: 'katon',
  statsBase: { hp: 40, ataque: 10, defensa: 8, velocidad: 8 },
  jutsu: {
    nombre: 'Golpe de Prueba',
    danoBase: 1.2,
    efectoEstado: { stat: 'defensa', objetivo: 'enemigo', cantidad: -2, duracionTurnos: 2 },
  },
  modos: [],
};

const rivalDePrueba = {
  ...personajeDePrueba,
  id: 'test_suiton',
  nombre: 'Rival de Prueba (Suiton)',
  tipo: 'suiton',
};

describe('obtenerEficacia', () => {
  it('katon es fuerte contra fuuton (x1.5)', () => {
    expect(obtenerEficacia('katon', 'fuuton')).toBe(1.5);
  });

  it('katon es débil contra suiton (x0.5)', () => {
    expect(obtenerEficacia('katon', 'suiton')).toBe(0.5);
  });

  it('un tipo contra sí mismo es neutral (x1.0)', () => {
    expect(obtenerEficacia('katon', 'katon')).toBe(1.0);
  });
});

describe('crearLuchador', () => {
  it('empieza a HP completo por defecto', () => {
    const luchador = crearLuchador(personajeDePrueba, 5);
    expect(luchador.hpActual).toBe(luchador.hpMaximo);
  });

  it('respeta el HP persistido si se pasa hpActualInicial', () => {
    const luchador = crearLuchador(personajeDePrueba, 5, 10);
    expect(luchador.hpActual).toBe(10);
  });

  it('recorta el HP persistido si por alguna razón supera el máximo calculado', () => {
    const luchador = crearLuchador(personajeDePrueba, 1, 99999);
    expect(luchador.hpActual).toBe(luchador.hpMaximo);
  });
});

describe('calcularDano', () => {
  it('nunca es menor que 1, incluso contra defensa desproporcionada', () => {
    const atacanteDebil = crearLuchador(
      { ...personajeDePrueba, statsBase: { hp: 10, ataque: 1, defensa: 1, velocidad: 1 } },
      1,
    );
    const defensorFuerte = crearLuchador(
      { ...rivalDePrueba, statsBase: { hp: 500, ataque: 1, defensa: 500, velocidad: 1 } },
      1,
    );
    const { cantidad } = calcularDano(atacanteDebil, defensorFuerte, personajeDePrueba.jutsu);
    expect(cantidad).toBeGreaterThanOrEqual(1);
  });
});

describe('resolverTurno', () => {
  it('termina el combate cuando uno de los dos llega a 0 HP', () => {
    const luchador1 = crearLuchador(
      { ...personajeDePrueba, statsBase: { hp: 5, ataque: 100, defensa: 1, velocidad: 100 } },
      10,
    );
    const luchador2 = crearLuchador(
      { ...rivalDePrueba, statsBase: { hp: 5, ataque: 1, defensa: 1, velocidad: 1 } },
      1,
    );
    const resultado = resolverTurno(luchador1, luchador2);
    expect(resultado.combateTerminado).toBe(true);
    expect(resultado.ganadorId).toBe(luchador1.id);
  });
});

describe('resolverCombateCompleto', () => {
  it('siempre devuelve un ganador válido', () => {
    const luchador1 = crearLuchador(personajeDePrueba, 10);
    const luchador2 = crearLuchador(rivalDePrueba, 10);
    const resultado = resolverCombateCompleto(luchador1, luchador2);
    expect([luchador1.id, luchador2.id]).toContain(resultado.ganadorId);
  });

  it('el perdedor termina la pelea con 0 HP', () => {
    const luchador1 = crearLuchador(
      { ...personajeDePrueba, statsBase: { hp: 5, ataque: 100, defensa: 1, velocidad: 100 } },
      10,
    );
    const luchador2 = crearLuchador(
      { ...rivalDePrueba, statsBase: { hp: 5, ataque: 1, defensa: 1, velocidad: 1 } },
      1,
    );
    resolverCombateCompleto(luchador1, luchador2);
    expect(luchador2.hpActual).toBe(0);
  });

  it('devuelve el historial con al menos un turno', () => {
    const luchador1 = crearLuchador(personajeDePrueba, 10);
    const luchador2 = crearLuchador(rivalDePrueba, 10);
    const resultado = resolverCombateCompleto(luchador1, luchador2);
    expect(resultado.historial.length).toBeGreaterThan(0);
  });
});
