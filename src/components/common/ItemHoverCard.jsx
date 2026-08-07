import itemsData from '../../data/items.json';
import HoverTooltip from './HoverTooltip';

function encontrarObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id) ?? null;
}

const NOMBRE_STAT = {
  ataque: 'ATQ',
  defensa: 'DEF',
  velocidad: 'VEL',
  hp: 'HP',
  todas: 'todas las stats',
};

/**
 * Texto preciso del efecto de un objeto — la descripción en prosa de
 * `items.json` ya explica QUÉ hace ("aumenta el ataque"), pero no CUÁNTO. El
 * pedido era ver el efecto exacto (cuánto cura, cuánta bonificación da), así
 * que esto complementa la descripción con el número real de `item.efecto`.
 */
function textoEfecto(efecto) {
  switch (efecto.tipo) {
    case 'curarPersonaje':
      return `Restaura ${efecto.cantidad.replace('porciento', '%')} de HP al personaje elegido.`;
    case 'revivirUnaVez':
      return `Si quien lo lleva cae, revive con ${efecto.hpAlRevivir} HP. Se consume al activarse.`;
    case 'buffEquipable':
      return `+${efecto.cantidad} ${NOMBRE_STAT[efecto.stat] ?? efecto.stat} para quien lo lleve equipado.`;
    case 'curacionPostCombate':
      return `Cura un ${efecto.cantidad.replace('porciento', '%')} de HP a quien lo lleva tras cada combate ganado.`;
    case 'buffYDebuffEquipable':
      return `+${efecto.buff.cantidad} ${NOMBRE_STAT[efecto.buff.stat] ?? efecto.buff.stat}, `
        + `${efecto.debuff.cantidad} ${NOMBRE_STAT[efecto.debuff.stat] ?? efecto.debuff.stat} para quien lo lleve equipado.`;
    default:
      return '';
  }
}

const COLOR_TIPO_OBJETO = {
  consumible: 'bg-raiton',
  equipable: 'bg-suiton',
};

const COLOR_RAREZA = {
  comun: 'text-pergamino-200/70',
  raro: 'text-suiton',
  legendario: 'text-sello-500',
};

/**
 * Ficha de un objeto (`items.json`): tipo, rareza, descripción y el efecto
 * exacto en números. `equipadoEnNombre` (opcional): si el objeto ya está
 * equipado por alguien, muestra en quién.
 */
export function FichaObjeto({ id, equipadoEnNombre, className = '' }) {
  const objeto = encontrarObjeto(id);
  if (!objeto) return null;

  return (
    <div className={`bg-pergamino-100 text-tinta-950 rounded-lg text-left ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-bold text-sm">{objeto.nombre}</p>
        <span
          className={`text-[10px] uppercase tracking-wide text-pergamino-100 rounded-full px-2 py-0.5 shrink-0 ${COLOR_TIPO_OBJETO[objeto.tipo] ?? 'bg-tinta-800'}`}
        >
          {objeto.tipo}
        </span>
      </div>
      <p className={`text-[10px] uppercase tracking-wide mt-0.5 ${COLOR_RAREZA[objeto.rareza] ?? ''}`}>
        {objeto.rareza}
      </p>
      <p className="text-[10px] opacity-70 mt-1.5">{objeto.descripcion}</p>
      {objeto.efecto && (
        <p className="text-[10px] text-sello-600 font-display mt-1.5 pt-1.5 border-t border-tinta-950/10">
          {textoEfecto(objeto.efecto)}
        </p>
      )}
      {equipadoEnNombre && (
        <p className="text-[10px] text-suiton font-display mt-1">Equipado en {equipadoEnNombre}</p>
      )}
    </div>
  );
}

/** Envuelve cualquier trigger y muestra la `FichaObjeto` completa al hacer hover — mismo patrón que `PersonajeHoverCard`. */
export default function ItemHoverCard({ id, equipadoEnNombre, posicion = 'derecha', className = 'inline-block', children }) {
  if (!encontrarObjeto(id)) return children;

  return (
    <HoverTooltip
      posicion={posicion}
      className={className}
      contenido={(
        <FichaObjeto
          id={id}
          equipadoEnNombre={equipadoEnNombre}
          className="w-56 border-2 border-sello-600 shadow-xl p-3"
        />
      )}
    >
      {children}
    </HoverTooltip>
  );
}
