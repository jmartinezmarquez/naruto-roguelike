import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useAchievementsStore } from './store/useAchievementsStore';
import MapScreen from './components/Map/MapScreen';
import CombatScreen from './components/Combat/CombatScreen';
import EventScreen from './components/Events/EventScreen';
import ShopScreen from './components/Shop/ShopScreen';
import RecruitScreen from './components/Recruit/RecruitScreen';
import ItemRewardScreen from './components/Reward/ItemRewardScreen';
import GameOverScreen from './components/GameOver/GameOverScreen';
import AchievementsScreen from './components/Achievements/AchievementsScreen';
import InventoryScreen from './components/Inventory/InventoryScreen';
import LogroToast from './components/Achievements/LogroToast';
import AvisoToast from './components/Map/AvisoToast';
import CharacterSelectScreen from './components/CharacterSelect/CharacterSelectScreen';
import arcoPaisDeLasOlas from './data/arcs/pais-de-las-olas.json';
import gameBgDark from './assets/game-background-dark-theme.png';

function pantallaActual(pantalla) {
  if (pantalla === 'combate') return <CombatScreen />;
  if (pantalla === 'evento') return <EventScreen />;
  if (pantalla === 'tienda') return <ShopScreen />;
  if (pantalla === 'reclutar') return <RecruitScreen />;
  if (pantalla === 'recompensaMiniJefe') return <ItemRewardScreen />;
  if (pantalla === 'gameover') return <GameOverScreen />;
  if (pantalla === 'logros') return <AchievementsScreen />;
  // La mochila NO sustituye al mapa: se dibuja encima, como el diálogo de
  // objeto de un Pokelike. El jugador sigue viendo dónde está mientras decide.
  if (pantalla === 'mochila') {
    return (
      <>
        <MapScreen />
        <InventoryScreen />
      </>
    );
  }
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

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${gameBgDark})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {!mapa ? (
        <CharacterSelectScreen
          onConfirmar={(idsElegidos) => iniciarRun(idsElegidos, arcoPaisDeLasOlas)}
        />
      ) : (
        <>
          {pantallaActual(pantalla)}
          <LogroToast />
          <AvisoToast />
        </>
      )}
    </div>
  );
}
