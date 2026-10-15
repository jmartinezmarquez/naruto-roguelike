// Retos opcionales (documentacion/42 §6): qué cambia en una run con unos retos
// activos. Puro: recibe la lista de retos por parámetro. Los modificadores usan las
// mismas claves que la ascensión y se combinan con ella multiplicando.
import { MODIFICADORES_NEUTROS } from './ascension';

function retosActivos(retos, ids) {
  return ids.map((id) => {
    const reto = retos.find((r) => r.id === id);
    if (!reto) throw new Error(`Reto desconocido: ${id}`);
    return reto;
  });
}

/** Los modificadores de unos retos, ya multiplicados entre sí. Una clave desconocida revienta. */
export function modificadoresDeRetos(retos, ids) {
  const resultado = { ...MODIFICADORES_NEUTROS };
  for (const reto of retosActivos(retos, ids)) {
    for (const [clave, valor] of Object.entries(reto.modificadores ?? {})) {
      if (!(clave in MODIFICADORES_NEUTROS)) throw new Error(`Modificador desconocido en el reto ${reto.id}: ${clave}`);
      resultado[clave] *= valor;
    }
  }
  return resultado;
}

/** Dos juegos de modificadores en uno (ascensión × retos). */
export function combinarModificadores(a, b) {
  return Object.fromEntries(Object.keys(MODIFICADORES_NEUTROS).map((clave) => [clave, a[clave] * b[clave]]));
}

/** El tamaño máximo del equipo con unos retos: el menor que pida alguno, o el de siempre. */
export function tamanoEquipoConRetos(retos, ids, tamanoBase) {
  return retosActivos(retos, ids).reduce((tam, r) => Math.min(tam, r.tamanoEquipo ?? tam), tamanoBase);
}
