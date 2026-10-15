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
 * Hace `numero` tiradas seguidas. `yaLoTiene(entrada)` dice si el jugador ya tenía
 * ese premio ANTES de tirar (por un logro, por ejemplo); lo que salga en esta misma
 * tanda también cuenta, así que el segundo Kakashi de una tirada de diez es duplicado.
 *
 * Devuelve el estado nuevo y cada premio con `duplicado`. Qué se hace con un
 * duplicado (nivel de ninja o pergaminos) lo decide el store, que es quien sabe.
 */
export function invocar(estado, catalogo, reglas, numero, azar, yaLoTiene = () => false) {
  let siguiente = {
    ...estado,
    personajes: [...estado.personajes],
    objetos: [...estado.objetos],
  };
  const premios = [];
  for (let n = 0; n < numero; n++) {
    const rareza = rarezaDeTirada(siguiente, reglas, azar);
    const entradas = entradasDeRareza(catalogo, rareza);
    const entrada = entradas[Math.floor(azar() * entradas.length)];
    const lista = entrada.tipo === 'personaje' ? siguiente.personajes : siguiente.objetos;
    const duplicado = lista.includes(entrada.id) || yaLoTiene(entrada);
    if (!lista.includes(entrada.id)) lista.push(entrada.id);
    // Las garantías miran la rareza que ha SALIDO, no la que se pidió: con un
    // catálogo sin comunes, la tirada común que da un raro también la cumple.
    const salio = entrada.rareza;
    siguiente = {
      ...siguiente,
      tiradas: siguiente.tiradas + 1,
      sinRaro: salio === 'comun' ? siguiente.sinRaro + 1 : 0,
      sinLegendario: salio === 'legendario' ? 0 : siguiente.sinLegendario + 1,
      legendarios: siguiente.legendarios + (salio === 'legendario' ? 1 : 0),
    };
    premios.push({ ...entrada, duplicado });
  }
  return { estado: siguiente, premios };
}

/** Cuántas tiradas faltan, como mucho, para cada garantía (lo que enseña la pantalla). */
export function tiradasParaGarantia(estado, reglas) {
  return {
    raro: reglas.garantiaRaro - estado.sinRaro,
    legendario: reglas.garantiaLegendario - estado.sinLegendario,
  };
}
