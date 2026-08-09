import { useGameStore } from '../../store/useGameStore';

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

export default function EventScreen() {
  const evento = useGameStore((s) => s.eventoActual);
  const resolverEventoEleccion = useGameStore((s) => s.resolverEventoEleccion);

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No event in progress.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-tinta-900 border border-pergamino-100/10 rounded-lg p-6">
        <p className="text-raiton text-xs tracking-[0.3em] uppercase mb-2 text-center">Event</p>
        <h1 className="font-display text-2xl font-bold text-center mb-4">{evento.titulo}</h1>
        <p className="text-pergamino-200/80 text-sm text-center mb-6 leading-relaxed">
          {evento.descripcion}
        </p>

        <div className="flex flex-col gap-3">
          {evento.elecciones.map((eleccion, i) => (
            <button
              key={i}
              type="button"
              onClick={() => resolverEventoEleccion(i)}
              className="text-left px-4 py-3 bg-tinta-800 hover:bg-tinta-800/70 border border-pergamino-100/10 hover:border-sello-500/50 rounded-lg transition-colors"
            >
              <p>{eleccion.texto}</p>
              <p className="text-xs text-pergamino-200/50 mt-1">{generarPista(eleccion.efecto)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
