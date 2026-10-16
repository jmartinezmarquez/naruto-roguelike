// El gacha de meta-progresión ("Summon", documentacion/42 §2): pura lógica de
// tiradas, sin saber de pergaminos ni de qué tiene ya el jugador más allá de lo que
// se le pasa. El store cobra, aplica los duplicados y lo guarda.

/** Lo que el gacha recuerda entre tiradas: las garantías y lo que ya ha dado. */
export const ESTADO_INVOCACION_VACIO = {
  tiradas: 0,
  // Tiradas seguidas sin raro (o mejor) y sin legendario: las dos garantías.
  sinRaro: 0,
  sinLegendario: 0,
  // Lo conseguido en el gacha, por tipo de premio.
  personajes: [],
  objetos: [],
  paginas: [],
  // Las skins Ultimate conseguidas (ids de ninja, ver data/ultimates.json).
  ultimates: [],
  legendarios: 0,
};


const ORDEN_RAREZAS = ['comun', 'raro', 'legendario'];

/**
 * La rareza de la siguiente tirada. Las garantías mandan sobre el azar: la tirada
 * número `garantiaLegendario` sin legendario es legendaria, y la `garantiaRaro` sin
 * raro es rara o legendaria (en la proporción de sus probabilidades).
 */
export function rarezaDeTirada(estado, reglas, azar) {
  const { comun, raro, legendario } = reglas.probabilidades;
  if (estado.sinLegendario + 1 >= reglas.garantiaLegendario) return 'legendario';
  if (estado.sinRaro + 1 >= reglas.garantiaRaro) {
    return azar() < legendario / (raro + legendario) ? 'legendario' : 'raro';
  }
  const tirada = azar() * (comun + raro + legendario);
  if (tirada < legendario) return 'legendario';
  if (tirada < legendario + raro) return 'raro';
  return 'comun';
}

/**
 * Las entradas del catálogo de una rareza. Si no hay ninguna (un catálogo a medias),
 * la más cercana que tenga: primero hacia abajo, que es lo que menos regala.
 */
function entradasDeRareza(catalogo, rareza) {
  const i = ORDEN_RAREZAS.indexOf(rareza);
  const orden = [rareza, ...ORDEN_RAREZAS.slice(0, i).reverse(), ...ORDEN_RAREZAS.slice(i + 1)];
  for (const r of orden) {
    const entradas = catalogo.filter((e) => e.rareza === r);
    if (entradas.length > 0) return entradas;
  }
  return [];
}

/**
 * Hace `numero` tiradas seguidas y dice qué da cada una (`resultado`):
 *
 * - Un **ninja**: la primera vez, el ninja (`'personaje'`, desbloqueado como inicial);
 *   la segunda, **su página** del Bingo Book (`'pagina'`); a partir de ahí,
 *   `'repetido'` (el store lo convierte en nivel de ninja). Vale para todas las rarezas
 *   (playtest 2026-10-16).
 * - Un **objeto**: la primera vez el objeto (`'objeto'`), luego `'repetido'` (pergaminos).
 *
 * `yaLoTiene(entrada)` dice si el jugador ya tenía ese ninja u objeto ANTES de tirar
 * sin haberlo sacado aquí (los tres iniciales, por ejemplo); lo que sale en la misma
 * tanda cuenta, así que el segundo Kakashi de un ×10 ya es su página.
 *
 * `garantizarLegendario`: si la tanda acaba sin ningún legendario, la última tirada lo
 * es (el ×10, documentacion/42).
 */
export function invocar(estado, catalogo, reglas, numero, azar, yaLoTiene = () => false, { garantizarLegendario = false } = {}) {
  let siguiente = {
    ...estado,
    personajes: [...estado.personajes],
    objetos: [...estado.objetos],
    paginas: [...(estado.paginas ?? [])],
  };
  const premios = [];
  for (let n = 0; n < numero; n++) {
    const ultima = n === numero - 1;
    const faltaLegendario = garantizarLegendario && ultima && !premios.some((p) => p.rareza === 'legendario');
    const rareza = faltaLegendario ? 'legendario' : rarezaDeTirada(siguiente, reglas, azar);
    const entradas = entradasDeRareza(catalogo, rareza);
    const entrada = entradas[Math.floor(azar() * entradas.length)];

    let resultado;
    if (entrada.tipo === 'personaje') {
      const loTiene = siguiente.personajes.includes(entrada.id) || yaLoTiene(entrada);
      if (!loTiene) {
        siguiente.personajes.push(entrada.id);
        resultado = 'personaje';
      } else if (!siguiente.paginas.includes(entrada.id)) {
        siguiente.paginas.push(entrada.id);
        resultado = 'pagina';
      } else {
        resultado = 'repetido';
      }
    } else {
      const loTiene = siguiente.objetos.includes(entrada.id) || yaLoTiene(entrada);
      if (!loTiene) siguiente.objetos.push(entrada.id);
      resultado = loTiene ? 'repetido' : 'objeto';
    }

    // Las garantías miran la rareza que ha SALIDO, no la que se pidió.
    const salio = entrada.rareza;
    siguiente = {
      ...siguiente,
      tiradas: siguiente.tiradas + 1,
      sinRaro: salio === 'comun' ? siguiente.sinRaro + 1 : 0,
      sinLegendario: salio === 'legendario' ? 0 : siguiente.sinLegendario + 1,
      legendarios: siguiente.legendarios + (salio === 'legendario' ? 1 : 0),
    };
    premios.push({ ...entrada, resultado });
  }
  return { estado: siguiente, premios };
}

/**
 * El catálogo sin lo que aún no se puede dar: el ninja que espera su dibujo
 * (`pendienteDeArte` en characters.json). Sin esto, el gacha daría un
 * personaje invisible.
 */
export function catalogoDisponible(catalogo, idsPendientesDeArte) {
  const pendientes = new Set(idsPendientesDeArte);
  return catalogo.filter((e) => e.tipo === 'objeto' || !pendientes.has(e.id));
}

/** Cuántas tiradas faltan, como mucho, para cada garantía (lo que enseña la pantalla). */
export function tiradasParaGarantia(estado, reglas) {
  return {
    raro: reglas.garantiaRaro - estado.sinRaro,
    legendario: reglas.garantiaLegendario - estado.sinLegendario,
  };
}
