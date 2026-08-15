import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

/**
 * La música de fondo: **una pista por arco, en bucle**, y nada más.
 *
 * No hay efectos de sonido ni sistema de mezcla a propósito. La referencia
 * (Pokelike) no los tiene: es un juego para jugar con calma, con una pista lo-fi
 * por región y ya está. Eso convierte lo que parecía "un sistema entero" en un
 * `<audio>` con tres reglas, y las tres están abajo.
 *
 * ⚠️ **Este componente no pinta nada y va colgado de `App`, no de una pantalla.**
 * Si colgara de la pantalla, React lo desmontaría y volvería a montar en cada
 * cambio —mapa → combate → mapa— y la música empezaría de cero cada vez.
 */

/**
 * Las pistas que EXISTEN, resueltas en build.
 *
 * ⚠️ Con `import` normal, un fichero que falta **rompe el build**, así que no se
 * podría dejar el sistema montado y los huecos vacíos. `import.meta.glob` resuelve
 * lo que haya: si la carpeta está vacía, este objeto queda vacío y el juego
 * funciona igual, en silencio. Ese es justo el estado en el que nace esto.
 *
 * La clave es el **nombre del fichero sin extensión**, y tiene que coincidir con el
 * `id` del arco (`pais_de_las_olas`, `examen_chunin`, `invasion_de_pain`), igual
 * que `FONDO_COLUMNA` en el mapa. `menu` es la pista opcional de antes de empezar,
 * cuando todavía no hay run, y `principal` es el **respaldo**: lo que suena donde no
 * haya pista propia.
 */
const PISTAS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/music/*.{mp3,ogg,m4a}', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.[^.]+$/, ''), url]),
);

// Cuánto tarda en apagarse una pista al cambiar de arco. Corto: es para que no haya
// un corte seco al derrotar a un jefe, no un efecto en sí mismo.
const MS_FUNDIDO = 600;

export default function MusicaDeFondo({ arcoId }) {
  const volumen = useSettingsStore((s) => s.volumenMusica);
  const audioRef = useRef(null);
  const pistaSonandoRef = useRef(null);
  const fundidoRef = useRef(null);

  // Con respaldo a `principal`, que es el modo en el que arranca el MVP: **una sola
  // canción para todo el juego**, y una por campaña más adelante. Lo bueno de que sea
  // un respaldo y no un caso aparte es que añadir `examen_chunin.mp3` el día de mañana
  // no exige tocar nada — ese arco deja de caer al respaldo y ya está.
  //
  // ⚠️ Y cuando dos arcos comparten pista (o sea, ahora mismo), la URL no cambia al
  // pasar de uno a otro, así que el efecto de abajo sale por su guarda y la música
  // **no se reinicia ni se funde**: sigue sonando por donde iba. Que es justo lo que
  // se quiere — no es un arco nuevo, es el mismo tema.
  const clave = arcoId ?? 'menu';
  const pista = PISTAS[clave] ?? PISTAS.principal ?? null;

  // 1) Cambiar de pista: fundido de salida, cambio de `src`, y a sonar.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || pistaSonandoRef.current === pista) return undefined;

    function poner() {
      pistaSonandoRef.current = pista;
      if (!pista) { audio.pause(); return; }
      audio.src = pista;
      audio.volume = volumen;
      // `catch` obligatorio: si el navegador todavía no ha visto un gesto del
      // usuario, `play()` RECHAZA con una promesa. No es un error del que haya que
      // enterarse — lo arregla el efecto 3.
      audio.play().catch(() => {});
    }

    clearInterval(fundidoRef.current);
    if (!pistaSonandoRef.current || audio.paused) { poner(); return undefined; }

    // Fundido a mano y no con la Web Audio API: es un `volume` bajando por pasos, y
    // montar un `AudioContext` entero para esto sería traer un sistema de sonido a un
    // juego que ha decidido no tenerlo.
    const pasos = 12;
    let paso = 0;
    const desde = audio.volume;
    fundidoRef.current = setInterval(() => {
      paso += 1;
      audio.volume = Math.max(0, desde * (1 - paso / pasos));
      if (paso >= pasos) { clearInterval(fundidoRef.current); poner(); }
    }, MS_FUNDIDO / pasos);

    return () => clearInterval(fundidoRef.current);
    // `volumen` a propósito fuera: cambiar el volumen no tiene que cambiar de pista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pista]);

  // 2) El volumen, que sí es un ajuste en vivo. A 0 se PAUSA en vez de sonar mudo:
  // una pista muda sigue consumiendo y, al volver a subir el volumen, entraría por
  // donde se hubiera quedado en vez de por donde la dejaste.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearInterval(fundidoRef.current);
    audio.volume = volumen;
    if (volumen === 0) audio.pause();
    else if (pistaSonandoRef.current) audio.play().catch(() => {});
  }, [volumen]);

  // 3) ⚠️ El navegador **bloquea el autoplay** hasta que el usuario toca algo, así
  // que el primer `play()` de la carga casi siempre se rechaza y la música parecería
  // simplemente rota. Esto reintenta una vez al primer gesto real y se desengancha
  // solo. Sin esto el sistema entero no suena en Chrome.
  useEffect(() => {
    function alPrimerGesto() {
      const audio = audioRef.current;
      if (audio && audio.paused && pistaSonandoRef.current && volumen > 0) {
        audio.play().catch(() => {});
      }
      window.removeEventListener('pointerdown', alPrimerGesto);
      window.removeEventListener('keydown', alPrimerGesto);
    }
    window.addEventListener('pointerdown', alPrimerGesto);
    window.addEventListener('keydown', alPrimerGesto);
    return () => {
      window.removeEventListener('pointerdown', alPrimerGesto);
      window.removeEventListener('keydown', alPrimerGesto);
    };
  }, [volumen]);

  useEffect(() => () => clearInterval(fundidoRef.current), []);

  return <audio ref={audioRef} loop preload="auto" aria-hidden="true" />;
}
