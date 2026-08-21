// @vitest-environment jsdom
//
// El evento es el único sitio del juego donde **el store devuelve datos y la pantalla
// escribe el texto** (ver documentacion/35-diseño-de-eventos.md). Eso deja la promesa y
// la crónica enteras fuera de los tests de store, cada una en su `switch`.
//
// ⚠️ Y ahí está el riesgo, que es exactamente el patrón que este proyecto ya ha
// pagado: **un tipo de efecto que falte en el `switch` no da error**. Añadir un efecto
// nuevo a `events.json` es cambiar un JSON, así que nadie va a acordarse de tocar la
// pantalla.
//
// 📌 El rediseño del 2026-08-21 cambió el vocabulario —las consecuencias son pastillas
// y ya no frases—, y con él el `default` **dejó de mentir**: `resumirEfecto` devuelve
// `?? <tipo>`, que es visible y feo a propósito. Antes decía "Nothing happens" y le
// contaba al jugador que no pasaba nada mientras el store le quitaba 20 de oro. Los
// tests de abajo siguen vigilando lo mismo, con las palabras nuevas.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, act } from '../../test-dom';
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

const eventoConTirada = eventosData.eventos.find((e) => e.elecciones.some((el) => el.efecto.tipo === 'azar'));
const indiceDeLaTirada = eventoConTirada.elecciones.findIndex((el) => el.efecto.tipo === 'azar');
const eventoSinTirada = eventosData.eventos.find((e) => e.elecciones.every((el) => el.efecto.tipo !== 'azar'));

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
  it('la pastilla "Nothing" sale exactamente tantas veces como efectos vacíos hay', () => {
    // **Cuenta en vez de buscar**: "Nothing" es legítimo en la rama mala de una tirada
    // ("50% un objeto · 50% nada"), así que prohibirlo del todo daba un falso positivo
    // (y lo dio: fue el primer intento de este test). Lo que no puede pasar es que
    // salga MÁS veces que efectos `ninguno` hay de verdad.
    for (const evento of eventosData.eventos) {
      useGameStore.setState({ eventoActual: evento, resultadoEvento: null });
      const { unmount } = render(<EventScreen />);

      evento.elecciones.forEach((eleccion, i) => {
        const vacios = hojasDe(eleccion.efecto).filter((e) => e.tipo === 'ninguno').length;
        const texto = screen.getAllByRole('button')[i].textContent;
        const dichos = texto.split('Nothing').length - 1;
        expect(
          dichos,
          `"${evento.id}" / "${eleccion.texto}" → "${texto}"`,
        ).toBe(vacios);
      });
      unmount();
    }
  });

  it('⚠️ un efecto que la pantalla no conozca sale MARCADO, no disfrazado de nada', () => {
    // El arreglo de fondo del rediseño: el `default` ya no miente. Antes un tipo nuevo
    // caía en "Nothing happens" y era indistinguible de un efecto vacío de verdad;
    // ahora sale un `??` que nadie puede confundir con contenido.
    useGameStore.setState({
      eventoActual: {
        id: 'inventado', titulo: 'T', descripcion: 'D',
        elecciones: [{ texto: 'Una opción', efecto: { tipo: 'efectoQueNadieHaEscritoAun' } }],
      },
      resultadoEvento: null,
    });
    render(<EventScreen />);

    const texto = screen.getAllByRole('button')[0].textContent;
    expect(texto).toContain('??');
    expect(texto).not.toContain('Nothing');
  });

  it('las consecuencias son pastillas y no una frase corrida', () => {
    // El problema que motivó el rediseño: con dos elecciones en prosa había que
    // LEERLAS enteras para compararlas. Cada consecuencia tiene que ser su propia
    // unidad, o el color y el recuento no dicen nada de un vistazo.
    const conVarios = eventosData.eventos.find((e) =>
      e.elecciones.some((el) => el.efecto.tipo === 'varios' && el.efecto.efectos.length > 1));
    expect(conVarios, 'ya no hay elecciones con varios efectos').toBeTruthy();

    useGameStore.setState({ eventoActual: conVarios, resultadoEvento: null });
    render(<EventScreen />);

    const eleccion = conVarios.elecciones.find((el) => el.efecto.tipo === 'varios');
    const indice = conVarios.elecciones.indexOf(eleccion);
    const chips = screen.getAllByRole('button')[indice].querySelectorAll('span.rounded-sm.border');
    // Una pastilla por consecuencia, más el número de la elección.
    expect(chips.length).toBeGreaterThanOrEqual(eleccion.efecto.efectos.length);
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

    expect(screen.getByText(/Nothing comes of it|patches itself up|hand over|pocket|beating|earns|walk away|stronger|is up for/i))
      .toBeInTheDocument();
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
    useGameStore.setState({ eventoActual: eventoConTirada });
    useGameStore.getState().resolverEventoEleccion(indiceDeLaTirada);

    render(<EventScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const { pantalla, eventoActual, resultadoEvento } = useGameStore.getState();
    expect(pantalla).toBe('mapa');
    expect(eventoActual).toBeNull();
    expect(resultadoEvento).toBeNull();
  });
});

describe('el ritmo: cuándo hay pantalla de resultado y cuándo no', () => {
  // ⚠️ **La regla costó dos intentos y el segundo lo tiró el jugador.**
  //
  // El primero fue "sin tirada, se cierra sola": la pantalla aparecía y desaparecía en
  // poco más de un segundo, o sea **lo peor de las dos opciones** — ni daba tiempo a
  // leer, ni parecía que no hubiera nada. Palabras suyas: *"da la sensación de que estás
  // perdiéndote algo"*.
  //
  // La línea buena no es si hubo azar, es si el desenlace **añade información**. Cuando
  // eliges, la pista ya te ha enseñado `+45% HP` y `−20 g`: con un efecto fijo, el
  // resultado es la promesa otra vez, y una pantalla para repetirte lo que acabas de leer
  // y elegir es un trámite. Ahora: o hay algo que leer y se queda con su botón, o no lo
  // hay y vuelves al mapa directo. **Nunca una pantalla que parpadea.**
  const clicEnLaEleccion = async (evento, indice) => {
    useGameStore.setState({ eventoActual: evento, resultadoEvento: null, pantalla: 'evento' });
    render(<EventScreen />);
    await userEvent.click(screen.getAllByRole('button')[indice]);
  };

  it('un efecto FIJO no abre pantalla: vuelve al mapa en el mismo gesto', async () => {
    // `tsunade_y_jiraiya[0]` es curar + pagar, las dos cantidades ya escritas en la pista.
    await clicEnLaEleccion(eventoSinTirada, 0);
    expect(useGameStore.getState().pantalla).toBe('mapa');
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  it('una TIRADA sí, porque no sabes qué rama te ha tocado', async () => {
    await clicEnLaEleccion(eventoConTirada, indiceDeLaTirada);
    expect(useGameStore.getState().pantalla).toBe('evento');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('⚠️ y un objeto aleatorio TAMBIÉN, aunque no haya tirada: la pista decía "Random item", no cuál', async () => {
    // Es el caso que tumbó la primera regla. Sin tirada, pero el desenlace revela un
    // dato que la promesa no tenía.
    const evento = eventosData.eventos.find((e) => e.id === 'mercader_ambulante');
    const indice = evento.elecciones.findIndex((el) => el.efecto.tipo === 'comprarObjetoAleatorio');
    useGameStore.setState({ oro: 9999 });

    await clicEnLaEleccion(evento, indice);
    expect(useGameStore.getState().pantalla).toBe('evento');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('y si no te llega el oro, también: no ha pasado lo que prometía', async () => {
    const evento = eventosData.eventos.find((e) => e.id === 'mercader_ambulante');
    const indice = evento.elecciones.findIndex((el) => el.efecto.tipo === 'comprarObjetoAleatorio');
    useGameStore.setState({ oro: 0 });

    await clicEnLaEleccion(evento, indice);
    expect(useGameStore.getState().pantalla).toBe('evento');
    expect(screen.getByText(/cannot afford/i)).toBeInTheDocument();
  });

  it('la pantalla que SÍ sale no se va sola: espera al jugador', () => {
    vi.useFakeTimers();
    try {
      useGameStore.setState({ eventoActual: eventoConTirada });
      useGameStore.getState().resolverEventoEleccion(indiceDeLaTirada);
      render(<EventScreen />);

      act(() => { vi.advanceTimersByTime(30000); });
      expect(useGameStore.getState().pantalla).toBe('evento');
    } finally {
      vi.useRealTimers();
    }
  });

  it('el espacio la adelanta', async () => {
    useGameStore.setState({ eventoActual: eventoConTirada, resultadoEvento: null });
    useGameStore.getState().resolverEventoEleccion(indiceDeLaTirada);
    render(<EventScreen />);

    await userEvent.keyboard(' ');
    expect(useGameStore.getState().pantalla).toBe('mapa');
  });

  it('⚠️ pero NO mientras todavía hay que elegir', () => {
    // Un espacio que dispare "la opción principal" convertiría una decisión en un
    // accidente: hay dos elecciones y ninguna es la de por defecto.
    useGameStore.setState({ eventoActual: eventoConTirada, resultadoEvento: null });
    render(<EventScreen />);

    return userEvent.keyboard(' ').then(() => {
      expect(useGameStore.getState().resultadoEvento).toBeNull();
      expect(useGameStore.getState().pantalla).toBe('evento');
    });
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
