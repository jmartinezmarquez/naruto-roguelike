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
import EncyclopediaScreen from './components/Encyclopedia/EncyclopediaScreen';
import SettingsScreen from './components/Settings/SettingsScreen';
import InventoryScreen from './components/Inventory/InventoryScreen';
import LogroToast from './components/Achievements/LogroToast';
import AvisoToast from './components/Map/AvisoToast';
import CharacterSelectScreen from './components/CharacterSelect/CharacterSelectScreen';
import MusicaDeFondo from './components/common/MusicaDeFondo';
import arcoPaisDeLasOlas from './data/arcs/pais-de-las-olas.json';
import gameBgDark from './assets/game-background-dark-theme.png';
import gameBgLight from './assets/game-background-light-theme.png';
import { useSettingsStore, FACTOR_ANIMACION } from './store/useSettingsStore';

function pantallaActual(pantalla) {
  if (pantalla === 'combate') return <CombatScreen />;
  if (pantalla === 'evento') return <EventScreen />;
  if (pantalla === 'tienda') return <ShopScreen />;
  if (pantalla === 'reclutar') return <RecruitScreen />;
  if (pantalla === 'gameover') return <GameOverScreen />;
  // Estas cuatro NO sustituyen al mapa: se dibujan encima, como los diálogos de un
  // Pokelike, así que el jugador sigue viendo dónde está mientras decide o consulta.
  // El criterio para entrar en esta lista es que sean **consultas o decisiones
  // cortas dentro de un nodo**; lo que es un momento propio de la run (combate,
  // tienda, reclutar, game over) ocupa la pantalla entera a propósito.
  // Ver documentacion/33-direccion-visual.md.
  const encimaDelMapa = {
    logros: <AchievementsScreen />,
    enciclopedia: <EncyclopediaScreen />,
    mochila: <InventoryScreen />,
    recompensaMiniJefe: <ItemRewardScreen />,
    ajustes: <SettingsScreen />,
  }[pantalla];
  if (encimaDelMapa) {
    return (
      <>
        <MapScreen />
        {encimaDelMapa}
      </>
    );
  }
  return <MapScreen />;
}

export default function App() {
  const iniciarRun = useGameStore((s) => s.iniciarRun);
  const cargarLogros = useAchievementsStore((s) => s.cargarLogros);
  const cargarAjustes = useSettingsStore((s) => s.cargarAjustes);
  const tema = useSettingsStore((s) => s.tema);
  const velocidadCombate = useSettingsStore((s) => s.velocidadCombate);
  const mapa = useGameStore((s) => s.mapa);
  const arcoActualId = useGameStore((s) => s.arcoActualId);
  const pantalla = useGameStore((s) => s.pantalla);

  // Los logros de sesiones anteriores se cargan una vez al montar, antes de
  // elegir personaje — el roster de CharacterSelectScreen depende de ellos
  // (recompensa desbloquearPersonajeInicial). Las preferencias, en la misma
  // pasada: el tema tiene que estar puesto antes del primer pintado o se ve el
  // cambio.
  useEffect(() => {
    cargarLogros();
    cargarAjustes();
  }, [cargarLogros, cargarAjustes]);

  // **Aquí y no en el store**: `useSettingsStore` no toca el DOM a propósito (los
  // tests corren en `environment: 'node'`, donde no hay `document`), así que
  // llevar las preferencias al documento es trabajo del componente raíz.
  // `data-tema` lo lee el bloque `[data-tema='claro']` de index.css y
  // `--factor-animacion` multiplica las duraciones de las animaciones de combate.
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--factor-animacion',
      String(FACTOR_ANIMACION[velocidadCombate] ?? 1),
    );
  }, [velocidadCombate]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${tema === 'claro' ? gameBgLight : gameBgDark})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Cuelga de App y NO de una pantalla: si colgara de la pantalla, React lo
          desmontaría en cada cambio (mapa → combate → mapa) y la música empezaría de
          cero cada vez. Con `arcoId` a null suena la pista de menú, si la hay. */}
      <MusicaDeFondo arcoId={mapa ? arcoActualId : null} />

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
