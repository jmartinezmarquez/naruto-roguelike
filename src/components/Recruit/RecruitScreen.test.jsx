// @vitest-environment jsdom
//
// El nodo de reclutar es la pantalla con más estados del juego: la elección normal, el
// pergamino dorado antes de pelear, el mismo ya ganado, y el panel de reemplazo encima
// de cualquiera de ellos cuando el equipo está lleno. Cuatro caminos, y el jugador solo
// ve uno por partida.
//
// ⚠️ Lo que se protege aquí no son los números —eso es del store, y ya tiene sus
// tests— sino que **el dorado NO se pueda reclutar sin pelear**. Es la regla entera del
// nodo: lo que separa al legendario del resto no es lo bueno que sea, es que hay que
// ganarle. Un botón de más y el desafío se convierte en un regalo.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent } from '../../test-dom';
import RecruitScreen from './RecruitScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';
import { nombrePersonaje, nombreCorto } from '../common/nombres';
import arcoDePrueba from '../../data/arcs/pais-de-las-olas.json';
import configGlobal from '../../data/config.json';
import itemsData from '../../data/items.json';

const EQUIPABLE = itemsData.objetos.find((o) => o.tipo === 'equipable');

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({
    logrosDesbloqueados: [], vistos: VISTOS_VACIO, contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA, notificacionesPendientes: [],
  });
  useGameStore.getState().iniciarRun(['naruto'], arcoDePrueba);
  useGameStore.setState({ pantalla: 'reclutar' });
});

/** Coloca en el store una oferta de reclutar como la que arma el nodo. */
function ofrecer({ ids, esDesafio = false, desafioGanado = false }) {
  useGameStore.setState({
    reclutarActual: {
      personajes: ids.map((personajeId) => ({ personajeId })),
      nivelReclutamiento: 5,
      rareza: esDesafio ? 'legendario' : 'comun',
      esDesafio,
      desafioGanado,
      nivelDesafio: esDesafio ? 8 : null,
    },
  });
}

describe('el pergamino verde: una elección', () => {
  it('ofrece las tres cartas y reclutar añade al elegido', async () => {
    ofrecer({ ids: ['sasuke', 'sakura', 'kiba'] });
    render(<RecruitScreen />);

    await userEvent.click(screen.getByText(new RegExp(nombrePersonaje('sakura'))));

    expect(useGameStore.getState().equipo.map((p) => p.id)).toContain('sakura');
    expect(useGameStore.getState().pantalla).toBe('mapa');
  });

  it('se puede pasar de largo sin reclutar a nadie', async () => {
    ofrecer({ ids: ['sasuke', 'sakura', 'kiba'] });
    render(<RecruitScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'SKIP' }));
    expect(useGameStore.getState().equipo.map((p) => p.id)).toEqual(['naruto']);
  });

  it('sin candidatos lo dice en vez de dejar el hueco', () => {
    ofrecer({ ids: [] });
    render(<RecruitScreen />);
    expect(screen.getByText(/No ninjas available/i)).toBeInTheDocument();
  });
});

describe('el pergamino dorado: un combate, no una elección', () => {
  it('⚠️ antes de pelear NO hay forma de reclutar, solo de pelear o irse', () => {
    ofrecer({ ids: ['kakashi'], esDesafio: true });
    render(<RecruitScreen />);

    expect(screen.getByRole('button', { name: 'FIGHT' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'RECRUIT' })).toBeNull();
    // Y la salida se llama distinto: no estás saltándote un regalo, te estás
    // largando de una pelea.
    expect(screen.getByRole('button', { name: 'WALK AWAY' })).toBeInTheDocument();
  });

  it('avisa de que la run puede acabarse ahí, antes de pulsar', () => {
    ofrecer({ ids: ['kakashi'], esDesafio: true });
    render(<RecruitScreen />);
    expect(screen.getByText(/If everyone falls, the run ends/i)).toBeInTheDocument();
  });

  it('irse no recluta a nadie', async () => {
    ofrecer({ ids: ['kakashi'], esDesafio: true });
    render(<RecruitScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'WALK AWAY' }));
    expect(useGameStore.getState().equipo.map((p) => p.id)).toEqual(['naruto']);
  });

  it('y solo DESPUÉS de ganarlo aparece el botón de reclutar', async () => {
    ofrecer({ ids: ['kakashi'], esDesafio: true, desafioGanado: true });
    render(<RecruitScreen />);

    expect(screen.queryByRole('button', { name: 'FIGHT' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'RECRUIT' }));
    expect(useGameStore.getState().equipo.map((p) => p.id)).toContain('kakashi');
  });
});

describe('con el equipo lleno', () => {
  beforeEach(() => {
    useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
    useGameStore.setState({ pantalla: 'reclutar' });
    expect(useGameStore.getState().equipo).toHaveLength(configGlobal.equipo.tamanoMaximo);
  });

  it('pulsar una carta pregunta a quién reemplaza en vez de no hacer nada', async () => {
    // El store devuelve `false` si el equipo está lleno y no se le dice a quién
    // sustituir. Si la pantalla no preguntara, el clic se perdería en silencio.
    ofrecer({ ids: ['kiba'] });
    render(<RecruitScreen />);
    await userEvent.click(screen.getByText(new RegExp(nombrePersonaje('kiba'))));

    expect(screen.getByText(/replace\?/i)).toBeInTheDocument();
    expect(useGameStore.getState().equipo.map((p) => p.id)).not.toContain('kiba');
  });

  it('confirmar sustituye, y el objeto del sustituido vuelve a la mochila', async () => {
    useGameStore.setState({ inventario: [EQUIPABLE.id] });
    useGameStore.getState().equiparObjeto(EQUIPABLE.id, 'sakura');
    expect(useGameStore.getState().inventario).not.toContain(EQUIPABLE.id);

    ofrecer({ ids: ['kiba'] });
    render(<RecruitScreen />);
    await userEvent.click(screen.getByText(new RegExp(nombrePersonaje('kiba'))));
    await userEvent.click(screen.getByRole('button', { name: new RegExp(nombreCorto('sakura')) }));

    const { equipo, inventario } = useGameStore.getState();
    expect(equipo.map((p) => p.id)).toContain('kiba');
    expect(equipo.map((p) => p.id)).not.toContain('sakura');
    // ⚠️ Si no volviera, el objeto se iría de la run con el personaje que lo llevaba.
    expect(inventario).toContain(EQUIPABLE.id);
  });

  it('cancelar el reemplazo no toca el equipo', async () => {
    ofrecer({ ids: ['kiba'] });
    render(<RecruitScreen />);
    await userEvent.click(screen.getByText(new RegExp(nombrePersonaje('kiba'))));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useGameStore.getState().equipo.map((p) => p.id)).toEqual(['naruto', 'sasuke', 'sakura']);
    expect(screen.queryByText(/replace\?/i)).toBeNull();
  });
});

describe('sin nodo activo', () => {
  it('lo dice en vez de reventar', () => {
    useGameStore.setState({ reclutarActual: null });
    render(<RecruitScreen />);
    expect(screen.getByText(/No active recruit node/i)).toBeInTheDocument();
  });
});
