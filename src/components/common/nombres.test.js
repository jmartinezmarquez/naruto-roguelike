// `nombres.js` existe porque cada pantalla tenía su propia copia de "dame el nombre
// de este id", y todas miraban SOLO `characters.json`. En cuanto reclutabas a un jefe
// por logro —que se puede—, el panel de equipo, la mochila y el game over enseñaban el
// id crudo: "pain_camino_deva". No es un crash, es texto feo en pantalla, así que solo
// se descubre mirando.
//
// El test recorre **todos** los luchadores de los tres ficheros de datos, no una
// muestra: lo que hay que garantizar es que ningún id acabe en pantalla sin traducir,
// y eso solo se sabe preguntando por todos.

import { describe, it, expect } from 'vitest';
import { nombrePersonaje, nombreCorto, tipoDeLuchador, rarezaDeLuchador } from './nombres';
import charactersData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import commonEnemiesData from '../../data/common-enemies.json';

const TODOS = [
  ...charactersData.personajes,
  ...enemiesData.jefes,
  ...commonEnemiesData.enemigosNombrados,
  ...commonEnemiesData.plantillasGenericas,
];

describe('nombrePersonaje', () => {
  it('traduce a TODOS los luchadores de los tres ficheros', () => {
    const sinTraducir = TODOS.filter((l) => nombrePersonaje(l.id) === l.id);
    expect(sinTraducir.map((l) => l.id)).toEqual([]);
  });

  it('busca también entre los jefes, que se pueden reclutar por logro', () => {
    // Es el caso que provocó el bug: un jefe en el equipo no está en characters.json.
    const jefe = enemiesData.jefes[0];
    expect(nombrePersonaje(jefe.id)).not.toBe(jefe.id);
  });

  it('quita el paréntesis, que es la parte que se corta al truncar', () => {
    const conParentesis = TODOS.find((l) => l.nombre.includes('('));
    expect(conParentesis, 'ya no hay ningún nombre con paréntesis en los datos').toBeTruthy();
    expect(nombrePersonaje(conParentesis.id)).not.toContain('(');
  });

  it('un id desconocido se devuelve tal cual en vez de romper', () => {
    expect(nombrePersonaje('no_existe')).toBe('no_existe');
  });
});

describe('nombreCorto', () => {
  it('abrevia el apellido: "Naruto Uzumaki" → "Naruto U."', () => {
    expect(nombreCorto('naruto')).toBe('Naruto U.');
  });

  it('deja en paz a los de una sola palabra', () => {
    expect(nombreCorto('gaara')).toBe('Gaara');
  });

  it('nunca deja un paréntesis abierto ni una inicial suelta al final', () => {
    // "Pain (Deva Path)" por iniciales daría "Pain (." — la regla solo se aplica
    // donde tiene sentido, y esto lo comprueba para todo el reparto de una vez.
    for (const luchador of TODOS) {
      const corto = nombreCorto(luchador.id);
      expect(corto, `${luchador.id} → "${corto}"`).not.toMatch(/[(]|\s\.$/);
      expect(corto.length).toBeGreaterThan(0);
    }
  });
});

describe('tipo y rareza', () => {
  it('todo luchador tiene naturaleza de chakra', () => {
    // El combate multiplica o divide el daño por el tipo: uno sin tipo no es un
    // detalle cosmético, es un luchador fuera de la tabla de eficacias.
    const sinTipo = TODOS.filter((l) => tipoDeLuchador(l.id) === null);
    expect(sinTipo.map((l) => l.id)).toEqual([]);
  });

  it('todo personaje jugable tiene rareza, que es lo que decide por qué pergamino sale', () => {
    const sinRareza = charactersData.personajes.filter((p) => rarezaDeLuchador(p.id) === null);
    expect(sinRareza.map((p) => p.id)).toEqual([]);
  });
});
