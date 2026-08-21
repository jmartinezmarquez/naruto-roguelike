import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import achievementsData from '../../data/achievements.json';
import arcoPaisDeLasOlas from '../../data/arcs/pais-de-las-olas.json';
import arcoExamenChunin from '../../data/arcs/examen-chunin.json';
import arcoInvasionDePain from '../../data/arcs/invasion-de-pain.json';
import { progresoDeLogro } from '../../engine/achievements';
import { nombrePersonaje } from '../common/nombres';
import { spriteDeCombate } from '../common/datosDeLuchador';
import { PanelMarco, CabeceraPantalla, TituloBloque, BotonPrincipal } from '../common/PiezasUI';
import { InsigniaRango } from '../common/InsigniaRango';
import { useRangoNinja } from '../common/rangos';
import { fichaDeLaRun } from '../common/fichaDeRun';
import HoverTooltip from '../common/HoverTooltip';

const NOMBRE_DE_ARCO = Object.fromEntries(
  [arcoPaisDeLasOlas, arcoExamenChunin, arcoInvasionDePain].map((a) => [a.id, a.nombre]),
);

/**
 * El botón de copiar la ficha (punto 20 del roadmap).
 *
 * ⚠️ **Con confirmación visible, y no es un adorno**: sin respuesta el jugador no
 * sabe si ha funcionado —el portapapeles no hace ruido— y lo pulsa tres veces.
 *
 * ⚠️ **Y con salida de emergencia**: `navigator.clipboard` no existe fuera de un
 * contexto seguro (http:// a pelo, algún navegador viejo). Si falla, en vez de no
 * hacer nada se enseña el texto en un cuadro seleccionable, que es lo que el
 * jugador quería de todas formas. Un botón que calla cuando falla es peor que no
 * tenerlo.
 */
function BotonCompartir({ texto }) {
  const [estado, setEstado] = useState('listo');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado('copiado');
      setTimeout(() => setEstado('listo'), 2000);
    } catch {
      setEstado('manual');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <BotonPrincipal onClick={copiar} variante="contorno" className="elevar-hover">
        {estado === 'copiado' ? 'Copied!' : 'Copy mission report'}
      </BotonPrincipal>
      {estado === 'manual' && (
        <textarea
          readOnly
          value={texto}
          onFocus={(e) => e.target.select()}
          className="w-full h-28 text-[9px] font-body bg-tinta-950 border border-marco rounded-sm p-2 text-pergamino-200"
        />
      )}
    </div>
  );
}

/**
 * ⚠️ **Cada rango dice cómo se saca el SIGUIENTE**, y esa es la mitad del punto.
 * Una nota sola es un juicio; una nota que además te enseña el peldaño de arriba
 * es una razón para volver a pulsar "New Run" — que es exactamente lo que esta
 * pantalla tiene que conseguir.
 */
const SIGUIENTE_RANGO = {
  D: 'Clear a full arc to earn a C.',
  C: 'Clear two arcs to earn a B.',
  B: 'Win the whole run to earn an A.',
  A: 'Win without losing a single ninja to earn an S.',
  S: 'Flawless. There is nothing above this.',
};

/**
 * Los logros que estás a punto de sacar (punto 21 del roadmap).
 *
 * ⚠️ **Los datos ya estaban todos**: `progresoDeLogro` existe desde el punto 5a y
 * los contadores llevan meses acumulando entre runs. Lo que faltaba no era
 * calcularlo, era **enseñarlo donde se decide si vuelves a jugar** — y eso es
 * aquí, no en la pantalla de Missions, a la que solo entra quien ya ha decidido
 * que le interesan.
 *
 * Los logros de suceso ("derrota a Gaara") quedan fuera solos: `progresoDeLogro`
 * devuelve `null` para ellos, y un "0 de 1" no es una meta cercana.
 */
function ProximosDesbloqueos() {
  const logrosDesbloqueados = useAchievementsStore((s) => s.logrosDesbloqueados);
  const contadores = useAchievementsStore((s) => s.contadores);
  const vistos = useAchievementsStore((s) => s.vistos);

  const cerca = achievementsData.logros
    .filter((l) => !logrosDesbloqueados.includes(l.id))
    .map((logro) => ({ logro, progreso: progresoDeLogro(logro, { contadores, vistos }) }))
    // ⚠️ **Empezados y sin terminar.** Sin el `> 0`, una primera muerte enseña
    // "Win 150 battles — 150 to go" bajo un cartel que dice "So close", que no es
    // que no motive: es que **el cartel miente**. Un panel que se calla cuando no
    // tiene nada que decir vale más que uno que rellena.
    .filter(({ progreso }) => progreso && progreso.actual > 0 && progreso.actual < progreso.objetivo)
    .sort((a, b) => b.progreso.actual / b.progreso.objetivo - a.progreso.actual / a.progreso.objetivo)
    .slice(0, 3);

  if (cerca.length === 0) return null;

  return (
    <PanelMarco tono="hueco" className="p-4 flex flex-col gap-2">
      <TituloBloque>So close</TituloBloque>
      {cerca.map(({ logro, progreso }) => (
        // ⚠️ **El hover dice QUÉ HAY QUE HACER.** El nombre de un logro es un
        // guiño, no una instrucción: "Full Purse — 175 to go" no dice 175 de qué.
        // La condición ya estaba escrita en `descripcion` desde el punto 5a y aquí
        // no cabía, que es exactamente para lo que sirve un tooltip.
        <HoverTooltip
          key={logro.id}
          posicion="arriba"
          className="block"
          contenido={
            <div className="w-max max-w-[16rem] bg-tinta-900 text-pergamino-100 rounded-sm border-2 border-pergamino-200/80 shadow-xl px-3 py-1.5 text-[10px] leading-relaxed text-left">
              <p className="font-display text-[10px] mb-0.5">{logro.nombre}</p>
              <p className="text-pergamino-200/80">{logro.descripcion}</p>
              <p className="text-oro/80 mt-1">
                {progreso.actual} / {progreso.objetivo} · Rank {logro.rango}
              </p>
            </div>
          }
        >
          <div className="flex items-center gap-3 text-left">
            <InsigniaRango rango={logro.rango} tamano="text-base" className="w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-pergamino-100 truncate">{logro.nombre}</p>
              <div className="h-1 bg-tinta-950 rounded-sm border border-marco overflow-hidden mt-1">
                <div
                  className="h-full bg-oro/70"
                  style={{ width: `${Math.round((progreso.actual / progreso.objetivo) * 100)}%` }}
                />
              </div>
            </div>
            <span className="font-display text-[9px] text-pergamino-200/60 shrink-0">
              {progreso.objetivo - progreso.actual} to go
            </span>
          </div>
        </HoverTooltip>
      ))}
    </PanelMarco>
  );
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
  const irAlHome = useGameStore((s) => s.irAlHome);
  const resumenDeLaRun = useGameStore((s) => s.resumenDeLaRun);
  const marca = useAchievementsStore((s) => s.marca);
  const rastroDeLaRun = useGameStore((s) => s.rastroDeLaRun);

  const pisoAlcanzado = nodoActualId !== null ? mapa?.nodos[nodoActualId]?.piso : null;
  const resumen = resumenDeLaRun();
  const rango = useRangoNinja();
  const ficha = fichaDeLaRun({
    rastro: rastroDeLaRun,
    resumen,
    rangoNinja: rango.actual.nombre,
    arcos: resumen.arcos,
    final: { arcoNombre: arcoActualDatos?.nombre, piso: pisoAlcanzado },
  });

  // ⚠️ **La marca ya incluye ESTA run**: `registrarMarca` se llama al pisar cada
  // nodo, no al terminar, así que al llegar aquí el récord puede ser el de la
  // partida que se acaba de perder. Anunciarlo como "tu mejor marca es el piso 8"
  // justo después de morir en el piso 8 no dice nada — así que cuando coinciden se
  // dice lo que de verdad ha pasado. Es la misma familia de trampa que
  // `equipoAlEmpezar`: cuando la pantalla se pinta, el estado ya está actualizado.
  const marcaEsDeEstaRun = marca.arcoId === arcoActualDatos?.id && marca.piso === pisoAlcanzado;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center flex flex-col gap-5">
        {/* A pantalla completa y no como ventana: es el final de la run, no una
            consulta. Que no haya mapa detrás es parte del mensaje.
            El verde va en `exito` y no en `fuuton`: es "has ganado", no chakra de
            viento (ver documentacion/33-direccion-visual.md). */}
        {/* ⚠️ **Un solo título.** Antes había dos —"End of the road" encima de "Game
            Over"— y son la misma frase dicha dos veces, que es el mismo ruido que ya se
            quitó de la pantalla de evento y de la tienda.

            Y al quedarse uno, el que sobrevive **no es el mismo en los dos casos**, a
            propósito: ganar pasa una vez cada muchas runs y merece la palabra llana
            —"Victory", sin coquetear—; perder pasa constantemente y ahí "GAME OVER" a
            la cara es lenguaje de máquina recreativa. "End of the Road" dice lo mismo
            desde dentro de la ficción, y de paso rima con el nombre de la campaña,
            **The Ninja Road**: lo que se acaba es el camino que elegiste al empezar. */}
        <CabeceraPantalla titulo={runGanada ? 'Victory' : 'End of the Road'} />
        <p className="text-[11px] text-pergamino-200 leading-relaxed">
          {runGanada
            ? 'You have defeated Pain and completed all 3 arcs. Konoha is safe.'
            : (
              <>
                Your entire team has fallen
                {arcoActualDatos && pisoAlcanzado ? ` in ${arcoActualDatos.nombre}, floor ${pisoAlcanzado} of ${arcoActualDatos.numeroPisos}` : ''}.
              </>
            )}
        </p>

        {/* La nota de la run, en la misma escala D-S que las misiones (punto 19).
            Va ARRIBA del equipo: es el veredicto, y el equipo es el detalle. */}
        <PanelMarco className="p-4 flex items-center justify-center gap-4">
          <InsigniaRango rango={resumen.rango} tamano="text-5xl" className="w-12 shrink-0" />
          <div className="text-left min-w-0">
            <p className="font-display text-[9px] uppercase tracking-wider text-pergamino-200/50">
              Mission rank
            </p>
            <p className="text-[10px] text-pergamino-200 leading-relaxed mt-0.5">
              {SIGUIENTE_RANGO[resumen.rango]}
            </p>
            <p className="text-[9px] text-pergamino-200/60 mt-1">
              {marcaEsDeEstaRun
                ? 'Furthest you have ever gone.'
                : `Your best: ${NOMBRE_DE_ARCO[marca.arcoId] ?? '—'}${marca.piso ? `, floor ${marca.piso}` : ''}.`}
            </p>
          </div>
        </PanelMarco>

        <PanelMarco className="p-4 flex flex-col gap-3">
          <TituloBloque>Team</TituloBloque>
          <div className="flex flex-col gap-2">
            {equipo.map((p) => {
              const hpMaximo = obtenerHpMaximo(p.id) ?? 1;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-sm border border-marco bg-tinta-950/40 px-3 py-2"
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
                      <p className="text-[11px] font-display truncate">{nombrePersonaje(p.id)}</p>
                      <p className="text-[9px] text-pergamino-200/50">Lv. {p.nivel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-display ${p.derrotado ? 'text-sello-500' : 'text-exito'}`}>
                      {p.derrotado ? 'Defeated' : 'Standing'}
                    </p>
                    <p className="text-[9px] text-pergamino-200/60">{p.hpActual} / {hpMaximo} HP</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-oro/80 mt-1">Gold accumulated: {oro}</p>
        </PanelMarco>

        <ProximosDesbloqueos />

        <BotonCompartir texto={ficha} />

        {/* Dos salidas, y hasta ahora solo había una. Sin la del Home, quien acababa
            de desbloquear un logro **no tenía forma de ir a verlo**: Missions, el Bingo
            Book y los Ajustes cuelgan del mapa y del Home, y "New Run" lleva directo a
            elegir personaje. Era justo el momento en que más apetece mirarlos.

            ⚠️ **Aquí el Home NO pregunta**, al contrario que el del menú del mapa: allí
            salir cuesta la partida en curso, y aquí ya no hay partida que perder. Una
            confirmación sin nada que confirmar es ruido, y de paso enseña al jugador a
            decir que sí sin leer. */}
        {/* ⚠️ Las dos con la MISMA forma. Antes eran un `BotonPrincipal` y un
            `BotonSecundario`, que no son variantes de lo mismo —cambian de forma, de
            tamaño de letra y de relleno—, así que parecían dos especies distintas una
            al lado de la otra en vez de dos salidas del mismo rango. Lo que las separa
            ahora es solo el relleno: cuál es la que se espera que pulses. */}
        <div className="flex items-center justify-center gap-3">
          <BotonPrincipal onClick={reiniciarRun} className="elevar-hover">New Run</BotonPrincipal>
          <BotonPrincipal onClick={irAlHome} variante="contorno" className="elevar-hover">
            Home
          </BotonPrincipal>
        </div>
      </div>
    </div>
  );
}
