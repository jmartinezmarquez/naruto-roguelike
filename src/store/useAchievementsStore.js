// src/store/useAchievementsStore.js
// Meta-progresión entre runs: qué logros están desbloqueados. Vive en un
// store separado de useGameStore porque sobrevive a un game over o a
// reiniciarRun — es la run la que es efímera, no esto. Persiste en su propia
// clave de localStorage, igual que guardarRun/cargarRun en useGameStore.

import { create } from 'zustand';

import achievementsData from '../data/achievements.json';
import { evaluarLogrosDesbloqueables } from '../engine/achievements';

const CLAVE_STORAGE = 'naruto-roguelike-logros';

export const useAchievementsStore = create((set, get) => ({
  logrosDesbloqueados: [], // array de ids de logros — cargarLogros() los rellena desde localStorage
  notificacionesPendientes: [], // cola de logros (objetos completos) recién desbloqueados, para el toast — ver LogroToast

  /** Carga los logros ya desbloqueados en sesiones anteriores. Llamar una vez al arrancar la app. */
  cargarLogros() {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) return;
    set({ logrosDesbloqueados: JSON.parse(guardado) });
  },

  /**
   * Evalúa el contexto de un evento de juego (jefe derrotado, arco
   * completado...) contra todos los logros y desbloquea los que
   * correspondan, persistiendo el resultado. Devuelve los logros recién
   * desbloqueados, pero NO los encola como notificación — eso es aparte
   * (ver `notificar`), porque el desbloqueo puede ocurrir antes de que la UI
   * termine de mostrar lo que lo causó (p. ej. la animación de un combate) y
   * el toast no debe saltar hasta que eso termine.
   */
  evaluarLogros(contexto) {
    const { logrosDesbloqueados } = get();
    const nuevos = evaluarLogrosDesbloqueables(achievementsData.logros, logrosDesbloqueados, contexto);
    if (nuevos.length === 0) return [];

    const actualizados = [...logrosDesbloqueados, ...nuevos.map((l) => l.id)];
    set({ logrosDesbloqueados: actualizados });
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(actualizados));
    return nuevos;
  },

  estaDesbloqueado(idLogro) {
    return get().logrosDesbloqueados.includes(idLogro);
  },

  /** Encola logros ya desbloqueados para el toast. La UI decide cuándo es buen momento para llamarlo. */
  notificar(logros) {
    if (logros.length === 0) return;
    set((estado) => ({ notificacionesPendientes: [...estado.notificacionesPendientes, ...logros] }));
  },

  /** Quita la notificación más antigua de la cola (el toast la llama tras mostrarse). */
  descartarNotificacion() {
    set((estado) => ({ notificacionesPendientes: estado.notificacionesPendientes.slice(1) }));
  },

  // TEMPORAL: solo para probar el desbloqueo en desarrollo (botón en
  // AchievementsScreen). Quitar cuando el sistema esté verificado.
  reiniciarLogros() {
    set({ logrosDesbloqueados: [], notificacionesPendientes: [] });
    localStorage.removeItem(CLAVE_STORAGE);
  },
}));
