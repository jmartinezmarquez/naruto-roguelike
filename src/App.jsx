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
import CharacterSelectScreen from './components/CharacterSelect/CharacterSelectScreen';
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

  // Los logros de sesiones anteriores se cargan una vez al montar, antes de
  // elegir personaje — el roster de CharacterSelectScreen depende de ellos
  // (recompensa desbloquearPersonajeInicial).
  useEffect(() => {
    cargarLogros();
  }, [cargarLogros]);

  // Sin run en curso (arranque, o tras reiniciarRun desde Game Over): hay
  // que elegir personaje antes de nada. iniciarRun ya no se llama solo.
  if (!mapa) {
    return (
      <CharacterSelectScreen
        onConfirmar={(idsElegidos) => iniciarRun(idsElegidos, arcoPaisDeLasOlas)}
      />
    );
  }

  return (
    <>
      {pantallaActual(pantalla)}
      <LogroToast />
    </>
  );
}
