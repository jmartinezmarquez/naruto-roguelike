// Efectos de sonido, **sintetizados en el navegador** con la Web Audio API: ni un
// solo fichero de audio. Ver documentacion/36-musica.md, sección "Efectos de sonido".
//
// Por qué sintetizados y no grabados:
//   - lo que hace que suene a ninja es el MATERIAL —metal, madera, tambor, cuerda,
//     aire, fuego— y todos se pueden modelar: parciales inarmónicos, ruido filtrado,
//     Karplus-Strong para la cuerda (ver "Materiales ninja" más abajo);
//   - pesan cero bytes y no hay nada que precargar (la primera carga ya se vigila, ver
//     documentacion/37-publicacion-web.md);
//   - **cada disparo varía un poco** (tono y volumen al azar dentro de un margen), que es
//     lo que separa un efecto que se oye cuarenta veces por combate de uno que cansa a
//     la tercera. Con un fichero, los cuarenta golpes serían el mismo golpe.
//
// ⚠️ **Nada aquí toca React ni el store.** El volumen lo empuja quien lo sabe
// (`EfectosDeSonidoGlobales`, colgado de App), igual que `MusicaDeFondo` con el suyo.
//
// ⚠️ **El `AudioContext` no se crea al importar, se crea al primer sonido.** El
// navegador no deja que un contexto suene hasta el primer gesto del usuario, y uno
// creado antes nace suspendido. Como casi todo sonido de este juego sale de un clic,
// el primero ya llega con el gesto en la mano; para lo demás, `contexto()` intenta
// reanudar en cada llamada, que es gratis si ya está sonando.

let ctx = null;
let maestro = null;
let envioEco = null;
let bufferRuido = null;
let volumen = 0.5;
const ultimoDisparo = new Map();

function contexto() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Contexto = window.AudioContext ?? window.webkitAudioContext;
    if (!Contexto) return null;
    ctx = new Contexto();

    // Cadena de salida: todo pasa por un compresor antes del altavoz. Sin él, un jutsu
    // que estalla a la vez que el número de golpe y la caída del rival satura y cruje;
    // con él, los picos se aplastan y el conjunto suena "a juego" en vez de "a suma".
    const compresor = ctx.createDynamicsCompressor();
    compresor.threshold.value = -16;
    compresor.knee.value = 12;
    compresor.ratio.value = 5;
    compresor.attack.value = 0.003;
    compresor.release.value = 0.18;
    maestro = ctx.createGain();
    maestro.gain.value = volumen;
    maestro.connect(compresor);
    compresor.connect(ctx.destination);

    // Un eco corto y oscuro como "sala". Solo lo llevan los sonidos grandes (jutsus,
    // fanfarrias): un clic de menú con eco suena a cueva.
    const retardo = ctx.createDelay(1);
    retardo.delayTime.value = 0.13;
    const realimentacion = ctx.createGain();
    realimentacion.gain.value = 0.32;
    const oscurecer = ctx.createBiquadFilter();
    oscurecer.type = 'lowpass';
    oscurecer.frequency.value = 2200;
    envioEco = ctx.createGain();
    envioEco.gain.value = 0.28;
    envioEco.connect(retardo);
    retardo.connect(oscurecer);
    oscurecer.connect(realimentacion);
    realimentacion.connect(retardo);
    oscurecer.connect(maestro);

    // Un segundo de ruido blanco, generado una vez y reutilizado por todos los sonidos
    // de ruido (con un punto de partida al azar, para que no sean el mismo trozo).
    bufferRuido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const datos = bufferRuido.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Fija el volumen de los efectos (0 a 1). Lo llama quien lee el ajuste. */
export function fijarVolumenEfectos(valor) {
  volumen = valor;
  if (maestro && ctx) maestro.gain.setTargetAtTime(valor, ctx.currentTime, 0.02);
}

// --- Primitivas ---------------------------------------------------------------

const azar = (min, max) => min + Math.random() * (max - min);

/**
 * Una envolvente de volumen: sube en `ataque`, se sostiene y cae exponencialmente
 * hasta `fin`. La caída exponencial y no lineal es lo que hace que un golpe suene a
 * golpe: el oído oye en decibelios, y una caída lineal se percibe como un corte.
 */
function envolvente(ganancia, t, { ataque = 0.004, pico = 1, duracion }) {
  const g = ganancia.gain;
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(Math.max(0.0002, pico), t + ataque);
  g.exponentialRampToValueAtTime(0.0001, t + duracion);
}

function conectarSalida(nodo, conEco) {
  nodo.connect(maestro);
  if (conEco) nodo.connect(envioEco);
}

/**
 * Un oscilador con barrido de tono y envolvente. Es la pieza de casi todo: el
 * "blip" de menú, la nota de una fanfarria, el zumbido de un rayo.
 *
 * `vibrato` = [frecuencia, profundidad] modula el tono con un LFO — es lo que hace
 * que el raiton chisporrotee en vez de pitar.
 */
function tono(t, {
  forma = 'square', desde, hasta = desde, duracion, pico = 0.3, ataque, eco = false,
  vibrato = null, filtro = null,
}) {
  const osc = ctx.createOscillator();
  osc.type = forma;
  osc.frequency.setValueAtTime(desde, t);
  if (hasta !== desde) osc.frequency.exponentialRampToValueAtTime(Math.max(20, hasta), t + duracion);

  if (vibrato) {
    const lfo = ctx.createOscillator();
    const profundidad = ctx.createGain();
    lfo.frequency.value = vibrato[0];
    profundidad.gain.value = vibrato[1];
    lfo.connect(profundidad);
    profundidad.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + duracion + 0.05);
  }

  const ganancia = ctx.createGain();
  envolvente(ganancia, t, { ataque, pico, duracion });
  let ultimo = osc;
  if (filtro) {
    const f = ctx.createBiquadFilter();
    f.type = filtro.tipo;
    f.frequency.value = filtro.frecuencia;
    f.Q.value = filtro.q ?? 0.8;
    osc.connect(f);
    ultimo = f;
  }
  ultimo.connect(ganancia);
  conectarSalida(ganancia, eco);
  osc.start(t);
  osc.stop(t + duracion + 0.05);
}

/**
 * Ruido filtrado con barrido del filtro: viento, fuego, impactos, el silbido de un
 * kunai. Con `pasoBanda` estrecho y el filtro barriendo, el ruido "se mueve" — que es
 * todo lo que un whoosh es.
 */
function ruido(t, {
  tipo = 'lowpass', desde, hasta = desde, q = 1, duracion, pico = 0.3, ataque, eco = false,
}) {
  const fuente = ctx.createBufferSource();
  fuente.buffer = bufferRuido;
  fuente.loop = true;
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.Q.value = q;
  filtro.frequency.setValueAtTime(desde, t);
  if (hasta !== desde) filtro.frequency.exponentialRampToValueAtTime(Math.max(20, hasta), t + duracion);
  const ganancia = ctx.createGain();
  envolvente(ganancia, t, { ataque, pico, duracion });
  fuente.connect(filtro);
  filtro.connect(ganancia);
  conectarSalida(ganancia, eco);
  fuente.start(t, azar(0, 0.5));
  fuente.stop(t + duracion + 0.05);
}

/** Frecuencia de una nota MIDI. Las fanfarrias se escriben en notas, no en hercios. */
const nota = (midi) => 440 * 2 ** ((midi - 69) / 12);

// --- Materiales "ninja" ---------------------------------------------------------
//
// ⚠️ **La primera versión de los golpes sonaba a consola, no a ninja**, y el motivo era
// el material: ondas cuadradas con barridos de tono, que el oído reconoce como "pitido
// de videojuego". Lo que hace que algo suene a Naruto no es la melodía sino de QUÉ está
// hecho el sonido — metal, madera, piel de tambor, cuerda, aire, fuego. Estas cuatro
// primitivas son eso, y ningún golpe del combate usa ya una onda cuadrada.

// Las proporciones de los parciales de una barra de metal golpeada (aproximación de los
// modos de una barra libre). Al no ser múltiplos enteros no forman nota: forman
// "metal". Es lo que separa un "shing" de un "pii".
const PARCIALES_METAL = [1, 2.76, 5.4, 8.93];

/**
 * Metal golpeado: kunai, choque de hojas, el brillo de un arma. Cada parcial con su
 * propia caída —los agudos mueren antes, como en un metal real— y un chasquido de
 * ruido en el ataque, que es el golpe en sí.
 */
function metal(t, { base, duracion = 0.5, pico = 0.12, eco = true, brillo = 1 }) {
  PARCIALES_METAL.forEach((razon, i) => {
    tono(t, {
      forma: 'sine',
      desde: base * razon,
      duracion: duracion / (1 + i * 0.6),
      pico: pico * [1, 0.55, 0.35 * brillo, 0.22 * brillo][i],
      ataque: 0.001,
      eco: eco && i === 0,
    });
  });
  ruido(t, { tipo: 'highpass', desde: 5000, duracion: 0.025, pico: pico * 1.4, ataque: 0.001 });
}

/**
 * Taiko: el tambor japonés. Un seno grave que cae de tono en los primeros milisegundos
 * (el parche al tensarse) y luego resuena, más la bofetada de la piel en ruido.
 */
function taiko(t, { f = 75, pico = 0.6, duracion = 0.55, eco = true }) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f * 1.9, t);
  osc.frequency.exponentialRampToValueAtTime(f, t + 0.06);
  const g = ctx.createGain();
  envolvente(g, t, { ataque: 0.002, pico, duracion });
  osc.connect(g);
  conectarSalida(g, eco);
  osc.start(t);
  osc.stop(t + duracion + 0.05);
  ruido(t, { tipo: 'lowpass', desde: 1400, hasta: 300, duracion: 0.06, pico: pico * 0.5, ataque: 0.001 });
  ruido(t, { tipo: 'bandpass', desde: f * 3, q: 2, duracion: duracion * 0.5, pico: pico * 0.25, ataque: 0.003 });
}

/**
 * Los sellos de manos antes de un jutsu: chasquidos secos de madera, uno por sello. Es
 * el gesto más reconocible de la serie, y en sonido sale casi gratis — un seno agudo que
 * muere en 20 ms más un golpe de ruido estrecho.
 */
function sellos(t, cuantos = 3, separacion = 0.055) {
  for (let i = 0; i < cuantos; i++) {
    const f = azar(1050, 1450);
    const ti = t + i * separacion + azar(-0.006, 0.006);
    tono(ti, { forma: 'sine', desde: f, hasta: f * 0.85, duracion: 0.03, pico: 0.16, ataque: 0.001 });
    ruido(ti, { tipo: 'bandpass', desde: azar(1800, 2600), q: 3, duracion: 0.02, pico: 0.22, ataque: 0.001 });
  }
  return t + cuantos * separacion;
}

// Cuerdas pulsadas (koto/shamisen) con Karplus-Strong: una ráfaga de ruido que se
// realimenta por un retardo del tamaño de una onda y se va promediando. Suena a cuerda
// de verdad —ningún oscilador lo consigue— y como el cálculo es caro para hacerlo en
// cada nota, cada frecuencia se calcula una vez y se guarda.
const cuerdasCalculadas = new Map();

function bufferDeCuerda(frecuencia) {
  const clave = Math.round(frecuencia);
  if (cuerdasCalculadas.has(clave)) return cuerdasCalculadas.get(clave);
  const tasa = ctx.sampleRate;
  const largo = Math.floor(tasa * 1.6);
  const buffer = ctx.createBuffer(1, largo, tasa);
  const datos = buffer.getChannelData(0);
  const periodo = Math.max(2, Math.round(tasa / frecuencia));
  // Ráfaga inicial ya un poco filtrada: con ruido blanco puro la púa suena a guitarra
  // eléctrica; suavizada, a cuerda de seda.
  let previo = 0;
  for (let i = 0; i < periodo; i++) {
    previo = previo * 0.4 + (Math.random() * 2 - 1) * 0.6;
    datos[i] = previo;
  }
  for (let i = periodo; i < largo; i++) {
    datos[i] = 0.4985 * (datos[i - periodo] + datos[i - periodo + 1]);
  }
  cuerdasCalculadas.set(clave, buffer);
  return buffer;
}

function cuerda(t, { midi, pico = 0.35, duracion = 1.2, eco = true }) {
  const fuente = ctx.createBufferSource();
  fuente.buffer = bufferDeCuerda(nota(midi));
  const g = ctx.createGain();
  g.gain.setValueAtTime(pico, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  fuente.connect(g);
  conectarSalida(g, eco);
  fuente.start(t);
  fuente.stop(t + duracion + 0.05);
}

/** Chasquidos sueltos de ruido agudo: el crepitar del fuego y la descarga del rayo. */
function crepitar(t, { cuantos, duracion, desde = 3000, pico = 0.2 }) {
  for (let i = 0; i < cuantos; i++) {
    ruido(t + Math.random() * duracion, {
      tipo: 'highpass', desde: azar(desde, desde * 2), q: 0.8,
      duracion: azar(0.006, 0.02), pico: pico * azar(0.4, 1), ataque: 0.0005,
    });
  }
}

// --- El catálogo --------------------------------------------------------------
//
// Cada entrada recibe el instante de inicio `t` y un `v` (variación, ~0,95-1,05) para
// desafinar un pelo cada disparo. Los volúmenes están mezclados entre sí: un clic de
// menú tiene que oírse por debajo de un golpe, y un golpe por debajo de un jutsu.

/**
 * El sonido del jutsu al SALIR, uno por naturaleza: primero los sellos de manos y
 * luego el elemento. Entre los dos ocupan el vuelo del jutsu (~0,56 s), así que el
 * elemento acaba justo cuando el impacto empieza.
 */
const JUTSU_POR_TIPO = {
  // Fuego: la bocanada (ruido grave que se abre hacia agudos, como una llamarada que
  // coge aire) con el crepitar de las brasas por encima.
  katon(t, v) {
    const e = sellos(t);
    ruido(e, { tipo: 'lowpass', desde: 250, hasta: 3200 * v, q: 1.2, duracion: 0.45, pico: 0.5, ataque: 0.06, eco: true });
    ruido(e, { tipo: 'bandpass', desde: 180, q: 1, duracion: 0.42, pico: 0.3, ataque: 0.04 });
    crepitar(e + 0.05, { cuantos: 14, duracion: 0.35, desde: 2500, pico: 0.22 });
  },
  // Viento: el aire que se corta. Una ráfaga que sube y otra que baja, con banda
  // estrecha, y al final el filo — un metal muy agudo y corto, la cuchilla de viento.
  fuuton(t, v) {
    const e = sellos(t);
    ruido(e, { tipo: 'bandpass', desde: 400 * v, hasta: 3600 * v, q: 7, duracion: 0.32, pico: 0.55, ataque: 0.04, eco: true });
    ruido(e + 0.1, { tipo: 'bandpass', desde: 3000 * v, hasta: 600, q: 9, duracion: 0.3, pico: 0.38, ataque: 0.03 });
    metal(e + 0.28, { base: 2100 * v, duracion: 0.25, pico: 0.05, brillo: 1.4 });
  },
  // Rayo: descarga eléctrica. Muchísimos chasquidos agudos muy juntos —eso es lo que
  // suena a electricidad, no un tono— sobre un zumbido grave filtrado, el "mil
  // pájaros" en el fondo y no delante.
  raiton(t, v) {
    const e = sellos(t, 3, 0.045);
    crepitar(e, { cuantos: 46, duracion: 0.42, desde: 3500, pico: 0.24 });
    tono(e, { forma: 'sawtooth', desde: 110 * v, duracion: 0.42, pico: 0.1, ataque: 0.02, vibrato: [23, 30], filtro: { tipo: 'bandpass', frecuencia: 900, q: 2 } });
    tono(e + 0.04, { forma: 'sine', desde: 2600 * v, hasta: 3400 * v, duracion: 0.36, pico: 0.035, ataque: 0.01, vibrato: [47, 700] });
    ruido(e, { tipo: 'highpass', desde: 6000, duracion: 0.4, pico: 0.08, ataque: 0.02, eco: true });
  },
  // Tierra: el suelo que se levanta. Retumbo grave, roca que rueda y piedras sueltas.
  doton(t, v) {
    const e = sellos(t);
    taiko(e, { f: 48 * v, pico: 0.45, duracion: 0.6 });
    ruido(e, { tipo: 'lowpass', desde: 500, hasta: 150, q: 1.5, duracion: 0.5, pico: 0.45, ataque: 0.05, eco: true });
    for (let i = 0; i < 6; i++) {
      ruido(e + 0.08 + i * 0.06 + azar(0, 0.03), { tipo: 'bandpass', desde: azar(400, 1100), q: 5, duracion: 0.04, pico: 0.22, ataque: 0.002 });
    }
  },
  // Agua: el chorro (ruido que cae de filtro, como agua que golpea) y unas pocas
  // burbujas, que son senos que SUBEN de tono — cómo suena una burbuja al soltarse.
  suiton(t, v) {
    const e = sellos(t);
    ruido(e, { tipo: 'lowpass', desde: 2400 * v, hasta: 500, q: 2, duracion: 0.42, pico: 0.5, ataque: 0.03, eco: true });
    ruido(e + 0.05, { tipo: 'bandpass', desde: 900, hasta: 1600, q: 3, duracion: 0.32, pico: 0.22, ataque: 0.05 });
    for (let i = 0; i < 4; i++) {
      const f = azar(450, 800) * v;
      tono(e + 0.1 + i * 0.07 + azar(0, 0.03), { forma: 'sine', desde: f, hasta: f * 2.4, duracion: 0.05, pico: 0.12, ataque: 0.003 });
    }
  },
};

const SONIDOS = {
  // ---- Interfaz ----
  // El clic de siempre: un blip cuadrado corto que cae un pelo de tono, con un
  // chasquido de ruido debajo que le da cuerpo. Bajo de volumen: se oye cientos de veces.
  clic(t, v) {
    tono(t, { forma: 'square', desde: 1250 * v, hasta: 900 * v, duracion: 0.05, pico: 0.07, ataque: 0.002, filtro: { tipo: 'lowpass', frecuencia: 3500 } });
    ruido(t, { tipo: 'highpass', desde: 3000, duracion: 0.02, pico: 0.05, ataque: 0.001 });
  },
  // Pasar por encima de algo elegible: un tic casi subliminal.
  hover(t, v) {
    tono(t, { forma: 'triangle', desde: 1900 * v, duracion: 0.03, pico: 0.045, ataque: 0.002 });
  },
  // Volver / cerrar: el clic al revés, dos notas que bajan.
  volver(t, v) {
    tono(t, { forma: 'square', desde: 880 * v, duracion: 0.05, pico: 0.06, ataque: 0.002, filtro: { tipo: 'lowpass', frecuencia: 3000 } });
    tono(t + 0.05, { forma: 'square', desde: 660 * v, duracion: 0.07, pico: 0.06, ataque: 0.002, filtro: { tipo: 'lowpass', frecuencia: 3000 } });
  },
  // Elegir un nodo del mapa: dos notas que suben, "allá vamos".
  elegirNodo(t, v) {
    tono(t, { forma: 'square', desde: nota(76) * v, duracion: 0.06, pico: 0.08, ataque: 0.003 });
    tono(t + 0.06, { forma: 'square', desde: nota(83) * v, duracion: 0.11, pico: 0.08, ataque: 0.003, eco: true });
  },
  // Algo que no se puede hacer: zumbido grave doble.
  error(t) {
    tono(t, { forma: 'square', desde: 150, duracion: 0.08, pico: 0.09, ataque: 0.003, filtro: { tipo: 'lowpass', frecuencia: 1200 } });
    tono(t + 0.1, { forma: 'square', desde: 120, duracion: 0.12, pico: 0.09, ataque: 0.003, filtro: { tipo: 'lowpass', frecuencia: 1200 } });
  },

  // ---- Objetos y economía ----
  // La moneda clásica: dos notas agudas, la segunda sostenida.
  monedas(t, v) {
    tono(t, { forma: 'square', desde: nota(83) * v, duracion: 0.07, pico: 0.1, ataque: 0.002 });
    tono(t + 0.07, { forma: 'square', desde: nota(88) * v, duracion: 0.28, pico: 0.1, ataque: 0.002, eco: true });
  },
  // Equipar: el "shhk" metálico de enfundar un arma.
  equipar(t, v) {
    ruido(t, { tipo: 'highpass', desde: 2500 * v, hasta: 6000, q: 1, duracion: 0.12, pico: 0.22, ataque: 0.01 });
    metal(t + 0.09, { base: 1300 * v, duracion: 0.3, pico: 0.07 });
  },
  // Quitarse el objeto: un roce y un golpe de metal más apagado.
  desequipar(t, v) {
    ruido(t, { tipo: 'bandpass', desde: 3000, hasta: 1200, q: 2, duracion: 0.1, pico: 0.14, ataque: 0.005 });
    metal(t + 0.05, { base: 800 * v, duracion: 0.18, pico: 0.05, brillo: 0.5, eco: false });
  },
  // Curación (descanso, consumible, evento): arpegio pentatónico de cuerda, suave.
  curar(t) {
    [69, 72, 74, 79].forEach((n, i) => cuerda(t + i * 0.09, { midi: n, pico: 0.22, duracion: 1 }));
  },

  // ---- Combate ----
  // El kunai sale: silbido corto del aire y un destello de metal al soltarlo.
  lanzarKunai(t, v) {
    ruido(t, { tipo: 'bandpass', desde: 2200 * v, hasta: 5200 * v, q: 4, duracion: 0.11, pico: 0.2, ataque: 0.012 });
    metal(t, { base: 3100 * v, duracion: 0.08, pico: 0.025, brillo: 0.6, eco: false });
  },
  // Golpe básico que entra: carne y tela — un golpe sordo grave con el chasquido de un
  // corte corto por encima. Nada de tono: un golpe no es una nota.
  golpe(t, v) {
    tono(t, { forma: 'sine', desde: 150 * v, hasta: 60, duracion: 0.11, pico: 0.5, ataque: 0.002 });
    ruido(t, { tipo: 'bandpass', desde: 900 * v, q: 1.2, duracion: 0.05, pico: 0.42, ataque: 0.001 });
    ruido(t + 0.005, { tipo: 'highpass', desde: 3500, hasta: 1800, duracion: 0.05, pico: 0.14, ataque: 0.001 });
  },
  // Golpe muy eficaz: más pesado, con el taiko debajo y un crujido.
  golpeEficaz(t, v) {
    SONIDOS.golpe(t, v);
    taiko(t, { f: 70 * v, pico: 0.4, duracion: 0.3, eco: false });
    ruido(t + 0.01, { tipo: 'bandpass', desde: 1600, hasta: 800, q: 1.5, duracion: 0.1, pico: 0.3, ataque: 0.001 });
  },
  // Golpe poco eficaz: rozado, sin cuerpo.
  golpeFlojo(t, v) {
    tono(t, { forma: 'sine', desde: 130 * v, hasta: 80, duracion: 0.07, pico: 0.25, ataque: 0.002 });
    ruido(t, { tipo: 'bandpass', desde: 700, q: 1, duracion: 0.04, pico: 0.2, ataque: 0.001 });
  },
  // Bloqueado a 0 por una pasiva: kunai contra kunai. El "shing" largo de dos metales.
  bloqueado(t, v) {
    metal(t, { base: 1150 * v, duracion: 0.7, pico: 0.13 });
    metal(t + 0.004, { base: 1630 * v, duracion: 0.45, pico: 0.06 });
  },
  // El jutsu impacta: el taiko grande y la explosión con su cola de escombros.
  impactoJutsu(t, v) {
    taiko(t, { f: 55 * v, pico: 0.65, duracion: 0.7 });
    ruido(t, { tipo: 'lowpass', desde: 3500 * v, hasta: 160, q: 0.8, duracion: 0.45, pico: 0.42, ataque: 0.002, eco: true });
  },
  // La barra de jutsu se llena: chakra que se concentra. Un zumbido que crece y se
  // corta, sin melodía — es un aviso, no una fanfarria.
  jutsuListo(t, v) {
    tono(t, { forma: 'sine', desde: 220 * v, hasta: 330 * v, duracion: 0.35, pico: 0.09, ataque: 0.25, vibrato: [7, 6] });
    tono(t, { forma: 'sine', desde: 440 * v, hasta: 660 * v, duracion: 0.35, pico: 0.04, ataque: 0.25 });
    ruido(t, { tipo: 'bandpass', desde: 800, hasta: 2400, q: 4, duracion: 0.35, pico: 0.08, ataque: 0.28 });
  },
  // Alguien cae: el cuerpo contra el suelo, con un poco de polvo.
  ko(t, v) {
    ruido(t, { tipo: 'bandpass', desde: 1400, hasta: 400, q: 2, duracion: 0.3, pico: 0.12, ataque: 0.05 });
    taiko(t + 0.28, { f: 52 * v, pico: 0.5, duracion: 0.35, eco: false });
    ruido(t + 0.3, { tipo: 'lowpass', desde: 700, hasta: 200, duracion: 0.3, pico: 0.25, ataque: 0.01 });
  },
  // Entra el relevo: shunshin. Un "fwip" de aire y el "poof" de la nube de humo.
  relevo(t, v) {
    ruido(t, { tipo: 'bandpass', desde: 700 * v, hasta: 3500 * v, q: 3, duracion: 0.12, pico: 0.22, ataque: 0.02 });
    ruido(t + 0.1, { tipo: 'lowpass', desde: 900, hasta: 250, q: 0.7, duracion: 0.28, pico: 0.35, ataque: 0.008, eco: true });
  },
  // Victoria: taiko y koto en escala pentatónica mayor — a fiesta de aldea.
  victoria(t) {
    taiko(t, { f: 70, pico: 0.5, duracion: 0.4 });
    taiko(t + 0.16, { f: 70, pico: 0.35, duracion: 0.3, eco: false });
    [[67, 0.0], [69, 0.12], [72, 0.24], [74, 0.36], [79, 0.5]].forEach(([n, d]) => cuerda(t + d, { midi: n, pico: 0.32, duracion: d === 0.5 ? 1.6 : 0.8 }));
    cuerda(t + 0.5, { midi: 55, pico: 0.25, duracion: 1.6 });
    taiko(t + 0.5, { f: 60, pico: 0.55, duracion: 0.6 });
  },
  // Derrota: escala in (miyako-bushi), lenta y hacia abajo — el sonido triste "japonés"
  // por excelencia, con un solo golpe de tambor apagado al final.
  derrota(t) {
    [[69, 0], [68, 0.3], [64, 0.6], [62, 0.9], [57, 1.25]].forEach(([n, d]) => cuerda(t + d, { midi: n, pico: 0.3, duracion: 1.4 }));
    taiko(t + 1.25, { f: 45, pico: 0.4, duracion: 0.8 });
  },
  // Subida de nivel: koto que sube rápido y un cascabel al final.
  subirNivel(t, v) {
    [72, 74, 76, 79, 81, 84].forEach((n, i) => cuerda(t + i * 0.055, { midi: n, pico: 0.22, duracion: 0.7 }));
    metal(t + 0.33, { base: 2600 * v, duracion: 0.6, pico: 0.05 });
  },

  // ---- Momentos ----
  // Transformación, fase de carga: chakra acumulándose. Un zumbido grave que sube, el
  // aire que empieza a girar y descargas sueltas cada vez más seguidas.
  cargaTransformacion(t, v, { duracion = 1.2 } = {}) {
    tono(t, { forma: 'sawtooth', desde: 55 * v, hasta: 220 * v, duracion, pico: 0.12, ataque: duracion * 0.7, vibrato: [8, 10], filtro: { tipo: 'lowpass', frecuencia: 900 } });
    ruido(t, { tipo: 'bandpass', desde: 300, hasta: 3200, q: 3, duracion, pico: 0.22, ataque: duracion * 0.8 });
    crepitar(t + duracion * 0.4, { cuantos: 24, duracion: duracion * 0.6, desde: 3000, pico: 0.16 });
  },
  // Transformación, estallido: taiko y explosión, y un acorde de koto abierto.
  estallidoTransformacion(t, v) {
    SONIDOS.impactoJutsu(t, v);
    [55, 62, 67, 69, 74].forEach((n, i) => cuerda(t + 0.05 + i * 0.02, { midi: n, pico: 0.22, duracion: 1.8 }));
  },
  // Logro desbloqueado: campana de templo (rin), metal grave y largo.
  logro(t, v) {
    metal(t, { base: 880 * v, duracion: 1.6, pico: 0.12 });
    metal(t + 0.18, { base: 1320 * v, duracion: 1.3, pico: 0.08 });
  },
  // Reclutar a alguien: koto en cuatro notas y un golpe de tambor.
  reclutar(t) {
    [[67, 0], [72, 0.1], [74, 0.2], [79, 0.3]].forEach(([n, d]) => cuerda(t + d, { midi: n, pico: 0.3, duracion: d === 0.3 ? 1.3 : 0.6 }));
    taiko(t + 0.3, { f: 70, pico: 0.4, duracion: 0.4 });
  },
  // El resultado de una tirada de evento: bueno o malo, en dos pulsaciones de cuerda.
  exito(t) {
    cuerda(t, { midi: 74, pico: 0.3, duracion: 0.6 });
    cuerda(t + 0.1, { midi: 79, pico: 0.3, duracion: 1.1 });
  },
  fracaso(t) {
    cuerda(t, { midi: 69, pico: 0.3, duracion: 0.8 });
    cuerda(t + 0.16, { midi: 68, pico: 0.3, duracion: 1.2 });
  },
};

export const NOMBRES_DE_SONIDO = Object.keys(SONIDOS);

// Lo mínimo entre dos disparos del MISMO sonido. Sin esto, dos componentes que
// reaccionan al mismo clic (el botón y su contenedor) lo sumarían en fase y sonaría el
// doble de fuerte; y un hover que roza tres nodos seguidos haría una ametralladora.
const MS_ENTRE_REPETICIONES = 45;

/**
 * Suena `nombre`. Silencioso si el navegador no tiene Web Audio, si el volumen está a
 * 0 o si el nombre no existe — un sonido que falla nunca debe romper la partida.
 *
 * `opciones.tipo` elige el jutsu por naturaleza (`reproducir('jutsu', { tipo: 'katon' })`).
 */
export function reproducir(nombre, opciones = {}) {
  if (volumen <= 0) return;
  const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const clave = nombre === 'jutsu' ? `jutsu-${opciones.tipo}` : nombre;
  if (ahora - (ultimoDisparo.get(clave) ?? -Infinity) < MS_ENTRE_REPETICIONES) return;
  ultimoDisparo.set(clave, ahora);

  const c = contexto();
  if (!c) return;
  const t = c.currentTime + 0.005;
  const v = azar(0.95, 1.05);
  try {
    if (nombre === 'jutsu') {
      (JUTSU_POR_TIPO[opciones.tipo] ?? JUTSU_POR_TIPO.fuuton)(t, v);
      return;
    }
    SONIDOS[nombre]?.(t, v, opciones);
  } catch {
    // Un nodo de audio que falla a mitad (pestaña en segundo plano, contexto cerrado)
    // no es asunto del jugador.
  }
}
