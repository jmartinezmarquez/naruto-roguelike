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
  'ascensionMinima',
  'ganarRun',
  'nivelNinjaMinimo',
  'invocacionMinima',
  'coleccionInvocacion',
];

// ⚠️ Desde el 2026-10-16 todo logro paga en pergaminos de invocación: lo que antes
// desbloqueaban (jefes reclutables, iniciales, objetos iniciales) sale del gacha, que
// es la mecánica principal de la meta-progresión (documentacion/42).
export const TIPOS_DE_RECOMPENSA = ['pergaminos'];

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
    // Con filtros opcionales, para que "derrota a Gaara con Rock Lee en el equipo" o
    // "derrota a un jefe final sin relevos" sigan siendo solo datos:
    //   jefeId (si falta, vale cualquier jefe) · soloJefeFinal · conPersonajeId · sinRelevos
    case 'derrotarJefe':
      if (!contexto.jefeDerrotadoId) return false;
      if (condicion.jefeId && contexto.jefeDerrotadoId !== condicion.jefeId) return false;
      if (condicion.soloJefeFinal && !contexto.arcoCompletadoId) return false;
      if (condicion.conPersonajeId && !(contexto.equipoIds ?? []).includes(condicion.conPersonajeId)) return false;
      if (condicion.sinRelevos && !contexto.sinRelevos) return false;
      return true;
    // Ganar una run, con filtros opcionales (todos los que vengan tienen que cumplirse):
    //   conPersonajeId · liderId (en la posición 1 al ganar) · soloRarezas (todo el
    //   equipo) · sinTiendas · sinConsumibles
    case 'ganarRun': {
      if (!contexto.runGanada) return false;
      const equipo = contexto.equipo ?? [];
      if (condicion.conPersonajeId && !equipo.some((p) => p.id === condicion.conPersonajeId)) return false;
      if (condicion.liderId && equipo[0]?.id !== condicion.liderId) return false;
      if (condicion.soloRarezas && !equipo.every((p) => condicion.soloRarezas.includes(p.rareza))) return false;
      const estadisticas = contexto.estadisticasRun ?? {};
      if (condicion.sinTiendas && estadisticas.tiendasVisitadas > 0) return false;
      if (condicion.sinConsumibles && estadisticas.consumiblesUsados > 0) return false;
      return true;
    }
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
    // "Gana una run en la ascensión N o más", en cualquier campaña. Lo completa
    // `evaluarLogros` desde lo guardado (`ascensionMaximaGanada`, -1 si ninguna),
    // como los contadores: ganar A3 sin haber pasado por A2 no puede pasar, pero
    // si pasara, el logro de A2 tiene que saltar igual.
    case 'ascensionMinima':
      return (contexto.ascensionMaximaGanada ?? -1) >= condicion.nivel;
    // Las tres de la meta-progresión (documentacion/42) también las completa
    // `evaluarLogros` desde lo guardado: el nivel de ninja más alto del roster, las
    // tiradas o legendarios del gacha, y si una parte de su colección está completa
    // (`tipoPremio`: 'pagina', 'personaje', 'objeto' o 'todo').
    case 'nivelNinjaMinimo':
      return (contexto.nivelNinjaMaximo ?? 1) >= condicion.nivel;
    case 'invocacionMinima':
      return (contexto.invocacion?.[condicion.campo] ?? 0) >= condicion.cantidad;
    case 'coleccionInvocacion':
      return Boolean(contexto.coleccionInvocacionCompleta?.[condicion.tipoPremio]);
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

/**
 * Las rarezas de "una estrella": las que se pueden elegir como inicial en cuanto
 * se han tenido en el equipo alguna vez. Raros y legendarios no — esos salen del
 * gacha, o el reto de conseguirlos (el pergamino dorado) dejaría de existir.
 */
export const RAREZAS_DE_UNA_ESTRELLA = ['inicial', 'comun'];

/**
 * El roster de la pantalla de selección: los "inicial" de siempre, los conseguidos
 * en el gacha y **los de una estrella
 * que ya hayan estado en tu equipo en alguna run** (`idsVistos`, el registro de
 * ninjas del Bingo Book). Reclutar a alguien es lo que lo desbloquea.
 *
 * En la primera run `idsVistos` está vacío y salen solo los tres iniciales, así que
 * la calibración de la primera run (documentacion/11, "v5") no se mueve.
 * Conserva el orden de `personajes`, que es el del JSON.
 */
export function rosterInicial(personajes, idsDelGacha, idsVistos) {
  return personajes.filter((p) => p.rareza === 'inicial'
    || idsDelGacha.includes(p.id)
    || (RAREZAS_DE_UNA_ESTRELLA.includes(p.rareza) && idsVistos.includes(p.id)));
}

/**
 * Los pergaminos que deben los logros conseguidos y aún no cobrados (recompensa
 * `pergaminos`). Devuelve el total y los ids, para apuntarlos como cobrados: así
 * cada logro paga UNA vez, y los conseguidos antes de que existiera esta recompensa
 * se cobran la primera vez que se carga la partida.
 */
export function pergaminosPorCobrar(logros, idsDesbloqueados, idsCobrados) {
  const pendientes = logros.filter((l) => l.recompensa.tipo === 'pergaminos'
    && idsDesbloqueados.includes(l.id) && !idsCobrados.includes(l.id));
  return {
    total: pendientes.reduce((acc, l) => acc + l.recompensa.cantidad, 0),
    ids: pendientes.map((l) => l.id),
  };
}

/**
 * Los logros que se pueden conseguir hoy: fuera los que nombran un jefe, un arco o un
 * ninja que aún espera su arte (`pendienteDeArte`), porque Missions estaría pidiendo
 * algo imposible. Se cuentan solos el día que llega el dibujo.
 */
export function logrosDisponibles(logros, idsPendientesDeArte) {
  const pendientes = new Set(idsPendientesDeArte);
  return logros.filter(({ condicion: c }) => ![c.jefeId, c.arcoId, c.conPersonajeId, c.liderId].some((id) => id && pendientes.has(id)));
}
