// Simulador de balance. Corre los combates de los 3 arcos a los niveles reales
// y saca turnos por combate, HP restante y % de victorias, sin abrir el juego.
//
// Uso:  node scripts/simular-combates.mjs
//
// Nació con el sistema de jutsus automáticos (documentacion/29): al partir el
// daño en ataque básico + jutsu cargado había que comprobar que el daño medio
// por turno no se movía. Sirve igual para el ajuste de balance pendiente de los
// arcos 2 y 3 (documentacion/11), que pasaron de 10/12 pisos a 8.
//
// Los `registerHooks` de abajo existen porque el motor está escrito para Vite:
// importa JSON sin `with { type: 'json' }` y sin extensión en las rutas
// relativas. Node no hace ninguna de las dos cosas por su cuenta, así que el
// hook las traduce. Nada de esto afecta al juego, solo a este script.

import { registerHooks } from 'node:module';

function comoJson(resultado) {
  if (!resultado.url.endsWith('.json')) return resultado;
  return { ...resultado, format: 'json', importAttributes: { type: 'json' } };
}

registerHooks({
  resolve(especificador, contexto, siguiente) {
    try {
      return comoJson(siguiente(especificador, contexto));
    } catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND' || !especificador.startsWith('.')) throw error;
      return comoJson(siguiente(`${especificador}.js`, contexto));
    }
  },
});

const { crearLuchador, resolverCombateCompleto } = await import('../src/engine/combat.js');
const { calcularNivelPorPiso } = await import('../src/engine/mapGenerator.js');
const { default: personajesData } = await import('../src/data/characters.json');
const { default: enemigosData } = await import('../src/data/enemies.json');
const { default: comunesData } = await import('../src/data/common-enemies.json');
const { default: configGlobal } = await import('../src/data/config.json');
const { default: arco1 } = await import('../src/data/arcs/pais-de-las-olas.json');
const { default: arco2 } = await import('../src/data/arcs/examen-chunin.json');
const { default: arco3 } = await import('../src/data/arcs/invasion-de-pain.json');

const ARCOS = [arco1, arco2, arco3];
const TURNOS_MAXIMOS = configGlobal.combate.turnosMaximos;

/**
 * Nivel al que llega el jugador a cada piso, aproximado: los niveles fijos de
 * jefe del arco son la referencia que ya usa el diseño (nivelMiniJefe en el
 * piso del mini-jefe, nivelJefeFinal en el del jefe), así que se interpola
 * entre ellos. No pretende ser exacto, sirve para comparar antes/después.
 */
function nivelJugadorEnPiso(piso, arco) {
  const desde = arco.nivelEnemigoBase;
  const hasta = arco.nivelJefeFinal;
  const avance = (piso - 1) / Math.max(1, arco.numeroPisos - 1);
  return Math.max(1, Math.round(desde + (hasta - desde) * avance));
}

/**
 * Azar reproducible (mulberry32). Desde que existen pasivas con probabilidad
 * (`repeat_basic_chance`) el combate ya no es determinista, y con `Math.random`
 * dos ejecuciones seguidas daban 14% y 21% de victorias en el mismo combate. Así
 * no se puede comparar un balance antes y después, que es justo para lo que sirve
 * este script. Con semilla fija, cualquier diferencia que salga es del cambio.
 */
function azarConSemilla(semilla) {
  let estado = semilla;
  return function siguiente() {
    estado |= 0;
    estado = (estado + 0x6D2B79F5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEMILLA = 20260811;

/** Un combate 1 vs 1 a HP completo. Devuelve turnos, ganador y HP restante. */
function simularCombate(baseJugador, nivelJugador, baseEnemigo, nivelEnemigo, azar) {
  const jugador = crearLuchador(baseJugador, nivelJugador);
  const enemigo = crearLuchador(baseEnemigo, nivelEnemigo);
  const { historial, ganadorId, turnosUsados } = resolverCombateCompleto(jugador, enemigo, azar);

  const jutsusJugador = historial
    .flatMap((t) => t.eventos)
    .filter((e) => e.atacanteId === jugador.id && e.tipoAtaque === 'jutsu').length;

  return {
    gano: ganadorId === jugador.id,
    turnos: turnosUsados,
    porcentajeHpRestante: jugador.hpActual / jugador.hpMaximo,
    jutsusLanzados: jutsusJugador,
    llegoAlTope: turnosUsados >= TURNOS_MAXIMOS,
  };
}

const media = (numeros) => numeros.reduce((a, b) => a + b, 0) / numeros.length;
const porcentaje = (n) => `${Math.round(n * 100)}%`;

function resumir(etiqueta, resultados) {
  const victorias = resultados.filter((r) => r.gano).length / resultados.length;
  const topes = resultados.filter((r) => r.llegoAlTope).length;
  console.log(
    `  ${etiqueta.padEnd(26)} ` +
      `victorias ${porcentaje(victorias).padStart(4)}  ` +
      `turnos ${media(resultados.map((r) => r.turnos)).toFixed(1).padStart(4)}  ` +
      `HP final ${porcentaje(media(resultados.map((r) => r.porcentajeHpRestante))).padStart(4)}  ` +
      `jutsus ${media(resultados.map((r) => r.jutsusLanzados)).toFixed(1)}` +
      (topes > 0 ? `  ⚠ ${topes} al tope de ${TURNOS_MAXIMOS} turnos` : ''),
  );
}

// El roster completo pelea cada combate: la media entre los 14 personajes es lo
// que importa para el balance, no un personaje concreto.
const roster = personajesData.personajes;

// Una sola secuencia de azar para toda la simulación: así el combate N-ésimo
// siempre recibe los mismos números, ejecución tras ejecución.
const azar = azarConSemilla(SEMILLA);

for (const arco of ARCOS) {
  console.log(`\n=== ${arco.nombre} (pisos 1-${arco.numeroPisos}) ===`);

  for (const piso of [2, Math.round(arco.numeroPisos / 2), arco.numeroPisos - 1]) {
    const nivelJugador = nivelJugadorEnPiso(piso, arco);
    const nivelEnemigo = calcularNivelPorPiso(piso, arco);
    const resultados = roster.flatMap((personaje) =>
      comunesData.plantillasGenericas.map((enemigo) =>
        simularCombate(personaje, nivelJugador, enemigo, nivelEnemigo, azar),
      ),
    );
    resumir(`piso ${piso} (Nv.${nivelJugador} vs ${nivelEnemigo})`, resultados);
  }

  for (const [rol, id, nivel] of [
    ['mini-jefe', arco.miniJefeId, arco.nivelMiniJefe],
    ['JEFE FINAL', arco.jefeFinalId, arco.nivelJefeFinal],
  ]) {
    const jefe = enemigosData.jefes.find((j) => j.id === id);
    const piso = rol === 'mini-jefe' ? arco.pisoMiniJefe : arco.pisoJefeFinal;
    const nivelJugador = nivelJugadorEnPiso(piso, arco);
    const resultados = roster.map((personaje) => simularCombate(personaje, nivelJugador, jefe, nivel, azar));
    resumir(`${rol} ${jefe.nombre} (Nv.${nivel})`, resultados);
  }
}

console.log(
  '\nLectura: "victorias" es 1 vs 1 a HP lleno, así que un jefe por debajo del ~50% es normal\n' +
    '(en la run entran hasta 3 personajes en cadena contra el mismo jefe). Lo que no debe pasar\n' +
    'es que aparezcan combates ⚠ al tope de turnos: ahí gana quien conserve más % de HP, no el\n' +
    'combate real.\n',
);
