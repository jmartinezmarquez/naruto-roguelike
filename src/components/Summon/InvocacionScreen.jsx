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
import { SPRITE_INVOCACION } from '../common/iconosMenu';
import CeremoniaInvocacion from './CeremoniaInvocacion';
import { FONDO_CARTEL_INVOCACION } from './animacionesInvocacion';

/**
 * El gacha, "Summon" (documentacion/42 §2), con la forma de la referencia: a la
 * izquierda el CARTEL del contrato (título, cuánto tienes de la colección y tres
 * legendarios esperando), debajo los botones y lo que llevas, y a la derecha las
 * probabilidades y las reglas. Al tirar, el cartel se convierte en la ceremonia
 * (`CeremoniaInvocacion`) y debajo salen los premios.
 *
 * ⚠️ **Las reglas a la vista**: probabilidades, cuántos premios hay de cada rareza,
 * garantías con su contador y qué hace un repetido. Es la misma regla que los eventos
 * con azar (documentacion/35): esconderlas no es tensión, es una trampa.
 */

const NOMBRE_OBJETO = Object.fromEntries(itemsData.objetos.map((o) => [o.id, o.nombre]));
const RAREZAS = ['legendario', 'raro', 'comun'];

function spriteDePremio(premio) {
  return premio.tipo === 'objeto' ? SPRITE_OBJETO[premio.id] : spriteDeLuchador(premio.id);
}

function nombreDePremio(premio) {
  if (premio.tipo === 'objeto') return NOMBRE_OBJETO[premio.id] ?? premio.id;
  if (premio.tipo === 'pagina') return `Page: ${nombrePersonaje(premio.id)}`;
  return nombrePersonaje(premio.id);
}

const QUE_ES_NUEVO = { personaje: 'Starter', objeto: 'Starting item' };


function TextoEfecto({ premio }) {
  if (premio.efecto === 'nuevo') return <p className="font-display text-[8px] text-oro">NEW! {QUE_ES_NUEVO[premio.tipo]}</p>;
  if (premio.efecto === 'pagina') return <p className="font-display text-[8px] text-oro">NEW! Bingo Book page</p>;
  if (premio.efecto === 'nivel') return <p className="font-display text-[8px] text-exito">Ninja Lv.{premio.nivel}</p>;
  return <p className="font-display text-[8px] text-pergamino-200/70">+{premio.cantidad} scrolls</p>;
}

function TarjetaPremio({ premio, orden = 0 }) {
  const sprite = spriteDePremio(premio);
  return (
    <div
      className={`salir-del-humo flex flex-col items-center gap-1 p-2 border-2 rounded-sm bg-tinta-950/40 ${BORDE_RAREZA[premio.rareza]}`}
      style={{ animationDelay: `calc(${orden * 90}ms * var(--factor-animacion, 1))` }}
    >
      <div className="w-24 h-24 flex items-center justify-center">
        {sprite && <img src={sprite} alt="" className="w-24 h-24 object-contain" style={{ imageRendering: 'pixelated' }} />}
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
        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm border-2 font-display text-[11px] transition-colors',
        alcanza
          ? 'elevar-hover bg-sello-600 hover:bg-sello-500 border-sello-500/60 text-sobre-sello'
          : 'bg-tinta-950/50 border-marco text-pergamino-200/40 cursor-not-allowed',
      ].join(' ')}
    >
      Summon ×{numero} ·
      <img src={SPRITE_INVOCACION} alt="" aria-hidden="true" className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }} />
      {precio}
    </button>
  );
}

/** El cartel del contrato: lo que se ve antes de tirar. */
function Cartel({ conseguidos, total }) {
  const legendarios = CATALOGO_INVOCACION.filter((e) => e.tipo === 'personaje' && e.rareza === 'legendario').slice(0, 3);
  return (
    <div
      className="escena-oscura relative h-[26rem] rounded-sm overflow-hidden border border-marco"
      style={FONDO_CARTEL_INVOCACION
        ? { backgroundImage: `url(${FONDO_CARTEL_INVOCACION})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #3b2457 0%, #2a2f5c 55%, #1f4a5e 100%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-tinta-950/50 via-transparent to-transparent" />
      <div className="relative p-5">
        <h2 className="font-naruto contorno-fijo text-3xl text-oro leading-none">Summoning Contract</h2>
        <p className="font-display text-[10px] text-pergamino-100 mt-2">
          Every ninja in the Bingo Book answers the call. The legendary ones, rarely.
        </p>
        <p className="text-[9px] text-pergamino-200/70 mt-1">You have {conseguidos} of {total}</p>
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-around items-end px-4">
        {legendarios.map((e) => (
          <div key={e.id} className="flex flex-col items-center">
            {/* ×1,5 del lienzo de 96 px: a ×2 se veían demasiado pixelados. */}
            <img src={spriteDeLuchador(e.id)} alt="" aria-hidden="true" className="w-36 h-36 object-contain"
              style={{ imageRendering: 'pixelated' }} />
            <div className="w-20 h-3 -mt-4 rounded-[50%] bg-black/45" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelProbabilidades({ estado }) {
  const reglas = invocacionData;
  const garantia = tiradasParaGarantia(estado, reglas);
  const hechas = reglas.garantiaLegendario - garantia.legendario;
  return (
    <PanelMarco className="p-4 flex flex-col gap-3 h-full">
      <TituloBloque tono="seccion">Odds</TituloBloque>
      <ul className="flex flex-col">
        {RAREZAS.map((r) => (
          <li key={r} className="flex justify-between items-baseline py-1.5 border-b border-marco/50 text-[10px]">
            <span className={`font-display ${COLOR_RAREZA[r]}`}>{ETIQUETA_RAREZA[r]}</span>
            <span className="font-display text-pergamino-100">
              {Math.round(reglas.probabilidades[r] * 100)}% · {CATALOGO_INVOCACION.filter((e) => e.rareza === r).length}
            </span>
          </li>
        ))}
      </ul>
      <ul className="text-[9px] text-pergamino-200/80 leading-relaxed flex flex-col gap-1.5">
        <li>· A rare or better at least every {reglas.garantiaRaro} summons.</li>
        {reglas.diezGarantizaLegendario && <li>· Summon ×10 always brings a <span className="text-oro">legendary</span>.</li>}
        <li>· Scrolls come from bosses, won runs, missions and the daily challenge.</li>
      </ul>
      {/* El pity como barra y no como "2 / 20": lo que se quiere ver es cuánto falta. */}
      <div className="mt-auto flex flex-col gap-1">
        <p className="text-[9px] text-pergamino-200/70">Legendary guaranteed in {garantia.legendario}</p>
        <div className="h-2.5 w-full bg-tinta-950 border border-marco rounded-sm overflow-hidden"
          role="progressbar" aria-label="Legendary pity" aria-valuemin={0} aria-valuemax={reglas.garantiaLegendario} aria-valuenow={hechas}>
          <div className="h-full bg-oro transition-[width] duration-500" style={{ width: `${(hechas / reglas.garantiaLegendario) * 100}%` }} />
        </div>
      </div>
    </PanelMarco>
  );
}

export default function InvocacionScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const saldo = useAchievementsStore((s) => s.pergaminos.saldo);
  const estado = useAchievementsStore((s) => s.invocacion);
  useAchievementsStore((s) => s.logrosDesbloqueados);
  // Cada tirada lleva su número: la ceremonia se vuelve a montar (y a ver) en cada una.
  const [ultimos, setUltimos] = useState(null);
  const [tirada, setTirada] = useState(0);
  // Los resultados solo se enseñan cuando la ceremonia acaba: antes destripaban la revelación.
  const [ceremoniaVista, setCeremoniaVista] = useState(false);
  // El estado del gacha ANTES de la última tirada: el pity se enseña con él hasta que
  // acaba la ceremonia, o la barra vaciándose chivaba que había salido un legendario.
  const [estadoAntes, setEstadoAntes] = useState(null);

  const reglas = invocacionData;
  const personajes = useAchievementsStore.getState().personajesInicialesExtra();
  const objetos = useAchievementsStore.getState().objetosInicialesDesbloqueados();
  const listas = { personaje: personajes, objeto: objetos };
  const conseguidos = CATALOGO_INVOCACION.filter((e) => listas[e.tipo].includes(e.id)).length;

  function invocar(numero) {
    const antes = useAchievementsStore.getState().invocacion;
    const premios = useAchievementsStore.getState().invocar(numero);
    if (premios) {
      setUltimos(premios);
      setTirada((n) => n + 1);
      setCeremoniaVista(false);
      setEstadoAntes(antes);
    }
  }

  const cartel = <Cartel conseguidos={conseguidos} total={CATALOGO_INVOCACION.length} />;

  return (
    <VentanaModal titulo="Summon" onCerrar={volverAlMapa} ancho="max-w-5xl">
      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex flex-col gap-3">
            {ultimos ? (
              <CeremoniaInvocacion key={tirada} premios={ultimos} spriteDePremio={spriteDePremio} nombreDePremio={nombreDePremio}
                onTerminar={() => setCeremoniaVista(true)}>
                {cartel}
              </CeremoniaInvocacion>
            ) : cartel}
            <div className="flex gap-3">
              <BotonInvocar numero={1} precio={reglas.precioTirada} saldo={saldo} onInvocar={invocar} />
              <BotonInvocar numero={10} precio={reglas.precioDiez} saldo={saldo} onInvocar={invocar} />
            </div>
            <p className="text-[9px] text-pergamino-200/70 flex items-center gap-1.5">
              You have
              <img src={SPRITE_INVOCACION} alt="" aria-hidden="true" className="w-4 h-4 object-contain" style={{ imageRendering: 'pixelated' }} />
              {saldo} summoning scrolls
            </p>
          </div>
          <PanelProbabilidades estado={!ceremoniaVista && estadoAntes ? estadoAntes : estado} />
        </div>

        {/* Solo lo último que ha salido, y solo cuando la ceremonia acaba. La colección
            entera está en el Bingo Book. */}
        {ultimos && ceremoniaVista && (
          <div className="flex flex-col gap-2">
            <TituloBloque>Last summoned</TituloBloque>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ultimos.map((premio, i) => <TarjetaPremio key={`${tirada}-${premio.id}-${i}`} premio={premio} orden={i} />)}
            </div>
          </div>
        )}
      </div>
    </VentanaModal>
  );
}
