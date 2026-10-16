import { useEffect, useState } from 'react';
import { useFactorAnimacion } from '../../store/useSettingsStore';
import { reproducir } from '../common/efectosDeSonido';
import { TiraDeEfecto } from '../Combat/EfectoSprite';

/**
 * La ceremonia de una tirada del gacha, como un Kuchiyose de la serie: el sello de
 * invocación se dibuja en el suelo, estalla una nube de humo y de ella salen los
 * premios. Tres fases —`sello`, `humo`, `revelado`— y quien la monta pinta los premios
 * en la última (`children`).
 *
 * ⚠️ **El color del sello avisa de lo mejor que va a salir** (verde, azul, morado),
 * como el destello de los gachas de verdad: la emoción está en ver el color antes que
 * el premio. No es esconder información — las probabilidades siguen a la vista en la
 * pantalla —, es el orden en que se cuenta.
 *
 * Un clic la salta, y con la velocidad de animación "instantánea" de Ajustes no se ve:
 * quien tira cincuenta veces no quiere cincuenta ceremonias enteras.
 */

const MS_SELLO = 1100;
const MS_HUMO = 520;

const COLOR_SELLO = { comun: '#7cbf5a', raro: '#4f9dd9', legendario: '#b07cd9' };
const ORDEN = ['comun', 'raro', 'legendario'];

function mejorRareza(premios) {
  return premios.reduce((mejor, p) => (ORDEN.indexOf(p.rareza) > ORDEN.indexOf(mejor) ? p.rareza : mejor), 'comun');
}

/** El sello del suelo: círculos y radios que se trazan solos (SVG, sin sprite). */
function SelloDeInvocacion({ color }) {
  const radios = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg viewBox="-100 -100 200 200" className="sello-invocacion w-72 h-72" aria-hidden="true"
      style={{ '--color-sello': color }}>
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
      {/* Las marcas de escritura entre los dos anillos: trazos cortos, no letras. */}
      {radios.map((a, i) => (
        <rect key={`m${i}`} x={Math.cos(a + 0.26) * 80 - 3} y={Math.sin(a + 0.26) * 80 - 3} width="6" height="6"
          className="marca-sello" style={{ animationDelay: `${650 + i * 25}ms` }} />
      ))}
    </svg>
  );
}

export default function CeremoniaInvocacion({ premios, children }) {
  const factor = useFactorAnimacion();
  const [fase, setFase] = useState(factor === 0 ? 'revelado' : 'sello');
  const rareza = mejorRareza(premios);

  useEffect(() => {
    if (fase === 'sello') {
      reproducir('selloInvocacion', { duracion: (MS_SELLO * factor) / 1000 });
      const t = setTimeout(() => setFase('humo'), MS_SELLO * factor);
      return () => clearTimeout(t);
    }
    if (fase === 'humo') {
      reproducir(rareza === 'legendario' ? 'invocacionLegendaria' : 'invocacion');
      const t = setTimeout(() => setFase('revelado'), MS_HUMO * factor);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [fase, factor, rareza]);

  if (fase === 'revelado') return children;

  return (
    <button
      type="button"
      onClick={() => setFase('revelado')}
      aria-label="Skip"
      data-sonido="ninguno"
      className="escena-oscura relative w-full h-80 flex items-center justify-center overflow-hidden bg-tinta-950/80 border border-marco rounded-sm"
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '600px' }}>
        <div style={{ transform: 'rotateX(58deg)' }}>
          <SelloDeInvocacion color={COLOR_SELLO[rareza]} />
        </div>
      </div>
      {fase === 'humo' && (
        <div className="absolute left-1/2 top-1/2" style={{ transform: 'scale(4)' }}>
          <TiraDeEfecto nombre="humo" />
        </div>
      )}
      <p className="absolute bottom-3 text-[9px] font-display text-pergamino-200/50">Summoning… (click to skip)</p>
    </button>
  );
}
