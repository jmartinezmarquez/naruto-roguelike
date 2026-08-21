// La ficha compartible del final de una run — punto 20 del roadmap.
//
// ⚠️ **Por qué es TEXTO y no una imagen bonita**: el juego se sirve desde GitHub
// Pages, que es estático (ver documentacion/37-publicacion-web.md). No hay
// backend, así que no hay leaderboard, ni cuentas, ni ranking global: **el único
// canal que sale del navegador es el portapapeles**. Esa no es la limitación a
// esquivar, es exactamente la restricción que Wordle y los juegos diarios
// convirtieron en su motor — algo que se pega en un chat y se lee sin abrir nada.
//
// ⚠️ Y **no puede spoilear**. El rastro dice de QUÉ TIPO era cada nodo que
// pisaste, nunca qué había dentro: una ficha que revele el mapa es una ficha que
// nadie comparte.

/** El rastro, un emoji por nodo. Es el mapa que el jugador recorrió, no el que le tocó. */
const EMOJI_NODO = {
  combate: '⚔️',
  entrenador: '🥷',
  evento: '🎴',
  tienda: '🏪',
  descanso: '💤',
  reclutar: '📜',
  reclutarLegendario: '🌟',
  miniJefe: '👺',
  jefe: '👹',
};

export const URL_DEL_JUEGO = 'https://jmartinezmarquez.github.io/naruto-roguelike/';

/** El emoji de un nodo del rastro. El de `inicio` no existe a propósito: la casilla de salida no la elige nadie. */
export function emojiDeNodo({ tipo, subtipo, rareza }) {
  if (tipo === 'combate') return subtipo === 'entrenador' ? EMOJI_NODO.entrenador : EMOJI_NODO.combate;
  if (tipo === 'reclutar') return rareza === 'legendario' ? EMOJI_NODO.reclutarLegendario : EMOJI_NODO.reclutar;
  return EMOJI_NODO[tipo] ?? null;
}

/**
 * La ficha entera, lista para pegar.
 *
 * Recibe **datos ya calculados** y no lee ningún store: es una función pura para
 * poder probarla con una instantánea en vez de montando media aplicación.
 *
 * `arcos` son los JSON de la campaña **en su orden**, de donde salen el nombre y
 * el emoji de cada línea. El emoji vive en el JSON del arco y no en una tabla de
 * aquí porque el contenido vive con su dueño: añadir un arco no debería obligar a
 * tocar este fichero.
 */
export function fichaDeLaRun({ rastro = [], resumen, rangoNinja, arcos = [], final = null }) {
  const lineas = [];

  lineas.push(`Narutolike — Mission rank ${resumen.rango}`);
  lineas.push(`Ninja rank: ${rangoNinja}`);
  lineas.push('');

  for (const arco of arcos) {
    const suyos = rastro.filter((n) => n.arcoId === arco.id);
    if (suyos.length === 0) continue;
    const trazo = suyos.map(emojiDeNodo).filter(Boolean).join('');
    // Un arco al que llegaste pero del que no diste ni un paso no pinta línea
    // vacía: diría "estuve aquí" sin decir nada.
    if (trazo) lineas.push(`${arco.emoji ?? ''} ${arco.nombre}  ${trazo}`.trim());
  }

  lineas.push('');
  if (resumen.runGanada) {
    lineas.push(
      resumen.huboBajas
        ? `Won the run at Lv.${resumen.nivelMaximoDelEquipo}.`
        : `Won the run at Lv.${resumen.nivelMaximoDelEquipo}, without losing a single ninja.`,
    );
  } else {
    const donde = final?.arcoNombre ? ` in ${final.arcoNombre}, floor ${final.piso}` : '';
    lineas.push(`Fell${donde} at Lv.${resumen.nivelMaximoDelEquipo}.`);
  }
  lineas.push(URL_DEL_JUEGO);

  return lineas.join('\n');
}
