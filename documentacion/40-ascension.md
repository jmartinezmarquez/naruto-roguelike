# Ascensión (punto 22)

La misma campaña, más difícil. Cinco niveles **acumulativos** —jugar en A3 aplica A1, A2 y A3—, y cada
uno se desbloquea **ganando una run en el anterior**, por campaña. Pensado para quien ya ha ganado y
quiere más, sin tocar la experiencia de quien acaba de llegar.

## Historia: descartada y recuperada el mismo día

El 2026-10-13 se descartó primero en favor de "campañas más difíciles en el Home" (ver
[39](./39-medallas-y-salon-de-la-fama.md)). Esa misma tarde, en el playtest, se pidieron las dos cosas, y
se hizo la ascensión primero porque **reutiliza todo el contenido**: una campaña difícil de verdad
necesita arcos, enemigos y arte que no existen. La campaña difícil queda en el roadmap.

## Los niveles (`src/data/ascensions.json`)

| Nivel | Nombre | Qué cambia | Modificador |
|---|---|---|---|
| A1 | Sharper Blades | Comunes +15% (hp/ataque/defensa) | `statsComunes: 1.15` |
| A2 | Restless Nights | El descanso cura hasta el 80% | `curacionDescanso: 0.8` |
| A3 | Seasoned Foes | Jefes y mini-jefes +5% | `statsJefes: 1.05` |
| A4 | Lean Missions | −30% de oro por combate | `multiplicadorOro: 0.7` |
| A5 | No Respite | El fin de arco cura hasta el 50% | `curacionFinDeArco: 0.5` |

**La velocidad no se toca nunca**: decide quién pega primero, y un +15% le daría la iniciativa a cada
enemigo empatado. Eso sería cambiar una regla, no endurecer.

**Una curación de ascensión nunca quita vida**: quien ya está por encima de la fracción se queda como
está, y el caído se levanta a esa fracción (`_curarEquipoCompleto(fraccion)`).

## Cómo se calibró

Bloque **"Ascensión: jefes con el trío en cadena"** de `scripts/simular-combates.mjs`. Los primeros números
puestos a ojo (jefes +12%, descanso al 60%) dejaban a los tres jefes finales en el 37-48% desde A3: ganar
una run habría sido cosa de una de cada veinte. Con los de ahora, en A3-A5:

| Zabuza | Kabuto | Gaara | Camino Animal | Pain |
|---|---|---|---|---|
| 99% | 67% | 52% | 84% | 76% |

Gaara es el muro de la ascensión, coherente con que sea el jefe más defensivo. El bloque es un **techo**
para las stats (no cuenta los comunes más duros del camino, ni el oro, ni la curación de fin de arco) y
un **suelo** para el descanso (supone que el equipo llega por debajo del 80%); y no cuenta objetos.

## Dónde vive cada cosa

- **Motor** (`engine/ascension.js`): `modificadoresDeAscension(niveles, n)` junta los de 1..n
  **multiplicando** si dos niveles tocan la misma clave (un nivel nuevo nunca puede ablandar uno
  anterior) y **revienta con una clave desconocida**, para que un typo en el JSON no sea un nivel que en
  silencio no hace nada. `multiplicadoresDeEnemigo` y `ascensionMaximaDisponible`.
- **Run** (`useGameStore`): `ascensionElegida` (la del Home, sobrevive a "reiniciar") y `ascension` (la
  de la run en curso, fija). "Jefe" a efectos de ascensión = todo lo de `enemies.json` más los
  legendarios jugables cuando salen de rival.
- **Meta-progresión** (`useAchievementsStore.ascensionesGanadas`, clave propia de `localStorage`): la más
  alta ganada por campaña, que **solo sube**. ⚠️ `reiniciarLogros` borra ya **seis** claves.
- **Logros**: condición nueva `ascensionMinima` ("gana en AN o más", cualquier campaña), que
  `evaluarLogros` completa desde lo guardado como los contadores. Cinco logros, `ascension_1`..`_5`, de
  honor (`recompensa: ninguna`): un premio que facilite la partida se lo daría a quien menos lo necesita.
- **Interfaz**: selector en el Home **debajo** de la tarjeta (la tarjeta entera es un botón), que mientras
  no hayas ganado nada solo dice cómo se desbloquea; pastilla `A3` junto a las medallas del mapa con el
  nombre en el hover; la ascensión en el Game Over y en cada entrada del Salón de la Fama. La pantalla de
  transición entre arcos llena la barra solo hasta donde cura de verdad (`hpDespues` en `curacionDeArco`,
  `--hasta` en la animación `llenar-hp`).

## Pendiente

- **La campaña difícil** (contenido aparte: arcos, enemigos y arte nuevos).
- Un aviso en la pantalla de transición cuando el fin de arco no cura del todo (A5): hoy la barra se
  queda a medias, pero ningún texto lo explica.
