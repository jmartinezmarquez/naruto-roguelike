import { useMaestria } from './nivelDeNinja';

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
