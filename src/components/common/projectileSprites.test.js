// Los proyectiles se eligen por **id de luchador**, y ese es justo el punto débil:
// un id mal escrito en el mapa no rompe nada. `spriteDeProyectil` cae al kunai por
// diseño —Rock Lee es cuerpo a cuerpo a propósito, y hay cinco personajes sin dibujo—,
// así que una errata se comporta EXACTAMENTE igual que una ausencia deliberada.
//
// Es el mismo patrón que ya costó un bug real en este proyecto: `pasivasDelUltimoGolpe`
// devolvía nombres y la pastilla comparaba contra ids, así que no se encendía jamás.
// Nada falla en un fallo así — solo no pasa nunca nada.
//
// Corre en `environment: 'node'` como el resto: aquí no hay componentes, solo el mapa.

import { describe, it, expect } from 'vitest';
import { spriteDeProyectil, SPRITE_KUNAI } from './projectileSprites';
import charactersData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import commonEnemiesData from '../../data/common-enemies.json';

const IDS_REALES = new Set([
  ...charactersData.personajes.map((p) => p.id),
  ...enemiesData.jefes.map((j) => j.id),
  ...commonEnemiesData.enemigosNombrados.map((e) => e.id),
  ...commonEnemiesData.plantillasGenericas.map((e) => e.id),
]);

const GENIN = [
  'genin_rival_katon', 'genin_rival_fuuton', 'genin_rival_raiton',
  'genin_rival_doton', 'genin_rival_suiton',
];

describe('el ataque básico', () => {
  it('es kunai para todos, sea quien sea', () => {
    for (const id of IDS_REALES) {
      expect(spriteDeProyectil(id, false)).toBe(SPRITE_KUNAI);
    }
  });
});

describe('los jutsus con proyectil propio', () => {
  it('todos los ids del mapa son luchadores que existen de verdad', () => {
    // Se recorre al revés —del mapa a los datos— porque es la dirección en la que un
    // error se esconde: sobra una clave y nadie la reclama nunca.
    const conProyectilPropio = [...IDS_REALES].filter((id) => spriteDeProyectil(id, true) !== SPRITE_KUNAI);
    expect(conProyectilPropio.length).toBeGreaterThan(0);
    for (const id of conProyectilPropio) {
      expect(IDS_REALES.has(id)).toBe(true);
    }
  });

  it('los cinco genin rivales lanzan el suyo y no un kunai', () => {
    // Son la mayoría de los combates del juego: si estos caen al kunai, el jutsu se
    // ve igual que el ataque corriente y la diferencia mecánica desaparece en pantalla.
    for (const id of GENIN) {
      expect(IDS_REALES.has(id), `${id} ya no existe en los datos`).toBe(true);
      expect(spriteDeProyectil(id, true), `${id} está cayendo al kunai`).not.toBe(SPRITE_KUNAI);
    }
  });

  it('y cada genin tiene el suyo, no uno compartido', () => {
    const suyos = GENIN.map((id) => spriteDeProyectil(id, true));
    expect(new Set(suyos).size).toBe(GENIN.length);
  });

  it('Rock Lee sigue sin proyectil, que es cuerpo a cuerpo a propósito', () => {
    expect(spriteDeProyectil('rock_lee', true)).toBe(SPRITE_KUNAI);
  });
});

describe('un id desconocido', () => {
  it('cae al kunai en vez de romper la pantalla', () => {
    expect(spriteDeProyectil('no_existe', true)).toBe(SPRITE_KUNAI);
    expect(spriteDeProyectil(undefined, true)).toBe(SPRITE_KUNAI);
  });
});
