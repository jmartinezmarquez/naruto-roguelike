import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';

const EMOJI_TIPO = {
  consumible: '🧪',
  equipable: '⚔️',
};

const TIPO_ETIQUETA = {
  consumible: { texto: 'Objeto usable', clase: 'bg-fuuton/20 text-fuuton border border-fuuton/40' },
  equipable: { texto: 'Objeto equipable', clase: 'bg-raiton/20 text-raiton border border-raiton/40' },
};

export default function ItemRewardScreen() {
  const recompensa = useGameStore((s) => s.recompensaMiniJefe);
  const reclamarRecompensaMiniJefe = useGameStore((s) => s.reclamarRecompensaMiniJefe);
  const saltarRecompensaMiniJefe = useGameStore((s) => s.saltarRecompensaMiniJefe);

  if (!recompensa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay recompensa pendiente.
      </div>
    );
  }

  const item = itemsData.objetos.find((o) => o.id === recompensa.item);
  const etiqueta = item ? TIPO_ETIQUETA[item.tipo] : null;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body flex flex-col items-center justify-center px-4 py-8">
      {/* Cabecera */}
      <header className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-pergamino-100 mb-1">
          ¡Objeto encontrado!
        </h1>
        <p className="text-pergamino-200/60 text-sm font-display">
          Recompensa por derrotar al mini-jefe
        </p>
      </header>

      {/* Carta centrada */}
      {item ? (
        <div className="flex flex-col items-center bg-tinta-900 border-2 border-pergamino-100/20 rounded-xl p-8 max-w-xs w-full mb-8 text-center">
          <div className="text-6xl mb-5">{EMOJI_TIPO[item.tipo] ?? '📦'}</div>
          <p className="font-display text-xl text-pergamino-100 leading-tight mb-3">{item.nombre}</p>
          <p className="text-sm text-pergamino-200/60 leading-relaxed mb-5">{item.descripcion}</p>
          {etiqueta && (
            <span className={`text-xs font-display uppercase tracking-wider px-3 py-1 rounded-full ${etiqueta.clase}`}>
              {etiqueta.texto}
            </span>
          )}
        </div>
      ) : (
        <div className="bg-tinta-900 border border-pergamino-100/20 rounded-xl p-8 max-w-xs w-full mb-8 text-center text-pergamino-200/50 text-sm">
          Objeto desconocido
        </div>
      )}

      {/* Botones */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={reclamarRecompensaMiniJefe}
          className="px-8 py-2.5 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors text-sm tracking-wide"
        >
          Recoger
        </button>
        <button
          type="button"
          onClick={saltarRecompensaMiniJefe}
          className="text-xs text-pergamino-200/40 hover:text-pergamino-200/70 underline transition-colors"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}
