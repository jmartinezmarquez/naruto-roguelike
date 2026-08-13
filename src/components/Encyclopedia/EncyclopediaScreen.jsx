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
  nombreCorto, nombreObjeto, clasePastillaDeNaturaleza, emojiDeNaturaleza, emojiDeTipo,
} from '../common/nombres';

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
  { id: 'ninjas', etiqueta: 'Ninjas', categoria: 'personajes' },
  { id: 'enemigos', etiqueta: 'Enemies', categoria: 'enemigos' },
  { id: 'objetos', etiqueta: 'Items', categoria: 'objetos' },
  // La tabla de chakra no se desbloquea: son las REGLAS del juego, no contenido
  // que se descubra. Esconderla sería esconder cómo funciona el combate.
  { id: 'chakra', etiqueta: 'Chakra', categoria: null },
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

/**
 * Sprite de una entrada, en silueta si está bloqueada.
 *
 * `brightness(0)` deja el dibujo entero en negro conservando su transparencia, o
 * sea la silueta exacta del personaje. No vale un cuadrado gris: la silueta es la
 * que dice "hay alguien aquí que todavía no conoces", que es el punto.
 */
function SpriteEntrada({ src, bloqueada, className = '' }) {
  if (!src) {
    return (
      <span className={`flex items-center justify-center text-pergamino-200/30 ${className}`}>
        {bloqueada ? '?' : '—'}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`object-contain select-none ${bloqueada ? 'opacity-40' : ''} ${className}`}
      style={bloqueada ? { filter: 'brightness(0)' } : undefined}
    />
  );
}

function spriteDeEntrada(seccionId, id) {
  return seccionId === 'objetos' ? SPRITE_OBJETO[id] ?? null : spriteDeLuchador(id);
}

/**
 * Nombre de una casilla. Los enemigos llevan delante el emoji de su naturaleza
 * porque **los cinco genin rivales se llaman igual** ("Rival Genin"): sin el
 * emoji la sección de enemigos tenía cinco casillas idénticas que solo se
 * distinguían por el color del sprite. Va delante para que sobreviva al truncado.
 */
function nombreDeCasilla(seccionId, id) {
  if (seccionId === 'objetos') return nombreObjeto(id);
  if (seccionId === 'enemigos') return `${emojiDeTipo(id)} ${nombreCorto(id)}`.trim();
  return nombreCorto(id);
}

/** Una casilla de la rejilla. Bloqueada: silueta y "???" en vez del nombre. */
function Casilla({ seccionId, entrada, bloqueada, onElegir }) {
  const sprite = spriteDeEntrada(seccionId, entrada.id);
  const nombre = nombreDeCasilla(seccionId, entrada.id);

  return (
    <button
      type="button"
      onClick={() => onElegir(entrada.id)}
      className={[
        'elevar-hover rounded-lg border p-2 flex flex-col items-center gap-1 transition-colors',
        bloqueada
          ? 'bg-tinta-950/60 border-pergamino-100/10 hover:border-pergamino-100/25'
          : 'bg-tinta-900 border-pergamino-100/20 hover:border-sello-500/60',
      ].join(' ')}
      title={bloqueada ? MENSAJE_DESBLOQUEO[SECCIONES.find((s) => s.id === seccionId).categoria] : nombre}
    >
      <SpriteEntrada src={sprite} bloqueada={bloqueada} className="w-14 h-14" />
      <span
        className={[
          'font-display text-[8px] leading-tight text-center w-full truncate',
          bloqueada ? 'text-pergamino-200/35' : 'text-pergamino-100',
        ].join(' ')}
      >
        {bloqueada ? '???' : nombre}
      </span>
    </button>
  );
}

/** Ficha de una entrada bloqueada: la silueta grande y qué hacer para abrirla. */
function FichaBloqueada({ seccionId, entrada, categoria }) {
  return (
    <div className="bg-tinta-900 border border-pergamino-100/15 rounded-lg p-6 flex flex-col items-center gap-4 text-center">
      <SpriteEntrada src={spriteDeEntrada(seccionId, entrada.id)} bloqueada className="w-24 h-24" />
      <p className="font-display text-lg text-pergamino-200/40">???</p>
      <p className="text-[11px] text-pergamino-200/70 max-w-[16rem] leading-relaxed">
        {MENSAJE_DESBLOQUEO[categoria]}
      </p>
    </div>
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
    <section className="bg-tinta-900 border border-pergamino-100/15 rounded-lg p-4 flex flex-col gap-2">
      <h3 className="font-display text-[10px] text-sello-500 tracking-[0.2em] uppercase">Jutsu</h3>
      <p className="font-display text-sm text-pergamino-100">🌀 {base.jutsu.nombre}</p>
      {base.jutsu.descripcion && (
        <p className="text-[11px] text-pergamino-200/70 leading-relaxed">{base.jutsu.descripcion}</p>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] mt-1">
        <div className="flex justify-between border-b border-pergamino-100/10 pb-1">
          <dt className="text-pergamino-200/50">Power</dt>
          <dd className="text-pergamino-100">×{base.jutsu.danoBase.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between border-b border-pergamino-100/10 pb-1">
          <dt className="text-pergamino-200/50">Charge</dt>
          <dd className="text-pergamino-100">
            {Number.isFinite(turnos) ? `${turnos} turn${turnos === 1 ? '' : 's'}` : '—'}
          </dd>
        </div>
      </dl>
      <p className="text-[9px] text-pergamino-200/40 leading-relaxed">
        Charge measured at level 1 with no item equipped. Taking hits fills the gauge too, so a real
        battle is usually faster.
      </p>
    </section>
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
    <section className="bg-tinta-900 border border-pergamino-100/15 rounded-lg p-4 flex flex-col gap-3">
      <h3 className="font-display text-[10px] text-sello-500 tracking-[0.2em] uppercase">
        Transformations
      </h3>
      {modos.map((modo, indice) => {
        const visto = modosVistos.includes(`${id}_${indice}`);
        const sprite = spriteDeModo(id, indice);

        if (!visto) {
          return (
            <div key={indice} className="flex items-center gap-3 opacity-70">
              <SpriteEntrada src={sprite ?? spriteDeLuchador(id)} bloqueada className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-[11px] text-pergamino-200/40">???</p>
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
            <SpriteEntrada src={sprite} bloqueada={false} className="w-10 h-10 shrink-0" />
            <div className="min-w-0 flex flex-col gap-1">
              <p className="font-display text-[11px] text-pergamino-100">{modo.nombre}</p>
              <p className="text-[9px] text-pergamino-200/50">From level {modo.nivelDesbloqueo}</p>
              {multiplicadores.length > 0 && (
                <p className="text-[9px] text-pergamino-200/70">
                  {multiplicadores
                    .map(([stat, valor]) => `${ABREVIATURA_STAT[stat] ?? stat} ×${valor}`)
                    .join('   ')}
                </p>
              )}
              {pasivas.map((pasiva) => (
                <p key={pasiva.id} className="text-[9px] text-fuuton/90 leading-relaxed">
                  {nombrePasiva(pasiva.id)}: {describirPasiva(pasiva)}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </section>
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
    <div className="bg-tinta-900 border border-pergamino-100/15 rounded-lg p-4 flex flex-col items-center gap-3 text-center">
      <SpriteEntrada src={SPRITE_OBJETO[base.id]} bloqueada={false} className="w-20 h-20" />
      <div>
        <p className="font-display text-sm text-pergamino-100">{base.nombre}</p>
        <p className={`font-display text-[9px] mt-1 ${COLOR_RAREZA[base.rareza] ?? ''}`}>
          {ETIQUETA_RAREZA[base.rareza] ?? ''}
        </p>
      </div>
      <p className="text-[11px] text-pergamino-200/70 leading-relaxed">{base.descripcion}</p>
      <div className="w-full flex flex-col gap-1 border-t border-pergamino-100/10 pt-2">
        {lineas.map((linea, i) => (
          <p
            key={i}
            className={`text-[10px] ${linea.positivo ? 'text-fuuton/90' : 'text-sello-500'}`}
          >
            {linea.icono} {linea.texto}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * La tabla de eficacias. Se lee "fila ataca a columna", y el ciclo canon va
 * Katon > Fuuton > Raiton > Doton > Suiton > Katon.
 */
function TablaChakra() {
  const { elementos, tablaEficacias } = typesData;

  return (
    <div className="bg-tinta-900 border border-pergamino-100/15 rounded-lg p-4 flex flex-col gap-3">
      <p className="text-[10px] text-pergamino-200/60 leading-relaxed">
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
                  <span className={`inline-block px-1.5 py-0.5 rounded border ${clasePastillaDeNaturaleza(tipo)}`}>
                    {emojiDeNaturaleza(tipo)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elementos.map((atacante) => (
              <tr key={atacante}>
                <th className="p-1 text-right">
                  <span className={`inline-block px-1.5 py-0.5 rounded border ${clasePastillaDeNaturaleza(atacante)}`}>
                    {emojiDeNaturaleza(atacante)}
                  </span>
                </th>
                {elementos.map((defensor) => {
                  const eficacia = tablaEficacias[atacante][defensor];
                  const color = eficacia > 1
                    ? 'text-fuuton bg-fuuton/10'
                    : eficacia < 1 ? 'text-sello-500 bg-sello-600/10' : 'text-pergamino-200/40';
                  return (
                    <td key={defensor} className={`p-1.5 text-center font-display rounded ${color}`}>
                      ×{eficacia}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-pergamino-200/40 text-center">
        Cycle: {elementos.map((t) => emojiDeNaturaleza(t)).join(' → ')} → {emojiDeNaturaleza(elementos[0])}
      </p>
    </div>
  );
}

export default function EncyclopediaScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const vistos = useAchievementsStore((s) => s.vistos);
  const [seccionId, setSeccionId] = useState('ninjas');
  const [elegidoId, setElegidoId] = useState(null);

  const seccion = SECCIONES.find((s) => s.id === seccionId);
  const entradas = useMemo(() => entradasDeSeccion(seccionId), [seccionId]);
  const vistosDeLaSeccion = seccion.categoria ? vistos[seccion.categoria] ?? [] : [];

  function cambiarSeccion(id) {
    setSeccionId(id);
    setElegidoId(null); // la ficha abierta no pertenece a la sección nueva
  }

  const elegida = elegidoId ? entradas.find((e) => e.id === elegidoId) : null;
  const elegidaBloqueada = elegida ? !vistosDeLaSeccion.includes(elegida.id) : false;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <header className="text-center">
          <p className="text-sello-500 text-xs tracking-[0.3em] uppercase mb-1">Records</p>
          <h1 className="font-naruto text-4xl text-pergamino-100">Encyclopedia</h1>
          {seccion.categoria && (
            <p className="text-xs text-pergamino-200/60 mt-1">
              {vistosDeLaSeccion.filter((id) => entradas.some((e) => e.id === id)).length} / {entradas.length} discovered
            </p>
          )}
        </header>

        <nav className="flex justify-center gap-2 flex-wrap">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => cambiarSeccion(s.id)}
              className={[
                'font-display text-[10px] px-3 py-1.5 rounded-full border transition-colors',
                s.id === seccionId
                  ? 'bg-sello-600 border-sello-600 text-pergamino-100'
                  : 'border-pergamino-100/20 text-pergamino-200/60 hover:border-pergamino-100/40 hover:text-pergamino-100',
              ].join(' ')}
            >
              {s.etiqueta}
            </button>
          ))}
        </nav>

        {seccionId === 'chakra' && <TablaChakra />}

        {seccionId !== 'chakra' && !elegida && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
            <button
              type="button"
              onClick={() => setElegidoId(null)}
              className="self-center font-display text-[9px] px-4 py-2 rounded-md border border-pergamino-100/20 text-pergamino-200/60 hover:border-pergamino-100/40 hover:text-pergamino-100 transition-colors"
            >
              ← Back to list
            </button>
          </div>
        )}

        <div className="text-center mt-2">
          <button
            type="button"
            onClick={volverAlMapa}
            className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
          >
            Back to map
          </button>
        </div>
      </div>
    </div>
  );
}
