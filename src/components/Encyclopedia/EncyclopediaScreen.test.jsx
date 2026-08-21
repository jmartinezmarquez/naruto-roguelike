// @vitest-environment jsdom
//
// La regla de la enciclopedia: **solo enseña lo ya visto**.
//
// Es una regla de spoilers, o sea del tipo que se rompe sin que nada falle. Si un día
// `vistos` deja de consultarse —al refactorizar el filtro, al añadir una sección— el
// Bingo Book seguiría pintándose perfectamente, solo que con todo el contenido del
// juego destapado desde la primera partida. Nadie lo notaría revisando la pantalla:
// se ve bien, y "se ve bien" es exactamente el fallo.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../../test-dom';
import EncyclopediaScreen from './EncyclopediaScreen';
import { useAchievementsStore, VISTOS_VACIO } from '../../store/useAchievementsStore';

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({ vistos: VISTOS_VACIO });
});

describe('lo que no se ha visto', () => {
  it('sale como "???" y sin su nombre', () => {
    render(<EncyclopediaScreen />);
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
    expect(screen.queryByText('Naruto')).toBeNull();
  });

  it('y no se destapa por abrir la pantalla', () => {
    render(<EncyclopediaScreen />);
    // `registrarVistos` se llama de red de seguridad al abrir (para lo que llevas
    // puesto), pero abrir la enciclopedia no puede descubrir nada por sí solo.
    expect(useAchievementsStore.getState().vistos.personajes).toEqual([]);
  });
});

describe('lo que sí se ha visto', () => {
  beforeEach(() => {
    useAchievementsStore.setState({ vistos: { ...VISTOS_VACIO, personajes: ['naruto'] } });
  });

  it('sale con su nombre', () => {
    render(<EncyclopediaScreen />);
    expect(screen.getAllByText(/Naruto/).length).toBeGreaterThan(0);
  });

  it('y descubrir uno deja el resto tapado', () => {
    const { unmount } = render(<EncyclopediaScreen />);
    const tapadosConUno = screen.getAllByText('???').length;
    unmount();

    useAchievementsStore.setState({ vistos: VISTOS_VACIO });
    render(<EncyclopediaScreen />);
    const tapadosConNinguno = screen.getAllByText('???').length;

    expect(tapadosConUno).toBe(tapadosConNinguno - 1);
  });
});
