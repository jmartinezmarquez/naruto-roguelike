import { describe, it, expect } from 'vitest';
import { actosDeCampana, sortearArcosDeLaRun, primerosArcosDeCampana } from './campanas';
import campaignsData from '../data/campaigns.json';
import { ARCOS_POR_ID as ARCOS } from '../data/arcs';
const prueba = { actos: [{ arcoIds: ['a'] }, { arcoIds: ['b1', 'b2'] }, { arcoIds: ['c1', 'c2', 'c3'] }] };

describe('sortearArcosDeLaRun', () => {
  it('saca uno de cada acto, en orden', () => {
    expect(sortearArcosDeLaRun(prueba, () => 0)).toEqual(['a', 'b1', 'c1']);
    expect(sortearArcosDeLaRun(prueba, () => 0.99)).toEqual(['a', 'b2', 'c3']);
  });
  it('sin sortear, el primero de cada acto', () => {
    expect(primerosArcosDeCampana(prueba)).toEqual(['a', 'b1', 'c1']);
  });
});

describe('invariantes de campaigns.json', () => {
  it('todo arco de todo acto existe', () => {
    for (const campana of campaignsData.campanas) {
      for (const acto of actosDeCampana(campana)) {
        expect(acto.arcoIds.length).toBeGreaterThan(0);
        for (const id of acto.arcoIds) expect(ARCOS[id], `${campana.id}: ${id}`).toBeDefined();
      }
    }
  });

  it('los arcos de un mismo acto se pelean a los mismos niveles', () => {
    // Si no, sortear un arco u otro movería la curva de niveles de la run entera.
    for (const campana of campaignsData.campanas) {
      for (const acto of actosDeCampana(campana)) {
        const bandas = acto.arcoIds.map((id) => {
          const a = ARCOS[id];
          return [a.nivelMiniJefe, a.nivelJefeFinal, a.numeroPisos].join('/');
        });
        expect(new Set(bandas).size, acto.arcoIds.join(', ')).toBe(1);
      }
    }
  });
});
