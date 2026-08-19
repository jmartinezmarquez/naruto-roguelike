import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // ⚠️ **Sin esto, la página publicada sale en BLANCO y sin ningún error visible.**
  // Por defecto Vite da por hecho que el sitio vive en la raíz del dominio y escribe
  // rutas absolutas (`/assets/...`). En GitHub Pages de proyecto el sitio cuelga de
  // `/naruto-roguelike/`, así que todas esas rutas apuntan a un sitio que no existe:
  // el HTML carga, el JS no, y no hay mensaje de nada.
  //
  // Se usa `'./'` (relativo) y no `'/naruto-roguelike/'` (absoluto con el nombre del
  // repo) a propósito: funciona igual en Pages y **sigue funcionando** si mañana el
  // juego se mueve a Netlify, a un dominio propio o se abre desde una subcarpeta. Lo
  // único que haría peligroso el relativo son las rutas de un router, y aquí no hay
  // router: la pantalla activa es un campo del store.
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node', // el motor y el store no tocan el DOM, no hace falta jsdom
    setupFiles: ['./src/test-setup.js'],
  },
})
