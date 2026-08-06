// src/store/useGameStore.js
// Estado global de la run. Aquí SÍ se permite tocar el motor (engine/) y los
// datos (data/), pero la lógica de reglas en sí vive en engine/ — este store
// es el "pegamento": decide QUÉ llamar y CUÁNDO, no CÓMO se calcula nada.

import { create } from 'zustand';

import personajesData from '../data/characters.json';
import configGlobal from '../data/config.json';
import eventosData from '../data/events.json';
import itemsData from '../data/items.json';

import { crearLuchador, resolverCombateCompleto } from '../engine/combat';
import { ganarXp } from '../engine/leveling';
import { generarMapa, resolverEnemigoDeNodo } from '../engine/mapGenerator';

const CLAVE_STORAGE = configGlobal.guardado.claveLocalStorage;

/** Busca los datos base (fijos) de un personaje por su id en characters.json. */
function encontrarPersonajeBase(id) {
  const personaje = personajesData.personajes.find((p) => p.id === id);
  if (!personaje) throw new Error(`Personaje no encontrado en characters.json: ${id}`);
  return personaje;
}

/** Datos base del personaje con sus bonificaciones permanentes ya sumadas a statsBase. */
function personajeBaseConBonificaciones(instancia) {
  const base = encontrarPersonajeBase(instancia.id);
  const b = instancia.bonificaciones ?? { ataque: 0, defensa: 0, velocidad: 0, hp: 0 };
  return {
    ...base,
    statsBase: {
      hp: base.statsBase.hp + b.hp,
      ataque: base.statsBase.ataque + b.ataque,
      defensa: base.statsBase.defensa + b.defensa,
      velocidad: base.statsBase.velocidad + b.velocidad,
    },
  };
}

/** hpMaximo actual de una instancia (considerando nivel, modo y bonificaciones permanentes, SIN buffs temporales). */
function calcularHpMaximo(instancia) {
  return crearLuchador(personajeBaseConBonificaciones(instancia), instancia.nivel).hpMaximo;
}

/** Crea la instancia de run de un personaje: nivel indicado (por defecto 1), a HP completo. */
function crearInstanciaPersonaje(id, nivel = 1) {
  const instanciaBase = {
    id,
    nivel,
    xpActual: 0,
    derrotado: false,
    hpActual: 0, // se rellena justo debajo, necesita el resto de campos ya puestos
    bonificaciones: { ataque: 0, defensa: 0, velocidad: 0, hp: 0 },
  };
  instanciaBase.hpActual = calcularHpMaximo(instanciaBase);
  return instanciaBase;
}

/**
 * Aplica XP a una instancia y, si sube de nivel, incrementa su hpActual en
 * la misma cantidad que sube su hpMaximo (no lo cura del todo de regalo,
 * pero tampoco se queda "atrás" respecto a su nueva vida máxima).
 */
function aplicarXpYActualizarHp(instancia, cantidadXp) {
  const curva = encontrarPersonajeBase(instancia.id).curvaXp;
  const hpMaxAntes = calcularHpMaximo(instancia);
  const actualizado = ganarXp(instancia, cantidadXp, curva);
  const hpMaxDespues = calcularHpMaximo(actualizado);
  const delta = hpMaxDespues - hpMaxAntes;
  return { ...actualizado, hpActual: Math.min(hpMaxDespues, instancia.hpActual + delta) };
}

/** Combina los multiplicadores de todos los buffs temporales activos en un único objeto. */
function combinarMultiplicadoresTemporales(buffsTemporales) {
  const combinado = { ataque: 1, defensa: 1, velocidad: 1, hp: 1 };
  for (const buff of buffsTemporales) {
    for (const stat of Object.keys(buff.multiplicadores)) {
      combinado[stat] = (combinado[stat] ?? 1) * buff.multiplicadores[stat];
    }
  }
  return combinado;
}

export const useGameStore = create((set, get) => ({
  // ---------- ESTADO ----------
  equipo: [], // instancias { id, nivel, xpActual, derrotado, hpActual, bonificaciones }, en orden de posición
  oro: 0,
  inventario: [], // array de ids de items (pasivos obtenidos + consumibles sin usar)
  buffsTemporales: [], // [{ multiplicadores: {stat: x}, combatesRestantes }] — de eventos tipo "boost 3 combates"
  arcoActualId: null,
  arcoActualDatos: null, // el JSON del arco en curso, guardado para no reimportarlo por id
  mapa: null, // { arcoId, pisos, nodos, nodosIniciales } — generado por engine/mapGenerator
  nodoActualId: null,
  pantalla: 'mapa', // 'mapa' | 'combate' | 'evento' — qué pantalla debe mostrar la UI ahora mismo
  ultimoResultadoCombate: null, // resumen enriquecido del último combate — ver jugarCombate
  eventoActual: null, // { id, titulo, descripcion, elecciones } — evento en curso
  avisoUltimoNodo: null, // texto breve para la UI (ej. "Equipo curado en el descanso"), no persistente
  runTerminada: false,
  runGanada: false,

  // ---------- ACCIONES ----------

  /** Arranca una run nueva con hasta 3 personajes iniciales (config.equipo.tamanoMaximo). */
  iniciarRun(personajesInicialesIds, arco) {
    const tamanoMaximo = configGlobal.equipo.tamanoMaximo;
    const equipoInicial = personajesInicialesIds
      .slice(0, tamanoMaximo)
      .map((id) => crearInstanciaPersonaje(id));

    set({
      equipo: equipoInicial,
      oro: configGlobal.economia.oroInicial,
      inventario: [],
      buffsTemporales: [],
      arcoActualId: arco.id,
      arcoActualDatos: arco,
      mapa: generarMapa(arco),
      nodoActualId: null,
      pantalla: 'mapa',
      ultimoResultadoCombate: null,
      eventoActual: null,
      avisoUltimoNodo: null,
      runTerminada: false,
      runGanada: false,
    });
  },

  /**
   * Avanza al nodo indicado: lo marca visitado, actualiza nodoActualId, y
   * resuelve lo que corresponda según su tipo. La UI llama a esto cuando el
   * jugador pulsa un nodo disponible en el mapa.
   */
  avanzarANodo(nodoId) {
    const { mapa, arcoActualDatos } = get();
    if (!mapa || !mapa.nodos[nodoId]) return null;

    const nodo = mapa.nodos[nodoId];
    const mapaActualizado = {
      ...mapa,
      nodos: { ...mapa.nodos, [nodoId]: { ...nodo, visitado: true } },
    };
    set({ mapa: mapaActualizado, nodoActualId: nodoId, avisoUltimoNodo: null });

    const infoEnemigo = resolverEnemigoDeNodo(nodo, arcoActualDatos);
    if (infoEnemigo) {
      const resultado = get().jugarCombate(infoEnemigo.enemigoBase, infoEnemigo.nivel);
      set({ pantalla: 'combate' });
      return resultado;
    }

    if (nodo.tipo === 'evento') {
      const eventosDelArco = eventosData.eventos.filter((e) => e.arcoId === arcoActualDatos.id);
      const pool = eventosDelArco.length > 0 ? eventosDelArco : eventosData.eventos;
      const eventoElegido = pool[Math.floor(Math.random() * pool.length)];
      set({ eventoActual: eventoElegido, pantalla: 'evento' });
      return null;
    }

    if (nodo.tipo === 'descanso') {
      // Auto-resuelto: cura y revive a todo el equipo, sin pantalla propia.
      get()._curarEquipoCompleto();
      set({ avisoUltimoNodo: 'Equipo curado por completo en el descanso.' });
      return null;
    }

    // tienda/reclutamiento: sin pantalla propia todavía.
    return null;
  },

  /** Ids de los nodos a los que el jugador puede ir ahora mismo desde donde está. */
  obtenerNodosDisponibles() {
    const { mapa, nodoActualId } = get();
    if (!mapa) return [];
    if (nodoActualId === null) return mapa.nodosIniciales;
    return mapa.nodos[nodoActualId]?.conexiones ?? [];
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
   * Resuelve el combate completo de un nodo: puede constar de varias RONDAS
   * si tu personaje activo cae — el siguiente personaje vivo entra
   * automáticamente contra el MISMO enemigo, que conserva el daño ya
   * recibido (no se cura entre rondas). Termina cuando el enemigo cae
   * (victoria) o cuando todo el equipo ha caído (derrota de la run).
   *
   * Cada personaje entra a su ronda con su HP persistido (no a HP completo),
   * y los buffs temporales activos se aplican y se consumen 1 uso al final,
   * independientemente de cuántas rondas haya habido.
   */
  jugarCombate(enemigoBase, nivelEnemigo) {
    const luchadorEnemigo = crearLuchador(enemigoBase, nivelEnemigo);
    const rondas = [];
    let jugadorGanoFinal = false;

    // Como máximo tantas rondas como personajes en el equipo — no puede
    // haber más, cada ronda consume a un personaje (gana o cae).
    while (true) {
      const activo = get().obtenerPersonajeActivo();
      if (!activo) {
        set({ runTerminada: true, runGanada: false });
        break;
      }

      const personajeBase = personajeBaseConBonificaciones(activo);
      const multiplicadoresBuffs = combinarMultiplicadoresTemporales(get().buffsTemporales);
      const luchadorJugador = crearLuchador(personajeBase, activo.nivel, activo.hpActual, multiplicadoresBuffs);
      const hpInicialJugador = luchadorJugador.hpActual;
      const hpInicialEnemigo = luchadorEnemigo.hpActual;

      const resultado = resolverCombateCompleto(luchadorJugador, luchadorEnemigo);
      const jugadorGanoRonda = resultado.ganadorId === luchadorJugador.id;

      rondas.push({
        historial: resultado.historial,
        turnosUsados: resultado.turnosUsados,
        jugadorGano: jugadorGanoRonda,
        jugador: {
          id: luchadorJugador.id,
          nombre: luchadorJugador.nombre,
          nivel: luchadorJugador.nivel,
          hpInicial: hpInicialJugador,
          hpMaximo: luchadorJugador.hpMaximo,
          hpFinal: luchadorJugador.hpActual,
          modoActivoNombre: luchadorJugador.modoActivo?.nombre ?? null,
        },
        enemigo: {
          id: luchadorEnemigo.id,
          nombre: luchadorEnemigo.nombre,
          nivel: luchadorEnemigo.nivel,
          hpInicial: hpInicialEnemigo,
          hpMaximo: luchadorEnemigo.hpMaximo,
          hpFinal: luchadorEnemigo.hpActual,
          modoActivoNombre: luchadorEnemigo.modoActivo?.nombre ?? null,
        },
      });

      if (jugadorGanoRonda) {
        get()._aplicarVictoria(activo.id, luchadorJugador.hpActual, enemigoBase);
        jugadorGanoFinal = true;
        break;
      } else {
        get()._aplicarDerrota(activo.id);
        // Si queda alguien vivo, el bucle continúa automáticamente con él
        // contra luchadorEnemigo, que sigue con el HP que le quedó.
      }
    }

    get()._consumirUsoBuffsTemporales();

    const resumen = { rondas, jugadorGanoFinal };
    set({ ultimoResultadoCombate: resumen });
    return resumen;
  },

  /** Vuelve del resultado de combate/evento al mapa. */
  volverAlMapa() {
    set({ pantalla: 'mapa', ultimoResultadoCombate: null, eventoActual: null });
  },

  /**
   * Reinicia la run tras un game over: pone mapa a null, lo que hace que el
   * useEffect de App.jsx (que solo llama a iniciarRun si !mapa) arranque una
   * run nueva automáticamente, sin duplicar esa lógica aquí.
   */
  reiniciarRun() {
    set({ mapa: null, pantalla: 'mapa', ultimoResultadoCombate: null, eventoActual: null });
  },

  /** Interno: reduce en 1 los combates restantes de cada buff temporal y elimina los agotados. */
  _consumirUsoBuffsTemporales() {
    const { buffsTemporales } = get();
    const actualizados = buffsTemporales
      .map((b) => ({ ...b, combatesRestantes: b.combatesRestantes - 1 }))
      .filter((b) => b.combatesRestantes > 0);
    set({ buffsTemporales: actualizados });
  },

  /** Interno: aplica XP, recompensas y persiste el HP final tras ganar un combate. */
  _aplicarVictoria(idPersonaje, hpFinalActivo, enemigoBase) {
    const { equipo, oro, inventario } = get();
    const xpGanada = enemigoBase.recompensa?.xp ?? 20;
    const porcentajeBanquillo = configGlobal.progresion.porcentajeXpBanquillo;
    const oroGanado = Math.round(
      (configGlobal.economia.oroPorCombateGanado.min +
        configGlobal.economia.oroPorCombateGanado.max) / 2,
    );

    // El personaje activo gana la XP completa y su HP final persistido. El
    // resto del equipo vivo gana un porcentaje de XP (no participó en el
    // combate, así que su HP no cambia).
    const equipoActualizado = equipo.map((p) => {
      if (p.derrotado) return p;
      const xpParaEste = p.id === idPersonaje ? xpGanada : Math.round(xpGanada * porcentajeBanquillo);
      const conXp = aplicarXpYActualizarHp(p, xpParaEste);
      return p.id === idPersonaje ? { ...conXp, hpActual: hpFinalActivo } : conXp;
    });

    const objetoGanado = enemigoBase.recompensa?.objetoGarantizado;
    const inventarioActualizado = objetoGanado ? [...inventario, objetoGanado] : inventario;

    set({
      equipo: equipoActualizado,
      oro: oro + oroGanado,
      inventario: inventarioActualizado,
    });
  },

  /** Interno: marca al personaje como derrotado (HP a 0) y lo manda al final del orden. */
  _aplicarDerrota(idPersonaje) {
    const { equipo } = get();
    const actualizado = equipo.map((p) =>
      p.id === idPersonaje ? { ...p, derrotado: true, hpActual: 0 } : p,
    );
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

  /** Cura a un personaje concreto a HP completo (nodo de descanso): lo revive si estaba derrotado. */
  curarPersonaje(idPersonaje) {
    const { equipo } = get();
    set({
      equipo: equipo.map((p) => {
        if (p.id !== idPersonaje) return p;
        return { ...p, derrotado: false, hpActual: calcularHpMaximo(p) };
      }),
    });
  },

  /** Interno: cura y revive a todo el equipo de golpe (nodo de descanso automático). */
  _curarEquipoCompleto() {
    const { equipo } = get();
    set({
      equipo: equipo.map((p) => ({ ...p, derrotado: false, hpActual: calcularHpMaximo(p) })),
    });
  },

  /**
   * Aplica la elección del jugador en el evento actual y vuelve al mapa.
   * Tipos de efecto soportados: curarEquipoPorcentaje, buffTemporalEquipo,
   * ganarXpEquipo, ganarOro, perderOro, comprarObjetoAleatorio,
   * mejoraPermanenteAleatoria, ninguno. Ningún efecto de evento desencadena
   * combate — hay ya suficientes combates por piso.
   */
  resolverEventoEleccion(indiceEleccion) {
    const { eventoActual, equipo, oro, inventario, buffsTemporales } = get();
    if (!eventoActual) return;
    const efecto = eventoActual.elecciones[indiceEleccion]?.efecto;
    if (!efecto) return;

    switch (efecto.tipo) {
      case 'curarEquipoPorcentaje': {
        const equipoActualizado = equipo.map((p) => {
          if (p.derrotado) return p;
          const hpMax = calcularHpMaximo(p);
          const curado = Math.min(hpMax, p.hpActual + Math.round(hpMax * efecto.cantidad));
          return { ...p, hpActual: curado };
        });
        set({ equipo: equipoActualizado });
        break;
      }

      case 'buffTemporalEquipo': {
        set({
          buffsTemporales: [
            ...buffsTemporales,
            { multiplicadores: { [efecto.stat]: efecto.multiplicador }, combatesRestantes: efecto.combates },
          ],
        });
        break;
      }

      case 'ganarXpEquipo': {
        const equipoActualizado = equipo.map((p) =>
          p.derrotado ? p : aplicarXpYActualizarHp(p, efecto.cantidad),
        );
        set({ equipo: equipoActualizado });
        break;
      }

      case 'ganarOro': {
        set({ oro: oro + efecto.cantidad });
        break;
      }

      case 'perderOro': {
        set({ oro: Math.max(0, oro - efecto.cantidad) });
        break;
      }

      case 'comprarObjetoAleatorio': {
        if (oro >= efecto.coste) {
          const comprables = itemsData.objetos.filter((o) => o.precioTienda !== null);
          const objeto = comprables[Math.floor(Math.random() * comprables.length)];
          set({ oro: oro - efecto.coste, inventario: [...inventario, objeto.id] });
        }
        break;
      }

      case 'mejoraPermanenteAleatoria': {
        const vivos = equipo.filter((p) => !p.derrotado);
        if (vivos.length > 0) {
          const elegido = vivos[Math.floor(Math.random() * vivos.length)];
          const stats = ['ataque', 'defensa', 'velocidad', 'hp'];
          const stat = stats[Math.floor(Math.random() * stats.length)];
          const equipoActualizado = equipo.map((p) => {
            if (p.id !== elegido.id) return p;
            const bonificaciones = { ...p.bonificaciones, [stat]: p.bonificaciones[stat] + 2 };
            const actualizado = { ...p, bonificaciones };
            // Si la mejora es de HP, sube también el HP actual, no solo el máximo.
            if (stat === 'hp') actualizado.hpActual = p.hpActual + 2;
            return actualizado;
          });
          set({ equipo: equipoActualizado });
        }
        break;
      }

      case 'ninguno':
      default:
        break;
    }

    set({ pantalla: 'mapa', eventoActual: null });
  },

  /** HP máximo actual de una instancia del equipo (nivel + modo + bonificaciones, sin buffs temporales de combate). */
  obtenerHpMaximo(idPersonaje) {
    const instancia = get().equipo.find((p) => p.id === idPersonaje);
    if (!instancia) return null;
    return calcularHpMaximo(instancia);
  },

  // ---------- PERSISTENCIA ----------

  guardarRun() {
    const {
      equipo, oro, inventario, buffsTemporales,
      arcoActualId, nodoActualId, runTerminada, runGanada,
    } = get();
    const runGuardada = {
      equipo, oro, inventario, buffsTemporales,
      arcoActualId, nodoActualId, runTerminada, runGanada,
    };
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
