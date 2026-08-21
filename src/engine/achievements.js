// src/engine/achievements.js
// Lógica pura de logros: qué condiciones se cumplen y qué recompensas están
// activas. No importa React ni el store — recibe listas de datos y contexto,
// devuelve datos, nunca toca localStorage ni el estado global.

/**
 * Los tipos que el motor sabe evaluar y pintar. Se exportan para que el test de
 * invariante pueda comprobar que **ningún logro del JSON declara algo que nadie
 * entiende**: un tipo desconocido no revienta, simplemente no se cumple JAMÁS y
 * la pantalla se queda muda. Es el fallo silencioso que este proyecto ya ha
 * pagado con las pasivas fuera de catálogo y con los ids contra nombres.
 */
export const TIPOS_DE_CONDICION = [
  'derrotarJefe',
  'completarArcoSinDerrotas',
  'contadorMinimo',
  'coleccionMinima',
];

export const TIPOS_DE_RECOMPENSA = [
  'desbloquearPersonajeReclutable',
  'desbloquearPersonajeInicial',
  'desbloquearObjetoInicial',
  'ninguna',
];

/**
 * ¿La condición de un logro se cumple con este contexto?
 *
 * El contexto trae dos cosas de naturaleza distinta: lo que **acaba de pasar**
 * (`jefeDerrotadoId`, `arcoCompletadoId`) y lo **acumulado** (`contadores`,
 * `vistos`), que viene siempre. Por eso un logro de contador salta desde
 * cualquier punto de evaluación sin que ese punto sepa nada de él.
 */
function cumpleCondicion(condicion, contexto) {
  switch (condicion.tipo) {
    case 'derrotarJefe':
      return contexto.jefeDerrotadoId === condicion.jefeId;
    case 'completarArcoSinDerrotas':
      return contexto.arcoCompletadoId === condicion.arcoId && contexto.arcoCompletadoSinDerrotas === true;
    // Genérica a propósito: `{ contador, cantidad }` en vez de un tipo por
    // métrica (`ganarNCombates`, `reclutarNNinjas`...). Con un tipo por métrica,
    // cada logro nuevo obligaría a tocar `engine/`; así añadir uno vuelve a ser
    // **solo datos**, que es la regla del proyecto.
    case 'contadorMinimo':
      return (contexto.contadores?.[condicion.contador] ?? 0) >= condicion.cantidad;
    // "Cuántas cosas DISTINTAS has visto", leído del registro de la enciclopedia.
    // No lleva contador propio porque ya está guardado, y un contador que suma
    // repetidos contestaría otra pregunta: haber peleado 12 veces contra el mismo
    // bandido no es haber visto 12 enemigos.
    case 'coleccionMinima':
      return (contexto.vistos?.[condicion.categoria]?.length ?? 0) >= condicion.cantidad;
    default:
      return false;
  }
}

/**
 * Cuánto llevas de un logro que se mide por acumulación, para poder pintar
 * "12 / 30" en su tarjeta. Devuelve `null` para los que no son de progreso: una
 * condición de suceso (derrotar a Zabuza) no tiene medias tintas, y una barra al
 * 0% de algo binario dice menos que el propio "Locked".
 */
export function progresoDeLogro(logro, contexto) {
  const { condicion } = logro;
  if (condicion.tipo === 'contadorMinimo') {
    return { actual: contexto.contadores?.[condicion.contador] ?? 0, objetivo: condicion.cantidad };
  }
  if (condicion.tipo === 'coleccionMinima') {
    return { actual: contexto.vistos?.[condicion.categoria]?.length ?? 0, objetivo: condicion.cantidad };
  }
  return null;
}

/**
 * De entre los logros aún no desbloqueados, cuáles cumple el contexto dado.
 * contexto: { jefeDerrotadoId, arcoCompletadoId, arcoCompletadoSinDerrotas }
 * (cualquier campo puede ser null si no aplica a este evento).
 */
export function evaluarLogrosDesbloqueables(logros, idsYaDesbloqueados, contexto) {
  return logros.filter(
    (logro) => !idsYaDesbloqueados.includes(logro.id) && cumpleCondicion(logro.condicion, contexto),
  );
}

/** Ids de personaje desbloqueados como reclutables (recompensa desbloquearPersonajeReclutable) entre los logros ya conseguidos. */
export function obtenerPersonajesReclutablesDesbloqueados(logros, idsDesbloqueados) {
  return logros
    .filter((l) => idsDesbloqueados.includes(l.id) && l.recompensa.tipo === 'desbloquearPersonajeReclutable')
    .map((l) => l.recompensa.personajeId);
}

/** Ids de objeto desbloqueados como parte del inventario inicial (recompensa desbloquearObjetoInicial) entre los logros ya conseguidos. */
export function obtenerObjetosInicialesDesbloqueados(logros, idsDesbloqueados) {
  return logros
    .filter((l) => idsDesbloqueados.includes(l.id) && l.recompensa.tipo === 'desbloquearObjetoInicial')
    .map((l) => l.recompensa.objetoId);
}

/** Ids de personaje desbloqueados como opción de equipo inicial (recompensa desbloquearPersonajeInicial) entre los logros ya conseguidos. */
export function obtenerPersonajesInicialesDesbloqueados(logros, idsDesbloqueados) {
  return logros
    .filter((l) => idsDesbloqueados.includes(l.id) && l.recompensa.tipo === 'desbloquearPersonajeInicial')
    .map((l) => l.recompensa.personajeId);
}

// ---------------------------------------------------------------------------
// Rangos — punto 19 del roadmap. Ver documentacion/18-sistema-de-logros.md.
//
// Naruto tiene DOS escaleras y el juego las usa las dos, que es lo que evita
// tener que inventarse un vocabulario:
//
//   - **Rango de misión (D-S)**: lo difícil que es una tarea. Lo lleva cada
//     logro, y también se le pone a la run recién jugada.
//   - **Rango ninja (Genin-Kage)**: lo que eres tú, acumulado entre runs. Es lo
//     único del juego que sube PARA SIEMPRE.
// ---------------------------------------------------------------------------

/**
 * ⚠️ **El rango mide DIFICULTAD, no recompensa.** 13 de los 23 logros dan
 * `recompensa: 'ninguna'` a propósito ("a mark of honour") y varios de esos son
 * de los más duros del juego: si el rango siguiera al premio, los más difíciles
 * saldrían como los más baratos y la escalera mediría lo contrario de lo que
 * dice medir.
 */
export const RANGOS_DE_MISION = ['D', 'C', 'B', 'A', 'S'];

/**
 * ⚠️ **La curva es convexa a propósito**: una S vale más que seis D. Si el
 * reparto fuera lineal, la forma óptima de subir de rango ninja sería no
 * intentar nunca lo difícil, y la cima dejaría de significar nada.
 */
export const PUNTOS_POR_RANGO = { D: 1, C: 2, B: 4, A: 7, S: 12 };

/**
 * ⚠️ **Umbrales ABSOLUTOS, no un porcentaje del total disponible.** Con
 * porcentajes, añadir un logro nuevo **degradaría** a quien ya jugó —sus puntos
 * siguen, el total sube— y bajarle el rango a alguien por una actualización no
 * es aceptable. El riesgo del absoluto es el contrario, la inflación, y ese sí
 * se tapa con los dos tests de invariante de `useAchievementsStore.test.js`:
 * Kage tiene que ser alcanzable y tiene que exigir la mayor parte de lo que hay.
 */
export const RANGOS_NINJA = [
  { id: 'genin', nombre: 'Genin', umbral: 0 },
  { id: 'chunin', nombre: 'Chunin', umbral: 8 },
  { id: 'jonin', nombre: 'Jonin', umbral: 22 },
  { id: 'anbu', nombre: 'ANBU', umbral: 45 },
  { id: 'kage', nombre: 'Kage', umbral: 75 },
];

/** Lo que vale un logro. Un rango que no esté en la tabla vale 0 — pero eso no llega a pasar: hay un invariante que lo prohíbe en el JSON. */
export function puntosDeLogro(logro) {
  return PUNTOS_POR_RANGO[logro?.rango] ?? 0;
}

/** Los puntos que suman los logros YA conseguidos. */
export function puntosAcumulados(logros, idsDesbloqueados) {
  return logros
    .filter((l) => idsDesbloqueados.includes(l.id))
    .reduce((total, l) => total + puntosDeLogro(l), 0);
}

/** Los puntos que habría con TODO desbloqueado. Lo usan la pantalla y los invariantes. */
export function puntosMaximos(logros) {
  return logros.reduce((total, l) => total + puntosDeLogro(l), 0);
}

/**
 * En qué rango ninja estás y cuánto te falta para el siguiente.
 *
 * ⚠️ **No se persiste: se DERIVA** de los logros ya guardados. Un dato derivado
 * que además se guarda es un dato que se puede desincronizar — y aquí se
 * desincronizaría justo al reiniciar la meta-progresión, que es cuando más se
 * nota.
 */
export function rangoNinja(puntos) {
  let actual = RANGOS_NINJA[0];
  for (const rango of RANGOS_NINJA) {
    if (puntos >= rango.umbral) actual = rango;
  }
  const siguiente = RANGOS_NINJA[RANGOS_NINJA.indexOf(actual) + 1] ?? null;
  const faltan = siguiente ? siguiente.umbral - puntos : 0;
  const recorrido = siguiente ? siguiente.umbral - actual.umbral : 0;
  return {
    actual,
    siguiente,
    puntos,
    faltan,
    // 0..1 dentro del tramo actual. Sin siguiente (Kage) está lleno por definición.
    progreso: siguiente ? (puntos - actual.umbral) / recorrido : 1,
  };
}

/**
 * La nota de una run terminada, en la misma escala D-S que las misiones.
 *
 * Se mide por **arcos completados** y no por pisos porque un arco es la unidad
 * que el jugador reconoce (y la que le cura el equipo). La `S` pide ganar la run
 * **sin una sola baja**: si la diera cualquier victoria, el 100% de las runs
 * ganadas serían S y la escala tendría cuatro peldaños en vez de cinco.
 */
export function rangoDeMision({ arcosCompletados = 0, runGanada = false, huboBajas = true } = {}) {
  if (runGanada && !huboBajas) return 'S';
  if (runGanada) return 'A';
  if (arcosCompletados >= 2) return 'B';
  if (arcosCompletados >= 1) return 'C';
  return 'D';
}
