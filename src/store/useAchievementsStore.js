// src/store/useAchievementsStore.js
// Meta-progresión entre runs: qué logros están desbloqueados. Vive en un
// store separado de useGameStore porque sobrevive a un game over o a
// reiniciarRun — es la run la que es efímera, no esto. Persiste en su propia
// clave de localStorage, igual que guardarRun/cargarRun en useGameStore.

import { create } from 'zustand';

import achievementsData from '../data/achievements.json';
import { evaluarLogrosDesbloqueables } from '../engine/achievements';

const CLAVE_STORAGE = 'naruto-roguelike-logros';
const CLAVE_VISTOS = 'naruto-roguelike-vistos';

/**
 * Las cuatro categorías del registro de "visto" de la enciclopedia. Están aquí y
 * no en el componente porque son la forma del dato persistido: cambiar una
 * invalida lo que el jugador ya tenga guardado.
 *
 * Las claves de `modos` llevan el índice del modo dentro de su personaje
 * (`naruto_1`), la misma convención que `spriteDeModo` — un modo no tiene id
 * propio en los JSON.
 */
export const VISTOS_VACIO = { personajes: [], enemigos: [], modos: [], objetos: [] };

export const useAchievementsStore = create((set, get) => ({
  logrosDesbloqueados: [], // array de ids de logros — cargarLogros() los rellena desde localStorage
  notificacionesPendientes: [], // cola de logros (objetos completos) recién desbloqueados, para el toast — ver LogroToast

  // Registro de lo que el jugador ha visto en juego, para la enciclopedia (punto
  // 10 del roadmap). Vive en ESTE store y no en useGameStore porque tiene que
  // sobrevivir a perder la run: es meta-progresión, como los logros. Si viviera
  // en la run, un game over borraría la enciclopedia entera.
  vistos: VISTOS_VACIO,

  /** Carga los logros ya desbloqueados en sesiones anteriores. Llamar una vez al arrancar la app. */
  cargarLogros() {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado) set({ logrosDesbloqueados: JSON.parse(guardado) });

    // El registro de vistos se carga aquí y no en su propia función para que
    // quien arranca la app no tenga que acordarse de dos llamadas. Se mezcla con
    // VISTOS_VACIO para que añadir una categoría nueva en el futuro no rompa lo
    // guardado por una versión anterior.
    const vistosGuardados = localStorage.getItem(CLAVE_VISTOS);
    if (vistosGuardados) set({ vistos: { ...VISTOS_VACIO, ...JSON.parse(vistosGuardados) } });
  },

  /**
   * Apunta entradas como vistas en la enciclopedia y lo persiste. Recibe un lote
   * (`{ personajes, enemigos, modos, objetos }`, todas opcionales) en vez de un
   * id suelto porque quien llama suele tener varias cosas a la vez —el equipo
   * entero, el enemigo y su modo— y así se escribe en `localStorage` una sola vez.
   *
   * Es **idempotente**: deduplica y no toca el estado si no hay nada nuevo. Eso
   * es lo que permite llamarlo desde muchos sitios sin pensar, incluido un
   * catch-all al abrir la pantalla, sin provocar renders en bucle.
   */
  registrarVistos(lote) {
    const actuales = get().vistos;
    let hayNovedad = false;
    const siguiente = {};

    for (const categoria of Object.keys(VISTOS_VACIO)) {
      const yaVistos = actuales[categoria] ?? [];
      const nuevos = (lote[categoria] ?? []).filter((id) => id && !yaVistos.includes(id));
      siguiente[categoria] = nuevos.length > 0 ? [...yaVistos, ...new Set(nuevos)] : yaVistos;
      if (nuevos.length > 0) hayNovedad = true;
    }

    if (!hayNovedad) return;
    set({ vistos: siguiente });
    localStorage.setItem(CLAVE_VISTOS, JSON.stringify(siguiente));
  },

  /** ¿Está desbloqueada esta entrada de la enciclopedia? */
  estaVisto(categoria, id) {
    return (get().vistos[categoria] ?? []).includes(id);
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
  // Borra también el registro de vistos: es el botón de "empezar de cero" de toda
  // la meta-progresión, y dejar la enciclopedia llena mientras los logros vuelven
  // a cero haría imposible probar cómo se ve una entrada bloqueada.
  reiniciarLogros() {
    set({ logrosDesbloqueados: [], notificacionesPendientes: [], vistos: VISTOS_VACIO });
    localStorage.removeItem(CLAVE_STORAGE);
    localStorage.removeItem(CLAVE_VISTOS);
  },
}));
