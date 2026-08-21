import { useGameStore } from '../../store/useGameStore';
import { nombrePersonaje } from '../common/nombres';
import { spriteDeCombate } from '../common/datosDeLuchador';
import { PanelMarco, CabeceraPantalla, TituloBloque, BotonPrincipal } from '../common/PiezasUI';

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

  const pisoAlcanzado = nodoActualId !== null ? mapa?.nodos[nodoActualId]?.piso : null;

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
