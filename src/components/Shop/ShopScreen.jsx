import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';
import personajesData from '../../data/characters.json';
import configGlobal from '../../data/config.json';
import PersonajeHoverCard from '../common/PersonajeHoverCard';

function nombrePersonaje(id) {
  return personajesData.personajes.find((p) => p.id === id)?.nombre ?? id;
}

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

function TarjetaRecluta({ opcion, oro, disabled, textoBoton, onClick }) {
  return (
    <PersonajeHoverCard id={opcion.personajeId} className="block">
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
          {textoBoton}
        </button>
      </div>
    </PersonajeHoverCard>
  );
}

/** Panel para elegir a quién sacar del equipo (ya completo) y dejarle el sitio al reclutado. */
function ElegirReemplazo({ nombreCandidato, equipo, onElegir, onCancelar }) {
  return (
    <div className="bg-tinta-800 border border-sello-600/50 rounded-lg p-4">
      <p className="text-sm text-pergamino-100 mb-3">
        Tu equipo ya está completo. ¿A quién reemplaza <span className="text-fuuton font-display">{nombreCandidato}</span>?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {equipo.map((p) => (
          <PersonajeHoverCard key={p.id} id={p.id} nivel={p.nivel} hpActual={p.hpActual} className="block">
            <button
              type="button"
              onClick={() => onElegir(p.id)}
              className="w-full text-xs bg-tinta-900 hover:bg-sello-600/30 border border-pergamino-100/10 hover:border-sello-600/60 rounded-lg py-2 px-1 text-pergamino-100 transition-colors"
            >
              {nombrePersonaje(p.id)}
            </button>
          </PersonajeHoverCard>
        ))}
      </div>
      <button
        type="button"
        onClick={onCancelar}
        className="mt-3 text-xs text-pergamino-200/60 underline hover:text-pergamino-100"
      >
        Cancelar
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

  // Id del reclutable elegido mientras el equipo está lleno, esperando a que
  // el jugador diga a quién reemplaza. null = no hay ninguna elección pendiente.
  const [candidatoAReclutarId, setCandidatoAReclutarId] = useState(null);

  if (!tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay ninguna tienda abierta ahora mismo.
      </div>
    );
  }

  const equipoLleno = equipo.length >= configGlobal.equipo.tamanoMaximo;
  const ambientacion = AMBIENTACION_POR_ARCO[arcoActualDatos?.id] ?? 'Un mercader os ofrece sus mercancías.';

  function manejarClicReclutar(personajeId) {
    if (equipoLleno) {
      setCandidatoAReclutarId(personajeId);
      return;
    }
    reclutarDeTienda(personajeId);
  }

  function confirmarReemplazo(idAReemplazar) {
    reclutarDeTienda(candidatoAReclutarId, idAReemplazar);
    setCandidatoAReclutarId(null);
  }

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
            {equipoLleno && !candidatoAReclutarId && (
              <p className="text-xs text-pergamino-200/60 mb-2">
                Tu equipo ya está completo ({equipo.length}/{configGlobal.equipo.tamanoMaximo}) — al reclutar, elegirás a quién reemplaza.
              </p>
            )}

            {candidatoAReclutarId ? (
              <ElegirReemplazo
                nombreCandidato={tienda.reclutables.find((r) => r.personajeId === candidatoAReclutarId)?.nombre}
                equipo={equipo}
                onElegir={confirmarReemplazo}
                onCancelar={() => setCandidatoAReclutarId(null)}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {tienda.reclutables.map((opcion) => (
                  <TarjetaRecluta
                    key={opcion.personajeId}
                    opcion={opcion}
                    oro={oro}
                    textoBoton={equipoLleno ? 'Reclutar y reemplazar' : 'Reclutar'}
                    onClick={() => manejarClicReclutar(opcion.personajeId)}
                  />
                ))}
              </div>
            )}
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
