# Meta-progresión: pergaminos, gacha, maestría y actos variables (diseño)

> **Estado: DISEÑO, sin implementar** (2026-10-15). Recoge lo acordado con el usuario tras el
> playtest: *"el juego se siente bien, pero falta un gancho que te haga volver a jugar"*. Los números
> son un punto de partida calculado sobre la estructura actual de la run; se ajustan midiendo, como el
> resto del balance.

## El problema

Lo que hoy hace volver: 28 logros (18 de ellos **sin recompensa**), la ascensión (5 escalones), el
Bingo Book y el Salón de la Fama. Falta lo que tienen los roguelites que enganchan: **algo que avance
en cada partida, también al perder**, y **variedad** — hoy la run son siempre los mismos tres arcos, con
los mismos jefes, en el mismo orden.

## Las cinco piezas

1. **Pergaminos de invocación**: la moneda. Se ganan en cada run según hasta dónde llegas.
2. **El gacha** ("Invocación"): se gastan en tiradas que dan personajes, objetos iniciales y otras
   cosas **nuevas**. Puede dar duplicados.
3. **Nivel de ninja (maestría)**: cada personaje acumula XP entre runs; los duplicados del gacha le
   suben de nivel. Los **aspectos y títulos salen de la maestría**, no del gacha.
4. **Más logros**, que dan pergaminos.
5. **Más contenido y actos variables**: héroes y villanos nuevos, y una campaña donde cada acto puede
   salir de varios arcos.

Y dos extras baratos para volver cada día: el **desafío diario** y los **retos opcionales** por run.

⚠️ **Regla de oro: el gacha reparte cosas NUEVAS, nunca encierra lo que hoy está abierto.** Todos los
comunes se pueden reclutar desde la primera run; meterlos detrás del gacha quitaría algo que el jugador
ya tenía, y eso se vive como un castigo, no como un aliciente.

---

## 1. Pergaminos de invocación

### Cuántos se ganan

| Fuente | Pergaminos |
|---|---|
| Mini-jefe derrotado | 1 |
| Jefe final derrotado | 2 |
| Run ganada | +3 |
| Ascensión | ×(1 + 0,2 × nivel): A5 dobla |
| Reto opcional activo | +25% por reto (ver §6) |
| Desafío diario superado (primera vez del día) | +3 |
| Primera vez que derrotas a un jefe | +2 (una vez por jefe, en toda la partida guardada) |
| Logros | 2-5 cada uno (ver §4) |

Con la estructura actual (3 arcos, mini-jefe y jefe final en cada uno):

| Run típica | Pergaminos |
|---|---|
| Cae en el arco 1 antes de Zabuza | 1 |
| Cae en el arco 2, contra Gaara | 1 + 2 + 1 = **4** |
| Cae en el arco 3, contra Pain | 1 + 2 + 1 + 2 + 1 = **7** |
| Gana la run (A0) | 9 + 3 = **12** |
| Gana en A5 | **24** |

Los primeros jefes derrotados y los logros fáciles dan además un empujón inicial de ~40-60 pergaminos
en las primeras runs, que es justo cuando más hay que enganchar.

### Por qué así

- **Perder también suma.** Una run perdida en el arco 2 da casi una tirada: la sensación de "una más".
- **Ganar cuenta mucho más** (12 frente a 4) sin que perder sea inútil.
- **La ascensión paga**: es el motivo para subir de escalón además del logro.

---

## 2. El gacha: "Invocación"

Una pantalla nueva en el Home (junto a Missions, Bingo Book y Hall of Fame).

### Precio y probabilidades

| | |
|---|---|
| Una tirada | 5 pergaminos |
| Diez tiradas | 45 pergaminos (una gratis) |
| Probabilidades | Común 60% · Raro 30% · Legendario 10% |
| Garantía de raro | como mínimo un raro o mejor cada 10 tiradas |
| Garantía de legendario | un legendario como mucho cada 30 tiradas |

**Probabilidades a la vista** en la propia pantalla, con el contador de la garantía. Es la regla de los
eventos (documentacion/35): esconder las reglas no es tensión, es trampa.

### Qué puede salir

| Categoría | Ejemplos | Rareza | Disponible |
|---|---|---|---|
| **Personaje nuevo** (entra en el pool de reclutables y como inicial) | Gai, Asuma, Kurenai, Jiraiya, Tsunade, Temari, Kankurō, Konohamaru | raro / legendario | fase 3 |
| **Personaje como inicial** (los que hoy solo se consiguen jugando) | Yamato, Kakashi, los jefes desbloqueados por logro | raro / legendario | fase 2 |
| **Objeto inicial** (se elige uno al empezar la run) | Soldier Pill, Chakra Seal, Ankle Weights… | común | fase 2 |
| **Página del Bingo Book** con historia del personaje | — | común | fase 2 |

Al estrenar el gacha (fase 2) el catálogo tiene **~25 cosas**; con la primera tanda de personajes
nuevos (fase 3), **~35**.

### Duplicados

**Puede dar duplicados**, y no se tiran:

- **Personaje repetido → +1 nivel de ninja** (§3). Es la forma rápida de subir a tu favorito.
- **Objeto o página repetidos → se devuelven 2 pergaminos** (el 40% de la tirada).

### Cuánto dura

Con ~35 cosas, probabilidades por rareza y duplicados, sacar todo el catálogo cuesta del orden de
**100-120 tiradas** (≈ 500-600 pergaminos). A una media de 6-8 pergaminos por run más los logros,
son **~60-80 runs**: más o menos lo que dura el desbloqueo completo de un roguelite como Slay the Spire,
y cada tanda nueva de personajes lo alarga. Las primeras runs dan una tirada casi cada partida, que es
lo que engancha al principio.

---

## 3. Nivel de ninja (maestría)

Cada personaje tiene un **nivel de ninja** propio, entre runs, distinto del nivel dentro de la run.

### Cómo sube

| Fuente | XP de ninja |
|---|---|
| Combate ganado con él en el equipo | 1 |
| Jefe derrotado con él en el equipo | 5 |
| Run ganada con él en el equipo | 20 |
| **Duplicado en el gacha** | **+1 nivel directamente** |

Nivel *n* → *n+1* cuesta 40 × *n* XP. Tope: nivel 10.

### Qué da

| Nivel | Recompensa |
|---|---|
| 2 | Primer título ("Genin de la Hoja", "Bestia Verde de Konoha"…) |
| 4 | **Primer aspecto alternativo** (traje de Shippūden) |
| 6 | Segundo título |
| 8 | Marco de tarjeta especial en el Bingo Book y en la selección |
| 10 | **Segundo aspecto** (versión de élite) y título de maestro |

⚠️ **Decisión pendiente: ¿la maestría da poder?** La propuesta es que **no**: solo aspectos, títulos y
marcos. El juego está calibrado contra niveles de enemigo fijos (documentacion/11), y un ninja que se
hace más fuerte entre runs rompe esa calibración y vacía de sentido la ascensión. Si se quiere algo de
poder, el límite razonable sería **elegir un objeto inicial propio** del personaje al nivel 8, medido con
el simulador antes de darlo por bueno.

---

## 4. Más logros

Los 18 logros "de honor" pasan a dar **2-5 pergaminos** según su dificultad. Y unos 20 nuevos:

**Por personaje** (dan ganas de probar a cada ninja):
- Gana una run con Shikamaru de líder.
- Derrota a Zabuza con Sasuke en el equipo.
- Completa un arco sin que caiga Hinata.
- Gana una run con un equipo de tres comunes.
- Llega al nivel de ninja 5 con cualquier personaje · con 5 personajes distintos.

**De reto:**
- Gana una run sin pisar ninguna tienda.
- Derrota a un jefe final sin relevos (el primero lo gana solo).
- Gana una run sin usar ningún consumible.
- Supera el desafío diario 7 días distintos.

**De colección:**
- Completa el Bingo Book (todo visto).
- Consigue los dos aspectos de un personaje.
- Saca 10 legendarios en el gacha.

Hacen falta **tres condiciones nuevas** en `engine/achievements.js` (hoy hay cinco): "con este personaje
en el equipo / de líder", "sin X en la run" (tiendas, consumibles, relevos) y "nivel de ninja mínimo".
Con ellas, cada logro nuevo vuelve a ser solo datos.

---

## 5. Más contenido y actos variables

### La campaña pasa de lista de arcos a lista de ACTOS

Hoy `campaigns.json` es una lista fija de tres arcos. Pasa a ser una lista de **actos**, y cada acto, un
**pool de arcos**; al empezar la run se sortea uno por acto:

| Acto | Niveles | Arcos posibles |
|---|---|---|
| 1 | 1-10 | País de las Olas · *(más adelante: una misión de rango C)* |
| 2 | 17-27 | Examen Chūnin · **Persecución de Sasuke** (nuevo) |
| 3 | 33-44 | Invasión de Pain · **Rescate de Gaara** (nuevo) · **Hidan y Kakuzu** (nuevo) |

⚠️ **Un arco se calibra para su ACTO, no por su cuenta.** Los niveles de enemigo son fijos
(documentacion/11): un arco nuevo del acto 2 tiene que pelearse a los niveles del acto 2, o la curva de
niveles de la run se rompe. Por eso cada arco nuevo nace con su acto decidido y se mide con el
simulador como los que hay.

### Villanos para los arcos nuevos

| Arco (acto) | Mini-jefe | Jefe final | Enemigos nombrados |
|---|---|---|---|
| Persecución de Sasuke (2) | Jirōbō o Kidōmaru | **Kimimaro** | Sakon/Ukon, Tayuya |
| Rescate de Gaara (3) | Sasori | **Deidara** | Marionetas, arcilla |
| Hidan y Kakuzu (3) | Hidan | **Kakuzu** | — |

Más adelante: **Itachi y Kisame** (acto 2 o 3) y **Orochimaru** (la invasión de Konoha durante el
examen). Como los jefes de hoy, los villanos se pueden **desbloquear como reclutables** por logro o, como
legendarios, por el gacha.

### Héroes nuevos

Gai, Asuma, Kurenai, Jiraiya, Tsunade, Temari, Kankurō, Konohamaru. Entran en el gacha (§2) y, una vez
sacados, en el pool de reclutables de su acto.

**Coste de un personaje nuevo**: datos (personaje, jutsu, modos con pasivas del catálogo) más **una
hoja de arte** (base + transformaciones en la misma hoja, ver documentacion/41) y un proyectil. Con
Kakashi fueron tres ficheros de datos; el arte ya tiene su proceso montado. Cada uno se calibra por su
**puesto** entre los candidatos a la posición 1 (la regla de Kakashi, documentacion/11) y con el bloque
"Fuerza de cada personaje" del simulador.

---

## 6. Para volver cada día

- **Desafío diario**: una run con el mapa y las ofertas generados con la **fecha como semilla**. El mismo
  para cualquiera ese día, sin servidor. Da +3 pergaminos la primera vez y tiene su propio récord.
- **Retos opcionales al empezar** ("enemigos +20%", "sin descansos", "solo dos personajes"…): cada uno
  activo da **+25% de pergaminos**. La ascensión es una escalera; esto son elecciones, y se combinan.

---

## Plan por fases

| Fase | Qué | Tamaño |
|---|---|---|
| **1** | Pergaminos (fuentes y tabla de §1), recompensa al acabar la run, logros con recompensa y ~20 nuevos con sus 3 condiciones | 1-2 sesiones |
| **2** | Pantalla de Invocación con probabilidades, garantías y duplicados; catálogo inicial (iniciales, objetos iniciales, páginas); nivel de ninja y sus recompensas | 2 sesiones |
| **3** | Primera tanda de personajes nuevos (3-4 héroes) con su arte | 1 sesión + arte |
| **4** | Actos variables (campaña por actos) y el primer arco nuevo con sus villanos | 2 sesiones + arte |
| **5** | Desafío diario y retos opcionales | 1 sesión |

Cada fase se juega sola: la 1 ya da progreso; la 2 ya engancha con lo que hay; la 3 y la 4 son las que
lo mantienen vivo.

## Decisiones pendientes

1. **¿La maestría da algo de poder?** Propuesta: no (ver §3).
2. **¿El objeto inicial se elige o sale al azar** entre los desbloqueados? Propuesta: se elige uno de tres
   al azar, como las cartas de Slay the Spire: hay decisión y no es siempre el mismo.
3. **¿Los aspectos alternativos son solo de héroes** o también de villanos reclutables?
