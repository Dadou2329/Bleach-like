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
- **Hollow Ichigo** (Zangetsu, Ichigo's inner Hollow): Ichigo's body with the colours inverted. He has white
  skin and hair, black eyes with gold irises, a dark grin with a blue tongue, a white shihakushō with a black obi,
  and a loose, hunched stance with the head cocked. The white Zangetsu has a black edge and hangs on a black
  cloth, and he fights with it like a flail. His LMB string is two cuts, then the blade flung out on the cloth
  and yanked back, a great upswing that launches, and a double whirl round him. RMB is the cleave. His moves:
  - Q: **Getsuga Tenshō**, white with a red lip.
  - E: **Deadly Darts**. The cleaver flies far on its cloth. E again tugs it onto a new line toward the target,
    and a third press reels it in.
  - R: the **flail whirlwind**. For five turns the blade circles him on the cloth and drags everyone near into
    its path.
  - G: the **bare hand**. A blade caught in his fist turns white and crumbles, disarming the attacker, and he
    cuts them down. A Getsuga or Cero is swatted aside, along with any other shot near him.
  - F: **Bankai**: a white coat lined in black and an all-white Tensa Zangetsu on a chain. The cuts are faster
    and the Getsuga is bright red. E spins the blade round his hand by its chain and hurls it point first. It
    impales whoever it hits, and he hauls them in on the chain. R is the **pincer**: red Getsuga from one side,
    the other side, then from above.
  - F (in Bankai, below 40% life): the **Full Hollow**, in black and white. It has a black horned mask with white
    lines, white hair to the waist and black fur, and it regenerates. It fights with claw and blade: the horn
    **Cero** (Q), Sonído (E), the shattering overhead (RMB) and the roar (R). It lasts thirty seconds, or until a
    horn breaks.
  - Passive, **"the king and the horse"**: the longer his opponent hesitates, the harder he hits (up to ×1.45).
    Blows that land on him tame it.
- **Isshin Kurosaki**, Ichigo's father, the town doctor and once Captain Isshin Shiba of the 10th Division: tall and
  broad, spiky black hair, a goatee and stubble. He starts in his gigai, in a white lab coat, and fights the way he
  wakes his son up. LMB is palm, elbow, knee and the **Isshin Flying Double Knee**; Q leaps that knee in from
  range. RMB is **Chōhigezutsuki**, the Super Stubble Headbutt, which launches. E is **Oni Dekopin**, a forehead
  flick that sends a man through the walls behind him. R is field medicine and G a charm that throws up a barrier
  the next time he is hit.
  - F: out of the gigai, the **Shinigami**: a black shihakushō and his captain's haori torn down to a sash, with
    **Engetsu** (red wrap, hexagonal guard, blue tassel). LMB is kendō (men, kote, dō, tsuki), and every cut
    breaks concrete. RMB is **Agitowari**, one vertical cut from the jaw down that splits what stands before him.
    Q is his **Getsuga**: short and heavy, it leaves a crater. E is the flick and R the headbutt. G is **Kaikyō
    Kotei**: four corded rods thrown round him hold whoever stands inside to a crawl.
  - F again: **"Moero, Engetsu."** The blade and the tassel catch fire, every cut burns, and the Getsuga is a
    crescent of fire that sets the ground alight. R is the **blood-flame blast**: blood wiped along the blade and
    a pillar of fire that bursts on what it meets, paid for in his own life. His Bankai was never revealed, so
    there is none.
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
- **Mayuri Kurotsuchi**, captain of the 12th Division and president of the Research Institute: the painted
  face (white, with a black mask band and gold eyes), the hat with two horns, golden ear cones, blue nails, a
  purple cravat and the haori with 十二. His sword stays in a sleeve sheath at his belly. Sealed, LMB is plain
  swordplay (a slash, a backhand, a needling stab); the rest is his inventions:
  - RMB: **Jabarakaina**. His left arm shoots out on a chain of segments, seizes the enemy and hauls him in.
  - Q: the **explosive membrane**, thrown from the palm: it sticks where it lands and blows a second later.
  - E: the **sleeve net**. Sticky strands spray out in a cone and bind whoever they catch.
  - R: a silent **palm Kidō**, a white bolt that bores through walls.
  - G: the **Superhuman Drug**, diluted, jabbed into his own neck: for five seconds the world crawls round him.
  - F: **"Kakimushire, Ashisogi Jizō"**. The sword becomes the trident with the baby's head. Every stab numbs;
    three in a row and the limbs stop answering (paralysis). RMB is the deep stab (paralysis at once), Q is
    **Kyōdo Yon** (a finger in the baby's eye: whoever hears the scream for four seconds is paralysed through)
    and E the poison vapour from the baby's mouth.
  - F again: **Bankai, Konjiki Ashisogi Jizō**. The giant golden-headed caterpillar rises out of the ground and
    crawls after the enemy; his reiatsu turns red and drains. RMB it charges, Q it breathes the poison (a cloud
    that eats whoever is not of his blood), E blades burst from its chest, R it devours. F is the
    self-destruct protocol: it blows itself apart and he is back to the Shikai.
  - Once per fight a killing blow does not kill him: **Nikushibuki**. He melts into a puddle, untouchable,
    seeps along the ground and reforms weakened.
- **Retsu Unohana**, captain of the 4th Division and the first Kenpachi: the thick braid hanging down her
  front, the long-sleeved haori with 四, a wide white obi, and Minazuki (a long nodachi with a red hilt) at her
  hip on a rope strap. As Retsu, LMB is an elegant nodachi string and RMB the long iai sweep. Her moves:
  - Q: **Kaidō**. Her reiatsu comes back first, then her wounds close, even on the move.
  - E: three **hidden daggers** flicked out of the sleeve.
  - R: Bakudō #62 **Hyapporankan**. A rod of light splits into many and pins the target where it stands.
  - F: **Minazuki**. The great one-eyed green manta rises under her feet and she rides it: fast, high
    (Space climbs, descend dives) and healing as she goes. From its back LMB fires Hadō #4 **Byakurai** and
    RMB #63 **Raikōhō**. F again lands.
  - G: she undoes the braid and becomes **Yachiru**, the first Kenpachi: faster and crueller. Her strings
    alternate between kendō and a flowing one-handed style ("eight thousand styles"). RMB flicks the weapon
    out of the enemy's hand (**disarmed**: no LMB or RMB until they get it back), Q is the throat thrust (far
    worse on a staggered or disarmed enemy), E a dagger from behind, R the back-of-the-hand guard that turns
    a blow and counters, and G an emergency Kaidō.
  - F (as Yachiru): **Bankai, Minazuki**. She draws her clenched hand along the blade, and blood pours from the
    sky until the ground is a pool that slows her enemies and mends her. Every cut throws a liquid slash; RMB
    is the bisecting cut, Q a volley, E the sphere of blades, R blades drawn up out of the pool, and G
    regeneration. F seals it. A killing blow in the Bankai empties the pool at once.
- **Shinji Hirako**, the leader of the Visored, in his Human World clothes: the blunt blond bob, the grin that
  bares every upper tooth, a white shirt with a loose dark tie, grey slacks, Sakanade resting on his shoulder
  and his other hand in his pocket. Sealed, LMB is a lazy one-handed string and RMB a two-handed draw-cut. His
  moves:
  - Q: **Tanma Otoshi**. He lays his palm over the target's face and it drops, asleep for a moment.
  - E: Hadō #91 **Senju Kōten Taihō**, chantless. Ten points of light rise round him, fly at the target in a
    converging barrage and end in one great blast.
  - R: a **force blast** flicked from his fingers. It knocks whatever they were doing aside.
  - G: the **Hollow mask**, a pharaoh's death mask with a long grin. He is faster and stronger, and E becomes
    his **Cero**: a bar of crimson before the sword hand, then a very wide fan.
  - F: **"Taorero, Sakanade."** The hilt becomes a ring and the sword spins round his finger. Every spin
    vents a pink mist, and the cuts put some of it in the enemy. Q is **Sakasama no Sekai**: whoever breathes
    in a full lungful has the world turned over (up and down, left and right, front and back). An AI goes for
    the mirror image behind it. The player's view rolls upside down and the aim assist is lost. RMB is the
    **counter stroke**, far worse on someone inverted, and R the **drop onto the nape**.
  - F (in Shikai): **Bankai, Sakashima Yokoshima Happōfusagari**. A golden flower bursts up and shuts round
    him, and its mist rolls out over the field. Everyone in it but him has friend and foe reversed: their
    blows only find their own side. With no one of its own to turn on, an AI wanders off, lost. He is rooted
    in the flower. LMB opens the petals on a cut, RMB is a ring thrust through them, Q pushes the mist
    further, R clamps the petals shut and F uproots him (the mist lingers a while).
- **Yhwach**, the Quincy King and emperor of the Wandenreich: the white double-breasted coat with the emblem,
  the tattered maroon cloak, the long black hair and mutton chops, a hand on his hip. LMB is a measured sword
  string that ends with him seizing a throat and driving it into the floor. His moves:
  - RMB: he slashes at the sky, a bow of light looses an arrow into the ground before him, and he pulls it
    out as the **broadsword** for one diagonal stroke that cuts through anything.
  - Q: **Heilig Pfeil** from his fingertip, each arrow bursting into a Quincy Zeichen.
  - E: **Sankt Bogen**, a great bow that forms in the sky and fires one huge arrow.
  - R: **Qual Kreis**. Lightning crackles round the target, then a ring of bows fires into it from every side.
  - G: **Blut Vene Anhaben**, a shell of veins that undoes shots and drains whoever touches it.
  - F: **The Almighty**. His eyes open (three pupils each) and every wound before is undone. He sees each
    blow coming and is behind the attacker before it lands. A technique that hits him twice no longer
    touches him, and his first death is rewritten. Q's arrows now lead perfectly. E **rewrites** the
    target's future: its weapon is broken (disarmed) and its power cut. R is a **future wound** that misses
    now and lands later, through any guard. G sets **shadow blades** where the target will be.
  - F again: **the Soul King**. The Black covers him and eyes open on it; his reiatsu turns crimson. He
    fights with the broadsword while tendrils lash out from his hits. RMB is a forest of spikes, Q the
    **eye beams**, E a swarm of one-eyed creatures, R the **Zeichen** of eye-pillars and its violet blast, G
    **Auswählen** (pillars of light drain everyone near and heal him), and F a crimson exertion that brings
    down what stands round him.
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
- **Nelliel Tu Odelschwanck**, the former Tres Espada, in the armband era: tall and very curvy, long wavy green
  hair, a ram's skull worn over her crown with its curled horns, the scar between her eyes and the crimson line
  across her face, in the green rags of the gown she outgrew. She fights with economy, cuts and kicks woven
  together: LMB is a forehand, a backhand, a kick to the neck and a spinning heel kick. Her moves:
  - RMB: the **precise cut**, a gliding lunge and one diagonal that goes through guards and Hierro.
  - Q: her pink **Cero**, from the mouth.
  - E: **Cero Doble**. Her left palm stops a reishi attack from in front of her (a Cero, a Getsuga, Kidō),
    she swallows it and fires it back fused with her own Cero. Blades and fists are not caught.
  - R: **Sonído**: gone, and beside the target with a cut.
  - G: the **armband**: a puff of smoke and she is **Nel Tu** (G again, or F, and she grows up).
  - F: **"Utae, Gamuza"**. She holds the sword level before her, it steams, she names it, and the burst throws
    everyone back.
- **Nel Tu**: a tiny child with a huge head, the cartoon skull perched on top of it (cracked, four teeth
  missing) and a green gown down to her bare feet. She is small enough that a lot passes over her, and takes
  more from what does not. LMB is flailing slaps, a headbutt and a whirl. Her moves:
  - RMB: **Nel Tamapunch**: a stun, and far worse for the men.
  - Q: her **Cero Doble**: she gulps an attack and spits it straight back harder, then she is spent for a while.
  - E: **Nel Shower**: a gag and a gush of green that heals her.
  - R: **Chōkasoku**: the mask's eyes light and she rockets in head first.
- **Nelliel, Gamuza**: a centaur — her torso on a chamois body with slim legs and cloven hooves, a black tail,
  longer horns framing her face, white spaulders and black-sheathed arms. She walks, trots and gallops, the
  fastest thing on four legs, with a double-ended lance. LMB is a thrust, the rear point swept round, the
  reverse thrust with the other end and a rearing strike of the front hooves. Her moves:
  - RMB: the **plunge**: she rears, comes down in a stomp that cracks the ground and drives the lance down.
  - Q: **Lanzador Verde**. She flips the lance, rears back and hurls it: it spins up in an emerald spiral and
    drills a straight tunnel through everything, through whoever it meets too. It re-forms in her hand.
  - E: Cero Doble.
  - R: **Galope**: a blue flash, and she is a few lengths off the target already charging, lance couched.
  - F: the release burst again. G: sealed, back to the woman.
- **Szayelaporro Granz**, the Octava Espada: tall and very slender, chin-length pink hair swept to his right, two
  shaved lines over his left ear and rectangular bone-framed glasses (his mask). His long white tunic is closed to
  the chin, with three black stripes running down from the collar, and his sword hangs at his thigh on two frilly
  purple cords. He fences one-handed with the other hand on his hip: the flèche, the back-of-wrist flick, the
  rising cut and the turning slash (LMB). His sealed moves:
  - RMB: **Rokureichū**: a needle thrust that plants a recording bug. Every technique the bugged enemy uses after
    that is recorded, and once he has seen one three times it is **analysed**: it does nothing to him any more.
  - Q: his **Fracción**, Lumina and Verona, two tiny fat twins who slap, belly-bump and get in the way of shots.
  - E: the **trap panel**: a ring glows round the target's feet and the floor drops away into a pit.
  - R: the **power-control device**: a pink scan dome. Bugged enemies inside it cannot release and hit weaker,
    and an analysed technique fizzles as it starts. His Sonído inside it leaves a hologram they keep attacking.
  - G: he **eats a Fracción**: it hurries over, he lifts it kicking over his mouth and swallows it whole for a
    third of his life.
  - F: **"Susure, Fornicarás"**: he lowers the blade point first into his mouth and swallows it, and his body
    swells like a balloon before the release (a full heal).
- **Szayelaporro, Fornicarás**: a grey segmented bodice, a long lilac skirt, white sleeves flaring from the elbow,
  purple fingertips, and four grey wing-branches hung with red drops. LMB lashes the branches out, further with each
  hit of the string (up to 8 m). His moves:
  - RMB: the **burrowing branch**: it dives into the ground and bursts out under the target, wrapping and lifting it.
  - Q: **Carbon-Copy**: a black fountain from his back rains over everything round him, and whoever it wets
    sprouts a dark **copy of itself** with its own moves, fighting on his side. A copy that falls splits into two
    smaller ones. Press Q again for the **finger snap**: every copy bursts.
  - E: **Teatro de Titere**: a wing swallows the nearest enemy and spits them out, and a strand swells and bursts
    into a **doll** of them in his hand. With the doll, his keys work it instead: LMB a flick (a cut on the
    temple), RMB the stomach, Q the Achilles tendon (they drop to their knees), R the arm tendon (their weapon
    falls), E the **Gran Final** (every piece crushed), G lets it go. A heavy blow makes him drop it, and Mayuri's
    organs are dummies.
  - R: **Telon Balon**: the wings close into a floating ball that barely takes damage.
  - F: **Gabriel**: a branch to the target's navel lays an egg. If he is killed while it lives, he climbs back out
    of them at half his life, draining them; out of Mayuri he wakes up drugged.
  - G: he eats a Fracción. Passives: Hierro; a heavy blow makes him furious (his hair!).
- **Yammy Llargo**, the Diez Espada: a 2.3 m wall of muscle with a bald, ridged scalp, black sideburns and a thin
  ponytail, orange brows, red marks under the eyes and the bone jaw of his mask on his chin, the jacket open on the
  hole in his chest and "10" on his left shoulder. His sword stays at his hip; he fights with his fists. LMB is a
  haymaker, a backhand, a double hammer fist and a shoulder check, each one cracking the ground. His sealed moves:
  - RMB: **Bala**, six red bullets off alternating fists.
  - Q: **Cero** from the mouth; a fissure tears open along the ground under it.
  - E: **Gonzui**, one huge breath. Everyone in front is dragged toward him, weak Hollows' souls are sucked out and
    swallowed, and it refills his reiatsu.
  - R: the **limb rip**: he grabs whoever is in front, holds them up by the arm and tears at it (big damage, their
    weapon arm useless for a while).
  - G: the **Hierro brace**: super armour while he holds it.
  - Passives: Hierro; left alone (no one has hurt him for ten seconds, he stands still) he dozes off on his feet,
    banking reiatsu and rage and eating himself a little bigger.
  - F: **"Buchikirero, Ira!"**: the reiatsu column, and he swells into the kaiju (a full heal).
- **Yammy, Ira**: an 11 m centaur, his torso grown colossal on a white four-legged trunk with elephant legs, a bony
  tail club, piston tubes on the elbows and the "1" melted off the tattoo. He tramples whatever he walks through
  (Shift is a charge that runs people down), and every blow he takes makes him angrier and **bigger** (the meter on
  F). LMB is giant punches, each followed by the elbow piston's second impact, then the tail club swept round.
  - RMB: giant **Bala**, four bullets the size of cars. Q: the giant **Cero**, swept across what is in front of him.
  - E: the **stomp quake**: rings of upheaval out to 12 m.
  - R: **Cero Oscuras**, black with a crimson rim. It charges for a second and a half in front of his mouth, and a
    strong shot into it then blows it up in his face.
  - G: the **reiatsu shield**, then (G again, or after three seconds) the shell blown outward.
  - F at a full meter (or by itself when it overflows): the **rage evolution**. An explosion of reiatsu and he is a
    15 m ape, knuckle-walking, horned and fully healed; LMB becomes knuckle slams and a belly flop, and he keeps
    growing. Poor Pesquisa: his skills fly where he faces, without lock-on help.
- **Ikkaku Madarame**, 3rd Seat of the 11th Division: tall and wiry, the gleaming bald head, red marks
  flicking out from the corners of his eyes, a cocky grin, the scar down his chest, bare feet in waraji and a gold
  plate stamped 龍 on his right shoulder. He fights with the sword in his right hand and the black sheath
  reversed in his left: LMB is a cut, the sheath hook (laid along his forearm), a thrust, and sword and sheath
  slammed down together. His sealed moves:
  - RMB: the **crossed press**, sword and sheath crossed and shoved through any guard, leaving the target off
    balance.
  - Q: the **hand swap**. The sword is tossed to his left hand for a cut from the side nobody was watching; it
    goes round parries and counter stances.
  - E: the **headbutt**.
  - R: the **styptic** in the hilt: the pommel unscrewed and the paste smeared on the wound (three a fight).
  - G: **Tsuki-Tsuki no Mai**, the lucky dance ("tsuiteru, tsuiteru, tsuitteru~"). For a while he hits harder
    and now and then a blow just misses him; struck while dancing, the luck is gone.
  - F: **"Nobiro, Hōzukimaru"**. The hilt slammed into the sheath's mouth: one spear.
- **Ikkaku, Hōzukimaru**: a wax-wood spear with a red horsehair tassel. LMB is a thrust, the tassel end jabbed
  back into the target, a sweep, and a turn on the spot into a thrust. His moves:
  - RMB: the **smash**, the spear brought down two-handed; the street cracks round it.
  - Q: **"Sakero"**. The thrust is met and the spear comes apart into the three-section staff: the head section
    on its chain folds over and round the guard. It cannot be parried. The pieces lock together again.
  - E: the **hurled segment**, the head section flung out on its chain; it knocks a man flying.
  - R: the styptic. G: the dance.
  - F: **"Bankai — Ryūmon Hōzukimaru"**. The pieces slammed together overhead in a tornado of red reiatsu.
- **Ikkaku, Ryūmon Hōzukimaru**: a guandao in his right hand, a monk's spade in his left, and between them, on
  heavy chains to their pommels, the great axe-like **centre blade** floating behind his back with a dragon crest
  engraved on its face. The Bankai starts out asleep: every blow he deals or takes turns more of the crest red,
  from the tail to the head, and the redder it is the harder he hits (spinning fills it fastest). LMB is
  the guandao, the spade, the guandao rising, and both crashed down in an X with the centre blade falling after
  them. His moves:
  - RMB: the **X crash**, a leap and both blades down, a crater under them. With a full crest it is the
    **Full-Crest Clash**: all three blades driven on through the target and everything in line behind it; then
    the overstrained blades chip and the crest burns low.
  - Q: the **Ryūmon spin**. He takes the centre handle in both hands and the whole rig becomes a pinwheel: the
    outer blades whirl round him on short chains, cutting everything within four metres and swatting shots
    away. Q again stops it.
  - E: the **chain throw**, the spade flung on its chain and yanked back.
  - R: the **centre-blade hurl**: the centre blade rolls out like a guillotine wheel, cutting a slot through
    whatever it meets, and is hauled back on the chains.
  - F: the **reiatsu explosion**. The centre blade raised, spun overhead and slammed into the ground: a red blast,
    a crater, and a screen of smoke.
  - G: **"Wake up, Hōzukimaru!"** He braces and dares the blow: taken, most of it feeds the crest, and he answers
    with the X at once.
- **Rangiku Matsumoto**, Lieutenant of the 10th Division: the long wavy strawberry-blond mane, blue eyes and a
  beauty mark, the kosode worn open, a pink stole draped over her arms, a gold chain and the badge on her sash,
  and Haineko's empty sheath across the back of her obi. In the Human World the daffodil limiter seal sits on
  her chest and holds her back until she releases it. LMB is a cut, a roundhouse kick, a backhand cut and a
  flying kick. A blow from behind while she lounges is answered with a back kick. Her sealed moves:
  - RMB: the **wide cut**.
  - Q: Hadō #31 **Shakkahō** from the left palm.
  - E: the **provoke**. A beckoning hand and a smile: the target is rattled and takes more from every blow for a
    while; in a crowd they turn on each other.
  - R: **play dead**. She drops in a pool of her own blood and takes half damage. Whoever walks up to her or hits
    her finds her behind them with the blade at their throat, then the cut (it cannot be parried).
  - G: **Gentei Kaijo**. The seal dissolves in a column of reiatsu and she is herself again. After that, G is
    Bakudō #77 **Tenteikūra**: the reiatsu net. For a while nothing on her side can be blinded or turned round,
    and every enemy is laid bare (takes more damage).
  - F: **"Unare, Haineko"**. The blade crumbles into ash and the cloud is flicked out round her.
- **Rangiku, Haineko**: only the hilt with its cat-head guard in her hand. The blade is a grey cloud of ash
  drifting round her, and her moves draw on it; energy blasts thin it and it grows back out of the hilt (the HUD
  shows how dense it is). She is only a hilt while the ash is out, so she takes more damage, and slows run off
  her twice as fast. LMB flicks the hilt: ribbons of ash crack out right and left and cut at mid range, the ash
  packs into a spear and is driven at the target, then erupts in a geyser under them. Her moves:
  - RMB: the **ash tide**, a dense wave seven metres wide that rolls out eighteen and sandblasts through walls
    slab by slab.
  - Q: the **ash veil**. The cloud pours over the target, and the ash settles on them and on the ground and walls
    round them.
  - E: the **flick-cut**. Every grain that settled cuts at once: the more ash on them, the deeper (it cannot be
    parried, and it needs no line of sight); the ground where it settled splits.
  - R: **Neko Rinbu**. Both hands circle and the cloud whirls into a tornado round the target. They are drawn to
    the eye and held while it cuts them and scours the ground and the walls round it, then it bursts outward. A
    big enough energy blast from inside blows it apart.
  - F: the **ash shield**, a dome of dense ash that swats shots away and takes energy blasts for her (they thin
    it). F again lowers it.
  - G: **"Hausu!"**. The ash splits into thin layers before her, a wall that stops shots, and then goes home: the
    blade grows back and she is sealed again.
- **Shūhei Hisagi**, Lieutenant of the 9th Division: short spiky black hair, three scars straight down over his
  right eye, "69" on his left cheek under a blue stripe, a black choker and black bands on both bare arms (the 9th
  Division's sleeveless kosode), the badge tied on his left arm. He would rather not release: a calm swordsman
  with a cut, a left elbow, the rising cut that launches and a heel drop (LMB). His sealed moves:
  - RMB: the **draw-cut**, a lunging iai.
  - Q: Bakudō #62 **Hyapporankan**: a rod of light that splits over the target into a rain of rods and pins them.
  - E: an **explosive band** torn off and thrown: a white flash and a pall of smoke that blinds. He has three
    (the choker and both armbands), and each one he uses is gone from him.
  - R: Hadō #11 **Tsuzuri Raiden**: the blade crackles for a while and every cut paralyses.
  - G: Bakudō #63 **Sajō Sabaku**: a yellow rope binds the target's upper body (no attacks).
  - F: **"Kare, Kazeshini"**: the sword splits into the two sickles.
- **Hisagi, Kazeshini**: a sickle in each fist, each two curved blades pointing opposite ways like a pinwheel, one
  chain between them. LMB throws the right sickle and hauls it back, then the left, swings the chain wide, and
  yanks the far sickle round so it comes at the target from behind. Fear builds as he takes blows and sharpens
  Kazeshini. His moves:
  - RMB: the **fan spin**, both sickles whirling round him at full chain length, cutting all round and swatting
    shots out of the air.
  - Q: the **steered throw**: out wide, round behind them and in, from where they were not looking (it goes
    round guards).
  - E: **Kubikake**: the chain round the neck, hauled in and slammed into the ground.
  - R: the **chain bind**: the chain wraps them (rooted and disarmed, two blows on him shake it off) and Tsuzuri
    Raiden runs down it.
  - G: **chain-life** (from the novels): while it holds, wounds are re-linked and paid in reiatsu.
  - F: **"Bankai — Fushi no Kōjō"** (from the novels).
- **Hisagi, Fushi no Kōjō**: an orb of tangled black chains floats over him, a noose from his own neck running up
  into it. Near it reishi stagnates: enemies' reiatsu does not come back. LMB is the Kazeshini string. His moves:
  - RMB: **chain rain** from the orb.
  - Q: the **noose link**: a chain drops over the target's neck. While linked neither of them loses HP; every
    wound is paid twice over from both their reiatsu, and when the pool runs dry the link snaps.
  - E: the orb's **tethers** seize the target and drag them in.
  - R: **Hangman's Verdict**: once the pool is nearly dry, he cuts his own noose (it costs most of his HP) and
    brings the blow down. It cannot be parried.
  - G: an explosive band. F: unlinks and seals back to the Shikai.
- **Izuru Kira**, Lieutenant of the 3rd Division: slender and a little stooped, pale-blond hair with a long bang
  over his left eye, shadows under his eyes, the badge (三 and a marigold) tied on his left sleeve. A gloomy,
  Kidō-rich swordsman: the thrust, a diagonal cut, the rising cut that launches and a flat cut (LMB). His sealed
  moves:
  - RMB: Bakudō #39 **Enkōsen**, a spinning yellow disc before his palm that turns blows and shots from the front
    (two blows, or one heavy, break it). In the air: Hadō #31 **Shakkahō**.
  - Q: Hadō #58 **Tenran**: the sword spun like a fan, then a widening tornado that pushes, lifts and tears up the
    street.
  - E: Bakudō #63 **Sajō Sabaku**. On a bound or stunned target within reach: **Gaten**, one drop on the neck and
    they sleep.
  - R: Bakudō #73 **Tōzanshō**: an inverted pyramid of light. At range it cages the target (rooted, its shots
    stay inside); up close it closes round him and nothing gets in.
  - G: **Kaidō**: he heals while he holds still (faster inside Tōzanshō). A blow ends it.
  - F: **"Omote o agero, Wabisuke"**: the blade goes straight and its end folds into a square hook.
  - Passive: Bakudō #37 **Tsuriboshi**, a net of light that catches him when he is knocked flying.
- **Kira, Wabisuke**: every cut that lands doubles the weight of what it cut: the body, or the weapon if they were
  swinging or parried it. Tags float up (×2, ×4 … ×1024) and indigo rings slide down whatever is heavy. The body
  slows, from ×8 it cannot jump, at ×64 it kneels with its head bowed, at ×256 it is pinned and the ground gives
  way under it; a weapon at ×128 falls from the hand. Skin that shrugs a blow off gains nothing, a weapon that is
  not a blade cannot be weighted, and sealing (or his death) makes all of it vanish. His moves:
  - LMB: the hook thrust, the backhand cut, the rising hook and the downward chop. The shots his swinging blade
    touches drop short.
  - RMB: the **hook pull**: the hook catches the neck and drags them down in front of him.
  - Q: on a kneeling target, the **reverse guillotine** ("Omote o agero"); on a pinned one, **Penance**: ten
    strikes first. Otherwise the **weighted parry**: the first blow is turned, the attacker's weapon doubles
    twice and the counter cut follows.
  - E: **Heavy Step**: his own foot doubled seven times, a crater stomp that doubles everyone in it. In the air,
    the meteor drop (a fighter right under his foot is crushed).
  - R: **Debris Rain** (from the novels): Tenran tears chunks of street up, he strikes each until it weighs ×16,
    and they fall on the target.
  - G: Kaidō. F: seals Wabisuke.
- **Yumichika Ayasegawa**, 5th Seat of the 11th Division: a jaw-length black bob, yellow and orange feathers at his
  right eye, purple eyes, an orange collar and undersleeve under the shihakushō, a fuchsia sheath. A vain, elegant
  duelist: the lunge, a slash, the rising flourish and the pirouette (LMB). His sealed moves:
  - RMB: **Beautiful Swordfight**, a flurry of eight clashing cuts.
  - Q: Hadō #57 **Daichi Ten'yō**: chunks of ground lifted round him (they stop shots) and hurled at the target.
  - E: Hadō #31 **Shakkahō**. R: Bakudō #4 **Hainawa**, a rope of light (slowed and disarmed).
  - G: the **hair fix**: a breath to put himself right (a little HP; slows, blindness and the like shaken off).
  - F: **"Sake, Fuji Kujaku"**: the blade curves into a sickle and fans into four like a peacock's tail.
- **Yumichika, Fuji Kujaku**: the false Shikai, sulking and barely stronger than the sword. LMB hooks and sweeps
  with the fan; RMB the **fan spin**; Q Daichi Ten'yō; E the **blade catch** (a blow caught between the sickles, the
  attacker disarmed, the riposte); R Beautiful Swordfight; G the hair fix. F: **"Sakikurue, Ruri'iro Kujaku"**, the
  true Shikai, which he refuses to show while anyone of the 11th Division (Ikkaku, Kenpachi) is within 40 m.
- **Yumichika, Ruri'iro Kujaku**: peacock vines pour from the hilt. LMB lashes a vine out to 5 m; RMB a **burst** of
  seven. Q **ensnares** the target: the vines coil round it, root it and drink its reiatsu and blood (faster while it
  struggles), buds swelling along them in its own colour. E **blooms** them: the stolen power turned on it (the
  fuller the buds, the worse). R eats a **petal** from the flowers and heals by what it held. G spreads a **thicket**
  over the ground that snags and drains whoever walks in. F seals. Two blows from the wrapped target tear it free.
- **Momo Hinamori**, Lieutenant of the 5th Division: petite, with big round brown eyes, her dark hair in a bun
  wrapped in an off-white cloth and two long locks framing her face, the badge (五 and a lily) on her left arm and
  Tobiume long at her hip. The Kidō trap-layer, fragile up close: the thrust, two cuts and the rising cut (LMB). All
  her Kidō is instant. Her sealed moves:
  - RMB: Hadō #31 **Shakkahō**, quick to repeat.
  - Q: Hadō #12 **Fushibi**: a web of fine threads strung round the target's ground (or round her), nearly invisible
    to anyone but her. A thread snares whoever walks into it, and any of her fire bursting by it sets the whole web
    off, strand after strand outward from the spark. Two webs at most.
  - E: Bakudō #37 **Tsuriboshi** as a launch pad: the star net under her feet and a fireball beneath it. She is
    flung high and the blast hits round where she stood.
  - R: Bakudō #26 **Kyokkō**: the light bends round her and she fades out. Whoever fights her keeps attacking where
    she was (their lock-on too), her Shunpo leaves no afterimage and her first blow out of hiding hits harder.
  - G: **Hakufuku**: purple blossoms in the face. The senses blur, then the target falls asleep where it stands
    (a blow wakes it).
  - F: **"Hajike, Tobiume"**: the blade straightens and three jutte prongs spring out of it.
  - Passive: Tsuriboshi catches her when she is knocked flying. If one she loves falls at her side (Aizen,
    Hitsugaya, Shinji), grief takes her: she hits harder and stops guarding.
- **Momo, Tobiume**: fireballs with a seagull's cry. LMB is the same string, the last cut flicking a fireball off the
  prongs; RMB the **fireball** (aimed at the head); Q Fushibi; E the **volley**, five fireballs fanned (with a second
  enemy near, two of them go for it); R the **ignition**, a fireball to every web she has laid; G **Kaidō**. F seals.
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
- `/?mode=model[&char=ichigo|hollow|menos|grimmjow|byakuya|renji|rukia|chad|uryu|yoruichi|urahara|yamamoto|gin|suifeng|kyoraku|kenpachi|ulquiorra|starrk|lilynette|ukitake|harribel|nnoitra|baraggan|komamura|tosen|orihime|mayuri|unohana|shinji|yhwach|hitsugaya|aizen][&form=bankai|shikai|pantera|murcielago|segunda|traitor|chrysalis|gigante|true|letzt|shunko|raijin|stripped|tybw|hollow|haori|shed|glove|lobos|unzipped|tiburon|patch|santa|arrogante|giant|limbs|masked|grillo|rokuten|yachiru|flower|almighty|soulking][&fairies=1][&fan=1][&eyes=open][&drawn=1|0][&colmillo=1][&mask=1|cracked][&glasses=0][&aura=1][&open=0..1][&broad=1]`: model and animation viewer
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
