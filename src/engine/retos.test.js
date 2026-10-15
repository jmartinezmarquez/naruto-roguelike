import { describe, it, expect } from 'vitest';
import { modificadoresDeRetos, combinarModificadores, tamanoEquipoConRetos } from './retos';
import { MODIFICADORES_NEUTROS, modificadoresDeAscension } from './ascension';
import retosData from '../data/retos.json';
import ascensionsData from '../data/ascensions.json';

const { retos } = retosData;

describe('retos', () => {
  it('sin retos no cambia nada', () => {
    expect(modificadoresDeRetos(retos, [])).toEqual(MODIFICADORES_NEUTROS);
    expect(tamanoEquipoConRetos(retos, [], 3)).toBe(3);
  });

  it('se multiplican con la ascensión, no se pisan', () => {
    const a1 = modificadoresDeAscension(ascensionsData.niveles, 1);
    const total = combinarModificadores(a1, modificadoresDeRetos(retos, ['enemigos_duros']));
    expect(total.statsComunes).toBeCloseTo(a1.statsComunes * 1.2);
  });

  it('el dúo deja el equipo en dos', () => {
    expect(tamanoEquipoConRetos(retos, ['duo'], 3)).toBe(2);
  });

  it('un reto que no existe revienta en vez de no hacer nada', () => {
    expect(() => modificadoresDeRetos(retos, ['no_existe'])).toThrow();
  });

  it('todo reto de los datos cambia algo y tiene nombre y descripción', () => {
    for (const r of retos) {
      expect(r.nombre && r.descripcion, r.id).toBeTruthy();
      const cambia = Object.keys(r.modificadores ?? {}).length > 0 || r.tamanoEquipo;
      expect(Boolean(cambia), r.id).toBe(true);
      modificadoresDeRetos(retos, [r.id]); // no revienta
    }
  });
});
