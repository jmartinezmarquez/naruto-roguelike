import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';
import { SPRITE_OBJETO, ETIQUETA_RAREZA, COLOR_RAREZA, lineasDeEfecto } from '../Inventory/itemSprites';
import { VentanaModal, IconoEnmarcado, BotonPrincipal, BotonSecundario } from '../common/PiezasUI';

const ETIQUETA_TIPO = {
  consumible: 'Usable item',
  equipable: 'Equippable item',
};

/**
 * La recompensa de un mini-jefe: un objeto que se puede coger o saltar.
 *
 * Va como **ventana sobre el mapa** y no a pantalla completa (ver
 * documentacion/33-direccion-visual.md): es una decisión corta que ocurre en un
 * nodo, y ver detrás dónde estás la enmarca — a diferencia del game over o de la
 * tienda, que son momentos propios de la run.
 *
 * **Sin X ni Escape** (`cerrable={false}`): las dos salidas posibles ya están en
 * pantalla como botones. Una X aquí obliga a decidir qué hace cerrar y cualquier
 * respuesta es mala — si coge, cerrar regala un objeto; si salta, Escape lo tira
 * sin avisar. Con las dos opciones delante y una sola forma de salir, la decisión
 * es explícita.
 */
export default function ItemRewardScreen() {
  const recompensa = useGameStore((s) => s.recompensaMiniJefe);
  const reclamarRecompensaMiniJefe = useGameStore((s) => s.reclamarRecompensaMiniJefe);
  const saltarRecompensaMiniJefe = useGameStore((s) => s.saltarRecompensaMiniJefe);

  if (!recompensa) return null;

  const item = itemsData.objetos.find((o) => o.id === recompensa.item);

  return (
    <VentanaModal
      titulo="Item Found"
      subtitulo="Reward for defeating the mini-boss"
      onCerrar={saltarRecompensaMiniJefe}
      ancho="max-w-sm"
      cerrable={false}
    >
      {item ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <IconoEnmarcado src={SPRITE_OBJETO[item.id]} tamano="w-24 h-24" colorMarco="border-oro/50" vacio="📦" />

          <div>
            <p className="font-display text-xs text-pergamino-100 leading-tight">{item.nombre}</p>
            <p className={`font-display text-[8px] mt-1.5 ${COLOR_RAREZA[item.rareza] ?? ''}`}>
              {ETIQUETA_RAREZA[item.rareza] ?? ''} · {ETIQUETA_TIPO[item.tipo] ?? ''}
            </p>
          </div>

          {/* Solo qué hace, no su descripción narrativa: aquí se decide si cogerlo,
              y la narrativa vive en el Bingo Book. */}
          <div className="flex flex-col gap-1">
            {lineasDeEfecto(item).map((linea) => (
              <p
                key={linea.texto}
                className={`text-[10px] leading-relaxed ${linea.positivo ? 'text-exito' : 'text-sello-500'}`}
              >
                {linea.icono} {linea.texto}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-[10px] text-pergamino-200/50 py-6">Unknown item</p>
      )}

      {/* En fila y no apilados: son las dos ramas de la MISMA decisión, y una
          debajo de la otra se leían como acción principal y enlace de escape. */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <BotonPrincipal onClick={reclamarRecompensaMiniJefe} className="elevar-hover">
          Collect
        </BotonPrincipal>
        <BotonSecundario onClick={saltarRecompensaMiniJefe} className="px-6 py-2.5">
          Skip
        </BotonSecundario>
      </div>
    </VentanaModal>
  );
}
