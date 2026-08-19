# Publicación web (punto 17)

Hasta el 2026-08-19 el juego **solo existía en `npm run dev`**: nadie que no clonara el repositorio
podía verlo. Este documento es lo que hay que saber para que exista en una URL, y sobre todo **lo que
falla en silencio** al hacerlo.

## Dónde vive

**GitHub Pages**, publicado por un workflow de Actions (`.github/workflows/deploy.yml`) en cada push a
`main`. Se eligió sobre Netlify/Vercel por dos razones: el repositorio ya está en GitHub (no hace falta
crear cuentas ni conectar servicios) y **cada push publica solo**, que es lo que convierte publicar en
algo continuo en vez de en una tarea de última hora.

⚠️ **Requiere una opción del repositorio que no se puede poner desde el código**:
*Settings → Pages → Source → **GitHub Actions***. La otra opción, *"Deploy from a branch"*, sirve la
**raíz del repositorio**, o sea el `index.html` de desarrollo — el que apunta a `/src/main.jsx`, un
archivo que solo existe sin compilar. Resultado: **página en blanco**, y ni GitHub ni el navegador dicen
nada. Es el mismo síntoma que el fallo del `base`, por un motivo distinto, y conviene saber distinguirlos.

El workflow corre `npm ci`, **los 275 tests** y `npm run build`, en ese orden. Los tests van antes a
propósito: publicar es el único sitio del proyecto donde el juego llega a alguien que no somos nosotros,
y es mejor no publicar que publicar roto.

## ⚠️ El fallo que se lleva una tarde: `base`

Por defecto Vite da por hecho que el sitio cuelga de la **raíz del dominio** y escribe rutas absolutas
(`/assets/…`). Un GitHub Pages de proyecto vive en `usuario.github.io/nombre-del-repo/`, así que todas
esas rutas apuntan a un sitio que no existe: **el HTML carga, el JS no, y la consola no da ningún error
útil**. Se ve como una página en blanco.

`vite.config.js` declara `base: './'`, **relativo y no `/naruto-roguelike/`**, a propósito: funciona
igual en Pages y sigue funcionando si el juego se mueve a Netlify, a un dominio propio o se abre desde
una subcarpeta. Lo único que haría peligrosa una base relativa son las rutas de un router, y aquí no hay
router — la pantalla activa es un campo del store.

Con base relativa, Vite además resuelve los assets importados desde JS con
`new URL("sprite-abc123.png", import.meta.url).href`, o sea **relativos al propio bundle**. Por eso los
86 sprites siguen encontrándose sin que haya que tocar nada.

### Cómo se comprueba sin abrir un navegador

La regla del proyecto prohíbe probar la UI con navegadores headless, y para esto no hace falta:

```
npm run build
cat dist/index.html          # las rutas tienen que empezar por ./assets/, no por /assets/
grep -o '"/assets/[^"]*"' dist/assets/*.js dist/index.html   # tiene que salir VACÍO
```

Y una comprobación mejor, que es la que se usó: **resolver a mano todas las referencias relativas del
HTML y del CSS contra el disco** y ver que cada una existe. Caza el fallo entero antes de subir nada.
(`npm run preview` levanta el sitio de verdad, pero en este entorno el sandbox no deja conectarse a
`localhost`, así que la prueba final es abrir la URL publicada.)

## El peso: eran DOS archivos, no ochenta y seis

El roadmap decía "9,6 MB, de los que 6,2 MB son 86 PNG". ⚠️ **Eso engaña y llevaba a optimizar lo que no
era**: los sprites solo se descargan cuando se pintan. La primera carga real la dominaban dos archivos.

| | Antes | Ahora | Cómo |
|---|---|---|---|
| Fondo del tema activo | 2,1 MB (PNG) | **428 KB** (JPEG) | `sips -s format jpeg -s formatOptions 82` |
| Música | 2,9 MB al abrir | **0 KB** al abrir | `preload="none"` |
| JS + CSS + fuentes | ~540 KB | igual | — |
| **Primera carga** | **~5 MB** | **~900 KB** | |

- **Los fondos pasan a JPEG.** Son ilustraciones densas a 1672×941 que se pintan con `cover` detrás de
  todo: es justo el caso para el que sirve JPEG, y a calidad 82 no se distingue del original. Los PNG
  originales se conservan en `src/assets/originales/` (misma convención que `map-columns/originales/`) —
  **no están importados por nadie, así que no entran en el build**, solo ocupan sitio en el repositorio.
- ⚠️ **Lo de la música no era una optimización, era un error.** Con `preload="auto"` el navegador se
  bajaba los 3 MB de la pista **antes de poder reproducirla**, porque el autoplay está bloqueado hasta el
  primer gesto del usuario (ver [36](./36-musica.md)). Con `preload="none"` la descarga empieza en el
  `play()`, que es exactamente cuando puede sonar.

**No se tocaron los 86 sprites**, y no hay que tocarlos: el diagnóstico decía que estaban ahí y el
diagnóstico estaba mal.

## La pestaña del navegador

Detalle pequeño y de mucho retorno, porque es lo primero que se ve de un proyecto que se enseña:

- El `<title>` era **`naruto-roguelike`** (el nombre del repositorio). Ahora el juego tiene nombre
  propio: **Narutolike**. El repositorio, el `package.json` y la URL siguen llamándose
  `naruto-roguelike` — son identificadores, no el nombre de cara al jugador, y renombrarlos rompería
  el enlace publicado a cambio de nada.
- El favicon era **el morado de la plantilla de Vite** (`#863bff`), sin ninguna relación con el juego.
- `public/icons.svg` **no lo referenciaba nadie** y se publicaba igual.

El favicon es ahora **el remolino de Konoha**, y —regla del proyecto— **no está dibujado a mano ni
descargado: se recorta del arte que ya existe**, con `scripts/generar-favicon.py`. El fondo del tema
claro tiene la torre de agua de la aldea con el símbolo pintado en una placa blanca, que es justo lo
que hace falta.

⚠️ **El criterio para elegirlo es que un favicon se ve a 16 px**, y a ese tamaño no se lee un dibujo:
se leen una silueta y dos colores. Por eso gana la placa de la torre (rojo sobre blanco, circular) y no
el mismo símbolo pintado en el cartel de madera, que es rojo apagado sobre crema y a 16 px es una
mancha. Y se conserva el cuadrado naranja de la pared en vez de recortar el disco: en una pestaña, un
mosaico sólido se distingue mejor que una forma flotante, porque la barra puede ser clara u oscura y el
disco blanco desaparecería en la clara.
