# Estructura de carpetas del proyecto

```
src/
├── data/              → JSON de contenido del juego (personajes, tipos, arcos, eventos)
│   ├── types.json
│   ├── characters.json
│   ├── enemies.json
│   ├── events.json
│   └── arcs/
│       └── tutorial-chunin.json
│
├── engine/            → lógica pura del juego, SIN dependencias de React
│   ├── combat.js       (resolución de turnos, daño, efectos de estado)
│   ├── leveling.js      (subida de nivel, curva de XP)
│   └── mapGenerator.js  (generación del grafo de nodos a partir de un arco)
│
├── store/             → estado global de la aplicación (Zustand)
│   └── useGameStore.js
│
├── components/        → piezas de UI reutilizables, organizadas por área del juego
│   ├── Map/
│   ├── Combat/
│   ├── Events/
│   └── Team/
│
├── utils/             → helpers compartidos (aleatoriedad, formateo, etc.)
│
├── App.jsx
├── main.jsx
└── index.css
```

## Regla de diseño

`engine/` no debe importar nada de `react` ni de `store/`. Son funciones puras: reciben datos (estado del combate, personajes, JSON) y devuelven un resultado nuevo, sin tocar el DOM ni el estado global directamente. Esto permite:

- Testear el balance del juego desde Node, sin abrir el navegador.
- Reutilizar la lógica si en el futuro se mueve a un backend.
- Que los componentes de React se limiten a leer del store y disparar acciones, sin contener reglas de negocio.

`store/` es el pegamento: llama a funciones de `engine/` y expone el resultado a los componentes.

## Comandos de creación (Windows / CMD)

```cmd
mkdir src\engine
mkdir src\store
mkdir src\components
mkdir src\components\Map
mkdir src\components\Combat
mkdir src\components\Events
mkdir src\components\Team
mkdir src\utils
```
