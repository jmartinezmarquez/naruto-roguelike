import { useMaestria } from './nivelDeNinja';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { aspectosDesbloqueados } from '../../engine/maestria';
import { aspectosDibujados, spriteDeAspecto, spriteBaseDeLuchador, spriteDeUltimate } from './characterSprites';
import ultimatesData from '../../data/ultimates.json';
import maestriaData from '../../data/maestria.json';

/**
 * "Ninja Lv.4 · Genin of the Leaf". Nada mientras siga en el nivel 1 sin título: una
 * insignia de nivel 1 en todas las tarjetas sería ruido, no progreso.
 */
export function InsigniaMaestria({ id, className = '' }) {
  const { nivel, titulo } = useMaestria(id);
  if (nivel <= 1 && !titulo) return null;
  return (
    <p className={`text-[9px] text-center leading-relaxed ${className}`}>
      <span className="font-display text-oro">Ninja Lv.{nivel}</span>
      {titulo && <span className="text-pergamino-200/80"> · {titulo}</span>}
    </p>
  );
}

/**
 * Elegir el aspecto de un ninja: el de siempre y cada aspecto alternativo que tenga
 * DIBUJADO. Los que aún no ha desbloqueado salen apagados, con el nivel que piden. Si
 * el ninja no tiene ningún aspecto dibujado no se pinta nada: un selector con una
 * sola opción no es una elección.
 */
export function SelectorAspecto({ id }) {
  const { nivel } = useMaestria(id);
  const elegido = useAchievementsStore((s) => s.aspectosElegidos[id] ?? 0);
  const elegirAspecto = useAchievementsStore((s) => s.elegirAspecto);
  const tieneUltimate = useAchievementsStore((s) => (s.invocacion.ultimates ?? []).includes(id));
  const dibujados = aspectosDibujados(id);
  const ultimate = ultimatesData.ultimates[id] && spriteDeUltimate(id) ? 'ultimate' : null;
  if (dibujados.length === 0 && !ultimate) return null;
  const abiertos = aspectosDesbloqueados(nivel, maestriaData);
  // La Ultimate va la última, y solo para quien la tiene: sale del gacha, no del nivel.
  const opciones = [0, ...dibujados, ...(ultimate ? [ultimate] : [])];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[9px] text-pergamino-200/70 font-display">Outfit</p>
      <div className="flex gap-2" role="radiogroup" aria-label="Outfit">
        {opciones.map((n) => {
          const esUltimate = n === 'ultimate';
          const abierto = n === 0 || (esUltimate ? tieneUltimate : abiertos.includes(n));
          const sprite = n === 0 ? spriteBaseDeLuchador(id) : esUltimate ? spriteDeUltimate(id) : spriteDeAspecto(id, n);
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={elegido === n}
              aria-label={n === 0 ? 'Default outfit' : esUltimate ? `Ultimate: ${ultimatesData.ultimates[id]}` : `Outfit ${n}`}
              disabled={!abierto}
              onClick={() => elegirAspecto(id, n)}
              title={esUltimate ? `Ultimate · ${ultimatesData.ultimates[id]}${abierto ? '' : ' (summon only)'}`
                : abierto ? undefined : `Ninja Lv.${maestriaData.aspectos[n]}`}
              className={[
                'w-12 h-12 border-2 rounded-sm flex items-center justify-center',
                // La Ultimate, en carmesí: el color que no usa ninguna otra rareza.
                esUltimate ? (elegido === n ? 'border-[#c0202a] shadow-[0_0_10px_rgba(192,32,42,0.7)]' : 'border-[#c0202a]/60')
                  : elegido === n ? 'border-oro' : 'border-marco',
                abierto ? 'hover:border-pergamino-200/60' : 'opacity-40 cursor-not-allowed',
              ].join(' ')}
            >
              {sprite && <img src={sprite} alt="" className={`w-10 h-10 ${abierto ? '' : 'brightness-0'}`} style={{ imageRendering: 'pixelated' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

