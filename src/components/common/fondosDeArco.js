// Fondo de la columna central del mapa, uno por arco — recortado de
// `assets/map-column-backgrounds.png` (hoja de referencia con las 4 columnas
// etiquetadas; los recortes limpios viven en `assets/map-columns/*.png`).
// La clave es el `id` del arco, así que un arco sin entrada simplemente se queda
// con la columna negra en vez de romperse.
//
// Lo usan el mapa y la pantalla de transición entre arcos, que enseña el del arco
// que viene: es la primera vez que el jugador ve el sitio al que va.


// Con `import.meta.glob`: la clave es el nombre del PNG, que es el id del arco, así que
// el fondo de un arco nuevo entra con solo dejarlo en la carpeta.
export const FONDO_COLUMNA = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/map-columns/*.png', { eager: true, query: '?url', import: 'default' }),
  ).map(([ruta, url]) => [ruta.split('/').pop().replace(/\.png$/, ''), url]),
);
