import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import campaignsData from '../../data/campaigns.json';
import achievementsData from '../../data/achievements.json';
import charactersData from '../../data/characters.json';
import arcoPaisDeLasOlas from '../../data/arcs/pais-de-las-olas.json';
import arcoExamenChunin from '../../data/arcs/examen-chunin.json';
import arcoInvasionDePain from '../../data/arcs/invasion-de-pain.json';
import enemiesData from '../../data/enemies.json';
import commonEnemiesData from '../../data/common-enemies.json';
import { PanelMarco, TituloBloque, BotonSecundario } from '../common/PiezasUI';
import iconoLogros from '../../assets/menu/logros.png';
import iconoEnciclopedia from '../../assets/menu/enciclopedia.png';
import iconoAjustes from '../../assets/menu/ajustes.png';

/**
 * Home: la puerta del juego y el selector de campañas (punto 18 del roadmap).
 *
 * **Hoy hay una sola campaña**, y la pantalla existe igualmente por dos motivos que
 * no son de interfaz:
 *
 * 1. Hasta ahora la campaña **no existía como dato**: estaba repartida entre una
 *    constante del store y una llamada de `App.jsx` que arrancaba en el arco 1 a
 *    pelo. Sacarla a `campaigns.json` es lo que convierte la segunda en contenido en
 *    vez de en código, y sale barato justo ahora que hay una.
 * 2. ⚠️ **Missions, el Bingo Book y los Ajustes solo se abrían desde el mapa**, o sea
 *    solo DENTRO de una partida — que es justo cuando no interesan. Las tres son
 *    meta-progresión: se miran entre partidas.
 *
 * La forma es la del selector de regiones de Pokelike: un panel que explica el modo,
 * y debajo **una fila por campaña partida en tres celdas** — ilustración con el
 * nombre encima, marcador, y el contador de misiones aparte. Ver
 * documentacion/38-home-y-campanas.md.
 */

/**
 * Las ilustraciones que EXISTEN, resueltas en build y con el `id` de la campaña como
 * nombre de fichero.
 *
 * ⚠️ `import.meta.glob` y no `import`, por lo mismo que la música: con un `import`
 * normal un fichero que falta **rompe el build**, así que no se podría dejar la
 * pantalla montada mientras llega el arte. Sin imagen, la celda cae a un fondo liso
 * con el nombre y no se ve rota.
 */
const ILUSTRACIONES = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/campaigns/*.{png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.[^.]+$/, ''), url]),
);

const ARCOS_POR_ID = Object.fromEntries(
  [arcoPaisDeLasOlas, arcoExamenChunin, arcoInvasionDePain].map((arco) => [arco.id, arco]),
);

// Los totales del marcador. Se calculan de los JSON y no se escriben a mano: añadir un
// personaje o un jefe no puede dejar el contador mintiendo.
const TOTAL_NINJAS = charactersData.personajes.length;
const TOTAL_ENEMIGOS = enemiesData.jefes.length
  + commonEnemiesData.plantillasGenericas.length
  + commonEnemiesData.enemigosNombrados.length;
const TOTAL_LOGROS = achievementsData.logros.length;

/** Una línea del marcador: etiqueta a la izquierda, cifra a la derecha, como en la referencia. */
function FilaMarcador({ etiqueta, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[10px]">
      <span className="text-pergamino-200/55 shrink-0">{etiqueta}</span>
      {/* `truncate` en el valor y no en la etiqueta: si algo no cabe (la marca lleva
          el nombre del arco entero) es preferible cortar el dato a que la fila se
          parta en dos y descuadre la columna. */}
      <span className="font-display text-pergamino-100 truncate">{valor}</span>
    </div>
  );
}

function TarjetaCampana({ campana, marcador, logros, onElegir }) {
  const ilustracion = ILUSTRACIONES[campana.id] ?? null;
  // ⚠️ **Los nombres de los arcos, que son la promesa concreta de la campaña.** La
  // primera versión de esta pantalla los listaba y la segunda los perdió al copiar la
  // forma de la referencia: allí "KANTO · GEN 1" ya le dice todo a quien la lee, y
  // "The Ninja Road" no dice nada. Salen de `arcoIds`, o sea que reordenar la campaña
  // en el JSON reordena también esta línea.
  const nombresDeArcos = campana.arcoIds
    .map((id) => ARCOS_POR_ID[id]?.nombre)
    .filter(Boolean)
    .join(' · ');

  return (
    // La tarjeta ENTERA es el botón, como en la referencia: allí se pulsa la región,
    // no un "Start" dentro de ella. Un botón del tamaño de la fila también es más
    // fácil de acertar, y aquí solo hay una acción posible.
    <button type="button" onClick={() => onElegir(campana.id)} className="elevar-hover w-full text-left group">
      <PanelMarco className="p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* 1) La ilustración, con el nombre encima */}
          <div
            className="escena-oscura relative w-full sm:w-64 h-32 sm:h-auto shrink-0 bg-tinta-950 border-b sm:border-b-0 sm:border-r border-marco"
            style={ilustracion ? {
              backgroundImage: `url(${ilustracion})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            {/* Degradado por debajo del texto y no un velo uniforme: el nombre necesita
                fondo, pero oscurecer la ilustración entera sería tapar justo lo que
                se ha puesto ahí para que se vea. */}
            <div className="absolute inset-0 bg-gradient-to-t from-tinta-950/95 via-tinta-950/30 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <h2 className="font-naruto text-2xl text-pergamino-100 leading-none">{campana.nombre}</h2>
              <p className="font-display text-[8px] text-pergamino-200/70 tracking-[0.15em] uppercase mt-1 leading-relaxed">
                {nombresDeArcos}
              </p>
            </div>
          </div>

          {/* 2) El marcador */}
          <div className="flex-1 p-4 flex flex-col justify-center gap-1.5 min-w-0">
            {marcador.map((fila) => (
              <FilaMarcador key={fila.etiqueta} {...fila} />
            ))}
          </div>

          {/* 3) Las misiones, en su propia celda como en la referencia: no es una cifra
                más del marcador, es la meta-progresión del juego entero. */}
          <div className="sm:w-32 shrink-0 p-4 flex flex-col items-center justify-center gap-1 border-t sm:border-t-0 sm:border-l border-marco">
            <TituloBloque className="text-center">Missions</TituloBloque>
            <p className="font-display text-[13px] text-oro">{logros}</p>
          </div>
        </div>
      </PanelMarco>
    </button>
  );
}

export default function HomeScreen() {
  const elegirCampana = useGameStore((s) => s.elegirCampana);
  const abrirLogros = useGameStore((s) => s.abrirLogros);
  const abrirEnciclopedia = useGameStore((s) => s.abrirEnciclopedia);
  const abrirAjustes = useGameStore((s) => s.abrirAjustes);
  const logrosDesbloqueados = useAchievementsStore((s) => s.logrosDesbloqueados);
  const contadores = useAchievementsStore((s) => s.contadores);
  const vistos = useAchievementsStore((s) => s.vistos);
  const marca = useAchievementsStore((s) => s.marca);

  // ⚠️ Estas cifras son **globales, no por campaña**: los contadores y el registro de
  // vistos suman desde que existe la partida guardada. Con una sola campaña es lo
  // mismo, y no se ha inventado un desglose por campaña para no guardar un dato que
  // hoy nadie puede leer distinto. El día que haya dos, esto hay que partirlo — y es
  // el único sitio donde se nota.
  // ⚠️ **"Hasta dónde llegaste" va la primera, y es la cifra que más importa.** En un
  // roguelike casi nadie gana: un jugador con seis runs perdidas ve "0 / 6" y no ve
  // ningún progreso, cuando a lo mejor llegó a pelear contra Pain. La referencia no
  // tiene este problema porque allí la campaña se termina; aquí no.
  const arcoDeLaMarca = marca.arcoId ? ARCOS_POR_ID[marca.arcoId] : null;
  const marcador = [
    {
      etiqueta: 'Furthest',
      valor: arcoDeLaMarca ? `${arcoDeLaMarca.nombre} · Floor ${marca.piso}` : '—',
    },
    { etiqueta: 'Runs won', valor: contadores.runsCompletadas },
    { etiqueta: 'Runs lost', valor: contadores.runsPerdidas },
    { etiqueta: 'Battles won', valor: contadores.combatesGanados },
    { etiqueta: 'Ninja met', valor: `${(vistos.personajes ?? []).length}/${TOTAL_NINJAS}` },
    { etiqueta: 'Enemies faced', valor: `${(vistos.enemigos ?? []).length}/${TOTAL_ENEMIGOS}` },
  ];

  const ATAJOS = [
    { etiqueta: 'Missions', icono: iconoLogros, onClick: abrirLogros },
    { etiqueta: 'Bingo Book', icono: iconoEnciclopedia, onClick: abrirEnciclopedia },
    { etiqueta: 'Settings', icono: iconoAjustes, onClick: abrirAjustes },
  ];

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center gap-4">
      <header className="text-center pt-4">
        <h1 className="font-naruto text-5xl text-pergamino-100">Narutolike</h1>
      </header>

      {/* El panel que explica el modo, como el "Story" de la referencia. Aquí sí hace
          falta texto de apoyo y no es ruido: es lo primero que ve alguien que no sabe
          qué es esto, y dice las dos reglas que definen la partida. */}
      <PanelMarco className="p-4 w-full max-w-3xl">
        <TituloBloque tono="seccion">Campaign</TituloBloque>
        <p className="text-[10px] text-pergamino-200 leading-relaxed mt-2">
          A campaign is one continuous run through several arcs. Your squad, your gold and your
          wounds carry from one arc to the next — and if the whole squad falls, the run is over.
          What you unlock along the way is yours to keep.
        </p>
      </PanelMarco>

      <div className="w-full max-w-3xl flex flex-col gap-3">
        {campaignsData.campanas.map((campana) => (
          <TarjetaCampana
            key={campana.id}
            campana={campana}
            marcador={marcador}
            logros={`${logrosDesbloqueados.length}/${TOTAL_LOGROS}`}
            onElegir={elegirCampana}
          />
        ))}
      </div>

      <PanelMarco tono="hueco" className="p-3 w-full max-w-3xl">
        <p className="text-[9px] text-pergamino-200/60 leading-relaxed text-center">
          More campaigns are on the way. In the meantime, the Bingo Book keeps track of everyone
          you meet.
        </p>
      </PanelMarco>

      <nav className="flex items-center gap-2 flex-wrap justify-center pt-1">
        {/* ⚠️ `sobreFondo`: estos tres botones no están dentro de ningún panel, se
            pintan **directamente encima del dibujo de fondo**. Sin él, el kit los deja
            con el fondo transparente y el texto al 60%, que es lo correcto dentro de
            una ventana —donde la superficie de detrás ya es opaca— y se vuelve
            ilegible sobre la aldea de noche. Es la misma familia de problema que
            `.escena-oscura`: lo que se pinta sobre un dibujo necesita su propia
            superficie. Lo usan también la tienda y reclutar, por lo mismo. */}
        {ATAJOS.map((atajo) => (
          <BotonSecundario key={atajo.etiqueta} onClick={atajo.onClick} sobreFondo className="elevar-hover flex items-center gap-2">
            <img
              src={atajo.icono}
              alt=""
              aria-hidden="true"
              draggable="false"
              className="w-5 h-5 object-contain imagen-suave"
            />
            {atajo.etiqueta}
          </BotonSecundario>
        ))}
      </nav>
    </div>
  );
}
