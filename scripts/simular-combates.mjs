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
// Imprime cuatro bloques:
//   0. Nivel real del jugador piso a piso, simulando la XP de un camino, contra el
//      nivel fijo del enemigo de ese piso.
//   1. Balance por arco, con los personajes desnudos. Es el histórico, el que hay
//      que comparar antes/después de tocar números.
//   2. Peso de cada objeto en combate real, contra ese mismo balance sin objeto.
//   3. De dónde viene el poder (niveles / transformación / objeto), medido en un
//      banco de pruebas contra un maniquí, no en los combates del juego.
//
// Todo esto es de la fase 4 del rediseño de balance (documentacion/30). Antes el
// script era ciego a dos cosas a la vez: nunca equipaba objetos (así que el
// reparto 40/30/30 del doc 27 no se podía comprobar) y daba por hecho el nivel del
// jugador interpolando entre los niveles de jefe del arco, en vez de simular la XP.
// Lo segundo resultó ser lo gordo: el jugador llega a los jefes muy por encima de
// su nivel, y el bloque 0 existe para que eso no se vuelva a dar por supuesto.
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

const { crearLuchador, resolverCombateCompleto, resolverTurno } = await import('../src/engine/combat.js');
const { calcularStatsPorNivel, nivelesEstimadosDeLaRun } = await import('../src/engine/leveling.js');
const { calcularNivelPorPiso } = await import('../src/engine/mapGenerator.js');
const { default: personajesData } = await import('../src/data/characters.json');
const { default: enemigosData } = await import('../src/data/enemies.json');
const { default: comunesData } = await import('../src/data/common-enemies.json');
const { default: objetosData } = await import('../src/data/items.json');
const { default: configGlobal } = await import('../src/data/config.json');
const { default: arco1 } = await import('../src/data/arcs/pais-de-las-olas.json');
const { default: arco2 } = await import('../src/data/arcs/examen-chunin.json');
const { default: arco3 } = await import('../src/data/arcs/invasion-de-pain.json');

const ARCOS = [arco1, arco2, arco3];
const TURNOS_MAXIMOS = configGlobal.combate.turnosMaximos;

// Mismo orden de preferencia que `_aplicarVictoria` en el store: lo que declare el
// enemigo, si no la XP común del arco, y si no la red de seguridad.
const xpDeCombateComun = (arco) => arco.xpCombateComun ?? 20;
const xpDeJefe = (id, arco) => enemigosData.jefes.find((j) => j.id === id)?.recompensa?.xp
  ?? xpDeCombateComun(arco);

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

/**
 * Un combate 1 vs 1 a HP completo. Devuelve turnos, ganador y HP restante.
 *
 * `objeto` es el objeto equipado por el jugador, o null. Solo se le pasan sus
 * pasivas, que es exactamente lo que hace el store (`pasivasDeObjetoEquipado`):
 * desde la fase 3 los objetos no dan estadísticas, así que no hay nada más que
 * aplicar. Los objetos cuyo efecto lo resuelve el store —revivir al caer, curar
 * entre combates, consumibles— no traen pasivas y aquí no hacen nada; están
 * listados en OBJETOS_INVISIBLES.
 */
function simularCombate(baseJugador, nivelJugador, baseEnemigo, nivelEnemigo, azar, objeto = null) {
  const jugador = crearLuchador(baseJugador, nivelJugador, null, null, 1, objeto?.pasivas ?? []);
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
const conSigno = (n, decimales = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(decimales)}`;

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

/** Los pisos que se muestrean de cada arco: el primero jugable, el de en medio y el previo al jefe. */
const pisosMuestreados = (arco) => [2, Math.round(arco.numeroPisos / 2), arco.numeroPisos - 1];

/** Los dos jefes de un arco, con el piso y el nivel a los que se pelean. */
const jefesDelArco = (arco) => [
  ['mini-jefe', arco.miniJefeId, arco.nivelMiniJefe, arco.pisoMiniJefe],
  ['JEFE FINAL', arco.jefeFinalId, arco.nivelJefeFinal, arco.pisoJefeFinal],
];

// Cada personaje sube a su propio ritmo (la XP por nivel del roster va de 17 a
// 24), así que la run se simula una vez por personaje y a partir de aquí "el
// nivel del jugador" siempre sale de aquí, nunca de una fórmula.
const PROGRESION = new Map(roster.map((p) => [p.id, nivelesEstimadosDeLaRun(p.curvaXp, ARCOS, xpDeJefe)]));
const nivelDe = (personaje, arco, piso) => PROGRESION.get(personaje.id)[arco.id].get(piso);
const nivelMedioEn = (arco, piso) => Math.round(media(roster.map((p) => nivelDe(p, arco, piso))));

// ---------------------------------------------------------------------------
// 0. Curva de niveles real de una run
// ---------------------------------------------------------------------------

{
  console.log('\n=== Nivel del jugador contra nivel del enemigo, piso a piso ===');
  console.log('  (media del roster jugando un solo camino; "Δ" son los niveles de ventaja)\n');

  for (const arco of ARCOS) {
    const filas = [];
    for (let piso = 2; piso <= arco.numeroPisos; piso += 1) {
      const jugador = nivelMedioEn(arco, piso);
      const enemigo = piso === arco.pisoMiniJefe
        ? arco.nivelMiniJefe
        : piso === arco.pisoJefeFinal
          ? arco.nivelJefeFinal
          : calcularNivelPorPiso(piso, arco);
      const marca = piso === arco.pisoJefeFinal ? '★' : piso === arco.pisoMiniJefe ? '☆' : ' ';
      filas.push(`${marca}p${piso} ${jugador}/${enemigo} (${conSigno(jugador - enemigo, 0)})`);
    }
    console.log(`  ${arco.nombre.padEnd(16)} ${filas.join('  ')}`);
  }
  console.log('\n  ☆ mini-jefe   ★ jefe final');
}

// ---------------------------------------------------------------------------
// 1. Balance por arco (personajes desnudos)
// ---------------------------------------------------------------------------

// Una sola secuencia de azar por bloque: así el combate N-ésimo de este bloque
// siempre recibe los mismos números, ejecución tras ejecución, y añadir bloques
// nuevos más abajo no mueve los números de este.
{
  const azar = azarConSemilla(SEMILLA);

  for (const arco of ARCOS) {
    console.log(`\n=== ${arco.nombre} (pisos 1-${arco.numeroPisos}) ===`);

    for (const piso of pisosMuestreados(arco)) {
      const nivelEnemigo = calcularNivelPorPiso(piso, arco);
      const resultados = roster.flatMap((personaje) =>
        comunesData.plantillasGenericas.map((enemigo) =>
          simularCombate(personaje, nivelDe(personaje, arco, piso), enemigo, nivelEnemigo, azar),
        ),
      );
      resumir(`piso ${piso} (Nv.${nivelMedioEn(arco, piso)} vs ${nivelEnemigo})`, resultados);
    }

    for (const [rol, id, nivel, piso] of jefesDelArco(arco)) {
      const jefe = enemigosData.jefes.find((j) => j.id === id);
      const resultados = roster.map((personaje) =>
        simularCombate(personaje, nivelDe(personaje, arco, piso), jefe, nivel, azar));
      resumir(`${rol} ${jefe.nombre} (Nv.${nivel}, tú Nv.${nivelMedioEn(arco, piso)})`, resultados);
    }
  }

  console.log(
    '\nLectura: "victorias" es 1 vs 1 a HP lleno, así que un jefe por debajo del ~50% es normal\n' +
      '(en la run entran hasta 3 personajes en cadena contra el mismo jefe, y eso lo mide el\n' +
      'bloque siguiente). Lo que no debe pasar es que aparezcan combates ⚠ al tope de turnos:\n' +
      'ahí gana quien conserve más % de HP, no el combate real.',
  );
}

// ---------------------------------------------------------------------------
// 1b. Jefes con la cadena de rondas (el combate de verdad)
// ---------------------------------------------------------------------------

/**
 * El HP con el que el equipo llega a un piso, jugando los pisos anteriores.
 *
 * Los combates del juego NO empiezan a HP lleno: el HP persiste entre nodos y
 * solo lo devuelve un descanso, una curación o un consumible. Medir un jefe con
 * el trío intacto es medir un combate que no existe — salvo el jefe final de
 * arco, que va detrás de un descanso garantizado (`garantizarDescansoAntesDelJefe`).
 *
 * Cada piso previo se sortea con los pesos del arco: si sale `combate`, pelea el
 * primero del trío que siga en pie y se queda con el HP que le quede; si sale
 * `descanso`, el equipo se cura y revive entero, igual que en el store.
 */
function hpAlLlegarAlPiso(trio, arco, pisoDestino, azar) {
  const hpMaximoEn = (p, piso) => crearLuchador(p, nivelDe(p, arco, piso)).hpMaximo;
  const hp = trio.map((p) => hpMaximoEn(p, 2));

  for (let piso = 2; piso < pisoDestino; piso += 1) {
    // Al subir de nivel, el HP actual sube lo mismo que el máximo — lo hace el
    // store en `aplicarXpYActualizarHp`. Sin esto el simulador arrastraría el HP
    // sin la vida del nivel, que es justo el bug que se arregló: el equipo se iría
    // quedando atrás respecto a su propia barra y los jefes saldrían más duros.
    trio.forEach((p, i) => {
      if (hp[i] <= 0) return;
      const delta = hpMaximoEn(p, piso) - hpMaximoEn(p, piso - 1);
      if (delta > 0) hp[i] = Math.min(hpMaximoEn(p, piso), hp[i] + delta);
    });

    if (piso === arco.pisoMiniJefe) continue; // el mini-jefe se mide aparte, no se juega dos veces
    const tipo = elegirTipoDeNodo(arco, azar);

    if (tipo === 'descanso') {
      trio.forEach((p, i) => { hp[i] = crearLuchador(p, nivelDe(p, arco, piso)).hpMaximo; });
      continue;
    }
    if (tipo !== 'combate') continue;

    const i = hp.findIndex((v) => v > 0);
    if (i === -1) break;
    const jugador = crearLuchador(trio[i], nivelDe(trio[i], arco, piso), hp[i]);
    const enemigo = crearLuchador(
      comunesData.plantillasGenericas[Math.floor(azar() * comunesData.plantillasGenericas.length)],
      calcularNivelPorPiso(piso, arco),
    );
    resolverCombateCompleto(jugador, enemigo, azar);
    hp[i] = jugador.hpActual;
  }

  return hp;
}

/**
 * Un nodo de jefe entero: el equipo de 3 entra de uno en uno contra el MISMO
 * enemigo, que conserva el daño recibido y su barra de jutsu entre rondas
 * (ver `jugarCombate` en el store y documentacion/26).
 *
 * Es la única medida honesta de un jefe. El 1 vs 1 del bloque anterior dice que
 * Zabuza se gana el 7% de las veces, y de ahí no se puede concluir nada: lo que
 * decide la run es si tres personajes juntos lo tumban.
 */
function simularNodoDeJefe(trio, arco, piso, enemigoBase, nivelEnemigo, azar, hpDeEntrada) {
  const enemigo = crearLuchador(enemigoBase, nivelEnemigo);

  for (let i = 0; i < trio.length; i += 1) {
    if (hpDeEntrada[i] <= 0) continue; // llegó caído del camino, no entra
    const jugador = crearLuchador(trio[i], nivelDe(trio[i], arco, piso), hpDeEntrada[i]);
    const { ganadorId } = resolverCombateCompleto(jugador, enemigo, azar);
    if (ganadorId === jugador.id) return { gano: true, caidos: i };
    // Ganador nulo = se acabaron los turnos sin muertos. No es victoria ni
    // derrota; se cuenta aparte porque significa que el combate no resuelve.
    if (ganadorId === null) return { gano: false, caidos: i, atascado: true };
  }
  return { gano: false, caidos: trio.length };
}

/**
 * Tipo del nodo de un piso normal, con los pesos del arco. Réplica de
 * `elegirTipoPorPeso` de mapGenerator, que no está exportada y usa `Math.random`
 * por dentro: aquí hace falta con azar inyectado para poder reproducir la tirada.
 */
function elegirTipoDeNodo(arco, azar) {
  const total = arco.poolTiposNodo.reduce((acc, t) => acc + t.peso, 0);
  let tirada = azar() * total;
  for (const { tipo, peso } of arco.poolTiposNodo) {
    tirada -= peso;
    if (tirada <= 0) return tipo;
  }
  return arco.poolTiposNodo[arco.poolTiposNodo.length - 1].tipo;
}

/** Los C(14,3) = 364 tríos posibles del roster: así ningún equipo concreto sesga la media. */
function triosDelRoster() {
  const trios = [];
  for (let a = 0; a < roster.length; a += 1) {
    for (let b = a + 1; b < roster.length; b += 1) {
      for (let c = b + 1; c < roster.length; c += 1) trios.push([roster[a], roster[b], roster[c]]);
    }
  }
  return trios;
}

{
  console.log('\n\n=== Jefes con el equipo de 3 en cadena ===');
  console.log(
    `  (los ${triosDelRoster().length} tríos posibles del roster; al mini-jefe se llega con el HP\n` +
      '   que deje el camino, al jefe final curado por el descanso garantizado del piso anterior)\n',
  );

  const azar = azarConSemilla(SEMILLA);
  for (const arco of ARCOS) {
    for (const [rol, id, nivel, piso] of jefesDelArco(arco)) {
      const jefe = enemigosData.jefes.find((j) => j.id === id);
      const rs = triosDelRoster().map((trio) => {
        // Al jefe final de arco se llega curado: el generador de mapa garantiza un
        // descanso en el piso anterior. Al mini-jefe se llega como se llegue.
        const hpDeEntrada = piso === arco.pisoJefeFinal
          ? trio.map((p) => crearLuchador(p, nivelDe(p, arco, piso)).hpMaximo)
          : hpAlLlegarAlPiso(trio, arco, piso, azar);
        return simularNodoDeJefe(trio, arco, piso, jefe, nivel, azar, hpDeEntrada);
      });
      const ganados = rs.filter((r) => r.gano);
      const atascados = rs.filter((r) => r.atascado).length;
      console.log(
        `  ${`${rol} ${jefe.nombre}`.padEnd(30)} ` +
          `nodos ganados ${porcentaje(ganados.length / rs.length).padStart(4)}  ` +
          `personajes gastados ${(ganados.length ? media(ganados.map((r) => r.caidos + 1)) : 0).toFixed(1)}` +
          (atascados > 0 ? `  ⚠ ${atascados} sin resolver en ${TURNOS_MAXIMOS} turnos` : ''),
      );
    }
  }
  console.log(
    '\n  Objetivo: un mini-jefe debería costar ~1 personaje y ganarse casi siempre; un jefe final,\n' +
      '  ~2 y ganarse la mayoría de las veces. Un nodo por debajo del 50% mata la run ahí mismo.',
  );
}

// ---------------------------------------------------------------------------
// 2. Peso de los objetos en combate real
// ---------------------------------------------------------------------------

const EQUIPABLES = objetosData.objetos.filter((o) => o.tipo === 'equipable');

/**
 * Objetos que un combate 1 vs 1 no puede medir, porque su efecto vive fuera del
 * motor: los resuelve el store entre combates o al caer un personaje. Aparecen
 * igual en la tabla, con su motivo, para que no parezca que el objeto es inútil
 * cuando lo que pasa es que el simulador no lo ve.
 */
const OBJETOS_INVISIBLES = {
  banda_repuesto: 'revivir lo resuelve el store',
  pergamino_reserva: 'cura entre combates, no dentro',
};

/** Todos los combates comunes de los 3 arcos, con un objeto equipado (o ninguno). */
function combatesComunes(objeto, azar) {
  return ARCOS.flatMap((arco) =>
    pisosMuestreados(arco).flatMap((piso) => {
      const nivelEnemigo = calcularNivelPorPiso(piso, arco);
      return roster.flatMap((personaje) =>
        comunesData.plantillasGenericas.map((enemigo) =>
          simularCombate(personaje, nivelDe(personaje, arco, piso), enemigo, nivelEnemigo, azar, objeto),
        ),
      );
    }),
  );
}

/** Los 6 jefes de los 3 arcos contra el roster completo, con un objeto equipado (o ninguno). */
function combatesJefes(objeto, azar) {
  return ARCOS.flatMap((arco) =>
    jefesDelArco(arco).flatMap(([, id, nivel, piso]) => {
      const jefe = enemigosData.jefes.find((j) => j.id === id);
      return roster.map((personaje) =>
        simularCombate(personaje, nivelDe(personaje, arco, piso), jefe, nivel, azar, objeto));
    }),
  );
}

const tasaVictorias = (rs) => rs.filter((r) => r.gano).length / rs.length;
const hpMedio = (rs) => media(rs.map((r) => r.porcentajeHpRestante));

{
  console.log('\n\n=== Peso de los objetos en combate real ===');
  console.log('  (mismo balance del bloque 1, pero con un objeto equipado; Δ contra "sin objeto")\n');

  // Cada objeto pelea con la MISMA secuencia de azar que la referencia, si no la
  // diferencia que salga puede ser suerte y no el objeto.
  const referencia = {
    comunes: combatesComunes(null, azarConSemilla(SEMILLA)),
    jefes: combatesJefes(null, azarConSemilla(SEMILLA)),
  };

  console.log(`  ${'objeto'.padEnd(26)} ${'comunes: vict / HP'.padEnd(26)} jefes: vict / HP`);
  console.log(
    `  ${'(sin objeto)'.padEnd(26)} ` +
      `${porcentaje(tasaVictorias(referencia.comunes)).padStart(5)} / ${porcentaje(hpMedio(referencia.comunes)).padStart(4)}`.padEnd(26) +
      ` ${porcentaje(tasaVictorias(referencia.jefes)).padStart(5)} / ${porcentaje(hpMedio(referencia.jefes)).padStart(4)}`,
  );

  for (const objeto of EQUIPABLES) {
    const comunes = combatesComunes(objeto, azarConSemilla(SEMILLA));
    const jefes = combatesJefes(objeto, azarConSemilla(SEMILLA));
    const delta = (rs, ref, medida) => conSigno((medida(rs) - medida(ref)) * 100);
    const motivo = OBJETOS_INVISIBLES[objeto.id];
    console.log(
      `  ${objeto.id.padEnd(26)} ` +
        `${delta(comunes, referencia.comunes, tasaVictorias).padStart(5)} / ${delta(comunes, referencia.comunes, hpMedio).padStart(5)}`.padEnd(26) +
        ` ${delta(jefes, referencia.jefes, tasaVictorias).padStart(5)} / ${delta(jefes, referencia.jefes, hpMedio).padStart(5)}` +
        (motivo ? `   (invisible aquí: ${motivo})` : ''),
    );
  }
}

// ---------------------------------------------------------------------------
// 3. De dónde viene el poder
// ---------------------------------------------------------------------------

/**
 * Maniquí: el ninja medio del roster (HP, defensa y velocidad son la media de
 * las 14 stats base), sin tipo de chakra, sin transformación y sin pasivas, y
 * que nunca carga su jutsu.
 *
 * Es un patrón de medida, no un enemigo del juego, y por eso es sintético: si el
 * banco de pruebas midiera contra un jefe real, recalibrar a ese jefe movería
 * todas las cifras de este bloque y dejaría de poder compararse con las de antes.
 * Sin tipo, además, la tabla de eficacias devuelve 1.0 en los dos sentidos, así
 * que la ventaja de chakra no ensucia la medida.
 *
 * El ATAQUE sí es de jefe (12) y no la media del roster (9), a propósito. Con 9,
 * su golpe contra los personajes más defensivos al final del arco 3 caía al
 * mínimo de 1, y ahí `calabaza_arena` (mitad de daño por debajo del 30% de HP)
 * sumada a la reducción del modo lo dejaba en 0: Chōji y Yamato se volvían
 * literalmente inmortales y su medida no terminaba nunca. Un patrón que no puede
 * matarte no mide tu supervivencia.
 */
const MANIQUI = {
  id: '__maniqui__',
  nombre: 'Maniquí',
  tipo: 'neutral',
  statsBase: { hp: 39, ataque: 12, defensa: 7, velocidad: 8 },
  jutsu: {
    nombre: '—',
    danoBase: 1,
    efectoEstado: null,
    carga: { alAtacar: 0, alRecibirDano: 0, inicial: 0 },
  },
  modos: [],
};

const HP_MANIQUI = 1e9; // inmortal: mide cuánto repartes antes de caer, no cuánto tarda en morir
const TOPE_TURNOS_BANCO = 2000;

// Si una medida llega al tope es que el maniquí no mataba al luchador, y entonces
// el poder sale recortado y los multiplicadores mienten hacia abajo. No debería
// pasar con los números actuales, pero un cambio de balance puede provocarlo sin
// que se note en las cifras, así que se cuenta y se avisa al final del bloque.
let medidasTopadas = 0;

/**
 * Poder efectivo: daño total que un luchador reparte sobre el maniquí antes de
 * caer. Multiplica ofensa por supervivencia en un solo número, que es lo que
 * hace comparables cosas tan distintas como "+30% al jutsu" y "el primer golpe
 * recibido hace la mitad".
 *
 * El maniquí es inmortal a propósito: si pudiera morir, un personaje de sobra
 * fuerte tocaría techo en "el HP del maniquí" y todas las mejoras por encima de
 * eso se verían iguales. El precio es que las pasivas de rematar (heal_on_kill)
 * no se disparan nunca aquí — esas se miden en el bloque 2, que sí pelea de verdad.
 */
function poderEfectivo(personajeBase, nivel, nivelManiqui, { conModo = true, objeto = null } = {}) {
  const base = conModo ? personajeBase : { ...personajeBase, modos: [] };
  const luchador = crearLuchador(base, nivel, null, null, 1, objeto?.pasivas ?? []);
  const maniqui = crearLuchador(MANIQUI, nivelManiqui);
  maniqui.hpMaximo = HP_MANIQUI;
  maniqui.hpActual = HP_MANIQUI;

  const azar = azarConSemilla(SEMILLA); // mismo azar para todas las configuraciones
  let danoRepartido = 0;
  let turnos = 0;
  for (; turnos < TOPE_TURNOS_BANCO && luchador.hpActual > 0; turnos += 1) {
    const { eventos } = resolverTurno(luchador, maniqui, azar);
    for (const evento of eventos) {
      if (evento.atacanteId === luchador.id) danoRepartido += evento.dano;
    }
  }
  if (turnos >= TOPE_TURNOS_BANCO) medidasTopadas += 1;
  return danoRepartido;
}

/** Media geométrica: los multiplicadores se componen, así que no se promedian sumando. */
const mediaGeometrica = (valores) => Math.exp(media(valores.map(Math.log)));

{
  console.log('\n\n=== De dónde viene el poder ===');
  console.log(
    '  (poder = daño repartido sobre un maniquí de nivel equivalente antes de caer;\n' +
      '   "niveles" son solo los que se ganan DENTRO del arco, del primer piso al jefe final)\n',
  );

  for (const arco of ARCOS) {
    // El maniquí se queda clavado en el nivel al que empieza el arco. Si escalara
    // con el jugador, subir de nivel no mediría nada (los dos crecen igual y se
    // cancelan) — y de hecho la primera versión de este bloque daba ×0,97 para
    // los niveles del arco 3. Los enemigos del juego tampoco escalan: su nivel es
    // fijo por arco, es una decisión de diseño (documentacion/11).
    const nivelManiqui = arco.nivelEnemigoBase;

    const multiplicadores = roster.map((personaje) => {
      const nivelInicial = nivelDe(personaje, arco, 2);
      const nivelFinal = nivelDe(personaje, arco, arco.pisoJefeFinal);
      const desnudoAlEmpezar = poderEfectivo(personaje, nivelInicial, nivelManiqui, { conModo: false });
      const desnudoAlAcabar = poderEfectivo(personaje, nivelFinal, nivelManiqui, { conModo: false });
      const conModo = poderEfectivo(personaje, nivelFinal, nivelManiqui);
      const conMejorObjeto = Math.max(
        conModo,
        ...EQUIPABLES.map((objeto) => poderEfectivo(personaje, nivelFinal, nivelManiqui, { objeto })),
      );
      return {
        niveles: desnudoAlAcabar / desnudoAlEmpezar,
        transformacion: conModo / desnudoAlAcabar,
        objeto: conMejorObjeto / conModo,
      };
    });

    const fuentes = ['niveles', 'transformacion', 'objeto'].map((fuente) => ({
      fuente,
      multiplicador: mediaGeometrica(multiplicadores.map((m) => m[fuente])),
    }));
    const totalLogaritmico = fuentes.reduce((acc, f) => acc + Math.log(f.multiplicador), 0);

    console.log(
      `  ${arco.nombre} (Nv.${nivelMedioEn(arco, 2)} → ${nivelMedioEn(arco, arco.pisoJefeFinal)},`
        + ` maniquí clavado en Nv.${nivelManiqui})`,
    );
    for (const { fuente, multiplicador } of fuentes) {
      const peso = totalLogaritmico > 0 ? Math.log(multiplicador) / totalLogaritmico : 0;
      const etiqueta = fuente === 'objeto' ? 'objeto (el mejor de cada uno)' : fuente;
      console.log(
        `    ${etiqueta.padEnd(30)} ×${multiplicador.toFixed(2).padStart(5)}   peso ${porcentaje(peso).padStart(4)}`,
      );
    }
  }

  // La curva de niveles en crudo, sin simular: es aritmética pura y es el número
  // que la fase 4 va a tocar, así que conviene tenerlo delante al comparar.
  const factor = (nivel) => calcularStatsPorNivel({ hp: 100, ataque: 100, defensa: 100, velocidad: 100 }, nivel).hp / 100;
  console.log(
    `\n  Curva de stats (crecimientoStatsPorNivel: ${configGlobal.progresion.crecimientoStatsPorNivel}): ` +
      [1, 4, 24, 49, 100].map((n) => `Nv.${n} ×${factor(n).toFixed(2)}`).join('  '),
  );
  console.log(
    '  Una run entera llega al 49, no al 100: el ×8,9 del nivel máximo no lo ve nadie jugando.',
  );

  if (medidasTopadas > 0) {
    console.log(
      `\n  ⚠ ${medidasTopadas} medidas llegaron al tope de ${TOPE_TURNOS_BANCO} turnos sin caer:\n` +
        '    el maniquí se ha quedado corto y esos multiplicadores salen más bajos de lo que son.',
    );
  }
}

console.log(
  '\nLectura del bloque 3: "peso" reparte el poder entre las tres fuentes en proporción a lo que\n' +
    'multiplica cada una (sobre logaritmos, porque se componen multiplicando). El objetivo del\n' +
    'doc 27 es 30% niveles / 30% transformación / 40% objetos.\n',
);
