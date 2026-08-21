// @vitest-environment jsdom
//
// El enrutado de pantallas: que cada valor de `pantalla` pinte la suya.
//
// ⚠️ **Este archivo existe por un bug concreto y ya ocurrido**: `EventScreen` se quedó
// sin importar en `App.jsx` y la pantalla de evento **no se renderizaba nunca, sin
// ningún error visible**. Nada falla en un fallo así — simplemente no pasa nada, y se
// descubre jugando. Es el tipo de agujero que ningún test de motor ni de store puede
// tapar, porque el motor resolvía el evento perfectamente: lo que faltaba era la
// pantalla.
//
// Por eso el test recorre **todos** los nombres de pantalla, incluidos los que hoy
// funcionan: el valor no está en comprobar uno, está en que añadir una pantalla nueva
// sin engancharla salte aquí.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from './test-dom';
import App from './App';
import { useGameStore } from './store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from './store/useAchievementsStore';
import arcoDePrueba from './data/arcs/pais-de-las-olas.json';
import eventosData from './data/events.json';
import itemsData from './data/items.json';

const enemigoDebil = {
  id: 'enemigo_debil_test',
  nombre: 'Enemigo Débil de Prueba',
  tipo: 'doton',
  statsBase: { hp: 1, ataque: 1, defensa: 1, velocidad: 1 },
  jutsu: { nombre: 'Golpe Débil', danoBase: 0.1, efectoEstado: null },
  modos: [],
};

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
});

/** Salta a un nodo del tipo pedido sin pasar por el camino: `avanzarANodo` no exige que sea alcanzable. */
function irANodoDeTipo(tipo) {
  const { mapa, avanzarANodo } = useGameStore.getState();
  const nodo = Object.values(mapa.nodos).find((n) => n.tipo === tipo);
  expect(nodo, `el mapa generado no tiene ningún nodo de tipo "${tipo}"`).toBeTruthy();
  avanzarANodo(nodo.id);
}

// Cada entrada prepara el estado mínimo que su pantalla necesita y dice por qué texto
// se la reconoce. `encimaDelMapa` es la regla de diseño que separa las consultas
// cortas (se dibujan SOBRE el mapa, sigues viendo dónde estás) de los momentos
// propios de la run, que ocupan la pantalla entera — ver documentacion/33.
const PANTALLAS = {
  mapa: { texto: 'Current Arc', encimaDelMapa: false },

  combate: {
    preparar: () => useGameStore.getState().jugarCombate(enemigoDebil, 1, true),
    texto: 'Enemy',
    encimaDelMapa: false,
  },
  evento: {
    preparar: () => useGameStore.setState({ eventoActual: eventosData.eventos[0] }),
    texto: eventosData.eventos[0].titulo,
    encimaDelMapa: false,
  },
  tienda: {
    preparar: () => useGameStore.setState({
      tiendaActual: { items: itemsData.objetos.slice(0, 3).map((o) => ({ id: o.id, precio: 50 })) },
    }),
    texto: 'Trading Post',
    encimaDelMapa: false,
  },
  reclutar: { preparar: () => irANodoDeTipo('reclutar'), texto: /scroll|recruit/i, encimaDelMapa: false },
  gameover: { texto: 'End of the Road', encimaDelMapa: false },

  logros: { texto: 'Missions', encimaDelMapa: true },
  enciclopedia: { texto: 'Bingo Book', encimaDelMapa: true },
  mochila: { texto: 'Bag', encimaDelMapa: true },
  ajustes: { texto: 'Settings', encimaDelMapa: true },
  recompensaMiniJefe: {
    preparar: () => useGameStore.setState({ recompensaMiniJefe: { item: itemsData.objetos[0].id } }),
    texto: 'Item Found',
    encimaDelMapa: true,
  },
};

describe('enrutado de pantallas', () => {
  for (const [pantalla, { preparar, texto, encimaDelMapa }] of Object.entries(PANTALLAS)) {
    it(`"${pantalla}" pinta su pantalla`, () => {
      preparar?.();
      useGameStore.setState({ pantalla });
      render(<App />);
      expect(screen.getAllByText(texto).length).toBeGreaterThan(0);
    });

    it(`"${pantalla}" ${encimaDelMapa ? 'deja el mapa detrás' : 'ocupa la pantalla entera'}`, () => {
      preparar?.();
      useGameStore.setState({ pantalla });
      render(<App />);
      // "Current Arc" es la cabecera del mapa y no sale en ninguna otra pantalla.
      const hayMapa = screen.queryByText('Current Arc') !== null;
      expect(hayMapa).toBe(encimaDelMapa || pantalla === 'mapa');
    });
  }
});

describe('los buffs temporales se ven en alguna parte', () => {
  // ⚠️ El fallo que arregla este bloque: un evento daba "ATK +20% durante 3 combates",
  // el motor lo aplicaba de verdad en cada pelea, y **no aparecía en ninguna pantalla**.
  // El juego te cambiaba los números y no te lo decía, así que no podías saber si
  // seguías bufado ni decidir en consecuencia. No fallaba nada: el jugador no se
  // enteraba, que es el peor modo de fallo de este proyecto.
  //
  // Se comprueba a través de `App` porque `MapScreen` no tiene test propio a propósito
  // (jsdom no maqueta y ahí se probaría el lienzo falso).
  beforeEach(() => {
    useGameStore.setState({
      pantalla: 'mapa',
      buffsTemporales: [{ multiplicadores: { ataque: 1.2 }, combatesRestantes: 3 }],
    });
  });

  it('el mapa dice qué llevas activo y cuántos combates le quedan', () => {
    render(<App />);
    expect(screen.getByText('ATK +20%')).toBeInTheDocument();
    expect(screen.getByText('3×')).toBeInTheDocument();
  });

  it('y sin ninguno el panel no ocupa sitio en vez de salir vacío', () => {
    useGameStore.setState({ buffsTemporales: [] });
    render(<App />);
    expect(screen.queryByText('Active')).toBeNull();
  });
});

describe('🐛 los avisos del mapa no se cruzan por delante de un combate', () => {
  // ⚠️ **Era un spoiler del jefe final.** `_curarEquipoCompleto` corre en cuanto el jefe
  // muere en el motor, o sea **antes de que empiece la animación**, y ponía ahí mismo el
  // aviso "Team fully healed after completing the arc." — que se pintaba encima de la
  // pelea y te decía que habías ganado mientras todavía la estabas viendo.
  //
  // Se arregló en dos capas y las dos importan: el aviso lo pone ahora
  // `avanzarSiguienteArco` (cuando ya has visto el desenlace), y `AvisoToast` no se
  // monta durante el combate — la red para cualquier aviso que se añada mañana.
  it('un aviso pendiente no se pinta durante el combate', () => {
    useGameStore.getState().jugarCombate(enemigoDebil, 1, true);
    useGameStore.setState({ pantalla: 'combate', avisoUltimoNodo: 'Team fully healed after completing the arc.' });
    render(<App />);
    expect(screen.queryByText(/fully healed/i)).toBeNull();
  });

  it('pero sí en el mapa, que es donde significa algo', () => {
    useGameStore.setState({ pantalla: 'mapa', avisoUltimoNodo: 'Team fully healed at the rest node.' });
    render(<App />);
    expect(screen.getByText(/fully healed/i)).toBeInTheDocument();
  });

  it('y el de fin de arco llega al empezar el siguiente, no al morir el jefe', () => {
    useGameStore.setState({ avisoUltimoNodo: null });
    const avanzo = useGameStore.getState().avanzarSiguienteArco();
    expect(avanzo).toBe(true);
    expect(useGameStore.getState().avisoUltimoNodo).toMatch(/fully healed/i);
  });
});

describe('sin run empezada', () => {
  beforeEach(() => {
    // `mapa: null` es lo que App usa para saber que no hay partida en curso.
    useGameStore.setState({ mapa: null });
  });

  it('la puerta del juego es el Home, no la selección de personaje', () => {
    useGameStore.setState({ pantalla: 'home' });
    render(<App />);
    expect(screen.getByText('Narutolike')).toBeInTheDocument();
  });

  it('"seleccionPersonaje" pinta la selección', () => {
    useGameStore.setState({ pantalla: 'seleccionPersonaje' });
    render(<App />);
    expect(screen.getByText('Choose your ninja')).toBeInTheDocument();
  });

  it('cualquier pantalla desconocida cae en el Home y no en blanco', () => {
    useGameStore.setState({ pantalla: 'mapa' }); // sin mapa, "mapa" no puede pintarse
    render(<App />);
    expect(screen.getByText('Narutolike')).toBeInTheDocument();
  });

  // ⚠️ Las tres pantallas de consulta se dibujan también aquí, encima del Home, y no
  // es un detalle: son meta-progresión, o sea justo lo que se mira ENTRE partidas.
  // Colgarlas solo del mapa las dejaba accesibles nada más que jugando.
  for (const [pantalla, texto] of [['logros', 'Missions'], ['enciclopedia', 'Bingo Book'], ['ajustes', 'Settings']]) {
    it(`"${pantalla}" se puede abrir desde el Home`, () => {
      useGameStore.setState({ pantalla });
      render(<App />);
      expect(screen.getAllByText(texto).length).toBeGreaterThan(0);
      expect(screen.getByText('Narutolike')).toBeInTheDocument();
    });
  }
});
