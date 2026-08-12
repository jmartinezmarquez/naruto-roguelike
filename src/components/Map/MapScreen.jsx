import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { spriteDeCombate } from '../common/datosDeLuchador';
import typesData from '../../data/types.json';
import { nombrePersonaje, nombreObjeto } from '../common/nombres';
import PersonajeHoverCard from '../common/PersonajeHoverCard';
import ItemHoverCard from '../common/ItemHoverCard';
import HoverTooltip from '../common/HoverTooltip';
import spriteCombate from '../../assets/nodes/combate.png';
import spriteEvento from '../../assets/nodes/evento.png';
import spriteTienda from '../../assets/nodes/tienda.png';
import spriteDescanso from '../../assets/nodes/descanso.png';
import spriteReclutarComun from '../../assets/nodes/reclutar-comun.png';
import spriteReclutarLegendario from '../../assets/nodes/reclutar-legendario.png';
import { SPRITE_OBJETO } from '../Inventory/itemSprites';
import fondoColumnaOlas from '../../assets/map-columns/pais_de_las_olas.png';
import fondoColumnaChunin from '../../assets/map-columns/examen_chunin.png';
import fondoColumnaPain from '../../assets/map-columns/invasion_de_pain.png';

// Sprite por tipo de nodo, recortado de `assets/sprite-nodos-mapa.png` (la hoja
// original del artista trae los 5 iconos juntos; los recortes viven en
// `assets/nodes/*.png` a media resolución, 100 px para pintarse a 48).
// El mini-jefe y el jefe final pintan el sprite del PERSONAJE que hay dentro
// (`spriteDeLuchador`, ver `components/common/characterSprites.js`); el sprite de
// combate genérico es solo su respaldo. El nodo de entrenador no puede: el
// enemigo nombrado concreto se sortea al ENTRAR en el nodo (`resolverEnemigoDeNodo`),
// no al generar el mapa, así que a la hora de pintarlo todavía no se sabe quién es.
// A los tres los distingue además el badge de rango y el color del borde.
const SPRITE_NODO = {
  // El nodo de salida no tiene sprite a propósito: nace visitado, así que se
  // pinta como un disco oscuro con su tick, igual que en Pokelike.
  inicio: null,
  combate: spriteCombate,
  combateEntrenador: spriteCombate, 
  evento: spriteEvento,
  tienda: spriteTienda,
  // `reclutar` no está aquí: su sprite depende de la rareza del pergamino y sale
  // de SPRITE_RECLUTAR, justo debajo.
  descanso: spriteDescanso,
  miniJefe: spriteCombate,
  jefe: spriteCombate,
};

// Un pergamino por rareza (`nodo.rareza`, decidida al generar el mapa — ver
// `elegirRarezaReclutar` en engine/mapGenerator.js). El dorado no es solo un
// premio más gordo: es un COMBATE contra el ninja que hay dentro, así que el
// jugador tiene que poder verlo venir desde el mapa y decidir si va.
//
// Solo se usan dos de los tres pergaminos de la hoja: el azul (raro) se retiró al
// fusionar común/inicial/raro en un mismo nodo — lo que separa los dos pergaminos
// es cómo se consigue al ninja, no lo bueno que sea. `assets/nodes/reclutar-raro.png`
// sigue generándose por si vuelve a hacer falta.
const SPRITE_RECLUTAR = {
  comun: spriteReclutarComun,
  legendario: spriteReclutarLegendario,
};

const COLOR_RECLUTAR = {
  comun: 'border-fuuton/60 text-fuuton',
  legendario: 'border-raiton text-raiton',
};

const ETIQUETA_RECLUTAR = {
  comun: 'Recruit',
  legendario: 'Legendary Challenge',
};

// Glifo de rango superpuesto al sprite, solo en los combates que no son el
// aleatorio corriente. Cada nodo lleva además su hover con el nombre del tipo
// (ver ETIQUETA_NODO) — sustituye a la vieja leyenda fija del lateral.
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
  descanso: 'Rest',
  miniJefe: 'Mini-Boss',
  jefe: 'Boss',
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

// Tamaño del nodo, en píxeles del LIENZO (520 × 120·pisos). El lienzo entero se
// escala para caber sin scroll, así que un tamaño fijo aquí se traduce en un
// tamaño variable en pantalla: a escala 0,65 los 48 px de antes acababan en 31 px
// reales y el icono no se distinguía. Pokelike nunca baja de 32 px, así que el
// tamaño se calcula contra la escala y se garantiza un mínimo REAL en pantalla.
//
// El tope existe para que en pantallas muy bajas (escala pequeña → nodo enorme en
// coordenadas de lienzo) los nodos de un piso de 5 no se toquen: la separación
// horizontal es ANCHO/6 ≈ 87 px de lienzo.
const TAMANO_NODO = 56;
const TAMANO_MINIMO_EN_PANTALLA = 44;
const TAMANO_MAXIMO_NODO = 76;

function tamanoNodo(escala, esJefe) {
  const lado = Math.min(
    TAMANO_MAXIMO_NODO,
    Math.max(TAMANO_NODO, TAMANO_MINIMO_EN_PANTALLA / (escala || 1)),
  );
  return esJefe ? lado * 1.15 : lado;
}

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

function NodoMapa({ nodo, posicion, escala, disponible, visitado, esActual, onClick, arco }) {
  const tipoEfectivo = nodo.tipo === 'combate' && nodo.subtipo === 'entrenador' ? 'combateEntrenador' : nodo.tipo;
  // Los mapas generados antes de que existiera la rareza (y los tests que montan
  // un nodo a mano) no la traen: se leen como el pergamino común de siempre.
  const rarezaReclutar = nodo.tipo === 'reclutar' ? (nodo.rareza ?? 'comun') : null;
  const estilo = (rarezaReclutar ? COLOR_RECLUTAR[rarezaReclutar] : COLOR_NODO[tipoEfectivo])
    ?? COLOR_NODO.combate;
  // `in` y no `??`: el nodo de inicio tiene sprite `null` a propósito, y con
  // `??` habría caído al de combate.
  // Con el nivel al que se pelea, para que el nodo enseñe al jefe tal y como te
  // lo vas a encontrar. Hoy ningún jefe llega transformado (sus modos se
  // desbloquean por encima de su nivel de combate — ver el punto 11 del
  // roadmap), así que devuelve el sprite normal; el día que se arregle, el mapa
  // se entera solo.
  const spriteDelJefe = nodo.tipo === 'miniJefe'
    ? spriteDeCombate(arco?.miniJefeId, arco?.nivelMiniJefe)
    : nodo.tipo === 'jefe' ? spriteDeCombate(arco?.jefeFinalId, arco?.nivelJefeFinal)
      : null;
  const sprite = spriteDelJefe
    ?? (rarezaReclutar ? SPRITE_RECLUTAR[rarezaReclutar] ?? SPRITE_RECLUTAR.comun : null)
    ?? (tipoEfectivo in SPRITE_NODO ? SPRITE_NODO[tipoEfectivo] : SPRITE_NODO.combate);
  const badge = BADGE_NODO[tipoEfectivo];
  const etiqueta = (rarezaReclutar ? ETIQUETA_RECLUTAR[rarezaReclutar] : ETIQUETA_NODO[tipoEfectivo])
    ?? nodo.tipo;
  const esJefe = nodo.tipo === 'jefe';
  // El pergamino de reclutar no es circular: recortarlo en círculo le cortaría
  // las varillas de arriba y abajo, así que ese va en marco cuadrado.
  const esCircular = tipoEfectivo !== 'reclutar';

  const lado = tamanoNodo(escala, esJefe);

  // Cuatro estados visuales bien diferenciados, sin solaparse: aquí ahora,
  // ya visitado (no se puede repetir), disponible para elegir, o todavía fuera
  // de alcance (más adelante en el mapa).
  //
  // Los no clicables se apagan con `opacity` y el cursor de "prohibido", como en
  // Pokelike. Antes se apagaban con filtros (grayscale + brightness-[0.35]) para
  // que el sprite siguiera siendo opaco: se veía bien de cerca, pero dejaba el
  // mapa entero casi negro, que es exactamente la sensación que no queremos.
  // Transparentar deja asomar el fondo por debajo, y eso es preferible.
  let estadoClases;
  if (esActual) {
    estadoClases = 'cursor-not-allowed shadow-lg shadow-black/40';
  } else if (visitado) {
    estadoClases = 'cursor-not-allowed opacity-65';
  } else if (disponible) {
    // El mini-zoom del hover va acompañado de un halo: el nodo elegible es lo
    // único del mapa que se ilumina, así que se ve enseguida qué es clicable.
    estadoClases = 'cursor-pointer hover:scale-110 hover:brightness-110 '
      + 'shadow-lg shadow-black/40 hover:shadow-[0_0_16px_rgba(201,74,60,0.75)]';
  } else {
    estadoClases = 'cursor-not-allowed opacity-40';
  }

  // Solo el título, como en Pokelike: la descripción larga de cada tipo de nodo
  // ocupaba media pantalla y se lee una vez en la vida. Lo que hace un nodo se
  // aprende jugando; el tooltip solo tiene que recordar cuál es cuál.
  const contenidoTooltip = (
    <div className="bg-tinta-900 text-pergamino-100 rounded-md border-2 border-pergamino-200/80 shadow-xl px-3 py-1.5 whitespace-nowrap">
      <p className="font-display text-[11px] leading-none">{etiqueta}</p>
    </div>
  );

  return (
    <div className="absolute" style={{ left: posicion.x - lado / 2, top: posicion.y - lado / 2 }}>
      <HoverTooltip posicion="abajo" contenido={contenidoTooltip}>
        <button
          type="button"
          disabled={!disponible}
          onClick={() => onClick(nodo.id)}
          style={{ width: lado, height: lado }}
          className={[
            'relative block border-2 bg-tinta-900',
            'transition-all duration-200',
            esJefe ? 'border-4 border-double' : '',
            esCircular ? 'rounded-full' : 'rounded-md',
            estilo,
            estadoClases,
            esActual && 'ring-2 ring-sello-500 ring-offset-2 ring-offset-tinta-950 scale-110',
          ].filter(Boolean).join(' ')}
          aria-label={`${etiqueta} node${visitado ? ' — visited' : disponible ? ' — available' : ' — not yet reachable'}`}
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
              // Solo el sprite de personaje va pixelado: es un dibujo de ~37×63 px
              // que se AMPLÍA y sin esto sale borroso. Los iconos de nodo, en
              // cambio, se recortaron a 100 px para pintarse a ~56 y se reducen:
              // pixelarlos los dejaría dentados.
              // El `scale` compensa el lienzo común de 96 px de los sprites de
              // personaje: el dibujo ocupa menos parte del PNG que antes, y sin
              // esto el jefe se veía pequeño dentro de su nodo. No hay escala
              // entera posible aquí (el nodo cambia de tamaño con el zoom del
              // mapa), pero a este tamaño no se nota.
              style={spriteDelJefe ? { imageRendering: 'pixelated', transform: 'scale(1.25)' } : undefined}
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
                // Velo flojo: el nodo visitado ya va a `opacity-65`, y sumarle
                // el velo denso de antes lo dejaba negro.
                esActual ? 'bg-tinta-950/30' : 'bg-tinta-950/35',
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
 * Panel debajo del equipo: resumen de oro y objetos. Es solo un vistazo — tocar
 * cualquier fila (o el propio panel) abre la mochila de verdad
 * (`InventoryScreen`), que es donde se equipa y se usa. Antes esto llevaba
 * dentro un selector de personaje en línea: resolvía la mecánica, pero se
 * sentía un formulario web en vez de un inventario de RPG
 * (ver documentacion/24-diseño-tarjeta-equipar-objeto.md).
 *
 * Aquí solo sale lo que está suelto en `inventario`; lo que alguien lleva
 * puesto se ve en `PanelEquipo` y en la mochila.
 */
function PanelObjetos({ inventario, oro, abrirMochila }) {
  const conteoPorId = inventario.reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const idsUnicos = Object.keys(conteoPorId);

  return (
    <div className="bg-pergamino-100 text-tinta-950 rounded-lg p-2">
      {/* Cabecera informativa, no clicable: la mochila se abre tocando un
          objeto concreto, y hacer que "ITEMS" u "oro" también la abrieran
          solo provocaba aperturas sin querer.
          El oro va en esta misma línea, no dentro de la rejilla: no es un objeto
          de la mochila, es el contador de la run. Dentro del panel solo entran
          sprites de objeto. */}
      <div className="flex items-baseline justify-between gap-1">
        <p className="font-display font-bold text-[10px] tracking-wide">ITEMS</p>
        <p className="text-[10px] text-sello-600 font-display">{oro}g</p>
      </div>

      {idsUnicos.length === 0 ? (
        <p className="text-[10px] opacity-50 leading-snug mt-2">Empty bag.</p>
      ) : (
        // Rejilla de sprites sin nombre: el nombre lo cuenta el hover, y la
        // lista con texto obligaba a una fila por objeto y crecía sin parar.
        <div className="grid grid-cols-3 gap-1 mt-2">
          {idsUnicos.map((id) => (
            <ItemHoverCard key={id} id={id} posicion="izquierda" compacto className="block">
              <button
                type="button"
                onClick={() => abrirMochila(id)}
                title={nombreObjeto(id)}
                aria-label={nombreObjeto(id)}
                className="elevar-hover relative w-full aspect-square flex items-center justify-center rounded-md border border-tinta-950/15 bg-tinta-950/5 hover:border-sello-600/60 hover:bg-tinta-950/10"
              >
                {SPRITE_OBJETO[id] ? (
                  <img src={SPRITE_OBJETO[id]} alt="" aria-hidden="true" className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-[10px] font-display opacity-60">?</span>
                )}
                {conteoPorId[id] > 1 && (
                  <span className="absolute bottom-0 right-0 text-[8px] font-display leading-none px-1 py-0.5 rounded bg-tinta-950 text-pergamino-100">
                    {conteoPorId[id]}
                  </span>
                )}
              </button>
            </ItemHoverCard>
          ))}
        </div>
      )}
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
  const desequiparObjeto = useGameStore((s) => s.desequiparObjeto);
  const abrirMochila = useGameStore((s) => s.abrirMochila);
  const abrirLogros = useGameStore((s) => s.abrirLogros);
  const reiniciarRun = useGameStore((s) => s.reiniciarRun);

  const fondoColumna = FONDO_COLUMNA[arcoActualDatos?.id];

  const posiciones = useMemo(() => (mapa ? calcularPosiciones(mapa) : {}), [mapa]);
  const disponibles = useMemo(() => new Set(obtenerNodosDisponibles()), [mapa, nodoActualId]);

  /**
   * Los nodos a los que **todavía se puede llegar** desde donde estás, siguiendo
   * conexiones hacia adelante. No es lo mismo que "estar más adelante en el mapa":
   * al elegir una rama, el subárbol de la otra queda muerto aunque siga estando en
   * pisos que no has jugado. Sin esta cuenta, esos caminos se pintaban como
   * futuros y el mapa prometía sitios a los que ya no se puede ir.
   */
  const alcanzables = useMemo(() => {
    if (!mapa) return new Set();
    const vistos = new Set();
    const cola = nodoActualId === null ? [...mapa.nodosIniciales] : [nodoActualId];
    while (cola.length > 0) {
      const id = cola.pop();
      if (vistos.has(id)) continue;
      vistos.add(id);
      cola.push(...(mapa.nodos[id]?.conexiones ?? []));
    }
    return vistos;
  }, [mapa, nodoActualId]);

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
        <PanelEquipo
          equipo={equipo}
          obtenerHpMaximo={obtenerHpMaximo}
          reordenarEquipo={reordenarEquipo}
          desequiparObjeto={desequiparObjeto}
        />

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
                    // 3) alcanzable más adelante: sale de un nodo al que todavía
                    //    puedes llegar, así que es un camino que aún existe.
                    // 4) inalcanzable, por detrás o en una rama muerta.
                    //
                    // Los del caso 3 van en blanco y bien visibles, no insinuados:
                    // son los que dejan **leer el mapa por delante** y decidir a
                    // dónde te lleva cada rama. Lo que los distingue de un camino
                    // elegible no es que se vean menos, sino que van discontinuos.
                    //
                    // Los del 4 sí se apagan, y ahí entran dos cosas que antes se
                    // trataban distinto: la rama que descartaste al pasar de piso y
                    // **el subárbol entero que cuelga de ella**. Ese segundo caso no
                    // se detectaba —solo se miraba si el origen estaba visitado—, así
                    // que medio mapa muerto seguía pintándose como futuro. Ahora los
                    // dos se resuelven con la misma pregunta: ¿puedo llegar todavía
                    // al nodo del que sale este camino?
                    const recorrido = nodo.visitado && mapa.nodos[destinoId]?.visitado;
                    const disponibleAhora = !recorrido && nodo.id === nodoActualId && disponibles.has(destinoId);
                    const sigueEnJuego = alcanzables.has(nodo.id);

                    let stroke = 'var(--color-pergamino-100)';
                    let strokeOpacity = 0.15;
                    let strokeWidth = 1.5;
                    let strokeDasharray;

                    if (recorrido) {
                      stroke = 'var(--color-sello-500)';
                      strokeOpacity = 0.8;
                      strokeWidth = 2.5;
                    } else if (disponibleAhora) {
                      strokeOpacity = 0.95;
                      strokeWidth = 2;
                    } else if (sigueEnJuego) {
                      strokeOpacity = 0.65;
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
                  escala={escala}
                  disponible={disponibles.has(nodo.id)}
                  visitado={nodo.visitado}
                  esActual={nodo.id === nodoActualId}
                  onClick={avanzarANodo}
                  arco={arcoActualDatos}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: mochila arriba, chuleta de chakra debajo. Los dos
            son consulta rápida (qué llevo / qué le gana a qué), frente a la
            columna izquierda, que es la que se toca para jugar. */}
        <div className="w-32 shrink-0 flex flex-col gap-4">
          <PanelObjetos inventario={inventario} oro={oro} abrirMochila={abrirMochila} />
          <RuedaChakra />
        </div>
      </div>
    </div>
  );
}
