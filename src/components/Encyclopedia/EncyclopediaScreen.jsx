import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import commonEnemiesData from '../../data/common-enemies.json';
import itemsData from '../../data/items.json';
import typesData from '../../data/types.json';
import { crearLuchador, turnosParaCargarJutsu } from '../../engine/combat';
import { normalizarPasivas, describirPasiva, nombrePasiva } from '../../engine/passives';
import { FichaPersonaje } from '../common/PersonajeHoverCard';
import { spriteDeLuchador } from '../common/characterSprites';
import { spriteDeModo } from '../common/transformationSprites';
import { encontrarBaseDeLuchador } from '../common/datosDeLuchador';
import { SPRITE_OBJETO, COLOR_RAREZA, ETIQUETA_RAREZA, lineasDeEfecto } from '../Inventory/itemSprites';
import {
  nombreCorto, nombreObjeto, tipoDeLuchador, clasePastillaDeNaturaleza,
} from '../common/nombres';
import { IconoChakra, IconoChakraDeLuchador } from '../common/IconoChakra';
import {
  PanelMarco, VentanaModal, FilaPestanas, IconoEnmarcado, TituloBloque, CampoDato,
  BotonSecundario,
} from '../common/PiezasUI';

/**
 * Enciclopedia (punto 10 del roadmap): el sitio donde vive todo lo que se fue
 * SACANDO de las tarjetas para que cupieran en pantalla — la descripción de cada
 * jutsu, su potencia, el ritmo exacto de carga, qué hace cada transformación, la
 * descripción narrativa de los objetos y la tabla de eficacias de chakra.
 *
 * Hasta ahora esa información no estaba en ninguna parte, y la deuda crecía cada
 * vez que se adelgazaba una ficha. Es consulta voluntaria: se abre desde el menú
 * de iconos del mapa, como Logros, y nunca se cruza en medio de una run.
 *
 * **Solo enseña lo que el jugador ya ha visto** (decisión registrada en
 * documentacion/31-plan-siguientes-pasos.md). No es para inflar el contenido: las
 * transformaciones se quitaron de las tarjetas a propósito porque son una
 * sorpresa, y una lista con los 31 modos de los 15 personajes deshacía eso de un
 * plumazo. Lo no visto sale en silueta negra con el mensaje de qué hay que hacer
 * para desbloquearlo — un hueco vacío no dice que haya algo que encontrar, y la
 * gracia de una Pokédex es justamente ver lo que falta.
 *
 * El registro de vistos vive en `useAchievementsStore` porque es meta-progresión:
 * si viviera en la run, un game over borraría la enciclopedia entera.
 */

// Igual que la mochila: dos vistas, nunca las dos a la vez (ver
// documentacion/28-mochila.md). Con 15 ninjas, 14 enemigos y 11 objetos, una
// rejilla y una ficha a la vez obligaba a apretar las dos y no se leía ninguna.
const SECCIONES = [
  { id: 'ninjas', etiqueta: 'NINJA', icono: '🍥', categoria: 'personajes', porTipo: true },
  { id: 'enemigos', etiqueta: 'ENEMIES', icono: '☠', categoria: 'enemigos', porTipo: true },
  { id: 'objetos', etiqueta: 'ITEMS', icono: '🎒', categoria: 'objetos', porTipo: false },
  // La tabla de chakra no se desbloquea: son las REGLAS del juego, no contenido
  // que se descubra. Esconderla sería esconder cómo funciona el combate.
  { id: 'chakra', etiqueta: 'CHAKRA', icono: '🌀', categoria: null, porTipo: false },
];

const MENSAJE_DESBLOQUEO = {
  personajes: 'Have them in your team to unlock this entry.',
  enemigos: 'Face them in battle to unlock this entry.',
  objetos: 'Find or buy it to unlock this entry.',
};

const MENSAJE_MODO_BLOQUEADO = 'See them transform in battle to unlock this form.';

const ABREVIATURA_STAT = { ataque: 'ATT', defensa: 'DEF', velocidad: 'SPE', hp: 'HP' };

function entradasDeSeccion(seccionId) {
  if (seccionId === 'ninjas') {
    return personajesData.personajes.map((p) => ({ id: p.id, base: p }));
  }
  if (seccionId === 'enemigos') {
    return [
      ...enemiesData.jefes.map((j) => ({ id: j.id, base: j })),
      ...commonEnemiesData.enemigosNombrados.map((e) => ({ id: e.id, base: e })),
      ...commonEnemiesData.plantillasGenericas.map((e) => ({ id: e.id, base: e })),
    ];
  }
  if (seccionId === 'objetos') {
    return itemsData.objetos.map((o) => ({ id: o.id, base: o }));
  }
  return [];
}

function spriteDeEntrada(seccionId, id) {
  return seccionId === 'objetos' ? SPRITE_OBJETO[id] ?? null : spriteDeLuchador(id);
}

// El marco de cada casilla lleva el color de la naturaleza de chakra del luchador:
// con 29 entradas en rejilla, el color del marco se lee antes que cualquier
// nombre. Los objetos van por rareza, que es su eje equivalente.
function claseMarcoDeEntrada(seccionId, entrada, bloqueada) {
  if (bloqueada) return 'border-marco';
  if (seccionId === 'objetos') {
    return {
      comun: 'border-[#7cbf5a]/60', raro: 'border-[#4f9dd9]/60', legendario: 'border-[#b07cd9]/60',
    }[entrada.base.rareza] ?? 'border-marco';
  }
  return {
    katon: 'border-katon/70', fuuton: 'border-fuuton/70', raiton: 'border-raiton/70',
    doton: 'border-doton/70', suiton: 'border-suiton/70',
  }[tipoDeLuchador(entrada.id)] ?? 'border-marco';
}

/**
 * Nombre de una casilla. Los enemigos llevan delante el emoji de su naturaleza
 * porque **los cinco genin rivales se llaman igual** ("Rival Genin"): sin el
 * emoji la sección de enemigos tenía cinco casillas idénticas que solo se
 * distinguían por el color del sprite. Va delante para que sobreviva al truncado.
 */
function nombreDeCasilla(seccionId, id) {
  return seccionId === 'objetos' ? nombreObjeto(id) : nombreCorto(id);
}

/** Una casilla de la rejilla. Bloqueada: silueta y "???" en vez del nombre. */
function Casilla({ seccionId, entrada, bloqueada, onElegir }) {
  const sprite = spriteDeEntrada(seccionId, entrada.id);
  const nombre = nombreDeCasilla(seccionId, entrada.id);

  return (
    <button
      type="button"
      onClick={() => onElegir(entrada.id)}
      className="elevar-hover flex flex-col items-center gap-1"
      title={bloqueada ? MENSAJE_DESBLOQUEO[SECCIONES.find((s) => s.id === seccionId).categoria] : nombre}
    >
      <IconoEnmarcado
        src={sprite}
        bloqueado={bloqueada}
        colorMarco={claseMarcoDeEntrada(seccionId, entrada, bloqueada)}
        tamano="w-16 h-16"
      />
      <span
        className={[
          'font-display text-[7px] leading-tight text-center w-full truncate',
          bloqueada ? 'text-pergamino-200/30' : 'text-pergamino-100',
        ].join(' ')}
      >
        {bloqueada ? '???' : (
          <>
            {/* El icono de naturaleza va aparte y ya no dentro del nombre: antes se
                concatenaba al texto porque era un emoji, y un sprite no cabe en una
                cadena. Sigue delante, que es lo que hace que sobreviva al truncado —
                sin él, la sección de enemigos son cinco casillas idénticas que solo
                se distinguen por el color del sprite. */}
            {seccionId === 'enemigos' && <IconoChakraDeLuchador id={entrada.id} tamano="w-2.5 h-2.5" />}
            {nombre}
          </>
        )}
      </span>
    </button>
  );
}

/** Ficha de una entrada bloqueada: la silueta grande y qué hacer para abrirla. */
function FichaBloqueada({ seccionId, entrada, categoria }) {
  return (
    <PanelMarco tono="hueco" className="p-6 flex flex-col items-center gap-4 text-center">
      <IconoEnmarcado src={spriteDeEntrada(seccionId, entrada.id)} bloqueado tamano="w-24 h-24" />
      <p className="font-display text-base text-pergamino-200/35">???</p>
      <p className="text-[10px] text-pergamino-200/70 max-w-[16rem] leading-relaxed">
        {MENSAJE_DESBLOQUEO[categoria]}
      </p>
    </PanelMarco>
  );
}

/**
 * El bloque de jutsu: lo que la ficha de personaje dejó de enseñar a propósito.
 *
 * El ritmo de carga se calcula **a nivel 1 y sin objeto**, y se dice en pantalla.
 * `turnosParaCargarJutsu` recibe un luchador ya construido, así que el número
 * depende del nivel y del modo activo (un modo puede traer `multiplicadorCarga`):
 * sin decir a qué nivel está medido, el dato mentiría en cuanto el jugador subiera.
 */
function BloqueJutsu({ base }) {
  const luchador = useMemo(() => crearLuchador(base, 1), [base]);
  const turnos = turnosParaCargarJutsu(luchador);

  return (
    <PanelMarco className="p-4 flex flex-col gap-2">
      <TituloBloque>Jutsu</TituloBloque>
      <p className="font-display text-xs text-pergamino-100">🌀 {base.jutsu.nombre}</p>
      {base.jutsu.descripcion && (
        <p className="text-[10px] text-pergamino-200/70 leading-relaxed">{base.jutsu.descripcion}</p>
      )}
      <div className="grid grid-cols-2 gap-x-4 mt-1">
        <CampoDato etiqueta="Power">×{base.jutsu.danoBase.toFixed(2)}</CampoDato>
        <CampoDato etiqueta="Charge">
          {Number.isFinite(turnos) ? `${turnos} turn${turnos === 1 ? '' : 's'}` : '—'}
        </CampoDato>
      </div>
      <p className="text-[8px] text-pergamino-200/40 leading-relaxed">
        Charge measured at level 1 with no item equipped. Taking hits fills the gauge too, so a real
        battle is usually faster.
      </p>
    </PanelMarco>
  );
}

/**
 * Las transformaciones, cada una con su propio candado. Un personaje puede tener
 * la primera vista y la segunda no: son dos entradas del registro
 * (`naruto_0`, `naruto_1`), no una por personaje.
 */
function BloqueTransformaciones({ id, base, modosVistos }) {
  const modos = base.modos ?? [];
  if (modos.length === 0) return null;

  return (
    <PanelMarco className="p-4 flex flex-col gap-3">
      <TituloBloque>Transformations</TituloBloque>
      {modos.map((modo, indice) => {
        const visto = modosVistos.includes(`${id}_${indice}`);
        const sprite = spriteDeModo(id, indice);

        if (!visto) {
          return (
            <div key={indice} className="flex items-center gap-3">
              <IconoEnmarcado src={sprite ?? spriteDeLuchador(id)} bloqueado tamano="w-11 h-11" />
              <div className="min-w-0">
                <p className="font-display text-[10px] text-pergamino-200/35">???</p>
                <p className="text-[9px] text-pergamino-200/60 leading-relaxed">
                  {MENSAJE_MODO_BLOQUEADO}
                </p>
              </div>
            </div>
          );
        }

        // `normalizarPasivas` por modo y no sobre una lista mezclada: deduplica
        // por id quedándose la cantidad mayor, así que juntar las de dos modos (o
        // las de un objeto) daría cifras que no son las de este modo.
        const pasivas = normalizarPasivas(modo.pasivas ?? []);
        const multiplicadores = Object.entries(modo.multiplicadores ?? {})
          .filter(([, valor]) => valor !== 1);

        return (
          <div key={indice} className="flex items-start gap-3">
            <IconoEnmarcado src={sprite} colorMarco="border-oro/50" tamano="w-11 h-11" />
            <div className="min-w-0 flex flex-col gap-1">
              <p className="font-display text-[10px] text-pergamino-100">{modo.nombre}</p>
              <p className="text-[9px] text-pergamino-200/45">From level {modo.nivelDesbloqueo}</p>
              {multiplicadores.length > 0 && (
                <p className="text-[9px] text-oro/80">
                  {multiplicadores
                    .map(([stat, valor]) => `${ABREVIATURA_STAT[stat] ?? stat} ×${valor}`)
                    .join('   ')}
                </p>
              )}
              {pasivas.map((pasiva) => (
                <p key={pasiva.id} className="text-[9px] text-exito/90 leading-relaxed">
                  {nombrePasiva(pasiva.id)}: {describirPasiva(pasiva)}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </PanelMarco>
  );
}

/** Ficha de un ninja o de un enemigo ya visto. */
function FichaLuchador({ id, base, modosVistos }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Nivel 1 a propósito: `FichaPersonaje` pinta el sprite del modo activo a
          ese nivel, y con el nivel real un personaje ya transformado destriparía
          su transformación desde la rejilla, que es lo que esta pantalla evita. */}
      <FichaPersonaje id={id} nivel={1} className="p-3" />
      <BloqueJutsu base={base} />
      <BloqueTransformaciones id={id} base={base} modosVistos={modosVistos} />
    </div>
  );
}

/** Ficha de un objeto ya visto: lo que la mochila enseña, más su descripción. */
function FichaObjetoEnciclopedia({ base }) {
  const lineas = lineasDeEfecto(base);

  return (
    <PanelMarco className="p-5 flex flex-col items-center gap-3 text-center">
      <IconoEnmarcado src={SPRITE_OBJETO[base.id]} tamano="w-20 h-20" colorMarco="border-oro/40" />
      <div>
        <p className="font-display text-xs text-pergamino-100">{base.nombre}</p>
        <p className={`font-display text-[8px] mt-1 ${COLOR_RAREZA[base.rareza] ?? ''}`}>
          {ETIQUETA_RAREZA[base.rareza] ?? ''}
        </p>
      </div>
      <p className="text-[10px] text-pergamino-200/70 leading-relaxed">{base.descripcion}</p>
      <div className="w-full flex flex-col gap-1 border-t border-marco pt-2">
        {lineas.map((linea, i) => (
          <p key={i} className={`text-[10px] ${linea.positivo ? 'text-exito/90' : 'text-sello-500'}`}>
            {linea.icono} {linea.texto}
          </p>
        ))}
      </div>
    </PanelMarco>
  );
}

/**
 * La tabla de eficacias. Se lee "fila ataca a columna", y el ciclo canon va
 * Katon > Fuuton > Raiton > Doton > Suiton > Katon.
 */
function TablaChakra() {
  const { elementos, tablaEficacias } = typesData;

  return (
    <PanelMarco className="p-4 flex flex-col gap-3">
      <p className="text-[10px] text-pergamino-200/60 leading-relaxed text-center">
        Rows attack, columns defend. Matching the right nature is the only lever you have in a fight
        you do not control.
      </p>
      <div className="overflow-x-auto">
        <table className="text-[9px] border-collapse mx-auto">
          <thead>
            <tr>
              <th className="p-1" />
              {elementos.map((tipo) => (
                <th key={tipo} className="p-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded-sm border ${clasePastillaDeNaturaleza(tipo)}`}>
                    <IconoChakra tipo={tipo} tamano="w-3 h-3" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elementos.map((atacante) => (
              <tr key={atacante}>
                <th className="p-1 text-right">
                  <span className={`inline-block px-1.5 py-0.5 rounded-sm border ${clasePastillaDeNaturaleza(atacante)}`}>
                    <IconoChakra tipo={atacante} tamano="w-3 h-3" />
                  </span>
                </th>
                {elementos.map((defensor) => {
                  const eficacia = tablaEficacias[atacante][defensor];
                  // Verde/rojo SEMÁNTICOS, no colores de elemento: esta tabla pinta
                  // los cinco elementos a la vez, así que usar `fuuton` para decir
                  // "bueno" haría chocar el significado con el elemento en la misma
                  // casilla.
                  const color = eficacia > 1
                    ? 'text-exito bg-exito/10'
                    : eficacia < 1 ? 'text-sello-500 bg-sello-600/10' : 'text-pergamino-200/40';
                  return (
                    <td key={defensor} className={`p-1.5 text-center font-display rounded-sm ${color}`}>
                      ×{eficacia}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[8px] text-pergamino-200/40 text-center">
        {/* Con sprites el ciclo se compone en JSX en vez de con `join(' → ')`: una
            imagen no se puede meter en una cadena. */}
        Cycle: {elementos.map((t) => (
          <span key={t}><IconoChakra tipo={t} tamano="w-3 h-3" /> → </span>
        ))}
        <IconoChakra tipo={elementos[0]} tamano="w-3 h-3" />
      </p>
    </PanelMarco>
  );
}

export default function EncyclopediaScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const vistos = useAchievementsStore((s) => s.vistos);
  const [seccionId, setSeccionId] = useState('ninjas');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [elegidoId, setElegidoId] = useState(null);

  const seccion = SECCIONES.find((s) => s.id === seccionId);
  const todasLasEntradas = useMemo(() => entradasDeSeccion(seccionId), [seccionId]);
  const vistosDeLaSeccion = seccion.categoria ? vistos[seccion.categoria] ?? [] : [];

  // Filtro por naturaleza de chakra, como en la maqueta. Con 29 luchadores la
  // rejilla se recorre mucho mejor por elemento que por orden de JSON, y de paso es
  // la única vista del juego donde se pueden comparar los de un mismo tipo.
  const entradas = seccion.porTipo && tipoFiltro !== 'todos'
    ? todasLasEntradas.filter((e) => tipoDeLuchador(e.id) === tipoFiltro)
    : todasLasEntradas;

  function cambiarSeccion(id) {
    setSeccionId(id);
    setElegidoId(null); // la ficha abierta no pertenece a la sección nueva
    setTipoFiltro('todos');
  }

  // Cada pestaña lleva su propio contador de descubiertas: eso es lo que las
  // convierte en resumen de progreso y no en un filtro a ciegas, que es como
  // funcionan en las dos maquetas.
  const pestanasSeccion = SECCIONES.map((s) => {
    if (!s.categoria) return { id: s.id, etiqueta: s.etiqueta, icono: s.icono };
    const suyas = entradasDeSeccion(s.id);
    const vistasAqui = (vistos[s.categoria] ?? []).filter((id) => suyas.some((e) => e.id === id));
    return {
      id: s.id,
      etiqueta: s.etiqueta,
      icono: s.icono,
      contador: `${vistasAqui.length}/${suyas.length}`,
    };
  });

  const pestanasTipo = [
    { id: 'todos', etiqueta: 'ALL' },
    ...typesData.elementos.map((tipo) => ({
      id: tipo, etiqueta: tipo.toUpperCase(), icono: <IconoChakra tipo={tipo} tamano="w-3 h-3" />,
    })),
  ];

  const elegida = elegidoId ? entradas.find((e) => e.id === elegidoId) : null;
  const elegidaBloqueada = elegida ? !vistosDeLaSeccion.includes(elegida.id) : false;
  const descubiertas = vistosDeLaSeccion
    .filter((id) => todasLasEntradas.some((e) => e.id === id)).length;
  const porcentaje = todasLasEntradas.length > 0
    ? Math.round((descubiertas / todasLasEntradas.length) * 100)
    : 0;

  // Las pestañas van en la cabecera FIJA de la ventana: mientras la rejilla corre
  // debajo, en qué sección y con qué filtro estás no se pierde nunca de vista. La
  // segunda fila desaparece al abrir una ficha, que ya no es una lista que filtrar.
  const cabecera = (
    <>
      <FilaPestanas pestanas={pestanasSeccion} activaId={seccionId} onElegir={cambiarSeccion} />
      {seccion.porTipo && !elegida && (
        <FilaPestanas pestanas={pestanasTipo} activaId={tipoFiltro} onElegir={setTipoFiltro} />
      )}
    </>
  );

  return (
    <VentanaModal
      titulo="Bingo Book"
      subtitulo={seccion.categoria
        ? `${descubiertas} / ${todasLasEntradas.length} discovered (${porcentaje}%)`
        : 'Chakra nature chart'}
      onCerrar={volverAlMapa}
      ancho="max-w-2xl"
      cabeceraFija={cabecera}
    >
      {seccionId === 'chakra' && <TablaChakra />}

      {seccionId !== 'chakra' && !elegida && (
        entradas.length === 0 ? (
          <p className="text-center text-[10px] text-pergamino-200/50 py-8">
            No entries of this nature.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
            {entradas.map((entrada) => (
              <Casilla
                key={entrada.id}
                seccionId={seccionId}
                entrada={entrada}
                bloqueada={!vistosDeLaSeccion.includes(entrada.id)}
                onElegir={setElegidoId}
              />
            ))}
          </div>
        )
      )}

      {elegida && (
        <div className="flex flex-col gap-3">
          {elegidaBloqueada && (
            <FichaBloqueada seccionId={seccionId} entrada={elegida} categoria={seccion.categoria} />
          )}
          {!elegidaBloqueada && seccionId === 'objetos' && (
            <FichaObjetoEnciclopedia base={elegida.base} />
          )}
          {!elegidaBloqueada && seccionId !== 'objetos' && (
            <FichaLuchador
              id={elegida.id}
              base={encontrarBaseDeLuchador(elegida.id) ?? elegida.base}
              modosVistos={vistos.modos ?? []}
            />
          )}
          <BotonSecundario onClick={() => setElegidoId(null)} className="self-center">
            &larr; Back to list
          </BotonSecundario>
        </div>
      )}
    </VentanaModal>
  );
}
