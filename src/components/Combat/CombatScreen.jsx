import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { crearLuchador } from '../../engine/combat';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { nombrePersonaje, emojiDeTipo, nombreObjeto } from '../common/nombres';
import { nombrePasiva, duenoDePasiva, describirPasiva } from '../../engine/passives';
import { spriteDeCombate, pasivasDeLuchador, nombreDeModo } from '../common/datosDeLuchador';
import HoverTooltip from '../common/HoverTooltip';
import { spriteDeProyectil } from '../common/projectileSprites';
import TransformationScreen from './TransformationScreen';
import { SPRITE_OBJETO } from '../Inventory/itemSprites';
import { PanelMarco, TituloBloque, IconoEnmarcado, BotonPrincipal } from '../common/PiezasUI';

// El replay avanza de GOLPE en golpe, no de turno en turno. Un turno trae 2-4
// eventos (los dos luchadores, más algún ataque extra) y resolverlos todos de
// una vez hacía imposible animarlos: la barra bajaba dos veces a la vez y no se
// sabía quién había pegado. Cada golpe tiene dos tiempos: el proyectil vuela y
// luego impacta, y el daño se aplica en el impacto, no al empezar.
//
// Los tiempos NO son constantes: con todos los golpes durando lo mismo el
// combate sonaba a metrónomo. Un jutsu vuela más lento y se le deja aire antes y
// después; los básicos se encadenan rápido. Así la pelea tiene frases en vez de
// pulsos, y el golpe gordo se nota que es el golpe gordo.
const MS_VUELO_BASICO = 320;
const MS_VUELO_JUTSU = 560;
const MS_ENTRE_BASICOS = 200;
const MS_TRAS_JUTSU = 520;
const MS_ANTES_DE_JUTSU = 620;

const esJutsu = (golpe) => golpe?.tipoAtaque === 'jutsu';
const msDeVuelo = (golpe) => (esJutsu(golpe) ? MS_VUELO_JUTSU : MS_VUELO_BASICO);

/** La pausa tras un golpe: manda la anticipación del siguiente sobre el eco del anterior. */
function msEntreGolpes(golpeQueAcaba, golpeSiguiente) {
  if (esJutsu(golpeSiguiente)) return MS_ANTES_DE_JUTSU;
  if (esJutsu(golpeQueAcaba)) return MS_TRAS_JUTSU;
  return MS_ENTRE_BASICOS;
}
const PAUSA_ENTRE_RONDAS_MS = 1400;
// Lo que se deja ver la subida de nivel antes de tapar la pantalla con la
// transformación. Sin esta espera, el overlay salía encima del cartel y el
// jugador no llegaba a ver que había subido — que es lo que la explica.
const MS_CELEBRAR_NIVEL = 1500;

// Verde / oro / rojo son SEMÁNTICOS aquí: dicen cuánta vida queda, no de qué
// naturaleza es el luchador. Ojo, `colorDelDano` de más abajo es lo contrario —
// ahí los colores de elemento son una escala de calor a propósito.
function colorBarraHp(porcentaje) {
  if (porcentaje > 0.5) return 'bg-exito';
  if (porcentaje > 0.2) return 'bg-oro';
  return 'bg-sello-500';
}

/**
 * Estado de cada miembro del equipo en el momento del combate que se está
 * reproduciendo. Se reconstruye, no se lee del store: `jugarCombate` ya ha
 * aplicado victoria o derrota antes de que la animación empiece, así que
 * `equipo` contiene el estado FINAL y pintarlo destriparía quién cae.
 *
 * Tres casos, por orden: el que pelea esta ronda (HP en vivo del replay), el
 * que peleó una ronda anterior (cayó, por eso entró el siguiente) y el que
 * todavía no ha entrado (intacto desde la foto de antes del combate).
 */
function estadoDelEquipo(resultado, indiceRonda, hpJugadorEnVivo) {
  return (resultado.equipoAlEmpezar ?? []).map((miembro) => {
    // Quién pelea AHORA se mira contra la ronda en curso, no buscando su primera
    // ronda con `findIndex`: un personaje puede pelear dos rondas del mismo
    // combate si revive con la Spare Ninja Headband, y con `findIndex` la segunda
    // vez seguía apuntando a la primera — su tarjeta salía muerta mientras él
    // estaba peleando. Se leía como que el objeto no había funcionado.
    const ronda = resultado.rondas[indiceRonda];
    if (ronda?.jugador.id === miembro.id) {
      return {
        ...miembro,
        hpActual: hpJugadorEnVivo,
        hpMaximo: ronda.jugador.hpMaximo, // el del luchador: incluye buffs temporales
        derrotado: hpJugadorEnVivo <= 0,
        peleando: true,
      };
    }
    const peleoAntes = resultado.rondas
      .slice(0, indiceRonda)
      .some((r) => r.jugador.id === miembro.id);
    if (peleoAntes) {
      return { ...miembro, hpActual: 0, derrotado: true, peleando: false };
    }
    return { ...miembro, peleando: false };
  });
}

/**
 * Los enemigos del nodo y en qué estado está cada uno, para pintarlos igual que
 * al equipo. Un nodo de entrenador encadena varios combates (N genins y luego el
 * nombrado), y hasta ahora el panel enemigo enseñaba solo al de turno con un
 * "Battle 1/3" encima: el jugador no sabía a qué se enfrentaba ni cuánto le
 * quedaba. Con la cadena entera a la vista, ese texto sobra.
 *
 * Los ya derrotados se quedan en la lista, apagados. Es información: dice cuánto
 * llevas del nodo.
 */
function estadoDeLosEnemigos(cadenaEnemigos, ronda, hpEnemigoEnVivo) {
  const actual = {
    id: ronda.enemigo.id,
    nombre: nombrePersonaje(ronda.enemigo.id),
    nivel: ronda.enemigo.nivel,
    hpActual: hpEnemigoEnVivo,
    hpMaximo: ronda.enemigo.hpMaximo,
    estado: hpEnemigoEnVivo <= 0 ? 'caido' : 'activo',
    modoActivoNombre: ronda.enemigo.modoActivoNombre,
  };
  if (!cadenaEnemigos) return [actual];

  return cadenaEnemigos.enemigos.map((eslabon, i) => {
    if (i === cadenaEnemigos.indiceActual) return actual;
    const luchador = crearLuchador(eslabon.enemigoBase, eslabon.nivel);
    const yaCayo = i < cadenaEnemigos.indiceActual;
    return {
      id: eslabon.enemigoBase.id,
      nombre: nombrePersonaje(eslabon.enemigoBase.id),
      nivel: eslabon.nivel,
      hpActual: yaCayo ? 0 : luchador.hpMaximo,
      hpMaximo: luchador.hpMaximo,
      estado: yaCayo ? 'caido' : 'espera',
      modoActivoNombre: luchador.modoActivo?.nombre ?? null,
    };
  });
}

/**
 * Las pasivas que han saltado en el último golpe impactado, repartidas por
 * luchador. Sin esto el sistema entero de pasivas es invisible: un golpe que
 * hace 0 o un atacante que de pronto sube de HP se veían como números raros
 * sin explicación.
 *
 * Va por golpe y no por turno para que la etiqueta salga a la vez que el
 * impacto que la provocó: un turno trae 2-4 golpes y enseñarlas todas juntas
 * al final del turno no dejaba ver de cuál venía cada una.
 *
 * Ojo: `pasivasActivadas` NO lo trae todo. `priority` y `repeat_basic_chance`
 * se consultan fuera del contexto del golpe (en `determinarOrden` y en el
 * bucle de ataques extra), así que nunca aparecen aquí — el ataque extra se
 * enseña con la marca `esAtaqueExtra` del propio evento.
 */
function pasivasDelUltimoGolpe(ronda, golpe) {
  const porLado = { jugador: [], enemigo: [] };
  if (!golpe) return porLado;

  const ladoAtacante = golpe.atacanteId === ronda.jugador.id ? 'jugador' : 'enemigo';
  const ladoDefensor = ladoAtacante === 'jugador' ? 'enemigo' : 'jugador';
  // Devuelve **ids**, no nombres. Devolvía nombres y quien los recibe
  // (`EtiquetasPasivas`) comparaba contra `pasiva.id`, así que no coincidía nunca
  // y la pastilla no se encendía jamás: la fase de "pasivas visibles" estaba
  // pintando la lista pero no el momento en que una hace algo.
  for (const id of golpe.pasivasActivadas ?? []) {
    const lado = duenoDePasiva(id) === 'defensor' ? ladoDefensor : ladoAtacante;
    if (!porLado[lado].includes(id)) porLado[lado].push(id);
  }
  return porLado;
}

/**
 * El golpe en el aire: el jutsu propio del atacante si lo tiene dibujado (el
 * Rasengan, la Gran Bola de Fuego...) y si no el kunai, que es el ataque básico
 * de todos. Quien no tenga jutsu dibujado lanza kunai también en su jutsu — se
 * distingue igual por tamaño y halo.
 *
 * **Sale del centro del que lanza y llega al centro del que recibe.** Esas dos
 * posiciones no se pueden escribir en el CSS: la tarjeta activa del equipo puede
 * ser la primera, la segunda o la tercera, así que su altura cambia de una ronda
 * a otra. Se miden aquí con `getBoundingClientRect` y se inyectan como variables
 * CSS **antes del primer pintado** (`useLayoutEffect`), que es lo que evita que
 * se vea un fotograma en la posición equivocada. No pasan por estado de React a
 * propósito: sería un render de más por cada golpe y no lo necesita nadie más.
 *
 * El jutsu **no rota** mientras vuela: un Rasengan dando vueltas de campana se
 * lee como un error, mientras que un kunai girando es justo lo que se espera.
 *
 * El `key` con el número de golpe es lo que hace que la animación se reinicie:
 * React remonta el elemento y el CSS vuelve a empezar. Con una clase que se
 * quita y se pone, el segundo golpe no animaría.
 */
function Proyectil({ atacanteId, hacia, esJutsu: esJutsuEsteGolpe, refContenedor, refOrigen, refDestino }) {
  const nodo = useRef(null);

  useLayoutEffect(() => {
    const contenedor = refContenedor.current;
    const origen = refOrigen.current;
    const destino = refDestino.current;
    if (!nodo.current || !contenedor || !origen || !destino) return;

    const caja = contenedor.getBoundingClientRect();
    const centro = (elemento) => {
      const r = elemento.getBoundingClientRect();
      return {
        x: r.left - caja.left + r.width / 2,
        y: r.top - caja.top + r.height / 2,
      };
    };
    const desde = centro(origen);
    const hasta = centro(destino);

    // El proyectil mide ~28-48 px y se coloca por su esquina, así que hay que
    // restarle la mitad para que sea su centro el que viaje entre los dos.
    const mitad = nodo.current.offsetWidth / 2;
    nodo.current.style.setProperty('--desde-x', `${desde.x - mitad}px`);
    nodo.current.style.setProperty('--desde-y', `${desde.y - mitad}px`);
    nodo.current.style.setProperty('--hasta-x', `${hasta.x - mitad}px`);
    nodo.current.style.setProperty('--hasta-y', `${hasta.y - mitad}px`);
    nodo.current.style.setProperty('--giro', esJutsuEsteGolpe ? '0deg' : hacia === 'derecha' ? '540deg' : '-540deg');
    // La duración manda desde JS: el reloj del replay la varía por tipo de golpe
    // y si el CSS se quedara con la suya, el impacto y la llegada se separarían.
    nodo.current.style.animationDuration = `${msDeVuelo({ tipoAtaque: esJutsuEsteGolpe ? 'jutsu' : 'basico' })}ms`;
  }, [refContenedor, refOrigen, refDestino, esJutsuEsteGolpe, hacia]);

  return (
    <div ref={nodo} aria-hidden="true" className="proyectil z-10 pointer-events-none">
      <img
        src={spriteDeProyectil(atacanteId, esJutsuEsteGolpe)}
        alt=""
        className={[
          esJutsuEsteGolpe ? 'w-12 h-12 drop-shadow-[0_0_10px_rgba(233,178,58,0.75)]' : 'w-7 h-7',
          'object-contain',
          // Solo el jutsu se voltea: como no gira, si no miraría hacia atrás al
          // volar hacia la izquierda. El kunai da vueltas y da igual.
          esJutsuEsteGolpe && hacia === 'izquierda' ? '-scale-x-100' : '',
        ].join(' ')}
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

/**
 * El daño del último golpe, flotando sobre quien lo ha recibido. Es lo que hace
 * que la animación se entienda sin leer el registro: sin el número, un kunai que
 * cruza la pantalla no dice cuánto ha dolido.
 *
 * Se coloca midiendo la tarjeta del objetivo, por el mismo motivo que el
 * proyectil: la tarjeta que recibe puede estar a tres alturas distintas según
 * quién esté peleando, y con una posición fija el número salía sobre el
 * personaje equivocado.
 *
 * Un golpe de 0 se enseña igual, con otro texto: es justo el caso en el que el
 * jugador necesita una explicación (lo ha parado una pasiva), no menos.
 */
/**
 * Color del número según lo que la tabla de tipos ha hecho con el golpe: verde
 * flojo, amarillo normal, rojo fuerte. Es una escala de calor, no un semáforo —
 * habla de cuánto ha dolido, no de si es bueno o malo, porque el mismo número
 * sale sobre tu personaje y sobre el enemigo.
 *
 * El azul de `Blocked` se queda aparte a propósito: un golpe anulado por una
 * pasiva no es "poco efectivo", es otra cosa, y mezclarlo en la escala lo haría
 * pasar por un golpe flojo.
 */
function colorDelDano(dano, eficacia) {
  if (dano === 0) return 'text-suiton';
  if (eficacia > 1) return 'text-katon';
  if (eficacia < 1) return 'text-fuuton';
  return 'text-raiton';
}

/**
 * Un número que sale flotando sobre la tarjeta de un luchador. La posición se
 * mide, no se escribe: la tarjeta puede estar a tres alturas distintas según
 * quién esté peleando, y con una fija el número salía sobre el personaje
 * equivocado.
 */
function NumeroFlotante({ refContenedor, refObjetivo, className, children }) {
  const nodo = useRef(null);

  useLayoutEffect(() => {
    const contenedor = refContenedor.current;
    const objetivo = refObjetivo.current;
    if (!nodo.current || !contenedor || !objetivo) return;
    const caja = contenedor.getBoundingClientRect();
    const r = objetivo.getBoundingClientRect();
    nodo.current.style.left = `${r.left - caja.left + r.width / 2}px`;
    nodo.current.style.top = `${r.top - caja.top + r.height * 0.35}px`;
  }, [refContenedor, refObjetivo]);

  return (
    <div ref={nodo} aria-hidden="true" className="absolute z-20 pointer-events-none dano-flotante">
      <span className={`drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${className}`}>{children}</span>
    </div>
  );
}

function DanoFlotante({ dano, eficacia, esJutsu, refContenedor, refObjetivo }) {
  return (
    // El jutsu ya no se distingue por color —el color lo ha ocupado la eficacia—
    // sino por tamaño, que además pega más con "ha sido un golpe gordo".
    //
    // Fuente 2p (`font-display`) y no la de Naruto: esa se reserva para
    // titulares —"Victory", el nombre del arco—, y estos números son anotaciones
    // sobre el sprite. Un tamaño menos, porque la pixel art llena más caja.
    <NumeroFlotante
      refContenedor={refContenedor}
      refObjetivo={refObjetivo}
      className={`font-display ${esJutsu ? 'text-2xl' : 'text-xl'} ${colorDelDano(dano, eficacia)}`}
    >
      {dano === 0 ? 'Blocked' : `-${dano}`}
    </NumeroFlotante>
  );
}

/**
 * La vida que un luchador acaba de recuperar DENTRO del combate. Hoy solo pasa
 * por `heal_on_kill` (curarse al rematar), que es una pasiva de transformación o
 * de objeto.
 *
 * Va en verde y en la tipografía de la interfaz, no en la de los daños: es otra
 * cosa que un golpe y tiene que leerse distinto de un vistazo. La curación por
 * subir de nivel NO sale aquí — esa ocurre después del combate y ya la cuenta el
 * cartel de "Lv. N!".
 */
function CuracionFlotante({ cantidad, refContenedor, refObjetivo }) {
  return (
    <NumeroFlotante
      refContenedor={refContenedor}
      refObjetivo={refObjetivo}
      className="font-display text-lg text-exito"
    >
      +{cantidad}
    </NumeroFlotante>
  );
}

/**
 * Las pasivas que lleva el luchador —de su transformación y de su objeto—, con
 * la que acaba de dispararse encendida.
 *
 * Se enseñan SIEMPRE, no solo cuando saltan: enseñando solo las que saltaban, la
 * fila aparecía y desaparecía en cada golpe y no daba tiempo a leer qué tenía tu
 * personaje. Lo que se conserva de aquello es el resalte, que sigue contando
 * *cuándo* ha hecho algo — sin eso el sistema entero volvía a ser invisible.
 */
function EtiquetasPasivas({ pasivas, activadas }) {
  if (pasivas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {pasivas.map((pasiva) => {
        const salta = activadas.includes(pasiva.id);
        return (
          <HoverTooltip
            key={pasiva.id}
            posicion="arriba"
            contenido={(
              <div className="w-48 bg-pergamino-100 text-tinta-950 rounded-md border-2 border-tinta-950 shadow-xl px-2 py-1.5">
                <p className="font-display text-[10px] uppercase tracking-wide">{nombrePasiva(pasiva.id)}</p>
                <p className="text-[10px] leading-snug mt-0.5">{describirPasiva(pasiva)}</p>
              </div>
            )}
          >
            <span className={[
              'block text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded-full border transition-all',
              salta
                ? 'bg-oro text-tinta-950 border-oro scale-105 shadow-[0_0_10px_rgba(212,169,58,0.8)]'
                : 'bg-oro/15 text-oro border-oro/40',
            ].join(' ')}
            >
              {nombrePasiva(pasiva.id)}
            </span>
          </HoverTooltip>
        );
      })}
    </div>
  );
}

/**
 * Un luchador dentro del panel de su bando: nombre, nivel, barra de HP con
 * números, sprite sobre su plataforma y —solo el que está peleando— la barra de
 * jutsu y las pasivas que le acaban de saltar.
 *
 * La misma tarjeta vale para los tres del equipo y para el enemigo. Antes había
 * dos componentes distintos (una barra grande para el duelo y una tarjeta chica
 * para el banquillo) y eso obligaba a mantener el mismo diseño por duplicado.
 *
 * Tres estados, bien separados: el que pelea (borde encendido y halo), el que
 * espera (normal) y el caído (`opacity`, nunca filtros — con `grayscale` la
 * tarjeta se quedaba casi negra, el mismo error que ya se corrigió en el mapa).
 */
function TarjetaLuchador({
  id, nombre, nivel, hpActual, hpMaximo, carga, cargaMaxima,
  modoActivoNombre, estado, objetoEquipadoId = null, pasivasActivadas = [], subioANivel = null,
  cayendoAhora = false,
}) {
  const porcentaje = hpMaximo > 0 ? Math.max(0, hpActual / hpMaximo) : 0;
  const porcentajeCarga = cargaMaxima ? Math.min(1, Math.max(0, carga / cargaMaxima)) : 0;

  const jutsuListo = porcentajeCarga >= 1;
  const activo = estado === 'activo';
  const sprite = spriteDeCombate(id, nivel);
  const pasivasPropias = pasivasDeLuchador(id, nivel, objetoEquipadoId);

  const estilo = estado === 'caido'
    ? 'border-marco/60 opacity-40'
    : activo
      ? 'border-sello-500 shadow-[0_0_18px_rgba(201,74,60,0.5)]'
      : 'border-marco opacity-80';

  // Sin `PersonajeHoverCard`: en combate la tarjeta ya enseña nombre, nivel, HP,
  // tipo, transformación y pasivas, así que el hover solo repetía lo mismo en una
  // ventana encima. El hover sigue donde sí aporta — mapa, tienda, reclutar.
  // **Sin esquinas en corchete** (`esquinas={false}`), y es la decisión que evita
  // que esta pantalla se vea abarrotada: hasta cuatro tarjetas viven DENTRO de las
  // dos cajas de bando, que sí las llevan. Corchetes dentro de corchetes es
  // exactamente lo que convierte un marco bonito en ruido — los lleva el
  // contenedor, lo anidado se queda con el borde fino. Ver
  // documentacion/33-direccion-visual.md.
  return (
    <PanelMarco
      esquinas={false}
      className={[
        'relative px-3 pt-2 pb-1 transition-all',
        estilo,
        subioANivel ? 'halo-subida-nivel' : '',
      ].join(' ')}
    >
      {/* El cartel va sobre el sprite y no en una esquina: es donde el jugador
          está mirando cuando acaba el combate. */}
      {subioANivel && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/3 z-20 font-display text-base text-oro drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] cartel-subida-nivel whitespace-nowrap"
        >
          Lv. {subioANivel}!
        </span>
      )}
        {/* El icono de la naturaleza de chakra va junto al nombre, igual que en
            la tarjeta de hover: el tipo decide el daño y tiene que poder leerse
            sin abrir nada. Antes esto era un halo de color bajo los pies, pero
            competía con el resto del suelo y no se sabía qué significaba. */}
        {/* El nivel del título es el de ANTES del combate: la tarjeta se pinta
            con la foto del equipo previa. Si ha subido, se enseña ya el nuevo con
            su marca — el sprite y las pasivas siguen calculándose con el viejo, a
            propósito, para no destripar la transformación que viene detrás. */}
        <p className="font-display text-sm text-center text-pergamino-100 truncate">
          {emojiDeTipo(id)} {nombre}{' '}
          {subioANivel ? (
            <span className="text-oro">Lv.{subioANivel} ▲</span>
          ) : (
            <span className="text-pergamino-200/60">Lv.{nivel}</span>
          )}
        </p>
        {modoActivoNombre && (
          <p className="text-[10px] text-center text-sello-500 uppercase tracking-wide truncate">
            {modoActivoNombre}
          </p>
        )}

        {/* Dos barras con el MISMO porcentaje: la pálida de detrás va lenta y con
            retraso, así que el hueco entre las dos es el mordisco del último
            golpe. Ver `.estela-hp` en index.css. */}
        <div className="relative h-3 w-full bg-tinta-800 rounded-sm overflow-hidden mt-1 border border-tinta-950">
          <div
            className="absolute inset-y-0 left-0 bg-pergamino-100/45 estela-hp"
            style={{ width: `${porcentaje * 100}%` }}
          />
          <div
            className={`absolute inset-y-0 left-0 ${colorBarraHp(porcentaje)} transition-all duration-150`}
            style={{ width: `${porcentaje * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-pergamino-200/50 mt-0.5">{Math.max(0, hpActual)} / {hpMaximo}</p>

        {/* Aquí hubo una barra de XP y se quitó a propósito: con la economía de
            XP actual **casi cada combate sube un nivel**, así que la barra estaba
            siempre a punto de llenarse y no contaba nada que el cartel de subida
            de nivel no cuente mejor. La progresión de este juego se lee en el
            número de nivel, no en el trayecto hasta el siguiente. */}

        {/* Todas las tarjetas miden lo mismo: el que pelea se distingue por el
            borde encendido y el halo, no por ser más grande. Se probó a pintarlo
            al doble y las cajas dejaban de cuadrar entre sí.

            El sprite va a un múltiplo ENTERO de su lienzo (96 px), aquí ×1. El
            pixel art solo se ve limpio así: antes los lienzos iban de 70 a 94 px
            y se pintaban todos a 80, o sea factores como ×1,07 donde unas
            columnas de píxeles se duplican y otras no — se veía sucio por mucho
            que se agrandara.

            Debajo, el suelo en dos capas: el disco de pergamino (el "claro de
            tierra" tipo Pokelike) y la sombra de contacto encima, para que el
            personaje se apoye en algo en vez de flotar suelto. */}
        <div className="relative h-24 flex items-end justify-center">
          <div className="absolute bottom-1 w-20 h-5 rounded-[50%] bg-pergamino-200/25 border border-pergamino-100/15" />
          <div className="absolute bottom-1.5 w-12 h-2 rounded-[50%] bg-tinta-950/55 blur-[2px]" />
          {sprite && (
            <img
              src={sprite}
              alt=""
              aria-hidden="true"
              className={[
                'relative w-24 h-24 object-contain',
                activo ? '' : 'saturate-75',
                // Solo se desploma el que cae PELEANDO, no todo el que esté
                // caído: al cambiar de ronda se remontan las tres tarjetas, y
                // con `estado === 'caido'` los que ya habían caído repetían su
                // animación cada vez que entraba el relevo.
                cayendoAhora ? 'caida-ko' : '',
                // Solo avisa quien PUEDE lanzarlo ya: en el banquillo la barra ni
                // se carga, y en un caído sería absurdo.
                activo && jutsuListo ? 'telegrafia-jutsu' : '',
              ].join(' ')}
              style={{ imageRendering: 'pixelated' }}
            />
          )}
        </div>

        {/* Barra de chakra solo en quien pelea: en el banquillo no se carga, y
            enseñarla vacía en las tres tarjetas era ruido. Va en tonos de agua y
            sin rótulo — el color ya la separa de la de HP, y el pulso al llenarse
            dice "lista" sin escribirlo (ver documentacion/29). */}
        {activo && cargaMaxima > 0 && (
          <div className="h-1.5 w-full bg-tinta-800 rounded-full overflow-hidden border border-pergamino-100/10">
            <div
              className={`h-full transition-all duration-300 ${jutsuListo ? 'bg-fuuton animate-pulse' : 'bg-suiton'}`}
              style={{ width: `${porcentajeCarga * 100}%` }}
            />
          </div>
        )}

        <EtiquetasPasivas pasivas={pasivasPropias} activadas={pasivasActivadas} />
    </PanelMarco>
  );
}

/**
 * Lo que te llevas por ganar el combate: el oro y —si lo hay— el objeto.
 *
 * Existe porque el cierre del combate era un "Victory" de texto y un botón: el
 * oro cambiaba en un panel de otra pantalla y el objeto aparecía en la mochila
 * sin que nadie lo dijera. Ganar no se celebraba en ningún sitio.
 *
 * **La XP no está aquí a propósito.** Casi cada combate sube un nivel, así que
 * el número exacto de XP no cambia ninguna decisión y el cartel de subida de
 * nivel ya cuenta lo que importa.
 *
 * El objeto solo sale cuando ha entrado DE VERDAD en la mochila: el del mini-jefe
 * tiene su propia pantalla de recogida, y prometerlo aquí además sería contarlo
 * dos veces.
 *
 * ⚠️ Era un `inline-flex`, y como el botón de "Continue" también es inline acababan
 * los dos **en la misma línea**: la recompensa parecía otro botón puesto al lado
 * del botón. Ahora es un panel de bloque centrado, y el bloque de cierre entero es
 * una columna con separación propia — nada depende del flujo inline.
 *
 * En una cadena de entrenador **solo se pinta al terminarla**, con el total que
 * acumula el store en `cadenaEnemigos`.
 */
function PanelRecompensas({ recompensas }) {
  if (!recompensas) return null;
  const { oro, objetos = [] } = recompensas;

  return (
    <PanelMarco className="mx-auto w-fit min-w-[13rem] px-5 py-3 flex flex-col gap-2.5">
      <TituloBloque className="text-center">Rewards</TituloBloque>
      <div className="flex items-center gap-3">
        <IconoEnmarcado tamano="w-10 h-10" colorMarco="border-oro/50" vacio="🪙" />
        <span className="font-display text-xs text-oro">+{oro} Gold</span>
      </div>
      {objetos.map((objeto) => (
        <div key={objeto} className="flex items-center gap-3">
          <IconoEnmarcado
            src={SPRITE_OBJETO[objeto]}
            tamano="w-10 h-10"
            colorMarco="border-oro/50"
            vacio="📦"
          />
          <span className="font-display text-[10px] text-pergamino-100 text-left leading-tight">
            {nombreObjeto(objeto)}
          </span>
        </div>
      ))}
    </PanelMarco>
  );
}

/** La caja de un bando, con su rótulo y sus luchadores apilados. */
function PanelBando({ titulo, children }) {
  return (
    // El contenedor SÍ lleva las esquinas en corchete: es la caja, y dentro van las
    // tarjetas de luchador con el borde fino.
    <PanelMarco className="flex-1 min-w-0 p-3 flex flex-col">
      <TituloBloque className="mb-2">{titulo}</TituloBloque>
      {/* El contenido se centra en vertical para que las dos cajas, que tienen
          distinto número de tarjetas, dejen a los luchadores activos más o menos
          a la misma altura: es por donde cruza el proyectil. */}
      <div className="flex-1 flex flex-col justify-center gap-2">{children}</div>
    </PanelMarco>
  );
}

export default function CombatScreen() {
  const resultado = useGameStore((s) => s.ultimoResultadoCombate);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const irAGameOver = useGameStore((s) => s.irAGameOver);
  const avanzarSiguienteArco = useGameStore((s) => s.avanzarSiguienteArco);
  const irARecompensaMiniJefe = useGameStore((s) => s.irARecompensaMiniJefe);
  const recompensaMiniJefe = useGameStore((s) => s.recompensaMiniJefe);
  const desafioRecluta = useGameStore((s) => s.desafioRecluta);
  const irAReclutaDesafio = useGameStore((s) => s.irAReclutaDesafio);
  const cadenaEnemigos = useGameStore((s) => s.cadenaEnemigos);
  const continuarCadena = useGameStore((s) => s.continuarCadena);
  const runTerminada = useGameStore((s) => s.runTerminada);
  const runGanada = useGameStore((s) => s.runGanada);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);
  const notificarLogros = useAchievementsStore((s) => s.notificar);

  const [indiceRonda, setIndiceRonda] = useState(0);
  // Golpes ya EMPEZADOS (el último puede estar todavía en el aire) y si ese
  // último ya ha impactado. El daño solo cuenta cuando `impactado` es true, que
  // es lo que hace que la barra de HP baje al llegar el kunai y no al lanzarlo.
  const [golpesEmpezados, setGolpesEmpezados] = useState(0);
  const [impactado, setImpactado] = useState(true);
  const [resultadoPrevio, setResultadoPrevio] = useState(resultado);
  // Cuántas transformaciones de este combate ha visto ya el jugador. Se guarda el
  // CONTADOR y la cola se deriva en el render, en vez de copiar la lista a un
  // estado: copiarla obligaba a sembrarla desde un efecto, y hacer `setState`
  // síncrono dentro de un efecto es justo el patrón que ya nos mordió una vez
  // (ver el comentario del reset de abajo y CLAUDE.md).
  const [transformacionesVistas, setTransformacionesVistas] = useState(0);
  const [nivelYaCelebrado, setNivelYaCelebrado] = useState(false);
  const finDelRegistro = useRef(null);
  // Cajas de las que el proyectil necesita saber el centro: el contenedor de los
  // dos bandos y las dos tarjetas que están peleando.
  const refContenedor = useRef(null);
  const refTarjetaJugador = useRef(null);
  const refTarjetaEnemigo = useRef(null);

  if (resultado !== resultadoPrevio) {
    setResultadoPrevio(resultado);
    setIndiceRonda(0);
    setGolpesEmpezados(0);
    setImpactado(true);
    setTransformacionesVistas(0);
    setNivelYaCelebrado(false);
  }

  const ronda = resultado?.rondas[indiceRonda] ?? null;
  // Los eventos de la ronda en una sola lista: es la unidad del replay.
  const golpes = useMemo(() => (ronda ? ronda.historial.flatMap((t) => t.eventos) : []), [ronda]);
  const golpesAplicados = impactado ? golpesEmpezados : golpesEmpezados - 1;
  const rondaCompleta = ronda ? golpesEmpezados >= golpes.length && impactado : false;
  const hayMasRondas = resultado ? indiceRonda < resultado.rondas.length - 1 : false;
  const transicionRonda = rondaCompleta && ronda && !ronda.jugadorGano && hayMasRondas;

  // Lanza el siguiente golpe, una vez el anterior ha impactado.
  useEffect(() => {
    if (!ronda || rondaCompleta || !impactado) return undefined;
    const espera = msEntreGolpes(golpes[golpesEmpezados - 1], golpes[golpesEmpezados]);
    const temporizador = setTimeout(() => {
      setGolpesEmpezados((n) => n + 1);
      setImpactado(false);
    }, espera);
    return () => clearTimeout(temporizador);
  }, [ronda, rondaCompleta, impactado, golpesEmpezados, golpes]);

  // El proyectil llega: aquí es donde el golpe cuenta.
  useEffect(() => {
    if (!ronda || impactado) return undefined;
    const temporizador = setTimeout(() => setImpactado(true), msDeVuelo(golpes[golpesEmpezados - 1]));
    return () => clearTimeout(temporizador);
  }, [ronda, impactado, golpesEmpezados, golpes]);

  // Lleva el registro de desarrollo a su última línea. En el build de producción
  // ese bloque no existe (`import.meta.env.DEV`), así que la ref queda a null y
  // el `?.` se encarga.
  useEffect(() => {
    finDelRegistro.current?.scrollIntoView({ block: 'end' });
  }, [golpesAplicados, indiceRonda]);

  useEffect(() => {
    if (!transicionRonda) return undefined;
    const temporizador = setTimeout(() => {
      setIndiceRonda((i) => i + 1);
      setGolpesEmpezados(0);
      setImpactado(true);
    }, PAUSA_ENTRE_RONDAS_MS);
    return () => clearTimeout(temporizador);
  }, [transicionRonda]);

  // Reproduce los golpes ya impactados para saber cómo estaban HP y barra de
  // jutsu en ese momento.
  //
  // Nada se reconstruye con aritmética: el HP de los dos y la carga de los dos
  // vienen ya resueltos en cada evento. Con la carga es obligatorio (lanzar el
  // jutsu la pone a cero, no se puede sumar incrementos) y con el HP también en
  // cuanto algo cura a mitad de combate — hoy `heal_on_kill`, mañana un jutsu con
  // robo de vida o una pasiva que cure al recibir. Restar daño ya falló una vez.
  const estadoEnTurnoActual = useMemo(() => {
    if (!ronda) return null;
    let hpJugador = ronda.jugador.hpInicial;
    let hpEnemigo = ronda.enemigo.hpInicial;
    let cargaJugador = ronda.jugador.cargaInicial ?? 0;
    let cargaEnemigo = ronda.enemigo.cargaInicial ?? 0;

    // Curación del ÚLTIMO golpe aplicado, para el número flotante. Se saca aquí
    // porque hace falta el HP de cada uno justo ANTES de ese golpe, y eso solo lo
    // sabe quien está reproduciendo el historial. Mira la DIFERENCIA de HP, no el
    // mecanismo, así que sirve para cualquier cosa que cure dentro del combate.
    let curacion = null;
    const aplicados = golpes.slice(0, Math.max(0, golpesAplicados));

    aplicados.forEach((evento, indice) => {
      const esElUltimo = indice === aplicados.length - 1;
      const anotar = (lado, hpAntes, hpDespues) => {
        if (hpDespues == null) return;
        const recuperado = hpDespues - hpAntes;
        if (esElUltimo && recuperado > 0) curacion = { lado, cantidad: recuperado };
      };

      const jugadorAtaca = evento.atacanteId === ronda.jugador.id;
      const [hpAtacanteAntes, hpDefensorAntes] = jugadorAtaca
        ? [hpJugador, hpEnemigo]
        : [hpEnemigo, hpJugador];

      anotar(jugadorAtaca ? 'jugador' : 'enemigo', hpAtacanteAntes, evento.hpAtacante);
      anotar(jugadorAtaca ? 'enemigo' : 'jugador', hpDefensorAntes, evento.hpDefensor);

      // El `??` es la red por si algún historial no trae los campos nuevos.
      const hpAtacanteDespues = evento.hpAtacante ?? hpAtacanteAntes;
      const hpDefensorDespues = evento.hpDefensor ?? hpDefensorAntes - evento.dano;

      if (jugadorAtaca) {
        hpJugador = hpAtacanteDespues;
        hpEnemigo = hpDefensorDespues;
        cargaJugador = evento.cargaAtacante;
        cargaEnemigo = evento.cargaDefensor;
      } else {
        hpEnemigo = hpAtacanteDespues;
        hpJugador = hpDefensorDespues;
        cargaEnemigo = evento.cargaAtacante;
        cargaJugador = evento.cargaDefensor;
      }
    });

    return {
      hpJugador: Math.max(0, hpJugador),
      hpEnemigo: Math.max(0, hpEnemigo),
      cargaJugador,
      cargaEnemigo,
      curacion,
    };
  }, [ronda, golpes, golpesAplicados]);

  const combateTotalTerminado = Boolean(ronda) && rondaCompleta && (ronda.jugadorGano || !hayMasRondas);

  useEffect(() => {
    if (!combateTotalTerminado) return;
    notificarLogros(resultado?.logrosDesbloqueados ?? []);
  }, [combateTotalTerminado, resultado, notificarLogros]);

  // La transformación aparece al TERMINAR la animación, no al recibir el
  // resultado: el store la desbloqueó antes de que el combate se reprodujera, y
  // sacarla entonces destriparía que has ganado. Mismo criterio que los logros.
  // Es una cola porque el banquillo también gana XP: dos personajes pueden cruzar
  // el umbral de su modo en la misma victoria.
  const subidasDeNivel = combateTotalTerminado ? resultado?.subidasDeNivel ?? [] : [];
  const nivelAlQueSubio = (personajeId) =>
    subidasDeNivel.find((s2) => s2.personajeId === personajeId)?.nivel ?? null;

  const transformacionEnPantalla = combateTotalTerminado && nivelYaCelebrado
    ? (resultado?.transformacionesDesbloqueadas ?? [])[transformacionesVistas] ?? null
    : null;

  // Cuántas transformaciones de este combate ya se han enseñado. En cuanto una
  // sale de su pantalla, la tarjeta de ese personaje pasa a pintarse con su
  // nivel NUEVO: sprite transformado y nombre del modo, sin esperar al siguiente
  // combate. Antes la tarjeta se quedaba con el nivel de `equipoAlEmpezar`, así
  // que la transformación se celebraba en una pantalla y acto seguido el
  // personaje volvía a salir igual que antes — y si el que subía era del
  // banquillo, no se actualizaba nunca hasta que le tocaba pelear.
  const transformacionesYaContadas = (resultado?.transformacionesDesbloqueadas ?? [])
    .slice(0, transformacionesVistas)
    .map((t) => t.personajeId);
  const nivelEnPantalla = (miembro) => (
    transformacionesYaContadas.includes(miembro.id)
      ? nivelAlQueSubio(miembro.id) ?? miembro.nivel
      : miembro.nivel
  );

  // La transformación espera a que la subida de nivel se haya visto.
  useEffect(() => {
    if (!combateTotalTerminado || nivelYaCelebrado) return undefined;
    const espera = (resultado?.subidasDeNivel ?? []).length > 0 ? MS_CELEBRAR_NIVEL : 0;
    const t = setTimeout(() => setNivelYaCelebrado(true), espera);
    return () => clearTimeout(t);
  }, [combateTotalTerminado, nivelYaCelebrado, resultado]);

  const hayMasEnCadena = cadenaEnemigos
    ? cadenaEnemigos.indiceActual < cadenaEnemigos.enemigos.length - 1
    : false;
  useEffect(() => {
    if (!combateTotalTerminado) return undefined;
    if (!resultado?.jugadorGanoFinal) return undefined;
    if (!hayMasEnCadena) return undefined;
    if (runTerminada || resultado.arcoCompletado || recompensaMiniJefe) return undefined;
    // No encadenar mientras haya una transformación en pantalla: si no, el
    // siguiente combate empezaría por detrás del overlay.
    if (transformacionEnPantalla) return undefined;
    const t = setTimeout(continuarCadena, 1600);
    return () => clearTimeout(t);
  }, [combateTotalTerminado, resultado, hayMasEnCadena, runTerminada, recompensaMiniJefe,
    continuarCadena, transformacionEnPantalla]);

  if (!resultado || !ronda || !estadoEnTurnoActual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body">
        No combat in progress.
      </div>
    );
  }

  const eventosVisibles = golpes.slice(0, Math.max(0, golpesAplicados));
  const golpeEnVuelo = !impactado && golpesEmpezados > 0 ? golpes[golpesEmpezados - 1] : null;
  const ultimoImpacto = golpesAplicados > 0 ? golpes[golpesAplicados - 1] : null;
  const equipoEnPantalla = estadoDelEquipo(resultado, indiceRonda, estadoEnTurnoActual.hpJugador);
  const pasivasEnPantalla = pasivasDelUltimoGolpe(ronda, ultimoImpacto);
  const enemigosEnPantalla = estadoDeLosEnemigos(cadenaEnemigos, ronda, estadoEnTurnoActual.hpEnemigo);
  // Solo se sacude quien acaba de recibir daño de verdad: un golpe bloqueado a 0
  // por una pasiva no debe verse igual que uno que ha dolido.
  const sacudeA = ultimoImpacto && ultimoImpacto.dano > 0
    ? (ultimoImpacto.atacanteId === ronda.jugador.id ? 'enemigo' : 'jugador')
    : null;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col">
      {transformacionEnPantalla && (
        <TransformationScreen
          key={`${transformacionEnPantalla.personajeId}-${transformacionEnPantalla.indiceModo}`}
          personajeId={transformacionEnPantalla.personajeId}
          indiceModo={transformacionEnPantalla.indiceModo}
          onContinuar={() => setTransformacionesVistas((n) => n + 1)}
        />
      )}
      <div className="max-w-4xl mx-auto w-full">
        {/* `relative` para que el proyectil pueda cruzar de un luchador al otro,
            y las dos mitades se sacuden cuando les toca recibir. */}
        {/* Los dos bandos, cada uno en su caja, estilo Pokelike. `relative` para
            que el proyectil pueda cruzar de una caja a la otra por encima. */}
        <div ref={refContenedor} className="relative flex gap-4 mb-4">
          {ultimoImpacto && (
            <DanoFlotante
              key={`d${golpesAplicados}`}
              dano={ultimoImpacto.dano}
              eficacia={ultimoImpacto.eficacia}
              esJutsu={ultimoImpacto.tipoAtaque === 'jutsu'}
              refContenedor={refContenedor}
              refObjetivo={ultimoImpacto.atacanteId === ronda.jugador.id ? refTarjetaEnemigo : refTarjetaJugador}
            />
          )}
          {estadoEnTurnoActual.curacion && (
            <CuracionFlotante
              key={`c${golpesAplicados}`}
              cantidad={estadoEnTurnoActual.curacion.cantidad}
              refContenedor={refContenedor}
              refObjetivo={estadoEnTurnoActual.curacion.lado === 'jugador' ? refTarjetaJugador : refTarjetaEnemigo}
            />
          )}
          {golpeEnVuelo && (
            <Proyectil
              key={golpesEmpezados}
              atacanteId={golpeEnVuelo.atacanteId}
              hacia={golpeEnVuelo.atacanteId === ronda.jugador.id ? 'derecha' : 'izquierda'}
              esJutsu={golpeEnVuelo.tipoAtaque === 'jutsu'}
              refContenedor={refContenedor}
              refOrigen={golpeEnVuelo.atacanteId === ronda.jugador.id ? refTarjetaJugador : refTarjetaEnemigo}
              refDestino={golpeEnVuelo.atacanteId === ronda.jugador.id ? refTarjetaEnemigo : refTarjetaJugador}
            />
          )}

          <PanelBando titulo="Your team">
            {equipoEnPantalla.map((miembro) => {
              const esElQuePelea = miembro.peleando;
              // El relevo es que entre OTRO, no que cambie el número de ronda: un
              // personaje que revive con la Spare Ninja Headband pelea dos rondas
              // seguidas y no se está relevando a sí mismo.
              const entraDeRelevo = esElQuePelea && indiceRonda > 0
                && resultado.rondas[indiceRonda - 1]?.jugador.id !== miembro.id;
              return (
                // Dos envoltorios y no uno: el de fuera se remonta al cambiar de
                // RONDA (y ahí anima el relevo), el de dentro al recibir un golpe
                // (y ahí sacude). Con uno solo, cada impacto reiniciaba la
                // animación de entrada del personaje que acababa de salir.
                //
                // El `key` solo cambia para el que pelea: con la ronda en el key de
                // los tres, las tarjetas del banquillo se remontaban en cada relevo
                // y sus barras de HP y estelas volvían a empezar de cero. Ese era
                // el tirón que se veía, más que la propia animación de entrada.
                <div
                  key={`${miembro.id}-${esElQuePelea ? indiceRonda : 'espera'}`}
                  ref={esElQuePelea ? refTarjetaJugador : null}
                  className={entraDeRelevo ? 'entrada-relevo' : ''}
                >
                <div
                  key={sacudeA === 'jugador' && esElQuePelea ? golpesAplicados : 'quieto'}
                  className={sacudeA === 'jugador' && esElQuePelea ? 'sacudida' : ''}
                >
                  <TarjetaLuchador
                    id={miembro.id}
                    nombre={nombrePersonaje(miembro.id)}
                    nivel={nivelEnPantalla(miembro)}
                    hpActual={miembro.hpActual}
                    hpMaximo={miembro.hpMaximo}
                    carga={estadoEnTurnoActual.cargaJugador}
                    cargaMaxima={esElQuePelea ? ronda.cargaMaxima : 0}
                    // El rótulo se calcula del nivel, no se lee del resumen del
                    // combate: así lo tienen los tres del equipo y no solo el que
                    // pelea (ver `nombreDeModo`).
                    modoActivoNombre={nombreDeModo(miembro.id, nivelEnPantalla(miembro))}
                    estado={miembro.derrotado ? 'caido' : esElQuePelea ? 'activo' : 'espera'}
                    objetoEquipadoId={miembro.objetoEquipadoId}
                    pasivasActivadas={esElQuePelea ? pasivasEnPantalla.jugador : []}
                    subioANivel={nivelAlQueSubio(miembro.id)}
                    cayendoAhora={esElQuePelea && miembro.derrotado}
                  />
                </div>
                </div>
              );
            })}
          </PanelBando>

          <PanelBando titulo="Enemy">
            {enemigosEnPantalla.map((enemigo, i) => {
              // `estadoDeLosEnemigos` pone al que pelea justo en ese índice.
              const esElQuePelea = i === (cadenaEnemigos?.indiceActual ?? 0);
              return (
                // Mismo reparto que en el equipo: el envoltorio de fuera es
                // estable (identidad y ref) y el de dentro se remonta con cada
                // impacto para relanzar la sacudida. Con un solo `div`, dos
                // golpes seguidos al mismo enemigo no la reiniciaban: la clase no
                // llegaba a quitarse entre uno y otro.
                <div key={`${enemigo.id}-${i}`} ref={esElQuePelea ? refTarjetaEnemigo : null}>
                <div
                  key={sacudeA === 'enemigo' && esElQuePelea ? golpesAplicados : 'quieto'}
                  className={sacudeA === 'enemigo' && esElQuePelea ? 'sacudida' : ''}
                >
                  <TarjetaLuchador
                    id={enemigo.id}
                    nombre={enemigo.nombre}
                    nivel={enemigo.nivel}
                    hpActual={enemigo.hpActual}
                    hpMaximo={enemigo.hpMaximo}
                    carga={estadoEnTurnoActual.cargaEnemigo}
                    cargaMaxima={esElQuePelea ? ronda.cargaMaxima : 0}
                    modoActivoNombre={enemigo.modoActivoNombre}
                    estado={enemigo.estado}
                    pasivasActivadas={esElQuePelea ? pasivasEnPantalla.enemigo : []}
                    cayendoAhora={esElQuePelea && enemigo.estado === 'caido'}
                  />
                </div>
                </div>
              );
            })}
          </PanelBando>
        </div>

        {transicionRonda && (
          <p className="text-sello-500 text-sm font-display text-center mb-3">
            {nombrePersonaje(ronda.jugador.id)} has fallen — {nombrePersonaje(resultado.rondas[indiceRonda + 1]?.jugador.id)} enters combat...
          </p>
        )}

        {/* Registro de texto: solo en desarrollo. `import.meta.env.DEV` es false
            en el build de producción, así que Vite lo elimina entero — no hay
            que acordarse de quitarlo a mano antes de publicar. La partida se
            cuenta con la animación; esto es para depurar un combate raro. */}
        {import.meta.env.DEV && (
          <details className="bg-tinta-900 border border-pergamino-100/10 rounded-lg mb-4">
            <summary className="cursor-pointer px-3 py-1.5 text-[10px] uppercase tracking-widest text-pergamino-200/40 font-display">
              [DEV] Combat log
            </summary>
            <div className="px-3 pb-3 max-h-40 overflow-y-auto flex flex-col gap-1.5">
              {eventosVisibles.map((evento, i) => {
                const esJugador = evento.atacanteId === ronda.jugador.id;
                const nombreAtacante = nombrePersonaje(esJugador ? ronda.jugador.id : ronda.enemigo.id);
                const esJutsu = evento.tipoAtaque === 'jutsu';
                return (
                  <p key={i} className={esJutsu ? 'text-sm' : 'text-sm text-pergamino-200/60'}>
                    {esJutsu && '🌀 '}
                    <span className={esJugador ? 'text-fuuton' : 'text-sello-500'}>{nombreAtacante}</span>
                    {' uses '}
                    <span className={esJutsu ? 'text-raiton font-display' : 'text-pergamino-200/80'}>
                      {evento.jutsuNombre}
                    </span>
                    {' — '}
                    <span className={esJutsu ? 'text-pergamino-100' : 'text-pergamino-200/70'}>
                      {evento.dano} damage
                    </span>
                    {evento.eficacia > 1 && <span className="text-fuuton"> (effective!)</span>}
                    {evento.eficacia < 1 && <span className="text-pergamino-200/50"> (not very effective)</span>}
                    {evento.esAtaqueExtra && <span className="text-raiton"> ↺ extra hit</span>}
                    {(evento.pasivasActivadas ?? []).map((id) => nombrePasiva(id)).filter(Boolean).map((n) => (
                      <span key={n} className="text-raiton font-display"> · {n}</span>
                    ))}
                  </p>
                );
              })}
              <div ref={finDelRegistro} />
            </div>
          </details>
        )}

        {!rondaCompleta && (
          <button
            type="button"
            onClick={() => { setGolpesEmpezados(golpes.length); setImpactado(true); }}
            className="text-xs text-pergamino-200/60 underline hover:text-pergamino-100"
          >
            Skip animation
          </button>
        )}

        {combateTotalTerminado && (
          <div className="mt-6 text-center flex flex-col items-center gap-4">
            <p className={`font-naruto text-4xl ${resultado.jugadorGanoFinal ? 'text-exito' : 'text-sello-500'}`}>
              {resultado.jugadorGanoFinal ? 'Victory' : 'Defeat'}
            </p>

            {/* Va entre el rótulo y el botón, que es donde el ojo ya está: el
                jugador lee "Victory" y lo siguiente que ve es lo que ha ganado.

                En una cadena de entrenador **solo sale al terminarla**, y con el
                total acumulado (lo suma el store en `cadenaEnemigos`). Salía en
                cada eslabón, con lo de ese combate: tres carteles que aparecían y
                se iban en 1,6 s y ninguno decía cuánto llevabas. */}
            {resultado.jugadorGanoFinal && !hayMasEnCadena && (
              <PanelRecompensas recompensas={resultado.recompensas} />
            )}

            {runTerminada ? (
              <div>
                <p className="text-[10px] text-pergamino-200/80 leading-relaxed mb-3">
                  {runGanada
                    ? 'You completed the entire run! Konoha is safe.'
                    : 'Your entire team has fallen. The run is over.'}
                </p>
                <BotonPrincipal onClick={irAGameOver} className="elevar-hover">
                  See results
                </BotonPrincipal>
              </div>
            ) : resultado.arcoCompletado ? (
              <div>
                <p className="text-[10px] text-pergamino-200/80 leading-relaxed mb-3">
                  You have beaten {arcoActualDatos?.nombre}. A new arc begins.
                </p>
                <BotonPrincipal onClick={avanzarSiguienteArco} className="elevar-hover">
                  Continue to next arc
                </BotonPrincipal>
              </div>
            ) : recompensaMiniJefe ? (
              <div>
                <p className="text-[10px] text-pergamino-200/80 leading-relaxed mb-3">
                  You defeated the mini-boss! A reward awaits you.
                </p>
                <BotonPrincipal onClick={irARecompensaMiniJefe} className="elevar-hover">
                  Claim reward
                </BotonPrincipal>
              </div>
            ) : desafioRecluta && resultado.jugadorGanoFinal ? (
              // El desafío del pergamino dorado: se ha ganado, así que la vuelta
              // no es al mapa sino al pergamino, ya en modo "recluta a tu rival".
              <div>
                <p className="text-[10px] text-pergamino-200/80 leading-relaxed mb-3">
                  You have earned their respect.
                </p>
                <BotonPrincipal onClick={irAReclutaDesafio} className="elevar-hover">
                  Recruit them
                </BotonPrincipal>
              </div>
            ) : hayMasEnCadena ? (
              // Sin texto: el panel de la derecha ya enseña la cadena entera y a
              // quién le toca. Solo el respiro antes de que entre el siguiente.
              <p className="text-[10px] text-pergamino-200/50 animate-pulse">Next up...</p>
            ) : (
              <BotonPrincipal onClick={volverAlMapa} className="elevar-hover">
                Continue
              </BotonPrincipal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
