// @vitest-environment jsdom
//
// Del Home solo se prueba el selector de ascensión, que es lo que tiene reglas: qué
// niveles están abiertos, cuál sale elegido por defecto y que la campaña arranque
// con el que se ha elegido. El resto de la pantalla es un escaparate.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test-dom';
import HomeScreen from './HomeScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import campaignsData from '../../data/campaigns.json';

const campana = campaignsData.campanas[0];

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({ ascensionesGanadas: {}, logrosDesbloqueados: [] });
  useGameStore.setState({ ascensionElegida: 0, pantalla: 'home' });
});

describe('HomeScreen — ascensión', () => {
  it('sin ninguna run ganada, dice cómo se desbloquea en vez de pintar candados', () => {
    render(<HomeScreen />);
    expect(screen.getByText(/Win a run to unlock/i)).toBeInTheDocument();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('abre hasta una por encima de la más alta ganada, y elige esa por defecto', () => {
    useAchievementsStore.setState({ ascensionesGanadas: { [campana.id]: 1 } });
    render(<HomeScreen />);
    expect(screen.getByRole('radio', { name: 'A2' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'A2' })).not.toBeDisabled();
    expect(screen.getByRole('radio', { name: 'A3' })).toBeDisabled();
  });

  it('la campaña arranca con la ascensión elegida', () => {
    useAchievementsStore.setState({ ascensionesGanadas: { [campana.id]: 2 } });
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('radio', { name: 'A1' }));
    fireEvent.click(screen.getByText(campana.nombre));
    expect(useGameStore.getState().ascensionElegida).toBe(1);
    expect(useGameStore.getState().pantalla).toBe('seleccionPersonaje');
  });
});
