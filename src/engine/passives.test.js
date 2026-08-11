import { describe, it, expect } from 'vitest';
import {
  normalizarPasivas,
  describirPasiva,
  idsDelCatalogo,
  existePasiva,
} from './passives';
import { crearLuchador, ejecutarAtaque, determinarOrden, resolverTurno } from './combat';
import pasivasData from '../data/passives.json';
import charactersData from '../data/characters.json';
import enemiesData from '../data/enemies.json';
import itemsData from '../data/items.json';
import arco1 from '../data/arcs/pais-de-las-olas.json';
import arco2 from '../data/arcs/examen-chunin.json';
import arco3 from '../data/arcs/invasion-de-pain.json';

const ARCOS = [arco1, arco2, arco3];

const base = {
  id: 'test_katon',
  nombre: 'Luchador de Prueba',
  tipo: 'katon',
  statsBase: { hp: 200, ataque: 20, defensa: 5, velocidad: 10 },
  jutsu: { nombre: 'Golpe de Prueba', danoBase: 2, efectoEstado: null },
  modos: [],
};

const rival = { ...base, id: 'test_suiton', tipo: 'suiton', nombre: 'Rival de Prueba' };

/** Luchador con pasivas, declaradas como las declarará un objeto equipado. */
function conPasivas(personajeBase, pasivas, nivel = 1) {
  return crearLuchador(personajeBase, nivel, null, null, 1, pasivas);
}

/** Luchador con pasivas que vienen de su transformación, no de un objeto. */
function conModo(personajeBase, pasivas) {
  return crearLuchador(
    { ...personajeBase, modos: [{ nombre: 'Modo de Prueba', nivelDesbloqueo: 1, multiplicadores: {}, pasivas }] },
    1,
  );
}

/** Deja la barra llena para que el siguiente ataque sea el jutsu. */
function cargarJutsu(luchador) {
  luchador.cargaJutsu = luchador.cargaMaxima;
  return luchador;
}

describe('normalizarPasivas', () => {
  it('acepta la forma corta (solo el id) y rellena los parámetros por defecto', () => {
    const [pasiva] = normalizarPasivas(['heal_on_kill']);
    expect(pasiva.id).toBe('heal_on_kill');
    expect(pasiva.parametros.cantidad).toBeGreaterThan(0);
  });

  it('la forma larga pisa los parámetros por defecto', () => {
    const [pasiva] = normalizarPasivas([{ id: 'heal_on_kill', cantidad: 0.5 }]);
    expect(pasiva.parametros.cantidad).toBe(0.5);
  });

  // Lo importante de este test no es el error, es que NO se ignore en silencio:
  // una pasiva que no hace nada sin avisar deja al personaje desbalanceado sin
  // que nada lo delate.
  it('revienta con un id que no existe en el catálogo', () => {
    expect(() => normalizarPasivas(['no_existe'])).toThrow(/no_existe/);
  });

  it('una lista vacía no da problemas (el caso normal hoy)', () => {
    expect(normalizarPasivas()).toEqual([]);
    expect(crearLuchador(base, 1).pasivas).toEqual([]);
  });
});

describe('catálogo y textos', () => {
  it('cada pasiva del motor tiene su texto en passives.json, y al revés', () => {
    const idsMotor = [...idsDelCatalogo()].sort();
    const idsTexto = pasivasData.pasivas.map((p) => p.id).sort();
    expect(idsTexto).toEqual(idsMotor);
  });

  it('describirPasiva usa los parámetros reales de esa declaración', () => {
    const [mitad] = normalizarPasivas([{ id: 'first_hit_reduction', cantidad: 0.5 }]);
    const [entero] = normalizarPasivas([{ id: 'first_hit_reduction', cantidad: 1 }]);
    expect(describirPasiva(mitad)).toContain('50%');
    expect(describirPasiva(entero)).toContain('100%');
  });

  it('existePasiva distingue lo que hay de lo que no', () => {
    expect(existePasiva('priority')).toBe(true);
    expect(existePasiva('invent_passive')).toBe(false);
  });
});

describe('pasivas de daño de salida', () => {
  it('first_jutsu_bonus solo sube el PRIMER jutsu del combate', () => {
    const conBonus = cargarJutsu(conPasivas(base, [{ id: 'first_jutsu_bonus', cantidad: 1 }]));
    const primero = ejecutarAtaque(conBonus, crearLuchador(rival, 1));
    expect(primero.pasivasActivadas).toContain('first_jutsu_bonus');

    const segundo = ejecutarAtaque(cargarJutsu(conBonus), crearLuchador(rival, 1));
    expect(segundo.pasivasActivadas).not.toContain('first_jutsu_bonus');
    expect(segundo.dano).toBeLessThan(primero.dano);
  });

  it('basic_attack_bonus sube los básicos y no toca el jutsu', () => {
    const conBonus = conPasivas(base, [{ id: 'basic_attack_bonus', cantidad: 0.5 }]);
    const basico = ejecutarAtaque(conBonus, crearLuchador(rival, 1));
    expect(basico.pasivasActivadas).toContain('basic_attack_bonus');

    const jutsu = ejecutarAtaque(cargarJutsu(conBonus), crearLuchador(rival, 1));
    expect(jutsu.pasivasActivadas).not.toContain('basic_attack_bonus');
  });

  it('ignore_defense reduce la defensa que se le resta al daño', () => {
    const tanque = { ...rival, statsBase: { hp: 500, ataque: 1, defensa: 60, velocidad: 1 } };
    const normal = ejecutarAtaque(crearLuchador(base, 1), crearLuchador(tanque, 1));
    const perforante = ejecutarAtaque(
      conPasivas(base, [{ id: 'ignore_defense', cantidad: 1, soloJutsu: false }]),
      crearLuchador(tanque, 1),
    );
    expect(perforante.dano).toBeGreaterThan(normal.dano);
  });

  it('damage_floor pone un suelo al daño contra una defensa desproporcionada', () => {
    const muro = { ...rival, statsBase: { hp: 999, ataque: 1, defensa: 400, velocidad: 1 } };
    const sinSuelo = ejecutarAtaque(crearLuchador(base, 1), crearLuchador(muro, 1));
    const conSuelo = ejecutarAtaque(
      conPasivas(base, [{ id: 'damage_floor', cantidad: 0.5 }]),
      crearLuchador(muro, 1),
    );
    expect(sinSuelo.dano).toBe(1); // el mínimo de siempre
    expect(conSuelo.dano).toBeGreaterThan(sinSuelo.dano);
  });
});

describe('pasivas de daño de entrada', () => {
  it('first_hit_reduction al 100% bloquea el primer golpe entero, y solo el primero', () => {
    const defensor = conPasivas(rival, [{ id: 'first_hit_reduction', cantidad: 1 }]);
    const atacante = crearLuchador(base, 1);

    const primero = ejecutarAtaque(atacante, defensor);
    expect(primero.dano).toBe(0);
    expect(primero.pasivasActivadas).toContain('first_hit_reduction');
    expect(defensor.hpActual).toBe(defensor.hpMaximo);

    const segundo = ejecutarAtaque(atacante, defensor);
    expect(segundo.dano).toBeGreaterThan(0);
  });

  it('un golpe bloqueado no carga la barra del defensor', () => {
    const defensor = conPasivas(rival, [{ id: 'first_hit_reduction', cantidad: 1 }]);
    ejecutarAtaque(crearLuchador(base, 1), defensor);
    expect(defensor.cargaJutsu).toBe(0);
  });

  it('reduce_damage_taken baja el daño durante todo el combate', () => {
    const atacante = crearLuchador(base, 1);
    const normal = ejecutarAtaque(atacante, crearLuchador(rival, 1));
    const protegido = conPasivas(rival, [{ id: 'reduce_damage_taken', cantidad: 0.5 }]);
    ejecutarAtaque(crearLuchador(base, 1), protegido); // gasta el "primer golpe"
    const segundo = ejecutarAtaque(crearLuchador(base, 1), protegido);
    expect(segundo.dano).toBeLessThan(normal.dano);
  });
});

describe('pasivas de reglas del turno', () => {
  it('priority ataca primero aunque sea el más lento', () => {
    const lento = { ...base, statsBase: { ...base.statsBase, velocidad: 1 } };
    const rapido = { ...rival, statsBase: { ...rival.statsBase, velocidad: 99 } };

    const sinPasiva = determinarOrden(crearLuchador(lento, 1), crearLuchador(rapido, 1));
    expect(sinPasiva[0].id).toBe(rapido.id);

    const conPrioridad = determinarOrden(conPasivas(lento, ['priority']), crearLuchador(rapido, 1));
    expect(conPrioridad[0].id).toBe(lento.id);
  });

  it('si los dos tienen prioridad se anulan y vuelve a mandar la velocidad', () => {
    const lento = { ...base, statsBase: { ...base.statsBase, velocidad: 1 } };
    const rapido = { ...rival, statsBase: { ...rival.statsBase, velocidad: 99 } };
    const orden = determinarOrden(conPasivas(lento, ['priority']), conPasivas(rapido, ['priority']));
    expect(orden[0].id).toBe(rapido.id);
  });

  it('repeat_basic_chance añade un golpe extra, y como mucho uno', () => {
    // `azar` inyectado para que el test no dependa de la suerte: 0 siempre entra
    // por debajo de la probabilidad, 0.99 nunca.
    const siempre = resolverTurno(
      conPasivas(base, [{ id: 'repeat_basic_chance', cantidad: 0.3 }]),
      crearLuchador(rival, 1),
      () => 0,
    );
    const nunca = resolverTurno(
      conPasivas(base, [{ id: 'repeat_basic_chance', cantidad: 0.3 }]),
      crearLuchador(rival, 1),
      () => 0.99,
    );
    expect(siempre.eventos).toHaveLength(3); // atacante + su extra + rival
    expect(nunca.eventos).toHaveLength(2);
    expect(siempre.eventos[1].esAtaqueExtra).toBe(true);
  });

  it('el jutsu nunca se repite, solo el ataque básico', () => {
    const turno = resolverTurno(
      cargarJutsu(conPasivas(base, [{ id: 'repeat_basic_chance', cantidad: 1 }])),
      crearLuchador(rival, 1),
      () => 0,
    );
    expect(turno.eventos[0].tipoAtaque).toBe('jutsu');
    expect(turno.eventos[1].esAtaqueExtra).toBe(false);
  });
});

describe('pasivas al derrotar', () => {
  it('heal_on_kill cura al atacante solo cuando remata', () => {
    const atacante = conPasivas(base, [{ id: 'heal_on_kill', cantidad: 0.25 }]);
    atacante.hpActual = 10;

    const vivo = crearLuchador(rival, 1);
    ejecutarAtaque(atacante, vivo);
    expect(atacante.hpActual).toBe(10); // no ha rematado a nadie

    const moribundo = crearLuchador(rival, 1);
    moribundo.hpActual = 1;
    const evento = ejecutarAtaque(atacante, moribundo);
    expect(evento.defensorDerrotado).toBe(true);
    expect(atacante.hpActual).toBeGreaterThan(10);
    expect(evento.pasivasActivadas).toContain('heal_on_kill');
    expect(evento.hpAtacante).toBe(atacante.hpActual);
  });

  it('la curación no pasa del HP máximo', () => {
    const atacante = conPasivas(base, [{ id: 'heal_on_kill', cantidad: 1 }]);
    const moribundo = crearLuchador(rival, 1);
    moribundo.hpActual = 1;
    ejecutarAtaque(atacante, moribundo);
    expect(atacante.hpActual).toBe(atacante.hpMaximo);
  });
});

describe('origen de las pasivas', () => {
  it('las pasivas del modo activo se aplican igual que las de un objeto', () => {
    const conTransformacion = conModo(rival, [{ id: 'first_hit_reduction', cantidad: 1 }]);
    const evento = ejecutarAtaque(crearLuchador(base, 1), conTransformacion);
    expect(evento.dano).toBe(0);
  });

  it('modo y objeto se acumulan en el mismo luchador', () => {
    const personajeConModo = {
      ...base,
      modos: [{ nombre: 'Modo', nivelDesbloqueo: 1, multiplicadores: {}, pasivas: ['priority'] }],
    };
    const luchador = crearLuchador(personajeConModo, 1, null, null, 1, ['heal_on_kill']);
    expect(luchador.pasivas.map((p) => p.id)).toEqual(['priority', 'heal_on_kill']);
  });

  // Los contadores viven en el luchador, y el enemigo de un nodo es UNO solo
  // para toda la cadena de rondas: no puede volver a bloquear un primer golpe
  // cada vez que entra un personaje nuevo del equipo.
  it('los contadores de combate no se reinician entre atacantes distintos', () => {
    const defensor = conPasivas(rival, [{ id: 'first_hit_reduction', cantidad: 1 }]);
    ejecutarAtaque(crearLuchador(base, 1), defensor);
    const otroAtacante = ejecutarAtaque(crearLuchador({ ...base, id: 'otro' }, 1), defensor);
    expect(otroAtacante.dano).toBeGreaterThan(0);
  });
});

// Invariantes de los datos. Estos tests no prueban el motor: protegen decisiones
// de contenido que se romperían sin hacer ruido.
describe('modos de los personajes (invariantes de datos)', () => {
  const modosDePersonajes = charactersData.personajes.flatMap(
    (p) => (p.modos ?? []).map((m) => ({ personaje: p.id, ...m })),
  );
  const modosDeJefes = enemiesData.jefes.flatMap(
    (j) => (j.modos ?? []).map((m) => ({ personaje: j.id, ...m })),
  );

  it('todo modo declara pasivas, y todas existen en el catálogo', () => {
    for (const modo of [...modosDePersonajes, ...modosDeJefes]) {
      expect(modo.pasivas, `${modo.personaje} — ${modo.nombre}`).toBeDefined();
      expect(() => normalizarPasivas(modo.pasivas)).not.toThrow();
      expect(modo.pasivas.length).toBeGreaterThan(0);
    }
  });

  it('toda pasiva declarada tiene una frase que enseñar al jugador', () => {
    for (const modo of [...modosDePersonajes, ...modosDeJefes]) {
      for (const pasiva of normalizarPasivas(modo.pasivas)) {
        expect(describirPasiva(pasiva), `${modo.personaje} — ${pasiva.id}`).not.toBe('');
      }
    }
  });

  // El bug que este test existe para que no vuelva: los segundos modos se
  // desbloqueaban entre el nivel 60 y el 85 cuando una run termina sobre el 49,
  // así que NADIE los veía nunca — y Sai y Yamato, con un único modo a nivel
  // 75/80, no tenían transformación en absoluto. Contenido escrito, balanceado y
  // muerto, sin que nada avisara.
  it('todos los modos de personaje se desbloquean dentro de la run', () => {
    const nivelFinalDeRun = Math.max(...ARCOS.map((a) => a.nivelJefeFinal));
    for (const modo of modosDePersonajes) {
      expect(modo.nivelDesbloqueo, `${modo.personaje} — ${modo.nombre}`)
        .toBeLessThanOrEqual(nivelFinalDeRun);
    }
  });

  it('cada personaje tiene al menos una transformación', () => {
    for (const personaje of charactersData.personajes) {
      expect(personaje.modos?.length, personaje.id).toBeGreaterThan(0);
    }
  });
});

describe('objetos (invariantes de datos)', () => {
  const objetos = itemsData.objetos;

  it('todo objeto declara pasivas o un efecto de run, nunca los dos ni ninguno', () => {
    for (const objeto of objetos) {
      const tienePasivas = Boolean(objeto.pasivas?.length);
      const tieneEfecto = Boolean(objeto.efecto);
      expect(tienePasivas !== tieneEfecto, `${objeto.id}`).toBe(true);
    }
  });

  it('todas las pasivas de objeto existen y tienen frase', () => {
    for (const objeto of objetos.filter((o) => o.pasivas)) {
      expect(() => normalizarPasivas(objeto.pasivas)).not.toThrow();
      for (const pasiva of normalizarPasivas(objeto.pasivas)) {
        expect(describirPasiva(pasiva), `${objeto.id} — ${pasiva.id}`).not.toBe('');
      }
    }
  });

  // Los objetos daban stats planas (+4 de ataque contra un ataque de 80 al final
  // de la run) y aportaban ~1,5% del poder de una partida. Una pasiva no se
  // diluye con el nivel: es toda la razón de ser de la fase 3.
  it('ningún objeto da bonificaciones planas de estadísticas', () => {
    const tiposDeStatsViejos = ['buffEquipable', 'buffYDebuffEquipable'];
    for (const objeto of objetos) {
      expect(tiposDeStatsViejos, `${objeto.id}`).not.toContain(objeto.efecto?.tipo);
    }
  });

  it('cada categoría del doc 27 tiene al menos un objeto', () => {
    const categorias = new Set(objetos.map((o) => o.categoria));
    for (const esperada of ['combate', 'supervivencia', 'riesgo', 'jefe', 'consumible']) {
      expect(categorias, esperada).toContain(esperada);
    }
  });
});
