// Toda transformación tiene que tener su propio dibujo. `spriteDeModo` cae al primer
// modo del personaje si falta, y eso hizo que durante meses nueve "segundos modos"
// se vieran igual que el primero sin que nada fallara. Desde el estilo nuevo
// (2026-10-14) están todos: este test es lo que impide que el siguiente modo que se
// añada vuelva a colarse sin dibujo.

import { describe, it, expect } from 'vitest';
import { SPRITE_MODO } from './transformationSprites';
import charactersData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';

describe('sprites de transformación (invariante de datos)', () => {
  it('cada modo de cada personaje y jefe tiene el suyo', () => {
    // Los que esperan su dibujo (`pendienteDeArte`) no cuentan todavía: ver characterSprites.test.js.
    const luchadores = [...charactersData.personajes, ...enemiesData.jefes].filter((p) => !p.pendienteDeArte);
    const faltan = luchadores.flatMap((p) => (p.modos ?? [])
      .map((_, i) => `${p.id}_${i}`)
      .filter((clave) => !SPRITE_MODO[clave]));
    expect(faltan).toEqual([]);
  });
});
