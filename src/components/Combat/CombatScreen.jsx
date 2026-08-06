import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const VELOCIDAD_AUTOPLAY_MS = 900;

/** Color de la barra de HP según el % restante. */
function colorBarraHp(porcentaje) {
  if (porcentaje > 0.5) return 'bg-fuuton';
  if (porcentaje > 0.2) return 'bg-raiton';
  return 'bg-sello-500';
}

function BarraLuchador({ nombre, hp, hpMaximo, modoActivoNombre, alineacion }) {
  const porcentaje = Math.max(0, hp / hpMaximo);
  return (
    <div className={alineacion === 'derecha' ? 'text-right' : 'text-left'}>
      <p className="font-display text-lg text-pergamino-100">{nombre}</p>
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
  );
}

export default function CombatScreen() {
  const resultado = useGameStore((s) => s.ultimoResultadoCombate);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const runTerminada = useGameStore((s) => s.runTerminada);

  const [turnosRevelados, setTurnosRevelados] = useState(0);
  const [resultadoPrevio, setResultadoPrevio] = useState(resultado);

  // Reseteo del contador cuando cambia el combate: ajustar estado durante el
  // render (no en un efecto) es el patrón recomendado por React para "resetear
  // un estado cuando cambia otro valor" — evita el aviso de renders en cascada.
  if (resultado !== resultadoPrevio) {
    setResultadoPrevio(resultado);
    setTurnosRevelados(0);
  }

  useEffect(() => {
    if (!resultado) return undefined;
    if (turnosRevelados >= resultado.historial.length) return undefined;
    const temporizador = setTimeout(() => setTurnosRevelados((n) => n + 1), VELOCIDAD_AUTOPLAY_MS);
    return () => clearTimeout(temporizador);
  }, [resultado, turnosRevelados]);

  // HP en el turno revelado actualmente, reconstruido restando el daño
  // acumulado de los turnos ya mostrados (no el HP final de golpe).
  const hpEnTurnoActual = useMemo(() => {
    if (!resultado) return null;
    let hpJugador = resultado.jugador.hpMaximo;
    let hpEnemigo = resultado.enemigo.hpMaximo;

    for (let i = 0; i < turnosRevelados; i++) {
      for (const evento of resultado.historial[i].eventos) {
        if (evento.defensorId === resultado.jugador.id) hpJugador -= evento.dano;
        if (evento.defensorId === resultado.enemigo.id) hpEnemigo -= evento.dano;
      }
    }
    return { hpJugador: Math.max(0, hpJugador), hpEnemigo: Math.max(0, hpEnemigo) };
  }, [resultado, turnosRevelados]);

  if (!resultado || !hpEnTurnoActual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No hay ningún combate en curso.
      </div>
    );
  }

  const combateCompleto = turnosRevelados >= resultado.historial.length;
  const eventosVisibles = resultado.historial.slice(0, turnosRevelados).flatMap((t) => t.eventos);

  return (
    <div className="min-h-screen bg-tinta-950 text-pergamino-100 font-body px-4 py-8 flex flex-col">
      <div className="max-w-xl mx-auto w-full">
        <div className="flex items-start justify-between gap-6 mb-8">
          <BarraLuchador
            nombre={resultado.jugador.nombre}
            hp={hpEnTurnoActual.hpJugador}
            hpMaximo={resultado.jugador.hpMaximo}
            modoActivoNombre={resultado.jugador.modoActivoNombre}
            alineacion="izquierda"
          />
          <span className="font-display text-2xl text-sello-500 pt-1">対</span>
          <BarraLuchador
            nombre={resultado.enemigo.nombre}
            hp={hpEnTurnoActual.hpEnemigo}
            hpMaximo={resultado.enemigo.hpMaximo}
            modoActivoNombre={resultado.enemigo.modoActivoNombre}
            alineacion="derecha"
          />
        </div>

        {/* Registro de eventos ya revelados */}
        <div className="bg-tinta-900 border border-pergamino-100/10 rounded-lg p-4 h-56 overflow-y-auto flex flex-col gap-2">
          {eventosVisibles.length === 0 && (
            <p className="text-pergamino-200/50 text-sm italic">El combate está a punto de empezar...</p>
          )}
          {eventosVisibles.map((evento, i) => {
            const esJugador = evento.atacanteId === resultado.jugador.id;
            const nombreAtacante = esJugador ? resultado.jugador.nombre : resultado.enemigo.nombre;
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
        </div>

        {!combateCompleto && (
          <button
            type="button"
            onClick={() => setTurnosRevelados(resultado.historial.length)}
            className="mt-4 text-xs text-pergamino-200/60 underline hover:text-pergamino-100"
          >
            Saltar animación
          </button>
        )}

        {combateCompleto && (
          <div className="mt-6 text-center">
            <p className={`font-display text-3xl font-bold mb-4 ${resultado.jugadorGano ? 'text-fuuton' : 'text-sello-500'}`}>
              {resultado.jugadorGano ? 'Victoria' : 'Derrota'}
            </p>

            {runTerminada ? (
              <p className="text-pergamino-200/80 text-sm">
                Todo tu equipo ha caído. La run ha terminado.
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