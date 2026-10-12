import { useLayoutEffect, useRef } from 'react';
import { chispasDelGolpe } from './efectosDeGolpe';

/**
 * Las chispas pintadas sobre el sprite de quien recibe. Se coloca midiendo, igual
 * que el número de daño: la tarjeta puede estar a tres alturas distintas.
 *
 * Cada chispa es un cuadrado sin redondear — pixel art, no partículas de motor — y
 * viaja con CSS (`.chispa-impacto`), sin estado en React: el `key` del golpe la
 * remonta y la animación empieza sola.
 */
export default function ChispasImpacto({ golpe, tipoAtacante, refContenedor, refObjetivo }) {
  const nodo = useRef(null);
  const datos = chispasDelGolpe(golpe, tipoAtacante);

  useLayoutEffect(() => {
    const contenedor = refContenedor.current;
    const objetivo = refObjetivo.current;
    if (!nodo.current || !contenedor || !objetivo) return;
    const caja = contenedor.getBoundingClientRect();
    const r = objetivo.getBoundingClientRect();
    nodo.current.style.left = `${r.left - caja.left + r.width / 2}px`;
    // A la altura del sprite, no del centro de la tarjeta: el sprite va en la
    // mitad de abajo, debajo del nombre y la barra de vida.
    nodo.current.style.top = `${r.top - caja.top + r.height * 0.58}px`;
  }, [refContenedor, refObjetivo]);

  if (!datos) return null;

  return (
    <div ref={nodo} aria-hidden="true" className="absolute z-20 pointer-events-none w-0 h-0">
      {datos.onda && (
        <span
          className={`onda-impacto ${datos.esJutsu ? 'onda-impacto-grande' : ''}`}
          style={{ borderColor: datos.color }}
        />
      )}
      {datos.chispas.map((chispa, i) => (
        <span
          key={i}
          className="chispa-impacto"
          style={{
            width: chispa.tamano,
            height: chispa.tamano,
            background: datos.color,
            color: datos.color,
            '--angulo': `${chispa.angulo}deg`,
            '--distancia': `${chispa.distancia}px`,
          }}
        />
      ))}
    </div>
  );
}
