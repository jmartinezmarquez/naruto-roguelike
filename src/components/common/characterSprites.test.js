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
import arcoOlas from '../../data/arcs/pais-de-las-olas.json';
import arcoChunin from '../../data/arcs/examen-chunin.json';
import arcoPain from '../../data/arcs/invasion-de-pain.json';

const CARPETA = fileURLToPath(new URL('../../assets/characters', import.meta.url));

describe('pendienteDeArte', () => {
  it('está puesta si y solo si falta el sprite del personaje', () => {
    for (const p of charactersData.personajes) {
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
