import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';
import { SPRITE_OBJETO } from '../Inventory/itemSprites';

const SHOP_FLAVOR = {
  pais_de_las_olas: 'A traveling merchant has set up shop by the roadside.',
  examen_chunin: 'A shady trader sells his wares among the trees of the Forest of Death.',
  invasion_de_pain: 'Among the ruins of Konoha, a survivor is still trying to sell what little he has left.',
};

const EMOJI_TIPO = {
  consumible: '🧪',
  equipable: '⚔️',
};

const TIPO_ETIQUETA = {
  consumible: { texto: 'Consumable', clase: 'bg-fuuton/20 text-fuuton border-fuuton/40' },
  equipable: { texto: 'Equippable', clase: 'bg-raiton/20 text-raiton border-raiton/40' },
};

function TarjetaItem({ entrada, oro, onComprar }) {
  const item = itemsData.objetos.find((o) => o.id === entrada.id);
  if (!item) return null;

  const puedeComprar = oro >= entrada.precio;
  const etiqueta = TIPO_ETIQUETA[item.tipo];

  return (
    <div className={`
      relative flex flex-col bg-tinta-900 border-2 rounded-xl p-5 transition-all duration-200
      ${puedeComprar
        ? 'border-pergamino-100/20 hover:border-pergamino-100/50 cursor-pointer hover:bg-tinta-800'
        : 'border-pergamino-100/10 opacity-50'}
    `}>
      <div className="h-16 flex items-center justify-center mb-3">
        {SPRITE_OBJETO[item.id] ? (
          <img src={SPRITE_OBJETO[item.id]} alt="" aria-hidden="true" className="h-16 w-16 object-contain" />
        ) : (
          <span className="text-4xl">{EMOJI_TIPO[item.tipo] ?? '📦'}</span>
        )}
      </div>

      <p className="font-display text-base text-pergamino-100 text-center leading-tight mb-2">
        {item.nombre}
      </p>

      <p className="text-xs text-pergamino-200/60 text-center flex-1 leading-relaxed mb-4">
        {item.descripcion}
      </p>

      {etiqueta && (
        <div className="text-center mb-4">
          <span className={`inline-block text-xs font-display uppercase tracking-wider px-2 py-0.5 border rounded-full ${etiqueta.clase}`}>
            {etiqueta.texto}
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={!puedeComprar}
        onClick={onComprar}
        className="w-full py-2 text-sm font-display rounded-lg transition-colors bg-sello-600 hover:bg-sello-500 disabled:bg-tinta-800 disabled:text-pergamino-200/40 disabled:cursor-not-allowed text-pergamino-100"
      >
        {entrada.precio} gold
      </button>
    </div>
  );
}

export default function ShopScreen() {
  const tienda = useGameStore((s) => s.tiendaActual);
  const oro = useGameStore((s) => s.oro);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const comprarItemTienda = useGameStore((s) => s.comprarItemTienda);

  if (!tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No shop is open right now.
      </div>
    );
  }

  const flavor = SHOP_FLAVOR[arcoActualDatos?.id] ?? 'A merchant offers their wares.';

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body flex flex-col items-center justify-center px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-pergamino-100 mb-1">
          Trading Post!
        </h1>
        <p className="text-pergamino-200/60 text-sm font-display">
          Buy whatever you need
        </p>
        <p className="text-xs text-pergamino-200/40 italic mt-1">{flavor}</p>
      </header>

      <p className="font-display text-raiton text-lg mb-6">{oro} gold available</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
        {tienda.items.length > 0 ? (
          tienda.items.map((entrada) => (
            <TarjetaItem
              key={entrada.id}
              entrada={entrada}
              oro={oro}
              onComprar={() => comprarItemTienda(entrada.id)}
            />
          ))
        ) : (
          <p className="col-span-3 text-center text-pergamino-200/50 text-sm py-8">
            The merchant has nothing left to offer.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={volverAlMapa}
        className="px-8 py-2.5 bg-tinta-800 hover:bg-tinta-700 border border-pergamino-100/20 rounded-full font-display text-pergamino-100 transition-colors text-sm tracking-widest"
      >
        LEAVE
      </button>
    </div>
  );
}
