// src/engine/combat.js
// Motor de combate por turnos. Lógica pura, sin React ni store.
//
// SIMPLIFICACIÓN DEL MVP: resuelve un combate 1 vs 1 entre "luchador activo" de
// cada bando. La lógica de equipo de 3 (elegir quién sale, cambios a mitad de
// combate) se construye por encima de esto en el store, sin tocar este motor.

import tiposData from '../data/types.json';
import configGlobal from '../data/config.json';
import { calcularStatsPorNivel, aplicarMultiplicadoresModo, obtenerModoActivo } from './leveling';

/** Multiplicador de eficacia de un tipo atacante contra un tipo defensor. */
export function obtenerEficacia(tipoAtacante, tipoDefensor) {
  return tiposData.tablaEficacias[tipoAtacante]?.[tipoDefensor] ?? 1.0;
}

/**
 * Crea el estado de combate de un luchador (jugador o enemigo) a partir de
 * sus datos base y nivel actual. El modo activo (si lo hay) se calcula
 * internamente según el nivel — nunca hay que decidirlo desde fuera ni a
 * mitad de combate.
 */
export function crearLuchador(personajeBase, nivel) {
  const modoActivo = obtenerModoActivo(personajeBase, nivel);
  let stats = calcularStatsPorNivel(personajeBase.statsBase, nivel);
  if (modoActivo) {
    stats = aplicarMultiplicadoresModo(stats, modoActivo);
  }
  return {
    id: personajeBase.id,
    nombre: personajeBase.nombre,
    tipo: personajeBase.tipo,
    jutsu: personajeBase.jutsu,
    modoActivo, // null o el objeto de modo en uso, útil para que la UI lo muestre
    nivel,
    hpMaximo: stats.hp,
    hpActual: stats.hp,
    statsBase: stats,
    modificadoresTemporales: [], // { stat, cantidad, turnosRestantes }
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
