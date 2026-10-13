import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { spriteDeCombate } from '../common/datosDeLuchador';
import { nombreCorto } from '../common/nombres';
import { FilaMedallas } from '../common/Medallas';
import { PanelMarco, VentanaModal } from '../common/PiezasUI';
import campaignsData from '../../data/campaigns.json';
import arcoOlas from '../../data/arcs/pais-de-las-olas.json';
import arcoChunin from '../../data/arcs/examen-chunin.json';
import arcoPain from '../../data/arcs/invasion-de-pain.json';

/**
 * El Salón de la Fama, como el de Pokémon: **cada run ganada, con el equipo que la
 * ganó**, sus niveles y sus medallas. Ventana sobre el Home, como Missions y el Bingo
 * Book — es meta-progresión, lo que se mira entre partidas.
 *
 * Existe porque ganar una run no dejaba nada visible: el contador "Runs won" del Home
 * subía en uno y el equipo que lo había conseguido desaparecía con la run. En un
 * roguelike, el equipo ganador ES la historia que el jugador quiere volver a ver.
 *
 * Los datos los escribe `jugarCombate` al caer el jefe que acaba la run
 * (`registrarEnSalonDeLaFama`) y viven en `useAchievementsStore`, que sobrevive a la run.
 */

const ARCOS_POR_ID = Object.fromEntries([arcoOlas, arcoChunin, arcoPain].map((a) => [a.id, a]));

function arcosDeLaCampana(campanaId) {
  const campana = campaignsData.campanas.find((c) => c.id === campanaId) ?? campaignsData.campanas[0];
  return (campana?.arcoIds ?? []).map((id) => ARCOS_POR_ID[id]).filter(Boolean);
}

function EntradaDelSalon({ entrada, numero }) {
  const campana = campaignsData.campanas.find((c) => c.id === entrada.campanaId);
  return (
    <PanelMarco esquinas={false} className="px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-[10px] text-oro">#{numero} · {campana?.nombre ?? 'Campaign'}</p>
        <p className="text-[9px] text-pergamino-200/60">{entrada.fecha}</p>
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-end gap-2">
          {entrada.equipo.map((p) => {
            const sprite = spriteDeCombate(p.id, p.nivel);
            return (
              <div key={p.id} className="flex flex-col items-center w-20">
                {sprite && (
                  <img
                    src={sprite}
                    alt=""
                    aria-hidden="true"
                    className="w-24 h-24 -my-3 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
                <p className="font-display text-[9px] text-pergamino-100 truncate max-w-full">{nombreCorto(p.id)}</p>
                <p className="text-[8px] text-pergamino-200/60">Lv.{p.nivel}</p>
              </div>
            );
          })}
        </div>
        <FilaMedallas arcos={arcosDeLaCampana(entrada.campanaId)} ganadas={entrada.medallas ?? []} conHover={false} />
      </div>
    </PanelMarco>
  );
}

export default function SalonDeLaFamaScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const salon = useAchievementsStore((s) => s.salonDeLaFama);

  return (
    <VentanaModal
      titulo="Hall of Fame"
      subtitulo={salon.length === 1 ? '1 run won' : `${salon.length} runs won`}
      onCerrar={volverAlMapa}
      ancho="max-w-xl"
    >
      <div className="p-4 flex flex-col gap-3">
        {salon.length === 0 ? (
          // Vacío no es un error: es lo normal hasta la primera victoria, y la frase
          // dice qué hay que hacer para llenarlo.
          <p className="text-[10px] text-pergamino-200/70 leading-relaxed text-center py-6">
            No run has been won yet. Defeat the final boss of a campaign and the squad that did
            it will be honoured here.
          </p>
        ) : (
          salon.map((entrada, i) => (
            <EntradaDelSalon key={`${entrada.fecha}-${i}`} entrada={entrada} numero={salon.length - i} />
          ))
        )}
      </div>
    </VentanaModal>
  );
}
