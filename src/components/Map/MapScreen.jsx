import { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';

// Un icono simple por tipo de nodo, en vez de depender de assets externos.
const ICONO_NODO = {
  combate: '刀', // espada — kanji usado como glifo, no como assets con derechos
  evento: '?',
  reclutamiento: '仲', // "compañero"
  tienda: '店', // "tienda"
  descanso: '休', // "descanso"
  miniJefe: '危', // "peligro"
  jefe: '鬼', // "demonio/jefe"
};

const COLOR_NODO = {
  combate: 'bg-tinta-800 border-pergamino-200/40 text-pergamino-100',
  evento: 'bg-tinta-800 border-raiton/50 text-raiton',
  reclutamiento: 'bg-tinta-800 border-fuuton/50 text-fuuton',
  tienda: 'bg-tinta-800 border-doton/50 text-doton',
  descanso: 'bg-tinta-800 border-suiton/50 text-suiton',
  miniJefe: 'bg-sello-600/20 border-sello-500 text-sello-500',
  jefe: 'bg-sello-600 border-sello-500 text-pergamino-100',
};

const ANCHO = 640;
const ALTO_POR_PISO = 130;
const RADIO_NODO = 28;

/** Calcula la posición (x, y) de cada nodo dentro del lienzo del mapa. */
function calcularPosiciones(mapa) {
  const posiciones = {};
  const totalPisos = mapa.pisos.length;

  mapa.pisos.forEach((idsPiso, indicePiso) => {
    const y = ALTO_POR_PISO * (totalPisos - indicePiso) - ALTO_POR_PISO / 2;
    const n = idsPiso.length;
    idsPiso.forEach((id, i) => {
      const x = ANCHO * ((i + 1) / (n + 1));
      posiciones[id] = { x, y };
    });
  });

  return posiciones;
}

function NodoMapa({ nodo, posicion, disponible, visitado, esActual, onClick }) {
  const estilo = COLOR_NODO[nodo.tipo] ?? COLOR_NODO.combate;
  const icono = ICONO_NODO[nodo.tipo] ?? '?';
  const esJefe = nodo.tipo === 'jefe';

  return (
    <button
      type="button"
      disabled={!disponible}
      onClick={() => onClick(nodo.id)}
      className={[
        'absolute flex items-center justify-center border-2 font-display text-lg',
        'transition-transform duration-200',
        esJefe ? 'w-16 h-16 -mt-2 border-double border-4' : 'rounded-full w-14 h-14',
        estilo,
        disponible ? 'cursor-pointer hover:scale-110 shadow-lg shadow-black/40' : 'cursor-default opacity-50',
        esActual && 'ring-2 ring-sello-500 ring-offset-2 ring-offset-tinta-950 scale-110',
        visitado && !esActual && 'opacity-70 border-pergamino-100/20',
      ].filter(Boolean).join(' ')}
      style={{ left: posicion.x - RADIO_NODO, top: posicion.y - RADIO_NODO }}
      aria-label={`Nodo de tipo ${nodo.tipo}${disponible ? ', disponible' : ''}`}
    >
      {icono}
    </button>
  );
}

export default function MapScreen() {
  const mapa = useGameStore((s) => s.mapa);
  const nodoActualId = useGameStore((s) => s.nodoActualId);
  const avanzarANodo = useGameStore((s) => s.avanzarANodo);
  const obtenerNodosDisponibles = useGameStore((s) => s.obtenerNodosDisponibles);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);

  const posiciones = useMemo(() => (mapa ? calcularPosiciones(mapa) : {}), [mapa]);
  const disponibles = useMemo(() => new Set(obtenerNodosDisponibles()), [mapa, nodoActualId]);

  if (!mapa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay ninguna run en curso todavía.
      </div>
    );
  }

  const alturaLienzo = ALTO_POR_PISO * mapa.pisos.length;

  return (
    <div className="min-h-screen bg-tinta-950 text-pergamino-100 font-body px-4 py-8">
      <header className="max-w-2xl mx-auto mb-6 text-center">
        <p className="text-sello-500 text-xs tracking-[0.3em] uppercase mb-1">Arco actual</p>
        <h1 className="font-display text-3xl font-bold text-pergamino-100">
          {arcoActualDatos?.nombre}
        </h1>
      </header>

      <div className="max-w-2xl mx-auto overflow-x-auto">
        <div
          className="relative mx-auto"
          style={{ width: ANCHO, height: alturaLienzo }}
        >
          {/* Trazos de conexión entre nodos, dibujados antes que los nodos */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={ANCHO}
            height={alturaLienzo}
          >
            {Object.values(mapa.nodos).flatMap((nodo) =>
              nodo.conexiones.map((destinoId) => {
                const origen = posiciones[nodo.id];
                const destino = posiciones[destinoId];
                if (!origen || !destino) return null;
                const recorrido = nodo.visitado && mapa.nodos[destinoId]?.visitado;
                return (
                  <path
                    key={`${nodo.id}-${destinoId}`}
                    d={`M ${origen.x} ${origen.y} C ${origen.x} ${(origen.y + destino.y) / 2}, ${destino.x} ${(origen.y + destino.y) / 2}, ${destino.x} ${destino.y}`}
                    fill="none"
                    stroke={recorrido ? 'var(--color-sello-500)' : 'var(--color-pergamino-100)'}
                    strokeOpacity={recorrido ? 0.8 : 0.15}
                    strokeWidth={recorrido ? 2.5 : 1.5}
                  />
                );
              }),
            )}
          </svg>

          {Object.values(mapa.nodos).map((nodo) => (
            <NodoMapa
              key={nodo.id}
              nodo={nodo}
              posicion={posiciones[nodo.id]}
              disponible={disponibles.has(nodo.id)}
              visitado={nodo.visitado}
              esActual={nodo.id === nodoActualId}
              onClick={avanzarANodo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
