import { useEffect, useState } from 'react';
import { useFactorAnimacion } from '../../store/useSettingsStore';
import { reproducir } from '../common/efectosDeSonido';
import { TiraDeEfecto } from '../Combat/EfectoSprite';
import { ANIMACIONES_INVOCACION } from './animacionesInvocacion';

/**
 * La ceremonia de una tirada del gacha: un Kuchiyose montado como **planos de un mismo
 * vídeo** (documentacion/41, tanda 14), no como diapositivas. Cada plano es una tira
 * dibujada de 8 fotogramas; entre plano y plano hay un fundido corto, y la cámara se
 * acerca despacio durante toda la ceremonia y tiembla en el golpe:
 *
 *   manos → golpe → sello → columna → humo → revelación
 *
 * En la revelación el ninja sale del humo **en silueta negra y pasa a color**, de pie
 * sobre la marca, con el aura de su rareza detrás (que arranca y luego se queda en
 * bucle). Es el único momento con color: la marca y el humo son de tinta y luz neutra
 * para no destripar lo que va a salir (playtest 2026-10-16).
 *
 * En un ×10 solo se revela **el mejor premio**; los demás salen después en la lista
 * (`children`), que quien monta la ceremonia enseña al llamarse `onTerminar`.
 *
 * Un plano cuyo dibujo no existe se salta (la marca y el humo tienen respaldo en código).
 * Un clic pasa al plano siguiente, y con la velocidad instantánea de Ajustes no se ve.
 */

// La línea de suelo de la escena: el centro de la luz del suelo, en px desde abajo.
// Cada plano se ancla a ella con la fila de su fotograma que toca el suelo (`suelo`,
// medida sobre las tiras: el script de sprites conserva esa fila en los 8 fotogramas)
// y con una `escala` elegida para que el aro de la marca mida lo mismo en todos.
const SUELO = 72;
const PLANOS = [
  { fase: 'manos', anim: 'manos', ms: 1100, escala: 2, centro: true },
  { fase: 'golpe', anim: 'golpe', ms: 700, escala: 1.5, suelo: 110, sonido: 'impactoJutsu', temblor: true, tinta: true },
  { fase: 'sello', anim: 'sello', ms: 900, escala: 2, suelo: 91, sonido: 'selloInvocacion', tinta: true },
  { fase: 'columna', anim: 'columna', ms: 900, escala: 2.75, suelo: 145, sonido: 'cargaTransformacion' },
  { fase: 'humo', anim: 'humo', ms: 650, escala: 2, suelo: 154 },
];
const AURA = { escala: 1.75, suelo: 148, msEntrada: 450, msBucle: 650 };

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
const CONTORNO_TINTA = 'drop-shadow(0 0 2px rgba(232, 226, 208, 0.75)) drop-shadow(0 0 6px rgba(232, 226, 208, 0.3))';

function mejorPremio(premios) {
  return premios.reduce((mejor, p) => (ORDEN.indexOf(p.rareza) > ORDEN.indexOf(mejor.rareza) ? p : mejor), premios[0]);
}

/** Dónde anclar (px desde abajo) una tira de `lado` px para que su fila `suelo` caiga en el suelo. */
function ancla(lado, suelo, escala) {
  return SUELO + (suelo - lado / 2) * escala;
}

/** Una tira dibujada, centrada en su punto de anclaje (un padre posicionado). */
function Tira({ animacion, escala, duracion, clase = 'efecto-sprite', estilo = {} }) {
  return (
    <div style={{ transform: `scale(${escala})` }}>
      <div
        aria-hidden="true"
        className={`${clase} pointer-events-none`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: animacion.lado,
          height: animacion.lado,
          backgroundImage: `url(${animacion.src})`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          transform: 'translate(-50%, -50%)',
          '--ancho-tira': `${animacion.lado * animacion.fotogramas}px`,
          '--fotogramas': animacion.fotogramas,
          '--duracion-efecto': `${duracion}ms`,
          '--lado': `${animacion.lado}px`,
          ...estilo,
        }}
      />
    </div>
  );
}

/** El sello del suelo en SVG: el respaldo si no existe su tira dibujada. */
function SelloDibujado() {
  const radios = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg viewBox="-100 -100 200 200" className="sello-invocacion w-72 h-72" aria-hidden="true" style={{ '--color-sello': '#111111' }}>
      <circle r="92" className="trazo-sello" style={{ '--largo': 580 }} />
      <circle r="70" className="trazo-sello" style={{ '--largo': 440, animationDelay: '120ms' }} />
      {radios.map((a, i) => (
        <line key={i} x1={Math.cos(a) * 22} y1={Math.sin(a) * 22} x2={Math.cos(a) * 90} y2={Math.sin(a) * 90}
          className="trazo-sello" style={{ '--largo': 70, animationDelay: `${300 + i * 35}ms` }} />
      ))}
    </svg>
  );
}

export default function CeremoniaInvocacion({ premios, spriteDePremio, nombreDePremio, onTerminar = () => {}, children }) {
  const factor = useFactorAnimacion();
  // Solo los planos que tienen dibujo; la marca y el humo entran siempre (tienen respaldo).
  const planos = PLANOS.filter((p) => ANIMACIONES_INVOCACION[p.anim] || p.fase === 'sello' || p.fase === 'humo');
  const [indice, setIndice] = useState(factor === 0 ? planos.length + 1 : 0);
  const plano = planos[indice] ?? null;
  const fase = indice < planos.length ? plano.fase : indice === planos.length ? 'revelacion' : 'fin';
  const mejor = mejorPremio(premios);
  const color = COLOR_RAREZA[mejor.rareza];

  useEffect(() => {
    if (!plano) return undefined;
    if (plano.sonido) reproducir(plano.sonido, { duracion: (plano.ms * factor) / 1000 });
    if (plano.fase === 'humo') reproducir(mejor.rareza === 'legendario' ? 'invocacionLegendaria' : 'invocacion');
    const t = setTimeout(() => setIndice((i) => i + 1), plano.ms * factor);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  // Quien la monta enseña los resultados SOLO cuando acaba.
  useEffect(() => {
    if (fase === 'fin') onTerminar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  if (fase === 'fin') return children;

  const sprite = spriteDePremio(mejor);
  const anim = plano ? ANIMACIONES_INVOCACION[plano.anim] : null;
  const sello = ANIMACIONES_INVOCACION.sello;
  const aura = ANIMACIONES_INVOCACION[`aura${mejor.rareza[0].toUpperCase()}${mejor.rareza.slice(1)}`];
  // La marca ya trazada se queda en el suelo desde que acaba su plano.
  const selloEnElSuelo = sello && ['humo', 'revelacion'].includes(fase);

  return (
    <button
      type="button"
      onClick={() => setIndice((i) => i + 1)}
      aria-label={fase === 'revelacion' ? 'Continue' : 'Skip'}
      data-sonido="ninguno"
      className={`escena-oscura relative w-full h-[26rem] overflow-hidden rounded-sm bg-tinta-950/90 ${
        plano?.temblor || (fase === 'revelacion' && mejor.rareza === 'legendario') ? 'temblor-legendario' : ''}`}
    >
      {/* La cámara: un acercamiento lento y continuo durante toda la ceremonia, centrado
          en el suelo. Es lo que más ayuda a que los planos se lean como un vídeo. */}
      <div className="absolute inset-0 camara-invocacion" style={{ '--duracion-camara': `${planos.reduce((s, p) => s + p.ms, 0) + 1500}ms` }}>
        <div className="absolute left-1/2 w-80 h-16 rounded-[50%] suelo-invocacion"
          style={{ bottom: SUELO - 32, background: `radial-gradient(ellipse, ${COLOR_NEUTRO}40, transparent 70%)` }} />

        {selloEnElSuelo && (
          <div className="absolute left-1/2" style={{ bottom: ancla(sello.lado, 91, 2), filter: CONTORNO_TINTA, opacity: 0.85 }}>
            <Tira animacion={sello} escala={2} duracion={0} clase="" estilo={{ backgroundPosition: `${-3 * sello.lado}px 0` }} />
          </div>
        )}

        {plano && (anim ? (
          // Un fundido corto al entrar cada plano: tapa el salto entre tiras.
          <div key={plano.fase} className="absolute left-1/2 aparecer-plano"
            style={plano.centro
              ? { top: '42%' }
              : { bottom: ancla(anim.lado, plano.suelo, plano.escala), filter: plano.tinta ? CONTORNO_TINTA : undefined }}>
            <Tira animacion={anim} escala={plano.escala} duracion={plano.ms} />
          </div>
        ) : plano.fase === 'sello' ? (
          <div className="absolute left-1/2 bottom-2 sello-sube">
            <div style={{ transform: 'perspective(600px) rotateX(62deg)' }}><SelloDibujado /></div>
          </div>
        ) : (
          <div className="absolute left-1/2 top-1/2"><div style={{ transform: 'scale(4)' }}><TiraDeEfecto nombre="humo" /></div></div>
        ))}

        {fase === 'revelacion' && (
          <>
            {mejor.rareza === 'legendario' && <div className="absolute inset-0 destello-legendario pointer-events-none" />}
            {aura && (
              <div className="absolute left-1/2" style={{ bottom: ancla(aura.lado, AURA.suelo, AURA.escala) }}>
                <Tira animacion={aura} escala={AURA.escala} duracion={AURA.msEntrada} clase="tira-aura"
                  estilo={{ '--ms-entrada': `${AURA.msEntrada}ms`, '--ms-bucle': `${AURA.msBucle}ms` }} />
              </div>
            )}
            {/* El ninja de pie sobre la marca, a ×2; sale del humo en silueta y pasa a color. */}
            <div className="absolute left-1/2 -translate-x-1/2 w-48 h-48" style={{ bottom: SUELO - 36 }}>
              {sprite && <img src={sprite} alt="" className="w-48 h-48 object-contain silueta-a-color" style={{ imageRendering: 'pixelated' }} />}
            </div>
          </>
        )}
      </div>

      {fase === 'revelacion' && (
        <div className="absolute top-6 inset-x-0 flex flex-col items-center gap-1 aparecer-nombre">
          <p className="font-naruto text-3xl text-pergamino-100 contorno-fijo">{nombreDePremio(mejor)}</p>
          <p className="font-display text-[10px]" style={{ color }}>
            {ETIQUETA[mejor.rareza]}{DETALLE_EFECTO[mejor.efecto]?.(mejor) ?? ''}
          </p>
        </div>
      )}

      <p className="absolute bottom-2 inset-x-0 text-center text-[9px] font-display text-pergamino-200/50">
        {fase === 'revelacion' ? (premios.length > 1 ? `Click to see all ${premios.length}` : 'Click to continue') : 'Click to skip'}
      </p>
    </button>
  );
}
