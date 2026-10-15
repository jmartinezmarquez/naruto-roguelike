# Arte: el estilo nuevo

El 2026-10-14 se pidieron a un generador de imágenes los 25 sprites que faltaban, y salieron
bastante mejor que el arte original. Se decidió **pasar todo el juego a ese estilo**. Este documento
es el encargo completo: cómo se pide, cómo entra en el juego y los prompts de cada hoja, en orden.

- **Hojas 01-14**: personajes, transformaciones, proyectiles y objetos. ✅ **HECHAS el 2026-10-15**:
  ya no queda en el juego ningún personaje, transformación, proyectil ni objeto del estilo viejo.
- **Hojas 15-31**: el resto del arte — nodos del mapa, chakra, menú, medallas, efectos de combate y
  fondos de columna del mapa. ✅ **HECHAS el 2026-10-15**: **ya no queda arte del estilo viejo en el
  juego**, salvo los fondos de página del Home (`game-background-*.jpg`).

Tres hojas (15, 16 y 19) llegaron **sin transparencia**, con el damero gris pintado: el script lo borra
solo (`quitar_damero_pintado`, inundación desde el borde sobre gris neutro; el contorno negro de cada
dibujo protege los grises de dentro, como el aro de piedra de los nodos). Las medallas pasaron a un
lienzo de 64.

## Cómo entra una hoja en el juego

1. Se genera la hoja con su prompt (abajo) y se guarda en `src/assets/` **con el nombre exacto** que
   dice el prompt.
2. `python scripts/generar-sprites-estilo-nuevo.py` la recorta y deja cada sprite en su carpeta
   (`characters/`, `transformations/`, `projectiles/`, `items/`) con el nombre que el juego ya usa. Las
   hojas que aún no existen se saltan: se puede correr según vayan llegando.
3. Revisar a ojo y hacer commit. No hay que tocar código: los sprites sustituyen a los viejos con el
   mismo nombre de fichero.

El script **no necesita huecos limpios entre dibujos**: elige los cortes que minimizan un coste —cortar
por una columna llena cuesta, y que un dibujo salga mucho más ancho o estrecho que la media también—, y
borra los restos del dibujo vecino.

⚠️ **El corte costó tres intentos**, y los dos primeros fallaban en hojas reales:
- *Partes iguales + columna más fina*: con dibujos de anchos muy distintos (hoja 04: Kiba con Akamaru
  mide el doble que Ino) los cortes caían dentro de Chōji.
- *Huecos primero*: las dos manos de Hinata (hoja 10) tienen un hueco real entre ellas y salían como dos
  dibujos, mientras Zabuza y Kabuto, que se rozan, salían como uno.
- *El coste* resuelve los dos: el hueco entre manos deja trozos muy desiguales y pierde frente al roce
  fino de al lado. `PESO_ANCHO` está en 3 por la hoja 10; con 1 seguía eligiendo mal.

Y la limpieza de restos mide cada mancha del borde **contra la pieza principal del dibujo** (menos del
35% → fuera), no contra el total pintado: con el 3% del total, un jirón de la niebla de Zabuza se
quedaba en la hoja de Kabuto, que es tan fina que el jirón pesaba más que eso. Coste conocido: al genin
de tierra se le va una piedrecita propia que tocaba el corte. Pero sí necesita que los dibujos
estén **en una sola fila y en el orden del prompt**: si una hoja sale con otro orden o con un dibujo de
más o de menos, se corrige la lista de esa hoja en `HOJAS` antes de correrlo.

Cada tipo se coloca como estaban los sprites originales (medido sobre ellos), en el lienzo común de
96×96 de personajes y transformaciones: así lo nuevo y lo viejo se ven a la misma escala mientras
conviven.

## Reglas del encargo

- **Cada personaje va en la misma hoja que sus transformaciones.** Es lo que hace que el generador
  mantenga cara, ropa y proporciones entre la forma normal y la transformada; pedidos por separado,
  la transformación sale "otro" personaje.
- **Máximo 6 dibujos por hoja, en una fila.** Con más, el generador los encoge y pierde detalle.
- **Adjuntar siempre una referencia del estilo nuevo**: para personajes,
  `src/assets/sprite-pendientes-personajes.png` y `src/assets/sprite-pendientes-transformaciones-2a.png`;
  para proyectiles, `src/assets/sprite-pendientes-proyectiles.png`; para objetos,
  `src/assets/sprite-objetos-nuevos.png`.
- Si sale con el damero pintado en vez de transparencia, **no hace falta repetirla**: el script lo
  detecta (hoja sin canal alfa) y lo borra. Sí conviene que el damero sea gris neutro y que el dibujo
  tenga contorno oscuro, que es lo que frena el borrado.

## Bloque de estilo — personajes y transformaciones

Va delante de los prompts de las hojas 01-08.

```
Pixel art game sprites in the exact style of the attached reference images: chibi proportions (big head, ~2.5 heads tall), front-facing, standing idle pose, thick 1-pixel black outline, flat colors with simple 2-3 tone shading, crisp pixels, no blur. Transparent background (real alpha, NOT a checkerboard pattern). No text, no labels, no frames, no ground shadows. All characters at the same scale, in a single horizontal row, evenly spaced, in the exact order listed. A transformed version must be the SAME character, same face, same clothes and same body size as its normal version next to it, with the transformation and a glowing pixel-art aura added around it.
```

## Bloque de estilo — proyectiles

Va delante de los prompts de las hojas 09-12.

```
Pixel art jutsu projectile/effect icons in the exact style of the attached reference: one compact energy effect per icon, thick black outline where it makes sense, crisp pixels, no blur, no characters. Transparent background (real alpha, NOT a checkerboard). No text, no frames. All the same size, in a single horizontal row, evenly spaced, in the exact order listed.
```

## Bloque de estilo — objetos

Va delante de los prompts de las hojas 13-14.

```
Pixel art game item icons in the exact style of the attached item icons: one object per icon, thick black outline, crisp pixels, simple 3-4 tone shading, no blur. Transparent background (real alpha, NOT a checkerboard). No text, no frames. All the same size, in a single horizontal row, evenly spaced, in the exact order listed.
```

---

## Hoja 01 → `sprite-estilo-nuevo-01.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Naruto Uzumaki (normal): spiky blond hair, blue eyes, three whisker marks on each cheek, orange and blue tracksuit, Konoha forehead protector.
2. Naruto – "Nine-Tails Chakra Cloak": same Naruto wrapped in a bubbling red-orange chakra cloak with two fox ears and a fox tail, red slit eyes.
3. Naruto – "Sage Mode": same Naruto with orange pigment around toad-like yellow eyes, red sage coat with black flames at the hem.
4. Sasuke Uchiha (normal): dark spiky hair, black eyes, blue high-collar short-sleeve shirt with the Uchiha fan, white shorts, arm warmers, Konoha forehead protector.
5. Sasuke – "Curse Mark (Level 2)": same Sasuke with grey skin, long grey hair, a black star mark across the nose and big hand-shaped wings on his back.
6. Sasuke – "Susanoo": same Sasuke with a red Sharingan, surrounded by a purple spectral ribcage and armored warrior aura.
```

## Hoja 02 → `sprite-estilo-nuevo-02.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Sakura Haruno (normal): short pink hair, green eyes, red sleeveless qipao top, black shorts, Konoha forehead protector worn as a hairband.
2. Sakura – "Monstrous Strength": same Sakura with a raised fist glowing with green chakra and cracked ground pieces flying around her.
3. Sakura – "Byakugou Seal": same Sakura with a purple diamond mark on her forehead and black seal lines spreading over her skin, green aura.
4. Rock Lee (normal): black bowl-cut hair, thick eyebrows, round eyes, green jumpsuit, orange leg warmers, Konoha forehead protector as a belt.
5. Rock Lee – "Inner Gates": same Lee with flushed red skin and a blue-green steam aura (calmer than his Gate of Death).
```

## Hoja 03 → `sprite-estilo-nuevo-03.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Neji Hyuga (normal): long dark brown hair, pale white eyes, white Hyuga robe, Konoha forehead protector, bandaged right arm.
2. Neji – "Full Byakugan": same Neji with bulging veins around his eyes and a light blue chakra aura.
3. Tenten (normal): brown hair in two buns, pink and white Chinese-style top, dark pants, Konoha forehead protector.
4. Tenten – "Celestial Arsenal": same Tenten with an unrolled scroll and several kunai, shuriken and blades floating around her.
5. Shikamaru Nara (normal): black hair in a spiky high ponytail, bored eyes, green chunin flak vest, Konoha forehead protector on his arm.
6. Shikamaru – "Extended Shadow": same Shikamaru making the rat hand sign, a long dark shadow spreading from his feet, dark aura.
```

## Hoja 04 → `sprite-estilo-nuevo-04.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Ino Yamanaka (normal): long platinum blonde ponytail with bangs over one eye, blue eyes, purple outfit, Konoha forehead protector as a belt.
2. Ino – "Reinforced Mind Link": same Ino with fingers on her temple and soft pink-violet mind chakra rings around her head.
3. Choji Akimichi (normal): big-boned, spiky brown hair, red swirl marks on his cheeks, red armor, Konoha forehead protector.
4. Choji – "Butterfly Mode": same Choji with small glowing blue chakra butterfly wings on his back (smaller than his Sage version).
5. Kiba Inuzuka (normal): spiky brown hair, red fang marks on his cheeks, grey fur-hooded jacket, the small white puppy Akamaru on his head.
6. Kiba – "Double Beast Transformation": same Kiba in a feral crouch next to Akamaru transformed into an identical copy of Kiba, both with wild hair and claws.
```

## Hoja 05 → `sprite-estilo-nuevo-05.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Hinata Hyuga (normal): dark indigo hair with straight bangs, pale lavender eyes, cream and lavender hooded jacket, Konoha forehead protector around her neck.
2. Hinata – "Full Byakugan": same Hinata with veins around her eyes and a soft blue chakra aura around her palms.
3. Shino Aburame (normal): high-collared green hooded coat hiding his mouth, round dark sunglasses, Konoha forehead protector.
4. Shino – "Full Swarm": same Shino with a cloud of small black insects swirling around him.
5. Haku: long dark hair, a white hunter-nin mask with red swirl marks pushed to the side of his head, green kimono-like outfit, ice senbon in his fingers.
```

## Hoja 06 → `sprite-estilo-nuevo-06.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Zabuza Momochi (normal): bandages covering his mouth, Hidden Mist forehead protector tilted sideways, bare chest with a strap, striped arm warmers, the giant Kubikiribōchō cleaver sword on his back.
2. Zabuza – "Demon of the Mist Fury": same Zabuza with a dark red killing-intent aura and wisps of mist, sword in hand.
3. Kabuto Yakushi (normal): grey hair in a low ponytail, round glasses, purple Sound village outfit, calm smile.
4. Kabuto – "Snake-Senjutsu Fusion": same Kabuto with pale scaly skin, yellow snake eyes and a white snake hood rising behind him, green-purple aura.
5. Rival Genin of earth: a generic genin from another village with a brown scarf and brown accents, rock pieces at his feet.
6. Rival Genin of water: a generic genin from another village with a blue scarf and blue accents, a small water ripple at his feet.
```

## Hoja 07 → `sprite-estilo-nuevo-07.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Gaara (normal): short red hair, the kanji 愛 tattooed on his forehead, dark rings around his eyes, maroon outfit, a large sand gourd on his back.
2. Gaara – "Absolute Sand Shield": same Gaara with swirling sand forming a protective dome around him.
3. Gaara – "Partial Shukaku Release": same Gaara with half his body turned into a sand monster: a huge tanuki-like sand arm with blue markings and one beast eye.
4. Pain, Deva Path (normal): spiky orange hair, purple ringed Rinnegan eyes, black piercings on his face, black Akatsuki cloak with red clouds.
5. Pain – "Six Paths Synchronization": same Pain floating with a dark gravity distortion ring and glowing Rinnegan, purple-black aura.
```

## Hoja 08 → `sprite-estilo-nuevo-08.png`

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Zaku Abumi: Sound ninja with spiky black hair, Sound forehead protector (musical note), arms forward showing air holes in his palms.
2. Dosu Kinuta: Sound ninja with a bandaged face showing one eye, hunched pose, shaggy fur poncho, a big metal sound amplifier on his right arm.
3. Kin Tsuchi: Sound kunoichi with very long black hair tied at the end with a ribbon, Sound forehead protector, senbon needles with tiny bells.
4. Rival Genin of fire: a generic genin from another village with a red scarf and red accents, a tiny flame in his hand.
5. Rival Genin of wind: a generic genin from another village with a light green scarf and green accents, a small gust swirling at his feet.
6. Rival Genin of lightning: a generic genin from another village with a yellow scarf and yellow accents, small sparks around his hand.
```

## Hoja 09 → `sprite-estilo-nuevo-09.png`

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. A single kunai flying horizontally, pointing right (the basic attack everyone uses).
2. Rasengan (Naruto): a spinning sphere of blue chakra.
3. Great Fireball Jutsu (Sasuke): a big round fireball.
4. Medical Chakra Strike (Sakura): a fist-shaped burst of glowing green chakra with cracks around it.
5. Weapon Summoning (Tenten): a fan of flying kunai and shuriken.
6. Mind Transfer Jutsu (Ino): a pink-purple wave of mind chakra shaped like a diamond.
```

## Hoja 10 → `sprite-estilo-nuevo-10.png`

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Human Bullet Tank (Choji): a giant rolling red ball with spinning motion lines.
2. Eight Trigrams: Two Palms (Hinata): two blue chakra palm bursts.
3. Destruction Bug Swarm (Shino): a dense cloud of small black beetles.
4. Demonic Ice Mirrors (Haku): a curved panel of ice mirrors with ice senbon flying out.
5. Hidden Mist Jutsu (Zabuza): a white mist slash with the silhouette of a giant cleaver blade.
6. Chakra Scalpel (Kabuto): a thin blue-green chakra blade.
```

## Hoja 11 → `sprite-estilo-nuevo-11.png`

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Sand Coffin (Gaara): a grasping hand made of sand.
2. Shinra Tensei (Pain): a spherical purple-white shockwave of repulsion.
3. Slicing Sound Wave (Zaku): curved blades of compressed air.
4. Sonic Vibration (Dosu): concentric sound rings bursting out.
5. Illusory Senbon (Kin): senbon needles with tiny bells attached.
```

## Hoja 12 → `sprite-estilo-nuevo-12.png`

```
[PROJECTILE STYLE BLOCK]

Left to right (weaker jutsu than the others, smaller effects):
1. Minor Fire Jutsu: a small fireball.
2. Slashing Gust: a light green wind slash.
3. Minor Discharge: a small yellow lightning bolt.
4. Earth Wall: a small chunk of rock wall bursting up.
5. Water Whip: a curling whip of water.
```

## Hoja 13 → `sprite-estilo-nuevo-13.png`

```
[ITEM STYLE BLOCK]

Left to right:
1. Soldier Pill: a few small round brown ninja ration pills next to a tiny paper packet.
2. Spare Ninja Headband: a folded Konoha forehead protector with a dark blue cloth band.
3. Chakra Seal: a paper seal tag with a blue chakra spiral drawn on it.
4. Reserve Scroll: a half-open beige scroll with a red spiral symbol.
5. Sage Hermit's Seed: a glowing green seed with a small leaf sprouting from it.
```

## Hoja 14 → `sprite-estilo-nuevo-14.png`

```
[ITEM STYLE BLOCK]

Left to right:
1. Cursed Seal Shard: a jagged black stone shard with three glowing comma-shaped curse marks.
2. Wind Scroll: a rolled green scroll with a white wind swirl symbol.
3. Kubikiribōchō Fragment: a broken piece of a huge cleaver blade with the round hole near its edge.
4. Sand Gourd Fragment: a cracked piece of a tan clay gourd with sand spilling out.
5. Rinnegan Ring Fragment: a broken metal ring with a purple ripple-pattern eye engraved on it.
```

---

## Bloque de estilo — iconos de interfaz

Va delante de los prompts de las hojas 15-19.

```
Pixel art game UI icons in the exact style of the attached reference images: one object per icon, thick black outline, crisp pixels, simple 3-4 tone shading, no blur. Transparent background (real alpha, NOT a checkerboard). No text, no letters, no frames around the whole image. All icons the same size, in a single horizontal row, evenly spaced, in the exact order listed.
```

## Bloque de estilo — tiras de animación

Va delante de los prompts de las hojas 20-28. Adjuntar también el efecto actual como referencia de la
animación (`src/assets/effects/<nombre>.png`, el que diga cada hoja).

```
A pixel art animation strip in the exact style of the attached reference images: the SAME effect shown as consecutive animation frames, left to right, in a single horizontal row, evenly spaced, each frame centered in its own equal-width slot. Thick black outline where it makes sense, crisp pixels, no blur. The last frames fade out by breaking into sparse dithered pixels, not by becoming transparent. Transparent background (real alpha, NOT a checkerboard). No text, no frame numbers, no borders.
```

## Bloque de estilo — fondos de columna del mapa

Va delante de los prompts de las hojas 29-31. ⚠️ **La regla de estos fondos no es estética, es de
legibilidad**: encima se pintan los nodos del mapa, así que el centro tiene que ser liso (ver
`documentacion/13-ui-mapa-y-combate.md`). Por eso se piden como una ruta de Pokémon y no como un paisaje.

```
A vertical pixel art map background, portrait format (about 5:8), seen from directly above like a Pokémon route, in the style of the attached reference images. The CENTER 60% of the width must be plain flat ground with almost no detail (small game icons will be drawn on top of it). All the decoration goes in a dense border on the LEFT and RIGHT edges only. No characters, no text, no UI, no path lines, no vignette.
```

---

## Hoja 15 → `sprite-estilo-nuevo-15.png` (nodos del mapa)

```
[UI ICON STYLE BLOCK]

Four round map-node medallions with a carved stone rim, left to right:
1. Battle: two crossed kunai over a dark red background.
2. Event: a rolled scroll with a big question mark, over a purple background.
3. Rest: a white medical tent with a red cross, over a green background.
4. Shop: a small wooden merchant stall with lanterns and goods, over a brown background.
```

## Hoja 16 → `sprite-estilo-nuevo-16.png` (pergaminos de reclutar)

```
[UI ICON STYLE BLOCK]

Three hanging "wanted poster" scrolls, each showing the Konoha leaf symbol at the top and the dark silhouette of a ninja in the middle, left to right:
1. Common: green scroll rods, plain paper.
2. Rare: blue scroll rods, paper with a faint blue glow.
3. Legendary: gold scroll rods, paper with a strong golden glow and small sparkles.
```

## Hoja 17 → `sprite-estilo-nuevo-17.png` (naturalezas de chakra)

```
[UI ICON STYLE BLOCK]

The five chakra natures as simple elemental symbols, left to right:
1. Fire: a bright orange-red flame.
2. Wind: a pale white and lavender tornado swirl.
3. Lightning: a yellow zig-zag lightning bolt.
4. Earth: a solid grey-brown boulder.
5. Water: a blue water drop.
```

## Hoja 18 → `sprite-estilo-nuevo-18.png` (menú)

```
[UI ICON STYLE BLOCK]

Six menu icons, left to right:
1. Missions: a red rolled scroll with the Konoha leaf symbol and a tassel.
2. Bingo Book: a closed old book with the Konoha leaf symbol on the cover.
3. Settings: a silver gear.
4. Restart: a red torii gate with a flame burning inside it.
5. Hall of Fame: a golden trophy cup.
6. Home: a small Japanese-style house with a red roof.
```

## Hoja 19 → `sprite-estilo-nuevo-19.png` (medallas de arco)

```
[UI ICON STYLE BLOCK]

Three arc medals, like Pokémon gym badges, each with its own shape and color so they read at a glance, left to right:
1. Wave Crest (Land of Waves): a round blue badge with white sea waves.
2. Sand Crest (Chunin Exams): a sand-colored hexagonal badge with an hourglass of sand.
3. Cloud Crest (Pain's Invasion): a black shield-shaped badge with a red Akatsuki cloud and a gold rim.
```

## Hoja 20 → `sprite-estilo-nuevo-20.png` (efecto: tajo) — referencia `effects/corte.png`

```
[ANIMATION STRIP STYLE BLOCK]

4 frames of a fast white crescent slash (a blade cut): 1) a thin sliver appearing, 2) the full bright white-blue crescent, 3) the crescent breaking into dithered pixels, 4) almost gone, a few scattered pixels.
```

## Hoja 21 → `sprite-estilo-nuevo-21.png` (efecto: impacto) — referencia `effects/estrella.png`

```
[ANIMATION STRIP STYLE BLOCK]

4 frames of a hit-impact star: 1) a small orange spark, 2) a big sharp eight-pointed golden-orange star, 3) the star turning white and breaking into dithered pixels, 4) almost gone.
```

## Hoja 22 → `sprite-estilo-nuevo-22.png` (efecto: impacto metálico) — referencia `effects/estrella-metal.png`

```
[ANIMATION STRIP STYLE BLOCK]

4 frames of a metallic hit-impact star (a kunai hitting metal): 1) a small blue-white spark, 2) a big sharp eight-pointed icy blue-white star, 3) the star turning white and breaking into dithered pixels, 4) almost gone.
```

## Hojas 23-27 (efecto: explosión de jutsu, una por naturaleza) — referencia `effects/explosion-katon.png`

Mismo prompt cinco veces, cambiando solo la línea del elemento. Cada una en su fichero:

| Hoja | Fichero | Línea del elemento |
|---|---|---|
| 23 | `sprite-estilo-nuevo-23.png` | `Element: FIRE — orange, red and yellow flames.` |
| 24 | `sprite-estilo-nuevo-24.png` | `Element: WIND — pale green and white cutting gusts and swirls.` |
| 25 | `sprite-estilo-nuevo-25.png` | `Element: LIGHTNING — yellow and white electric sparks and arcs.` |
| 26 | `sprite-estilo-nuevo-26.png` | `Element: EARTH — brown rock chunks and dust.` |
| 27 | `sprite-estilo-nuevo-27.png` | `Element: WATER — blue water splash and droplets.` |

```
[ANIMATION STRIP STYLE BLOCK]

6 frames of a jutsu impact explosion that GROWS and then fades: 1) a tiny burst, 2) a small explosion, 3) a big full explosion with a bright core, 4) a large ring with a hollow center, 5) the ring breaking up into dithered pixels, 6) almost gone, scattered pixels.
[ELEMENT LINE]
```

## Hoja 28 → `sprite-estilo-nuevo-28.png` (efecto: humo de relevo) — referencia `effects/humo.png`

```
[ANIMATION STRIP STYLE BLOCK]

6 frames of a ninja "poof" smoke puff (the smoke when a ninja swaps in): 1) a tiny white puff, 2) a small cloud, 3) a big round white cloud, 4) the cloud at full size starting to thin out, 5) the cloud dissolving into dithered pixels, 6) almost gone.
```

## Hoja 29 → `sprite-estilo-nuevo-29.png` (columna: Land of Waves)

```
[MAP BACKGROUND STYLE BLOCK]

Land of Waves: the flat center is pale sandy ground. Left and right borders: calm sea water with small waves, wooden docks and pier posts, misty pine trees and a few reeds.
```

## Hoja 30 → `sprite-estilo-nuevo-30.png` (columna: Chunin Exams)

```
[MAP BACKGROUND STYLE BLOCK]

Chunin Exams, Forest of Death: the flat center is dark green forest floor. Left and right borders: huge dark tree trunks with giant roots, thick bushes and a few big mushrooms.
```

## Hoja 31 → `sprite-estilo-nuevo-31.png` (columna: Pain's Invasion)

```
[MAP BACKGROUND STYLE BLOCK]

Pain's Invasion, destroyed Konoha: the flat center is cracked grey-brown earth. Left and right borders: rubble, broken wooden walls and roof tiles, splintered beams and small fires.
```

---

Con la hoja 31 ya no queda arte del estilo viejo en el juego, salvo los fondos de la página
(`game-background-*.jpg`), que no son sprites y se deciden aparte.

⚠️ **Los scripts viejos de estas carpetas** (`generar-columnas-mapa.py`, `generar-icono-home.py`,
`generar-sprites-efectos.py`, `generar-sprites-iconos.py`, `generar-sprites-medallas.py`,
`generar-sprites-nodo-reclutar.py`) **se niegan a correr** en cuanto existe la hoja nueva de lo que
generan: si no, pisarían el arte nuevo con el viejo.

## Limpieza (2026-10-15): hojas y scripts viejos, BORRADOS

Se borró todo lo que ya no usaba nada: las 31 hojas del estilo nuevo, las de las tandas anteriores
(`sprite-pendientes-*`, objetos nuevos, pesas, pergaminos), las hojas originales del arte viejo
(personajes, transformaciones, proyectiles, objetos, nodos, iconos, columnas y sus paisajes
originales), las hojas de animación que nunca se usaron, los restos de la plantilla de Vite, el
`reclutar-raro.png` (el mapa solo pinta verde y dorado) y un `pain_camino_deva_1.png` huérfano.
`src/assets/` pasó de **95 MB a 15 MB**. Y los once scripts que leían de esas hojas: ver
`git log` para recuperarlos. Las menciones a ellos en documentos anteriores son historia.

**Se quedaron a propósito**: `OFL.txt` (la licencia de PressStart2P obliga a acompañar la fuente),
`originales/game-background-*.png` (el original de los fondos del Home, que siguen siendo del estilo
viejo y de los que sale el favicon) y `generar-sprites-objetos.py` (retirado, pero `generar-favicon.py`
usa su lector de PNG).

### Lo que había que saber antes de borrarlas

**Se podía** (2026-10-15). Ocupan 42 MB, ningún fichero del juego las importa y no van en el build: solo las
lee `generar-sprites-estilo-nuevo.py`, que se salta las que faltan **sin tocar los sprites ya
recortados**. Lo que hay que saber:

- **No hacen falta para jugar ni para publicar.** Los sprites recortados (`characters/`, `items/`…) son
  lo único que usa el juego.
- **Siguen en el historial de git**: borrarlas libera los 42 MB de la carpeta de trabajo, pero el
  repositorio (`.git`) no adelgaza. Para recuperar una: `git checkout 4790a87 -- src/assets/sprite-estilo-nuevo-15.png`
  (las 01-14 están en el commit `a7acda3`).
- **Hacen falta para RE-recortar**: si se cambia el script (otro tamaño, otra colocación), hay que
  recuperarlas antes.
- Los diez **scripts viejos están retirados** y se niegan a correr siempre. Antes se negaban solo si
  existía su hoja nueva, así que borrar las hojas los habría reactivado — y correrlos habría pisado
  todo el arte nuevo con el viejo. Se cambió precisamente para poder borrarlas.

---

## Tanda 4 — lo último (hojas 32-35)

✅ **HECHAS el 2026-10-15**: con ellas ya no queda arte del estilo viejo en el juego. ⚠️ Corrección: se
dijo que la tarjeta de campaña no tenía ilustración y **sí la tenía** (`camino_ninja.jpeg`); el inventario
solo buscaba `.png` y `.jpg`. La nueva la sustituye, en JPEG (183 KB frente a 1 MB en PNG). El favicon
ya no se recorta del fondo: `generar-favicon.py` y los PNG de `originales/` se borraron.

Lo que quedaba tras la limpieza. Los fondos del Home
(33-34) ya eran pixel art detallado y no chirrían con el estilo nuevo: rehacerlos es opcional. El
favicon (35) solo hace falta si cambia el fondo claro.

`generar-sprites-estilo-nuevo.py` ya las conoce. Adjuntar como referencia, en las cuatro, una hoja del
estilo nuevo **y** el fondo actual del Home que corresponda (`src/assets/game-background-*.jpg`).

### Hoja 32 → `sprite-estilo-nuevo-32.png` (ilustración de campaña) → `assets/campaigns/camino_ninja.png`

La tarjeta pinta el nombre de la campaña **abajo a la izquierda**, sobre un degradado oscuro, y la recorta
con `cover`: en escritorio sale casi cuadrada y en móvil, una franja muy apaisada. Por eso el motivo va en
el centro y la franja de abajo, tranquila.

```
A wide 16:9 pixel art illustration in the exact style of the attached reference images, for the cover of a Naruto campaign called "The Ninja Road" (from the bridge builder's escort in the Land of Waves to Pain's attack on Konoha). A long dirt road seen from behind three young ninja walking away from the viewer toward the horizon: at the start of the road, a misty unfinished bridge over the sea; in the far distance, the Hidden Leaf village with the Hokage faces carved in the cliff, and a dark storm cloud gathering above it. The main subject is in the CENTER; the bottom quarter is calm ground with little detail (a title will be written over it). Crisp pixels, no blur. No text, no letters, no logo, no UI, no frame.
```

### Hoja 33 → `sprite-estilo-nuevo-33.png` (fondo del Home, tema oscuro) → `game-background-dark-theme.jpg`

```
A wide 16:9 pixel art background in the exact style of the attached reference images: the Hidden Leaf village at night, seen from a grassy hill, with a full moon, the Hokage faces carved in the cliff, warm lit windows and the round Hokage building in the middle; trees framing the left and right edges. Keep the composition of the attached background. The CENTER must stay fairly calm and not too bright, because game menus and panels are drawn on top of it. Crisp pixels, no blur. No characters in the foreground, no text, no UI.
```

### Hoja 34 → `sprite-estilo-nuevo-34.png` (fondo del Home, tema claro) → `game-background-light-theme.jpg`

```
A wide 16:9 pixel art background in the exact style of the attached reference images: the Hidden Leaf village on a sunny day, seen from a dirt clearing at the edge of the forest, with the Hokage faces carved in the cliff on the left, the round Hokage building, blue roofs, and a round orange water tower with the Konoha leaf symbol on a white plate in the right foreground. Keep the composition of the attached background. The CENTER must stay fairly calm, because game menus and panels are drawn on top of it. Crisp pixels, no blur. No characters in the foreground, no text, no UI.
```

⚠️ **El favicon sale de este fondo**: `generar-favicon.py` recorta la placa de la torre de agua en una
posición medida a mano (`CAJA`). Si se cambia el fondo claro, esa posición deja de apuntar a la torre:
o se mide de nuevo sobre el fondo nuevo, o se hace la hoja 35.

### Hoja 35 → `sprite-estilo-nuevo-35.png` (favicon) → `public/favicon.png`

**Un favicon se ve a 16 px**: ahí no se lee un dibujo, se lee una silueta y dos colores (ver el
docstring de `generar-favicon.py`). Un mosaico sólido se distingue en barras claras y oscuras; un
símbolo flotante no.

```
A single pixel art app icon in the exact style of the attached reference images: the Konoha leaf swirl symbol, bold and simple, drawn in white on a solid square orange tile with a thick dark outline. Very high contrast and very few details, so it still reads at 16x16 pixels. Transparent background around the tile (real alpha, NOT a checkerboard). No text.
```

Si se hace esta hoja, **no volver a correr `generar-favicon.py`**: pisaría el favicon nuevo con el recorte
del fondo.
