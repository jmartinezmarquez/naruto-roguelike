import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { crearLuchador, turnosParaCargarJutsu } from '../../engine/combat';
import HoverTooltip from './HoverTooltip';
import {
  nombreDeTipo, nombreObjeto, rarezaDeLuchador, nombrePersonaje, nombreCorto,
  clasePastillaDeTipo,
} from './nombres';
import { nombreStat } from './efectos';
import { IconoChakraDeLuchador } from './IconoChakra';
import { spriteDeCombate, encontrarBaseDeLuchador } from './datosDeLuchador';
import { SPRITE_OBJETO } from '../Inventory/itemSprites';
import { PanelMarco, TituloBloque } from './PiezasUI';

// La búsqueda del personaje base vive en `datosDeLuchador.js` y no aquí: esta
// copia solo miraba personajes y jefes, así que la ficha devolvía null para un
// enemigo común y no se pintaba nada (lo destapó la enciclopedia, que sí los
// lista). Misma lección que `nombrePersonaje`.
const encontrarBase = encontrarBaseDeLuchador;

/**
 * Ritmo de carga del jutsu, en 3 puntitos. Es cualitativo a propósito: el
 * número exacto de turnos ("Jutsu about every 3 turns") era una ficha técnica
 * en un juego que se juega a ratos, y el ritmo real se aprende viendo la barra
 * en combate. Pero sí hace falta ALGO, porque reclutar es elegir entre tres
 * ninjas que no has visto pelear nunca: sin esto la decisión vuelve a ser solo
 * stats y el sistema de carga deja de notarse justo donde se decide.
 */
export function RitmoCarga({ luchador, className = '' }) {
  const turnos = turnosParaCargarJutsu(luchador);
  const llenos = turnos <= 2 ? 3 : turnos === 3 ? 2 : 1;
  const etiqueta = ['', 'Slow charge', 'Steady charge', 'Fast charge'][llenos];

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} title={etiqueta} aria-label={etiqueta}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < llenos ? 'bg-sello-500' : 'bg-pergamino-100/20'}`}
        />
      ))}
    </span>
  );
}

// Las transformaciones NO aparecen en ninguna tarjeta, a propósito. Se probó con
// la descripción de sus pasivas (desbordaba la tarjeta) y luego solo con el
// nombre (se truncaba: "Nine-Tails Chakra…", que no es sabor, es una tarjeta
// rota). Pero el motivo de fondo es otro: TODOS los personajes tienen
// transformación —hay un test de invariante que lo garantiza— así que decir que
// la tienen no distingue a nadie, sale igual en las 14 tarjetas.
//
// Son una sorpresa: se descubren al desbloquearlas (pantalla de transformación,
// punto 4 del roadmap), al ver saltar la pasiva en combate (punto 2), o en la
// enciclopedia si alguien quiere el detalle en frío (punto 10).

// Estrellas y color por rareza. La rareza es lo que el doc 22 pide en vez del
// tipo al estilo Pokémon; el tipo tiene su propia pastilla de color al lado, que
// dice lo mismo que decía el emoji suelto pero se lee como una etiqueta.
// Ver documentacion/22-diseño-tarjeta-de-personaje.md.
const RAREZA = {
  comun: { estrellas: '★', etiqueta: 'Common', color: 'text-pergamino-200/60' },
  inicial: { estrellas: '★', etiqueta: 'Starter', color: 'text-exito' },
  raro: { estrellas: '★★', etiqueta: 'Rare', color: 'text-suiton' },
  legendario: { estrellas: '★★★', etiqueta: 'Legendary', color: 'text-oro' },
};

/**
 * El nombre entero si cabe, y si no su versión corta ("Naruto U.").
 *
 * **Se mide, no se estima.** El primer intento contaba caracteres contra un
 * máximo fijo, aprovechando que la fuente del juego es monoespaciada — y falló en
 * cuanto la misma ficha se usó en tres anchuras distintas: cabe en el hover del
 * mapa (~232 px) pero no en la tarjeta de selección de personaje (~189 px), así
 * que "Naruto Uzumaki" salía entero en un sitio y cortado en otro. Un número
 * fijo tendría que ser el de la tarjeta más estrecha, y entonces todos los
 * nombres saldrían abreviados en todas partes.
 *
 * Aquí se pregunta al DOM: si el texto desborda su caja (`scrollWidth >
 * clientWidth`, que funciona porque el `truncate` recorta), se cambia al corto.
 * **Solo se cambia en un sentido** — una vez corto se queda corto hasta que
 * cambia el personaje. Volver atrás al ensanchar sería un bucle: el nombre largo
 * desbordaría otra vez y volvería a acortarse.
 */
function NombreQueCabe({ id, className }) {
  const ref = useRef(null);
  const [usarCorto, setUsarCorto] = useState(false);
  // Reset al cambiar de personaje **durante el render**, no en un efecto: hacer
  // `setState` síncrono dentro de un `useEffect` es el patrón que ya nos mordió
  // una vez (ver CLAUDE.md y el comentario del reset en CombatScreen).
  const [idPrevio, setIdPrevio] = useState(id);
  if (id !== idPrevio) {
    setIdPrevio(id);
    setUsarCorto(false);
  }

  useLayoutEffect(() => {
    const elemento = ref.current;
    if (!elemento || usarCorto) return undefined;
    const medir = () => {
      if (elemento.scrollWidth > elemento.clientWidth) setUsarCorto(true);
    };
    medir();
    // La tarjeta puede nacer con ancho 0 (dentro de un tooltip que aún no se ha
    // colocado) o cambiar con la ventana, así que no vale medir una sola vez.
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [id, usarCorto]);

  return (
    <p ref={ref} className={`truncate ${className}`}>
      {usarCorto ? nombreCorto(id) : nombrePersonaje(id)}
    </p>
  );
}

/** La barra de HP, con el color por tramos igual que en combate. */
function BarraHp({ actual, maximo }) {
  const porcentaje = Math.max(0, Math.min(1, actual / maximo));
  const color = porcentaje > 0.5 ? 'bg-exito' : porcentaje > 0.2 ? 'bg-oro' : 'bg-sello-500';

  return (
    <div>
      <div className="h-2 w-full bg-tinta-800 rounded-sm overflow-hidden border border-marco">
        <div className={`h-full ${color}`} style={{ width: `${porcentaje * 100}%` }} />
      </div>
      {/* Centrado bajo la barra, no alineado a la derecha: la cifra pertenece a
          la barra entera, y pegada a un extremo parecía el final de otra cosa. */}
      <p className="text-[10px] mt-1 text-pergamino-200/60 text-center">
        {Math.max(0, actual)} / {maximo} HP
      </p>
    </div>
  );
}

/**
 * Las cuatro estadísticas en lista alineada, sin barras (doc 22).
 *
 * Con las abreviaturas de siempre y sin iconos: "⚔ Attack" y "❤ Max HP" no
 * cabían en media columna con la fuente pixel art, así que "Max HP" se partía en
 * dos líneas y descuadraba la rejilla entera. ATK/DEF/SPD/HP son tres letras,
 * caben siempre y en un juego de stats no hay que explicarlas.
 *
 * ⚠️ **Las abreviaturas salen de `nombreStat`** y ya no de una tabla local. Había DOS
 * tablas —una aquí y otra en la enciclopedia— y las dos decían `ATT`/`SPE` mientras las
 * pastillas de evento decían `ATK`/`SPD`: el mismo dato con dos nombres en la misma
 * partida. Ahora hay un solo sitio donde se escriben.
 *
 * `deltas` es opcional: `{ stat: { permanente, temporal } }`, ya ESCALADOS al nivel.
 * Ver `FichaPersonaje` para por qué no se pueden pintar los números crudos.
 */
function Estadisticas({ stats, deltas = null }) {
  const filas = [
    ['ataque', stats.ataque],
    ['defensa', stats.defensa],
    ['velocidad', stats.velocidad],
    ['hp', stats.hp],
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {filas.map(([stat, valor]) => {
        const delta = deltas?.[stat];
        return (
          <div key={stat} className="flex items-baseline justify-between gap-1">
            <span className="text-[10px] text-pergamino-200/60">{nombreStat(stat)}</span>
            <span className="flex items-baseline gap-1 min-w-0">
              {/* Los dos deltas van en colores DISTINTOS porque son cosas distintas, y
                  confundirlas engaña: el dorado es tuyo para siempre y el verde se gasta
                  en unos combates. Un solo color diría que el personaje vale eso, y
                  dentro de tres peleas ya no. */}
              {delta?.permanente > 0 && (
                <span className="text-[9px] text-oro" title="Permanent upgrade">
                  +{delta.permanente}
                </span>
              )}
              {delta?.temporal > 0 && (
                <span className="text-[9px] text-exito" title="Temporary buff">
                  +{delta.temporal}
                </span>
              )}
              <span className="text-[11px] font-display text-pergamino-100">{valor}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * La ficha de un personaje, en bloques separados por línea (estilo Pokelike,
 * ver documentacion/22-diseño-tarjeta-de-personaje.md): **sprite** arriba del
 * todo sobre su suelo, nombre con nivel, rareza y afinidad, HP, estadísticas,
 * jutsu con su ritmo de carga, y el objeto equipado si lo lleva.
 *
 * El sprite es el protagonista y va a **múltiplo entero** de su lienzo de 96 px
 * (aquí ×1): el pixel art a escalas no enteras duplica unas columnas de píxeles
 * y otras no, y se ve sucio por mucho que se agrande.
 *
 * `objetoEquipadoId` es opcional porque no todas las pantallas que enseñan una
 * ficha tienen equipo detrás (reclutar y selección de personaje muestran a
 * alguien que todavía no es tuyo, y ahí no hay objeto que enseñar).
 */
export function FichaPersonaje({
  id, nivel, hpActual, hpMaximo, objetoEquipadoId = null, className = '',
  bonificaciones = null, multiplicadoresBuffs = null,
}) {
  const base = useMemo(() => encontrarBase(id), [id]);

  // ⚠️ **Tres luchadores y no uno**, porque los deltas hay que MEDIRLOS y no se pueden
  // copiar de los datos:
  //
  // - La mejora permanente de un evento se suma a `statsBase` **antes** de escalar por
  //   nivel (`calcularStatsPorNivel`), así que un `+2` guardado en la instancia vale +2
  //   a nivel 1 y bastante más a nivel 20. Pintar el número crudo mentiría cada vez más
  //   según avanza la run.
  // - El buff temporal es un MULTIPLICADOR, no una suma: cuánto vale en puntos depende
  //   del nivel, del modo activo y de la mejora permanente que ya lleve encima.
  //
  // Restar dos luchadores construidos por el mismo camino que usa el combate es la única
  // forma de que el número de la ficha sea el que de verdad pelea.
  const { luchador, deltas } = useMemo(() => {
    if (!base) return { luchador: null, deltas: null };

    const conPermanente = bonificaciones
      ? {
        ...base,
        statsBase: {
          hp: base.statsBase.hp + (bonificaciones.hp ?? 0),
          ataque: base.statsBase.ataque + (bonificaciones.ataque ?? 0),
          defensa: base.statsBase.defensa + (bonificaciones.defensa ?? 0),
          velocidad: base.statsBase.velocidad + (bonificaciones.velocidad ?? 0),
        },
      }
      : base;

    const pelado = crearLuchador(base, nivel ?? 1);
    const conMejora = bonificaciones ? crearLuchador(conPermanente, nivel ?? 1) : pelado;
    const efectivo = multiplicadoresBuffs
      ? crearLuchador(conPermanente, nivel ?? 1, null, multiplicadoresBuffs)
      : conMejora;

    const porStat = {};
    for (const stat of ['ataque', 'defensa', 'velocidad', 'hp']) {
      porStat[stat] = {
        permanente: conMejora.statsBase[stat] - pelado.statsBase[stat],
        temporal: efectivo.statsBase[stat] - conMejora.statsBase[stat],
      };
    }
    return { luchador: efectivo, deltas: porStat };
  }, [base, nivel, bonificaciones, multiplicadoresBuffs]);

  if (!base || !luchador) return null;

  const hpMostrado = hpMaximo ?? luchador.hpMaximo;
  const hpActualMostrado = hpActual ?? luchador.hpMaximo;
  const rareza = RAREZA[rarezaDeLuchador(id)] ?? null;
  // Con el nivel: a partir de su umbral el personaje sale ya transformado, y la
  // ficha tiene que enseñar al ninja que te vas a encontrar (ver `spriteDeCombate`).
  const sprite = spriteDeCombate(id, nivel ?? 1);

  return (
    // `PanelMarco` con sus esquinas en corchete: esta ficha es la tarjeta de
    // personaje de TODO el juego (hover del mapa, las tres cartas de reclutar, el
    // desafío legendario, la selección inicial y el Bingo Book), así que es la que
    // más veces se ve y la que más gana con el marco. Ver
    // documentacion/33-direccion-visual.md.
    <PanelMarco className={`text-pergamino-100 text-left flex flex-col gap-2.5 ${className}`}>
      {/* Sprite sobre su claro de tierra, igual que en la tarjeta de combate:
          el disco de pergamino y la sombra de contacto para que se apoye en algo
          en vez de flotar suelto. */}
      <div className="relative h-24 flex items-end justify-center">
        <div className="absolute bottom-1 w-20 h-5 rounded-[50%] bg-pergamino-200/25 border border-marco" />
        <div className="absolute bottom-1.5 w-12 h-2 rounded-[50%] bg-tinta-950/55 blur-[2px]" />
        {sprite && (
          <img
            src={sprite}
            alt=""
            className="relative w-24 h-24 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>

      <div>
        {/* El nombre va en su propia línea y **nunca truncado**: truncar dejaba
            "Naruto Uzu…", que es justo el dato que la tarjeta existe para dar. Si
            no cabe entero se usa su versión corta, no se parte en dos líneas — así
            la tarjeta no cambia de alto según a quién estés mirando. */}
        <NombreQueCabe id={id} className="font-display font-bold text-sm leading-tight" />
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border ${clasePastillaDeTipo(id)}`}>
            <IconoChakraDeLuchador id={id} /> {nombreDeTipo(id)}
          </span>
          <div className="flex items-baseline gap-2 shrink-0">
            {/* Solo estrellas y color, sin la palabra: "★★★ Legendary" repetía
                dos veces el mismo dato y era lo más largo de la fila. Las tres
                escalas se distinguen de un vistazo por cuántas estrellas hay. El
                nombre se conserva en el `title` para quien pase por encima y para
                los lectores de pantalla. */}
            {rareza && (
              <span className={`text-[10px] ${rareza.color}`} title={rareza.etiqueta}>
                {rareza.estrellas}
              </span>
            )}
            {nivel != null && (
              <span className="text-[11px] font-display text-pergamino-200/60">Lv.{nivel}</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-marco pt-2.5">
        <BarraHp actual={hpActualMostrado} maximo={hpMostrado} />
      </div>

      {/* Aquí el rótulo SÍ va en rojo (`tono="seccion"`): es una etiqueta dentro de
          una tarjeta que ya tiene título —el nombre del ninja— y subordinada a él,
          que es el uso que le dan las maquetas a las versalitas rojas. Los títulos
          de panel ("TEAM", "ITEMS") van en crema por lo contrario. */}
      <div className="border-t border-marco pt-2.5 flex flex-col gap-1.5">
        <TituloBloque tono="seccion">Base stats</TituloBloque>
        <Estadisticas stats={luchador.statsBase} deltas={deltas} />
      </div>

      {/* Solo el jutsu y su ritmo. Fuera quedaron, a propósito:
          - el ataque básico, que ahora es el mismo para todos (ver config.json);
          - el "Power N", que no es daño sino un multiplicador contra una fórmula
            interna: parece un dato comparable y no lo es;
          - la descripción del jutsu, texto narrativo que no cambia ninguna decisión.
          Todo eso es material de enciclopedia (punto 10 del roadmap). */}
      {/* Tres columnas de verdad —icono, nombre, ritmo— y no un párrafo con el
          icono metido dentro del texto. Con el icono en línea, un jutsu de dos
          líneas lo dejaba pegado arriba a la izquierda y descentrado respecto al
          bloque, y los puntitos de la derecha igual. Ahora los dos se centran
          contra el nombre entero, ocupe una línea o dos.

          `min-h` de dos líneas: el nombre del jutsu es lo último de la tarjeta, y
          sin reservar la segunda línea las tarjetas de una línea (Rasengan) se
          quedaban con un hueco vacío abajo al estirarse la rejilla a la altura de
          las de dos (Great Fireball Jutsu).

          Sin `truncate`: los nombres llegan a 29 caracteres ("Super Beast
          Imitation Drawing") y son nombres propios, no hay forma de abreviarlos. */}
      <div className="border-t border-marco pt-2.5 flex items-center gap-2 min-h-[2.25rem]">
        <span className="shrink-0 text-[11px]" aria-hidden="true">🌀</span>
        <p className="flex-1 min-w-0 text-[11px] font-display text-pergamino-100 leading-tight">
          {base.jutsu.nombre}
        </p>
        <RitmoCarga luchador={luchador} className="shrink-0" />
      </div>

      {objetoEquipadoId && (
        <div className="border-t border-marco pt-2.5 flex items-center gap-2">
          {SPRITE_OBJETO[objetoEquipadoId] && (
            <img
              src={SPRITE_OBJETO[objetoEquipadoId]}
              alt=""
              className="w-5 h-5 shrink-0"
              style={{ imageRendering: 'pixelated' }}
            />
          )}
          <p className="text-[11px] text-pergamino-200/80 truncate">{nombreObjeto(objetoEquipadoId)}</p>
        </div>
      )}
    </PanelMarco>
  );
}

/**
 * La ficha de arriba, colgada de un hover.
 *
 * ⚠️ **Reenvía TODAS las props de la ficha, y esto ya ha fallado una vez.** Al añadir
 * `bonificaciones` y `multiplicadoresBuffs` se enchufaron en el mapa y se probaron
 * contra `FichaPersonaje`… y este envoltorio no las declaraba, así que las tiraba por el
 * camino: en el juego no se veía nada. Los tests pasaban porque montaban la ficha
 * directamente, o sea que **probaban las dos piezas y no la unión**. Si mañana la ficha
 * gana otra prop, hay que añadirla aquí también.
 */
export default function PersonajeHoverCard({
  id,
  nivel,
  hpActual,
  hpMaximo,
  objetoEquipadoId = null,
  bonificaciones = null,
  multiplicadoresBuffs = null,
  posicion = 'derecha',
  className = 'inline-block',
  children,
}) {
  if (!encontrarBase(id)) return children;

  return (
    <HoverTooltip
      posicion={posicion}
      className={className}
      contenido={(
        <FichaPersonaje
          id={id}
          nivel={nivel}
          hpActual={hpActual}
          hpMaximo={hpMaximo}
          objetoEquipadoId={objetoEquipadoId}
          bonificaciones={bonificaciones}
          multiplicadoresBuffs={multiplicadoresBuffs}
          className="w-64 shadow-xl p-3"
        />
      )}
    >
      {children}
    </HoverTooltip>
  );
}
