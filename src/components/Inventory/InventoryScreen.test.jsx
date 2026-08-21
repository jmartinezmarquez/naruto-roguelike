// @vitest-environment jsdom
//
// La mochila es la pantalla con más esquinas del juego: un mismo objeto puede estar
// suelto y equipado a la vez, equipar encima devuelve el anterior a la bolsa, y usar
// un consumible lo gasta para siempre. Todas esas reglas viven en el store y están
// probadas ahí — lo que NO estaba probado es la pantalla, que es quien decide qué
// botón se puede pulsar y cuál no.
//
// ⚠️ Y ahí salió un bug de verdad: ver "un consumible que no hace nada" abajo.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent, within } from '../../test-dom';
import InventoryScreen from './InventoryScreen';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from '../../store/useAchievementsStore';
import arcoDePrueba from '../../data/arcs/pais-de-las-olas.json';
import itemsData from '../../data/items.json';

const CONSUMIBLE = itemsData.objetos.find((o) => o.tipo === 'consumible');
const EQUIPABLE = itemsData.objetos.find((o) => o.tipo === 'equipable');
const OTRO_EQUIPABLE = itemsData.objetos.filter((o) => o.tipo === 'equipable')[1];

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({
    logrosDesbloqueados: [], vistos: VISTOS_VACIO, contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA, notificacionesPendientes: [],
  });
  useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
  useGameStore.setState({ pantalla: 'mochila', mochilaItemId: null });
});

/** Deja a un personaje con la mitad de HP, para que un consumible tenga algo que curar. */
function malherido(id) {
  const hpMaximo = useGameStore.getState().obtenerHpMaximo(id);
  useGameStore.setState((e) => ({
    equipo: e.equipo.map((p) => (p.id === id ? { ...p, hpActual: Math.floor(hpMaximo / 2) } : p)),
  }));
}

/** La fila de un personaje dentro de la ficha de un objeto, por su nombre corto. */
function filaDe(nombreCorto) {
  return screen.getByText(nombreCorto).closest('div.flex.items-center');
}

describe('un consumible que no hace nada', () => {
  // 🐛 Encontrado el 2026-08-21 escribiendo estos tests, y era invisible: el HP se
  // queda igual, el objeto desaparece del inventario, `usarConsumible` devuelve
  // `true` y la mochila se cierra sola. El jugador pierde un objeto sin enterarse.
  //
  // Chirriaba el doble porque esta misma pantalla SÍ para y avisa antes de reemplazar
  // algo equipado — que encima es reversible, el objeto vuelve a la bolsa— y esto no
  // lo es.
  beforeEach(() => {
    useGameStore.setState({ inventario: [CONSUMIBLE.id] });
  });

  it('no se puede usar sobre alguien que está al máximo', async () => {
    render(<InventoryScreen />);
    await userEvent.click(screen.getByText(CONSUMIBLE.nombre));

    const boton = within(filaDe('Naruto U.')).getByRole('button');
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent('Full');
  });

  it('y sobre un herido sí, que es para lo que está', async () => {
    malherido('naruto');
    render(<InventoryScreen />);
    await userEvent.click(screen.getByText(CONSUMIBLE.nombre));

    const boton = within(filaDe('Naruto U.')).getByRole('button');
    expect(boton).toBeEnabled();
    expect(boton).toHaveTextContent('Use');
  });

  it('sobre un caído también, aunque su HP esté "lleno" a cero', async () => {
    // Un derrotado tiene 0 HP, así que nunca cae en el caso de arriba — pero la
    // comprobación se escribe explícita, porque revivir con una píldora es una regla
    // del juego (ver useGameStore.usarConsumible) y no un efecto colateral.
    useGameStore.setState((e) => ({
      equipo: e.equipo.map((p) => (p.id === 'sasuke' ? { ...p, derrotado: true, hpActual: 0 } : p)),
    }));
    render(<InventoryScreen />);
    await userEvent.click(screen.getByText(CONSUMIBLE.nombre));

    expect(within(filaDe('Sasuke U.')).getByRole('button')).toBeEnabled();
  });

  it('usarlo de verdad cura y gasta la copia', async () => {
    malherido('naruto');
    const hpAntes = useGameStore.getState().equipo.find((p) => p.id === 'naruto').hpActual;
    render(<InventoryScreen />);
    await userEvent.click(screen.getByText(CONSUMIBLE.nombre));
    await userEvent.click(within(filaDe('Naruto U.')).getByRole('button'));

    const { equipo, inventario } = useGameStore.getState();
    expect(equipo.find((p) => p.id === 'naruto').hpActual).toBeGreaterThan(hpAntes);
    expect(inventario).not.toContain(CONSUMIBLE.id);
  });
});

describe('lo suelto y lo equipado son entradas distintas', () => {
  it('el mismo objeto puede estar en la bolsa y puesto a la vez', async () => {
    // Si se agruparan por id, la copia libre quedaría escondida detrás de la
    // equipada y no habría forma de ponérsela a nadie más.
    useGameStore.setState({ inventario: [EQUIPABLE.id, EQUIPABLE.id] });
    useGameStore.getState().equiparObjeto(EQUIPABLE.id, 'naruto');

    render(<InventoryScreen />);
    expect(screen.getAllByText(EQUIPABLE.nombre)).toHaveLength(2);
  });

  it('la entrada equipada dice quién lo lleva y ofrece quitárselo', async () => {
    useGameStore.setState({ inventario: [EQUIPABLE.id] });
    useGameStore.getState().equiparObjeto(EQUIPABLE.id, 'naruto');

    render(<InventoryScreen />);
    await userEvent.click(screen.getByText(EQUIPABLE.nombre));
    expect(screen.getByText(/Worn by/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Unequip' }));
    expect(useGameStore.getState().equipo.find((p) => p.id === 'naruto').objetoEquipadoId).toBeNull();
    expect(useGameStore.getState().inventario).toContain(EQUIPABLE.id);
  });
});

describe('equipar encima avisa antes', () => {
  it('no reemplaza de un solo clic: para y dice que el anterior vuelve a la bolsa', async () => {
    useGameStore.setState({ inventario: [EQUIPABLE.id, OTRO_EQUIPABLE.id] });
    useGameStore.getState().equiparObjeto(EQUIPABLE.id, 'naruto');

    render(<InventoryScreen />);
    await userEvent.click(screen.getByText(OTRO_EQUIPABLE.nombre));
    await userEvent.click(within(filaDe('Naruto U.')).getByRole('button'));

    // Todavía no ha pasado nada: primero hay que confirmar.
    expect(screen.getByText(/goes back to the bag/i)).toBeInTheDocument();
    expect(useGameStore.getState().equipo.find((p) => p.id === 'naruto').objetoEquipadoId).toBe(EQUIPABLE.id);

    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    const { equipo, inventario } = useGameStore.getState();
    expect(equipo.find((p) => p.id === 'naruto').objetoEquipadoId).toBe(OTRO_EQUIPABLE.id);
    expect(inventario).toContain(EQUIPABLE.id);
  });

  it('y se puede cancelar sin tocar nada', async () => {
    useGameStore.setState({ inventario: [EQUIPABLE.id, OTRO_EQUIPABLE.id] });
    useGameStore.getState().equiparObjeto(EQUIPABLE.id, 'naruto');

    render(<InventoryScreen />);
    await userEvent.click(screen.getByText(OTRO_EQUIPABLE.nombre));
    await userEvent.click(within(filaDe('Naruto U.')).getByRole('button'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useGameStore.getState().equipo.find((p) => p.id === 'naruto').objetoEquipadoId).toBe(EQUIPABLE.id);
  });
});

describe('la bolsa vacía', () => {
  it('lo dice en vez de quedarse en blanco', () => {
    useGameStore.setState({ inventario: [] });
    render(<InventoryScreen />);
    expect(screen.getByText(/bag is empty/i)).toBeInTheDocument();
  });
});
