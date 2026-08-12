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

/**
 * Rareza del pergamino de un nodo de reclutar, sorteada con los pesos del arco
 * (`poolRarezaReclutar`) y **restringida a las rarezas que de verdad tienen
 * candidatos** en esta run.
 *
 * Ese filtro es el motivo de que la rareza se decida aquí y no al entrar en el
 * nodo: el mapa pinta un pergamino verde, azul o dorado, así que la rareza tiene
 * que existir antes de que el jugador elija a dónde va. Y como el motor no sabe
 * nada del equipo ni de los logros, quién está disponible se lo dice el store
 * (`rarezasReclutarDisponibles`) — sin eso, un mapa recién empezado prometería
 * pergaminos dorados que al abrirlos no tienen a nadie dentro.
 */
function elegirRarezaReclutar(arco, rarezasDisponibles) {
  const pool = (arco.poolRarezaReclutar ?? [])
    .filter((r) => rarezasDisponibles.includes(r.rareza));
  if (pool.length === 0) return 'comun';

  const total = pool.reduce((acc, r) => acc + r.peso, 0);
  let tirada = Math.random() * total;
  for (const { rareza, peso } of pool) {
    if (tirada < peso) return rareza;
    tirada -= peso;
  }
  return pool[pool.length - 1].rareza;
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
 * Anchos de todos los pisos, con la regla de que **dos pisos seguidos nunca
 * miden lo mismo**: el mapa tiene que ensancharse o estrecharse en cada salto,
 * que es lo que dibuja el rombo. Sin esto, el ruido de `anchoDelPiso` repetía
 * el mismo ancho varias veces seguidas y salían tramos rectos.
 *
 * El primer piso (nodo de inicio) y el del jefe miden 1 y no se tocan; los de
 * en medio se corrigen en pasada única: si repiten el ancho del anterior, se
 * intenta subir uno y, si no cabe en `max`, bajar uno.
 */
function anchosDeLosPisos(arco, numeroPisosNormales) {
  const { min, max } = arco.nodosPorPiso;
  const anchos = [];

  for (let piso = 1; piso <= arco.numeroPisos; piso++) {
    if (piso === 1 || piso === arco.pisoJefeFinal) {
      anchos.push(1);
      continue;
    }
    let ancho = anchoDelPiso(piso, numeroPisosNormales, min, max);
    // El piso justo después de la salida se abre como mucho a 3: del nodo de
    // inicio salen todas las aristas de ese piso, y con 4-5 el arranque parecía
    // una estrella en vez del pico de un rombo.
    if (piso === 2) ancho = Math.min(ancho, Math.max(min, 3));
    const anterior = anchos[anchos.length - 1];
    if (ancho === anterior) {
      ancho = ancho + 1 <= max ? ancho + 1 : Math.max(min, ancho - 1);
    }
    anchos.push(ancho);
  }

  // El piso anterior al jefe también tiene que romper con el 1 del jefe, y
  // además `garantizarDescansoAntesDelJefe` necesita sitio para un descanso
  // que no pise al mini-jefe.
  const indicePrevio = arco.pisoJefeFinal - 2;
  if (indicePrevio > 0 && anchos[indicePrevio] === 1) {
    anchos[indicePrevio] = Math.min(max, 2);
  }

  return anchos;
}

/**
 * Genera el mapa completo de un arco: nodos organizados por piso, con
 * conexiones hacia el piso siguiente.
 *
 * - El piso 1 es siempre un único nodo `inicio`, que nace ya visitado: es la
 *   casilla de salida, como en un Pokelike. No se juega, solo marca de dónde
 *   sale el jugador y da el primer abanico de opciones.
 * - El último piso es siempre un único nodo de tipo 'jefe'.
 * - El piso de mini-jefe fuerza un nodo de tipo 'miniJefe'.
 *
 * `opciones.rarezasReclutarDisponibles` son las rarezas que tienen al menos un
 * candidato reclutable en esta run — las calcula el store, que es quien conoce
 * el equipo y los logros. Por defecto, solo `comun`: un mapa generado sin esa
 * información no promete pergaminos raros ni dorados que luego no puede cumplir.
 */
export function generarMapa(arco, opciones = {}) {
  const { rarezasReclutarDisponibles = ['comun'] } = opciones;
  contadorId = 0;
  const nodos = {};
  const pisos = [];
  const numeroPisosNormales = arco.numeroPisos - 1; // todos menos el del jefe
  const anchos = anchosDeLosPisos(arco, numeroPisosNormales);

  for (let piso = 1; piso <= arco.numeroPisos; piso++) {
    const esUltimoPiso = piso === arco.pisoJefeFinal;
    const esPisoInicio = piso === 1;
    const numNodos = anchos[piso - 1];

    // El primer piso jugable (el 2, porque el 1 es la casilla de salida) nunca
    // debe ofrecer descanso —curar algo que ya está a HP completo no es una
    // opción real— ni tienda, porque todavía no hay oro.
    const poolDeEstePiso = piso === 2
      ? arco.poolTiposNodo.filter((t) => t.tipo !== 'descanso' && t.tipo !== 'tienda')
      : arco.poolTiposNodo;

    const idsPiso = [];
    for (let i = 0; i < numNodos; i++) {
      const id = generarIdNodo();
      const tipo = esPisoInicio ? 'inicio' : esUltimoPiso ? 'jefe' : elegirTipoPorPeso(poolDeEstePiso);
      const subtipo = tipo === 'combate' ? (Math.random() < 0.2 ? 'entrenador' : 'aleatorio') : undefined;
      nodos[id] = {
        id,
        piso,
        tipo,
        ...(subtipo !== undefined && { subtipo }),
        conexiones: [],
        visitado: esPisoInicio,
        completado: esPisoInicio,
      };
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
  colocarNodosDeReclutar(nodos, pisos, arco);

  // La rareza se reparte al final, cuando el tipo de cada nodo ya no va a
  // cambiar.
  Object.values(nodos).forEach((nodo) => {
    if (nodo.tipo === 'reclutar') {
      nodo.rareza = elegirRarezaReclutar(arco, rarezasReclutarDisponibles);
    }
  });

  return {
    arcoId: arco.id,
    pisos,
    nodos,
    nodosIniciales: pisos[0],
    // El nodo de salida: el store arranca la run ya plantado aquí, así que las
    // primeras opciones reales son sus conexiones, no el piso entero.
    nodoInicialId: pisos[0][0],
  };
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
 * Coloca los nodos de reclutar del arco: **uno seguro**, y un segundo solo con
 * `arco.probabilidadSegundoNodoReclutar`.
 *
 * No salen del sorteo por peso como el resto de tipos, y el motivo es que el
 * equipo tiene 3 huecos para toda la run: con `reclutar` en `poolTiposNodo` el
 * mapa ofrecía cuatro y cinco pergaminos por arco, y a partir del segundo la
 * decisión ya no existe —o no tienes a quién meter, o estás tirando a alguien
 * que acabas de reclutar—. Un nodo que casi siempre se salta es un nodo muerto.
 * Colocándolos aquí el número es exacto, no una esperanza estadística.
 *
 * Van después del descanso garantizado y nunca pisan un nodo que ya significa
 * algo (`inicio`, `jefe`, `miniJefe`, `descanso`): los tres primeros no se pueden
 * reemplazar y el cuarto es una garantía que este código no debe deshacer.
 */
function colocarNodosDeReclutar(nodos, pisos, arco) {
  const NO_REEMPLAZABLES = new Set(['inicio', 'jefe', 'miniJefe', 'descanso']);
  const pisosJugables = [];
  for (let piso = 2; piso < arco.pisoJefeFinal; piso += 1) {
    const candidatos = (pisos[piso - 1] ?? []).filter((id) => !NO_REEMPLAZABLES.has(nodos[id].tipo));
    if (candidatos.length > 0) pisosJugables.push(candidatos);
  }
  if (pisosJugables.length === 0) return;

  const cuantos = Math.random() < (arco.probabilidadSegundoNodoReclutar ?? 0) ? 2 : 1;
  // Un piso como mucho aporta un pergamino: dos en el mismo piso son la misma
  // decisión repetida, y encima el jugador solo puede tomar uno de los dos.
  const pisosElegidos = [];
  const disponibles = [...pisosJugables];
  for (let i = 0; i < cuantos && disponibles.length > 0; i += 1) {
    pisosElegidos.push(...disponibles.splice(numeroAleatorioEntre(0, disponibles.length - 1), 1));
  }

  pisosElegidos.forEach((candidatos) => {
    const id = candidatos[numeroAleatorioEntre(0, candidatos.length - 1)];
    nodos[id].tipo = 'reclutar';
    delete nodos[id].subtipo; // por si era un combate de entrenador
  });
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
