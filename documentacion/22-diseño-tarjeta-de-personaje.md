# Rediseño de la tarjeta de personaje (Inspiración Pokelike)

> **Estado: implementado** (puntos 8 y 11 del roadmap) en
> `components/common/PersonajeHoverCard.jsx` → `FichaPersonaje`, que es ahora la **única** tarjeta de
> personaje del juego: hover del mapa, selección de personaje, las tres cartas del pergamino de
> reclutar y la ficha del desafío legendario. Antes reclutar tenía su propio diseño en paralelo, con
> una barra por estadística —justo lo que este documento descarta— y sin sprite.
>
> **Dos cosas de aquí no se implementaron, a propósito:**
> - **La sección de transformación.** Es una decisión posterior a este documento: todos los personajes
>   tienen transformación (hay un test de invariante que lo garantiza), así que decir que la tienen no
>   distingue a nadie y sale igual en las 14 tarjetas. Son una sorpresa que se descubre en su pantalla
>   o viendo saltar su pasiva en combate — ver [30](./30-sistema-de-pasivas.md).
> - **La paleta concreta** (`#26221d`, `#4d463b`…). Se usa la del proyecto (`tinta-900`,
>   `pergamino-100`, tokens de `index.css`), que ya venía de la misma familia; meter una segunda
>   paleta solo para esta tarjeta habría sido la única pantalla con colores propios.
>
> El resto —sprite protagonista, bloques separados por línea, rareza en estrellas (**solo las
> estrellas y su color**: "★★★ Legendary" repetía dos veces el mismo dato y era lo más largo de la
> fila; la palabra se conserva en el `title`), afinidad de chakra,
> barra de HP con color por tramos, estadísticas en lista sin barras, jutsu sin descripción y objeto
> equipado— está tal cual se pedía.
>
> **Ajustes salidos de verlo en pantalla** (una vuelta de playtest sobre lo de arriba):
> - **El nombre no se trunca nunca**: va en su propia línea, y si no cabe entero se usa su versión
>   corta ("Naruto U.") en vez de partirlo en dos líneas — así la tarjeta no cambia de alto según a
>   quién mires. Truncarlo dejaba "Naruto Uzu…", justo el dato que la tarjeta existe para dar.
>   **Se mide, no se estima** (`NombreQueCabe`): el primer intento contaba caracteres contra un
>   máximo fijo, aprovechando que la fuente es monoespaciada, y falló en cuanto la misma ficha se usó
>   en tres anchuras — cabía en el hover del mapa (~232 px) y no en la de selección de personaje
>   (~189 px). Un número fijo tendría que ser el de la tarjeta más estrecha, y entonces todos los
>   nombres saldrían abreviados en todas partes. Ahora se pregunta al DOM (`scrollWidth >
>   clientWidth`) y **solo se cambia en un sentido**: volver al largo al ensanchar sería un bucle.
> - **El nombre del jutsu sí parte de línea**, no se trunca: llegan a 29 caracteres ("Super Beast
>   Imitation Drawing") y son nombres propios, no hay forma de abreviarlos. Esa fila son **tres
>   columnas** (icono / nombre / ritmo) y no un párrafo con el icono dentro del texto: en línea, un
>   jutsu de dos líneas dejaba la espiral pegada arriba y descentrada respecto al bloque. Y reserva
>   la altura de **dos líneas** siempre — es lo último de la tarjeta, así que sin reservarla las
>   tarjetas de un jutsu corto se quedaban con un hueco vacío abajo al estirarse la rejilla a la
>   altura de las de dos.
> - **Los nombres con paréntesis se cortan ahí**: "Pain (Deva Path)" se muestra como "Pain". El
>   paréntesis existe en los datos para distinguir Caminos, pero en pantalla ocupa el doble que el
>   nombre y es lo primero que se pierde al truncar. Lo hace `nombrePersonaje`, así que vale para
>   todas las pantallas; el dato no se toca. Ojo: **los dos puntos NO se cortan** ("Pain: Animal
>   Path"), porque ese es otro jefe del mismo arco y quedarían los dos como "Pain".
> - **Estadísticas con abreviaturas y sin iconos** (ATT / DEF / SPE / HP). "⚔ Attack" y "❤ Max HP" no
>   cabían en media columna, así que "Max HP" se partía en dos líneas y descuadraba la rejilla entera.
> - **La afinidad va en una pastilla del color de su naturaleza** en vez de un emoji suelto: se lee
>   como una etiqueta y le da a la tarjeta el único punto de color que tiene. Las clases van escritas
>   enteras en `clasePastillaDeTipo` y no compuestas (`bg-${tipo}/15`) — Tailwind escanea el código
>   como texto, así que una clase construida en tiempo de ejecución no llega al bundle.
> - **Los números de HP van centrados** bajo la barra: pegados a la derecha parecían el final de otra
>   cosa en vez de la lectura de la barra entera.

## Objetivo

Quiero rediseñar completamente la tarjeta de personaje de mi juego de Naruto.

La inspiración es **Pokelike**, pero **NO quiero copiar exactamente su interfaz**, sino utilizar su misma filosofía de diseño.

La idea es mantener una estética pixel-art, limpia, muy legible y con mucha jerarquía visual.

---

# Filosofía de diseño

Actualmente mi tarjeta tiene demasiada información mezclada y no existen bloques visuales claros.

Quiero que la nueva tarjeta esté dividida en secciones bien separadas, igual que hace Pokelike.

La prioridad visual debe ser:

1. Sprite
2. Nombre
3. Nivel
4. Vida
5. Estadísticas
6. Transformación
7. Jutsu
8. Objeto equipado

Todo debe respirar y tener bastante padding.

---

# Layout deseado

```
┌──────────────────────────────┐
│                              │
│          SPRITE              │
│                              │
│ Naruto Uzumaki ★             │
│ Lv.24                        │
│                              │
├──────────────────────────────┤
│ HP █████████████ 42/42       │
├──────────────────────────────┤
│ ⚔ Ataque      18             │
│ 🛡 Defensa     11             │
│ ⚡ Velocidad   15             │
│ ❤ HP Máx      42             │
├──────────────────────────────┤
│ 🔥 Modo Kyuubi               │
├──────────────────────────────┤
│ 🌀 Rasengan                  │
├──────────────────────────────┤
│ 📜 Pergamino de Chakra       │
└──────────────────────────────┘
```

---

# Estilo visual

Quiero una estética muy similar a Pokelike.

## Fondo

Color oscuro.

```
#26221d
```

---

## Bordes

```
#4d463b
```

---

## Texto principal

```
#f4f0e3
```

---

## Texto secundario

```
#a9a08e
```

---

## Padding

Generoso.

Todo debe respirar.

Nada de elementos pegados.

---

# Sprite

El sprite debe ser el elemento protagonista.

No quiero un icono pequeño.

Debe mostrarse aproximadamente a:

- sprite original escalado x3
- aproximadamente 64x64 visibles

Debe estar centrado.

---

# Nombre

Grande.

Negrita.

Ejemplo:

```
Naruto Uzumaki
```

Debajo:

```
Lv.25
```

Nada más.

---

# Rareza

No quiero mostrar tipos como Pokémon.

Prefiero mostrar la rareza.

Ejemplo:

```
★ Común
```

```
★★ Raro
```

```
★★★ Legendario
```

Con colores distintos.

Común:

gris

Raro:

azul

Legendario:

morado

---

# Afinidad elemental

Debajo del nivel.

Ejemplos:

```
🔥 Katon
```

```
🌊 Suiton
```

```
🌪 Fuuton
```

```
⚡ Raiton
```

```
🪨 Doton
```

Con un pequeño icono.

---

# Barra de HP

Quiero una barra prácticamente igual que la de Pokémon.

Con degradado:

Verde

↓

Amarillo

↓

Rojo

Dependiendo del porcentaje de vida.

Mostrar:

```
███████████

42 / 42
```

---

# Estadísticas

No quiero barras.

Prefiero una lista limpia.

Ejemplo:

```
⚔ Ataque      18

🛡 Defensa     11

⚡ Velocidad   15

❤ HP Máx      42
```

Todo perfectamente alineado.

---

# Transformación

Quiero una sección exclusiva.

Si el personaje no tiene transformación activa:

```
Sin transformación
```

Si sí:

```
🔥 Manto Kyuubi
```

Con un pequeño fondo naranja o una insignia para destacar.

---

# Jutsu

No mostrar la descripción.

Solo:

```
🌀 Rasengan
```

o

```
⚡ Chidori
```

o

```
🪨 Ataúd de Arena
```

Con el icono del elemento correspondiente.

---

# Objeto equipado

Última sección.

Ejemplo:

```
📜 Pergamino de Chakra
```

o

```
🥤 Píldora del Soldado
```

---

# Separadores

Cada bloque debe estar separado mediante una línea horizontal muy sutil.

Algo parecido a Pokelike.

---

# Componentización React

Me gustaría dividir la tarjeta en componentes pequeños.

Ejemplo:

```jsx
<CharacterCard>

    <CharacterPortrait />

    <CharacterHeader />

    <HealthBar />

    <Stats />

    <Transformation />

    <Jutsu />

    <Equipment />

</CharacterCard>
```

Cada componente debe recibir únicamente la información necesaria mediante props.

---

# Layout CSS

Usar CSS Grid.

Ejemplo:

```css
.character-card{

    display:grid;

    grid-template-rows:

    auto
    auto
    auto
    auto
    auto
    auto;

    gap:14px;

}
```

Las estadísticas:

```css
.stats{

    display:grid;

    grid-template-columns:

    1fr 1fr;

    row-gap:8px;

}
```

---

# Qué copiar de Pokelike

Sí quiero mantener:

- fondo oscuro
- sprite grande
- mucho padding
- nombre destacado
- barra HP estilo Pokémon
- bloques separados
- mucho espacio en blanco

---

# Qué NO quiero copiar

No quiero:

- demasiadas estadísticas
- barras para cada stat
- interfaz recargada
- demasiados colores
- demasiados iconos

---

# Objetivo final

Quiero una tarjeta elegante, muy limpia, retro y pixel-art.

Debe sentirse inmediatamente inspirada en Pokelike, pero adaptada a Naruto.

Debe ser fácilmente reutilizable para cualquier personaje del juego y funcionar bien con React y JSON.

Además, intenta que el CSS sea mantenible, reutilizable y fácil de extender para futuras funcionalidades (buffs, estados alterados, equipamiento adicional, etc.).

## Las bonificaciones en la ficha (2026-08-21)

La tarjeta reconstruía al luchador con `crearLuchador(base, nivel)` **desde el JSON crudo**, así que
no veía `instancia.bonificaciones`. Consecuencia: 🐛 **la mejora permanente de un evento no aparecía
en ninguna pantalla del juego**, y el número de la ficha era **más bajo** que el que de verdad
peleaba. Salió al pedir que se vieran los buffs temporales, que es el mismo agujero un piso más allá.

Ahora `FichaPersonaje` acepta dos props opcionales, `bonificaciones` y `multiplicadoresBuffs`, y
**solo se los pasa el panel de equipo del mapa**: un candidato de reclutar o una entrada del Bingo
Book no tiene ni lo uno ni lo otro, y pasárselos sería inventar.

⚠️ **Los deltas se MIDEN, no se copian del dato**, y por dos razones distintas:

- La mejora permanente se suma a `statsBase` **antes** de escalar por nivel
  (`calcularStatsPorNivel`), así que un `+4` guardado en la instancia vale +4 a nivel 1 y bastante más
  a nivel 40. Pintar el número guardado mentiría **cada vez más según avanza la run**.
- El buff temporal es un **multiplicador**, no una suma: cuántos puntos vale depende del nivel, del
  modo activo y de la mejora permanente que ya lleve encima.

Por eso se construyen tres luchadores —pelado, con mejora, y efectivo— y los deltas son la resta. Es
más código que leer `bonificaciones.ataque`, y es la única forma de que el número de la ficha sea el
que pelea. Por lo mismo, `combinarMultiplicadoresTemporales` **se exporta del store** en vez de
reimplementarse en la UI: dos versiones de esa fórmula acabarían discrepando, y una discrepancia así
no falla, miente.

⚠️ **Y los dos deltas van en colores distintos** —dorado el permanente, verde el temporal— porque son
cosas distintas. Con un solo color la ficha diría que el personaje vale eso, y dentro de tres
combates ya no.

## ATK, DEF, SPD, HP — un solo sitio donde se escriben

Había **dos** tablas de abreviaturas, una en esta ficha y otra en la enciclopedia, y las dos decían
`ATT`/`SPE` mientras las pastillas de evento decían `ATK`/`SPD`: **el mismo dato con dos nombres en la
misma partida**. Ahora las cuatro salen de `nombreStat` (`components/common/efectos.js`), que ya era
el vocabulario de las pastillas. `ATK` porque es la abreviatura extendida; `SPE` cambió a `SPD` de
rebote, por venir de la misma tabla.

### 🐛 Y el envoltorio se las comía

Al enchufarlo, `bonificaciones` y `multiplicadoresBuffs` llegaban del mapa a `PersonajeHoverCard`… que
no las declaraba, así que **las tiraba por el camino** y a `FichaPersonaje` no le llegaba nada. En
pantalla no se veía ningún delta.

⚠️ Lo grave no es el olvido, es que **los tests estaban todos en verde**: montaban `FichaPersonaje`
directamente, o sea que probaban las dos piezas y **no la unión**. Con un componente que en el juego
se usa SIEMPRE a través de un envoltorio, la unión es justo donde vive el fallo. Ahora hay tres tests
que montan `PersonajeHoverCard`, y el `PersonajeHoverCard` lleva escrito arriba que cualquier prop
nueva de la ficha hay que añadirla también ahí.
