// @vitest-environment jsdom
//
// La transición entre arcos tiene dos cosas que no pueden fallar:
//
// 1. **Enseñar el estado de ANTES de la curación**, no el del store, que ya está curado.
//    Si se leyera `equipo`, los caídos saldrían de pie desde el primer fotograma y la
//    pantalla entera dejaría de contar lo que viene a contar.
// 2. **Salir avanza de arco, y solo salir.** La pantalla se salta con Espacio; si el
//    mismo Espacio también avanzara, el jugador se saltaría el arco nuevo sin verlo.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test-dom';
import TransicionArcoScreen from './TransicionArcoScreen';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore, AJUSTES_POR_DEFECTO } from '../../store/useSettingsStore';
import arcoDePrueba from '../../data/arcs/pais-de-las-olas.json';

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(AJUSTES_POR_DEFECTO);
  useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
  const [a, b] = useGameStore.getState().equipo;
  useGameStore.setState({
    pantalla: 'transicionArco',
    ultimoResultadoCombate: {
      arcoCompletado: true,
      curacionDeArco: [
        { id: a.id, nivel: a.nivel, hpAntes: 10, hpMaximo: 40, cayo: false },
        { id: b.id, nivel: b.nivel, hpAntes: 0, hpMaximo: 40, cayo: true },
      ],
    },
  });
});

const espacio = () => act(() => { fireEvent.keyDown(window, { key: ' ' }); });

describe('TransicionArcoScreen', () => {
  it('empieza por el cierre del arco, con el nombre del arco que se acaba', () => {
    render(<TransicionArcoScreen />);
    expect(screen.getByRole('heading', { name: arcoDePrueba.nombre })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Begin' })).toBeNull();
  });

  it('el primer Espacio SALTA al final sin avanzar de arco; el segundo empieza el siguiente', () => {
    render(<TransicionArcoScreen />);

    espacio();
    expect(useGameStore.getState().arcoActualId).toBe(arcoDePrueba.id);
    expect(screen.getByRole('button', { name: 'Begin' })).toBeInTheDocument();

    espacio();
    expect(useGameStore.getState().pantalla).toBe('mapa');
    expect(useGameStore.getState().arcoActualId).not.toBe(arcoDePrueba.id);
  });

  it('enseña al caído tumbado y la barra desde su vida de ANTES, no la del store', () => {
    render(<TransicionArcoScreen />);
    espacio(); // al final, con la curación ya en pantalla
    const imagenes = document.querySelectorAll('img');
    // El jefe (tumbado) y el caído que se levanta; el que acabó en pie, respirando.
    expect([...imagenes].some((i) => i.className.includes('levantarse'))).toBe(true);
    expect([...imagenes].some((i) => i.className.includes('respirar'))).toBe(true);
    // La barra arranca en el 25 % (10/40) y no en el 100 % del equipo curado.
    const barras = [...document.querySelectorAll('.llenar-hp')];
    expect(barras.map((b) => b.style.getPropertyValue('--desde'))).toEqual(['25%', '0%']);
  });

  it('con la velocidad instantánea sale directamente en el final', () => {
    useSettingsStore.setState({ velocidadCombate: 'instantanea' });
    render(<TransicionArcoScreen />);
    expect(screen.getByRole('button', { name: 'Begin' })).toBeInTheDocument();
  });
});

describe('curación parcial por ascensión', () => {
  it('sin ascensión no dice nada: la curación es completa', () => {
    render(<TransicionArcoScreen />);
    espacio();
    expect(screen.queryByText(/only up to/i)).toBeNull();
  });

  it('en A5 explica por qué la barra se queda a medias, y la barra para donde cura', () => {
    const [a] = useGameStore.getState().equipo;
    useGameStore.setState({
      ascension: 5,
      ultimoResultadoCombate: {
        arcoCompletado: true,
        curacionDeArco: [{ id: a.id, nivel: a.nivel, hpAntes: 10, hpDespues: 20, hpMaximo: 40, cayo: false }],
      },
    });
    render(<TransicionArcoScreen />);
    espacio();
    expect(screen.getByText(/No Respite \(A5\): only up to 50% of max HP/)).toBeInTheDocument();
    const [barra] = document.querySelectorAll('.llenar-hp');
    expect(barra.style.getPropertyValue('--hasta')).toBe('50%');
  });
});
