import { describe, it, expect } from 'vitest';
import { chispasDelGolpe, intensidadTemblorArena } from './efectosDeGolpe';

const basico = { tipoAtaque: 'basico', dano: 10, eficacia: 1, hpDefensor: 50 };
const jutsu = { tipoAtaque: 'jutsu', dano: 30, eficacia: 1, hpDefensor: 50 };

describe('intensidadTemblorArena', () => {
  it('un básico corriente no hace temblar la arena', () => {
    // Si temblara con cada básico, el temblor dejaría de significar nada.
    expect(intensidadTemblorArena(basico)).toBe(0);
  });

  it('un golpe bloqueado no tiembla aunque sea un jutsu', () => {
    expect(intensidadTemblorArena({ ...jutsu, dano: 0 })).toBe(0);
  });

  it('jutsu, golpe muy eficaz y golpe que tumba sí, y el que tumba más que el jutsu', () => {
    expect(intensidadTemblorArena(jutsu)).toBeGreaterThan(0);
    expect(intensidadTemblorArena({ ...basico, eficacia: 2 })).toBeGreaterThan(0);
    expect(intensidadTemblorArena({ ...basico, hpDefensor: 0 })).toBeGreaterThan(0);
    expect(intensidadTemblorArena({ ...jutsu, hpDefensor: 0 })).toBeGreaterThan(intensidadTemblorArena(jutsu));
  });

  it('sin golpe, nada', () => {
    expect(intensidadTemblorArena(null)).toBe(0);
  });
});

describe('chispasDelGolpe', () => {
  it('un golpe bloqueado no salta chispas: no ha tocado', () => {
    expect(chispasDelGolpe({ ...basico, dano: 0 }, 'katon')).toBeNull();
  });

  it('el jutsu lleva el color de la naturaleza de quien lo lanza; el básico no', () => {
    expect(chispasDelGolpe(jutsu, 'katon').color).toBe('var(--color-katon)');
    expect(chispasDelGolpe(jutsu, 'suiton').color).toBe('var(--color-suiton)');
    // El básico es el mismo kunai para todos: no tiene naturaleza.
    expect(chispasDelGolpe(basico, 'katon').color).toBe(chispasDelGolpe(basico, 'suiton').color);
  });

  it('el jutsu salta más que el básico, y la eficacia mueve la cantidad', () => {
    const cuantas = (golpe) => chispasDelGolpe(golpe, 'raiton').chispas.length;
    expect(cuantas(jutsu)).toBeGreaterThan(cuantas(basico));
    expect(cuantas({ ...basico, eficacia: 2 })).toBeGreaterThan(cuantas(basico));
    expect(cuantas({ ...basico, eficacia: 0.5 })).toBeLessThan(cuantas(basico));
  });

  it('es determinista: el mismo golpe pinta las mismas chispas en cada render', () => {
    expect(chispasDelGolpe(jutsu, 'fuuton')).toEqual(chispasDelGolpe(jutsu, 'fuuton'));
  });
});
