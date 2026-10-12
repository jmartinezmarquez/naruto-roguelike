import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useFactorAnimacion } from '../../store/useSettingsStore';
import { spriteDeCombate } from '../common/datosDeLuchador';
import { nombreCorto, nombrePersonaje } from '../common/nombres';
import { FONDO_COLUMNA } from '../common/fondosDeArco';
import { reproducir } from '../common/efectosDeSonido';
import { useAvanzarConTeclado } from '../common/useAvanzarConTeclado';
import { PanelMarco, TituloBloque, BotonPrincipal } from '../common/PiezasUI';
import { TiraDeEfecto } from '../Combat/EfectoSprite';

/**
 * La transición entre arcos (punto 19 del roadmap — ver documentacion/20-arcos-encadenados.md).
 *
 * Existe por lo que el backlog dejó escrito durante meses: **al cerrar un arco el equipo
 * revive y se cura entero y cambia el mapa, y el jugador no veía ninguna de las dos
 * cosas** — se las contaba un `<p>` dentro del cartel de victoria. Lo que faltaba no
 * era tiempo sino saber qué forma tenía; la forma son tres tiempos, cada uno con una
 * sola cosa que contar:
 *
 *   1. **Cierre**: el arco cae como un sello, con su jefe tumbado. Has terminado algo.
 *   2. **Curación**: las barras se llenan DESDE donde acabaron la pelea y los caídos se
 *      levantan con el humo del shunshin. Es el regalo del arco, y ahora se ve.
 *   3. **Lo siguiente**: el nombre del arco que viene, sobre el fondo de su mapa — la
 *      primera vez que el jugador ve el sitio al que va.
 *
 * Avanza sola y **se salta con un clic o Espacio** (va directa al tercer tiempo): la
 * primera vez se mira entera, la quinta run ya no. Con la velocidad instantánea de los
 * ajustes sale ya en el tercero. Salir es siempre un botón: no lleva a una decisión,
 * lleva a un mapa nuevo, y eso se empieza cuando uno quiere.
 *
 * ⚠️ **La curación ya ha ocurrido en el store** (al morir el jefe). Lo que se enseña sale
 * de `curacionDeArco`, la foto de justo antes que guarda el resumen del combate: leer
 * `equipo` daría a todos con la vida llena desde el primer fotograma.
 */

const MS_CIERRE = 1500;
const MS_CURACION = 2300;

function TarjetaRecuperacion({ miembro, curando }) {
  const sprite = spriteDeCombate(miembro.id, miembro.nivel);
  const desde = miembro.hpMaximo > 0 ? (miembro.hpAntes / miembro.hpMaximo) * 100 : 100;
  return (
    <div className="flex flex-col items-center w-28">
      <div className="relative w-24 h-24 flex items-end justify-center">
        <div className="absolute bottom-1 w-16 h-4 rounded-[50%] bg-tinta-950/50 blur-[2px]" />
        {sprite && (
          <img
            src={sprite}
            alt=""
            aria-hidden="true"
            className={[
              'relative w-24 h-24 object-contain',
              // El caído espera tumbado (la misma pose que en combate) hasta que le toca
              // levantarse; el que acabó en pie respira.
              miembro.cayo ? (curando ? 'levantarse' : 'caido-ko') : 'respirar',
            ].join(' ')}
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        {curando && miembro.cayo && (
          <div className="absolute left-1/2 top-1/2">
            <TiraDeEfecto nombre="humo" />
          </div>
        )}
      </div>
      <p className="font-display text-[10px] text-pergamino-100 mt-1 truncate max-w-full">
        {nombreCorto(miembro.id)} <span className="text-pergamino-200/60">Lv.{miembro.nivel}</span>
      </p>
      <div className="relative h-2.5 w-full bg-tinta-800 rounded-sm overflow-hidden mt-1 border border-marco">
        <div
          className={`absolute inset-y-0 left-0 bg-exito ${curando ? 'llenar-hp' : ''}`}
          style={{ width: curando ? '100%' : `${desde}%`, '--desde': `${desde}%` }}
        />
      </div>
    </div>
  );
}

export default function TransicionArcoScreen() {
  const resultado = useGameStore((s) => s.ultimoResultadoCombate);
  const arco = useGameStore((s) => s.arcoActualDatos);
  const equipo = useGameStore((s) => s.equipo);
  const obtenerSiguienteArco = useGameStore((s) => s.obtenerSiguienteArco);
  const avanzarSiguienteArco = useGameStore((s) => s.avanzarSiguienteArco);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const factorAnimacion = useFactorAnimacion();

  const [fase, setFase] = useState('cierre'); // cierre → curacion → siguiente
  // Instantánea: directo al final. Se DERIVA en vez de forzar el estado desde un
  // efecto, por la regla de siempre (ver el reset de `CombatScreen`).
  const faseEnPantalla = factorAnimacion === 0 ? 'siguiente' : fase;

  const siguiente = obtenerSiguienteArco();
  // Sin foto (un resumen viejo, un test que entra a pelo) se enseña el equipo tal
  // cual: ya curado, sin barras que llenar. Mejor eso que una pantalla vacía.
  const miembros = resultado?.curacionDeArco
    ?? equipo.map((p) => ({ id: p.id, nivel: p.nivel, hpAntes: 1, hpMaximo: 1, cayo: false }));
  const alguienCayo = miembros.some((m) => m.cayo);

  useEffect(() => {
    if (faseEnPantalla === 'siguiente') return undefined;
    const espera = (faseEnPantalla === 'cierre' ? MS_CIERRE : MS_CURACION) * factorAnimacion;
    const t = setTimeout(() => setFase((f) => (f === 'cierre' ? 'curacion' : 'siguiente')), espera);
    return () => clearTimeout(t);
  }, [faseEnPantalla, factorAnimacion]);

  // Cada tiempo con su sonido: campana y tambor al cerrar, la curación (y el poof si
  // alguien se levanta), y la entrada del arco nuevo.
  useEffect(() => {
    if (faseEnPantalla === 'cierre') reproducir('arcoSuperado');
    if (faseEnPantalla === 'curacion') {
      reproducir('curar');
      if (alguienCayo) reproducir('relevo');
    }
    if (faseEnPantalla === 'siguiente') reproducir('nuevoArco');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseEnPantalla]);

  const saltar = useCallback(() => setFase('siguiente'), []);
  // Sin arco siguiente no debería llegarse aquí (el último arco acaba la run y va al
  // Game Over), pero si pasa, la salida no puede ser un botón que no hace nada.
  const empezar = useCallback(() => {
    if (!avanzarSiguienteArco()) volverAlMapa();
  }, [avanzarSiguienteArco, volverAlMapa]);

  useAvanzarConTeclado(saltar, faseEnPantalla !== 'siguiente');
  useAvanzarConTeclado(empezar, faseEnPantalla === 'siguiente');

  const jefe = arco ? spriteDeCombate(arco.jefeFinalId, arco.nivelJefeFinal) : null;
  const curando = faseEnPantalla !== 'cierre';
  const fondo = siguiente ? FONDO_COLUMNA[siguiente.id] : null;

  return (
    <div
      className="min-h-screen bg-transparent text-pergamino-100 font-body px-4 py-8 flex flex-col items-center justify-center gap-5"
      onClick={faseEnPantalla === 'siguiente' ? undefined : saltar}
    >
      {/* 1 — Cierre */}
      <header className="text-center">
        <p className="text-sello-500 text-[10px] tracking-[0.35em] uppercase mb-1">Arc complete</p>
        <h1 className="font-naruto text-4xl text-pergamino-100 sello-resultado">{arco?.nombre}</h1>
        {jefe && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <img
              src={jefe}
              alt=""
              aria-hidden="true"
              className="w-12 h-12 object-contain caido-ko"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-[10px] text-pergamino-200">{nombrePersonaje(arco.jefeFinalId)} defeated</p>
          </div>
        )}
      </header>

      {/* 2 — Curación */}
      {curando && (
        <PanelMarco className="px-5 pt-3 pb-4 aparecer">
          <TituloBloque className="text-center">The team recovers</TituloBloque>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {miembros.map((m) => (
              <TarjetaRecuperacion key={m.id} miembro={m} curando={curando} />
            ))}
          </div>
        </PanelMarco>
      )}

      {/* 3 — Lo siguiente */}
      {faseEnPantalla === 'siguiente' && siguiente && (
        <div className="aparecer flex flex-col items-center gap-4 w-full max-w-md">
          <div
            className="escena-oscura relative w-full h-36 border-2 border-marco overflow-hidden flex flex-col items-center justify-center"
            style={fondo ? {
              backgroundImage: `url(${fondo})`, backgroundSize: 'cover', backgroundPosition: 'center',
              imageRendering: 'pixelated',
            } : undefined}
          >
            {/* Velo para que el nombre se lea sobre el dibujo, sea cual sea el arco. */}
            <div className="absolute inset-0 bg-tinta-950/55" />
            <p className="relative text-oro text-[10px] tracking-[0.35em] uppercase mb-1">Next arc</p>
            <h2 className="relative font-naruto text-3xl text-pergamino-100 text-center px-2">{siguiente.nombre}</h2>
          </div>
          <BotonPrincipal onClick={empezar} className="elevar-hover">
            Begin
          </BotonPrincipal>
        </div>
      )}

      {faseEnPantalla !== 'siguiente' && (
        <p className="text-[9px] text-pergamino-200/70">Click or press Space to skip</p>
      )}
    </div>
  );
}
