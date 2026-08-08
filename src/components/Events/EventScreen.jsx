import { useGameStore } from '../../store/useGameStore';

const NOMBRE_STAT = { ataque: 'Ataque', defensa: 'Defensa', velocidad: 'Velocidad', hp: 'HP' };

/** Genera un texto legible a partir del efecto, para que un jugador novato sepa qué hace cada elección. */
function generarPista(efecto) {
  switch (efecto.tipo) {
    case 'curarEquipoPorcentaje':
      return `Cura un ${Math.round(efecto.cantidad * 100)}% de la vida del equipo.`;
    case 'buffTemporalEquipo':
      return `${NOMBRE_STAT[efecto.stat]} +${Math.round((efecto.multiplicador - 1) * 100)}% durante ${efecto.combates} combates.`;
    case 'ganarXpEquipo':
      return `El equipo gana ${efecto.cantidad} de experiencia.`;
    case 'ganarOro':
      return `Ganas ${efecto.cantidad} de oro.`;
    case 'perderOro':
      return `Pierdes ${efecto.cantidad} de oro.`;
    case 'comprarObjetoAleatorio':
      return efecto.coste > 0
        ? `Consigues un objeto aleatorio por ${efecto.coste} de oro.`
        : 'Consigues un objeto aleatorio gratis.';
    case 'mejoraPermanenteAleatoria':
      return 'Un personaje al azar gana una mejora permanente de estadística.';
    case 'ninguno':
    default:
      return 'No pasa nada.';
  }
}

export default function EventScreen() {
  const evento = useGameStore((s) => s.eventoActual);
  const resolverEventoEleccion = useGameStore((s) => s.resolverEventoEleccion);

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay ningún evento en curso.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-tinta-900 border border-pergamino-100/10 rounded-lg p-6">
        <p className="text-raiton text-xs tracking-[0.3em] uppercase mb-2 text-center">Evento</p>
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
