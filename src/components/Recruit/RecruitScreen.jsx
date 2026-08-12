import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import configGlobal from '../../data/config.json';
import { crearLuchador } from '../../engine/combat';
import { RitmoCarga } from '../common/PersonajeHoverCard';
import { spriteDeCombate } from '../common/datosDeLuchador';

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

const RAREZA_LABEL = {
  comun: 'Common',
  inicial: 'Starter',
  raro: 'Rare',
  legendario: 'Legendary',
};

// Rótulo de la pantalla según el pergamino que había en el mapa. Es la única
// forma que tiene el jugador de confirmar que el nodo dorado que ha elegido es
// el que ha abierto — ver documentacion/28-nodo-reclutar.md.
const CABECERA_POR_RAREZA = {
  comun: { titulo: 'Ninja Available!', color: 'text-pergamino-100' },
  legendario: { titulo: 'Legendary Challenge', color: 'text-raiton' },
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
        elevar-hover flex flex-col bg-tinta-900 rounded-xl p-4 border-2 text-left w-full
        ${seleccionado
          ? 'border-fuuton shadow-lg shadow-fuuton/20'
          : 'border-pergamino-100/15 hover:border-pergamino-100/40 hover:bg-tinta-800 hover:shadow-lg hover:shadow-black/40'}
      `}
    >
      <div className="mb-3">
        <p className="font-display text-base text-pergamino-100 leading-tight">{emojiTipo} {base.nombre}</p>
        <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${RAREZA_COLOR[opcion.rareza] ?? ''}`}>
          {RAREZA_LABEL[opcion.rareza] ?? opcion.rareza}
        </p>
      </div>

      <p className="text-[11px] text-pergamino-200/60 font-display mb-3">Lv. {nivel}</p>

      <div className="mb-3">
        <div className="h-2 w-full bg-tinta-800 rounded-full overflow-hidden">
          <div className="h-full bg-fuuton rounded-full w-full" />
        </div>
        <p className="text-[10px] text-pergamino-200/50 mt-0.5">{hp * nivel} / {hp * nivel} HP</p>
      </div>

      <div className="flex flex-col gap-1 mb-3">
        <BarraStat label="ATK" valor={ataque} max={maxStat} />
        <BarraStat label="DEF" valor={defensa} max={maxStat} />
        <BarraStat label="SPD" valor={velocidad} max={maxStat} />
        <BarraStat label="HP" valor={hp} max={maxStat} />
      </div>

      <div className="border-t border-pergamino-100/10 pt-2 mt-auto flex items-center justify-between gap-1">
        <p className="text-[11px] font-display text-pergamino-100 truncate">🌀 {base.jutsu.nombre}</p>
        <RitmoCarga luchador={luchador} className="shrink-0" />
      </div>
      {/* Sin transformación en la tarjeta: son una sorpresa, y además las tienen
          todos, así que no distinguirían a un candidato de otro. Ver
          documentacion/30-sistema-de-pasivas.md. */}
    </button>
  );
}

/**
 * La ficha del pergamino dorado. Es una tarjeta aparte y no una variante de
 * `TarjetaPersonaje` porque no es una carta que se elige entre tres: es un rival
 * al que hay que mirar antes de decidir si te metes. Por eso lleva sprite grande,
 * el nivel al que va a pelear y el aviso de lo que pasa si pierdes — todo lo que
 * hace falta para que aceptar sea una decisión informada y no una sorpresa.
 */
function TarjetaDesafio({ opcion, nivelDesafio }) {
  const base = useMemo(() => encontrarBase(opcion.personajeId), [opcion.personajeId]);
  const luchador = useMemo(
    () => (base ? crearLuchador(base, nivelDesafio) : null),
    [base, nivelDesafio],
  );
  const sprite = spriteDeCombate(opcion.personajeId, nivelDesafio);

  if (!base || !luchador) return null;

  const { ataque, defensa, velocidad, hp } = luchador.statsBase;
  const maxStat = Math.max(ataque, defensa, velocidad, hp);
  const emojiTipo = EMOJI_TIPO[base.tipo] ?? '◆';

  return (
    <div className="bg-tinta-900 border-2 border-raiton/60 rounded-xl p-5 shadow-lg shadow-raiton/10 w-full max-w-md">
      <div className="flex items-center gap-4 mb-4">
        {sprite && (
          <img
            src={sprite}
            alt={base.nombre}
            className="w-24 h-24 shrink-0"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div className="min-w-0">
          <p className="font-display text-lg text-pergamino-100 leading-tight">
            {emojiTipo} {base.nombre}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-1 ${RAREZA_COLOR.legendario}`}>
            {RAREZA_LABEL.legendario}
          </p>
          <p className="text-[11px] text-pergamino-200/60 font-display mt-2">
            Lv. {nivelDesafio} · {luchador.hpMaximo} HP
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <BarraStat label="ATK" valor={ataque} max={maxStat} />
        <BarraStat label="DEF" valor={defensa} max={maxStat} />
        <BarraStat label="SPD" valor={velocidad} max={maxStat} />
        <BarraStat label="HP" valor={hp} max={maxStat} />
      </div>

      <div className="border-t border-pergamino-100/10 pt-2 flex items-center justify-between gap-1">
        <p className="text-[11px] font-display text-pergamino-100 truncate">🌀 {base.jutsu.nombre}</p>
        <RitmoCarga luchador={luchador} className="shrink-0" />
      </div>
    </div>
  );
}

function PanelReemplazo({ nombreNuevo, equipo, onElegir, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-tinta-950/80 flex items-center justify-center z-50 px-4">
      <div className="bg-tinta-900 border border-pergamino-100/20 rounded-xl p-6 max-w-sm w-full">
        <p className="font-display text-pergamino-100 text-center mb-1">Who does</p>
        <p className="font-display text-fuuton text-center text-lg mb-4">{nombreNuevo} replace?</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {equipo.map((p) => {
            const base = encontrarBase(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onElegir(p.id)}
                className="elevar-hover py-2 px-1 bg-tinta-800 hover:bg-sello-600/30 border border-pergamino-100/10 hover:border-sello-600/60 rounded-lg text-xs text-pergamino-100 font-display"
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
          Cancel
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
  const iniciarDesafioLegendario = useGameStore((s) => s.iniciarDesafioLegendario);

  const [candidatoId, setCandidatoId] = useState(null);

  if (!oferta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No active recruit node.
      </div>
    );
  }

  const equipoLleno = equipo.length >= configGlobal.equipo.tamanoMaximo;
  const cabecera = CABECERA_POR_RAREZA[oferta.rareza] ?? CABECERA_POR_RAREZA.comun;
  // Tres estados de la misma pantalla: la elección de siempre, el desafío
  // legendario antes de pelear, y el mismo desafío ya ganado (el ninja se ha
  // ganado a pulso y ahora sí se recluta).
  const desafioPendiente = oferta.esDesafio && !oferta.desafioGanado;
  const desafioGanado = oferta.esDesafio && oferta.desafioGanado;
  const rival = oferta.personajes[0] ?? null;

  function manejarClic(personajeId) {
    if (equipoLleno) {
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
      <header className="text-center mb-8">
        <h1 className={`font-display text-3xl font-bold mb-1 ${cabecera.color}`}>
          {desafioGanado ? 'They Yield' : cabecera.titulo}
        </h1>
        <p className="text-pergamino-200/60 text-sm font-display">
          {desafioPendiente
            ? 'Beat them in combat and they will join you'
            : desafioGanado
              ? equipoLleno
                ? 'Choose who steps aside to make room'
                : 'A legendary ninja joins your team'
              : equipoLleno
                ? 'Your team is full — tap one to choose who they replace'
                : 'Tap a ninja to add them to your team'}
        </p>
      </header>

      {oferta.esDesafio && rival ? (
        <div className="flex flex-col items-center gap-5 mb-8">
          <TarjetaDesafio opcion={rival} nivelDesafio={oferta.nivelDesafio} />
          {desafioPendiente ? (
            <>
              {/* El aviso va en rojo y sin rodeos: aceptar puede terminar la run
                  ahí mismo, y el jugador tiene que saberlo ANTES de pulsar. */}
              <p className="text-sello-500 text-xs text-center max-w-md leading-relaxed">
                Your whole team fights them in a row, with the HP they have now.
                If everyone falls, the run ends.
              </p>
              <button
                type="button"
                onClick={iniciarDesafioLegendario}
                className="elevar-hover px-10 py-3 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 tracking-widest"
              >
                FIGHT
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => manejarClic(rival.personajeId)}
              className="elevar-hover px-10 py-3 bg-fuuton hover:brightness-110 rounded-full font-display text-tinta-950 tracking-widest"
            >
              RECRUIT
            </button>
          )}
        </div>
      ) : (
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
              No ninjas available to recruit here.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={volverAlMapa}
        className="px-8 py-2.5 bg-tinta-800 hover:bg-tinta-700 border border-pergamino-100/20 rounded-full font-display text-pergamino-100 transition-colors text-sm tracking-widest"
      >
        {desafioPendiente ? 'WALK AWAY' : 'SKIP'}
      </button>

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
