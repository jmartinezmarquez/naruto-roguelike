import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import MapScreen from './components/Map/MapScreen';
import CombatScreen from './components/Combat/CombatScreen';
import EventScreen from './components/Events/EventScreen';
import arcoPaisDeLasOlas from './data/arcs/pais-de-las-olas.json';

export default function App() {
  const iniciarRun = useGameStore((s) => s.iniciarRun);
  const mapa = useGameStore((s) => s.mapa);
  const pantalla = useGameStore((s) => s.pantalla);

  useEffect(() => {
    if (!mapa) {
      iniciarRun(['naruto', 'sasuke', 'sakura'], arcoPaisDeLasOlas);
    }
  }, [mapa, iniciarRun]);

  if (pantalla === 'combate') return <CombatScreen />;
  if (pantalla === 'evento') return <EventScreen />;
  return <MapScreen />;
}