// @vitest-environment jsdom
//
// El gacha tiene que no dejar tirar sin saldo, enseñar lo que ha salido con lo que
// significa (nuevo, nivel de ninja o pergaminos devueltos) y tener las reglas a la vista.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test-dom';
import InvocacionScreen from './InvocacionScreen';
import { useAchievementsStore, PERGAMINOS_VACIOS } from '../../store/useAchievementsStore';
import { ESTADO_INVOCACION_VACIO } from '../../engine/invocacion';
import invocacionData from '../../data/invocacion.json';

function conSaldo(saldo) {
  useAchievementsStore.setState({
    pergaminos: { ...PERGAMINOS_VACIOS, saldo },
    invocacion: ESTADO_INVOCACION_VACIO,
    logrosDesbloqueados: [],
    maestria: {},
  });
}

beforeEach(() => localStorage.clear());

describe('InvocacionScreen', () => {
  it('sin saldo, los dos botones están apagados', () => {
    conSaldo(0);
    render(<InvocacionScreen />);
    expect(screen.getByRole('button', { name: /Summon ×1 ·/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Summon ×10/ })).toBeDisabled();
  });

  it('enseña las probabilidades y cuántas tiradas faltan para cada garantía', () => {
    conSaldo(0);
    render(<InvocacionScreen />);
    expect(screen.getByText('Legendary')).toBeInTheDocument();
    expect(screen.getByText(/^10% · /)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`every ${invocacionData.garantiaRaro} summons`))).toBeInTheDocument();
    // El pity es una barra, con cuánto falta escrito encima.
    expect(screen.getByText(`Legendary guaranteed in ${invocacionData.garantiaLegendario}`)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Legendary pity' })).toHaveAttribute('aria-valuenow', '0');
  });

  it('una tirada cobra, y lo que ha salido se ve SOLO cuando acaba la ceremonia', () => {
    conSaldo(invocacionData.precioTirada);
    render(<InvocacionScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Summon ×1 ·/ }));
    expect(useAchievementsStore.getState().pergaminos.saldo).toBe(0);
    // Durante la ceremonia, nada de resultados: destriparían la revelación.
    expect(screen.queryByText('Last summoned')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Last summoned')).toBeInTheDocument();
  });
});
