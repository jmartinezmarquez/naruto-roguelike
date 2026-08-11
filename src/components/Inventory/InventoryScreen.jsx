import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';
import { nombrePersonaje } from '../common/nombres';
import { SPRITE_OBJETO, COLOR_RAREZA, ETIQUETA_RAREZA, lineasDeEfecto } from './itemSprites';

/**
 * Mochila: una sola tarjeta estrecha y centrada, estilo menú de GBA — ver
 * documentacion/28-mochila.md.
 *
 * Dos vistas, nunca las dos a la vez:
 *   1. la lista de objetos;
 *   2. la ficha de uno, con los personajes del equipo debajo de la descripción
 *      y un botón por cada uno.
 *
 * No hay paso intermedio de "elegir personaje": equipar es un solo clic desde
 * la ficha, como en Pokelike. Y al equipar o usar algo se vuelve al mapa: la
 * mochila es un gesto corto, y si hay que colocar dos objetos se abre dos
 * veces. Es a propósito — es lo que la mantiene pequeña.
 */

function encontrarObjeto(id) {
  return itemsData.objetos.find((o) => o.id === id) ?? null;
}

const ETIQUETA_TIPO = {
  consumible: 'Consumable',
  equipable: 'Equippable',
};

function SpriteObjeto({ id, className = '' }) {
  const sprite = SPRITE_OBJETO[id];
  if (!sprite) return <span className={`flex items-center justify-center ${className}`}>📦</span>;
  return (
    <img
      src={sprite}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`object-contain select-none ${className}`}
    />
  );
}

function BotonSecundario({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display text-[9px] px-3 py-2 rounded-md border border-pergamino-100/20 text-pergamino-200/60 hover:border-pergamino-100/40 hover:text-pergamino-100 transition-colors"
    >
      {children}
    </button>
  );
}

/** Vista 1: la lista. Sprite, nombre y rareza — nada más, la ficha ya cuenta el resto. */
function ListaObjetos({ entradas, onElegir }) {
  if (entradas.length === 0) {
    return <p className="text-[9px] text-pergamino-200/50 py-2">The bag is empty.</p>;
  }

  return (
    <div className="flex flex-col gap-1 max-h-[46vh] overflow-y-auto">
      {entradas.map((entrada) => (
        <button
          key={entrada.clave}
          type="button"
          onClick={() => onElegir(entrada.clave)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-pergamino-100/5 hover:bg-pergamino-100/12 transition-colors text-left"
        >
          <SpriteObjeto id={entrada.objeto.id} className="w-7 h-7 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-display text-pergamino-100 truncate">
              {entrada.objeto.nombre}
            </span>
            <span className={`block text-[8px] ${COLOR_RAREZA[entrada.objeto.rareza] ?? ''}`}>
              {ETIQUETA_RAREZA[entrada.objeto.rareza] ?? entrada.objeto.rareza}
              {entrada.equipadoPor && ` · ${nombrePersonaje(entrada.equipadoPor)}`}
            </span>
          </span>
          {entrada.cantidad > 1 && (
            <span className="text-[9px] text-pergamino-200/60 shrink-0">x{entrada.cantidad}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Vista 2: la ficha del objeto, con un personaje por fila y su botón. */
function FichaObjeto({ entrada, equipo, obtenerHpMaximo, onAplicar, onDesequipar }) {
  const objeto = entrada.objeto;
  const esConsumible = objeto.tipo === 'consumible';
  const efectos = lineasDeEfecto(objeto);
  // Id del personaje a quien se le iba a equipar algo teniendo ya otra cosa
  // puesta. Equipar encima devuelve el objeto anterior a la mochila, y eso no
  // se ve venir desde una fila con un botón: mejor pararlo y decirlo.
  const [confirmandoEn, setConfirmandoEn] = useState(null);
  const personajeAConfirmar = equipo.find((p) => p.id === confirmandoEn) ?? null;

  function alPulsar(personaje) {
    if (!esConsumible && personaje.objetoEquipadoId) setConfirmandoEn(personaje.id);
    else onAplicar(entrada, personaje.id);
  }

  if (personajeAConfirmar) {
    const objetoSaliente = encontrarObjeto(personajeAConfirmar.objetoEquipadoId);
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <SpriteObjeto id={objeto.id} className="w-12 h-12 shrink-0" />
          <p className="font-display text-[11px] text-pergamino-100 leading-tight">{objeto.nombre}</p>
        </div>
        <p className="text-[9px] text-pergamino-200/70 leading-relaxed border-t border-pergamino-100/10 pt-3">
          <span className="text-pergamino-100">{nombrePersonaje(personajeAConfirmar.id)}</span> is
          already carrying{' '}
          <span className="text-pergamino-100">{objetoSaliente?.nombre ?? 'another item'}</span>.
          It goes back to the bag.
        </p>
        <div className="flex justify-end gap-2">
          <BotonSecundario onClick={() => setConfirmandoEn(null)}>Cancel</BotonSecundario>
          <button
            type="button"
            onClick={() => onAplicar(entrada, personajeAConfirmar.id)}
            className="font-display text-[9px] px-3 py-2 rounded-md bg-sello-600 text-pergamino-100 hover:bg-sello-500 transition-colors"
          >
            Replace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SpriteObjeto id={objeto.id} className="w-14 h-14 shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-[11px] text-pergamino-100 leading-tight">{objeto.nombre}</p>
          <p className="text-[8px] mt-1 flex items-center gap-1.5">
            <span className={COLOR_RAREZA[objeto.rareza] ?? ''}>
              {ETIQUETA_RAREZA[objeto.rareza] ?? objeto.rareza}
            </span>
            <span className="text-pergamino-200/40">•</span>
            <span className="text-pergamino-200/70">{ETIQUETA_TIPO[objeto.tipo] ?? objeto.tipo}</span>
          </p>
          {efectos.map((efecto) => (
            <p
              key={efecto.texto}
              className={`text-[9px] font-display mt-1 ${efecto.positivo ? 'text-fuuton' : 'text-sello-500'}`}
            >
              {efecto.icono} {efecto.texto}
            </p>
          ))}
        </div>
      </div>

      <p className="text-[8px] text-pergamino-200/60 leading-relaxed">{objeto.descripcion}</p>

      {entrada.equipadoPor ? (
        <div className="flex items-center justify-between gap-2 border-t border-pergamino-100/10 pt-3">
          <p className="text-[9px] text-pergamino-200/60">
            Worn by <span className="text-pergamino-100">{nombrePersonaje(entrada.equipadoPor)}</span>
          </p>
          <button
            type="button"
            onClick={() => onDesequipar(entrada.equipadoPor)}
            className="font-display text-[9px] px-3 py-1.5 rounded-md bg-sello-600 text-pergamino-100 hover:bg-sello-500 transition-colors shrink-0"
          >
            Unequip
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1 border-t border-pergamino-100/10 pt-3">
          {equipo.map((p) => {
            const hpMaximo = obtenerHpMaximo(p.id) ?? p.hpActual ?? 1;
            const yaLoLleva = p.objetoEquipadoId === objeto.id;
            return (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-[10px] font-display text-pergamino-100 truncate">
                    {nombrePersonaje(p.id)}
                  </span>
                  <span className="block text-[8px] text-pergamino-200/50">
                    Lv. {p.nivel}
                    {esConsumible
                      ? ` · ${p.hpActual}/${hpMaximo} HP`
                      : p.objetoEquipadoId
                        ? ` · ${encontrarObjeto(p.objetoEquipadoId)?.nombre}`
                        : ' · empty slot'}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={yaLoLleva}
                  onClick={() => alPulsar(p)}
                  className={[
                    'font-display text-[9px] px-3 py-1.5 rounded-md transition-colors shrink-0',
                    yaLoLleva
                      ? 'bg-pergamino-100/10 text-pergamino-200/40 cursor-not-allowed'
                      : 'bg-sello-600 text-pergamino-100 hover:bg-sello-500',
                  ].join(' ')}
                >
                  {yaLoLleva
                    ? 'Worn'
                    : esConsumible
                      ? 'Use'
                      : p.objetoEquipadoId
                        ? 'Replace'
                        : 'Equip'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InventoryScreen() {
  const inventario = useGameStore((s) => s.inventario);
  const equipo = useGameStore((s) => s.equipo);
  const oro = useGameStore((s) => s.oro);
  const obtenerHpMaximo = useGameStore((s) => s.obtenerHpMaximo);
  const equiparObjeto = useGameStore((s) => s.equiparObjeto);
  const desequiparObjeto = useGameStore((s) => s.desequiparObjeto);
  const usarConsumible = useGameStore((s) => s.usarConsumible);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const mochilaItemId = useGameStore((s) => s.mochilaItemId);

  // Lo suelto se agrupa por id con "xN"; lo equipado va en una fila por
  // personaje, porque cada copia equipada es una cosa distinta (la lleva
  // alguien concreto y se desequipa por separado). Si solo saliera
  // `inventario`, equipar algo lo haría desaparecer de la mochila sin
  // explicación.
  const entradas = useMemo(() => {
    const sueltos = new Map();
    for (const id of inventario) {
      const objeto = encontrarObjeto(id);
      if (!objeto) continue;
      const previo = sueltos.get(id);
      if (previo) previo.cantidad += 1;
      else sueltos.set(id, { clave: `libre:${id}`, objeto, cantidad: 1, equipadoPor: null });
    }
    const equipados = equipo
      .filter((p) => p.objetoEquipadoId)
      .map((p) => {
        const objeto = encontrarObjeto(p.objetoEquipadoId);
        return objeto && { clave: `equipado:${p.id}`, objeto, cantidad: 1, equipadoPor: p.id };
      })
      .filter(Boolean);
    return [...sueltos.values(), ...equipados];
  }, [inventario, equipo]);

  // Abrir la mochila desde un objeto concreto del mapa entra directo a su ficha.
  const [claveElegida, setClaveElegida] = useState(mochilaItemId ? `libre:${mochilaItemId}` : null);
  const elegida = entradas.find((e) => e.clave === claveElegida) ?? null;

  function aplicar(entrada, idPersonaje) {
    if (entrada.objeto.tipo === 'consumible') usarConsumible(entrada.objeto.id, idPersonaje);
    else equiparObjeto(entrada.objeto.id, idPersonaje);
    volverAlMapa();
  }

  function desequipar(idPersonaje) {
    desequiparObjeto(idPersonaje);
    volverAlMapa();
  }

  // Capa encima del mapa, no una pantalla que lo sustituya: el jugador sigue
  // viendo dónde está mientras decide. Tocar fuera de la tarjeta cierra.
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-tinta-950/40 text-pergamino-100 font-body"
      onClick={volverAlMapa}
    >
      <div
        className="w-full max-w-[360px] bg-tinta-900 border-2 border-pergamino-100/15 rounded-xl p-4 flex flex-col gap-3 shadow-2xl shadow-black/60"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-naruto text-lg tracking-wide">Bag</h1>
          <p className="font-display text-[9px] text-[#e0b64a]">🪙 {oro}</p>
        </div>

        {elegida ? (
          <FichaObjeto
            entrada={elegida}
            equipo={equipo}
            obtenerHpMaximo={obtenerHpMaximo}
            onAplicar={aplicar}
            onDesequipar={desequipar}
          />
        ) : (
          <ListaObjetos entradas={entradas} onElegir={setClaveElegida} />
        )}

        <div className="flex justify-end pt-1">
          <BotonSecundario onClick={volverAlMapa}>Close</BotonSecundario>
        </div>
      </div>
    </div>
  );
}
