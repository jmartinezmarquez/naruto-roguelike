import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import configGlobal from '../../data/config.json';
import { FichaPersonaje } from '../common/PersonajeHoverCard';
import { spriteDeCombate } from '../common/datosDeLuchador';
import { nombrePersonaje, nombreCorto } from '../common/nombres';
import {
  PanelMarco, CabeceraPantalla, BotonPrincipal, BotonSecundario,
} from '../common/PiezasUI';

// Rótulo de la pantalla según el pergamino que había en el mapa. Es la única
// forma que tiene el jugador de confirmar que el nodo dorado que ha elegido es
// el que ha abierto — ver documentacion/28-nodo-reclutar.md.
const CABECERA_POR_RAREZA = {
  comun: { antetitulo: 'A ninja crosses your path', titulo: 'Recruit' },
  legendario: { antetitulo: 'The golden scroll', titulo: 'Legendary Challenge' },
};

/**
 * Una de las tres cartas del pergamino verde. Es `FichaPersonaje` metida en un
 * botón, no una tarjeta propia: aquí había un diseño paralelo —con una barra por
 * estadística, que el doc 22 descarta, y sin sprite— así que reclutar enseñaba a
 * un ninja distinto del que luego salía en el hover del mapa. Una sola ficha para
 * todo el juego.
 */
function TarjetaPersonaje({ opcion, nivel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="elevar-hover w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-oro"
    >
      <FichaPersonaje
        id={opcion.personajeId}
        nivel={nivel}
        className="p-3 h-full hover:border-oro/70"
      />
    </button>
  );
}


/**
 * La ficha del pergamino dorado: la misma `FichaPersonaje` de siempre —al nivel
 * al que va a pelear, no al que tendría si lo reclutas— dentro de un marco
 * dorado. No es una carta que se elige entre tres, es un rival al que hay que
 * mirar antes de decidir si te metes, y para eso vale exactamente la misma
 * información: stats, jutsu y ritmo de carga.
 */
function TarjetaDesafio({ opcion, nivelDesafio }) {
  return (
    <div className="w-full max-w-xs border-2 border-oro/60 shadow-lg shadow-oro/10">
      <FichaPersonaje
        id={opcion.personajeId}
        nivel={nivelDesafio}
        className="p-4 border-transparent"
      />
    </div>
  );
}


function PanelReemplazo({ nombreNuevo, equipo, onElegir, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-tinta-950/80 flex items-center justify-center z-50 px-4">
      <PanelMarco className="p-6 max-w-sm w-full">
        <p className="font-display text-[10px] text-pergamino-100 text-center mb-1">Who does</p>
        <p className="font-display text-oro text-center text-xs mb-4">{nombreNuevo} replace?</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {equipo.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onElegir(p.id)}
              className="elevar-hover flex flex-col items-center gap-1 py-2 px-1 bg-tinta-800 hover:bg-sello-600/30 border border-marco hover:border-sello-600/60 rounded-sm text-[9px] text-pergamino-100 font-display"
            >
              {spriteDeCombate(p.id, p.nivel) && (
                <img
                  src={spriteDeCombate(p.id, p.nivel)}
                  alt=""
                  className="w-12 h-12"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
              <span className="truncate w-full text-center">{nombreCorto(p.id)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancelar}
          className="w-full text-[9px] font-display text-pergamino-200/50 hover:text-pergamino-100 underline"
        >
          Cancel
        </button>
      </PanelMarco>
    </div>
  );
}

export default function RecruitScreen() {
  const oferta = useGameStore((s) => s.reclutarActual);
  const equipo = useGameStore((s) => s.equipo);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const elegirReclutaDeNodo = useGameStore((s) => s.elegirReclutaDeNodo);
  const iniciarDesafioLegendario = useGameStore((s) => s.iniciarDesafioLegendario);

  const [candidatoId, setCandidatoId] = useState(null);

  if (!oferta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body text-[10px]">
        No active recruit node.
      </div>
    );
  }

  const equipoLleno = equipo.length >= configGlobal.equipo.tamanoMaximo;
  const cabecera = CABECERA_POR_RAREZA[oferta.rareza] ?? CABECERA_POR_RAREZA.comun;
  // Tres estados de la misma pantalla: la elección de siempre, el desafío
  // legendario antes de pelear, y el mismo desafío ya ganado (el ninja se ha
  // ganado a pulso y ahora sí se recluta).
  const desafioPendiente = oferta.esDesafio && !oferta.desafioGanado;
  const desafioGanado = oferta.esDesafio && oferta.desafioGanado;
  const rival = oferta.personajes[0] ?? null;

  function manejarClic(personajeId) {
    if (equipoLleno) {
      setCandidatoId(personajeId);
    } else {
      elegirReclutaDeNodo(personajeId);
      volverAlMapa();
    }
  }

  function confirmarReemplazo(idAReemplazar) {
    elegirReclutaDeNodo(candidatoId, idAReemplazar);
    setCandidatoId(null);
    volverAlMapa();
  }

  return (
    // A pantalla completa: reclutar es una decisión de la run —y el pergamino
    // dorado, un combate— no una consulta sobre el mapa.
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body flex flex-col items-center justify-center px-4 py-8 gap-6">
      <div className="flex flex-col gap-2">
        <CabeceraPantalla
          antetitulo={desafioGanado ? 'The scroll is yours' : cabecera.antetitulo}
          titulo={desafioGanado ? 'They Yield' : cabecera.titulo}
        />
        <p className="text-[10px] text-pergamino-200 text-center max-w-md">
          {desafioPendiente
            ? 'Beat them in combat and they will join you'
            : desafioGanado
              ? equipoLleno
                ? 'Choose who steps aside to make room'
                : 'A legendary ninja joins your team'
              : equipoLleno
                ? 'Your team is full — tap one to choose who they replace'
                : 'Tap a ninja to add them to your team'}
        </p>
      </div>

      {oferta.esDesafio && rival ? (
        <div className="flex flex-col items-center gap-5">
          <TarjetaDesafio opcion={rival} nivelDesafio={oferta.nivelDesafio} />
          {desafioPendiente ? (
            <>
              {/* El aviso va en rojo y sin rodeos: aceptar puede terminar la run
                  ahí mismo, y el jugador tiene que saberlo ANTES de pulsar. */}
              <p className="text-sello-500 text-[10px] text-center max-w-md leading-relaxed">
                Your whole team fights them in a row, with the HP they have now.
                If everyone falls, the run ends.
              </p>
              <BotonPrincipal
                onClick={iniciarDesafioLegendario}
                className="elevar-hover px-10 py-3 tracking-widest"
              >
                FIGHT
              </BotonPrincipal>
            </>
          ) : (
            /* En `exito` y no en `fuuton`: es el verde de "lo has conseguido", no
               el color del chakra de viento del rival de turno. */
            <button
              type="button"
              onClick={() => manejarClic(rival.personajeId)}
              className="elevar-hover px-10 py-3 bg-exito hover:brightness-110 rounded-full font-display text-[11px] text-sobre-acento tracking-widest"
            >
              RECRUIT
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
          {oferta.personajes.length > 0 ? (
            oferta.personajes.map((opcion) => (
              <TarjetaPersonaje
                key={opcion.personajeId}
                opcion={opcion}
                nivel={oferta.nivelReclutamiento}
                seleccionado={false}
                onClick={() => manejarClic(opcion.personajeId)}
              />
            ))
          ) : (
            <p className="col-span-3 text-center text-pergamino-200 text-[10px] py-8">
              No ninjas available to recruit here.
            </p>
          )}
        </div>
      )}

      <BotonSecundario onClick={volverAlMapa} sobreFondo className="px-8 tracking-widest">
        {desafioPendiente ? 'WALK AWAY' : 'SKIP'}
      </BotonSecundario>

      {candidatoId && (
        <PanelReemplazo
          nombreNuevo={nombrePersonaje(candidatoId)}
          equipo={equipo}
          onElegir={confirmarReemplazo}
          onCancelar={() => setCandidatoId(null)}
        />
      )}
    </div>
  );
}
