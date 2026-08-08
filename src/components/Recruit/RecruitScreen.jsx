import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import configGlobal from '../../data/config.json';
import { crearLuchador } from '../../engine/combat';

function encontrarBase(id) {
  return (
    personajesData.personajes.find((p) => p.id === id)
    ?? enemiesData.jefes.find((j) => j.id === id)
    ?? null
  );
}

const EMOJI_TIPO = {
  katon: '🔥',
  fuuton: '🌪️',
  raiton: '⚡',
  doton: '🪨',
  suiton: '💧',
};

const RAREZA_COLOR = {
  comun: 'text-pergamino-200/70',
  inicial: 'text-fuuton',
  raro: 'text-suiton',
  legendario: 'text-sello-500',
};

function BarraStat({ label, valor, max }) {
  const pct = Math.min(1, valor / max);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-pergamino-200/50 w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-tinta-800 rounded-full overflow-hidden">
        <div className="h-full bg-fuuton/70 rounded-full" style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-[10px] text-pergamino-200/80 w-6 text-right">{valor}</span>
    </div>
  );
}

function TarjetaPersonaje({ opcion, nivel, seleccionado, onClick }) {
  const base = useMemo(() => encontrarBase(opcion.personajeId), [opcion.personajeId]);
  const luchador = useMemo(() => (base ? crearLuchador(base, nivel) : null), [base, nivel]);

  if (!base || !luchador) return null;

  const { ataque, defensa, velocidad, hp } = luchador.statsBase;
  const maxStat = Math.max(ataque, defensa, velocidad, hp);
  const emojiTipo = EMOJI_TIPO[base.tipo] ?? '◆';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col bg-tinta-900 rounded-xl p-4 border-2 transition-all duration-200 text-left w-full
        ${seleccionado
          ? 'border-fuuton shadow-lg shadow-fuuton/20 scale-[1.02]'
          : 'border-pergamino-100/15 hover:border-pergamino-100/40 hover:bg-tinta-800'}
      `}
    >
      {/* Nombre y rareza */}
      <div className="mb-3">
        <p className="font-display text-base text-pergamino-100 leading-tight">{emojiTipo} {base.nombre}</p>
        <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${RAREZA_COLOR[opcion.rareza] ?? ''}`}>
          {opcion.rareza}
        </p>
      </div>

      {/* Nivel */}
      <p className="text-[11px] text-pergamino-200/60 font-display mb-3">Nv. {nivel}</p>

      {/* Barra de HP */}
      <div className="mb-3">
        <div className="h-2 w-full bg-tinta-800 rounded-full overflow-hidden">
          <div className="h-full bg-fuuton rounded-full w-full" />
        </div>
        <p className="text-[10px] text-pergamino-200/50 mt-0.5">{hp * nivel} / {hp * nivel} HP</p>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1 mb-3">
        <BarraStat label="ATQ" valor={ataque} max={maxStat} />
        <BarraStat label="DEF" valor={defensa} max={maxStat} />
        <BarraStat label="VEL" valor={velocidad} max={maxStat} />
        <BarraStat label="HP" valor={hp} max={maxStat} />
      </div>

      {/* Jutsu */}
      <div className="border-t border-pergamino-100/10 pt-2 mt-auto">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] font-display text-pergamino-100 truncate">{base.jutsu.nombre}</p>
          <span className="text-[10px] text-pergamino-200/60 shrink-0">{base.jutsu.danoBase} PWR</span>
        </div>
      </div>
    </button>
  );
}

/** Panel de confirmación cuando el equipo está lleno: elige a quién reemplazar. */
function PanelReemplazo({ nombreNuevo, equipo, onElegir, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-tinta-950/80 flex items-center justify-center z-50 px-4">
      <div className="bg-tinta-900 border border-pergamino-100/20 rounded-xl p-6 max-w-sm w-full">
        <p className="font-display text-pergamino-100 text-center mb-1">¿A quién reemplaza</p>
        <p className="font-display text-fuuton text-center text-lg mb-4">{nombreNuevo}?</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {equipo.map((p) => {
            const base = encontrarBase(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onElegir(p.id)}
                className="py-2 px-1 bg-tinta-800 hover:bg-sello-600/30 border border-pergamino-100/10 hover:border-sello-600/60 rounded-lg text-xs text-pergamino-100 font-display transition-colors"
              >
                {base?.nombre ?? p.id}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onCancelar}
          className="w-full text-xs text-pergamino-200/50 hover:text-pergamino-100 underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function RecruitScreen() {
  const oferta = useGameStore((s) => s.reclutarActual);
  const equipo = useGameStore((s) => s.equipo);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const elegirReclutaDeNodo = useGameStore((s) => s.elegirReclutaDeNodo);

  const [candidatoId, setCandidatoId] = useState(null);

  if (!oferta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay ningún nodo de reclutamiento activo.
      </div>
    );
  }

  const equipoLleno = equipo.length >= configGlobal.equipo.tamanoMaximo;

  function manejarClic(personajeId) {
    if (equipoLleno) {
      // Equipo lleno: mostrar picker de reemplazo antes de confirmar
      setCandidatoId(personajeId);
    } else {
      elegirReclutaDeNodo(personajeId);
      volverAlMapa();
    }
  }

  function confirmarReemplazo(idAReemplazar) {
    elegirReclutaDeNodo(candidatoId, idAReemplazar);
    setCandidatoId(null);
    volverAlMapa();
  }

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body flex flex-col items-center justify-center px-4 py-8">
      {/* Cabecera */}
      <header className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-pergamino-100 mb-1">
          ¡Ninja disponible!
        </h1>
        <p className="text-pergamino-200/60 text-sm font-display">
          {equipoLleno
            ? 'Tu equipo está completo — pulsa a uno para elegir a quién reemplaza'
            : 'Pulsa a uno de los ninjas para añadirle a tu equipo'}
        </p>
      </header>

      {/* 3 cartas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
        {oferta.personajes.length > 0 ? (
          oferta.personajes.map((opcion) => (
            <TarjetaPersonaje
              key={opcion.personajeId}
              opcion={opcion}
              nivel={oferta.nivelReclutamiento}
              seleccionado={false}
              onClick={() => manejarClic(opcion.personajeId)}
            />
          ))
        ) : (
          <p className="col-span-3 text-center text-pergamino-200/50 text-sm py-8">
            No hay ninjas disponibles para reclutar en este punto.
          </p>
        )}
      </div>

      {/* Saltar */}
      <button
        type="button"
        onClick={volverAlMapa}
        className="px-8 py-2.5 bg-tinta-800 hover:bg-tinta-700 border border-pergamino-100/20 rounded-full font-display text-pergamino-100 transition-colors text-sm tracking-widest"
      >
        SALTAR (HUIR)
      </button>

      {/* Panel de reemplazo */}
      {candidatoId && (
        <PanelReemplazo
          nombreNuevo={encontrarBase(candidatoId)?.nombre ?? candidatoId}
          equipo={equipo}
          onElegir={confirmarReemplazo}
          onCancelar={() => setCandidatoId(null)}
        />
      )}
    </div>
  );
}
