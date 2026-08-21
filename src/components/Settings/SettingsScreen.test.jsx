// @vitest-environment jsdom
//
// Los ajustes tienen dos cosas que probar y son de naturaleza distinta.
//
// La primera es que **cada control mueva el ajuste que dice** — un copia y pega entre
// dos `SelectorOpciones` deja el botón de la velocidad cambiando el tema, y no falla
// nada: el juego se pone en claro y tú buscas el bug en el combate.
//
// La segunda, y la que importa: ⚠️ **reiniciar la meta-progresión es la única acción
// del juego que borra algo que no se puede recuperar jugando**, y tiene que borrarlo
// TODO. Dejarse los contadores es peor que no reiniciar: los logros de "gana 50
// combates" se vuelven a desbloquear en el primer combate y el jugador ve su reinicio
// deshacerse solo.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent, within } from '../../test-dom';
import SettingsScreen from './SettingsScreen';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore, AJUSTES_POR_DEFECTO } from '../../store/useSettingsStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(AJUSTES_POR_DEFECTO);
  useAchievementsStore.setState({
    logrosDesbloqueados: [], vistos: VISTOS_VACIO, contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA, notificacionesPendientes: [],
  });
  useGameStore.setState({ pantalla: 'ajustes' });
});

/** Los botones de un grupo de opciones, por su etiqueta accesible. */
function grupo(etiqueta) {
  return within(screen.getByRole('group', { name: etiqueta }));
}

describe('cada control mueve SU ajuste', () => {
  it('el tema', async () => {
    render(<SettingsScreen />);
    await userEvent.click(grupo('Theme').getByRole('button', { name: 'LIGHT' }));
    expect(useSettingsStore.getState().tema).toBe('claro');
  });

  it('la velocidad de animación, sin tocar el tema', async () => {
    render(<SettingsScreen />);
    const temaAntes = useSettingsStore.getState().tema;

    await userEvent.click(grupo('Animation speed').getByRole('button', { name: '×2' }));

    expect(useSettingsStore.getState().velocidadCombate).toBe('rapida');
    expect(useSettingsStore.getState().tema).toBe(temaAntes);
  });

  it('el volumen de la música, sin tocar la velocidad', async () => {
    render(<SettingsScreen />);
    const velocidadAntes = useSettingsStore.getState().velocidadCombate;

    const botones = grupo('Music volume').getAllByRole('button');
    await userEvent.click(botones[0]); // el primer paso, sea cual sea su nombre

    expect(useSettingsStore.getState().velocidadCombate).toBe(velocidadAntes);
    expect(useSettingsStore.getState().volumenMusica).not.toBe(AJUSTES_POR_DEFECTO.volumenMusica);
  });

  it('y el elegido se ve elegido', async () => {
    render(<SettingsScreen />);
    await userEvent.click(grupo('Theme').getByRole('button', { name: 'LIGHT' }));
    expect(grupo('Theme').getByRole('button', { name: 'LIGHT' })).toHaveAttribute('aria-pressed', 'true');
    expect(grupo('Theme').getByRole('button', { name: 'DARK' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('lo que se guarda sobrevive a cerrar el juego', () => {
  it('el ajuste queda en localStorage, no solo en memoria', async () => {
    render(<SettingsScreen />);
    await userEvent.click(grupo('Animation speed').getByRole('button', { name: 'INSTANT' }));

    // Se olvida todo lo que hay en memoria y se vuelve a cargar, como al abrir la
    // pestaña otro día.
    useSettingsStore.setState(AJUSTES_POR_DEFECTO);
    useSettingsStore.getState().cargarAjustes();
    expect(useSettingsStore.getState().velocidadCombate).toBe('instantanea');
  });
});

describe('reiniciar la meta-progresión', () => {
  beforeEach(() => {
    // Progreso de varias partidas: un logro, la enciclopedia, los contadores y el récord.
    useAchievementsStore.setState({
      logrosDesbloqueados: ['primer_jefe'],
      vistos: { ...VISTOS_VACIO, personajes: ['naruto'] },
      contadores: { ...CONTADORES_VACIO, combatesGanados: 40 },
      marca: { arcoId: 'examen_chunin', orden: 1, piso: 6 },
    });
  });

  it('pregunta antes, y no en una ventana del navegador', async () => {
    render(<SettingsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'RESET' }));

    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    // Todavía no ha borrado nada.
    expect(useAchievementsStore.getState().logrosDesbloqueados).toEqual(['primer_jefe']);
  });

  it('cancelar no borra nada', async () => {
    render(<SettingsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'RESET' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useAchievementsStore.getState().logrosDesbloqueados).toEqual(['primer_jefe']);
    expect(useAchievementsStore.getState().contadores.combatesGanados).toBe(40);
  });

  it('⚠️ confirmar borra las CUATRO cosas, no solo los logros', async () => {
    render(<SettingsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'RESET' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    const { logrosDesbloqueados, vistos, contadores, marca } = useAchievementsStore.getState();
    expect(logrosDesbloqueados).toEqual([]);
    expect(vistos).toEqual(VISTOS_VACIO);
    // Con los contadores intactos, los logros de contador se redesbloquean en el acto.
    expect(contadores).toEqual(CONTADORES_VACIO);
    expect(marca).toEqual(MARCA_VACIA);
  });

  it('y no se queda nada en localStorage esperando a la próxima carga', async () => {
    render(<SettingsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'RESET' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    useAchievementsStore.getState().cargarLogros();
    expect(useAchievementsStore.getState().logrosDesbloqueados).toEqual([]);
    expect(useAchievementsStore.getState().contadores).toEqual(CONTADORES_VACIO);
  });

  it('no toca la run en curso, que es lo que promete el aviso', async () => {
    useGameStore.setState({ oro: 250 });
    render(<SettingsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'RESET' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(useGameStore.getState().oro).toBe(250);
  });
});

describe('el interruptor de saltar la transformación', () => {
  it('viene APAGADO de fábrica: es el único sitio donde el juego te dice que existe', () => {
    expect(AJUSTES_POR_DEFECTO.saltarTransformacion).toBe(false);
  });
});
