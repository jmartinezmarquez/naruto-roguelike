# Sistema de jutsus automáticos

Cada luchador tiene **dos ataques**: uno básico que lanza todos los turnos, y su **jutsu**, que se
carga durante el combate y sale solo al llenarse la barra. El combate sigue siendo 100% automático
— el jugador no pulsa nada, solo mira.

Antes de esto, "Rasengan" y "Chidori" se diferenciaban en el nombre y en un número. Los personajes
solo se distinguían por stats. Ahora también por **ritmo**: Rock Lee lanza su técnica cada 2 turnos,
Shikamaru cada 4 pero pegando mucho más fuerte, y Gaara solo carga rápido si le están pegando.

## Datos

En `characters.json`, `enemies.json` y `common-enemies.json`, cada entrada trae:

```json
"ataqueBasico": { "nombre": "Shadow Clone Rush", "danoBase": 0.9 },
"jutsu": {
  "nombre": "Rasengan",
  "danoBase": 2.1,
  "efectoEstado": null,
  "carga": { "alAtacar": 32, "alRecibirDano": 22, "inicial": 0 }
}
```

Los globales viven en `config.json` → `combate.jutsu`: `cargaMaxima` (100), más un
`cargaPorDefecto` y un `ataqueBasicoPorDefecto` que solo se usan si una entrada no trae los suyos.
Hoy todos los traen; los valores por defecto son la red de seguridad para contenido nuevo, y hay un
test que los cubre.

`carga.inicial` es el hueco reservado para el objeto "Pergamino de Chakra" ("empiezas el combate con
parte del indicador lleno"). Está a 0 en todos: no conviene regalar de serie lo que debería ser una
recompensa.

## Reglas del motor (`engine/combat.js`)

`ejecutarAtaque(atacante, defensor)` sustituye a la antigua `ejecutarJutsu`:

1. Barra llena → **jutsu**: daño alto, aplica `efectoEstado`, y la barra vuelve a 0. Lanzar el jutsu
   no carga.
2. Barra sin llenar → **ataque básico**: daño bajo, sin `efectoEstado`, y suma `carga.alAtacar`.
3. El defensor suma `carga.alRecibirDano` siempre que reciba daño, del ataque que sea.

**La barra no dispara en el mismo turno en que se llena.** Se llena al final del ataque básico y el
jutsu sale en el siguiente. Si no, un mismo turno podría encadenar básico + jutsu y el indicador
nunca se vería lleno en pantalla — que es justo lo que el sistema quiere enseñar.

`crearLuchador` acepta un `multiplicadorCargaExtra`, y lee `modoActivo.multiplicadorCarga` si el modo
lo trae. Es el enganche para "Modo Sabio carga un 30% más rápido" del documento de balance
([27](./27-sistema-de-balance.md)); ningún dato lo define todavía, pero el motor ya lo respeta y hay
un test que lo comprueba.

`turnosParaCargarJutsu(luchador)` estima cada cuántos turnos sale el jutsu asumiendo que en un turno
normal se ataca una vez y se recibe una. Es solo para enseñar el ritmo en la UI — el combate no la
usa, y quien no reciba golpes cargará más lento que eso.

## La carga entre rondas encadenadas

El enemigo de un nodo es **uno solo** para todo el combate, así que arrastra su barra de ronda en
ronda igual que arrastra el HP: si el jefe tenía la barra a tope cuando cayó tu personaje activo, el
siguiente se come el jutsu nada más entrar. Es deliberado y le da peso a perder una ronda.

El jugador, en cambio, entra a su ronda con `carga.inicial` (0). Cada personaje trae su propia barra.

## UI

`CombatScreen` pinta una barra fina bajo la de HP, **sin números**: lo que importa no es cuánto
chakra hay, sino cuánto falta. Al llenarse cambia a color raiton, pulsa y pone `JUTSU READY`. En el
log, el jutsu lleva 🌀 y el nombre destacado; el ataque básico va en un tono apagado.

El estado de las barras se reconstruye reproduciendo el historial, igual que ya se hacía con el HP,
pero **la carga no se acumula sumando**: cada evento trae `cargaAtacante` / `cargaDefensor` ya
resueltos, porque lanzar el jutsu la pone a cero y eso no sale de sumar incrementos.

La ficha de personaje (`PersonajeHoverCard`, y la tarjeta de `RecruitScreen`) muestra los dos
ataques y un "Jutsu about every N turns". Sin eso no habría forma de saber que Rock Lee lanza su
técnica el doble de a menudo que Shikamaru, que es lo que da sentido a elegir entre uno y otro.

## Calibración del daño

El cambio partía el daño en dos, así que había que evitar que la dificultad se moviera. Con `D` = el
`danoBase` que tenía el personaje antes y `T` = turnos por jutsu:

```
(T-1) · básico + jutsu = T · D        con  básico = 0,6 · D
→ jutsu = D · (0,4·T + 0,6)
```

`T = ceil(100 / (alAtacar + alRecibirDano))`, porque en un turno 1 vs 1 se ataca una vez y se recibe
una. Los que cargan lento acaban con un jutsu proporcionalmente más gordo, que es exactamente la
fantasía buscada.

Medido con `scripts/simular-combates.mjs` contra el motor anterior:

| | antes | después |
|---|---|---|
| turnos, combate normal | 3,0–3,9 | 4,2–4,8 |
| turnos, jefe | 2,9–4,1 | 4,1–5,6 |
| victorias normales | 96–97 % | 96–99 % |
| victorias jefe 1 vs 1 | 7–21 % | 7–21 % |
| HP restante | 80–90 % | 79–92 % |

Victorias y HP restante intactos. Los combates duran ~30 % más turnos porque el daño ahora es a
golpes y un jutsu remata con exceso (daño desperdiciado). `turnosMaximos` subió de 20 a 30: el
sistema anterior ya llegaba al tope en algún combate, y con el daño a golpes la varianza sube.

**El primer calibrado no funcionó** y merece quedar anotado. Las cargas originales daban `T` de 3 a
5, y el simulador cantó el problema: **0,8 jutsus por combate**, es decir que en la mayoría de peleas
la barra no llegaba a llenarse nunca. Un sistema que no se ve no existe. Se duplicaron las cargas
para que `T` quedara entre 2 y 4, y ahora salen 1,0–1,2 jutsus por combate, que es justo el ritmo del
ejemplo de este documento (básico, básico, básico, jutsu).

Sigue habiendo margen: los combates normales duran ~4,5 turnos, así que el jutsu sale una vez y poco
más. Se verá mucho mejor cuando se alarguen los combates en el ajuste de balance
([11](./11-progresion-y-arcos.md)) — que es el mismo sitio donde hay que mirar por qué los combates
normales se ganan al 96 % y los jefes 1 vs 1 al 14 %.

**Corregido de paso**: Naruto tenía `jutsu.danoBase: 5` cuando el resto del roster estaba entre 0,85
y 1,4. Era un dedazo (le daba ~4× el daño de cualquier otro) y se ha normalizado a 1,5, que es la
cifra que encaja con sus 9 de ataque frente a los 11 de Sasuke con 1,35.

## Fuera de alcance

El [27](./27-sistema-de-balance.md) (catálogo de pasivas reutilizables, transformaciones que cambian
reglas en vez de multiplicar stats, objetos que definen el estilo de la run, reparto 40/30/30 del
poder) es un punto propio del roadmap. No se podía balancear hasta que la barra de jutsu existiera.
Lo único que se ha adelantado son sus dos enganches: `multiplicadorCarga` en los modos y
`carga.inicial` para los objetos.

Los tipos de efecto de jutsu más allá del daño (buff, curación, ignorar defensa) siguen apoyados en
`efectoEstado`, que está desactivado en los datos para el MVP — ver [09](./09-motor-engine.md).
