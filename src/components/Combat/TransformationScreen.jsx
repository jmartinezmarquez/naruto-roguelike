import { useEffect, useState } from 'react';
import personajesData from '../../data/characters.json';
import enemiesData from '../../data/enemies.json';
import { normalizarPasivas, describirPasiva, nombrePasiva } from '../../engine/passives';
import { nombrePersonaje } from '../common/nombres';
import { spriteDeLuchador } from '../common/characterSprites';
import { spriteDeModo } from '../common/transformationSprites';

// Los dos tiempos del efecto. Tienen que cuadrar con las animaciones de
// `index.css` (`anillo-chakra`, `destello-transformacion`).
const MS_CARGA = 1400;
const MS_ESTALLIDO = 520;

function encontrarBase(id) {
  return personajesData.personajes.find((p) => p.id === id)
    ?? enemiesData.jefes.find((j) => j.id === id)
    ?? null;
}

/**
 * El momento en que un personaje desbloquea una transformación.
 *
 * Existe porque las transformaciones se quitaron a propósito de las tarjetas de
 * personaje, para que fueran una sorpresa (ver documentacion/30). Esta pantalla y
 * las etiquetas de pasiva del combate son los ÚNICOS sitios donde el jugador se
 * entera de que existen: sin ella, media parte del rediseño de balance vivía solo
 * en los JSON.
 *
 * Estructura: primero el espectáculo (corto, y saltable) y después la
 * información quieta. Lo que de verdad tiene que quedar es qué hace la
 * transformación, y eso no se puede leer mientras algo parpadea — por eso la
 * pantalla se queda fija hasta que el jugador pulsa.
 *
 * Aquí SÍ va la descripción de las pasivas, que es la que se quitó de la
 * tarjeta: este es el momento en que esa información importa y en que el jugador
 * está mirando. Los multiplicadores no: no son un dato comparable, son material
 * de enciclopedia.
 */
export default function TransformationScreen({ personajeId, indiceModo, onContinuar }) {
  const [fase, setFase] = useState('carga'); // carga → estallido → listo

  const base = encontrarBase(personajeId);
  const modo = base?.modos?.[indiceModo] ?? null;

  useEffect(() => {
    if (fase !== 'carga') return undefined;
    const t = setTimeout(() => setFase('estallido'), MS_CARGA);
    return () => clearTimeout(t);
  }, [fase]);

  useEffect(() => {
    if (fase !== 'estallido') return undefined;
    const t = setTimeout(() => setFase('listo'), MS_ESTALLIDO);
    return () => clearTimeout(t);
  }, [fase]);

  // Si el modo no existe en los datos no hay nada que celebrar: se sale sin
  // pintar en vez de enseñar una pantalla vacía. No debería pasar nunca (el
  // store saca el índice con `indexOf` sobre el propio array de modos), es una
  // salida por si algún día alguien reordena los modos de un personaje.
  const faltaElModo = !modo;
  useEffect(() => {
    if (faltaElModo) onContinuar();
    // Depende solo de si falta el modo. `onContinuar` es una función nueva en
    // cada render del padre: incluirla aquí volvería a disparar el efecto en cada
    // render y se llamaría en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faltaElModo]);
  if (faltaElModo) return null;

  const spriteNormal = spriteDeLuchador(personajeId);
  const spriteTransformado = spriteDeModo(personajeId, indiceModo) ?? spriteNormal;
  const enCarga = fase === 'carga';
  const pasivas = normalizarPasivas(modo.pasivas ?? []);

  return (
    <div className="fixed inset-0 z-50 bg-tinta-950/95 flex flex-col items-center justify-center px-6">
      <p className="font-display text-xs uppercase tracking-[0.3em] text-pergamino-200/50 mb-8">
        {nombrePersonaje(personajeId)} is changing
      </p>

      <div className="relative flex items-center justify-center w-80 h-80">
        {/* Dos anillos desfasados: uno solo se leía como un parpadeo, dos dan
            sensación de que algo se está cerrando encima. */}
        {enCarga && (
          <>
            <div className="absolute rounded-full border-sello-500 anillo-chakra" />
            <div className="absolute rounded-full border-raiton anillo-chakra" style={{ animationDelay: '350ms' }} />
          </>
        )}

        {fase === 'estallido' && (
          <div className="absolute w-48 h-48 rounded-full bg-pergamino-100 destello-transformacion" />
        )}

        {spriteNormal && (
          <img
            src={enCarga ? spriteNormal : spriteTransformado}
            alt=""
            aria-hidden="true"
            className={[
              // x2 exacto del lienzo de 96 px, como en la tarjeta de combate.
              'relative w-48 h-48 object-contain',
              enCarga ? 'temblor-transformacion parpadeo-silueta' : 'entrada-transformado',
            ].join(' ')}
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>

      {/* El nombre y las pasivas solo cuando termina el espectáculo: leerlos
          mientras el sprite parpadea es imposible, y son lo que importa. */}
      {fase === 'listo' && (
        <div className="mt-6 text-center max-w-md">
          <p className="font-naruto text-3xl text-oro drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
            {modo.nombre}
          </p>
          <p className="font-display text-[11px] uppercase tracking-widest text-pergamino-200/40 mt-1">
            Transformation unlocked
          </p>

          <div className="mt-5 flex flex-col gap-2">
            {pasivas.map((pasiva) => (
              <div key={pasiva.id} className="bg-tinta-900 border border-pergamino-100/10 rounded-lg px-3 py-2">
                <p className="font-display text-xs text-sello-500 uppercase tracking-wide">
                  {nombrePasiva(pasiva.id)}
                </p>
                <p className="text-xs text-pergamino-200/70 mt-0.5">{describirPasiva(pasiva)}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onContinuar}
            className="mt-6 px-6 py-2 bg-sello-600 hover:bg-sello-500 rounded-full font-display text-pergamino-100 transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Saltable siempre: las runs son cortas y esto se repite mucho entre
          partidas. Llevar al jugador al final del efecto, no cerrar la pantalla:
          lo que no puede perderse es lo que hace la transformación. */}
      {fase !== 'listo' && (
        <button
          type="button"
          onClick={() => setFase('listo')}
          className="mt-8 text-xs text-pergamino-200/50 underline hover:text-pergamino-100"
        >
          Skip
        </button>
      )}
    </div>
  );
}
