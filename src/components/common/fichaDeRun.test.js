import { describe, it, expect } from 'vitest';
import { fichaDeLaRun, emojiDeNodo, URL_DEL_JUEGO } from './fichaDeRun';

const arcos = [
  { id: 'pais_de_las_olas', nombre: 'Land of Waves', emoji: '🌊' },
  { id: 'examen_chunin', nombre: 'Chunin Exams', emoji: '🍃' },
  { id: 'invasion_de_pain', nombre: "Pain's Invasion", emoji: '🌀' },
];

const nodo = (arcoId, tipo, extra = {}) => ({ arcoId, piso: 1, tipo, subtipo: null, rareza: null, ...extra });

describe('el emoji de cada nodo', () => {
  it('distingue el combate normal del entrenador', () => {
    expect(emojiDeNodo({ tipo: 'combate' })).not.toBe(emojiDeNodo({ tipo: 'combate', subtipo: 'entrenador' }));
  });

  it('y el pergamino común del dorado, que es un combate y no una elección', () => {
    expect(emojiDeNodo({ tipo: 'reclutar' })).not.toBe(emojiDeNodo({ tipo: 'reclutar', rareza: 'legendario' }));
  });

  it('un tipo que no conoce no inventa nada', () => {
    expect(emojiDeNodo({ tipo: 'inicio' })).toBeNull();
    expect(emojiDeNodo({ tipo: 'lo_que_sea' })).toBeNull();
  });
});

describe('la ficha de una run perdida', () => {
  const ficha = fichaDeLaRun({
    rastro: [
      nodo('pais_de_las_olas', 'combate'),
      nodo('pais_de_las_olas', 'evento'),
      nodo('pais_de_las_olas', 'miniJefe'),
      nodo('pais_de_las_olas', 'descanso'),
      nodo('pais_de_las_olas', 'jefe'),
      nodo('examen_chunin', 'combate', { subtipo: 'entrenador' }),
      nodo('examen_chunin', 'reclutar', { rareza: 'legendario' }),
    ],
    resumen: { rango: 'C', runGanada: false, huboBajas: true, nivelMaximoDelEquipo: 21 },
    rangoNinja: 'Chunin',
    arcos,
    final: { arcoNombre: 'Chunin Exams', piso: 3 },
  });

  it('sale entera y pegable', () => {
    expect(ficha).toMatchInlineSnapshot(`
      "Narutolike — Mission rank C
      Ninja rank: Chunin

      🌊 Land of Waves  ⚔️🎴👺💤👹
      🍃 Chunin Exams  🥷🌟

      Fell in Chunin Exams, floor 3 at Lv.21.
      https://jmartinezmarquez.github.io/naruto-roguelike/"
    `);
  });

  it('⚠️ no dice qué había en ningún nodo: una ficha que revela el mapa no la comparte nadie', () => {
    // El rastro es de TIPOS. Ni un nombre de enemigo, ni de objeto, ni de evento.
    expect(ficha).not.toMatch(/zabuza|haku|kabuto|gaara|pain/i);
  });

  it('lleva el enlace del juego, que es para lo que sirve', () => {
    expect(ficha).toContain(URL_DEL_JUEGO);
  });

  it('un arco al que no llegaste no pinta línea', () => {
    expect(ficha).not.toContain("Pain's Invasion");
  });
});

describe('la ficha de una run ganada', () => {
  const ganada = (huboBajas) => fichaDeLaRun({
    rastro: [nodo('pais_de_las_olas', 'combate')],
    resumen: { rango: huboBajas ? 'A' : 'S', runGanada: true, huboBajas, nivelMaximoDelEquipo: 44 },
    rangoNinja: 'Jonin',
    arcos,
  });

  it('lo dice, y no habla de haber caído', () => {
    expect(ganada(true)).toContain('Won the run at Lv.44.');
    expect(ganada(true)).not.toContain('Fell');
  });

  it('⚠️ y la run impecable se presume, que es el premio de la S', () => {
    // Sin esto la S y la A cuentan la misma historia, y entonces la S no es una
    // meta: es un adorno que solo ve quien mire la letra.
    expect(ganada(false)).toContain('without losing a single ninja');
  });
});

describe('los bordes', () => {
  it('una run sin un solo nodo no revienta', () => {
    const ficha = fichaDeLaRun({
      rastro: [],
      resumen: { rango: 'D', runGanada: false, huboBajas: false, nivelMaximoDelEquipo: 1 },
      rangoNinja: 'Genin',
      arcos,
    });
    expect(ficha).toContain('Mission rank D');
    expect(ficha).toContain(URL_DEL_JUEGO);
  });

  it('sin saber dónde cayó, no se inventa el sitio', () => {
    const ficha = fichaDeLaRun({
      rastro: [nodo('pais_de_las_olas', 'combate')],
      resumen: { rango: 'D', runGanada: false, huboBajas: true, nivelMaximoDelEquipo: 4 },
      rangoNinja: 'Genin',
      arcos,
    });
    expect(ficha).toContain('Fell at Lv.4.');
  });
});
