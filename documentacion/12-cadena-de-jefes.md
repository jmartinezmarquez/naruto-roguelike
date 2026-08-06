# Cadena de jefes (grupo de rivales, sin romper el combate 1 vs 1)

## Motivación

Se planteó si los combates deberían ser 3v3 (todo el equipo a la vez) para poder representar
jefes en grupo (ej. Orochimaru + Kabuto + Sasuke, o Pain + Konan + otro Akatsuki). Se descartó
por dos motivos: (1) contradice la decisión explícita de mantener el combate simple y automático
1 vs 1 (ver `09-motor-engine.md`), y (2) exigiría rediseñar `combat.js`, `useGameStore.js` y el
balance recién ajustado, todo construido sobre 1 vs 1.

## Solución adoptada: cadena de jefes

Un nodo de jefe puede resolver, en vez de un único enemigo, una **lista de enemigos que se
luchan uno detrás de otro, sin salir del nodo**. El motor de combate no cambia — sigue siendo
`resolverCombateCompleto(luchadorJugador, luchadorEnemigo)` 1 vs 1 — solo cambia cuántas veces
se llama seguido antes de considerar el nodo completado.

## Esquema de datos propuesto (aún no implementado)

En la config de un arco, `jefeFinalId` (string) podría convivir con una alternativa
`jefeFinalCadena` (array de ids), p. ej.:

```json
{
  "jefeFinalId": null,
  "jefeFinalCadena": ["orochimaru", "kabuto", "sasuke_renegado"]
}
```

`resolverEnemigoDeNodo` tendría que devolver, para un nodo de este tipo, el primer enemigo de
la cadena más un índice; y el store necesitaría un campo nuevo (`indiceCadenaActual` o similar)
para saber por cuál de los tres vas. Al ganar un combate de la cadena, si quedan más enemigos,
se pasa al siguiente automáticamente en vez de dar el nodo por completado.

## Pendiente de decidir cuando se implemente

- ¿Se cura algo de HP entre combates de la cadena, o se llega al siguiente con el HP que quedó
  del anterior? (la segunda opción es más dura y más fiel al espíritu "boss fight", pero más
  punitiva — recomendación: curación parcial, ej. 20-30%, para que no sea un muro imposible).
- ¿La cadena cuenta como un solo nodo a efectos de recompensa (XP/oro/objeto se dan solo al
  final) o cada enemigo derrotado da su propia recompensa parcial?
- Este mecanismo es la forma natural de implementar, más adelante, un jefe final de la run
  formado por varios Akatsuki en vez de un Pain en solitario, si se quiere subir la apuesta del
  arco 3 sin tocar el motor de combate.

## Estado

Diseño aceptado, implementación aplazada hasta conectar el store al flujo real de nodos del
mapa (pantallas de UI, próximo paso del roadmap).
