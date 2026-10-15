// `pendienteDeArte` (characters.json) es lo que deja meter un personaje en los datos
// antes de que llegue su dibujo: mientras la lleva, el gacha no lo da y el Bingo Book
// no lo enseña. Este test la ata al fichero: **puesta si y solo si falta el sprite**.
// Así, el día que llega el PNG el test falla y recuerda quitarla — si no, el personaje
// tendría dibujo y seguiría escondido, que es un fallo de los que no avisan.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import charactersData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import commonEnemiesData from '../../data/common-enemies.json';
import campaignsData from '../../data/campaigns.json';
import { ARCOS } from '../../data/arcs';
import arcoOlas from '../../data/arcs/pais-de-las-olas.json';
import arcoChunin from '../../data/arcs/examen-chunin.json';
import arcoPain from '../../data/arcs/invasion-de-pain.json';

const CARPETA = fileURLToPath(new URL('../../assets/characters', import.meta.url));

describe('pendienteDeArte', () => {
  it('está puesta si y solo si falta el sprite del personaje', () => {
    const luchadores = [...charactersData.personajes, ...enemiesData.jefes, ...commonEnemiesData.enemigosNombrados];
    for (const p of luchadores) {
      const tieneSprite = fs.existsSync(path.join(CARPETA, `${p.id}.png`));
      expect(Boolean(p.pendienteDeArte), `${p.id}: sprite ${tieneSprite ? 'sí' : 'no'}`).toBe(!tieneSprite);
    }
  });

  it('nadie que espera su dibujo está en el pool de reclutables de un arco', () => {
    const pendientes = new Set(charactersData.personajes.filter((p) => p.pendienteDeArte).map((p) => p.id));
    for (const arco of [arcoOlas, arcoChunin, arcoPain]) {
      expect((arco.personajesReclutablesIds ?? []).filter((id) => pendientes.has(id)), arco.id).toEqual([]);
    }
  });
});

describe('arcos a la espera de arte', () => {
  it('no están en ninguna campaña, y los que sí tienen fondo de columna y medalla', () => {
    const enCampana = new Set(campaignsData.campanas.flatMap((c) => c.actos.flatMap((a) => a.arcoIds)));
    const assets = path.resolve(CARPETA, '..');
    for (const arco of ARCOS) {
      if (arco.pendienteDeArte) {
        expect(enCampana.has(arco.id), arco.id).toBe(false);
      } else {
        expect(fs.existsSync(path.join(assets, 'map-columns', `${arco.id}.png`)), `${arco.id}: columna`).toBe(true);
        expect(fs.existsSync(path.join(assets, 'medals', `${arco.id}.png`)), `${arco.id}: medalla`).toBe(true);
      }
    }
  });
});
