import { useMemo } from 'react';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import { crearLuchador, turnosParaCargarJutsu } from '../../engine/combat';
import HoverTooltip from './HoverTooltip';
import { emojiDeTipo } from './nombres';

function encontrarBase(id) {
  return (
    personajesData.personajes.find((p) => p.id === id)
    ?? enemiesData.jefes.find((j) => j.id === id)
    ?? null
  );
}

/**
 * Ritmo de carga del jutsu, en 3 puntitos. Es cualitativo a propósito: el
 * número exacto de turnos ("Jutsu about every 3 turns") era una ficha técnica
 * en un juego que se juega a ratos, y el ritmo real se aprende viendo la barra
 * en combate. Pero sí hace falta ALGO, porque reclutar es elegir entre tres
 * ninjas que no has visto pelear nunca: sin esto la decisión vuelve a ser solo
 * stats y el sistema de carga deja de notarse justo donde se decide.
 */
export function RitmoCarga({ luchador, className = '' }) {
  const turnos = turnosParaCargarJutsu(luchador);
  const llenos = turnos <= 2 ? 3 : turnos === 3 ? 2 : 1;
  const etiqueta = ['', 'Slow charge', 'Steady charge', 'Fast charge'][llenos];

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} title={etiqueta} aria-label={etiqueta}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < llenos ? 'bg-sello-500' : 'bg-pergamino-100/20'}`}
        />
      ))}
    </span>
  );
}

// Las transformaciones NO aparecen en ninguna tarjeta, a propósito. Se probó con
// la descripción de sus pasivas (desbordaba la tarjeta) y luego solo con el
// nombre (se truncaba: "Nine-Tails Chakra…", que no es sabor, es una tarjeta
// rota). Pero el motivo de fondo es otro: TODOS los personajes tienen
// transformación —hay un test de invariante que lo garantiza— así que decir que
// la tienen no distingue a nadie, sale igual en las 14 tarjetas.
//
// Son una sorpresa: se descubren al desbloquearlas (pantalla de transformación,
// punto 4 del roadmap), al ver saltar la pasiva en combate (punto 2), o en la
// enciclopedia si alguien quiere el detalle en frío (punto 10).

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
          {emojiDeTipo(id)} {base.nombre}
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

      {/* Solo el jutsu y su ritmo. Fuera quedaron, a propósito:
          - el ataque básico, que ahora es el mismo para todos (ver config.json);
          - el "Power N", que no es daño sino un multiplicador contra una fórmula
            interna: parece un dato comparable y no lo es;
          - la descripción del jutsu, texto narrativo que no cambia ninguna decisión.
          Todo eso es material de enciclopedia (punto 10 del roadmap). */}
      <div className="mt-2 pt-2 border-t border-pergamino-100/10 flex items-center justify-between gap-2">
        <p className="text-[11px] font-display font-bold text-pergamino-100 truncate">🌀 {base.jutsu.nombre}</p>
        <RitmoCarga luchador={luchador} className="shrink-0" />
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
