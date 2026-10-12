import { describe, it, expect } from 'vitest';
import { sonidoDeLanzamiento, sonidosDeImpacto } from './sonidosDeCombate';
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
