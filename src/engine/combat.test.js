import { describe, it, expect } from 'vitest';
import {
  obtenerEficacia,
  crearLuchador,
  calcularDano,
  ejecutarAtaque,
  turnosParaCargarJutsu,
  resolverTurno,
  resolverCombateCompleto,
} from './combat';
import configGlobal from '../data/config.json';
import charactersData from '../data/characters.json';
import enemiesData from '../data/enemies.json';
import commonEnemiesData from '../data/common-enemies.json';

// Sin ataqueBasico ni jutsu.carga a propósito: así este fixture comprueba de
// paso que los valores por defecto de config.json funcionan.
const personajeDePrueba = {
  id: 'test_katon',
  nombre: 'Luchador de Prueba (Katon)',
  tipo: 'katon',
  statsBase: { hp: 40, ataque: 10, defensa: 8, velocidad: 8 },
  jutsu: {
    nombre: 'Golpe de Prueba',
    danoBase: 1.2,
    efectoEstado: { stat: 'defensa', objetivo: 'enemigo', cantidad: -2, duracionTurnos: 2 },
  },
  modos: [],
};

const rivalDePrueba = {
  ...personajeDePrueba,
  id: 'test_suiton',
  nombre: 'Rival de Prueba (Suiton)',
  tipo: 'suiton',
};

describe('obtenerEficacia', () => {
  it('katon es fuerte contra fuuton (x1.5)', () => {
    expect(obtenerEficacia('katon', 'fuuton')).toBe(1.5);
  });

  it('katon es débil contra suiton (x0.5)', () => {
    expect(obtenerEficacia('katon', 'suiton')).toBe(0.5);
  });

  it('un tipo contra sí mismo es neutral (x1.0)', () => {
    expect(obtenerEficacia('katon', 'katon')).toBe(1.0);
  });
});

describe('crearLuchador', () => {
  it('empieza a HP completo por defecto', () => {
    const luchador = crearLuchador(personajeDePrueba, 5);
    expect(luchador.hpActual).toBe(luchador.hpMaximo);
  });

  it('respeta el HP persistido si se pasa hpActualInicial', () => {
    const luchador = crearLuchador(personajeDePrueba, 5, 10);
    expect(luchador.hpActual).toBe(10);
  });

  it('recorta el HP persistido si por alguna razón supera el máximo calculado', () => {
    const luchador = crearLuchador(personajeDePrueba, 1, 99999);
    expect(luchador.hpActual).toBe(luchador.hpMaximo);
  });
});

describe('barra de jutsu', () => {
  const { cargaMaxima, cargaPorDefecto, ataqueBasicoPorDefecto } = configGlobal.combate.jutsu;

  // Cargador rápido: llena la barra con un solo ataque básico.
  const cargadorRapido = {
    ...personajeDePrueba,
    id: 'test_rapido',
    ataqueBasico: { nombre: 'Puñetazo', danoBase: 0.5 },
    jutsu: { ...personajeDePrueba.jutsu, carga: { alAtacar: cargaMaxima, alRecibirDano: 0, inicial: 0 } },
  };

  // Este es el camino NORMAL desde que el ataque básico se unificó: ningún
  // personaje ni enemigo define el suyo, todos usan el de config.
  it('un luchador sin ataqueBasico ni carga propios usa los valores por defecto de config', () => {
    const luchador = crearLuchador(personajeDePrueba, 5);
    expect(luchador.ataqueBasico).toEqual(ataqueBasicoPorDefecto);
    expect(luchador.cargaPorAtacar).toBe(cargaPorDefecto.alAtacar);
    expect(luchador.cargaPorRecibirDano).toBe(cargaPorDefecto.alRecibirDano);
    expect(luchador.cargaJutsu).toBe(cargaPorDefecto.inicial);
  });

  it('el atacante carga al pegar y el defensor al recibir el golpe', () => {
    const atacante = crearLuchador(personajeDePrueba, 5);
    const defensor = crearLuchador(rivalDePrueba, 5);
    ejecutarAtaque(atacante, defensor);
    expect(atacante.cargaJutsu).toBe(atacante.cargaPorAtacar);
    expect(defensor.cargaJutsu).toBe(defensor.cargaPorRecibirDano);
  });

  it('la barra nunca pasa de cargaMaxima', () => {
    const atacante = crearLuchador(cargadorRapido, 5);
    const defensor = crearLuchador(rivalDePrueba, 5);
    ejecutarAtaque(atacante, defensor); // llena la barra
    expect(atacante.cargaJutsu).toBe(cargaMaxima);
  });

  it('con la barra llena el siguiente ataque es el jutsu, y lo deja a cero', () => {
    const atacante = crearLuchador(cargadorRapido, 5);
    const defensor = crearLuchador(rivalDePrueba, 5);

    const primero = ejecutarAtaque(atacante, defensor);
    expect(primero.tipoAtaque).toBe('basico');
    expect(primero.jutsuNombre).toBe('Puñetazo');

    const segundo = ejecutarAtaque(atacante, defensor);
    expect(segundo.tipoAtaque).toBe('jutsu');
    expect(segundo.jutsuNombre).toBe('Golpe de Prueba');
    expect(atacante.cargaJutsu).toBe(0);
  });

  it('el ataque básico pega menos que el jutsu del mismo luchador', () => {
    const atacante = crearLuchador(cargadorRapido, 5);
    const defensor = crearLuchador(rivalDePrueba, 5);
    const basico = ejecutarAtaque(atacante, defensor);
    const jutsu = ejecutarAtaque(atacante, defensor);
    expect(jutsu.dano).toBeGreaterThan(basico.dano);
  });

  it('solo el jutsu aplica efectoEstado, el ataque básico no', () => {
    const atacante = crearLuchador(cargadorRapido, 5);
    const defensor = crearLuchador(rivalDePrueba, 5);

    ejecutarAtaque(atacante, defensor);
    expect(defensor.modificadoresTemporales).toHaveLength(0);

    ejecutarAtaque(atacante, defensor);
    expect(defensor.modificadoresTemporales).toHaveLength(1);
  });

  it('un modo con multiplicadorCarga acelera la barra', () => {
    const conModo = {
      ...cargadorRapido,
      jutsu: { ...cargadorRapido.jutsu, carga: { alAtacar: 10, alRecibirDano: 5, inicial: 0 } },
      modos: [{ nombre: 'Modo Sabio', nivelDesbloqueo: 1, multiplicadores: {}, multiplicadorCarga: 2 }],
    };
    const luchador = crearLuchador(conModo, 5);
    expect(luchador.cargaPorAtacar).toBe(20);
    expect(luchador.cargaPorRecibirDano).toBe(10);
  });

  it('turnosParaCargarJutsu refleja el ritmo del perfil de carga', () => {
    const lento = crearLuchador(
      { ...personajeDePrueba, jutsu: { ...personajeDePrueba.jutsu, carga: { alAtacar: 10, alRecibirDano: 10, inicial: 0 } } },
      5,
    );
    const rapido = crearLuchador(cargadorRapido, 5);
    expect(turnosParaCargarJutsu(lento)).toBe(cargaMaxima / 20);
    expect(turnosParaCargarJutsu(rapido)).toBe(1);
  });
});

describe('calcularDano', () => {
  it('nunca es menor que 1, incluso contra defensa desproporcionada', () => {
    const atacanteDebil = crearLuchador(
      { ...personajeDePrueba, statsBase: { hp: 10, ataque: 1, defensa: 1, velocidad: 1 } },
      1,
    );
    const defensorFuerte = crearLuchador(
      { ...rivalDePrueba, statsBase: { hp: 500, ataque: 1, defensa: 500, velocidad: 1 } },
      1,
    );
    const { cantidad } = calcularDano(atacanteDebil, defensorFuerte, personajeDePrueba.jutsu);
    expect(cantidad).toBeGreaterThanOrEqual(1);
  });
});

describe('resolverTurno', () => {
  it('termina el combate cuando uno de los dos llega a 0 HP', () => {
    const luchador1 = crearLuchador(
      { ...personajeDePrueba, statsBase: { hp: 5, ataque: 100, defensa: 1, velocidad: 100 } },
      10,
    );
    const luchador2 = crearLuchador(
      { ...rivalDePrueba, statsBase: { hp: 5, ataque: 1, defensa: 1, velocidad: 1 } },
      1,
    );
    const resultado = resolverTurno(luchador1, luchador2);
    expect(resultado.combateTerminado).toBe(true);
    expect(resultado.ganadorId).toBe(luchador1.id);
  });
});

describe('resolverCombateCompleto', () => {
  it('siempre devuelve un ganador válido', () => {
    const luchador1 = crearLuchador(personajeDePrueba, 10);
    const luchador2 = crearLuchador(rivalDePrueba, 10);
    const resultado = resolverCombateCompleto(luchador1, luchador2);
    expect([luchador1.id, luchador2.id]).toContain(resultado.ganadorId);
  });

  it('el perdedor termina la pelea con 0 HP', () => {
    const luchador1 = crearLuchador(
      { ...personajeDePrueba, statsBase: { hp: 5, ataque: 100, defensa: 1, velocidad: 100 } },
      10,
    );
    const luchador2 = crearLuchador(
      { ...rivalDePrueba, statsBase: { hp: 5, ataque: 1, defensa: 1, velocidad: 1 } },
      1,
    );
    resolverCombateCompleto(luchador1, luchador2);
    expect(luchador2.hpActual).toBe(0);
  });

  it('devuelve el historial con al menos un turno', () => {
    const luchador1 = crearLuchador(personajeDePrueba, 10);
    const luchador2 = crearLuchador(rivalDePrueba, 10);
    const resultado = resolverCombateCompleto(luchador1, luchador2);
    expect(resultado.historial.length).toBeGreaterThan(0);
  });
});

// El ataque básico es único para todos a propósito: lo que diferencia el daño
// básico de un personaje a otro es su stat de ataque, no un `danoBase` propio.
// Este test existe porque la decisión se rompería en silencio — un personaje
// nuevo con su propio `ataqueBasico` seguiría funcionando, simplemente pegaría
// distinto que el resto sin que nada avisara. Ver documentacion/29.
describe('ataque básico unificado (invariante de datos)', () => {
  const todosLosLuchadores = [
    ...charactersData.personajes,
    ...enemiesData.jefes,
    ...commonEnemiesData.plantillasGenericas,
    ...commonEnemiesData.enemigosNombrados,
  ];

  it('ningún personaje ni enemigo define su propio ataqueBasico', () => {
    const conBasicoPropio = todosLosLuchadores.filter((l) => l.ataqueBasico).map((l) => l.id);
    expect(conBasicoPropio).toEqual([]);
  });

  it('todos usan el mismo ataque básico, el de config.json', () => {
    const { ataqueBasicoPorDefecto } = configGlobal.combate.jutsu;
    for (const base of todosLosLuchadores) {
      expect(crearLuchador(base, 5).ataqueBasico).toEqual(ataqueBasicoPorDefecto);
    }
  });
});
