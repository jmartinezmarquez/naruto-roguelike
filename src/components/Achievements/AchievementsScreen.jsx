import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import achievementsData from '../../data/achievements.json';
import { nombrePersonaje as nombrePersonajeOJefe, nombreObjeto } from '../common/nombres';

function textoRecompensa(recompensa) {
  if (recompensa.tipo === 'desbloquearPersonajeReclutable') {
    return `Unlocks ${nombrePersonajeOJefe(recompensa.personajeId)} as recruitable in any future shop.`;
  }
  if (recompensa.tipo === 'desbloquearObjetoInicial') {
    return `You start any future run with ${nombreObjeto(recompensa.objetoId)} in your inventory.`;
  }
  return '';
}

export default function AchievementsScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const logrosDesbloqueados = useAchievementsStore((s) => s.logrosDesbloqueados);
  const reiniciarLogros = useAchievementsStore((s) => s.reiniciarLogros);

  const total = achievementsData.logros.length;
  const conseguidos = logrosDesbloqueados.length;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8">
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-6">
          <p className="text-sello-500 text-xs tracking-[0.3em] uppercase mb-1">Meta-progress</p>
          <h1 className="font-display text-3xl font-bold text-pergamino-100">Achievements</h1>
          <p className="text-xs text-pergamino-200/60 mt-1">{conseguidos} / {total} unlocked</p>
        </header>

        <div className="flex flex-col gap-3">
          {achievementsData.logros.map((logro) => {
            const desbloqueado = logrosDesbloqueados.includes(logro.id);
            return (
              <div
                key={logro.id}
                className={[
                  'rounded-lg border p-4 transition-colors',
                  desbloqueado ? 'bg-tinta-900 border-sello-600/50' : 'bg-tinta-900/50 border-pergamino-100/10 opacity-60',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-sm">{logro.nombre}</p>
                  <span className={`text-[10px] uppercase tracking-wide shrink-0 ${desbloqueado ? 'text-fuuton' : 'text-pergamino-200/40'}`}>
                    {desbloqueado ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="text-xs text-pergamino-200/70 mt-1">{logro.descripcion}</p>
                <p className="text-[11px] text-pergamino-200/50 mt-2 italic">{textoRecompensa(logro.recompensa)}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={volverAlMapa}
            className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
          >
            Back to map
          </button>

          {/* TEMP: dev only, remove before publishing */}
          <button
            type="button"
            onClick={reiniciarLogros}
            className="px-4 py-1.5 text-xs border border-dashed border-pergamino-200/30 text-pergamino-200/50 hover:text-pergamino-200/80 hover:border-pergamino-200/60 rounded-full transition-colors"
          >
            [DEV] Reset achievements
          </button>
        </div>
      </div>
    </div>
  );
}
