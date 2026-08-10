import { describe, it, expect } from 'vitest';
import { generarMapa, calcularNivelPorPiso, resolverEnemigoDeNodo } from './mapGenerator';

const arcoDePrueba = {
  id: 'arco_de_prueba',
  numeroPisos: 6,
  nodosPorPiso: { min: 2, max: 4 },
  poolTiposNodo: [
    { tipo: 'combate', peso: 45 },
    { tipo: 'evento', peso: 25 },
    { tipo: 'tienda', peso: 20 },
    { tipo: 'descanso', peso: 10 },
  ],
  pisoMiniJefe: 3,
  miniJefeId: 'haku',
  pisoJefeFinal: 6,
  jefeFinalId: 'zabuza',
  nivelEnemigoBase: 1,
  escaladoNivelPorPiso: 0.5,
  nivelMiniJefe: 3,
  nivelJefeFinal: 5,
};

describe('generarMapa', () => {
  it('el piso 1 es un único nodo de inicio, que nace ya visitado', () => {
    const mapa = generarMapa(arcoDePrueba);
    expect(mapa.pisos[0]).toHaveLength(1);
    const inicio = mapa.nodos[mapa.pisos[0][0]];
    expect(inicio.tipo).toBe('inicio');
    expect(inicio.visitado).toBe(true);
    expect(mapa.nodoInicialId).toBe(inicio.id);
  });

  it('el primer piso jugable (el 2) nunca tiene descanso ni tienda', () => {
    // Se repite varias veces porque la generación es aleatoria — este es
    // literalmente el bug real que se encontró jugando y se corrigió. Ahora
    // apunta al piso 2 porque el 1 es la casilla de salida, no se juega.
    for (let i = 0; i < 30; i++) {
      const mapa = generarMapa(arcoDePrueba);
      const tiposPiso2 = mapa.pisos[1].map((id) => mapa.nodos[id].tipo);
      expect(tiposPiso2).not.toContain('descanso');
      expect(tiposPiso2).not.toContain('tienda');
    }
  });

  it('dos pisos seguidos nunca tienen el mismo número de nodos', () => {
    // Es lo que dibuja el rombo: si el ancho se repite, salen tramos rectos.
    for (let i = 0; i < 30; i++) {
      const anchos = generarMapa(arcoDePrueba).pisos.map((p) => p.length);
      for (let p = 1; p < anchos.length; p++) {
        expect(anchos[p]).not.toBe(anchos[p - 1]);
      }
    }
  });

  it('el último piso tiene exactamente un nodo, de tipo jefe', () => {
    const mapa = generarMapa(arcoDePrueba);
    const ultimoPiso = mapa.pisos[mapa.pisos.length - 1];
    expect(ultimoPiso).toHaveLength(1);
    expect(mapa.nodos[ultimoPiso[0]].tipo).toBe('jefe');
  });

  it('el piso de mini-jefe tiene exactamente un nodo de tipo miniJefe', () => {
    const mapa = generarMapa(arcoDePrueba);
    const pisoMini = mapa.pisos[arcoDePrueba.pisoMiniJefe - 1];
    const tiposMiniJefe = pisoMini
      .map((id) => mapa.nodos[id].tipo)
      .filter((t) => t === 'miniJefe');
    expect(tiposMiniJefe).toHaveLength(1);
  });

  it('todo nodo (salvo el piso inicial) tiene al menos una conexión entrante', () => {
    const mapa = generarMapa(arcoDePrueba);
    for (let p = 1; p < mapa.pisos.length; p++) {
      const anterior = mapa.pisos[p - 1];
      const actual = mapa.pisos[p];
      actual.forEach((idDestino) => {
        const tieneEntrada = anterior.some((idOrigen) =>
          mapa.nodos[idOrigen].conexiones.includes(idDestino),
        );
        expect(tieneEntrada).toBe(true);
      });
    }
  });

  it('nodosIniciales coincide con los nodos reales del primer piso', () => {
    const mapa = generarMapa(arcoDePrueba);
    expect(mapa.nodosIniciales).toEqual(mapa.pisos[0]);
  });

  it('el piso inmediatamente anterior al jefe final siempre tiene un nodo de descanso', () => {
    // Se repite varias veces por la aleatoriedad del sorteo de tipos —
    // mismo motivo que el test del piso 1.
    for (let i = 0; i < 30; i++) {
      const mapa = generarMapa(arcoDePrueba);
      const pisoPrevio = mapa.pisos[arcoDePrueba.pisoJefeFinal - 2];
      const tiposDelPiso = pisoPrevio.map((id) => mapa.nodos[id].tipo);
      expect(tiposDelPiso).toContain('descanso');
    }
  });
});

describe('calcularNivelPorPiso', () => {
  it('el nivel sube de forma aditiva con el piso', () => {
    expect(calcularNivelPorPiso(1, arcoDePrueba)).toBe(1);
    expect(calcularNivelPorPiso(3, arcoDePrueba)).toBe(2); // 1 + 2*0.5
  });

  it('nunca baja de nivel 1, aunque la base sea negativa', () => {
    const arcoConBaseNegativa = { ...arcoDePrueba, nivelEnemigoBase: -10, escaladoNivelPorPiso: 0 };
    expect(calcularNivelPorPiso(1, arcoConBaseNegativa)).toBe(1);
  });
});

describe('resolverEnemigoDeNodo', () => {
  it('devuelve null para nodos sin combate', () => {
    const nodoEvento = { tipo: 'evento', piso: 2 };
    expect(resolverEnemigoDeNodo(nodoEvento, arcoDePrueba)).toBeNull();
  });

  it('usa el id y el nivel FIJO del jefe para nodos de tipo jefe', () => {
    const nodoJefe = { tipo: 'jefe', piso: 6 };
    const resultado = resolverEnemigoDeNodo(nodoJefe, arcoDePrueba);
    expect(resultado.enemigoBase.id).toBe('zabuza');
    expect(resultado.nivel).toBe(arcoDePrueba.nivelJefeFinal);
  });

  it('usa el id y el nivel FIJO del mini-jefe para nodos de tipo miniJefe', () => {
    const nodoMini = { tipo: 'miniJefe', piso: 3 };
    const resultado = resolverEnemigoDeNodo(nodoMini, arcoDePrueba);
    expect(resultado.enemigoBase.id).toBe('haku');
    expect(resultado.nivel).toBe(arcoDePrueba.nivelMiniJefe);
  });

  it('un nodo de combate normal usa calcularNivelPorPiso, no el nivel fijo de jefe', () => {
    const nodoCombate = { tipo: 'combate', piso: 3 };
    const resultado = resolverEnemigoDeNodo(nodoCombate, arcoDePrueba);
    expect(resultado.nivel).toBe(calcularNivelPorPiso(3, arcoDePrueba));
  });
});
