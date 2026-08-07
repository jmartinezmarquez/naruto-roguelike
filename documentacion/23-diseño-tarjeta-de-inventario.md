# Rediseño de la tarjeta de Mochila (Inspiración Pokelike)

## Objetivo

Quiero rediseñar completamente la interfaz de la mochila de mi juego de Naruto.

La inspiración vuelve a ser **Pokelike**, pero **adaptándola a Naruto** y a las mecánicas de mi juego.

A diferencia de Pokelike, **mi juego sí tiene oro**, así que la interfaz debe reservar un espacio para mostrar el dinero del jugador.

Quiero una interfaz extremadamente limpia, retro, pixel-art y que se sienta como un JRPG clásico.

---

# Filosofía de diseño

Actualmente la mochila simplemente muestra una lista de objetos.

Quiero que la interfaz transmita que cada objeto es importante.

Cada objeto debe parecer un pequeño tesoro.

La pantalla debe estar dividida en dos paneles:

- Lista de objetos
- Información del objeto seleccionado

Muy parecido a Pokémon o Pokelike.

---

# Layout deseado

```
┌───────────────────────────────────────────────┐
│               MOCHILA                         │
├───────────────────────────────────────────────┤

🪙 Oro: 185

───────────────────────────────────────────────

📜 Pergamino de Chakra

💊 Píldora del Soldado

🌱 Semilla del Sabio

🪨 Fragmento del Sello Maldito

⚔ Fragmento Kubikiribōchō

...

───────────────────────────────────────────────

        Información del objeto seleccionado

            (sprite grande)

Pergamino de Chakra

Común

Equipable

"Aumenta el ataque +2"

Puede equiparse a cualquier ninja.

───────────────────────────────────────────────

Botón:
Equipar

o

Usar

(según el objeto)

└───────────────────────────────────────────────┘
```

---

# Distribución

Quiero dos columnas.

```
┌───────────────┬─────────────────────┐
│               │                     │
│ Lista objetos │ Información         │
│               │                     │
│               │                     │
└───────────────┴─────────────────────┘
```

En móvil pueden apilarse verticalmente.

---

# Cabecera

Arriba quiero únicamente:

```
MOCHILA
```

Con una fuente pixel grande.

Debajo:

```
🪙 Oro: 185
```

El oro debe ser muy visible.

Color:

dorado.

---

# Lista de objetos

Cada objeto debe verse como una pequeña fila.

Ejemplo:

```
📜 Pergamino de Chakra

💊 Píldora del Soldado

🌱 Semilla del Sabio
```

Cada fila tendrá:

- sprite
- nombre
- rareza (color)

No mostrar descripción aquí.

---

# Rareza

La rareza debe verse inmediatamente.

Común

verde

Raro

azul

Legendario

morado

Igual que los sprites ya diseñados.

---

# Objeto seleccionado

Cuando selecciono un objeto aparece un panel.

---

## Sprite

Grande.

Aproximadamente escalado x3.

Debe ser el protagonista.

---

## Nombre

Grande.

Ejemplo

```
Pergamino de Chakra
```

---

## Rareza

Debajo.

Ejemplo

```
Común
```

En verde.

---

## Tipo

Mostrar si es:

```
Consumible
```

o

```
Equipable
```

Con una pequeña etiqueta.

---

## Descripción

Texto corto.

Ejemplo

```
Aumenta el ataque del personaje en +2.
```

---

## Efecto

Mostrar de forma visual.

Ejemplo

```
⚔ Ataque +2
```

```
❤ Cura 40%
```

```
⚡ Velocidad +3
```

```
🛡 Defensa +5
```

Mucho más visual que leer JSON.

---

# Equipamiento

Si el objeto está equipado:

Mostrar:

```
Equipado por

Naruto Uzumaki
```

Con el pequeño sprite del personaje.

Si no:

```
No equipado
```

---

# Botón principal

Abajo.

Solo un botón.

Si es consumible

```
Usar
```

Si es equipable

```
Equipar
```

Si ya está equipado

```
Desequipar
```

---

# Estilo visual

Muy parecido a Pokelike.

---

## Fondo

```
#26221d
```

---

## Bordes

```
#4d463b
```

---

## Texto

```
#f4f0e3
```

---

## Texto secundario

```
#a9a08e
```

---

# Espaciado

Mucho padding.

Nada de elementos pegados.

Cada bloque separado.

---

# Componentización React

La idea es dividir toda la mochila en componentes reutilizables.

```jsx
<Inventory>

    <InventoryHeader />

    <GoldCounter />

    <ItemList />

    <ItemCard />

    <ItemActions />

</Inventory>
```

---

## InventoryHeader

Responsabilidad:

Mostrar

```
MOCHILA
```

---

## GoldCounter

Responsabilidad:

Mostrar

```
🪙 Oro: 185
```

---

## ItemList

Responsabilidad:

Renderizar todos los objetos.

```jsx
<ItemRow />
<ItemRow />
<ItemRow />
```

---

## ItemRow

Cada fila contiene:

- sprite
- nombre
- rareza

Y permite seleccionar el objeto.

---

## ItemCard

Muestra toda la información del objeto seleccionado.

Contiene:

```jsx
<ItemSprite />

<ItemName />

<ItemRarity />

<ItemType />

<ItemDescription />

<ItemEffects />

<EquippedCharacter />
```

---

## ItemActions

Responsabilidad:

Mostrar el botón correcto.

```
Usar
```

```
Equipar
```

```
Desequipar
```

Según el tipo del objeto.

---

# CSS

Usar Grid.

```css
.inventory{

display:grid;

grid-template-columns:

280px
1fr;

gap:20px;

}
```

En móvil:

```css
grid-template-columns:1fr;
```

---

# Lista de objetos

Cada fila:

```css
.item-row{

display:flex;

align-items:center;

gap:12px;

padding:10px;

border-radius:6px;

cursor:pointer;

}
```

Hover:

ligeramente más claro.

Seleccionado:

borde dorado.

---

# Panel del objeto

Usar Grid.

```css
.item-card{

display:grid;

gap:16px;

}
```

---

# Qué copiar de Pokelike

Sí quiero:

- fondo oscuro
- dos paneles
- sprite grande
- información muy ordenada
- mucho padding
- bloques claramente separados
- navegación rápida

---

# Qué NO quiero copiar

No quiero:

- listas infinitas difíciles de leer
- demasiados textos
- iconos enormes
- información repetida
- descripciones muy largas

---

# Diferencias respecto a Pokelike

Mi juego tiene mecánicas diferentes, por lo que la mochila debe aprovecharlas.

Quiero que la interfaz muestre claramente:

- Oro del jugador.
- Rareza de los objetos.
- Si un objeto es consumible o equipable.
- Qué personaje lleva equipado cada objeto.
- Un único botón contextual ("Usar", "Equipar" o "Desequipar").

---

# Objetivo final

Quiero una mochila que dé la sensación de estar jugando a un RPG clásico de Game Boy Advance o Nintendo DS.

Debe sentirse inspirada en Pokelike, pero adaptada completamente a Naruto.

Debe ser muy fácil de ampliar en el futuro (nuevos objetos, filtros, ordenación por rareza, búsqueda, etc.) sin tener que rehacer la interfaz.