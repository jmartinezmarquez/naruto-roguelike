import { describe, it, expect, beforeEach } from 'vitest';
import { useAchievementsStore, VISTOS_VACIO } from './useAchievementsStore';

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({
    logrosDesbloqueados: [], notificacionesPendientes: [], vistos: VISTOS_VACIO,
  });
});

describe('evaluarLogros', () => {
  it('desbloquea "derrotar_haku" al derrotar a Haku y lo persiste', () => {
    const nuevos = useAchievementsStore.getState().evaluarLogros({
      jefeDerrotadoId: 'haku',
      arcoCompletadoId: null,
      arcoCompletadoSinDerrotas: false,
    });

    expect(nuevos.map((l) => l.id)).toEqual(['derrotar_haku']);
    expect(useAchievementsStore.getState().logrosDesbloqueados).toContain('derrotar_haku');
    expect(localStorage.getItem('naruto-roguelike-logros')).toContain('derrotar_haku');
  });

  it('no desbloquea nada si el jefe derrotado no tiene logro asociado', () => {
    const nuevos = useAchievementsStore.getState().evaluarLogros({
      jefeDerrotadoId: 'enemigo_comun_cualquiera',
      arcoCompletadoId: null,
      arcoCompletadoSinDerrotas: false,
    });
    expect(nuevos).toHaveLength(0);
  });

  it('no vuelve a desbloquear un logro ya conseguido en una evaluación posterior', () => {
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });
    const segundaVez = useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });
    expect(segundaVez).toHaveLength(0);
  });
});

describe('estaDesbloqueado', () => {
  it('refleja el estado tras desbloquear un logro', () => {
    expect(useAchievementsStore.getState().estaDesbloqueado('derrotar_haku')).toBe(false);
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });
    expect(useAchievementsStore.getState().estaDesbloqueado('derrotar_haku')).toBe(true);
  });
});

describe('notificar / notificacionesPendientes', () => {
  it('evaluarLogros NO encola notificación por sí solo — desbloquea y persiste, pero no avisa', () => {
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });
    expect(useAchievementsStore.getState().notificacionesPendientes).toEqual([]);
  });

  it('notificar encola los logros indicados para el toast', () => {
    const nuevos = useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });
    useAchievementsStore.getState().notificar(nuevos);

    const { notificacionesPendientes } = useAchievementsStore.getState();
    expect(notificacionesPendientes.map((l) => l.id)).toEqual(['derrotar_haku']);
  });

  it('descartarNotificacion quita solo la más antigua de la cola', () => {
    const haku = useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });
    const zabuza = useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'zabuza' });
    useAchievementsStore.getState().notificar([...haku, ...zabuza]);

    useAchievementsStore.getState().descartarNotificacion();
    const { notificacionesPendientes } = useAchievementsStore.getState();
    expect(notificacionesPendientes.map((l) => l.id)).toEqual(['derrotar_zabuza']);
  });
});

describe('reiniciarLogros (botón temporal de desarrollo)', () => {
  it('vacía los logros desbloqueados, la cola de notificaciones y lo persistido', () => {
    useAchievementsStore.getState().evaluarLogros({ jefeDerrotadoId: 'haku' });

    useAchievementsStore.getState().reiniciarLogros();

    expect(useAchievementsStore.getState().logrosDesbloqueados).toEqual([]);
    expect(useAchievementsStore.getState().notificacionesPendientes).toEqual([]);
    expect(localStorage.getItem('naruto-roguelike-logros')).toBeNull();
  });

  it('borra también el registro de vistos de la enciclopedia', () => {
    // Es el botón de "empezar de cero" de toda la meta-progresión: si dejara la
    // enciclopedia llena mientras los logros vuelven a cero, no habría forma de
    // probar cómo se ve una entrada bloqueada.
    useAchievementsStore.getState().registrarVistos({ personajes: ['naruto'] });
    useAchievementsStore.getState().reiniciarLogros();

    expect(useAchievementsStore.getState().vistos).toEqual(VISTOS_VACIO);
    expect(localStorage.getItem('naruto-roguelike-vistos')).toBeNull();
  });
});

describe('registrarVistos (enciclopedia)', () => {
  it('apunta entradas por categoría y las persiste', () => {
    useAchievementsStore.getState().registrarVistos({
      personajes: ['naruto', 'sasuke'],
      enemigos: ['zabuza'],
      modos: ['naruto_0'],
      objetos: ['sello_chakra'],
    });

    const { vistos } = useAchievementsStore.getState();
    expect(vistos.personajes).toEqual(['naruto', 'sasuke']);
    expect(vistos.enemigos).toEqual(['zabuza']);
    expect(vistos.modos).toEqual(['naruto_0']);
    expect(vistos.objetos).toEqual(['sello_chakra']);
    expect(localStorage.getItem('naruto-roguelike-vistos')).toContain('naruto_0');
  });

  it('acumula entre llamadas sin duplicar', () => {
    useAchievementsStore.getState().registrarVistos({ personajes: ['naruto'] });
    useAchievementsStore.getState().registrarVistos({ personajes: ['naruto', 'sakura'] });
    expect(useAchievementsStore.getState().vistos.personajes).toEqual(['naruto', 'sakura']);
  });

  it('deduplica dentro de una misma llamada', () => {
    useAchievementsStore.getState().registrarVistos({ objetos: ['sello_chakra', 'sello_chakra'] });
    expect(useAchievementsStore.getState().vistos.objetos).toEqual(['sello_chakra']);
  });

  it('ignora ids vacíos, que es lo que devuelve un modo que no se encuentra', () => {
    useAchievementsStore.getState().registrarVistos({ modos: [null, undefined, ''] });
    expect(useAchievementsStore.getState().vistos.modos).toEqual([]);
  });

  it('NO cambia la referencia del estado si no hay novedad', () => {
    // Esto es lo que hace seguro llamarlo desde `abrirEnciclopedia` como red de
    // seguridad: un `set` en cada apertura con un objeto nuevo haría que cualquier
    // componente suscrito a `vistos` se re-renderizara en bucle.
    useAchievementsStore.getState().registrarVistos({ personajes: ['naruto'] });
    const antes = useAchievementsStore.getState().vistos;
    useAchievementsStore.getState().registrarVistos({ personajes: ['naruto'] });
    expect(useAchievementsStore.getState().vistos).toBe(antes);
  });

  it('estaVisto refleja lo apuntado', () => {
    expect(useAchievementsStore.getState().estaVisto('personajes', 'naruto')).toBe(false);
    useAchievementsStore.getState().registrarVistos({ personajes: ['naruto'] });
    expect(useAchievementsStore.getState().estaVisto('personajes', 'naruto')).toBe(true);
  });
});

describe('cargarLogros', () => {
  it('recupera de localStorage los logros desbloqueados en una sesión anterior', () => {
    localStorage.setItem('naruto-roguelike-logros', JSON.stringify(['derrotar_haku', 'derrotar_zabuza']));
    useAchievementsStore.getState().cargarLogros();
    expect(useAchievementsStore.getState().logrosDesbloqueados).toEqual(['derrotar_haku', 'derrotar_zabuza']);
  });

  it('no cambia el estado si no hay nada guardado', () => {
    useAchievementsStore.getState().cargarLogros();
    expect(useAchievementsStore.getState().logrosDesbloqueados).toEqual([]);
  });

  it('recupera también el registro de vistos, completando las categorías que falten', () => {
    // A propósito guardado SIN `objetos`: simula lo persistido por una versión
    // anterior a la que se le añade una categoría nueva. Debe salir vacía, no
    // undefined, o la pantalla revienta al hacer `.includes`.
    localStorage.setItem('naruto-roguelike-vistos', JSON.stringify({ personajes: ['naruto'] }));
    useAchievementsStore.getState().cargarLogros();

    const { vistos } = useAchievementsStore.getState();
    expect(vistos.personajes).toEqual(['naruto']);
    expect(vistos.objetos).toEqual([]);
    expect(vistos.modos).toEqual([]);
  });
});
