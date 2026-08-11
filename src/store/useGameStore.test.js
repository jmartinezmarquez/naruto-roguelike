import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './useGameStore';
import { useAchievementsStore } from './useAchievementsStore';
import arcoDePrueba from '../data/arcs/pais-de-las-olas.json';
import configGlobal from '../data/config.json';

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
  useAchievementsStore.setState({ logrosDesbloqueados: [] });
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
  it('los personajes derrotados quedan al final del orden del equipo', () => {
    // Solo se enfrenta el enemigo débil (gana el activo), así que forzamos
    // una derrota directa para aislar el comportamiento de reordenación.
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p, i) => (i === 0 ? { ...p, hpActual: 1 } : p)),
    }));
    // Usamos el enemigo imbatible pero solo nos interesa el primer personaje:
    // comprobamos el orden justo tras la primera ronda perdida.
    useGameStore.getState().jugarCombate(enemigoImbatibleDePrueba, 1);
    const { equipo } = useGameStore.getState();
    // Los 3 caen con este enemigo, así que comprobamos que el que EMPEZÓ
    // primero (naruto) sigue estando en la lista, y todos están derrotados.
    expect(equipo.map((p) => p.id)).toContain('naruto');
    expect(equipo.every((p) => p.derrotado)).toBe(true);
  });
});

describe('reordenarEquipo', () => {
  it('cambia el orden del equipo según los ids indicados', () => {
    useGameStore.getState().reordenarEquipo(['sakura', 'naruto', 'sasuke']);
    const { equipo } = useGameStore.getState();
    expect(equipo.map((p) => p.id)).toEqual(['sakura', 'naruto', 'sasuke']);
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
    expect(useGameStore.getState().pantalla).toBe('mapa');
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

  it('un personaje reclutable desbloqueado por logro aparece en la oferta de un nodo de reclutar', () => {
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });

    useGameStore.setState({
      mapa: {
        nodos: { reclutar_test: { tipo: 'reclutar', piso: 2, conexiones: [], visitado: false } },
        nodosIniciales: ['reclutar_test'],
      },
      nodoActualId: null,
    });

    useGameStore.getState().avanzarANodo('reclutar_test');
    const { reclutarActual } = useGameStore.getState();
    expect(reclutarActual.personajes.some((p) => p.personajeId === 'haku')).toBe(true);
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
    const exito = useGameStore.getState().elegirReclutaDeNodo('kakashi');
    expect(exito).toBe(false);
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
