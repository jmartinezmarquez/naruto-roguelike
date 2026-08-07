const POSICION_CLASES = {
  derecha: 'left-full ml-2 top-0 origin-left',
  izquierda: 'right-full mr-2 top-0 origin-right',
  abajo: 'top-full mt-2 left-1/2 -translate-x-1/2 origin-top',
  arriba: 'bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom',
};

/**
 * Envuelve cualquier trigger y muestra `contenido` al hacer hover, con CSS
 * puro (`opacity`/`scale` vía un "named group" de Tailwind, `group/hover` —
 * no choca con otros `group` que ya tenga el trigger envuelto). Mecánica
 * genérica extraída de `PersonajeHoverCard`, para no repetirla en cada sitio
 * que necesite un tooltip (objetos, nodos del mapa...).
 */
export default function HoverTooltip({
  posicion = 'derecha',
  className = 'inline-block',
  contenido,
  children,
}) {
  return (
    <div className={`relative group/hover ${className}`}>
      {children}
      <div
        className={[
          'absolute z-40 opacity-0 scale-95 pointer-events-none',
          'group-hover/hover:opacity-100 group-hover/hover:scale-100 transition-all duration-150',
          POSICION_CLASES[posicion] ?? POSICION_CLASES.derecha,
        ].join(' ')}
      >
        {contenido}
      </div>
    </div>
  );
}
