// Traducción de un efecto de juego a lo que se ve en pantalla, en DATOS y no en prosa.
//
// Vive aparte de las pantallas porque lo consumen tres sitios que antes no compartían
// nada: la pista de una elección de evento (lo que va a pasar), su resultado (lo que ha
// pasado) y el indicador de buffs activos del mapa y del combate (lo que está pasando).
//
// ⚠️ **Que sean el mismo dato pintado igual no es ahorro de código, es la mitad del
// arreglo**: el jugador acepta un "ATK +20% · 3 battles" en el evento y luego ve esa
// MISMA pastilla en el mapa y en el combate. Antes el buff se aplicaba de verdad en
// `crearLuchador` y no aparecía en ningún sitio, así que era un efecto invisible: el
// juego cambiaba los números y no lo decía.

const NOMBRE_STAT = { ataque: 'ATK', defensa: 'DEF', velocidad: 'SPD', hp: 'HP' };

/** El nombre corto de una estadística, tal y como se enseña en las pastillas. */
export function nombreStat(stat) {
  return NOMBRE_STAT[stat] ?? String(stat).toUpperCase();
}

const porcentaje = (n) => `${Math.round(n * 100)}%`;

/**
 * Un efecto de evento → lista de pastillas `{ texto, tono, sufijo }`.
 *
 * Devuelve una LISTA y no una pastilla porque `varios` es un contenedor: "curas al
 * equipo y pagas 20 de oro" son dos consecuencias distintas y tienen que poder salir
 * en dos colores. Aplanarlas aquí es lo que permite que la pantalla no sepa de
 * recursión.
 *
 * ⚠️ **`azar` NO se aplana**: sus dos ramas no son dos consecuencias, son una o la
 * otra, y fundirlas en la misma fila diría que pasan las dos. La pantalla lo trata
 * aparte (ver `RamasDeAzar` en EventScreen).
 */
export function resumirEfecto(efecto) {
  if (!efecto) return [];

  switch (efecto.tipo) {
    case 'varios':
      return (efecto.efectos ?? []).flatMap(resumirEfecto);

    case 'curarEquipoPorcentaje':
      return [{ texto: `+${porcentaje(efecto.cantidad)} HP`, tono: 'ganancia' }];

    case 'perderHpEquipo':
      return [{ texto: `−${porcentaje(efecto.porcentaje)} HP`, tono: 'coste' }];

    case 'buffTemporalEquipo':
      return [{
        texto: `${nombreStat(efecto.stat)} +${porcentaje(efecto.multiplicador - 1)}`,
        tono: 'ganancia',
        sufijo: `${efecto.combates} battles`,
      }];

    case 'ganarXpEquipo':
      return [{ texto: `+${efecto.cantidad} XP`, tono: 'ganancia' }];

    case 'ganarOro':
      return [{ texto: `+${efecto.cantidad} g`, tono: 'ganancia' }];

    case 'perderOro':
      return [{ texto: `−${efecto.cantidad} g`, tono: 'coste' }];

    case 'comprarObjetoAleatorio':
      return efecto.coste > 0
        ? [{ texto: 'Random item', tono: 'ganancia' }, { texto: `−${efecto.coste} g`, tono: 'coste' }]
        : [{ texto: 'Random item', tono: 'ganancia' }];

    case 'mejoraPermanenteAleatoria':
      return [{ texto: 'Permanent stat up', tono: 'ganancia', sufijo: '1 ninja' }];

    case 'ninguno':
      return [{ texto: 'Nothing', tono: 'neutro' }];

    default:
      // ⚠️ Un tipo que no esté aquí sale marcado, no en silencio. El error de este
      // proyecto ya fue una vez el contrario: un `default` que decía "Nothing happens"
      // y le mentía al jugador mientras el store le quitaba 20 de oro.
      return [{ texto: `?? ${efecto.tipo}`, tono: 'neutro' }];
  }
}

/**
 * Un buff temporal ACTIVO del store (`{ multiplicadores, combatesRestantes }`) → sus
 * pastillas, con lo que le queda de vida.
 *
 * El sufijo cuenta combates y no nodos: es lo que de verdad lo consume
 * (`_consumirUsoBuffsTemporales` corre al terminar un combate), y decir "3 nodos"
 * cuando un evento o una tienda no lo gastan sería mentir con precisión.
 */
export function resumirBuffActivo(buff) {
  return Object.entries(buff.multiplicadores ?? {})
    .filter(([, multiplicador]) => multiplicador !== 1)
    .map(([stat, multiplicador]) => ({
      texto: `${nombreStat(stat)} ${multiplicador > 1 ? '+' : '−'}${porcentaje(Math.abs(multiplicador - 1))}`,
      tono: multiplicador > 1 ? 'ganancia' : 'coste',
      sufijo: `${buff.combatesRestantes}×`,
    }));
}

/** Todas las pastillas de todos los buffs activos, ya aplanadas. */
export function resumirBuffsActivos(buffsTemporales) {
  return (buffsTemporales ?? []).flatMap(resumirBuffActivo);
}
