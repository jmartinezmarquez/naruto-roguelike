// El nivel de ninja (maestría) visto desde la interfaz. Aparte de Maestria.jsx (y
// con otro nombre: en Windows maestria.js y Maestria.jsx serían el mismo fichero)
// porque un fichero de componentes que también exporta funciones rompe la recarga
// en caliente de Vite (regla react-refresh/only-export-components).
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { nivelDeMaestria, tituloDeMaestria } from '../../engine/maestria';
import configGlobal from '../../data/config.json';
import maestriaData from '../../data/maestria.json';

/**
 * El nivel de ninja de un personaje: { nivel, titulo, conMarco }. Lee la
 * meta-progresión, así que vale para cualquier pantalla. Ver documentacion/42.
 */
export function useMaestria(id) {
  const xp = useAchievementsStore((s) => s.maestria[id] ?? 0);
  const { nivel } = nivelDeMaestria(xp, configGlobal.maestria);
  return {
    nivel,
    titulo: tituloDeMaestria(id, nivel, maestriaData),
    conMarco: nivel >= maestriaData.nivelMarco,
  };
}

/** Clase del marco dorado de maestría, para la tarjeta que envuelve a un ninja. */
export const CLASE_MARCO_MAESTRIA = 'ring-2 ring-oro shadow-[0_0_12px_rgba(212,169,58,0.55)]';
