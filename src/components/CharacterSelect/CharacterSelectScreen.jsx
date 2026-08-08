import { useState } from 'react';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import personajesData from '../../data/characters.json';
import achievementsData from '../../data/achievements.json';
import configGlobal from '../../data/config.json';
import { obtenerPersonajesInicialesDesbloqueados } from '../../engine/achievements';
import { FichaPersonaje } from '../common/PersonajeHoverCard';

function TarjetaCandidato({ personaje, seleccionado, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-lg border-2 transition-colors text-left',
        seleccionado ? 'border-sello-600' : 'border-transparent hover:border-pergamino-100/30',
      ].join(' ')}
    >
      <FichaPersonaje id={personaje.id} className="p-3" />
      {seleccionado && <p className="text-xs text-sello-500 text-center py-1 font-display">★ Elegido</p>}
    </button>
  );
}

/**
 * Pantalla de arranque real: elige `numeroPersonajesInicialesAElegir` (hoy 1)
 * personaje del roster desbloqueado — los "inicial" de characters.json más
 * los que haya desbloqueado algún logro (desbloquearPersonajeInicial). El
 * resto del equipo (hasta tamanoMaximo) se rellena reclutando durante la
 * run, no aquí — ver documentacion/19-seleccion-de-personaje.md.
 *
 * Cuando solo hay que elegir 1 (el caso de hoy), la run arranca en cuanto se
 * toca una tarjeta — no hace falta un botón de confirmación aparte para una
 * sola elección. Si algún día `numeroPersonajesInicialesAElegir` sube de 1,
 * el mismo flujo pasa a acumular selección hasta completar el número y
 * entonces confirmar, sin tener que rediseñar la pantalla.
 */
export default function CharacterSelectScreen({ onConfirmar }) {
  const logrosDesbloqueados = useAchievementsStore((s) => s.logrosDesbloqueados);
  const [seleccionados, setSeleccionados] = useState([]);

  const numeroAElegir = configGlobal.equipo.numeroPersonajesInicialesAElegir;

  const idsDesbloqueadosPorLogro = obtenerPersonajesInicialesDesbloqueados(
    achievementsData.logros,
    logrosDesbloqueados,
  );
  const roster = personajesData.personajes.filter(
    (p) => p.rareza === 'inicial' || idsDesbloqueadosPorLogro.includes(p.id),
  );

  function elegir(id) {
    if (numeroAElegir === 1) {
      onConfirmar([id]);
      return;
    }
    setSeleccionados((actuales) => {
      const siguiente = actuales.includes(id)
        ? actuales.filter((x) => x !== id)
        : [...actuales, id].slice(-numeroAElegir);
      if (siguiente.length === numeroAElegir) onConfirmar(siguiente);
      return siguiente;
    });
  }

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full text-center">
        <h1 className="font-naruto text-4xl text-pergamino-100 mb-2">Elige a tu ninja</h1>
        <p className="text-sm text-pergamino-200/60 mb-8">
          El resto del equipo se completa reclutando durante la aventura.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {roster.map((personaje) => (
            <TarjetaCandidato
              key={personaje.id}
              personaje={personaje}
              seleccionado={seleccionados.includes(personaje.id)}
              onClick={() => elegir(personaje.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
