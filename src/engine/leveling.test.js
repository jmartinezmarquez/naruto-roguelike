import { describe, it, expect } from 'vitest';
import {
  xpParaSiguienteNivel,
  calcularStatsPorNivel,
  ganarXp,
  obtenerModoActivo,
  aplicarMultiplicadores,
  nivelesEstimadosDeLaRun,
} from './leveling';
import { calcularNivelPorPiso } from './mapGenerator';
import charactersData from '../data/characters.json';
import enemiesData from '../data/enemies.json';
import arco1 from '../data/arcs/pais-de-las-olas.json';
import arco2 from '../data/arcs/examen-chunin.json';
import arco3 from '../data/arcs/invasion-de-pain.json';

describe('xpParaSiguienteNivel', () => {
  it('calcula la XP requerida según la curva del personaje', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    expect(xpParaSiguienteNivel(curva, 1)).toBe(20);
    expect(xpParaSiguienteNivel(curva, 2)).toBe(22); // 20 * 1.1
  });
});

describe('calcularStatsPorNivel', () => {
  it('a nivel 1 las stats son iguales a las base', () => {
    const statsBase = { hp: 40, ataque: 10, defensa: 8, velocidad: 6 };
    expect(calcularStatsPorNivel(statsBase, 1)).toEqual(statsBase);
  });

  it('las stats suben con el nivel', () => {
    const statsBase = { hp: 40, ataque: 10, defensa: 8, velocidad: 6 };
    const statsNivelAlto = calcularStatsPorNivel(statsBase, 20);
    expect(statsNivelAlto.hp).toBeGreaterThan(statsBase.hp);
    expect(statsNivelAlto.ataque).toBeGreaterThan(statsBase.ataque);
  });
});

describe('ganarXp', () => {
  it('sube de nivel cuando la XP acumulada supera el umbral', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    const personaje = { nivel: 1, xpActual: 0 };
    const resultado = ganarXp(personaje, 25, curva);
    expect(resultado.nivel).toBe(2);
    expect(resultado.subioNivel).toBe(true);
    expect(resultado.xpActual).toBe(5); // 25 - 20
  });

  it('puede subir varios niveles de golpe con suficiente XP', () => {
    const curva = { xpParaSiguienteNivel: 10, crecimiento: 1.0 };
    const personaje = { nivel: 1, xpActual: 0 };
    const resultado = ganarXp(personaje, 35, curva);
    expect(resultado.nivel).toBe(4); // 10+10+10=30, sobran 5
  });

  it('no muta el objeto de entrada', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    const personaje = { nivel: 1, xpActual: 0 };
    ganarXp(personaje, 25, curva);
    expect(personaje.nivel).toBe(1);
  });

  it('no sube de nivel si la XP no llega al umbral', () => {
    const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.1 };
    const personaje = { nivel: 1, xpActual: 0 };
    const resultado = ganarXp(personaje, 5, curva);
    expect(resultado.nivel).toBe(1);
    expect(resultado.subioNivel).toBe(false);
  });
});

describe('obtenerModoActivo', () => {
  const personajeConDosModos = {
    modos: [
      { nombre: 'Modo 1', nivelDesbloqueo: 10, multiplicadores: { ataque: 1.2, defensa: 1.1, velocidad: 1.1, hp: 1.1 } },
      { nombre: 'Modo 2', nivelDesbloqueo: 50, multiplicadores: { ataque: 1.5, defensa: 1.3, velocidad: 1.3, hp: 1.3 } },
    ],
  };

  it('devuelve null si no hay ningún modo desbloqueado todavía', () => {
    expect(obtenerModoActivo(personajeConDosModos, 5)).toBeNull();
  });

  it('devuelve el modo de menor nivel si es el único desbloqueado', () => {
    expect(obtenerModoActivo(personajeConDosModos, 20).nombre).toBe('Modo 1');
  });

  it('devuelve el modo de MAYOR nivel desbloqueado, no el primero de la lista', () => {
    expect(obtenerModoActivo(personajeConDosModos, 60).nombre).toBe('Modo 2');
  });

  it('devuelve null si el personaje no tiene modos', () => {
    expect(obtenerModoActivo({ modos: [] }, 100)).toBeNull();
  });
});

describe('aplicarMultiplicadores', () => {
  it('multiplica solo los stats indicados, deja el resto igual', () => {
    const stats = { hp: 100, ataque: 10, defensa: 10, velocidad: 10 };
    const resultado = aplicarMultiplicadores(stats, { ataque: 1.5 });
    expect(resultado.ataque).toBe(15);
    expect(resultado.hp).toBe(100);
  });

  it('devuelve las stats sin cambios si no hay multiplicadores', () => {
    const stats = { hp: 100, ataque: 10, defensa: 10, velocidad: 10 };
    expect(aplicarMultiplicadores(stats, null)).toEqual(stats);
  });
});

describe('nivelesEstimadosDeLaRun', () => {
  const arcoDePrueba = {
    id: 'prueba',
    numeroPisos: 8,
    pisoMiniJefe: 4,
    pisoJefeFinal: 8,
    miniJefeId: 'mini',
    jefeFinalId: 'final',
    xpCombateComun: 100,
    poolTiposNodo: [{ tipo: 'combate', peso: 50 }, { tipo: 'tienda', peso: 50 }],
  };
  const curva = { xpParaSiguienteNivel: 20, crecimiento: 1.0 };
  const xpDeJefe = (id) => (id === 'mini' ? 200 : 400);

  it('empieza la run a nivel 1 y sube piso a piso', () => {
    const niveles = nivelesEstimadosDeLaRun(curva, [arcoDePrueba], xpDeJefe).prueba;
    expect(niveles.get(1)).toBe(1);
    expect(niveles.get(8)).toBeGreaterThan(niveles.get(2));
  });

  it('un piso normal solo aporta la XP que cabe esperar de él, no la de un combate entero', () => {
    // 50% de probabilidad de combate × 100 de XP = 50 esperados, que con una
    // curva plana de 20 son 2 niveles y medio por piso, no 5.
    const niveles = nivelesEstimadosDeLaRun(curva, [arcoDePrueba], xpDeJefe).prueba;
    expect(niveles.get(3)).toBe(3); // nivel 1 + 50 XP = nivel 3, sobran 10
  });

  it('el nivel se arrastra de un arco al siguiente', () => {
    const dosArcos = nivelesEstimadosDeLaRun(
      curva,
      [arcoDePrueba, { ...arcoDePrueba, id: 'segundo' }],
      xpDeJefe,
    );
    expect(dosArcos.segundo.get(2)).toBeGreaterThan(dosArcos.prueba.get(8));
  });
});

// El bug que estos tests existen para que no vuelva: los arcos declaraban a
// Zabuza a nivel 4 y a Pain a nivel 49, y con la XP real el jugador llegaba a
// ellos a nivel 9 y a nivel 70. Nadie se enteró porque el simulador SUPONÍA el
// nivel del jugador en vez de calcularlo, así que los combates comunes salían al
// 99% de victorias con el 97% del HP intacto y los mini-jefes eran más duros que
// el jefe de su propio arco. Los niveles fijos de un arco solo significan algo si
// alguien comprueba que el jugador llega ahí.
describe('arcos (invariantes de datos)', () => {
  const ARCOS = [arco1, arco2, arco3];
  const xpDeJefe = (id, arco) => enemiesData.jefes.find((j) => j.id === id)?.recompensa?.xp
    ?? arco.xpCombateComun;

  /** Nivel medio del roster al llegar a un piso, que es lo que se calibra. */
  function nivelMedioEn(arco, piso) {
    const niveles = charactersData.personajes.map(
      (p) => nivelesEstimadosDeLaRun(p.curvaXp, ARCOS, xpDeJefe)[arco.id].get(piso),
    );
    return niveles.reduce((a, b) => a + b, 0) / niveles.length;
  }

  it('todos los arcos declaran la XP de sus combates comunes', () => {
    // Sin esto el store cae en su red de seguridad (20 XP) y la economía entera
    // se descalibra en silencio: las plantillas genéricas no traen `recompensa`.
    for (const arco of ARCOS) {
      expect(arco.xpCombateComun, arco.id).toBeGreaterThan(0);
    }
  });

  it('el jugador llega a cada jefe cerca del nivel que el arco le ha puesto', () => {
    const DESVIO_MAXIMO = 2; // niveles
    for (const arco of ARCOS) {
      expect(Math.abs(nivelMedioEn(arco, arco.pisoMiniJefe) - arco.nivelMiniJefe), `${arco.id} — mini-jefe`)
        .toBeLessThanOrEqual(DESVIO_MAXIMO);
      expect(Math.abs(nivelMedioEn(arco, arco.pisoJefeFinal) - arco.nivelJefeFinal), `${arco.id} — jefe final`)
        .toBeLessThanOrEqual(DESVIO_MAXIMO);
    }
  });

  it('el jugador nunca va tan sobrado que los combates comunes dejen de serlo', () => {
    // Cinco niveles por encima del enemigo del piso ya es un paseo; a diez, el
    // combate no existe. Esto es lo que medía mal el simulador antiguo.
    for (const arco of ARCOS) {
      for (let piso = 2; piso <= arco.numeroPisos; piso += 1) {
        if (piso === arco.pisoMiniJefe || piso === arco.pisoJefeFinal) continue;
        const ventaja = nivelMedioEn(arco, piso) - calcularNivelPorPiso(piso, arco);
        expect(ventaja, `${arco.id} — piso ${piso}`).toBeLessThanOrEqual(5);
      }
    }
  });

  it('cada personaje desbloquea su primera transformación dentro del primer arco', () => {
    // Con los modos a nivel 12-28 y el arco 1 acabando sobre el 10, el primer
    // arco entero se jugaba sin transformaciones: el 92% del poder venía de
    // subir de nivel y nada más.
    const finDelPrimerArco = arco1.nivelJefeFinal;
    for (const personaje of charactersData.personajes) {
      // Sai y Yamato tienen un único modo, que es de los tardíos a propósito.
      if (personaje.modos.length < 2) continue;
      expect(personaje.modos[0].nivelDesbloqueo, personaje.id).toBeLessThanOrEqual(finDelPrimerArco);
    }
  });
});
