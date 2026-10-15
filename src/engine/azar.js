// Azar con semilla, para el desafío diario (documentacion/42 §6): el mismo mapa y las
// mismas ofertas para cualquiera que juegue ese día, sin servidor. Puro: devuelve
// generadores; quién los usa lo decide el store.

/** Un número entero a partir de un texto (FNV-1a de 32 bits). */
export function semillaDeTexto(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Un generador como `Math.random` (números en [0, 1)), determinista para una semilla (mulberry32). */
export function generadorConSemilla(semilla) {
  let estado = semilla >>> 0;
  return function azar() {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
