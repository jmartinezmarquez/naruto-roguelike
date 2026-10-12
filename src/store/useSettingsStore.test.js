import { describe, it, expect, beforeEach } from 'vitest';
import {
  useSettingsStore, AJUSTES_POR_DEFECTO, FACTOR_ANIMACION, normalizarVolumen,
} from './useSettingsStore';

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

describe('volumen de la música', () => {
  it('arranca sonando, no en silencio', () => {
    // La música no es un extra: es una pista lo-fi por arco y la mitad del tono que
    // busca el juego (ver documentacion/36-musica.md). Arrancar en OFF sería
    // esconder la única cosa que hace que suene a algo.
    expect(useSettingsStore.getState().volumenMusica).toBeGreaterThan(0);
  });

  it('se guarda siempre entre 0 y 1: fuera de ahí `audio.volume` lanza una excepción', () => {
    useSettingsStore.getState().cambiarAjuste('volumenMusica', 1.5);
    expect(useSettingsStore.getState().volumenMusica).toBe(1);
    useSettingsStore.getState().cambiarAjuste('volumenMusica', -3);
    expect(useSettingsStore.getState().volumenMusica).toBe(0);
    expect(normalizarVolumen('basura')).toBe(0);
    expect(normalizarVolumen(0.333333)).toBe(0.33);
  });

  it('se persiste como los demás', () => {
    useSettingsStore.getState().cambiarAjuste('volumenMusica', 0);
    expect(JSON.parse(localStorage.getItem('naruto-roguelike-ajustes')).volumenMusica).toBe(0);
  });
});

describe('volumen de los efectos', () => {
  it('es un ajuste aparte del de la música, y arranca sonando', () => {
    expect(AJUSTES_POR_DEFECTO.volumenEfectos).toBeGreaterThan(0);
  });

  it('se persiste, y cambiarlo no toca la música', () => {
    useSettingsStore.getState().cambiarAjuste('volumenEfectos', 0);
    const guardado = JSON.parse(localStorage.getItem('naruto-roguelike-ajustes'));
    expect(guardado.volumenEfectos).toBe(0);
    expect(guardado.volumenMusica).toBe(useSettingsStore.getState().volumenMusica);
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
