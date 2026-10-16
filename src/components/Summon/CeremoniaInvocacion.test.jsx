// @vitest-environment jsdom
//
// La ceremonia solo tiene que hacer tres cosas: esconder los premios mientras dura,
// dejarse saltar con un clic y no salir nunca con la velocidad "instantánea".

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test-dom';
import CeremoniaInvocacion from './CeremoniaInvocacion';
import { useSettingsStore, AJUSTES_POR_DEFECTO } from '../../store/useSettingsStore';

const premios = [
  { tipo: 'objeto', id: 'pildora_soldado', rareza: 'comun', efecto: 'nuevo' },
  { tipo: 'personaje', id: 'kakashi', rareza: 'legendario', efecto: 'nuevo' },
];
const props = { premios, spriteDePremio: () => null, nombreDePremio: (p) => p.id };

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(AJUSTES_POR_DEFECTO);
});

describe('CeremoniaInvocacion', () => {
  it('sello, humo y revelación del MEJOR premio; luego lo de debajo', () => {
    render(<CeremoniaInvocacion {...props}><p>después</p></CeremoniaInvocacion>);
    expect(screen.queryByText('después')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' })); // sello → humo
    fireEvent.click(screen.getByRole('button', { name: 'Skip' })); // humo → revelación
    // En una tanda de dos, solo se revela el de mayor rareza.
    expect(screen.getByText('kakashi')).toBeInTheDocument();
    expect(screen.queryByText('pildora_soldado')).toBeNull();
    expect(screen.getByText(/Legendary · NEW!/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('después')).toBeInTheDocument();
  });

  it('con la animación instantánea, los premios salen directamente', () => {
    useSettingsStore.setState({ velocidadCombate: 'instantanea' });
    render(<CeremoniaInvocacion {...props}><p>después</p></CeremoniaInvocacion>);
    expect(screen.getByText('después')).toBeInTheDocument();
  });
});
