import { useGameStore } from '../../store/useGameStore';
import itemsData from '../../data/items.json';
import { SPRITE_OBJETO, lineasDeEfecto } from '../Inventory/itemSprites';
import {
  PanelMarco, CabeceraPantalla, IconoEnmarcado, BotonSecundario,
} from '../common/PiezasUI';

const SHOP_FLAVOR = {
  pais_de_las_olas: 'A traveling merchant has set up shop by the roadside.',
  examen_chunin: 'A shady trader sells his wares among the trees of the Forest of Death.',
  invasion_de_pain: 'Among the ruins of Konoha, a survivor is still trying to sell what little he has left.',
};

// Etiqueta de tipo de objeto. Ya no va en colores de elemento (`fuuton`/`raiton`):
// consumible y equipable no son naturalezas de chakra, y usar esos tonos aquí era
// parte del problema que resolvieron los colores semánticos — ver
// documentacion/33-direccion-visual.md.
const TIPO_ETIQUETA = {
  consumible: { texto: 'Consumable', clase: 'bg-exito/15 text-exito border-exito/40' },
  equipable: { texto: 'Equippable', clase: 'bg-oro/15 text-oro border-oro/40' },
};

function TarjetaItem({ entrada, oro, onComprar }) {
  const item = itemsData.objetos.find((o) => o.id === entrada.id);
  if (!item) return null;

  const puedeComprar = oro >= entrada.precio;
  const etiqueta = TIPO_ETIQUETA[item.tipo];

  // El panel va SIEMPRE sólido, también si no llega el oro. La primera versión
  // usaba `tono="hueco"` más `opacity-60`, y sobre el fondo de Konoha —que tiene
  // luces y detalle— la tarjeta salía casi transparente: no se leía ni el nombre
  // del objeto. Que no puedas comprarlo no es motivo para no poder leerlo. Lo que
  // dice "no te llega" es el precio en rojo y el botón apagado, que es información
  // y no falta de contraste.
  return (
    <PanelMarco className="elevar-hover w-full flex flex-col items-center p-4">
      <IconoEnmarcado
        src={SPRITE_OBJETO[item.id]}
        tamano="w-16 h-16"
        colorMarco={puedeComprar ? 'border-oro/40' : 'border-marco'}
        vacio="📦"
      />

      <p className="font-display text-[11px] text-pergamino-100 text-center leading-tight mt-3 mb-2 min-h-[2.2rem]">
        {item.nombre}
      </p>

      {/* Qué HACE, y solo eso: la tienda es donde se decide gastar oro. La
          descripción narrativa del objeto no se enseña en ninguna tarjeta — no
          cambia ninguna decisión, y va a la enciclopedia (punto 10 del roadmap).
          Las frases salen del catálogo de pasivas, igual que en la mochila. */}
      <div className="flex flex-col gap-1 flex-1 mb-3">
        {lineasDeEfecto(item).map((linea) => (
          <p
            key={linea.texto}
            className={`text-[10px] text-center leading-relaxed ${linea.positivo ? 'text-exito' : 'text-sello-500'}`}
          >
            {linea.icono} {linea.texto}
          </p>
        ))}
      </div>

      {/* El precio va aquí, justo bajo el efecto, y no dentro del botón: es un
          dato que se compara entre las tres tarjetas antes de decidir, no la
          acción. En rojo si no da el oro, que es la única pista de por qué el
          botón está apagado. */}
      <p className={`text-[11px] font-display text-center mb-3 ${puedeComprar ? 'text-oro' : 'text-sello-500'}`}>
        {entrada.precio} gold
      </p>

      {etiqueta && (
        <span className={`inline-block text-[8px] font-display uppercase tracking-wider px-2 py-0.5 border rounded-sm mb-3 ${etiqueta.clase}`}>
          {etiqueta.texto}
        </span>
      )}

      {/* Sin `elevar-hover`: este botón vive DENTRO de la tarjeta, que ya sube
          entera al pasar por encima. Los dos a la vez dan un salto doble. */}
      <button
        type="button"
        disabled={!puedeComprar}
        onClick={onComprar}
        className="w-full py-2 text-[10px] font-display rounded-sm border border-sello-500/50 transition-colors bg-sello-600 hover:bg-sello-500 disabled:bg-tinta-800 disabled:border-marco disabled:text-pergamino-200/40 disabled:cursor-not-allowed text-sobre-sello"
      >
        Buy
      </button>
    </PanelMarco>
  );
}

export default function ShopScreen() {
  const tienda = useGameStore((s) => s.tiendaActual);
  const oro = useGameStore((s) => s.oro);
  const arcoActualDatos = useGameStore((s) => s.arcoActualDatos);
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const comprarItemTienda = useGameStore((s) => s.comprarItemTienda);

  if (!tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tinta-950 text-pergamino-100 font-body text-[10px]">
        No shop is open right now.
      </div>
    );
  }

  const flavor = SHOP_FLAVOR[arcoActualDatos?.id] ?? 'A merchant offers their wares.';

  return (
    // A pantalla completa y no como ventana: la tienda es una parada del camino,
    // un momento propio de la run, no una consulta sobre el mapa.
    <div className="min-h-screen bg-transparent text-pergamino-100 font-body flex flex-col items-center justify-center px-4 py-8 gap-5">
      {/* Sin antetítulo: "TRADING POST" encima de "SHOP" eran dos formas de decir
          lo mismo, una debajo de la otra. Y el oro se pinta como en el resto del
          juego —número y `g` en dorado, como el panel del mapa—, que es lo que hace
          que se lea como una moneda y no como una frase. */}
      <CabeceraPantalla
        titulo="Trading Post"
        contador={<span className="font-display text-oro">{oro}g</span>}
      />
      <p className="text-[10px] text-pergamino-200 italic text-center max-w-sm leading-relaxed -mt-3">
        {flavor}
      </p>

      {/* Flex con `justify-center` y ancho fijo por tarjeta, NO una rejilla de 3
          columnas: con la rejilla, al comprar un objeto los dos que quedaban se
          agarraban a las columnas 1 y 2 y el escaparate se iba a la izquierda con un
          hueco a la derecha. Así las tarjetas que queden se centran solas. */}
      <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
        {tienda.items.length > 0 ? (
          tienda.items.map((entrada) => (
            <div key={entrada.id} className="w-full sm:w-52 flex">
              <TarjetaItem
                entrada={entrada}
                oro={oro}
                onComprar={() => comprarItemTienda(entrada.id)}
              />
            </div>
          ))
        ) : (
          <p className="text-center text-pergamino-200 text-[10px] py-8">
            The merchant has nothing left to offer.
          </p>
        )}
      </div>

      {/* "Leave" es salir, no elegir, así que no lleva `elevar-hover`: el rebote se
          reserva para lo que el jugador elige. `sobreFondo` porque no está dentro de
          ningún panel: el borde fino se perdía sobre el paisaje de Konoha. */}
      <BotonSecundario onClick={volverAlMapa} sobreFondo className="tracking-widest px-8">
        LEAVE
      </BotonSecundario>
    </div>
  );
}
