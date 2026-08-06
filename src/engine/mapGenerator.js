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
 * Genera el mapa completo de un arco: nodos organizados por piso, con
 * conexiones hacia el piso siguiente. El último piso es siempre un único
 * nodo de tipo 'jefe'. El piso de mini-jefe fuerza un nodo de tipo 'miniJefe'.
 */
export function generarMapa(arco) {
  contadorId = 0;
  const nodos = {};
  const pisos = [];

  for (let piso = 1; piso <= arco.numeroPisos; piso++) {
    const esUltimoPiso = piso === arco.pisoJefeFinal;
    const numNodos = esUltimoPiso
      ? 1
      : numeroAleatorioEntre(arco.nodosPorPiso.min, arco.nodosPorPiso.max);

    const idsPiso = [];
    for (let i = 0; i < numNodos; i++) {
      const id = generarIdNodo();
      const tipo = esUltimoPiso ? 'jefe' : elegirTipoPorPeso(arco.poolTiposNodo);
      nodos[id] = { id, piso, tipo, conexiones: [], visitado: false, completado: false };
      idsPiso.push(id);
    }
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

  return { arcoId: arco.id, pisos, nodos, nodosIniciales: pisos[0] };
}

/**
 * Nivel de un enemigo según el piso en el que aparece. Escalado ADITIVO
 * (no exponencial): nivel = nivelEnemigoBase + (piso - 1) * escaladoNivelPorPiso.
 */
export function calcularNivelPorPiso(piso, arco) {
  return Math.round(arco.nivelEnemigoBase + (piso - 1) * arco.escaladoNivelPorPiso);
}

/**
 * Devuelve { enemigoBase, nivel } listo para pasar a store.jugarCombate(),
 * o null si el nodo no tiene combate (evento, tienda, descanso, reclutamiento).
 *
 * Probabilidad de enemigo nombrado vs plantilla genérica en nodos 'combate'
 * normales: 20% / 80%, fija por ahora — candidato a mover a config.json si
 * hace falta ajustarla en el playtest.
 */
export function resolverEnemigoDeNodo(nodo, arco) {
  const nivel = calcularNivelPorPiso(nodo.piso, arco);

  if (nodo.tipo === 'jefe') {
    const jefe = enemiesData.jefes.find((j) => j.id === arco.jefeFinalId);
    return { enemigoBase: jefe, nivel };
  }

  if (nodo.tipo === 'miniJefe') {
    const miniJefe = enemiesData.jefes.find((j) => j.id === arco.miniJefeId);
    return { enemigoBase: miniJefe, nivel };
  }

  if (nodo.tipo === 'combate') {
    const { plantillasGenericas, enemigosNombrados } = commonEnemiesData;
    const usarNombrado = enemigosNombrados.length > 0 && Math.random() < 0.2;

    const enemigoBase = usarNombrado
      ? enemigosNombrados[numeroAleatorioEntre(0, enemigosNombrados.length - 1)]
      : plantillasGenericas[numeroAleatorioEntre(0, plantillasGenericas.length - 1)];

    return { enemigoBase, nivel };
  }

  return null; // evento, tienda, descanso, reclutamiento
}