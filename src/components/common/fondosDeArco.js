// Fondo de la columna central del mapa, uno por arco — recortado de
// `assets/map-column-backgrounds.png` (hoja de referencia con las 4 columnas
// etiquetadas; los recortes limpios viven en `assets/map-columns/*.png`).
// La clave es el `id` del arco, así que un arco sin entrada simplemente se queda
// con la columna negra en vez de romperse.
//
// Lo usan el mapa y la pantalla de transición entre arcos, que enseña el del arco
// que viene: es la primera vez que el jugador ve el sitio al que va.

import fondoColumnaOlas from '../../assets/map-columns/pais_de_las_olas.png';
import fondoColumnaChunin from '../../assets/map-columns/examen_chunin.png';
import fondoColumnaPain from '../../assets/map-columns/invasion_de_pain.png';

export const FONDO_COLUMNA = {
  pais_de_las_olas: fondoColumnaOlas,
  examen_chunin: fondoColumnaChunin,
  invasion_de_pain: fondoColumnaPain,
};
