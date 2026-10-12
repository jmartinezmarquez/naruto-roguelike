// Los efectos de un golpe en combate: embestida del que ataca, destello y
// sacudida del que recibe, chispas en el punto de impacto y temblor de la arena.
//
// ⚠️ **Se lanzan con la Web Animations API (`elemento.animate`), no con una clase
// CSS y un `key` que cambia**, y el motivo es un bug que ya teníamos: para relanzar
// la sacudida en cada golpe, la tarjeta del que recibía se remontaba entera (`key`
// con el número de golpe). Remontar crea DOM nuevo, y un elemento nuevo **no hace
// transiciones**: la estela de HP (`.estela-hp`) nacía ya con el ancho final y el
// "mordisco" del golpe no se veía nunca en quien lo recibía, que es el único sitio
// donde importa. Con `animate()` el elemento es el mismo de antes y la animación se
// relanza sin tocar nada más.
//
// Todas las duraciones pasan por el factor de animación de los ajustes, y con la
// velocidad instantánea (factor 0) no se lanza nada.

import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Lanza `keyframes` sobre `ref` cada vez que `clave` cambia a un valor no nulo.
 * `clave` es el número del golpe: dos golpes seguidos al mismo luchador tienen
 * claves distintas, así que la animación se relanza aunque nada más cambie.
 *
 * jsdom no implementa `animate`, y un navegador viejo tampoco tiene por qué: sin
 * ella el golpe simplemente no se adorna, que es lo correcto para un adorno.
 */
export function useAnimarAlCambiar(ref, clave, construirAnimacion, factorAnimacion) {
  // La función se lee de una ref para que el efecto dependa SOLO de la clave: si
  // dependiera de una función nueva en cada render, la animación se relanzaría en
  // cada render y no en cada golpe.
  const construir = useRef(construirAnimacion);
  useLayoutEffect(() => {
    construir.current = construirAnimacion;
  });

  useEffect(() => {
    const elemento = ref.current;
    if (clave == null || !elemento || typeof elemento.animate !== 'function') return undefined;
    if (!factorAnimacion) return undefined;
    // Quien ha pedido al sistema menos movimiento no quiere la pantalla temblando.
    // Las animaciones de CSS del combate cuentan algo (quién cae, quién entra); estas
    // solo adornan, así que son las que sobran.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const animacion = construir.current();
    if (!animacion) return undefined;
    const [keyframes, opciones] = animacion;
    const enCurso = elemento.animate(keyframes, {
      ...opciones,
      duration: opciones.duration * factorAnimacion,
    });
    return () => enCurso.cancel();
  }, [ref, clave, factorAnimacion]);
}

// --- Las animaciones ---------------------------------------------------------

/**
 * El que ataca da un paso hacia el rival al soltar el golpe. Es lo que hace que un
 * kunai **salga de alguien**: sin ello el proyectil aparecía de la nada entre las
 * dos cajas. Corto y hacia delante, y el jutsu con más recorrido y una pequeña
 * anticipación hacia atrás — el "tomar impulso" que dice que viene el golpe gordo.
 */
export function animacionEmbestida(hacia, esJutsu) {
  const signo = hacia === 'derecha' ? 1 : -1;
  const recorrido = (esJutsu ? 18 : 10) * signo;
  const keyframes = esJutsu
    ? [
      { transform: 'translateX(0)' },
      { transform: `translateX(${-6 * signo}px)`, offset: 0.3 },
      { transform: `translateX(${recorrido}px)`, offset: 0.55 },
      { transform: 'translateX(0)' },
    ]
    : [
      { transform: 'translateX(0)' },
      { transform: `translateX(${recorrido}px)`, offset: 0.35 },
      { transform: 'translateX(0)' },
    ];
  return [keyframes, { duration: esJutsu ? 380 : 220, easing: 'ease-out' }];
}

/**
 * Destello blanco del sprite al recibir: el "hit flash" de toda la vida. Va a golpes
 * secos (dos fotogramas blancos), no fundido — un fundido de blanco se lee como
 * brillo, y lo que tiene que decir es "le han dado". Aplastar a negro y luego
 * invertir da la silueta blanca pura, la misma que el parpadeo de transformación.
 */
export function animacionDestello() {
  const blanco = 'brightness(0) invert(1)';
  return [
    [
      { filter: blanco },
      { filter: 'none', offset: 0.34 },
      { filter: blanco, offset: 0.5 },
      { filter: 'none' },
    ],
    { duration: 180, easing: 'steps(1, end)' },
  ];
}

/**
 * La tarjeta del que recibe retrocede y vibra. Es la `sacudida` de antes, ahora
 * empujada en la dirección del golpe: el golpe viene de un lado, no de todos.
 */
export function animacionSacudida(desde, fuerte) {
  // `desde` es el lado del que viene el golpe: la tarjeta se va hacia el otro.
  const signo = desde === 'izquierda' ? 1 : -1;
  const a = (fuerte ? 8 : 5) * signo;
  return [
    [
      { transform: 'translateX(0)' },
      { transform: `translateX(${a}px)`, offset: 0.2 },
      { transform: `translateX(${-a * 0.6}px)`, offset: 0.45 },
      { transform: `translateX(${a * 0.4}px)`, offset: 0.7 },
      { transform: 'translateX(0)' },
    ],
    { duration: fuerte ? 360 : 300, easing: 'ease-out' },
  ];
}

/**
 * Cuánto tiembla la arena entera con este golpe, o 0 si no tiembla.
 *
 * Solo con los golpes que **cambian algo**: un jutsu, un golpe muy eficaz o el que
 * tumba a alguien. Si temblara con cada básico dejaría de significar nada a los dos
 * turnos — el temblor es la puntuación del combate, no su ritmo.
 */
export function intensidadTemblorArena(golpe) {
  if (!golpe || !(golpe.dano > 0)) return 0;
  const tumba = golpe.hpDefensor != null && golpe.hpDefensor <= 0;
  let intensidad = 0;
  if (golpe.tipoAtaque === 'jutsu') intensidad = 5;
  if (golpe.eficacia > 1) intensidad = Math.max(intensidad, 3) + 2;
  if (tumba) intensidad = Math.max(intensidad, 4) + 3;
  return intensidad;
}

export function animacionTemblorArena(intensidad) {
  const i = intensidad;
  return [
    [
      { transform: 'translate(0, 0)' },
      { transform: `translate(${-i}px, ${i * 0.5}px)`, offset: 0.15 },
      { transform: `translate(${i * 0.8}px, ${-i * 0.4}px)`, offset: 0.35 },
      { transform: `translate(${-i * 0.5}px, ${i * 0.3}px)`, offset: 0.6 },
      { transform: `translate(${i * 0.25}px, 0)`, offset: 0.8 },
      { transform: 'translate(0, 0)' },
    ],
    { duration: 320, easing: 'ease-out' },
  ];
}

// --- Chispas de impacto -------------------------------------------------------

const COLOR_DE_TIPO = {
  katon: 'var(--color-katon)',
  fuuton: 'var(--color-fuuton)',
  raiton: 'var(--color-raiton)',
  doton: 'var(--color-doton)',
  suiton: 'var(--color-suiton)',
};

/**
 * Las chispas que salta un golpe, como datos: cuántas, hacia dónde, de qué color y
 * si llevan onda expansiva. Separado del componente para poder probarlo sin DOM.
 *
 * - El **básico** suelta pocas chispas claras: es el kunai, metal contra carne, y
 *   no tiene naturaleza de chakra (es el mismo para todos).
 * - El **jutsu** suelta muchas, del color de la naturaleza de quien lo lanza, y una
 *   onda. Es la única pista visual de que el elemento importa en ese golpe.
 * - Un golpe **muy eficaz** suelta más y más lejos, y uno **poco eficaz** menos:
 *   el número ya lo dice con su color, esto lo dice en el cuerpo del rival.
 * - Un golpe **bloqueado** (0 de daño) no salta nada: no ha tocado.
 *
 * Los ángulos son deterministas (reparto uniforme con un desfase fijo por índice):
 * con `Math.random` cada render repintaría las chispas en sitios distintos.
 */
export function chispasDelGolpe(golpe, tipoAtacante) {
  if (!golpe || !(golpe.dano > 0)) return null;
  const esJutsu = golpe.tipoAtaque === 'jutsu';
  const eficaz = golpe.eficacia > 1;
  const flojo = golpe.eficacia < 1;

  let cantidad = esJutsu ? 12 : 6;
  if (eficaz) cantidad += 4;
  if (flojo) cantidad -= 2;
  const distancia = (esJutsu ? 46 : 28) * (eficaz ? 1.3 : flojo ? 0.8 : 1);
  const color = esJutsu ? COLOR_DE_TIPO[tipoAtacante] ?? 'var(--color-oro)' : '#F3E9D2';

  const chispas = Array.from({ length: cantidad }, (_, i) => ({
    angulo: (360 / cantidad) * i + ((i * 47) % 23) - 11,
    distancia: distancia * (0.7 + ((i * 37) % 10) / 20),
    tamano: esJutsu ? 4 + (i % 3) * 2 : 3 + (i % 2),
  }));

  return { chispas, color, onda: esJutsu || eficaz, esJutsu };
}
