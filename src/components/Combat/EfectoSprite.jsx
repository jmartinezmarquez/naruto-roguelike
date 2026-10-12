import { useLayoutEffect, useRef } from 'react';
import { EFECTOS } from './spritesDeEfecto';

/**
 * Un sprite de efecto (humo, tajo, estrella, explosión) reproducido UNA vez sobre un
 * luchador. Se coloca midiendo la tarjeta del objetivo, igual que el número de daño:
 * la tarjeta puede estar a tres alturas distintas.
 *
 * La animación es CSS (`.efecto-sprite`, con `steps()` sobre la posición del fondo) y
 * no hay estado en React: el `key` del golpe lo remonta y la tira vuelve a empezar.
 * Al acabar se queda en blanco por sí sola — el último salto de `steps` cae justo
 * fuera de la tira —, así que no hace falta desmontarlo a tiempo.
 *
 * Se pinta a ×1, sin ampliar: los personajes también van a ×1 en su lienzo, y un
 * efecto con píxeles más gordos se vería de otro juego.
 *
 * `espejo` voltea el sprite: el tajo tiene que ir en el sentido del golpe.
 */
export default function EfectoSprite({ nombre, refContenedor, refObjetivo, espejo = false, altura = 0.62 }) {
  const nodo = useRef(null);
  const efecto = EFECTOS[nombre];

  useLayoutEffect(() => {
    const contenedor = refContenedor.current;
    const objetivo = refObjetivo.current;
    if (!nodo.current || !contenedor || !objetivo) return;
    const caja = contenedor.getBoundingClientRect();
    const r = objetivo.getBoundingClientRect();
    nodo.current.style.left = `${r.left - caja.left + r.width / 2}px`;
    // A la altura del sprite del personaje, no del centro de la tarjeta.
    nodo.current.style.top = `${r.top - caja.top + r.height * altura}px`;
  }, [refContenedor, refObjetivo, altura]);

  if (!efecto) return null;

  return (
    <div ref={nodo} aria-hidden="true" className="absolute z-20 pointer-events-none w-0 h-0">
      <div
        className="efecto-sprite"
        style={{
          width: efecto.lado,
          height: efecto.lado,
          backgroundImage: `url(${efecto.src})`,
          transform: `translate(-50%, -50%)${espejo ? ' scaleX(-1)' : ''}`,
          '--ancho-tira': `${efecto.lado * efecto.fotogramas}px`,
          '--fotogramas': efecto.fotogramas,
          '--duracion-efecto': `${efecto.ms}ms`,
        }}
      />
    </div>
  );
}
