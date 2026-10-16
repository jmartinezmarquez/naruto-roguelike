import { useEffect, useState } from 'react';
import { useFactorAnimacion } from '../../store/useSettingsStore';
import { reproducir } from '../common/efectosDeSonido';
import { TiraDeEfecto } from '../Combat/EfectoSprite';
import { ANIMACIONES_INVOCACION } from './animacionesInvocacion';

/**
 * La ceremonia de una tirada del gacha, como un Kuchiyose de la serie y con el ritmo
 * de la pantalla de transformación:
 *
 *   1. `sello`     — la marca de invocación sale del suelo y se carga de luz.
 *   2. `humo`      — estalla una nube de humo enorme.
 *   3. `revelacion`— en el centro, en grande, **el mejor premio de la tanda** con su
 *                    nombre y su rareza. En un ×10 solo se revela ese; los demás salen
 *                    después en la lista (`children`), que es lo que pidió el playtest:
 *                    diez revelaciones seguidas se vuelven un trámite.
 *
 * ⚠️ **El color del sello avisa de lo mejor que va a salir** (verde, azul, morado),
 * como el destello de los gachas: la emoción está en ver el color antes que el premio.
 * Las probabilidades siguen a la vista en la pantalla; esto es solo el orden en que se
 * cuenta.
 *
 * Usa las animaciones dibujadas (`assets/effects/sello-invocacion.png`,
 * `humo-invocacion.png`, hojas 72-73 del documento 41) si existen, y si no el sello
 * en SVG y el humo del relevo ampliado. Un clic pasa a la fase siguiente, y con la
 * velocidad instantánea de Ajustes no se ve.
 */

const MS_MANOS = 1100;
const MS_SELLO = 1300;
const MS_HUMO = 650;

// El color de la rareza SOLO sale en la revelación: el sello y la luz del suelo son
// neutros, para no destripar lo que va a salir (playtest 2026-10-16).
const COLOR_RAREZA = { comun: '#7cbf5a', raro: '#4f9dd9', legendario: '#D4A93A' };
const COLOR_NEUTRO = '#e8e2d0';
const ORDEN = ['comun', 'raro', 'legendario'];
const ETIQUETA = { comun: 'Common', raro: 'Rare', legendario: 'Legendary' };
const DETALLE_EFECTO = {
  nuevo: () => ' · NEW!',
  pagina: () => ' · Bingo Book page',
  nivel: (p) => ` · Ninja Lv.${p.nivel}`,
  pergaminos: (p) => ` · +${p.cantidad} scrolls`,
};

function mejorPremio(premios) {
  return premios.reduce((mejor, p) => (ORDEN.indexOf(p.rareza) > ORDEN.indexOf(mejor.rareza) ? p : mejor), premios[0]);
}

/** El sello del suelo en SVG: el respaldo mientras no llegue su animación dibujada. */
function SelloDibujado({ color }) {
  const radios = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg viewBox="-100 -100 200 200" className="sello-invocacion w-72 h-72" aria-hidden="true" style={{ '--color-sello': color }}>
      <circle r="92" className="trazo-sello" style={{ '--largo': 580 }} />
      <circle r="70" className="trazo-sello" style={{ '--largo': 440, animationDelay: '120ms' }} />
      <circle r="18" className="trazo-sello" style={{ '--largo': 115, animationDelay: '260ms' }} />
      {radios.map((a, i) => (
        <line
          key={i}
          x1={Math.cos(a) * 22} y1={Math.sin(a) * 22}
          x2={Math.cos(a) * (i % 2 ? 68 : 90)} y2={Math.sin(a) * (i % 2 ? 68 : 90)}
          className="trazo-sello"
          style={{ '--largo': 70, animationDelay: `${300 + i * 35}ms` }}
        />
      ))}
      {radios.map((a, i) => (
        <rect key={`m${i}`} x={Math.cos(a + 0.26) * 80 - 3} y={Math.sin(a + 0.26) * 80 - 3} width="6" height="6"
          className="marca-sello" style={{ animationDelay: `${650 + i * 25}ms` }} />
      ))}
    </svg>
  );
}

/** Una tira dibujada reproducida una vez, a `escala` enteros (pixel art). */
function Tira({ animacion, escala, duracion }) {
  return (
    <div style={{ transform: `scale(${escala})` }}>
      <div
        aria-hidden="true"
        className="efecto-sprite pointer-events-none"
        style={{
          width: animacion.lado,
          height: animacion.lado,
          backgroundImage: `url(${animacion.src})`,
          transform: 'translate(-50%, -50%)',
          '--ancho-tira': `${animacion.lado * animacion.fotogramas}px`,
          '--fotogramas': animacion.fotogramas,
          '--duracion-efecto': `${duracion}ms`,
        }}
      />
    </div>
  );
}

export default function CeremoniaInvocacion({ premios, spriteDePremio, nombreDePremio, onTerminar = () => {}, children }) {
  const factor = useFactorAnimacion();
  // Si están dibujados, la ceremonia abre con los sellos de manos (hoja 81).
  const [fase, setFase] = useState(factor === 0 ? 'fin' : ANIMACIONES_INVOCACION.manos ? 'manos' : 'sello');
  const mejor = mejorPremio(premios);
  const color = COLOR_RAREZA[mejor.rareza];

  useEffect(() => {
    if (fase === 'manos') {
      const t = setTimeout(() => setFase('sello'), MS_MANOS * factor);
      return () => clearTimeout(t);
    }
    if (fase === 'sello') {
      reproducir('selloInvocacion', { duracion: (MS_SELLO * factor) / 1000 });
      const t = setTimeout(() => setFase('humo'), MS_SELLO * factor);
      return () => clearTimeout(t);
    }
    if (fase === 'humo') {
      reproducir(mejor.rareza === 'legendario' ? 'invocacionLegendaria' : 'invocacion');
      const t = setTimeout(() => setFase('revelacion'), MS_HUMO * factor);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [fase, factor, mejor.rareza]);

  // Quien la monta enseña los resultados SOLO cuando acaba: verlos antes destripaba la
  // revelación (playtest 2026-10-16).
  useEffect(() => {
    if (fase === 'fin') onTerminar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  if (fase === 'fin') return children;

  const siguiente = { manos: 'sello', sello: 'humo', humo: 'revelacion', revelacion: 'fin' }[fase];
  const sprite = spriteDePremio(mejor);
  const { manos, sello, humo } = ANIMACIONES_INVOCACION;

  return (
    <button
      type="button"
      onClick={() => setFase(siguiente)}
      aria-label={fase === 'revelacion' ? 'Continue' : 'Skip'}
      data-sonido="ninguno"
      className={`escena-oscura relative w-full h-[26rem] flex items-center justify-center overflow-hidden rounded-sm bg-tinta-950/90 ${
        fase === 'revelacion' && mejor.rareza === 'legendario' ? 'temblor-legendario' : ''}`}
    >
      {/* El legendario se anuncia con un fogonazo dorado que llena la escena. */}
      {fase === 'revelacion' && mejor.rareza === 'legendario' && (
        <div className="absolute inset-0 destello-legendario pointer-events-none" />
      )}
      {/* El suelo: un óvalo de luz del color de la rareza que crece con el sello. */}
      {/* Sin `-translate-x-1/2`: la animación ya mueve el `transform`, y en Tailwind v4
          las dos cosas se suman (`translate` y `transform` son propiedades distintas),
          así que la luz salía media anchura a la izquierda del personaje. */}
      <div className="absolute left-1/2 bottom-10 w-80 h-16 rounded-[50%] suelo-invocacion"
        style={{ background: `radial-gradient(ellipse, ${COLOR_NEUTRO}40, transparent 70%)` }} />

      {fase === 'manos' && manos && (
        <div className="absolute left-1/2 top-1/2">
          <Tira animacion={manos} escala={2} duracion={MS_MANOS * factor} />
        </div>
      )}

      {fase === 'sello' && (sello ? (
        // La marca es de tinta negra (hoja 82): un contorno claro la despega del fondo
        // oscuro sin darle color, que destriparía la rareza.
        <div className="absolute left-1/2 bottom-24" style={{ filter: 'drop-shadow(0 0 2px rgba(232, 226, 208, 0.75)) drop-shadow(0 0 6px rgba(232, 226, 208, 0.3))' }}>
          <Tira animacion={sello} escala={2} duracion={MS_SELLO * factor} />
        </div>
      ) : (
        <div className="absolute left-1/2 bottom-2 sello-sube">
          <div style={{ transform: 'perspective(600px) rotateX(62deg)' }}><SelloDibujado color="#111111" /></div>
        </div>
      ))}

      {fase === 'humo' && (
        <div className="absolute left-1/2 top-1/2">
          {humo
            ? <Tira animacion={humo} escala={2} duracion={MS_HUMO * factor} />
            : <div style={{ transform: 'scale(4)' }}><TiraDeEfecto nombre="humo" /></div>}
        </div>
      )}

      {fase === 'revelacion' && (
        <div className="relative flex flex-col items-center gap-2">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] w-96 h-96 rayos-invocacion" style={{ '--color-sello': color }} />
          {/* ×3 exacto del lienzo de 96 px: el pixel art a escala entera. */}
          <div className="relative w-72 h-72 flex items-center justify-center entrada-transformado">
            {sprite && <img src={sprite} alt="" className="w-72 h-72 object-contain" style={{ imageRendering: 'pixelated' }} />}
          </div>
          <p className="relative font-naruto text-2xl text-pergamino-100 contorno-fijo">{nombreDePremio(mejor)}</p>
          <p className="relative font-display text-[10px]" style={{ color }}>
            {ETIQUETA[mejor.rareza]}{DETALLE_EFECTO[mejor.efecto]?.(mejor) ?? ''}
          </p>
        </div>
      )}

      <p className="absolute bottom-2 text-[9px] font-display text-pergamino-200/50">
        {fase === 'revelacion' ? (premios.length > 1 ? `Click to see all ${premios.length}` : 'Click to continue') : 'Click to skip'}
      </p>
    </button>
  );
}
