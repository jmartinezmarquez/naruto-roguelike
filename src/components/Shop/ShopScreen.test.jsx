// @vitest-environment jsdom
//
// La tienda es donde el oro se convierte en algo, y su regla dura es que **no se
// puede comprar lo que no se puede pagar**. El store ya la comprueba; lo que se
// comprueba aquí es que la pantalla no deje pulsar el botón igualmente, que es un
// sitio distinto donde equivocarse: si el store dice que no y la UI no lo refleja, el
// jugador pulsa "Buy", no pasa nada, y parece que el juego está roto.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent, within } from '../../test-dom';
import ShopScreen from './ShopScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';
import arcoDePrueba from '../../data/arcs/pais-de-las-olas.json';
import itemsData from '../../data/items.json';

const OFERTA = itemsData.objetos.slice(0, 3).map((o, i) => ({ id: o.id, precio: 50 + i * 50 }));

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({
    logrosDesbloqueados: [], vistos: VISTOS_VACIO, contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA, notificacionesPendientes: [],
  });
  useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
  useGameStore.setState({ tiendaActual: { items: OFERTA }, pantalla: 'tienda' });
});

/** La tarjeta de un objeto, por su nombre. */
function tarjetaDe(nombre) {
  return screen.getByText(nombre).closest('div');
}

describe('lo que no se puede pagar', () => {
  it('tiene el botón apagado', () => {
    useGameStore.setState({ oro: 0 });
    render(<ShopScreen />);
    for (const entrada of OFERTA) {
      const item = itemsData.objetos.find((o) => o.id === entrada.id);
      expect(within(tarjetaDe(item.nombre)).getByRole('button')).toBeDisabled();
    }
  });

  it('pero se sigue leyendo entero', () => {
    // Que no te llegue el oro no es motivo para no poder leer qué es: la primera
    // versión lo atenuaba con opacidad y sobre el fondo de Konoha no se leía ni el
    // nombre. Lo que dice "no te llega" es el precio en rojo y el botón apagado.
    useGameStore.setState({ oro: 0 });
    render(<ShopScreen />);
    for (const entrada of OFERTA) {
      const item = itemsData.objetos.find((o) => o.id === entrada.id);
      expect(screen.getByText(item.nombre)).toBeInTheDocument();
      expect(screen.getByText(`${entrada.precio} gold`)).toBeInTheDocument();
    }
  });

  it('con el oro JUSTO sí se puede: el límite es >=, no >', () => {
    // El clásico error de una unidad, y aquí se paga con un objeto que el jugador
    // podía permitirse.
    useGameStore.setState({ oro: OFERTA[0].precio });
    render(<ShopScreen />);
    const item = itemsData.objetos.find((o) => o.id === OFERTA[0].id);
    expect(within(tarjetaDe(item.nombre)).getByRole('button')).toBeEnabled();
  });
});

describe('comprar', () => {
  beforeEach(() => {
    useGameStore.setState({ oro: 9999, inventario: [] });
  });

  it('cobra, mete el objeto en la mochila y lo quita del escaparate', async () => {
    const entrada = OFERTA[0];
    const item = itemsData.objetos.find((o) => o.id === entrada.id);

    render(<ShopScreen />);
    await userEvent.click(within(tarjetaDe(item.nombre)).getByRole('button'));

    const { oro, inventario, tiendaActual } = useGameStore.getState();
    expect(oro).toBe(9999 - entrada.precio);
    expect(inventario).toContain(entrada.id);
    // Que salga del escaparate es lo que impide comprar dos veces lo mismo con un
    // doble clic, que es como se descubren estos fallos.
    expect(tiendaActual.items.map((i) => i.id)).not.toContain(entrada.id);
    expect(screen.queryByText(item.nombre)).toBeNull();
  });

  it('no se puede comprar dos veces el mismo objeto', async () => {
    const entrada = OFERTA[0];
    const item = itemsData.objetos.find((o) => o.id === entrada.id);

    render(<ShopScreen />);
    const boton = within(tarjetaDe(item.nombre)).getByRole('button');
    await userEvent.click(boton);
    await userEvent.click(boton); // la tarjeta ya no existe; el clic no llega a nadie

    expect(useGameStore.getState().inventario.filter((i) => i === entrada.id)).toHaveLength(1);
  });
});

describe('sin tienda abierta', () => {
  it('lo dice en vez de reventar', () => {
    useGameStore.setState({ tiendaActual: null });
    render(<ShopScreen />);
    expect(screen.getByText(/No shop is open/i)).toBeInTheDocument();
  });
});
