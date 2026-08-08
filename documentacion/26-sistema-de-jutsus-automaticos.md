# Sistema de Jutsus Automáticos (MVP)

## Objetivo

Actualmente todos los personajes realizan un único ataque automático continuo.

Aunque visualmente ese ataque se llame "Rasengan", "Chidori" o "Ataque de Arena", mecánicamente todos funcionan exactamente igual.

Quiero introducir un segundo nivel de profundidad sin perder la filosofía del juego:

- El combate debe seguir siendo completamente automático.
- El jugador no debe tener que pulsar botones durante el combate.
- Los personajes deben sentirse diferentes entre sí.

---

# Filosofía

Cada personaje tendrá dos tipos de ataques.

## Ataque básico

Es el ataque automático que realiza continuamente durante el combate.

No consume recursos.

Es exactamente el sistema actual.

---

## Jutsu

Cada personaje tendrá un único Jutsu especial.

No puede utilizarse continuamente.

Debe cargarse durante el combate.

Cuando esté listo se lanzará automáticamente.

El jugador no tiene que tomar ninguna decisión.

Simplemente observa cómo el personaje acumula chakra y utiliza su técnica especial.

---

# Barra de Jutsu

No quiero llamarla "barra de chakra".

El jugador realmente no necesita conocer cuántos puntos de chakra tiene.

Lo importante es saber cuándo estará preparado el siguiente Jutsu.

Visualmente quiero una pequeña barra o indicador debajo de la vida.

Ejemplo:

```
HP

████████████

Jutsu

████░░░░░░░
```

Cuando llegue al máximo:

```
HP

████████████

Jutsu

████████████

↓

🌀 Rasengan

↓

Barra vacía
```

---

# Cómo se carga

El indicador se carga automáticamente durante el combate.

Inicialmente quiero estas fuentes de carga:

- Realizar ataques básicos.
- Recibir daño.

En el futuro también podrá modificarse mediante:

- Transformaciones.
- Objetos.
- Pasivas.
- Eventos.

---

# Flujo del combate

Ejemplo:

```
Naruto

↓

Ataque básico

↓

Ataque básico

↓

Recibe daño

↓

Ataque básico

↓

Jutsu preparado

↓

🌀 Rasengan

↓

Barra vuelve a cero

↓

Empieza a cargarse otra vez
```

No existe ninguna interacción manual.

---

# Beneficios

Este sistema añade profundidad sin aumentar la complejidad del combate.

Los personajes dejan de diferenciarse únicamente por sus estadísticas.

Ahora también se diferencian por:

- Frecuencia de uso del Jutsu.
- Potencia del Jutsu.
- Forma de cargarlo.
- Efectos especiales.

---

# Diferenciación de personajes

Cada personaje puede cargar su Jutsu de forma distinta.

## Naruto

Carga:

- Atacando.
- Recibiendo daño.

Representa su enorme reserva de chakra.

---

## Sasuke

Carga principalmente al atacar.

Su estilo es más ofensivo.

---

## Gaara

Carga principalmente al recibir daño.

Cuanto más aguanta, antes utiliza su técnica especial.

---

## Rock Lee

Genera mucho chakra con los ataques básicos.

Su Jutsu aparece muy frecuentemente.

---

## Shikamaru

Carga lentamente.

Su Jutsu no hace mucho daño, pero aplica un efecto estratégico.

---

## Hinata

Cada golpe genera bastante chakra.

Compensa un daño base inferior.

---

## Orochimaru

Carga lentamente.

Su Jutsu es mucho más potente que la media.

---

# Relación con las transformaciones

Las transformaciones ya no deberían limitarse a aumentar estadísticas.

Ahora también podrán modificar el sistema de Jutsus.

Ejemplos:

## Naruto - Modo Sabio

- El indicador de Jutsu se carga un 30% más rápido.

---

## Sasuke - Marca Maldita

- El siguiente Jutsu hace más daño.

---

## Rock Lee - Puertas Internas

- Cada ataque genera mucho más chakra.

---

## Gaara - Shukaku

- Recibir daño llena más rápidamente la barra.

---

# Relación con los objetos

Los objetos también pueden interactuar con el sistema.

Ejemplos:

## Pergamino de Chakra

Empiezas cada combate con parte del indicador lleno.

---

## Fragmento del Rinnegan

Los Jutsus ignoran parte de la defensa.

---

## Píldora del Soldado

Rellena instantáneamente el indicador de Jutsu.

---

## Manual de Entrenamiento

Los ataques generan ligeramente más chakra.

---

# Jefes

Este sistema también permitirá que los jefes resulten mucho más interesantes.

Ejemplo:

## Haku

Carga lentamente.

Cuando el indicador se llena utiliza:

```
Espejos Demoníacos de Cristal de Hielo
```

---

## Orochimaru

Cuando el indicador se llena invoca una serpiente gigante.

---

## Pain

Cuando el indicador se llena utiliza:

```
Shinra Tensei
```

En futuras versiones este Jutsu podrá afectar a todo el equipo del jugador.

---

# Escalabilidad futura

Aunque el MVP seguirá estando centrado principalmente en combates 1 vs 1, quiero que la arquitectura permita que algunos Jutsus tengan objetivos diferentes.

Ejemplos:

- Uno mismo.
- Enemigo actual.
- Todo el equipo enemigo.
- Todo el equipo aliado.
- Todo el combate.
- Siguiente enemigo.

En el MVP la mayoría seguirán afectando únicamente al enemigo actual.

Sin embargo, quiero dejar preparada la arquitectura para futuras campañas.

---

# Arquitectura

Cada personaje debería definir su Jutsu mediante configuración.

Ejemplo conceptual:

```json
{
  "id": "naruto",

  "jutsu": {
    "id": "rasengan",

    "charge": {
      "onAttack": 12,
      "onDamageTaken": 8
    }
  }
}
```

El motor de combate únicamente será responsable de:

- Aumentar la barra cuando corresponda.
- Comprobar si está llena.
- Ejecutar automáticamente el Jutsu.
- Reiniciar la barra.

Toda la lógica específica del Jutsu debe estar desacoplada.

---

# Tipos de efectos de Jutsu

No todos los Jutsus tienen que hacer simplemente más daño.

Quiero permitir distintos tipos de efectos.

Ejemplos:

## Daño

Rasengan

Chidori

---

## Debuff

Reducir ataque.

Reducir defensa.

Reducir velocidad.

---

## Buff

Aumentar ataque.

Aumentar velocidad.

Escudo temporal.

---

## Curación

Recuperar HP.

---

## Efectos especiales

Ignorar defensa.

Primer golpe crítico.

Aplicar veneno.

Aplicar quemadura.

Rellenar parte del siguiente indicador.

Invocar una criatura temporal (futuro).

Afectar a todos los enemigos (futuro).

---

# Objetivo final

Quiero que el combate siga siendo completamente automático y fácil de entender.

El jugador no debe gestionar habilidades manualmente.

Simplemente debe disfrutar viendo cómo cada personaje desarrolla su propio estilo de combate.

Los Jutsus deben convertirse en el elemento que más personalidad aporte a cada personaje.

Esto permitirá que:

- Los personajes se sientan únicos.
- Las transformaciones modifiquen el ritmo del combate en lugar de limitarse a aumentar estadísticas.
- Los objetos puedan interactuar con el sistema de forma muy interesante.
- Los futuros jefes tengan ataques especiales memorables.
- La arquitectura quede preparada para campañas mucho más complejas sin necesidad de rediseñar el sistema de combate.