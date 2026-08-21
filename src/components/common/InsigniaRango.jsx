import { COLOR_RANGO, useRangoNinja } from './rangos';

/**
 * La letra del rango de misión (D-C-B-A-S), a la manera de una hoja de misión.
 * Es tipografía y no un sprite: no hay arte para esto y **no hace falta**.
 *
 * ⚠️ **El `translate-y` no es un retoque a ojo, es la corrección medida.** Centrar
 * con flex centra la CAJA DE LÍNEA, no la letra, y las dos solo coinciden si la
 * tipografía es de proporciones normales. `njnaruto.ttf` no lo es: su "S" ocupa
 * de 8 a 1852 de 2048 unidades, o sea casi la em entera, así que su centro óptico
 * cae a 0,393em del alto de línea en vez de a 0,5 y la letra se ve **alta**.
 * 0,5 − 0,393 = **0,107em** hacia abajo, calculado con el ascenso/descenso de la
 * `hhea` del propio fichero. Y `block` porque las transformaciones **no se
 * aplican a un elemento inline**.
 */
export function InsigniaRango({ rango, tamano = 'text-2xl', className = '' }) {
  const color = COLOR_RANGO[rango];
  if (!color) return null;
  return (
    // ⚠️ **Dos elementos y no uno.** La corrección óptica de arriba centra la LETRA
    // dentro de su caja de línea, pero esa caja hay que centrarla a su vez dentro
    // del hueco que le da quien la usa — y las cinco letras no miden lo mismo de
    // ancho (la `D` de `njnaruto.ttf` es bastante más ancha que la `C`). Sin la caja
    // exterior, cada rango se colocaba en un sitio distinto de su fila y se veía
    // como que "la letra está descentrada": no lo estaba dentro de sí misma, lo
    // estaba respecto a la fila.
    <span className={`inline-flex items-center justify-center leading-none ${className}`}>
      <span
        className={[
          'block font-naruto leading-none translate-y-[0.107em]',
          color.fijo ? 'contorno-fijo' : '',
          tamano,
          color.texto,
        ].join(' ')}
      >
        {rango}
      </span>
    </span>
  );
}

/**
 * El rango ninja con su cuenta atrás. **Lo que pica no es el rango, es el
 * "faltan 6"**: sin el número que falta esto sería un título decorativo.
 */
export function PanelRangoNinja({ className = '' }) {
  const { actual, siguiente, puntos, faltan, progreso } = useRangoNinja();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="shrink-0 text-center">
        <p className="font-naruto contorno-fijo text-oro text-lg leading-none">{actual.nombre}</p>
        <p className="font-display text-[8px] text-pergamino-200/50 mt-1">NINJA RANK</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-tinta-950 rounded-sm border border-marco overflow-hidden">
          <div className="h-full bg-oro/70" style={{ width: `${Math.round(progreso * 100)}%` }} />
        </div>
        <p className="font-display text-[8px] text-pergamino-200/60 mt-1">
          {siguiente
            ? `${puntos} pts — ${faltan} to ${siguiente.nombre}`
            : `${puntos} pts — highest rank`}
        </p>
      </div>
    </div>
  );
}
