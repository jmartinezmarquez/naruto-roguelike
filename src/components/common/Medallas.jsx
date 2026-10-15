import HoverTooltip from './HoverTooltip';
import { EtiquetaFlotante } from './PiezasUI';

/**
 * Las medallas de arco, como las de gimnasio de Pokémon: una por jefe final derrotado
 * en la run. Recortadas por `scripts/generar-sprites-estilo-nuevo.py` (estilo nuevo, documentacion/41) en
 * `assets/medals/<arcoId>.png`.
 *
 * `import.meta.glob` y no `import`, por lo mismo que la música: **un arco sin medalla
 * dibujada no rompe el build**. Una campaña nueva puede llegar antes que su arte, y
 * sus huecos simplemente no se pintan.
 */
const SPRITE_MEDALLA = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/medals/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

function spriteDeMedalla(arcoId) {
  return SPRITE_MEDALLA[arcoId] ?? null;
}

/**
 * Una medalla suelta. `ganada = false` la pinta en **silueta negra**, la misma
 * convención que el Bingo Book para lo que aún no has visto: el hueco dice que hay
 * algo que conseguir, sin destripar cómo es.
 *
 * `tamano` en píxeles, siempre múltiplo de 32: el pixel art a escalas no enteras duplica
 * unas columnas y otras no. El lienzo era de 32; con el estilo nuevo (documentacion/41)
 * pasa a 64, que sigue siendo múltiplo de las dos escalas a las que se pinta (32 y 64).
 */
export function Medalla({ arco, ganada = true, tamano = 32, className = '' }) {
  const sprite = spriteDeMedalla(arco.id);
  if (!sprite) return null;
  return (
    <img
      src={sprite}
      alt={ganada ? arco.medalla?.nombre ?? arco.nombre : ''}
      aria-hidden={ganada ? undefined : 'true'}
      draggable="false"
      width={tamano}
      height={tamano}
      className={`select-none ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(ganada ? {} : { filter: 'brightness(0)', opacity: 0.35 }),
      }}
    />
  );
}

/**
 * La fila de medallas: un hueco por arco de la campaña, lleno o en silueta. Cada una
 * con su nombre al pasar por encima — y el arco que la da, si aún no la tienes.
 */
export function FilaMedallas({ arcos, ganadas, tamano = 32, conHover = true }) {
  return (
    <div className="flex items-center gap-1.5">
      {arcos.map((arco) => {
        const ganada = ganadas.includes(arco.id);
        const medalla = <Medalla arco={arco} ganada={ganada} tamano={tamano} />;
        if (!conHover) return <span key={arco.id}>{medalla}</span>;
        return (
          <HoverTooltip
            key={arco.id}
            posicion="abajo"
            contenido={(
              <EtiquetaFlotante>
                <p className="leading-tight">{ganada ? arco.medalla?.nombre : '???'}</p>
                <p className="text-[9px] text-pergamino-200/70 mt-1">
                  {ganada ? arco.nombre : `Defeat the boss of ${arco.nombre}`}
                </p>
              </EtiquetaFlotante>
            )}
          >
            {medalla}
          </HoverTooltip>
        );
      })}
    </div>
  );
}
