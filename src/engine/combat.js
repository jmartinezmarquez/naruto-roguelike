// src/engine/combat.js
// Motor de combate por turnos. Lógica pura, sin React ni store.
//
// SIMPLIFICACIÓN DEL MVP: resuelve un combate 1 vs 1 entre "luchador activo" de
// cada bando. La lógica de equipo de 3 (elegir quién sale, cambios a mitad de
// combate) se construye por encima de esto en el store, sin tocar este motor.

import tiposData from '../data/types.json';
import configGlobal from '../data/config.json';
import { calcularStatsPorNivel, aplicarMultiplicadoresModo, aplicarMultiplicadores, obtenerModoActivo } from './leveling';

/** Multiplicador de eficacia de un tipo atacante contra un tipo defensor. */
export function obtenerEficacia(tipoAtacante, tipoDefensor) {
  return tiposData.tablaEficacias[tipoAtacante]?.[tipoDefensor] ?? 1.0;
}

/**
 * Crea el estado de combate de un luchador (jugador o enemigo) a partir de
 * sus datos base y nivel actual. El modo activo (si lo hay) se calcula
 * internamente según el nivel — nunca hay que decidirlo desde fuera ni a
 * mitad de combate.
 *
 * hpActualInicial: si se pasa, el luchador empieza con ese HP en vez de a HP
 * completo (para el HP persistido entre combates). Se recorta al hpMaximo
 * calculado, por si un buff/derrota de modo lo dejó por encima.
 *
 * multiplicadoresExtra: multiplicadores adicionales aplicados DESPUÉS del
 * modo (ej. buffs temporales de eventos, "20% más ataque 3 combates"). Mismo
 * mecanismo que un modo, pero decidido por el store, no por el nivel.
 */
export function crearLuchador(personajeBase, nivel, hpActualInicial = null, multiplicadoresExtra = null) {
  const modoActivo = obtenerModoActivo(personajeBase, nivel);
  let stats = calcularStatsPorNivel(personajeBase.statsBase, nivel);
  if (modoActivo) {
    stats = aplicarMultiplicadoresModo(stats, modoActivo);
  }
  if (multiplicadoresExtra) {
    stats = aplicarMultiplicadores(stats, multiplicadoresExtra);
  }
  const hpMaximo = stats.hp;
  const hpActual = hpActualInicial !== null ? Math.min(hpActualInicial, hpMaximo) : hpMaximo;
  return {
    id: personajeBase.id,
    nombre: personajeBase.nombre,
    tipo: personajeBase.tipo,
    jutsu: personajeBase.jutsu,
    modoActivo, // null o el objeto de modo en uso, útil para que la UI lo muestre
    nivel,
    hpMaximo,
    hpActual,
    statsBase: stats,
    modificadoresTemporales: [], // { stat, cantidad, turnosRestantes } — solo dura el combate
  };
}

/** Valor efectivo de un stat, aplicando los modificadores temporales activos. */
function statEfectivo(luchador, stat) {
  const base = luchador.statsBase[stat];
  const bonus = luchador.modificadoresTemporales
    .filter((m) => m.stat === stat)
    .reduce((acc, m) => acc + m.cantidad, 0);
  return Math.max(1, base + bonus);
}

/** Daño que inflige el jutsu de 'atacante' sobre 'defensor'. */
export function calcularDano(atacante, defensor, jutsu) {
  const ataqueEfectivo = statEfectivo(atacante, 'ataque');
  const defensaEfectiva = statEfectivo(defensor, 'defensa');
  const eficacia = obtenerEficacia(atacante.tipo, defensor.tipo);

  const danoBruto = ataqueEfectivo * jutsu.danoBase * eficacia - defensaEfectiva * 0.5;
  return { cantidad: Math.max(1, Math.round(danoBruto)), eficacia };
}

/** Aplica un efecto de estado (buff/debuff temporal) al objetivo correspondiente. */
export function aplicarEfectoEstado(atacante, defensor, efecto) {
  if (!efecto) return;
  const objetivo = efecto.objetivo === 'propio' ? atacante : defensor;
  objetivo.modificadoresTemporales.push({
    stat: efecto.stat,
    cantidad: efecto.cantidad,
    turnosRestantes: efecto.duracionTurnos,
  });
}

/** Reduce en 1 la duración de los modificadores temporales y elimina los caducados. */
export function reducirDuracionModificadores(luchador) {
  luchador.modificadoresTemporales = luchador.modificadoresTemporales
    .map((m) => ({ ...m, turnosRestantes: m.turnosRestantes - 1 }))
    .filter((m) => m.turnosRestantes > 0);
}

/**
 * Ejecuta el jutsu de 'atacante' sobre 'defensor': aplica daño y efecto de
 * estado. Muta hpActual y modificadoresTemporales de los luchadores dados.
 * Devuelve un resumen del turno, pensado para que la UI lo pueda mostrar.
 */
export function ejecutarJutsu(atacante, defensor) {
  const jutsu = atacante.jutsu;
  const { cantidad, eficacia } = calcularDano(atacante, defensor, jutsu);

  defensor.hpActual = Math.max(0, defensor.hpActual - cantidad);
  aplicarEfectoEstado(atacante, defensor, jutsu.efectoEstado);

  return {
    atacanteId: atacante.id,
    defensorId: defensor.id,
    jutsuNombre: jutsu.nombre,
    dano: cantidad,
    eficacia,
    defensorDerrotado: defensor.hpActual <= 0,
  };
}

/** Orden de actuación de dos luchadores en un turno, según velocidad efectiva. */
export function determinarOrden(luchadorA, luchadorB) {
  const velA = statEfectivo(luchadorA, 'velocidad');
  const velB = statEfectivo(luchadorB, 'velocidad');
  return velA >= velB ? [luchadorA, luchadorB] : [luchadorB, luchadorA];
}

/**
 * Resuelve un turno completo de combate 1 vs 1: orden por velocidad, ambos
 * ataques (si el segundo sigue con vida), y reduce la duración de los
 * efectos de estado al final. No decide qué jutsu usa cada uno (cada
 * personaje solo tiene un jutsu, así que no hay elección que resolver).
 */
export function resolverTurno(luchador1, luchador2) {
  const [primero, segundo] = determinarOrden(luchador1, luchador2);
  const eventos = [ejecutarJutsu(primero, segundo)];

  if (segundo.hpActual > 0) {
    eventos.push(ejecutarJutsu(segundo, primero));
  }

  reducirDuracionModificadores(luchador1);
  reducirDuracionModificadores(luchador2);

  const luchador1Derrotado = luchador1.hpActual <= 0;
  const luchador2Derrotado = luchador2.hpActual <= 0;

  return {
    eventos,
    combateTerminado: luchador1Derrotado || luchador2Derrotado,
    ganadorId: luchador1Derrotado ? luchador2.id : luchador2Derrotado ? luchador1.id : null,
  };
}

/**
 * Resuelve un combate 1 vs 1 completo de forma automática, encadenando
 * turnos hasta que uno de los dos caiga o se alcance el límite de turnos
 * (config.combate.turnosMaximos). No hay ninguna decisión del jugador
 * durante la pelea: cada personaje ya tiene un único jutsu fijo.
 *
 * Devuelve el historial completo de turnos (para animar/mostrar en la UI
 * si se quiere) y el id del ganador.
 */
export function resolverCombateCompleto(luchador1, luchador2) {
  const maxTurnos = configGlobal.combate.turnosMaximos;
  const historial = [];
  let resultado = { combateTerminado: false, ganadorId: null };
  let turno = 0;

  while (!resultado.combateTerminado && turno < maxTurnos) {
    resultado = resolverTurno(luchador1, luchador2);
    turno += 1;
    historial.push({ turno, eventos: resultado.eventos });
  }

  // Si se agota el límite de turnos sin caído, gana quien conserve más % de HP.
  let ganadorId = resultado.ganadorId;
  if (!ganadorId) {
    const ratio1 = luchador1.hpActual / luchador1.hpMaximo;
    const ratio2 = luchador2.hpActual / luchador2.hpMaximo;
    ganadorId = ratio1 >= ratio2 ? luchador1.id : luchador2.id;
  }

  return { historial, ganadorId, turnosUsados: turno };
}
