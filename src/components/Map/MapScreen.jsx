import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { useGameStore, combinarMultiplicadoresTemporales } from '../../store/useGameStore';
import { spriteDeCombate, nombreDeModo } from '../common/datosDeLuchador';
import typesData from '../../data/types.json';
import {
  nombreObjeto, nombreCorto, nombrePersonaje, tipoDeLuchador, nombreDeTipo,
  clasePastillaDeTipo,
} from '../common/nombres';
import { IconoChakraDeLuchador } from '../common/IconoChakra';
import { SPRITE_CHAKRA } from '../common/chakraSprites';
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
import iconoLogros from '../../assets/menu/logros.png';
import iconoEnciclopedia from '../../assets/menu/enciclopedia.png';
import iconoAjustes from '../../assets/menu/ajustes.png';
import iconoReiniciar from '../../assets/menu/reiniciar.png';
import iconoHome from '../../assets/menu/home.png';
import itemsData from '../../data/items.json';
import {
  PanelMarco, TituloBloque, AdornoMarco, EtiquetaFlotante, VentanaModal, BotonSecundario,
  ChipEfecto,
} from '../common/PiezasUI';
import { resumirBuffsActivos } from '../common/efectos';

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
  comun: 'border-exito/60 text-exito',
  legendario: 'border-oro text-oro',
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

// El tipo de dato que viaja en un arrastre de objeto, de la rejilla de la mochila
// a una tarjeta del equipo. Es un tipo propio y no `text/plain` para que la
// tarjeta pueda distinguir "me traen un objeto" de "me traen un compañero" (que
// es el otro arrastre que acepta) sin compartir estado entre los dos paneles.
const ARRASTRE_OBJETO = 'application/x-objeto';

const ANCHO = 520;
// Los dos paneles laterales miden lo mismo para que el mapa quede centrado de verdad
// (ver el comentario de la fila, más abajo), y su ancho vive aquí porque el cálculo de
// la escala tiene que descontarlo. `SEPARACION_PANELES` es el `gap-4` de Tailwind.
const ANCHO_PANELES = 160;
const SEPARACION_PANELES = 16;
// ⚠️ **Este número decide lo ANCHA que se ve la columna**, aunque no lo parezca. La
// escala es `min(ancho/ANCHO, alto/alturaLienzo)` y siempre manda la altura (el
// lienzo es mucho más alto que ancho), así que bajar la separación entre pisos hace
// el lienzo menos alto → la escala sube → **la columna se ensancha en pantalla** con
// el mismo hueco disponible. Era la queja del playtest: "el mapa es un poco pequeño".
// Bajado de 120 a 104; con los nodos a 56 px de lienzo quedan 48 px de aire entre
// filas, que es lo que impide que se toquen.
//
// ⚠️ Va emparejado con `scripts/generar-columnas-mapa.py`: el fondo se genera a
// 520 × (ALTO_POR_PISO × 8) y se pinta con `100% 100%`, así que cambiar uno sin el
// otro DEFORMA el dibujo en vez de recortarlo. El script lleva el mismo aviso.
const ALTO_POR_PISO = 104;

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

/**
 * Lo que se ve al pasar por encima de un mini-jefe o de un jefe final: quién es, a
 * qué nivel pelea y de qué naturaleza es.
 *
 * El modo activo se enseña **solo si lo tiene a ese nivel**, y no destripa nada que
 * el mapa no cuente ya: el sprite del nodo se pinta con `spriteDeCombate(id, nivel)`,
 * o sea que a un jefe transformado ya se le ve transformado desde el mapa.
 */
function EtiquetaFichaDeJefe({ id, nivel }) {
  const tipo = tipoDeLuchador(id);
  const modo = nombreDeModo(id, nivel);
  return (
    <EtiquetaFlotante>
      {/* Sin el "BOSS" / "MINI-BOSS" en rojo que llevaba encima: el nodo ya lo dice
          por tres vías —el sprite del personaje en vez de un icono genérico, el borde
          rojo y el badge de rango (☠ / 危)—, así que el rótulo solo repetía. Y con el
          nombre propio del jefe justo debajo, era además la línea menos informativa
          de las cuatro. */}
      <p className="leading-tight">{nombrePersonaje(id)}</p>
      <div className="flex items-center gap-2 mt-1.5 text-[9px]">
        <span className="text-oro">Lv.{nivel}</span>
        {tipo && (
          <span className={`shrink-0 px-1.5 py-0.5 rounded-sm border ${clasePastillaDeTipo(id)}`}>
            {/* 8 px, por debajo del texto de 9 que lo acompaña. Un icono a la altura
                de la letra o por encima no se lee como una marca sino como un dibujo
                metido en medio de la frase, y encima estira la pastilla. */}
            <IconoChakraDeLuchador id={id} tamano="w-2 h-2" /> {nombreDeTipo(id)}
          </span>
        )}
      </div>
      {modo && <p className="text-[9px] text-pergamino-200/70 mt-1.5">{modo}</p>}
    </EtiquetaFlotante>
  );
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
  // lo vas a encontrar — y desde que sus umbrales se bajaron al nivel de su
  // propio combate, eso significa **transformado**. El mapa no ha tenido que
  // cambiar para enterarse: el sprite es función del nivel.
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

  // Para los nodos corrientes, solo el título: la descripción larga de cada tipo
  // ocupaba media pantalla y se lee una vez en la vida. Lo que hace un nodo se
  // aprende jugando; el tooltip solo tiene que recordar cuál es cuál.
  //
  // **Los dos jefes son la excepción**, como en Pokelike, que al pasar por encima de
  // un gimnasio te enseña quién es y con qué viene. Aquí eso significa nombre, nivel
  // y naturaleza de chakra: es lo que decide a quién pones en la posición 1, y sin
  // ello el jugador entra a la pelea más importante del arco a ciegas.
  //
  // ⚠️ **El pergamino dorado NO lo lleva**, a propósito: ahí la gracia es no saber a
  // quién te vas a encontrar. Por eso esto mira `nodo.tipo` y no "si hay un jefe
  // detrás" — el desafío legendario también es un jefe.
  const idDelJefe = nodo.tipo === 'miniJefe' ? arco?.miniJefeId
    : nodo.tipo === 'jefe' ? arco?.jefeFinalId : null;
  const nivelDelJefe = nodo.tipo === 'miniJefe' ? arco?.nivelMiniJefe : arco?.nivelJefeFinal;

  const contenidoTooltip = idDelJefe
    ? <EtiquetaFichaDeJefe id={idDelJefe} nivel={nivelDelJefe} />
    : <EtiquetaFlotante>{etiqueta}</EtiquetaFlotante>;

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

/**
 * Panel izquierdo: el equipo. Es la vista que el jugador tiene delante casi toda
 * la partida, así que es donde más se notaba que las tarjetas se diseñaron antes
 * de que hubiera arte: enseñaban texto donde ya podían enseñar al ninja.
 *
 * Cambios respecto a la versión de solo texto (puntos 8 y 11 del roadmap):
 * - **Sprite** a la izquierda, con el nivel encima. Con el nivel real, así que
 *   un personaje transformado se ve transformado también aquí.
 * - **Nombre abreviado** ("Naruto U.") y la naturaleza de chakra como etiqueta
 *   propia debajo del HP, fuera del nombre. Los nombres completos se truncaban a
 *   mitad de palabra y el emoji dentro del nombre le robaba sitio.
 * - **Reordenar con drag and drop** en vez de un clic que mandaba a la posición 1.
 *   Arrastrar dice *dónde* lo pones; el clic solo permitía "al frente", así que
 *   ordenar el segundo y el tercero entre sí era imposible.
 * - **El objeto equipado se ve con su sprite**, con una X para quitarlo.
 * - El panel es más ancho (`w-40`): había sitio de sobra y la letra no tiene por
 *   qué ser diminuta.
 */
function PanelEquipo({
  equipo, obtenerHpMaximo, reordenarEquipo, desequiparObjeto, equiparObjeto, usarConsumible,
  multiplicadoresBuffs,
}) {
  // El id que se está arrastrando. Es estado local y no del store a propósito:
  // no es información de la run, solo del gesto en curso.
  const [arrastrando, setArrastrando] = useState(null);
  const [encima, setEncima] = useState(null);
  // `{ itemId, idPersonaje }` del reemplazo que espera confirmación, o null.
  const [reemplazoPendiente, setReemplazoPendiente] = useState(null);

  function soltarSobre(idDestino) {
    if (!arrastrando || arrastrando === idDestino) return;
    const ids = equipo.map((p) => p.id);
    const desde = ids.indexOf(arrastrando);
    const hasta = ids.indexOf(idDestino);
    if (desde === -1 || hasta === -1) return;
    // Sacar y volver a insertar, no intercambiar: intercambiar dos posiciones
    // deja el orden intermedio como estaba y el gesto no se corresponde con lo
    // que ve el jugador, que es "he metido a este aquí".
    ids.splice(desde, 1);
    ids.splice(hasta, 0, arrastrando);
    reordenarEquipo(ids);
  }

  /**
   * Soltar un objeto de la mochila encima de un personaje (salido del playtest:
   * el mapa dejaba arrastrar objetos y no dejaba equiparlos así, que es el único
   * sitio donde arrastrar significa algo).
   *
   * ⚠️ **Si el destino ya lleva algo puesto, se pregunta antes.** La mochila ya
   * lo preguntaba desde que existe (`InventoryScreen`), y al abrir esta segunda
   * puerta para equipar se coló sin ella: equipar encima devuelve el objeto
   * anterior a la bolsa, y eso no se ve venir desde un arrastre. Es el fallo
   * clásico de añadir un camino nuevo a una acción que ya tenía guardas — las
   * guardas van con la acción, no con el camino.
   *
   * Con lo demás no se pregunta: un consumible se gasta en quien lo recibe y un
   * hueco vacío no pisa nada.
   */
  function soltarObjetoSobre(itemId, personaje) {
    const objeto = itemsData.objetos.find((o) => o.id === itemId);
    if (objeto?.tipo === 'equipable' && personaje.objetoEquipadoId) {
      setReemplazoPendiente({ itemId, idPersonaje: personaje.id });
      return;
    }
    // Aparte de ese caso, no se mira de qué tipo es: se intenta equipar y, si el
    // store dice que no, se intenta usar. Los dos validan y devuelven `false` si
    // no les toca, así que quien distingue equipable de consumible sigue siendo él.
    if (equiparObjeto(itemId, personaje.id)) return;
    usarConsumible(itemId, personaje.id);
  }

  return (
    <div className="w-40 shrink-0">
      {/* Del crema al marco oscuro del kit. Los tres paneles del mapa iban cada uno
          por su cuenta —equipo y objetos en `bg-pergamino-100`, la rueda de chakra en
          oscuro— y al lado de las ventanas de Missions y el Bingo Book se veía que no
          eran del mismo juego. Ver documentacion/33-direccion-visual.md. */}
      <PanelMarco className="p-2.5 flex flex-col gap-2">
        <TituloBloque>Team</TituloBloque>
        <div className="flex flex-col gap-1.5">
          {equipo.map((p, index) => {
            const hpMaximo = obtenerHpMaximo(p.id) ?? p.hpActual ?? 1;
            const porcentaje = Math.max(0, p.hpActual / hpMaximo);
            const esActivo = index === 0;
            const sprite = spriteDeCombate(p.id, p.nivel);
            return (
              <PersonajeHoverCard
                key={p.id}
                id={p.id}
                nivel={p.nivel}
                hpActual={p.hpActual}
                hpMaximo={hpMaximo}
                objetoEquipadoId={p.objetoEquipadoId}
                // ⚠️ Sin estos dos, la ficha reconstruía al luchador desde el JSON crudo
                // y enseñaba un número MÁS BAJO del que de verdad pelea: la mejora
                // permanente de un evento no aparecía en ninguna pantalla del juego, y
                // el buff temporal tampoco. Solo los llevan los del equipo — un
                // candidato de reclutar no tiene ni bonificaciones ni buffs.
                bonificaciones={p.bonificaciones}
                multiplicadoresBuffs={multiplicadoresBuffs}
                className="block w-full"
              >
                <div
                  draggable={!p.derrotado}
                  onDragStart={() => setArrastrando(p.id)}
                  onDragEnd={() => { setArrastrando(null); setEncima(null); }}
                  // La tarjeta acepta DOS cosas: otro compañero (reordenar) y un
                  // objeto de la mochila (equipar o usar). Se distinguen por el tipo
                  // de dato que lleva el arrastre, no por un estado compartido entre
                  // los dos paneles: `dataTransfer` ya viaja con el gesto.
                  // `getData` solo se puede leer al soltar, pero `types` sí se puede
                  // consultar antes, que es lo que hace falta para el resaltado.
                  onDragOver={(e) => { e.preventDefault(); setEncima(p.id); }}
                  onDragLeave={() => setEncima((actual) => (actual === p.id ? null : actual))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const itemId = e.dataTransfer.getData(ARRASTRE_OBJETO);
                    if (itemId) soltarObjetoSobre(itemId, p);
                    else soltarSobre(p.id);
                    setEncima(null);
                  }}
                  className={[
                    'w-full text-left rounded-sm p-1.5 border transition-colors',
                    esActivo ? 'border-sello-500 bg-sello-600/15' : 'border-marco bg-tinta-950/40',
                    p.derrotado ? 'opacity-40' : 'cursor-grab active:cursor-grabbing',
                    arrastrando === p.id ? 'opacity-50' : '',
                    encima === p.id && arrastrando !== p.id ? 'border-oro border-dashed' : '',
                  ].join(' ')}
                >
                  {/* El nombre va en su propia línea, a lo ancho de la
                      tarjeta: compartiendo fila con el sprite le quedaban 60 px y
                      hasta "Naruto U." se cortaba en "Nar…", que no identifica a
                      nadie. Debajo, el sprite y el estado. */}
                  <p className="text-[10px] font-display font-bold truncate mb-1">
                    {nombreCorto(p.id)} {esActivo && '★'}
                  </p>

                  <div className="flex items-center gap-1.5">
                    {/* El sprite va a la mitad de su lienzo (96 → 48): sigue
                        siendo un múltiplo entero, que es lo que mantiene limpio
                        el pixel art. El nivel va encima, en la esquina — es un
                        dato de una o dos cifras y no merece una columna. */}
                    <div className="relative w-12 h-12 shrink-0 flex items-end justify-center">
                      <div className="absolute bottom-0 w-9 h-2 rounded-[50%] bg-pergamino-200/20" />
                      {sprite && (
                        <img
                          src={sprite}
                          alt=""
                          className="relative w-12 h-12 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                          draggable={false}
                        />
                      )}
                      <span className="absolute top-0 left-0 text-[8px] font-display bg-tinta-950/70 text-pergamino-100 px-1 rounded-sm leading-tight">
                        {p.nivel}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="h-1.5 w-full bg-tinta-950 border border-marco rounded-full overflow-hidden">
                        <div
                          className={`h-full ${porcentaje > 0.4 ? 'bg-exito' : 'bg-sello-600'}`}
                          style={{ width: `${porcentaje * 100}%` }}
                        />
                      </div>
                      {/* Debajo de la barra van los NÚMEROS de HP, no la
                          naturaleza de chakra: en el mapa lo que se consulta a
                          cada paso es cuánta vida le queda a cada uno para decidir
                          si toca descanso. El tipo es de leer una vez y sigue en
                          el hover, con su pastilla de color.

                          Sin el sufijo "HP" y sin espacios alrededor de la barra:
                          la columna son ~78 px y "45 / 45 HP" se cortaba en
                          "45 / 45 …". La barra justo encima ya dice que eso es
                          vida, y así caben incluso los 3 dígitos del final de la
                          run ("245/245"). */}
                      <p className="text-[8px] opacity-70 mt-1 truncate">
                        {Math.max(0, p.hpActual)}/{hpMaximo}
                      </p>
                    </div>
                  </div>

                  {/* El objeto equipado, en su propia fila debajo. Se probó
                      encima del sprite, en la esquina, y tapaba justo al ninja:
                      el retrato es lo primero que identifica la tarjeta y el
                      objeto le caía encima con su botón de quitar. Aquí abajo
                      cabe entero, con su nombre, y la X no pisa nada. */}
                  {p.objetoEquipadoId && (
                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-marco">
                      {SPRITE_OBJETO[p.objetoEquipadoId] && (
                        <img
                          src={SPRITE_OBJETO[p.objetoEquipadoId]}
                          alt=""
                          className="w-5 h-5 shrink-0"
                          style={{ imageRendering: 'pixelated' }}
                          draggable={false}
                        />
                      )}
                      <span className="text-[8px] opacity-80 truncate flex-1 min-w-0">
                        {nombreObjeto(p.objetoEquipadoId)}
                      </span>
                      <button
                        type="button"
                        onClick={() => desequiparObjeto(p.id)}
                        className="shrink-0 w-4 h-4 rounded-full bg-pergamino-100/10 hover:bg-sello-600 hover:text-sobre-sello text-[9px] leading-none flex items-center justify-center transition-colors"
                        title="Unequip (returns to inventory)"
                        aria-label={`Unequip ${nombreObjeto(p.objetoEquipadoId)}`}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </PersonajeHoverCard>
            );
          })}
        </div>
        <p className="text-[8px] text-pergamino-200/45 leading-snug">
          Drag to reorder, or drop an item on a ninja.
        </p>
      </PanelMarco>

      {/* La confirmación de reemplazo, con el mismo texto que la de la mochila
          (`InventoryScreen`): las dos puertas para equipar tienen que contar lo
          mismo, sobre todo la que se abre sin querer. Va como ventana y no como
          `window.confirm` por lo de siempre —el diálogo del navegador rompe la
          ilusión— y porque el criterio del kit ya dice que una decisión corta se
          resuelve en una ventana sobre el mapa (ver documentacion/33). */}
      {reemplazoPendiente && (
        <PanelReemplazoObjeto
          itemId={reemplazoPendiente.itemId}
          personaje={equipo.find((p) => p.id === reemplazoPendiente.idPersonaje)}
          onCancelar={() => setReemplazoPendiente(null)}
          onConfirmar={() => {
            equiparObjeto(reemplazoPendiente.itemId, reemplazoPendiente.idPersonaje);
            setReemplazoPendiente(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * "Ya lleva algo puesto, ¿lo cambio?" — la ventana que aparece al soltar un
 * equipable encima de un personaje que ya tiene su hueco ocupado.
 *
 * Vive aquí y no en el kit porque solo la usa esta pantalla, que es la regla del
 * propio kit. Lo que sí se comparte con la mochila es el **texto**: decir lo mismo
 * con otras palabras en los dos sitios es una forma barata de que parezcan dos
 * mecánicas distintas.
 */
function PanelReemplazoObjeto({ itemId, personaje, onCancelar, onConfirmar }) {
  if (!personaje) return null;
  return (
    <VentanaModal titulo="Replace item" onCerrar={onCancelar} ancho="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {SPRITE_OBJETO[itemId] && (
            <img src={SPRITE_OBJETO[itemId]} alt="" aria-hidden="true" className="w-12 h-12 object-contain shrink-0" />
          )}
          <p className="font-display text-[11px] text-pergamino-100 leading-tight">
            {nombreObjeto(itemId)}
          </p>
        </div>
        <p className="text-[9px] text-pergamino-200/70 leading-relaxed border-t border-marco pt-3">
          <span className="text-pergamino-100">{nombreCorto(personaje.id)}</span> is already carrying{' '}
          <span className="text-pergamino-100">{nombreObjeto(personaje.objetoEquipadoId)}</span>.
          It goes back to the bag.
        </p>
        <div className="flex justify-end gap-2">
          <BotonSecundario onClick={onCancelar}>Cancel</BotonSecundario>
          <button
            type="button"
            onClick={onConfirmar}
            className="font-display text-[9px] px-3 py-2 rounded-sm bg-sello-600 text-sobre-sello hover:bg-sello-500 transition-colors"
          >
            Replace
          </button>
        </div>
      </div>
    </VentanaModal>
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
/**
 * Los buffs temporales que están activos ahora mismo, con los combates que les quedan.
 *
 * ⚠️ **Existe porque el efecto era INVISIBLE.** Un evento te daba "ATK +20% durante 3
 * combates", `crearLuchador` lo aplicaba de verdad en cada pelea… y no aparecía en
 * ninguna pantalla. O sea que el juego te cambiaba los números y no te lo decía: no
 * podías saber si seguías bufado, ni decidir en consecuencia (pelear al jefe ahora o
 * dar un rodeo), que es justo para lo que sirve un buff con caducidad.
 *
 * El panel **desaparece cuando no hay ninguno**, en vez de quedarse vacío: un hueco
 * permanente que casi siempre está en blanco enseña a no mirarlo.
 */
function PanelBuffs({ buffsTemporales }) {
  const chips = resumirBuffsActivos(buffsTemporales);
  if (chips.length === 0) return null;

  return (
    <PanelMarco className="p-2.5 flex flex-col gap-2">
      <TituloBloque>Active</TituloBloque>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <ChipEfecto key={`${chip.texto}-${i}`} {...chip} />
        ))}
      </div>
      {/* El sufijo de cada pastilla es un "3×", que sin esto no se sabe de qué. Una
          línea para toda la lista y no una explicación por pastilla. */}
      <p className="text-[8px] text-pergamino-200/45 leading-snug">Battles left.</p>
    </PanelMarco>
  );
}

function PanelObjetos({ inventario, oro, abrirMochila }) {
  const conteoPorId = inventario.reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const idsUnicos = Object.keys(conteoPorId);

  return (
    <PanelMarco className="p-2.5 flex flex-col gap-2">
      {/* Cabecera informativa, no clicable: la mochila se abre tocando un
          objeto concreto, y hacer que "ITEMS" u "oro" también la abrieran
          solo provocaba aperturas sin querer.
          El oro va en esta misma línea, no dentro de la rejilla: no es un objeto
          de la mochila, es el contador de la run. Dentro del panel solo entran
          sprites de objeto. */}
      <div className="flex items-baseline justify-between gap-1">
        <TituloBloque>Items</TituloBloque>
        <p className="text-[10px] text-oro font-display">{oro}g</p>
      </div>

      {idsUnicos.length === 0 ? (
        <p className="text-[9px] text-pergamino-200/45 leading-snug">Empty bag.</p>
      ) : (
        // Rejilla de sprites sin nombre: el nombre lo cuenta el hover, y la
        // lista con texto obligaba a una fila por objeto y crecía sin parar.
        <div className="grid grid-cols-3 gap-1">
          {idsUnicos.map((id) => (
            <ItemHoverCard key={id} id={id} posicion="izquierda" compacto className="block">
              <button
                type="button"
                onClick={() => abrirMochila(id)}
                // Arrastrable hasta una tarjeta del equipo, que lo equipa o lo usa
                // (ver `soltarObjetoSobre` en PanelEquipo). El clic sigue abriendo la
                // mochila: el arrastre es el atajo, no el único camino — con el equipo
                // fuera de pantalla, o para leer lo que hace el objeto antes de
                // decidir, la mochila sigue siendo lo suyo.
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(ARRASTRE_OBJETO, id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                title={nombreObjeto(id)}
                aria-label={nombreObjeto(id)}
                className="elevar-hover relative w-full aspect-square flex items-center justify-center rounded-sm border border-marco bg-tinta-950/50 hover:border-oro/60 hover:bg-tinta-950/80 cursor-grab active:cursor-grabbing"
              >
                {SPRITE_OBJETO[id] ? (
                  <img src={SPRITE_OBJETO[id]} alt="" aria-hidden="true" className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-[10px] font-display text-pergamino-200/40">?</span>
                )}
                {conteoPorId[id] > 1 && (
                  <span className="absolute bottom-0 right-0 text-[8px] font-display leading-none px-1 py-0.5 rounded-sm bg-tinta-950 border border-marco text-pergamino-100">
                    {conteoPorId[id]}
                  </span>
                )}
              </button>
            </ItemHoverCard>
          ))}
        </div>
      )}
    </PanelMarco>
  );
}

const ORDEN_CICLO_CHAKRA = typesData.elementos; // ['katon', 'fuuton', 'raiton', 'doton', 'suiton'] — ya en orden de ventaja del ciclo
const CENTRO_RUEDA = 55;
const RADIO_RUEDA = 40;
const RADIO_NODO_CHAKRA = 13;
// El icono, algo más pequeño que el círculo que lo contiene, para que se vea el aro de color.
const LADO_ICONO_CHAKRA = 17;

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
    <PanelMarco className="p-2.5 flex flex-col gap-1">
      <TituloBloque>Chakra</TituloBloque>
      <p className="text-[8px] text-pergamino-200/45 mb-1 leading-snug">
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
            {/* Un `<image>` del SVG, no el `<foreignObject>` con un emoji dentro que
                había antes. Aquel era HTML de verdad metido en el SVG, así que el
                navegador lo trataba como un párrafo: cursor de escritura al pasar por
                encima y se podía seleccionar arrastrando, y hacía falta desactivarle
                los eventos a mano para tapar el problema. Con un sprite el problema no
                existe — **una imagen no es texto**. */}
            <image
              href={SPRITE_CHAKRA[tipo]}
              x={puntos[i].x - LADO_ICONO_CHAKRA / 2}
              y={puntos[i].y - LADO_ICONO_CHAKRA / 2}
              width={LADO_ICONO_CHAKRA}
              height={LADO_ICONO_CHAKRA}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))}
      </svg>
    </PanelMarco>
  );
}

/**
 * Menú vertical junto al mapa, como el de Pokelike: Missions, Bingo Book, Settings
 * y Reiniciar run.
 *
 * **Marco de CSS e iconos sueltos** (punto 16 del roadmap). Antes era **una sola
 * imagen** —`assets/menu/columna-menu.png`, la maqueta del artista con marco, huecos
 * e iconos dibujados juntos— y cuatro botones transparentes colocados por porcentaje
 * encima. Salía idéntica a la maqueta y sin recortes frágiles, y por eso se hizo así;
 * pero se pagaba en tres sitios a la vez:
 *
 * 1. ⚠️ **Clavaba el menú a EXACTAMENTE cuatro entradas.** Los huecos estaban
 *    pintados: añadir una quinta obligaba a redibujar la hoja. Dejó de ser teórico en
 *    cuanto apareció el punto 18 (Home), que es justo una entrada más.
 * 2. **El hover realzaba el hueco y no el icono**, porque el icono era parte del
 *    fondo y no se podía tocar por separado. Se leía como que se ilumina el agujero.
 * 3. La confirmación de reiniciar era un `window.confirm`.
 *
 * Lo que lo desbloqueó fue el arte: los cuatro iconos ya existen sueltos
 * (`assets/menu/*.png`, recortados por `scripts/generar-sprites-iconos.py`), así que
 * el marco pasa a ser un panel normal y cada icono, su propio `<img>`.
 */
function MenuVertical({ abrirLogros, abrirEnciclopedia, abrirAjustes, reiniciarRun, irAlHome }) {
  // Una sola pieza para las dos salidas destructivas: cambia el texto, no la mecánica.
  const [confirmando, setConfirmando] = useState(null); // 'reiniciar' | 'home' | null

  // El engranaje abre **Ajustes**, que es lo que la maqueta dibujó: antes hacía de
  // pantalla completa, que era un apaño mientras no había pantalla de ajustes —
  // ahora pantalla completa vive dentro de ella.
  //
  // ⚠️ Esto **ya no está clavado a cuatro entradas.** Hasta el punto 16, el menú era
  // una sola imagen con el marco, los huecos y los iconos dibujados juntos, y cuatro
  // botones transparentes colocados por porcentaje encima: añadir o quitar una
  // entrada obligaba a redibujar la hoja. Ahora el marco es CSS y cada icono es su
  // propio PNG, así que esta lista se puede tocar sin tocar el arte — que es
  // exactamente lo que hace falta para el Home del punto 18.
  const ENTRADAS = [
    { etiqueta: 'Missions', icono: iconoLogros, onClick: abrirLogros },
    { etiqueta: 'Bingo Book', icono: iconoEnciclopedia, onClick: abrirEnciclopedia },
    { etiqueta: 'Settings', icono: iconoAjustes, onClick: abrirAjustes },
    { etiqueta: 'Restart run', icono: iconoReiniciar, onClick: () => setConfirmando('reiniciar') },
    // La quinta entrada, y **la que demostró que arreglar el menú hacía falta**: con
    // la maqueta de una sola pieza no cabía sin redibujar la hoja (ver arriba).
    { etiqueta: 'Home', icono: iconoHome, onClick: () => setConfirmando('home') },
  ];

  return (
    <>
      <nav
        // `escena-oscura` por lo mismo que el lienzo del mapa: esto se pinta encima
        // del fondo dibujado, así que el realce del hover tiene que seguir siendo un
        // aclarado también en modo claro (ver `index.css`).
        className="escena-oscura absolute top-4 right-4 flex flex-col gap-0.5 p-1 bg-tinta-900/85 border-2 border-marco shadow-xl shadow-black/50 select-none"
        aria-label="Game menu"
      >
        {ENTRADAS.map((entrada) => (
          // La etiqueta flotante va a la IZQUIERDA: el menú vive pegado al borde
          // derecho de la pantalla y a la derecha se saldría.
          <HoverTooltip
            key={entrada.etiqueta}
            posicion="izquierda"
            contenido={<EtiquetaFlotante>{entrada.etiqueta}</EtiquetaFlotante>}
          >
            <button
              type="button"
              onClick={entrada.onClick}
              aria-label={entrada.etiqueta}
              // Lo que se realza al pasar por encima es **el icono**, no el hueco.
              // Con la maqueta de una pieza no se podía: el icono era parte del
              // fondo, así que se iluminaba el agujero y se leía como tal.
              className="group w-9 h-9 flex items-center justify-center rounded-sm transition-colors hover:bg-pergamino-100/10 active:bg-pergamino-100/20"
            >
              {/* ⚠️ `imagen-suave`, igual que los iconos de chakra y por el mismo
                  motivo: estos están dibujados con **más detalle del que cabe a 32 px**
                  (el torii son 51×62 celdas), así que aquí siempre se está REDUCIENDO,
                  y ahí el `image-rendering: pixelated` global tira píxeles a trozos y
                  deja el dibujo tosco. Se intentó lo contrario —bajar el sprite a una
                  rejilla de 32 para que fuera 1:1 con la pantalla— y salió peor: el
                  icono acababa con menos detalle que la hoja de la que sale, que es la
                  señal de que el recorte está mal hecho. Ver `index.css`. */}
              <img
                src={entrada.icono}
                alt=""
                aria-hidden="true"
                draggable="false"
                className="w-8 h-8 object-contain imagen-suave transition-transform duration-150 group-hover:scale-110"
              />
            </button>
          </HoverTooltip>
        ))}
      </nav>

      {confirmando && (
        <PanelAbandonarRun
          destino={confirmando}
          onCancelar={() => setConfirmando(null)}
          onConfirmar={() => {
            setConfirmando(null);
            if (confirmando === 'home') irAlHome();
            else reiniciarRun();
          }}
        />
      )}
    </>
  );
}

/**
 * "¿Seguro que quieres reiniciar la run?" con la ventana del juego.
 *
 * ⚠️ Antes esto era un `window.confirm`, o sea **el diálogo del navegador**:
 * tipografía del sistema, botones del sistema y cero relación con lo que hay
 * detrás. Era lo último que quedaba de interfaz de navegador en toda la partida, y
 * estaba justo en la acción más destructiva — donde peor sienta que el juego deje
 * de parecer un juego. Misma forma que `PanelReemplazoObjeto`: rojo de sello solo
 * en el botón que destruye.
 */
function PanelAbandonarRun({ destino, onCancelar, onConfirmar }) {
  const aHome = destino === 'home';
  return (
    <VentanaModal titulo={aHome ? 'Leave run' : 'Restart run'} onCerrar={onCancelar} ancho="max-w-sm">
      <div className="flex flex-col gap-4">
        <p className="text-[10px] text-pergamino-200 leading-relaxed">
          You will lose this team, your gold and everything in the bag
          {aHome ? ', and go back to the campaign list.' : ', and start again from the first floor.'}
        </p>
        <p className="text-[9px] text-pergamino-200/60 leading-relaxed border-t border-marco pt-3">
          Missions and the Bingo Book are kept: they belong to you, not to this run.
        </p>
        <div className="flex justify-end gap-2">
          <BotonSecundario onClick={onCancelar}>Cancel</BotonSecundario>
          <button
            type="button"
            onClick={onConfirmar}
            className="font-display text-[9px] px-3 py-2 rounded-sm bg-sello-600 text-sobre-sello hover:bg-sello-500 transition-colors"
          >
            {aHome ? 'Leave' : 'Restart'}
          </button>
        </div>
      </div>
    </VentanaModal>
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
  const buffsTemporales = useGameStore((s) => s.buffsTemporales);
  // Los mismos multiplicadores que usa `jugarCombate`, para que la ficha de personaje
  // enseñe el número que de verdad pelea y no uno parecido.
  const multiplicadoresBuffs = useMemo(
    () => (buffsTemporales.length > 0 ? combinarMultiplicadoresTemporales(buffsTemporales) : null),
    [buffsTemporales],
  );
  const desequiparObjeto = useGameStore((s) => s.desequiparObjeto);
  const equiparObjeto = useGameStore((s) => s.equiparObjeto);
  const usarConsumible = useGameStore((s) => s.usarConsumible);
  const abrirMochila = useGameStore((s) => s.abrirMochila);
  const abrirLogros = useGameStore((s) => s.abrirLogros);
  const abrirEnciclopedia = useGameStore((s) => s.abrirEnciclopedia);
  const abrirAjustes = useGameStore((s) => s.abrirAjustes);
  const reiniciarRun = useGameStore((s) => s.reiniciarRun);
  const irAlHome = useGameStore((s) => s.irAlHome);

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

  // ⚠️ Se mide la FILA entera y se descuentan los paneles, en vez de medir el hueco
  // que le sobra al mapa. Parece lo mismo y no lo es: mientras el mapa era el
  // `flex-1`, ocupaba **todo** el ancho sobrante y empujaba los dos paneles contra
  // los bordes de la pantalla, lejísimos del mapa. Ahora el mapa mide exactamente lo
  // que ocupa su dibujo (`ANCHO * escala`) y el `justify-center` de la fila junta los
  // tres en el medio, como en Pokelike.
  //
  // Medir la fila y no el hueco evita además el pez que se muerde la cola: si el
  // ancho del contenedor dependiera de la escala y la escala del ancho, el layout
  // podría oscilar. El ancho de la fila no depende de nada de esto.
  useLayoutEffect(() => {
    const fila = contenedorRef.current;
    if (!fila || !mapa) return undefined;

    function recalcular() {
      const { clientWidth, clientHeight } = fila;
      if (clientWidth === 0 || clientHeight === 0) return;
      const disponible = clientWidth - ANCHO_PANELES * 2 - SEPARACION_PANELES * 2;
      setEscala(Math.max(0.1, Math.min(disponible / ANCHO, clientHeight / alturaLienzo)));
    }

    recalcular();
    const observer = new ResizeObserver(recalcular);
    observer.observe(fila);
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
    // `py-2` y no `py-4`: son 16 px de alto que se le devuelven al mapa, y como la
    // escala la manda la altura, cada píxel de alto se convierte en columna más ancha.
    <div className="h-screen bg-transparent text-pergamino-100 font-body px-4 py-2 relative flex flex-col overflow-hidden">
      <MenuVertical
        abrirLogros={abrirLogros}
        abrirEnciclopedia={abrirEnciclopedia}
        abrirAjustes={abrirAjustes}
        reiniciarRun={reiniciarRun}
        irAlHome={irAlHome}
      />

      <header className="text-center mb-1 shrink-0">
        <p className="text-sello-500 text-[9px] tracking-[0.3em] uppercase">Current Arc</p>
        <h1 className="font-naruto text-2xl text-pergamino-100 tracking-wide">
          {arcoActualDatos?.nombre}
        </h1>
      </header>

      {/* Sin `max-w`: el ancho ya no importa, porque el mapa mide lo que mide su
          dibujo y `justify-center` junta los tres bloques. Los dos paneles laterales
          miden **lo mismo** (`ANCHO_PANELES`) a propósito: con 160 a un lado y 128 al
          otro, el centro del mapa quedaba 16 px a la derecha del centro de la
          pantalla y el título del arco —que va centrado en la pantalla— se veía
          descolocado respecto a la columna. */}
      <div ref={contenedorRef} className="flex-1 min-h-0 flex justify-center items-start gap-4 w-full">
        <PanelEquipo
          equipo={equipo}
          obtenerHpMaximo={obtenerHpMaximo}
          reordenarEquipo={reordenarEquipo}
          desequiparObjeto={desequiparObjeto}
          equiparObjeto={equiparObjeto}
          usarConsumible={usarConsumible}
          multiplicadoresBuffs={multiplicadoresBuffs}
        />

        {/* El contenedor de fuera solo mide el hueco disponible: no pinta nada.
            El marco (fondo + borde) va en el div ya escalado de dentro, para que
            abrace exactamente al mapa. Cuando el marco lo pintaba el contenedor,
            sobraban bandas negras a los lados — el lienzo casi nunca es tan ancho
            como el hueco, porque la escala la manda la altura. */}
        <div
          className="min-h-0 shrink-0 flex items-start justify-center"
          style={{ width: ANCHO * escala }}
        >
          <div
            // `escena-oscura` no pinta nada: le devuelve la paleta OSCURA a este
            // subárbol en modo claro (ver el bloque del mismo nombre en
            // `index.css`). La ilustración del fondo es un PNG que no cambia con el
            // tema, así que lo que va encima de ella tampoco puede cambiar.
            className="escena-oscura bg-tinta-950"
            style={{
              width: ANCHO * escala,
              height: alturaLienzo * escala,
              position: 'relative',
              zIndex: 1,
              // Sin redondeo: los paneles del kit son de esquina viva, y el lienzo
              // es la caja más grande de la pantalla — con 12 px de radio era el
              // único elemento redondeado y se leía como de otro juego.
              borderRadius: 0,
              // Marco por `box-shadow` y no por `border`: un borde real se comería
              // píxeles del ancho útil (box-sizing: border-box) y el lienzo escalado,
              // que mide exactamente ANCHO*escala, se saldría por los lados. Dos
              // anillos para imitar el borde del kit: el fino en color de marco y el
              // grueso oscuro por fuera, que lo separa del fondo del juego.
              boxShadow: '0 0 0 1px var(--color-marco), 0 0 0 5px var(--color-tinta-950)',
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
            {fondoColumna && <div className="absolute inset-0 bg-tinta-950/15" />}

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

            {/* El adorno del kit —línea interior y esquinas en corchete— compuesto a
                mano porque este lienzo no puede ser un `PanelMarco`: su marco es un
                `box-shadow` (ver arriba). Va DESPUÉS del contenido para pintarse por
                encima de los nodos, y sus piezas llevan `pointer-events-none` para no
                robarles el clic.

                Va DENTRO de esta caja y no como hermana suya, que es donde estaba:
                sus piezas son `absolute` y el contenedor de fuera no es `relative`, así
                que se anclaban al div raíz de la pantalla y los cuatro corchetes se
                pintaban en las esquinas de la PANTALLA. Aquí sí abrazan al mapa —que es
                lo que el comentario decía desde el principio— y quedan además dentro
                del subárbol de paleta oscura. Fuera del `transform` del div escalado, a
                propósito: los corchetes se pintan en tamaño real. */}
            <AdornoMarco />
          </div>
        </div>

        {/* Columna derecha: mochila arriba, chuleta de chakra debajo. Los dos
            son consulta rápida (qué llevo / qué le gana a qué), frente a la
            columna izquierda, que es la que se toca para jugar. */}
        {/* `w-40` como el panel de equipo: los dos laterales tienen que medir lo
            mismo o el mapa no queda centrado (ver `ANCHO_PANELES`). */}
        <div className="w-40 shrink-0 flex flex-col gap-4">
          {/* Encima de la mochila y no debajo: cuando hay un buff activo es lo más
              perecedero que hay en pantalla —se gasta solo, combate a combate— y es lo
              que puede cambiar a qué nodo vas ahora mismo. */}
          <PanelBuffs buffsTemporales={buffsTemporales} />
          <PanelObjetos inventario={inventario} oro={oro} abrirMochila={abrirMochila} />
          <RuedaChakra />
        </div>
      </div>
    </div>
  );
}
