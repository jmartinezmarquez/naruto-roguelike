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

  it('el jutsu pega EXACTAMENTE lo que dice la proporción de sus danoBase', () => {
    // Antes este test solo pedía `jutsu > basico`, y eso lo cumplía también la
    // versión que salió mal en el playtest: con la defensa restada plana, un jutsu
    // que en los datos pega 2,4 veces más acababa pegando 4 y 7 veces más, porque
    // el mismo escudo se come un porcentaje enorme del golpe pequeño y uno pequeño
    // del grande. Ahora la defensa se resta en proporción a la potencia, así que la
    // proporción de los datos es la que se ve en pantalla — y eso sí se puede fijar
    // con un número.
    const atacante = crearLuchador(cargadorRapido, 5);
    const defensor = crearLuchador(personajeDePrueba, 5); // mismo tipo: eficacia ×1

    const basico = ejecutarAtaque(atacante, defensor);
    const jutsu = ejecutarAtaque(atacante, defensor);

    // Con este fixture la resta plana daba 1 y 9: **nueve veces**, para dos ataques
    // que en los datos se llevan 2,4. Ahora sale 2,7, y lo que sobra es redondeo:
    // el daño se redondea a entero y a un dígito eso mueve mucho la proporción, así
    // que el margen es de media unidad (`toBeCloseTo(…, 0)`) y no más fino. Lo que
    // fija el test es el orden de magnitud, que es justo lo que estaba roto.
    const proporcionDeclarada = cargadorRapido.jutsu.danoBase / cargadorRapido.ataqueBasico.danoBase;
    expect(jutsu.dano / basico.dano).toBeCloseTo(proporcionDeclarada, 0);
    expect(jutsu.dano).toBeGreaterThan(basico.dano);
  });

  it('cuando la defensa se traga el ataque entero, los dos caen al suelo de 1', () => {
    // El rival es suiton y el atacante katon: eficacia ×0.5, y con esa penalización
    // su defensa vale más que el ataque recibido. Ninguno de los dos golpes hace
    // nada, y los dos se quedan en el mínimo de 1 — el mismo que ya existía para
    // que ningún ataque haga 0. Es la única situación en la que el jutsu NO pega
    // más que el básico, y es la correcta: contra ese rival no funciona ninguno de
    // los dos, y la respuesta del juego es cambiar de personaje, no pegar más.
    const atacante = crearLuchador(cargadorRapido, 5);
    const defensor = crearLuchador(rivalDePrueba, 5);

    expect(ejecutarAtaque(atacante, defensor).dano).toBe(1);
    expect(ejecutarAtaque(atacante, defensor).dano).toBe(1);
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

  // La enciclopedia lista a TODOS los luchadores de los tres JSON y de cada uno
  // pinta el nombre de su jutsu, su potencia y sus turnos de carga a nivel 1. No
  // hay tests de componentes React, así que esto es lo más cerca que se puede
  // estar de comprobar que esa pantalla no se rompe con contenido nuevo: si
  // alguien añade un enemigo sin `jutsu.danoBase`, salta aquí y no en pantalla.
  it('todo luchador se puede construir a nivel 1 y su jutsu tiene nombre, potencia y carga finita', () => {
    for (const base of todosLosLuchadores) {
      const luchador = crearLuchador(base, 1);
      expect(typeof base.jutsu.nombre, `jutsu.nombre de ${base.id}`).toBe('string');
      expect(base.jutsu.nombre.length, `jutsu.nombre de ${base.id}`).toBeGreaterThan(0);
      expect(typeof base.jutsu.danoBase, `jutsu.danoBase de ${base.id}`).toBe('number');
      expect(Number.isFinite(turnosParaCargarJutsu(luchador)), `carga de ${base.id}`).toBe(true);
    }
  });

  // El registro de vistos de la enciclopedia identifica un modo por su posición
  // dentro de `modos` (`naruto_1`), porque un modo no tiene id propio en los JSON.
  // Eso solo es una clave estable si ningún personaje repite el nombre de un modo
  // con otro suyo — si los repitiera, `findIndex` por nombre (que es como el store
  // reconstruye el índice desde el resumen del combate) devolvería siempre el
  // primero y la segunda transformación no se desbloquearía nunca.
  it('ningún luchador tiene dos modos con el mismo nombre', () => {
    for (const base of todosLosLuchadores) {
      const nombres = (base.modos ?? []).map((m) => m.nombre);
      expect(new Set(nombres).size, `modos repetidos en ${base.id}`).toBe(nombres.length);
    }
  });
});
