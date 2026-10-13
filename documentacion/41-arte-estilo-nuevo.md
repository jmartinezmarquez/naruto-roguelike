# Arte: el estilo nuevo

El 2026-10-14 se pidieron a un generador de imágenes los 25 sprites que faltaban, y salieron
bastante mejor que el arte original. Se decidió **pasar todo el juego a ese estilo**. Este documento
es el encargo completo: cómo se pide, cómo entra en el juego y los prompts de cada hoja, en orden.

## Cómo entra una hoja en el juego

1. Se genera la hoja con su prompt (abajo) y se guarda en `src/assets/` **con el nombre exacto** que
   dice el prompt.
2. `python scripts/generar-sprites-estilo-nuevo.py` la recorta y deja cada sprite en su carpeta
   (`characters/`, `transformations/`, `projectiles/`, `items/`) con el nombre que el juego ya usa. Las
   hojas que aún no existen se saltan: se puede correr según vayan llegando.
3. Revisar a ojo y hacer commit. No hay que tocar código: los sprites sustituyen a los viejos con el
   mismo nombre de fichero.

El script **no necesita huecos limpios entre dibujos**: reparte la hoja en partes iguales y ajusta cada
corte a la columna más fina, y borra los restos del dibujo vecino. Pero sí necesita que los dibujos
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
- Si sale con el damero pintado en vez de transparencia, se pide otra vez: este script, a diferencia del
  de objetos nuevos, espera alfa de verdad.

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

## Fuera de este encargo (de momento)

El resto del arte del juego no es de "personaje" y se decide aparte, si se quiere unificar también:
iconos de nodo del mapa (`assets/nodes/`), naturalezas de chakra (`assets/chakra/`), iconos del menú
(`assets/menu/`), medallas (`assets/medals/`, dibujadas por script), sprites de efecto del combate
(`assets/effects/`, dibujados por script), fondos de columna del mapa (`assets/map-columns/`) y los
pergaminos de entrenamiento y los objetos nuevos, que ya son del estilo nuevo.
