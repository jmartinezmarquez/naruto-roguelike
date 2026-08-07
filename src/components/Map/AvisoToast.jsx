import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const DURACION_VISIBLE_MS = 3000;
const DURACION_DESVANECIDO_MS = 500;

/**
 * Notificación flotante que se desvanece sola para avisos breves de la run
 * (curación en el nodo de descanso, curación de un evento...). Antes esto
 * era una píldora de texto fija en la cabecera del mapa mientras
 * `avisoUltimoNodo` no fuera null — aquí se anima y desaparece por sí sola
 * en vez de quedarse ahí hasta el siguiente clic. Mismo patrón que
 * `LogroToast.jsx`, montado aparte en `App.jsx` para no depender de que
 * `MapScreen` esté activo.
 */
export default function AvisoToast() {
  const aviso = useGameStore((s) => s.avisoUltimoNodo);

  const [avisoPrevio, setAvisoPrevio] = useState(null);
  const [visible, setVisible] = useState(false);

  // Ajustar `visible` al cambiar el aviso se hace durante el render, no en
  // un efecto — mismo patrón ya usado en CombatScreen.jsx y LogroToast.jsx.
  if (aviso !== avisoPrevio) {
    setAvisoPrevio(aviso);
    if (aviso) setVisible(true);
  }

  useEffect(() => {
    if (!aviso) return undefined;
    const ocultar = setTimeout(() => setVisible(false), DURACION_VISIBLE_MS);
    return () => clearTimeout(ocultar);
  }, [aviso]);

  if (!aviso) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-opacity pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${DURACION_DESVANECIDO_MS}ms` }}
    >
      <div className="bg-fuuton text-tinta-950 rounded-full px-5 py-2 shadow-lg font-display text-sm text-center">
        {aviso}
      </div>
    </div>
  );
}
