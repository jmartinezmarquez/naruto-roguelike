// Qué suena en cada momento del combate. La decisión (qué sonido para qué golpe) va
// en funciones puras para poder probarla sin audio; el hook solo la ejecuta en el
// momento justo del replay.
//
// ⚠️ **Los sonidos siguen al REPLAY, no al resultado.** El store ya tiene el combate
// resuelto entero cuando la animación empieza (la lección de `equipoAlEmpezar`), así
// que el sonido se engancha a `golpesVistos` / `golpesAplicados` —lo que el jugador
// está viendo— y nunca al resumen. Un golpe suena cuando el kunai LLEGA, igual que la
// barra de vida baja cuando llega.

import { useEffect, useRef } from 'react';
import { reproducir } from '../common/efectosDeSonido';
import { tipoDeLuchador } from '../common/nombres';

/** El sonido al SOLTAR un golpe: el jutsu suena a su naturaleza, el básico a kunai. */
export function sonidoDeLanzamiento(golpe, idAtacante) {
  if (!golpe) return null;
  return golpe.tipoAtaque === 'jutsu'
    ? { nombre: 'jutsu', opciones: { tipo: tipoDeLuchador(idAtacante) } }
    : { nombre: 'lanzarKunai', opciones: {} };
}

/**
 * Los sonidos al IMPACTAR, en orden. Varios a la vez porque un golpe puede ser jutsu,
 * muy eficaz y además tumbar al rival, y cada cosa tiene que oírse.
 *
 * - Bloqueado (0 de daño) suena a metal y a nada más: no ha tocado.
 * - La eficacia cambia el golpe en sí (crujido / golpe apagado): es lo mismo que el
 *   color del número, dicho al oído.
 * - El que tumba añade la caída.
 */
export function sonidosDeImpacto(golpe) {
  if (!golpe) return [];
  if (!(golpe.dano > 0)) return ['bloqueado'];
  const sonidos = [];
  if (golpe.tipoAtaque === 'jutsu') sonidos.push('impactoJutsu');
  if (golpe.eficacia > 1) sonidos.push('golpeEficaz');
  else if (golpe.eficacia < 1) sonidos.push('golpeFlojo');
  else if (golpe.tipoAtaque !== 'jutsu') sonidos.push('golpe');
  if (golpe.hpDefensor != null && golpe.hpDefensor <= 0) sonidos.push('ko');
  return sonidos;
}

/**
 * El cierre: la fanfarria entera solo cuando el combate importa (jefe, mini-jefe,
 * desafío legendario, fin de arco o de run); un combate corriente cierra con un
 * remate corto. La derrota es siempre la misma — ya es rara de por sí.
 */
export function sonidoDeCierre(gano, importante) {
  if (!gano) return 'derrota';
  return importante ? 'victoria' : 'victoriaCorta';
}

// Lo que tarda la subida de nivel en sonar tras la fanfarria: si sonaran juntas se
// pisarían y no se oiría ninguna de las dos.
const MS_NIVEL_TRAS_FANFARRIA = 750;

/**
 * Engancha los sonidos al replay. Recibe lo que la pantalla ya calcula, para no
 * duplicar ni una cuenta del replay.
 */
export function useSonidosDeCombate({
  ronda, indiceRonda, golpes, golpesVistos, golpesAplicados, yaImpactado, instantaneo,
  jugadorConJutsuListo, enemigoConJutsuListo, combateCerrado, gano, subioAlguien, factorAnimacion,
  combateImportante = false,
}) {
  // Al SOLTAR: cuando aparece un golpe nuevo en el aire.
  const golpeEnElAire = !instantaneo && !yaImpactado && golpesVistos > 0 ? golpes[golpesVistos - 1] : null;
  const claveLanzamiento = golpeEnElAire ? `${indiceRonda}-${golpesVistos}` : null;
  useEffect(() => {
    if (!claveLanzamiento || !golpeEnElAire || !ronda) return;
    const id = golpeEnElAire.atacanteEsPrimero ? ronda.jugador.id : ronda.enemigo.id;
    const sonido = sonidoDeLanzamiento(golpeEnElAire, id);
    if (sonido) reproducir(sonido.nombre, sonido.opciones);
    // Solo la clave: el golpe y la ronda cambian con ella.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveLanzamiento]);

  // Al IMPACTAR.
  const golpeQueLlega = !instantaneo && golpesAplicados > 0 ? golpes[golpesAplicados - 1] : null;
  const claveImpacto = golpeQueLlega ? `${indiceRonda}-${golpesAplicados}` : null;
  useEffect(() => {
    if (!claveImpacto) return;
    sonidosDeImpacto(golpeQueLlega).forEach((nombre) => reproducir(nombre));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveImpacto]);

  // La barra de jutsu se llena: suena al pasar de no-listo a listo, no mientras siga
  // llena (estaría sonando un turno entero).
  const listoAntes = useRef({ jugador: false, enemigo: false });
  useEffect(() => {
    const antes = listoAntes.current;
    if (!instantaneo && ((jugadorConJutsuListo && !antes.jugador) || (enemigoConJutsuListo && !antes.enemigo))) {
      reproducir('jutsuListo');
    }
    listoAntes.current = { jugador: jugadorConJutsuListo, enemigo: enemigoConJutsuListo };
  }, [jugadorConJutsuListo, enemigoConJutsuListo, instantaneo]);

  // Entra el relevo: cada ronda nueva a partir de la segunda.
  useEffect(() => {
    if (indiceRonda > 0 && !instantaneo) reproducir('relevo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceRonda]);

  // El cierre: fanfarria o derrota, y la subida de nivel detrás. Suena también con la
  // velocidad instantánea — saltarse la animación no es saltarse el resultado (la
  // misma regla que `MS_MINIMO_AUTO`).
  useEffect(() => {
    if (!combateCerrado) return undefined;
    reproducir(sonidoDeCierre(gano, combateImportante));
    if (!gano || !subioAlguien) return undefined;
    const t = setTimeout(() => reproducir('subirNivel'), MS_NIVEL_TRAS_FANFARRIA * Math.max(0.5, factorAnimacion));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combateCerrado]);
}
