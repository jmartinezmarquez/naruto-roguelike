# Rediseño de la pantalla de Misiones / Logros (Inspiración Pokelike)

## Objetivo

Quiero rediseñar completamente la pantalla de **Misiones / Logros** de mi juego de Naruto.

Actualmente existe una lista vertical de logros funcional, pero demasiado parecida a una web.

Quiero una interfaz mucho más cercana a un RPG clásico como Pokelike, donde desbloquear contenido se sienta como una parte importante de la progresión del juego.

La pantalla debe ser uno de los principales sistemas de **meta-progresión** del juego.

---

# Filosofía

Las misiones NO son únicamente una lista de logros.

Deben cumplir tres objetivos:

- Guiar al jugador.
- Recompensar el progreso.
- Desbloquear contenido permanente entre partidas.

Quiero que el jugador entre regularmente en esta pantalla para consultar qué objetivos le quedan.

---

# Distribución general

La pantalla debe ocupar prácticamente toda la ventana del juego.

```
┌──────────────────────────────────────────────────────────────┐

                    MISIONES

                     Logros

              12 / 38 desbloqueados

──────────────────────────────────────────────────────────────

Categorías

[Todos] [Generales] [Acto 1] [Acto 2] [Acto 3]

──────────────────────────────────────────────────────────────

Lista de logros

──────────────────────────────────────────────────────────────

Recompensas globales

──────────────────────────────────────────────────────────────

             Volver

└──────────────────────────────────────────────────────────────┘
```

---

# Cabecera

Debe mostrar únicamente:

```
MISIONES

Logros

12 / 38 desbloqueados
```

No hace falta añadir más información.

Debe ser muy limpia.

---

# Categorías

No tenemos generaciones como Pokémon.

En su lugar quiero utilizar categorías relacionadas con el progreso del juego.

## Todos

Muestra todos los logros.

---

## Generales

Logros que pueden conseguirse en cualquier run.

Ejemplos:

- Recluta 10 ninjas.
- Consigue 1000 de oro.
- Usa 20 objetos.
- Completa 30 combates.

---

## Acto 1

Todo relacionado con el País de las Olas.

Ejemplos:

- Derrota a Haku.
- Derrota a Zabuza.
- Completa el acto sin perder ningún ninja.

---

## Acto 2

Bosque de la Muerte.

Ejemplos:

- Derrota a Orochimaru.
- Recluta a Gaara.
- Sobrevive a cinco combates seguidos.

---

## Acto 3

Asalto a Konoha.

Ejemplos:

- Derrota a Pain.
- Completa la run.
- Recluta un personaje legendario.

---

# Lista de logros

Cada logro debe ser una tarjeta horizontal.

Muy similar a Pokelike.

Ejemplo:

```
┌──────────────────────────────────────────────┐

(icono)

El Espejo Roto

Derrota a Haku.

Desbloquea a Haku como personaje reclutable.

                    DESBLOQUEADO

        recompensa

└──────────────────────────────────────────────┘
```

---

# Contenido de cada tarjeta

## Icono

Cada logro tendrá un sprite propio.

Ejemplos:

Haku

→ espejo roto

Zabuza

→ máscara demonio

Gaara

→ calabaza

Pain

→ Rinnegan

Equipo intacto

→ protector ninja

Los iconos deben ser pixel-art y coherentes con el resto del juego.

---

## Nombre

Grande.

En negrita.

---

## Objetivo

Una única frase.

Ejemplo

```
Derrota a Haku en cualquier run.
```

---

## Recompensa

Mostrar qué desbloquea.

Ejemplo

```
Desbloquea a Haku como reclutable.
```

o

```
Empiezas futuras runs con un Pergamino de Chakra.
```

---

## Estado

Solo dos estados.

```
DESBLOQUEADO
```

Color verde.

```
PENDIENTE
```

Color gris.

---

## Recompensa inmediata

En la parte derecha de la tarjeta.

Ejemplos:

🪙 50

📜 x1

💎 x1

⭐⭐

No hace falta texto.

Solo icono y cantidad.

---

# Recompensas globales

La parte inferior será una barra de progresión.

No representa una misión.

Representa la progresión total del jugador.

Ejemplo:

```
5 logros

+5% Oro

──────────────

10 logros

+5% EXP

──────────────

20 logros

Empiezas con un objeto común.

──────────────

30 logros

+1 espacio inventario

──────────────

50 logros

Mayor probabilidad de ninjas raros.
```

Cada recompensa debe representarse como un pequeño nodo con:

- icono
- texto corto
- progreso

Si aún no está desbloqueada:

candado.

---

# Colores

Mantener exactamente la estética del resto del juego.

```
background

#26221d

panel

#2d2923

bordes

#4d463b

texto principal

#f4f0e3

texto secundario

#a9a08e

rojo

#d4543a

verde

#62b36f

oro

#d4a93a
```

---

# Navegación

No quiero cambiar de ruta.

Simplemente abrir esta pantalla desde el menú lateral.

Ejemplo:

```jsx
setMenuScreen("missions");
```

Cerrar:

```jsx
setMenuScreen(null);
```

---

# Componentización React

```jsx
<MissionsScreen>

    <MissionHeader />

    <MissionCategories />

    <MissionList />

    <GlobalProgress />

    <Footer />

</MissionsScreen>
```

---

## MissionHeader

Responsabilidad:

Mostrar

- título
- progreso

---

## MissionCategories

Renderizar los botones:

```
Todos

Generales

Acto 1

Acto 2

Acto 3
```

Debe permitir cambiar el filtro.

---

## MissionList

Renderiza

```jsx
<MissionCard />
```

por cada logro.

---

## MissionCard

Debe recibir:

```jsx
mission

completed

reward

onClick
```

Mostrar:

- icono
- nombre
- descripción
- recompensa
- estado

---

## GlobalProgress

Mostrar los hitos permanentes.

Ejemplo:

```jsx
<ProgressReward />
```

Cada nodo representa una recompensa desbloqueable.

---

## Footer

Un único botón.

```
Volver
```

Que cierre la pantalla.

---

# Datos

Cada misión debería tener una estructura similar a esta:

```ts
interface Mission {
  id: string;
  title: string;
  description: string;
  rewardDescription: string;
  rewardIcon: string;
  rewardAmount?: number;

  category:
    | "general"
    | "act1"
    | "act2"
    | "act3";

  completed: boolean;

  icon: string;
}
```

Las recompensas globales:

```ts
interface ProgressReward {

    required:number;

    title:string;

    description:string;

    unlocked:boolean;

    icon:string;

}
```

---

# UX

Quiero que el jugador pueda entender toda la pantalla en menos de cinco segundos.

Debe quedar muy claro:

- qué misiones existen,
- cuáles ha completado,
- qué recompensas obtiene,
- cuánto le queda para el siguiente desbloqueo permanente.

No quiero menús complejos ni demasiados textos.

Todo debe ser muy visual.

---

# Estética

La interfaz debe sentirse como un menú de un JRPG clásico.

Inspiración:

- Pokelike
- Pokémon GBA
- Golden Sun
- Final Fantasy Tactics Advance

No debe parecer una página web.

Debe parecer una pantalla integrada dentro del propio juego.

---

# Objetivo final

Quiero que esta pantalla se convierta en el principal sistema de **meta-progresión** del juego.

Cada misión completada debe hacer que el jugador sienta que su cuenta progresa de forma permanente, incluso aunque pierda una run.

Debe ser una pantalla agradable de consultar y muy fácil de ampliar en el futuro añadiendo nuevos actos, nuevas categorías y nuevos logros sin modificar la arquitectura existente.