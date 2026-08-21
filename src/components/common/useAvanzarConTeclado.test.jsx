// @vitest-environment jsdom
//
// El atajo de teclado parece trivial y tiene una trampa que sí lo es: **si un `<button>`
// tiene el foco, el navegador YA dispara su clic al pulsar espacio**. Un manejador
// global encima ejecutaría la acción dos veces, y en este juego eso significa saltarse
// una pantalla entera sin verla — el "Continue" del combate te dejaría en el mapa y,
// acto seguido, el mapa recibiría el segundo espacio.
//
// Es un fallo que **no se ve en el sitio donde se programa**: depende de si el jugador
// ha tocado el botón con el ratón antes de usar la tecla.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test-dom';
import { useAvanzarConTeclado } from './useAvanzarConTeclado';

function Sonda({ accion, activo = true, conBoton = false }) {
  useAvanzarConTeclado(accion, activo);
  return conBoton ? <button type="button" onClick={accion}>Continue</button> : <p>sin botón</p>;
}

describe('lo que dispara', () => {
  it('el espacio', async () => {
    const accion = vi.fn();
    render(<Sonda accion={accion} />);
    await userEvent.keyboard(' ');
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('y el Enter, que es el otro "aceptar" de toda la vida', async () => {
    const accion = vi.fn();
    render(<Sonda accion={accion} />);
    await userEvent.keyboard('{Enter}');
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('pero no otra tecla cualquiera', async () => {
    const accion = vi.fn();
    render(<Sonda accion={accion} />);
    await userEvent.keyboard('x{Escape}{ArrowRight}');
    expect(accion).not.toHaveBeenCalled();
  });
});

describe('lo que NO puede pasar', () => {
  it('⚠️ con el botón enfocado, el espacio actúa UNA vez y no dos', async () => {
    // El navegador ya convierte espacio en clic sobre un botón enfocado. El hook cede el
    // paso en vez de sumarse, que además respeta la accesibilidad de serie.
    const accion = vi.fn();
    render(<Sonda accion={accion} conBoton />);
    screen.getByRole('button').focus();

    await userEvent.keyboard(' ');
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('desactivado no escucha nada', async () => {
    const accion = vi.fn();
    render(<Sonda accion={accion} activo={false} />);
    await userEvent.keyboard(' ');
    expect(accion).not.toHaveBeenCalled();
  });

  it('mantener la tecla pulsada no encadena avances', () => {
    const accion = vi.fn();
    render(<Sonda accion={accion} />);
    // `repeat: true` es lo que manda el navegador mientras la tecla sigue abajo. Sin
    // filtrarlo, dejar el dedo puesto cruzaría tres pantallas seguidas.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }));
    expect(accion).not.toHaveBeenCalled();
  });

  it('deja de escuchar al desmontarse', async () => {
    const accion = vi.fn();
    const { unmount } = render(<Sonda accion={accion} />);
    unmount();
    await userEvent.keyboard(' ');
    expect(accion).not.toHaveBeenCalled();
  });
});
