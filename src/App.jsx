import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import MapScreen from './components/Map/MapScreen';
import arcoPaisDeLasOlas from './data/arcs/pais-de-las-olas.json';

export default function App() {
  const iniciarRun = useGameStore((s) => s.iniciarRun);
  const mapa = useGameStore((s) => s.mapa);

  useEffect(() => {
    if (!mapa) {
      iniciarRun(['naruto', 'sasuke', 'sakura'], arcoPaisDeLasOlas);
    }
  }, [mapa, iniciarRun]);

  return <MapScreen />;
}
