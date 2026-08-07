# Roadmap

## Hecho

**Fundamentos**
- [x] Concepto, temática (Naruto), 3 arcos del MVP definidos.
- [x] Datos completos: `types`, `characters` (14 personajes), `enemies` (6 jefes/minijefes),
  `common-enemies`, `items`, `config`, `events` (12, 4 por arco), `arcs/*` (3).
- [x] Motor puro (`engine/`): `leveling.js`, `combat.js`, `mapGenerator.js`. Combate 1vs1
  automático, con rondas encadenadas si el activo cae (ver [09](./09-motor-engine.md)).
- [x] `store/useGameStore.js`: equipo, oro, inventario, mapa, HP persistente, buffs temporales,
  bonificaciones permanentes.

**Balance (varias iteraciones, ver [11](./11-progresion-y-arcos.md) para la historia completa)**
- [x] Curva de XP corregida (la original pedía 24,8M de XP para un presupuesto real de ~5.000).
- [x] Reparto de XP con el banquillo (0.6) para que los personajes no activos no se queden atrás.
- [x] Balance de jefes con ratios fijos sobre personaje medio (no valores absolutos).
- [x] Sistema de nivel de enemigo: se probó dinámico (relativo al jugador) y se descartó por quitarle sentido a subir de nivel — vuelto a fijo por piso, recalibrado con el número real de combates de un único camino (no todos los nodos del piso).
- [x] Niveles de transformación por personaje, ajustados por arco de reclutamiento.

**UI**
- [x] Dirección visual propia (tinta/pergamino ninja, tipografía japonesa) — ver [13](./13-ui-mapa-y-combate.md).
- [x] Pantalla de Mapa: forma de diamante por piso, panel de equipo reordenable, leyenda de nodos,
  pictograma de ventaja de chakra debajo de la leyenda.
- [x] Pantalla de Combate: animación por rondas, HP real (no siempre lleno), botón Nueva Run al perder.
- [x] Pantalla de Evento: 12 eventos canónicos, pistas automáticas por elección, sin combate.
- [x] Pantalla de Tienda: consumibles, objeto gratuito, reclutamiento exclusivo con reemplazo si el
  equipo está lleno — ver [15](./15-tienda.md).
- [x] Nodo de descanso auto-resuelto (cura y revive a todo el equipo).
- [x] Pantalla de Game Over dedicada, con el estado final del equipo — ver [17](./17-game-over.md).
- [x] Tarjeta de hover con stats/tipo/jutsu/HP en todo sitio donde se muestra un personaje (mapa,
  combate, tienda, selección) — `components/common/PersonajeHoverCard.jsx`.

**Flujo real de la run**
- [x] `App.jsx` real: pantalla de selección de personaje inicial (`CharacterSelectScreen.jsx`) en
  vez de arrancar fijo con Naruto/Sasuke/Sakura — se elige 1 y el resto del equipo se completa
  reclutando durante la run — ver [19](./19-seleccion-de-personaje.md).
- [x] Reclutar con el equipo lleno ahora deja elegir a quién reemplazar, en vez de bloquear el
  reclutamiento — ver [19](./19-seleccion-de-personaje.md).

**Sistema de logros**
- [x] Motor y persistencia (`engine/achievements.js` + `store/useAchievementsStore.js`), meta-progresión
  entre runs vía `localStorage` separado de la run en curso — ver [18](./18-sistema-de-logros.md).
- [x] Pantalla de Logros (`components/Achievements/AchievementsScreen.jsx`, botón desde el mapa) y
  notificación al desbloquear uno (`LogroToast.jsx`, se desvanece sola) — ver [18](./18-sistema-de-logros.md).
- [x] Cadena de jefes / combates de grupo (ver [12](./12-cadena-de-jefes.md)).
- [x] Reclutamiento vía tienda y jerarquía de rareza (ver [14](./14-reclutamiento-y-rareza.md)) — esto ya se implementó, este punto queda como referencia histórica del diseño previo.

**Calidad**
- [x] Testing con Vitest: 81 tests sobre motor y store — ver [16](./16-testing.md).

## Próximos pasos (en orden sugerido)

1. **Bugfixing y ajustes de diseño puntuales** — a definir según lo que salga jugando (sin lista cerrada todavía).
  - La seleccion de personaje debe tener el card completo y no solo el nombre + hover. Ademas deberia empezar la run en cuanto elegimos personaje. 
  - El camino hecho en rojo está bien, pero los caminos a elegir desde el nodo en el que estamos deberian aparecer con una linea continua, mientras los caminos no accesibles deberian aparecer con una linea de puntos. Los caminos que dejamos atras y no hemos elegido deberian aparecer con una linea continua negra, simbolizando que ya no puedes volver. Los nodos ya visitados podrian tener en greyed out con un onHover "Visitado". 
  - Los nodos antes del jefe final deberian contener al menos en un path un nodo de descanso, para que el usuario siempre tenga la posibilidad de curar a todo el equipo.
  - El daño mostrado del jutsu es raro, creo que mejor seguir la formula de pokemon en la que enseñamos el daño base del jutsu pero el usuario confia en que los calculos esten bien hechos. 
  - Donde esta el boton de logros podriamos tener un pequeño menu basado en iconos como pokelike. Logros, ajustes, pantalla completa, reiniciar run, etc. 
  - En la tienda solo aparecen para reclutar Haku y Zabuza, no aparecen ninguno de los otros ninjas de la hoja, esto es un bug. 
  - De momento, prefiero eliminar para el MVP los efectos de estado de todos los jutsus, añaden complejidad a los calculos y no creo que tenga sentido en todos los personajes. Dejalo apuntado como future improvement y haz que la arquitectura lo soporte en un futuro. 
  - El nodo de descanso y los eventos de curacion deberían enseñar un toast diciendo que el equipo se ha recuperado correctamente en lugar del placeholder actual
  - Los personajes caidos no deben recibir experiencia en proximos combates hasta que vuelvan a curarse. En el combate actual SI recibiran experiencia. 
2. **Encadenar los 3 arcos en una sola run** (objetivo principal de la próxima sesión): al derrotar
   al jefe final de un arco (nodo `jefe` — Zabuza, luego Gaara, luego Pain), generar el mapa del
   siguiente arco automáticamente y continuar, en vez de terminar la run ahí. Hoy `App.jsx` solo
   arranca `pais_de_las_olas` y no hay ninguna transición entre arcos implementada.
   - De paso, considerar un **evento especial tras el jefe de cada arco** (antes de pasar al
     siguiente) — una pausa narrativa/de transición entre actos, no solo saltar directo al mapa
     siguiente. Encaja con el pedido de abajo de pensar mecánicas al estilo Slay the Spire.
3. **Nodo de "reclutar" dedicado en el mapa** — ahora que la run empieza con 1 solo personaje (ver
   [19](./19-seleccion-de-personaje.md)), reclutar ya no es un extra de la tienda, es una necesidad
   central del run. Falta decidir en la propia sesión: ¿nodo propio con su propia oferta, o dar más
   peso al reclutamiento dentro de la tienda existente? ¿Coste distinto al de tienda?

4. **Nodo de "Combate en cadena"**  — En Pokelike tenemos encuentros salvajes (1 solo enemigo), entrenadores (enemigos con mas de 1 encuentro uno detras de otro) y entrenadores de elite (Rival, con un equipo mas fuerte y mas combates en cadena). Nuestro mini-boss (Haku p.e) sería de este tercer tipo, y un combate con Genin Ninja sería el primer tipo. Para combates contra personajes nombrados (Zaku, Dosu, Rin, etc) quizá estaría bien añadirle uno o dos genin estandar para simbolizar un combate más largo. 

5. **Tarjeta de Objetos y Oro** debajo del panel de equipo en `MapScreen.jsx` — muestra el
   inventario actual y el oro, con **hover en cada objeto** revelando su descripción y su efecto
   exacto (qué cura, qué bonificación da, etc.), mismo patrón que `PersonajeHoverCard` pero para
   `items.json`.  - Creo que podemos prescindir de la leyenda de nodos para dar sitio al inventario (oro + objetos). En su lugar, hacer hover en un nodo deberia decirte lo que es, y el beneficio que te da, como en Pokelike. Por ejemplo:
  Tienda - Compra objetos, Combate aleatorio - + 1 Nivel, Mini-boss - Recompensa adicional, etc. 

6. **Ampliar el roster de enemigos nombrados y logros** — No hace falta cubrir todos los ninjas del manga pero que no se sienta que siempre te van a salir los mismos enemigos al clicar en un Combate del tipo Entrenador. Añadiendo variedad en cada arco. Además añadir logros para la "completion" de los arcos. No todos los logros tienen por qué desbloquear personajes u objetos permanentes, otros simplemente son por coleccionismo. También pueden afectar al oro inicial, de manera que empieces las siguientes runs con más oro, etc. El sistema de logros de Pokelike lo hace bastante bien, dando un balance entre desbloqueos tempranos e incrementales y logros dificiles de conseguir para jugadores mas coleccionistas.

7. **Cambiar los textos a ingles** — El codigo no lo voy a compartir con nadie, pero pretendo sacar el juego como aplicacion web y el ingles es un idioma que alcanza a mucha más gente. Hay que traducir todos los textos de cara a usuario. Es mejor hacer 2 versiones y un selector de lenguaje? Cual es el approach mas rapido? Todo el contenido de despues tiene que estar tambien en ingles.

8. **Añadir background e imagen para la columna central** — Siguiendo el estilo Pokelike, existe un background generico para toda la app y la columna donde se encuentra el piso tiene un tema dependiendo del acto. Encuentra una imagen para cada acto y usala. Utiliza tambien la fuente de naruto que se encuentra en Assets para darle un toque más personal. 

9. **Actualizar sprites de los nodos** — Siguiendo el estilo Pokelike, cada nodo debería tener un sprite facilmente reconocible. 
- Encuentro aleatorio - Equivalente a Pokemon Salvaje - Sprite pixel art ninja renegado con un sprite de ninja estandar 
- Encuentro con enemigo nombrado - Equivalente a entrenador pokemon - Sprite del personaje enemigo en concreto
- Mini-boss - Equivalente a entrenador rival - Sprite del personaje en concreto
- Tienda - Sprite pixel art de mercader ambulante
- Descanso - Equivalente a centro pokemon - Sprite de tienda medica con cruz verde
- Evento - Sprite de interrogante 
- Reclutar ninja - Equivalente a capturar pokemon - Pergamino de contrato con un simbolo '+'
- Jefe final - Equivalente a lider de gimnasio - Sprite del personaje en concreto

10. **Cambiar estructura del combate** — Siguiendo el estilo Pokelike, el combate es automatico. Se me ha ocurrido que como retoque final, podríamos hacer que los personajes ataquen con un ataque basico (animacion kunai) y un ataque potente que se carga al hacer o recibir daño. Este se utilizaria automaticamente al cargarse por completo. Cada ataque tendria un tiempo de carga distinto dependiendo de su poder y lo haria mucho más profundo. Como lo ves? Algo parecido a lo que hace Pokemon GO

11. **Actualizar interfaz de combate** — Siguiendo el estilo Pokelike, todo el equipo deberia aparecer en la pantalla de combate aunque solo el primero de cada bando este peleando. El sprite de los personajes debería aparecer y el sistema de logs se debería intercambiar por una animacion en la que los ninjas lanzan un kunai al enemigo. Al impactar, la barra de salud baja. No es necesario ver el numero de daño ya que la HP se ve. Para los personajes caidos, la card debería apagarse, tal y como hace pokelike. Para darle más viveza, añadir un efecto agitado cada vez que un personaje recibe un golpe. 

12. **Playtest y ajuste de balance** — en particular, revisar el salto de dificultad cuando un
   personaje de banquillo entra en una ronda encadenada contra un jefe (ver nota en
   [11](./11-progresion-y-arcos.md)), y ahora también el ritmo de empezar solo (1 personaje) en un
   arco sin reclutas (`pais_de_las_olas` tiene `personajesReclutablesIds: []`).

### Descartado

- **Hook de autoguardado tras cada nodo** (`guardarRun`/`cargarRun`): decidido que no compensa la
  complejidad — las runs son cortas, no hay tanto que perder si se cierra la pestaña a mitad. Las
  funciones ya existen en el store por si hiciera falta más adelante, simplemente no se conectan a
  ningún hook automático.

## Backlog (post-MVP)

Ideas nuevas pensadas para encajar con el formato Pokelike/Slay the Spire, marcadas aparte por ser
más grandes de lo que cabe en una sesión de bugfixing/ajuste:

- **Fila de reliquias visible** (estilo Slay the Spire): los objetos pasivos ya existen en el
  inventario, pero no hay ninguna vista dedicada tipo "iconos de reliquia siempre visibles" — hoy
  solo se ven al abrir la futura tarjeta de Objetos y Oro (punto 4 de arriba).
- **Vista previa del jefe antes de entrar al nodo**: hover sobre el nodo `jefe`/`miniJefe` en el
  mapa mostrando su ficha completa (reutilizando `PersonajeHoverCard`), para decidir con
  información si conviene ir a curarse antes.
- **Bifurcación de riesgo/recompensa** en algún nodo de evento: elegir entre un camino más difícil
  con mejor recompensa o uno seguro con menos, al estilo "elite fight" de Slay the Spire.
- **Modificadores de dificultad entre runs** ("ascensión"): ligado a la condición de logro ya
  propuesta pero sin implementar `completarRunEnDificultad` en `achievements.json`.
- Interpretar `recompensa.finDeLaRun` (Pain) para marcar `runGanada: true`.
- Modo Nuzlocke.
- Sistema de cuentas / guardado remoto.
- Arte propio (sustituir placeholders).
- Tests de componentes React (hoy solo motor + store).
