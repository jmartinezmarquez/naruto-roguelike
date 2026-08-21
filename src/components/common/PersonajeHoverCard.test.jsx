// @vitest-environment jsdom
//
// `FichaPersonaje` es **la única tarjeta de personaje del juego**: el hover del mapa,
// la selección inicial, las tres cartas de reclutar, el desafío legendario y el Bingo
// Book pintan esta misma. Antes cada pantalla tenía la suya y se fueron separando.
//
// Eso la convierte en el sitio con más apalancamiento del proyecto —un cambio aquí se
// ve en cinco sitios— y también en el más fácil de estropear sin enterarse: la
// pantalla que no estabas mirando sigue compilando.
//
// ⚠️ Lo que más se protege aquí es lo que la tarjeta **NO** enseña. Que falte algo se
// ve; que SOBRE, no: la transformación es una sorpresa deliberada, y destaparla no
// rompe nada, solo estropea el momento del juego que existe para eso (la pantalla de
// transformación, punto 4 del roadmap).

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-dom';
import PersonajeHoverCard, { FichaPersonaje } from './PersonajeHoverCard';
import { encontrarBaseDeLuchador } from './datosDeLuchador';
import { nombreStat } from './efectos';
import charactersData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import itemsData from '../../data/items.json';

const naruto = charactersData.personajes.find((p) => p.id === 'naruto');

describe('lo que la tarjeta enseña', () => {
  it('nombre, naturaleza, nivel y jutsu', () => {
    render(<FichaPersonaje id="naruto" nivel={5} />);
    expect(screen.getByText(/Naruto/)).toBeInTheDocument();
    expect(screen.getByText('Fuuton')).toBeInTheDocument();
    expect(screen.getByText('Lv.5')).toBeInTheDocument();
    expect(screen.getByText(naruto.jutsu.nombre)).toBeInTheDocument();
  });

  it('el HP que se le pasa, y no el máximo del nivel', () => {
    // La usa el hover del mapa con el HP REAL del personaje, que persiste entre
    // combates: enseñar el máximo ahí sería mentir sobre a quién puedes poner delante.
    render(<FichaPersonaje id="naruto" nivel={5} hpActual={7} hpMaximo={40} />);
    expect(screen.getByText(/7\s*\/\s*40/)).toBeInTheDocument();
  });

  it('el objeto equipado, y solo si lo lleva puesto', () => {
    const objeto = itemsData.objetos[0];

    const { unmount } = render(<FichaPersonaje id="naruto" nivel={5} />);
    expect(screen.queryByText(objeto.nombre)).toBeNull();
    unmount();

    render(<FichaPersonaje id="naruto" nivel={5} objetoEquipadoId={objeto.id} />);
    expect(screen.getByText(objeto.nombre)).toBeInTheDocument();
  });
});

describe('las bonificaciones que antes no se veían', () => {
  // 🐛 La ficha reconstruía al luchador desde el JSON crudo, así que **la mejora
  // permanente de un evento no aparecía en ninguna pantalla del juego** y el número que
  // enseñaba era MÁS BAJO del que de verdad peleaba. El buff temporal, igual.
  // ⚠️ Se leen los ELEMENTOS y no el texto de la fila: en el DOM, un delta de +4 sobre
  // un valor de 17 sale como "+417" pegado, y cualquier intento de separarlos con una
  // expresión regular se come uno de los dos. (Primer intento de este test: lo hizo.)
  const filaDe = (stat) => screen.getByText(nombreStat(stat)).parentElement;
  const valorDe = (stat) => Number(filaDe(stat).querySelector('span.font-display').textContent);
  const deltasDe = (stat) => [...filaDe(stat).querySelectorAll('span.text-\\[9px\\]')]
    .map((e) => ({ texto: e.textContent, permanente: e.className.includes('text-oro') }));

  it('sin bonificaciones ni buffs, la ficha no inventa deltas', () => {
    render(<FichaPersonaje id="naruto" nivel={5} />);
    expect(deltasDe('ataque')).toEqual([]);
  });

  it('una mejora permanente sube el número y se marca aparte', () => {
    const { unmount } = render(<FichaPersonaje id="naruto" nivel={5} />);
    const sinMejora = valorDe('ataque');
    unmount();

    render(<FichaPersonaje id="naruto" nivel={5} bonificaciones={{ ataque: 4, defensa: 0, velocidad: 0, hp: 0 }} />);

    expect(deltasDe('ataque')).toHaveLength(1);
    // Y el TOTAL sube de verdad: no es una etiqueta pegada a un número viejo.
    expect(valorDe('ataque')).toBeGreaterThan(sinMejora);
  });

  it('⚠️ el delta permanente va ESCALADO al nivel, no es el número guardado', () => {
    // La bonificación se suma a `statsBase` **antes** de escalar por nivel, así que un
    // "+4" guardado vale +4 a nivel 1 y más a nivel 40. Pintar el número crudo mentiría
    // cada vez más según avanza la run — por eso el delta se mide restando dos
    // luchadores construidos por el mismo camino que usa el combate.
    const bonificaciones = { ataque: 4, defensa: 0, velocidad: 0, hp: 0 };

    const { unmount } = render(<FichaPersonaje id="naruto" nivel={1} bonificaciones={bonificaciones} />);
    const bajo = Number(deltasDe('ataque')[0].texto.replace('+', ''));
    unmount();

    render(<FichaPersonaje id="naruto" nivel={40} bonificaciones={bonificaciones} />);
    const alto = Number(deltasDe('ataque')[0].texto.replace('+', ''));

    expect(alto).toBeGreaterThan(bajo);
  });

  it('un buff temporal también sale, y en otro color que el permanente', () => {
    const { container } = render(
      <FichaPersonaje id="naruto" nivel={5} multiplicadoresBuffs={{ ataque: 1.5 }} />,
    );
    expect(deltasDe('ataque')).toHaveLength(1);
    // ⚠️ Los dos deltas NO pueden pintarse igual: uno es tuyo para siempre y el otro se
    // gasta en tres combates. Con un solo color, la ficha diría que el personaje vale
    // eso, y dentro de tres peleas ya no.
    expect(container.querySelector('.text-exito')).toBeTruthy();
    expect(container.querySelector('.text-oro')).toBeNull();
  });

  it('y los dos a la vez se distinguen', () => {
    const { container } = render(
      <FichaPersonaje
        id="naruto"
        nivel={5}
        bonificaciones={{ ataque: 4, defensa: 0, velocidad: 0, hp: 0 }}
        multiplicadoresBuffs={{ ataque: 1.5 }}
      />,
    );
    expect(container.querySelector('.text-oro')).toBeTruthy();
    expect(container.querySelector('.text-exito')).toBeTruthy();
  });

  it('un buff sobre otra estadística no ensucia la que no toca', () => {
    render(<FichaPersonaje id="naruto" nivel={5} multiplicadoresBuffs={{ defensa: 1.5 }} />);
    expect(deltasDe('defensa')).toHaveLength(1);
    expect(deltasDe('ataque')).toEqual([]);
  });
});

describe('el envoltorio de hover reenvía lo que la ficha necesita', () => {
  // 🐛 ⚠️ **El bug que estos tests NO cogieron.** `bonificaciones` y
  // `multiplicadoresBuffs` se enchufaron en el mapa y se probaron contra
  // `FichaPersonaje`, pero `PersonajeHoverCard` —el envoltorio que usa el juego de
  // verdad— no las declaraba y las tiraba por el camino. En pantalla no se veía nada, y
  // los tests estaban todos en verde: **probaban las dos piezas y no la unión.**
  //
  // Por eso este bloque monta el envoltorio y no la ficha. Cualquier prop nueva de
  // `FichaPersonaje` tiene que aparecer también aquí.
  // Acotado a la rejilla de estadísticas: la tarjeta usa `text-oro` y `text-exito` en
  // más sitios (rareza, HP), y sin acotar el caso "sin deltas" daba un falso positivo.
  const deltas = (container) => container
    .querySelector('div.grid.grid-cols-2')
    .querySelectorAll('span.text-oro, span.text-exito');

  it('pasa el buff temporal, que es como lo usa el mapa', () => {
    const { container } = render(
      <PersonajeHoverCard id="naruto" nivel={4} hpActual={13} hpMaximo={49} multiplicadoresBuffs={{ ataque: 1.2 }}>
        <span>Naruto U.</span>
      </PersonajeHoverCard>,
    );
    expect(deltas(container)).toHaveLength(1);
    expect(deltas(container)[0].className).toContain('text-exito');
  });

  it('pasa la mejora permanente', () => {
    const { container } = render(
      <PersonajeHoverCard id="naruto" nivel={4} hpActual={13} hpMaximo={49} bonificaciones={{ ataque: 4, defensa: 0, velocidad: 0, hp: 0 }}>
        <span>Naruto U.</span>
      </PersonajeHoverCard>,
    );
    expect(deltas(container)).toHaveLength(1);
    expect(deltas(container)[0].className).toContain('text-oro');
  });

  it('y sin nada de eso no pinta deltas', () => {
    const { container } = render(
      <PersonajeHoverCard id="naruto" nivel={4} hpActual={13} hpMaximo={49}>
        <span>Naruto U.</span>
      </PersonajeHoverCard>,
    );
    expect(deltas(container)).toHaveLength(0);
  });
});

describe('las abreviaturas de estadística', () => {
  it('son ATK/DEF/SPD/HP, las mismas que en las pastillas de evento', () => {
    // ⚠️ Había DOS tablas de abreviaturas —esta ficha y la enciclopedia— diciendo
    // `ATT`/`SPE`, mientras las pastillas de evento decían `ATK`/`SPD`: el mismo dato
    // con dos nombres en la misma partida. Ahora solo se escriben en `nombreStat`.
    render(<FichaPersonaje id="naruto" nivel={5} />);
    for (const etiqueta of ['ATK', 'DEF', 'SPD', 'HP']) {
      expect(screen.getByText(etiqueta), `falta ${etiqueta}`).toBeInTheDocument();
    }
    expect(screen.queryByText('ATT')).toBeNull();
    expect(screen.queryByText('SPE')).toBeNull();
  });
});

describe('lo que la tarjeta calla a propósito', () => {
  it('no destapa la transformación, ni al nivel que ya la tiene activa', () => {
    const conModos = charactersData.personajes.filter((p) => p.modos?.length > 0);
    expect(conModos.length).toBeGreaterThan(0);

    for (const personaje of conModos) {
      const nivelAlto = Math.max(...personaje.modos.map((m) => m.nivelDesbloqueo)) + 1;
      const { unmount } = render(<FichaPersonaje id={personaje.id} nivel={nivelAlto} />);
      for (const modo of personaje.modos) {
        expect(
          screen.queryByText(modo.nombre),
          `${personaje.id} está enseñando su modo "${modo.nombre}" en la ficha`,
        ).toBeNull();
      }
      unmount();
    }
  });

  it('no enseña la potencia del jutsu ni sus turnos de carga', () => {
    // Parecen datos comparables y no lo son: la potencia es un multiplicador contra
    // una fórmula interna. Van a la enciclopedia, que es donde hay sitio para
    // explicarlos. La tarjeta enseña el ritmo con tres puntitos, no con números.
    render(<FichaPersonaje id="naruto" nivel={5} />);
    expect(screen.queryByText(/Power/i)).toBeNull();
    expect(screen.queryByText(new RegExp(String(naruto.jutsu.danoBase)))).toBeNull();
  });
});

describe('sirve para cualquiera que pueda acabar en el equipo', () => {
  it('incluidos los jefes, que se reclutan por logro', () => {
    // Un jefe en el equipo no está en characters.json: es el caso que ya rompió los
    // nombres una vez, y la tarjeta lo pinta igual que a los demás.
    for (const jefe of enemiesData.jefes) {
      const { unmount } = render(<FichaPersonaje id={jefe.id} nivel={20} />);
      expect(document.body.textContent).not.toBe('');
      unmount();
    }
  });

  it('un id que no existe no pinta nada en vez de reventar', () => {
    expect(encontrarBaseDeLuchador('no_existe')).toBeFalsy();
    const { container } = render(<FichaPersonaje id="no_existe" nivel={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
