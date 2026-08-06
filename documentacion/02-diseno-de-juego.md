# Decisiones de diseño de juego

## Alcance del MVP

- Un solo arco jugable: **País de las Olas + inicio del Examen Chunin** (fusionados en un único nivel).
- Mini-jefe: **Haku**.
- Jefe final: **Gaara**.
- Equipo de hasta **3 personajes** en combate.
- **10-12 personajes** reclutables (12 definidos), cada uno con:
  - Stats base (hp, ataque, defensa, velocidad).
  - Un tipo (naturaleza de chakra).
  - Un jutsu característico que hace daño **y** aplica una mejora/penalización de un estado (propio o del rival).
  - Un "modo" (transformación) que se desbloquea a partir de cierto nivel: multiplica estadísticas pero **no cambia el jutsu**.

## Sistema de tipos (naturalezas de chakra)

5 elementos con ciclo de eficacias canon:

```
Katon (fuego) > Fuuton (viento) > Raiton (rayo) > Doton (tierra) > Suiton (agua) > Katon...
```

Multiplicadores: 1.5x si es fuerte contra el rival, 0.5x si es débil, 1.0x neutral.

## Personajes del roster inicial (arco tutorial/chunin)

**Iniciales:** Naruto (fuuton), Sasuke (katon), Sakura (suiton).

**Reclutables:** Rock Lee (doton), Neji (raiton), Tenten (fuuton), Shikamaru (doton), Ino (suiton), Choji (katon), Kiba (raiton), Hinata (suiton), Shino (doton).

> Nota: la asignación de tipo para personajes sin afinidad elemental clara en el canon (Rock Lee, Shikamaru, Tenten) es una decisión de diseño propia, no estrictamente canónica. Revisable.

## Principio de diseño clave: el motor es agnóstico del contenido

El generador de mapa, el sistema de combate y el sistema de eventos **no deben conocer nada específico de Naruto**. Todo el contenido narrativo (personajes, jefes, eventos, tipos) vive en archivos de datos (JSON). Esto permite:

- Añadir arcos nuevos sin tocar el motor, aunque no sean 100% fieles al canon (basta con rellenar un pool de encuentros y definir un jefe).
- Cambiar de temática en el futuro sin rehacer la lógica del juego.
- Simplificar el diseño de cada arco: no hace falta que la narrativa original sea "cerrada", basta con que el diseñador (tú) recorte un principio, un pool de contenido y un final de jefe.

## Filosofía de combate

- Combate por turnos (no automático como en Pokelike), con jutsu que combina daño + efecto de estado temporal.
- Cada jutsu afecta a un único estado (ataque, defensa, velocidad u hp) durante un número limitado de turnos.
