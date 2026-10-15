// El registro de arcos: el ÚNICO sitio donde se listan los JSON de esta carpeta.
// Antes cada pantalla que necesitaba los arcos importaba los tres a mano (store,
// Home, Missions, Salón de la Fama…), así que un arco nuevo había que darlo de alta
// en seis sitios y olvidarse de uno no fallaba: el arco simplemente no salía allí.
//
// Con `import` explícitos y no `import.meta.glob` porque el simulador de balance
// (scripts/simular-combates.mjs) corre en Node sin Vite.
import paisDeLasOlas from './pais-de-las-olas.json';
import examenChunin from './examen-chunin.json';
import invasionDePain from './invasion-de-pain.json';
import persecucionDeSasuke from './persecucion-de-sasuke.json';
import rescateDeGaara from './rescate-de-gaara.json';
import hidanYKakuzu from './hidan-y-kakuzu.json';

export const ARCOS = [paisDeLasOlas, examenChunin, invasionDePain, persecucionDeSasuke, rescateDeGaara, hidanYKakuzu];

export const ARCOS_POR_ID = Object.fromEntries(ARCOS.map((arco) => [arco.id, arco]));
