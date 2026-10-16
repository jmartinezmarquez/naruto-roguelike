import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import { rosterInicial } from '../../engine/achievements';
import { FichaPersonaje } from '../common/PersonajeHoverCard';
import { InsigniaMaestria } from '../common/Maestria';
import { useMaestria, CLASE_MARCO_MAESTRIA } from '../common/nivelDeNinja';
import { spriteDeLuchador } from '../common/characterSprites';
import { nombrePersonaje } from '../common/nombres';
import { BORDE_RAREZA } from '../Inventory/itemSprites';
import { CabeceraPantalla, BotonSecundario, BotonPrincipal, PanelMarco } from '../common/PiezasUI';

/**
 * La selección de personaje como el roster de un juego de lucha (Street Fighter):
 * **todos los ninjas del juego** en una rejilla de retratos, y al lado la ficha
 * grande del que tengas bajo el ratón o el cursor.
 *
 * - Los que tienes (los tres iniciales y lo conseguido en el gacha, `rosterInicial`)
 *   salen en color y se eligen con un clic o con Enter.
 * - Los que no, en **silueta con "?"**: la rejilla entera es también lo que te queda
 *   por invocar, y eso es lo que engancha (documentacion/42).
 * - Ordenados por rareza —comunes, raros, legendarios—, con el borde de su color.
 * - **Random** elige uno de los que tienes, para quien quiera la sorpresa.
 *
 * Sustituye a los tres candidatos al azar: con el gacha como forma de desbloquear, el
 * sorteo escondía justo lo que habías conseguido.
 */

const ORDEN_RAREZA = { inicial: 0, comun: 0, raro: 1, legendario: 2 };
const RAREZA_DE_BORDE = { inicial: 'comun', comun: 'comun', raro: 'raro', legendario: 'legendario' };
const COLUMNAS = 7;

// Todos los ninjas elegibles algún día: personajes y jefes desbloqueables con arte.
const TODOS = [...personajesData.personajes, ...enemiesData.jefes.filter((j) => j.desbloqueablePorLogro)]
  .filter((p) => !p.pendienteDeArte)
  .map((p, i) => ({ p, i }))
  .sort((a, b) => (ORDEN_RAREZA[a.p.rareza] - ORDEN_RAREZA[b.p.rareza]) || (a.i - b.i))
  .map(({ p }) => p);

function Retrato({ personaje, abierto, enCursor, onElegir, onApuntar }) {
  const { conMarco } = useMaestria(personaje.id);
  const sprite = spriteDeLuchador(personaje.id);
  return (
    <button
      type="button"
      onClick={abierto ? onElegir : undefined}
      onMouseEnter={onApuntar}
      onFocus={onApuntar}
      aria-disabled={!abierto}
      aria-label={abierto ? nombrePersonaje(personaje.id) : 'Locked ninja'}
      className={[
        'relative aspect-square overflow-hidden rounded-sm border-2 bg-tinta-950/70 transition-transform',
        BORDE_RAREZA[RAREZA_DE_BORDE[personaje.rareza]],
        enCursor ? 'scale-110 z-10 ring-2 ring-sello-500 shadow-[0_0_14px_rgba(201,74,60,0.7)]' : '',
        abierto ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed',
        conMarco && abierto ? CLASE_MARCO_MAESTRIA : '',
      ].join(' ')}
    >
      {/* Recortado a busto, como un retrato: el lienzo de 96 px ampliado y anclado arriba. */}
      {sprite && (
        <img
          src={sprite}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover scale-[1.7] origin-[50%_28%] ${abierto ? '' : 'brightness-0 opacity-70'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      {!abierto && <span className="absolute inset-0 flex items-center justify-center font-display text-[14px] text-pergamino-200/60">?</span>}
    </button>
  );
}

/** La ficha grande del que está en el cursor. Si no lo tienes, su silueta. */
function Ficha({ personaje, abierto }) {
  if (!abierto) {
    const sprite = spriteDeLuchador(personaje.id);
    return (
      <PanelMarco className="p-5 flex flex-col items-center gap-3 text-center">
        {sprite && <img src={sprite} alt="" aria-hidden="true" className="w-48 h-48 object-contain brightness-0 opacity-70" style={{ imageRendering: 'pixelated' }} />}
        <p className="font-display text-[12px] text-pergamino-100">???</p>
        <p className="text-[10px] text-pergamino-200/70">Summon this ninja to unlock them as a starter.</p>
      </PanelMarco>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <FichaPersonaje id={personaje.id} nivel={1} className="p-3" />
      <InsigniaMaestria id={personaje.id} className="pb-1" />
    </div>
  );
}

export default function CharacterSelectScreen({ onConfirmar }) {
  const irAlHome = useGameStore((s) => s.irAlHome);
  const invocacion = useAchievementsStore((s) => s.invocacion);

  const abiertos = useMemo(
    () => new Set(rosterInicial(TODOS, invocacion.personajes).map((p) => p.id)),
    [invocacion],
  );
  const [cursor, setCursor] = useState(() => Math.max(0, TODOS.findIndex((p) => abiertos.has(p.id))));
  const enCursor = TODOS[cursor];

  function elegir(id) {
    if (abiertos.has(id)) onConfirmar([id]);
  }

  function aleatorio() {
    const ids = [...abiertos];
    elegir(ids[Math.floor(Math.random() * ids.length)]);
  }

  // Flechas para moverse por la rejilla y Enter para elegir, como en un juego de lucha.
  useEffect(() => {
    function alPulsar(e) {
      const pasos = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNAS, ArrowUp: -COLUMNAS }[e.key];
      if (pasos) {
        e.preventDefault();
        setCursor((c) => Math.min(TODOS.length - 1, Math.max(0, c + pasos)));
      } else if (e.key === 'Enter') {
        elegir(TODOS[cursor].id);
      }
    }
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  });

  const puedeEmpezar = abiertos.has(enCursor.id);

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center">
      {/* La salida, arriba a la izquierda: sin ella esta pantalla era un callejón sin salida. */}
      <BotonSecundario onClick={irAlHome} sobreFondo className="absolute top-4 left-4 elevar-hover">
        ← Back
      </BotonSecundario>

      <div className="max-w-5xl w-full flex flex-col gap-5">
        <div className="text-center">
          <CabeceraPantalla antetitulo="A new path" titulo="Choose your ninja" />
          <p className="text-[10px] text-pergamino-200 mt-1">
            Unlocked {abiertos.size} / {TODOS.length} · Summon ninja to unlock more starters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 items-start">
          <Ficha personaje={enCursor} abierto={puedeEmpezar} />

          <div className="flex flex-col gap-3">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLUMNAS}, minmax(0, 1fr))` }}>
              {TODOS.map((p, i) => (
                <Retrato
                  key={p.id}
                  personaje={p}
                  abierto={abiertos.has(p.id)}
                  enCursor={i === cursor}
                  onElegir={() => elegir(p.id)}
                  onApuntar={() => setCursor(i)}
                />
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <BotonSecundario onClick={aleatorio} sobreFondo className="elevar-hover">Random</BotonSecundario>
              <BotonPrincipal onClick={() => elegir(enCursor.id)} className={puedeEmpezar ? '' : 'opacity-40 pointer-events-none'}>
                {puedeEmpezar ? `Start with ${nombrePersonaje(enCursor.id)}` : 'Locked'}
              </BotonPrincipal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
