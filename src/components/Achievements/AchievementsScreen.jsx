import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import achievementsData from '../../data/achievements.json';
import arcoPaisDeLasOlas from '../../data/arcs/pais-de-las-olas.json';
import arcoExamenChunin from '../../data/arcs/examen-chunin.json';
import arcoInvasionDePain from '../../data/arcs/invasion-de-pain.json';
import { progresoDeLogro } from '../../engine/achievements';
import { nombrePersonaje as nombrePersonajeOJefe, nombreObjeto } from '../common/nombres';
import { spriteDeLuchador } from '../common/characterSprites';
import { SPRITE_OBJETO } from '../Inventory/itemSprites';
import { PanelMarco, VentanaModal, FilaPestanas, IconoEnmarcado } from '../common/PiezasUI';
import { InsigniaRango, PanelRangoNinja } from '../common/InsigniaRango';

/**
 * Pantalla de Logros, siguiendo la maqueta de
 * documentacion/25-diseño-pantalla-logros.md (`layoutPantallaLogros.png`) con las
 * piezas compartidas de `PiezasUI` — ver documentacion/33-direccion-visual.md.
 *
 * **Lo que la maqueta pide y NO está aquí, a propósito**: el raíl de "recompensas
 * de progreso global" (+5% oro, +5% EXP, +1 hueco de inventario). Eso no es
 * diseño, es el punto 5b del roadmap: modificadores numéricos permanentes que
 * desplazan la curva de niveles que vigilan los invariantes de arco de
 * `leveling.test.js`. Pintar un raíl con premios que no existen es peor que no
 * tenerlo, así que el hueco se queda reservado y sin dibujar.
 *
 * La maqueta también da por hechos 28 logros. Los contadores dicen la verdad —
 * `achievementsData.logros.length`— en vez de imitar el número de la maqueta.
 */

const ARCOS = [arcoPaisDeLasOlas, arcoExamenChunin, arcoInvasionDePain];

/**
 * A qué acto pertenece un logro, **calculado y no escrito en los datos**.
 *
 * La maqueta quiere pestañas por acto y `achievements.json` no tiene campo
 * `categoria`. No hace falta: toda condición apunta ya a un arco, o por su
 * `arcoId` o por el `jefeId` de su mini-jefe o jefe final, que es justo lo que
 * declaran los JSON de arco. Añadir el campo habría sido duplicar en los logros un
 * dato que ya vive en los arcos, con las dos copias libres de desincronizarse.
 */
function arcoDelLogro(logro) {
  const { condicion } = logro;
  if (condicion.arcoId) return condicion.arcoId;
  if (condicion.jefeId) {
    const arco = ARCOS.find(
      (a) => a.miniJefeId === condicion.jefeId || a.jefeFinalId === condicion.jefeId,
    );
    if (arco) return arco.id;
  }
  return 'general';
}

const PESTANAS_BASE = [
  { id: 'todos', etiqueta: 'ALL', icono: '📜' },
  { id: 'pais_de_las_olas', etiqueta: 'ACT 1', icono: '🌊' },
  { id: 'examen_chunin', etiqueta: 'ACT 2', icono: '🍃' },
  { id: 'invasion_de_pain', etiqueta: 'ACT 3', icono: '🌀' },
  { id: 'general', etiqueta: 'GENERAL', icono: '✦' },
];

function textoRecompensa(recompensa) {
  if (recompensa.tipo === 'desbloquearPersonajeReclutable') {
    return `Unlocks ${nombrePersonajeOJefe(recompensa.personajeId)} as recruitable.`;
  }
  if (recompensa.tipo === 'desbloquearPersonajeInicial') {
    return `Unlocks ${nombrePersonajeOJefe(recompensa.personajeId)} as a starting pick.`;
  }
  if (recompensa.tipo === 'desbloquearObjetoInicial') {
    return `You start any future run with ${nombreObjeto(recompensa.objetoId)}.`;
  }
  // ⚠️ **Un logro puede no dar nada, y se dice.** Solo hay tres tipos de premio y
  // los tres son desbloqueos; quedan pocos ninjas y pocos objetos por desbloquear,
  // así que la alternativa era inventar recompensas numéricas (+% oro, +% XP) que
  // mueven la curva de niveles de toda la run — descartadas en el punto 5b. Un
  // juego de runs cortas no quiere meta-progresión que cambie números. Lo que se
  // devuelve NO es cadena vacía: un hueco no dice "esto es una marca de honor",
  // dice "aquí falta algo".
  //
  // Tres palabras y no ocho: esta línea sale en 13 de las 23 filas, y desde que
  // existe el **rango S** al lado, "no reward beyond the telling" repetía por escrito
  // lo que el icono ya dice. Una frase que se repite trece veces en una pantalla se
  // paga trece veces.
  if (recompensa.tipo === 'ninguna') return 'A mark of honour.';
  return '';
}

/**
 * El icono de un logro sale de su RECOMPENSA, no de un dibujo propio.
 *
 * La maqueta pide un sprite por logro (el espejo roto de Haku, la máscara de
 * Zabuza) y ese arte no existe. Pero un logro que desbloquea a Haku puede
 * enseñar a Haku, y uno que da un objeto puede enseñar el objeto: se lee igual
 * de bien, no inventa nada y además dice el premio sin leer. Cuando haya arte
 * propio, se cambia solo esta función.
 */
function iconoDeLogro(logro) {
  const { recompensa } = logro;
  if (recompensa.tipo === 'desbloquearPersonajeReclutable' || recompensa.tipo === 'desbloquearPersonajeInicial') {
    return spriteDeLuchador(recompensa.personajeId);
  }
  if (recompensa.tipo === 'desbloquearObjetoInicial') {
    return SPRITE_OBJETO[recompensa.objetoId] ?? null;
  }
  // Los que no dan nada no tienen de dónde sacar sprite. No se quedan con el marco
  // vacío: llevan su **rango de misión**, que dice algo — "esto no da objeto, da
  // rango" — en vez de parecer un icono que falta.
  //
  // ⚠️ Hasta el punto 19 aquí salía una **S para todos**, que era el vocabulario
  // correcto con el dato inventado: `caidas_7` (perder 7 runs) lucía la misma
  // letra que ganarse la partida entera. El rango ahora es un campo de verdad de
  // `achievements.json` y la letra dice lo que pone.
  return null;
}

/**
 * "12 / 30" con su barra, para los logros que se miden acumulando.
 *
 * Sin esto un logro de contador es una condición a ciegas: "gana 50 combates" sin
 * decir por cuántos vas no es una meta, es un rumor. Los de suceso (derrota a
 * Zabuza) no llevan barra a propósito — `progresoDeLogro` devuelve `null` y una
 * barra al 0% de algo binario dice menos que el propio "Locked".
 */
function BarraProgreso({ actual, objetivo }) {
  const porcentaje = Math.min(100, Math.round((actual / objetivo) * 100));
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <div className="flex-1 h-1.5 bg-tinta-950 rounded-sm border border-marco overflow-hidden">
        <div className="h-full bg-oro/70" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="font-display text-[8px] text-pergamino-200/60 shrink-0">
        {Math.min(actual, objetivo)} / {objetivo}
      </span>
    </div>
  );
}

function FilaLogro({ logro, desbloqueado, progreso }) {
  return (
    <PanelMarco tono={desbloqueado ? 'panel' : 'hueco'} className="p-3">
      <div className="flex items-start gap-3">
        <IconoEnmarcado
          src={iconoDeLogro(logro)}
          glifo={<InsigniaRango rango={logro.rango} />}
          bloqueado={!desbloqueado}
          colorMarco={desbloqueado ? 'border-oro/50' : 'border-marco'}
          tamano="w-14 h-14"
        />

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className={`font-display text-[11px] ${desbloqueado ? 'text-pergamino-100' : 'text-pergamino-200/50'}`}>
            {logro.nombre}
          </p>
          <p className="text-[10px] text-pergamino-200/70 leading-relaxed">{logro.descripcion}</p>
          {/* La barra solo mientras se persigue: una vez conseguido, "50 / 50" no
              añade nada a la palabra "Unlocked" de al lado. */}
          {!desbloqueado && progreso && <BarraProgreso {...progreso} />}
          <p className="text-[9px] text-oro/70 leading-relaxed italic">{textoRecompensa(logro.recompensa)}</p>
        </div>

        <div className="shrink-0 self-start flex flex-col items-end gap-1">
          <span className="font-display text-[8px] uppercase tracking-wider text-pergamino-200/50">
            Rank {logro.rango}
          </span>
          <span
            className={[
              'font-display text-[8px] uppercase tracking-wider',
              desbloqueado ? 'text-exito' : 'text-pergamino-200/35',
            ].join(' ')}
          >
            {desbloqueado ? 'Unlocked' : 'Locked'}
          </span>
        </div>
      </div>
    </PanelMarco>
  );
}

export default function AchievementsScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const logrosDesbloqueados = useAchievementsStore((s) => s.logrosDesbloqueados);
  const contadores = useAchievementsStore((s) => s.contadores);
  const vistos = useAchievementsStore((s) => s.vistos);
  const [pestanaId, setPestanaId] = useState('todos');

  const logros = achievementsData.logros;
  const conArco = useMemo(
    () => logros.map((logro) => ({ logro, arcoId: arcoDelLogro(logro) })),
    [logros],
  );

  const total = logros.length;
  const conseguidos = logrosDesbloqueados.length;
  const porcentaje = total > 0 ? Math.round((conseguidos / total) * 100) : 0;

  // Cada pestaña lleva su propio contador, que es lo que las convierte en resumen
  // de progreso y no en un filtro a ciegas. Una pestaña sin ningún logro no se
  // pinta: con 7 logros repartidos, ofrecer un acto vacío es ofrecer una pantalla
  // en blanco.
  const pestanas = PESTANAS_BASE.map((pestana) => {
    const suyos = pestana.id === 'todos'
      ? conArco
      : conArco.filter((entrada) => entrada.arcoId === pestana.id);
    const hechos = suyos.filter((entrada) => logrosDesbloqueados.includes(entrada.logro.id)).length;
    return { ...pestana, contador: `${hechos}/${suyos.length}`, vacia: suyos.length === 0 };
  }).filter((pestana) => !pestana.vacia);

  const visibles = pestanaId === 'todos'
    ? conArco
    : conArco.filter((entrada) => entrada.arcoId === pestanaId);

  return (
    <VentanaModal
      titulo="Missions"
      subtitulo={`${conseguidos} / ${total} unlocked (${porcentaje}%)`}
      onCerrar={volverAlMapa}
      ancho="max-w-xl"
      cabeceraFija={
        <>
          {/* El rango ninja va ARRIBA y no al final de la lista: es el número que
              resume la pantalla entera, y enterrado tras 23 filas no lo vería
              nadie. */}
          <PanelRangoNinja className="px-1 pb-2" />
          <FilaPestanas pestanas={pestanas} activaId={pestanaId} onElegir={setPestanaId} />
        </>
      }
    >
      {/* Aquí había un botón `[DEV] Reset progress` con un "quitar antes de
          publicar" pegado desde que existe el sistema de logros. Ya no hace falta:
          es una opción de verdad en Ajustes ("reset meta-progress"), con
          confirmación y en el sitio donde un jugador la buscaría. */}
      {visibles.map(({ logro }) => (
        <FilaLogro
          key={logro.id}
          logro={logro}
          desbloqueado={logrosDesbloqueados.includes(logro.id)}
          progreso={progresoDeLogro(logro, { contadores, vistos })}
        />
      ))}
    </VentanaModal>
  );
}
