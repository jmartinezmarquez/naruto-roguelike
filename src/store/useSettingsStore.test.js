import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, AJUSTES_POR_DEFECTO, FACTOR_ANIMACION } from './useSettingsStore';

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ ...AJUSTES_POR_DEFECTO });
});

describe('valores por defecto', () => {
  it('arranca en modo oscuro y a velocidad normal', () => {
    const { tema, velocidadCombate } = useSettingsStore.getState();
    expect(tema).toBe('oscuro');
    expect(velocidadCombate).toBe('normal');
  });

  it('NO salta la pantalla de transformación por defecto', () => {
    // Es el único sitio donde el juego cuenta que las transformaciones existen
    // (ver documentacion/30-sistema-de-pasivas.md), así que saltarla tiene que ser
    // una decisión explícita de quien ya las conoce.
    expect(useSettingsStore.getState().saltarTransformacion).toBe(false);
  });
});

describe('cambiarAjuste', () => {
  it('cambia el valor y lo persiste en localStorage', () => {
    useSettingsStore.getState().cambiarAjuste('tema', 'claro');

    expect(useSettingsStore.getState().tema).toBe('claro');
    expect(JSON.parse(localStorage.getItem('naruto-roguelike-ajustes')).tema).toBe('claro');
  });

  it('persiste los tres ajustes juntos, no solo el que cambia', () => {
    useSettingsStore.getState().cambiarAjuste('velocidadCombate', 'rapida');
    const guardado = JSON.parse(localStorage.getItem('naruto-roguelike-ajustes'));

    expect(Object.keys(guardado).sort()).toEqual(Object.keys(AJUSTES_POR_DEFECTO).sort());
  });

  it('revienta con un ajuste desconocido en vez de guardarlo en silencio', () => {
    // Mismo criterio que las pasivas: un ajuste mal escrito que no hace nada es el
    // peor fallo posible, porque la pantalla parecería funcionar.
    expect(() => useSettingsStore.getState().cambiarAjuste('modoTurbo', true)).toThrow();
  });
});

describe('cargarAjustes', () => {
  it('recupera lo guardado en una sesión anterior', () => {
    localStorage.setItem(
      'naruto-roguelike-ajustes',
      JSON.stringify({ tema: 'claro', velocidadCombate: 'instantanea', saltarTransformacion: true }),
    );
    useSettingsStore.getState().cargarAjustes();

    const { tema, velocidadCombate, saltarTransformacion } = useSettingsStore.getState();
    expect(tema).toBe('claro');
    expect(velocidadCombate).toBe('instantanea');
    expect(saltarTransformacion).toBe(true);
  });

  it('completa con su valor por defecto las claves que falten en lo guardado', () => {
    // Simula una configuración escrita por una versión anterior a la que se le
    // añade un ajuste nuevo. Sin la mezcla, `velocidadCombate` saldría `undefined`
    // y el factor de animación sería NaN. Mismo cuidado que con las categorías de
    // `vistos` en useAchievementsStore.
    localStorage.setItem('naruto-roguelike-ajustes', JSON.stringify({ tema: 'claro' }));
    useSettingsStore.getState().cargarAjustes();

    expect(useSettingsStore.getState().tema).toBe('claro');
    expect(useSettingsStore.getState().velocidadCombate).toBe('normal');
    expect(useSettingsStore.getState().saltarTransformacion).toBe(false);
  });

  it('no cambia nada si no hay nada guardado', () => {
    useSettingsStore.getState().cargarAjustes();
    expect(useSettingsStore.getState()).toMatchObject(AJUSTES_POR_DEFECTO);
  });
});

describe('factorAnimacion', () => {
  it('traduce cada velocidad a su multiplicador', () => {
    expect(useSettingsStore.getState().factorAnimacion()).toBe(1);

    useSettingsStore.getState().cambiarAjuste('velocidadCombate', 'rapida');
    expect(useSettingsStore.getState().factorAnimacion()).toBe(0.5);

    useSettingsStore.getState().cambiarAjuste('velocidadCombate', 'instantanea');
    expect(useSettingsStore.getState().factorAnimacion()).toBe(0);
  });

  it('la velocidad instantánea es 0, que es lo que la distingue de "muy rápida"', () => {
    // El 0 no se usa como duración (eso dejaría el replay avanzando golpe a golpe,
    // solo muy rápido): `CombatScreen` lo lee como "da la ronda por reproducida".
    expect(FACTOR_ANIMACION.instantanea).toBe(0);
  });
});
