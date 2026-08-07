// src/store/useGameStore.js
// Estado global de la run. Aquí SÍ se permite tocar el motor (engine/) y los
// datos (data/), pero la lógica de reglas en sí vive en engine/ — este store
// es el "pegamento": decide QUÉ llamar y CUÁNDO, no CÓMO se calcula nada.

import { create } from 'zustand';

import personajesData from '../data/characters.json';
import configGlobal from '../data/config.json';
import eventosData from '../data/events.json';
import itemsData from '../data/items.json';
import enemiesData from '../data/enemies.json';
import achievementsData from '../data/achievements.json';
import arcoPaisDeLasOlas from '../data/arcs/pais-de-las-olas.json';
import arcoExamenChunin from '../data/arcs/examen-chunin.json';
import arcoInvasionDePain from '../data/arcs/invasion-de-pain.json';

import { crearLuchador, resolverCombateCompleto } from '../engine/combat';
import { ganarXp } from '../engine/leveling';
import { generarMapa, resolverEnemigoDeNodo } from '../engine/mapGenerator';
import { obtenerPersonajesReclutablesDesbloqueados, obtenerObjetosInicialesDesbloqueados } from '../engine/achievements';
import { useAchievementsStore } from './useAchievementsStore';

const CLAVE_STORAGE = configGlobal.guardado.claveLocalStorage;

// Orden fijo de los 3 arcos del MVP: al derrotar al jefe final de uno, la
// run continúa automáticamente con el siguiente en vez de terminar ahí. El
// último (Pain) lleva `recompensa.finDeLaRun: true` en enemies.json — esa es
// la señal real de "esto ya es el final", no "ser el último de esta lista".
const ORDEN_ARCOS = [arcoPaisDeLasOlas, arcoExamenChunin, arcoInvasionDePain];

/**
 * Busca los datos base (fijos) de un personaje por su id: primero en
 * characters.json, y si no está, en los jefes de enemies.json marcados
 * como desbloqueablePorLogro (mismo esquema que un personaje — ver el
 * comentario de enemies.json). Así un jefe desbloqueado por logro se
 * recluta exactamente igual que cualquier otro, sin duplicar sus datos.
 */
function encontrarPersonajeBase(id) {
  const personaje = personajesData.personajes.find((p) => p.id === id);
  if (personaje) return personaje;
  const jefeDesbloqueable = enemiesData.jefes.find((j) => j.id === id && j.desbloqueablePorLogro);
  if (jefeDesbloqueable) return jefeDesbloqueable;
  throw new Error(`Personaje no encontrado en characters.json ni como jefe desbloqueable por logro: ${id}`);
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

/** Elige n elementos distintos al azar de un array, sin repetir. */
function elegirVariosAlAzar(array, n) {
  const copia = [...array];
  const elegidos = [];
  while (copia.length > 0 && elegidos.length < n) {
    const indice = Math.floor(Math.random() * copia.length);
    elegidos.push(copia.splice(indice, 1)[0]);
  }
  return elegidos;
}

/**
 * Genera la oferta de un nodo de tienda, al estilo Slay the Spire: 2
 * consumibles comprables, 1 objeto pasivo gratuito, y 2 personajes
 * reclutables entre los que solo se puede elegir uno (al reclutar uno se
 * descarta el otro). nivelReclutamiento: nivel al que entraría el reclutado,
 * el del piso donde está la tienda (igual que un reclutamiento de recompensa
 * de jefe — no entra indefenso si es tarde en la run).
 */
function generarOfertaTienda(equipoActual, arcoActualDatos, nivelReclutamiento) {
  const consumiblesDisponibles = itemsData.objetos.filter(
    (o) => o.tipo === 'consumible' && o.precioTienda !== null,
  );
  const pasivosDisponibles = itemsData.objetos.filter(
    (o) => o.tipo === 'pasivo' && o.precioTienda !== null,
  );

  const idsDesbloqueadosPorLogro = obtenerPersonajesReclutablesDesbloqueados(
    achievementsData.logros,
    useAchievementsStore.getState().logrosDesbloqueados,
  );
  // Los "inicial" (Naruto/Sasuke/Sakura) que NO se eligieron al empezar la
  // run también se pueden reclutar en cualquier tienda — si no, en el primer
  // arco (sin personajesReclutablesIds propio) sería imposible formar un
  // equipo de 3 sin haber desbloqueado ya algún logro en una run anterior.
  const idsInicialesNoElegidos = personajesData.personajes
    .filter((p) => p.rareza === 'inicial')
    .map((p) => p.id);
  const idsReclutablesTotal = [
    ...(arcoActualDatos.personajesReclutablesIds ?? []),
    ...idsDesbloqueadosPorLogro,
    ...idsInicialesNoElegidos,
  ];

  const idsEnEquipo = new Set(equipoActual.map((p) => p.id));
  const reclutablesDisponibles = idsReclutablesTotal
    .filter((id) => !idsEnEquipo.has(id))
    .map((id) => {
      const base = encontrarPersonajeBase(id);
      const precio = configGlobal.economia.precioReclutamientoPorRareza[base.rareza] ?? 50;
      return { personajeId: id, nombre: base.nombre, rareza: base.rareza, precio };
    });

  return {
    consumibles: elegirVariosAlAzar(consumiblesDisponibles, 2).map((o) => o.id),
    gratuito: elegirVariosAlAzar(pasivosDisponibles, 1)[0]?.id ?? null,
    reclutables: elegirVariosAlAzar(reclutablesDisponibles, 2),
    nivelReclutamiento,
  };
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
  pantalla: 'mapa', // 'mapa' | 'combate' | 'evento' | 'tienda' | 'gameover' | 'logros' — qué pantalla debe mostrar la UI ahora mismo
  ultimoResultadoCombate: null, // resumen enriquecido del último combate — ver jugarCombate
  eventoActual: null, // { id, titulo, descripcion, elecciones } — evento en curso
  tiendaActual: null, // { consumibles, gratuito, reclutables, nivelReclutamiento } — oferta fijada al entrar al nodo
  avisoUltimoNodo: null, // texto breve para la UI (ej. "Equipo curado en el descanso"), no persistente
  runTerminada: false,
  runGanada: false,
  huboDerrotaEnEsteArco: false, // para el logro "completarArcoSinDerrotas" — se resetea en iniciarRun, se marca en _aplicarDerrota

  // ---------- ACCIONES ----------

  /** Arranca una run nueva con hasta 3 personajes iniciales (config.equipo.tamanoMaximo). */
  iniciarRun(personajesInicialesIds, arco = ORDEN_ARCOS[0]) {
    const tamanoMaximo = configGlobal.equipo.tamanoMaximo;
    const equipoInicial = personajesInicialesIds
      .slice(0, tamanoMaximo)
      .map((id) => crearInstanciaPersonaje(id));

    const inventarioInicial = obtenerObjetosInicialesDesbloqueados(
      achievementsData.logros,
      useAchievementsStore.getState().logrosDesbloqueados,
    );

    set({
      equipo: equipoInicial,
      oro: configGlobal.economia.oroInicial,
      inventario: inventarioInicial,
      buffsTemporales: [],
      arcoActualId: arco.id,
      arcoActualDatos: arco,
      mapa: generarMapa(arco),
      nodoActualId: null,
      pantalla: 'mapa',
      ultimoResultadoCombate: null,
      eventoActual: null,
      tiendaActual: null,
      avisoUltimoNodo: null,
      runTerminada: false,
      runGanada: false,
      huboDerrotaEnEsteArco: false,
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

    if (nodo.tipo === 'tienda') {
      const equipoActual = get().equipo;
      // Nivel equilibrado con el equipo (el del más fuerte), no con el piso
      // — antes usaba calcularNivelPorPiso y el reclutado podía entrar muy
      // por debajo del resto (p. ej. nivel 2 con el equipo ya en nivel 8).
      const nivelReclutamiento = Math.max(1, ...equipoActual.map((p) => p.nivel));
      const oferta = generarOfertaTienda(equipoActual, arcoActualDatos, nivelReclutamiento);
      set({ tiendaActual: oferta, pantalla: 'tienda' });
      return null;
    }

    // reclutamiento: sin pantalla propia todavía (ya no existe como nodo — ver 14-reclutamiento-y-rareza.md).
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
   * Añade un personaje reclutado al equipo. Si hay hueco libre (por debajo
   * de tamanoMaximo), se añade al final con `nivelInicial` tal cual — ya
   * viene equilibrado con el equipo (nivel del más fuerte, ver
   * `avanzarANodo`). Si el equipo ya está completo, hace falta indicar
   * `idAReemplazar` (el personaje sale del equipo — y de la run — para
   * dejarle el sitio); sin ese id, no hace nada y devuelve false para que
   * la UI pueda pedírselo al jugador. Reemplazar da además
   * `bonusNivelAlReemplazar` de más — así reemplazar a alguien es mejor que
   * simplemente rellenar un hueco vacío, no solo lateral.
   */
  reclutarPersonaje(id, nivelInicial = 1, idAReemplazar = null) {
    const { equipo } = get();
    if (equipo.some((p) => p.id === id)) return false; // ya está en el equipo

    if (equipo.length < configGlobal.equipo.tamanoMaximo) {
      set({ equipo: [...equipo, crearInstanciaPersonaje(id, nivelInicial)] });
      return true;
    }

    if (!idAReemplazar) return false; // equipo lleno, hace falta saber a quién reemplazar
    const indiceAReemplazar = equipo.findIndex((p) => p.id === idAReemplazar);
    if (indiceAReemplazar === -1) return false;

    const nivelConBonus = nivelInicial + configGlobal.equipo.bonusNivelAlReemplazar;
    const nuevaInstancia = crearInstanciaPersonaje(id, nivelConBonus);
    const equipoActualizado = [...equipo];
    equipoActualizado[indiceAReemplazar] = nuevaInstancia;
    set({ equipo: equipoActualizado });
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
    let logrosDesbloqueados = [];
    let arcoCompletado = false;
    // Quiénes ya estaban caídos ANTES de este combate (no curados desde
    // entonces) — esos no ganan XP al ganar. Quien caiga DURANTE este mismo
    // combate (rondas encadenadas) sí ganó su XP, ya que participó.
    const idsYaDerrotadosAntesDelCombate = new Set(get().equipo.filter((p) => p.derrotado).map((p) => p.id));

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
        get()._aplicarVictoria(activo.id, luchadorJugador.hpActual, enemigoBase, idsYaDerrotadosAntesDelCombate);
        // Se desbloquean ya (persisten y afectan a tienda/inventario desde
        // ya), pero NO se notifican todavía — eso lo dispara CombatScreen
        // cuando termine la animación, para no arruinar el suspense.
        logrosDesbloqueados = get()._evaluarLogrosPorVictoria(enemigoBase);

        // ¿Este enemigo era el jefe final del arco en curso? Si además lleva
        // recompensa.finDeLaRun (solo Pain la tiene), la run entera se ha
        // ganado aquí mismo — se marca ya, antes de que la UI decida a qué
        // pantalla ir tras la animación de combate.
        const arcoEnCurso = get().arcoActualDatos;
        arcoCompletado = enemigoBase.id === arcoEnCurso?.jefeFinalId;
        if (arcoCompletado) {
          // Estilo Slay the Spire: superar el jefe de un acto cura a todo el
          // equipo por completo (y revive a quien hubiera caído), de regalo
          // antes de pasar al siguiente arco — no hace falta ir a buscar un
          // nodo de descanso justo después de la pelea más dura del arco.
          get()._curarEquipoCompleto();
          set({ avisoUltimoNodo: 'Equipo curado por completo al superar el arco.' });
        }
        if (arcoCompletado && enemigoBase.recompensa?.finDeLaRun) {
          set({ runTerminada: true, runGanada: true });
        }

        jugadorGanoFinal = true;
        break;
      } else {
        get()._aplicarDerrota(activo.id);
        // Si queda alguien vivo, el bucle continúa automáticamente con él
        // contra luchadorEnemigo, que sigue con el HP que le quedó.
      }
    }

    get()._consumirUsoBuffsTemporales();

    const resumen = { rondas, jugadorGanoFinal, logrosDesbloqueados, arcoCompletado };
    set({ ultimoResultadoCombate: resumen });
    return resumen;
  },

  /** Vuelve del resultado de combate/evento/tienda al mapa. */
  volverAlMapa() {
    set({ pantalla: 'mapa', ultimoResultadoCombate: null, eventoActual: null, tiendaActual: null });
  },

  /**
   * Tras derrotar al jefe final de un arco que NO era el último de la run,
   * genera el mapa del siguiente arco y continúa — el equipo, oro,
   * inventario y buffs se mantienen tal cual, solo cambia el arco. Si por
   * lo que sea no hay un siguiente arco conocido (arco fuera de
   * `ORDEN_ARCOS`, p. ej. en tests), no hace nada y devuelve false.
   */
  avanzarSiguienteArco() {
    const { arcoActualId } = get();
    const indiceActual = ORDEN_ARCOS.findIndex((a) => a.id === arcoActualId);
    const siguienteArco = indiceActual === -1 ? null : ORDEN_ARCOS[indiceActual + 1];
    if (!siguienteArco) return false;

    set({
      arcoActualId: siguienteArco.id,
      arcoActualDatos: siguienteArco,
      mapa: generarMapa(siguienteArco),
      nodoActualId: null,
      pantalla: 'mapa',
      ultimoResultadoCombate: null,
      eventoActual: null,
      tiendaActual: null,
      avisoUltimoNodo: null,
      huboDerrotaEnEsteArco: false,
    });
    return true;
  },

  /** Tras ver el resultado del combate final de la run, pasa a la pantalla de Game Over. */
  irAGameOver() {
    set({ pantalla: 'gameover' });
  },

  /** Abre la pantalla de Logros (accesible desde el mapa). volverAlMapa() la cierra. */
  abrirLogros() {
    set({ pantalla: 'logros' });
  },

  /** Compra uno de los consumibles ofrecidos en la tienda actual. Se puede comprar más de uno. */
  comprarConsumibleTienda(itemId) {
    const { tiendaActual, oro, inventario } = get();
    if (!tiendaActual || !tiendaActual.consumibles.includes(itemId)) return false;
    const item = itemsData.objetos.find((o) => o.id === itemId);
    if (!item || oro < item.precioTienda) return false;

    set({
      oro: oro - item.precioTienda,
      inventario: [...inventario, item.id],
      tiendaActual: {
        ...tiendaActual,
        consumibles: tiendaActual.consumibles.filter((id) => id !== itemId),
      },
    });
    return true;
  },

  /** Reclama el objeto pasivo gratuito de la tienda actual (una sola vez por visita). */
  reclamarObjetoGratuitoTienda() {
    const { tiendaActual, inventario } = get();
    if (!tiendaActual || !tiendaActual.gratuito) return false;

    set({
      inventario: [...inventario, tiendaActual.gratuito],
      tiendaActual: { ...tiendaActual, gratuito: null },
    });
    return true;
  },

  /**
   * Recluta a uno de los dos personajes ofrecidos en la tienda actual. Al
   * reclutar uno, el otro se descarta automáticamente (solo se puede elegir
   * uno de los dos, como pedía el diseño). Si el equipo ya está completo,
   * `idAReemplazar` indica a quién saca del equipo para dejarle el sitio —
   * ver `reclutarPersonaje`.
   */
  reclutarDeTienda(personajeId, idAReemplazar = null) {
    const { tiendaActual, oro } = get();
    if (!tiendaActual) return false;
    const opcion = tiendaActual.reclutables.find((r) => r.personajeId === personajeId);
    if (!opcion || oro < opcion.precio) return false;

    const reclutado = get().reclutarPersonaje(personajeId, tiendaActual.nivelReclutamiento, idAReemplazar);
    if (!reclutado) return false; // equipo lleno y sin idAReemplazar (o no válido), no se cobra

    set({
      oro: oro - opcion.precio,
      tiendaActual: { ...tiendaActual, reclutables: [] }, // se descarta la otra opción
    });
    return true;
  },

  /**
   * Reinicia la run tras un game over: pone mapa a null, lo que hace que el
   * useEffect de App.jsx (que solo llama a iniciarRun si !mapa) arranque una
   * run nueva automáticamente, sin duplicar esa lógica aquí.
   */
  reiniciarRun() {
    set({ mapa: null, pantalla: 'mapa', ultimoResultadoCombate: null, eventoActual: null, tiendaActual: null });
  },

  /** Interno: reduce en 1 los combates restantes de cada buff temporal y elimina los agotados. */
  _consumirUsoBuffsTemporales() {
    const { buffsTemporales } = get();
    const actualizados = buffsTemporales
      .map((b) => ({ ...b, combatesRestantes: b.combatesRestantes - 1 }))
      .filter((b) => b.combatesRestantes > 0);
    set({ buffsTemporales: actualizados });
  },

  /**
   * Interno: aplica XP, recompensas y persiste el HP final tras ganar un
   * combate. `idsYaDerrotadosAntesDelCombate`: quiénes ya estaban caídos
   * antes de que este combate empezara — esos se saltan por completo (nada
   * de XP hasta que se curen). Un personaje que cae DURANTE este mismo
   * combate (rondas encadenadas y luego gana otro compañero) sí gana su XP
   * de banquillo por haber participado, pero su HP se queda a 0 — ganar XP
   * no debe "revivirlo" de regalo si sube de nivel.
   */
  _aplicarVictoria(idPersonaje, hpFinalActivo, enemigoBase, idsYaDerrotadosAntesDelCombate) {
    const { equipo, oro, inventario } = get();
    const xpGanada = enemigoBase.recompensa?.xp ?? 20;
    const porcentajeBanquillo = configGlobal.progresion.porcentajeXpBanquillo;
    const oroGanado = Math.round(
      (configGlobal.economia.oroPorCombateGanado.min +
        configGlobal.economia.oroPorCombateGanado.max) / 2,
    );

    const equipoActualizado = equipo.map((p) => {
      if (idsYaDerrotadosAntesDelCombate.has(p.id)) return p;

      const xpParaEste = p.id === idPersonaje ? xpGanada : Math.round(xpGanada * porcentajeBanquillo);
      const conXp = aplicarXpYActualizarHp(p, xpParaEste);

      if (p.id === idPersonaje) return { ...conXp, hpActual: hpFinalActivo };
      if (p.derrotado) return { ...conXp, hpActual: 0 }; // cayó en este combate: gana XP, sigue a 0 HP
      return conXp; // vivo y no participó: gana su XP de banquillo, HP sin cambios
    });

    const objetoGanado = enemigoBase.recompensa?.objetoGarantizado;
    const inventarioActualizado = objetoGanado ? [...inventario, objetoGanado] : inventario;

    set({
      equipo: equipoActualizado,
      oro: oro + oroGanado,
      inventario: inventarioActualizado,
    });
  },

  /**
   * Interno: evalúa los logros que pueden desbloquearse al ganar un combate.
   * Cubre "derrotar a un jefe concreto" siempre, y "completar el arco sin
   * ninguna derrota" solo cuando el enemigo vencido era el jefe final del
   * arco en curso (nodo.tipo === 'jefe'). Devuelve los logros recién
   * desbloqueados (ya persistidos) para que CombatScreen los notifique
   * cuando termine la animación — ver el comentario en `jugarCombate`.
   */
  _evaluarLogrosPorVictoria(enemigoBase) {
    const { arcoActualDatos, huboDerrotaEnEsteArco } = get();
    const esJefeFinalDelArco = enemigoBase.id === arcoActualDatos?.jefeFinalId;
    return useAchievementsStore.getState().evaluarLogros({
      jefeDerrotadoId: enemigoBase.id,
      arcoCompletadoId: esJefeFinalDelArco ? arcoActualDatos.id : null,
      arcoCompletadoSinDerrotas: esJefeFinalDelArco && !huboDerrotaEnEsteArco,
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
      huboDerrotaEnEsteArco: true,
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
        set({ equipo: equipoActualizado, avisoUltimoNodo: 'El equipo se ha recuperado.' });
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
