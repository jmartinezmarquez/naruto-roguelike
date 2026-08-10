import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import personajesData from '../../data/characters.json';
import typesData from '../../data/types.json';
import itemsData from '../../data/items.json';
import PersonajeHoverCard from '../common/PersonajeHoverCard';
import ItemHoverCard from '../common/ItemHoverCard';
import HoverTooltip from '../common/HoverTooltip';
import spriteCombate from '../../assets/nodes/combate.png';
import spriteEvento from '../../assets/nodes/evento.png';
import spriteTienda from '../../assets/nodes/tienda.png';
import spriteDescanso from '../../assets/nodes/descanso.png';
import spriteReclutar from '../../assets/nodes/reclutar.png';
import fondoColumnaOlas from '../../assets/map-columns/pais_de_las_olas.png';
import fondoColumnaChunin from '../../assets/map-columns/examen_chunin.png';
import fondoColumnaPain from '../../assets/map-columns/invasion_de_pain.png';

function nombrePersonaje(id) {
  return personajesData.personajes.find((p) => p.id === id)?.nombre ?? id;
}

function nombreObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id)?.nombre ?? id;
}

// Sprite por tipo de nodo, recortado de `assets/sprite-nodos-mapa.png` (la hoja
// original del artista trae los 5 iconos juntos; los recortes viven en
// `assets/nodes/*.png` a media resolución, 100 px para pintarse a 48).
// Los tres nodos de combate especiales comparten de momento el sprite de
// combate: la hoja no trae arte por personaje todavía (ver punto 5 del roadmap),
// así que lo que los distingue es el badge de rango + el color del borde.
const SPRITE_NODO = {
  // El nodo de salida no tiene sprite a propósito: nace visitado, así que se
  // pinta como un disco oscuro con su tick, igual que en Pokelike.
  inicio: null,
  combate: spriteCombate,
  combateEntrenador: spriteCombate, 
  evento: spriteEvento,
  tienda: spriteTienda,
  reclutar: spriteReclutar,
  descanso: spriteDescanso,
  miniJefe: spriteCombate,
  jefe: spriteCombate,
};

// Glifo de rango superpuesto al sprite, solo en los combates que no son el
// aleatorio corriente. Cada nodo lleva además su hover con nombre + beneficio
// (ver INFO_NODO) — sustituye a la vieja leyenda fija del lateral.
const BADGE_NODO = {
  combateEntrenador: '★',
  miniJefe: '☠',
  jefe: '危',
};

const ETIQUETA_NODO = {
  inicio: 'Start',
  combate: 'Combat',
  combateEntrenador: 'Elite',
  evento: 'Event',
  tienda: 'Shop',
  reclutar: 'Recruit',
  descanso: 'Rest',
  miniJefe: 'Mini-Boss',
  jefe: 'Boss',
};

const INFO_NODO = {
  inicio: 'Where your journey through this arc begins.',
  combate: 'Random enemy — win XP and gold on victory.',
  combateEntrenador: 'Named ninja with genin escort — chained combat.',
  evento: 'Narrative choice: heal, gold, upgrades... no combat.',
  tienda: 'Buy items with gold.',
  reclutar: 'Choose one of 3 ninjas to add to your team, for free.',
  descanso: 'Fully heals and revives the entire team.',
  miniJefe: 'Tougher fight, with a guaranteed item reward.',
  jefe: "The arc's final boss — defeating them heals the entire team.",
};

// Solo borde y color de texto: el fondo lo tapa el sprite. El color sigue siendo
// la pista rápida del tipo de nodo cuando el mapa está escalado y los sprites
// se ven pequeños.
const COLOR_NODO = {
  inicio: 'border-pergamino-200/40 text-pergamino-100',
  combate: 'border-pergamino-200/40 text-pergamino-100',
  combateEntrenador: 'border-katon/60 text-katon',
  evento: 'border-raiton/50 text-raiton',
  tienda: 'border-doton/50 text-doton',
  reclutar: 'border-fuuton/60 text-fuuton',
  descanso: 'border-suiton/50 text-suiton',
  miniJefe: 'border-sello-500 text-sello-500',
  jefe: 'border-sello-500 text-pergamino-100',
};

// Fondo de la columna central del mapa, uno por arco — recortado de
// `assets/map-column-backgrounds.png` (hoja de referencia con las 4 columnas
// etiquetadas; los recortes limpios viven en `assets/map-columns/*.png`).
// La clave es el `id` del arco, así que un arco sin entrada simplemente se queda
// con la columna negra en vez de romperse.
const FONDO_COLUMNA = {
  pais_de_las_olas: fondoColumnaOlas,
  examen_chunin: fondoColumnaChunin,
  invasion_de_pain: fondoColumnaPain,
};

const ANCHO = 520;
const ALTO_POR_PISO = 120;
const RADIO_NODO = 26;

/** Calcula la posición (x, y) de cada nodo dentro del lienzo del mapa. */
function calcularPosiciones(mapa) {
  const posiciones = {};
  const totalPisos = mapa.pisos.length;

  mapa.pisos.forEach((idsPiso, indicePiso) => {
    const y = ALTO_POR_PISO * (totalPisos - indicePiso) - ALTO_POR_PISO / 2;
    const n = idsPiso.length;
    idsPiso.forEach((id, i) => {
      const x = ANCHO * ((i + 1) / (n + 1));
      posiciones[id] = { x, y };
    });
  });

  return posiciones;
}

function NodoMapa({ nodo, posicion, disponible, visitado, esActual, onClick }) {
  const tipoEfectivo = nodo.tipo === 'combate' && nodo.subtipo === 'entrenador' ? 'combateEntrenador' : nodo.tipo;
  const estilo = COLOR_NODO[tipoEfectivo] ?? COLOR_NODO.combate;
  // `in` y no `??`: el nodo de inicio tiene sprite `null` a propósito, y con
  // `??` habría caído al de combate.
  const sprite = tipoEfectivo in SPRITE_NODO ? SPRITE_NODO[tipoEfectivo] : SPRITE_NODO.combate;
  const badge = BADGE_NODO[tipoEfectivo];
  const esJefe = nodo.tipo === 'jefe';
  // El pergamino de reclutar no es circular: recortarlo en círculo le cortaría
  // las varillas de arriba y abajo, así que ese va en marco cuadrado.
  const esCircular = tipoEfectivo !== 'reclutar';

  // Cuatro estados visuales bien diferenciados, sin solaparse: aquí ahora,
  // ya visitado (no se puede repetir), disponible para elegir, o todavía fuera
  // de alcance (más adelante en el mapa).
  //
  // Los dos estados no clicables se apagan con filtros (grayscale + brightness),
  // NO con `opacity`: en un Pokelike los nodos son sprites opacos, y bajarles el
  // alpha deja ver el fondo y las líneas del mapa a través del sprite, que es
  // justo lo que rompe la ilusión de pieza dibujada. Apagados siguen siendo
  // opacos, y la jerarquía la marca cuánto brillo les queda.
  let estadoClases;
  let estadoTexto;
  if (esActual) {
    estadoClases = 'cursor-not-allowed shadow-lg shadow-black/40';
    estadoTexto = 'You are here';
  } else if (visitado) {
    // Menos apagado que antes: encima lleva ya el velo del tick, y encadenar
    // los dos lo dejaba casi negro.
    estadoClases = 'cursor-not-allowed grayscale brightness-[0.8]';
    estadoTexto = 'Visited';
  } else if (disponible) {
    estadoClases = 'cursor-pointer hover:scale-110 shadow-lg shadow-black/40';
  } else {
    estadoClases = 'cursor-not-allowed grayscale brightness-[0.35]';
    estadoTexto = 'Not yet reachable';
  }

  const contenidoTooltip = (
    <div className="bg-pergamino-100 text-tinta-950 rounded-lg border-2 border-sello-600 shadow-xl p-2.5 w-44 text-left">
      <p className="font-display font-bold text-xs">{ETIQUETA_NODO[tipoEfectivo] ?? nodo.tipo}</p>
      <p className="text-[10px] opacity-70 mt-0.5">{INFO_NODO[tipoEfectivo] ?? ''}</p>
      {estadoTexto && (
        <p className="text-[10px] text-sello-600 font-display mt-1 pt-1 border-t border-tinta-950/10">
          {estadoTexto}
        </p>
      )}
    </div>
  );

  return (
    <div className="absolute" style={{ left: posicion.x - RADIO_NODO, top: posicion.y - RADIO_NODO }}>
      <HoverTooltip posicion="abajo" contenido={contenidoTooltip}>
        <button
          type="button"
          disabled={!disponible}
          onClick={() => onClick(nodo.id)}
          className={[
            'relative block border-2 bg-tinta-900',
            'transition-transform duration-200',
            esJefe ? 'w-14 h-14 border-4 border-double' : 'w-12 h-12',
            esCircular ? 'rounded-full' : 'rounded-md',
            estilo,
            estadoClases,
            esActual && 'ring-2 ring-sello-500 ring-offset-2 ring-offset-tinta-950 scale-110',
          ].filter(Boolean).join(' ')}
          aria-label={`${ETIQUETA_NODO[tipoEfectivo] ?? nodo.tipo} node${visitado ? ' — visited' : disponible ? ' — available' : ' — not yet reachable'}`}
        >
          {sprite && (
            <img
              src={sprite}
              alt=""
              aria-hidden="true"
              draggable="false"
              className={[
                'w-full h-full object-cover select-none',
                // El recorte va en la propia imagen, no en el botón: si lo pusiera
                // el botón con `overflow-hidden`, el badge de rango que asoma por
                // la esquina quedaría cortado.
                esCircular ? 'rounded-full' : 'rounded-sm',
              ].join(' ')}
            />
          )}
          {/* Tick de "ya hecho", como en Pokelike: encima del sprite, con su
              propio velo para que se lea sobre cualquier dibujo. Va también en
              el nodo actual, porque al llegar a un nodo se resuelve al instante
              — estar en él ya significa haberlo jugado. */}
          {visitado && (
            <span
              className={[
                'absolute inset-0 flex items-center justify-center',
                'text-pergamino-100 font-display leading-none',
                esActual ? 'bg-tinta-950/30' : 'bg-tinta-950/55',
                esJefe ? 'text-lg' : 'text-base',
                esCircular ? 'rounded-full' : 'rounded-sm',
              ].join(' ')}
            >
              ✓
            </span>
          )}
          {badge && (
            <span
              className={[
                'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full',
                'flex items-center justify-center font-display text-[8px] leading-none',
                'bg-tinta-950 border',
                estilo,
              ].join(' ')}
            >
              {badge}
            </span>
          )}
        </button>
      </HoverTooltip>
    </div>
  );
}

/** Panel izquierdo: equipo con HP, clicable para reordenar (pon a alguien en posición 1). */
function PanelEquipo({ equipo, obtenerHpMaximo, reordenarEquipo, desequiparObjeto }) {
  function ponerEnFrente(idElegido) {
    if (equipo[0]?.id === idElegido) return;
    const nuevoOrden = [idElegido, ...equipo.filter((p) => p.id !== idElegido).map((p) => p.id)];
    reordenarEquipo(nuevoOrden);
  }

  return (
    <div className="w-32 shrink-0">
      <div className="bg-pergamino-100 text-tinta-950 rounded-lg p-2">
        <p className="font-display font-bold text-[10px] mb-2 tracking-wide">TEAM</p>
        <div className="flex flex-col gap-1.5">
          {equipo.map((p, index) => {
            const hpMaximo = obtenerHpMaximo(p.id) ?? p.hpActual ?? 1;
            const porcentaje = Math.max(0, p.hpActual / hpMaximo);
            const esActivo = index === 0;
            return (
              <PersonajeHoverCard
                key={p.id}
                id={p.id}
                nivel={p.nivel}
                hpActual={p.hpActual}
                hpMaximo={hpMaximo}
                className="block w-full"
              >
                <div
                  className={[
                    'w-full text-left rounded-md p-1.5 border transition-colors',
                    esActivo ? 'border-sello-600 bg-sello-600/10' : 'border-tinta-950/15 bg-tinta-950/5',
                    p.derrotado ? 'opacity-40' : '',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => ponerEnFrente(p.id)}
                    disabled={p.derrotado || esActivo}
                    className={`w-full text-left ${p.derrotado ? 'cursor-default' : 'cursor-pointer'}`}
                    title={esActivo ? 'This character is in position 1' : 'Move to position 1'}
                  >
                    <p className="text-[10px] font-display font-bold truncate">
                      {nombrePersonaje(p.id)} {esActivo && '★'}
                    </p>
                    <p className="text-[8px] opacity-70">Lv. {p.nivel}{p.derrotado ? ' — defeated' : ''}</p>
                    <div className="h-1.5 w-full bg-tinta-950/20 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${porcentaje > 0.4 ? 'bg-fuuton' : 'bg-sello-600'}`}
                        style={{ width: `${porcentaje * 100}%` }}
                      />
                    </div>
                  </button>
                  {p.objetoEquipadoId && (
                    <div className="flex items-center justify-between gap-1 mt-1.5 pt-1.5 border-t border-tinta-950/10">
                      <span className="text-[9px] opacity-70 truncate">🎒 {nombreObjeto(p.objetoEquipadoId)}</span>
                      <button
                        type="button"
                        onClick={() => desequiparObjeto(p.id)}
                        className="text-[9px] opacity-60 hover:opacity-100 shrink-0 underline leading-none"
                        title="Unequip (returns to inventory)"
                      >
                        remove
                      </button>
                    </div>
                  )}
                </div>
              </PersonajeHoverCard>
            );
          })}
        </div>
        <p className="text-[8px] opacity-50 mt-2 leading-snug">
          Tap a ninja to send them to position 1.
        </p>
      </div>
    </div>
  );
}

/**
 * Panel debajo del equipo: oro y objetos del inventario, agrupados por id
 * (con "xN" si hay varios) — hover en cada uno para ver su descripción y su
 * efecto exacto (`ItemHoverCard`). Tocar un objeto abre un selector de
 * personaje: "Equipar en..." para equipables, "Usar en..." para
 * consumibles — los objetos ya equipados no aparecen aquí (se ven y se
 * desequipan desde `PanelEquipo`, están "puestos", no en la mochila).
 */
function PanelObjetos({ inventario, oro, equipo, equiparObjeto, usarConsumible }) {
  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null);

  const conteoPorId = inventario.reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const idsUnicos = Object.keys(conteoPorId);
  const itemSeleccionado = itemsData.objetos.find((o) => o.id === itemSeleccionadoId) ?? null;

  function elegirPersonaje(idPersonaje) {
    if (itemSeleccionado.tipo === 'equipable') equiparObjeto(itemSeleccionado.id, idPersonaje);
    else if (itemSeleccionado.tipo === 'consumible') usarConsumible(itemSeleccionado.id, idPersonaje);
    setItemSeleccionadoId(null);
  }

  return (
    <div className="w-32 shrink-0">
      <div className="bg-pergamino-100 text-tinta-950 rounded-lg p-2">
        <p className="font-display font-bold text-[10px] tracking-wide">ITEMS</p>
        <p className="text-[10px] text-sello-600 font-display mt-0.5 mb-2">{oro} gold</p>

        {itemSeleccionado ? (
          <div>
            <p className="text-[10px] mb-2 leading-snug">
              {itemSeleccionado.tipo === 'equipable' ? 'Equip' : 'Use'}{' '}
              <span className="font-display font-bold">{itemSeleccionado.nombre}</span> on:
            </p>
            <div className="flex flex-col gap-1.5">
              {equipo.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => elegirPersonaje(p.id)}
                  className="text-left text-[10px] bg-tinta-950/5 hover:bg-sello-600/20 border border-tinta-950/15 hover:border-sello-600/60 rounded-md px-1.5 py-1 transition-colors"
                >
                  {nombrePersonaje(p.id)}
                  {p.objetoEquipadoId && itemSeleccionado.tipo === 'equipable' && (
                    <span className="opacity-60"> (replaces {nombreObjeto(p.objetoEquipadoId)})</span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItemSeleccionadoId(null)}
              className="mt-2 text-[10px] underline opacity-60 hover:opacity-100"
            >
              Cancel
            </button>
          </div>
        ) : idsUnicos.length === 0 ? (
          <p className="text-[10px] opacity-50 leading-snug">No items yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {idsUnicos.map((id) => (
              <ItemHoverCard key={id} id={id} className="block w-full">
                <button
                  type="button"
                  onClick={() => setItemSeleccionadoId(id)}
                  className="w-full flex items-center justify-between gap-1 rounded-md border border-tinta-950/15 bg-tinta-950/5 hover:border-sello-600/60 px-1.5 py-1 transition-colors"
                >
                  <p className="text-[10px] font-display truncate">{nombreObjeto(id)}</p>
                  {conteoPorId[id] > 1 && (
                    <span className="text-[8px] opacity-60 shrink-0">x{conteoPorId[id]}</span>
                  )}
                </button>
              </ItemHoverCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ORDEN_CICLO_CHAKRA = typesData.elementos; // ['katon', 'fuuton', 'raiton', 'doton', 'suiton'] — ya en orden de ventaja del ciclo
const CENTRO_RUEDA = 55;
const RADIO_RUEDA = 40;
const RADIO_NODO_CHAKRA = 13;

const EMOJI_CHAKRA = {
  katon: '🔥', fuuton: '🌪️', raiton: '⚡', doton: '🪨', suiton: '💧',
};

/** Posición del punto i-ésimo de un pentágono, empezando arriba y en sentido horario. */
function puntoRuedaChakra(indice, total) {
  const angulo = (indice / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: CENTRO_RUEDA + RADIO_RUEDA * Math.cos(angulo),
    y: CENTRO_RUEDA + RADIO_RUEDA * Math.sin(angulo),
  };
}

/**
 * Pictograma del ciclo de ventajas de chakra (Katon > Fuuton > Raiton > Doton
 * > Suiton > Katon, ver types.json): un pentágono con una flecha de cada
 * elemento al que es fuerte contra. Pensado para quien no tenga memorizado
 * el sistema de naturalezas de chakra de Naruto — la tabla de eficacias por
 * sí sola (`tablaEficacias`) no es intuitiva sin verla dibujada como ciclo.
 */
function RuedaChakra() {
  const total = ORDEN_CICLO_CHAKRA.length;
  const puntos = ORDEN_CICLO_CHAKRA.map((_, i) => puntoRuedaChakra(i, total));

  return (
    <div className="w-32 shrink-0">
      <div className="bg-tinta-900 border border-pergamino-100/15 rounded-lg p-2">
        <p className="font-display font-bold text-[10px] text-pergamino-100 tracking-wide">CHAKRA</p>
        <p className="text-[8px] text-pergamino-200/50 mt-0.5 mb-2 leading-snug">
          → is strong against
        </p>
        <svg viewBox="0 0 110 110" className="w-full">
          <defs>
            {ORDEN_CICLO_CHAKRA.map((tipo) => (
              <marker
                key={tipo}
                id={`flecha-chakra-${tipo}`}
                markerUnits="userSpaceOnUse"
                markerWidth="8"
                markerHeight="8"
                refX="5"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L5,2.5 L0,5 Z" fill={`var(--color-${tipo})`} />
              </marker>
            ))}
          </defs>
          {ORDEN_CICLO_CHAKRA.map((tipo, i) => {
            const origen = puntos[i];
            const destino = puntos[(i + 1) % total];
            const pmx = (origen.x + destino.x) / 2;
            const pmy = (origen.y + destino.y) / 2;
            const controlX = pmx + (CENTRO_RUEDA - pmx) * 0.3;
            const controlY = pmy + (CENTRO_RUEDA - pmy) * 0.3;
            const dx = destino.x - controlX;
            const dy = destino.y - controlY;
            const dist = Math.hypot(dx, dy) || 1;
            const finX = destino.x - (dx / dist) * RADIO_NODO_CHAKRA;
            const finY = destino.y - (dy / dist) * RADIO_NODO_CHAKRA;
            return (
              <path
                key={tipo}
                d={`M ${origen.x} ${origen.y} Q ${controlX} ${controlY} ${finX} ${finY}`}
                fill="none"
                stroke={`var(--color-${tipo})`}
                strokeWidth="1.5"
                opacity="0.75"
                markerEnd={`url(#flecha-chakra-${tipo})`}
              />
            );
          })}
          {ORDEN_CICLO_CHAKRA.map((tipo, i) => (
            <g key={tipo}>
              <circle
                cx={puntos[i].x}
                cy={puntos[i].y}
                r={RADIO_NODO_CHAKRA}
                fill="var(--color-tinta-800)"
                stroke={`var(--color-${tipo})`}
                strokeWidth="2"
              />
              <foreignObject
                x={puntos[i].x - RADIO_NODO_CHAKRA}
                y={puntos[i].y - RADIO_NODO_CHAKRA}
                width={RADIO_NODO_CHAKRA * 2}
                height={RADIO_NODO_CHAKRA * 2}
              >
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', lineHeight: 1,
                }}>
                  {EMOJI_CHAKRA[tipo]}
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/** ¿Hay algún elemento en pantalla completa ahora mismo? Cross-browser mínimo (solo se necesita Chrome/Firefox/Safari modernos). */
function hayPantallaCompleta() {
  return Boolean(document.fullscreenElement);
}

/**
 * Menú de iconos junto al mapa, estilo Pokelike: Logros, Pantalla completa
 * (Fullscreen API del navegador) y Reiniciar Run (con confirmación nativa,
 * porque borra el progreso de la run actual sin posibilidad de deshacerlo).
 * "Ajustes" se queda fuera a propósito — no hay ninguna opción real que
 * poner ahí todavía.
 */
function MenuIconos({ abrirLogros, reiniciarRun }) {
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  useEffect(() => {
    const actualizar = () => setPantallaCompleta(hayPantallaCompleta());
    document.addEventListener('fullscreenchange', actualizar);
    return () => document.removeEventListener('fullscreenchange', actualizar);
  }, []);

  function alternarPantallaCompleta() {
    if (hayPantallaCompleta()) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  function manejarReiniciar() {
    if (window.confirm('Are you sure you want to restart the run? You will lose all current progress.')) {
      reiniciarRun();
    }
  }

  const botonClase = 'w-9 h-9 flex items-center justify-center rounded-full border border-pergamino-100/20 '
    + 'text-pergamino-100/80 hover:text-pergamino-100 hover:border-sello-600/60 transition-colors';

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button type="button" onClick={abrirLogros} className={botonClase} title="Achievements" aria-label="Achievements">
        🏆
      </button>
      <button
        type="button"
        onClick={alternarPantallaCompleta}
        className={botonClase}
        title={pantallaCompleta ? 'Exit fullscreen' : 'Fullscreen'}
        aria-label="Fullscreen"
      >
        ⛶
      </button>
      <button type="button" onClick={manejarReiniciar} className={botonClase} title="Restart run" aria-label="Restart run">
        ⟲
      </button>
    </div>
  );
}

export default function MapScreen() {
  const mapa = useGameStore((s) => s.mapa);
  const nodoActualId = useGameStore((s) => s.nodoActualId);
  const avanzarANodo = useGameStore((s) => s.avanzarANodo);
  const obtenerNodosDisponibles = useGameStore((s) => s.obtenerNodosDisponibles);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);
  const equipo = useGameStore((s) => s.equipo);
  const obtenerHpMaximo = useGameStore((s) => s.obtenerHpMaximo);
  const reordenarEquipo = useGameStore((s) => s.reordenarEquipo);
  const inventario = useGameStore((s) => s.inventario);
  const oro = useGameStore((s) => s.oro);
  const equiparObjeto = useGameStore((s) => s.equiparObjeto);
  const desequiparObjeto = useGameStore((s) => s.desequiparObjeto);
  const usarConsumible = useGameStore((s) => s.usarConsumible);
  const abrirLogros = useGameStore((s) => s.abrirLogros);
  const reiniciarRun = useGameStore((s) => s.reiniciarRun);

  const fondoColumna = FONDO_COLUMNA[arcoActualDatos?.id];

  const posiciones = useMemo(() => (mapa ? calcularPosiciones(mapa) : {}), [mapa]);
  const disponibles = useMemo(() => new Set(obtenerNodosDisponibles()), [mapa, nodoActualId]);
  const alturaLienzo = mapa ? ALTO_POR_PISO * mapa.pisos.length : 0;

  // Escala el lienzo (SVG + nodos) para que quepa en el espacio disponible
  // sin scroll, como el mapa de Pokelike (viewBox que se ajusta al
  // contenedor) — pero manteniendo los nodos como <button> normales del DOM
  // en vez de moverlos dentro del SVG, así que se escala todo el bloque con
  // un transform en vez de depender del escalado nativo de un viewBox.
  const contenedorRef = useRef(null);
  const [escala, setEscala] = useState(1);

  useLayoutEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || !mapa) return undefined;

    function recalcular() {
      const { clientWidth, clientHeight } = contenedor;
      if (clientWidth === 0 || clientHeight === 0) return;
      setEscala(Math.min(clientWidth / ANCHO, clientHeight / alturaLienzo));
    }

    recalcular();
    const observer = new ResizeObserver(recalcular);
    observer.observe(contenedor);
    return () => observer.disconnect();
  }, [mapa, alturaLienzo]);

  if (!mapa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No run in progress yet.
      </div>
    );
  }

  return (
    <div className="h-screen bg-transparent text-pergamino-100 font-body px-4 py-4 relative flex flex-col overflow-hidden">
      <MenuIconos abrirLogros={abrirLogros} reiniciarRun={reiniciarRun} />

      <header className="text-center mb-1 shrink-0">
        <p className="text-sello-500 text-[9px] tracking-[0.3em] uppercase">Current Arc</p>
        <h1 className="font-naruto text-2xl text-pergamino-100 tracking-wide">
          {arcoActualDatos?.nombre}
        </h1>
      </header>

      <div className="flex-1 min-h-0 flex justify-center items-start gap-4 max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-4">
          <PanelEquipo
            equipo={equipo}
            obtenerHpMaximo={obtenerHpMaximo}
            reordenarEquipo={reordenarEquipo}
            desequiparObjeto={desequiparObjeto}
          />
          <PanelObjetos
            inventario={inventario}
            oro={oro}
            equipo={equipo}
            equiparObjeto={equiparObjeto}
            usarConsumible={usarConsumible}
          />
        </div>

        {/* El contenedor de fuera solo mide el hueco disponible: no pinta nada.
            El marco (fondo + borde) va en el div ya escalado de dentro, para que
            abrace exactamente al mapa. Cuando el marco lo pintaba el contenedor,
            sobraban bandas negras a los lados — el lienzo casi nunca es tan ancho
            como el hueco, porque la escala la manda la altura. */}
        <div
          ref={contenedorRef}
          className="flex-1 min-h-0 h-full flex items-center justify-center overflow-hidden"
        >
          <div
            className="bg-tinta-950"
            style={{
              width: ANCHO * escala,
              height: alturaLienzo * escala,
              position: 'relative',
              zIndex: 1,
              borderRadius: 12,
              // Marco por `box-shadow` y no por `border`: un borde real se comería
              // 8 px del ancho útil (box-sizing: border-box) y el lienzo escalado,
              // que mide exactamente ANCHO*escala, se saldría por los lados.
              boxShadow: '0 0 0 4px var(--color-tinta-950)',
              // `100% 100%` y no `cover`: las columnas se generan a 520×960,
              // que es exactamente el lienzo (ANCHO × ALTO_POR_PISO × 8 pisos),
              // así que encajan sin recortar ni deformar. Si algún arco dejara
              // de tener 8 pisos habría que regenerarlas (scripts/generar-columnas-mapa.py).
              backgroundImage: fondoColumna ? `url(${fondoColumna})` : undefined,
              backgroundSize: '100% 100%',
            }}
          >
            {/* Velo oscuro sobre el fondo, ahora suave: con la columna de tierra
                lisa el contraste ya lo da el propio fondo, y sólo hace falta
                bajarle un punto de brillo para que las líneas del mapa se lean.
                Con el paisaje completo detrás hacía falta el triple de velo. */}
            {fondoColumna && (
              <div className="absolute inset-0 bg-tinta-950/15" style={{ borderRadius: 12 }} />
            )}
            <div
              className="relative"
              style={{ width: ANCHO, height: alturaLienzo, transform: `scale(${escala})`, transformOrigin: 'top left' }}
            >
              <svg className="absolute inset-0 pointer-events-none" width={ANCHO} height={alturaLienzo}>
                {Object.values(mapa.nodos).flatMap((nodo) =>
                  nodo.conexiones.map((destinoId) => {
                    const origen = posiciones[nodo.id];
                    const destino = posiciones[destinoId];
                    if (!origen || !destino) return null;

                    // Cuatro estados de camino, en orden de prioridad:
                    // 1) recorrido de verdad (rojo sello) — solo hay un nodo
                    //    visitado por piso, así que si origen Y destino están
                    //    visitados, esta es LA arista que se tomó entre ellos.
                    // 2) elegible ahora mismo desde donde estás (pergamino sólido).
                    // 3) descartado — origen ya visitado (piso ya superado) pero
                    //    esta rama en concreto no se tomó: ya no se puede volver.
                    // 4) todavía fuera de alcance, más adelante en el mapa (punteado).
                    const recorrido = nodo.visitado && mapa.nodos[destinoId]?.visitado;
                    const disponibleAhora = !recorrido && nodo.id === nodoActualId && disponibles.has(destinoId);
                    const descartado = !recorrido && !disponibleAhora && nodo.visitado;

                    let stroke = 'var(--color-pergamino-100)';
                    let strokeOpacity = 0.15;
                    let strokeWidth = 1.5;
                    let strokeDasharray;

                    if (recorrido) {
                      stroke = 'var(--color-sello-500)';
                      strokeOpacity = 0.8;
                      strokeWidth = 2.5;
                    } else if (disponibleAhora) {
                      strokeOpacity = 0.9;
                      strokeWidth = 2;
                    } else if (descartado) {
                      stroke = 'var(--color-tinta-950)';
                      strokeOpacity = 0.7;
                    } else {
                      strokeDasharray = '4 4';
                    }

                    return (
                      <path
                        key={`${nodo.id}-${destinoId}`}
                        d={`M ${origen.x} ${origen.y} C ${origen.x} ${(origen.y + destino.y) / 2}, ${destino.x} ${(origen.y + destino.y) / 2}, ${destino.x} ${destino.y}`}
                        fill="none"
                        stroke={stroke}
                        strokeOpacity={strokeOpacity}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                      />
                    );
                  }),
                )}
              </svg>

              {Object.values(mapa.nodos).map((nodo) => (
                <NodoMapa
                  key={nodo.id}
                  nodo={nodo}
                  posicion={posiciones[nodo.id]}
                  disponible={disponibles.has(nodo.id)}
                  visitado={nodo.visitado}
                  esActual={nodo.id === nodoActualId}
                  onClick={avanzarANodo}
                />
              ))}
            </div>
          </div>
        </div>

        <RuedaChakra />
      </div>
    </div>
  );
}
