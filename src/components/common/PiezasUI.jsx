import { useEffect } from 'react';

// Las piezas de interfaz que comparten todas las pantallas de menú: el marco de
// panel, la cabecera, la fila de pestañas, el icono enmarcado, la etiqueta de
// campo y los botones. Ver documentacion/33-direccion-visual.md.
//
// Existen porque cada pantalla se había escrito por su cuenta con utilidades de
// Tailwind sueltas, y el resultado eran ocho pantallas que compartían paleta pero
// ningún lenguaje: bordes de tres grosores distintos, cabeceras con tres
// jerarquías distintas y ningún sitio con las esquinas en corchete de las
// maquetas. Rediseñar pantalla a pantalla habría vuelto a producir ocho dialectos.
//
// Regla al añadir una pieza aquí: si solo la usa una pantalla, no es una pieza —
// se queda en su archivo. Esto no es una librería de componentes, es el mínimo
// común de las que ya existen.

/**
 * El marco de panel: fondo oscuro, borde fino, una línea interior a un píxel y
 * **esquinas en corchete**.
 *
 * Los corchetes son la pieza que más hace por que esto parezca un juego y no una
 * web, y van como cuatro divs y no como pseudoelementos porque hacen falta
 * cuatro: `::before` y `::after` solo dan dos, y con `border-image` no se
 * controla el grosor por esquina.
 *
 * `tono`:
 *   - `panel`  → el panel de contenido de siempre.
 *   - `hueco`  → más apagado, para lo que está bloqueado o vacío.
 *   - `activo` → corchetes en rojo de sello, para lo seleccionado.
 *
 * `esquinas={false}` quita los corchetes. **Los corchetes marcan el contenedor, no
 * cada cosa que hay dentro**: una caja con corchetes que contiene cuatro tarjetas
 * con corchetes cada una es exactamente lo que hace que un pixel art se vea
 * abarrotado. La regla: los lleva el panel de fuera; lo anidado se queda con el
 * borde fino.
 */
export function PanelMarco({ tono = 'panel', esquinas = true, className = '', children }) {
  const fondo = {
    panel: 'bg-tinta-900 border-marco',
    hueco: 'bg-tinta-950/60 border-marco/60',
    activo: 'bg-tinta-900 border-sello-600/70',
  }[tono];

  return (
    <div className={`relative border ${fondo} ${className}`}>
      <AdornoMarco esquinas={esquinas} activo={tono === 'activo'} />
      {children}
    </div>
  );
}

/**
 * La línea interior y las esquinas en corchete, sueltas del panel.
 *
 * Va aparte porque hay una caja que **no puede** ser un `PanelMarco` y sí necesita
 * el adorno: el lienzo del mapa. Ese mide exactamente `ANCHO × escala` y un `border`
 * real le comería píxeles del ancho útil, así que su marco es un `box-shadow`. Con
 * el adorno extraído, el mapa lo compone a mano sin duplicar el marcado de los
 * corchetes, que es lo que garantiza que no se separen visualmente el día que se
 * toque uno.
 *
 * El contenedor tiene que ser `relative`, y los corchetes se pintan en tamaño real
 * aunque la caja esté escalada — si el escalado fuera un `transform`, irían dentro
 * y se deformarían con él.
 */
export function AdornoMarco({ esquinas = true, activo = false }) {
  const colorCorchete = activo ? 'border-sello-500' : 'border-pergamino-200/45';
  return (
    <>
      {/* `inset-[3px]` en vez de un segundo borde en el mismo elemento: dos bordes
          concéntricos con hueco entre ellos no se pueden hacer con una sola caja. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-[3px] border border-marco/40" />
      {esquinas && [
        'top-0 left-0 border-t-2 border-l-2',
        'top-0 right-0 border-t-2 border-r-2',
        'bottom-0 left-0 border-b-2 border-l-2',
        'bottom-0 right-0 border-b-2 border-r-2',
      ].map((posicion) => (
        <span
          key={posicion}
          aria-hidden="true"
          className={`pointer-events-none absolute w-2.5 h-2.5 ${posicion} ${colorCorchete}`}
        />
      ))}
    </>
  );
}

/**
 * El botón de cerrar de una ventana: caja crema con borde negro grueso, la X
 * dibujada dentro y **un bloque de sombra sólido detrás, desplazado**. Al pasar por
 * encima la caja se levanta y el hueco con la sombra crece, así que el botón se ve
 * despegarse del panel en vez de solo cambiar de color.
 *
 * La sombra es un bloque opaco y no un `box-shadow` difuso a propósito: el
 * desenfoque es lo único de una interfaz de pixel art que no puede existir en la
 * rejilla de píxeles, y basta un `blur` para que todo el conjunto deje de parecer
 * dibujado.
 *
 * La X son **dos barras giradas**, no el carácter "✕": en `PressStart2P` sale fina
 * y desproporcionada respecto al grosor del borde, y aquí el grosor es lo que hace
 * que se lea como un botón de ventana antigua.
 */
export function BotonCerrar({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      title="Close (Esc)"
      className={`group relative w-10 h-10 shrink-0 ${className}`}
    >
      {/* La sombra va dentro de la caja del botón (no desbordando) para que no se
          salga del borde de la barra de título cuando la ventana es estrecha. */}
      {/* Los tres colores de este botón son FIJOS y no salen del tema: la cara
          crema, la sombra y la X oscuras. Es una pieza dibujada —la referencia es un
          botón de ventana antigua— y si sus colores siguieran a `tinta`/`pergamino`
          se invertiría en modo claro y dejaría de parecerse a nada. */}
      <span aria-hidden="true" className="absolute left-1 top-1 w-9 h-9 bg-sobre-acento" />
      <span
        aria-hidden="true"
        className={[
          'absolute left-0 top-0 w-9 h-9 flex items-center justify-center',
          'bg-[#EDE3CC] border-2 border-sobre-acento',
          'transition-transform duration-150 ease-out',
          'group-hover:-translate-x-0.5 group-hover:-translate-y-0.5',
          // Al pulsar se hunde hasta tocar la sombra: el recorrido completo del
          // gesto, como una tecla.
          'group-active:translate-x-1 group-active:translate-y-1',
        ].join(' ')}
      >
        <span className="absolute w-4 h-[3px] bg-sobre-acento rotate-45" />
        <span className="absolute w-4 h-[3px] bg-sobre-acento -rotate-45" />
      </span>
    </button>
  );
}

/**
 * Ventana flotante con barra de título y X, estilo sistema operativo antiguo — la
 * forma en que Pokelike abre sus pantallas de Logros y Pokédex.
 *
 * Tres cosas la definen, y las tres son a propósito:
 *
 * 1. **Se dibuja ENCIMA del mapa**, no en su lugar. El jugador no pierde de vista
 *    dónde está mientras consulta, que es justo lo que hace que consultar no
 *    interrumpa la partida. Es el mismo patrón que ya usaba la mochila.
 * 2. **La barra de título ocupa el borde de arriba** y lleva la X en su esquina.
 *    Por eso esta pieza **no usa `PanelMarco`**: su línea interior y sus esquinas
 *    en corchete cruzarían la barra de color y se pelearían con ella. La ventana
 *    es el marco; `PanelMarco` se usa para los bloques de DENTRO.
 * 3. **El scroll es del cuerpo, no de la página.** La barra de título y lo que se
 *    le pase en `cabeceraFija` (las pestañas) se quedan quietos mientras la lista
 *    corre debajo, así que nunca se pierde de vista en qué pestaña estás.
 *
 * **No se cierra al pulsar fuera**, al contrario que la mochila. Esa es pequeña y
 * de un gesto; esta es grande, se navega con pestañas y se hacen muchos clics
 * dentro, así que un clic perdido en el borde no debería tirar por tierra dónde
 * estabas. Se cierra con la X o con Escape, como cualquier ventana.
 *
 * `cerrable={false}` quita la X **y también Escape**, para las ventanas cuyo
 * contenido YA son las dos salidas posibles (la recompensa de mini-jefe: "Collect"
 * o "Skip"). Ahí una X de más no es solo redundante — obliga a decidir qué hace
 * cerrar, y cualquier respuesta es mala: si coge, cerrar regala un objeto; si
 * salta, Escape lo tira sin avisar. Quitarla deja una sola forma de salir y las dos
 * opciones a la vista.
 */
export function VentanaModal({
  titulo, subtitulo = null, onCerrar, cabeceraFija = null, ancho = 'max-w-2xl',
  cerrable = true, children,
}) {
  useEffect(() => {
    if (!cerrable) return undefined;
    function alPulsarTecla(evento) {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, [onCerrar, cerrable]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-3 py-6 bg-tinta-950/55 text-pergamino-100 font-body">
      <div
        className={`w-full ${ancho} max-h-[88vh] flex flex-col bg-tinta-900 border-2 border-marco shadow-2xl shadow-black/70`}
      >
        {/* La barra respira por arriba (`pt-5`): el título va en la fuente de
            Naruto, que es alta y con trazo grueso, y pegado al borde se leía
            apretado. Y la X va centrada VERTICALMENTE con el bloque de título
            (`items-center`), no alineada a su primera línea: con el subtítulo
            debajo, alinearla arriba la dejaba visiblemente descolgada. */}
        <div className="shrink-0 flex items-center justify-between gap-3 bg-sello-600 border-b-2 border-marco px-4 pt-5 pb-3">
          <div className="min-w-0">
            <h1 className="font-naruto contorno-fijo text-2xl leading-none text-sobre-sello">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="font-display text-[9px] text-sobre-sello/80 mt-2">{subtitulo}</p>
            )}
          </div>
          {cerrable && <BotonCerrar onClick={onCerrar} />}
        </div>

        {cabeceraFija && (
          <div className="shrink-0 border-b border-marco px-4 py-3 flex flex-col gap-2 bg-tinta-950/40">
            {cabeceraFija}
          </div>
        )}

        <div className="overflow-y-auto scroll-pixel px-4 py-4 flex flex-col gap-2.5">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Cabecera de pantalla: antetítulo en versalitas espaciadas, título grande en la
 * tipografía de Naruto y, si se le da, un contador debajo.
 *
 * Para pantallas que ocupan todo (selección de personaje, game over). Las que se
 * abren como ventana usan la barra de título de `VentanaModal` en su lugar.
 *
 * El antetítulo no es decoración: es lo que dice de qué sistema forma parte la
 * pantalla ("MISIONES" sobre "Logros", "REGISTRO" sobre "Enciclopedia"), y en las
 * maquetas es la primera línea de las dos.
 */
export function CabeceraPantalla({ antetitulo, titulo, contador = null }) {
  return (
    <header className="text-center">
      {antetitulo && (
        <p className="text-sello-500 text-[10px] tracking-[0.35em] uppercase mb-1">{antetitulo}</p>
      )}
      <h1 className="font-naruto text-4xl text-pergamino-100">
        {titulo}
      </h1>
      {contador && <p className="text-[10px] text-pergamino-200/60 mt-1">{contador}</p>}
    </header>
  );
}

/**
 * Fila de pestañas con icono opcional y su propio contador por pestaña.
 *
 * El contador por pestaña es lo que las hace útiles y no un simple filtro: en las
 * maquetas cada acto dice cuánto le queda ("ACTO 2 · 0/6"), así que la fila es a
 * la vez navegación y resumen de progreso. Una pestaña sin contador simplemente no
 * lo pinta.
 *
 * `pestanas`: `[{ id, etiqueta, icono?, contador? }]`
 */
export function FilaPestanas({ pestanas, activaId, onElegir }) {
  return (
    <nav className="flex justify-center gap-1.5 flex-wrap">
      {pestanas.map((pestana) => {
        const activa = pestana.id === activaId;
        return (
          <button
            key={pestana.id}
            type="button"
            onClick={() => onElegir(pestana.id)}
            className={[
              'font-display text-[9px] px-2.5 py-1.5 rounded-sm border flex items-center gap-1.5 transition-colors',
              activa
                ? 'border-oro text-oro bg-oro/10'
                : 'border-marco text-pergamino-200/55 hover:border-pergamino-200/50 hover:text-pergamino-100',
            ].join(' ')}
          >
            {pestana.icono && <span aria-hidden="true">{pestana.icono}</span>}
            <span>{pestana.etiqueta}</span>
            {pestana.contador && (
              <span className={activa ? 'text-oro/70' : 'text-pergamino-200/35'}>{pestana.contador}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Un sprite dentro de su propia cajita enmarcada, donde el **color del marco
 * significa algo** (rareza, naturaleza, estado). En las maquetas es lo que hace
 * que una lista de filas se lea de un vistazo sin leer ni una palabra.
 *
 * `bloqueado` lo deja en silueta: `brightness(0)` pone el dibujo entero en negro
 * conservando su transparencia, o sea la forma exacta. Un cuadrado gris habría
 * sido más fácil y no promete que ahí haya alguien.
 */
export function IconoEnmarcado({
  src, bloqueado = false, colorMarco = 'border-marco', tamano = 'w-14 h-14', vacio = '?',
}) {
  return (
    <div
      className={[
        'relative shrink-0 flex items-center justify-center border rounded-sm bg-tinta-950/70',
        tamano,
        colorMarco,
      ].join(' ')}
    >
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable="false"
          className={`w-full h-full object-contain select-none ${bloqueado ? 'opacity-40' : ''}`}
          style={bloqueado ? { filter: 'brightness(0)' } : undefined}
        />
      ) : (
        <span className="text-pergamino-200/25 font-display text-xs">{vacio}</span>
      )}
    </div>
  );
}

/**
 * La etiqueta flotante de un hover: caja oscura con **marco crema**, para una línea
 * de texto. La usan el hover de nodo del mapa y los botones del menú vertical.
 *
 * El marco crema es a propósito y no un despiste del kit: esto no es un panel de
 * contenido, es una anotación que aparece encima de otra cosa —a veces encima del
 * propio mapa— y necesita despegarse de lo que tiene debajo. Con el borde fino en
 * color de marco se perdía sobre el lienzo.
 */
export function EtiquetaFlotante({ children }) {
  return (
    <div className="bg-tinta-900 text-pergamino-100 rounded-sm border-2 border-pergamino-200/80 shadow-xl px-3 py-1.5 whitespace-nowrap">
      <p className="font-display text-[11px] leading-none">{children}</p>
    </div>
  );
}

/**
 * Rótulo en versalitas espaciadas, en dos jerarquías — y la distinción importa más
 * de lo que parece:
 *
 * - `panel` (por defecto, **crema**): el título DE una caja, lo más fuerte que hay
 *   dentro de ella. "TEAM", "ITEMS", "CHAKRA", "REWARDS".
 * - `seccion` (**rojo**): una etiqueta DENTRO de una tarjeta que ya tiene título, y
 *   subordinada a él. Es el uso de las maquetas: "AFINIDAD", "STATS BASE", "MODOS".
 *
 * La primera versión pintaba de rojo las dos cosas, y en el mapa acabó habiendo
 * cuatro rojos compitiendo —"CURRENT ARC" más los tres paneles— con el agravante de
 * que en esta paleta el rojo **ya significa algo**: es el color del mini-jefe y de
 * la derrota. Un título de panel no es una alarma.
 */
export function TituloBloque({ children, tono = 'panel', className = '' }) {
  const color = tono === 'seccion' ? 'text-sello-500' : 'text-pergamino-200/80';
  return (
    <h3 className={`font-display text-[9px] ${color} tracking-[0.2em] uppercase ${className}`}>
      {children}
    </h3>
  );
}

/** Un dato con su etiqueta: "Rareza: Legendario". La etiqueta apagada, el valor no. */
export function CampoDato({ etiqueta, children, className = '' }) {
  return (
    <p className={`text-[10px] leading-relaxed ${className}`}>
      <span className="text-pergamino-200/45">{etiqueta}: </span>
      <span className="text-pergamino-100">{children}</span>
    </p>
  );
}

/** El botón de acción de una pantalla: rojo de sello, ancho y redondeado. */
export function BotonPrincipal({ onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-6 py-2 bg-sello-600 hover:bg-sello-500 border border-sello-500/50',
        'rounded-full font-display text-[11px] text-sobre-sello transition-colors',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/**
 * El botón de "salir" o "volver atrás". Sin `.elevar-hover` a propósito: el rebote
 * va solo en lo que el jugador **elige**, no en lo que ejecuta o cierra (ver
 * documentacion/13-ui-mapa-y-combate.md).
 *
 * `sobreFondo` es obligatorio cuando el botón **no está dentro de un panel** y
 * flota sobre el fondo del juego. Su versión normal es un borde fino y texto
 * apagado, que funciona sobre `bg-tinta-900` y **desaparece** sobre el paisaje de
 * Konoha, que tiene luces y detalle por todas partes. Pasó dos veces —el "LEAVE" de
 * la tienda y el "SKIP" de reclutar— así que es una variante de la pieza y no un
 * `className` que copiar en cada sitio: la tercera vez habría vuelto a pasar.
 */
export function BotonSecundario({ onClick, children, className = '', sobreFondo = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'font-display text-[9px] px-4 py-2 rounded-sm border transition-colors',
        sobreFondo
          ? 'bg-tinta-900 border-marco text-pergamino-100 hover:bg-tinta-800 hover:border-pergamino-200/60'
          : 'border-marco text-pergamino-200/60 hover:border-pergamino-200/50 hover:text-pergamino-100',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
