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
import { FichaPersonaje } from './PersonajeHoverCard';
import { encontrarBaseDeLuchador } from './datosDeLuchador';
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
