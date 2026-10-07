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
- **Orihime Inoue**, in the white dress of Las Noches: waist-length orange hair, the two six-petal hairpins
  of **Shun Shun Rikka** at her temples. The six fairies fly out of the pins for every technique. LMB is the
  karate Tatsuki taught her (a jab, a palm thrust, a front kick, both palms behind a small triangle). Her moves:
  - RMB: **Koten Zanshun**. Tsubaki streaks at the enemy and splits what lies on his path. An enemy caught
    mid-swing may swat him; broken, he stays out until Sōten Kisshun mends him.
  - Q: **Santen Kesshun**. Hinagiku, Lily and Baigon hold up a golden triangle that turns aside whatever strikes
    its face; shots die on it.
  - E: **Sōten Kisshun**. Ayame and Shun'ō spread a dome over her, and what happened is undone: her wounds close,
    and the ground and the buildings round her are put back the way they were, voxel by voxel.
  - R: **Shiten Kōshun**. Tsubaki at the heart of a triangle; the first blow on it is fired back down its path.
  - G: **Resolve**, "I reject". A golden pulse undoes enemy shots and fields round her (it tears Enma Kōrogi
    apart), and while it holds her shields, heals and Tsubaki are stronger.
  - F: **Rokuten Shishun** (anime only). The six circle her trailing crimson and turn aside what is fired at
    her. F again is the **Rejection**: her palm on the enemy rejects its power (no releases or states, its
    strength cut). Then she is spent.
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
- **Tier Harribel**, the Tres Espada: tall and very still, the high collar of her jacket hiding her face from
  the nose down, three braids in her short golden hair, black paw-like gloves, and Tiburón (the wide blade
  that is only an outline) across her back. LMB is an economical chain that changes hands every second cut,
  the sword passing between her hands at her chest, and ends with both hands on the hilt. Her sealed moves:
  - RMB: a power swing, wound round to her right, that blasts the target back.
  - Q: **Ola Azul**. Yellow light fills the blade's window, and the swing flings it on as a flying blade.
  - E: her **Cero**, charged along the blade and swept across as a very wide yellow arc.
  - R: the **read**. She waits. Whoever attacks is answered from behind with one cut, and an attack from afar
    is sidestepped.
  - G: the **unzip**. The jacket opens on the bone mask over her lower face and the 3 on her breast. She is
    stronger and quicker from then on.
  - F: **"Ute, Tiburón"**. The water rises round her in two streams and closes into a spinning cocoon, which
    she cuts open from inside with her wounds closed.
- **Harribel, Tiburón**: the shark-fin spaulders, the bone armour and the two ribbons off her back; the pata, a
  giant shark tooth with gills, over her right hand. The water is real in the world: it floods the ground,
  slows and soaks whoever wades through it, and soaked targets take more from her water. Standing in it, she
  is quicker and hits harder. LMB is cuts that trail water, ending in a full turn. Her moves:
  - RMB: **La Gota**, a pressurised drop shaped like a shark's tooth that bursts through walls.
  - Q: **Trident**, three high-pressure cuts thrown one after another.
  - E: **Cascada**, a river poured out of the blade. It carries everything in its path off and floods the
    street where it comes down.
  - R: **Hirviendo** (held). Reishi and water that come at her from the front boil away, and whoever stands
    close is scalded.
  - G: the arc **Cero**.
  - F: **Cascada Real**. The sky darkens, the river drops out of it onto the target, and a volley of La Gota
    follows.
- **Nnoitra Gilga**, the Quinto Espada: very tall and rail-thin, long black hair over a white eyepatch, a
  cheek-to-cheek grin, the spoon-shaped hood standing behind his head. He carries **Santa Teresa**, two gold
  crescents back to back on a long shaft, on a chain to his waist. His **Hierro** is the hardest skin of any
  Espada: light blows grind off it and do nothing, until whoever keeps hitting him gets used to it. LMB is
  huge one-handed sweeps, a front kick and a two-handed slam into the ground. His moves:
  - RMB: the **Crescent Smash**, a hop and an overhead that comes down like a falling building.
  - Q: the **chain throw**. The weapon flies out on its chain and bites the first fighter it meets; Q again
    (or when it stops) hauls it back and drags them in.
  - E: the **whirl**. He spins it over his head by the chain, battering whoever is close, then throws it.
  - R: his gold **Cero**, fired off the tip of his tongue with the 5 on it.
  - G: the eyepatch torn off, showing the hole; after that G is **Indice Radar**, a finger in the ground and a
    line of light to the target. While he has read them, he hits harder.
  - F: **"Inore, Santa Teresa"**. He raises the weapon overhead and comes out of the light with crescent
    horns, armoured arms and a mantis scythe in each of **four** hands; his wounds close.
- **Nnoitra, Santa Teresa**: the four scythes cut a pair at a time, then in a chop and a full turn with all
  four; he regenerates slowly all the time. His moves:
  - RMB: the **Mantis Cross**, all four flung wide and snapped shut.
  - Q: a scythe thrown overhand; another grows out of his wrist.
  - E: the tongue Cero.
  - R: **High-Speed Regeneration**.
  - G: Indice Radar.
  - F: **Seis Guadañas**, a Sonído into the target, every blade round and the cross.
- **Baraggan Louisenbairn**, the Segunda Espada and the old God-King of Hueco Mundo: short, barrel-chested and
  stooped, a huge white mustache, a scar over his shut right eye and a bone crown floating round his head. He
  wears a white coat lined with black fur and a belt of gold chains, and holds the double axe **Arrogante**
  like a sceptre. LMB is slow, enormous one-handed sweeps and a two-handed chop that cracks the ground. His
  sealed moves:
  - RMB: the **Casual Swing**, one lazy cleave whose cut runs on far past the blades and halves whatever
    stands in its path.
  - Q: the **aging touch**. A Sonído to the target's side and two fingers on a shoulder: their bones go
    brittle, so they move slower and every blow lands harder for a while.
  - E: the **royal throw**. A hand on the throat, lifted off the ground and flung through the street.
  - R: the **royal flare**, a dark red shockwave of reiatsu.
  - G: **Senescencia**. A dome of slowed time round him: whoever is inside moves, swings and animates at a
    crawl. It drains his reiatsu.
  - F: **"Kuchiro, Arrogante"**. He holds the axe out, bows his head, and black and purple flames from its eye
    burn him down to a crowned skeleton in a purple cloak; his wounds close.
- **Baraggan, Arrogante**: everything near him rots. The ground decays under his feet and walls beside him go
  brown and crumbly, those who stay close wither, and Ceros and Kidō age before they reach him (they do much
  less). His hits leave the rot in the wound, which keeps eating at the target. His moves:
  - LMB: Gran Caída chops trailing miasma.
  - RMB: the **Guillotine**, an overhead that rots a slab of the world in front of him into dust.
  - Q: **Respira** (held). Black-purple miasma pours out of his open hand and creeps further out the longer he
    breathes; stone crumbles and people wither where it rolls.
  - E: the **Respira slash**, a crescent of rot.
  - R: **Gran Caída** thrown. It spins out, rotting what it passes, and the chains bring it back.
  - G: **enraged**. The breath runs faster and further, and it costs him his own flesh.
  - F: **Respira Total**. The miasma floods out on every side, and every building round him rots and comes
    down.
- **Sajin Komamura**, captain of the 7th Division: a 2.88 m wolf in a sleeveless white haori, iron weights on
  his shoulders, light brown gauntlets and plated iron boots, with the long katana **Tenken**. He is heavy:
  knockback barely moves him. LMB is two great one-handed cuts, a straight left from the gauntlet and a
  two-handed chop that cracks the ground. His sealed moves:
  - RMB: the **Earth-Splitting Draw**. Tenken goes up over his head in both hands and comes down through the
    ground, which splits open in a line in front of him.
  - Q: the **overhead throw**. He seizes the target, hoists them over his head and drives them into the ground.
  - E: the **haymaker**, which sends the target flying through the street.
  - R: the **iron forearm**. A blow from the front is caught on the gauntlet, then he shoves through the
    attacker.
  - G: the **roar**. Those near him reel, and for a while weak blows barely scratch him.
  - F: **"Todoroke, Tenken"**.
- **Komamura, Shikai (Tenken)**: every move is copied by one of Tenken's **phantom limbs**, the arm, fist or leg
  of an armoured giant that materialises above and behind him, strikes at seven times his size and dissolves
  into red reishi. Each cut swings a giant sword. RMB opens a 40 m chasm, Q is the phantom fist, E the phantom
  stomp, and F calls **"Bankai — Kokujō Tengen Myō'ō"**.
- **Komamura, Bankai (Kokujō Tengen Myō'ō)**: a 30 m armoured samurai giant rises out of the ground behind him
  and to his left. It has a horned kabuto, eyes glaring from under its brim, a menpō, and black ropes coiled
  round its laced cuirass. It copies everything he does, bone for bone, and the camera pulls back to show it.
  - Its sword sweeps halve buildings.
  - RMB: **Heavenly Punishment**, a giant overhead that splits the ground for 70 m and cuts every building on
    that line in two.
  - Q: the giant fist. E: the giant stomp.
  - F: the **One Blow**, the giant's full-weight cut.
  - The giant burns reiatsu while it stands; when he runs dry it dissolves back into reishi.
- **Kaname Tōsen**, the blind former captain of the 9th, as he stood in Aizen's army: long braids let down over
  his back and shoulders, a thin smoky visor, a white sleeveless coat with an orange rope slung across it, long
  black gloves and white boots. **Suzumushi** has an orange hilt and a teardrop tsuba with a small ring hanging
  from its point. LMB is precise cuts (a level one at head height, a rising backhand, a lunging thrust) and a
  snapping kick. His moves:
  - RMB: the **side kick** that throws much bigger men through walls.
  - Q: **"Nake, Suzumushi"**. The blade rings, and everyone near him drops, stunned, their ears ringing.
  - E: **Benihikō**. He draws a half-circle round himself, and its afterimage breaks into a hundred thin blades
    that rise like locusts and rain down on the target.
  - R: a **disintegrating Kidō** out of his palm that unmakes what it touches.
  - G: the **Hollow mask**. He is faster and stronger, he regenerates, and his reiatsu turns black.
  - F: **"Bankai — Suzumushi Tsuishiki: Enma Kōrogi"**. Ten rings are thrown round the field and a black dome
    rises between them, the kanji of a corpse's decay glowing on it. Inside, every enemy loses sight, hearing
    and the sense of reiatsu: the AI gropes and swings at the air, and a player's screen goes dark except for
    the brief glimpse a blow gives. A hard hit tears the dome apart.
  - F with the mask on: **"Suzumushi Hyakushiki: Grillar Grillo"**.
- **Tōsen, Grillar Grillo**: a hunched, four-armed cricket-Hollow about 4 m tall, black-furred, with a Hollow
  hole through the chest, two spiralling silver horns hung with rings and chains, an elongated mask with huge
  orange eyes, a bushy tail and two pairs of beating wings. For the first time, he can see. His moves:
  - LMB: claws (the right, the left, then the lower pair together).
  - RMB: the double slam.
  - Q: **La Mirada**, a Cero swelling before each eye and merging into one beam.
  - E: **Los Nueve Aspectos**, nine lime-green circles drawn in the air, then one crushing burst of sound.
  - R: the screech.
  - G: a wing-beat leap.
  - F: La Mirada with all four Ceros.
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
- `/?mode=model[&char=ichigo|hollow|menos|grimmjow|byakuya|renji|rukia|chad|uryu|yoruichi|urahara|yamamoto|gin|suifeng|kyoraku|kenpachi|ulquiorra|starrk|lilynette|ukitake|harribel|nnoitra|baraggan|komamura|tosen|orihime|hitsugaya|aizen][&form=bankai|shikai|pantera|murcielago|segunda|traitor|chrysalis|gigante|true|letzt|shunko|raijin|stripped|tybw|hollow|haori|shed|glove|lobos|unzipped|tiburon|patch|santa|arrogante|giant|limbs|masked|grillo|rokuten][&fairies=1][&fan=1][&eyes=open][&drawn=1|0][&colmillo=1][&mask=1|cracked][&glasses=0][&aura=1]`: model and animation viewer
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
- `src/chars`: every fighter's body, forms and weapons (Ichigo, the Shinigami captains and lieutenants, the
  Espada, Uryū, Chad, Yoruichi, Urahara…), Hollows, Menos Grande, and their clips.
- `src/game`: fighters, combat, kits, AI, projectiles (Getsuga, Cero), camera, input.
- `src/vfx`, `src/audio`, `src/ui`: auras, trails, energy shaders, procedural sound, HUD, start screen.
- `src/maps`: Karakura Town generator and test maps.
- [`PLAN.md`](PLAN.md): the full plan (roster of about 95 characters, maps, systems, milestones).
- [`docs/`](docs/): wiki-based dossiers and lore research.
- `.claude/skills/`: voxel-art, kit-design and wiki-research skills.

*Bleach* © Tite Kubo / Shueisha and the respective anime rights holders. No official assets are used. Wiki
material is paraphrased with source links (Bleach Wiki content is CC BY-SA).
