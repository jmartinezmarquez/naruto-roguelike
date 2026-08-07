import { describe, it, expect } from 'vitest';
import {
  evaluarLogrosDesbloqueables,
  obtenerPersonajesReclutablesDesbloqueados,
  obtenerObjetosInicialesDesbloqueados,
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
