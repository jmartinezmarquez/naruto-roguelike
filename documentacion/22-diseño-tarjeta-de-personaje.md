# Rediseño de la tarjeta de personaje (Inspiración Pokelike)

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