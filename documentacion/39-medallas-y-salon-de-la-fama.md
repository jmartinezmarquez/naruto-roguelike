# Medallas de arco y Salón de la Fama (puntos 20 y 21)

Dos piezas de Pokémon que el juego no tenía, y las dos responden a lo mismo: **ganar
algo no dejaba nada que mirar**. Derrotar a un jefe final curaba al equipo y pasaba de
arco; ganar la run sumaba uno a "Runs won" y el equipo ganador desaparecía con ella.

## Medallas de arco (punto 20)

Una por jefe final derrotado en la run, como las de gimnasio. **Mueren con la run**.

- **Dato**: `medalla: { nombre }` en cada `src/data/arcs/*.json` (Wave Crest, Sand Crest,
  Cloud Crest). El motor no sabe nada de medallas; el nombre es contenido.
- **Estado**: `medallas` en `useGameStore` (ids de arco, en orden), a cero en `iniciarRun`
  y sumada en `jugarCombate` en el mismo sitio donde se detecta `arcoCompletado`.
- **Arte**: `scripts/generar-sprites-medallas.py` las **dibuja** a 32×32 —ninguna hoja del
  artista las trae—, cada una con **su forma y su color** (círculo de plata con olas,
  hexágono de bronce con el reloj de Suna, escudo de oro con la nube del Akatsuki) para
  que una fila de tres se lea sin leer nombres. Van en `assets/medals/<arcoId>.png` y se
  cargan con `import.meta.glob`: un arco sin medalla dibujada no rompe el build.
- **Dónde se ven**: panel "Crests" arriba de la columna derecha del mapa (un hueco por arco
  de la campaña, **en silueta** hasta ganarla — la misma convención que el Bingo Book), en
  el primer tiempo de la transición entre arcos ("Wave Crest earned") y en el Game Over.
- Hay un **test de invariante**: todo arco de una campaña declara su medalla y tiene su PNG.

## Salón de la Fama (punto 21)

**Cada run ganada, con el equipo que la ganó**, sus niveles y sus medallas. Ventana sobre el
Home (`components/HallOfFame/SalonDeLaFamaScreen.jsx`, `pantalla: 'salonFama'`), con su
icono de trofeo, también dibujado por el script de medallas.

- **Vive en `useAchievementsStore`** (`salonDeLaFama`, clave `naruto-roguelike-salon`): es
  meta-progresión y la run muere al acabar. Lo escribe `jugarCombate` al caer el jefe que
  acaba la run (`registrarEnSalonDeLaFama`), con el equipo ya curado y subido de nivel.
- Más reciente primero y con **tope de 20** (`MAXIMO_SALON_DE_LA_FAMA`): `localStorage` no
  tiene que crecer sin fin en quien juega mucho.
- ⚠️ **`reiniciarLogros` borra ya CINCO claves.** Reiniciar la meta-progresión y seguir
  viendo las victorias de antes sería un reinicio a medias. Cada clave nueva en ese store
  obliga a volver ahí.

## Lo que se descartó en la misma conversación

- **Elegir 1 de 3 tras un élite y reliquia de jefe** (Slay the Spire): no hay objetos
  suficientes para que la elección sea real; se queda el objeto fijo del jefe.
- **Modo ascensión**: la dificultad creciente se hará con **campañas más difíciles** en el
  selector del Home, que ya existe para eso.
