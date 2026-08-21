// @vitest-environment jsdom
//
// La contradicción que se vio jugando: **la barra llena y "Locked" al lado.**
//
// Los logros se evalúan cuando PASA algo (ganas, reclutas, compras), y eso deja un
// hueco: el progreso que ya estaba guardado cuando el logro se añadió no lo ha mirado
// nadie. Al estrenar los logros de contador, quien ya tuviera 8 objetos en la
// enciclopedia veía la barra al 8/8 y la palabra "Locked" — el juego decía dos cosas
// contrarias en la misma línea. Se tapó con un catch-all en `abrirLogros`.
//
// ⚠️ Lo que se prueba aquí NO es ese catch-all, es la **contradicción**: que no exista
// ninguna fila con el progreso cumplido y el cartel de bloqueado. Escrito así, el test
// sigue valiendo si mañana el arreglo se hace de otra forma, y salta con cada logro
// nuevo que se añada — que es cuando el problema volvería.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../../test-dom';
import AchievementsScreen from './AchievementsScreen';
import { useGameStore } from '../../store/useGameStore';
import {
  useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA,
} from '../../store/useAchievementsStore';
import { progresoDeLogro } from '../../engine/achievements';
import achievementsData from '../../data/achievements.json';

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({
    logrosDesbloqueados: [],
    vistos: VISTOS_VACIO,
    contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA,
    notificacionesPendientes: [],
  });
});

/** El cartel ('Locked' / 'Unlocked') de la fila de un logro, buscándolo por su nombre. */
function estadoDeLaFila(nombre) {
  const fila = screen.getByText(nombre).closest('div.flex-1')?.parentElement;
  expect(fila, `no se ha encontrado la fila del logro "${nombre}"`).toBeTruthy();
  return fila.textContent.includes('Unlocked') ? 'Unlocked' : 'Locked';
}

describe('ningún logro puede estar cumplido y bloqueado a la vez', () => {
  it('con todo el progreso al máximo, ninguna fila cumplida dice "Locked"', () => {
    // Contadores por las nubes y la enciclopedia entera vista: cualquier logro de
    // `contadorMinimo` o `coleccionMinima` queda cumplido con esto.
    const contadores = Object.fromEntries(Object.keys(CONTADORES_VACIO).map((k) => [k, 9999]));
    const vistos = Object.fromEntries(
      Object.keys(VISTOS_VACIO).map((k) => [k, Array.from({ length: 99 }, (_, i) => `relleno_${i}`)]),
    );
    useAchievementsStore.setState({ contadores, vistos });

    // El jugador abre la pantalla, que es el momento en que se veía la contradicción.
    useGameStore.getState().abrirLogros();
    render(<AchievementsScreen />);

    const contradictorios = achievementsData.logros.filter((logro) => {
      const progreso = progresoDeLogro(logro, { contadores, vistos });
      if (!progreso || progreso.actual < progreso.objetivo) return false;
      return estadoDeLaFila(logro.nombre) === 'Locked';
    });

    expect(contradictorios.map((l) => l.id)).toEqual([]);
  });

  it('y hay logros de progreso de verdad que comprobar', () => {
    // Sin esto, el test de arriba pasaría también si `progresoDeLogro` devolviera
    // `null` para todo: no habría contradicciones porque no habría barras.
    const conBarra = achievementsData.logros
      .filter((l) => progresoDeLogro(l, { contadores: CONTADORES_VACIO, vistos: VISTOS_VACIO }));
    expect(conBarra.length).toBeGreaterThan(0);
  });
});

describe('lo que ve el jugador de partida', () => {
  it('sin nada hecho, todos salen bloqueados', () => {
    render(<AchievementsScreen />);
    expect(screen.queryAllByText('Unlocked')).toHaveLength(0);
    expect(screen.getAllByText('Locked')).toHaveLength(achievementsData.logros.length);
  });

  it('un logro desbloqueado sale como conseguido y sin barra', () => {
    const logro = achievementsData.logros.find((l) => l.condicion.tipo === 'contadorMinimo');
    useAchievementsStore.setState({ logrosDesbloqueados: [logro.id] });
    render(<AchievementsScreen />);

    expect(estadoDeLaFila(logro.nombre)).toBe('Unlocked');
    // "50 / 50" al lado de la palabra "Unlocked" no añade nada, así que la barra
    // desaparece al conseguirlo — es una decisión de diseño, no un descuido.
    const fila = screen.getByText(logro.nombre).closest('div.flex-1');
    expect(fila.textContent).not.toContain(`/ ${logro.condicion.cantidad}`);
  });
});
