# Sistema de jutsus automáticos

Cada luchador tiene **dos ataques**: uno básico que lanza todos los turnos, y su **jutsu**, que se
carga durante el combate y sale solo al llenarse la barra. El combate sigue siendo 100% automático
— el jugador no pulsa nada, solo mira.

Antes de esto, "Rasengan" y "Chidori" se diferenciaban en el nombre y en un número. Los personajes
solo se distinguían por stats. Ahora también por **ritmo**: Rock Lee lanza su técnica cada 2 turnos,
Shikamaru cada 4 pero pegando mucho más fuerte, y Gaara solo carga rápido si le están pegando.

## Datos

En `characters.json`, `enemies.json` y `common-enemies.json`, cada entrada trae **solo su jutsu**:

```json
"jutsu": {
  "nombre": "Rasengan",
  "danoBase": 2.35,
  "efectoEstado": null,
  "carga": { "alAtacar": 32, "alRecibirDano": 22, "inicial": 0 }
}
```

Los globales viven en `config.json` → `combate.jutsu`: `cargaMaxima` (100), `cargaPorDefecto` (red de
seguridad para contenido nuevo, hoy todos traen la suya) y `ataqueBasicoPorDefecto`.

### El ataque básico es único para todos

`ataqueBasicoPorDefecto` (hoy "Kunai Throw", `danoBase: 0.65`) **no es un defecto: es el ataque
básico de todo el mundo**. Ningún personaje ni enemigo define el suyo.

En la primera versión sí lo tenían, uno por cabeza. Fue un error, y por un motivo concreto: esos
números nunca los decidió nadie. Salieron de aplicar `básico = 0,6 · D` personaje a personaje durante
la calibración — eran el residuo de una hoja de cálculo, no diseño. Y como el daño real es
`ataque × danoBase`, un `danoBase` común ya hace que el personaje con más ATK pegue más fuerte con el
mismo kunai, que es justo lo que se quería. Un `danoBase` propio encima de eso era diferenciar dos
veces por lo mismo.

Además tiene consecuencias fuera de los datos: el ataque básico tendrá **una sola animación de kunai**
para todos (punto 7 del roadmap), y desaparece de la ficha de personaje, que estaba enseñando el
nombre y el poder de un ataque estándar como si fuera una característica.

El motor sigue leyendo `personajeBase.ataqueBasico` si existiera, por si algún día un jefe merece uno
propio. Hay un **test de invariante** que falla si alguien vuelve a añadir uno: la decisión se
rompería en silencio, porque un personaje con básico propio funcionaría perfectamente, solo que
pegaría distinto al resto sin que nada avisara.

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

### Qué enseña la ficha de personaje, y qué no

`PersonajeHoverCard` (y la tarjeta de `RecruitScreen`) muestran del jutsu **el nombre y tres
puntitos** de ritmo de carga (`RitmoCarga`: 3 puntos = cada ≤2 turnos, 2 = cada 3, 1 = cada 4 o más).
Nada más.

Se probó primero con toda la información —los dos ataques con su "Power N" y un "Jutsu about every N
turns"— y sobraba casi todo:

- **El ataque básico** ya no es una característica del personaje, es el estándar de todos.
- **"Power 2.35"** no es daño: es un multiplicador contra una fórmula interna que el jugador no ve.
  Parece un dato comparable y no lo es, así que es peor que no poner nada.
- **El número exacto de turnos** es ficha técnica en un juego pensado para echar runs cortas. El
  ritmo real se aprende en dos combates viendo la barra llenarse.

Pero quitarlo **del todo** tampoco valía, y esta es la parte que no es obvia: reclutar es elegir
entre tres ninjas que no has visto pelear nunca. Sin ninguna pista de ritmo, esa decisión vuelve a
ser solo stats y el sistema de carga deja de notarse justo en el único momento en que hay que
decidir. De ahí los puntitos: cualitativos, ocupan menos que el nombre del jutsu, y no dan una cifra
que nadie puede usar.

El resto (descripción del jutsu, potencias, número de turnos) es material de la **enciclopedia**,
punto 10 del roadmap.

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

### Segunda calibración: al unificar el ataque básico

Fijar el básico en 0,65 para todos obliga a recalcular el jutsu de cada uno, o el daño medio por
turno se descuadra. Misma ecuación, despejando la otra incógnita:

```
jutsu = T · D − (T−1) · 0,65
```

`D` se recupera exacto de los datos viejos (`D = básico / 0,6`), así que la migración no estima nada.
El efecto es el esperado: quien tenía un básico por encima de 0,65 (Zabuza, Pain) recibe un jutsu más
gordo a cambio, y quien lo tenía por debajo (Ino, Shikamaru) uno más pequeño, porque su básico ahora
aporta más.

| | antes de unificar | después |
|---|---|---|
| turnos, combate normal | 4,2–4,8 | 4,4–4,9 |
| victorias normales | 96–99 % | 96–97 % |
| victorias jefe 1 vs 1 | 7–21 % | 14 % en los seis |
| HP restante | 79–92 % | 80–92 % |
| jutsus por combate | 0,9–1,2 | 0,8–1,2 |

Lo llamativo es que **las victorias de jefe se han igualado a 14 %**, cuando antes iban de 7 % (Pain)
a 21 % (Kabuto). No es casualidad ni ruido: el daño medio de cada jefe no se ha movido, pero su
reparto en el tiempo sí. Pain carga en 4 turnos, así que ahora pega tres básicos flojos (0,65 en vez
de 0,96) antes de su golpe gordo — y como el combate dura ~4,5 turnos, buena parte de esa compensación
llega tarde o directamente no llega. **Con combates cortos, cargar lento sale caro por encima de lo
que dice la media.** Es un argumento más para alargar los combates en el punto 9 del roadmap, y hay
que tenerlo presente antes de tocar los perfiles de carga: `T` no es solo sabor, mueve la dificultad
real.

## Fuera de alcance

El [27](./27-sistema-de-balance.md) (catálogo de pasivas reutilizables, transformaciones que cambian
reglas en vez de multiplicar stats, objetos que definen el estilo de la run, reparto 40/30/30 del
poder) es un punto propio del roadmap. No se podía balancear hasta que la barra de jutsu existiera.
Lo único que se ha adelantado son sus dos enganches: `multiplicadorCarga` en los modos y
`carga.inicial` para los objetos.

Los tipos de efecto de jutsu más allá del daño (buff, curación, ignorar defensa) siguen apoyados en
`efectoEstado`, que está desactivado en los datos para el MVP — ver [09](./09-motor-engine.md).
