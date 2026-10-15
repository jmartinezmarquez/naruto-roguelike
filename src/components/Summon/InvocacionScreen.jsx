import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAchievementsStore, CATALOGO_INVOCACION } from '../../store/useAchievementsStore';
import { tiradasParaGarantia } from '../../engine/invocacion';
import invocacionData from '../../data/invocacion.json';
import itemsData from '../../data/items.json';
import { spriteDeLuchador } from '../common/characterSprites';
import { nombrePersonaje } from '../common/nombres';
import { SPRITE_OBJETO, COLOR_RAREZA, BORDE_RAREZA, ETIQUETA_RAREZA } from '../Inventory/itemSprites';
import { PanelMarco, VentanaModal, TituloBloque } from '../common/PiezasUI';

/**
 * El gacha, "Summon" (documentacion/42 §2). Ventana sobre el Home, como Missions o el
 * Hall of Fame: es meta-progresión, se usa entre partidas.
 *
 * ⚠️ **Las reglas a la vista**: probabilidades, garantías con su contador y qué hace
 * un repetido. Es la misma regla que los eventos con azar (documentacion/35):
 * esconderlas no es tensión, es una trampa. Por eso también se enseña el catálogo
 * entero, con lo que aún no tienes en silueta.
 */

const NOMBRE_OBJETO = Object.fromEntries(itemsData.objetos.map((o) => [o.id, o.nombre]));

function spriteDePremio(premio) {
  return premio.tipo === 'objeto' ? SPRITE_OBJETO[premio.id] : spriteDeLuchador(premio.id);
}

function nombreDePremio(premio) {
  if (premio.tipo === 'objeto') return NOMBRE_OBJETO[premio.id] ?? premio.id;
  if (premio.tipo === 'pagina') return `Page: ${nombrePersonaje(premio.id)}`;
  return nombrePersonaje(premio.id);
}

const QUE_ES_NUEVO = { personaje: 'Starter', objeto: 'Starting item', pagina: 'Bingo Book page' };

/**
 * Una página se dibuja con el sprite del ninja **sobre un papel**: con el sprite solo
 * no se distinguía de ese mismo ninja como inicial, y en la colección hay los dos.
 */
function FondoDePremio({ premio, children }) {
  if (premio.tipo !== 'pagina') return children;
  return <div className="w-full h-full flex items-center justify-center rounded-sm bg-[#e8d9b0]/85 border border-[#8a6d3b]">{children}</div>;
}

function porcentaje(p) {
  return `${Math.round(p * 100)}%`;
}

function TextoEfecto({ premio }) {
  if (premio.efecto === 'nuevo') {
    return <p className="font-display text-[8px] text-oro">NEW! {QUE_ES_NUEVO[premio.tipo]}</p>;
  }
  if (premio.efecto === 'nivel') return <p className="font-display text-[8px] text-exito">Ninja Lv.{premio.nivel}</p>;
  return <p className="font-display text-[8px] text-pergamino-200/70">+{premio.cantidad} scrolls</p>;
}

function TarjetaPremio({ premio }) {
  const sprite = spriteDePremio(premio);
  return (
    <div className={`flex flex-col items-center gap-1 p-2 border-2 rounded-sm bg-tinta-950/40 ${BORDE_RAREZA[premio.rareza]}`}>
      <div className="w-14 h-14 flex items-center justify-center">
        <FondoDePremio premio={premio}>
          {sprite && <img src={sprite} alt="" className="max-w-full max-h-full" style={{ imageRendering: 'pixelated' }} />}
        </FondoDePremio>
      </div>
      <p className="font-display text-[8px] text-pergamino-100 text-center leading-tight">{nombreDePremio(premio)}</p>
      <p className={`font-display text-[7px] ${COLOR_RAREZA[premio.rareza]}`}>{ETIQUETA_RAREZA[premio.rareza]}</p>
      <TextoEfecto premio={premio} />
    </div>
  );
}

function BotonInvocar({ numero, precio, saldo, onInvocar }) {
  const alcanza = saldo >= precio;
  return (
    <button
      type="button"
      disabled={!alcanza}
      onClick={() => onInvocar(numero)}
      className={[
        'px-5 py-2 rounded-full font-display text-[10px] border transition-colors',
        alcanza
          ? 'elevar-hover bg-sello-600 hover:bg-sello-500 border-sello-500/50 text-sobre-sello'
          : 'bg-tinta-950/40 border-marco text-pergamino-200/40 cursor-not-allowed',
      ].join(' ')}
    >
      Summon ×{numero} · {precio} scrolls
    </button>
  );
}

export default function InvocacionScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const saldo = useAchievementsStore((s) => s.pergaminos.saldo);
  const estado = useAchievementsStore((s) => s.invocacion);
  useAchievementsStore((s) => s.logrosDesbloqueados);
  const [ultimos, setUltimos] = useState(null);

  const reglas = invocacionData;
  const garantia = tiradasParaGarantia(estado, reglas);
  const personajes = useAchievementsStore.getState().personajesInicialesExtra();
  const objetos = useAchievementsStore.getState().objetosInicialesDesbloqueados();
  const listas = { personaje: personajes, objeto: objetos, pagina: estado.paginas ?? [] };
  const tiene = (e) => listas[e.tipo].includes(e.id);
  const conseguidos = CATALOGO_INVOCACION.filter(tiene).length;

  function invocar(numero) {
    const premios = useAchievementsStore.getState().invocar(numero);
    if (premios) setUltimos(premios);
  }

  return (
    <VentanaModal titulo="Summon" subtitulo={`${saldo} summoning scrolls`} onCerrar={volverAlMapa} ancho="max-w-2xl">
      <div className="p-4 flex flex-col gap-4">
        <PanelMarco esquinas={false} className="px-4 py-3 flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <BotonInvocar numero={1} precio={reglas.precioTirada} saldo={saldo} onInvocar={invocar} />
            <BotonInvocar numero={10} precio={reglas.precioDiez} saldo={saldo} onInvocar={invocar} />
          </div>
          <p className="text-[9px] text-pergamino-200/80">
            <span className={COLOR_RAREZA.comun}>Common {porcentaje(reglas.probabilidades.comun)}</span>
            {' · '}
            <span className={COLOR_RAREZA.raro}>Rare {porcentaje(reglas.probabilidades.raro)}</span>
            {' · '}
            <span className={COLOR_RAREZA.legendario}>Legendary {porcentaje(reglas.probabilidades.legendario)}</span>
          </p>
          <p className="text-[9px] text-pergamino-200/70 leading-relaxed">
            Rare or better guaranteed within <span className="text-pergamino-100">{garantia.raro}</span> summons ·
            Legendary within <span className="text-pergamino-100">{garantia.legendario}</span>.
            <br />
            A repeated ninja gains +1 Ninja Lv. A repeated item or page gives back {reglas.reembolsoDuplicado} scrolls.
          </p>
        </PanelMarco>

        {ultimos && (
          <div className="flex flex-col gap-2">
            <TituloBloque>Summoned</TituloBloque>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ultimos.map((premio, i) => <TarjetaPremio key={`${premio.id}-${i}`} premio={premio} />)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <TituloBloque>Collection {conseguidos}/{CATALOGO_INVOCACION.length}</TituloBloque>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
            {CATALOGO_INVOCACION.map((entrada) => {
              const abierto = tiene(entrada);
              const sprite = spriteDePremio(entrada);
              return (
                <div
                  key={`${entrada.tipo}-${entrada.id}`}
                  title={abierto ? nombreDePremio(entrada) : `??? (${ETIQUETA_RAREZA[entrada.rareza]})`}
                  className={`aspect-square flex items-center justify-center border rounded-sm ${BORDE_RAREZA[entrada.rareza]}`}
                >
                  <FondoDePremio premio={entrada}>
                    {sprite && (
                      <img
                        src={sprite}
                        alt={abierto ? nombreDePremio(entrada) : '???'}
                        className={`max-w-[85%] max-h-[85%] ${abierto ? '' : 'brightness-0 opacity-60'}`}
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                  </FondoDePremio>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </VentanaModal>
  );
}
