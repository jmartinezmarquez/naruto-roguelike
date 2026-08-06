// src/store/useGameStore.js
// Estado global de la run. Aquí SÍ se permite tocar el motor (engine/) y los
// datos (data/), pero la lógica de reglas en sí vive en engine/ — este store
// es el "pegamento": decide QUÉ llamar y CUÁNDO, no CÓMO se calcula nada.

import { create } from 'zustand';

import personajesData from '../data/characters.json';
import configGlobal from '../data/config.json';

import { crearLuchador, resolverCombateCompleto } from '../engine/combat';
import { ganarXp } from '../engine/leveling';

const CLAVE_STORAGE = configGlobal.guardado.claveLocalStorage;

/** Busca los datos base (fijos) de un personaje por su id en characters.json. */
function encontrarPersonajeBase(id) {
  const personaje = personajesData.personajes.find((p) => p.id === id);
  if (!personaje) throw new Error(`Personaje no encontrado en characters.json: ${id}`);
  return personaje;
}

/** Crea la instancia de run de un personaje: nivel indicado (por defecto 1), sin XP. */
function crearInstanciaPersonaje(id, nivel = 1) {
  return { id, nivel, xpActual: 0, derrotado: false };
}

export const useGameStore = create((set, get) => ({
  // ---------- ESTADO ----------
  equipo: [], // array de instancias { id, nivel, xpActual, derrotado }, en orden de posición
  oro: 0,
  inventario: [], // array de ids de items (pasivos obtenidos + consumibles sin usar)
  arcoActualId: null,
  nodoActualId: null,
  ultimoResultadoCombate: null, // { historial, ganadorId } — para que la UI lo anime
  runTerminada: false,
  runGanada: false,

  // ---------- ACCIONES ----------

  /** Arranca una run nueva con hasta 3 personajes iniciales (config.equipo.tamanoMaximo). */
  iniciarRun(personajesInicialesIds, arcoId) {
    const tamanoMaximo = configGlobal.equipo.tamanoMaximo;
    const equipoInicial = personajesInicialesIds
      .slice(0, tamanoMaximo)
      .map(crearInstanciaPersonaje);

    set({
      equipo: equipoInicial,
      oro: configGlobal.economia.oroInicial,
      inventario: [],
      arcoActualId: arcoId,
      nodoActualId: null,
      ultimoResultadoCombate: null,
      runTerminada: false,
      runGanada: false,
    });
  },

  /**
   * Añade un personaje reclutado al final del equipo, si hay hueco.
   * nivelInicial: nivel del piso donde se recluta (calcularNivelPorPiso del
   * generador de mapa), para que no entre indefenso si es un reclutamiento
   * tardío en la run. Por defecto 1, para el equipo inicial del primer arco.
   */
  reclutarPersonaje(id, nivelInicial = 1) {
    const { equipo } = get();
    if (equipo.length >= configGlobal.equipo.tamanoMaximo) return false;
    if (equipo.some((p) => p.id === id)) return false; // ya está en el equipo
    set({ equipo: [...equipo, crearInstanciaPersonaje(id, nivelInicial)] });
    return true;
  },

  /** Reordena el equipo. nuevoOrdenIds = array de ids en el orden deseado. */
  reordenarEquipo(nuevoOrdenIds) {
    const { equipo } = get();
    const reordenado = nuevoOrdenIds
      .map((id) => equipo.find((p) => p.id === id))
      .filter(Boolean);
    set({ equipo: reordenado });
  },

  /** El personaje en posición 1 vivo. null si todo el equipo está derrotado. */
  obtenerPersonajeActivo() {
    return get().equipo.find((p) => !p.derrotado) ?? null;
  },

  /**
   * Resuelve un combate 1 vs 1 automático entre el personaje activo y un
   * enemigo. enemigoBase tiene la misma forma que un personaje (tipo, jutsu,
   * statsBase, modo opcional). nivelEnemigo se calcula fuera (según el nodo).
   */
  jugarCombate(enemigoBase, nivelEnemigo) {
    const activo = get().obtenerPersonajeActivo();
    if (!activo) {
      set({ runTerminada: true, runGanada: false });
      return null;
    }

    const personajeBase = encontrarPersonajeBase(activo.id);
    const luchadorJugador = crearLuchador(personajeBase, activo.nivel);
    const luchadorEnemigo = crearLuchador(enemigoBase, nivelEnemigo);

    const resultado = resolverCombateCompleto(luchadorJugador, luchadorEnemigo);
    const jugadorGano = resultado.ganadorId === luchadorJugador.id;

    set({ ultimoResultadoCombate: resultado });

    if (jugadorGano) {
      get()._aplicarVictoria(activo.id, personajeBase, enemigoBase);
    } else {
      get()._aplicarDerrota(activo.id);
    }

    return resultado;
  },

  /** Interno: aplica XP y recompensas tras ganar un combate. No lo llames desde la UI. */
  _aplicarVictoria(idPersonaje, personajeBase, enemigoBase) {
    const { equipo, oro, inventario } = get();
    const xpGanada = enemigoBase.recompensa?.xp ?? 20;
    const porcentajeBanquillo = configGlobal.progresion.porcentajeXpBanquillo;
    const oroGanado = Math.round(
      (configGlobal.economia.oroPorCombateGanado.min +
        configGlobal.economia.oroPorCombateGanado.max) / 2,
    );

    // El personaje activo gana la XP completa. El resto del equipo (vivo,
    // no derrotado) gana un porcentaje — inspirado en que en Pokelike el
    // combate involucra al equipo por su posicionamiento, no a un único
    // luchador aislado. Sin esto, con combate 1vs1, los personajes en banco
    // casi nunca subirían de nivel salvo que el jugador reordene el equipo
    // manualmente antes de cada combate.
    const equipoActualizado = equipo.map((p) => {
      if (p.derrotado) return p;
      const curva = encontrarPersonajeBase(p.id).curvaXp;
      const xpParaEste = p.id === idPersonaje ? xpGanada : Math.round(xpGanada * porcentajeBanquillo);
      return ganarXp(p, xpParaEste, curva);
    });

    const objetoGanado = enemigoBase.recompensa?.objetoGarantizado;
    const inventarioActualizado = objetoGanado ? [...inventario, objetoGanado] : inventario;

    set({
      equipo: equipoActualizado,
      oro: oro + oroGanado,
      inventario: inventarioActualizado,
    });
  },

  /** Interno: marca al personaje como derrotado y lo manda al final del orden. */
  _aplicarDerrota(idPersonaje) {
    const { equipo } = get();
    const actualizado = equipo.map((p) =>
      p.id === idPersonaje ? { ...p, derrotado: true } : p,
    );
    // Los derrotados van al final, para que el siguiente vivo pase a posición 1.
    const vivos = actualizado.filter((p) => !p.derrotado);
    const caidos = actualizado.filter((p) => p.derrotado);
    const equipoReordenado = [...vivos, ...caidos];

    const todosDerrotados = vivos.length === 0;
    set({
      equipo: equipoReordenado,
      runTerminada: todosDerrotados,
      runGanada: false,
    });
  },

  /** Cura a un personaje concreto (nodo de descanso): lo revive si estaba derrotado. */
  curarPersonaje(idPersonaje) {
    const { equipo } = get();
    set({
      equipo: equipo.map((p) => (p.id === idPersonaje ? { ...p, derrotado: false } : p)),
    });
  },

  // ---------- PERSISTENCIA ----------

  guardarRun() {
    const { equipo, oro, inventario, arcoActualId, nodoActualId, runTerminada, runGanada } = get();
    const runGuardada = { equipo, oro, inventario, arcoActualId, nodoActualId, runTerminada, runGanada };
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(runGuardada));
  },

  cargarRun() {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) return false;
    set(JSON.parse(guardado));
    return true;
  },

  borrarRunGuardada() {
    localStorage.removeItem(CLAVE_STORAGE);
  },
}));