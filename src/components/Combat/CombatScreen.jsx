import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import PersonajeHoverCard from '../common/PersonajeHoverCard';

const VELOCIDAD_AUTOPLAY_MS = 900;
const PAUSA_ENTRE_RONDAS_MS = 1400;

/** Color de la barra de HP según el % restante. */
function colorBarraHp(porcentaje) {
  if (porcentaje > 0.5) return 'bg-fuuton';
  if (porcentaje > 0.2) return 'bg-raiton';
  return 'bg-sello-500';
}

function BarraLuchador({ id, nombre, nivel, hp, hpMaximo, modoActivoNombre, alineacion }) {
  const porcentaje = Math.max(0, hp / hpMaximo);
  // El jugador (izquierda) abre el tooltip hacia la derecha (hacia el centro
  // de la pantalla) y el enemigo (derecha) hacia la izquierda, para que
  // ninguno de los dos se salga de la pantalla.
  const posicionTooltip = alineacion === 'derecha' ? 'izquierda' : 'derecha';
  return (
    <PersonajeHoverCard id={id} nivel={nivel} hpActual={hp} hpMaximo={hpMaximo} posicion={posicionTooltip}>
      <div className={alineacion === 'derecha' ? 'text-right' : 'text-left'}>
        <p className="font-display text-lg text-pergamino-100">{nombre}</p>
        <p className="text-xs text-pergamino-200/60">Nv. {nivel}</p>
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

  // Reseteo al cambiar de combate: ajustar estado durante el render (no en
  // un efecto) es el patrón recomendado por React para esto.
  if (resultado !== resultadoPrevio) {
    setResultadoPrevio(resultado);
    setIndiceRonda(0);
    setTurnosRevelados(0);
  }

  const ronda = resultado?.rondas[indiceRonda] ?? null;
  const rondaCompleta = ronda ? turnosRevelados >= ronda.historial.length : false;
  const hayMasRondas = resultado ? indiceRonda < resultado.rondas.length - 1 : false;
  // Derivado, no es estado propio: "estamos entre dos personajes" se deduce
  // directamente de los valores de arriba, no hace falta guardarlo aparte.
  const transicionRonda = rondaCompleta && ronda && !ronda.jugadorGano && hayMasRondas;

  // Avance automático de turnos dentro de la ronda actual.
  useEffect(() => {
    if (!ronda || rondaCompleta) return undefined;
    const temporizador = setTimeout(() => setTurnosRevelados((n) => n + 1), VELOCIDAD_AUTOPLAY_MS);
    return () => clearTimeout(temporizador);
  }, [ronda, turnosRevelados, rondaCompleta]);

  // Al completar una ronda perdida con más rondas por delante: pausa breve
  // mostrando "X ha caído" y luego pasa a la siguiente ronda automáticamente.
  // Solo se hace setState dentro del callback async del timeout, nunca
  // síncronamente en el cuerpo del efecto.
  useEffect(() => {
    if (!transicionRonda) return undefined;
    const temporizador = setTimeout(() => {
      setIndiceRonda((i) => i + 1);
      setTurnosRevelados(0);
    }, PAUSA_ENTRE_RONDAS_MS);
    return () => clearTimeout(temporizador);
  }, [transicionRonda]);

  // HP en el turno revelado actualmente de la ronda, partiendo del HP con el
  // que se entró a la ronda (NO del máximo — el HP persiste entre combates).
  const hpEnTurnoActual = useMemo(() => {
    if (!ronda) return null;
    let hpJugador = ronda.jugador.hpInicial;
    let hpEnemigo = ronda.enemigo.hpInicial;

    for (let i = 0; i < turnosRevelados; i++) {
      for (const evento of ronda.historial[i].eventos) {
        if (evento.defensorId === ronda.jugador.id) hpJugador -= evento.dano;
        if (evento.defensorId === ronda.enemigo.id) hpEnemigo -= evento.dano;
      }
    }
    return { hpJugador: Math.max(0, hpJugador), hpEnemigo: Math.max(0, hpEnemigo) };
  }, [ronda, turnosRevelados]);

  const combateTotalTerminado = Boolean(ronda) && rondaCompleta && (ronda.jugadorGano || !hayMasRondas);

  // Los logros ya se desbloquearon (y persistieron) en el momento del
  // combate real, pero no se notifican hasta que termina TODA la animación
  // — si saltara antes, se arruinaría el suspense de la pelea en curso.
  useEffect(() => {
    if (!combateTotalTerminado) return;
    notificarLogros(resultado?.logrosDesbloqueados ?? []);
    // Solo debe dispararse una vez, justo al llegar a "terminado" para este
    // resultado — combateTotalTerminado y resultado ya lo garantizan como deps.
  }, [combateTotalTerminado, resultado, notificarLogros]);

  // Auto-avance entre peleas de una cadena de entrenador: si ganamos y hay
  // más enemigos, esperamos un momento y pasamos al siguiente sin botón.
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

  if (!resultado || !ronda || !hpEnTurnoActual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay ningún combate en curso.
      </div>
    );
  }

  const eventosVisibles = ronda.historial.slice(0, turnosRevelados).flatMap((t) => t.eventos);

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col">
      <div className="max-w-xl mx-auto w-full">
        {cadenaEnemigos && cadenaEnemigos.enemigos.length > 1 && (
          <p className="text-center text-xs text-sello-500/70 mb-1 font-display uppercase tracking-widest">
            Combate {cadenaEnemigos.indiceActual + 1} / {cadenaEnemigos.enemigos.length}
          </p>
        )}
        {resultado.rondas.length > 1 && (
          <p className="text-center text-xs text-pergamino-200/50 mb-3">
            Ronda {indiceRonda + 1} de {resultado.rondas.length}
          </p>
        )}

        <div className="flex items-start justify-between gap-6 mb-8">
          <BarraLuchador
            id={ronda.jugador.id}
            nombre={ronda.jugador.nombre}
            nivel={ronda.jugador.nivel}
            hp={hpEnTurnoActual.hpJugador}
            hpMaximo={ronda.jugador.hpMaximo}
            modoActivoNombre={ronda.jugador.modoActivoNombre}
            alineacion="izquierda"
          />
          <span className="font-display text-2xl text-sello-500 pt-1">対</span>
          <BarraLuchador
            id={ronda.enemigo.id}
            nombre={ronda.enemigo.nombre}
            nivel={ronda.enemigo.nivel}
            hp={hpEnTurnoActual.hpEnemigo}
            hpMaximo={ronda.enemigo.hpMaximo}
            modoActivoNombre={ronda.enemigo.modoActivoNombre}
            alineacion="derecha"
          />
        </div>

        <div className="bg-tinta-900 border border-pergamino-100/10 rounded-lg p-4 h-56 overflow-y-auto flex flex-col gap-2">
          {eventosVisibles.length === 0 && !transicionRonda && (
            <p className="text-pergamino-200/50 text-sm italic">El combate está a punto de empezar...</p>
          )}
          {eventosVisibles.map((evento, i) => {
            const esJugador = evento.atacanteId === ronda.jugador.id;
            const nombreAtacante = esJugador ? ronda.jugador.nombre : ronda.enemigo.nombre;
            return (
              <p key={i} className="text-sm">
                <span className={esJugador ? 'text-fuuton' : 'text-sello-500'}>{nombreAtacante}</span>
                {' usa '}
                <span className="text-pergamino-100">{evento.jutsuNombre}</span>
                {' — '}
                <span className="text-pergamino-200/80">{evento.dano} de daño</span>
                {evento.eficacia > 1 && <span className="text-fuuton"> (¡eficaz!)</span>}
                {evento.eficacia < 1 && <span className="text-pergamino-200/50"> (poco eficaz)</span>}
              </p>
            );
          })}
          {transicionRonda && (
            <p className="text-sello-500 text-sm font-display mt-auto">
              {ronda.jugador.nombre} ha caído — {resultado.rondas[indiceRonda + 1]?.jugador.nombre} entra en combate...
            </p>
          )}
        </div>

        {!rondaCompleta && (
          <button
            type="button"
            onClick={() => setTurnosRevelados(ronda.historial.length)}
            className="mt-4 text-xs text-pergamino-200/60 underline hover:text-pergamino-100"
          >
            Saltar animación
          </button>
        )}

        {combateTotalTerminado && (
          <div className="mt-6 text-center">
            <p className={`font-naruto text-4xl mb-4 ${resultado.jugadorGanoFinal ? 'text-fuuton' : 'text-sello-500'}`}>
              {resultado.jugadorGanoFinal ? 'Victoria' : 'Derrota'}
            </p>

            {runTerminada ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  {runGanada
                    ? '¡Has completado la run entera! Konoha está a salvo.'
                    : 'Todo tu equipo ha caído. La run ha terminado.'}
                </p>
                <button
                  type="button"
                  onClick={irAGameOver}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  Ver resultado
                </button>
              </div>
            ) : resultado.arcoCompletado ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  Has superado {arcoActualDatos?.nombre}. Un nuevo arco comienza.
                </p>
                <button
                  type="button"
                  onClick={avanzarSiguienteArco}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  Continuar al siguiente arco
                </button>
              </div>
            ) : recompensaMiniJefe ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  ¡Has derrotado al mini-jefe! Hay una recompensa esperándote.
                </p>
                <button
                  type="button"
                  onClick={irARecompensaMiniJefe}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  Ver recompensa
                </button>
              </div>
            ) : hayMasEnCadena ? (
              <p className="text-pergamino-200/60 text-sm animate-pulse">
                Siguiente enemigo ({cadenaEnemigos.indiceActual + 2} / {cadenaEnemigos.enemigos.length})...
              </p>
            ) : (
              <button
                type="button"
                onClick={volverAlMapa}
                className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
              >
                Continuar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
