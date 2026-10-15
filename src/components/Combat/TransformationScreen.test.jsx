// @vitest-environment jsdom
//
// De la pantalla de transformación solo se prueba qué sprite parpadea como el
// "antes": la forma de la que viene el personaje, no siempre la base. De la fase 2 a
// la 3 parpadeaba el sprite BASE, y se leía como si el personaje perdiera la primera
// transformación antes de ganar la segunda.

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '../../test-dom';
import TransformationScreen from './TransformationScreen';
import { useSettingsStore, AJUSTES_POR_DEFECTO } from '../../store/useSettingsStore';
import { spriteDeModo } from '../common/transformationSprites';
import { spriteDeLuchador } from '../common/characterSprites';

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(AJUSTES_POR_DEFECTO);
});

const srcs = () => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src'));

describe('TransformationScreen — el sprite del "antes"', () => {
  it('desde la base parpadea el sprite base', () => {
    render(<TransformationScreen personajeId="naruto" indiceModo={0} indiceModoAnterior={null} onContinuar={() => {}} />);
    expect(srcs()).toContain(spriteDeLuchador('naruto'));
  });

  it('de la fase 2 a la 3 parpadea el sprite de la fase 2, no el base', () => {
    render(<TransformationScreen personajeId="naruto" indiceModo={1} indiceModoAnterior={0} onContinuar={() => {}} />);
    expect(srcs()).toContain(spriteDeModo('naruto', 0));
    expect(srcs()).not.toContain(spriteDeLuchador('naruto'));
  });
});
