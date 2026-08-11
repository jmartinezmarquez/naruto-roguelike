// src/engine/passives.js
// Catálogo de pasivas: efectos con nombre que modifican REGLAS del combate en
// vez de estadísticas. Lógica pura, sin React ni store.
//
// El problema que resuelve (ver documentacion/27-sistema-de-balance.md): niveles,
// transformaciones y objetos subían los mismos cuatro números, así que la única
// palanca de balance era "más grande" y el juego hacía bola de nieve. Una pasiva
// no escala con el nivel: "el primer golpe recibido hace un 50% menos de daño"
// vale lo mismo en el nivel 3 que en el 90.
//
// Modos y objetos DECLARAN pasivas por su id y comparten estas implementaciones,
// para no duplicar la lógica en dos sitios (que es justo lo que pide el doc 27).

import pasivasData from '../data/passives.json';

/**
 * Puntos de enganche. Cada pasiva vive en uno solo, y el enganche determina la
 * forma de su función: los tres primeros pliegan un valor, PRIORIDAD y
 * ATAQUE_EXTRA responden sí/no, y AL_DERROTAR provoca un efecto.
 */
export const ENGANCHES = {
  DEFENSA_EFECTIVA: 'defensaEfectiva', // pliega la defensa del rival (la consulta el ATACANTE)
  DANO_INFLIGIDO: 'danoInfligido', // pliega el daño de salida (lo consulta el ATACANTE)
  DANO_RECIBIDO: 'danoRecibido', // pliega el daño de entrada (lo consulta el DEFENSOR)
  PRIORIDAD: 'prioridad', // ¿actúa antes, pase lo que pase con la velocidad?
  ATAQUE_EXTRA: 'ataqueExtra', // ¿repite el golpe?
  AL_DERROTAR: 'alDerrotar', // efecto al dejar al rival a 0
  // Fuera del combate: `combat.js` NUNCA consulta este enganche. Lo lee el store
  // cuando resuelve la victoria (curar, oro y XP extra pasan DESPUÉS de la
  // pelea, no dentro). Está en el mismo catálogo porque un objeto declara todas
  // sus pasivas en una sola lista, dentro y fuera del combate.
  TRAS_COMBATE: 'trasCombate',
};

/**
 * A quién afecta una pasiva. El MVP solo resuelve estos dos, pero el campo
 * existe desde el principio porque el doc 27 quiere poder crecer a encuentros
 * con varios enemigos ('todos_los_enemigos', 'siguiente_enemigo') sin rehacer el
 * motor. Añadir un objetivo nuevo será tocar `resolverObjetivo`, no las pasivas.
 */
export const OBJETIVOS = {
  UNO_MISMO: 'uno_mismo',
  ENEMIGO_ACTUAL: 'enemigo_actual',
};

/**
 * El catálogo. Cada entrada:
 *   enganche   → cuándo se consulta
 *   objetivo   → sobre quién actúa
 *   parametros → valores por defecto, que el dato de cada modo/objeto pisa
 *   aplicar    → la lógica; su firma depende del enganche (ver arriba)
 *
 * Los valores por defecto son deliberadamente redondos: no son balance, solo
 * evitan que una pasiva mal declarada quede en 0 sin que se note. El balance real
 * lo pone cada modo y cada objeto en su JSON.
 */
const CATALOGO = {
  // --- Daño de salida -------------------------------------------------------
  first_jutsu_bonus: {
    enganche: ENGANCHES.DANO_INFLIGIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.4 },
    aplicar: (dano, ctx, p) => (ctx.esPrimerJutsu ? dano * (1 + p.cantidad) : dano),
  },

  first_attack_bonus: {
    enganche: ENGANCHES.DANO_INFLIGIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.3 },
    aplicar: (dano, ctx, p) => (ctx.esPrimerAtaque ? dano * (1 + p.cantidad) : dano),
  },

  basic_attack_bonus: {
    enganche: ENGANCHES.DANO_INFLIGIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.15 },
    aplicar: (dano, ctx, p) => (ctx.esJutsu ? dano : dano * (1 + p.cantidad)),
  },

  jutsu_bonus: {
    enganche: ENGANCHES.DANO_INFLIGIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.3 },
    aplicar: (dano, ctx, p) => (ctx.esJutsu ? dano * (1 + p.cantidad) : dano),
  },

  // El suelo se calcula sobre el daño ANTES de restar defensa (`danoBruto`), que
  // es lo que hace útil la pasiva: contra un enemigo con mucha defensa el daño
  // normal se desploma, y esto le pone un mínimo. Sobre el daño ya restado no
  // serviría de nada.
  damage_floor: {
    enganche: ENGANCHES.DANO_INFLIGIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.5 },
    aplicar: (dano, ctx, p) => Math.max(dano, ctx.danoBruto * p.cantidad),
  },

  // --- Defensa del rival ----------------------------------------------------
  ignore_defense: {
    enganche: ENGANCHES.DEFENSA_EFECTIVA,
    objetivo: OBJETIVOS.ENEMIGO_ACTUAL,
    // `soloPrimero` la restringe al primer jutsu del combate, que es lo que pide
    // el Fragmento del Rinnegan: perforar la defensa ENTERA una sola vez es un
    // efecto de objeto legendario; hacerlo cada turno rompería el combate.
    parametros: { cantidad: 0.5, soloJutsu: true, soloPrimero: false },
    aplicar: (defensa, ctx, p) => {
      if (p.soloJutsu && !ctx.esJutsu) return defensa;
      if (p.soloPrimero && !ctx.esPrimerJutsu) return defensa;
      return defensa * (1 - p.cantidad);
    },
  },

  // --- Daño de entrada ------------------------------------------------------
  // Con cantidad 1 bloquea el golpe entero (Susanoo); con 0,8 lo reduce sin
  // anularlo (Escudo Absoluto de Gaara); con 0,5 es el Protector Ninja. Un solo
  // efecto cubre los tres, que es la gracia de tener catálogo.
  first_hit_reduction: {
    enganche: ENGANCHES.DANO_RECIBIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.5 },
    aplicar: (dano, ctx, p) => (ctx.esPrimerGolpeRecibido ? dano * (1 - p.cantidad) : dano),
  },

  reduce_damage_taken: {
    enganche: ENGANCHES.DANO_RECIBIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.2 },
    aplicar: (dano, _ctx, p) => dano * (1 - p.cantidad),
  },

  // Los objetos de riesgo del doc 27 ("+30% de daño con jutsus, recibes un 15%
  // más") necesitan poder EMPEORAR algo. Va como pasiva propia y no como
  // `reduce_damage_taken` en negativo porque su frase para el jugador es otra:
  // "recibes un 15% más de daño" se entiende, "recibes un -15% menos" no.
  increase_damage_taken: {
    enganche: ENGANCHES.DANO_RECIBIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.15 },
    aplicar: (dano, _ctx, p) => dano * (1 + p.cantidad),
  },

  // "Cuando bajas del X% de vida, reduces el daño recibido". El doc dice "el
  // SIGUIENTE daño recibido", pero eso pide llevar un estado de un solo uso; se
  // simplifica a "mientras estés por debajo", que da la misma fantasía (aguantar
  // cuando estás a punto de caer) sin contador que mantener.
  low_hp_reduction: {
    enganche: ENGANCHES.DANO_RECIBIDO,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.4, umbral: 0.3 },
    aplicar: (dano, ctx, p) => (
      ctx.defensor.hpActual / ctx.defensor.hpMaximo <= p.umbral ? dano * (1 - p.cantidad) : dano
    ),
  },

  // --- Reglas del turno -----------------------------------------------------
  priority: {
    enganche: ENGANCHES.PRIORIDAD,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: {},
    aplicar: () => true,
  },

  repeat_basic_chance: {
    enganche: ENGANCHES.ATAQUE_EXTRA,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.3 },
    aplicar: (ctx, p) => !ctx.esJutsu && ctx.azar() < p.cantidad,
  },

  // --- Fuera del combate (las resuelve el store, no combat.js) --------------
  // Sin `aplicar`: no hay nada que ejecutar aquí, el store lee la cantidad con
  // `cantidadDePasiva` y decide qué hacer con ella. Que estén en el catálogo es
  // lo que garantiza que tengan id validado y frase para el jugador, igual que
  // el resto.
  heal_after_battle: {
    enganche: ENGANCHES.TRAS_COMBATE,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.12 },
  },

  // --- Al derrotar ----------------------------------------------------------
  heal_on_kill: {
    enganche: ENGANCHES.AL_DERROTAR,
    objetivo: OBJETIVOS.UNO_MISMO,
    parametros: { cantidad: 0.1 },
    aplicar: (ctx, p) => {
      const curacion = Math.round(ctx.atacante.hpMaximo * p.cantidad);
      const antes = ctx.atacante.hpActual;
      ctx.atacante.hpActual = Math.min(ctx.atacante.hpMaximo, antes + curacion);
      return ctx.atacante.hpActual > antes;
    },
  },
};

export function existePasiva(id) {
  return Object.hasOwn(CATALOGO, id);
}

export function idsDelCatalogo() {
  return Object.keys(CATALOGO);
}

/**
 * Convierte la declaración de un dato en pasivas listas para usar. Se admite la
 * forma corta `"heal_on_kill"` (todo por defecto) y la larga
 * `{ "id": "heal_on_kill", "cantidad": 0.25 }`, porque la mayoría de
 * declaraciones no necesitan tocar nada y obligar a un objeto para todas ensucia
 * los JSON de 14 personajes.
 *
 * Un id desconocido **revienta** en vez de ignorarse: una pasiva que no hace
 * nada en silencio es el peor fallo posible aquí — el personaje parecería
 * funcionar y estaría desbalanceado sin que nada lo delatara.
 */
export function normalizarPasivas(declaraciones = []) {
  return declaraciones.map((declaracion) => {
    const { id, ...parametros } = typeof declaracion === 'string' ? { id: declaracion } : declaracion;
    const entrada = CATALOGO[id];
    if (!entrada) {
      throw new Error(`Pasiva desconocida: "${id}". Ids válidos: ${idsDelCatalogo().join(', ')}`);
    }
    return {
      id,
      enganche: entrada.enganche,
      objetivo: parametros.objetivo ?? entrada.objetivo,
      parametros: { ...entrada.parametros, ...parametros },
    };
  });
}

function pasivasDe(portador, enganche) {
  return (portador?.pasivas ?? []).filter((p) => p.enganche === enganche);
}

/**
 * Anota que una pasiva ha hecho algo. La lista viaja en el contexto y acaba en
 * el evento del turno, para que la pantalla de combate pueda enseñar que el
 * golpe se bloqueó o que alguien se curó al rematar — sin esto la animación solo
 * vería un número de daño raro y no sabría explicarlo.
 */
function anotar(contexto, id) {
  if (contexto.activadas && !contexto.activadas.includes(id)) contexto.activadas.push(id);
}

/**
 * Pliega un valor a través de las pasivas de `portador` en ese enganche.
 * Solo se anota la pasiva si el valor cambió de verdad: una pasiva de primer
 * jutsu no "se activa" en los turnos en que no toca.
 */
export function aplicarModificadores(enganche, valorInicial, portador, contexto) {
  return pasivasDe(portador, enganche).reduce((valor, pasiva) => {
    const nuevo = CATALOGO[pasiva.id].aplicar(valor, contexto, pasiva.parametros);
    if (nuevo !== valor) anotar(contexto, pasiva.id);
    return nuevo;
  }, valorInicial);
}

/** ¿Alguna pasiva de este enganche dice que sí? (PRIORIDAD, ATAQUE_EXTRA) */
export function alguna(enganche, portador, contexto = {}) {
  return pasivasDe(portador, enganche).some((pasiva) => {
    const siNo = CATALOGO[pasiva.id].aplicar(contexto, pasiva.parametros);
    if (siNo) anotar(contexto, pasiva.id);
    return siNo;
  });
}

/**
 * Cantidad de una pasiva concreta si el portador la tiene, o 0. Es la vía por la
 * que el **store** consulta las pasivas de fuera del combate (`TRAS_COMBATE`),
 * que no tienen `aplicar` porque no hay nada que ejecutar dentro de la pelea:
 * curar tras el combate, oro y XP extra pasan después.
 */
export function cantidadDePasiva(pasivas, id) {
  const pasiva = (pasivas ?? []).find((p) => p.id === id);
  return pasiva ? (pasiva.parametros.cantidad ?? 0) : 0;
}

/** Dispara los efectos de este enganche (AL_DERROTAR). Muta a los luchadores. */
export function ejecutarEfectos(enganche, portador, contexto) {
  for (const pasiva of pasivasDe(portador, enganche)) {
    if (CATALOGO[pasiva.id].aplicar(contexto, pasiva.parametros)) anotar(contexto, pasiva.id);
  }
}

/**
 * Línea de cara al jugador de una pasiva ya normalizada, montada con el texto de
 * `data/passives.json` y los parámetros reales de esa declaración. Es lo único
 * que ve el jugador de todo este sistema: una frase por modo o por objeto, nunca
 * un catálogo (el juego es de runs cortas — la complejidad va aquí dentro, no en
 * la pantalla).
 */
export function describirPasiva(pasiva) {
  const texto = pasivasData.pasivas.find((p) => p.id === pasiva.id);
  if (!texto) return '';
  const cantidad = pasiva.parametros.cantidad ?? 0;
  return texto.plantilla
    .replace('{porciento}', `${Math.round(cantidad * 100)}%`)
    .replace('{n}', `${cantidad}`);
}
