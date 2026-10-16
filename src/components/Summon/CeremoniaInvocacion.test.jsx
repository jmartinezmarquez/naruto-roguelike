// @vitest-environment jsdom
//
// La ceremonia solo tiene que hacer tres cosas: esconder los premios mientras dura,
// dejarse saltar con un clic y no salir nunca con la velocidad "instantánea".

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test-dom';
import CeremoniaInvocacion from './CeremoniaInvocacion';
import { useSettingsStore, AJUSTES_POR_DEFECTO } from '../../store/useSettingsStore';

const premios = [{ tipo: 'personaje', id: 'kakashi', rareza: 'legendario' }];

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(AJUSTES_POR_DEFECTO);
});

describe('CeremoniaInvocacion', () => {
  it('mientras dura, los premios no se ven; un clic la salta', () => {
    render(<CeremoniaInvocacion premios={premios}><p>premio</p></CeremoniaInvocacion>);
    expect(screen.queryByText('premio')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByText('premio')).toBeInTheDocument();
  });

  it('con la animación instantánea, los premios salen directamente', () => {
    useSettingsStore.setState({ velocidadCombate: 'instantanea' });
    render(<CeremoniaInvocacion premios={premios}><p>premio</p></CeremoniaInvocacion>);
    expect(screen.getByText('premio')).toBeInTheDocument();
  });
});
