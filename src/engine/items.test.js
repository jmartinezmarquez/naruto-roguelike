import { describe, it, expect } from 'vitest';
import { calcularBonificacionDeEfecto, calcularBonificacionDeObjetoEquipado } from './items';

const objetosDePrueba = [
  {
    id: 'sello_chakra',
    tipo: 'equipable',
    efecto: { tipo: 'buffEquipable', stat: 'ataque', cantidad: 2 },
  },
  {
    id: 'pergamino_reserva',
    tipo: 'equipable',
    efecto: { tipo: 'buffEquipable', stat: 'hp', cantidad: 8 },
  },
  {
    id: 'anillo_rinnegan_fragmento',
    tipo: 'equipable',
    efecto: { tipo: 'buffEquipable', stat: 'todas', cantidad: 3 },
  },
  {
    id: 'fragmento_sello_maldito',
    tipo: 'equipable',
    efecto: {
      tipo: 'buffYDebuffEquipable',
      buff: { stat: 'ataque', cantidad: 4 },
      debuff: { stat: 'defensa', cantidad: -2 },
    },
  },
  {
    id: 'banda_repuesto',
    tipo: 'equipable',
    efecto: { tipo: 'revivirUnaVez', hpAlRevivir: 1 },
  },
  {
    id: 'pildora_soldado',
    tipo: 'consumible',
    efecto: { tipo: 'curarPersonaje', cantidad: '40porciento' },
  },
];

describe('calcularBonificacionDeEfecto', () => {
  it('sin efecto (null/undefined), no da ninguna bonificación', () => {
    expect(calcularBonificacionDeEfecto(null)).toEqual({ ataque: 0, defensa: 0, velocidad: 0, hp: 0 });
  });

  it('buffEquipable de una sola stat suma solo esa stat', () => {
    const total = calcularBonificacionDeEfecto({ tipo: 'buffEquipable', stat: 'ataque', cantidad: 2 });
    expect(total).toEqual({ ataque: 2, defensa: 0, velocidad: 0, hp: 0 });
  });

  it('buffEquipable de "todas" suma la misma cantidad a las 4 stats', () => {
    const total = calcularBonificacionDeEfecto({ tipo: 'buffEquipable', stat: 'todas', cantidad: 3 });
    expect(total).toEqual({ ataque: 3, defensa: 3, velocidad: 3, hp: 3 });
  });

  it('buffYDebuffEquipable aplica buff y debuff a la vez', () => {
    const total = calcularBonificacionDeEfecto({
      tipo: 'buffYDebuffEquipable',
      buff: { stat: 'ataque', cantidad: 4 },
      debuff: { stat: 'defensa', cantidad: -2 },
    });
    expect(total).toEqual({ ataque: 4, defensa: -2, velocidad: 0, hp: 0 });
  });

  it('efectos que no son de stats (curarPersonaje, revivirUnaVez, curacionPostCombate) no dan bonificación', () => {
    expect(calcularBonificacionDeEfecto({ tipo: 'curarPersonaje', cantidad: '40porciento' }))
      .toEqual({ ataque: 0, defensa: 0, velocidad: 0, hp: 0 });
    expect(calcularBonificacionDeEfecto({ tipo: 'revivirUnaVez', hpAlRevivir: 1 }))
      .toEqual({ ataque: 0, defensa: 0, velocidad: 0, hp: 0 });
    expect(calcularBonificacionDeEfecto({ tipo: 'curacionPostCombate', cantidad: '15porciento' }))
      .toEqual({ ataque: 0, defensa: 0, velocidad: 0, hp: 0 });
  });
});

describe('calcularBonificacionDeObjetoEquipado', () => {
  it('sin nada equipado (null), no da ninguna bonificación', () => {
    const total = calcularBonificacionDeObjetoEquipado(null, objetosDePrueba);
    expect(total).toEqual({ ataque: 0, defensa: 0, velocidad: 0, hp: 0 });
  });

  it('con un objeto de stats equipado, da su bonificación', () => {
    const total = calcularBonificacionDeObjetoEquipado('sello_chakra', objetosDePrueba);
    expect(total).toEqual({ ataque: 2, defensa: 0, velocidad: 0, hp: 0 });
  });

  it('con revivirUnaVez equipado (no es bonificación de stats), no da nada', () => {
    const total = calcularBonificacionDeObjetoEquipado('banda_repuesto', objetosDePrueba);
    expect(total).toEqual({ ataque: 0, defensa: 0, velocidad: 0, hp: 0 });
  });

  it('id desconocido no rompe, devuelve bonificación vacía', () => {
    const total = calcularBonificacionDeObjetoEquipado('objeto_inexistente', objetosDePrueba);
    expect(total).toEqual({ ataque: 0, defensa: 0, velocidad: 0, hp: 0 });
  });
});
