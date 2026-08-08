import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import achievementsData from '../../data/achievements.json';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import itemsData from '../../data/items.json';

function nombrePersonajeOJefe(id) {
  return (
    personajesData.personajes.find((p) => p.id === id)?.nombre
    ?? enemiesData.jefes.find((j) => j.id === id)?.nombre
    ?? id
  );
}

function nombreObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id)?.nombre ?? id;
}

/** Texto legible de qué desbloquea la recompensa de un logro, para mostrar siempre (esté conseguido o no). */
function textoRecompensa(recompensa) {
  if (recompensa.tipo === 'desbloquearPersonajeReclutable') {
    return `Desbloquea a ${nombrePersonajeOJefe(recompensa.personajeId)} como reclutable en cualquier tienda futura.`;
  }
  if (recompensa.tipo === 'desbloquearObjetoInicial') {
    return `Empiezas cualquier run futura con ${nombreObjeto(recompensa.objetoId)} en el inventario.`;
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
          <p className="text-sello-500 text-xs tracking-[0.3em] uppercase mb-1">Meta-progresión</p>
          <h1 className="font-display text-3xl font-bold text-pergamino-100">Logros</h1>
          <p className="text-xs text-pergamino-200/60 mt-1">{conseguidos} / {total} desbloqueados</p>
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
                    {desbloqueado ? 'Desbloqueado' : 'Pendiente'}
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
            Volver al mapa
          </button>

          {/* TEMPORAL: solo para probar el desbloqueo de logros en desarrollo. Quitar antes de publicar. */}
          <button
            type="button"
            onClick={reiniciarLogros}
            className="px-4 py-1.5 text-xs border border-dashed border-pergamino-200/30 text-pergamino-200/50 hover:text-pergamino-200/80 hover:border-pergamino-200/60 rounded-full transition-colors"
          >
            [DEV] Reiniciar logros
          </button>
        </div>
      </div>
    </div>
  );
}
