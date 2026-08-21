// @vitest-environment jsdom
//
// `CombatScreen` sigue **sin test de lo que se ve**: es la pantalla con relojes y con
// medidas de maquetación, y jsdom no maqueta (ver documentacion/16-testing.md). Lo que
// se prueba aquí es lo otro — **a dónde te lleva el final de un combate y cuándo**, que
// es lógica pura y de la que depende que no te saltes una pantalla.
//
// ⚠️ Sale de la tanda de ritmo del 2026-08-21, donde el final de combate perdió dos
// botones que eran peaje ("Claim reward", "Recruit them") y ganó un auto-avance. Los dos
// cambios se pueden estropear sin que falle nada: un botón que vuelve, o un auto-avance
// que se dispara donde había algo que leer y te roba la recompensa.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '../../test-dom';
import CombatScreen from './CombatScreen';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore, AJUSTES_POR_DEFECTO } from '../../store/useSettingsStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';
import arcoDePrueba from '../../data/arcs/pais-de-las-olas.json';
import itemsData from '../../data/items.json';

/** Dos enemigos de juguete pero con ids REALES: sin sprite, la tarjeta no pinta `<img>`
 *  y los tests de pose no tendrían nada que mirar. */
const conSprite = (id, nombre) => ({
  id, nombre, tipo: 'doton',
  statsBase: { hp: 1, ataque: 1, defensa: 1, velocidad: 1 },
  jutsu: { nombre: 'Golpe Débil', danoBase: 0.1, efectoEstado: null },
  modos: [],
});

const enemigoDebil = {
  id: 'enemigo_debil_test',
  nombre: 'Enemigo Débil de Prueba',
  tipo: 'doton',
  statsBase: { hp: 1, ataque: 1, defensa: 1, velocidad: 1 },
  jutsu: { nombre: 'Golpe Débil', danoBase: 0.1, efectoEstado: null },
  modos: [],
};

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(AJUSTES_POR_DEFECTO);
  useAchievementsStore.setState({
    logrosDesbloqueados: [], vistos: VISTOS_VACIO, contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA, notificacionesPendientes: [],
  });
  useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
});

/**
 * Pelea un combate de juguete y deja la pantalla lista, con la animación ya resuelta.
 *
 * ⚠️ Con velocidad **instantánea** a propósito: con la normal, la reproducción golpe a
 * golpe encadena un `setTimeout` por golpe desde un efecto, y adelantar el reloj a saco
 * no la termina. En instantánea `rondaCompleta` sale true en el primer render, sin
 * relojes, y el test mide lo único que le interesa: **a dónde lleva el final y cuándo**.
 * El suelo del auto-avance (`MS_MINIMO_AUTO`) sigue aplicándose, que es lo que hace que
 * esto no sea trampa.
 */
function combateGanado(extra = {}) {
  useSettingsStore.setState({ velocidadCombate: 'instantanea' });
  const resumen = useGameStore.getState().jugarCombate(enemigoDebil, 1, true);
  useGameStore.setState({ pantalla: 'combate', ...extra });
  return resumen;
}

/** Deja correr los relojes de la pantalla hasta que se estabiliza. */
function correr(ms) {
  act(() => { vi.advanceTimersByTime(ms); });
}

describe('el final llano de un combate se va solo', () => {
  it('vuelve al mapa sin que el jugador toque nada', () => {
    vi.useFakeTimers();
    try {
      combateGanado();
      render(<CombatScreen />);
      correr(20000);
      expect(useGameStore.getState().pantalla).toBe('mapa');
    } finally {
      vi.useRealTimers();
    }
  });

  it('⚠️ pero NO al instante: da tiempo a leer lo que has ganado', () => {
    // Con velocidad "instantánea" el factor de animación es **0**, así que sin suelo el
    // cartel de Victory y el panel de recompensas se saltarían enteros. Ese ajuste
    // acelera la ANIMACIÓN, no borra el desenlace.
    vi.useFakeTimers();
    try {
      combateGanado();
      render(<CombatScreen />);

      correr(100);
      expect(useGameStore.getState().pantalla).toBe('combate');
      correr(2000);
      expect(useGameStore.getState().pantalla).toBe('mapa');
    } finally {
      vi.useRealTimers();
    }
  });

  it('y el botón sigue ahí para quien quiera adelantarlo', () => {
    vi.useFakeTimers();
    try {
      combateGanado();
      render(<CombatScreen />);
      correr(200);
      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('los dos botones que eran peaje', () => {
  it('el mini-jefe lleva DIRECTO a su recompensa, sin "Claim reward" en medio', () => {
    vi.useFakeTimers();
    try {
      combateGanado({ recompensaMiniJefe: { item: itemsData.objetos[0].id } });
      render(<CombatScreen />);
      correr(200);

      // El botón intermedio ya no existe: no decidía nada, la decisión (coger o saltar)
      // está en la pantalla siguiente.
      expect(screen.queryByRole('button', { name: /claim reward/i })).toBeNull();
      correr(20000);
      expect(useGameStore.getState().pantalla).toBe('recompensaMiniJefe');
    } finally {
      vi.useRealTimers();
    }
  });

  it('y el desafío ganado lleva directo al pergamino, sin "Recruit them"', () => {
    vi.useFakeTimers();
    try {
      combateGanado({
        desafioRecluta: { personajeId: 'kakashi' },
        reclutarActual: { personajes: [{ personajeId: 'kakashi' }], nivelReclutamiento: 5, esDesafio: true },
      });
      render(<CombatScreen />);
      correr(200);

      expect(screen.queryByRole('button', { name: /recruit them/i })).toBeNull();
      correr(20000);
      expect(useGameStore.getState().pantalla).toBe('reclutar');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('donde SÍ manda el botón', () => {
  it('⚠️ un arco terminado no se va solo: es una transición, no un trámite', () => {
    vi.useFakeTimers();
    try {
      const resumen = combateGanado();
      useGameStore.setState({ ultimoResultadoCombate: { ...resumen, arcoCompletado: true } });
      render(<CombatScreen />);
      correr(20000);

      expect(useGameStore.getState().pantalla).toBe('combate');
      expect(screen.getByRole('button', { name: /continue to next arc/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('y una run terminada tampoco', () => {
    vi.useFakeTimers();
    try {
      combateGanado({ runTerminada: true, runGanada: true });
      render(<CombatScreen />);
      correr(20000);

      expect(useGameStore.getState().pantalla).toBe('combate');
      expect(screen.getByRole('button', { name: /see results/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('🐛 el caído se queda caído', () => {
  // Bug de **ida y vuelta**, y por eso este test mira las dos direcciones a la vez:
  //
  // 1. Primero la animación de desplomarse se aplicaba a todo el que estuviera caído, y
  //    se **repetía** cada vez que entraba un relevo (las tarjetas se remontan al
  //    cambiar de ronda).
  // 2. Al arreglarlo limitándola al que cae PELEANDO salió el contrario: `forwards`
  //    mantiene el estado final **solo mientras la clase siga puesta**, así que en cuanto
  //    el caído dejaba de ser el que pelea, **se ponía de pie otra vez** — con la
  //    opacidad baja como único rastro de que estaba KO.
  //
  // La salida es tener dos clases: la animación (`caida-ko`) y la pose (`caido-ko`).
  it('un enemigo ya derrotado de la cadena lleva la POSE, no la animación', () => {
    vi.useFakeTimers();
    try {
      // Cadena de dos: el primero ya cayó y ahora pelea el segundo.
      combateGanado({
        cadenaEnemigos: {
          enemigos: [
            { enemigoBase: conSprite('zaku', 'Zaku'), nivel: 1 },
            { enemigoBase: conSprite('dosu', 'Dosu'), nivel: 1 },
          ],
          indiceActual: 1,
        },
      });
      render(<CombatScreen />);
      correr(100);

      const caido = document.querySelector('img.caido-ko');
      expect(caido, 'el enemigo derrotado no lleva la pose de caído').toBeTruthy();
      // Y no la animación: repetirla en cada relevo fue el primer bug.
      expect(caido.className).not.toContain('caida-ko');
    } finally {
      vi.useRealTimers();
    }
  });

  it('⚠️ y las dos clases nunca van juntas en el mismo sprite', () => {
    vi.useFakeTimers();
    try {
      combateGanado({
        cadenaEnemigos: {
          enemigos: [
            { enemigoBase: conSprite('zaku', 'Zaku'), nivel: 1 },
            { enemigoBase: conSprite('dosu', 'Dosu'), nivel: 1 },
          ],
          indiceActual: 1,
        },
      });
      render(<CombatScreen />);
      correr(100);

      for (const img of document.querySelectorAll('img')) {
        const clases = img.className;
        expect(
          clases.includes('caida-ko') && clases.includes('caido-ko'),
          'un sprite lleva la animación y la pose a la vez',
        ).toBe(false);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('y quien sigue en pie no lleva ninguna de las dos', () => {
    vi.useFakeTimers();
    try {
      combateGanado();
      render(<CombatScreen />);
      correr(100);

      const enPie = [...document.querySelectorAll('img')]
        .filter((i) => !i.className.includes('caido-ko') && !i.className.includes('caida-ko'));
      expect(enPie.length).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('el espacio', () => {
  it('adelanta el final del combate sin esperar al auto-avance', () => {
    vi.useFakeTimers();
    try {
      combateGanado();
      render(<CombatScreen />);
      // Justo antes de que el auto-avance salte por su cuenta.
      correr(100);
      expect(useGameStore.getState().pantalla).toBe('combate');

      act(() => { fireEvent.keyDown(window, { key: ' ' }); });
      expect(useGameStore.getState().pantalla).toBe('mapa');
    } finally {
      vi.useRealTimers();
    }
  });

  it('⚠️ y donde manda el botón, el espacio hace lo MISMO que el botón', () => {
    // No es un atajo aparte: es la misma acción. Si un día el botón lleva a un sitio y
    // la tecla a otro, el jugador acaba en una pantalla que no eligió.
    vi.useFakeTimers();
    try {
      const resumen = combateGanado();
      useGameStore.setState({ ultimoResultadoCombate: { ...resumen, arcoCompletado: true } });
      render(<CombatScreen />);
      correr(1000);

      act(() => { fireEvent.keyDown(window, { key: ' ' }); });
      // `avanzarSiguienteArco` deja al jugador en el mapa del arco siguiente.
      expect(useGameStore.getState().pantalla).toBe('mapa');
      expect(useGameStore.getState().arcoActualId).not.toBe(arcoDePrueba.id);
    } finally {
      vi.useRealTimers();
    }
  });
});
