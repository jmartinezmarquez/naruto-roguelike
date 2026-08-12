import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import PersonajeHoverCard from '../common/PersonajeHoverCard';
import { nombrePersonaje } from '../common/nombres';
import { nombrePasiva, duenoDePasiva } from '../../engine/passives';
import { spriteDeLuchador } from '../common/characterSprites';
import { spriteDeProyectil } from '../common/projectileSprites';

// El replay avanza de GOLPE en golpe, no de turno en turno. Un turno trae 2-4
// eventos (los dos luchadores, más algún ataque extra) y resolverlos todos de
// una vez hacía imposible animarlos: la barra bajaba dos veces a la vez y no se
// sabía quién había pegado. Cada golpe tiene dos tiempos: el proyectil vuela y
// luego impacta, y el daño se aplica en el impacto, no al empezar.
const MS_VUELO_PROYECTIL = 420;
const MS_ENTRE_GOLPES = 320;
const PAUSA_ENTRE_RONDAS_MS = 1400;

function colorBarraHp(porcentaje) {
  if (porcentaje > 0.5) return 'bg-fuuton';
  if (porcentaje > 0.2) return 'bg-raiton';
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
    const suRonda = resultado.rondas.findIndex((r) => r.jugador.id === miembro.id);

    if (suRonda === indiceRonda) {
      const ronda = resultado.rondas[suRonda];
      return {
        ...miembro,
        hpActual: hpJugadorEnVivo,
        hpMaximo: ronda.jugador.hpMaximo, // el del luchador: incluye buffs temporales
        derrotado: hpJugadorEnVivo <= 0,
        peleando: true,
      };
    }
    if (suRonda !== -1 && suRonda < indiceRonda) {
      return { ...miembro, hpActual: 0, derrotado: true, peleando: false };
    }
    return { ...miembro, peleando: false };
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
  for (const id of golpe.pasivasActivadas ?? []) {
    const lado = duenoDePasiva(id) === 'defensor' ? ladoDefensor : ladoAtacante;
    const nombre = nombrePasiva(id);
    if (nombre && !porLado[lado].includes(nombre)) porLado[lado].push(nombre);
  }
  return porLado;
}

/**
 * El golpe en el aire: el jutsu propio del atacante si lo tiene dibujado (el
 * Rasengan, la Gran Bola de Fuego...) y si no el kunai, que es el ataque básico
 * de todos. Quien no tenga jutsu dibujado lanza kunai también en su jutsu — se
 * distingue igual por tamaño y halo.
 *
 * El jutsu **no rota** mientras vuela: un Rasengan dando vueltas de campana se
 * lee como un error, mientras que un kunai girando es justo lo que se espera.
 *
 * El `key` con el número de golpe es lo que hace que la animación se reinicie:
 * React remonta el elemento y el CSS vuelve a empezar. Con una clase que se
 * quita y se pone, el segundo golpe no animaría.
 */
function Proyectil({ atacanteId, hacia, esJutsu }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute top-1/2 z-10 pointer-events-none ${
        hacia === 'derecha' ? 'proyectil-derecha' : 'proyectil-izquierda'
      } ${esJutsu ? 'proyectil-sin-giro' : ''}`}
    >
      <img
        src={spriteDeProyectil(atacanteId, esJutsu)}
        alt=""
        className={esJutsu
          ? 'w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(233,178,58,0.75)]'
          : 'w-7 h-7 object-contain'}
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
 * Un golpe de 0 se enseña igual, con otro texto: es justo el caso en el que el
 * jugador necesita una explicación (lo ha parado una pasiva), no menos.
 */
function DanoFlotante({ dano, lado, esJutsu }) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-[38%] z-20 pointer-events-none dano-flotante"
      style={{ left: lado === 'jugador' ? '25%' : '75%' }}
    >
      <span className={`font-naruto text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
        dano === 0 ? 'text-suiton' : esJutsu ? 'text-raiton' : 'text-pergamino-100'
      }`}
      >
        {dano === 0 ? 'Blocked' : `-${dano}`}
      </span>
    </div>
  );
}

function EtiquetasPasivas({ nombres }) {
  if (nombres.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1 justify-center">
      {nombres.map((nombre) => (
        <span
          key={nombre}
          className="text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-raiton/20 text-raiton border border-raiton/40"
        >
          {nombre}
        </span>
      ))}
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
  modoActivoNombre, estado, pasivas = [],
}) {
  const porcentaje = hpMaximo > 0 ? Math.max(0, hpActual / hpMaximo) : 0;
  const porcentajeCarga = cargaMaxima ? Math.min(1, Math.max(0, carga / cargaMaxima)) : 0;
  const jutsuListo = porcentajeCarga >= 1;
  const activo = estado === 'activo';

  const estilo = estado === 'caido'
    ? 'border-pergamino-100/10 opacity-40'
    : activo
      ? 'border-sello-500 shadow-[0_0_18px_rgba(201,74,60,0.5)]'
      : 'border-pergamino-100/15 opacity-80';

  return (
    <PersonajeHoverCard
      id={id}
      nivel={nivel}
      hpActual={hpActual}
      hpMaximo={hpMaximo}
      posicion="arriba"
      className="block"
    >
      <div className={`bg-tinta-900 border rounded-lg px-3 pt-2 pb-1 transition-all ${estilo}`}>
        <p className="font-display text-sm text-center text-pergamino-100 truncate">
          {nombre} <span className="text-pergamino-200/60">Lv.{nivel}</span>
        </p>
        {modoActivoNombre && (
          <p className="text-[10px] text-center text-sello-500 uppercase tracking-wide truncate">
            {modoActivoNombre}
          </p>
        )}

        <div className="h-3 w-full bg-tinta-800 rounded-sm overflow-hidden mt-1 border border-tinta-950">
          <div
            className={`h-full ${colorBarraHp(porcentaje)} transition-all duration-300`}
            style={{ width: `${porcentaje * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-pergamino-200/50 mt-0.5">{Math.max(0, hpActual)} / {hpMaximo}</p>

        {/* El sprite se apoya en una sombra elíptica que hace de suelo: sin ella
            los personajes flotan sueltos dentro de la tarjeta. */}
        <div className="relative h-24 flex items-end justify-center">
          <div className="absolute bottom-1 w-20 h-3 rounded-[50%] bg-tinta-950/50 blur-[2px]" />
          {spriteDeLuchador(id) && (
            <img
              src={spriteDeLuchador(id)}
              alt=""
              aria-hidden="true"
              className={`relative w-20 h-20 object-contain ${activo ? '' : 'saturate-75'}`}
              style={{ imageRendering: 'pixelated' }}
            />
          )}
        </div>

        {/* Barra de jutsu solo en quien pelea: en el banquillo no se carga, y
            enseñarla vacía en las tres tarjetas era ruido. Sin números a
            propósito (ver documentacion/29). */}
        {activo && cargaMaxima > 0 && (
          <>
            <div className="h-1.5 w-full bg-tinta-800 rounded-full overflow-hidden border border-pergamino-100/10">
              <div
                className={`h-full transition-all duration-300 ${jutsuListo ? 'bg-raiton animate-pulse' : 'bg-sello-500'}`}
                style={{ width: `${porcentajeCarga * 100}%` }}
              />
            </div>
            <p className={`text-[10px] mt-0.5 ${jutsuListo ? 'text-raiton' : 'text-pergamino-200/40'}`}>
              {jutsuListo ? 'JUTSU READY' : 'Jutsu'}
            </p>
          </>
        )}

        <EtiquetasPasivas nombres={pasivas} />
      </div>
    </PersonajeHoverCard>
  );
}

/** La caja de un bando, con su rótulo y sus luchadores apilados. */
function PanelBando({ titulo, children }) {
  return (
    <div className="flex-1 min-w-0 bg-tinta-950/60 border border-pergamino-100/10 rounded-xl p-3 flex flex-col">
      <p className="font-display text-xs uppercase tracking-[0.2em] text-pergamino-200/50 mb-2">
        {titulo}
      </p>
      {/* El contenido se centra en vertical para que las dos cajas, que tienen
          distinto número de tarjetas, dejen a los luchadores activos más o menos
          a la misma altura: es por donde cruza el proyectil. */}
      <div className="flex-1 flex flex-col justify-center gap-2">{children}</div>
    </div>
  );
}

export default function CombatScreen() {
  const resultado = useGameStore((s) => s.ultimoResultadoCombate);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const irAGameOver = useGameStore((s) => s.irAGameOver);
  const avanzarSiguienteArco = useGameStore((s) => s.avanzarSiguienteArco);
  const irARecompensaMiniJefe = useGameStore((s) => s.irARecompensaMiniJefe);
  const recompensaMiniJefe = useGameStore((s) => s.recompensaMiniJefe);
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
  const finDelRegistro = useRef(null);

  if (resultado !== resultadoPrevio) {
    setResultadoPrevio(resultado);
    setIndiceRonda(0);
    setGolpesEmpezados(0);
    setImpactado(true);
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
    const temporizador = setTimeout(() => {
      setGolpesEmpezados((n) => n + 1);
      setImpactado(false);
    }, MS_ENTRE_GOLPES);
    return () => clearTimeout(temporizador);
  }, [ronda, rondaCompleta, impactado, golpesEmpezados]);

  // El proyectil llega: aquí es donde el golpe cuenta.
  useEffect(() => {
    if (!ronda || impactado) return undefined;
    const temporizador = setTimeout(() => setImpactado(true), MS_VUELO_PROYECTIL);
    return () => clearTimeout(temporizador);
  }, [ronda, impactado, golpesEmpezados]);

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
  // jutsu en ese momento. La carga no se acumula sumando: cada evento ya trae el
  // valor resultante (cargaAtacante/cargaDefensor), porque lanzar el jutsu la
  // pone a cero y eso no se puede reconstruir sumando incrementos.
  const estadoEnTurnoActual = useMemo(() => {
    if (!ronda) return null;
    let hpJugador = ronda.jugador.hpInicial;
    let hpEnemigo = ronda.enemigo.hpInicial;
    let cargaJugador = ronda.jugador.cargaInicial ?? 0;
    let cargaEnemigo = ronda.enemigo.cargaInicial ?? 0;

    for (const evento of golpes.slice(0, Math.max(0, golpesAplicados))) {
        if (evento.atacanteId === ronda.jugador.id) {
          hpEnemigo -= evento.dano;
          // El HP del ATACANTE no se deduce restando: con `heal_on_kill` sube al
          // rematar. Por eso el evento lo trae ya resuelto. Mismo caso que la
          // barra de carga, que tampoco se puede reconstruir sumando porque
          // lanzar el jutsu la pone a cero.
          if (evento.hpAtacante != null) hpJugador = evento.hpAtacante;
          cargaJugador = evento.cargaAtacante;
          cargaEnemigo = evento.cargaDefensor;
        } else {
          hpJugador -= evento.dano;
          if (evento.hpAtacante != null) hpEnemigo = evento.hpAtacante;
          cargaEnemigo = evento.cargaAtacante;
        cargaJugador = evento.cargaDefensor;
      }
    }
    return {
      hpJugador: Math.max(0, hpJugador),
      hpEnemigo: Math.max(0, hpEnemigo),
      cargaJugador,
      cargaEnemigo,
    };
  }, [ronda, golpes, golpesAplicados]);

  const combateTotalTerminado = Boolean(ronda) && rondaCompleta && (ronda.jugadorGano || !hayMasRondas);

  useEffect(() => {
    if (!combateTotalTerminado) return;
    notificarLogros(resultado?.logrosDesbloqueados ?? []);
  }, [combateTotalTerminado, resultado, notificarLogros]);

  const hayMasEnCadena = cadenaEnemigos
    ? cadenaEnemigos.indiceActual < cadenaEnemigos.enemigos.length - 1
    : false;
  useEffect(() => {
    if (!combateTotalTerminado) return undefined;
    if (!resultado?.jugadorGanoFinal) return undefined;
    if (!hayMasEnCadena) return undefined;
    if (runTerminada || resultado.arcoCompletado || recompensaMiniJefe) return undefined;
    const t = setTimeout(continuarCadena, 1600);
    return () => clearTimeout(t);
  }, [combateTotalTerminado, resultado, hayMasEnCadena, runTerminada, recompensaMiniJefe, continuarCadena]);

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
  // Solo se sacude quien acaba de recibir daño de verdad: un golpe bloqueado a 0
  // por una pasiva no debe verse igual que uno que ha dolido.
  const sacudeA = ultimoImpacto && ultimoImpacto.dano > 0
    ? (ultimoImpacto.atacanteId === ronda.jugador.id ? 'enemigo' : 'jugador')
    : null;

  return (
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col">
      <div className="max-w-4xl mx-auto w-full">
        {cadenaEnemigos && cadenaEnemigos.enemigos.length > 1 && (
          <p className="text-center text-xs text-sello-500/70 mb-1 font-display uppercase tracking-widest">
            Battle {cadenaEnemigos.indiceActual + 1} / {cadenaEnemigos.enemigos.length}
          </p>
        )}
        {resultado.rondas.length > 1 && (
          <p className="text-center text-xs text-pergamino-200/50 mb-3">
            Round {indiceRonda + 1} of {resultado.rondas.length}
          </p>
        )}

        {/* `relative` para que el proyectil pueda cruzar de un luchador al otro,
            y las dos mitades se sacuden cuando les toca recibir. */}
        {/* Los dos bandos, cada uno en su caja, estilo Pokelike. `relative` para
            que el proyectil pueda cruzar de una caja a la otra por encima. */}
        <div className="relative flex gap-4 mb-4">
          {ultimoImpacto && (
            <DanoFlotante
              key={`d${golpesAplicados}`}
              dano={ultimoImpacto.dano}
              lado={ultimoImpacto.atacanteId === ronda.jugador.id ? 'enemigo' : 'jugador'}
              esJutsu={ultimoImpacto.tipoAtaque === 'jutsu'}
            />
          )}
          {golpeEnVuelo && (
            <Proyectil
              key={golpesEmpezados}
              atacanteId={golpeEnVuelo.atacanteId}
              hacia={golpeEnVuelo.atacanteId === ronda.jugador.id ? 'derecha' : 'izquierda'}
              esJutsu={golpeEnVuelo.tipoAtaque === 'jutsu'}
            />
          )}

          <PanelBando titulo="Your team">
            {equipoEnPantalla.map((miembro) => {
              const esElQuePelea = miembro.peleando;
              return (
                <div
                  key={`${miembro.id}-${sacudeA === 'jugador' && esElQuePelea ? golpesAplicados : 'quieto'}`}
                  className={sacudeA === 'jugador' && esElQuePelea ? 'sacudida' : ''}
                >
                  <TarjetaLuchador
                    id={miembro.id}
                    nombre={nombrePersonaje(miembro.id)}
                    nivel={miembro.nivel}
                    hpActual={miembro.hpActual}
                    hpMaximo={miembro.hpMaximo}
                    carga={estadoEnTurnoActual.cargaJugador}
                    cargaMaxima={esElQuePelea ? ronda.cargaMaxima : 0}
                    modoActivoNombre={esElQuePelea ? ronda.jugador.modoActivoNombre : null}
                    estado={miembro.derrotado ? 'caido' : esElQuePelea ? 'activo' : 'espera'}
                    pasivas={esElQuePelea ? pasivasEnPantalla.jugador : []}
                  />
                </div>
              );
            })}
          </PanelBando>

          <PanelBando titulo="Enemy">
            <div
              key={`e${sacudeA === 'enemigo' ? golpesAplicados : 'quieto'}`}
              className={sacudeA === 'enemigo' ? 'sacudida' : ''}
            >
              <TarjetaLuchador
                id={ronda.enemigo.id}
                nombre={ronda.enemigo.nombre}
                nivel={ronda.enemigo.nivel}
                hpActual={estadoEnTurnoActual.hpEnemigo}
                hpMaximo={ronda.enemigo.hpMaximo}
                carga={estadoEnTurnoActual.cargaEnemigo}
                cargaMaxima={ronda.cargaMaxima}
                modoActivoNombre={ronda.enemigo.modoActivoNombre}
                estado={estadoEnTurnoActual.hpEnemigo <= 0 ? 'caido' : 'activo'}
                pasivas={pasivasEnPantalla.enemigo}
              />
            </div>
          </PanelBando>
        </div>

        {transicionRonda && (
          <p className="text-sello-500 text-sm font-display text-center mb-3">
            {ronda.jugador.nombre} has fallen — {resultado.rondas[indiceRonda + 1]?.jugador.nombre} enters combat...
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
                const nombreAtacante = esJugador ? ronda.jugador.nombre : ronda.enemigo.nombre;
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
          <div className="mt-6 text-center">
            <p className={`font-naruto text-4xl mb-4 ${resultado.jugadorGanoFinal ? 'text-fuuton' : 'text-sello-500'}`}>
              {resultado.jugadorGanoFinal ? 'Victory' : 'Defeat'}
            </p>

            {runTerminada ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  {runGanada
                    ? 'You completed the entire run! Konoha is safe.'
                    : 'Your entire team has fallen. The run is over.'}
                </p>
                <button
                  type="button"
                  onClick={irAGameOver}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  See results
                </button>
              </div>
            ) : resultado.arcoCompletado ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  You have beaten {arcoActualDatos?.nombre}. A new arc begins.
                </p>
                <button
                  type="button"
                  onClick={avanzarSiguienteArco}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  Continue to next arc
                </button>
              </div>
            ) : recompensaMiniJefe ? (
              <div>
                <p className="text-pergamino-200/80 text-sm mb-4">
                  You defeated the mini-boss! A reward awaits you.
                </p>
                <button
                  type="button"
                  onClick={irARecompensaMiniJefe}
                  className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
                >
                  Claim reward
                </button>
              </div>
            ) : hayMasEnCadena ? (
              <p className="text-pergamino-200/60 text-sm animate-pulse">
                Next enemy ({cadenaEnemigos.indiceActual + 2} / {cadenaEnemigos.enemigos.length})...
              </p>
            ) : (
              <button
                type="button"
                onClick={volverAlMapa}
                className="px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
