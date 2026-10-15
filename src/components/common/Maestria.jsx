import { useMaestria } from './nivelDeNinja';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { aspectosDesbloqueados } from '../../engine/maestria';
import { aspectosDibujados, spriteDeAspecto, spriteBaseDeLuchador } from './characterSprites';
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
  const dibujados = aspectosDibujados(id);
  if (dibujados.length === 0) return null;
  const abiertos = aspectosDesbloqueados(nivel, maestriaData);
  const opciones = [0, ...dibujados];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[9px] text-pergamino-200/70 font-display">Outfit</p>
      <div className="flex gap-2" role="radiogroup" aria-label="Outfit">
        {opciones.map((n) => {
          const abierto = n === 0 || abiertos.includes(n);
          const sprite = n === 0 ? spriteBaseDeLuchador(id) : spriteDeAspecto(id, n);
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={elegido === n}
              aria-label={n === 0 ? 'Default outfit' : `Outfit ${n}`}
              disabled={!abierto}
              onClick={() => elegirAspecto(id, n)}
              title={abierto ? undefined : `Ninja Lv.${maestriaData.aspectos[n]}`}
              className={[
                'w-12 h-12 border-2 rounded-sm flex items-center justify-center',
                elegido === n ? 'border-oro' : 'border-marco',
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

