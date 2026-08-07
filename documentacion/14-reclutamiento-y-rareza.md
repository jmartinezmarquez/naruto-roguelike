# Reclutamiento y rareza (diseño preparado, sin implementar)

## Decisión: reclutamiento vía tienda, no nodo independiente

Se quitó `reclutamiento` del `poolTiposNodo` de los 3 arcos (su peso se repartió a `tienda`). El
reclutamiento pasa a ser una de las cosas que se pueden hacer en un nodo de tienda: gastar oro
para añadir a alguien de `personajesReclutablesIds` del arco al equipo, con precio según su
`rareza` (`config.economia.precioReclutamientoPorRareza`: comun 40 / raro 70 / legendario 120).

Motivo: con economía de oro y objetos ya existente, tiene más sentido unificar ahí que mantener
un nodo gratuito aislado.

## Decisión: jefes/mini-jefes como reclutables desbloqueables por logro

En vez de inventar personajes nuevos de "recompensa de jefe" (con problemas de coherencia canon:
Zabuza y Haku mueren, no tendría sentido reclutarlos a sí mismos como premio), los propios jefes
y mini-jefes (Haku, Zabuza, Kabuto, Gaara, Camino Animal de Pain, Pain) se convierten en
**personajes reclutables cuando se desbloquean vía el sistema de logros** (ver
`achievements-DISEÑO.json`). Un logro por derrotar a cada uno los añade a la pool de reclutamiento
de cualquier run futura.

Esto fue casi gratis de implementar en datos porque `enemies.json` ya usaba el mismo esquema que
un personaje jugable (`statsBase`, `jutsu`, `modos`) desde el principio — solo hizo falta añadir
`rareza`, `curvaXp` (para poder subir de nivel una vez reclutado) y `desbloqueablePorLogro: true`.
No se duplican datos en `characters.json`.

## Recompensa de reclutamiento post-jefe: simplificada

Se descartó un bonificador de stats especial para el reclutamiento como recompensa de combate
(idea inicial). Queda simplificado a: si se recluta como recompensa, entra a un **nivel por
encima de la media del equipo**, reutilizando el parámetro `nivelInicial` que ya tiene
`reclutarPersonaje(id, nivelInicial)` — sin mecánica nueva.

## Jerarquía de rareza (validada con datos reales)

| Rareza | HP medio | Ataque medio | Quién |
|---|---|---|---|
| `comun` | 38 | 8.5 | Genin reclutables estándar (Rock Lee, Neji, Sai...) |
| `inicial` | 41 | 9.0 | Naruto, Sasuke, Sakura |
| `raro` | 68 | 11.2 | Yamato, Haku, Kabuto, Camino Animal de Pain |
| `legendario` | 90 | 14.0 | Zabuza, Gaara, Pain (Camino Deva) |

No hizo falta retocar ninguna stat para conseguir esta jerarquía: los jefes ya tenían stats
calculadas con los ratios de balance de combate (mini-jefe ×1.8, jefe final ×2.2 sobre un
personaje medio — ver `11-progresion-y-arcos.md`), y esos mismos números ya representaban
correctamente la jerarquía de poder canónica al taggearlos por rareza.

El hueco entre `comun` e `inicial` es intencionalmente pequeño: Naruto/Sasuke/Sakura son genin
novatos al principio de la serie, no deberían sentirse "raros" todavía.

## Estado

Diseño cerrado y datos preparados (`enemies.json`, `config.json`, `achievements-DISEÑO.json`).
Implementación (pantalla de Tienda con opción de reclutar, sistema de logros real) pendiente —
no bloquea el roadmap actual.
