import { useState } from 'react';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import personajesData from '../../data/characters.json';
import achievementsData from '../../data/achievements.json';
import configGlobal from '../../data/config.json';
import { obtenerPersonajesInicialesDesbloqueados } from '../../engine/achievements';
import PersonajeHoverCard from '../common/PersonajeHoverCard';

const COLOR_TIPO = {
  katon: 'bg-katon',
  fuuton: 'bg-fuuton',
  raiton: 'bg-raiton',
  doton: 'bg-doton',
  suiton: 'bg-suiton',
};

function TarjetaCandidato({ personaje, seleccionado, onClick }) {
  return (
    <PersonajeHoverCard id={personaje.id} className="block">
      <button
        type="button"
        onClick={onClick}
        className={[
          'w-full flex flex-col items-center text-center rounded-lg border-2 p-4 transition-colors',
          seleccionado
            ? 'border-sello-600 bg-sello-600/10'
            : 'border-pergamino-100/10 bg-tinta-900 hover:border-pergamino-100/30',
        ].join(' ')}
      >
        <p className="font-display text-lg text-pergamino-100">{personaje.nombre}</p>
        <span
          className={`inline-block text-[10px] uppercase tracking-wide text-pergamino-100 rounded-full px-2 py-0.5 mt-1 ${COLOR_TIPO[personaje.tipo] ?? 'bg-tinta-800'}`}
        >
          {personaje.tipo}
        </span>
        {seleccionado && <p className="text-xs text-sello-500 mt-2 font-display">★ Elegido</p>}
      </button>
    </PersonajeHoverCard>
  );
}

/**
 * Pantalla de arranque real: elige `numeroPersonajesInicialesAElegir` (hoy 1)
 * personaje del roster desbloqueado — los "inicial" de characters.json más
 * los que haya desbloqueado algún logro (desbloquearPersonajeInicial). El
 * resto del equipo (hasta tamanoMaximo) se rellena reclutando durante la
 * run, no aquí — ver documentacion/19-seleccion-de-personaje.md.
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

  function alternarSeleccion(id) {
    setSeleccionados((actuales) => {
      if (actuales.includes(id)) return actuales.filter((x) => x !== id);
      if (actuales.length >= numeroAElegir) return numeroAElegir === 1 ? [id] : actuales;
      return [...actuales, id];
    });
  }

  const listoParaEmpezar = seleccionados.length === numeroAElegir;

  return (
    <div className="min-h-screen bg-tinta-950 text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full text-center">
        <p className="text-sello-500 text-xs tracking-[0.3em] uppercase mb-1">Nueva run</p>
        <h1 className="font-display text-3xl font-bold text-pergamino-100 mb-2">Elige a tu ninja</h1>
        <p className="text-sm text-pergamino-200/60 mb-8">
          {numeroAElegir === 1
            ? 'El resto del equipo se completa reclutando durante la aventura.'
            : `Elige ${numeroAElegir} personajes. El resto del equipo se completa reclutando durante la aventura.`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {roster.map((personaje) => (
            <TarjetaCandidato
              key={personaje.id}
              personaje={personaje}
              seleccionado={seleccionados.includes(personaje.id)}
              onClick={() => alternarSeleccion(personaje.id)}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={!listoParaEmpezar}
          onClick={() => onConfirmar(seleccionados)}
          className="mt-8 px-8 py-3 bg-sello-600 hover:bg-sello-500 disabled:bg-tinta-800 disabled:cursor-not-allowed rounded-full font-display text-pergamino-100 transition-colors"
        >
          Comenzar aventura
        </button>
      </div>
    </div>
  );
}
