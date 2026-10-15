import { describe, it, expect } from 'vitest';
import { nivelDeMaestria, xpTotalParaNivel, xpParaSubirUnNivel, tituloDeMaestria, aspectosDesbloqueados } from './maestria';
import maestriaData from '../data/maestria.json';
import configGlobal from '../data/config.json';

const reglas = configGlobal.maestria;

describe('nivel de ninja (maestría)', () => {
  it('empieza en 1 y cada nivel cuesta más que el anterior', () => {
    expect(nivelDeMaestria(0, reglas).nivel).toBe(1);
    expect(xpTotalParaNivel(2, reglas)).toBe(reglas.costePorNivel);
    expect(xpTotalParaNivel(3, reglas)).toBe(reglas.costePorNivel * 3);
    expect(nivelDeMaestria(reglas.costePorNivel, reglas)).toEqual({ nivel: 2, xpEnNivel: 0, xpParaSiguiente: reglas.costePorNivel * 2 });
  });

  it('no pasa del tope', () => {
    const r = nivelDeMaestria(1e9, reglas);
    expect(r.nivel).toBe(reglas.nivelMaximo);
    expect(r.xpParaSiguiente).toBe(0);
    expect(xpParaSubirUnNivel(1e9, reglas)).toBe(0);
  });

  it('un duplicado (lo que falta para subir) sube exactamente un nivel', () => {
    for (const xp of [0, 15, 40, 100, 300]) {
      const antes = nivelDeMaestria(xp, reglas).nivel;
      expect(nivelDeMaestria(xp + xpParaSubirUnNivel(xp, reglas), reglas).nivel).toBe(antes + 1);
    }
  });

  it('una run ganada con jefes deja a un personaje cerca del nivel 2, no en el 5', () => {
    // ~12 combates, 6 jefes y la victoria: la primera run tiene que notarse, sin regalar niveles.
    const xp = 12 * reglas.xpPorCombate + 6 * reglas.xpPorJefe + reglas.xpPorRunGanada;
    expect(nivelDeMaestria(xp, reglas).nivel).toBe(2);
  });
});

describe('tituloDeMaestria', () => {
  const datos = { titulos: { 2: 'Genin', 6: 'Chunin', 10: 'Master' }, porPersonaje: { naruto: { 10: 'Hokage' } } };
  it('sin nivel suficiente no hay título, y luego se queda el último alcanzado', () => {
    expect(tituloDeMaestria('sakura', 1, datos)).toBeNull();
    expect(tituloDeMaestria('sakura', 2, datos)).toBe('Genin');
    expect(tituloDeMaestria('sakura', 7, datos)).toBe('Chunin');
  });
  it('el propio del personaje sustituye al genérico en su nivel', () => {
    expect(tituloDeMaestria('naruto', 10, datos)).toBe('Hokage');
    expect(tituloDeMaestria('sakura', 10, datos)).toBe('Master');
    expect(tituloDeMaestria('naruto', 6, datos)).toBe('Chunin');
  });
});

describe('aspectosDesbloqueados', () => {
  it('se abren con el nivel de ninja, en orden', () => {
    const datos = { aspectos: { 1: 4, 2: 10 } };
    expect(aspectosDesbloqueados(3, datos)).toEqual([]);
    expect(aspectosDesbloqueados(4, datos)).toEqual([1]);
    expect(aspectosDesbloqueados(10, datos)).toEqual([1, 2]);
  });
  it('todo aspecto se puede abrir antes del nivel máximo de maestría', () => {
    for (const nivel of Object.values(maestriaData.aspectos)) {
      expect(nivel).toBeLessThanOrEqual(configGlobal.maestria.nivelMaximo);
    }
  });
});
