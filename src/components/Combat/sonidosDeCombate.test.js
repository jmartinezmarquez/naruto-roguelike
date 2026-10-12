import { describe, it, expect } from 'vitest';
import { sonidoDeLanzamiento, sonidosDeImpacto, sonidoDeCierre } from './sonidosDeCombate';
import { efectoDelGolpe, EFECTOS } from './spritesDeEfecto';
import { NOMBRES_DE_SONIDO } from '../common/efectosDeSonido';

const basico = { tipoAtaque: 'basico', dano: 10, eficacia: 1, hpDefensor: 50 };
const jutsu = { tipoAtaque: 'jutsu', dano: 30, eficacia: 1, hpDefensor: 50 };

describe('sonidoDeLanzamiento', () => {
  it('el básico suena a kunai para todos; el jutsu, a la naturaleza de quien lo lanza', () => {
    expect(sonidoDeLanzamiento(basico, 'naruto').nombre).toBe('lanzarKunai');
    // Sasuke es katon: su jutsu tiene que sonar a fuego, no a viento.
    expect(sonidoDeLanzamiento(jutsu, 'sasuke')).toEqual({ nombre: 'jutsu', opciones: { tipo: 'katon' } });
  });
});

describe('sonidosDeImpacto', () => {
  it('un golpe bloqueado suena a metal y a nada más', () => {
    expect(sonidosDeImpacto({ ...jutsu, dano: 0, hpDefensor: 0 })).toEqual(['bloqueado']);
  });

  it('la eficacia cambia el golpe, y el que tumba añade la caída', () => {
    expect(sonidosDeImpacto(basico)).toEqual(['golpe']);
    expect(sonidosDeImpacto({ ...basico, eficacia: 2 })).toEqual(['golpeEficaz']);
    expect(sonidosDeImpacto({ ...basico, eficacia: 0.5 })).toEqual(['golpeFlojo']);
    expect(sonidosDeImpacto({ ...jutsu, eficacia: 2, hpDefensor: 0 })).toEqual(['impactoJutsu', 'golpeEficaz', 'ko']);
  });

  it('todo lo que pide existe en el catálogo: un nombre mal escrito sonaría a silencio, sin error', () => {
    const golpes = [basico, jutsu, { ...basico, dano: 0 }, { ...basico, eficacia: 2, hpDefensor: 0 }, { ...basico, eficacia: 0.5 }];
    golpes.flatMap(sonidosDeImpacto).forEach((n) => expect(NOMBRES_DE_SONIDO).toContain(n));
    expect(NOMBRES_DE_SONIDO).toContain(sonidoDeLanzamiento(basico, 'naruto').nombre);
  });
});

describe('sonidoDeCierre', () => {
  it('la fanfarria entera solo cuando el combate importa', () => {
    expect(sonidoDeCierre(true, true)).toBe('victoria');
    expect(sonidoDeCierre(true, false)).toBe('victoriaCorta');
    expect(sonidoDeCierre(false, true)).toBe('derrota');
    ['victoria', 'victoriaCorta', 'derrota'].forEach((n) => expect(NOMBRES_DE_SONIDO).toContain(n));
  });
});

describe('efectoDelGolpe', () => {
  it('cuenta lo mismo que el sonido: metal si bloquea, explosión de su naturaleza si es jutsu', () => {
    expect(efectoDelGolpe({ ...jutsu, dano: 0 }, 'katon')).toBe('estrellaMetal');
    expect(efectoDelGolpe(jutsu, 'katon')).toBe('explosionKaton');
    expect(efectoDelGolpe(jutsu, 'suiton')).toBe('explosionSuiton');
    expect(efectoDelGolpe({ ...basico, eficacia: 2 }, 'katon')).toBe('estrella');
    expect(efectoDelGolpe(basico, 'katon')).toBe('corte');
  });

  it('todo efecto que puede elegir existe en el catálogo, con su tira', () => {
    const golpes = [basico, jutsu, { ...basico, dano: 0 }, { ...basico, eficacia: 2 }];
    ['katon', 'fuuton', 'raiton', 'doton', 'suiton'].forEach((tipo) => {
      golpes.forEach((g) => expect(EFECTOS[efectoDelGolpe(g, tipo)]?.src).toBeTruthy());
    });
  });
});
