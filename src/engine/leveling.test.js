import { describe, it, expect } from 'vitest';
import {
  xpParaSiguienteNivel,
  calcularStatsPorNivel,
  ganarXp,
  obtenerModoActivo,
  aplicarMultiplicadores,
} from './leveling';

describe('xpParaSiguienteNivel', () => {
  it('calcula la XP requerida según la curva del personaje', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    expect(xpParaSiguienteNivel(curva, 1)).toBe(20);
    expect(xpParaSiguienteNivel(curva, 2)).toBe(22); // 20 * 1.1
  });
});

describe('calcularStatsPorNivel', () => {
  it('a nivel 1 las stats son iguales a las base', () => {
    const statsBase = { hp: 40, ataque: 10, defensa: 8, velocidad: 6 };
    expect(calcularStatsPorNivel(statsBase, 1)).toEqual(statsBase);
  });

  it('las stats suben con el nivel', () => {
    const statsBase = { hp: 40, ataque: 10, defensa: 8, velocidad: 6 };
    const statsNivelAlto = calcularStatsPorNivel(statsBase, 20);
    expect(statsNivelAlto.hp).toBeGreaterThan(statsBase.hp);
    expect(statsNivelAlto.ataque).toBeGreaterThan(statsBase.ataque);
  });
});

describe('ganarXp', () => {
  it('sube de nivel cuando la XP acumulada supera el umbral', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    const personaje = { nivel: 1, xpActual: 0 };
    const resultado = ganarXp(personaje, 25, curva);
    expect(resultado.nivel).toBe(2);
    expect(resultado.subioNivel).toBe(true);
    expect(resultado.xpActual).toBe(5); // 25 - 20
  });

  it('puede subir varios niveles de golpe con suficiente XP', () => {
    const curva = { xpParaSiguienteNivel: 10, crecimiento: 1.0 };
    const personaje = { nivel: 1, xpActual: 0 };
    const resultado = ganarXp(personaje, 35, curva);
    expect(resultado.nivel).toBe(4); // 10+10+10=30, sobran 5
  });

  it('no muta el objeto de entrada', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    const personaje = { nivel: 1, xpActual: 0 };
    ganarXp(personaje, 25, curva);
    expect(personaje.nivel).toBe(1);
  });

  it('no sube de nivel si la XP no llega al umbral', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    const personaje = { nivel: 1, xpActual: 0 };
    const resultado = ganarXp(personaje, 5, curva);
    expect(resultado.nivel).toBe(1);
    expect(resultado.subioNivel).toBe(false);
  });
});

describe('obtenerModoActivo', () => {
  const personajeConDosModos = {
    modos: [
      { nombre: 'Modo 1', nivelDesbloqueo: 10, multiplicadores: { ataque: 1.2, defensa: 1.1, velocidad: 1.1, hp: 1.1 } },
      { nombre: 'Modo 2', nivelDesbloqueo: 50, multiplicadores: { ataque: 1.5, defensa: 1.3, velocidad: 1.3, hp: 1.3 } },
    ],
  };

  it('devuelve null si no hay ningún modo desbloqueado todavía', () => {
    expect(obtenerModoActivo(personajeConDosModos, 5)).toBeNull();
  });

  it('devuelve el modo de menor nivel si es el único desbloqueado', () => {
    expect(obtenerModoActivo(personajeConDosModos, 20).nombre).toBe('Modo 1');
  });

  it('devuelve el modo de MAYOR nivel desbloqueado, no el primero de la lista', () => {
    expect(obtenerModoActivo(personajeConDosModos, 60).nombre).toBe('Modo 2');
  });

  it('devuelve null si el personaje no tiene modos', () => {
    expect(obtenerModoActivo({ modos: [] }, 100)).toBeNull();
  });
});

describe('aplicarMultiplicadores', () => {
  it('multiplica solo los stats indicados, deja el resto igual', () => {
    const stats = { hp: 100, ataque: 10, defensa: 10, velocidad: 10 };
    const resultado = aplicarMultiplicadores(stats, { ataque: 1.5 });
    expect(resultado.ataque).toBe(15);
    expect(resultado.hp).toBe(100);
  });

  it('devuelve las stats sin cambios si no hay multiplicadores', () => {
    const stats = { hp: 100, ataque: 10, defensa: 10, velocidad: 10 };
    expect(aplicarMultiplicadores(stats, null)).toEqual(stats);
  });
});
