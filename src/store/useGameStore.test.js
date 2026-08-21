import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './useGameStore';
import { useAchievementsStore, VISTOS_VACIO, CONTADORES_VACIO, MARCA_VACIA } from './useAchievementsStore';
import arcoDePrueba from '../data/arcs/pais-de-las-olas.json';
import configGlobal from '../data/config.json';
import eventosData from '../data/events.json';

const enemigoHakuDePrueba = {
  // Mismo id que el mini-jefe real del arco de prueba (miniJefeId: 'haku'),
  // pero con stats de juguete para poder derrotarlo en un turno.
  id: 'haku',
  nombre: 'Haku de Prueba',
  tipo: 'suiton',
  statsBase: { hp: 1, ataque: 1, defensa: 1, velocidad: 1 },
  jutsu: { nombre: 'Golpe Débil', danoBase: 0.1, efectoEstado: null },
  modos: [],
};

const enemigoZabuzaDePrueba = {
  // Mismo id que el jefe final real del arco de prueba (jefeFinalId: 'zabuza').
  id: 'zabuza',
  nombre: 'Zabuza de Prueba',
  tipo: 'suiton',
  statsBase: { hp: 1, ataque: 1, defensa: 1, velocidad: 1 },
  jutsu: { nombre: 'Golpe Débil', danoBase: 0.1, efectoEstado: null },
  modos: [],
};

const enemigoDebilDePrueba = {
  id: 'enemigo_debil_test',
  nombre: 'Enemigo Débil de Prueba',
  tipo: 'doton',
  statsBase: { hp: 1, ataque: 1, defensa: 1, velocidad: 1 },
  jutsu: { nombre: 'Golpe Débil', danoBase: 0.1, efectoEstado: null },
  modos: [],
};

const enemigoImbatibleDePrueba = {
  id: 'enemigo_imbatible_test',
  nombre: 'Enemigo Imbatible de Prueba',
  tipo: 'raiton',
  statsBase: { hp: 9999, ataque: 9999, defensa: 9999, velocidad: 9999 },
  jutsu: { nombre: 'Golpe Devastador', danoBase: 5, efectoEstado: null },
  modos: [],
};

// Se reinicia la run entera antes de cada test para que no arrastren estado.
// También los logros: viven en un store aparte que sobrevive a iniciarRun a
// propósito (es meta-progresión entre runs), así que hay que limpiarlo aquí.
beforeEach(() => {
  localStorage.clear();
  // ⚠️ Los contadores acumulados también se resetean, y esto no es opcional: sin
  // ellos, los combates y eventos de un test se suman a los del siguiente y
  // acaban desbloqueando logros de contador ("gana 10 combates") en mitad de una
  // prueba que iba de otra cosa. Es la misma trampa que en el juego, donde
  // reiniciar la meta-progresión tiene que borrar las TRES claves.
  useAchievementsStore.setState({
    logrosDesbloqueados: [],
    vistos: VISTOS_VACIO,
    contadores: CONTADORES_VACIO,
    marca: MARCA_VACIA,
    notificacionesPendientes: [],
  });
  useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
});

describe('iniciarRun', () => {
  it('crea el equipo con los personajes indicados, en ese orden', () => {
    const { equipo } = useGameStore.getState();
    expect(equipo.map((p) => p.id)).toEqual(['naruto', 'sasuke', 'sakura']);
  });

  it('el equipo empieza a HP completo y sin nadie derrotado', () => {
    const { equipo } = useGameStore.getState();
    equipo.forEach((p) => {
      expect(p.derrotado).toBe(false);
      expect(p.hpActual).toBeGreaterThan(0);
    });
  });

  it('genera un mapa cuyo primer piso está entre los nodos iniciales', () => {
    const { mapa } = useGameStore.getState();
    expect(mapa.nodosIniciales.length).toBeGreaterThan(0);
  });
});

describe('jugarCombate — victoria', () => {
  it('un personaje mucho más fuerte gana el combate', () => {
    const resumen = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    expect(resumen.jugadorGanoFinal).toBe(true);
  });

  it('el personaje activo no queda derrotado tras ganar', () => {
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    expect(useGameStore.getState().equipo[0].derrotado).toBe(false);
  });

  it('el equipo gana oro y el personaje activo gana XP', () => {
    const oroAntes = useGameStore.getState().oro;
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    const { oro, equipo } = useGameStore.getState();
    expect(oro).toBeGreaterThan(oroAntes);
    expect(equipo[0].xpActual).toBeGreaterThanOrEqual(0); // pudo subir de nivel y resetear xpActual
  });
});

describe('encadenar arcos', () => {
  it('derrotar al jefe final del arco marca arcoCompletado en el resumen, sin terminar la run', () => {
    const resumen = useGameStore.getState().jugarCombate(enemigoZabuzaDePrueba, 1);
    expect(resumen.arcoCompletado).toBe(true);
    expect(useGameStore.getState().runTerminada).toBe(false);
    expect(useGameStore.getState().runGanada).toBe(false);
  });

  it('derrotar a un enemigo con recompensa.finDeLaRun marca la run como terminada y ganada', () => {
    // El arco de prueba es pais_de_las_olas de verdad; se sustituye jefeFinalId
    // por un id de prueba para poder controlar la recompensa sin tocar datos reales.
    useGameStore.setState((estado) => ({
      arcoActualDatos: { ...estado.arcoActualDatos, jefeFinalId: 'pain_test' },
    }));
    const enemigoFinalDePrueba = {
      id: 'pain_test',
      nombre: 'Pain de Prueba',
      tipo: 'raiton',
      statsBase: { hp: 1, ataque: 1, defensa: 1, velocidad: 1 },
      jutsu: { nombre: 'Golpe Débil', danoBase: 0.1, efectoEstado: null },
      modos: [],
      recompensa: { xp: 10, finDeLaRun: true },
    };

    const resumen = useGameStore.getState().jugarCombate(enemigoFinalDePrueba, 1);
    expect(resumen.arcoCompletado).toBe(true);
    expect(useGameStore.getState().runTerminada).toBe(true);
    expect(useGameStore.getState().runGanada).toBe(true);
  });

  it('derrotar al jefe final de un arco cura y revive a todo el equipo (estilo Slay the Spire)', () => {
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p, i) => (i === 1 ? { ...p, derrotado: true, hpActual: 0 } : { ...p, hpActual: 1 })),
    }));

    useGameStore.getState().jugarCombate(enemigoZabuzaDePrueba, 1);

    const { equipo, obtenerHpMaximo } = useGameStore.getState();
    equipo.forEach((p) => {
      expect(p.derrotado).toBe(false);
      expect(p.hpActual).toBe(obtenerHpMaximo(p.id));
    });
  });

  it('avanzarSiguienteArco pasa al siguiente arco de la secuencia manteniendo equipo y oro', () => {
    useGameStore.getState().jugarCombate(enemigoZabuzaDePrueba, 1);
    const oroAntes = useGameStore.getState().oro;
    const idsEquipoAntes = useGameStore.getState().equipo.map((p) => p.id);

    const avanzo = useGameStore.getState().avanzarSiguienteArco();
    expect(avanzo).toBe(true);

    const { arcoActualId, mapa, nodoActualId, oro, equipo, huboDerrotaEnEsteArco, pantalla } = useGameStore.getState();
    expect(arcoActualId).toBe('examen_chunin');
    expect(mapa.arcoId).toBe('examen_chunin');
    // El arco nuevo arranca plantado en su nodo de salida, no "en ninguna parte".
    expect(nodoActualId).toBe(mapa.nodoInicialId);
    expect(pantalla).toBe('mapa');
    expect(oro).toBe(oroAntes);
    expect(equipo.map((p) => p.id)).toEqual(idsEquipoAntes);
    expect(huboDerrotaEnEsteArco).toBe(false);
  });

  it('avanzarSiguienteArco no hace nada si el arco actual no está en la secuencia conocida', () => {
    useGameStore.setState((estado) => ({
      arcoActualId: 'arco_inventado',
      arcoActualDatos: { ...estado.arcoActualDatos, id: 'arco_inventado' },
    }));
    const avanzo = useGameStore.getState().avanzarSiguienteArco();
    expect(avanzo).toBe(false);
    expect(useGameStore.getState().arcoActualId).toBe('arco_inventado');
  });

  it('avanzarSiguienteArco no hace nada si el arco actual ya es el último de la secuencia', () => {
    useGameStore.setState({ arcoActualId: 'invasion_de_pain' });
    const avanzo = useGameStore.getState().avanzarSiguienteArco();
    expect(avanzo).toBe(false);
  });
});

describe('jugarCombate — un personaje muere', () => {
  it('un rival imposible de vencer acaba derrotando a todo el equipo (rondas encadenadas)', () => {
    useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    const { equipo, runTerminada } = useGameStore.getState();
    equipo.forEach((p) => expect(p.derrotado).toBe(true));
    expect(runTerminada).toBe(true);
  });

  it('el resumen de combate contiene una ronda por cada personaje que entró a luchar', () => {
    const resumen = useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    expect(resumen.rondas).toHaveLength(3); // los 3 personajes del equipo caen uno tras otro
    expect(resumen.jugadorGanoFinal).toBe(false);
  });
});

describe('jugarCombate — barra de jutsu entre rondas encadenadas', () => {
  it('el enemigo conserva su carga de una ronda a la siguiente, como conserva el HP', () => {
    // Un enemigo imbatible obliga a que entren los 3 personajes en cadena.
    const resumen = useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);

    const [primera, segunda] = resumen.rondas;
    const cargaFinalPrimeraRonda = primera.historial
      .flatMap((t) => t.eventos)
      .filter((e) => e.atacanteId === primera.enemigo.id)
      .at(-1).cargaAtacante;

    expect(segunda.enemigo.cargaInicial).toBe(cargaFinalPrimeraRonda);
  });

  it('cada personaje del jugador entra a su ronda con la barra a cero', () => {
    const resumen = useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    resumen.rondas.forEach((ronda) => expect(ronda.jugador.cargaInicial).toBe(0));
  });
});

describe('_aplicarVictoria — XP de personajes caídos', () => {
  it('un personaje ya caído ANTES de este combate no gana XP hasta curarse', () => {
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p) => (p.id === 'sasuke' ? { ...p, derrotado: true, hpActual: 0 } : p)),
    }));
    const idsYaDerrotadosAntes = new Set(['sasuke']);
    const naruto = useGameStore.getState().equipo.find((p) => p.id === 'naruto');

    useGameStore.getState()._aplicarVictoria(naruto.id, naruto.hpActual, enemigoDebilDePrueba, idsYaDerrotadosAntes);

    const sasuke = useGameStore.getState().equipo.find((p) => p.id === 'sasuke');
    expect(sasuke.xpActual).toBe(0);
    expect(sasuke.hpActual).toBe(0);
  });

  it('un personaje que cae DURANTE este mismo combate sí gana su XP de banquillo, pero se queda a 0 HP', () => {
    // Simula que sasuke acaba de caer en una ronda anterior de ESTE combate
    // (rondas encadenadas) — no estaba derrotado antes de que empezara.
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p) => (p.id === 'sasuke' ? { ...p, derrotado: true, hpActual: 0 } : p)),
    }));
    const idsYaDerrotadosAntes = new Set(); // nadie estaba caído antes de que empezara el combate
    const naruto = useGameStore.getState().equipo.find((p) => p.id === 'naruto');

    useGameStore.getState()._aplicarVictoria(naruto.id, naruto.hpActual, enemigoDebilDePrueba, idsYaDerrotadosAntes);

    const sasuke = useGameStore.getState().equipo.find((p) => p.id === 'sasuke');
    expect(sasuke.xpActual).toBeGreaterThan(0); // ganó XP por haber participado en este combate
    expect(sasuke.hpActual).toBe(0); // pero sigue a 0 HP — subir de nivel no lo revive de regalo
    expect(sasuke.derrotado).toBe(true);
  });
});

describe('jugarCombate — foto del equipo para la pantalla de combate', () => {
  // `jugarCombate` aplica victoria/derrota ANTES de que la animación empiece, así
  // que si CombatScreen leyera `equipo` para pintar al equipo estaría pintando el
  // estado FINAL: se vería caer a un personaje antes de que el jugador lo viva.
  // Por eso el resumen lleva su propia foto, tomada antes de la primera ronda.
  it('el resumen trae el equipo tal y como estaba antes de pelear', () => {
    const equipoAntes = useGameStore.getState().equipo.map((p) => ({ id: p.id, hpActual: p.hpActual }));

    const resumen = useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);

    expect(resumen.equipoAlEmpezar.map((p) => p.id)).toEqual(equipoAntes.map((p) => p.id));
    expect(resumen.equipoAlEmpezar.map((p) => p.hpActual)).toEqual(equipoAntes.map((p) => p.hpActual));
    // Y el estado real del store sí ha cambiado: la foto no es un alias de `equipo`.
    expect(useGameStore.getState().equipo.every((p) => p.derrotado)).toBe(true);
  });

  it('la foto trae el HP máximo de ANTES, no el de después de subir de nivel', () => {
    const maximosAntes = Object.fromEntries(
      useGameStore.getState().equipo.map((p) => [p.id, useGameStore.getState().obtenerHpMaximo(p.id)]),
    );

    const resumen = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);

    for (const miembro of resumen.equipoAlEmpezar) {
      expect(miembro.hpMaximo, miembro.id).toBe(maximosAntes[miembro.id]);
    }
    // El activo sube de nivel al ganar, así que su máximo de ahora es mayor: si
    // la pantalla usara ese, la barra saldría corta durante toda la animación.
    expect(useGameStore.getState().obtenerHpMaximo('naruto')).toBeGreaterThan(maximosAntes.naruto);
  });
});

describe('jugarCombate — recompensas en el resumen', () => {
  // El final del combate era un "Victory" de texto: la XP se aplicaba en el store
  // y solo se notaba si además subías de nivel, el oro cambiaba en otra pantalla y
  // el objeto aparecía en la mochila sin que nadie lo dijera. Todo eso ya viaja en
  // el resumen para que `CombatScreen` pueda enseñarlo (punto 12 del roadmap).
  it('el resumen dice cuánto oro ha dado el combate, y coincide con el que se suma', () => {
    const oroAntes = useGameStore.getState().oro;

    const resumen = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);

    expect(resumen.recompensas.oro).toBeGreaterThan(0);
    expect(useGameStore.getState().oro).toBe(oroAntes + resumen.recompensas.oro);
    // La XP no viaja en el resumen a propósito: casi cada combate sube un nivel,
    // así que el número exacto no cambia ninguna decisión y la pantalla no lo
    // enseña. Lo que se ve de la XP es su consecuencia (`subidasDeNivel`).
    expect(resumen.recompensas.xp).toBeUndefined();
  });

  it('el objeto del mini-jefe NO se anuncia en el resumen: tiene su propia pantalla', () => {
    // Anunciarlo aquí y volver a darlo en `ItemRewardScreen` sería contarlo dos veces.
    // El stub de Haku no lleva recompensa, así que se le pone una aquí: lo que se
    // prueba es el reparto, no los datos del arco.
    const miniJefeConObjeto = {
      ...enemigoHakuDePrueba,
      recompensa: { xp: 100, objetoGarantizado: 'pergamino_viento' },
    };
    const resumen = useGameStore.getState().jugarCombate(miniJefeConObjeto, 1);
    expect(useGameStore.getState().recompensaMiniJefe).not.toBeNull();
    expect(resumen.recompensas.objetos).toEqual([]);
  });

  it('el objeto del jefe final SÍ va en el resumen: se auto-añade a la mochila', () => {
    // La otra cara del test anterior. El jefe final no tiene pantalla de recogida,
    // así que su objeto entra directo y el resumen es el único sitio donde se
    // anuncia — si no, aparecería en la mochila sin que nadie lo dijera.
    const jefeConObjeto = {
      ...enemigoZabuzaDePrueba,
      recompensa: { xp: 100, objetoGarantizado: 'pergamino_viento' },
    };
    const resumen = useGameStore.getState().jugarCombate(jefeConObjeto, 1);
    expect(resumen.recompensas.objetos).toEqual(['pergamino_viento']);
  });

});

describe('recompensas de una cadena de entrenador', () => {
  // El bug: el resumen traía solo lo de ESE combate, así que la pantalla pintaba un
  // cartel de recompensa en cada eslabón —tres carteles de 1,6 s— y ninguno decía
  // cuánto llevabas ganado en total.
  function cadenaDeDosDePrueba() {
    useGameStore.setState({
      cadenaEnemigos: {
        enemigos: [
          { enemigoBase: enemigoDebilDePrueba, nivel: 1 },
          { enemigoBase: enemigoDebilDePrueba, nivel: 1 },
        ],
        indiceActual: 0,
      },
    });
  }

  it('el resumen del primer eslabón trae solo lo de ese combate', () => {
    cadenaDeDosDePrueba();
    const primero = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1, false);
    expect(primero.recompensas.oro).toBeGreaterThan(0);
    expect(useGameStore.getState().cadenaEnemigos.recompensasAcumuladas.oro)
      .toBe(primero.recompensas.oro);
  });

  it('el resumen del último eslabón trae el TOTAL de la cadena, no solo su combate', () => {
    cadenaDeDosDePrueba();
    const primero = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1, false);
    const oroDelPrimero = primero.recompensas.oro;

    useGameStore.getState().continuarCadena();
    const segundo = useGameStore.getState().ultimoResultadoCombate;

    expect(segundo.recompensas.oro).toBeGreaterThan(oroDelPrimero);
  });

  it('el acumulado muere con la cadena: el combate siguiente empieza de cero', () => {
    cadenaDeDosDePrueba();
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1, false);
    useGameStore.setState({ cadenaEnemigos: null });

    const suelto = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    // Sin cadena no hay acumulado: el resumen es exactamente lo de este combate.
    expect(useGameStore.getState().oro - suelto.recompensas.oro).toBeGreaterThanOrEqual(0);
    expect(suelto.recompensas.objetos).toEqual([]);
  });
});

describe('jugarCombate — transformaciones desbloqueadas', () => {
  // No hay ningún evento de "subir de modo": el modo activo es una función del
  // nivel (`obtenerModoActivo`), así que la única forma de saber que se ha
  // cruzado el umbral es comparar antes y después de aplicar la XP. Si eso se
  // rompe, el jugador nunca vuelve a ver la pantalla de transformación y no salta
  // ningún error — el juego sigue funcionando, solo que en silencio.
  it('detecta el modo que se acaba de desbloquear y en qué personaje', () => {
    const naruto = useGameStore.getState().equipo.find((p) => p.id === 'naruto');
    expect(naruto.nivel).toBe(1); // arranca por debajo de su primer modo

    // XP de sobra para cruzar el nivel de desbloqueo del primer modo.
    const resumen = useGameStore.getState().jugarCombate(
      { ...enemigoDebilDePrueba, recompensa: { xp: 500 } }, 1,
    );

    const deNaruto = resumen.transformacionesDesbloqueadas.find((t) => t.personajeId === 'naruto');
    expect(deNaruto).toBeDefined();
    expect(deNaruto.indiceModo).toBe(0);
  });

  it('no la vuelve a anunciar en el combate siguiente', () => {
    useGameStore.getState().jugarCombate({ ...enemigoDebilDePrueba, recompensa: { xp: 500 } }, 1);
    const segundo = useGameStore.getState().jugarCombate(
      { ...enemigoDebilDePrueba, recompensa: { xp: 20 } }, 1,
    );
    expect(segundo.transformacionesDesbloqueadas.find((t) => t.personajeId === 'naruto')).toBeUndefined();
  });

  it('anota quién ha subido de nivel y a cuál, para que la pantalla lo celebre', () => {
    const antes = useGameStore.getState().equipo.find((p) => p.id === 'naruto').nivel;

    const resumen = useGameStore.getState().jugarCombate(
      { ...enemigoDebilDePrueba, recompensa: { xp: 500 } }, 1,
    );

    const deNaruto = resumen.subidasDeNivel.find((s2) => s2.personajeId === 'naruto');
    expect(deNaruto).toBeDefined();
    expect(deNaruto.nivel).toBeGreaterThan(antes);
    // El banquillo también gana XP, así que también puede subir.
    expect(resumen.subidasDeNivel.length).toBeGreaterThan(1);
  });

  it('sin subir de modo, la lista viene vacía', () => {
    const resumen = useGameStore.getState().jugarCombate(
      { ...enemigoDebilDePrueba, recompensa: { xp: 1 } }, 1,
    );
    expect(resumen.transformacionesDesbloqueadas).toEqual([]);
  });
});

describe('_aplicarVictoria — HP al subir de nivel', () => {
  // El bug que este test existe para que no vuelva: `aplicarXpYActualizarHp` sí
  // sumaba el incremento de vida al subir de nivel, pero para el personaje que
  // había peleado `_aplicarVictoria` pisaba después su hpActual con el HP del
  // final del combate, y el incremento se perdía entero. O sea que el banquillo
  // cobraba la vida del nivel y el que peleaba —el que gana la XP completa y por
  // tanto el que más sube de nivel— no. Invisible en pantalla: la barra sube de
  // máximo y el jugador no tiene forma de saber que le faltan puntos.
  it('el que ha peleado gana la vida del nivel sobre el HP con el que terminó el combate', () => {
    const antes = useGameStore.getState().equipo.find((p) => p.id === 'naruto');
    const hpMaximoAntes = useGameStore.getState().obtenerHpMaximo('naruto');
    const hpFinalDeCombate = Math.round(hpMaximoAntes * 0.5);

    // XP de sobra para garantizar al menos una subida de nivel.
    useGameStore.getState()._aplicarVictoria(
      antes.id,
      hpFinalDeCombate,
      { ...enemigoDebilDePrueba, recompensa: { xp: 500 } },
      new Set(),
    );

    const despues = useGameStore.getState().equipo.find((p) => p.id === 'naruto');
    const hpMaximoDespues = useGameStore.getState().obtenerHpMaximo('naruto');
    expect(despues.nivel).toBeGreaterThan(antes.nivel);
    expect(hpMaximoDespues).toBeGreaterThan(hpMaximoAntes);
    expect(despues.hpActual).toBe(hpFinalDeCombate + (hpMaximoDespues - hpMaximoAntes));
  });

  it('el incremento nunca deja el HP por encima del nuevo máximo', () => {
    const antes = useGameStore.getState().equipo.find((p) => p.id === 'naruto');
    const hpMaximoAntes = useGameStore.getState().obtenerHpMaximo('naruto');

    // Termina el combate a HP lleno: sumar el incremento encima se pasaría.
    useGameStore.getState()._aplicarVictoria(
      antes.id,
      hpMaximoAntes,
      { ...enemigoDebilDePrueba, recompensa: { xp: 500 } },
      new Set(),
    );

    const despues = useGameStore.getState().equipo.find((p) => p.id === 'naruto');
    expect(despues.hpActual).toBe(useGameStore.getState().obtenerHpMaximo('naruto'));
  });
});

describe('_aplicarDerrota (a través de jugarCombate)', () => {
  it('NO cambia el orden del equipo al caer alguien', () => {
    // El orden lo elige el jugador arrastrando (`reordenarEquipo`), así que es
    // suyo y nada puede tocarlo por su cuenta. Antes los caídos se mandaban al
    // final, y era un reorden permanente: la curación de fin de arco los revivía
    // pero ya no devolvía el orden, y el jugador se encontraba su equipo
    // barajado sin haber tocado nada. Salió del playtest.
    useGameStore.getState().reordenarEquipo(['sakura', 'naruto', 'sasuke']);
    useGameStore.getState()._aplicarDerrota('sakura');

    expect(useGameStore.getState().equipo.map((p) => p.id)).toEqual(['sakura', 'naruto', 'sasuke']);
  });

  it('el activo pasa a ser el primero VIVO, que es lo que hacía falta del reorden', () => {
    // La razón por la que el reorden parecía necesario. No lo era:
    // `obtenerPersonajeActivo` ya busca al primero en pie, esté en el índice que
    // esté. "Posición 1" nunca quiso decir índice 0.
    useGameStore.getState()._aplicarDerrota('naruto');

    expect(useGameStore.getState().obtenerPersonajeActivo().id).toBe('sasuke');
  });

  it('marca la run como terminada cuando cae el último', () => {
    for (const id of ['naruto', 'sasuke', 'sakura']) useGameStore.getState()._aplicarDerrota(id);

    expect(useGameStore.getState().runTerminada).toBe(true);
    expect(useGameStore.getState().obtenerPersonajeActivo()).toBeNull();
  });
});

describe('reordenarEquipo', () => {
  it('cambia el orden del equipo según los ids indicados', () => {
    useGameStore.getState().reordenarEquipo(['sakura', 'naruto', 'sasuke']);
    const { equipo } = useGameStore.getState();
    expect(equipo.map((p) => p.id)).toEqual(['sakura', 'naruto', 'sasuke']);
  });
});

// ---------------------------------------------------------------------------
// Eventos (punto 6 — ver documentacion/35-diseño-de-eventos.md)
// ---------------------------------------------------------------------------

/** Planta un evento a mano con las elecciones que haga falta probar. */
function ponerEvento(...efectos) {
  useGameStore.setState({
    eventoActual: {
      id: 'evento_de_prueba',
      titulo: 'Evento de Prueba',
      descripcion: '...',
      elecciones: efectos.map((efecto, i) => ({ texto: `Opción ${i}`, efecto })),
    },
    resultadoEvento: null,
    pantalla: 'evento', // es lo que hace `avanzarANodo` al entrar en el nodo
  });
}

describe('eventos — resolución', () => {
  it('no vuelve al mapa al elegir: deja el resultado a la vista', () => {
    // Desde que una elección puede llevar una tirada, resolver en silencio y
    // devolver al jugador al mapa le escondía justo lo que acababa de apostar.
    ponerEvento({ tipo: 'ganarOro', cantidad: 30 });
    useGameStore.getState().resolverEventoEleccion(0);

    expect(useGameStore.getState().pantalla).toBe('evento');
    expect(useGameStore.getState().resultadoEvento).toMatchObject({ tipo: 'ganarOro', cantidad: 30 });

    useGameStore.getState().cerrarEvento();
    expect(useGameStore.getState().pantalla).toBe('mapa');
    expect(useGameStore.getState().eventoActual).toBeNull();
    expect(useGameStore.getState().resultadoEvento).toBeNull();
  });

  it('un efecto `varios` aplica todas sus partes', () => {
    // Es lo que permite que una opción tenga PRECIO ("ganas XP, pero acabas
    // molido"): sin él, cada elección solo podía dar o solo podía quitar.
    const oroAntes = useGameStore.getState().oro;
    ponerEvento({
      tipo: 'varios',
      efectos: [{ tipo: 'ganarOro', cantidad: 50 }, { tipo: 'perderHpEquipo', porcentaje: 0.2 }],
    });
    useGameStore.getState().resolverEventoEleccion(0);

    expect(useGameStore.getState().oro).toBe(oroAntes + 50);
    useGameStore.getState().equipo.forEach((p) => {
      expect(p.hpActual).toBeLessThan(useGameStore.getState().obtenerHpMaximo(p.id));
    });
  });

  it('una tirada de azar aplica una rama u otra, y cuenta cuál salió', () => {
    const salidas = new Set();
    for (let i = 0; i < 60; i++) {
      useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
      ponerEvento({
        tipo: 'azar',
        probabilidad: 0.5,
        exito: { tipo: 'ganarOro', cantidad: 10 },
        fallo: { tipo: 'perderHpEquipo', porcentaje: 0.1 },
      });
      useGameStore.getState().resolverEventoEleccion(0);
      const { tirada, tipo } = useGameStore.getState().resultadoEvento;
      // La rama aplicada y lo que dice la tirada tienen que ser la misma cosa:
      // si no, el jugador leería "sale bien" y cobraría el castigo.
      expect(tipo).toBe(tirada.salioBien ? 'ganarOro' : 'perderHpEquipo');
      salidas.add(tirada.salioBien);
    }
    expect(salidas.size).toBe(2); // con 60 tiradas al 50% salen las dos
  });

  it('⚠️ un evento NUNCA puede matar a nadie: el HP baja como mucho a 1', () => {
    // Es la condición que hizo aceptable meter azar de verdad. Perder una run por
    // un dado, en un roguelike de runs cortas, no es tensión: es un castigo por
    // jugar. Si algún día alguien "arregla" el suelo de 1, este test cae.
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p) => ({ ...p, hpActual: 1 })),
    }));
    ponerEvento({ tipo: 'perderHpEquipo', porcentaje: 0.9 });
    useGameStore.getState().resolverEventoEleccion(0);

    useGameStore.getState().equipo.forEach((p) => {
      expect(p.hpActual).toBe(1);
      expect(p.derrotado).toBe(false);
    });
    expect(useGameStore.getState().runTerminada).toBe(false);
  });

  it('comprar sin oro suficiente no compra ni cobra, y lo dice', () => {
    useGameStore.setState({ oro: 5 });
    ponerEvento({ tipo: 'comprarObjetoAleatorio', coste: 40 });
    useGameStore.getState().resolverEventoEleccion(0);

    expect(useGameStore.getState().oro).toBe(5);
    expect(useGameStore.getState().inventario).toEqual([]);
    expect(useGameStore.getState().resultadoEvento.tipo).toBe('sinOro');
  });

  it('perder oro sin tenerlo no deja el contador en negativo, y cuenta lo pagado de verdad', () => {
    useGameStore.setState({ oro: 10 });
    ponerEvento({ tipo: 'perderOro', cantidad: 40 });
    useGameStore.getState().resolverEventoEleccion(0);

    expect(useGameStore.getState().oro).toBe(0);
    expect(useGameStore.getState().resultadoEvento.cantidad).toBe(10);
  });
});

describe('eventos — invariantes de los datos', () => {
  const TIPOS_CONOCIDOS = new Set([
    'varios', 'azar', 'curarEquipoPorcentaje', 'perderHpEquipo', 'buffTemporalEquipo',
    'ganarXpEquipo', 'ganarOro', 'perderOro', 'comprarObjetoAleatorio',
    'mejoraPermanenteAleatoria', 'ninguno',
  ]);
  const ARCOS = new Set(['pais_de_las_olas', 'examen_chunin', 'invasion_de_pain']);
  const todosLosEfectos = (efecto) => (
    efecto.tipo === 'varios' ? efecto.efectos.flatMap(todosLosEfectos)
      : efecto.tipo === 'azar' ? [efecto, ...todosLosEfectos(efecto.exito), ...todosLosEfectos(efecto.fallo)]
        : [efecto]
  );

  it('todo efecto declara un tipo que el store sabe aplicar', () => {
    // El fallo que este test evita es el silencioso de siempre: un tipo mal
    // escrito cae en el `default` del switch, no pasa nada, y el evento parece
    // funcionar. Mismo criterio que el catálogo de pasivas.
    eventosData.eventos.forEach((evento) => {
      evento.elecciones.forEach(({ efecto }) => {
        todosLosEfectos(efecto).forEach((e) => {
          expect(TIPOS_CONOCIDOS.has(e.tipo), `${evento.id}: tipo desconocido "${e.tipo}"`).toBe(true);
        });
      });
    });
  });

  it('todo evento pertenece a un arco real y ofrece al menos dos elecciones', () => {
    eventosData.eventos.forEach((evento) => {
      expect(ARCOS.has(evento.arcoId), `${evento.id}: arco "${evento.arcoId}"`).toBe(true);
      expect(evento.elecciones.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('⚠️ ninguna elección es "no pasa nada" de primeras', () => {
    // La regla de diseño del punto 6: un evento es un INTERCAMBIO, no un regalo.
    // "Márchate sin nada" no es una decisión — antes había cuatro opciones así, y
    // eran cuatro botones que nadie iba a pulsar nunca. `ninguno` sigue siendo
    // legítimo DENTRO de una tirada (el mercader se ofende y se va), y por eso el
    // test mira solo el efecto de primer nivel.
    eventosData.eventos.forEach((evento) => {
      evento.elecciones.forEach((eleccion, i) => {
        expect(eleccion.efecto.tipo, `${evento.id}, elección ${i}`).not.toBe('ninguno');
      });
    });
  });

  it('las tiradas declaran una probabilidad de verdad y sus dos ramas', () => {
    eventosData.eventos.forEach((evento) => {
      evento.elecciones.forEach(({ efecto }) => {
        todosLosEfectos(efecto).filter((e) => e.tipo === 'azar').forEach((e) => {
          expect(e.probabilidad, `${evento.id}`).toBeGreaterThan(0);
          expect(e.probabilidad, `${evento.id}`).toBeLessThan(1);
          expect(e.exito, `${evento.id}`).toBeTruthy();
          expect(e.fallo, `${evento.id}`).toBeTruthy();
        });
      });
    });
  });

  it('⚠️ toda apuesta paga MÁS que la opción segura de su propio evento', () => {
    // La regla que faltaba, y que el playtest cazó antes que ningún número: una
    // apuesta tiene que pagar una PRIMA sobre la opción segura, porque la varianza
    // es en sí misma un coste — en un roguelike una mala tirada se arrastra al
    // combate siguiente. Si la apuesta solo empata en valor esperado, nadie la
    // coge, y un botón que nadie pulsa es contenido muerto (es exactamente lo que
    // le pasaba a las opciones `ninguno` de la versión anterior).
    //
    // ⚠️ La tabla de abajo es un MODELO, no una verdad: cuánto vale 1 de XP contra
    // 1 de oro es discutible y depende del arco. Vale para lo que se usa aquí, que
    // es comparar las dos opciones de un MISMO evento entre sí — las dos se miden
    // con la misma vara, así que un error de la tabla se cancela en el cociente.
    // Si alguien cambia la tabla, lo que hay que revisar es el umbral, no borrar
    // el test.
    const VALOR_OBJETO = 55; // media de `precioTienda` de los objetos comprables
    const VALOR_XP = 0.55;
    const VALOR_HP = 0.45; // por punto porcentual de vida del equipo
    const VALOR_MEJORA_PERMANENTE = 90; // dura toda la run y no se consigue de otra forma
    const valor = (e) => {
      switch (e.tipo) {
        case 'varios': return e.efectos.reduce((t, x) => t + valor(x), 0);
        case 'azar': return e.probabilidad * valor(e.exito) + (1 - e.probabilidad) * valor(e.fallo);
        case 'curarEquipoPorcentaje': return e.cantidad * 100 * VALOR_HP;
        case 'perderHpEquipo': return -e.porcentaje * 100 * VALOR_HP;
        case 'ganarXpEquipo': return e.cantidad * VALOR_XP;
        case 'ganarOro': return e.cantidad;
        case 'perderOro': return -e.cantidad;
        case 'comprarObjetoAleatorio': return VALOR_OBJETO - e.coste;
        case 'mejoraPermanenteAleatoria': return VALOR_MEJORA_PERMANENTE;
        case 'buffTemporalEquipo': return ((e.multiplicador - 1) * 100 / 10) * 25;
        default: return 0;
      }
    };

    eventosData.eventos.forEach((evento) => {
      const iApuesta = evento.elecciones.findIndex((o) => o.efecto.tipo === 'azar');
      if (iApuesta === -1) return;
      const apuesta = valor(evento.elecciones[iApuesta].efecto);
      const segura = valor(evento.elecciones[1 - iApuesta].efecto);
      expect(apuesta / segura, `${evento.id}: la apuesta no compensa`).toBeGreaterThanOrEqual(1.2);
    });
  });

  it('el daño de un evento nunca pasa del 25% de la vida', () => {
    // Un evento no mata (el suelo de 1 HP lo garantiza), pero tampoco puede dejar
    // al equipo tan tocado que el siguiente combate esté perdido de antemano. El
    // tope es de diseño y va escrito aquí porque los datos son los que lo pueden
    // romper.
    eventosData.eventos.forEach((evento) => {
      evento.elecciones.forEach(({ efecto }) => {
        todosLosEfectos(efecto).filter((e) => e.tipo === 'perderHpEquipo').forEach((e) => {
          expect(e.porcentaje, `${evento.id}`).toBeLessThanOrEqual(0.25);
        });
      });
    });
  });
});

describe('reiniciarRun', () => {
  it('pone el mapa a null para que App.jsx arranque una run nueva', () => {
    useGameStore.getState().reiniciarRun();
    expect(useGameStore.getState().mapa).toBeNull();
  });
});

describe('irAGameOver', () => {
  it('cambia la pantalla a "gameover" tras la derrota de toda la run', () => {
    useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    expect(useGameStore.getState().runTerminada).toBe(true);

    useGameStore.getState().irAGameOver();
    expect(useGameStore.getState().pantalla).toBe('gameover');
  });

  it('reiniciarRun tras un game over deja el equipo listo para una run nueva', () => {
    useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    useGameStore.getState().irAGameOver();

    useGameStore.getState().reiniciarRun();
    expect(useGameStore.getState().mapa).toBeNull();
    // A elegir personaje, **no al Home**: quien acaba de perder quiere volver a
    // intentarlo, no volver a escoger campaña. El Home tiene su propia salida
    // (`irAlHome`), que es la que pregunta antes porque abandona la run.
    expect(useGameStore.getState().pantalla).toBe('seleccionPersonaje');
  });
});

describe('logros (a través de jugarCombate)', () => {
  it('derrotar a un jefe con logro asociado lo desbloquea, aunque no sea el jefe final del arco', () => {
    useGameStore.getState().jugarCombate(enemigoHakuDePrueba, 1);
    expect(useAchievementsStore.getState().estaDesbloqueado('derrotar_haku')).toBe(true);
    // Haku es el mini-jefe, no el jefe final (zabuza) — no cuenta como arco completado.
    expect(useAchievementsStore.getState().estaDesbloqueado('run_sin_bajas')).toBe(false);
  });

  it('el resumen de combate incluye el logro recién desbloqueado, pero NO lo notifica todavía', () => {
    const resumen = useGameStore.getState().jugarCombate(enemigoHakuDePrueba, 1);
    expect(resumen.logrosDesbloqueados.map((l) => l.id)).toEqual(['derrotar_haku']);
    // La notificación (toast) es responsabilidad de CombatScreen, solo tras
    // terminar la animación — jugarCombate no debe encolarla por su cuenta.
    expect(useAchievementsStore.getState().notificacionesPendientes).toEqual([]);
  });

  it('derrotar al jefe final del arco sin ninguna derrota previa desbloquea "run_sin_bajas"', () => {
    useGameStore.getState().jugarCombate(enemigoZabuzaDePrueba, 1);
    expect(useAchievementsStore.getState().estaDesbloqueado('derrotar_zabuza')).toBe(true);
    expect(useAchievementsStore.getState().estaDesbloqueado('run_sin_bajas')).toBe(true);
  });

  it('si el equipo sufrió una derrota antes, vencer al jefe final NO desbloquea "run_sin_bajas"', () => {
    useGameStore.setState({ huboDerrotaEnEsteArco: true }); // simula una derrota ya sufrida en este arco
    useGameStore.getState().jugarCombate(enemigoZabuzaDePrueba, 1);
    expect(useAchievementsStore.getState().estaDesbloqueado('run_sin_bajas')).toBe(false);
  });

  it('un personaje raro desbloqueado por logro aparece en el pergamino VERDE', () => {
    // Kabuto es `raro` y es el mini-jefe del arco 2, no del que se está jugando
    // aquí: se puede ofrecer sin chocar con la regla de "en su propio arco, no".
    // Los raros comparten pergamino con comunes e iniciales — lo que separa los
    // dos pergaminos es cómo se consigue al ninja, no lo bueno que sea.
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'kabuto' });

    useGameStore.setState({
      mapa: {
        nodos: { reclutar_test: { tipo: 'reclutar', rareza: 'comun', piso: 2, conexiones: [], visitado: false } },
        nodosIniciales: ['reclutar_test'],
      },
      nodoActualId: null,
    });

    // Con equipo de 3 y muchos candidatos comunes, la oferta de 3 puede no
    // sacarlo por azar: lo que se comprueba es que ESTÁ en la pool, así que se
    // deja el equipo en 1 y se repite hasta verlo.
    useGameStore.setState((estado) => ({ equipo: estado.equipo.filter((p) => p.id === 'naruto') }));
    let salioKabuto = false;
    for (let i = 0; i < 60 && !salioKabuto; i += 1) {
      useGameStore.getState().avanzarANodo('reclutar_test');
      const { reclutarActual } = useGameStore.getState();
      expect(reclutarActual.rareza).toBe('comun');
      salioKabuto = reclutarActual.personajes.some((p) => p.personajeId === 'kabuto');
    }
    expect(salioKabuto).toBe(true);
  });

  it('el mini-jefe del arco en curso NO se ofrece como recluta en ese mismo arco', () => {
    // Haku es `raro` y desbloqueable por logro, pero es el mini-jefe del arco 1:
    // reclutarlo aquí sería reclutar a quien te espera en el piso 4. Y con el
    // jefe final la regla no es solo estética — ganarle en un nodo de reclutar
    // habría marcado el arco como completado.
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });

    useGameStore.setState({
      mapa: {
        nodos: { reclutar_test: { tipo: 'reclutar', rareza: 'comun', piso: 2, conexiones: [], visitado: false } },
        nodosIniciales: ['reclutar_test'],
      },
      nodoActualId: null,
    });

    useGameStore.getState().avanzarANodo('reclutar_test');
    const { reclutarActual } = useGameStore.getState();
    expect(reclutarActual.personajes.some((p) => p.personajeId === 'haku')).toBe(false);
  });

  it('los "inicial" no elegidos aparecen en el nodo de reclutar del primer arco', () => {
    useGameStore.setState((estado) => ({ equipo: estado.equipo.filter((p) => p.id === 'naruto') }));
    useGameStore.setState({
      mapa: {
        nodos: { reclutar_test: { tipo: 'reclutar', piso: 2, conexiones: [], visitado: false } },
        nodosIniciales: ['reclutar_test'],
      },
      nodoActualId: null,
    });

    useGameStore.getState().avanzarANodo('reclutar_test');
    const { reclutarActual } = useGameStore.getState();
    const ids = reclutarActual.personajes.map((p) => p.personajeId).sort();
    // Solo hay 2 iniciales no elegidos; el pool devuelve hasta 3 pero aquí solo hay 2.
    expect(ids).toEqual(['sakura', 'sasuke']);
  });

  it('un objeto inicial desbloqueado por logro aparece en el inventario al empezar una run nueva', () => {
    useAchievementsStore.getState().evaluarLogros({
      jefeDerrotadoId: 'zabuza',
      arcoCompletadoId: 'pais_de_las_olas',
      arcoCompletadoSinDerrotas: true,
    });

    useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
    expect(useGameStore.getState().inventario).toContain('sello_chakra');
  });
});

describe('tienda', () => {
  function fijarTiendaDePrueba() {
    useGameStore.setState({
      oro: 1000,
      tiendaActual: {
        items: [
          { id: 'pildora_soldado', precio: 25 },
          { id: 'sello_chakra', precio: 40 },
        ],
      },
    });
  }

  it('comprarItemTienda descuenta el oro y añade el objeto al inventario', () => {
    fijarTiendaDePrueba();
    const oroAntes = useGameStore.getState().oro;
    const exito = useGameStore.getState().comprarItemTienda('pildora_soldado');
    expect(exito).toBe(true);
    expect(useGameStore.getState().inventario).toContain('pildora_soldado');
    expect(useGameStore.getState().oro).toBe(oroAntes - 25);
  });

  it('comprarItemTienda falla si no hay oro suficiente', () => {
    fijarTiendaDePrueba();
    useGameStore.setState({ oro: 0 });
    const exito = useGameStore.getState().comprarItemTienda('pildora_soldado');
    expect(exito).toBe(false);
    expect(useGameStore.getState().inventario).not.toContain('pildora_soldado');
  });

  it('comprarItemTienda elimina el objeto de la oferta tras comprarlo', () => {
    fijarTiendaDePrueba();
    useGameStore.getState().comprarItemTienda('pildora_soldado');
    const { tiendaActual } = useGameStore.getState();
    expect(tiendaActual.items.find((i) => i.id === 'pildora_soldado')).toBeUndefined();
    expect(tiendaActual.items.find((i) => i.id === 'sello_chakra')).toBeDefined(); // el otro sigue
  });

  it('comprarItemTienda falla si el objeto no está en la oferta actual', () => {
    fijarTiendaDePrueba();
    const exito = useGameStore.getState().comprarItemTienda('banda_repuesto');
    expect(exito).toBe(false);
  });
});

describe('nodo de reclutar', () => {
  function fijarReclutarDePrueba() {
    useGameStore.setState({
      reclutarActual: {
        personajes: [
          { personajeId: 'rock_lee', nombre: 'Rock Lee', rareza: 'comun' },
          { personajeId: 'neji', nombre: 'Neji Hyuga', rareza: 'comun' },
        ],
        nivelReclutamiento: 10,
      },
    });
  }

  it('elegirReclutaDeNodo añade al personaje con el nivel de la oferta', () => {
    fijarReclutarDePrueba();
    useGameStore.setState((estado) => ({ equipo: estado.equipo.slice(0, 2) })); // dejar hueco
    const exito = useGameStore.getState().elegirReclutaDeNodo('rock_lee');
    expect(exito).toBe(true);
    const reclutado = useGameStore.getState().equipo.find((p) => p.id === 'rock_lee');
    expect(reclutado.nivel).toBe(10);
  });

  it('elegirReclutaDeNodo no hace nada si el equipo está completo y no se indica reemplazo', () => {
    fijarReclutarDePrueba(); // equipo del beforeEach: 3/3
    const exito = useGameStore.getState().elegirReclutaDeNodo('rock_lee');
    expect(exito).toBe(false);
    expect(useGameStore.getState().equipo.map((p) => p.id)).not.toContain('rock_lee');
  });

  it('elegirReclutaDeNodo con idAReemplazar reemplaza al personaje indicado', () => {
    fijarReclutarDePrueba(); // equipo 3/3: naruto, sasuke, sakura
    const exito = useGameStore.getState().elegirReclutaDeNodo('rock_lee', 'sasuke');
    expect(exito).toBe(true);
    const { equipo } = useGameStore.getState();
    expect(equipo.map((p) => p.id)).toEqual(['naruto', 'rock_lee', 'sakura']);
    expect(equipo).toHaveLength(3);
  });

  it('reemplazar da bonusNivelAlReemplazar de más sobre el nivel de la oferta', () => {
    fijarReclutarDePrueba(); // nivelReclutamiento: 10
    useGameStore.getState().elegirReclutaDeNodo('rock_lee', 'sasuke');
    const reclutado = useGameStore.getState().equipo.find((p) => p.id === 'rock_lee');
    expect(reclutado.nivel).toBe(10 + configGlobal.equipo.bonusNivelAlReemplazar);
  });

  it('elegirReclutaDeNodo falla si el personaje no está en la oferta', () => {
    fijarReclutarDePrueba();
    // Un id que no existe en ningún JSON. Antes ponía 'kakashi', que era un id
    // inventado hasta que Kakashi entró en el juego de verdad: el test seguía
    // pasando (no está en ESA oferta) pero ya no probaba lo que dice su nombre.
    const exito = useGameStore.getState().elegirReclutaDeNodo('ninja_que_no_existe');
    expect(exito).toBe(false);
  });
});

describe('desafío legendario (pergamino dorado)', () => {
  // El arco 1 real tiene a Kakashi en `personajesReclutablesIds`, así que SIEMPRE
  // hay un legendario en la pool. Los tests que necesitan que el único legendario
  // sea el desbloqueado por logro (o que no haya ninguno) arrancan la run con esta
  // copia del arco sin pool propia. Es la alternativa a meter a Kakashi en el
  // equipo para sacarlo del sorteo, que cambiaría el equipo que se está midiendo.
  const arcoSinLegendarioPropio = { ...arcoDePrueba, personajesReclutablesIds: [] };

  function entrarEnNodoDorado() {
    useGameStore.setState({
      mapa: {
        nodos: {
          reclutar_test: {
            tipo: 'reclutar', rareza: 'legendario', piso: 2, conexiones: [], visitado: false,
          },
        },
        nodosIniciales: ['reclutar_test'],
      },
      nodoActualId: null,
    });
    useGameStore.getState().avanzarANodo('reclutar_test');
  }

  it('un pergamino dorado ofrece a UN solo legendario, y como desafío', () => {
    // Gaara es legendario y es el jefe final del arco 2, no del que se juega aquí.
    // Con Kakashi en la pool del arco hay DOS legendarios elegibles, así que el
    // test no puede exigir un id concreto sin volverse aleatorio: lo que garantiza
    // el nodo es que sale **uno solo** y que ese uno es legendario.
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'gaara' });
    entrarEnNodoDorado();

    const { reclutarActual } = useGameStore.getState();
    expect(reclutarActual.rareza).toBe('legendario');
    expect(reclutarActual.esDesafio).toBe(true);
    expect(reclutarActual.personajes).toHaveLength(1);
    expect(reclutarActual.personajes[0].rareza).toBe('legendario');
    expect(reclutarActual.nivelDesafio).toBe(arcoDePrueba.nivelDesafioLegendario);
  });

  it('el arco 1 ofrece un desafío legendario sin ningún logro desbloqueado', () => {
    // La razón de que Kakashi esté en `personajesReclutablesIds` del arco 1: antes
    // el array estaba vacío, los únicos legendarios eran jefes desbloqueados por
    // logro, y el jefe y el mini-jefe del arco en curso están fuera del pool. O
    // sea que en la PRIMERA run el pergamino dorado del arco 1 degradaba siempre.
    entrarEnNodoDorado();

    const { reclutarActual } = useGameStore.getState();
    expect(reclutarActual.rareza).toBe('legendario');
    expect(reclutarActual.esDesafio).toBe(true);
    expect(reclutarActual.personajes[0].personajeId).toBe('kakashi');
  });

  it('sin ningún legendario disponible, el nodo degrada a común en vez de quedarse vacío', () => {
    // Sin logros desbloqueados y sin pool propia del arco no hay ni un legendario:
    // el pergamino dorado del mapa no puede cumplir lo que promete, así que ofrece
    // lo que hay.
    useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoSinLegendarioPropio);
    useGameStore.setState((estado) => ({ equipo: estado.equipo.filter((p) => p.id === 'naruto') }));
    entrarEnNodoDorado();

    const { reclutarActual } = useGameStore.getState();
    expect(reclutarActual.rareza).toBe('comun');
    expect(reclutarActual.esDesafio).toBe(false);
    expect(reclutarActual.personajes.length).toBeGreaterThan(0);
  });

  it('iniciarDesafioLegendario pelea contra el legendario al nivel FIJO del arco', () => {
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'gaara' });
    entrarEnNodoDorado();
    // Quien sale del sorteo se lee de la oferta, no se escribe a mano: hay dos
    // legendarios elegibles y lo que se comprueba es que se pelea contra el que se
    // ha ofrecido, no contra otro.
    const ofrecido = useGameStore.getState().reclutarActual.personajes[0].personajeId;

    const aceptado = useGameStore.getState().iniciarDesafioLegendario();
    expect(aceptado).toBe(true);

    const estado = useGameStore.getState();
    expect(estado.pantalla).toBe('combate');
    expect(estado.desafioRecluta).toEqual({ personajeId: ofrecido });
    // Se ha peleado de verdad: hay un resumen de combate contra él.
    expect(estado.ultimoResultadoCombate.rondas[0].enemigo.id).toBe(ofrecido);
    expect(estado.ultimoResultadoCombate.rondas[0].enemigo.nivel)
      .toBe(arcoDePrueba.nivelDesafioLegendario);
  });

  it('perder el desafío termina la run, como cualquier otro combate', () => {
    // El equipo del beforeEach es de nivel 1 y Gaara pelea a `nivelDesafioLegendario`:
    // pierde las tres rondas. Ese es el riesgo real que hace que el pergamino
    // dorado sea una decisión y no un regalo, y por eso la pantalla lo avisa.
    // Se arranca sin la pool del arco para que el rival sea Gaara y no un sorteo
    // entre él y Kakashi: el margen medido es el suyo (63 de HP base).
    useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoSinLegendarioPropio);
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'gaara' });
    entrarEnNodoDorado();
    useGameStore.getState().iniciarDesafioLegendario();

    const estado = useGameStore.getState();
    expect(estado.ultimoResultadoCombate.jugadorGanoFinal).toBe(false);
    expect(estado.runTerminada).toBe(true);
  });

  it('ganar el desafío deja reclutarlo desde el mismo pergamino', () => {
    // El combate no se juega aquí (a nivel 1 no se le gana a un legendario, ver
    // el test de arriba): lo que se comprueba es el camino de vuelta, que es lo
    // que enlaza `CombatScreen` con la pantalla de reclutar.
    useGameStore.setState({
      reclutarActual: {
        personajes: [{ personajeId: 'gaara', nombre: 'Gaara', rareza: 'legendario' }],
        nivelReclutamiento: 10,
        rareza: 'legendario',
        esDesafio: true,
        nivelDesafio: 6,
      },
      desafioRecluta: { personajeId: 'gaara' },
    });

    useGameStore.getState().irAReclutaDesafio();
    expect(useGameStore.getState().pantalla).toBe('reclutar');
    expect(useGameStore.getState().reclutarActual.desafioGanado).toBe(true);

    useGameStore.getState().elegirReclutaDeNodo('gaara', 'sasuke');
    expect(useGameStore.getState().equipo.map((p) => p.id)).toContain('gaara');
  });

  it('el jefe final del arco en curso nunca puede ser el desafío', () => {
    // Si pudiera, ganarle en un nodo de reclutar habría disparado `arcoCompletado`
    // en jugarCombate y la run habría saltado de arco desde un pergamino.
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'zabuza' });
    entrarEnNodoDorado();

    const { reclutarActual } = useGameStore.getState();
    expect(reclutarActual.personajes.some((p) => p.personajeId === 'zabuza')).toBe(false);
  });
});

describe('nivel de reclutamiento al entrar en un nodo de reclutar', () => {
  it('usa el nivel del personaje más fuerte del equipo, no el nivel fijo del piso', () => {
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p, i) => (i === 0 ? { ...p, nivel: 8 } : p)),
    }));
    useGameStore.setState({
      mapa: {
        nodos: { reclutar_test: { tipo: 'reclutar', piso: 2, conexiones: [], visitado: false } },
        nodosIniciales: ['reclutar_test'],
      },
      nodoActualId: null,
    });

    useGameStore.getState().avanzarANodo('reclutar_test');
    expect(useGameStore.getState().reclutarActual.nivelReclutamiento).toBe(8);
  });
});

describe('equiparObjeto / desequiparObjeto', () => {
  it('equipa un objeto del inventario a un personaje y lo saca del inventario', () => {
    useGameStore.setState({ inventario: ['sello_chakra'] });
    const exito = useGameStore.getState().equiparObjeto('sello_chakra', 'naruto');
    expect(exito).toBe(true);

    const { equipo, inventario } = useGameStore.getState();
    expect(equipo.find((p) => p.id === 'naruto').objetoEquipadoId).toBe('sello_chakra');
    expect(inventario).not.toContain('sello_chakra');
  });

  it('equipar un segundo objeto al mismo personaje devuelve el anterior al inventario', () => {
    useGameStore.setState({ inventario: ['sello_chakra', 'pergamino_reserva'] });
    useGameStore.getState().equiparObjeto('sello_chakra', 'naruto');
    useGameStore.getState().equiparObjeto('pergamino_reserva', 'naruto');

    const { equipo, inventario } = useGameStore.getState();
    expect(equipo.find((p) => p.id === 'naruto').objetoEquipadoId).toBe('pergamino_reserva');
    expect(inventario).toContain('sello_chakra');
    expect(inventario).not.toContain('pergamino_reserva');
  });

  it('falla si el objeto no está en el inventario', () => {
    const exito = useGameStore.getState().equiparObjeto('sello_chakra', 'naruto');
    expect(exito).toBe(false);
  });

  it('falla si el objeto es consumible, no equipable', () => {
    useGameStore.setState({ inventario: ['pildora_soldado'] });
    const exito = useGameStore.getState().equiparObjeto('pildora_soldado', 'naruto');
    expect(exito).toBe(false);
    expect(useGameStore.getState().inventario).toContain('pildora_soldado');
  });

  it('desequiparObjeto lo devuelve al inventario y limpia el hueco', () => {
    useGameStore.setState({ inventario: ['sello_chakra'] });
    useGameStore.getState().equiparObjeto('sello_chakra', 'naruto');

    const exito = useGameStore.getState().desequiparObjeto('naruto');
    expect(exito).toBe(true);

    const { equipo, inventario } = useGameStore.getState();
    expect(equipo.find((p) => p.id === 'naruto').objetoEquipadoId).toBeNull();
    expect(inventario).toContain('sello_chakra');
  });

  it('desequiparObjeto falla si el personaje no lleva nada equipado', () => {
    const exito = useGameStore.getState().desequiparObjeto('naruto');
    expect(exito).toBe(false);
  });

  // Los objetos YA NO dan stats: desde el rediseño de balance dan pasivas, que
  // cambian reglas en vez de engordar los cuatro números de siempre. Un bonus
  // plano se diluye con el nivel (un +4 de ataque contra 80 es ruido), y era la
  // razón de que los objetos aportaran ~1,5% del poder de una run.
  it('el objeto equipado NO cambia las stats del personaje', () => {
    const hpAntes = useGameStore.getState().obtenerHpMaximo('naruto');
    useGameStore.setState({ inventario: ['pergamino_reserva'] });
    useGameStore.getState().equiparObjeto('pergamino_reserva', 'naruto');
    expect(useGameStore.getState().obtenerHpMaximo('naruto')).toBe(hpAntes);
  });

  // El de verdad: que las pasivas del objeto lleguen al motor y hagan algo en un
  // combate real. `semilla_sabio` cura al rematar, así que quien la lleve debe
  // terminar la pelea con más HP que quien no.
  it('las pasivas del objeto equipado llegan al combate', () => {
    const hpMaximo = useGameStore.getState().obtenerHpMaximo('naruto');
    const hpDePartida = Math.round(hpMaximo * 0.5);

    useGameStore.setState({
      equipo: useGameStore.getState().equipo.map((p) => (p.id === 'naruto' ? { ...p, hpActual: hpDePartida } : p)),
    });
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    const sinObjeto = useGameStore.getState().equipo.find((p) => p.id === 'naruto').hpActual;

    useGameStore.getState().iniciarRun(['naruto', 'sasuke', 'sakura'], arcoDePrueba);
    useGameStore.setState({
      inventario: ['semilla_sabio'],
      equipo: useGameStore.getState().equipo.map((p) => (p.id === 'naruto' ? { ...p, hpActual: hpDePartida } : p)),
    });
    useGameStore.getState().equiparObjeto('semilla_sabio', 'naruto');
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    const conObjeto = useGameStore.getState().equipo.find((p) => p.id === 'naruto').hpActual;

    expect(conObjeto).toBeGreaterThan(sinObjeto);
  });
});

describe('reclutarPersonaje — el objeto equipado del reemplazado vuelve al inventario', () => {
  it('al reemplazar a alguien con algo equipado, el objeto no se pierde', () => {
    useGameStore.setState({ inventario: ['sello_chakra'] });
    useGameStore.getState().equiparObjeto('sello_chakra', 'sasuke');

    // El equipo del beforeEach ya está 3/3, así que esto entra por la vía de reemplazo.
    const exito = useGameStore.getState().reclutarPersonaje('rock_lee', 5, 'sasuke');
    expect(exito).toBe(true);

    const { inventario, equipo } = useGameStore.getState();
    expect(inventario).toContain('sello_chakra');
    expect(equipo.find((p) => p.id === 'rock_lee').objetoEquipadoId).toBeNull();
  });
});

describe('revivirUnaVez (equipado) — a través de _aplicarDerrota', () => {
  it('revive con el HP indicado por el objeto y lo consume (no vuelve al inventario)', () => {
    useGameStore.setState({ inventario: ['banda_repuesto'] });
    useGameStore.getState().equiparObjeto('banda_repuesto', 'naruto');

    useGameStore.getState()._aplicarDerrota('naruto');

    const { equipo, inventario, runTerminada } = useGameStore.getState();
    const naruto = equipo.find((p) => p.id === 'naruto');
    expect(naruto.derrotado).toBe(false);
    expect(naruto.hpActual).toBe(1);
    expect(naruto.objetoEquipadoId).toBeNull();
    expect(inventario).not.toContain('banda_repuesto');
    expect(runTerminada).toBe(false);
  });

  it('una vez consumido, la siguiente derrota del mismo personaje es normal', () => {
    useGameStore.setState({ inventario: ['banda_repuesto'] });
    useGameStore.getState().equiparObjeto('banda_repuesto', 'naruto');
    useGameStore.getState()._aplicarDerrota('naruto'); // revive, consume el objeto
    useGameStore.getState()._aplicarDerrota('naruto'); // esta vez cae de verdad

    const naruto = useGameStore.getState().equipo.find((p) => p.id === 'naruto');
    expect(naruto.derrotado).toBe(true);
    expect(naruto.hpActual).toBe(0);
  });

  it('dentro de un combate perdido revive UNA sola vez, no una por ronda', () => {
    // Por la vía real (`jugarCombate`, no `_aplicarDerrota` a mano): el que
    // revive vuelve a entrar contra el mismo enemigo, así que pelea dos rondas
    // seguidas. Lo que no puede es revivir en las dos.
    useGameStore.setState({ inventario: ['banda_repuesto'] });
    useGameStore.getState().equiparObjeto('banda_repuesto', 'naruto');

    const resultado = useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);

    const rondasDeNaruto = resultado.rondas.filter((r) => r.jugador.id === 'naruto');
    expect(rondasDeNaruto).toHaveLength(2); // la suya y la que le da el objeto
    expect(rondasDeNaruto[1].jugador.hpInicial).toBe(1); // vuelve con el HP del objeto
    expect(useGameStore.getState().equipo.find((p) => p.id === 'naruto').derrotado).toBe(true);
    expect(useGameStore.getState().runTerminada).toBe(true);
  });
});

describe('heal_after_battle (pasiva de objeto) — a través de _aplicarVictoria', () => {
  it('cura un % extra a quien lo lleva equipado, además de su HP final de combate', () => {
    useGameStore.setState({ inventario: ['pergamino_reserva'] });
    useGameStore.getState().equiparObjeto('pergamino_reserva', 'naruto');

    const hpMaximo = useGameStore.getState().obtenerHpMaximo('naruto');
    const hpFinalBajo = Math.round(hpMaximo * 0.3); // terminó el combate con poco HP
    useGameStore.getState()._aplicarVictoria('naruto', hpFinalBajo, enemigoDebilDePrueba, new Set());

    const naruto = useGameStore.getState().equipo.find((p) => p.id === 'naruto');
    expect(naruto.hpActual).toBeGreaterThan(hpFinalBajo);
  });
});

describe('usarConsumible', () => {
  it('cura un % de HP, revive si estaba derrotado, y gasta 1 copia del objeto', () => {
    useGameStore.setState((estado) => ({
      inventario: ['pildora_soldado'],
      equipo: estado.equipo.map((p) => (p.id === 'sasuke' ? { ...p, derrotado: true, hpActual: 0 } : p)),
    }));

    const exito = useGameStore.getState().usarConsumible('pildora_soldado', 'sasuke');
    expect(exito).toBe(true);

    const { equipo, inventario } = useGameStore.getState();
    const sasuke = equipo.find((p) => p.id === 'sasuke');
    expect(sasuke.derrotado).toBe(false);
    expect(sasuke.hpActual).toBeGreaterThan(0);
    expect(inventario).not.toContain('pildora_soldado');
  });

  it('falla si el objeto no está en el inventario', () => {
    const exito = useGameStore.getState().usarConsumible('pildora_soldado', 'naruto');
    expect(exito).toBe(false);
  });

  it('falla si el objeto es equipable, no consumible', () => {
    useGameStore.setState({ inventario: ['sello_chakra'] });
    const exito = useGameStore.getState().usarConsumible('sello_chakra', 'naruto');
    expect(exito).toBe(false);
  });
});


describe('buffs temporales — la foto para la pantalla de combate', () => {
  // ⚠️ La misma trampa que ya obligó a `equipoAlEmpezar`: `_consumirUsoBuffsTemporales`
  // corre ANTES de armar el resumen, así que para cuando `CombatScreen` se monta el
  // store ya ha gastado el uso de este combate. Si la pantalla leyera el store en vivo
  // enseñaría "ATK +20% ×2" mientras se ve la pelea que consumió el ×3 — o nada, si a
  // este combate le tocaba el último uso.
  beforeEach(() => {
    useGameStore.setState({
      buffsTemporales: [{ multiplicadores: { ataque: 1.2 }, combatesRestantes: 3 }],
    });
  });

  it('el resumen lleva los buffs VIGENTES durante el combate, no los que quedan después', () => {
    const resumen = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1, true);

    expect(resumen.buffsAlEmpezar).toHaveLength(1);
    expect(resumen.buffsAlEmpezar[0].combatesRestantes).toBe(3);
    // El store, en cambio, ya lo ha gastado.
    expect(useGameStore.getState().buffsTemporales[0].combatesRestantes).toBe(2);
  });

  it('y sigue estando en el resumen aunque el combate lo agote del todo', () => {
    // El caso peor: con 1 uso restante, leer el store desde la UI no enseñaría NADA
    // durante la única pelea en la que el buff estaba haciendo algo.
    useGameStore.setState({
      buffsTemporales: [{ multiplicadores: { ataque: 1.2 }, combatesRestantes: 1 }],
    });

    const resumen = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1, true);

    expect(resumen.buffsAlEmpezar[0].combatesRestantes).toBe(1);
    expect(useGameStore.getState().buffsTemporales).toEqual([]);
  });

  it('es una copia: gastar el buff no cambia lo que ya viajó en el resumen', () => {
    const resumen = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1, true);
    useGameStore.getState()._consumirUsoBuffsTemporales();
    expect(resumen.buffsAlEmpezar[0].combatesRestantes).toBe(3);
  });

  it('sin buffs, el resumen trae una lista vacía y no undefined', () => {
    useGameStore.setState({ buffsTemporales: [] });
    const resumen = useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1, true);
    expect(resumen.buffsAlEmpezar).toEqual([]);
  });
});

describe('registro de vistos para la enciclopedia', () => {
  const vistos = () => useAchievementsStore.getState().vistos;

  it('iniciarRun apunta el equipo inicial', () => {
    // El beforeEach ya ha llamado a iniciarRun con los tres.
    expect(vistos().personajes).toEqual(['naruto', 'sasuke', 'sakura']);
  });

  it('jugarCombate apunta al enemigo peleado, que no queda en el estado', () => {
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    expect(vistos().enemigos).toContain('enemigo_debil_test');
  });

  it('apunta al enemigo aunque se PIERDA el combate', () => {
    // Verlo es verlo: perder no borra que te lo has encontrado. Y este es el
    // caso que un gancho puesto en la rama de victoria se habría comido.
    useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 50);
    expect(vistos().enemigos).toContain('enemigo_imbatible_test');
  });

  it('apunta el modo con el que peleó un personaje, no el que tenga ahora', () => {
    // Naruto desbloquea su primer modo a nivel 5 (characters.json). Se le sube
    // antes de pelear para que entre ya transformado.
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p) => (p.id === 'naruto' ? { ...p, nivel: 6 } : p)),
    }));
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    expect(vistos().modos).toContain('naruto_0');
  });

  it('no apunta un modo que el personaje todavía no tiene', () => {
    useGameStore.getState().jugarCombate(enemigoDebilDePrueba, 1);
    expect(vistos().modos).toEqual([]);
  });

  it('reclutarPersonaje apunta al que entra', () => {
    useGameStore.getState().reclutarPersonaje('rock_lee', 5, 'sasuke');
    expect(vistos().personajes).toContain('rock_lee');
  });

  it('comprar en la tienda apunta el objeto', () => {
    useGameStore.setState({
      oro: 999,
      tiendaActual: { items: [{ id: 'sello_chakra', precio: 40 }] },
    });
    useGameStore.getState().comprarItemTienda('sello_chakra');
    expect(vistos().objetos).toContain('sello_chakra');
  });

  it('recoger la recompensa del mini-jefe apunta el objeto', () => {
    useGameStore.setState({ recompensaMiniJefe: { item: 'kubikiribocho_fragmento' } });
    useGameStore.getState().reclamarRecompensaMiniJefe();
    expect(vistos().objetos).toContain('kubikiribocho_fragmento');
  });

  it('abrirEnciclopedia apunta de red de seguridad lo que haya en la mochila', () => {
    // La vía de escape para cuando algo entra en el inventario por un camino sin
    // gancho propio: al abrir la pantalla se apunta lo que el jugador tiene.
    useGameStore.setState({ inventario: ['pergamino_viento'] });
    useGameStore.getState().abrirEnciclopedia();

    expect(useGameStore.getState().pantalla).toBe('enciclopedia');
    expect(vistos().objetos).toContain('pergamino_viento');
  });

  it('apunta también el objeto equipado, que no está en el inventario', () => {
    useGameStore.setState({ inventario: ['semilla_sabio'] });
    useGameStore.getState().equiparObjeto('semilla_sabio', 'naruto');
    useGameStore.getState().abrirEnciclopedia();
    expect(vistos().objetos).toContain('semilla_sabio');
  });
});

// ---------------------------------------------------------------------------
// Contadores de meta-progresión (punto 5a). Lo que se prueba aquí no es el
// contador —eso es del store de logros— sino **los enganches**: que cada cosa se
// cuente en el sitio donde ocurre de verdad, y una sola vez.
// ---------------------------------------------------------------------------

describe('contadores de logros — enganches', () => {
  const contadores = () => useAchievementsStore.getState().contadores;

  it('ganar un combate cuenta UNO, aunque haya hecho falta relevar a todo el equipo', () => {
    // ⚠️ Una cadena de rondas es UN combate. Contar por ronda inflaría el
    // contador ~2× y ningún test de combate lo habría cazado.
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p, i) => (i < 2 ? { ...p, hpActual: 1 } : p)),
    }));
    useGameStore.getState().jugarCombate(enemigoHakuDePrueba, 1);

    expect(contadores().combatesGanados).toBe(1);
  });

  it('el oro de un combate ganado se suma a lo GANADO en total', () => {
    useGameStore.getState().jugarCombate(enemigoHakuDePrueba, 1);
    expect(contadores().oroGanado).toBeGreaterThan(0);
  });

  it('perder la run cuenta una caída', () => {
    useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    expect(contadores().runsPerdidas).toBe(1);
    expect(contadores().combatesGanados).toBe(0);
  });

  it('reclutar cuenta, tanto en hueco libre como reemplazando', () => {
    useGameStore.setState((estado) => ({ equipo: estado.equipo.slice(0, 2) }));
    useGameStore.getState().reclutarPersonaje('rock_lee', 5);
    expect(contadores().reclutas).toBe(1);

    useGameStore.getState().reclutarPersonaje('neji', 5, 'rock_lee');
    expect(contadores().reclutas).toBe(2);
  });

  it('comprar en la tienda cuenta un objeto comprado', () => {
    useGameStore.setState({ oro: 1000, tiendaActual: { items: [{ id: 'pildora_soldado', precio: 25 }] } });
    useGameStore.getState().comprarItemTienda('pildora_soldado');
    expect(contadores().objetosComprados).toBe(1);
  });

  it('resolver un evento cuenta, salga bien o mal la tirada', () => {
    ponerEvento({ tipo: 'perderOro', cantidad: 10 });
    useGameStore.getState().resolverEventoEleccion(0);
    expect(contadores().eventosResueltos).toBe(1);
  });

  it('el oro de un evento también entra en el total ganado', () => {
    ponerEvento({ tipo: 'ganarOro', cantidad: 30 });
    useGameStore.getState().resolverEventoEleccion(0);
    expect(contadores().oroGanado).toBe(30);
  });

  it('abrir la pantalla de logros evalúa lo ya acumulado (red de seguridad)', () => {
    // El caso real: el logro se añade DESPUÉS de que el jugador tenga el progreso.
    // Sin esta evaluación al abrir, la tarjeta enseñaba la barra llena y "Locked"
    // al lado hasta el siguiente combate — el juego diciendo dos cosas contrarias.
    useAchievementsStore.getState().sumarContadores({ combatesGanados: 10 });
    expect(useAchievementsStore.getState().estaDesbloqueado('combates_10')).toBe(false);

    useGameStore.getState().abrirLogros();
    expect(useAchievementsStore.getState().estaDesbloqueado('combates_10')).toBe(true);
    // Y en silencio: el jugador está mirando la lista, la fila cambiando a
    // "Unlocked" delante de él ES el aviso.
    expect(useAchievementsStore.getState().notificacionesPendientes).toEqual([]);
  });

  it('un logro de contador que salta fuera de combate se notifica en el acto', () => {
    // Fuera de combate no hay animación que respetar, así que el toast puede
    // salir ya. En combate NO: los logros viajan en el resumen y los notifica
    // CombatScreen al terminar, para no tapar lo que los ha provocado.
    useAchievementsStore.getState().sumarContadores({ eventosResueltos: 19 });
    ponerEvento({ tipo: 'ninguno' });
    useGameStore.getState().resolverEventoEleccion(0);

    const notificados = useAchievementsStore.getState().notificacionesPendientes.map((l) => l.id);
    expect(notificados).toContain('eventos_20');
  });
});

// ---------------------------------------------------------------------------
// Home y campañas (punto 18). Lo que se prueba es que la campaña DECIDE los arcos:
// hasta ahora esa lista era una constante del store, y ese es justo el cambio.
// ---------------------------------------------------------------------------

describe('campañas', () => {
  it('arranca en el Home, que es la puerta del juego', () => {
    useGameStore.setState({ mapa: null, pantalla: 'home' });
    expect(useGameStore.getState().pantalla).toBe('home');
  });

  it('elegirCampana la guarda y pasa a escoger personaje', () => {
    useGameStore.getState().elegirCampana('camino_ninja');
    expect(useGameStore.getState().campanaActualId).toBe('camino_ninja');
    expect(useGameStore.getState().pantalla).toBe('seleccionPersonaje');
  });

  it('iniciarRun sin arco explícito empieza por el PRIMER arco de la campaña elegida', () => {
    useGameStore.getState().elegirCampana('camino_ninja');
    useGameStore.getState().iniciarRun(['naruto']);
    expect(useGameStore.getState().arcoActualId).toBe('pais_de_las_olas');
  });

  it('avanzarSiguienteArco sigue el orden que declara la campaña', () => {
    useGameStore.getState().elegirCampana('camino_ninja');
    useGameStore.getState().iniciarRun(['naruto']);
    expect(useGameStore.getState().avanzarSiguienteArco()).toBe(true);
    expect(useGameStore.getState().arcoActualId).toBe('examen_chunin');
  });

  it('irAlHome abandona la run: sin mapa y de vuelta al Home', () => {
    useGameStore.getState().irAlHome();
    expect(useGameStore.getState().mapa).toBeNull();
    expect(useGameStore.getState().pantalla).toBe('home');
  });

  it('sin run, volverAlMapa lleva al Home y no a un mapa que no existe', () => {
    // Missions, Bingo Book y Ajustes se cierran con `volverAlMapa`, y desde el Home
    // se pueden abrir sin haber empezado ninguna partida: cerrarlos dejaba la
    // pantalla en blanco.
    useGameStore.getState().irAlHome();
    useGameStore.getState().abrirLogros();
    useGameStore.getState().volverAlMapa();
    expect(useGameStore.getState().pantalla).toBe('home');
  });
});

describe('marca de hasta dónde se llegó — enganche', () => {
  it('avanzar a un nodo apunta el arco y el piso', () => {
    const { mapa } = useGameStore.getState();
    // Un nodo cualquiera del piso 2, que es el primero jugable.
    const nodoDelPiso2 = Object.values(mapa.nodos).find((n) => n.piso === 2);
    useGameStore.getState().avanzarANodo(nodoDelPiso2.id);

    const { marca } = useAchievementsStore.getState();
    expect(marca.arcoId).toBe('pais_de_las_olas');
    expect(marca.orden).toBe(0); // primer arco de la campaña
    expect(marca.piso).toBe(2);
  });

  it('empezar una run nueva NO borra la marca: es meta-progresión', () => {
    useAchievementsStore.getState().registrarMarca({ arcoId: 'invasion_de_pain', orden: 2, piso: 5 });
    useGameStore.getState().iniciarRun(['naruto'], arcoDePrueba);
    expect(useAchievementsStore.getState().marca.arcoId).toBe('invasion_de_pain');
  });
});

describe('salidas del game over', () => {
  it('irAlHome desde el game over deja el juego listo para elegir campaña', () => {
    // La otra salida de esa pantalla, además de "New Run". Sin ella, quien acababa de
    // desbloquear un logro no tenía forma de ir a verlo.
    useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    useGameStore.getState().irAGameOver();

    useGameStore.getState().irAlHome();
    expect(useGameStore.getState().pantalla).toBe('home');
    expect(useGameStore.getState().mapa).toBeNull();
    expect(useGameStore.getState().runTerminada).toBe(true); // lo limpia iniciarRun, no salir
  });
});
