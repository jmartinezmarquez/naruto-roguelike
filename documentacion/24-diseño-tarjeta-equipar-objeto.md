# Rediseño de la pantalla de equipamiento de objetos (Inspiración Pokelike)

## Objetivo

Quiero cambiar por completo el flujo actual de equipar y usar objetos.

Actualmente, al pulsar un objeto aparece un pequeño formulario con un selector de personaje. Ese flujo es funcional, pero se siente demasiado "web" y poco propio de un RPG.

Quiero adoptar un comportamiento similar al de Pokelike.

La idea es que **al pulsar un objeto se abra una pantalla dedicada al objeto**, donde el jugador pueda ver claramente qué hace el objeto y sobre qué personaje quiere usarlo o equiparlo.

No quiero un `<select>` ni un formulario.

Quiero una experiencia visual.

---

# Flujo

Actualmente:

```
Mochila

↓

Pulsar objeto

↓

Selector

↓

Aceptar
```

Nuevo flujo:

```
Mochila

↓

Pulsar objeto

↓

Pantalla detalle del objeto

↓

Elegir personaje

↓

Equipar / Usar

↓

Volver automáticamente a la mochila
```

---

# Navegación

No hace falta React Router.

Simplemente utilizar un estado.

Ejemplo:

```jsx
const [screen, setScreen] = useState("inventory");

const [selectedItem, setSelectedItem] = useState(null);
```

Al pulsar un objeto:

```jsx
setSelectedItem(item);
setScreen("itemDetail");
```

---

# Diseño de la pantalla

La pantalla debe ocupar el mismo espacio que actualmente ocupa la mochila.

No quiero un modal flotante.

Debe sentirse como otra "pantalla" del juego.

Layout:

```
┌──────────────────────────────┐

        Sprite grande

    Pergamino de Chakra

      Común • Equipable

──────────────────────────────

⚔ +2 Ataque

──────────────────────────────

Lista de personajes

──────────────────────────────

Guardar en mochila

Cancelar

└──────────────────────────────┘
```

---

# Cabecera

Debe mostrar:

- Sprite grande del objeto
- Nombre
- Rareza
- Tipo

Ejemplo:

```
📜

Pergamino de Chakra

Común

Equipable
```

---

# Descripción

No mostrar la descripción completa del JSON.

Mostrar únicamente el efecto de forma visual.

Ejemplos:

```
⚔ +2 Ataque
```

```
❤ Cura 40%
```

```
🛡 +5 Defensa
```

```
⚡ +3 Velocidad
```

---

# Lista de personajes

Cada personaje debe aparecer como una tarjeta.

Ejemplo:

```
┌──────────────────────────────┐

(sprite)

Naruto Uzumaki

Lv.20

Objeto equipado

Vacío

[EQUIPAR]

└──────────────────────────────┘
```

---

Si ya tiene un objeto equipado:

```
Objeto equipado

📜 Pergamino de Viento

[EQUIPAR]
```

El jugador entiende inmediatamente que lo reemplazará.

---

# Objetos equipables

El botón será:

```
Equipar
```

Si el objeto ya está equipado por ese personaje:

```
Equipado
```

(desactivado)

---

# Consumibles

No se equipan.

La misma pantalla debe reutilizarse.

Simplemente cambia el botón.

Ejemplo:

```
Naruto

38 / 50 HP

[USAR]
```

---

# Footer

Dos botones.

```
Guardar en mochila
```

```
Cancelar
```

---

# Componentización React

```
<ItemDetailScreen>

    <ItemHeader />

    <ItemEffect />

    <CharacterEquipmentList />

    <FooterActions />

</ItemDetailScreen>
```

---

## ItemHeader

Responsabilidad:

Mostrar:

- Sprite
- Nombre
- Rareza
- Tipo

---

## ItemEffect

Mostrar únicamente el efecto visual del objeto.

Ejemplo:

```
⚔ +2 Ataque
```

---

## CharacterEquipmentList

Renderiza:

```jsx
<CharacterEquipmentCard />
```

por cada personaje del equipo.

---

## CharacterEquipmentCard

Responsabilidad:

Mostrar:

- Sprite
- Nombre
- Nivel
- Objeto equipado actualmente
- Botón correspondiente

Props:

```jsx
character

selectedItem

onEquip

mode // "equip" | "use"
```

---

## FooterActions

Dos botones.

```
Guardar en mochila
```

```
Cancelar
```

---

# CSS

Utilizar CSS Grid y Flex.

La pantalla debe mantener la estética del resto del juego.

Colores:

```
background:
#26221d

border:
#4d463b

texto:
#f4f0e3

texto secundario:
#a9a08e
```

Mucho padding.

Mucho espacio entre bloques.

---

# UX

Quiero que el jugador sienta que está gestionando un inventario de un RPG clásico.

No quiero formularios.

No quiero selects.

No quiero desplegables.

Todo debe hacerse mediante tarjetas grandes y botones claros.

Debe sentirse inspirado en Pokelike, pero adaptado al estilo visual y mecánicas de mi juego de Naruto.