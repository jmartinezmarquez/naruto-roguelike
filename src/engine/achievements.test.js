import { describe, it, expect } from 'vitest';
import {
  evaluarLogrosDesbloqueables,
  obtenerPersonajesReclutablesDesbloqueados,
  obtenerObjetosInicialesDesbloqueados,
  obtenerPersonajesInicialesDesbloqueados,
  progresoDeLogro,
  puntosDeLogro,
  puntosAcumulados,
  puntosMaximos,
  rangoNinja,
  rangoDeMision,
  RANGOS_NINJA,
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

// --- Rangos (punto 19) -----------------------------------------------------

const conRango = (id, rango) => ({ id, rango, condicion: { tipo: 'derrotarJefe' }, recompensa: { tipo: 'ninguna' } });

describe('puntos de misión', () => {
  it('cada rango vale lo suyo', () => {
    expect(puntosDeLogro(conRango('x', 'D'))).toBe(1);
    expect(puntosDeLogro(conRango('x', 'S'))).toBe(12);
  });

  it('⚠️ una S vale más que seis D, o nadie intentaría lo difícil', () => {
    // La curva es convexa a propósito. Si fuera lineal, la forma óptima de subir
    // de rango ninja sería no intentar nunca nada duro.
    expect(puntosDeLogro(conRango('x', 'S'))).toBeGreaterThan(6 * puntosDeLogro(conRango('y', 'D')));
  });

  it('solo suman los logros conseguidos', () => {
    const logros = [conRango('a', 'D'), conRango('b', 'S'), conRango('c', 'B')];
    expect(puntosAcumulados(logros, ['a', 'c'])).toBe(1 + 4);
    expect(puntosAcumulados(logros, [])).toBe(0);
    expect(puntosMaximos(logros)).toBe(1 + 12 + 4);
  });

  it('un logro sin rango no rompe nada, vale 0', () => {
    // No llega a pasar —hay un invariante sobre el JSON— pero un `undefined`
    // propagándose a la aritmética convertiría los puntos en NaN y el rango
    // ninja entero en basura silenciosa.
    expect(puntosDeLogro({ id: 'x' })).toBe(0);
    expect(puntosAcumulados([{ id: 'x' }], ['x'])).toBe(0);
  });
});

describe('rango ninja', () => {
  it('empieza en Genin con cero puntos', () => {
    expect(rangoNinja(0).actual.id).toBe('genin');
  });

  it('sube al alcanzar el umbral exacto', () => {
    const chunin = RANGOS_NINJA.find((r) => r.id === 'chunin');
    expect(rangoNinja(chunin.umbral - 1).actual.id).toBe('genin');
    expect(rangoNinja(chunin.umbral).actual.id).toBe('chunin');
  });

  it('en la cima no hay siguiente ni cuenta atrás', () => {
    const kage = RANGOS_NINJA[RANGOS_NINJA.length - 1];
    const cima = rangoNinja(kage.umbral + 50);
    expect(cima.actual.id).toBe('kage');
    expect(cima.siguiente).toBeNull();
    expect(cima.faltan).toBe(0);
    expect(cima.progreso).toBe(1);
  });

  it('dice cuánto falta para el siguiente, que es lo que pica', () => {
    const jonin = RANGOS_NINJA.find((r) => r.id === 'jonin');
    const r = rangoNinja(jonin.umbral - 3);
    expect(r.siguiente.id).toBe('jonin');
    expect(r.faltan).toBe(3);
    expect(r.progreso).toBeGreaterThan(0);
    expect(r.progreso).toBeLessThan(1);
  });

  it('⚠️ el progreso es del TRAMO, no del total', () => {
    // Una barra que midiera sobre el total se quedaría casi vacía toda la
    // partida y no comunicaría nada. Recién ascendido: barra a cero.
    const jonin = RANGOS_NINJA.find((r) => r.id === 'jonin');
    expect(rangoNinja(jonin.umbral).progreso).toBe(0);
  });

  it('los umbrales están ordenados', () => {
    const umbrales = RANGOS_NINJA.map((r) => r.umbral);
    expect([...umbrales].sort((a, b) => a - b)).toEqual(umbrales);
  });
});

describe('rango de la run', () => {
  it('sin completar ni un arco es D', () => {
    expect(rangoDeMision({ arcosCompletados: 0 })).toBe('D');
  });

  it('un arco C, dos B', () => {
    expect(rangoDeMision({ arcosCompletados: 1 })).toBe('C');
    expect(rangoDeMision({ arcosCompletados: 2 })).toBe('B');
  });

  it('ganar la run es A', () => {
    expect(rangoDeMision({ arcosCompletados: 3, runGanada: true, huboBajas: true })).toBe('A');
  });

  it('⚠️ y la S pide ganarla SIN una sola baja', () => {
    // Si la S la diera cualquier victoria, el 100% de las runs ganadas serían S
    // y la escala tendría cuatro peldaños en vez de cinco.
    expect(rangoDeMision({ arcosCompletados: 3, runGanada: true, huboBajas: false })).toBe('S');
  });

  it('sin argumentos no revienta: da la nota más baja', () => {
    expect(rangoDeMision()).toBe('D');
  });
});
