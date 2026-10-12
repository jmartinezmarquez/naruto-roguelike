import { useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { fijarVolumenEfectos, reproducir } from './efectosDeSonido';

/**
 * Los sonidos de la interfaz que no son de ninguna pantalla: el clic de cualquier
 * botón y el tic de pasar por encima de algo elegible. Y el volumen, que lo empuja
 * aquí al sintetizador. No pinta nada y cuelga de `App`, como `MusicaDeFondo`.
 *
 * **Un solo oyente para toda la app, no un `onClick` por botón.** Hay decenas de
 * botones repartidos por doce pantallas, y un sonido puesto botón a botón es la forma
 * segura de que la mitad se queden mudos — el mismo fallo de "el aviso que nadie
 * enchufó" que ya hemos tenido. Así, un botón nuevo suena solo.
 *
 * Lo que cambia un botón concreto se declara en el propio JSX, sin importar nada:
 *   - `data-sonido="elegirNodo"` → suena ese sonido del catálogo en vez del clic;
 *   - `data-sonido="ninguno"` → no suena nada aquí, porque el botón pone el suyo
 *     según el RESULTADO (comprar con o sin oro, una tirada que sale bien o mal) y
 *     eso solo lo sabe su manejador;
 *   - `data-sonido-hover` → suena el tic al pasar por encima (solo en lo que se elige
 *     de verdad, como los nodos del mapa: en todos los botones sería ruido).
 */
export default function EfectosDeSonidoGlobales() {
  const volumen = useSettingsStore((s) => s.volumenEfectos);

  useEffect(() => {
    fijarVolumenEfectos(volumen);
  }, [volumen]);

  useEffect(() => {
    // Fase de CAPTURA: suena antes de que el manejador del botón cambie de pantalla y
    // desmonte el botón. Y `click`, no `pointerdown`, para que también suene al
    // pulsarlo con Espacio o Intro.
    function alHacerClic(evento) {
      const elemento = evento.target.closest?.('button, a, [role="button"], summary');
      if (!elemento || elemento.disabled || elemento.getAttribute('aria-disabled') === 'true') return;
      const sonido = elemento.dataset.sonido ?? 'clic';
      if (sonido !== 'ninguno') reproducir(sonido);
    }

    let ultimoHover = null;
    function alPasarPorEncima(evento) {
      const elemento = evento.target.closest?.('[data-sonido-hover]');
      if (elemento === ultimoHover) return;
      ultimoHover = elemento;
      if (elemento && !elemento.disabled) reproducir('hover');
    }

    window.addEventListener('click', alHacerClic, true);
    window.addEventListener('pointerover', alPasarPorEncima);
    return () => {
      window.removeEventListener('click', alHacerClic, true);
      window.removeEventListener('pointerover', alPasarPorEncima);
    };
  }, []);

  return null;
}
