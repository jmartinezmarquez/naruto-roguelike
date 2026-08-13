const POSICION_CLASES = {
  derecha: 'left-full ml-2 top-0 origin-left',
  izquierda: 'right-full mr-2 top-0 origin-right',
  abajo: 'top-full mt-2 left-1/2 -translate-x-1/2 origin-top',
  arriba: 'bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom',
};

/**
 * Envuelve cualquier trigger y muestra `contenido` al hacer hover, con CSS puro.
 *
 * El mostrado va con `.hover-envoltorio:hover > .hover-contenido` (ver
 * `index.css`) y NO con el `group-hover` de Tailwind. Un `group/hover` con
 * nombre lo activa **cualquier** ancestro que lo lleve, y eso rompía el
 * anidamiento: en la pantalla de combate la tarjeta entera tenía hover y dentro
 * llevaba una pastilla por pasiva con el suyo, así que al pasar por encima de la
 * tarjeta se abrían todos los tooltips de golpe, unos encima de otros. Con el
 * combinador de hijo directo, cada tooltip solo responde a su propio envoltorio.
 */
export default function HoverTooltip({
  posicion = 'derecha',
  className = 'inline-block',
  // `style` existe para los triggers que se colocan por posición calculada, como
  // los botones del menú vertical (top y alto en % según su índice): sin él habría
  // que envolverlos en otro div solo para posicionarlos.
  style,
  contenido,
  children,
}) {
  return (
    <div className={`relative hover-envoltorio ${className}`} style={style}>
      {children}
      <div
        className={[
          'hover-contenido absolute z-40',
          POSICION_CLASES[posicion] ?? POSICION_CLASES.derecha,
        ].join(' ')}
      >
        {contenido}
      </div>
    </div>
  );
}
