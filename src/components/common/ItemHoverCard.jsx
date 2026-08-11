import itemsData from '../../data/items.json';
import HoverTooltip from './HoverTooltip';
import { SPRITE_OBJETO } from '../Inventory/itemSprites';

function encontrarObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id) ?? null;
}

const STAT_NAME = {
  ataque: 'ATK',
  defensa: 'DEF',
  velocidad: 'SPD',
  hp: 'HP',
  todas: 'all stats',
};

const RAREZA_LABEL = {
  comun: 'Common',
  raro: 'Rare',
  legendario: 'Legendary',
};

function textoEfecto(efecto) {
  switch (efecto.tipo) {
    case 'curarPersonaje':
      return `Restores ${efecto.cantidad.replace('porciento', '%')} HP to the chosen character.`;
    case 'revivirUnaVez':
      return `If the carrier falls, revives with ${efecto.hpAlRevivir} HP. Consumed on activation.`;
    case 'buffEquipable':
      return `+${efecto.cantidad} ${STAT_NAME[efecto.stat] ?? efecto.stat} for whoever has it equipped.`;
    case 'curacionPostCombate':
      return `Heals ${efecto.cantidad.replace('porciento', '%')} HP to the carrier after each won battle.`;
    case 'buffYDebuffEquipable':
      return `+${efecto.buff.cantidad} ${STAT_NAME[efecto.buff.stat] ?? efecto.buff.stat}, `
        + `${efecto.debuff.cantidad} ${STAT_NAME[efecto.debuff.stat] ?? efecto.debuff.stat} for whoever has it equipped.`;
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

export function FichaObjeto({ id, equipadoEnNombre, className = '' }) {
  const objeto = encontrarObjeto(id);
  if (!objeto) return null;

  return (
    <div className={`bg-pergamino-100 text-tinta-950 rounded-lg text-left ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-bold text-sm flex items-center gap-1.5 min-w-0">
          {SPRITE_OBJETO[objeto.id] && (
            <img src={SPRITE_OBJETO[objeto.id]} alt="" aria-hidden="true" className="w-6 h-6 object-contain shrink-0" />
          )}
          <span className="truncate">{objeto.nombre}</span>
        </p>
        <span
          className={`text-[10px] uppercase tracking-wide text-pergamino-100 rounded-full px-2 py-0.5 shrink-0 ${COLOR_TIPO_OBJETO[objeto.tipo] ?? 'bg-tinta-800'}`}
        >
          {objeto.tipo === 'consumible' ? 'Consumable' : 'Equippable'}
        </span>
      </div>
      <p className={`text-[10px] uppercase tracking-wide mt-0.5 ${COLOR_RAREZA[objeto.rareza] ?? ''}`}>
        {RAREZA_LABEL[objeto.rareza] ?? objeto.rareza}
      </p>
      <p className="text-[10px] opacity-70 mt-1.5">{objeto.descripcion}</p>
      {objeto.efecto && (
        <p className="text-[10px] text-sello-600 font-display mt-1.5 pt-1.5 border-t border-tinta-950/10">
          {textoEfecto(objeto.efecto)}
        </p>
      )}
      {equipadoEnNombre && (
        <p className="text-[10px] text-suiton font-display mt-1">Equipped on {equipadoEnNombre}</p>
      )}
    </div>
  );
}

/**
 * Variante de una sola línea: "Nombre: efecto". Es la que usa la rejilla de
 * sprites del mapa, donde la tarjeta completa (rareza, tipo, descripción,
 * equipado-en) era una ventana enorme para un icono de 28 px. Cae a la
 * descripción solo si el objeto no tiene efecto mecánico que contar.
 */
export function FichaObjetoCompacta({ id, className = '' }) {
  const objeto = encontrarObjeto(id);
  if (!objeto) return null;

  const efecto = objeto.efecto ? textoEfecto(objeto.efecto) : '';

  return (
    <div className={`bg-pergamino-100 text-tinta-950 ${className}`}>
      <p className="text-[10px] leading-snug">
        <span className="font-display font-bold">{objeto.nombre}:</span>{' '}
        {efecto || objeto.descripcion}
      </p>
    </div>
  );
}

export default function ItemHoverCard({
  id,
  equipadoEnNombre,
  posicion = 'derecha',
  className = 'inline-block',
  compacto = false,
  children,
}) {
  if (!encontrarObjeto(id)) return children;

  return (
    <HoverTooltip
      posicion={posicion}
      className={className}
      contenido={compacto ? (
        <FichaObjetoCompacta id={id} className="w-48 rounded-md border-2 border-tinta-950 shadow-xl px-2 py-1.5" />
      ) : (
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
