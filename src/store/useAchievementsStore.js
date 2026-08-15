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
const CLAVE_CONTADORES = 'naruto-roguelike-contadores';

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

/**
 * Los contadores acumulados **entre runs**, que es lo que permite logros del tipo
 * "gana 50 combates" o "consigue 5000 de oro" (punto 5a del roadmap). Suman
 * siempre: perder la run no los baja, igual que no baja un logro ya conseguido.
 *
 * Están aquí y no en `useGameStore` por la misma razón que los vistos: un game
 * over borraría la mitad de la meta-progresión. Y como los vistos, se mezclan con
 * este objeto al cargar, para que añadir un contador nuevo no invalide lo que el
 * jugador ya tenga guardado.
 *
 * ⚠️ **Un contador cuesta un enganche**, y un enganche es un sitio donde
 * olvidarse. Por eso son siete y no quince: cada uno tiene que incrementarse en
 * el único sitio donde la cosa ocurre de verdad. Lo que se puede DEDUCIR de lo ya
 * guardado no lleva contador — cuántos ninjas distintos has llevado o cuántas
 * transformaciones has visto salen del registro de `vistos`, con la condición
 * `coleccionMinima`.
 */
export const CONTADORES_VACIO = {
  combatesGanados: 0,
  oroGanado: 0,
  reclutas: 0,
  eventosResueltos: 0,
  objetosComprados: 0,
  runsCompletadas: 0,
  runsPerdidas: 0,
};

export const useAchievementsStore = create((set, get) => ({
  logrosDesbloqueados: [], // array de ids de logros — cargarLogros() los rellena desde localStorage
  notificacionesPendientes: [], // cola de logros (objetos completos) recién desbloqueados, para el toast — ver LogroToast

  // Registro de lo que el jugador ha visto en juego, para la enciclopedia (punto
  // 10 del roadmap). Vive en ESTE store y no en useGameStore porque tiene que
  // sobrevivir a perder la run: es meta-progresión, como los logros. Si viviera
  // en la run, un game over borraría la enciclopedia entera.
  vistos: VISTOS_VACIO,

  // Lo mismo, para los logros de "hazlo N veces". Ver CONTADORES_VACIO.
  contadores: CONTADORES_VACIO,

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

    const contadoresGuardados = localStorage.getItem(CLAVE_CONTADORES);
    if (contadoresGuardados) {
      set({ contadores: { ...CONTADORES_VACIO, ...JSON.parse(contadoresGuardados) } });
    }
  },

  /**
   * Suma al progreso acumulado y lo persiste. Recibe un lote (`{ combatesGanados: 1,
   * oroGanado: 40 }`) por la misma razón que `registrarVistos`: quien llama suele
   * tener varias cosas a la vez y así se escribe en `localStorage` una sola vez.
   *
   * Devuelve los contadores YA actualizados, para que quien acaba de sumar pueda
   * evaluar sin volver a leer el store.
   *
   * ⚠️ Ignora las claves que no estén en `CONTADORES_VACIO`: un contador con una
   * errata de nombre se quedaría a cero para siempre y el logro no saltaría nunca,
   * que es el tipo de fallo silencioso que este proyecto ya ha pagado dos veces.
   */
  sumarContadores(lote) {
    const actuales = get().contadores;
    const siguiente = { ...actuales };
    let hayNovedad = false;

    for (const [clave, cantidad] of Object.entries(lote ?? {})) {
      if (!(clave in CONTADORES_VACIO)) {
        throw new Error(`Contador de logros desconocido: ${clave}`);
      }
      if (!cantidad) continue;
      siguiente[clave] = (actuales[clave] ?? 0) + cantidad;
      hayNovedad = true;
    }

    if (!hayNovedad) return actuales;
    set({ contadores: siguiente });
    localStorage.setItem(CLAVE_CONTADORES, JSON.stringify(siguiente));
    return siguiente;
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
   *
   * ⚠️ **El contexto se completa aquí con los contadores y los vistos**, y quien
   * llama solo pasa lo del momento ("acaba de morir este jefe"). Es lo que hace
   * que un logro de contador salte desde CUALQUIER punto de evaluación sin que
   * ese punto sepa que existe: durante meses hubo uno solo —ganar un combate— y
   * ningún logro que no fuera "derrota a X" tenía dónde dispararse.
   */
  evaluarLogros(contexto = {}) {
    const { logrosDesbloqueados, contadores, vistos } = get();
    const contextoCompleto = { ...contexto, contadores, vistos };
    const nuevos = evaluarLogrosDesbloqueables(achievementsData.logros, logrosDesbloqueados, contextoCompleto);
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

  /**
   * El "empezar de cero" de toda la meta-progresión, que es una opción de verdad
   * en Ajustes (ver documentacion/34-ajustes.md).
   *
   * ⚠️ **Borra las TRES claves.** Dejar los contadores llenos mientras los logros
   * vuelven a cero es peor que no reiniciar: los de contador se volverían a
   * desbloquear en el acto, en el primer combate, y el jugador vería su reinicio
   * deshacerse solo. Lo mismo con los vistos y la enciclopedia.
   */
  reiniciarLogros() {
    set({
      logrosDesbloqueados: [],
      notificacionesPendientes: [],
      vistos: VISTOS_VACIO,
      contadores: CONTADORES_VACIO,
    });
    localStorage.removeItem(CLAVE_STORAGE);
    localStorage.removeItem(CLAVE_VISTOS);
    localStorage.removeItem(CLAVE_CONTADORES);
  },
}));
