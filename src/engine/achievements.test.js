import { describe, it, expect } from 'vitest';
import {
  evaluarLogrosDesbloqueables,
  obtenerPersonajesReclutablesDesbloqueados,
  obtenerObjetosInicialesDesbloqueados,
  obtenerPersonajesInicialesDesbloqueados,
  progresoDeLogro,
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

describe('obtenerPersonajesReclutablesDesbloqueados', () => {
  it('devuelve el personaje de los logros de tipo desbloquearPersonajeReclutable ya conseguidos', () => {
    const resultado = obtenerPersonajesReclutablesDesbloqueados(logrosDePrueba, ['derrotar_haku']);
    expect(resultado).toEqual(['haku']);
  });

  it('ignora logros no desbloqueados o de otro tipo de recompensa', () => {
    const resultado = obtenerPersonajesReclutablesDesbloqueados(logrosDePrueba, ['run_sin_bajas']);
    expect(resultado).toEqual([]);
  });
});

describe('obtenerObjetosInicialesDesbloqueados', () => {
  it('devuelve el objeto de los logros de tipo desbloquearObjetoInicial ya conseguidos', () => {
    const resultado = obtenerObjetosInicialesDesbloqueados(logrosDePrueba, ['run_sin_bajas']);
    expect(resultado).toEqual(['sello_chakra']);
  });
});

describe('obtenerPersonajesInicialesDesbloqueados', () => {
  it('devuelve el personaje de los logros de tipo desbloquearPersonajeInicial ya conseguidos', () => {
    const resultado = obtenerPersonajesInicialesDesbloqueados(logrosDePrueba, ['completar_run']);
    expect(resultado).toEqual(['pain_camino_deva']);
  });

  it('ignora logros no desbloqueados o de otro tipo de recompensa', () => {
    const resultado = obtenerPersonajesInicialesDesbloqueados(logrosDePrueba, ['derrotar_haku']);
    expect(resultado).toEqual([]);
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
