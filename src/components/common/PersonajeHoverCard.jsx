import { useMemo } from 'react';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import { crearLuchador } from '../../engine/combat';
import HoverTooltip from './HoverTooltip';

/** Busca los datos base de un personaje jugable o de un jefe, por id. */
function encontrarBase(id) {
  return (
    personajesData.personajes.find((p) => p.id === id)
    ?? enemiesData.jefes.find((j) => j.id === id)
    ?? null
  );
}

const COLOR_TIPO = {
  katon: 'bg-katon',
  fuuton: 'bg-fuuton',
  raiton: 'bg-raiton',
  doton: 'bg-doton',
  suiton: 'bg-suiton',
};

/**
 * Contenido de la ficha de un personaje/jefe: tipo de chakra, stats, HP y
 * jutsu con su poder — SIN el wrapper de hover, para poder mostrarla siempre
 * visible (p. ej. en `CharacterSelectScreen`) o dentro de `PersonajeHoverCard`
 * indistintamente. Devuelve `null` si el id no se encuentra en
 * characters.json ni en los jefes de enemies.json.
 *
 * Si se pasa `nivel`, las stats se calculan escaladas a ese nivel (motor
 * puro, `crearLuchador`); si no, se muestran las stats base (nivel 1).
 */
export function FichaPersonaje({ id, nivel, hpActual, hpMaximo, className = '' }) {
  const base = useMemo(() => encontrarBase(id), [id]);
  const luchador = useMemo(() => (base ? crearLuchador(base, nivel ?? 1) : null), [base, nivel]);

  if (!base || !luchador) return null;

  const hpMostrado = hpMaximo ?? luchador.hpMaximo;
  const hpActualMostrado = hpActual ?? luchador.hpActual;
  const porcentajeHp = Math.max(0, Math.min(1, hpActualMostrado / hpMostrado));

  return (
    <div className={`bg-pergamino-100 text-tinta-950 rounded-lg text-left ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-bold text-sm">{base.nombre}</p>
        {nivel != null && <p className="text-[10px] opacity-60 shrink-0">Nv. {nivel}</p>}
      </div>
      <span
        className={`inline-block text-[10px] uppercase tracking-wide text-pergamino-100 rounded-full px-2 py-0.5 mt-1 ${COLOR_TIPO[base.tipo] ?? 'bg-tinta-800'}`}
      >
        {base.tipo}
      </span>

      <div className="mt-2">
        <div className="h-1.5 w-full bg-tinta-950/20 rounded-full overflow-hidden">
          <div className="h-full bg-fuuton" style={{ width: `${porcentajeHp * 100}%` }} />
        </div>
        <p className="text-[10px] mt-0.5 opacity-70">{Math.max(0, hpActualMostrado)} / {hpMostrado} HP</p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-[11px]">
        <span>ATQ {luchador.statsBase.ataque}</span>
        <span>DEF {luchador.statsBase.defensa}</span>
        <span>VEL {luchador.statsBase.velocidad}</span>
        <span>HP {luchador.statsBase.hp}</span>
      </div>

      <div className="mt-2 pt-2 border-t border-tinta-950/10">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-display font-bold">{base.jutsu.nombre}</p>
          <p className="text-[10px] text-sello-600 font-display shrink-0">Poder {base.jutsu.danoBase}</p>
        </div>
        <p className="text-[10px] opacity-70 mt-0.5">{base.jutsu.descripcion}</p>
      </div>
    </div>
  );
}

/**
 * Envuelve cualquier trigger (icono, botón, tarjeta...) y muestra al hacer
 * hover la `FichaPersonaje` completa — igual que la tarjeta de detalle de un
 * Pokelike. Usa un "named group" de Tailwind (group/hover) para no chocar
 * con otros `group` que ya pueda tener el elemento envuelto.
 */
export default function PersonajeHoverCard({
  id,
  nivel,
  hpActual,
  hpMaximo,
  posicion = 'derecha',
  className = 'inline-block',
  children,
}) {
  // Sin datos completos (p. ej. un enemigo común sin ficha propia): ni
  // wrapper ni tooltip, se devuelve el trigger tal cual, sin efecto alguno.
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
          className="w-56 border-2 border-sello-600 shadow-xl p-3"
        />
      )}
    >
      {children}
    </HoverTooltip>
  );
}
