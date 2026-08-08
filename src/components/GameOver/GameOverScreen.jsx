import { useGameStore } from '../../store/useGameStore';
import personajesData from '../../data/characters.json';

function nombrePersonaje(id) {
  return personajesData.personajes.find((p) => p.id === id)?.nombre ?? id;
}

export default function GameOverScreen() {
  const equipo = useGameStore((s) => s.equipo);
  const oro = useGameStore((s) => s.oro);
  const runGanada = useGameStore((s) => s.runGanada);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);
  const mapa = useGameStore((s) => s.mapa);
  const nodoActualId = useGameStore((s) => s.nodoActualId);
  const obtenerHpMaximo = useGameStore((s) => s.obtenerHpMaximo);
  const reiniciarRun = useGameStore((s) => s.reiniciarRun);

  const pisoAlcanzado = nodoActualId !== null ? mapa?.nodos[nodoActualId]?.piso : null;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center">
        <p className={`font-naruto text-5xl mb-2 ${runGanada ? 'text-fuuton' : 'text-sello-500'}`}>
          {runGanada ? 'Victoria' : 'Game Over'}
        </p>
        <p className="text-pergamino-200/80 text-sm mb-6">
          {runGanada
            ? 'Has derrotado a Pain y completado los 3 arcos. Konoha está a salvo.'
            : (
              <>
                Todo tu equipo ha caído
                {arcoActualDatos && pisoAlcanzado ? ` en ${arcoActualDatos.nombre}, piso ${pisoAlcanzado} de ${arcoActualDatos.numeroPisos}` : ''}.
              </>
            )}
        </p>

        <div className="bg-tinta-900 border border-pergamino-100/10 rounded-lg p-4 mb-6">
          <p className="font-display font-bold text-sm mb-3 tracking-wide">EQUIPO</p>
          <div className="flex flex-col gap-2">
            {equipo.map((p) => {
              const hpMaximo = obtenerHpMaximo(p.id) ?? 1;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-pergamino-100/10 bg-tinta-950/40 px-3 py-2"
                >
                  <div className="text-left">
                    <p className="text-sm font-display">{nombrePersonaje(p.id)}</p>
                    <p className="text-xs text-pergamino-200/50">Nv. {p.nivel}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${p.derrotado ? 'text-sello-500' : 'text-fuuton'}`}>
                      {p.derrotado ? 'Caído' : 'En pie'}
                    </p>
                    <p className="text-xs text-pergamino-200/60">{p.hpActual} / {hpMaximo} HP</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-pergamino-200/60 mt-3">Oro acumulado: {oro}</p>
        </div>

        <button
          type="button"
          onClick={reiniciarRun}
          className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
        >
          Nueva Run
        </button>
      </div>
    </div>
  );
}
