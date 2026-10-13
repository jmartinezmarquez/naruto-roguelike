import { describe, it, expect } from 'vitest';
import {
  modificadoresDeAscension, multiplicadoresDeEnemigo, ascensionMaximaDisponible, MODIFICADORES_NEUTROS,
} from './ascension';
import ascensionsData from '../data/ascensions.json';

const niveles = [
  { nivel: 1, modificadores: { statsComunes: 1.2 } },
  { nivel: 2, modificadores: { curacionDescanso: 0.5 } },
  { nivel: 3, modificadores: { statsComunes: 1.1 } },
];

describe('modificadoresDeAscension', () => {
  it('A0 no cambia nada', () => {
    expect(modificadoresDeAscension(niveles, 0)).toEqual(MODIFICADORES_NEUTROS);
  });

  it('es acumulativa: el nivel N lleva los de todos los anteriores', () => {
    const a2 = modificadoresDeAscension(niveles, 2);
    expect(a2.statsComunes).toBe(1.2);
    expect(a2.curacionDescanso).toBe(0.5);
  });

  it('dos niveles sobre la misma clave se multiplican, no se pisan', () => {
    expect(modificadoresDeAscension(niveles, 3).statsComunes).toBeCloseTo(1.32);
  });

  it('una clave desconocida revienta en vez de no hacer nada', () => {
    expect(() => modificadoresDeAscension([{ nivel: 1, modificadores: { statsComun: 2 } }], 1)).toThrow();
  });
});

describe('multiplicadoresDeEnemigo', () => {
  const mods = { ...MODIFICADORES_NEUTROS, statsComunes: 1.15, statsJefes: 1.3 };

  it('elige el multiplicador según sea jefe o común, y no toca la velocidad', () => {
    expect(multiplicadoresDeEnemigo(mods, false)).toEqual({ hp: 1.15, ataque: 1.15, defensa: 1.15 });
    expect(multiplicadoresDeEnemigo(mods, true)).toEqual({ hp: 1.3, ataque: 1.3, defensa: 1.3 });
  });

  it('sin cambio devuelve null, para no crear al enemigo por otro camino', () => {
    expect(multiplicadoresDeEnemigo(MODIFICADORES_NEUTROS, true)).toBeNull();
  });
});

describe('ascensionMaximaDisponible', () => {
  it('sin ninguna ganada solo está A0; ganar A0 abre A1', () => {
    expect(ascensionMaximaDisponible(niveles, null)).toBe(0);
    expect(ascensionMaximaDisponible(niveles, 0)).toBe(1);
  });

  it('no pasa del último nivel', () => {
    expect(ascensionMaximaDisponible(niveles, 3)).toBe(3);
  });
});

describe('ascensions.json (invariantes de datos)', () => {
  it('los niveles van del 1 al N sin huecos, y cada uno cambia algo', () => {
    ascensionsData.niveles.forEach((n, i) => {
      expect(n.nivel).toBe(i + 1);
      expect(Object.keys(n.modificadores).length, `A${n.nivel}`).toBeGreaterThan(0);
      expect(n.nombre && n.descripcion, `A${n.nivel}`).toBeTruthy();
    });
  });

  it('todas sus claves son conocidas y ninguna ascensión hace el juego más fácil', () => {
    const tope = ascensionsData.niveles.length;
    const m = modificadoresDeAscension(ascensionsData.niveles, tope);
    expect(m.statsComunes).toBeGreaterThanOrEqual(1);
    expect(m.statsJefes).toBeGreaterThanOrEqual(1);
    expect(m.curacionDescanso).toBeLessThanOrEqual(1);
    expect(m.curacionFinDeArco).toBeLessThanOrEqual(1);
    expect(m.multiplicadorOro).toBeLessThanOrEqual(1);
  });
});
