// src/engine/mapGenerator.js
// Genera el grafo de nodos de un arco y decide qué enemigo corresponde a
// cada nodo de combate/miniJefe/jefe. Lógica pura, sin React ni store.

import commonEnemiesData from '../data/common-enemies.json';
import enemiesData from '../data/enemies.json';

function numeroAleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Elige un tipo de nodo al azar según los pesos de arco.poolTiposNodo. */
function elegirTipoPorPeso(poolTiposNodo) {
  const total = poolTiposNodo.reduce((acc, item) => acc + item.peso, 0);
  let r = Math.random() * total;
  for (const item of poolTiposNodo) {
    if (r < item.peso) return item.tipo;
    r -= item.peso;
  }
  return poolTiposNodo[poolTiposNodo.length - 1].tipo;
}

let contadorId = 0;
function generarIdNodo() {
  contadorId += 1;
  return `nodo_${contadorId}`;
}

/**
 * Número de nodos de un piso normal (no el de jefe): forma de diamante,
 * estrecho en los extremos del arco y ancho en el centro — más variabilidad
 * que un rango fijo repetido en cada piso.
 */
function anchoDelPiso(piso, numeroPisosNormales, min, max) {
  const centro = (numeroPisosNormales + 1) / 2;
  const distanciaAlCentro = Math.abs(piso - centro) / centro; // 0 en el centro, ~1 en los extremos
  const ancho = Math.round(max - distanciaAlCentro * (max - min));
  const variacion = numeroAleatorioEntre(-1, 1); // un poco de ruido para que no sea idéntico cada run
  return Math.min(max, Math.max(min, ancho + variacion));
}

/**
 * Genera el mapa completo de un arco: nodos organizados por piso, con
 * conexiones hacia el piso siguiente. El último piso es siempre un único
 * nodo de tipo 'jefe'. El piso de mini-jefe fuerza un nodo de tipo 'miniJefe'.
 */
export function generarMapa(arco) {
  contadorId = 0;
  const nodos = {};
  const pisos = [];
  const numeroPisosNormales = arco.numeroPisos - 1; // todos menos el del jefe

  for (let piso = 1; piso <= arco.numeroPisos; piso++) {
    const esUltimoPiso = piso === arco.pisoJefeFinal;
    const numNodos = esUltimoPiso
      ? 1
      : anchoDelPiso(piso, numeroPisosNormales, arco.nodosPorPiso.min, arco.nodosPorPiso.max);

    // El primer piso nunca debe ofrecer descanso (curar algo que ya está a
    // HP completo no es una opción real) ni tienda (no tienes oro todavía).
    const poolDeEstePiso = piso === 1
      ? arco.poolTiposNodo.filter((t) => t.tipo !== 'descanso' && t.tipo !== 'tienda')
      : arco.poolTiposNodo;

    const idsPiso = [];
    for (let i = 0; i < numNodos; i++) {
      const id = generarIdNodo();
      const tipo = esUltimoPiso ? 'jefe' : elegirTipoPorPeso(poolDeEstePiso);
      const subtipo = tipo === 'combate' ? (Math.random() < 0.2 ? 'entrenador' : 'aleatorio') : undefined;
      nodos[id] = { id, piso, tipo, ...(subtipo !== undefined && { subtipo }), conexiones: [], visitado: false, completado: false };
      idsPiso.push(id);
    }

    // Máximo 2 nodos de tienda por piso: si el sorteo por peso pone más,
    // los que sobran se reasignan a otro tipo (sin tienda en el pool).
    const poolSinTienda = poolDeEstePiso.filter((t) => t.tipo !== 'tienda');
    let tiendasEnEstePiso = 0;
    idsPiso.forEach((id) => {
      if (nodos[id].tipo === 'tienda') {
        tiendasEnEstePiso += 1;
        if (tiendasEnEstePiso > 2 && poolSinTienda.length > 0) {
          nodos[id].tipo = elegirTipoPorPeso(poolSinTienda);
        }
      }
    });

    pisos.push(idsPiso);
  }

  // Forzar un nodo de mini-jefe en el piso correspondiente.
  if (arco.pisoMiniJefe) {
    const idsPisoMini = pisos[arco.pisoMiniJefe - 1];
    const idElegido = idsPisoMini[numeroAleatorioEntre(0, idsPisoMini.length - 1)];
    nodos[idElegido].tipo = 'miniJefe';
  }

  // Conecta cada nodo con 1-2 nodos del piso siguiente (por proximidad de índice).
  for (let p = 0; p < pisos.length - 1; p++) {
    const actual = pisos[p];
    const siguiente = pisos[p + 1];
    actual.forEach((idOrigen, index) => {
      const numConexiones = Math.min(siguiente.length, numeroAleatorioEntre(1, 2));
      const indiceBase = Math.floor((index / actual.length) * siguiente.length);
      const conexiones = new Set();
      for (let c = 0; c < numConexiones; c++) {
        conexiones.add(siguiente[Math.min(siguiente.length - 1, indiceBase + c)]);
      }
      nodos[idOrigen].conexiones = [...conexiones];
    });
  }

  // Garantiza que ningún nodo del piso siguiente se quede sin conexión entrante.
  for (let p = 1; p < pisos.length; p++) {
    const anterior = pisos[p - 1];
    const actual = pisos[p];
    actual.forEach((idDestino) => {
      const tieneEntrada = anterior.some((idOrigen) =>
        nodos[idOrigen].conexiones.includes(idDestino),
      );
      if (!tieneEntrada) {
        const idOrigenAleatorio = anterior[numeroAleatorioEntre(0, anterior.length - 1)];
        nodos[idOrigenAleatorio].conexiones.push(idDestino);
      }
    });
  }

  garantizarDescansoAntesDelJefe(nodos, pisos, arco);

  return { arcoId: arco.id, pisos, nodos, nodosIniciales: pisos[0] };
}

/**
 * Garantiza que el piso inmediatamente ANTERIOR al jefe final tenga un nodo
 * de tipo `descanso` — igual que el Centro Pokémon justo antes del gimnasio
 * en un Pokelike — para que el jugador siempre pueda curar a todo el equipo
 * antes de la pelea que más importa, sin depender del azar del sorteo de
 * tipos de nodo. Si ese piso solo tiene un nodo y ya está reservado para
 * `miniJefe`, no se fuerza nada (un nodo no puede ser dos tipos a la vez).
 */
function garantizarDescansoAntesDelJefe(nodos, pisos, arco) {
  const indicePisoPrevio = arco.pisoJefeFinal - 2; // pisos[] es 0-index; el piso N vive en pisos[N-1]
  const idsPisoPrevio = pisos[indicePisoPrevio];
  if (!idsPisoPrevio) return; // arco de un solo piso (no debería pasar, pero por seguridad)

  const yaTieneDescanso = idsPisoPrevio.some((id) => nodos[id].tipo === 'descanso');
  if (yaTieneDescanso) return;

  const candidatos = idsPisoPrevio.filter((id) => nodos[id].tipo !== 'miniJefe');
  if (candidatos.length === 0) return;

  const idElegido = candidatos[numeroAleatorioEntre(0, candidatos.length - 1)];
  nodos[idElegido].tipo = 'descanso';
}

/**
 * Nivel de un enemigo de combate normal, según el piso en el que aparece.
 * Escalado ADITIVO fijo (no depende del nivel del jugador): recalibrado con
 * el número REAL de combates de un único camino recorrido (no la suma de
 * todos los nodos del piso, que sobreestimaba mucho el ritmo de subida de
 * nivel real de una run — ver documentacion/11-progresion-y-arcos.md).
 */
export function calcularNivelPorPiso(piso, arco) {
  return Math.max(1, Math.round(arco.nivelEnemigoBase + (piso - 1) * arco.escaladoNivelPorPiso));
}

/**
 * Devuelve { enemigoBase, nivel } listo para pasar a store.jugarCombate(),
 * o null si el nodo no tiene combate (evento, tienda, descanso, reclutamiento).
 *
 * Los combates normales escalan por piso (calcularNivelPorPiso). Los
 * mini-jefes/jefes usan un nivel FIJO explícito (arco.nivelMiniJefe /
 * arco.nivelJefeFinal), calculado aparte para que sean superables incluso
 * por el "camino mínimo" (saltando todo lo opcional) — ver
 * documentacion/11-progresion-y-arcos.md.
 *
 * Probabilidad de enemigo nombrado vs plantilla genérica en nodos 'combate'
 * normales: 20% / 80%, fija por ahora — candidato a mover a config.json si
 * hace falta ajustarla en el playtest.
 */
export function resolverEnemigoDeNodo(nodo, arco) {
  if (nodo.tipo === 'jefe') {
    const jefe = enemiesData.jefes.find((j) => j.id === arco.jefeFinalId);
    return { enemigoBase: jefe, nivel: arco.nivelJefeFinal };
  }

  if (nodo.tipo === 'miniJefe') {
    const miniJefe = enemiesData.jefes.find((j) => j.id === arco.miniJefeId);
    return { enemigoBase: miniJefe, nivel: arco.nivelMiniJefe };
  }

  if (nodo.tipo === 'combate') {
    const { plantillasGenericas, enemigosNombrados } = commonEnemiesData;
    const usarNombrado = nodo.subtipo === 'entrenador' && enemigosNombrados.length > 0;

    const enemigoBase = usarNombrado
      ? enemigosNombrados[numeroAleatorioEntre(0, enemigosNombrados.length - 1)]
      : plantillasGenericas[numeroAleatorioEntre(0, plantillasGenericas.length - 1)];

    return { enemigoBase, nivel: calcularNivelPorPiso(nodo.piso, arco) };
  }

  return null; // evento, tienda, descanso, reclutar
}
