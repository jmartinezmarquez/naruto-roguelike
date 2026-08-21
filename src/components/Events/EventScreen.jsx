import { useGameStore } from '../../store/useGameStore';
import { nombrePersonaje, nombreObjeto } from '../common/nombres';
import { resumirEfecto, nombreStat } from '../common/efectos';
import { PanelMarco, CabeceraPantalla, BotonPrincipal, ChipEfecto } from '../common/PiezasUI';

/**
 * Nodo de evento: un texto y dos elecciones, sin combate.
 *
 * A pantalla completa y no como ventana: es una parada del camino, un momento
 * propio de la run — el mismo criterio que la tienda y reclutar (ver
 * documentacion/33-direccion-visual.md).
 *
 * La pantalla tiene **dos estados**: elegir y ver qué ha pasado. El segundo no es un
 * adorno: desde que una elección puede llevar una tirada de azar, resolver en silencio
 * y devolver al jugador al mapa le escondía justo lo que había apostado.
 *
 * ⚠️ **Las probabilidades se enseñan antes de elegir**, y aquí es donde el juego se
 * separa de Slay the Spire **a propósito**: allí la consecuencia está OCULTA y parte de
 * la gracia es no saberla. Aquí las runs son cortas y el azar entró con condiciones
 * (documentacion/35-diseño-de-eventos.md), así que una apuesta a ciegas no sería
 * tensión sino una trampa. De la referencia se copia lo VISUAL, no lo informativo.
 *
 * ⚠️ **Y las consecuencias van en pastillas, no en prosa.** La versión anterior las
 * escribía como una frase corrida —"55% You gain 30 gold. · 45% The team loses 18% of
 * its HP."— y para comparar dos elecciones había que LEERLAS enteras, que es justo lo
 * que una decisión de paso no puede pedir. En pastillas se comparan por color y por
 * cuántas hay, antes de leer una sola palabra.
 */

/** Las consecuencias de un efecto, en fila. `varios` se aplana; `azar` no llega aquí. */
function FilaDeChips({ efecto, className = '' }) {
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {resumirEfecto(efecto).map((chip, i) => (
        <ChipEfecto key={`${chip.texto}-${i}`} {...chip} />
      ))}
    </span>
  );
}

/**
 * Las dos ramas de una tirada, con su probabilidad delante de cada una.
 *
 * ⚠️ Van en DOS filas y no en una: son excluyentes —o pasa una o pasa la otra— y
 * ponerlas seguidas separadas por un punto se leía como que pasan las dos. Es el mismo
 * error de fondo que arreglan las pastillas, a otra escala.
 *
 * ⚠️ **Aquí hubo una barra de proporción y duró un playtest.** La idea era "que la
 * apuesta se vea antes de leer el número", pero salía sin etiqueta, a todo el ancho y
 * justo debajo del título de la opción, así que se leía como una barra de vida o de
 * progreso: la primera pregunta del jugador fue literalmente *"¿qué es la barra
 * amarilla?"*. **Un elemento de interfaz que hay que explicar ya ha fallado** — y este,
 * además, no añadía ningún dato: los dos porcentajes están ahí mismo, en su color.
 */
function RamasDeAzar({ efecto }) {
  const bien = Math.round(efecto.probabilidad * 100);
  const ramas = [
    { pct: bien, efecto: efecto.exito, tono: 'text-oro' },
    { pct: 100 - bien, efecto: efecto.fallo, tono: 'text-pergamino-200/55' },
  ];

  return (
    <span className="flex flex-col gap-1.5">
      {ramas.map((rama, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className={`font-display text-[11px] w-9 shrink-0 tabular-nums ${rama.tono}`}>
            {rama.pct}%
          </span>
          <FilaDeChips efecto={rama.efecto} />
        </span>
      ))}
    </span>
  );
}

/** La consecuencia de una elección: una tirada, o una fila de pastillas. */
function Consecuencia({ efecto }) {
  return efecto.tipo === 'azar' ? <RamasDeAzar efecto={efecto} /> : <FilaDeChips efecto={efecto} />;
}

/**
 * Qué ha pasado DE VERDAD, ya con los datos concretos que devolvió el store: quién
 * recibió la mejora, qué objeto salió, cuánto oro se pagó realmente.
 *
 * Es una función aparte y no la misma que la pista, aunque se parezcan: la pista es una
 * promesa en futuro y esto es una crónica en pasado. Fundirlas obligaría a que el store
 * hablara de "%" y de nombres propios, y el texto es cosa de la UI.
 */
function describirResultado(resultado) {
  switch (resultado.tipo) {
    case 'varios':
      return resultado.partes.map(describirResultado).filter(Boolean).join(' ');
    case 'curarEquipoPorcentaje':
      return 'The squad patches itself up.';
    case 'perderHpEquipo':
      return 'Everyone takes a beating.';
    case 'buffTemporalEquipo':
      return `${nombreStat(resultado.stat)} is up for the next ${resultado.combates} battles.`;
    case 'ganarXpEquipo':
      return `The squad earns ${resultado.cantidad} experience.`;
    case 'ganarOro':
      return `You pocket ${resultado.cantidad} gold.`;
    case 'perderOro':
      return resultado.cantidad > 0 ? `You hand over ${resultado.cantidad} gold.` : 'You had nothing to give.';
    case 'comprarObjetoAleatorio':
      return `You walk away with ${nombreObjeto(resultado.objetoId)}.`;
    case 'sinOro':
      return `You cannot afford it — ${resultado.coste} gold, and you are short.`;
    case 'mejoraPermanenteAleatoria':
      return `${nombrePersonaje(resultado.personajeId)} comes out of it stronger: ${nombreStat(resultado.stat)} up, for good.`;
    case 'ninguno':
    default:
      return 'Nothing comes of it.';
  }
}

/**
 * Lo que ha pasado, en pastillas — el mismo lenguaje con el que se prometió.
 *
 * Se escribe aparte de `resumirEfecto` porque un RESULTADO no es un efecto: trae datos
 * que la promesa no tenía (qué objeto salió, que no te llegaba el oro) y le faltan los
 * que la promesa sí tenía. Donde coinciden se reutiliza.
 */
function chipsDelResultado(resultado) {
  if (!resultado) return [];
  switch (resultado.tipo) {
    case 'varios':
      return (resultado.partes ?? []).flatMap(chipsDelResultado);
    case 'sinOro':
      return [{ texto: `${resultado.coste} g needed`, tono: 'coste' }];
    case 'comprarObjetoAleatorio':
      return [{ texto: nombreObjeto(resultado.objetoId), tono: 'ganancia' }];
    case 'ninguno':
      return [];
    default:
      return resumirEfecto(resultado);
  }
}

export default function EventScreen() {
  const evento = useGameStore((s) => s.eventoActual);
  const resultado = useGameStore((s) => s.resultadoEvento);
  const resolverEventoEleccion = useGameStore((s) => s.resolverEventoEleccion);
  const cerrarEvento = useGameStore((s) => s.cerrarEvento);

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body text-[10px]">
        No event in progress.
      </div>
    );
  }

  const tirada = resultado?.tirada ?? null;
  const chipsResultado = chipsDelResultado(resultado);

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center gap-4">
      {/* Un solo título, y es el del evento. Antes había TRES rótulos antes de poder
          leer nada: "ON THE ROAD", "EVENT" y el nombre del evento otra vez dentro del
          panel. */}
      <CabeceraPantalla titulo={evento.titulo} tamanoTitulo="text-3xl" />

      <PanelMarco className="max-w-lg w-full p-5 flex flex-col gap-4">
        {/* ⚠️ Aquí hubo un sprite del nodo de evento durante un rato, y se quitó porque
            **cometía el error que este mismo archivo cita dos comentarios más arriba**:
            los rótulos "ON THE ROAD" y "EVENT" se borraron por no decir nada que el
            jugador no supiera —está en un nodo de evento porque acaba de pulsarlo—, y
            un icono del nodo de evento dice EXACTAMENTE eso, solo que dibujado. Ocupaba
            el sitio de un título de ventana sin ser uno.
            La regla que deja: **decoración que repite el contexto sigue siendo repetir
            el contexto.** Si algún día hay ilustración POR EVENTO, eso sí aporta —sería
            contenido, no etiqueta— y va aquí. */}
        <p className="text-[11px] text-pergamino-200 leading-relaxed text-center">
          {evento.descripcion}
        </p>

        {resultado ? (
          <div className="flex flex-col gap-3.5 border-t border-marco pt-4">
            {/* El veredicto de la tirada va SOLO cuando hubo tirada, y con su
                porcentaje otra vez delante: leer "40%" después de que te haya salido
                mal es la mitad de la gracia de haber apostado. */}
            {tirada && (
              <p className={`font-display text-[13px] text-center ${tirada.salioBien ? 'text-oro' : 'text-sello-500'}`}>
                {tirada.salioBien ? 'It works out' : 'It goes wrong'}
                <span className="text-pergamino-200/50 text-[10px]">
                  {' '}({Math.round((tirada.salioBien ? tirada.probabilidad : 1 - tirada.probabilidad) * 100)}%)
                </span>
              </p>
            )}

            {/* Las mismas pastillas con las que se prometió, ahora en pasado: es lo que
                deja comprobar de un vistazo que te han dado lo que decía. */}
            {chipsResultado.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {chipsResultado.map((chip, i) => (
                  <ChipEfecto key={`${chip.texto}-${i}`} {...chip} />
                ))}
              </div>
            )}

            <p className="text-[10px] text-pergamino-200/80 leading-relaxed text-center italic">
              {describirResultado(resultado)}
            </p>
            <BotonPrincipal onClick={cerrarEvento} className="self-center elevar-hover">
              Continue
            </BotonPrincipal>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 border-t border-marco pt-4">
            {evento.elecciones.map((eleccion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => resolverEventoEleccion(i)}
                // ⚠️ Lo que arregla este bloque es que **no se veía que fueran
                // elecciones**: la caja de una opción era idéntica a la del texto de
                // arriba —mismo fondo, mismo borde, la misma letra de 10 px— y nada
                // decía "esto se pulsa". Ahora la acción va en grande y cambia a oro al
                // pasar por encima, con el número de ancla a la izquierda.
                className="elevar-hover group text-left px-3.5 py-3 rounded-sm border border-marco bg-tinta-950/50 hover:border-oro/70 hover:bg-tinta-950/80 transition-colors flex gap-3"
              >
                {/* El número: lo que la referencia consigue con los corchetes de
                    `[Leave]`. Un ancla que dice "aquí empieza una opción" antes de leer
                    nada, y que de paso separa las dos entre sí. */}
                <span className="shrink-0 mt-0.5 w-6 h-6 rounded-sm border border-marco group-hover:border-oro/70 flex items-center justify-center font-display text-[11px] text-pergamino-200/55 group-hover:text-oro transition-colors">
                  {i + 1}
                </span>

                <span className="flex-1 min-w-0 flex flex-col gap-2">
                  <span className="font-display text-[12px] text-pergamino-100 group-hover:text-oro leading-snug transition-colors">
                    {eleccion.texto}
                  </span>
                  <Consecuencia efecto={eleccion.efecto} />
                </span>
              </button>
            ))}
          </div>
        )}
      </PanelMarco>
    </div>
  );
}
