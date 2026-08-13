import itemsData from '../../data/items.json';
import { normalizarPasivas, describirPasiva } from '../../engine/passives';
import HoverTooltip from './HoverTooltip';
import { SPRITE_OBJETO } from '../Inventory/itemSprites';
import { PanelMarco } from './PiezasUI';

function encontrarObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id) ?? null;
}

const RAREZA_LABEL = {
  comun: 'Common',
  raro: 'Rare',
  legendario: 'Legendary',
};

const CATEGORIA_LABEL = {
  combate: 'Combat',
  supervivencia: 'Survival',
  riesgo: 'Risk',
  jefe: 'Boss relic',
  consumible: 'Consumable',
};

/**
 * Qué hace el objeto, en una frase.
 *
 * Casi todos los objetos lo dicen ya a través de sus pasivas, y esas frases
 * salen del catálogo (`data/passives.json`), no de aquí: así un objeto y una
 * transformación que compartan pasiva dicen exactamente lo mismo, sin dos
 * textos que mantener. Solo quedan escritos a mano los dos efectos que no son
 * pasivas de combate porque los resuelve el store.
 */
function textoEfecto(objeto) {
  if (objeto.pasivas?.length) {
    return normalizarPasivas(objeto.pasivas).map(describirPasiva).join(' ');
  }
  const efecto = objeto.efecto;
  switch (efecto?.tipo) {
    case 'curarPersonaje':
      return `Restores ${efecto.cantidad.replace('porciento', '%')} HP to the chosen character.`;
    case 'revivirUnaVez':
      return `If the carrier falls, revives with ${efecto.hpAlRevivir} HP. Consumed on activation.`;
    default:
      return '';
  }
}

const COLOR_TIPO_OBJETO = {
  consumible: 'bg-oro',
  equipable: 'bg-suiton',
};

// ⚠️ `comun` era `text-pergamino-200/70` **dentro de una caja crema**: crema sobre
// crema, así que la línea de rareza era casi invisible en la ficha de cualquier
// objeto común, y hay varios en items.json. Se arregla al pasar la tarjeta al kit
// (fondo oscuro), pero el tono se sube igualmente: era el más apagado de los tres
// para la rareza más frecuente.
const COLOR_RAREZA = {
  comun: 'text-exito',
  raro: 'text-suiton',
  legendario: 'text-sello-500',
};

export function FichaObjeto({ id, equipadoEnNombre, className = '' }) {
  const objeto = encontrarObjeto(id);
  if (!objeto) return null;

  // Del crema con texto oscuro al marco del kit: era, con su variante compacta, el
  // último resto de la paleta invertida de antes del kit — y el que habría que
  // arreglar igualmente para el modo claro, porque un fondo fijo en `pergamino-100`
  // se vuelve texto en cuanto el token se invierte.
  return (
    <PanelMarco className={`text-left ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[11px] text-pergamino-100 flex items-center gap-1.5 min-w-0">
          {SPRITE_OBJETO[objeto.id] && (
            <img src={SPRITE_OBJETO[objeto.id]} alt="" aria-hidden="true" className="w-6 h-6 object-contain shrink-0" />
          )}
          <span className="truncate">{objeto.nombre}</span>
        </p>
        <span
          className={`text-[8px] font-display uppercase tracking-wide text-sobre-acento rounded-sm px-2 py-0.5 shrink-0 ${COLOR_TIPO_OBJETO[objeto.tipo] ?? 'bg-tinta-800'}`}
        >
          {objeto.tipo === 'consumible' ? 'Consumable' : 'Equippable'}
        </span>
      </div>
      <p className={`text-[9px] font-display uppercase tracking-wide mt-1 ${COLOR_RAREZA[objeto.rareza] ?? ''}`}>
        {RAREZA_LABEL[objeto.rareza] ?? objeto.rareza}
        {CATEGORIA_LABEL[objeto.categoria] && ` · ${CATEGORIA_LABEL[objeto.categoria]}`}
      </p>
      {/* Sin `objeto.descripcion`: el texto narrativo no cambia ninguna decisión
          y va a la enciclopedia (punto 10 del roadmap). En la tarjeta solo el
          efecto, que es lo accionable. */}
      {textoEfecto(objeto) && (
        <p className="text-[9px] text-pergamino-200/80 font-display mt-2 pt-2 border-t border-marco leading-relaxed">
          {textoEfecto(objeto)}
        </p>
      )}
      {equipadoEnNombre && (
        <p className="text-[9px] text-suiton font-display mt-1.5">Equipped on {equipadoEnNombre}</p>
      )}
    </PanelMarco>
  );
}

/**
 * Variante de una sola línea: "Nombre: efecto". Es la que usa la rejilla de
 * sprites del mapa, donde la tarjeta completa (rareza, tipo, equipado-en) era
 * una ventana enorme para un icono de 28 px.
 */
export function FichaObjetoCompacta({ id, className = '' }) {
  const objeto = encontrarObjeto(id);
  if (!objeto) return null;

  return (
    <PanelMarco className={className}>
      <p className="text-[9px] text-pergamino-200/80 leading-snug">
        <span className="font-display text-pergamino-100">{objeto.nombre}:</span>{' '}
        {textoEfecto(objeto)}
      </p>
    </PanelMarco>
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
        <FichaObjetoCompacta id={id} className="w-48 shadow-xl px-2.5 py-2" />
      ) : (
        <FichaObjeto id={id} equipadoEnNombre={equipadoEnNombre} className="w-56 shadow-xl p-3" />
      )}
    >
      {children}
    </HoverTooltip>
  );
}
