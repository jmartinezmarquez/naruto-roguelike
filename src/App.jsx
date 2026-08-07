import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useAchievementsStore } from './store/useAchievementsStore';
import MapScreen from './components/Map/MapScreen';
import CombatScreen from './components/Combat/CombatScreen';
import EventScreen from './components/Events/EventScreen';
import ShopScreen from './components/Shop/ShopScreen';
import GameOverScreen from './components/GameOver/GameOverScreen';
import AchievementsScreen from './components/Achievements/AchievementsScreen';
import LogroToast from './components/Achievements/LogroToast';
import arcoPaisDeLasOlas from './data/arcs/pais-de-las-olas.json';

function pantallaActual(pantalla) {
  if (pantalla === 'combate') return <CombatScreen />;
  if (pantalla === 'evento') return <EventScreen />;
  if (pantalla === 'tienda') return <ShopScreen />;
  if (pantalla === 'gameover') return <GameOverScreen />;
  if (pantalla === 'logros') return <AchievementsScreen />;
  return <MapScreen />;
}

export default function App() {
  const iniciarRun = useGameStore((s) => s.iniciarRun);
  const cargarLogros = useAchievementsStore((s) => s.cargarLogros);
  const mapa = useGameStore((s) => s.mapa);
  const pantalla = useGameStore((s) => s.pantalla);

  useEffect(() => {
    if (!mapa) {
      // Los logros de sesiones anteriores deben estar cargados ANTES de
      // iniciarRun, porque el inventario inicial puede depender de ellos
      // (recompensa desbloquearObjetoInicial).
      cargarLogros();
      iniciarRun(['naruto', 'sasuke', 'sakura'], arcoPaisDeLasOlas);
    }
  }, [mapa, iniciarRun, cargarLogros]);

  return (
    <>
      {pantallaActual(pantalla)}
      <LogroToast />
    </>
  );
}
