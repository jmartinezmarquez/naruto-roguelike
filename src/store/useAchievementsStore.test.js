import { describe, it, expect, beforeEach } from 'vitest';
import { useAchievementsStore } from './useAchievementsStore';

beforeEach(() => {
  localStorage.clear();
  useAchievementsStore.setState({ logrosDesbloqueados: [], notificacionesPendientes: [] });
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
});
