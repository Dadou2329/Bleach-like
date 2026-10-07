# REISHI 霊子 — a Bleach voxel brawler

A non-commercial **Bleach fan game**: a third-person action brawler in detailed voxel art, built with
**Three.js**. The whole world is destructible, and attacks cut, crush and tunnel through it. Balance is not a
goal: overpowered characters stay overpowered.

## Play

```bash
npm install
npm run dev        # open the printed URL (http://127.0.0.1:5173)
```

Click **PLAY**. The mouse is captured, and **Esc** pauses. A desktop browser with WebGL2 is required.
`?q=low` lowers graphics quality for weaker GPUs.

| Input | Action |
|---|---|
| WASD · mouse | move · look |
| Space | jump; in the air: **air-step** off reishi; hold: **stand on air** |
| Shift | **Shunpo** (flash step with afterimages); hold: flash-run |
| Ctrl / C | descend |
| LMB | Zangetsu combo (5 hits, lunges, ground-cracking chop, spin, leaping finisher) |
| RMB | heavy chop (air: diving slam) |
| Q | **Getsuga Tenshō**: a crescent that carves a canyon through anything in its path |
| F | **Bankai**: Tensa Zangetsu (new form, black Getsuga, speed) |
| G | **Hollow mask**: 11 s of black, bigger Getsuga, speed, power and toughness, then it cracks and shatters (G again tears it off) |
| V | reiatsu flare (aura, more damage, drains reiatsu) |
| Tab / middle mouse | lock-on |
| H | controls panel |

The table shows Ichigo. Every character uses the same slots (LMB string, RMB heavy, Q/E/R skills, F release,
G state, V flare); press **H** in game for the current character's moves.

### What's in this build
- **Kurosaki Ichigo**: Shikai and Bankai forms with full voxel models, IK-driven sword animation, a procedural
  gait, spring-bone cloth, a flame aura and afterimages. His **Hollow mask** forms under a claw across the
  face, cracks as its time runs out and breaks into voxel shards.
  - Shikai: a five-hit cleaver string, the ground-cracking chop and **Getsuga Tenshō** (Q). E drags the blade
    up out of the ground, and a Getsuga runs along the earth, tearing a trench and throwing up whoever stands
    on it. R throws Zangetsu on its cloth (**Deadly Darts**): it spins out, cuts what it meets and is hauled
    back. R again reels it in early.
  - F: **Bankai, Tensa Zangetsu**. The string is faster and the Getsuga turns black. E is a thrust whose
    narrow black bolt tunnels through buildings. R raises the blade wrapped in reiatsu (**Getsuga Matoi**),
    and for a while every cut throws a crescent of its own.
  - G: the **Hollow mask**. Masked, R becomes the barrage: he flash-steps round the target and fires a black
    Getsuga from each side, the last one point-blank.
  - Killed in Bankai, he does not stay down: the body twitches and the **Full Hollow** rises in it. It has a
    horned bone helmet, hair to the waist, the hole in the chest and crimson fur, and it fights with claw and
    sword. Its moves are Sonído (E), the horn **Cero** (Q), a ground-shattering overhead (RMB) and a roar
    that flattens everything near (R). After about thirty seconds, or when it is beaten, a horn snaps, the
    hole closes and Ichigo comes back to himself with some strength left.
- **Grimmjow Jaegerjaquez**: a street-brawler string, Cero, Gran Rey Cero and Sonído, then **Pantera**
  (a new body, claws that rake grooves into the world, Garra de la Pantera, Desgarrón).
- **Kuchiki Byakuya**: a clean sword chain and Kidō, then **Senbonzakura**: a thousand-petal swarm streams
  through buildings. His **Bankai** raises rows of giant blades that shatter into a petal ocean (Gōkei, Senkei,
  Hakuteiken).
- **Renji Abarai**: rough 11th-Division cuts with a katana. Hadō #31 **Shakkahō** goes off in his own hand
  when he fires it again too soon; the fully chanted one is much bigger (and burns him too at point-blank range).
  - F: **"Hoero, Zabimaru"**. The blade splits into six segments on a red thread. Each lash cuts along its
    whole length, so a sweep slices a building in two. He also has the 25 m full-reach lash (RMB), the
    blind-angle lash that curls round and strikes from behind (Q), the constriction (E), the whirlwind (R) and
    **Higa Zekkō** (G).
  - F again: **Bankai, Hihiō Zabimaru**. A thirty-metre bone snake rises out of a dust storm. Its skull
    lunges, sweeps and smashes craters (RMB). **Hikotsu Taihō** (Q) fires a red beam from its jaws. It can bite
    an enemy, lift it and drive it into the ground (E). Every vertebra can ring the target and strike at once
    (R), and part of the body can burrow and burst up under the enemy (G).
- **Rukia Kuchiki**: a quick, turning katana string closed by a Hakuda kick, and her Kidō: **Sōkatsui** (Q),
  **Hainawa** with **Rikujōkōrō** grown out of it (E; Q on a bound target fires the doubled **Sōren
  Sōkatsui**), **Byakurai** (R).
  - F: **"Mae, Sode no Shirayuki"**. The sword turns white and a long ribbon trails from the pommel. Every cut
    leaves frost, and three in a row freeze the target. Her dances are **Tsukishiro** (Q: a circle round the
    target, a pillar of light, and everything inside freezes and shatters), **Hakuren** (E: one stab, four
    more, then an avalanche of cold that leaves a glacier behind it) and **Shirafune** (R: the blade grows on
    in ice). G is the white body: absolute zero for four seconds, then a slow thaw.
  - F again: **Bankai, Hakka no Togame**, for 25 seconds. Every cut freezes, Q sends out the wave of absolute
    zero and E raises the mist pillar. When it ends she must thaw.
- **Yasutora "Chad" Sado**: a heavyweight's string (jab, cross, hook, uppercut), the haymaker, a shoulder
  charge through walls and **Grua Tirar**.
  - F: **Brazo Derecha de Gigante**. Armoured punches crater, and the fist fires blasts. In **El Directo** the
    shoulder fin opens like an exhaust and the blow flies as a beam.
  - F again: the true forms, the Gigante shield and **Brazo Izquierda del Diablo**. **La Muerte** (E) charges
    the five fingertips; when the fist lands, a giant skull is gouged into whatever stands behind the target.
- **Uryū Ishida**: the archer. **Ginrei Kojaku**, a spider-web bow of light, forms round his left fist when
  he shoots. He keeps his distance with **Hirenkyaku** (Shift). His moves:
  - LMB: **Heilig Pfeil**, two single shots and then three in a blur.
  - RMB: the long draw. The charged arrow bores straight through walls and whoever stands behind them.
  - Q: **Licht Regen**. The charge crawls up his raised bow arm past the shoulder, then a rain of arrows
    falls on one target and craters the ground round it.
  - E: **Seele Schneider**, drawn from the coat and loosed from the bow. The blade itself flies and bores
    through everything.
  - R: **Sprenger**. Five Seele Schneider are thrown round the target in a pentagon, which binds its legs.
    Then the Gintō is poured and the whole pentagon goes up. It is slow, so bind the target first.
  - G: a Gintō flicked at the target. **Gritz**, a man-sized pentagonal cross of light, holds it fast.
  - F: **Quincy: Letzt Stil**, for 25 seconds. The wing on his right shoulder drinks the reishi out of the
    walls round him, every arrow bursts, and the charged shot goes through everything. Afterwards his powers
    are sealed for a while.
- **Yoruichi Shihōin**, the Flash Goddess: the fastest Shunpo in the game, trailing afterimages. Her LMB
  string is Hakuda kicks (snap kick, spinning heel, flying knee, double palm, axe heel). Her moves:
  - RMB: the concentrated blow, driven from the hip. The air ahead of the fist breaks walls.
  - Q: **Utsusemi**. Her cast-off shell stays where she stood and draws the attack while she heel-kicks
    the target from behind.
  - E: the **Shunshin** flurry: five blows from every side, one per flash step.
  - R: **Raiōken**, a blur of punches that holds the target up, then the final blow.
  - G: **Anken**, boot knives flicked off a rising kick.
  - F: **Shunkō**. The orange top tears away and lightning Kidō covers her back and arms. Every blow
    stuns. RMB fires the Kidō out of her palms in a cone that tears up and scorches the ground. G becomes
    **Hanki**, which cancels incoming energy and freezes anyone close.
  - F again: **Shunkō: Raijin Senkei**, for 20 seconds. A ring of thunder drums stands on her back and her
    bangs rise into horns. RMB brings a column of lightning down on the target, and Q throws the drums'
    blinding light orbs.
- **Kisuke Urahara**, the shopkeeper in his striped hat and geta. His unhurried cane string ends in a kick, and
  he casts Kidō without incantations:
  - RMB: **Shitonegaeshi**, a lunging thrust that knocks the target flat and pins it under the cane tip.
  - Q: **Shibireyubi**, a flash from a raised finger that paralyses.
  - E: **Jūgeki Byakurai**, a red piercing beam.
  - R: the binding chain. Each press adds a layer: **Rikujōkōrō**, **Sajō Sabaku**, then **Kuyō Shibari**.
  - G: the **Portable Gigai**. The next blow lands on an inflatable dummy, and he reappears behind the attacker.
  - F: **"Okiro, Benihime"**. The cane becomes a crimson sword. **Nake** (RMB) is a crimson wave that cancels
    beams it meets, **Chikasumi no Tate** (Q) a blood-mist shield and **Kamisori** (E) a razor arc that turns in
    flight. **Shibari** (R) throws a net; on a netted target, R again lights **Hiasobi Juzutsunagi**, a
    fire-bead chain that goes up in one blast. **Tsuppane** (G) is a ring that cancels energy.
  - F again: **Bankai, Kannonbiraki Benihime Aratame**. A curtain falls and a giant doll leans out over him.
    Every cut lays a seam, and RMB opens them all at once. Q has her hands seize and restructure the target,
    E rebuilds his own body, R sews a stitch rail to the target and rides it, and G closes her hands round
    the target like shrine doors.
- **Genryūsai Shigekuni Yamamoto**, the Captain-Commander. Robed and stooped on his cane, he swings a slow,
  heavy string and does not flinch at light blows. His sealed moves:
  - RMB: **Onibi**, the blunt cane driven through the target and the wall behind it.
  - Q: **Hitotsume: Nadegiri**, a single draw too fast to see. A moment later everything along a line twenty
    metres long falls apart.
  - E: **Ikkotsu**, one punch that sends the target down the street through buildings. R: **Sōkotsu**, both
    fists at once.
  - G: strips for battle. The haori and the top of his robe come off, the cane goes through his belt, and his
    bare fists break walls.
  - F: **"Banshō issai kaijin to nase, Ryūjin Jakka"**. The cane peels away from the sword and the sky catches
    fire. Every cut sets the world alight. RMB throws a wave of fire, Q is **Taimatsu** (an inferno in front of
    him), E is **Jōkaku Enjō** (a dome of fire closed over the target) and R is **Ennetsu Jigoku** (pillars of
    fire round the target that merge into one hell). G is Hadō #96 **Ittō Kasō**: his hand clamps on the enemy
    and a pillar of fire rises from the sword tip. It burns part of his own body.
  - F again: **Bankai, Zanka no Tachi**, for 30 seconds. Every flame on the field goes out into the blade and
    the clouds burn away. **East** (RMB): wherever the edge passes, the world simply stops existing, and a tap
    of the tip erases a trench. **South** (Q): the charred dead rise and swarm the target. **North** (E):
    **Tenchi Kaijin**, a wave that turns everything to ash. **West** (R): the hidden heat made visible, and
    nothing that touches him survives it. The heat burns him too, and when it ends, it rains.
- **Gin Ichimaru**, all grin and closed eyes in the white robe of Las Noches. Light one-handed flicks with
  Shinsō, and the last one shoots the blade out of its point. His moves:
  - RMB: **"Ikorose, Shinsō"**. The blade shoots out fifty metres, bores through walls and carries the
    target along on its point.
  - Q: the blade held long and swept across the front, halving buildings.
  - E: **Hakufuku**. Phantom purple blossoms fall round the target, and it drops asleep.
  - R: **Sentan Hakuja**. A white cloth coils round the target, and with a flash it is somewhere else, high up.
  - G: the eyes open. The grin goes and he is serious.
  - F: **Bankai, Kamishini no Yari**. Nothing about him changes but a pulse of violet. Thrusts reach across
    the town near instantly, and every hit leaves a sliver of the blade inside. RMB is the swing that splits
    the town, Q is **Butō** (both hands, the hilt at the chest, a pierce you barely see) and E is **Butō:
    Renjin**, a wall of blades. R, **"Korose"**, turns every sliver to poison, and whoever carries one comes
    apart from the inside.
- **Suì-Fēng**, Commander-in-Chief of the Onmitsukidō: the fastest Shunpo in the game. Her LMB string mixes
  reverse-grip punch-slashes and snapped kicks. Her moves:
  - RMB: **Kazaguruma**, a windmill kick that sends the target flying.
  - Q: the **speed clones**. She flashes round the target, leaves a copy at every step to draw its eye, and
    strikes from behind.
  - E: **Takigoi**. She catches the next blow and answers it.
  - R: a binding Kidō.
  - G: **Shunkō**. The haori comes off, wind streams over her back and arms, and every blow bursts.
  - F: **"Jinteki Shakusetsu, Suzumebachi"**, a black-and-gold gauntlet with a stinger. Each sting leaves the
    black **Hōmonka** crest where it lands, and a second sting on a crest is **Nigeki Kessatsu**, death in two
    strikes. Q flashes to a crest and stings it, and E stings three places at once.
  - F again: **Bankai, Jakuhō Raikōben**. A gold launcher closes round her arm and she can barely move. RMB
    or Q fires a homing missile twice her height whose recoil throws her back, unless E has first tied her
    down with the **Ginjōtan**. After two missiles, the Bankai ends.
- **Shunsui Kyōraku**, Captain of the 8th Division: a big, lazy man under a straw hat, the pink flowered
  kimono over his captain's haori, the daishō at his left hip. His cuts are unhurried and land hard. His moves:
  - RMB: the **daishō**'s two tempos. The wakizashi is drawn and across first, and the tachi comes down
    behind it.
  - Q: **Tsukiyubi**. Two fingers on the target and a push of reishi that throws it metres back.
  - E: Hadō #78 **Zangerin**, a ring of golden light at waist height that cuts clean through every wall it
    passes.
  - R: **"Nomō!"**, a sip of sake. A slow heal, and Katen warms to it.
  - G: a layer comes off. The kimono, then the haori, is flung over the target to blind it. What he wears
    decides what **Irooni** lets him cut: the colours are read off the voxels of each body.
  - F: **"Hana kaze midarete… Katen Kyōkotsu"**: two great black scimitars, and children's games made real.
    LMB is a two-blade string at two tempos. RMB is **Bushōgoma**, a spinning top of wind that becomes a
    tornado round the target. Q is **Takaoni**: whoever is higher wins, so he is suddenly high over the
    target and comes down on it. E is **Kageoni**: he sinks into his own shadow and rises out of the
    target's. R is **Irooni**: he calls a colour, and his cuts count by how much of it he wears, then the
    call passes to the other side.
  - F again, once Katen is in the mood: **Bankai, Katen Kyōkotsu: Karamatsu Shinjū**. The sky turns gloomy,
    black pine shadows spread over the ground, and the play's Acts go in order on Q, E, R and F. Act 1
    opens on the partner the wounds the partner gave him. Act 2 is the dark spots, a bleed nothing heals.
    Act 3 is the abyss: water rises over the field, and swimming up only drags the partner deeper. The Final
    Act sheathes both swords and winds a white thread round the partner's throat until the cut glows gold
    and bursts.
- **Jūshirō Ukitake**, Captain of the 13th Division: tall and thin, long white hair to his waist, the
  long-sleeved haori lined in crimson. His cuts are quick and exact, and a thrust goes for the vital points.
  Below half health his illness takes him now and then, doubled over and coughing. His sealed moves:
  - RMB: a step-in slash with both hands.
  - Q: Bakudō #8 **Seki**, a disc of light out of his palm that throws back whoever is close.
  - E: Hadō #31 **Shakkahō**.
  - R: **Kaidō**, a slow heal.
  - G: he pushes through the illness for a while (stronger, no coughing), and pays for it after.
  - F: **"Nami kotogotoku waga tate to nare, ikazuchi kotogotoku waga yaiba to nare — Sōgyo no Kotowari"**. The
    blade comes apart into two, tied by a red rope with five square charms.
- **Ukitake, Sōgyo no Kotowari**: the left blade drinks any reishi attack that comes at it from the front
  (Ceros, Getsuga, Kidō, arrows, flames; not blades or fists). Beams end on its steel, and the charms light up
  one by one as the store fills. LMB is the twin-blade dance. His moves:
  - RMB: the rope lashed across between the two hilts.
  - Q: the absorbing guard, which catches from a wider angle.
  - E: the **return**. The stored attack goes back out of the right blade, faster and harder, in its own
    colour (as a beam once there is enough of it).
  - F: the charms shaken bright, so the next return hits half again as hard.
  - There is no Bankai: it was never shown.
- **Zaraki Kenpachi**: no pattern. Each press draws a different wild swing, punch or kick, and every hit of a
  string lands harder than the last. Weak hits bounce off his reiatsu. His moves:
  - RMB: a lazy wrist flick that cuts a building in half.
  - Q: **Kendō: Ryōdan**, which splits the ground into a trench.
  - E: a reiatsu shock wave.
  - R: the **Leg Burst** charge through walls.
  - G: the **eyepatch** comes off: a golden pillar, the reiatsu skull, swings that cut far past the blade.
  - F: **"Nome, Nozarashi"**: the giant war-cleaver and Meteor Cleaver.
  - F again: **Bankai**: the crimson oni, a distant bisection, power that tears at his own body.
- **Ulquiorra Cifer**: hands in his pockets. His sealed moves:
  - kicks and the hand-spear;
  - a green finger **Cero** and red **Bala**;
  - Sonído;
  - **G**: draws Murciélago.
- **Ulquiorra, Murciélago**: black bat wings and flight, green rain, Luz de la Luna swung and thrown, and **Cero
  Oscuras**, which tunnels through the town.
- **Ulquiorra, Segunda Etapa**: claws, a tail whip, a head-grab rush through buildings, and **Lanza del
  Relámpago**, whose explosion swallows a block. He regenerates while his reiatsu lasts.
- **Coyote Starrk**, the Primera Espada: a tired slouch, the jacket's collar turned up round the bone jaw at his
  throat, the katana hanging loose. **Lilynette**, the other half of his soul, follows him around with her
  fists on her hips. His lazy cuts land clean, and his Cero needs no pose and no charge. His sealed moves:
  - RMB: a **Cero** out of the open left hand, at once.
  - Q: the same **Cero** out of his chest, point-blank and much bigger.
  - E: **Sonído**. He is simply somewhere else, behind the target, and the afterimages he left draw its attack.
  - R: **Lilynette** picks a fight: a flying kick, the horn, her scimitar drawn out of the stump of her snapped
    horn, or her feeble green Cero from further off.
  - G: the left glove comes off to show the **1**, and he stops pretending: harder hits, shorter cooldowns.
  - F: **"Kechirase, Los Lobos"**. His hand on Lilynette's head, she comes apart in blue reiatsu into his two
    pistols and the eyepiece over his left eye. The fur and the bandoleers come in, and his wounds close.
- **Starrk, Los Lobos**: gun-kata on LMB (the right gun heavy, the left quick, a pistol-whip). His moves:
  - RMB: the charged right-hand Cero.
  - Q: **Cero Metralleta**. A ring of charge points blooms round the right barrel and keeps firing until the
    shots fuse into one beam, which he steers.
  - E: the left gun sprayed across in a fan of small Ceros.
  - R: the **wolves** pour out of the bandoleers on his back. They hunt along the ground, some burrow and come
    up under the target, then they stretch to lunge, bite and explode.
  - G: **Colmillo**, the reishi sword drawn out of the bandoleer on his arm (G again for the gun).
  - F: Lilynette fires the guns on her own for a while.
- **Tōshirō Hitsugaya**: a child captain with a nodachi longer than he is. When he draws it, the sheath on his
  back dissolves into frost. His ice is written into the world as real voxels, so frost, spikes and prisons
  stay on the battlefield and can be broken again.
  - Sealed: a three-cut string, a point thrust, a burst of cold reiatsu that freezes anyone close, and a short
    ice wave.
  - F: **"Sōten ni zase, Hyōrinmaru"**. Storm clouds swallow the sky, and a chain with a crescent sickle hangs
    from the pommel. He gains the homing **ice dragon** that freezes what it strikes, the chain-sickle that
    hooks and hauls, and a long ice wave.
  - F again: **Bankai, Daiguren Hyōrinmaru**. Ice wings and flight, dragon-arm cuts, the claw and the tail.
    His techniques are **Ryūsenka** (a cross of ice), **Gunchō Tsurara**, **Hyōryū Senbi**, **Sennen Hyōrō**
    (pillars that circle and slam shut into a tomb of real ice) and **Hyōten Hyakkasō** (snow through a hole
    in the clouds that blooms into ice flowers). Twelve petals behind his back fall over time and with every
    great technique. When the last one falls, the Bankai breaks.
- **Sōsuke Aizen**: small, exact cuts with Kyōka Suigetsu held low. A raised finger sometimes stops a light
  frontal blow outright. His moves:
  - RMB: the passing stroke. He is past the target before the wound opens.
  - Q: Hadō #90 **Kurohitsugi**, the black coffin.
  - E: Hadō #63 **Raikōhō**.
  - R: **Kyōka Suigetsu**. A perfect copy stays where he stood while he walks round behind you, then it
    shatters like a mirror.
  - G: the reveal. He crushes the glasses and sweeps his hair back.
  - F: the **Hōgyoku**. The white Chrysalis brings a fused blade and instant regeneration. Q becomes the
    fully incanted Kurohitsugi and E becomes Hadō #99 **Goryūtenmetsu**, five dragons of light.
- **Duels**: pick a rival on the start screen, or use `?vs=<id>`. The duel AI pilots any kit; it releases and
  toggles states as its HP drops.
- **Karakura Town**, generated procedurally: houses, apartments, a shopping street, Karakura High, the Kurosaki
  Clinic, the river with its bridge, parks and utility poles. Every voxel is destructible. Cut buildings slide
  apart along the cut and shatter into rubble.
- **Hollows** come in waves with seeded masks. They roar, claw and pounce.
- Every third wave, a **Menos Grande** tears the sky open (Kūmon), crushes the town as it walks and fires a
  **Cero** that drills through buildings. Its mask is the weak point.

## Developer modes
- `/?mode=model[&char=ichigo|hollow|menos|grimmjow|byakuya|renji|rukia|chad|uryu|yoruichi|urahara|yamamoto|gin|suifeng|kyoraku|kenpachi|ulquiorra|starrk|lilynette|ukitake|hitsugaya|aizen][&form=bankai|shikai|pantera|murcielago|segunda|traitor|chrysalis|gigante|true|letzt|shunko|raijin|stripped|tybw|hollow|haori|shed|glove|lobos][&fan=1][&eyes=open][&drawn=1|0][&colmillo=1][&mask=1|cracked][&glasses=0][&aura=1]`: model and animation viewer
  (`window.__reishi.view('face')`, `.scrub('slash1', 0.17)`, `.move(9)`).
- `/?map=arena`: the small test arena. `/?hollows=0`: no waves.
- `/?mode=dev`: destruction playground (fly camera; right-click with tools 1–6).
- `npm run check`: typecheck and tests. `node tools/shots/shoot.mjs --url "/?..." --script "…"`: headless
  screenshots (SwiftShader). `window.__reishi` exposes `play(n)`, `act('getsuga')`, `menos()`, `freeCam(…)`
  and more for scripted captures.

## Project layout
- `src/voxel`, `src/render`: chunked voxel world, greedy mesher (workers), BatchedMesh renderer, voxel and
  character shaders, sky, post stack.
- `src/destruction`, `src/physics`: carve shapes, structural integrity, Rapier fragments and sliding cuts,
  debris.
- `src/models`: voxel model DSL (SDF shapes per bone, auto-shading, pixel-art faces) and mesh building.
- `src/anim`: rig, procedural locomotion, keyframed clips, sword IK, foot planting, spring bones.
- `src/chars`: Ichigo, Grimmjow, Byakuya, Renji, Rukia, Chad, Kenpachi, Ulquiorra, Hitsugaya, Aizen (bodies, forms,
  weapons), Hollows, Menos Grande, and their clips.
- `src/game`: fighters, combat, kits, AI, projectiles (Getsuga, Cero), camera, input.
- `src/vfx`, `src/audio`, `src/ui`: auras, trails, energy shaders, procedural sound, HUD, start screen.
- `src/maps`: Karakura Town generator and test maps.
- [`PLAN.md`](PLAN.md): the full plan (roster of about 95 characters, maps, systems, milestones).
- [`docs/`](docs/): wiki-based dossiers and lore research.
- `.claude/skills/`: voxel-art, kit-design and wiki-research skills.

*Bleach* © Tite Kubo / Shueisha and the respective anime rights holders. No official assets are used. Wiki
material is paraphrased with source links (Bleach Wiki content is CC BY-SA).
