// src/store/useAchievementsStore.js
// Meta-progresión entre runs: qué logros están desbloqueados. Vive en un
// store separado de useGameStore porque sobrevive a un game over o a
// reiniciarRun — es la run la que es efímera, no esto. Persiste en su propia
// clave de localStorage, igual que guardarRun/cargarRun en useGameStore.

import { create } from 'zustand';

import achievementsData from '../data/achievements.json';
import { evaluarLogrosDesbloqueables, pergaminosPorCobrar } from '../engine/achievements';
import { nivelDeMaestria } from '../engine/maestria';
import configGlobal from '../data/config.json';

const CLAVE_STORAGE = 'naruto-roguelike-logros';
const CLAVE_VISTOS = 'naruto-roguelike-vistos';
const CLAVE_CONTADORES = 'naruto-roguelike-contadores';
const CLAVE_MARCA = 'naruto-roguelike-marca';
const CLAVE_SALON = 'naruto-roguelike-salon';
const CLAVE_ASCENSION = 'naruto-roguelike-ascension';
const CLAVE_PERGAMINOS = 'naruto-roguelike-pergaminos';
const CLAVE_MAESTRIA = 'naruto-roguelike-maestria';

// Cuántas runs ganadas guarda el Salón de la Fama. Las más recientes primero; con un
// tope para que `localStorage` no crezca sin fin en quien juega mucho.
export const MAXIMO_SALON_DE_LA_FAMA = 20;

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

/**
 * Hasta dónde se ha llegado NUNCA: el punto más lejano de todas las runs.
 *
 * ⚠️ **Vive aparte de los contadores porque su semántica es otra**: los contadores
 * SUMAN y esto es un MÁXIMO. Meter las dos cosas en el mismo saco es cómo se acaba
 * sumando un récord — y ya está escrito en `achievements.json` que por eso no existe
 * una condición de logro por nivel alcanzado.
 *
 * `orden` es la posición del arco dentro de su campaña, y viaja con la marca porque
 * este store **no sabe de campañas**: sin él no se puede comparar "arco 3, piso 1"
 * con "arco 2, piso 8". Lo pone quien llama, que sí lo sabe.
 */
export const MARCA_VACIA = { arcoId: null, orden: -1, piso: 0 };

/**
 * Los pergaminos de invocación (documentacion/42): el saldo que se gasta en el gacha,
 * lo ganado en total (para logros y el marcador del Home) y los jefes derrotados
 * ALGUNA vez, que es lo que decide el extra de "primera vez". Es meta-progresión: un
 * game over no lo toca.
 */
export const PERGAMINOS_VACIOS = { saldo: 0, ganadosEnTotal: 0, jefesDerrotados: [], logrosCobrados: [] };

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

  // El punto más lejano alcanzado nunca. Ver MARCA_VACIA.
  marca: MARCA_VACIA,
  // Las runs ganadas: `{ fecha, campanaId, equipo: [{id, nivel}], medallas: [arcoId] }`,
  // la más reciente primero. Ver `registrarEnSalonDeLaFama`.
  salonDeLaFama: [],
  // La ascensión más alta GANADA en cada campaña: `{ [campanaId]: nivel }`. Sin
  // entrada = no has ganado ninguna, ni siquiera la A0. Ver `registrarAscensionGanada`.
  ascensionesGanadas: {},
  // Ver PERGAMINOS_VACIOS.
  pergaminos: PERGAMINOS_VACIOS,
  // Nivel de ninja: la XP de maestría acumulada de cada personaje, { [id]: xp }. El
  // nivel se deduce (engine/maestria.js); no se guarda aparte.
  maestria: {},

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

    const salonGuardado = localStorage.getItem(CLAVE_SALON);
    if (salonGuardado) set({ salonDeLaFama: JSON.parse(salonGuardado) });
    const marcaGuardada = localStorage.getItem(CLAVE_MARCA);
    if (marcaGuardada) set({ marca: { ...MARCA_VACIA, ...JSON.parse(marcaGuardada) } });
    const ascensionGuardada = localStorage.getItem(CLAVE_ASCENSION);
    if (ascensionGuardada) set({ ascensionesGanadas: JSON.parse(ascensionGuardada) });
    const pergaminosGuardados = localStorage.getItem(CLAVE_PERGAMINOS);
    if (pergaminosGuardados) set({ pergaminos: { ...PERGAMINOS_VACIOS, ...JSON.parse(pergaminosGuardados) } });
    const maestriaGuardada = localStorage.getItem(CLAVE_MAESTRIA);
    if (maestriaGuardada) set({ maestria: JSON.parse(maestriaGuardada) });
    // Los logros conseguidos antes de que dieran pergaminos se cobran aquí, una vez.
    get()._cobrarLogros();
  },

  /**
   * Suma XP de maestría a varios personajes a la vez ({ [id]: xp }) y devuelve, de
   * cada uno, el nivel de antes y el de después: la pantalla de fin de run celebra
   * las subidas. Un duplicado del gacha también entra por aquí.
   */
  sumarXpMaestria(xpPorPersonaje) {
    const reglas = configGlobal.maestria;
    const actual = get().maestria;
    const siguiente = { ...actual };
    const resultado = [];
    for (const [id, xp] of Object.entries(xpPorPersonaje)) {
      if (xp <= 0) continue;
      const antes = actual[id] ?? 0;
      siguiente[id] = antes + xp;
      resultado.push({
        id,
        xp,
        nivelAntes: nivelDeMaestria(antes, reglas).nivel,
        nivelDespues: nivelDeMaestria(siguiente[id], reglas).nivel,
      });
    }
    if (resultado.length === 0) return [];
    set({ maestria: siguiente });
    localStorage.setItem(CLAVE_MAESTRIA, JSON.stringify(siguiente));
    return resultado;
  },

  /**
   * Interno: cobra los pergaminos de los logros conseguidos y aún no cobrados. Se
   * llama al desbloquear y al cargar; es idempotente, porque apunta qué ha cobrado.
   */
  _cobrarLogros() {
    const actual = get().pergaminos;
    const { total, ids } = pergaminosPorCobrar(achievementsData.logros, get().logrosDesbloqueados, actual.logrosCobrados);
    if (ids.length === 0) return;
    const siguiente = {
      ...actual,
      saldo: actual.saldo + total,
      ganadosEnTotal: actual.ganadosEnTotal + total,
      logrosCobrados: [...actual.logrosCobrados, ...ids],
    };
    set({ pergaminos: siguiente });
    localStorage.setItem(CLAVE_PERGAMINOS, JSON.stringify(siguiente));
  },

  /**
   * Suma pergaminos al saldo (y a lo ganado en total) y apunta como derrotados
   * alguna vez los jefes que se pasen. Lo llama la run al terminar.
   */
  sumarPergaminos(cantidad, jefesDerrotados = []) {
    const actual = get().pergaminos;
    const siguiente = {
      ...actual,
      saldo: actual.saldo + cantidad,
      ganadosEnTotal: actual.ganadosEnTotal + cantidad,
      jefesDerrotados: [...new Set([...actual.jefesDerrotados, ...jefesDerrotados])],
    };
    set({ pergaminos: siguiente });
    localStorage.setItem(CLAVE_PERGAMINOS, JSON.stringify(siguiente));
  },

  /**
   * Apunta que se ha ganado una run de `campanaId` en la ascensión `nivel`, **solo
   * si mejora el récord** de esa campaña (ganar A1 después de A3 no te quita A4).
   * Es lo que desbloquea el siguiente nivel en el Home.
   */
  registrarAscensionGanada(campanaId, nivel) {
    const actual = get().ascensionesGanadas[campanaId];
    if (actual != null && actual >= nivel) return;
    const siguiente = { ...get().ascensionesGanadas, [campanaId]: nivel };
    set({ ascensionesGanadas: siguiente });
    localStorage.setItem(CLAVE_ASCENSION, JSON.stringify(siguiente));
  },

  /**
   * Apunta un punto alcanzado, y **solo lo guarda si mejora el récord**.
   *
   * Se compara por (arco, piso) en ese orden: el piso 1 del arco 3 está más lejos que
   * el piso 8 del arco 2. Es idempotente y no toca el estado si no hay mejora, que es
   * lo que permite llamarlo en **cada nodo** sin pensar — igual que `registrarVistos`.
   */
  /**
   * Apunta una run ganada en el Salón de la Fama (la más reciente, primera). Lo llama
   * `jugarCombate` al caer el jefe que acaba la run — es meta-progresión, por eso vive
   * aquí y no en `useGameStore`, que muere con la run.
   */
  registrarEnSalonDeLaFama(entrada) {
    const siguiente = [entrada, ...get().salonDeLaFama].slice(0, MAXIMO_SALON_DE_LA_FAMA);
    set({ salonDeLaFama: siguiente });
    localStorage.setItem(CLAVE_SALON, JSON.stringify(siguiente));
  },

  registrarMarca({ arcoId, orden, piso }) {
    const actual = get().marca;
    const mejora = orden > actual.orden || (orden === actual.orden && piso > actual.piso);
    if (!mejora) return;
    const siguiente = { arcoId, orden, piso };
    set({ marca: siguiente });
    localStorage.setItem(CLAVE_MARCA, JSON.stringify(siguiente));
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
    const { logrosDesbloqueados, contadores, vistos, ascensionesGanadas } = get();
    const ascensionMaximaGanada = Math.max(-1, ...Object.values(ascensionesGanadas));
    const contextoCompleto = { ...contexto, contadores, vistos, ascensionMaximaGanada };
    const nuevos = evaluarLogrosDesbloqueables(achievementsData.logros, logrosDesbloqueados, contextoCompleto);
    if (nuevos.length === 0) return [];

    const actualizados = [...logrosDesbloqueados, ...nuevos.map((l) => l.id)];
    set({ logrosDesbloqueados: actualizados });
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(actualizados));
    get()._cobrarLogros();
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
   * ⚠️ **Borra las OCHO claves.** Dejar los contadores llenos mientras los logros
   * vuelven a cero es peor que no reiniciar: los de contador se volverían a
   * desbloquear en el acto, en el primer combate, y el jugador vería su reinicio
   * deshacerse solo. Lo mismo con los vistos y la enciclopedia, y con la marca — que
   * es lo primero que se mira en el Home. Y con el Salón de la Fama: reiniciar y seguir
   * viendo tus victorias de antes sería un reinicio a medias.
   *
   * Cada vez que se añade algo persistido a este store hay que volver aquí. Van ocho:
   * las tres últimas, las ascensiones ganadas, los pergaminos y la maestría — reiniciar
   * y seguir pudiendo jugar en A5, con el saldo intacto o con los ninjas a nivel 10
   * sería otro reinicio a medias.
   */
  reiniciarLogros() {
    set({
      logrosDesbloqueados: [],
      notificacionesPendientes: [],
      vistos: VISTOS_VACIO,
      contadores: CONTADORES_VACIO,
      marca: MARCA_VACIA,
      salonDeLaFama: [],
      ascensionesGanadas: {},
      pergaminos: PERGAMINOS_VACIOS,
      maestria: {},
    });
    localStorage.removeItem(CLAVE_STORAGE);
    localStorage.removeItem(CLAVE_VISTOS);
    localStorage.removeItem(CLAVE_CONTADORES);
    localStorage.removeItem(CLAVE_MARCA);
    localStorage.removeItem(CLAVE_SALON);
    localStorage.removeItem(CLAVE_ASCENSION);
    localStorage.removeItem(CLAVE_PERGAMINOS);
    localStorage.removeItem(CLAVE_MAESTRIA);
  },
}));
