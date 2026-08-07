import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';

const AMBIENTACION_POR_ARCO = {
  pais_de_las_olas: 'Un mercader ambulante ha montado su puesto junto al camino, huyendo de los hombres de Gato.',
  examen_chunin: 'Un comerciante furtivo vende sus existencias entre los árboles del Bosque de la Muerte.',
  invasion_de_pain: 'Entre los escombros de Konoha, un superviviente sigue intentando vender lo poco que le queda.',
};

function buscarItem(itemId) {
  return itemsData.objetos.find((o) => o.id === itemId);
}

function TarjetaObjeto({ item, precio, gratis, disabled, onClick, textoBoton }) {
  if (!item) return null;
  return (
    <div className="bg-tinta-800 border border-pergamino-100/10 rounded-lg p-4 flex flex-col">
      <p className="font-display text-base text-pergamino-100">{item.nombre}</p>
      <p className="text-xs text-pergamino-200/60 mt-1 flex-1">{item.descripcion}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-raiton font-display">{gratis ? 'Gratis' : `${precio} oro`}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className="px-3 py-1.5 text-xs bg-sello-600 hover:bg-sello-500 disabled:bg-tinta-950/40 disabled:cursor-not-allowed rounded-full font-display text-pergamino-100 transition-colors"
        >
          {textoBoton}
        </button>
      </div>
    </div>
  );
}

const RAREZA_COLOR = {
  comun: 'text-pergamino-200/70',
  inicial: 'text-fuuton',
  raro: 'text-suiton',
  legendario: 'text-sello-500',
};

function TarjetaRecluta({ opcion, oro, disabled, onClick }) {
  return (
    <div className="bg-tinta-800 border border-pergamino-100/10 rounded-lg p-4 flex flex-col items-center text-center">
      <p className="font-display text-base text-pergamino-100">{opcion.nombre}</p>
      <p className={`text-xs uppercase tracking-wide mt-1 ${RAREZA_COLOR[opcion.rareza] ?? ''}`}>
        {opcion.rareza}
      </p>
      <span className="text-sm text-raiton font-display mt-3">{opcion.precio} oro</span>
      <button
        type="button"
        disabled={disabled || oro < opcion.precio}
        onClick={onClick}
        className="mt-3 px-4 py-1.5 text-xs bg-sello-600 hover:bg-sello-500 disabled:bg-tinta-950/40 disabled:cursor-not-allowed rounded-full font-display text-pergamino-100 transition-colors w-full"
      >
        Reclutar
      </button>
    </div>
  );
}

export default function ShopScreen() {
  const tienda = useGameStore((s) => s.tiendaActual);
  const oro = useGameStore((s) => s.oro);
  const equipo = useGameStore((s) => s.equipo);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const comprarConsumibleTienda = useGameStore((s) => s.comprarConsumibleTienda);
  const reclamarObjetoGratuitoTienda = useGameStore((s) => s.reclamarObjetoGratuitoTienda);
  const reclutarDeTienda = useGameStore((s) => s.reclutarDeTienda);

  if (!tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay ninguna tienda abierta ahora mismo.
      </div>
    );
  }

  const equipoLleno = equipo.length >= 3;
  const ambientacion = AMBIENTACION_POR_ARCO[arcoActualDatos?.id] ?? 'Un mercader os ofrece sus mercancías.';

  return (
    <div className="min-h-screen bg-tinta-950 text-pergamino-100 font-body px-4 py-8">
      <header className="max-w-2xl mx-auto text-center mb-8">
        <p className="text-sello-500 text-xs tracking-[0.3em] uppercase mb-1">🏮 Tienda</p>
        <h1 className="font-display text-2xl font-bold text-pergamino-100 mb-2">Puesto de comercio</h1>
        <p className="text-sm text-pergamino-200/60 italic">{ambientacion}</p>
        <p className="font-display text-raiton mt-3">{oro} de oro</p>
      </header>

      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {tienda.consumibles.length > 0 && (
          <section>
            <p className="font-display text-sm text-pergamino-200/60 uppercase tracking-wide mb-3">Consumibles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tienda.consumibles.map((itemId) => {
                const item = buscarItem(itemId);
                return (
                  <TarjetaObjeto
                    key={itemId}
                    item={item}
                    precio={item?.precioTienda}
                    disabled={oro < (item?.precioTienda ?? Infinity)}
                    onClick={() => comprarConsumibleTienda(itemId)}
                    textoBoton="Comprar"
                  />
                );
              })}
            </div>
          </section>
        )}

        {tienda.gratuito && (
          <section>
            <p className="font-display text-sm text-pergamino-200/60 uppercase tracking-wide mb-3">Regalo del mercader</p>
            <TarjetaObjeto
              item={buscarItem(tienda.gratuito)}
              gratis
              onClick={reclamarObjetoGratuitoTienda}
              textoBoton="Recoger"
            />
          </section>
        )}

        {tienda.reclutables.length > 0 && (
          <section>
            <p className="font-display text-sm text-pergamino-200/60 uppercase tracking-wide mb-3">
              Reclutar — solo puedes elegir a uno
            </p>
            {equipoLleno && (
              <p className="text-xs text-sello-500 mb-2">Tu equipo ya está completo (3/3).</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {tienda.reclutables.map((opcion) => (
                <TarjetaRecluta
                  key={opcion.personajeId}
                  opcion={opcion}
                  oro={oro}
                  disabled={equipoLleno}
                  onClick={() => reclutarDeTienda(opcion.personajeId)}
                />
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={volverAlMapa}
          className="mt-2 px-6 py-2 bg-tinta-800 hover:bg-tinta-800/70 border border-pergamino-100/10 rounded-full font-display text-pergamino-100 transition-colors self-center"
        >
          Salir de la tienda
        </button>
      </div>
    </div>
  );
}
