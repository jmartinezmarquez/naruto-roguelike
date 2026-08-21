import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore, PASOS_VOLUMEN } from '../../store/useSettingsStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { VentanaModal, TituloBloque, BotonSecundario } from '../common/PiezasUI';

/**
 * Ajustes (punto 14 del roadmap — ver documentacion/34-ajustes.md).
 *
 * Ventana sobre el mapa, como Missions y el Bingo Book: es una consulta, no un
 * momento de la run (criterio del doc 33).
 *
 * **La lista es propia, no la de la referencia.** El criterio para que una opción
 * entre: que exista algo real que activar y que un jugador quiera cambiarlo más de
 * una vez. Lo que se quedó fuera y por qué está en el punto 14 del roadmap
 * —idioma (exigiría construir i18n), efectos de clima (no existen), atajos de
 * teclado (solo hay Escape)—, y **la sección de sonido no se pinta** hasta que
 * exista el sistema: un interruptor que no hace nada es peor que no tenerlo.
 */

function hayPantallaCompleta() {
  return Boolean(document.fullscreenElement);
}

/** Una fila de ajuste: etiqueta a la izquierda, control a la derecha. */
function FilaAjuste({ etiqueta, pista = null, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-marco last:border-b-0">
      <div className="min-w-0">
        <p className="font-display text-[10px] text-pergamino-100 leading-relaxed">{etiqueta}</p>
        {pista && <p className="text-[8px] text-pergamino-200/50 leading-relaxed mt-1">{pista}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/**
 * Interruptor cuadrado que se rellena, como los de la referencia. Cuadrado y no
 * un switch redondeado: un switch es de interfaz de móvil y esto quiere parecerse
 * a un menú de GBA.
 */
function Interruptor({ activo, onCambiar, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onCambiar(!activo)}
      className={[
        'w-6 h-6 border-2 flex items-center justify-center transition-colors',
        activo ? 'bg-oro border-oro' : 'bg-tinta-950 border-marco hover:border-pergamino-200/50',
      ].join(' ')}
    >
      {activo && <span className="w-2.5 h-2.5 bg-sobre-acento" />}
    </button>
  );
}

/** Selector de entre dos o tres opciones, en el mismo idioma que `FilaPestanas`. */
function SelectorOpciones({ opciones, valor, onCambiar, etiqueta }) {
  return (
    <div className="flex gap-1" role="group" aria-label={etiqueta}>
      {opciones.map((opcion) => {
        const activa = opcion.id === valor;
        return (
          <button
            key={opcion.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(opcion.id)}
            className={[
              'font-display text-[9px] px-2.5 py-1.5 rounded-sm border transition-colors',
              activa
                ? 'border-oro text-oro bg-oro/10'
                : 'border-marco text-pergamino-200/55 hover:border-pergamino-200/50 hover:text-pergamino-100',
            ].join(' ')}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsScreen() {
  const volverAlMapa = useGameStore((s) => s.volverAlMapa);
  const tema = useSettingsStore((s) => s.tema);
  const velocidadCombate = useSettingsStore((s) => s.velocidadCombate);
  const saltarTransformacion = useSettingsStore((s) => s.saltarTransformacion);
  const volumenMusica = useSettingsStore((s) => s.volumenMusica);
  const cambiarAjuste = useSettingsStore((s) => s.cambiarAjuste);
  const reiniciarLogros = useAchievementsStore((s) => s.reiniciarLogros);

  // Pantalla completa se muda aquí desde el menú del mapa: el engranaje que la
  // abría era un apaño (la maqueta lo dibujó como "ajustes") y este es su sitio.
  // El estado se sigue del evento del navegador porque se puede salir con F11 o
  // con Escape sin pasar por este botón.
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  useEffect(() => {
    const actualizar = () => setPantallaCompleta(hayPantallaCompleta());
    actualizar();
    document.addEventListener('fullscreenchange', actualizar);
    return () => document.removeEventListener('fullscreenchange', actualizar);
  }, []);

  function alternarPantallaCompleta(quiere) {
    if (quiere) document.documentElement.requestFullscreen();
    else if (hayPantallaCompleta()) document.exitFullscreen();
  }

  // ⚠️ Con ventana del juego y no con `window.confirm`. Era el último diálogo del
  // navegador que quedaba, y estaba en **la acción más destructiva de todas**: la
  // única que borra algo que no se puede volver a conseguir jugando una run.
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);

  return (
    <>
    <VentanaModal titulo="Settings" onCerrar={volverAlMapa} ancho="max-w-md">
      <section className="flex flex-col gap-1">
        <TituloBloque>Display</TituloBloque>
        {/* Sin `pista`: DARK / LIGHT se explican solos. La descripción solo se pone
            donde el control NO se entiende por su nombre — hoy, saltar la pantalla de
            transformación (que hay que saber qué te pierdes) y reiniciar la
            meta-progresión (que hay que saber qué borra). En lo demás era ruido
            debajo de cada línea. */}
        <FilaAjuste etiqueta="Theme">
          <SelectorOpciones
            etiqueta="Theme"
            valor={tema}
            onCambiar={(valor) => cambiarAjuste('tema', valor)}
            opciones={[
              { id: 'oscuro', etiqueta: 'DARK' },
              { id: 'claro', etiqueta: 'LIGHT' },
            ]}
          />
        </FilaAjuste>
        <FilaAjuste etiqueta="Fullscreen">
          <Interruptor
            etiqueta="Fullscreen"
            activo={pantallaCompleta}
            onCambiar={alternarPantallaCompleta}
          />
        </FilaAjuste>
      </section>

      <section className="flex flex-col gap-1 mt-3">
        <TituloBloque>Sound</TituloBloque>
        {/* Solo música: el juego no tiene efectos de sonido a propósito, así que no
            hay un segundo control que no controle nada. Misma regla que dejó esta
            sección entera fuera hasta que hubo sistema. */}
        <FilaAjuste etiqueta="Music">
          <SelectorOpciones
            etiqueta="Music volume"
            valor={PASOS_VOLUMEN.find((p) => p.valor === volumenMusica)?.id ?? 'medio'}
            onCambiar={(id) => cambiarAjuste(
              'volumenMusica',
              PASOS_VOLUMEN.find((p) => p.id === id)?.valor ?? 0.5,
            )}
            opciones={PASOS_VOLUMEN.map(({ id, etiqueta }) => ({ id, etiqueta }))}
          />
        </FilaAjuste>
      </section>

      <section className="flex flex-col gap-1 mt-3">
        <TituloBloque>Combat</TituloBloque>
        <FilaAjuste etiqueta="Animation speed">
          <SelectorOpciones
            etiqueta="Animation speed"
            valor={velocidadCombate}
            onCambiar={(valor) => cambiarAjuste('velocidadCombate', valor)}
            opciones={[
              { id: 'normal', etiqueta: '×1' },
              { id: 'rapida', etiqueta: '×2' },
              { id: 'instantanea', etiqueta: 'INSTANT' },
            ]}
          />
        </FilaAjuste>
        <FilaAjuste
          etiqueta="Skip transformation screen"
          pista="It is the only place the game tells you a new form exists — leave it off on a first run."
        >
          <Interruptor
            etiqueta="Skip transformation screen"
            activo={saltarTransformacion}
            onCambiar={(valor) => cambiarAjuste('saltarTransformacion', valor)}
          />
        </FilaAjuste>
      </section>

      <section className="flex flex-col gap-1 mt-3">
        <TituloBloque>Progress</TituloBloque>
        <FilaAjuste
          etiqueta="Reset meta-progress"
          pista="Achievements and Bingo Book."
        >
          <BotonSecundario onClick={() => setConfirmandoReinicio(true)} className="border-sello-600/60 text-sello-500">
            RESET
          </BotonSecundario>
        </FilaAjuste>
      </section>
    </VentanaModal>

    {confirmandoReinicio && (
      <VentanaModal titulo="Reset meta-progress" onCerrar={() => setConfirmandoReinicio(false)} ancho="max-w-sm">
        <div className="flex flex-col gap-4">
          <p className="text-[10px] text-pergamino-200 leading-relaxed">
            You will lose every unlocked mission and your whole Bingo Book, and start from zero
            the next time you play.
          </p>
          <p className="text-[9px] text-sello-500 leading-relaxed border-t border-marco pt-3">
            This cannot be undone. The run in progress is not affected.
          </p>
          <div className="flex justify-end gap-2">
            <BotonSecundario onClick={() => setConfirmandoReinicio(false)}>Cancel</BotonSecundario>
            <button
              type="button"
              onClick={() => { setConfirmandoReinicio(false); reiniciarLogros(); }}
              className="font-display text-[9px] px-3 py-2 rounded-sm bg-sello-600 text-sobre-sello hover:bg-sello-500 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </VentanaModal>
    )}
    </>
  );
}
