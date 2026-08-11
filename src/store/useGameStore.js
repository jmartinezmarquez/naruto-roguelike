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
import commonEnemiesData from '../data/common-enemies.json';
import achievementsData from '../data/achievements.json';
import arcoPaisDeLasOlas from '../data/arcs/pais-de-las-olas.json';
import arcoExamenChunin from '../data/arcs/examen-chunin.json';
import arcoInvasionDePain from '../data/arcs/invasion-de-pain.json';

import { crearLuchador, resolverCombateCompleto } from '../engine/combat';
import { ganarXp } from '../engine/leveling';
import { generarMapa, resolverEnemigoDeNodo } from '../engine/mapGenerator';
import { obtenerPersonajesReclutablesDesbloqueados, obtenerObjetosInicialesDesbloqueados } from '../engine/achievements';
import { normalizarPasivas, cantidadDePasiva } from '../engine/passives';
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

/**
 * Datos base del personaje con sus bonificaciones permanentes (evento
 * `mejoraPermanenteAleatoria`) ya sumadas a statsBase.
 *
 * Los objetos equipados ya NO suman stats aquí: desde el rediseño de balance
 * dan pasivas, no números (ver documentacion/30-sistema-de-pasivas.md). Se
 * pasan aparte a `crearLuchador`, porque cambian reglas del combate en vez de
 * engordar las cuatro estadísticas de siempre.
 */
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
    objetoEquipadoId: null, // id de items.json equipado, o null — ver equiparObjeto/desequiparObjeto
  };
  instanciaBase.hpActual = calcularHpMaximo(instanciaBase);
  return instanciaBase;
}

/** Convierte el formato de porcentaje de items.json ("40porciento") a la fracción 0.4. */
function porcentajeDesdeTexto(cantidadTexto) {
  return parseInt(cantidadTexto, 10) / 100;
}

/** Objeto equipado por una instancia, o null si no lleva nada (o el id no se encuentra). */
function objetoEquipadoDe(instancia) {
  if (!instancia.objetoEquipadoId) return null;
  return itemsData.objetos.find((o) => o.id === instancia.objetoEquipadoId) ?? null;
}

/**
 * Pasivas del objeto que lleve equipado, normalizadas. Son las mismas que puede
 * declarar una transformación: modos y objetos comparten catálogo
 * (ver documentacion/30-sistema-de-pasivas.md). Se releen de `itemsData` en cada
 * combate, no se hornean en la instancia, así que equipar o quitar un objeto se
 * nota al instante.
 */
function pasivasDeObjetoEquipado(instancia) {
  return normalizarPasivas(objetoEquipadoDe(instancia)?.pasivas ?? []);
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
 * Para un enemigo de tipo entrenador, construye la cadena completa de combates
 * del nodo: N genins aleatorios seguidos del propio entrenador. El nivel de
 * los genins es el mismo que el del entrenador (mismo piso).
 */
function generarCadenaEntrenador(namedEnemy, nivel) {
  const geninAntes = namedEnemy.geninAntes ?? 1;
  const genins = elegirVariosAlAzar(commonEnemiesData.plantillasGenericas, geninAntes);
  return [
    ...genins.map((g) => ({ enemigoBase: g, nivel })),
    { enemigoBase: namedEnemy, nivel },
  ];
}

/**
 * Genera la oferta de un nodo de tienda: 3 objetos aleatorios (consumibles
 * o equipables) que el jugador puede comprar individualmente. Sin reclutar,
 * sin objeto gratuito — esos mecanismos viven ahora en los nodos de reclutar
 * y en la recompensa del mini-jefe respectivamente.
 */
function generarOfertaTienda() {
  const pool = itemsData.objetos.filter((o) => o.precioTienda !== null);
  return {
    items: elegirVariosAlAzar(pool, 3).map((o) => ({ id: o.id, precio: o.precioTienda })),
  };
}

/**
 * Genera la oferta del nodo de reclutar: hasta 3 personajes disponibles
 * (pool del arco + desbloqueados por logro + iniciales no elegidos), sin
 * coste para el jugador — elegir uno es la acción principal de este nodo.
 */
function generarOfertaReclutar(equipoActual, arcoActualDatos, nivelReclutamiento) {
  const idsDesbloqueadosPorLogro = obtenerPersonajesReclutablesDesbloqueados(
    achievementsData.logros,
    useAchievementsStore.getState().logrosDesbloqueados,
  );
  const idsInicialesNoElegidos = personajesData.personajes
    .filter((p) => p.rareza === 'inicial')
    .map((p) => p.id);
  const idsReclutablesTotal = [
    ...(arcoActualDatos.personajesReclutablesIds ?? []),
    ...idsDesbloqueadosPorLogro,
    ...idsInicialesNoElegidos,
  ];

  const idsEnEquipo = new Set(equipoActual.map((p) => p.id));
  const disponibles = idsReclutablesTotal
    .filter((id) => !idsEnEquipo.has(id))
    .map((id) => {
      const base = encontrarPersonajeBase(id);
      return { personajeId: id, nombre: base.nombre, rareza: base.rareza };
    });

  return {
    personajes: elegirVariosAlAzar(disponibles, 3),
    nivelReclutamiento,
  };
}

export const useGameStore = create((set, get) => ({
  // ---------- ESTADO ----------
  equipo: [], // instancias { id, nivel, xpActual, derrotado, hpActual, bonificaciones }, en orden de posición
  oro: 0,
  inventario: [], // ids de items sin asignar: equipables sueltos + consumibles sin usar (los equipados viven en equipo[].objetoEquipadoId, no aquí)
  buffsTemporales: [], // [{ multiplicadores: {stat: x}, combatesRestantes }] — de eventos tipo "boost 3 combates"
  arcoActualId: null,
  arcoActualDatos: null, // el JSON del arco en curso, guardado para no reimportarlo por id
  mapa: null, // { arcoId, pisos, nodos, nodosIniciales } — generado por engine/mapGenerator
  nodoActualId: null,
  pantalla: 'mapa', // 'mapa' | 'combate' | 'evento' | 'tienda' | 'reclutar' | 'recompensaMiniJefe' | 'gameover' | 'logros' | 'mochila'
  mochilaItemId: null, // objeto preseleccionado al abrir la mochila (ver abrirMochila)
  ultimoResultadoCombate: null, // resumen enriquecido del último combate — ver jugarCombate
  eventoActual: null, // { id, titulo, descripcion, elecciones } — evento en curso
  tiendaActual: null, // { items: [{id, precio}] } — oferta de 3 objetos al entrar al nodo de tienda
  reclutarActual: null, // { personajes: [{personajeId, nombre, rareza}], nivelReclutamiento } — oferta del nodo de reclutar
  recompensaMiniJefe: null, // { item: id } — objeto aleatorio tras derrotar al mini-jefe
  cadenaEnemigos: null, // { enemigos: [{enemigoBase, nivel}], indiceActual: 0 } — combate de entrenador con genins previos
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
    const mapaInicial = generarMapa(arco);

    set({
      equipo: equipoInicial,
      oro: configGlobal.economia.oroInicial,
      inventario: inventarioInicial,
      buffsTemporales: [],
      arcoActualId: arco.id,
      arcoActualDatos: arco,
      mapa: mapaInicial,
      // La run arranca plantada en el nodo de salida, que ya nace visitado
      // (ver generarMapa): las primeras opciones son sus conexiones.
      nodoActualId: mapaInicial.nodoInicialId,
      pantalla: 'mapa',
      ultimoResultadoCombate: null,
      eventoActual: null,
      tiendaActual: null,
      reclutarActual: null,
      recompensaMiniJefe: null,
      cadenaEnemigos: null,
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
      let resultado;
      if (infoEnemigo.enemigoBase.esEntrenador) {
        const cadena = generarCadenaEntrenador(infoEnemigo.enemigoBase, infoEnemigo.nivel);
        set({ cadenaEnemigos: { enemigos: cadena, indiceActual: 0 } });
        resultado = get().jugarCombate(cadena[0].enemigoBase, cadena[0].nivel, false);
      } else {
        set({ cadenaEnemigos: null });
        resultado = get().jugarCombate(infoEnemigo.enemigoBase, infoEnemigo.nivel, true);
      }
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
      set({ avisoUltimoNodo: 'Team fully healed at the rest node.' });
      return null;
    }

    if (nodo.tipo === 'tienda') {
      set({ tiendaActual: generarOfertaTienda(), pantalla: 'tienda' });
      return null;
    }

    if (nodo.tipo === 'reclutar') {
      const equipoActual = get().equipo;
      const nivelReclutamiento = Math.max(1, ...equipoActual.map((p) => p.nivel));
      const oferta = generarOfertaReclutar(equipoActual, arcoActualDatos, nivelReclutamiento);
      set({ reclutarActual: oferta, pantalla: 'reclutar' });
      return null;
    }

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
   * simplemente rellenar un hueco vacío, no solo lateral. Si el reemplazado
   * llevaba algo equipado, el objeto vuelve al inventario — no desaparece
   * con él.
   */
  reclutarPersonaje(id, nivelInicial = 1, idAReemplazar = null) {
    const { equipo, inventario } = get();
    if (equipo.some((p) => p.id === id)) return false; // ya está en el equipo

    if (equipo.length < configGlobal.equipo.tamanoMaximo) {
      set({ equipo: [...equipo, crearInstanciaPersonaje(id, nivelInicial)] });
      return true;
    }

    if (!idAReemplazar) return false; // equipo lleno, hace falta saber a quién reemplazar
    const indiceAReemplazar = equipo.findIndex((p) => p.id === idAReemplazar);
    if (indiceAReemplazar === -1) return false;

    const reemplazado = equipo[indiceAReemplazar];
    const inventarioActualizado = reemplazado.objetoEquipadoId
      ? [...inventario, reemplazado.objetoEquipadoId]
      : inventario;

    const nivelConBonus = nivelInicial + configGlobal.equipo.bonusNivelAlReemplazar;
    const nuevaInstancia = crearInstanciaPersonaje(id, nivelConBonus);
    const equipoActualizado = [...equipo];
    equipoActualizado[indiceAReemplazar] = nuevaInstancia;
    set({ equipo: equipoActualizado, inventario: inventarioActualizado });
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

  /**
   * Equipa un objeto del inventario a un personaje del equipo — un hueco
   * por personaje. Si ese personaje ya llevaba algo puesto, vuelve al
   * inventario (se reemplaza, no se pierde). El objeto sale del inventario
   * mientras esté equipado.
   */
  equiparObjeto(itemId, idPersonaje) {
    const { inventario, equipo } = get();
    if (!inventario.includes(itemId)) return false;
    const item = itemsData.objetos.find((o) => o.id === itemId);
    if (!item || item.tipo !== 'equipable') return false;
    const indice = equipo.findIndex((p) => p.id === idPersonaje);
    if (indice === -1) return false;

    const anterior = equipo[indice].objetoEquipadoId;
    // Quita solo UNA copia del itemId (no todas, por si hay más de una).
    const posicionEnInventario = inventario.indexOf(itemId);
    const inventarioActualizado = [
      ...inventario.slice(0, posicionEnInventario),
      ...inventario.slice(posicionEnInventario + 1),
      ...(anterior ? [anterior] : []), // lo que llevaba antes vuelve al inventario
    ];

    const equipoActualizado = [...equipo];
    equipoActualizado[indice] = { ...equipo[indice], objetoEquipadoId: itemId };
    set({ equipo: equipoActualizado, inventario: inventarioActualizado });
    return true;
  },

  /** Desequipa el objeto de un personaje, si lleva alguno — vuelve al inventario. */
  desequiparObjeto(idPersonaje) {
    const { equipo, inventario } = get();
    const indice = equipo.findIndex((p) => p.id === idPersonaje);
    if (indice === -1 || !equipo[indice].objetoEquipadoId) return false;

    const equipoActualizado = [...equipo];
    const itemId = equipo[indice].objetoEquipadoId;
    equipoActualizado[indice] = { ...equipo[indice], objetoEquipadoId: null };
    set({ equipo: equipoActualizado, inventario: [...inventario, itemId] });
    return true;
  },

  /**
   * Usa un objeto consumible del inventario sobre un personaje del equipo y
   * gasta 1 copia. Hoy solo hay un efecto de consumible implementado:
   * `curarPersonaje` (restaura un % de HP — también revive si estaba
   * derrotado, a ese % de su HP máximo, no a HP completo).
   */
  usarConsumible(itemId, idPersonaje) {
    const { inventario, equipo } = get();
    if (!inventario.includes(itemId)) return false;
    const item = itemsData.objetos.find((o) => o.id === itemId);
    if (!item || item.tipo !== 'consumible') return false;
    const indice = equipo.findIndex((p) => p.id === idPersonaje);
    if (indice === -1) return false;
    if (item.efecto.tipo !== 'curarPersonaje') return false; // ningún otro efecto de consumible implementado todavía

    const objetivo = equipo[indice];
    const hpMax = calcularHpMaximo(objetivo);
    const curado = Math.min(
      hpMax,
      objetivo.hpActual + Math.round(hpMax * porcentajeDesdeTexto(item.efecto.cantidad)),
    );
    const equipoActualizado = [...equipo];
    equipoActualizado[indice] = { ...objetivo, derrotado: false, hpActual: curado };

    const posicionEnInventario = inventario.indexOf(itemId);
    const inventarioActualizado = [
      ...inventario.slice(0, posicionEnInventario),
      ...inventario.slice(posicionEnInventario + 1),
    ];

    set({ equipo: equipoActualizado, inventario: inventarioActualizado });
    return true;
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
  jugarCombate(enemigoBase, nivelEnemigo, consumirBuffs = true) {
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
      const luchadorJugador = crearLuchador(
        personajeBase,
        activo.nivel,
        activo.hpActual,
        multiplicadoresBuffs,
        1,
        pasivasDeObjetoEquipado(activo),
      );
      const hpInicialJugador = luchadorJugador.hpActual;
      const hpInicialEnemigo = luchadorEnemigo.hpActual;
      // El enemigo es UNO solo para todo el nodo, así que arrastra su barra de
      // jutsu de ronda en ronda igual que arrastra el HP: si tenía la barra a
      // tope cuando cayó tu activo, el siguiente personaje se come el jutsu
      // nada más entrar. El jugador, en cambio, entra con la carga inicial de
      // su propio perfil (0 salvo objeto que lo cambie).
      const cargaInicialJugador = luchadorJugador.cargaJutsu;
      const cargaInicialEnemigo = luchadorEnemigo.cargaJutsu;

      const resultado = resolverCombateCompleto(luchadorJugador, luchadorEnemigo);
      const jugadorGanoRonda = resultado.ganadorId === luchadorJugador.id;

      rondas.push({
        historial: resultado.historial,
        turnosUsados: resultado.turnosUsados,
        jugadorGano: jugadorGanoRonda,
        cargaMaxima: luchadorJugador.cargaMaxima,
        jugador: {
          id: luchadorJugador.id,
          nombre: luchadorJugador.nombre,
          nivel: luchadorJugador.nivel,
          hpInicial: hpInicialJugador,
          hpMaximo: luchadorJugador.hpMaximo,
          hpFinal: luchadorJugador.hpActual,
          cargaInicial: cargaInicialJugador,
          modoActivoNombre: luchadorJugador.modoActivo?.nombre ?? null,
        },
        enemigo: {
          id: luchadorEnemigo.id,
          nombre: luchadorEnemigo.nombre,
          nivel: luchadorEnemigo.nivel,
          hpInicial: hpInicialEnemigo,
          hpMaximo: luchadorEnemigo.hpMaximo,
          hpFinal: luchadorEnemigo.hpActual,
          cargaInicial: cargaInicialEnemigo,
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
          set({ avisoUltimoNodo: 'Team fully healed after completing the arc.' });
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

    if (consumirBuffs) get()._consumirUsoBuffsTemporales();

    const resumen = { rondas, jugadorGanoFinal, logrosDesbloqueados, arcoCompletado };
    set({ ultimoResultadoCombate: resumen });
    return resumen;
  },

  /** Vuelve al mapa desde cualquier pantalla secundaria (combate, evento, tienda, reclutar, recompensa). */
  volverAlMapa() {
    set({
      pantalla: 'mapa',
      ultimoResultadoCombate: null,
      eventoActual: null,
      tiendaActual: null,
      reclutarActual: null,
      recompensaMiniJefe: null,
      cadenaEnemigos: null,
      mochilaItemId: null,
    });
  },

  /**
   * Avanza al siguiente combate dentro de una cadena de entrenador.
   * Si es el último de la cadena, consume los buffs (se diferió hasta ahora).
   */
  continuarCadena() {
    const { cadenaEnemigos } = get();
    if (!cadenaEnemigos) return;
    const nuevoIndice = cadenaEnemigos.indiceActual + 1;
    const esUltimo = nuevoIndice === cadenaEnemigos.enemigos.length - 1;
    const siguiente = cadenaEnemigos.enemigos[nuevoIndice];
    set({ cadenaEnemigos: { ...cadenaEnemigos, indiceActual: nuevoIndice } });
    get().jugarCombate(siguiente.enemigoBase, siguiente.nivel, esUltimo);
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

    const mapaSiguiente = generarMapa(siguienteArco);
    set({
      arcoActualId: siguienteArco.id,
      arcoActualDatos: siguienteArco,
      mapa: mapaSiguiente,
      nodoActualId: mapaSiguiente.nodoInicialId,
      pantalla: 'mapa',
      ultimoResultadoCombate: null,
      eventoActual: null,
      tiendaActual: null,
      reclutarActual: null,
      recompensaMiniJefe: null,
      cadenaEnemigos: null,
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

  /**
   * Abre la mochila (pantalla propia, no un panel dentro del mapa).
   * `itemIdInicial` deja preseleccionado un objeto: así, tocar un objeto en el
   * resumen del mapa lleva directo a su ficha en vez de a la lista en frío.
   * volverAlMapa() la cierra.
   */
  abrirMochila(itemIdInicial = null) {
    set({ pantalla: 'mochila', mochilaItemId: itemIdInicial });
  },

  /** Compra uno de los objetos ofrecidos en la tienda actual (consumible o equipable). */
  comprarItemTienda(itemId) {
    const { tiendaActual, oro, inventario } = get();
    if (!tiendaActual) return false;
    const entrada = tiendaActual.items.find((i) => i.id === itemId);
    if (!entrada || oro < entrada.precio) return false;

    set({
      oro: oro - entrada.precio,
      inventario: [...inventario, itemId],
      tiendaActual: {
        ...tiendaActual,
        items: tiendaActual.items.filter((i) => i.id !== itemId),
      },
    });
    return true;
  },

  /**
   * Recluta al personaje elegido en el nodo de reclutar (sin coste). Si el
   * equipo ya está completo, `idAReemplazar` indica a quién reemplaza — sin
   * ese id la acción no hace nada (la UI debe pedírselo primero al jugador).
   */
  elegirReclutaDeNodo(personajeId, idAReemplazar = null) {
    const { reclutarActual } = get();
    if (!reclutarActual) return false;
    const opcion = reclutarActual.personajes.find((p) => p.personajeId === personajeId);
    if (!opcion) return false;

    return get().reclutarPersonaje(personajeId, reclutarActual.nivelReclutamiento, idAReemplazar);
  },

  /** Navega a la pantalla de recompensa del mini-jefe (llamado desde CombatScreen al pulsar Continuar). */
  irARecompensaMiniJefe() {
    set({ pantalla: 'recompensaMiniJefe' });
  },

  /** Recoge el objeto de recompensa del mini-jefe y vuelve al mapa. */
  reclamarRecompensaMiniJefe() {
    const { inventario, recompensaMiniJefe } = get();
    if (recompensaMiniJefe?.item) {
      set({ inventario: [...inventario, recompensaMiniJefe.item] });
    }
    get().volverAlMapa();
  },

  /** Salta la recompensa del mini-jefe sin coger nada. */
  saltarRecompensaMiniJefe() {
    get().volverAlMapa();
  },

  /**
   * Reinicia la run tras un game over: pone mapa a null, lo que hace que el
   * useEffect de App.jsx (que solo llama a iniciarRun si !mapa) arranque una
   * run nueva automáticamente, sin duplicar esa lógica aquí.
   */
  reiniciarRun() {
    set({
      mapa: null,
      pantalla: 'mapa',
      ultimoResultadoCombate: null,
      eventoActual: null,
      tiendaActual: null,
      reclutarActual: null,
      recompensaMiniJefe: null,
    });
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

      if (p.id === idPersonaje) {
        const conHp = { ...conXp, hpActual: hpFinalActivo };
        // Pasiva `heal_after_battle` del objeto equipado (Pergamino de Reserva):
        // cura un % extra a quien lo lleve, justo tras ganar. Es de las que el
        // motor no toca — pasa DESPUÉS de la pelea, no dentro.
        const curacion = cantidadDePasiva(pasivasDeObjetoEquipado(conHp), 'heal_after_battle');
        if (curacion > 0) {
          const hpMax = calcularHpMaximo(conHp);
          return { ...conHp, hpActual: Math.min(hpMax, conHp.hpActual + Math.round(hpMax * curacion)) };
        }
        return conHp;
      }
      if (p.derrotado) return { ...conXp, hpActual: 0 }; // cayó en este combate: gana XP, sigue a 0 HP
      return conXp; // vivo y no participó: gana su XP de banquillo, HP sin cambios
    });

    const objetoGanado = enemigoBase.recompensa?.objetoGarantizado;
    const esMiniJefe = enemigoBase.id === get().arcoActualDatos?.miniJefeId;

    let inventarioActualizado = inventario;
    let recompensaNueva = null;

    if (objetoGanado) {
      if (esMiniJefe) {
        // Mini-jefe: mostrar pantalla de recompensa con el objeto garantizado del jefe.
        recompensaNueva = { item: objetoGanado };
      } else {
        // Jefe final: se auto-añade al inventario (la transición de arco ya
        // es bastante pantalla, no añadir otra de recompensa encima).
        inventarioActualizado = [...inventario, objetoGanado];
      }
    }

    set({
      equipo: equipoActualizado,
      oro: oro + oroGanado,
      inventario: inventarioActualizado,
      ...(recompensaNueva ? { recompensaMiniJefe: recompensaNueva } : {}),
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

  /**
   * Interno: marca al personaje como derrotado (HP a 0) y lo manda al final
   * del orden — SALVO que lleve equipado un objeto `revivirUnaVez`, en cuyo
   * caso revive con `hpAlRevivir` HP en su lugar y el objeto se consume (no
   * vuelve al inventario, "se consume al activarse"). El bucle de
   * `jugarCombate` lo vuelve a poner como activo automáticamente — sigue
   * siendo el mismo personaje, solo que sobrevivió por los pelos.
   */
  _aplicarDerrota(idPersonaje) {
    const { equipo } = get();
    const instancia = equipo.find((p) => p.id === idPersonaje);
    const itemEquipado = instancia && objetoEquipadoDe(instancia);

    if (itemEquipado?.efecto?.tipo === 'revivirUnaVez') {
      set({
        equipo: equipo.map((p) => (
          p.id === idPersonaje
            ? { ...p, hpActual: itemEquipado.efecto.hpAlRevivir, objetoEquipadoId: null }
            : p
        )),
      });
      return;
    }

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
        set({ equipo: equipoActualizado, avisoUltimoNodo: 'The team has recovered.' });
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
