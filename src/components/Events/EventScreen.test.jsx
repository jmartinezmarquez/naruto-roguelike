// @vitest-environment jsdom
//
// El evento es el único sitio del juego donde **el store devuelve datos y la pantalla
// escribe el texto** (ver documentacion/35-diseño-de-eventos.md). Eso deja la prosa
// entera fuera de los tests de store, en dos `switch` —la promesa y la crónica— con
// un `default` que dice "Nothing happens".
//
// ⚠️ Y ahí está el riesgo, que es exactamente el patrón que este proyecto ya ha
// pagado: **un tipo de efecto que falte en el `switch` no da error, cae en el
// `default` y le miente al jugador** diciéndole que no pasa nada mientras el store le
// quita 20 de oro. Añadir un efecto nuevo a `events.json` es cambiar un JSON, así que
// nadie va a acordarse de tocar la pantalla.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent } from '../../test-dom';
import EventScreen from './EventScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';
import arcoDePrueba from '../../data/arcs/pais-de-las-olas.json';
import eventosData from '../../data/events.json';

/** Todos los efectos del JSON, aplanando los contenedores (`varios` y `azar`). */
function efectosDe(efecto, acc = []) {
  if (!efecto) return acc;
  acc.push(efecto);
  for (const sub of efecto.efectos ?? []) efectosDe(sub, acc);
  if (efecto.exito) efectosDe(efecto.exito, acc);
  if (efecto.fallo) efectosDe(efecto.fallo, acc);
  return acc;
}

/** Solo las hojas: `varios` y `azar` son contenedores y no se pintan como tales. */
function hojasDe(efecto) {
  return efectosDe(efecto).filter((e) => e.tipo !== 'varios' && e.tipo !== 'azar');
}

const TODOS_LOS_EFECTOS = eventosData.eventos.flatMap((e) =>
  e.elecciones.flatMap((el) => efectosDe(el.efecto)));

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({
    logrosDesbloqueados: [], vistos: VISTOS_VACIO, contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA, notificacionesPendientes: [],
  });
  useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
  useGameStore.setState({ pantalla: 'evento', resultadoEvento: null });
});

describe('la pista, que es lo que se lee ANTES de elegir', () => {
  it('dice "Nothing happens" exactamente tantas veces como efectos vacíos hay', () => {
    // El test que cierra el agujero del `default`, y **cuenta en vez de buscar**: la
    // frase es legítima en la rama mala de una tirada ("50% un objeto · 50% nada"), así
    // que prohibirla del todo daba un falso positivo. Lo que no puede pasar es que
    // aparezca MÁS veces que efectos `ninguno` hay de verdad — cada sobra es un tipo
    // que la pantalla no sabe pintar y está tapando con una mentira.
    for (const evento of eventosData.eventos) {
      useGameStore.setState({ eventoActual: evento, resultadoEvento: null });
      const { unmount } = render(<EventScreen />);

      evento.elecciones.forEach((eleccion, i) => {
        const vacios = hojasDe(eleccion.efecto).filter((e) => e.tipo === 'ninguno').length;
        const texto = screen.getAllByRole('button')[i].textContent;
        const dichos = texto.split('Nothing happens').length - 1;
        expect(
          dichos,
          `"${evento.id}" / "${eleccion.texto}" → "${texto}"`,
        ).toBe(vacios);
      });
      unmount();
    }
  });

  it('⚠️ las probabilidades se enseñan antes de apostar, no después', () => {
    // Una apuesta a ciegas no es una decisión, es una trampa: el jugador no puede
    // saber que va a perder hasta que ya ha perdido.
    const conAzar = eventosData.eventos.filter((e) => e.elecciones.some((el) => el.efecto.tipo === 'azar'));
    expect(conAzar.length, 'ya no hay eventos con tirada').toBeGreaterThan(0);

    for (const evento of conAzar) {
      useGameStore.setState({ eventoActual: evento, resultadoEvento: null });
      const { unmount } = render(<EventScreen />);
      for (const eleccion of evento.elecciones.filter((el) => el.efecto.tipo === 'azar')) {
        const porcentaje = `${Math.round(eleccion.efecto.probabilidad * 100)}%`;
        expect(
          document.body.textContent,
          `"${evento.id}" no enseña el ${porcentaje} de su tirada`,
        ).toContain(porcentaje);
      }
      unmount();
    }
  });
});

describe('la crónica, que es lo que se lee DESPUÉS', () => {
  it('resolver una elección lleva a la pantalla de resultado, no de vuelta al mapa', () => {
    // Desde que una elección puede llevar una tirada, resolver en silencio le
    // escondía al jugador justo lo que había apostado.
    const evento = eventosData.eventos[0];
    useGameStore.setState({ eventoActual: evento });

    useGameStore.getState().resolverEventoEleccion(0);
    render(<EventScreen />);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(useGameStore.getState().pantalla).toBe('evento');
  });

  it('y ningún resultado real se cuenta como "Nothing comes of it"', () => {
    for (const evento of eventosData.eventos) {
      evento.elecciones.forEach((eleccion, i) => {
        useGameStore.setState({ eventoActual: evento, resultadoEvento: null });
        useGameStore.getState().resolverEventoEleccion(i);
        const resultado = useGameStore.getState().resultadoEvento;

        const { unmount } = render(<EventScreen />);
        const hizoAlgo = resultado.tipo !== 'ninguno'
          && !(resultado.tipo === 'varios' && resultado.partes.every((p) => p.tipo === 'ninguno'));
        if (hizoAlgo) {
          expect(
            document.body.textContent,
            `"${evento.id}" / "${eleccion.texto}" cuenta que no pasó nada, y sí pasó`,
          ).not.toContain('Nothing comes of it');
        }
        unmount();
      });
    }
  });

  it('"Continue" cierra el evento y devuelve al mapa', async () => {
    useGameStore.setState({ eventoActual: eventosData.eventos[0] });
    useGameStore.getState().resolverEventoEleccion(0);

    render(<EventScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const { pantalla, eventoActual, resultadoEvento } = useGameStore.getState();
    expect(pantalla).toBe('mapa');
    expect(eventoActual).toBeNull();
    expect(resultadoEvento).toBeNull();
  });
});

describe('invariantes de los datos que la pantalla da por hechos', () => {
  it('la pantalla sabe pintar TODOS los tipos de efecto que hay en events.json', () => {
    // La comprobación directa del agujero: si mañana alguien mete un efecto nuevo en
    // el JSON, este test dice qué tipo es y que la pantalla no lo conoce.
    const CONOCIDOS = new Set([
      'varios', 'azar', 'curarEquipoPorcentaje', 'perderHpEquipo', 'buffTemporalEquipo',
      'ganarXpEquipo', 'ganarOro', 'perderOro', 'comprarObjetoAleatorio',
      'mejoraPermanenteAleatoria', 'ninguno',
    ]);
    const desconocidos = [...new Set(TODOS_LOS_EFECTOS.map((e) => e.tipo))].filter((t) => !CONOCIDOS.has(t));
    expect(desconocidos, 'tipos que EventScreen pintaría como "Nothing happens"').toEqual([]);
  });

  it('sin evento en curso lo dice en vez de quedarse en blanco', () => {
    useGameStore.setState({ eventoActual: null });
    render(<EventScreen />);
    expect(screen.getByText(/No event in progress/i)).toBeInTheDocument();
  });
});
