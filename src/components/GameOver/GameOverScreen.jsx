import { useGameStore } from '../../store/useGameStore';
import { nombrePersonaje } from '../common/nombres';
import { spriteDeCombate } from '../common/datosDeLuchador';

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
          {runGanada ? 'Victory' : 'Game Over'}
        </p>
        <p className="text-pergamino-200/80 text-sm mb-6">
          {runGanada
            ? 'You have defeated Pain and completed all 3 arcs. Konoha is safe.'
            : (
              <>
                Your entire team has fallen
                {arcoActualDatos && pisoAlcanzado ? ` in ${arcoActualDatos.nombre}, floor ${pisoAlcanzado} of ${arcoActualDatos.numeroPisos}` : ''}.
              </>
            )}
        </p>

        <div className="bg-tinta-900 border border-pergamino-100/10 rounded-lg p-4 mb-6">
          <p className="font-display font-bold text-sm mb-3 tracking-wide">TEAM</p>
          <div className="flex flex-col gap-2">
            {equipo.map((p) => {
              const hpMaximo = obtenerHpMaximo(p.id) ?? 1;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-pergamino-100/10 bg-tinta-950/40 px-3 py-2"
                >
                  <div className="flex items-center gap-3 text-left min-w-0">
                    {/* La pantalla de game over es la foto final de la run: sin
                        sprites era una tabla de nombres, y el equipo que has
                        montado es justo lo que quieres ver ahí. Los caídos van
                        atenuados, igual que en combate. */}
                    {spriteDeCombate(p.id, p.nivel) && (
                      <img
                        src={spriteDeCombate(p.id, p.nivel)}
                        alt=""
                        className={`w-12 h-12 shrink-0 ${p.derrotado ? 'opacity-40' : ''}`}
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-display truncate">{nombrePersonaje(p.id)}</p>
                      <p className="text-xs text-pergamino-200/50">Lv. {p.nivel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${p.derrotado ? 'text-sello-500' : 'text-fuuton'}`}>
                      {p.derrotado ? 'Defeated' : 'Standing'}
                    </p>
                    <p className="text-xs text-pergamino-200/60">{p.hpActual} / {hpMaximo} HP</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-pergamino-200/60 mt-3">Gold accumulated: {oro}</p>
        </div>

        <button
          type="button"
          onClick={reiniciarRun}
          className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
        >
          New Run
        </button>
      </div>
    </div>
  );
}
