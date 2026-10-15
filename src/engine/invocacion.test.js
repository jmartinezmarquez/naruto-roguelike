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

  it('marca duplicado lo que ya se tenía y lo repetido dentro de la misma tanda', () => {
    const { premios, estado } = invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 3, fijo(0.05),
      (e) => e.id === 'nadie');
    // azar fijo → siempre el mismo legendario
    expect(premios.map((p) => p.duplicado)).toEqual([false, true, true]);
    expect(estado.personajes).toHaveLength(1);
    expect(estado.legendarios).toBe(3);
    const yaTenido = invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 1, fijo(0.05), () => true);
    expect(yaTenido.premios[0].duplicado).toBe(true);
  });

  it('no muta el estado de entrada', () => {
    const antes = structuredClone(ESTADO_INVOCACION_VACIO);
    invocar(ESTADO_INVOCACION_VACIO, reglas.catalogo, reglas, 5, Math.random);
    expect(ESTADO_INVOCACION_VACIO).toEqual(antes);
  });

  it('las garantías cuentan desde el estado que se pasa', () => {
    const estado = { ...ESTADO_INVOCACION_VACIO, sinRaro: 4, sinLegendario: 12 };
    expect(tiradasParaGarantia(estado, reglas)).toEqual({ raro: 6, legendario: 18 });
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

  it('regla de oro: ningún ninja que se recluta desde la primera run sale en el gacha', () => {
    const abiertos = charactersData.personajes.filter((p) => ['inicial', 'comun'].includes(p.rareza)).map((p) => p.id);
    for (const e of reglas.catalogo.filter((x) => x.tipo === 'personaje')) {
      expect(abiertos).not.toContain(e.id);
    }
  });

  it('las probabilidades suman 1 y diez tiradas salen más baratas que diez sueltas', () => {
    const { comun, raro, legendario } = reglas.probabilidades;
    expect(comun + raro + legendario).toBeCloseTo(1);
    expect(reglas.precioDiez).toBeLessThan(10 * reglas.precioTirada);
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

  it('las páginas salen en el gacha como comunes', () => {
    const enCatalogo = reglas.catalogo.filter((e) => e.tipo === 'pagina').map((e) => e.id);
    expect(new Set(enCatalogo)).toEqual(new Set(Object.keys(paginasData.paginas)));
  });

  it('una página repetida es duplicado como cualquier otro premio', () => {
    const soloPaginas = reglas.catalogo.filter((e) => e.tipo === 'pagina').slice(0, 1);
    const { premios, estado } = invocar(ESTADO_INVOCACION_VACIO, soloPaginas, reglas, 2, () => 0.9);
    expect(premios.map((p) => p.duplicado)).toEqual([false, true]);
    expect(estado.paginas).toEqual([soloPaginas[0].id]);
  });
});
