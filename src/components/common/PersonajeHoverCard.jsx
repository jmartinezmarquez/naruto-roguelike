import { useMemo } from 'react';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import { crearLuchador, turnosParaCargarJutsu } from '../../engine/combat';
import HoverTooltip from './HoverTooltip';

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

export function FichaPersonaje({ id, nivel, hpActual, hpMaximo, className = '' }) {
  const base = useMemo(() => encontrarBase(id), [id]);
  const luchador = useMemo(() => (base ? crearLuchador(base, nivel ?? 1) : null), [base, nivel]);

  if (!base || !luchador) return null;

  const hpMostrado = hpMaximo ?? luchador.hpMaximo;
  const hpActualMostrado = hpActual ?? luchador.hpActual;
  const porcentajeHp = Math.max(0, Math.min(1, hpActualMostrado / hpMostrado));

  return (
    <div className={`bg-tinta-900 text-pergamino-100 rounded-lg text-left border border-pergamino-100/15 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-bold text-sm leading-tight">
          {EMOJI_TIPO[base.tipo] ?? ''} {base.nombre}
        </p>
        {nivel != null && <p className="text-[10px] text-pergamino-200/50 shrink-0">Lv. {nivel}</p>}
      </div>

      <div className="mt-2">
        <div className="h-1.5 w-full bg-tinta-800 rounded-full overflow-hidden">
          <div className="h-full bg-fuuton rounded-full" style={{ width: `${porcentajeHp * 100}%` }} />
        </div>
        <p className="text-[10px] mt-0.5 text-pergamino-200/50">{Math.max(0, hpActualMostrado)} / {hpMostrado} HP</p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-[11px] text-pergamino-200/70">
        <span>ATK {luchador.statsBase.ataque}</span>
        <span>DEF {luchador.statsBase.defensa}</span>
        <span>SPD {luchador.statsBase.velocidad}</span>
        <span>HP {luchador.statsBase.hp}</span>
      </div>

      <div className="mt-2 pt-2 border-t border-pergamino-100/10">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] text-pergamino-200/70">{luchador.ataqueBasico.nombre}</p>
          <p className="text-[10px] text-pergamino-200/40 font-display shrink-0">
            Power {luchador.ataqueBasico.danoBase}
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <p className="text-[11px] font-display font-bold text-pergamino-100">🌀 {base.jutsu.nombre}</p>
          <p className="text-[10px] text-pergamino-200/50 font-display shrink-0">Power {base.jutsu.danoBase}</p>
        </div>
        {/* El ritmo de carga es lo que diferencia a un personaje de otro, así
            que va en la ficha: sin esto no hay forma de saber que Rock Lee
            lanza su jutsu el doble de a menudo que Shikamaru. */}
        <p className="text-[10px] text-sello-500/80 mt-0.5">
          Jutsu about every {turnosParaCargarJutsu(luchador)} turns
        </p>
        {/* Sin la descripción del jutsu a propósito: ocupaba media tarjeta para
            contar algo narrativo que no cambia ninguna decisión. Lo que importa
            aquí es potencia y ritmo; el texto de sabor irá en la enciclopedia. */}
      </div>
    </div>
  );
}

export default function PersonajeHoverCard({
  id,
  nivel,
  hpActual,
  hpMaximo,
  posicion = 'derecha',
  className = 'inline-block',
  children,
}) {
  if (!encontrarBase(id)) return children;

  return (
    <HoverTooltip
      posicion={posicion}
      className={className}
      contenido={(
        <FichaPersonaje
          id={id}
          nivel={nivel}
          hpActual={hpActual}
          hpMaximo={hpMaximo}
          className="w-56 shadow-xl p-3"
        />
      )}
    >
      {children}
    </HoverTooltip>
  );
}
