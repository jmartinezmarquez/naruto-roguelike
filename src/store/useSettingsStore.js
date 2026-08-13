// src/store/useSettingsStore.js
// Preferencias del jugador (punto 14 del roadmap — ver documentacion/34-ajustes.md).
//
// Store propio y no uno de los dos que ya había, por descarte razonado:
//   - `useGameStore` muere con la run, y el tema no puede reiniciarse al perder;
//   - `useAchievementsStore` sobrevive, pero es PROGRESIÓN. Lo que has desbloqueado
//     y cómo prefieres ver el juego son dos cosas distintas, y mezclarlas haría que
//     "reiniciar la meta-progresión" te cambiara también el tema.
//
// **Este store no toca el DOM.** Aplicar el tema y la velocidad es un efecto de
// `App.jsx` (`useEffect` sobre `document.documentElement`), por dos razones: el
// store se mantiene puro y testeable, y los tests corren con
// `environment: 'node'` — no hay `document`, así que un store que lo tocara
// reventaría al importarlo.

import { create } from 'zustand';

const CLAVE_STORAGE = 'naruto-roguelike-ajustes';

/**
 * Los valores de partida. Exportado para que los tests puedan volver al estado
 * limpio sin duplicar la lista, igual que `VISTOS_VACIO`.
 *
 * `saltarTransformacion` arranca en `false` **a propósito**: la pantalla de
 * transformación es el único sitio donde el jugador se entera de que las
 * transformaciones existen (ver documentacion/30-sistema-de-pasivas.md), así que
 * saltarla solo tiene sentido para quien ya las conoce.
 */
export const AJUSTES_POR_DEFECTO = {
  tema: 'oscuro', // 'oscuro' | 'claro'
  velocidadCombate: 'normal', // 'normal' | 'rapida' | 'instantanea'
  saltarTransformacion: false,
};

/**
 * Cuánto se multiplica la duración de cada animación de combate. Un solo número
 * gobierna los DOS relojes —las duraciones de `index.css` y las constantes `MS_*`
 * de JS— que hasta ahora estaban escritos por separado y había que acordarse de
 * cambiar en ambos sitios.
 *
 * `instantanea` es 0, pero no se implementa poniendo las animaciones a 0 ms: eso
 * seguiría avanzando golpe a golpe, solo muy rápido. Lo que hace es resolver la
 * ronda de golpe, reutilizando lo mismo que el botón "Skip animation".
 */
export const FACTOR_ANIMACION = {
  normal: 1,
  rapida: 0.5,
  instantanea: 0,
};

export const useSettingsStore = create((set, get) => ({
  ...AJUSTES_POR_DEFECTO,

  /** Carga las preferencias de sesiones anteriores. Llamar una vez al arrancar la app. */
  cargarAjustes() {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) return;
    // Se mezcla con los valores por defecto para que añadir un ajuste nuevo no
    // rompa la configuración guardada por una versión anterior: la clave que falte
    // sale con su valor de partida en vez de `undefined`. Mismo cuidado que con
    // las categorías de `vistos`.
    set({ ...AJUSTES_POR_DEFECTO, ...JSON.parse(guardado) });
  },

  /**
   * Cambia un ajuste y lo persiste. Uno solo por llamada: son interruptores
   * independientes y no hay ninguna pantalla que cambie dos a la vez.
   */
  cambiarAjuste(clave, valor) {
    if (!Object.hasOwn(AJUSTES_POR_DEFECTO, clave)) {
      throw new Error(`Ajuste desconocido: "${clave}". Válidos: ${Object.keys(AJUSTES_POR_DEFECTO).join(', ')}`);
    }
    set({ [clave]: valor });
    const { tema, velocidadCombate, saltarTransformacion } = get();
    localStorage.setItem(
      CLAVE_STORAGE,
      JSON.stringify({ tema, velocidadCombate, saltarTransformacion }),
    );
  },

  /** El multiplicador de duración que toca ahora mismo. */
  factorAnimacion() {
    return FACTOR_ANIMACION[get().velocidadCombate] ?? 1;
  },
}));

/**
 * El factor de animación como valor suscrito, para los componentes que temporizan
 * con `setTimeout` en vez de con CSS (la pantalla de combate y la de
 * transformación). Se devuelve el número y no la función `factorAnimacion` para
 * que el selector compare valores: con la función, cada render vería una
 * referencia nueva.
 */
export function useFactorAnimacion() {
  return useSettingsStore((estado) => FACTOR_ANIMACION[estado.velocidadCombate] ?? 1);
}
