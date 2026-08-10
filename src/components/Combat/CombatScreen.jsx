import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import PersonajeHoverCard from '../common/PersonajeHoverCard';

const VELOCIDAD_AUTOPLAY_MS = 900;
const PAUSA_ENTRE_RONDAS_MS = 1400;

function colorBarraHp(porcentaje) {
  if (porcentaje > 0.5) return 'bg-fuuton';
  if (porcentaje > 0.2) return 'bg-raiton';
  return 'bg-sello-500';
}

function BarraLuchador({ id, nombre, nivel, hp, hpMaximo, carga, cargaMaxima, modoActivoNombre, alineacion }) {
  const porcentaje = Math.max(0, hp / hpMaximo);
  const porcentajeCarga = Math.min(1, Math.max(0, carga / cargaMaxima));
  const jutsuListo = porcentajeCarga >= 1;
  const posicionTooltip = alineacion === 'derecha' ? 'izquierda' : 'derecha';
  return (
    <PersonajeHoverCard id={id} nivel={nivel} hpActual={hp} hpMaximo={hpMaximo} posicion={posicionTooltip}>
      <div className={alineacion === 'derecha' ? 'text-right' : 'text-left'}>
        <p className="font-display text-lg text-pergamino-100">{nombre}</p>
        <p className="text-xs text-pergamino-200/60">Lv. {nivel}</p>
        {modoActivoNombre && (
          <p className="text-xs text-sello-500 uppercase tracking-wide">{modoActivoNombre}</p>
        )}
        <div className="h-3 w-full bg-tinta-800 rounded-full overflow-hidden mt-1 border border-pergamino-100/10">
          <div
            className={`h-full ${colorBarraHp(porcentaje)} transition-all duration-500`}
            style={{ width: `${porcentaje * 100}%` }}
          />
        </div>
        <p className="text-xs text-pergamino-200/70 mt-0.5">{Math.max(0, hp)} / {hpMaximo} HP</p>
        {/* Barra de jutsu: sin números a propósito — lo que importa no es cuánto
            chakra hay, sino cuánto falta para la técnica. Ver documentacion/29. */}
        <div className="h-1.5 w-full bg-tinta-800 rounded-full overflow-hidden mt-1 border border-pergamino-100/10">
          <div
            className={`h-full transition-all duration-500 ${jutsuListo ? 'bg-raiton animate-pulse' : 'bg-sello-500'}`}
            style={{ width: `${porcentajeCarga * 100}%` }}
          />
        </div>
        <p className={`text-[10px] mt-0.5 ${jutsuListo ? 'text-raiton' : 'text-pergamino-200/40'}`}>
          {jutsuListo ? 'JUTSU READY' : 'Jutsu'}
        </p>
      </div>
    </PersonajeHoverCard>
  );
}

export default function CombatScreen() {
  const resultado = useGameStore((s) => s.ultimoResultadoCombate);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const irAGameOver = useGameStore((s) => s.irAGameOver);
  const avanzarSiguienteArco = useGameStore((s) => s.avanzarSiguienteArco);
  const irARecompensaMiniJefe = useGameStore((s) => s.irARecompensaMiniJefe);
  const recompensaMiniJefe = useGameStore((s) => s.recompensaMiniJefe);
  const cadenaEnemigos = useGameStore((s) => s.cadenaEnemigos);
  const continuarCadena = useGameStore((s) => s.continuarCadena);
  const runTerminada = useGameStore((s) => s.runTerminada);
  const runGanada = useGameStore((s) => s.runGanada);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);
  const notificarLogros = useAchievementsStore((s) => s.notificar);

  const [indiceRonda, setIndiceRonda] = useState(0);
  const [turnosRevelados, setTurnosRevelados] = useState(0);
  const [resultadoPrevio, setResultadoPrevio] = useState(resultado);

  if (resultado !== resultadoPrevio) {
    setResultadoPrevio(resultado);
    setIndiceRonda(0);
    setTurnosRevelados(0);
  }

  const ronda = resultado?.rondas[indiceRonda] ?? null;
  const rondaCompleta = ronda ? turnosRevelados >= ronda.historial.length : false;
  const hayMasRondas = resultado ? indiceRonda < resultado.rondas.length - 1 : false;
  const transicionRonda = rondaCompleta && ronda && !ronda.jugadorGano && hayMasRondas;

  useEffect(() => {
    if (!ronda || rondaCompleta) return undefined;
    const temporizador = setTimeout(() => setTurnosRevelados((n) => n + 1), VELOCIDAD_AUTOPLAY_MS);
    return () => clearTimeout(temporizador);
  }, [ronda, turnosRevelados, rondaCompleta]);

  useEffect(() => {
    if (!transicionRonda) return undefined;
    const temporizador = setTimeout(() => {
      setIndiceRonda((i) => i + 1);
      setTurnosRevelados(0);
    }, PAUSA_ENTRE_RONDAS_MS);
    return () => clearTimeout(temporizador);
  }, [transicionRonda]);

  // Reproduce el historial hasta el turno revelado para saber cómo estaban HP y
  // barra de jutsu en ese momento. La carga no se acumula sumando: cada evento
  // ya trae el valor resultante (cargaAtacante/cargaDefensor), porque lanzar el
  // jutsu la pone a cero y eso no se puede reconstruir sumando incrementos.
  const estadoEnTurnoActual = useMemo(() => {
    if (!ronda) return null;
    let hpJugador = ronda.jugador.hpInicial;
    let hpEnemigo = ronda.enemigo.hpInicial;
    let cargaJugador = ronda.jugador.cargaInicial ?? 0;
    let cargaEnemigo = ronda.enemigo.cargaInicial ?? 0;

    for (let i = 0; i < turnosRevelados; i++) {
      for (const evento of ronda.historial[i].eventos) {
        if (evento.atacanteId === ronda.jugador.id) {
          hpEnemigo -= evento.dano;
          cargaJugador = evento.cargaAtacante;
          cargaEnemigo = evento.cargaDefensor;
        } else {
          hpJugador -= evento.dano;
          cargaEnemigo = evento.cargaAtacante;
          cargaJugador = evento.cargaDefensor;
        }
      }
    }
    return {
      hpJugador: Math.max(0, hpJugador),
      hpEnemigo: Math.max(0, hpEnemigo),
      cargaJugador,
      cargaEnemigo,
    };
  }, [ronda, turnosRevelados]);

  const combateTotalTerminado = Boolean(ronda) && rondaCompleta && (ronda.jugadorGano || !hayMasRondas);

  useEffect(() => {
    if (!combateTotalTerminado) return;
    notificarLogros(resultado?.logrosDesbloqueados ?? []);
  }, [combateTotalTerminado, resultado, notificarLogros]);

  const hayMasEnCadena = cadenaEnemigos
    ? cadenaEnemigos.indiceActual < cadenaEnemigos.enemigos.length - 1
    : false;
  useEffect(() => {
    if (!combateTotalTerminado) return undefined;
    if (!resultado?.jugadorGanoFinal) return undefined;
    if (!hayMasEnCadena) return undefined;
    if (runTerminada || resultado.arcoCompletado || recompensaMiniJefe) return undefined;
    const t = setTimeout(continuarCadena, 1600);
    return () => clearTimeout(t);
  }, [combateTotalTerminado, resultado, hayMasEnCadena, runTerminada, recompensaMiniJefe, continuarCadena]);

  if (!resultado || !ronda || !estadoEnTurnoActual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No combat in progress.
      </div>
    );
  }

  const eventosVisibles = ronda.historial.slice(0, turnosRevelados).flatMap((t) => t.eventos);

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col">
      <div className="max-w-xl mx-auto w-full">
        {cadenaEnemigos && cadenaEnemigos.enemigos.length > 1 && (
          <p className="text-center text-xs text-sello-500/70 mb-1 font-display uppercase tracking-widest">
            Battle {cadenaEnemigos.indiceActual + 1} / {cadenaEnemigos.enemigos.length}
          </p>
        )}
        {resultado.rondas.length > 1 && (
          <p className="text-center text-xs text-pergamino-200/50 mb-3">
            Round {indiceRonda + 1} of {resultado.rondas.length}
          </p>
        )}

        <div className="flex items-start justify-between gap-6 mb-8">
          <BarraLuchador
            id={ronda.jugador.id}
            nombre={ronda.jugador.nombre}
            nivel={ronda.jugador.nivel}
            hp={estadoEnTurnoActual.hpJugador}
            hpMaximo={ronda.jugador.hpMaximo}
            carga={estadoEnTurnoActual.cargaJugador}
            cargaMaxima={ronda.cargaMaxima}
            modoActivoNombre={ronda.jugador.modoActivoNombre}
            alineacion="izquierda"
          />
          <span className="font-display text-2xl text-sello-500 pt-1">対</span>
          <BarraLuchador
            id={ronda.enemigo.id}
            nombre={ronda.enemigo.nombre}
            nivel={ronda.enemigo.nivel}
            hp={estadoEnTurnoActual.hpEnemigo}
            hpMaximo={ronda.enemigo.hpMaximo}
            carga={estadoEnTurnoActual.cargaEnemigo}
            cargaMaxima={ronda.cargaMaxima}
            modoActivoNombre={ronda.enemigo.modoActivoNombre}
            alineacion="derecha"
          />
        </div>

        <div className="bg-tinta-900 border border-pergamino-100/10 rounded-lg p-4 h-56 overflow-y-auto flex flex-col gap-2">
          {eventosVisibles.length === 0 && !transicionRonda && (
            <p className="text-pergamino-200/50 text-sm italic">Combat is about to begin...</p>
          )}
          {eventosVisibles.map((evento, i) => {
            const esJugador = evento.atacanteId === ronda.jugador.id;
            const nombreAtacante = esJugador ? ronda.jugador.nombre : ronda.enemigo.nombre;
            const esJutsu = evento.tipoAtaque === 'jutsu';
            return (
              <p key={i} className={esJutsu ? 'text-sm' : 'text-sm text-pergamino-200/60'}>
                {esJutsu && '🌀 '}
                <span className={esJugador ? 'text-fuuton' : 'text-sello-500'}>{nombreAtacante}</span>
                {' uses '}
                <span className={esJutsu ? 'text-raiton font-display' : 'text-pergamino-200/80'}>
                  {evento.jutsuNombre}
                </span>
                {' — '}
                <span className={esJutsu ? 'text-pergamino-100' : 'text-pergamino-200/70'}>
                  {evento.dano} damage
                </span>
                {evento.eficacia > 1 && <span className="text-fuuton"> (effective!)</span>}
                {evento.eficacia < 1 && <span className="text-pergamino-200/50"> (not very effective)</span>}
              </p>
            );
          })}
          {transicionRonda && (
            <p className="text-sello-500 text-sm font-display mt-auto">
              {ronda.jugador.nombre} has fallen — {resultado.rondas[indiceRonda + 1]?.jugador.nombre} enters combat...
            </p>
          )}
        </div>

        {!rondaCompleta && (
          <button
            type="button"
            onClick={() => setTurnosRevelados(ronda.historial.length)}
            className="mt-4 text-xs text-pergamino-200/60 underline hover:text-pergamino-100"
          >
            Skip animation
          </button>
        )}

        {combateTotalTerminado && (
          <div className="mt-6 text-center">
            <p className={`font-naruto text-4xl mb-4 ${resultado.jugadorGanoFinal ? 'text-fuuton' : 'text-sello-500'}`}>
              {resultado.jugadorGanoFinal ? 'Victory' : 'Defeat'}
            </p>

            {runTerminada ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  {runGanada
                    ? 'You completed the entire run! Konoha is safe.'
                    : 'Your entire team has fallen. The run is over.'}
                </p>
                <button
                  type="button"
                  onClick={irAGameOver}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  See results
                </button>
              </div>
            ) : resultado.arcoCompletado ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  You have beaten {arcoActualDatos?.nombre}. A new arc begins.
                </p>
                <button
                  type="button"
                  onClick={avanzarSiguienteArco}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  Continue to next arc
                </button>
              </div>
            ) : recompensaMiniJefe ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  You defeated the mini-boss! A reward awaits you.
                </p>
                <button
                  type="button"
                  onClick={irARecompensaMiniJefe}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  Claim reward
                </button>
              </div>
            ) : hayMasEnCadena ? (
              <p className="text-pergamino-200/60 text-sm animate-pulse">
                Next enemy ({cadenaEnemigos.indiceActual + 2} / {cadenaEnemigos.enemigos.length})...
              </p>
            ) : (
              <button
                type="button"
                onClick={volverAlMapa}
                className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
