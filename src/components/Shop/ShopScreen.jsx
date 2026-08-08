import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';

const AMBIENTACION_POR_ARCO = {
  pais_de_las_olas: 'Un mercader ambulante ha montado su puesto junto al camino.',
  examen_chunin: 'Un comerciante furtivo vende sus existencias entre los árboles del Bosque de la Muerte.',
  invasion_de_pain: 'Entre los escombros de Konoha, un superviviente sigue intentando vender lo poco que le queda.',
};

const EMOJI_TIPO = {
  consumible: '🧪',
  equipable: '⚔️',
};

const TIPO_ETIQUETA = {
  consumible: { texto: 'Consumible', clase: 'bg-fuuton/20 text-fuuton border-fuuton/40' },
  equipable: { texto: 'Equipable', clase: 'bg-raiton/20 text-raiton border-raiton/40' },
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
      {/* Icono */}
      <div className="text-4xl text-center mb-3">{EMOJI_TIPO[item.tipo] ?? '📦'}</div>

      {/* Nombre */}
      <p className="font-display text-base text-pergamino-100 text-center leading-tight mb-2">
        {item.nombre}
      </p>

      {/* Descripción */}
      <p className="text-xs text-pergamino-200/60 text-center flex-1 leading-relaxed mb-4">
        {item.descripcion}
      </p>

      {/* Etiqueta de tipo */}
      {etiqueta && (
        <div className={`text-center mb-4`}>
          <span className={`inline-block text-xs font-display uppercase tracking-wider px-2 py-0.5 border rounded-full ${etiqueta.clase}`}>
            {etiqueta.texto}
          </span>
        </div>
      )}

      {/* Botón de compra */}
      <button
        type="button"
        disabled={!puedeComprar}
        onClick={onComprar}
        className="w-full py-2 text-sm font-display rounded-lg transition-colors bg-sello-600 hover:bg-sello-500 disabled:bg-tinta-800 disabled:text-pergamino-200/40 disabled:cursor-not-allowed text-pergamino-100"
      >
        {entrada.precio} oro
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
        No hay ninguna tienda abierta ahora mismo.
      </div>
    );
  }

  const ambientacion = AMBIENTACION_POR_ARCO[arcoActualDatos?.id] ?? 'Un mercader os ofrece sus mercancías.';

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body flex flex-col items-center justify-center px-4 py-8">
      {/* Cabecera */}
      <header className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-pergamino-100 mb-1">
          ¡Puesto de comercio!
        </h1>
        <p className="text-pergamino-200/60 text-sm font-display">
          Compra los objetos que quieras
        </p>
        <p className="text-xs text-pergamino-200/40 italic mt-1">{ambientacion}</p>
      </header>

      {/* Oro disponible */}
      <p className="font-display text-raiton text-lg mb-6">{oro} oro disponible</p>

      {/* 3 cartas de objeto */}
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
            El mercader ya no tiene nada que ofrecer.
          </p>
        )}
      </div>

      {/* Salir */}
      <button
        type="button"
        onClick={volverAlMapa}
        className="px-8 py-2.5 bg-tinta-800 hover:bg-tinta-700 border border-pergamino-100/20 rounded-full font-display text-pergamino-100 transition-colors text-sm tracking-widest"
      >
        SALIR
      </button>
    </div>
  );
}
