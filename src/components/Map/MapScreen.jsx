import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import personajesData from '../../data/characters.json';
import typesData from '../../data/types.json';
import itemsData from '../../data/items.json';
import PersonajeHoverCard from '../common/PersonajeHoverCard';
import ItemHoverCard from '../common/ItemHoverCard';
import HoverTooltip from '../common/HoverTooltip';

function nombrePersonaje(id) {
  return personajesData.personajes.find((p) => p.id === id)?.nombre ?? id;
}

function nombreObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id)?.nombre ?? id;
}

// Un icono simple por tipo de nodo, en vez de depender de assets externos.
// Los kanjis solos no son legibles para quien no lee japonés, así que cada
// nodo lleva además su propio hover con nombre + beneficio (ver INFO_NODO) —
// sustituye a la vieja leyenda fija del lateral, que ocupaba sitio siempre
// visible por algo que solo hace falta consultar de vez en cuando.
const ICONO_NODO = {
  combate: '⚔',
  evento: '?',
  tienda: '¥',
  descanso: '♨',
  miniJefe: '☠',
  jefe: '危',
};

const ETIQUETA_NODO = {
  combate: 'Combate',
  evento: 'Evento',
  tienda: 'Tienda',
  descanso: 'Descanso',
  miniJefe: 'Mini-jefe',
  jefe: 'Jefe',
};

const INFO_NODO = {
  combate: 'Enemigo aleatorio — gana XP y oro al vencer.',
  evento: 'Elección narrativa: cura, oro, mejoras... sin combate.',
  tienda: 'Compra objetos y recluta (o reemplaza) personajes.',
  descanso: 'Cura y revive a todo el equipo por completo.',
  miniJefe: 'Combate más duro, con recompensa adicional garantizada.',
  jefe: 'El jefe final del arco — superarlo cura a todo el equipo.',
};

const COLOR_NODO = {
  combate: 'bg-tinta-800 border-pergamino-200/40 text-pergamino-100',
  evento: 'bg-tinta-800 border-raiton/50 text-raiton',
  tienda: 'bg-tinta-800 border-doton/50 text-doton',
  descanso: 'bg-tinta-800 border-suiton/50 text-suiton',
  miniJefe: 'bg-sello-600/20 border-sello-500 text-sello-500',
  jefe: 'bg-sello-600 border-sello-500 text-pergamino-100',
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
  const estilo = COLOR_NODO[nodo.tipo] ?? COLOR_NODO.combate;
  const icono = ICONO_NODO[nodo.tipo] ?? '?';
  const esJefe = nodo.tipo === 'jefe';

  // Cuatro estados visuales bien diferenciados, sin solaparse: aquí ahora,
  // ya visitado (greyed out, no se puede repetir), disponible para elegir, o
  // todavía fuera de alcance (más adelante en el mapa).
  let estadoClases;
  let estadoTexto;
  if (esActual) {
    estadoClases = 'cursor-not-allowed shadow-lg shadow-black/40';
    estadoTexto = 'Estás aquí';
  } else if (visitado) {
    estadoClases = 'cursor-not-allowed opacity-50 grayscale';
    estadoTexto = 'Visitado';
  } else if (disponible) {
    estadoClases = 'cursor-pointer hover:scale-110 shadow-lg shadow-black/40';
  } else {
    estadoClases = 'cursor-not-allowed opacity-30 grayscale';
    estadoTexto = 'Todavía no alcanzable';
  }

  const contenidoTooltip = (
    <div className="bg-pergamino-100 text-tinta-950 rounded-lg border-2 border-sello-600 shadow-xl p-2.5 w-44 text-left">
      <p className="font-display font-bold text-xs">{ETIQUETA_NODO[nodo.tipo] ?? nodo.tipo}</p>
      <p className="text-[10px] opacity-70 mt-0.5">{INFO_NODO[nodo.tipo] ?? ''}</p>
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
            'flex items-center justify-center border-2 font-display text-lg',
            'transition-transform duration-200',
            esJefe ? 'w-14 h-14 border-double border-4' : 'rounded-full w-12 h-12',
            estilo,
            estadoClases,
            esActual && 'ring-2 ring-sello-500 ring-offset-2 ring-offset-tinta-950 scale-110',
          ].filter(Boolean).join(' ')}
          aria-label={`Nodo de tipo ${ETIQUETA_NODO[nodo.tipo] ?? nodo.tipo}${visitado ? ', visitado' : disponible ? ', disponible' : ', no disponible'}`}
        >
          {icono}
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
    <div className="w-40 shrink-0">
      <div className="bg-pergamino-100 text-tinta-950 rounded-lg p-3">
        <p className="font-display font-bold text-sm mb-3 tracking-wide">EQUIPO</p>
        <div className="flex flex-col gap-2">
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
                    'w-full text-left rounded-md p-2 border transition-colors',
                    esActivo ? 'border-sello-600 bg-sello-600/10' : 'border-tinta-950/15 bg-tinta-950/5',
                    p.derrotado ? 'opacity-40' : '',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => ponerEnFrente(p.id)}
                    disabled={p.derrotado || esActivo}
                    className={`w-full text-left ${p.derrotado ? 'cursor-default' : 'cursor-pointer'}`}
                    title={esActivo ? 'Este personaje está en posición 1' : 'Poner en posición 1'}
                  >
                    <p className="text-xs font-display font-bold truncate">
                      {nombrePersonaje(p.id)} {esActivo && '★'}
                    </p>
                    <p className="text-[10px] opacity-70">Nv. {p.nivel}{p.derrotado ? ' — caído' : ''}</p>
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
                        className="text-[9px] opacity-60 hover:opacity-100 shrink-0 underline"
                        title="Desequipar (vuelve al inventario)"
                      >
                        quitar
                      </button>
                    </div>
                  )}
                </div>
              </PersonajeHoverCard>
            );
          })}
        </div>
        <p className="text-[9px] opacity-50 mt-3 leading-snug">
          Toca a un personaje para ponerlo en posición 1 (el que combate).
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
    <div className="w-40 shrink-0">
      <div className="bg-pergamino-100 text-tinta-950 rounded-lg p-3">
        <p className="font-display font-bold text-sm tracking-wide">OBJETOS</p>
        <p className="text-xs text-sello-600 font-display mt-0.5 mb-3">{oro} de oro</p>

        {itemSeleccionado ? (
          <div>
            <p className="text-[10px] mb-2 leading-snug">
              {itemSeleccionado.tipo === 'equipable' ? 'Equipar' : 'Usar'}{' '}
              <span className="font-display font-bold">{itemSeleccionado.nombre}</span> en:
            </p>
            <div className="flex flex-col gap-1.5">
              {equipo.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => elegirPersonaje(p.id)}
                  className="text-left text-xs bg-tinta-950/5 hover:bg-sello-600/20 border border-tinta-950/15 hover:border-sello-600/60 rounded-md px-2 py-1.5 transition-colors"
                >
                  {nombrePersonaje(p.id)}
                  {p.objetoEquipadoId && itemSeleccionado.tipo === 'equipable' && (
                    <span className="opacity-60"> (cambia {nombreObjeto(p.objetoEquipadoId)})</span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItemSeleccionadoId(null)}
              className="mt-2 text-[10px] underline opacity-60 hover:opacity-100"
            >
              Cancelar
            </button>
          </div>
        ) : idsUnicos.length === 0 ? (
          <p className="text-[10px] opacity-50 leading-snug">Todavía no tienes ningún objeto.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {idsUnicos.map((id) => (
              <ItemHoverCard key={id} id={id} className="block w-full">
                <button
                  type="button"
                  onClick={() => setItemSeleccionadoId(id)}
                  className="w-full flex items-center justify-between gap-1 rounded-md border border-tinta-950/15 bg-tinta-950/5 hover:border-sello-600/60 px-2 py-1.5 transition-colors"
                >
                  <p className="text-xs font-display truncate">{nombreObjeto(id)}</p>
                  {conteoPorId[id] > 1 && (
                    <span className="text-[10px] opacity-60 shrink-0">x{conteoPorId[id]}</span>
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
const RADIO_RUEDA = 42;
const RADIO_NODO_CHAKRA = 12;

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
    <div className="w-40 shrink-0">
      <div className="bg-pergamino-100 text-tinta-950 rounded-lg p-3">
        <p className="font-display font-bold text-sm tracking-wide">VENTAJA DE CHAKRA</p>
        <p className="text-[9px] opacity-60 mt-1 mb-2 leading-snug">
          Cada flecha apunta al elemento contra el que es fuerte.
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
            // Curva ligera hacia el centro para que las 5 flechas no se solapen entre sí.
            const puntoMedioX = (origen.x + destino.x) / 2;
            const puntoMedioY = (origen.y + destino.y) / 2;
            const controlX = puntoMedioX + (CENTRO_RUEDA - puntoMedioX) * 0.3;
            const controlY = puntoMedioY + (CENTRO_RUEDA - puntoMedioY) * 0.3;
            // Recorta el final de la curva justo al borde del círculo destino
            // (tangente = dirección control→destino) — si la flecha termina
            // en el centro del círculo, el círculo (dibujado encima) la tapa
            // por completo y no se ve ninguna punta.
            const dx = destino.x - controlX;
            const dy = destino.y - controlY;
            const distancia = Math.hypot(dx, dy) || 1;
            const finX = destino.x - (dx / distancia) * RADIO_NODO_CHAKRA;
            const finY = destino.y - (dy / distancia) * RADIO_NODO_CHAKRA;
            return (
              <path
                key={tipo}
                d={`M ${origen.x} ${origen.y} Q ${controlX} ${controlY} ${finX} ${finY}`}
                fill="none"
                stroke={`var(--color-${tipo})`}
                strokeWidth="2"
                opacity="0.85"
                markerEnd={`url(#flecha-chakra-${tipo})`}
              />
            );
          })}
          {ORDEN_CICLO_CHAKRA.map((tipo, i) => (
            <g key={tipo}>
              <circle cx={puntos[i].x} cy={puntos[i].y} r={RADIO_NODO_CHAKRA} fill={`var(--color-${tipo})`} />
              <text
                x={puntos[i].x}
                y={puntos[i].y + 3}
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="var(--color-pergamino-100)"
              >
                {tipo.slice(0, 3).toUpperCase()}
              </text>
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
    if (window.confirm('¿Seguro que quieres reiniciar la run? Perderás todo el progreso actual.')) {
      reiniciarRun();
    }
  }

  const botonClase = 'w-9 h-9 flex items-center justify-center rounded-full border border-pergamino-100/20 '
    + 'text-pergamino-100/80 hover:text-pergamino-100 hover:border-sello-600/60 transition-colors';

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button type="button" onClick={abrirLogros} className={botonClase} title="Logros" aria-label="Logros">
        🏆
      </button>
      <button
        type="button"
        onClick={alternarPantallaCompleta}
        className={botonClase}
        title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
        aria-label="Pantalla completa"
      >
        ⛶
      </button>
      <button type="button" onClick={manejarReiniciar} className={botonClase} title="Reiniciar run" aria-label="Reiniciar run">
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
        No hay ninguna run en curso todavía.
      </div>
    );
  }

  return (
    <div className="h-screen bg-tinta-950 text-pergamino-100 font-body px-4 py-4 relative flex flex-col overflow-hidden">
      <MenuIconos abrirLogros={abrirLogros} reiniciarRun={reiniciarRun} />

      <header className="text-center mb-2 shrink-0">
        <p className="text-sello-500 text-xs tracking-[0.3em] uppercase mb-1">Arco actual</p>
        <h1 className="font-display text-3xl font-bold text-pergamino-100">
          {arcoActualDatos?.nombre}
        </h1>
      </header>

      <div className="flex-1 min-h-0 flex justify-center items-start gap-6 max-w-4xl mx-auto w-full">
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

        <div ref={contenedorRef} className="flex-1 min-h-0 h-full flex items-center justify-center overflow-hidden">
          <div style={{ width: ANCHO * escala, height: alturaLienzo * escala }}>
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
