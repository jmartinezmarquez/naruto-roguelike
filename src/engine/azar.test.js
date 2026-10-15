import { describe, it, expect } from 'vitest';
import { semillaDeTexto, generadorConSemilla } from './azar';
import { generarMapa } from './mapGenerator';
import arcoOlas from '../data/arcs/pais-de-las-olas.json';

const tiradas = (azar, n) => Array.from({ length: n }, () => azar());

describe('azar con semilla', () => {
  it('la misma semilla da la misma secuencia, y otra semilla otra', () => {
    const a = tiradas(generadorConSemilla(semillaDeTexto('2026-10-16')), 20);
    const b = tiradas(generadorConSemilla(semillaDeTexto('2026-10-16')), 20);
    const c = tiradas(generadorConSemilla(semillaDeTexto('2026-10-17')), 20);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const x of a) expect(x >= 0 && x < 1).toBe(true);
  });

  it('el mismo día genera el mismo mapa', () => {
    const forma = (mapa) => mapa.pisos.map((ids) => ids.map((id) => mapa.nodos[id].tipo).join(',')).join('|');
    const semilla = semillaDeTexto('diario-2026-10-16');
    const m1 = generarMapa(arcoOlas, { azar: generadorConSemilla(semilla) });
    const m2 = generarMapa(arcoOlas, { azar: generadorConSemilla(semilla) });
    expect(forma(m1)).toBe(forma(m2));
  });
});
