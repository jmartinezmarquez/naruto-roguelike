// Los rangos del punto 19 del roadmap: la tabla de color y el cálculo del rango
// ninja. Ver `engine/achievements.js` para el porqué de la escala y
// documentacion/18-sistema-de-logros.md.
//
// Vive en un `.js` aparte del `.jsx` que lo pinta por la misma razón que
// `itemSprites.js` está separado de `ItemHoverCard.jsx`: un fichero que exporta
// componentes Y constantes rompe el fast refresh de Vite, y el lint lo prohíbe.
import { useAchievementsStore } from '../../store/useAchievementsStore';
import achievementsData from '../../data/achievements.json';
import { puntosAcumulados, puntosMaximos, rangoNinja } from '../../engine/achievements';

/**
 * **La rampa de color no se inventa aquí**: es la misma que el juego ya usa para
 * la rareza de los objetos (`COLOR_RAREZA` en `itemSprites.js` — común verde,
 * raro azul, legendario rojo), extendida por los dos extremos con el apagado de
 * lo corriente y el oro de la cima. Dos escalas de "esto es mejor que aquello"
 * con colores distintos serían dos idiomas para la misma frase.
 *
 * ⚠️ `fijo` marca si el relleno sigue al tema o no, y de ahí sale si la letra
 * lleva `contorno-fijo`. El contorno de `font-naruto` es el negativo del
 * RELLENO, no del fondo (ver documentacion/33-direccion-visual.md), y el rango D
 * se pinta con un token que SÍ se invierte: fijarle el contorno lo dejaría
 * ilegible en modo claro.
 */
export const COLOR_RANGO = {
  D: { texto: 'text-pergamino-200/55', fijo: false },
  C: { texto: 'text-exito', fijo: true },
  B: { texto: 'text-suiton', fijo: true },
  A: { texto: 'text-sello-500', fijo: true },
  S: { texto: 'text-oro', fijo: true },
};

/**
 * En qué rango ninja va el jugador. Lee el store porque lo pintan tres pantallas
 * y duplicar el cálculo en las tres es cómo se acaba con tres respuestas.
 *
 * ⚠️ **No se guarda nada: se DERIVA** de los logros ya persistidos. Un dato
 * derivado que además se guarda es un dato que se puede desincronizar — y se
 * desincronizaría justo al reiniciar la meta-progresión, que es cuando más se
 * nota.
 */
export function useRangoNinja() {
  const logrosDesbloqueados = useAchievementsStore((s) => s.logrosDesbloqueados);
  const logros = achievementsData.logros;
  return { ...rangoNinja(puntosAcumulados(logros, logrosDesbloqueados)), maximo: puntosMaximos(logros) };
}
