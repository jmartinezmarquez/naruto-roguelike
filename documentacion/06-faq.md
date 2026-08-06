# FAQ

### ¿Por qué Pokelike no ha recibido cese y desista de Nintendo/The Pokémon Company?

Según declaraciones públicas de Don McGowan (ex abogado jefe de The Pokémon Company), la empresa no persigue activamente los fan-games; solo actúa cuando detecta monetización (Kickstarter, Patreon, ventas). Pokelike es gratuito, sin afiliación oficial declarada y no se distribuye en tiendas oficiales, lo que lo sitúa en bajo riesgo. No hay garantía absoluta: Nintendo y TPC sí han retirado otros fan-games en el pasado, especialmente los que sí buscan ingresos o los que se publican en tiendas oficiales (Steam, App Store).

**Implicación para este proyecto:** mientras sea gratuito, sin monetización directa ligada al juego y sin usar assets oficiales (sprites/audio originales), el riesgo legal es bajo, comparable al de otros fan-games de anime existentes.

### ¿Por qué Naruto en vez de Dragon Ball Z?

Ver el detalle completo en [01 - Concepto y referencias](./01-concepto-y-referencias.md). Resumen: DBZ tiene arcos más cerrados de forma nativa (ventaja estructural), pero no tiene sistema elemental real. Naruto sí tiene una tabla de tipos canónica (naturalezas de chakra) y el Examen Chunin ya tiene una estructura casi roguelike de por sí. Se decidió que la falta de "cierre narrativo" de otros arcos de Naruto no es un problema real, porque el motor del juego es agnóstico del contenido: basta con que cada arco tenga un pool de encuentros y un jefe definidos por diseño, sin necesidad de fidelidad total al canon.

### ¿Cómo se modela una transformación (equivalente a las evoluciones DBZ) en Naruto?

Con el campo `modo` de cada personaje: un flag que se activa a partir de un nivel (o condición) y multiplica estadísticas, **sin cambiar el jutsu característico** — igual que una transformación Super Saiyan no cambia el Kamehameha, pero lo hace más fuerte. Ejemplos: Manto de Chakra del Kyuubi (Naruto), Marca de Maldición Nivel 2 (Sasuke), Byakugan Pleno (Neji/Hinata).

### ¿Por qué combate por turnos y no automático como en Pokelike?

Se decidió priorizar la identidad del combate (elegir a quién ataca cada personaje) frente a la velocidad de implementación del automático. Ver [02 - Decisiones de diseño de juego](./02-diseno-de-juego.md).
