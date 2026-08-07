import { useMemo } from 'react';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import { crearLuchador, calcularDano } from '../../engine/combat';

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

const POSICION_CLASES = {
  derecha: 'left-full ml-2 top-0',
  izquierda: 'right-full mr-2 top-0',
};

/**
 * Envuelve cualquier trigger (icono, botón, tarjeta...) y muestra al hacer
 * hover una tarjeta con las estadísticas completas del personaje: tipo de
 * chakra, stats, jutsu y HP — igual que la tarjeta de detalle de un Pokelike.
 * Usa un "named group" de Tailwind (group/hover) para no chocar con otros
 * `group` que ya pueda tener el elemento envuelto.
 *
 * Si se pasa `nivel`, las stats se calculan escaladas a ese nivel (motor
 * puro, `crearLuchador`); si no, se muestran las stats base (nivel 1).
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
  const base = useMemo(() => encontrarBase(id), [id]);

  const luchador = useMemo(() => {
    if (!base) return null;
    return crearLuchador(base, nivel ?? 1);
  }, [base, nivel]);

  if (!base || !luchador) return children;

  // Daño de referencia del jutsu: contra un rival de su mismo tipo y stats
  // (mejor esfuerzo sin un rival real concreto) — mismo cálculo que usa el
  // motor en combate de verdad (engine/combat.js → calcularDano), así el
  // número no es un valor inventado aparte, es "lo que le harías a alguien
  // igual que tú".
  const danoReferencia = calcularDano(luchador, luchador, base.jutsu).cantidad;

  const hpMostrado = hpMaximo ?? luchador.hpMaximo;
  const hpActualMostrado = hpActual ?? luchador.hpActual;
  const porcentajeHp = Math.max(0, Math.min(1, hpActualMostrado / hpMostrado));

  return (
    <div className={`relative group/hover ${className}`}>
      {children}
      <div
        className={[
          'absolute z-40 w-56 opacity-0 scale-95 pointer-events-none origin-left',
          'group-hover/hover:opacity-100 group-hover/hover:scale-100 transition-all duration-150',
          POSICION_CLASES[posicion] ?? POSICION_CLASES.derecha,
        ].join(' ')}
      >
        <div className="bg-pergamino-100 text-tinta-950 border-2 border-sello-600 rounded-lg p-3 shadow-xl text-left">
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
              <p className="text-[10px] text-sello-600 font-display shrink-0">~{danoReferencia} dmg</p>
            </div>
            <p className="text-[10px] opacity-70 mt-0.5">{base.jutsu.descripcion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
