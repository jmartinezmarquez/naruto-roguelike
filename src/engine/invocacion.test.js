import { describe, it, expect } from 'vitest';
import { ESTADO_INVOCACION_VACIO, rarezaDeTirada, invocar, tiradasParaGarantia } from './invocacion';
import invocacionData from '../data/invocacion.json';
import charactersData from '../data/characters.json';
import enemiesData from '../data/enemies.json';
import itemsData from '../data/items.json';
import paginasData from '../data/bingo-book-pages.json';

const reglas = invocacionData;
const fijo = (v) => () => v;

describe('rarezaDeTirada', () => {
  it('sigue las probabilidades sin garantía cerca', () => {
    expect(rarezaDeTirada(ESTADO_INVOCACION_VACIO, reglas, fijo(0.05))).toBe('legendario');
    expect(rarezaDeTirada(ESTADO_INVOCACION_VACIO, reglas, fijo(0.2))).toBe('raro');
    expect(rarezaDeTirada(ESTADO_INVOCACION_VACIO, reglas, fijo(0.9))).toBe('comun');
  });
  it('la décima tirada sin raro es rara o mejor, y la trigésima sin legendario es legendaria', () => {
    const sinRaro = { ...ESTADO_INVOCACION_VACIO, sinRaro: reglas.garantiaRaro - 1 };
    expect(rarezaDeTirada(sinRaro, reglas, fijo(0.99))).toBe('raro');
    const sinLeg = { ...ESTADO_INVOCACION_VACIO, sinLegendario: reglas.garantiaLegendario - 1 };
    expect(rarezaDeTirada(sinLeg, reglas, fijo(0.99))).toBe('legendario');
  });
});

describe('invocar', () => {
  it('nunca pasan más de 10 tiradas sin raro ni 30 sin legendario, con la peor suerte posible', () => {
    // azar 0.999 = siempre común si puede.
    const { premios } = invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 60, fijo(0.999));
    let sinRaro = 0;
    let sinLeg = 0;
    for (const p of premios) {
      sinRaro = p.rareza === 'comun' ? sinRaro + 1 : 0;
      sinLeg = p.rareza === 'legendario' ? 0 : sinLeg + 1;
      expect(sinRaro).toBeLessThan(reglas.garantiaRaro);
      expect(sinLeg).toBeLessThan(reglas.garantiaLegendario);
    }
  });

  it('un ninja sale primero como ninja, luego como su página y luego repetido', () => {
    // azar fijo → siempre el mismo legendario
    const { premios, estado } = invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 3, fijo(0.05));
    expect(premios.map((p) => p.resultado)).toEqual(['personaje', 'pagina', 'repetido']);
    expect(estado.personajes).toHaveLength(1);
    expect(estado.paginas).toEqual([premios[0].id]);
    expect(estado.legendarios).toBe(3);
  });

  it('lo que ya se tenía (un inicial) empieza directamente por la página', () => {
    const { premios } = invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 1, fijo(0.05), () => true);
    expect(premios[0].resultado).toBe('pagina');
  });

  it('un objeto repetido es repetido', () => {
    const soloObjeto = reglas.catalogo.filter((e) => e.tipo === 'objeto').slice(0, 1);
    const { premios } = invocar(ESTADO_INVOCACION_VACIO, soloObjeto, reglas, 2, fijo(0.9));
    expect(premios.map((p) => p.resultado)).toEqual(['objeto', 'repetido']);
  });

  it('el ×10 con garantía acaba con al menos un legendario, aunque el azar no lo dé', () => {
    const { premios } = invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 10, fijo(0.999), () => false,
      { garantizarLegendario: true });
    expect(premios.some((p) => p.rareza === 'legendario')).toBe(true);
    const sin = invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 9, fijo(0.999));
    expect(sin.premios.some((p) => p.rareza === 'legendario')).toBe(false);
  });

  it('no muta el estado de entrada', () => {
    const antes = structuredClone(ESTADO_INVOCACION_VACIO);
    invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 5, Math.random);
    expect(ESTADO_INVOCACION_VACIO).toEqual(antes);
  });

  it('las garantías cuentan desde el estado que se pasa', () => {
    const estado = { ...ESTADO_INVOCACION_VACIO, sinRaro: 4, sinLegendario: 12 };
    expect(tiradasParaGarantia(estado, reglas)).toEqual({ raro: 6, legendario: reglas.garantiaLegendario - 12 });
  });
});

describe('invariantes de invocacion.json', () => {
  const personajes = new Set([...charactersData.personajes.map((p) => p.id),
    ...enemiesData.jefes.filter((j) => j.desbloqueablePorLogro).map((j) => j.id)]);
  const objetos = new Set(itemsData.objetos.map((o) => o.id));

  it('todo premio existe, y de las tres rarezas hay alguno', () => {
    for (const e of reglas.catalogo) {
      const existe = { personaje: personajes.has(e.id), objeto: objetos.has(e.id), pagina: Boolean(paginasData.paginas[e.id]) };
      expect(existe[e.tipo], `${e.tipo} ${e.id}`).toBe(true);
    }
    for (const r of ['comun', 'raro', 'legendario']) {
      expect(reglas.catalogo.some((e) => e.rareza === r), r).toBe(true);
    }
  });

  it('todo ninja del juego sale en el gacha, los comunes como comunes', () => {
    // Desde el 2026-10-16 el gacha es lo único que desbloquea a un ninja como inicial.
    const enCatalogo = new Map(reglas.catalogo.filter((x) => x.tipo === 'personaje').map((e) => [e.id, e.rareza]));
    for (const p of charactersData.personajes) {
      expect(enCatalogo.has(p.id), p.id).toBe(true);
      if (['inicial', 'comun'].includes(p.rareza)) expect(enCatalogo.get(p.id), p.id).toBe('comun');
    }
  });

  it('las probabilidades suman 1 y el ×10 no sale más caro que diez sueltas', () => {
    // A cambio de no ser más barato, garantiza un legendario.
    const { comun, raro, legendario } = reglas.probabilidades;
    expect(comun + raro + legendario).toBeCloseTo(1);
    expect(reglas.precioDiez).toBeLessThanOrEqual(10 * reglas.precioTirada);
    expect(reglas.diezGarantizaLegendario).toBe(true);
  });
});

describe('invariantes de bingo-book-pages.json', () => {
  const ids = new Set([...charactersData.personajes.map((p) => p.id),
    ...enemiesData.jefes.filter((j) => j.desbloqueablePorLogro).map((j) => j.id)]);

  it('toda página es de un ninja que existe, y todo ninja jugable tiene la suya', () => {
    for (const id of Object.keys(paginasData.paginas).filter((k) => !k.startsWith('_'))) {
      expect(ids.has(id), id).toBe(true);
    }
    for (const id of ids) expect(paginasData.paginas[id], id).toBeTruthy();
  });

});
