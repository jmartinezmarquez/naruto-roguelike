import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';
import { SPRITE_OBJETO, lineasDeEfecto } from '../Inventory/itemSprites';

const EMOJI_TIPO = {
  consumible: '🧪',
  equipable: '⚔️',
};

const TIPO_ETIQUETA = {
  consumible: { texto: 'Usable Item', clase: 'bg-fuuton/20 text-fuuton border border-fuuton/40' },
  equipable: { texto: 'Equippable Item', clase: 'bg-raiton/20 text-raiton border border-raiton/40' },
};

export default function ItemRewardScreen() {
  const recompensa = useGameStore((s) => s.recompensaMiniJefe);
  const reclamarRecompensaMiniJefe = useGameStore((s) => s.reclamarRecompensaMiniJefe);
  const saltarRecompensaMiniJefe = useGameStore((s) => s.saltarRecompensaMiniJefe);

  if (!recompensa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No reward pending.
      </div>
    );
  }

  const item = itemsData.objetos.find((o) => o.id === recompensa.item);
  const etiqueta = item ? TIPO_ETIQUETA[item.tipo] : null;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body flex flex-col items-center justify-center px-4 py-8">
      <header className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-pergamino-100 mb-1">
          Item Found!
        </h1>
        <p className="text-pergamino-200/60 text-sm font-display">
          Reward for defeating the mini-boss
        </p>
      </header>

      {item ? (
        <div className="flex flex-col items-center bg-tinta-900 border-2 border-pergamino-100/20 rounded-xl p-8 max-w-xs w-full mb-8 text-center">
          <div className="h-24 flex items-center justify-center mb-5">
            {SPRITE_OBJETO[item.id] ? (
              <img src={SPRITE_OBJETO[item.id]} alt="" aria-hidden="true" className="h-24 w-24 object-contain" />
            ) : (
              <span className="text-6xl">{EMOJI_TIPO[item.tipo] ?? '📦'}</span>
            )}
          </div>
          <p className="font-display text-xl text-pergamino-100 leading-tight mb-3">{item.nombre}</p>
          {/* Mismo criterio que en la tienda: solo qué hace. Aquí también se
              decide, porque la recompensa se puede saltar. */}
          <div className="flex flex-col gap-1 mb-5">
            {lineasDeEfecto(item).map((linea) => (
              <p
                key={linea.texto}
                className={`text-sm leading-snug ${linea.positivo ? 'text-fuuton' : 'text-sello-500'}`}
              >
                {linea.icono} {linea.texto}
              </p>
            ))}
          </div>
          {etiqueta && (
            <span className={`text-xs font-display uppercase tracking-wider px-3 py-1 rounded-full ${etiqueta.clase}`}>
              {etiqueta.texto}
            </span>
          )}
        </div>
      ) : (
        <div className="bg-tinta-900 border border-pergamino-100/20 rounded-xl p-8 max-w-xs w-full mb-8 text-center text-pergamino-200/50 text-sm">
          Unknown item
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={reclamarRecompensaMiniJefe}
          className="elevar-hover px-8 py-2.5 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 text-sm tracking-wide"
        >
          Collect
        </button>
        <button
          type="button"
          onClick={saltarRecompensaMiniJefe}
          className="text-xs text-pergamino-200/40 hover:text-pergamino-200/70 underline transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
