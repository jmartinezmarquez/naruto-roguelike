import { SPRITE_CHAKRA } from './chakraSprites';
import { tipoDeLuchador } from './nombres';

/**
 * El icono de una naturaleza. `tamano` en clases de Tailwind, porque el mismo icono
 * se usa a tres tamaños muy distintos: pastilla de tipo, rueda del mapa y pestaña de
 * la enciclopedia.
 *
 * Es `inline-block` y con `align-text-bottom` para que pueda ir **dentro de una
 * línea de texto** sin descolocarla, que es como se usaba el emoji al que sustituye.
 */
export function IconoChakra({ tipo, tamano = 'w-2.5 h-2.5', className = '' }) {
  const src = SPRITE_CHAKRA[tipo];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
      // `imagen-suave` porque esto se pinta a 12-16 px desde un PNG de 96: con el
      // `image-rendering: pixelated` global, una reducción así tira píxeles a
      // trozos y el icono se ve roto (ver el comentario en `index.css`).
      // `align-middle` y no `align-text-bottom`: el icono va DENTRO de una línea de
      // texto y tiene que centrarse con ella, no colgar de la base — si no, empuja
      // la línea hacia abajo y la pastilla que lo contiene crece de alto.
      className={`inline-block align-middle object-contain select-none shrink-0 imagen-suave ${tamano} ${className}`}
    />
  );
}

/** El icono de la naturaleza de un luchador (personaje o jefe), por su id. */
export function IconoChakraDeLuchador({ id, tamano, className }) {
  return <IconoChakra tipo={tipoDeLuchador(id)} tamano={tamano} className={className} />;
}
