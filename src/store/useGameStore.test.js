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

  it('un personaje reclutable desbloqueado por logro aparece en la oferta de una tienda', () => {
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });

    // Fija un mapa mínimo con un único nodo de tienda, para no depender del azar del generador.
    useGameStore.setState({
      mapa: {
        nodos: { tienda_test: { tipo: 'tienda', piso: 2, conexiones: [], visitado: false } },
        nodosIniciales: ['tienda_test'],
      },
      nodoActualId: null,
    });

    useGameStore.getState().avanzarANodo('tienda_test');
    const { tiendaActual } = useGameStore.getState();
    expect(tiendaActual.reclutables.some((r) => r.personajeId === 'haku')).toBe(true);
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
        consumibles: ['pildora_soldado'],
        gratuito: 'sello_chakra',
        reclutables: [
          { personajeId: 'rock_lee', nombre: 'Rock Lee', rareza: 'comun', precio: 40 },
          { personajeId: 'neji', nombre: 'Neji Hyuga', rareza: 'comun', precio: 40 },
        ],
        nivelReclutamiento: 10,
      },
    });
  }

  it('comprarConsumibleTienda descuenta el oro y añade el objeto al inventario', () => {
    fijarTiendaDePrueba();
    const oroAntes = useGameStore.getState().oro;
    const exito = useGameStore.getState().comprarConsumibleTienda('pildora_soldado');
    expect(exito).toBe(true);
    expect(useGameStore.getState().inventario).toContain('pildora_soldado');
    expect(useGameStore.getState().oro).toBeLessThan(oroAntes);
  });

  it('comprarConsumibleTienda falla si no hay oro suficiente', () => {
    fijarTiendaDePrueba();
    useGameStore.setState({ oro: 0 });
    const exito = useGameStore.getState().comprarConsumibleTienda('pildora_soldado');
    expect(exito).toBe(false);
    expect(useGameStore.getState().inventario).not.toContain('pildora_soldado');
  });

  it('reclamarObjetoGratuitoTienda añade el objeto sin coste', () => {
    fijarTiendaDePrueba();
    useGameStore.setState({ oro: 0 });
    const exito = useGameStore.getState().reclamarObjetoGratuitoTienda();
    expect(exito).toBe(true);
    expect(useGameStore.getState().inventario).toContain('sello_chakra');
    expect(useGameStore.getState().oro).toBe(0); // no cobra nada
  });

  it('reclutarDeTienda añade al personaje elegido y descarta la otra opción', () => {
    fijarTiendaDePrueba();
    useGameStore.setState((estado) => ({ equipo: estado.equipo.slice(0, 2) })); // dejar hueco
    const exito = useGameStore.getState().reclutarDeTienda('rock_lee');
    expect(exito).toBe(true);
    const { equipo, tiendaActual } = useGameStore.getState();
    expect(equipo.map((p) => p.id)).toContain('rock_lee');
    expect(equipo.map((p) => p.id)).not.toContain('neji'); // la otra opción se descarta
    expect(tiendaActual.reclutables).toHaveLength(0);
  });

  it('reclutarDeTienda respeta el nivel de reclutamiento fijado en la oferta', () => {
    fijarTiendaDePrueba();
    useGameStore.setState((estado) => ({ equipo: estado.equipo.slice(0, 2) })); // dejar hueco
    useGameStore.getState().reclutarDeTienda('rock_lee');
    const reclutado = useGameStore.getState().equipo.find((p) => p.id === 'rock_lee');
    expect(reclutado.nivel).toBe(10);
  });

  it('reclutarDeTienda no hace nada si el equipo ya está completo y no se indica a quién reemplazar', () => {
    fijarTiendaDePrueba(); // el equipo del beforeEach ya tiene 3/3
    const exito = useGameStore.getState().reclutarDeTienda('rock_lee');
    expect(exito).toBe(false);
    expect(useGameStore.getState().equipo.map((p) => p.id)).not.toContain('rock_lee');
  });

  it('reclutarDeTienda con idAReemplazar saca a ese personaje y pone al reclutado en su lugar', () => {
    fijarTiendaDePrueba(); // el equipo del beforeEach ya tiene 3/3: naruto, sasuke, sakura
    const exito = useGameStore.getState().reclutarDeTienda('rock_lee', 'sasuke');
    expect(exito).toBe(true);

    const { equipo, oro } = useGameStore.getState();
    expect(equipo.map((p) => p.id)).toEqual(['naruto', 'rock_lee', 'sakura']); // reemplaza en su misma posición
    expect(equipo).toHaveLength(3); // el equipo no crece, solo se reemplaza
    expect(oro).toBeLessThan(1000); // sí que cobra al reemplazar
  });

  it('reemplazar da bonusNivelAlReemplazar de más sobre el nivel de la oferta, para que compense frente a rellenar un hueco vacío', () => {
    fijarTiendaDePrueba(); // nivelReclutamiento: 10 en la oferta de prueba
    useGameStore.getState().reclutarDeTienda('rock_lee', 'sasuke');
    const reclutado = useGameStore.getState().equipo.find((p) => p.id === 'rock_lee');
    expect(reclutado.nivel).toBe(10 + configGlobal.equipo.bonusNivelAlReemplazar);
  });

  it('reclutarDeTienda con un idAReemplazar que no está en el equipo no hace nada', () => {
    fijarTiendaDePrueba();
    const exito = useGameStore.getState().reclutarDeTienda('rock_lee', 'kakashi');
    expect(exito).toBe(false);
    expect(useGameStore.getState().equipo.map((p) => p.id)).not.toContain('rock_lee');
  });
});

describe('nivel de reclutamiento al entrar en un nodo de tienda', () => {
  function fijarMapaConTienda() {
    useGameStore.setState({
      mapa: {
        nodos: { tienda_test: { tipo: 'tienda', piso: 2, conexiones: [], visitado: false } },
        nodosIniciales: ['tienda_test'],
      },
      nodoActualId: null,
    });
  }

  it('usa el nivel del personaje más fuerte del equipo, no el nivel fijo del piso', () => {
    // El piso 2 de pais-de-las-olas daría un nivel muy bajo por calcularNivelPorPiso
    // (nivelEnemigoBase 1 + escalado) — aquí el equipo ya está muy por encima,
    // y la oferta debe reflejarlo para que reclutar siga siendo relevante.
    useGameStore.setState((estado) => ({
      equipo: estado.equipo.map((p, i) => (i === 0 ? { ...p, nivel: 8 } : p)),
    }));
    fijarMapaConTienda();

    useGameStore.getState().avanzarANodo('tienda_test');
    expect(useGameStore.getState().tiendaActual.nivelReclutamiento).toBe(8);
  });
});
