// Iconos del menú que aún pueden no estar dibujados. `import.meta.glob` y no
// `import`, para que la falta del PNG no rompa el build: mientras tanto se usa un
// sprite que ya existe y se parece.
import pergaminoReserva from '../../assets/items/pergamino_reserva.png';

const MENU = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/menu/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);

/** El gacha, "Summon" (hoja 43 del documento 41; hasta entonces, un pergamino). */
export const SPRITE_INVOCACION = MENU.invocacion ?? pergaminoReserva;
