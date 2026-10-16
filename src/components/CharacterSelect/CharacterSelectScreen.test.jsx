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

describe('el roster', () => {
  it('siempre ofrece a los tres iniciales, aunque no haya ningún logro', () => {
    render(<CharacterSelectScreen onConfirmar={() => {}} />);
    for (const nombre of ['Naruto', 'Sasuke', 'Sakura']) {
      expect(screen.getAllByText(new RegExp(nombre)).length).toBeGreaterThan(0);
    }
  });

  it('siempre ofrece tres, sorteados entre todo lo desbloqueado (jefes del gacha incluidos)', () => {
    useAchievementsStore.setState({ invocacion: { ...ESTADO_INVOCACION_VACIO, personajes: ['yamato', 'gaara', 'kakashi'] } });
    const vistos = new Set();
    for (let i = 0; i < 40; i++) {
      useGameStore.getState()._sortearOfertaInicial();
      const { unmount } = render(<CharacterSelectScreen onConfirmar={() => {}} />);
      const tarjetas = screen.getAllByRole('button').filter((b) => !/back/i.test(b.textContent));
      expect(tarjetas).toHaveLength(3);
      useGameStore.getState().ofertaInicialIds.forEach((id) => vistos.add(id));
      unmount();
    }
    // Con seis candidatos y cuarenta sorteos, tienen que haber salido más de tres.
    expect(vistos.size).toBeGreaterThan(3);
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

describe('qué desbloquea a un inicial', () => {
  it('el gacha sí; haberlo tenido en el equipo, ya no', () => {
    // Rock Lee estuvo en el equipo (Bingo Book) pero no ha salido en el gacha: no es
    // inicial. Neji sí ha salido: lo es.
    useAchievementsStore.setState({
      vistos: { ...useAchievementsStore.getState().vistos, personajes: ['rock_lee'] },
      invocacion: { ...ESTADO_INVOCACION_VACIO, personajes: ['neji'] },
    });
    const salieron = new Set();
    for (let i = 0; i < 40; i++) {
      useGameStore.getState()._sortearOfertaInicial();
      useGameStore.getState().ofertaInicialIds.forEach((id) => salieron.add(id));
    }
    expect(salieron.has('neji')).toBe(true);
    expect(salieron.has('rock_lee')).toBe(false);
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
