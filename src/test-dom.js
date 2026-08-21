// Andamiaje común de los tests de COMPONENTE. Los del motor y los del store no lo
// tocan: siguen corriendo en `environment: 'node'`, que es la regla del proyecto
// (`engine/` no importa React ni el DOM). Cada test de componente declara su entorno
// en la primera línea del archivo con `// @vitest-environment jsdom`, en vez de
// cambiar el entorno global — así los 290 tests de siempre no pagan el arranque de
// jsdom ni pierden el invariante de que el motor no necesita un navegador.
//
// Se importa entero desde el test (`import { render, screen } from '../../test-dom'`)
// y no se registra en `setupFiles` porque un `setupFiles` corre también para los
// tests de node, donde `cleanup` no tiene DOM que limpiar.

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ⚠️ **Sin esto no se puede renderizar `App`.** jsdom no implementa el reproductor
// de medios: `HTMLMediaElement.play()` no devuelve una promesa sino `undefined`, así
// que el `audio.play().catch(...)` de `MusicaDeFondo` —que está ahí porque el
// navegador BLOQUEA el autoplay hasta el primer gesto, ver documentacion/36— revienta
// con un TypeError antes de que el test llegue a comprobar nada. No es un fallo del
// componente: es una pieza que jsdom no trae.
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
}

// Las otras dos piezas de navegador que el juego usa y jsdom no trae. Van aquí y no
// en cada test porque no son de ningún componente en concreto: `ResizeObserver` lo
// usan el mapa (para escalar el lienzo y que quepa sin scroll) y la tarjeta de hover,
// y `scrollIntoView` el registro de texto del combate.
if (typeof window !== 'undefined') {
  if (!window.ResizeObserver) {
    // Un observador que no observa: en jsdom no hay maquetación, así que todas las
    // medidas salen a 0 y llamar al callback no aportaría nada. Lo que hace falta es
    // que `new ResizeObserver(...)` no reviente.
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.Element.prototype.scrollIntoView) {
    window.Element.prototype.scrollIntoView = () => {};
  }
}

// React Testing Library solo limpia el DOM entre tests por su cuenta si `afterEach`
// es global, y aquí no lo es (`globals` está sin activar, los tests importan de
// 'vitest' a mano). Sin esta línea, cada `render` deja su árbol montado y el segundo
// test del archivo encuentra DOS botones con el mismo texto.
afterEach(cleanup);

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
