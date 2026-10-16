// @vitest-environment jsdom
//
// Dos cosas que se rompen solas al tocar la meta-progresión o la navegación.
//
// **La marcha atrás.** Esta pantalla nació siendo la primera del juego, así que no
// necesitaba salida. Al meterle el Home delante se convirtió en un PASO, y se quedó
// sin ella sin que nada cambiara aquí dentro: elegías campaña, cambiabas de idea y la
// única forma de volver era elegir un ninja igualmente y abandonar la run desde el
// mapa. ⚠️ La lección que deja el test: **meter una pantalla delante convierte a la
// siguiente en un paso, y todo paso necesita marcha atrás.**
//
// **El roster.** Una rejilla con todos los ninjas: los "inicial" y lo sacado en el gacha
// se eligen, el resto sale bloqueado. Esa suma vive entre dos stores: si el enlace se
// corta, la pantalla no falla, solo enseña candados donde no los hay.

import { ESTADO_INVOCACION_VACIO } from '../../engine/invocacion';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent } from '../../test-dom';
import CharacterSelectScreen from './CharacterSelectScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({
    logrosDesbloqueados: [],
    vistos: VISTOS_VACIO,
    contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA,
    notificacionesPendientes: [],
    invocacion: ESTADO_INVOCACION_VACIO,
  });
  useGameStore.setState({ pantalla: 'seleccionPersonaje', mapa: null, ofertaInicialIds: [] });
});

describe('la marcha atrás', () => {
  it('hay un botón para volver', () => {
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('lleva al Home', async () => {
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(useGameStore.getState().pantalla).toBe('home');
  });
});

const elegibles = () => screen.getAllByRole('button')
  .filter((b) => b.getAttribute('aria-label') && b.getAttribute('aria-label') !== 'Locked ninja');

describe('el roster', () => {
  it('enseña a todos los ninjas: los tres iniciales elegibles y el resto bloqueados', () => {
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    for (const nombre of ['Naruto Uzumaki', 'Sasuke Uchiha', 'Sakura Haruno']) {
      expect(screen.getByRole('button', { name: nombre })).toBeInTheDocument();
    }
    expect(elegibles()).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Locked ninja' }).length).toBeGreaterThan(10);
  });

  it('el gacha desbloquea (jefes incluidos); haberlo tenido en el equipo, ya no', () => {
    useAchievementsStore.setState({
      vistos: { ...useAchievementsStore.getState().vistos, personajes: ['rock_lee'] },
      invocacion: { ...ESTADO_INVOCACION_VACIO, personajes: ['neji', 'gaara'] },
    });
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    expect(screen.getByRole('button', { name: 'Neji Hyuga' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gaara' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rock Lee' })).toBeNull();
    expect(elegibles()).toHaveLength(5);
  });
});

describe('elegir', () => {
  it('un clic en un retrato desbloqueado empieza con UN solo personaje', async () => {
    let elegidos = null;
    render(<CharacterSelectScreen onConfirmar={(ids) => { elegidos = ids; }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sasuke Uchiha' }));
    expect(elegidos).toEqual(['sasuke']);
  });

  it('un retrato bloqueado no hace nada', async () => {
    let elegidos = null;
    render(<CharacterSelectScreen onConfirmar={(ids) => { elegidos = ids; }} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Locked ninja' })[0]);
    expect(elegidos).toBeNull();
  });

  it('Random elige a uno de los desbloqueados', async () => {
    let elegidos = null;
    render(<CharacterSelectScreen onConfirmar={(ids) => { elegidos = ids; }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Random' }));
    expect(['naruto', 'sasuke', 'sakura']).toContain(elegidos[0]);
  });
});

describe('nivel de ninja en la selección', () => {
  it('enseña nivel y título a quien ha subido, y nada a quien sigue en el 1', () => {
    useAchievementsStore.setState({ maestria: { naruto: 40 } }); // nivel 2
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    expect(screen.getByText('Ninja Lv.2')).toBeInTheDocument();
    expect(screen.getByText(/Genin of the Leaf/)).toBeInTheDocument();
    expect(screen.getAllByText(/Ninja Lv\./)).toHaveLength(1);
  });
});
