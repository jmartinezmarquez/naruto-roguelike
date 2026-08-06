# Decisiones de diseño de juego

## Alcance del MVP

- Un solo arco jugable: **País de las Olas** (`arcs/pais-de-las-olas.json`).
- Mini-jefe: **Haku** (recompensa propia).
- Jefe final obligatorio: **Zabuza Momochi**.
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

**Reclutables (arco Examen Chunin, no País de las Olas):** Rock Lee (doton), Neji (raiton), Tenten (fuuton), Shikamaru (doton), Ino (suiton), Choji (katon), Kiba (raiton), Hinata (suiton), Shino (doton). Corregido: estos personajes ahora se reclutan en el arco donde canónicamente aparecen — ver [11 - Progresión y arcos](./11-progresion-y-arcos.md).

**Reclutables (arco Invasión de Pain):** Sai (fuuton), Yamato (doton) — personajes nuevos añadidos para dar contenido de reclutamiento al tramo final de la run.

> Nota: la asignación de tipo para personajes sin afinidad elemental clara en el canon (Rock Lee, Shikamaru, Tenten) es una decisión de diseño propia, no estrictamente canónica. Revisable.

## Transformaciones (hasta 2 por personaje)

Cada personaje puede tener **hasta 2 modos** (`modos: []`, array ordenado de menor a mayor `nivelDesbloqueo`), no solo 1. El motor elige automáticamente el de mayor nivel que esté desbloqueado — nunca hay dos modos activos a la vez. Regla sin excepciones: la activación es **solo por nivel**, decidida siempre antes de que empiece el combate, tanto para personajes jugables como para cualquier enemigo o jefe. Ningún modo cambia el jutsu del personaje, solo multiplica estadísticas.

Ejemplo (Naruto): tier 1 "Manto de Chakra del Kyuubi" (nivel 12, arco 1), tier 2 "Modo Sabio" (nivel 60, arco 3). La mayoría de los jefes de un solo arco (Zabuza, Haku, Kabuto) solo tienen 1 tier, porque se enfrentan al jugador una única vez a un nivel conocido — Gaara y Pain sí tienen progresión de tiers relevante porque su nivel de aparición cubre un rango más amplio dentro de su arco.

## Principio de diseño clave: el motor es agnóstico del contenido

El generador de mapa, el sistema de combate y el sistema de eventos **no deben conocer nada específico de Naruto**. Todo el contenido narrativo (personajes, jefes, eventos, tipos) vive en archivos de datos (JSON). Esto permite:

- Añadir arcos nuevos sin tocar el motor, aunque no sean 100% fieles al canon (basta con rellenar un pool de encuentros y definir un jefe).
- Cambiar de temática en el futuro sin rehacer la lógica del juego.
- Simplificar el diseño de cada arco: no hace falta que la narrativa original sea "cerrada", basta con que el diseñador (tú) recorte un principio, un pool de contenido y un final de jefe.

## Filosofía de combate

- Combate por turnos (no automático como en Pokelike), con jutsu que combina daño + efecto de estado temporal.
- Cada jutsu afecta a un único estado (ataque, defensa, velocidad u hp) durante un número limitado de turnos.
