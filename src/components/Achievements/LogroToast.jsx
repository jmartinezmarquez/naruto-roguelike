import { useEffect, useState } from 'react';
import { useAchievementsStore } from '../../store/useAchievementsStore';

const DURACION_VISIBLE_MS = 3000;
const DURACION_DESVANECIDO_MS = 500;

/**
 * Notificación flotante para el logro recién desbloqueado, montada en App.jsx
 * (no dentro de una pantalla concreta) para que aparezca sin importar qué se
 * esté viendo — típicamente combate, justo tras derrotar a un jefe. Consume
 * la cola notificacionesPendientes de useAchievementsStore de una en una.
 */
export default function LogroToast() {
  const notificacion = useAchievementsStore((s) => s.notificacionesPendientes[0] ?? null);
  const descartarNotificacion = useAchievementsStore((s) => s.descartarNotificacion);

  const [notificacionPrevia, setNotificacionPrevia] = useState(null);
  const [visible, setVisible] = useState(false);

  // Al cambiar la notificación (una nueva entra en cabeza de cola): se
  // vuelve a mostrar de inmediato. Ajustar esto durante el render (no en un
  // efecto) es el patrón recomendado por React para resetear estado al
  // cambiar un valor — ver el mismo patrón en CombatScreen.jsx.
  if (notificacion !== notificacionPrevia) {
    setNotificacionPrevia(notificacion);
    if (notificacion) setVisible(true);
  }

  // El desvanecido y el avance de cola sí son efectos secundarios reales
  // (temporizadores), así que van en un efecto.
  useEffect(() => {
    if (!notificacion) return undefined;
    const ocultar = setTimeout(() => setVisible(false), DURACION_VISIBLE_MS);
    const avanzarCola = setTimeout(
      () => descartarNotificacion(),
      DURACION_VISIBLE_MS + DURACION_DESVANECIDO_MS,
    );
    return () => {
      clearTimeout(ocultar);
      clearTimeout(avanzarCola);
    };
  }, [notificacion, descartarNotificacion]);

  if (!notificacion) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-500 pointer-events-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="bg-pergamino-100 text-tinta-950 border-2 border-sello-600 rounded-lg px-4 py-3 shadow-lg max-w-xs text-center">
        <p className="text-[10px] uppercase tracking-wide text-sello-600 font-display font-bold">
          Mission complete
        </p>
        <p className="font-display font-bold text-sm mt-0.5">{notificacion.nombre}</p>
        <p className="text-xs text-tinta-950/70 mt-0.5">{notificacion.descripcion}</p>
      </div>
    </div>
  );
}
