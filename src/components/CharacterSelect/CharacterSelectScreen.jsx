import { useState } from 'react';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import personajesData from '../../data/characters.json';
import achievementsData from '../../data/achievements.json';
import configGlobal from '../../data/config.json';
import { obtenerPersonajesInicialesDesbloqueados } from '../../engine/achievements';
import { FichaPersonaje } from '../common/PersonajeHoverCard';
import { CabeceraPantalla } from '../common/PiezasUI';

function TarjetaCandidato({ personaje, seleccionado, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'elevar-hover w-full border-2 text-left',
        seleccionado
          ? 'border-sello-500'
          : 'border-transparent hover:border-pergamino-200/40 hover:shadow-lg hover:shadow-black/40',
      ].join(' ')}
    >
      {/* Con el nivel, aunque siempre sea 1: elegir con quién empiezas es un
          reclutamiento como el de los pergaminos, y la ficha tiene que decir lo
          mismo en los dos sitios. Sin él, la fila de la rareza se quedaba coja y
          esta era la única tarjeta del juego que no decía a qué nivel entra. */}
      <FichaPersonaje id={personaje.id} nivel={1} className="p-3" />
      {seleccionado && <p className="text-[9px] text-sello-500 text-center py-1 font-display">★ Chosen</p>}
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
      {/* A pantalla completa y sin marco de ventana: es el arranque de la run, el
          único momento en que todavía no hay mapa detrás que enseñar. */}
      <div className="max-w-3xl w-full text-center flex flex-col gap-6">
        <CabeceraPantalla antetitulo="A new path" titulo="Choose your ninja" />
        <p className="text-[10px] text-pergamino-200/60 -mt-4">
          The rest of your team is built by recruiting during the adventure.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
