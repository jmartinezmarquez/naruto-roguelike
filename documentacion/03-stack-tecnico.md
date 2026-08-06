# Stack técnico y herramientas

## Sistema operativo

El desarrollo se hace en **Windows**. Todos los comandos de terminal de este documento (y los que demos en adelante) están adaptados a CMD/PowerShell, no a sintaxis Unix (`mkdir -p`, `rm -rf`, etc. no son válidos aquí).

## Entorno de desarrollo (instalado)

- **VS Code** (con extensiones ESLint, Prettier, Claude Code)
- **Node.js** (LTS)
- **Git**

## Stack del proyecto

- **React** (via Vite)
- **Zustand** — gestión de estado global (más simple que Redux para este alcance)
- **Tailwind CSS v4** — estilos (instalado vía `@tailwindcss/vite`, sin `tailwind.config.js` clásico)

## Comandos de creación del proyecto (Windows / CMD)

```cmd
npm create vite@latest naruto-roguelike -- --template react
cd naruto-roguelike
npm install
npm install zustand
npm install tailwindcss @tailwindcss/vite

git init
git add .
git commit -m "Initial commit: Vite + React + Zustand + Tailwind v4"

mkdir src\data
mkdir documentacion
```

> Si usas PowerShell en vez de CMD, añade `-Force` a los `mkdir` para evitar error si la carpeta ya existe: `mkdir src\data -Force`.

### Configuración de Tailwind v4 con Vite

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css`:
```css
@import "tailwindcss";
```

## Herramientas adicionales previstas (no urgentes para el MVP)

- Piskel / Aseprite (compilado) / Krita / Inkscape / GIMP — arte y sprites.
- Audacity, jsfxr/Bfxr — audio.
- Figma, Excalidraw/draw.io — planificación visual.
- itch.io — distribución del build.

## Incidencias conocidas y soluciones

### `npx tailwindcss init -p` falla con "could not determine executable to run"

Causa: Tailwind CSS v4 eliminó el comando `init`, el flujo de instalación cambió.

Solución adoptada: usar el plugin de Vite (`@tailwindcss/vite`) e importar `@import "tailwindcss";` directamente en el CSS, sin generar `tailwind.config.js` ni `postcss.config.js`.
