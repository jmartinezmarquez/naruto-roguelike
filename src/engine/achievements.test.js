import { describe, it, expect } from 'vitest';
import {
  ofertaInicial,
  evaluarLogrosDesbloqueables,
  progresoDeLogro,
  rosterInicial,
  pergaminosPorCobrar,
} from './achievements';

const logrosDePrueba = [
  {
    id: 'derrotar_haku',
    condicion: { tipo: 'derrotarJefe', jefeId: 'haku' },
    recompensa: { tipo: 'desbloquearPersonajeReclutable', personajeId: 'haku' },
  },
  {
    id: 'run_sin_bajas',
    condicion: { tipo: 'completarArcoSinDerrotas', arcoId: 'pais_de_las_olas' },
    recompensa: { tipo: 'desbloquearObjetoInicial', objetoId: 'sello_chakra' },
  },
  {
    id: 'completar_run',
    condicion: { tipo: 'derrotarJefe', jefeId: 'pain_camino_deva' },
    recompensa: { tipo: 'desbloquearPersonajeInicial', personajeId: 'pain_camino_deva' },
  },
];

describe('evaluarLogrosDesbloqueables', () => {
  it('desbloquea "derrotar_haku" cuando el jefe derrotado coincide', () => {
    const resultado = evaluarLogrosDesbloqueables(logrosDePrueba, [], {
      jefeDerrotadoId: 'haku',
      arcoCompletadoId: null,
      arcoCompletadoSinDerrotas: false,
    });
    expect(resultado.map((l) => l.id)).toEqual(['derrotar_haku']);
  });

  it('no desbloquea nada si el jefe derrotado no coincide con ningún logro', () => {
    const resultado = evaluarLogrosDesbloqueables(logrosDePrueba, [], {
      jefeDerrotadoId: 'enemigo_comun_cualquiera',
      arcoCompletadoId: null,
      arcoCompletadoSinDerrotas: false,
    });
    expect(resultado).toHaveLength(0);
  });

  it('desbloquea "run_sin_bajas" solo si el arco se completó sin derrotas', () => {
    const conDerrotas = evaluarLogrosDesbloqueables(logrosDePrueba, [], {
      jefeDerrotadoId: 'zabuza',
      arcoCompletadoId: 'pais_de_las_olas',
      arcoCompletadoSinDerrotas: false,
    });
    expect(conDerrotas.map((l) => l.id)).not.toContain('run_sin_bajas');

    const sinDerrotas = evaluarLogrosDesbloqueables(logrosDePrueba, [], {
      jefeDerrotadoId: 'zabuza',
      arcoCompletadoId: 'pais_de_las_olas',
      arcoCompletadoSinDerrotas: true,
    });
    expect(sinDerrotas.map((l) => l.id)).toContain('run_sin_bajas');
  });

  it('no vuelve a proponer un logro ya desbloqueado', () => {
    const resultado = evaluarLogrosDesbloqueables(logrosDePrueba, ['derrotar_haku'], {
      jefeDerrotadoId: 'haku',
      arcoCompletadoId: null,
      arcoCompletadoSinDerrotas: false,
    });
    expect(resultado).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Condiciones acumuladas (punto 5a): contadores entre runs y colección de la
// enciclopedia. Las dos entran POR EL CONTEXTO — el motor no lee stores.
// ---------------------------------------------------------------------------

const logrosAcumulados = [
  {
    id: 'combates_10',
    condicion: { tipo: 'contadorMinimo', contador: 'combatesGanados', cantidad: 10 },
    recompensa: { tipo: 'ninguna' },
  },
  {
    id: 'vistos_modos_10',
    condicion: { tipo: 'coleccionMinima', categoria: 'modos', cantidad: 3 },
    recompensa: { tipo: 'ninguna' },
  },
];

describe('condición contadorMinimo', () => {
  it('se cumple al alcanzar la cantidad exacta, no un combate después', () => {
    const contexto = { contadores: { combatesGanados: 10 } };
    expect(evaluarLogrosDesbloqueables(logrosAcumulados, [], contexto).map((l) => l.id))
      .toEqual(['combates_10']);
  });

  it('no se cumple por debajo de la cantidad', () => {
    const contexto = { contadores: { combatesGanados: 9 } };
    expect(evaluarLogrosDesbloqueables(logrosAcumulados, [], contexto)).toHaveLength(0);
  });

  it('un contador que no existe en el contexto cuenta como 0 y no revienta', () => {
    expect(evaluarLogrosDesbloqueables(logrosAcumulados, [], {})).toHaveLength(0);
  });
});

describe('condición coleccionMinima', () => {
  it('mide cuántas entradas DISTINTAS hay en esa categoría de vistos', () => {
    const contexto = { vistos: { modos: ['naruto_0', 'sasuke_0', 'sakura_0'] } };
    expect(evaluarLogrosDesbloqueables(logrosAcumulados, [], contexto).map((l) => l.id))
      .toEqual(['vistos_modos_10']);
  });

  it('no mira las otras categorías', () => {
    const contexto = { vistos: { enemigos: ['a', 'b', 'c', 'd'], modos: ['naruto_0'] } };
    expect(evaluarLogrosDesbloqueables(logrosAcumulados, [], contexto)).toHaveLength(0);
  });
});

describe('progresoDeLogro', () => {
  it('devuelve actual/objetivo para un logro de contador', () => {
    const progreso = progresoDeLogro(logrosAcumulados[0], { contadores: { combatesGanados: 4 } });
    expect(progreso).toEqual({ actual: 4, objetivo: 10 });
  });

  it('devuelve actual/objetivo para un logro de colección', () => {
    const progreso = progresoDeLogro(logrosAcumulados[1], { vistos: { modos: ['a', 'b'] } });
    expect(progreso).toEqual({ actual: 2, objetivo: 3 });
  });

  it('devuelve null para una condición de suceso: no tiene medias tintas', () => {
    expect(progresoDeLogro(logrosDePrueba[0], {})).toBeNull();
  });
});

describe('rosterInicial', () => {
  const personajes = [
    { id: 'a', rareza: 'inicial' },
    { id: 'b', rareza: 'comun' },
    { id: 'c', rareza: 'comun' },
    { id: 'd', rareza: 'raro' },
    { id: 'e', rareza: 'legendario' },
  ];

  it('en la primera run (nada visto, ningún logro) solo salen los iniciales', () => {
    expect(rosterInicial(personajes, [], []).map((p) => p.id)).toEqual(['a']);
  });

  it('solo los iniciales y lo conseguido en el gacha, de cualquier rareza', () => {
    expect(rosterInicial(personajes, []).map((p) => p.id)).toEqual(['a']);
    expect(rosterInicial(personajes, ['c', 'd']).map((p) => p.id)).toEqual(['a', 'c', 'd']);
  });
});

describe('pergaminosPorCobrar', () => {
  const logros = [
    { id: 'a', recompensa: { tipo: 'pergaminos', cantidad: 3 } },
    { id: 'b', recompensa: { tipo: 'pergaminos', cantidad: 5 } },
    { id: 'c', recompensa: { tipo: 'ninguna' } },
  ];
  it('suma solo los desbloqueados y no cobrados que dan pergaminos', () => {
    expect(pergaminosPorCobrar(logros, ['a', 'b', 'c'], ['a'])).toEqual({ total: 5, ids: ['b'] });
    expect(pergaminosPorCobrar(logros, ['a'], ['a'])).toEqual({ total: 0, ids: [] });
  });
});

describe('condiciones con filtros (logros por personaje y de reto)', () => {
  const evalua = (condicion, contexto) => evaluarLogrosDesbloqueables(
    [{ id: 'x', condicion, recompensa: { tipo: 'ninguna' } }], [], contexto,
  ).length === 1;

  it('derrotarJefe con un personaje en el equipo', () => {
    const c = { tipo: 'derrotarJefe', jefeId: 'gaara', conPersonajeId: 'rock_lee' };
    expect(evalua(c, { jefeDerrotadoId: 'gaara', equipoIds: ['naruto', 'rock_lee'] })).toBe(true);
    expect(evalua(c, { jefeDerrotadoId: 'gaara', equipoIds: ['naruto'] })).toBe(false);
  });

  it('derrotarJefe sin relevos y solo jefe final, sin jefe concreto', () => {
    const c = { tipo: 'derrotarJefe', soloJefeFinal: true, sinRelevos: true };
    expect(evalua(c, { jefeDerrotadoId: 'zabuza', arcoCompletadoId: 'olas', sinRelevos: true })).toBe(true);
    expect(evalua(c, { jefeDerrotadoId: 'haku', arcoCompletadoId: null, sinRelevos: true })).toBe(false);
    expect(evalua(c, { jefeDerrotadoId: 'zabuza', arcoCompletadoId: 'olas', sinRelevos: false })).toBe(false);
  });

  it('ganarRun con líder, solo comunes, sin tiendas y sin consumibles', () => {
    const equipo = [{ id: 'shikamaru', rareza: 'comun' }, { id: 'ino', rareza: 'comun' }];
    const ganada = { runGanada: true, equipo, estadisticasRun: { tiendasVisitadas: 0, consumiblesUsados: 2 } };
    expect(evalua({ tipo: 'ganarRun', liderId: 'shikamaru' }, ganada)).toBe(true);
    expect(evalua({ tipo: 'ganarRun', liderId: 'ino' }, ganada)).toBe(false);
    expect(evalua({ tipo: 'ganarRun', soloRarezas: ['comun'] }, ganada)).toBe(true);
    expect(evalua({ tipo: 'ganarRun', sinTiendas: true }, ganada)).toBe(true);
    expect(evalua({ tipo: 'ganarRun', sinConsumibles: true }, ganada)).toBe(false);
    expect(evalua({ tipo: 'ganarRun', liderId: 'shikamaru' }, { ...ganada, runGanada: false })).toBe(false);
  });
});

describe('ofertaInicial', () => {
  const pesos = { comun: 1, raro: 0.4, legendario: 0.15 };
  const roster = [
    ...['a', 'b', 'c', 'd'].map((id) => ({ id, rareza: 'comun' })),
    { id: 'r', rareza: 'raro' }, { id: 'l', rareza: 'legendario' },
  ];

  it('saca tantos como pide, sin repetir, y todos si no hay más', () => {
    const tres = ofertaInicial(roster, 3, pesos, Math.random);
    expect(new Set(tres.map((p) => p.id)).size).toBe(3);
    expect(ofertaInicial(roster.slice(0, 2), 3, pesos, Math.random)).toHaveLength(2);
  });

  it('un legendario sale menos que un raro, y un raro menos que un común', () => {
    const veces = { a: 0, r: 0, l: 0 };
    let semilla = 1;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    for (let n = 0; n < 4000; n++) {
      for (const p of ofertaInicial(roster, 3, pesos, azar)) if (p.id in veces) veces[p.id] += 1;
    }
    expect(veces.l).toBeLessThan(veces.r);
    expect(veces.r).toBeLessThan(veces.a);
  });
});
