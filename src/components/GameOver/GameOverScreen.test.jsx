// @vitest-environment jsdom
//
// El final de la run tiene DOS salidas, y durante mucho tiempo solo tuvo una.
//
// Sin la del Home, quien acababa de desbloquear un logro **no tenía forma de ir a
// verlo**: Missions, el Bingo Book y los Ajustes cuelgan del mapa y del Home, y "New
// Run" lleva directo a elegir personaje. Era justo el momento en que más apetece
// mirarlos. Es una salida fácil de perder en cualquier retoque de la pantalla, porque
// quitarla no rompe nada: el juego sigue siendo jugable, solo que sin puerta.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent } from '../../test-dom';
import GameOverScreen from './GameOverScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';
import arcoDePrueba from '../../data/arcs/pais-de-las-olas.json';
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
  useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
  useGameStore.setState({ runTerminada: true, runGanada: false, pantalla: 'gameover' });
});

describe('victoria y derrota no se leen igual', () => {
  it('perder dice "End of the Road"', () => {
    render(<GameOverScreen />);
    expect(screen.getByText('End of the Road')).toBeInTheDocument();
    expect(screen.queryByText('Victory')).toBeNull();
  });

  it('ganar dice "Victory"', () => {
    useGameStore.setState({ runGanada: true });
    render(<GameOverScreen />);
    expect(screen.getByText('Victory')).toBeInTheDocument();
    expect(screen.queryByText('End of the Road')).toBeNull();
  });

  it('⚠️ y hay UN solo título, no dos', () => {
    // Había dos —"End of the road" encima de "Game Over"—, que son la misma frase dicha
    // dos veces: el mismo ruido que ya se quitó del evento y de la tienda. Es fácil que
    // vuelva, porque `CabeceraPantalla` sigue aceptando un antetítulo.
    for (const ganada of [true, false]) {
      useGameStore.setState({ runGanada: ganada });
      const { container, unmount } = render(<GameOverScreen />);
      const rotulos = container.querySelectorAll('header p, header h1');
      expect(rotulos, `con runGanada=${ganada}`).toHaveLength(1);
      unmount();
    }
  });
});

describe('las dos salidas', () => {
  it('están las dos en pantalla', () => {
    render(<GameOverScreen />);
    expect(screen.getByRole('button', { name: 'New Run' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });

  it('⚠️ y las dos tienen la MISMA forma: son salidas del mismo rango', () => {
    // Antes eran un `BotonPrincipal` y un `BotonSecundario`, que no son variantes de lo
    // mismo: cambian de forma (`rounded-full` contra `rounded-sm`), de tamaño de letra
    // (11 contra 9) y de relleno. Puestos uno al lado del otro parecían dos especies
    // distintas. Lo único que puede separarlos es el relleno — cuál se espera que pulses.
    render(<GameOverScreen />);
    const nueva = screen.getByRole('button', { name: 'New Run' });
    const home = screen.getByRole('button', { name: 'Home' });

    for (const clase of ['rounded-full', 'text-[11px]', 'px-6', 'py-2']) {
      expect(nueva.className, `New Run pierde ${clase}`).toContain(clase);
      expect(home.className, `Home pierde ${clase}`).toContain(clase);
    }
    // Y siguen sin ser el mismo botón: uno va relleno y el otro no.
    expect(nueva.className).not.toBe(home.className);
  });

  it('"New Run" lleva a elegir personaje, no al Home', async () => {
    render(<GameOverScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'New Run' }));
    // Quien acaba de perder quiere reintentar, no reelegir campaña.
    expect(useGameStore.getState().pantalla).toBe('seleccionPersonaje');
  });

  it('"Home" lleva al Home y sin preguntar', async () => {
    render(<GameOverScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Home' }));

    // ⚠️ Sin confirmación a propósito: el Home del menú del mapa sí pregunta, porque
    // allí salir cuesta la run. Aquí ya no hay run que perder, y una confirmación sin
    // nada que confirmar enseña a decir que sí sin leer.
    expect(useGameStore.getState().pantalla).toBe('home');
    expect(screen.queryByRole('button', { name: /confirm|yes|leave/i })).toBeNull();
  });
});

describe('la foto final de la run', () => {
  it('lista el equipo entero, caídos incluidos', () => {
    useGameStore.setState({
      equipo: useGameStore.getState().equipo.map((p, i) => (i === 0 ? { ...p, derrotado: true } : p)),
    });
    render(<GameOverScreen />);

    expect(screen.getAllByText(/Naruto|Sasuke|Sakura/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Defeated')).toHaveLength(1);
    expect(screen.getAllByText('Standing')).toHaveLength(2);
  });
});

// --- Rangos y ficha compartible (puntos 19, 20 y 21) ------------------------
//
// ⚠️ Estos tests montan **la pantalla entera** y no las piezas por separado a
// propósito. La lección de `PersonajeHoverCard` sigue vigente: probar las dos
// piezas no prueba la unión, y con `InsigniaRango`, `fichaDeLaRun` y
// `resumenDeLaRun` viniendo de tres sitios distintos, la unión es justo donde
// vive el fallo.

describe('la nota de la run', () => {
  it('una derrota temprana saca una D y dice cómo sacar una C', () => {
    render(<GameOverScreen />);
    expect(screen.getByText('Mission rank')).toBeInTheDocument();
    expect(screen.getByText(/Clear a full arc to earn a C/i)).toBeInTheDocument();
  });

  it('⚠️ ganar sin bajas saca la S, y ganar con ellas no', () => {
    useGameStore.setState({ runTerminada: true, runGanada: true, huboDerrotaEnLaRun: false });
    const { unmount } = render(<GameOverScreen />);
    expect(screen.getByText(/nothing above this/i)).toBeInTheDocument();
    unmount();

    useGameStore.setState({ huboDerrotaEnLaRun: true });
    render(<GameOverScreen />);
    expect(screen.getByText(/without losing a single ninja to earn an S/i)).toBeInTheDocument();
  });
});

describe('la ficha compartible', () => {
  it('ofrece copiarla', () => {
    render(<GameOverScreen />);
    expect(screen.getByRole('button', { name: /copy mission report/i })).toBeInTheDocument();
  });

  it('⚠️ y si el portapapeles no existe, enseña el texto en vez de callarse', async () => {
    // `navigator.clipboard` no existe fuera de contexto seguro — ni en jsdom. Un
    // botón que falla en silencio es peor que no tenerlo: el jugador cree que ha
    // copiado y pega lo que tuviera antes.
    render(<GameOverScreen />);
    await userEvent.click(screen.getByRole('button', { name: /copy mission report/i }));

    const cuadro = document.querySelector('textarea');
    expect(cuadro, 'no hay salida de emergencia para copiar a mano').toBeTruthy();
    expect(cuadro.value).toContain('Mission rank');
    expect(cuadro.value).toContain('https://');
  });
});

describe('lo que te falta para el próximo logro', () => {
  it('sale al morir, que es donde se decide si vuelves a jugar', () => {
    useAchievementsStore.setState({
      contadores: { ...CONTADORES_VACIO, combatesGanados: 9, reclutas: 4 },
    });
    render(<GameOverScreen />);
    expect(screen.getByText('So close')).toBeInTheDocument();
    // "gana 10 combates" con 9 ganados: falta 1.
    expect(screen.getAllByText(/1 to go/).length).toBeGreaterThan(0);
  });

  it('⚠️ y el hover dice qué hay que hacer, que el nombre no lo dice', () => {
    // "Full Purse — 175 to go" no dice 175 de QUÉ. La condición ya estaba escrita
    // en `descripcion` desde el punto 5a y no se enseñaba en ningún sitio salvo la
    // pantalla de Missions.
    //
    // El tooltip es CSS puro (`hover-envoltorio:hover`), así que jsdom no lo
    // "abre" — pero el contenido está en el DOM y es lo que hay que comprobar: que
    // el texto viaja hasta ahí.
    useAchievementsStore.setState({
      contadores: { ...CONTADORES_VACIO, combatesGanados: 9 },
      vistos: VISTOS_VACIO,
    });
    render(<GameOverScreen />);
    const logro = achievementsData.logros.find((l) => l.id === 'combates_10');
    expect(screen.getByText(logro.descripcion)).toBeInTheDocument();
  });

  it('⚠️ pero solo lo EMPEZADO: sin nada en marcha, el panel se calla', () => {
    // Sin este filtro, una primera muerte enseñaba "Win 150 battles — 150 to go"
    // bajo un cartel que dice "So close". No es que no motive: es que el cartel
    // miente.
    //
    // ⚠️ Y hay que vaciar también los **vistos**, no solo los contadores: al
    // empezar una run el juego registra a tu propio equipo en la enciclopedia, así
    // que el logro de "conoce a 8 ninjas" arranca en 3 de verdad. El panel tenía
    // razón; el que se equivocaba era este test.
    useAchievementsStore.setState({ contadores: CONTADORES_VACIO, vistos: VISTOS_VACIO });
    render(<GameOverScreen />);
    expect(screen.queryByText('So close')).toBeNull();
  });
});
