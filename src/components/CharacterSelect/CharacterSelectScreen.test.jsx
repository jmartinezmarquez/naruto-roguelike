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
// **El roster.** Es "inicial" + lo que hayan desbloqueado los logros, y esa suma vive
// entre dos stores. Si el enlace se corta, la pantalla no falla: enseña menos gente.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent } from '../../test-dom';
import CharacterSelectScreen from './CharacterSelectScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';
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
  useGameStore.setState({ pantalla: 'seleccionPersonaje', mapa: null });
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

describe('el roster', () => {
  it('siempre ofrece a los tres iniciales, aunque no haya ningún logro', () => {
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    for (const nombre of ['Naruto', 'Sasuke', 'Sakura']) {
      expect(screen.getAllByText(new RegExp(nombre)).length).toBeGreaterThan(0);
    }
  });

  it('crece con los personajes que desbloquea un logro', () => {
    const logro = achievementsData.logros.find((l) => l.recompensa.tipo === 'desbloquearPersonajeInicial');
    expect(logro, 'no hay ningún logro que desbloquee un personaje inicial').toBeTruthy();

    const { unmount } = render(<CharacterSelectScreen onConfirmar={() => {}} />);
    const sinLogro = screen.getAllByRole('button').length;
    unmount();

    useAchievementsStore.setState({ logrosDesbloqueados: [logro.id] });
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    expect(screen.getAllByRole('button').length).toBe(sinLogro + 1);
  });
});

describe('elegir', () => {
  it('confirma con UN solo personaje: el resto del equipo se recluta jugando', async () => {
    let elegidos = null;
    render(<CharacterSelectScreen onConfirmar={(ids) => { elegidos = ids; }} />);

    // La primera tarjeta que no sea el "← Back".
    const tarjetas = screen.getAllByRole('button').filter((b) => !/back/i.test(b.textContent));
    await userEvent.click(tarjetas[0]);

    expect(elegidos).toHaveLength(1);
  });
});
