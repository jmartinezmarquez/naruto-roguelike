import { useGameStore } from '../../store/useGameStore';
import { PanelMarco, CabeceraPantalla, TituloBloque } from '../common/PiezasUI';

/**
 * Nodo de evento: un texto y dos o tres elecciones, sin combate.
 *
 * A pantalla completa y no como ventana: es una parada del camino, un momento
 * propio de la run — el mismo criterio que la tienda y reclutar (ver
 * documentacion/33-direccion-visual.md).
 *
 * ⚠️ **Esto es solo el kit visual, no el rediseño.** El punto 6 del roadmap sigue
 * abierto y es el único sin documento MVP: hay que escribir antes qué se quiere de
 * esta pantalla (¿ilustración por evento o fondo por arco? ¿la pista del efecto se
 * sigue viendo antes de elegir, que es un cambio de diseño de JUEGO y no de
 * pantalla?). Lo que se ha hecho aquí es que deje de ser la única pantalla que no
 * habla el idioma de las demás.
 */

const STAT_NAME = { ataque: 'ATK', defensa: 'DEF', velocidad: 'SPD', hp: 'HP' };

function generarPista(efecto) {
  switch (efecto.tipo) {
    case 'curarEquipoPorcentaje':
      return `Heals ${Math.round(efecto.cantidad * 100)}% of the team's HP.`;
    case 'buffTemporalEquipo':
      return `${STAT_NAME[efecto.stat] ?? efecto.stat} +${Math.round((efecto.multiplicador - 1) * 100)}% for ${efecto.combates} battles.`;
    case 'ganarXpEquipo':
      return `The team gains ${efecto.cantidad} experience.`;
    case 'ganarOro':
      return `You gain ${efecto.cantidad} gold.`;
    case 'perderOro':
      return `You lose ${efecto.cantidad} gold.`;
    case 'comprarObjetoAleatorio':
      return efecto.coste > 0
        ? `Get a random item for ${efecto.coste} gold.`
        : 'Get a random item for free.';
    case 'mejoraPermanenteAleatoria':
      return 'A random character gains a permanent stat upgrade.';
    case 'ninguno':
    default:
      return 'Nothing happens.';
  }
}

/** Un efecto que quita algo se pinta en rojo: es lo único que distingue una elección mala. */
function esCoste(efecto) {
  return efecto.tipo === 'perderOro' || (efecto.tipo === 'comprarObjetoAleatorio' && efecto.coste > 0);
}

export default function EventScreen() {
  const evento = useGameStore((s) => s.eventoActual);
  const resolverEventoEleccion = useGameStore((s) => s.resolverEventoEleccion);

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body text-[10px]">
        No event in progress.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center gap-5">
      <CabeceraPantalla antetitulo="On the road" titulo="Event" />

      <PanelMarco className="max-w-md w-full p-5 flex flex-col gap-4">
        <div className="text-center flex flex-col gap-2">
          <TituloBloque tono="seccion" className="text-center">{evento.titulo}</TituloBloque>
          <p className="text-[11px] text-pergamino-200/80 leading-relaxed">{evento.descripcion}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-marco pt-4">
          {evento.elecciones.map((eleccion, i) => (
            <button
              key={i}
              type="button"
              onClick={() => resolverEventoEleccion(i)}
              // `elevar-hover` porque esto sí es elegir, que es donde va el rebote.
              className="elevar-hover text-left px-3 py-2.5 rounded-sm border border-marco bg-tinta-950/40 hover:border-oro/60 hover:bg-tinta-950/70 transition-colors"
            >
              <p className="font-display text-[10px] text-pergamino-100 leading-relaxed">
                {eleccion.texto}
              </p>
              {/* La pista del resultado sigue visible ANTES de elegir, como hasta
                  ahora. No es un descuido: esconderla convertiría el evento en una
                  apuesta en vez de una decisión informada, y eso es diseño de juego
                  — la pregunta está anotada para el punto 6 del roadmap. */}
              <p className={`text-[9px] mt-1.5 ${esCoste(eleccion.efecto) ? 'text-sello-500' : 'text-exito/90'}`}>
                {generarPista(eleccion.efecto)}
              </p>
            </button>
          ))}
        </div>
      </PanelMarco>
    </div>
  );
}
