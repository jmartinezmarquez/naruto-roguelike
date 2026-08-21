import { useEffect } from 'react';

/**
 * Espacio (o Enter) para adelantar, como el botón A de un Pokémon.
 *
 * Se usa **solo donde hay UNA acción de avance** —el "Continue" del final de combate, el
 * del resultado de un evento— y nunca en una pantalla donde haya que elegir: si hay dos
 * salidas, una tecla que dispare "la principal" convierte una decisión en un accidente.
 *
 * ⚠️ **La trampa: si un `<button>` tiene el foco, el navegador YA dispara su clic al
 * pulsar espacio.** Un manejador global encima ejecutaría la acción **dos veces** — y en
 * este juego eso es saltarse una pantalla entera sin verla (el mapa detrás, la
 * recompensa del mini-jefe). Por eso se cede el paso cuando el foco está en algo
 * interactivo: ahí ya funciona solo, y mejor, porque respeta la accesibilidad de serie.
 *
 * `preventDefault` es obligatorio con el espacio: sin él la página hace scroll bajo la
 * pantalla, que en el mapa se nota.
 */
const TECLAS = new Set([' ', 'Spacebar', 'Enter']);
const INTERACTIVOS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']);

export function useAvanzarConTeclado(accion, activo = true) {
  useEffect(() => {
    if (!activo || typeof accion !== 'function') return undefined;

    function alPulsar(evento) {
      if (!TECLAS.has(evento.key)) return;
      // Mantener pulsada la tecla no encadena avances: `repeat` se ignora.
      if (evento.repeat) return;
      // El foco manda. Ver el comentario de arriba.
      if (INTERACTIVOS.has(document.activeElement?.tagName)) return;
      evento.preventDefault();
      accion();
    }

    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [accion, activo]);
}
