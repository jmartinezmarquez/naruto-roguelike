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

## Tanda 5 — aspectos alternativos (hojas 36-42)

✅ **HECHAS el 2026-10-16.** Son los aspectos del nivel de ninja (`documentacion/42-meta-progresion.md`): cada
ninja —también los seis villanos reclutables— tiene **dos aspectos**, que se abren con el nivel de ninja 4
y 10 (`aspectos` en `data/maestria.json`) y se eligen en su ficha del Bingo Book. El código ya está: un
aspecto sin dibujo **no se ofrece**, así que las hojas pueden ir llegando de una en una sin romper nada.
`generar-sprites-estilo-nuevo.py` las deja en `assets/aspects/<id>_<n>.png`, colocadas como un personaje
(lienzo de 96, misma escala).

**Reglas de estas hojas**, además de las generales:
- **Tres ninjas por hoja, cada uno con sus dos aspectos seguidos** (seis dibujos). Cambia la ropa y el
  peinado, **nunca la cara, el tamaño ni las proporciones**: un aspecto es el mismo personaje vestido de
  otra forma, y tiene que reconocerse de un vistazo.
- **Adjuntar como referencia el sprite actual de los tres** (`src/assets/characters/<id>.png`), además de
  una hoja del estilo nuevo. Es lo que mantiene la cara.
- Sin aura ni brillo: el aura es lo que distingue una **transformación**, y un aspecto no lo es.

## Bloque de estilo — aspectos

Va delante de los prompts de las hojas 36-42 (en lugar del de personajes).

```
Pixel art game sprites in the exact style of the attached reference images: chibi proportions (big head, ~2.5 heads tall), front-facing, standing idle pose, thick 1-pixel black outline, flat colors with simple 2-3 tone shading, crisp pixels, no blur. Transparent background (real alpha, NOT a checkerboard pattern). No text, no labels, no frames, no ground shadows. All characters at the same scale, in a single horizontal row, evenly spaced, in the exact order listed. These are ALTERNATIVE OUTFITS of the characters in the attached sprites: keep exactly the same face, eyes, body size and proportions as the attached sprite of that character; only the clothes, accessories and hairstyle change. No glowing aura.
```

### Hoja 36 → `sprite-estilo-nuevo-36.png` (Naruto Uzumaki, Sasuke Uchiha, Sakura Haruno)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Naruto Uzumaki – Shippuden outfit: spiky blond hair, orange and black jacket and orange pants, black-cloth Konoha forehead protector.
2. Naruto Uzumaki – Hokage cloak: white Hokage cloak with a red flame pattern at the hem worn over his orange and black outfit, black-cloth forehead protector.
3. Sasuke Uchiha – Shippuden outfit: open white high-collar shirt, dark blue pants, thick purple rope belt tied in a bow, sword on his back.
4. Sasuke Uchiha – Wanderer: long dark grey poncho cloak with a high collar, longer hair covering one eye, sword at the hip.
5. Sakura Haruno – Shippuden outfit: short pink hair, red sleeveless zip top, black gloves, dark shorts under a short pink apron skirt, forehead protector as a headband.
6. Sakura Haruno – Summer festival: pink hair tied up with a flower pin, light pink yukata with a cherry blossom pattern and a red obi sash, holding a small paper fan.
```

### Hoja 37 → `sprite-estilo-nuevo-37.png` (Rock Lee, Neji Hyuga, Tenten)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Rock Lee – Jonin vest: the same green jumpsuit and orange leg warmers with a green Konoha flak jacket on top.
2. Rock Lee – Drunken Fist: red cheeks, swaying pose, green jumpsuit slightly rumpled, holding a small sake cup.
3. Neji Hyuga – Shippuden outfit: long dark hair, white and beige Hyuga robe with wide sleeves and dark shorts, forehead protector.
4. Neji Hyuga – Hyuga ceremonial: dark navy formal kimono with the Hyuga clan symbol, long hair loose, calm stance.
5. Tenten – Shippuden outfit: two hair buns, white high-collar qipao-style top with red trim, dark pants, a big scroll on her back.
6. Tenten – Weapon master: same buns, red sleeveless qipao, several kunai and a short sword strapped to her belt and thighs.
```

### Hoja 38 → `sprite-estilo-nuevo-38.png` (Shikamaru Nara, Ino Yamanaka, Choji Akimichi)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Shikamaru Nara – Jonin vest: spiky ponytail, green Konoha flak jacket over a mesh shirt, hands in pockets.
2. Shikamaru Nara – Deer guardian: dark clan robe with a deer antler motif, a small antler charm at the belt.
3. Ino Yamanaka – Shippuden outfit: long blonde ponytail covering one eye, purple crop top and skirt with a mesh underlayer, purple arm warmers.
4. Ino Yamanaka – Flower shop: blonde ponytail, light green apron with a flower pattern over a casual outfit, holding a small bouquet.
5. Choji Akimichi – Shippuden outfit: red samurai-style armor plates over a dark suit, long spiky orange-brown hair, Konoha headband.
6. Choji Akimichi – Barbecue night: casual yellow shirt with a swirl symbol, holding a skewer of grilled meat.
```

### Hoja 39 → `sprite-estilo-nuevo-39.png` (Kiba Inuzuka, Hinata Hyuga, Shino Aburame)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Kiba Inuzuka – Shippuden outfit: grey hooded jacket with fur trim and dark pants, red fang marks on his cheeks, a bigger white Akamaru beside him.
2. Kiba Inuzuka – Wild tracker: black sleeveless vest, feral messy hair, Akamaru wearing a small red scarf.
3. Hinata Hyuga – Shippuden outfit: long dark blue hair, lavender and white zipped hoodie jacket, dark navy pants.
4. Hinata Hyuga – New Year kimono: hair in a neat bun with a flower ornament, lilac kimono with a white obi, hands together politely.
5. Shino Aburame – Shippuden outfit: long grey coat with a tall collar covering the mouth, hood up, round black sunglasses.
6. Shino Aburame – Insect keeper: dark green cloak with the hood down, round sunglasses, a few tiny glowing beetles floating around him.
```

### Hoja 40 → `sprite-estilo-nuevo-40.png` (Sai, Yamato, Kakashi Hatake)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Sai – Root operative: black Root ANBU outfit with a white porcelain mask pushed to the side of his head, ink scroll on his back.
2. Sai – Painter: long dark smock stained with ink, holding a big brush and a small blank scroll.
3. Yamato – ANBU: grey ANBU vest and arm guard, white cat-like ANBU mask held at his side, short dark hair.
4. Yamato – Carpenter: rolled-up sleeves, simple dark work clothes, a small wooden hammer and a wooden plank under his arm.
5. Kakashi Hatake – ANBU: grey ANBU armor over a black sleeveless suit, red spiral tattoo on the upper arm, white dog-like ANBU mask held at his side.
6. Kakashi Hatake – Sixth Hokage: white Hokage cloak with a flame pattern hem over the jonin outfit, the same mask over his mouth.
```

### Hoja 41 → `sprite-estilo-nuevo-41.png` (Haku, Zabuza Momochi, Kabuto Yakushi)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Haku – Flower picker: long dark hair loose, pink kimono with a light obi, a small basket of herbs in hand.
2. Haku – Ice hunter: white fur-lined snow cloak with the hood up, hunter-nin mask in hand, a few ice crystals around.
3. Zabuza Momochi – Seven Swordsmen: dark Hidden Mist uniform with a flak vest, mouth bandages, the huge cleaver sword on his back.
4. Zabuza Momochi – Unmasked: no bandages, sharp shark-like teeth in a grin, dark cloak over the shoulders, huge sword on his back.
5. Kabuto Yakushi – Sound ninja: long purple-grey cloak with the hood down, round glasses, Sound forehead protector.
6. Kabuto Yakushi – Medic: white medical coat over his outfit, round glasses, glowing green chakra in one hand.
```

### Hoja 42 → `sprite-estilo-nuevo-42.png` (Gaara, Pain, Animal Path, Pain, Deva Path)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Gaara – Kazekage robes: white and blue Kazekage robe and hat, the gourd still on his back.
2. Gaara – Shippuden coat: long dark red coat with a grey vest and belt, gourd on his back.
3. Pain, Animal Path – Rain disguise: dark straw hat with hanging paper strips and a grey cloak, piercings visible on the face.
4. Pain, Animal Path – Hidden Rain: plain dark Hidden Rain outfit with a rebreather mask, wet hair, black chakra rods at the belt.
5. Pain, Deva Path – Straw hat: wide straw hat with hanging paper strips worn over the black cloak with red clouds.
6. Pain, Deva Path – Young rebel: spiky orange hair, simple dark Hidden Rain outfit with a grey flak vest, no piercings, determined smile.
```

## Hoja 43 → `sprite-estilo-nuevo-43.png` (icono del gacha) → `assets/menu/invocacion.png`

✅ **HECHA el 2026-10-16.** El atajo "Summon" del Home. Mientras no exista se pinta el sprite del Reserve Scroll
(`common/iconosMenu.js`), así que puede llegar cuando sea. Adjuntar de referencia la hoja 18 (los iconos
del menú) para que salga a juego con ellos.

```
[UI ICON STYLE BLOCK]

One menu icon: a summoning scroll unrolled on the ground with a glowing red summoning circle drawn on it and a small puff of white smoke rising from the center.
```

## Tanda 6 — héroes nuevos (hojas 44-48)

✅ **HECHAS el 2026-10-16.** Might Guy, Jiraiya, Asuma y Kurenai (`documentacion/42`, fase 3) ya están en los datos
con la marca `pendienteDeArte`: hasta que llegue su sprite **no salen en el gacha ni en el Bingo Book**.
Cuando llegue cada hoja, además de correr el script hay que **quitar la marca** del personaje en
`characters.json` — `characterSprites.test.js` falla para recordarlo. No hay que tocar código: los mapas
de sprites leen las carpetas con `import.meta.glob`.

Las hojas 44-45 llevan el **bloque de estilo de personajes** (cada uno con sus transformaciones en la
misma hoja), la 46 el de **proyectiles** y las 47-48 el de **aspectos**. Para las de aspectos, adjuntar
de referencia los sprites que hayan salido en las hojas 44-45. Might Guy no lleva proyectil: es cuerpo a
cuerpo, como Rock Lee.

### Hoja 44 → `sprite-estilo-nuevo-44.png` (Might Guy y Jiraiya)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Might Guy (normal): shiny black bowl-cut hair, very thick eyebrows, big confident grin, green full-body jumpsuit with a green Konoha flak jacket, orange leg warmers, red forehead protector worn as a belt.
2. Might Guy – "Gate of Wonder": same Guy with red skin, veins on the face, a swirling green-blue chakra aura and steam rising from his body.
3. Might Guy – "Eighth Gate: Night Guy": same Guy with red skin, white hair standing up, glowing red-green chakra flames all around him like a dragon of blood-red steam.
4. Jiraiya (normal): tall old man, long spiky white hair down his back, red lines running down from his eyes, red haori over a green kimono, a tall horned forehead protector with a plain metal plate, wooden geta sandals, a big scroll on his back.
5. Jiraiya – "Toad Mountain Training": same Jiraiya holding an unrolled summoning scroll, a small orange toad on his shoulder, faint orange chakra aura.
6. Jiraiya – "Sage Mode": same Jiraiya with a toad-like big nose, orange pigment around yellow toad eyes, a warty chin, two tiny old toads sitting on his shoulders, glowing orange natural-energy aura.
```

### Hoja 45 → `sprite-estilo-nuevo-45.png` (Asuma y Kurenai)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Asuma Sarutobi (normal): short spiky black hair and a beard, a cigarette in his mouth, green Konoha flak jacket over a dark suit, white sash with a round Fire emblem at his waist, a trench knife in each hand.
2. Asuma – "Wind Blades": same Asuma with sharp blue wind chakra blades extending far beyond his trench knives and a swirling wind aura.
3. Kurenai Yuhi (normal): long wavy black hair, red eyes, red lipstick, bandage-wrap dress with a red mesh sleeve on the right arm, Konoha forehead protector.
4. Kurenai – "Genjutsu Mistress": same Kurenai surrounded by drifting red flower petals and dark tree roots curling around her, faint red illusion aura.
```

### Hoja 46 → `sprite-estilo-nuevo-46.png` (proyectiles)

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Jiraiya's "Toad Flame Bombs": a big wave of orange flame mixed with drops of shiny yellow toad oil.
2. Asuma's "Flying Swallow": a long sharp crescent of pale blue wind chakra.
3. Kurenai's "Tree Binding Death": a burst of red flower petals swirling around a dark twisting tree root.
```

### Hoja 47 → `sprite-estilo-nuevo-47.png` (aspectos: Might Guy, Jiraiya, Asuma)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Might Guy – Wheelchair hero: a calmer older Guy in a plain green jumpsuit with no flak jacket, thumbs-up pose, bandaged leg.
2. Might Guy – Youth uniform: young Guy in a red sleeveless training shirt, black shorts and orange leg warmers.
3. Jiraiya – Pervy Sage writer: same Jiraiya in a plain grey kimono with a notebook and a brush in his hands.
4. Jiraiya – Young Sannin: Jiraiya younger, shorter spiky white hair, a simple grey ninja outfit and a forehead protector, toad scroll on his back.
5. Asuma – Guardian Ninja: dark grey Twelve Guardian Ninja outfit with a long sash, trench knives at the belt.
6. Asuma – Off duty: casual dark shirt, hands in pockets, unlit cigarette, a shogi piece in one hand.
```

### Hoja 48 → `sprite-estilo-nuevo-48.png` (aspectos: Kurenai)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Kurenai – Jonin vest: green Konoha flak jacket over a dark outfit, hair tied back loosely.
2. Kurenai – Formal kimono: dark red kimono with a camellia pattern and a black obi, hair pinned up.
```

## Tanda 7 — arco Sasuke Retrieval (hojas 49-54)

✅ **HECHAS el 2026-10-16.** El primer arco nuevo (`documentacion/42` §5): sale en el acto 2 en lugar del Examen Chunin.
Ya está en los datos con `pendienteDeArte` (el arco, Jirobo, Kimimaro y los tres entrenadores del Sonido), y
**no está en la campaña** hasta que llegue todo su arte. Cuando llegue: correr el script, quitar las marcas
`pendienteDeArte` (los tests de `characterSprites.test.js` fallan para recordarlo) y añadir
`persecucion_de_sasuke` al acto 2 de `campaigns.json`.

Bloques: 49-50 el de **personajes**, 51 el de **proyectiles**, 52 el de **iconos** (como la hoja 19), 53 el
de **fondo de mapa** (como las 29-31) y 54 el de **aspectos**. Para la 52 adjuntar la hoja 19; para la 53,
una de las columnas actuales.

### Hoja 49 → `sprite-estilo-nuevo-49.png` (Jirobo y Kimimaro)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Jirobo (normal): huge heavy-set teenager with a shaved orange mohawk, small eyes, a beige sleeveless tunic with a thick purple rope belt tied in a bow, Sound forehead protector.
2. Jirobo – "Curse Mark Level 1": same Jirobo covered in black triangular curse-mark patterns spreading from his neck, dark purple aura.
3. Kimimaro (normal): pale slender teenager with long white hair parted in the middle, two red dots on his forehead, green eyes, loose white high-collared robe with a purple rope belt, a bone sword growing from his palm.
4. Kimimaro – "Curse Mark Level 2": same Kimimaro with grey skin, black sclera, long horns of bone and a bone tail, purple aura.
5. Kimimaro – "Dance of the Seedling Fern": same transformed Kimimaro surrounded by a field of sharp white bone spikes rising from the ground.
```

### Hoja 50 → `sprite-estilo-nuevo-50.png` (los entrenadores del Sonido)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Kidomaru: dark-skinned teenager with six arms, spiky dark hair tied in a ponytail, a third eye mark on his forehead, beige tunic with a purple rope belt, holding a golden bow.
2. Tayuya: girl with long red hair under a black cap, a beige tunic with a purple rope belt, a flute in her hand.
3. Sakon and Ukon: grey-haired teenager with a second identical head growing from the back of his neck, red lipstick, beige tunic with a purple rope belt, fists raised.
```

### Hoja 51 → `sprite-estilo-nuevo-51.png` (proyectiles)

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Jirobo's "Earth Prison Dome": a dome of cracked brown rock.
2. Kimimaro's "Dance of the Clematis": a long spiraling white bone spear.
3. Kidomaru's "Golden Arrow": a sharp golden arrow trailing sticky golden thread.
4. Tayuya's "Demon Flute": purple musical sound waves with a ghostly ogre face.
5. Sakon's "Parasite Demon": a grey fist emerging from a swirl of fleshy dark chakra.
```

### Hoja 52 → `sprite-estilo-nuevo-52.png` (medalla) → `assets/medals/persecucion_de_sasuke.png`

```
[UI ICON STYLE BLOCK]

One arc medal, like a Pokémon gym badge, matching the shape language of the attached medals: Bone Crest (Sasuke Retrieval), a white diamond-shaped badge made of crossed bones with a purple rope tied around it.
```

### Hoja 53 → `sprite-estilo-nuevo-53.png` (columna: Sasuke Retrieval) → `assets/map-columns/persecucion_de_sasuke.png`

```
[MAP BACKGROUND STYLE BLOCK]

Sasuke Retrieval: the flat center is a dark forest dirt trail. Left and right borders: tall dense border-forest trees, giant spider webs between branches, mossy rocks, and near the top a waterfall with two giant stone statue feet (the Valley of the End).
```

### Hoja 54 → `sprite-estilo-nuevo-54.png` (aspectos: Jirobo y Kimimaro)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Jirobo – Gentle giant: plain brown work clothes, eating rice balls from a bundle.
2. Jirobo – Orochimaru's guard: long dark Sound cloak with the hood down.
3. Kimimaro – Kaguya child: younger Kimimaro in a plain white kimono with the Kaguya clan red dots on the forehead.
4. Kimimaro – Funeral white: long flowing white robe with a black obi, a single white flower in his hand.
```

## Tanda 8 — arco Kazekage Rescue (hojas 55-60)

✅ **HECHAS el 2026-10-16.** Arco alternativo del acto 3, en lugar de la Invasión de Pain. Igual que Sasuke Retrieval
(tanda 7): está en los datos con `pendienteDeArte` y fuera de la campaña; cuando llegue, correr el script,
quitar las marcas y añadir `rescate_de_gaara` al acto 3 de `campaigns.json`. Bloques: 55-56 personajes, 57
proyectiles, 58 iconos (adjuntar la hoja 19), 59 fondo de mapa y 60 aspectos.

### Hoja 55 → `sprite-estilo-nuevo-55.png` (Sasori y Deidara)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Sasori: young-looking man with short messy red hair and sleepy brown eyes, black Akatsuki cloak with red clouds, a puppet's wooden joints visible at his wrists, a scorpion-tail puppet cable behind him.
2. Deidara (normal): long blond hair in a half ponytail covering his left eye, a scope over the eye, black Akatsuki cloak with red clouds, small mouths on the palms of his hands holding white clay.
3. Deidara – "C4 Karura": same Deidara with his cloak torn open, a stitched mouth on his chest, surrounded by a cloud of tiny glowing white clay particles.
```

### Hoja 56 → `sprite-estilo-nuevo-56.png` (entrenadores)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Puppet Brigade: three wooden puppets with mismatched masks and blade arms, hanging from faint blue chakra strings, drawn as one group.
2. Clay Spiders: a small swarm of white clay spiders, the biggest one in front, about knee-high to a ninja, drawn as one group.
```

### Hoja 57 → `sprite-estilo-nuevo-57.png` (proyectiles)

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Sasori's "Iron Sand: Drizzle": a dark cloud of iron sand spikes with a purple poison glint.
2. Deidara's "C3": a white clay doll mid-explosion, a burst of orange and white fire.
3. Puppet Brigade's "Hundred Puppets": a spray of poisoned wooden blades.
4. Clay Spiders' "C1 Swarm": three small clay spiders bursting in little orange explosions.
```

### Hoja 58 → `sprite-estilo-nuevo-58.png` (medalla → `assets/medals/rescate_de_gaara.png`)

```
[UI ICON STYLE BLOCK]

One arc medal, like a Pokémon gym badge, matching the shape language of the attached medals: Clay Crest (Kazekage Rescue), a sand-gold triangular badge with a white clay bird in the middle.
```

### Hoja 59 → `sprite-estilo-nuevo-59.png` (columna → `assets/map-columns/rescate_de_gaara.png`)

```
[MAP BACKGROUND STYLE BLOCK]

Kazekage Rescue: the flat center is hard-packed desert sand. Left and right borders: tall wind-carved sandstone cliffs, dunes, dry desert shrubs, and near the top the entrance of a hidden cave sealed with a boulder.
```

### Hoja 60 → `sprite-estilo-nuevo-60.png` (aspectos: Sasori y Deidara)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Sasori – Hiruko: hidden inside the hunched puppet Hiruko, a masked face with a straw hat and a scorpion tail.
2. Sasori – Sand puppeteer: young Sasori in a beige Hidden Sand outfit, holding two small puppets.
3. Deidara – Stone bomber: Deidara in a Hidden Stone outfit with a red scarf, no cloak.
4. Deidara – Straw hat: Akatsuki straw hat with hanging paper strips over his cloak.
```

## Tanda 9 — arco The Immortal Duo (hojas 61-65)

✅ **HECHAS el 2026-10-16.** Hidan y Kakuzu, el otro arco alternativo del acto 3. Igual que las tandas 7 y 8: en datos
con `pendienteDeArte`, fuera de la campaña hasta que llegue su arte; al llegar, correr el script, quitar las
marcas y añadir `hidan_y_kakuzu` al acto 3 de `campaigns.json`. Este arco no tiene entrenadores propios (salen
los genéricos). Bloques: 61 personajes, 62 proyectiles, 63 iconos (adjuntar la hoja 19), 64 fondo de mapa y 65
aspectos.

### Hoja 61 → `sprite-estilo-nuevo-61.png` (Hidan y Kakuzu)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Hidan: slicked-back silver hair, purple eyes, open black Akatsuki cloak with red clouds showing his chest, a Jashin pendant, a huge red three-bladed scythe on a cable.
2. Kakuzu (normal): tall man with a dark hood and a mask covering everything but his green-and-red eyes, black Akatsuki cloak with red clouds, black threads stitched across his arms.
3. Kakuzu – "Earth Grudge Fear": same Kakuzu with his cloak off, black threads bursting from his body and three masked beasts (white porcelain masks) attached to his back, dark aura.
```

### Hoja 62 → `sprite-estilo-nuevo-62.png` (proyectiles)

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Hidan's "Jashin Ritual": a red three-bladed scythe spinning, with a trail of red blood-colored chakra.
2. Kakuzu's "Pressure Damage": a combined blast of red fire, pale wind and yellow lightning swirling together.
```

### Hoja 63 → `sprite-estilo-nuevo-63.png` (medalla → `assets/medals/hidan_y_kakuzu.png`)

```
[UI ICON STYLE BLOCK]

One arc medal, like a Pokémon gym badge, matching the shape language of the attached medals: Scythe Crest (The Immortal Duo), a dark red circular badge with a silver triangle-in-a-circle symbol and a tiny three-bladed scythe.
```

### Hoja 64 → `sprite-estilo-nuevo-64.png` (columna → `assets/map-columns/hidan_y_kakuzu.png`)

```
[MAP BACKGROUND STYLE BLOCK]

The Immortal Duo: the flat center is a shaded dirt path through a forest. Left and right borders: tall dark Nara forest trees, sacred deer half hidden among the trunks, ferns and moss, and near the top a clearing with a large circular symbol drawn on the ground.
```

### Hoja 65 → `sprite-estilo-nuevo-65.png` (aspectos: Hidan y Kakuzu)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Hidan – Ritual form: black skin with white skeleton markings painted on, scythe planted in the ground.
2. Hidan – Hot Spring ninja: plain grey Hidden Hot Spring outfit, no cloak, a towel over his shoulder.
3. Kakuzu – Waterfall elite: younger Kakuzu in a Hidden Waterfall outfit with a flak vest, mask down.
4. Kakuzu – Bounty collector: grey travelling cloak with a straw hat, a heavy money pouch at his belt.
```

## Tanda 10 — segunda tanda de héroes (hojas 66-70)

✅ **HECHAS el 2026-10-16.** Tsunade (legendaria), Temari, Kankuro y Konohamaru (raros), en los datos con
`pendienteDeArte`. Como la tanda 6: correr el script y quitar las marcas. Tsunade no lleva proyectil: es
cuerpo a cuerpo. Bloques: 66-67 personajes, 68 proyectiles, 69-70 aspectos.

### Hoja 66 → `sprite-estilo-nuevo-66.png` (Tsunade y Temari)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Tsunade (normal): blond hair in two low pigtails, a purple diamond mark on her forehead, grey sleeveless kimono top with a dark sash, a long green haori, dark pants, heeled sandals.
2. Tsunade – "Strength of a Hundred Seal": same Tsunade with black seal markings spreading across her face and arms from the forehead diamond, green healing aura.
3. Tsunade – "Creation Rebirth": same Tsunade glowing with bright green chakra, her wounds closing, the seal markings blazing.
4. Temari (normal): sandy blond hair in four short spiky ponytails, black kimono-style dress with a red sash, a giant folded iron fan on her back, Sand forehead protector around her neck.
5. Temari – "Summoning: Kamatari": same Temari with her fan fully open, a small one-eyed weasel holding a sickle riding a whirlwind beside her, wind aura.
```

### Hoja 67 → `sprite-estilo-nuevo-67.png` (Kankuro y Konohamaru)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Kankuro (normal): black cat-eared hood, purple face paint, black bodysuit, a bandage-wrapped puppet on his back, Sand forehead protector on the hood.
2. Kankuro – "Three Puppet Formation": same Kankuro with three puppets (Crow, Black Ant, Salamander) hanging around him from blue chakra strings.
3. Konohamaru (normal): young boy with spiky brown hair, a long blue scarf, a grey-green shirt, a Konoha forehead protector a bit too big for him.
4. Konohamaru – "Big Ball Rasengan": same Konohamaru holding a huge blue spinning Rasengan above his head with both hands, wind aura.
```

### Hoja 68 → `sprite-estilo-nuevo-68.png` (proyectiles)

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Temari's "Cutting Whirlwind": a pale green tornado full of sharp wind blades.
2. Kankuro's "Black Ant: Puppet Prison": a black wooden puppet's open torso with blades sticking out.
3. Konohamaru's "Rasengan": a bright blue spinning sphere of chakra.
```

### Hoja 69 → `sprite-estilo-nuevo-69.png` (aspectos: Tsunade, Temari, Kankuro)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Tsunade – Fifth Hokage: white Hokage robe and hat with the red Fire emblem.
2. Tsunade – Young Sannin: younger Tsunade with long pigtails, a red-and-white ninja outfit, a green Konoha flak vest.
3. Temari – Sand jonin: grey Hidden Sand vest over a dark outfit, fan on her back.
4. Temari – Chunin exam proctor: dark blue kimono with a red sash, fan held closed in one hand.
5. Kankuro – Puppet master: no hood, short brown hair, new purple face paint, long dark coat.
6. Kankuro – Desert travel: beige desert cloak and wrapping, face paint visible.
```

### Hoja 70 → `sprite-estilo-nuevo-70.png` (aspectos: Konohamaru)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Konohamaru – Genin: slightly older Konohamaru in a long scarf and a dark jacket, goggles on his forehead.
2. Konohamaru – Academy days: younger Konohamaru in a yellow shirt and grey shorts, a long blue scarf and a helmet with goggles.
```

## Hoja 71 → `sprite-estilo-nuevo-71.png` (ilustración del desafío diario) → `assets/campaigns/diario.jpg`

✅ **HECHA el 2026-10-16.** La tarjeta del desafío diario en el Home, como la de la campaña (hoja 32): se recorta con
`cover` y lleva el título abajo a la izquierda. Mientras no exista, la tarjeta sale con el fondo liso.
Adjuntar de referencia la ilustración de la campaña (`assets/campaigns/camino_ninja.jpg`).

```
A wide 16:9 pixel art illustration in the exact style of the attached reference image, for a "Daily Challenge" mode card: a wooden mission board at the gate of the Hidden Leaf village at dawn, one fresh mission scroll pinned in the centre with a red seal, a rising sun behind the gate, birds in the sky. The main subject is in the CENTER; the bottom quarter is calm ground with little detail (a title will be written over it). Crisp pixels, no blur. No text, no letters, no logo, no UI, no frame.
```

## Tanda 11 — la ceremonia del Summon (hojas 72-74)

✅ **HECHAS el 2026-10-16.** La animación de cada tirada del gacha (`Summon/CeremoniaInvocacion.jsx`): **la marca de
invocación sale del suelo, estalla el humo y el ninja aparece en el centro**, como en una transformación. Ya
funciona sin ellas (un sello dibujado por código y el humo del relevo ampliado); cuando lleguen, el script las
deja en `assets/effects/` y `assets/summon/` y la ceremonia las usa sola, sin tocar código.

Las dos tiras llevan el **bloque de tiras de animación** y se reproducen a ×2, así que el dibujo tiene que leerse
grande. Adjuntar de referencia `src/assets/effects/humo.png` (el humo del relevo) para que salga a juego.

### Hoja 72 → `sprite-estilo-nuevo-72.png` (tira: el sello de invocación) → `assets/effects/sello-invocacion.png`

```
[ANIMATION STRIP STYLE BLOCK]

8 frames of a Naruto "Summoning Jutsu" seal appearing on the ground, seen from slightly above so the circle looks like a flattened ellipse lying on the floor: 1) a single drop of ink on the ground, 2) black ink lines spreading out from it like cracks, 3) the lines curving into the outer circle, 4) the full seal: an outer ring, an inner ring and radial lines with small ink marks between them (no real letters), 5) the seal starting to glow white-blue along its lines, 6) the seal glowing brightly with small sparks of chakra jumping up, 7) a column of light rising from the centre of the seal, 8) the column of light at its brightest, filling the frame. Black ink and white-blue light only, so it can be tinted.
```

### Hoja 73 → `sprite-estilo-nuevo-73.png` (tira: el humo de la invocación) → `assets/effects/humo-invocacion.png`

```
[ANIMATION STRIP STYLE BLOCK]

8 frames of a huge "summoning" smoke explosion, much bigger and fuller than a normal ninja poof: 1) a burst of white smoke from the ground, 2) the smoke shooting upward and outward, 3) a big round cloud filling most of the frame, 4) the cloud at full size with rolling puffs, 5) the cloud starting to split open in the middle (where a figure will appear), 6) the cloud opening wider and drifting to the sides, 7) wisps curling away at the edges, 8) almost gone, a few dithered wisps.
```

### Hoja 74 → `sprite-estilo-nuevo-74.png` (fondo del cartel del Summon) → `assets/summon/cartel.jpg`

El fondo del cartel de la página del Summon: el título va arriba a la izquierda y tres legendarios de pie abajo,
así que la franja de arriba y el suelo tienen que ser tranquilos.

```
A wide pixel art background (about 16:9) in the exact style of the attached reference images, for the banner of a "Summoning" screen: a mystical shrine at night, a large faintly glowing summoning seal drawn on a stone floor in the lower half, purple and deep blue sky with mist, two stone lanterns and hanging paper charms framing the left and right edges. The top third must be calm (a title is written there) and the floor must be flat and calm (three characters stand on it). Crisp pixels, no blur. No characters, no text, no letters, no UI, no frame.
```

## Tanda 12 — arco Tea Country Escort (hojas 75-80)

✅ **HECHAS el 2026-10-16.** El arco alternativo del **acto 1**, en lugar del País de las Olas: la escolta de Idate Morino
hasta la carrera del templo del País del Té. Como los de las tandas 7-9: en datos con `pendienteDeArte` y fuera
de la campaña; al llegar el arte, correr el script, quitar las marcas y añadir `escolta_pais_del_te` al acto 1 de
`campaigns.json`. Bloques: 75-76 personajes, 77 proyectiles, 78 iconos (adjuntar la hoja 19), 79 fondo de mapa
(adjuntar una columna actual) y 80 aspectos.

### Hoja 75 → `sprite-estilo-nuevo-75.png` (Oboro y Aoi)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Oboro: Hidden Rain genin with a breathing mask over his mouth, a dark hood, a grey-green poncho with a wide umbrella-like hat brim, Rain forehead protector.
2. Aoi Rokusho (normal): tall thin man with long dark hair and a mean smile, a dark green jonin vest over a dark suit, an old Leaf forehead protector scratched across, a sword hilt at his hip.
3. Aoi – "Thunder God Unsheathed": same Aoi holding a sword whose blade is pure crackling yellow lightning, sparks around him.
4. Aoi – "Lightning Overload": same Aoi wrapped in arcs of yellow-white lightning from the sword, eyes glowing, hair standing up.
```

### Hoja 76 → `sprite-estilo-nuevo-76.png` (entrenadores)

```
[CHARACTER STYLE BLOCK]

Left to right:
1. Mubi: Hidden Rain genin with a breathing mask, a hood and a dark poncho, crouching low as if about to sink into the ground.
2. Kagari: Hidden Rain genin with a breathing mask and goggles, a hooded raincoat, water dripping from his sleeves.
```

### Hoja 77 → `sprite-estilo-nuevo-77.png` (proyectiles)

```
[PROJECTILE STYLE BLOCK]

Left to right:
1. Oboro's "Mist Clones": three faint, translucent copies of a kunai in a puff of grey mist.
2. Aoi's "Sword of the Thunder God": a long blade of yellow lightning slashing diagonally.
3. Mubi's "Hiding in the Earth": a hand reaching out of cracked brown earth.
4. Kagari's "Rain Needles": a burst of sharp blue water needles.
```

### Hoja 78 → `sprite-estilo-nuevo-78.png` (medalla → `assets/medals/escolta_pais_del_te.png`)

```
[UI ICON STYLE BLOCK]

One arc medal, like a Pokémon gym badge, matching the shape language of the attached medals: Tea Crest (Tea Country Escort), a green round badge with a tea leaf and a small temple gate in the middle.
```

### Hoja 79 → `sprite-estilo-nuevo-79.png` (columna → `assets/map-columns/escolta_pais_del_te.png`)

```
[MAP BACKGROUND STYLE BLOCK]

Tea Country Escort: the flat center is a reddish-brown dirt road. Left and right borders: terraced green tea fields, small tea bushes in rows, wooden fences, a stone lantern or two, and near the top the red gate of a temple on a hill.
```

### Hoja 80 → `sprite-estilo-nuevo-80.png` (aspectos: Oboro y Aoi)

```
[OUTFIT STYLE BLOCK]

Left to right:
1. Oboro – Chunin exam: Oboro in the Rain team outfit he wore at the Chunin exam, a bandage over one eye.
2. Oboro – Mercenary: a long grey travelling coat and a straw hat, mask still on.
3. Aoi – Leaf jonin: younger Aoi in a clean Leaf jonin uniform, forehead protector intact.
4. Aoi – Rain mercenary: Aoi in a Hidden Rain cloak and hood, the sword wrapped in cloth on his back.
```

## Tanda 13 — la ceremonia del Summon, versión 2 (hojas 81-82)

✅ **HECHAS el 2026-10-16.** Del playtest del 2026-10-16. La 81 añade una fase al principio de la ceremonia (los sellos de
manos del Kuchiyose) y la 82 **sustituye** a la marca de la hoja 72: la quiere en **tinta negra, sin color**,
para que no destripe la rareza de lo que va a salir. El código ya está: la fase de manos solo aparece si existe
su dibujo, y la 82 pisa el fichero de la 72 al correr el script. Bloque de **tiras de animación**; adjuntar de
referencia `src/assets/effects/sello-invocacion.png` y `humo-invocacion.png` para que salgan a juego.

### Hoja 81 → `sprite-estilo-nuevo-81.png` (tira: los sellos de manos) → `assets/effects/manos-invocacion.png`

```
[ANIMATION STRIP STYLE BLOCK]

8 frames of a pair of ninja hands performing the Summoning Jutsu hand seals, seen from the front at chest height, big and readable: 1) open hands coming together, 2) Boar seal, 3) Dog seal, 4) Bird seal, 5) Monkey seal, 6) Ram seal, 7) one hand biting the thumb with a small drop of blood, 8) the bloody palm slammed flat downward, ink lines bursting out from under it. Dark sleeves, skin tones, black ink only; no glow, no colour effects.
```

### Hoja 82 → `sprite-estilo-nuevo-82.png` (tira: la marca en tinta negra) → `assets/effects/sello-invocacion.png`

```
[ANIMATION STRIP STYLE BLOCK]

8 frames of a Naruto "Summoning Jutsu" seal appearing on the ground, seen from slightly above so the circle looks like a flattened ellipse lying on the floor: 1) a single drop of black ink on the ground, 2) black ink lines spreading out from it like cracks, 3) the lines curving into the outer circle, 4) the full seal in black ink: outer ring, inner ring and radial lines with small ink marks between them (no real letters), 5) the black lines starting to smoke slightly, 6) wisps of grey smoke rising from every line, 7) a column of pure white light rising from the centre, 8) the white column at its brightest. Black ink, grey smoke and pure white light only — no blue, no purple, no colour of any kind.
```

## Tanda 14 — la cinemática del Summon (hojas 83-87)

⏳ **PENDIENTES.** Del playtest del 2026-10-16: la ceremonia "parece un pase de diapositivas". La propuesta es
encadenar SEIS tiras de 8 fotogramas como planos de un mismo vídeo, sin cortes, con la cámara moviéndose por
código (acercamiento lento, temblor en el golpe, fundidos entre planos):

1. **Sellos de manos** (hoja 81, ya está) — la cámara se acerca despacio.
2. **El golpe** (hoja 83) — la palma contra el suelo y la onda de tinta. Temblor de cámara.
3. **La marca** (hoja 82, ya está) — la onda de tinta se cierra en el círculo.
4. **La columna** (hoja 84) — el humo sube de las líneas de la marca y se enrosca hasta formar una columna.
5. **La explosión** (hoja 73, ya está) — la columna estalla y el humo se abre por el centro.
6. **El aura** (hojas 85-87, una por rareza) — detrás del ninja, que sale del humo primero en silueta negra y
   luego a color. Sustituye a los rayos.

⚠️ **Reglas de estas hojas**, además del bloque de tiras de animación:
- **Mismo suelo en todos los fotogramas**: lo que toca el suelo, en la misma fila de píxeles en los 8 (el script
  ya conserva la altura de cada fotograma; si el dibujo salta, salta en el juego).
- **Continuidad con la hoja anterior**: adjuntar SIEMPRE de referencia la tira del plano anterior y la del
  siguiente (`src/assets/effects/…`), y pedir que el primer fotograma empiece donde acaba el anterior.
- **Sin color en 83 y 84**: tinta negra, humo gris y luz blanca. El color solo aparece en el aura, que es la
  revelación.

### Bloque de estilo — cinemática del Summon

Sustituye al bloque de tiras de animación en las hojas 83-87 (ya va metido en cada prompt de abajo, listo para
copiar). Lo que añade: que los 8 fotogramas son un plano continuo de vídeo (cambios pequeños entre uno y otro),
la cámara quieta con el suelo en la misma fila, y la continuidad con la tira anterior y la siguiente.

```
A pixel art animation strip in the exact style of the attached reference images, for a cinematic "Summoning Jutsu" sequence in a Naruto game: the SAME scene shown as 8 consecutive animation frames, left to right, in a single horizontal row, evenly spaced, each frame centered in its own equal-width square slot. These frames are one shot of a continuous video, so the motion between frames must be SMOOTH and gradual, with small changes from one frame to the next (no jumps, no missing in-between poses). The camera never moves inside the strip: the ground is a flat horizontal line at the SAME height in every frame, and anything resting on the ground stays on that exact line. The first frame must continue naturally from the attached previous strip, and the last frame must lead naturally into the attached next strip. Thick black outline where it makes sense, crisp pixels, no blur, no motion-blur smears. Effects that fade out break into sparse dithered pixels instead of becoming transparent. Transparent background (real alpha, NOT a checkerboard pattern). No text, no frame numbers, no borders, no UI, no characters unless the description asks for them.
```

Adjuntar en cada hoja: una hoja del estilo nuevo, **la tira del plano anterior y la del siguiente** (las que dice
cada prompt) y, para las auras, un sprite de personaje (`src/assets/characters/naruto.png`) para la escala.

### Hoja 83 → `sprite-estilo-nuevo-83.png` (tira: el golpe) → `assets/effects/golpe-invocacion.png`

```
A pixel art animation strip in the exact style of the attached reference images, for a cinematic "Summoning Jutsu" sequence in a Naruto game: the SAME scene shown as 8 consecutive animation frames, left to right, in a single horizontal row, evenly spaced, each frame centered in its own equal-width square slot. These frames are one shot of a continuous video, so the motion between frames must be SMOOTH and gradual, with small changes from one frame to the next (no jumps, no missing in-between poses). The camera never moves inside the strip: the ground is a flat horizontal line at the SAME height in every frame, and anything resting on the ground stays on that exact line. The first frame must continue naturally from the attached previous strip, and the last frame must lead naturally into the attached next strip. Thick black outline where it makes sense, crisp pixels, no blur, no motion-blur smears. Effects that fade out break into sparse dithered pixels instead of becoming transparent. Transparent background (real alpha, NOT a checkerboard pattern). No text, no frame numbers, no borders, no UI, no characters unless the description asks for them.

Attached: previous strip = effects/manos-invocacion.png, next strip = effects/sello-invocacion.png.

8 frames of a ninja's palm slamming onto the ground for a Summoning Jutsu, continuing from the attached hand-seal strip, seen from slightly above with the ground as a flat horizontal surface at the bottom of every frame: 1) the open palm just above the ground, 2) the palm hitting the ground, dust puffing out, 3) black ink bursting out from under the palm in sharp lines, 4) the ink lines racing outward along the ground in a ring, 5) the ring of ink wider, small rocks and dust jumping, 6) the ring at its widest, flattened like an ellipse on the floor, 7) the palm lifting away, the ink ring settling, 8) only the black ink ring on the ground. Black ink, grey dust, skin and dark sleeve only; no colour, no glow.
```

### Hoja 84 → `sprite-estilo-nuevo-84.png` (tira: la columna de humo) → `assets/effects/columna-invocacion.png`

```
A pixel art animation strip in the exact style of the attached reference images, for a cinematic "Summoning Jutsu" sequence in a Naruto game: the SAME scene shown as 8 consecutive animation frames, left to right, in a single horizontal row, evenly spaced, each frame centered in its own equal-width square slot. These frames are one shot of a continuous video, so the motion between frames must be SMOOTH and gradual, with small changes from one frame to the next (no jumps, no missing in-between poses). The camera never moves inside the strip: the ground is a flat horizontal line at the SAME height in every frame, and anything resting on the ground stays on that exact line. The first frame must continue naturally from the attached previous strip, and the last frame must lead naturally into the attached next strip. Thick black outline where it makes sense, crisp pixels, no blur, no motion-blur smears. Effects that fade out break into sparse dithered pixels instead of becoming transparent. Transparent background (real alpha, NOT a checkerboard pattern). No text, no frame numbers, no borders, no UI, no characters unless the description asks for them.

Attached: previous strip = effects/sello-invocacion.png, next strip = effects/humo-invocacion.png.

8 frames of smoke rising from the lines of a black ink summoning seal drawn on the floor (the attached seal strip, last frames), seen from slightly above, with the seal staying exactly at the same place at the bottom of every frame: 1) thin grey wisps rising from every line of the seal, 2) the wisps taller and curling, 3) the wisps twisting toward the centre, 4) a spinning column of grey smoke forming above the seal, 5) the column taller and thicker, spinning faster, 6) the column filling the frame height, white light leaking through cracks in it, 7) the column bulging, about to burst, bright white light inside, 8) the column at bursting point, almost pure white. Grey smoke and pure white light only — no colour.
```

### Hoja 85 → `sprite-estilo-nuevo-85.png` (tira: aura común) → `assets/effects/aura-comun.png`

```
A pixel art animation strip in the exact style of the attached reference images, for a cinematic "Summoning Jutsu" sequence in a Naruto game: the SAME scene shown as 8 consecutive animation frames, left to right, in a single horizontal row, evenly spaced, each frame centered in its own equal-width square slot. These frames are one shot of a continuous video, so the motion between frames must be SMOOTH and gradual, with small changes from one frame to the next (no jumps, no missing in-between poses). The camera never moves inside the strip: the ground is a flat horizontal line at the SAME height in every frame, and anything resting on the ground stays on that exact line. The first frame must continue naturally from the attached previous strip, and the last frame must lead naturally into the attached next strip. Thick black outline where it makes sense, crisp pixels, no blur, no motion-blur smears. Effects that fade out break into sparse dithered pixels instead of becoming transparent. Transparent background (real alpha, NOT a checkerboard pattern). No text, no frame numbers, no borders, no UI, no characters unless the description asks for them.

Attached: previous strip = effects/humo-invocacion.png; a character sprite for scale.

8 frames of a soft green chakra aura that rises from the ground around a standing figure (the space in the middle stays EMPTY, the figure is drawn separately), seen from the front with the ground at the bottom of every frame: green leaves and small green chakra flames swirling upward in a gentle spiral around the empty centre, growing from a ring on the floor (frames 1-4) and then looping calmly (frames 5-8, so frames 5-8 can repeat). Light green and white only.
```

### Hoja 86 → `sprite-estilo-nuevo-86.png` (tira: aura rara) → `assets/effects/aura-raro.png`

```
A pixel art animation strip in the exact style of the attached reference images, for a cinematic "Summoning Jutsu" sequence in a Naruto game: the SAME scene shown as 8 consecutive animation frames, left to right, in a single horizontal row, evenly spaced, each frame centered in its own equal-width square slot. These frames are one shot of a continuous video, so the motion between frames must be SMOOTH and gradual, with small changes from one frame to the next (no jumps, no missing in-between poses). The camera never moves inside the strip: the ground is a flat horizontal line at the SAME height in every frame, and anything resting on the ground stays on that exact line. The first frame must continue naturally from the attached previous strip, and the last frame must lead naturally into the attached next strip. Thick black outline where it makes sense, crisp pixels, no blur, no motion-blur smears. Effects that fade out break into sparse dithered pixels instead of becoming transparent. Transparent background (real alpha, NOT a checkerboard pattern). No text, no frame numbers, no borders, no UI, no characters unless the description asks for them.

Attached: previous strip = effects/humo-invocacion.png; a character sprite for scale.

8 frames of a strong blue chakra aura around a standing figure (the space in the middle stays EMPTY, the figure is drawn separately), seen from the front with the ground at the bottom of every frame: a vortex of blue chakra wind bursting up from a ring on the floor (frames 1-4), then roaring in a tall spiral with small blue sparks and streaks of wind (frames 5-8, loopable). Bright blue, cyan and white only.
```

### Hoja 87 → `sprite-estilo-nuevo-87.png` (tira: aura legendaria) → `assets/effects/aura-legendario.png`

```
A pixel art animation strip in the exact style of the attached reference images, for a cinematic "Summoning Jutsu" sequence in a Naruto game: the SAME scene shown as 8 consecutive animation frames, left to right, in a single horizontal row, evenly spaced, each frame centered in its own equal-width square slot. These frames are one shot of a continuous video, so the motion between frames must be SMOOTH and gradual, with small changes from one frame to the next (no jumps, no missing in-between poses). The camera never moves inside the strip: the ground is a flat horizontal line at the SAME height in every frame, and anything resting on the ground stays on that exact line. The first frame must continue naturally from the attached previous strip, and the last frame must lead naturally into the attached next strip. Thick black outline where it makes sense, crisp pixels, no blur, no motion-blur smears. Effects that fade out break into sparse dithered pixels instead of becoming transparent. Transparent background (real alpha, NOT a checkerboard pattern). No text, no frame numbers, no borders, no UI, no characters unless the description asks for them.

Attached: previous strip = effects/humo-invocacion.png; a character sprite for scale.

8 frames of an overwhelming golden aura around a standing figure (the space in the middle stays EMPTY, the figure is drawn separately), seen from the front with the ground at the bottom of every frame: a pillar of golden chakra erupting from a cracked ring on the floor with crackling yellow lightning, flying rock debris and a shockwave (frames 1-4), then a tall blazing golden flame-aura with lightning arcs and floating sparks (frames 5-8, loopable). Gold, yellow, orange and white only.
```

