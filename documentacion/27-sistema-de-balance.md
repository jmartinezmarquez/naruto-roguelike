# Revisión del sistema de balance (MVP)

## Objetivo

Quiero rediseñar el sistema de progresión del juego para evitar el efecto "bola de nieve" que existe actualmente.

Ahora mismo el jugador obtiene poder desde tres sistemas distintos:

- Subidas de nivel.
- Transformaciones.
- Objetos equipables.

Los tres aumentan principalmente las mismas estadísticas (HP, Ataque, Defensa y Velocidad), haciendo muy difícil equilibrar la dificultad.

Como consecuencia:

- Si los enemigos están equilibrados para el inicio de la partida, el jugador termina siendo demasiado fuerte.
- Si los enemigos están equilibrados para el final de la partida, el inicio resulta demasiado difícil.

Quiero cambiar esta filosofía.

---

# Filosofía

Cada sistema debe aportar una forma distinta de progresión.

No quiero que todo se reduzca a obtener números cada vez más grandes.

La identidad del personaje debe venir de sus transformaciones.

La estrategia de la run debe venir de los objetos.

Los niveles deben representar únicamente el crecimiento natural del personaje.

---

# Niveles

Los niveles representan experiencia.

Quiero que siempre sean útiles, pero que nunca rompan el balance.

Los incrementos deberían ser pequeños.

Ejemplo:

```
+2 HP

+1 Ataque

+1 Defensa

+1 Velocidad
```

No quiero grandes saltos de poder únicamente por subir de nivel.

---

# Transformaciones

Las transformaciones deben dejar de ser únicamente multiplicadores de estadísticas.

Cada transformación debería responder a una pregunta muy sencilla:

> ¿Qué puede hacer ahora este personaje que antes no podía hacer?

Quiero que las transformaciones cambien el estilo de juego.

No simplemente el daño que hacen.

---

## Ejemplos

### Naruto - Manto del Kyūbi

- El primer jutsu del combate hace un 40% más de daño.
- Recupera un pequeño porcentaje de HP al derrotar un enemigo.

---

### Naruto - Modo Sabio

- Los jutsus ignoran parte de la defensa enemiga.
- El daño mínimo nunca baja de un determinado porcentaje.

---

### Sasuke - Marca Maldita

- Los ataques básicos tienen una probabilidad de repetir el golpe.

---

### Sasuke - Susanoo

- El primer ataque recibido en cada combate queda completamente bloqueado.

---

### Gaara - Escudo Absoluto

- El primer golpe recibido en cada combate hace un 80% menos de daño.

---

### Rock Lee - Puertas Internas

- Siempre ataca primero.

---

### Shikamaru

En lugar de aumentar estadísticas:

- El enemigo actual inflige menos daño durante todo el combate.

Más adelante esta habilidad podría evolucionar para afectar a todos los enemigos del encuentro.

---

# Filosofía de las habilidades

Quiero que la mayoría de habilidades se centren en modificar reglas del combate.

Ejemplos:

- Primer ataque.
- Primer golpe recibido.
- Primer jutsu.
- Curación.
- Recuperación entre combates.
- Probabilidad de crítico.
- Prioridad.
- Ignorar defensa.
- Reducir daño.
- Curación tras derrotar enemigos.

No quiero que la mayoría de habilidades simplemente otorguen:

```
+40 Ataque

+60 Defensa
```

---

# Objetos equipables

Los objetos ya no deberían competir con las transformaciones aumentando únicamente estadísticas.

Su función será definir el estilo de la run.

Quiero que el jugador tome decisiones.

---

# Categorías de objetos

## Objetos de combate

Afectan directamente al combate.

Ejemplos:

### Protector Ninja

El primer golpe recibido hace un 50% menos de daño.

---

### Pergamino de Chakra

El primer jutsu del combate hace un 20% más de daño.

---

### Kunai Afilado

Los ataques básicos hacen una pequeña cantidad de daño adicional.

---

### Botas Shinobi

Siempre comienzas el combate con prioridad.

---

## Objetos de supervivencia

No aumentan el daño.

Aumentan la consistencia de la run.

Ejemplos:

### Cantimplora

Recupera un pequeño porcentaje de HP tras cada combate.

---

### Raciones Ninja

Si terminas un combate con poca vida recuperas HP adicional.

---

## Objetos económicos

No modifican el combate.

Mejoran la progresión de la partida.

Ejemplos:

- Más oro.
- Más experiencia.
- Más objetos en la tienda.
- Descuentos.
- Mayor probabilidad de eventos raros.

---

## Objetos de riesgo

Muy potentes.

Con una desventaja clara.

Ejemplo:

### Fragmento del Sello Maldito

- Los jutsus hacen un 30% más de daño.
- Recibes un 15% más de daño.

Quiero que obliguen al jugador a decidir si merece la pena asumir ese riesgo.

---

## Objetos exclusivos de jefes

Los objetos obtenidos al derrotar un jefe deberían sentirse únicos.

No quiero simplemente:

```
+5 Ataque
```

Prefiero efectos exclusivos.

Ejemplos:

### Kubikiribōchō

Al derrotar a un enemigo recuperas una pequeña cantidad de HP.

---

### Fragmento de la Calabaza

Cuando bajas del 30% de vida reduces el siguiente daño recibido.

---

### Fragmento del Rinnegan

El primer jutsu del combate ignora completamente la defensa del enemigo.

---

# Distribución del poder

Objetivo aproximado:

```
40%

Objetos

30%

Transformaciones

30%

Niveles
```

Así ninguna mecánica domina completamente el juego.

---

# Combates contra múltiples enemigos (Futuro)

Aunque el MVP estará centrado principalmente en combates contra un único enemigo, quiero que la arquitectura permita evolucionar fácilmente hacia encuentros con varios enemigos.

No es una prioridad inmediata.

No quiero complicar el desarrollo del MVP.

Pero sí quiero dejar preparada la base.

---

## Filosofía

Los combates seguirán siendo principalmente 1 vs 1.

Cuando un enemigo muera entrará el siguiente.

Ejemplo:

```
Naruto

↓

Bandido

↓

Ninja de la Niebla

↓

Haku
```

No habrá varios enemigos atacando simultáneamente.

Sin embargo, algunas habilidades podrán afectar a enemigos que todavía no han entrado en combate.

---

## Ejemplos

### Shikamaru

MVP:

- El enemigo actual hace menos daño.

Futuro:

- Todos los enemigos del encuentro hacen menos daño.

---

### Pain

MVP:

- Shinra Tensei afecta únicamente al enemigo actual.

Futuro:

- Shinra Tensei puede dañar a todo el equipo del jugador.

Esto permite representar mucho mejor el poder del personaje.

---

### Orochimaru

Las invocaciones o efectos podrían permanecer activos aunque cambie el enemigo.

---

### Hidan

Cada vez que derrota a un personaje obtiene una bonificación permanente hasta terminar el combate.

---

### Debuffs persistentes

Ejemplos:

- Reducir la vida inicial del siguiente enemigo.
- Aplicar un estado alterado al siguiente enemigo.
- Debilitar a todos los enemigos del encuentro.

---

# Arquitectura de habilidades

No quiero programar habilidades pensando únicamente en un enemigo.

Prefiero que todas las habilidades puedan indicar sobre qué objetivo actúan.

Ejemplos conceptuales:

- Uno mismo.
- Enemigo actual.
- Todos los enemigos.
- Todo el equipo aliado.
- Todo el combate.
- Siguiente enemigo.

Durante el MVP prácticamente todas utilizarán únicamente:

- Uno mismo.
- Enemigo actual.

Pero la arquitectura ya permitirá ampliar el sistema sin tener que rehacer el motor.

---

# Arquitectura de transformaciones

Las transformaciones no deberían contener únicamente multiplicadores.

También deberían poder incluir habilidades pasivas.

Ejemplo conceptual:

```json
{
  "name": "Modo Sabio",

  "multipliers": {
    "attack": 1.15
  },

  "passives": [
    "first_jutsu_bonus",
    "ignore_defense"
  ]
}
```

---

# Catálogo de pasivas

Quiero disponer de un catálogo reutilizable de efectos.

Ejemplos:

- first_jutsu_bonus
- first_hit_block
- ignore_defense
- heal_on_kill
- priority
- reduce_damage_taken
- bonus_gold
- bonus_experience
- heal_after_battle
- next_enemy_debuff
- all_enemies_debuff
- first_attack_bonus

Las transformaciones y los objetos reutilizarán estas pasivas.

No quiero duplicar lógica.

---

# Objetivo final

Quiero que el jugador se haga más fuerte durante la run, pero que ese poder provenga principalmente de decisiones y sinergias.

Quiero evitar que todo se reduzca a acumular estadísticas.

Las transformaciones deben hacer que cada personaje se sienta único.

Los objetos deben definir la estrategia de la partida.

Los niveles deben proporcionar una progresión constante pero controlada.

Además, quiero dejar preparada la arquitectura para que, en futuras campañas, sea posible introducir jefes mucho más espectaculares (como Pain), encuentros con varios enemigos y habilidades que afecten al estado global del combate, sin tener que rediseñar el motor de juego.