// La traducción de efecto a pastilla, que ahora es el vocabulario común de tres
// pantallas: la promesa del evento, su resultado y el indicador de buffs activos.
//
// ⚠️ Se prueba aparte de las pantallas porque **es donde vive el `default`**. Antes esa
// rama decía "Nothing happens" y era indistinguible de un efecto vacío de verdad: un
// tipo nuevo en `events.json` le contaba al jugador que no pasaba nada mientras el
// store le quitaba 20 de oro. Ahora sale marcado, y esto lo vigila.

import { describe, it, expect } from 'vitest';
import { resumirEfecto, resumirBuffActivo, resumirBuffsActivos, nombreStat } from './efectos';
import eventosData from '../../data/events.json';

/** Todos los efectos hoja del JSON (sin los contenedores). */
function hojas(efecto, acc = []) {
  if (!efecto) return acc;
  if (efecto.tipo === 'varios') {
    for (const sub of efecto.efectos ?? []) hojas(sub, acc);
  } else if (efecto.tipo === 'azar') {
    hojas(efecto.exito, acc);
    hojas(efecto.fallo, acc);
  } else {
    acc.push(efecto);
  }
  return acc;
}

const HOJAS_DEL_JUEGO = eventosData.eventos
  .flatMap((e) => e.elecciones.flatMap((el) => hojas(el.efecto)));

describe('todo efecto del juego se sabe traducir', () => {
  it('ninguna hoja de events.json cae en el "??" del default', () => {
    const sinTraducir = HOJAS_DEL_JUEGO
      .filter((efecto) => resumirEfecto(efecto).some((chip) => chip.texto.startsWith('??')));
    expect([...new Set(sinTraducir.map((e) => e.tipo))]).toEqual([]);
  });

  it('y cada una da al menos una pastilla', () => {
    for (const efecto of HOJAS_DEL_JUEGO) {
      expect(resumirEfecto(efecto).length, `"${efecto.tipo}" no da ninguna pastilla`).toBeGreaterThan(0);
    }
  });

  it('⚠️ un tipo desconocido sale MARCADO en vez de disfrazarse de "no pasa nada"', () => {
    const [chip] = resumirEfecto({ tipo: 'efectoQueNadieHaEscritoAun' });
    expect(chip.texto).toContain('??');
    expect(chip.texto).toContain('efectoQueNadieHaEscritoAun');
    // Lo que NO puede pasar: confundirse con el efecto vacío legítimo.
    expect(chip.texto).not.toBe(resumirEfecto({ tipo: 'ninguno' })[0].texto);
  });
});

describe('el color dice si ganas o pagas', () => {
  it('ganar oro es ganancia y perderlo es coste', () => {
    expect(resumirEfecto({ tipo: 'ganarOro', cantidad: 30 })[0]).toMatchObject({ texto: '+30 g', tono: 'ganancia' });
    expect(resumirEfecto({ tipo: 'perderOro', cantidad: 20 })[0]).toMatchObject({ texto: '−20 g', tono: 'coste' });
  });

  it('un objeto con precio son DOS pastillas, una de cada color', () => {
    // Es el caso que la prosa contaba peor: "A random item for 10 gold" es un premio y
    // un precio en la misma frase, y solo se podía pintar de un color.
    const chips = resumirEfecto({ tipo: 'comprarObjetoAleatorio', coste: 10 });
    expect(chips).toHaveLength(2);
    expect(chips.map((c) => c.tono)).toEqual(['ganancia', 'coste']);
  });

  it('gratis es una sola, sin precio que enseñar', () => {
    expect(resumirEfecto({ tipo: 'comprarObjetoAleatorio', coste: 0 })).toHaveLength(1);
  });

  it('`varios` se aplana: cada consecuencia es su propia pastilla', () => {
    const chips = resumirEfecto({
      tipo: 'varios',
      efectos: [
        { tipo: 'curarEquipoPorcentaje', cantidad: 0.45 },
        { tipo: 'perderOro', cantidad: 20 },
      ],
    });
    expect(chips).toHaveLength(2);
    expect(chips.map((c) => c.tono)).toEqual(['ganancia', 'coste']);
  });
});

describe('los buffs temporales, que antes no se veían en ningún sitio', () => {
  it('un buff activo dice qué sube, cuánto y cuántos combates le quedan', () => {
    const [chip] = resumirBuffActivo({ multiplicadores: { ataque: 1.2 }, combatesRestantes: 3 });
    expect(chip.texto).toBe('ATK +20%');
    expect(chip.sufijo).toBe('3×');
    expect(chip.tono).toBe('ganancia');
  });

  it('un multiplicador que baja se lee como coste, no como mejora', () => {
    const [chip] = resumirBuffActivo({ multiplicadores: { defensa: 0.8 }, combatesRestantes: 1 });
    expect(chip.texto).toBe('DEF −20%');
    expect(chip.tono).toBe('coste');
  });

  it('un multiplicador de 1 no pinta pastilla: no es un buff, es no tener ninguno', () => {
    // `combinarMultiplicadoresTemporales` arranca de {ataque:1, defensa:1, ...}, así que
    // sin este filtro el mapa saldría siempre con cuatro pastillas que no dicen nada.
    expect(resumirBuffActivo({ multiplicadores: { ataque: 1, defensa: 1 }, combatesRestantes: 2 })).toEqual([]);
  });

  it('sin buffs no hay nada que pintar', () => {
    expect(resumirBuffsActivos([])).toEqual([]);
    expect(resumirBuffsActivos(undefined)).toEqual([]);
  });

  it('varios buffs a la vez salen todos', () => {
    const chips = resumirBuffsActivos([
      { multiplicadores: { ataque: 1.2 }, combatesRestantes: 3 },
      { multiplicadores: { velocidad: 1.1 }, combatesRestantes: 1 },
    ]);
    expect(chips.map((c) => c.texto)).toEqual(['ATK +20%', 'SPD +10%']);
  });

  it('la promesa del evento y el buff activo hablan el mismo idioma', () => {
    // ⚠️ Esto no es cosmética: el jugador acepta "ATK +20%" en el evento y tiene que
    // reconocer ESA pastilla luego en el mapa y en el combate. Si una dijera
    // "ataque +20%" y la otra "ATK +20%", serían dos cosas distintas para él.
    const prometida = resumirEfecto({
      tipo: 'buffTemporalEquipo', stat: 'ataque', multiplicador: 1.2, combates: 3,
    })[0];
    const activa = resumirBuffActivo({ multiplicadores: { ataque: 1.2 }, combatesRestantes: 3 })[0];
    expect(activa.texto).toBe(prometida.texto);
  });
});

describe('nombreStat', () => {
  it('traduce las cuatro estadísticas del juego', () => {
    expect(['ataque', 'defensa', 'velocidad', 'hp'].map(nombreStat)).toEqual(['ATK', 'DEF', 'SPD', 'HP']);
  });

  it('y una desconocida no revienta', () => {
    expect(nombreStat('suerte')).toBe('SUERTE');
  });
});
