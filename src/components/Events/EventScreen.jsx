import { useGameStore } from '../../store/useGameStore';
import { nombrePersonaje, nombreObjeto } from '../common/nombres';
import { PanelMarco, CabeceraPantalla, TituloBloque, BotonPrincipal } from '../common/PiezasUI';

/**
 * Nodo de evento: un texto y dos elecciones, sin combate.
 *
 * A pantalla completa y no como ventana: es una parada del camino, un momento
 * propio de la run — el mismo criterio que la tienda y reclutar (ver
 * documentacion/33-direccion-visual.md).
 *
 * La pantalla tiene **dos estados**: elegir y ver qué ha pasado. El segundo es
 * nuevo del rediseño (punto 6, ver documentacion/35-diseño-de-eventos.md) y no es
 * un adorno: desde que una elección puede llevar una tirada de azar, resolver en
 * silencio y devolver al jugador al mapa le escondía justo lo que había apostado.
 *
 * ⚠️ **Las probabilidades se enseñan antes de elegir.** Una apuesta a ciegas no es
 * una decisión, es una trampa: el jugador no puede saber que va a perder hasta que
 * ya ha perdido. Con el porcentaje delante, equivocarse es suyo.
 */

const STAT_NAME = { ataque: 'ATK', defensa: 'DEF', velocidad: 'SPD', hp: 'HP' };

/** Qué promete un efecto, para leerlo ANTES de elegir. */
function generarPista(efecto) {
  switch (efecto.tipo) {
    case 'varios':
      return efecto.efectos.map(generarPista).join(' ');
    case 'azar': {
      const bien = Math.round(efecto.probabilidad * 100);
      return `${bien}% — ${generarPista(efecto.exito)} · ${100 - bien}% — ${generarPista(efecto.fallo)}`;
    }
    case 'curarEquipoPorcentaje':
      return `Heals ${Math.round(efecto.cantidad * 100)}% of the team's HP.`;
    case 'perderHpEquipo':
      return `The team loses ${Math.round(efecto.porcentaje * 100)}% of its HP.`;
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
        ? `A random item for ${efecto.coste} gold.`
        : 'A random item, free.';
    case 'mejoraPermanenteAleatoria':
      return 'A random character gains a permanent stat upgrade.';
    case 'ninguno':
    default:
      return 'Nothing happens.';
  }
}

/**
 * Qué ha pasado DE VERDAD, ya con los datos concretos que devolvió el store: quién
 * recibió la mejora, qué objeto salió, cuánto oro se pagó realmente.
 *
 * Es una función aparte y no la misma que la pista, aunque se parezcan: la pista
 * es una promesa en futuro y esto es una crónica en pasado. Fundirlas obligaría a
 * que el store hablara de "%" y de nombres propios, y el texto es cosa de la UI.
 */
function describirResultado(resultado) {
  switch (resultado.tipo) {
    case 'varios':
      return resultado.partes.map(describirResultado).filter(Boolean).join(' ');
    case 'curarEquipoPorcentaje':
      return 'The squad patches itself up.';
    case 'perderHpEquipo':
      return 'Everyone takes a beating.';
    case 'buffTemporalEquipo':
      return `${STAT_NAME[resultado.stat] ?? resultado.stat} is up for the next ${resultado.combates} battles.`;
    case 'ganarXpEquipo':
      return `The squad earns ${resultado.cantidad} experience.`;
    case 'ganarOro':
      return `You pocket ${resultado.cantidad} gold.`;
    case 'perderOro':
      return resultado.cantidad > 0 ? `You hand over ${resultado.cantidad} gold.` : 'You had nothing to give.';
    case 'comprarObjetoAleatorio':
      return `You walk away with ${nombreObjeto(resultado.objetoId)}.`;
    case 'sinOro':
      return `You cannot afford it — ${resultado.coste} gold, and you are short.`;
    case 'mejoraPermanenteAleatoria':
      return `${nombrePersonaje(resultado.personajeId)} comes out of it stronger: ${STAT_NAME[resultado.stat] ?? resultado.stat} up, for good.`;
    case 'ninguno':
    default:
      return 'Nothing comes of it.';
  }
}

/** Un efecto que QUITA algo se pinta en rojo: es lo que distingue el precio del premio. */
function esCoste(efecto) {
  switch (efecto.tipo) {
    case 'perderOro':
    case 'perderHpEquipo':
      return true;
    case 'comprarObjetoAleatorio':
      return efecto.coste > 0;
    case 'varios':
      return efecto.efectos.some(esCoste);
    default:
      return false;
  }
}

/**
 * La pista de una elección, partida en trozos para poder pintar el precio en rojo
 * y el premio en crema **dentro de la misma línea**. Con un solo color por
 * elección, una opción que da y quita a la vez salía entera de un color y mentía
 * a medias.
 */
function TrozosDePista({ efecto }) {
  if (efecto.tipo === 'varios') {
    return (
      <>
        {efecto.efectos.map((sub, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <TrozosDePista efecto={sub} />
          </span>
        ))}
      </>
    );
  }
  if (efecto.tipo === 'azar') {
    const bien = Math.round(efecto.probabilidad * 100);
    return (
      <>
        <span className="text-oro">{bien}%</span> <TrozosDePista efecto={efecto.exito} />
        <span className="text-pergamino-200/50"> · </span>
        <span className="text-oro">{100 - bien}%</span> <TrozosDePista efecto={efecto.fallo} />
      </>
    );
  }
  return (
    <span className={esCoste(efecto) ? 'text-sello-500' : 'text-pergamino-200'}>
      {generarPista(efecto)}
    </span>
  );
}

export default function EventScreen() {
  const evento = useGameStore((s) => s.eventoActual);
  const resultado = useGameStore((s) => s.resultadoEvento);
  const resolverEventoEleccion = useGameStore((s) => s.resolverEventoEleccion);
  const cerrarEvento = useGameStore((s) => s.cerrarEvento);

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body text-[10px]">
        No event in progress.
      </div>
    );
  }

  const tirada = resultado?.tirada ?? null;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center gap-5">
      <CabeceraPantalla antetitulo="On the road" titulo="Event" />

      <PanelMarco className="max-w-md w-full p-5 flex flex-col gap-4">
        <div className="text-center flex flex-col gap-2">
          <TituloBloque tono="seccion" className="text-center">{evento.titulo}</TituloBloque>
          <p className="text-[11px] text-pergamino-200 leading-relaxed">{evento.descripcion}</p>
        </div>

        {resultado ? (
          <div className="flex flex-col gap-4 border-t border-marco pt-4">
            {/* El veredicto de la tirada va SOLO cuando hubo tirada, y con su
                porcentaje otra vez delante: leer "40%" después de que te haya
                salido mal es la mitad de la gracia de haber apostado. */}
            {tirada && (
              <p className={`font-display text-[11px] text-center ${tirada.salioBien ? 'text-oro' : 'text-sello-500'}`}>
                {tirada.salioBien ? 'It works out' : 'It goes wrong'}
                <span className="text-pergamino-200/50">
                  {' '}({Math.round((tirada.salioBien ? tirada.probabilidad : 1 - tirada.probabilidad) * 100)}%)
                </span>
              </p>
            )}
            <p className="text-[10px] text-pergamino-200 leading-relaxed text-center">
              {describirResultado(resultado)}
            </p>
            <BotonPrincipal onClick={cerrarEvento} className="self-center elevar-hover">
              Continue
            </BotonPrincipal>
          </div>
        ) : (
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
                <p className="text-[9px] mt-1.5 leading-relaxed">
                  <TrozosDePista efecto={eleccion.efecto} />
                </p>
              </button>
            ))}
          </div>
        )}
      </PanelMarco>
    </div>
  );
}
