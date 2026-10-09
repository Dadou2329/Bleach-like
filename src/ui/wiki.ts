// The start screen's "Special characters wiki": a page per original character (outside the manga) explaining the
// Zanpakutō, every release and form, every power and the keys for them. Data first (SPECIAL_WIKI), then the overlay.

export interface WikiMove {
  key: string;
  name: string;
  kanji?: string;
  /** the name's meaning */
  means?: string;
  text: string;
}

export interface WikiForm {
  name: string;
  kanji: string;
  /** the release command and its meaning */
  command?: string;
  means?: string;
  look: string;
  /** what the form changes (numbers) */
  stats: string[];
  moves: WikiMove[];
}

export interface WikiEntry {
  id: string;
  name: string;
  kanji: string;
  title: string;
  color: string;
  dedication: string;
  lore: string[];
  profile: [string, string][];
  zanpakuto: { name: string; kanji: string; means: string; text: string[] };
  forms: WikiForm[];
  passives: WikiMove[];
  numbers: { label: string; values: string[] }[];
  tips: string[];
}

export const SPECIAL_WIKI: WikiEntry[] = [
  {
    id: 'natacha',
    name: 'Natacha',
    kanji: '明星',
    title: 'Hoshiyomi — the Star Reader of the Royal Guard',
    color: '#ffd27a',
    dedication: 'Natacha is a special character: an original, added to Bleach : Reishi as a tribute to someone very important to its author. Her look comes from her — the copper hair, the freckles, the warm smile — and her powers were written for her. She is the strongest fighter in the game, on purpose.',
    lore: [
      'Natacha is the Hoshiyomi, the Star Reader, of the Royal Guard. In the Soul King\'s palace they say her freckles are stars that fell on her face the night her Zanpakutō first spoke to her — and when Myōjō shines, they shine with it.',
      'She fights smiling. She reads her opponent\'s next move in the sky before they make it, answers every blow from behind, and when she calls her Bankai the day itself gives way to her night: meteors fall, the constellations come down to fight beside her, and the Milky Way pours out of her blade.',
      'Past the Bankai lies Myōjō Kōrin, the descent of the morning star: she becomes the last star before sunrise, and her final technique is the dawn itself.',
    ],
    profile: [
      ['Race', 'Shinigami'],
      ['Affiliation', 'Royal Guard (Squad Zero)'],
      ['Title', 'Hoshiyomi 星読み — the Star Reader'],
      ['Height', '165 cm'],
      ['Hair', 'copper auburn, a low twisted bun with a gold star pin (worn down in the Bankai)'],
      ['Eyes', 'dark brown (gold in her final form)'],
      ['Marks', 'freckles across the nose and the cheeks — they glow gold once Myōjō is released'],
      ['Jewellery', 'a thin gold necklace with three small stones: her three seals'],
      ['Outfit', 'black shihakushō, a white long-sleeved haori with a navy night-sky hem sown with gold stars, an eight-pointed star in a rhombus on the back, a navy obi with a gold cord'],
    ],
    zanpakuto: {
      name: 'Myōjō',
      kanji: '明星',
      means: '"the Morning Star" — Venus, the brightest star, the one still shining at dawn',
      text: [
        'Sealed, Myōjō is an elegant katana with a gold eight-pointed star for a guard, a wine-red hilt wrapped over pale ray skin, and a navy lacquered sheath sown with gold flecks.',
        'Its power is the sky. Released, it reads the stars and calls them down: it marks enemies with stars and joins them into constellations that cut, rains stars and meteors, throws its own light as a beam — and in the Bankai it brings the whole night down over the battlefield.',
      ],
    },
    forms: [
      {
        name: 'Sealed — Myōjō',
        kanji: '封印',
        look: 'The katana with the star guard; the sheath at her left hip. The necklace\'s three stones are dark.',
        stats: ['Power ×1.6', 'Damage taken ×0.8', 'Shunpo 26 m'],
        moves: [
          { key: 'LMB', name: 'Iai string', kanji: '居合', text: 'Five cuts: a thrust, two diagonal cuts, a turning level cut and a rising cut that launches.' },
          { key: 'RMB', name: 'Ryūsei', kanji: '流星', means: 'Shooting Star', text: 'An iai flash up to 26 m straight through the target. Everyone on the line is cut (it cannot be blocked) and everything on it — walls, whole buildings — is cut level at her waist.' },
          { key: 'Q', name: 'Hoshi-tsubute', kanji: '星礫', means: 'Star Pebbles', text: 'Five stars from her left palm. They hang a moment, then home in and burst.' },
          { key: 'E', name: 'Tenmaku', kanji: '天幕', means: 'Sky Curtain', text: 'A dome of starlight for about 3 seconds: no damage gets in, enemy shots that touch it are undone, enemies inside are thrown out.' },
          { key: 'R', name: 'Hoshiyomi', kanji: '星読み', means: 'Star Reading', text: 'For 6 seconds she reads every blow before it lands: instead of taking it she appears behind the attacker and cuts them.' },
          { key: 'G', name: 'Bakudō #61 — Rikujōkōrō', kanji: '六杖光牢', text: 'Six rods of light pin the target in place for 3 seconds.' },
          { key: 'F', name: 'Kagayake, Myōjō', kanji: '輝け', text: 'Releases the Shikai.' },
        ],
      },
      {
        name: 'Shikai — Myōjō',
        kanji: '始解',
        command: 'Kagayake, Myōjō — 輝け「明星」',
        means: 'Shine, Morning Star',
        look: 'The blade straightens into pale gold steel with a glowing fuller; the guard becomes a larger star inside a ring. Her freckles glint gold. The first stone of the necklace lights.',
        stats: ['Power ×2.4', 'Damage taken ×0.65', 'Reiatsu +2/s'],
        moves: [
          { key: 'LMB', name: 'Star Marks', kanji: '星印', text: 'The same five cuts; every cut that lands sets a Star Mark on the enemy (up to 7 each — small stars circling them). The fifth cut throws a gold crescent.' },
          { key: 'RMB', name: 'Seiza-giri', kanji: '星座斬り', means: 'Constellation Cut', text: 'The marks are joined into a constellation: lines of light run from the blade\'s point through every marked enemy, each mark bursts (60 per mark, unblockable) and the lines cut whatever stands between them. Without marks it throws a gold crescent.' },
          { key: 'Q', name: 'Hoshi no Ame', kanji: '星の雨', means: 'Star Rain', text: 'Twenty-four stars rain down on a 6 m circle around the target; a third of them home in on the target itself.' },
          { key: 'E', name: 'Myōjō-kō', kanji: '明星光', means: 'Light of the Morning Star', text: 'A gold beam from the blade\'s point that bores straight through 90 m of anything.' },
          { key: 'R', name: 'Hoshi-utsuri', kanji: '星移り', means: 'Star Shift', text: 'She is suddenly behind the target — or behind the marked enemy furthest away — and cuts (unblockable), leaving a new mark.' },
          { key: 'G', name: 'Kasei', kanji: '禍星', means: 'Calamity Star', text: 'A star forms over the target and swells, dragging everyone within 18 m into it, then explodes.' },
          { key: 'F', name: 'Bankai', kanji: '卍解', text: 'Releases the Bankai.' },
        ],
      },
      {
        name: 'Bankai — Ginga Myōjō: Hoshifuru Yoru',
        kanji: '銀河明星・星降る夜',
        command: 'Bankai — 卍解「銀河明星・星降る夜」',
        means: 'Galaxy Morning Star: the Night the Stars Fall',
        look: 'Night falls over the whole map: a sky full of stars, the Milky Way across it, shooting stars, and the morning star burning low on the horizon. Her haori turns into a midnight mantle sown with glowing stars, her hair falls loose in long copper waves, and the blade becomes a length of the night sky with a gold edge. Two stones light.',
        stats: ['Power ×3.4', 'Damage taken ×0.5', 'Healed to full on release', 'Regenerates 1.5 % HP and 8 reiatsu per second', 'Knockback ×0.4'],
        moves: [
          { key: 'LMB', name: 'Star crescents', kanji: '銀河', text: 'Every cut of the long star blade throws a thin crescent of starlight.' },
          { key: 'RMB', name: 'Ryūseigun', kanji: '流星群', means: 'Meteor Shower', text: 'Twelve stars fall out of the night on the target\'s area, half of them following the target down, each one leaving a crater.' },
          { key: 'Q', name: 'Seiza Shōkan', kanji: '星座召喚', means: 'Constellation Summoning', text: 'A giant constellation is drawn up in the sky behind the target; each press calls the next one. Orion swings a sword of light down through the target and splits the city behind it in two. Sagittarius looses nine arrows of light. Scorpius\' stinger dives in and paralyses.' },
          { key: 'E', name: 'Amanogawa', kanji: '天の川', means: 'River of Heaven (the Milky Way)', text: 'The Milky Way poured out of the blade: a wide beam full of stars, 120 m long.' },
          { key: 'R', name: 'Kuro-boshi', kanji: '黒星', means: 'Black Star', text: 'A collapsing star over the target: it drags everyone in, drains whoever touches it, swallows enemy shots and the ground around it, then bursts.' },
          { key: 'G', name: 'Hoshiyomi: Tenmon', kanji: '星読み・天文', means: 'Star Reading: Astronomy', text: 'Eight seconds of foresight; every counter strikes three times as hard.' },
          { key: 'F', name: 'Myōjō Kōrin', kanji: '明星降臨', text: 'Releases her final form.' },
        ],
      },
      {
        name: 'Final form — Myōjō Kōrin',
        kanji: '明星降臨',
        command: 'Kōrin — 降臨「明けの明星」',
        means: 'Descent of the Morning Star',
        look: 'A pillar of light pours down on her and she rises into it. The night turns to the hour before dawn. Her hair becomes copper-gold light, her eyes turn gold, her robe white and gold, an eight-pointed halo of light hangs behind her head, and the blade is pure light. All three stones are lit.',
        stats: ['Power ×5', 'Damage taken ×0.2 (and less again from reiatsu attacks)', 'Healed to full on release', 'Regenerates 3 % HP and 20 reiatsu per second', 'Flies: Space climbs, Ctrl sinks', 'Never knocked back; immune to every status (slows, seals, binds, time fields, blindness, poisons, weights…)'],
        moves: [
          { key: 'LMB', name: 'Light', kanji: '光', text: 'Six cuts of light, each throwing a large crescent of dawn light 40 m ahead.' },
          { key: 'RMB', name: 'Chōshinsei', kanji: '超新星', means: 'Supernova', text: 'A star pressed small between her hands and detonated on the target: a 9 m blast that cannot be blocked.' },
          { key: 'Q', name: 'Seigun Ranbu', kanji: '星群乱舞', means: 'Wild Dance of the Star Cluster', text: 'She becomes eight stars that cut the target from eight sides in under a second; nothing can touch her meanwhile.' },
          { key: 'E', name: 'Ginga Ryūsei-hō', kanji: '銀河流星砲', means: 'Galaxy Meteor Cannon', text: 'A vast spiralling beam of stars, 150 m long.' },
          { key: 'R', name: 'Hoshi no Toki', kanji: '星の刻', means: 'The Hour of the Stars', text: 'Time stops for every enemy for 5 seconds.' },
          { key: 'G', name: 'Akatsuki', kanji: '暁', means: 'Daybreak', text: 'The dawn breaks: a wall of light 140 m wide sweeps 170 m across everything ahead, unblockable, and the night lifts.' },
          { key: 'F', name: 'Seal', kanji: '封', text: 'Seals everything: back to the sealed katana, and the sky returns.' },
        ],
      },
    ],
    passives: [
      { key: '—', name: 'Myōjō no Kago', kanji: '明星の加護', means: 'The Morning Star\'s Protection', text: 'The first time she would die, the morning star rises behind her: she comes back at 60 % HP with a burst of light that throws everyone around her back.' },
      { key: '—', name: 'Mitsuboshi', kanji: '三つ星', means: 'Three Stars', text: 'The three stones of her necklace are her three seals: one lights with each release.' },
      { key: 'V', name: 'Reiatsu flare', kanji: '霊圧', text: 'Her reiatsu flares gold: +25 % power while it burns.' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', text: 'Flash steps that grow longer with each form (26 → 28 → 34 → 40 m).' },
    ],
    numbers: [
      { label: 'Form', values: ['Sealed', 'Shikai', 'Bankai', 'Final'] },
      { label: 'Power', values: ['×1.6', '×2.4', '×3.4', '×5'] },
      { label: 'Damage taken', values: ['×0.8', '×0.65', '×0.5', '×0.2'] },
      { label: 'Regeneration', values: ['—', '2 rei/s', '1.5 % HP + 8 rei /s', '3 % HP + 20 rei /s'] },
      { label: 'Health · reiatsu', values: ['2600 · 400', '2600 · 400', '2600 · 400', '2600 · 400'] },
    ],
    tips: [
      'In the Shikai, land three or four cuts before Seiza-giri: every mark is another burst.',
      'Hoshiyomi turns an opponent\'s rush against them — read the sky, then let them come.',
      'In the Bankai, Kuro-boshi holds a crowd in place for Ryūseigun; Orion\'s sword is the one that cuts a building in half.',
      'In the final form, Hoshi no Toki → Seigun Ranbu → Chōshinsei ends almost any fight; Akatsuki ends the rest.',
      'Sandbox mode lets you try everything without limits.',
    ],
  },
  {
    id: 'even',
    name: 'Even',
    kanji: '明鏡',
    title: 'Daikidōchō — the Grand Kidō Chief',
    color: '#b9a8ff',
    dedication: 'Even is a special character: an original, added to Bleach : Reishi as a tribute to someone very important to its author. His look comes from him — the swept-up dark hair, the round clear glasses, the big grin, even the violet cord on his wrist — and his powers were written for him. Like Natacha, he is far stronger than anyone from the manga, on purpose.',
    lore: [
      'Even is the Daikidōchō, the Grand Kidō Chief of the Kidō Corps — the youngest ever to hold the post. He casts Hadō in the nineties without a word of the incantation, often while he is still talking, then pushes his glasses up his nose and grins. In the Corps they say nothing gets past his eyes: he has read a technique before it is finished, and answered it before it lands.',
      'His Zanpakutō is a mirror. Whatever it sees clearly, it can reflect, bend, focus — and judge. Sealed, he fights as the Kidō master he is. Released, light itself obeys him: a lens that makes a cut a hundred times larger, a prism that splits a beam into seven, a mirror that sends every blow back where it came from.',
      'His Bankai brings out his inner world — an endless salt flat under a layer of perfectly still water — and lays it over the battlefield. In that mirror everything has a reflection, and every reflection belongs to him. Past the Bankai, when he finally opens his eyes, he becomes light that reaches everything at once.',
    ],
    profile: [
      ['Race', 'Shinigami'],
      ['Affiliation', 'Kidō Corps (Kidōshū)'],
      ['Title', 'Daikidōchō 大鬼道長 — the Grand Kidō Chief'],
      ['Height', '181 cm'],
      ['Hair', 'dark brown, almost black, swept up and back into a soft quiff, parted on his left, short at the sides (violet light runs through it in his final form)'],
      ['Eyes', 'dark brown, behind round clear glasses (glowing violet in his final form, when the frames turn to light)'],
      ['Smile', 'a big, open grin — he keeps it in the middle of a fight'],
      ['Habit', 'pushes his glasses up with one finger before he gets serious — the lenses flash'],
      ['Outfit', 'black shihakushō, a violet obi, the sleeveless cream haori of the Grand Kidō Chief with a violet hem of cream diamonds and a lens crest on the back; a thin violet cord on his left wrist'],
    ],
    zanpakuto: {
      name: 'Meikyō',
      kanji: '明鏡',
      means: '"Clear Mirror" — a mirror so perfectly polished that it shows things exactly as they are. The Bankai completes the old saying 明鏡止水, meikyō shisui: "a clear mirror and still water", a mind so calm it reflects the world without distortion.',
      text: [
        'Sealed, Meikyō is a katana with a round black guard like a camera\'s lens — a black ring round a disc of glass, a fine silver ring engraved in it — a violet hilt wrap, and a violet-black sheath tied with the same violet cord he wears on his wrist.',
        'Its spirit is a tall figure of clear glass whose face is a mirror: whoever looks into it sees themselves exactly as they are. Its power is light: it reflects, bends and focuses anything made of light or reiatsu, sees through every illusion, and in the Bankai turns the ground into the still mirror of his inner world.',
      ],
    },
    forms: [
      {
        name: 'Sealed — Meikyō',
        kanji: '封印',
        look: 'The katana with the round black lens guard, the sheath at his left hip, the left hand resting on his hip.',
        stats: ['Power ×1.6', 'Damage taken ×0.8', 'Shunpo 26 m', 'Every Kidō chantless'],
        moves: [
          { key: 'LMB', name: 'Seigan', kanji: '正眼', means: 'the middle guard (the point at the eyes)', text: 'Five clean cuts: a thrust, two diagonal cuts, a turning level cut and a rising cut that launches.' },
          { key: 'RMB', name: 'Hadō #4 — Byakurai: Sanren', kanji: '白雷・三連', means: 'White Lightning, three in a row', text: 'Three bolts of white lightning from his fingertip, one after another; each one pierces everything on a 95 m line.' },
          { key: 'Q', name: 'Hadō #73 — Sōren Sōkatsui', kanji: '双蓮蒼火墜', means: 'Twin Lotus Blue Fire Crash', text: 'Blue fire blasted from his left palm and from the blade\'s point together: two cones 15 m long that blow walls apart.' },
          { key: 'E', name: 'Bakudō #81 — Dankū', kanji: '断空', means: 'Splitting Void', text: 'A wall of light before him for 3 seconds: every blow and every shot from the front stops on it.' },
          { key: 'R', name: 'Bakudō #79 — Kuyō Shibari', kanji: '九曜縛', means: 'Nine Lights Bind', text: 'Nine black seals close round the target and hold it completely still for 3 seconds.' },
          { key: 'G', name: 'Hadō #90 — Kurohitsugi', kanji: '黒棺', means: 'Black Coffin', text: 'The Black Coffin, chantless and at full power: slabs of black gravity lock round the target, stakes punch through it, and the coffin breaks apart.' },
          { key: 'F', name: 'Utsuse, Meikyō', kanji: '映せ', text: 'He pushes his glasses up — they flash — and releases the Shikai.' },
        ],
      },
      {
        name: 'Shikai — Meikyō',
        kanji: '始解',
        command: 'Utsuse, Meikyō — 映せ「明鏡」',
        means: 'Reflect, Clear Mirror',
        look: 'The blade turns into a straight, double-edged blade of clear crystal that splits the light into colours inside it; the guard becomes a silver mirror ring round the lens.',
        stats: ['Power ×2.5', 'Damage taken ×0.6', 'Reiatsu +3/s', 'Shunpo 28 m'],
        moves: [
          { key: 'LMB', name: 'Hari-giri', kanji: '玻璃斬り', means: 'Crystal Cuts', text: 'The same five cuts; each one throws a thin crescent of split light (14 m), the last a wide one (28 m).' },
          { key: 'RMB', name: 'Kakudai', kanji: '拡大', means: 'Magnification', text: 'A great lens of glass forms in front of him and he cuts through it: the cut comes out a hundred times larger — a level slash 42 m long and 8 m wide through everything ahead. It cannot be blocked.' },
          { key: 'Q', name: 'Bunkō', kanji: '分光', means: 'Spectrum (splitting the light)', text: 'A prism of glass appears; a beam goes in and comes out as seven rays, red to violet, each boring straight through everything for 80 m. Red burns, orange explodes, yellow paralyses, green heals him, blue slows, indigo blinds, violet seals the target\'s power.' },
          { key: 'E', name: 'Hansha', kanji: '反射', means: 'Reflection', text: 'A tall hexagonal mirror stands before him for 2.5 seconds. Shots and beams that reach it are undone and fired back as light; blows from the front glance off it and come back on the attacker one and a half times as hard.' },
          { key: 'R', name: 'Shōten', kanji: '焦点', means: 'Focal Point', text: 'A lens forms in the sky over the target and focuses the sun into a white-hot point that follows it for 3 seconds — burning it, and melting a glowing trench in the ground behind it.' },
          { key: 'G', name: 'Senkō', kanji: '閃光', means: 'Flash', text: 'The mirror blade catches the sun: everyone looking at him is blinded for 4 seconds and stunned, and decoys, illusions and veils burn away. He grins when he does it.' },
          { key: 'F', name: 'Bankai', kanji: '卍解', text: 'Releases the Bankai.' },
        ],
      },
      {
        name: 'Bankai — Meikyō Shisui',
        kanji: '明鏡止水',
        command: 'Bankai — 卍解「明鏡止水」',
        means: 'Clear Mirror, Still Water',
        look: 'He drives the blade point-down into the ground and the still water of his inner world spreads from it: a perfect mirror 60 m wide that follows him, reflecting the city, the sky and every fighter in it. The sky clears. His haori becomes a long white coat with sleeves, lined with mirror silver; the blade becomes a long faceted crystal with a core of light.',
        stats: ['Power ×3.6', 'Damage taken ×0.45', 'Healed to full on release', 'Regenerates 1.5 % HP and 8 reiatsu per second', 'Enemies standing in the mirror are stilled (30 % slower, actions too)', 'Knockback ×0.4'],
        moves: [
          { key: 'LMB', name: 'Kyōei', kanji: '鏡影', means: 'Mirror Shadow', text: 'Every cut of the long crystal blade is repeated a moment later by his reflection, which rises on the far side of the target and cuts it from behind.' },
          { key: 'RMB', name: 'Mizukagami-tsuki', kanji: '水鏡突き', means: 'Water-Mirror Thrust', text: 'He stabs the water at his feet — and a spike of crystal bursts out of the target\'s reflection right under it, launching it. It cannot be blocked.' },
          { key: 'Q', name: 'Kyōzō', kanji: '鏡像', means: 'Mirror Images', text: 'Three reflections of him climb out of the water as glass copies with his Shikai — crystal cuts, small lens cuts and prism rays — and fight beside him for 12 seconds, then shatter.' },
          { key: 'E', name: 'Kagami-watari', kanji: '鏡渡り', means: 'Crossing the Mirror', text: 'He sinks into the mirror, bursts out under the target with a rising cut that throws it high, then appears above it and drives it back down into the water. Unblockable, and nothing can touch him meanwhile.' },
          { key: 'R', name: 'Senkyō Kōrō', kanji: '千鏡光牢', means: 'Thousand-Mirror Prison of Light', text: 'Mirrors fly in and close into a sphere round the target; a ray of light fired inside bounces from mirror to mirror and strikes it thirty times, then the sphere shatters outward.' },
          { key: 'G', name: 'Kyōha', kanji: '鏡波', means: 'Mirror Wave', text: 'The still water rises into a great wave of mirror-glass 36 m wide and runs 90 m forward, smashing whatever it meets and throwing everyone on; where it breaks, the ground stays flooded.' },
          { key: 'F', name: 'Kaigen', kanji: '開眼', text: 'Releases his final form.' },
        ],
      },
      {
        name: 'Final form — Kōmyō Henjō',
        kanji: '光明遍照',
        command: 'Kaigen — 開眼「光明遍照」',
        means: 'Open the Eye: Light Shining on Everything',
        look: 'He covers his glasses with his hand, then opens his arms and rises above the mirror in a pillar of light. His robe turns white and silver with violet light in its trim, violet light runs through his hair, his eyes glow violet, the frames of his glasses turn to light, and an aureole of twelve mirror shards opens behind him. The blade is pure light.',
        stats: ['Power ×5.5', 'Damage taken ×0.15', 'Half of every blow returns to whoever struck it', 'Healed to full on release', 'Regenerates 3 % HP and 20 reiatsu per second', 'Flies: Space climbs, Ctrl sinks', 'Never knocked back; immune to every status'],
        moves: [
          { key: 'LMB', name: 'Kōjin', kanji: '光刃', means: 'Blades of Light', text: 'Before every cut he moves at the speed of light to a new side of the target; each cut throws a large crescent of light 42 m ahead.' },
          { key: 'RMB', name: 'Issen', kanji: '一閃', means: 'A Single Flash', text: 'One level cut at the speed of light across the whole field: 160 m wide and 160 m deep, at the target\'s height. Every building in it is cut through. It cannot be blocked.' },
          { key: 'Q', name: 'Hyakkakyō', kanji: '百花鏡', means: 'the Kaleidoscope (a "hundred-flower mirror")', text: 'The target is shut inside a turning kaleidoscope for 3 seconds — blind, its steps scrambled — while it is cut eighteen times from six mirrored angles.' },
          { key: 'E', name: 'Tenkyō Shōten', kanji: '天鏡焦点', means: 'the Heaven-Mirror\'s Focus', text: 'A vast mirror opens in the sky and turns the sun on the target: a column of light 5 m wide that follows it, pins it down and bores a molten shaft into the ground while the sky turns white.' },
          { key: 'R', name: 'Kyōzō Hangyaku', kanji: '鏡像反逆', means: 'the Reflection Rebels', text: 'The target\'s own reflection steps out of the mirror — a full copy of it, with all its powers — and fights it on his side for 15 seconds.' },
          { key: 'G', name: 'Jōhari no Kagami', kanji: '浄玻璃鏡', means: 'the Crystal Mirror of Judgment', text: 'The mirror the King of Hell judges the dead with rises behind the target and shows it to itself. Then every blow it has struck in this fight comes back at once — and a great deal more besides. It cannot be blocked, and no intangibility or reflection escapes it.' },
          { key: 'F', name: 'Seal', kanji: '封', text: 'Seals everything: back to the sealed katana; the mirror drains away and the sky returns.' },
        ],
      },
    ],
    passives: [
      { key: '—', name: 'Shingan', kanji: '心眼', means: 'the Mind\'s Eye', text: 'Illusions do not work on him: he cannot be blinded, turned upside down, turned against his allies or have his steps scrambled.' },
      { key: '—', name: 'Kagami-gawari', kanji: '鏡代わり', means: 'the Mirror Stand-in', text: 'The first time he would die, it turns out a reflection was struck instead: it shatters like glass and he steps out from behind the attacker at 50 % HP.' },
      { key: '—', name: 'Daikidōchō', kanji: '大鬼道長', means: 'the Grand Kidō Chief', text: 'Every Kidō is cast without its incantation, at full power.' },
      { key: 'V', name: 'Reiatsu flare', kanji: '霊圧', text: 'His reiatsu flares violet: +25 % power while it burns.' },
      { key: 'Shift', name: 'Shunpo / Kōsoku', kanji: '光速', text: 'Flash steps that grow with each form (26 → 28 → 34 m); in the final form, Kōsoku: 40 m at the speed of light, leaving a line of light behind him.' },
    ],
    numbers: [
      { label: 'Form', values: ['Sealed', 'Shikai', 'Bankai', 'Final'] },
      { label: 'Power', values: ['×1.6', '×2.5', '×3.6', '×5.5'] },
      { label: 'Damage taken', values: ['×0.8', '×0.6', '×0.45', '×0.15'] },
      { label: 'Regeneration', values: ['—', '3 rei/s', '1.5 % HP + 8 rei /s', '3 % HP + 20 rei /s'] },
      { label: 'Health · reiatsu', values: ['2600 · 400', '2600 · 400', '2600 · 400', '2600 · 400'] },
    ],
    tips: [
      'Sealed, play the Kidō master: Kuyō Shibari holds the target still for Kurohitsugi, and Dankū shuts down anyone rushing in.',
      'In the Shikai, Senkō blinds them before Kakudai; Bunkō\'s green ray heals you and the violet one seals their releases.',
      'Raise Hansha just as a beam or a big blow comes in: all of it goes back.',
      'In the Bankai, fight on the mirror: enemies standing in it are stilled. Call Kyōzō early — three more blades — and finish with Senkyō Kōrō.',
      'In the final form, Jōhari no Kagami grows with everything your opponent has done: the harder they hit, the harder the judgment.',
      'Sandbox mode lets you try everything without limits.',
    ],
  },
  {
    id: 'dadou',
    name: 'Dadou',
    kanji: '波旬',
    title: 'Jigoku no Kōtei — the Emperor of Hell',
    color: '#e8243c',
    dedication: 'Dadou is a special character: he is the person who made Bleach : Reishi, put into his own game. His face and hair come from his photos — the thick, wavy dark hair lifted off his forehead, the thick straight brows, the big open grin, the gold chain with its square pendant — and he asked for the rest himself: an emperor\'s haori, demonic fire in red, violet and black, forms that look nothing alike, and no balance at all. He is as overpowered as a character can be, on purpose.',
    lore: [
      'Dadou is a Shinigami who went down into Hell of his own will — and the only soul ever to walk back out of its Gates on his own feet. Hell\'s fire followed him home: crimson, violet, and a fire blacker than night that does not go out and does not let what it burns heal. He wears it like a court robe.',
      'He does not fight so much as command. Enemies are forced to their knees by the weight of his reiatsu, iron pillars fall where he points, chains rise out of the ground, the Gates of Hell open behind whoever he looks at. Every form is a bigger crown: the Emperor, the Demon, the Demon Emperor, the Demon King of the Sixth Heaven.',
      'His Zanpakutō is Hajun, named for Mara Pāpīyas, the demon king who rules the sixth heaven of desire. Its spirit is a towering figure in an imperial robe of black fire, its face hidden behind a demon mask, and it bows to no one but him.',
    ],
    profile: [
      ['Race', 'Shinigami (returned from Hell)'],
      ['Title', 'Jigoku no Kōtei 地獄の皇帝 — the Emperor of Hell'],
      ['Height', '179 cm'],
      ['Hair', 'thick, wavy and nearly black, lifted off the forehead in a wave and swept back, kept short at the sides'],
      ['Eyes', 'dark brown — red from the Shikai on; in his final form black takes the left side of his face and that eye burns red in a black socket'],
      ['Smile', 'a big, open grin — gone in his final form'],
      ['Mark', 'a gold chain with a square gold pendant, in every form'],
      ['Outfit', 'black shihakushō under the Emperor\'s haori: deep crimson and ankle-length, gold borders and gold flames at the hem, a tall black collar edged in gold, a black shoulder mantle with gold flames, gold tasselled cords across the chest and a burning gold chrysanthemum on the back'],
    ],
    zanpakuto: {
      name: 'Hajun',
      kanji: '波旬',
      means: 'Mara Pāpīyas — the demon king of the sixth heaven, who tempted the Buddha. Oda Nobunaga called himself "the Demon King of the Sixth Heaven" (第六天魔王) and sealed his letters "Tenka Fubu" (天下布武), "the realm by force" — the names of Dadou\'s final release.',
      text: [
        'Sealed, Hajun is a katana with a crimson hilt wrap and a gold guard cast as a demon\'s face — horns, brows, two eyes and fangs — in a black lacquered sheath with gold fittings and a crimson cord.',
        'Its power is Hell\'s own fire in three colours: crimson, violet, and a black flame that clings and does not let what it burns heal. Released, it bends Hell itself to his will: its Gates, its wardens\' chains, its burning ground — and, in the Bankai, a colossus of black fire in his own shape.',
      ],
    },
    forms: [
      {
        name: 'Sealed — Hajun',
        kanji: '封印',
        look: 'The crimson Emperor\'s haori over the black shihakushō, the katana low in his right hand, the left hand folded behind his back.',
        stats: ['Power ×1.8', 'Damage taken ×0.75', 'Shunpo 27 m', 'Every Kidō chantless'],
        moves: [
          { key: 'LMB', name: 'Teiken', kanji: '帝剣', means: 'the Emperor\'s Sword', text: 'Five cuts — a diagonal, its reverse, a level cut, a thrust and a rising cut that launches — each leaving the target burning.' },
          { key: 'RMB', name: 'Hadō #54 — Haien', kanji: '廃炎', means: 'Abolishing Flames', text: 'A violet orb with a black heart from his left palm: it homes in, bursts and engulfs the target in black fire for 4 seconds.' },
          { key: 'Q', name: 'Hadō #31 — Shakkahō: Gorenpatsu', kanji: '赤火砲・五連発', means: 'Red Flame Cannon, five in a row', text: 'Five red fire cannons fanned out from two fingers; each one bursts and sets its target alight.' },
          { key: 'E', name: 'Ōi', kanji: '王威', means: 'Majesty', text: 'His reiatsu falls like a weight: everyone within 12 m is struck and forced to its knees for 1.6 seconds, and the ground cracks in a ring round him.' },
          { key: 'R', name: 'Bakudō #75 — Gochūtekkan', kanji: '五柱鉄貫', means: 'Five Pillars of Iron', text: 'Five black iron pillars fall out of the sky round the target, leaning in, and pin it on its knees for 3 seconds.' },
          { key: 'G', name: 'Gyokuza', kanji: '玉座', means: 'the Throne', text: 'A throne of black lacquer and gold rises behind him and he sits down on it — untouchable while he sits. Everyone within 22 m kneels for 3 seconds while fire erupts under them twice.' },
          { key: 'F', name: 'Hirefuse, Hajun', kanji: '平伏せ', text: '"Bow down": the Shikai — and everyone near him bows.' },
        ],
      },
      {
        name: 'Shikai — Hajun',
        kanji: '始解',
        command: 'Hirefuse, Hajun — 平伏せ「波旬」',
        means: 'Bow down, Hajun',
        look: 'The haori burns: it turns black and crimson-violet fire climbs it from the hem. Two short black horns rise through his hair and his eyes turn red. The blade turns black, with a crimson edge and violet fire in its groove.',
        stats: ['Power ×2.8', 'Damage taken ×0.55', 'Reiatsu +4/s', 'Shunpo 29 m'],
        moves: [
          { key: 'LMB', name: 'Gokuen-giri', kanji: '獄炎斬り', means: 'Hellfire Cuts', text: 'The same five cuts; each throws a crescent of black fire edged in violet (14 m), the last a wide one (26 m). Everything they touch burns black.' },
          { key: 'RMB', name: 'Kokuen', kanji: '黒炎', means: 'Black Flame', text: 'A lunge, and a cone of black fire pours off the point for 14 m: walls rot away in it, and whoever stands in it burns black for 4 seconds.' },
          { key: 'Q', name: 'Onibi', kanji: '鬼火', means: 'Demon Fires', text: 'Nine violet will-o\'-the-wisps circle his shoulders, then hunt the target one after another.' },
          { key: 'E', name: 'Kensaku', kanji: '羂索', means: 'the Noose', text: 'A rope of red fire lassoes the target, burns it and hauls it to his feet, where it stays bound for a second.' },
          { key: 'R', name: 'Gōka', kanji: '業火', means: 'Hellfire (the fire of one\'s sins)', text: 'The ground under the target glows; a pillar of black and violet fire erupts there and throws it up — then two more chase it.' },
          { key: 'G', name: 'Hyakki Yakō', kanji: '百鬼夜行', means: 'the Night Parade of a Hundred Demons', text: 'A stampede of burning demon heads — oni, skulls and hannya — charges 45 m ahead, tearing up the ground and trampling everyone in its way.' },
          { key: 'F', name: 'Bankai', kanji: '卍解', text: 'Releases the Bankai.' },
        ],
      },
      {
        name: 'Bankai — Tenma Hajun',
        kanji: '天魔波旬',
        command: 'Bankai — 卍解「天魔波旬」',
        means: 'the Heavenly Demon Hajun',
        look: 'He drives the blade into the ground and Hell answers: the sky turns blood red, and a colossus of black fire in his own shape rises behind him, its halo burning, and repeats everything he does. He wears black lacquered armour edged in gold — great shoulder plates laced in crimson, a breastplate with a gold demon face — a long imperial cape, black outside and crimson inside, with a collar of black flame, a black iron crown over long swept-back horns, and a halo of fire (karura-en) behind him. The blade is a great nodachi of black obsidian with a molten edge.',
        stats: ['Power ×4.2', 'Damage taken ×0.4', 'Healed to full on release', 'Regenerates 1.5 % HP and 10 reiatsu per second', 'Enemies within 6 m catch fire', 'Knockback ×0.4'],
        moves: [
          { key: 'LMB', name: 'Tenma-giri', kanji: '天魔斬り', means: 'the Heavenly Demon\'s Cuts', text: 'Five heavy two-handed cuts with the nodachi — and the colossus behind him makes every one of them too, with a blade 17 m long that cuts through buildings.' },
          { key: 'RMB', name: 'Jigoku no Mon', kanji: '地獄の門', means: 'the Gates of Hell', text: 'The Gates of Hell rise out of the ground behind the target and open; a blade from the dark inside impales it, chains drag it in and the doors close on it. Two seconds later they spit it back out, burning black. It cannot be blocked.' },
          { key: 'Q', name: 'Gokusotsu no Kusari', kanji: '獄卒の鎖', means: 'the Wardens\' Chains', text: 'Hell\'s chains burst from the ground under every enemy within 25 m and bind them for 3 seconds, burning them all the while.' },
          { key: 'E', name: 'Tenma no Te', kanji: '天魔の手', means: 'the Heavenly Demon\'s Hand', text: 'The colossus steps in, closes its hand round the target, lifts it high and smashes it into the ground. It cannot be blocked.' },
          { key: 'R', name: 'Hachinetsu Jigoku', kanji: '八熱地獄', means: 'the Eight Burning Hells', text: 'The ground for 26 m round him becomes Hell for 10 seconds: burning cracks, fire and a ring of flame. Enemies on it burn, are slowed and cannot heal.' },
          { key: 'G', name: 'Daitenma-giri', kanji: '大天魔斬り', means: 'the Great Heavenly Demon\'s Cut', text: 'The colossus raises its blade and brings it down in one cut 70 m long and 40 m high through everything ahead. It cannot be blocked.' },
          { key: 'F', name: 'Tenka Fubu — Dairokuten Maō', kanji: '第六天魔王', text: 'Releases his final form.' },
        ],
      },
      {
        name: 'Final form — Dairokuten Maō',
        kanji: '第六天魔王',
        command: 'Tenka Fubu — 天下布武「第六天魔王」',
        means: 'The realm by force — the Demon King of the Sixth Heaven',
        look: 'He rises into the air and no longer smiles. Black takes the left side of his face, edged in burning cracks, and that eye burns red in a black socket; two horns like a Hollow\'s grow from his temples and point forward past his face, their points burning. The haori becomes a robe of black and gold edged in violet fire, a second pair of arms of cracked obsidian rises behind his shoulders with a blade of black fire in each hand, and a wheel of fire with six burning spokes turns at his back. The colossus stays with him.',
        stats: ['Power ×6.5', 'Damage taken ×0.1', 'Healed to full on release', 'Regenerates 3 % HP and 25 reiatsu per second', 'Flies: Space climbs, Ctrl sinks', 'Never knocked back; immune to every status', 'Enemies within 16 m are slowed and burn black'],
        moves: [
          { key: 'LMB', name: 'Rokudō', kanji: '六道', means: 'the Six Paths (of rebirth)', text: 'Six cuts with both pairs of arms: every cut throws two crescents of black fire 40 m ahead, and the colossus cuts with him.' },
          { key: 'RMB', name: 'Gokuen-hō', kanji: '獄炎砲', means: 'the Hellfire Cannon', text: 'All four hands together: a beam of black-cored hellfire 120 m long that bores through everything for a second and a half.' },
          { key: 'Q', name: 'Kaen-rin', kanji: '火炎輪', means: 'the Wheel of Fire', text: 'The wheel on his back flies off as a burning buzzsaw 12 m across, cuts a trench to the target, strikes it four times (unblockable) and comes back.' },
          { key: 'E', name: 'Muken', kanji: '無間', means: 'Avīci, the hell without end', text: 'The target is swallowed by a sphere of black fire: held for 3 seconds and burned twelve times, then the sphere implodes and blows apart.' },
          { key: 'R', name: 'Tenma Kōrin', kanji: '天魔降臨', means: 'the Heavenly Demon Descends', text: 'The colossus appears over the target, grown even larger, and drives its blade down through it. It cannot be blocked.' },
          { key: 'G', name: 'Tenka Fubu', kanji: '天下布武', means: 'the realm by force', text: 'The sky becomes a ceiling of hellfire. Everyone within 60 m is forced to its knees, and 48 burning meteors rain on everything round him for four seconds.' },
          { key: 'F', name: 'Seal', kanji: '封', text: 'Seals everything: back to the katana; the colossus dissolves and the sky returns.' },
        ],
      },
    ],
    passives: [
      { key: '—', name: 'Gokuen', kanji: '獄炎', means: 'Hellfire', text: 'His fire clings. A burning target loses health every moment and cannot be healed while it burns; black fire burns twice as hot and slows.' },
      { key: '—', name: 'Jigoku-gaeri', kanji: '地獄帰り', means: 'Back from Hell', text: 'The first time he would die, he falls into Hell — and the Gates of Hell rise behind him, open, and he walks back out of them at full health, one form higher.' },
      { key: '—', name: 'Tenma', kanji: '天魔', means: 'the Heavenly Demon', text: 'From the Bankai on, the colossus of black fire repeats every move he makes; enemies within 6 m of him catch fire.' },
      { key: '—', name: 'Maō no Iatsu', kanji: '魔王の威圧', means: 'the Demon King\'s Pressure', text: 'In his final form, enemies within 16 m are slowed and burn black, and no status holds him.' },
      { key: 'V', name: 'Reiatsu flare', kanji: '霊圧', text: 'His reiatsu flares crimson: +25 % power while it burns.' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', text: 'Flash steps that grow with each form (27 → 29 → 34 → 42 m).' },
    ],
    numbers: [
      { label: 'Form', values: ['Sealed', 'Shikai', 'Bankai', 'Final'] },
      { label: 'Power', values: ['×1.8', '×2.8', '×4.2', '×6.5'] },
      { label: 'Damage taken', values: ['×0.75', '×0.55', '×0.4', '×0.1'] },
      { label: 'Regeneration', values: ['—', '4 rei/s', '1.5 % HP + 10 rei /s', '3 % HP + 25 rei /s'] },
      { label: 'Health · reiatsu', values: ['3000 · 500', '3000 · 500', '3000 · 500', '3000 · 500'] },
    ],
    tips: [
      'Sealed, open with Ōi: whoever kneels cannot dodge Gochūtekkan, and the pillars hold them for your string.',
      'Sit on the throne when you are rushed — nothing touches you while you sit, and everyone near you kneels.',
      'In the Shikai, Kensaku drags them to your feet: answer with Kokuen at point-blank range.',
      'Burning targets cannot heal: keep them burning through their releases.',
      'In the Bankai, let the colossus do the work — every cut you make, it makes too. Lay Hachinetsu Jigoku early and fight on it.',
      'Jigoku no Mon cannot be blocked and takes them out of the fight for two seconds — perfect before a release.',
      'Your first death is not the end: you come back out of Hell one form higher.',
      'Sandbox mode lets you try everything without limits.',
    ],
  },
];

const CSS = `
#wiki { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(4,5,12,.78); font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: #f3f1ec; pointer-events: auto; }
#wiki .panel { position: relative; width: min(980px, 96vw); height: min(92vh, 1100px); display: flex; flex-direction: column; border: 1px solid color-mix(in srgb, var(--acc, #ffd27a) 45%, transparent); box-shadow: 0 0 40px color-mix(in srgb, var(--acc, #ffd27a) 18%, transparent); background:
  radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,.8), transparent), radial-gradient(1px 1px at 72% 9%, rgba(255,240,200,.7), transparent),
  radial-gradient(1.5px 1.5px at 88% 34%, rgba(200,215,255,.8), transparent), radial-gradient(1px 1px at 33% 62%, rgba(255,255,255,.6), transparent),
  radial-gradient(1px 1px at 58% 81%, rgba(255,240,200,.6), transparent), radial-gradient(1.5px 1.5px at 6% 88%, rgba(200,215,255,.7), transparent),
  linear-gradient(170deg, #121734 0%, #0c0f22 55%, #160f1c 100%); }
#wiki .top { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid color-mix(in srgb, var(--acc, #ffd27a) 25%, transparent); }
#wiki .top h2 { margin: 0; font-family: 'Dela Gothic One', sans-serif; font-size: 18px; letter-spacing: .25em; text-transform: uppercase; color: var(--acc, #ffd27a); flex: 1; }
#wiki .top button { cursor: pointer; background: none; border: 1px solid rgba(255,255,255,.3); color: #f3f1ec; font-size: 13px; padding: 5px 12px; letter-spacing: .12em; }
#wiki .top button:hover { border-color: var(--acc, #ffd27a); color: var(--acc, #ffd27a); }
#wiki .tabs { display: flex; gap: 8px; padding: 10px 20px 0; flex-wrap: wrap; }
#wiki .tab { cursor: pointer; padding: 6px 14px; border: 1px solid color-mix(in srgb, var(--acc, #ffd27a) 35%, transparent); background: color-mix(in srgb, var(--acc, #ffd27a) 6%, transparent); color: #f3f1ec; font-size: 12px; letter-spacing: .12em; }
#wiki .tab.sel { background: var(--acc, #ffd27a); color: #141418; }
#wiki .body { overflow-y: auto; padding: 8px 26px 30px; line-height: 1.55; font-size: 14px; }
#wiki .hero { display: flex; gap: 22px; align-items: center; margin: 14px 0 6px; }
#wiki .hero .hk { font-family: 'Yuji Syuku', serif; font-size: 64px; line-height: 1; color: var(--acc, #ffd27a); text-shadow: 0 0 22px color-mix(in srgb, var(--acc, #ffd27a) 60%, transparent); }
#wiki .hero .nm { font-family: 'Dela Gothic One', sans-serif; font-size: 34px; letter-spacing: .12em; }
#wiki .hero .tt { font-size: 13px; letter-spacing: .18em; text-transform: uppercase; opacity: .8; }
#wiki .ded { margin: 12px 0 4px; padding: 10px 14px; border-left: 3px solid var(--acc, #ffd27a); background: color-mix(in srgb, var(--acc, #ffd27a) 8%, transparent); font-style: italic; }
#wiki h3 { font-family: 'Dela Gothic One', sans-serif; font-size: 14px; letter-spacing: .3em; text-transform: uppercase; color: var(--acc, #ffd27a); margin: 24px 0 8px; border-bottom: 1px solid color-mix(in srgb, var(--acc, #ffd27a) 22%, transparent); padding-bottom: 4px; }
#wiki h4 { margin: 18px 0 4px; font-size: 17px; font-family: 'Dela Gothic One', sans-serif; letter-spacing: .06em; }
#wiki h4 .k { font-family: 'Yuji Syuku', serif; color: var(--acc, #ffd27a); margin-left: 10px; font-size: 18px; }
#wiki .cmd { margin: 2px 0 6px; color: #c6d8ff; }
#wiki .cmd i { opacity: .8; }
#wiki .look { opacity: .92; }
#wiki .stats { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
#wiki .stats span { font-size: 12px; padding: 3px 9px; border: 1px solid rgba(198,216,255,.35); background: rgba(198,216,255,.07); }
#wiki table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 13.5px; }
#wiki td, #wiki th { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,.08); vertical-align: top; text-align: left; }
#wiki th { color: var(--acc, #ffd27a); font-weight: 700; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
#wiki td.key { width: 54px; white-space: nowrap; color: #141418; }
#wiki td.key b { display: inline-block; min-width: 34px; text-align: center; background: var(--acc, #ffd27a); padding: 1px 6px; font-size: 12px; }
#wiki td.mv { width: 230px; }
#wiki td.mv b { display: block; }
#wiki td.mv .wk { font-family: 'Yuji Syuku', serif; color: var(--acc, #ffd27a); }
#wiki td.mv .mn { display: block; font-size: 12px; opacity: .7; font-style: italic; }
#wiki .prof td:first-child { width: 120px; color: var(--acc, #ffd27a); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
#wiki ul { margin: 6px 0; padding-left: 20px; }
#wiki .wplay { margin-top: 22px; cursor: pointer; font-family: 'Dela Gothic One', sans-serif; letter-spacing: .25em; padding: 12px 28px; background: var(--acc, #ffd27a); color: #141418; border: none; font-size: 15px; }
#wiki .wplay:hover { background: #fff0c8; }
@media (max-width: 640px) { #wiki td.mv { width: auto; } #wiki .hero .hk { font-size: 44px; } #wiki .hero .nm { font-size: 24px; } #wiki .body { padding: 8px 14px 24px; } }
`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function moveRows(moves: WikiMove[]): string {
  return moves
    .map((m) => `<tr><td class="key"><b>${esc(m.key)}</b></td><td class="mv"><b>${esc(m.name)}</b>${m.kanji ? `<span class="wk">${esc(m.kanji)}</span>` : ''}${m.means ? `<span class="mn">${esc(m.means)}</span>` : ''}</td><td>${esc(m.text)}</td></tr>`)
    .join('');
}

function page(e: WikiEntry, canPlay: boolean): string {
  const keys = ['LMB', 'RMB', 'Q', 'E', 'R', 'G', 'F'];
  const grid = keys
    .map((k) => `<tr><td class="key"><b>${k}</b></td>${e.forms.map((f) => `<td>${esc(f.moves.find((m) => m.key === k)?.name ?? '—')}</td>`).join('')}</tr>`)
    .join('');
  return `
    <div class="hero"><div class="hk">${esc(e.kanji)}</div><div><div class="nm">${esc(e.name)}</div><div class="tt">${esc(e.title)}</div></div></div>
    <div class="ded">${esc(e.dedication)}</div>
    <h3>Story</h3>${e.lore.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>Profile</h3><table class="prof">${e.profile.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>
    <h3>Zanpakutō — ${esc(e.zanpakuto.name)} <span style="font-family:'Yuji Syuku',serif">${esc(e.zanpakuto.kanji)}</span></h3>
    <p><i>${esc(e.zanpakuto.means)}</i></p>${e.zanpakuto.text.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>Forms and powers</h3>
    ${e.forms
      .map(
        (f) => `<h4>${esc(f.name)}<span class="k">${esc(f.kanji)}</span></h4>
      ${f.command ? `<div class="cmd">${esc(f.command)}${f.means ? ` — <i>${esc(f.means)}</i>` : ''}</div>` : ''}
      <div class="look">${esc(f.look)}</div>
      <div class="stats">${f.stats.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
      <table>${moveRows(f.moves)}</table>`,
      )
      .join('')}
    <h3>Passives</h3><table>${moveRows(e.passives)}</table>
    <h3>Controls by form</h3>
    <table><tr><th>Key</th>${e.forms.map((f) => `<th>${esc(f.name.split(' — ')[0])}</th>`).join('')}</tr>${grid}</table>
    <h3>Numbers</h3>
    <table>${e.numbers.map((n, i) => `<tr>${i === 0 ? `<th>${esc(n.label)}</th>${n.values.map((v) => `<th>${esc(v)}</th>`).join('')}` : `<td>${esc(n.label)}</td>${n.values.map((v) => `<td>${esc(v)}</td>`).join('')}`}</tr>`).join('')}</table>
    <h3>Tips</h3><ul>${e.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    ${canPlay ? `<button class="wplay" data-id="${esc(e.id)}">PLAY AS ${esc(e.name.toUpperCase())}</button>` : ''}`;
}

/**
 * Open the wiki over `parent`. `onPick(id)` (optional) selects the character on the start screen; the page closes on
 * the × button, a click outside the panel, or Escape.
 */
export function openWiki(parent: HTMLElement, entries: WikiEntry[] = SPECIAL_WIKI, onPick?: (id: string) => void): () => void {
  if (!document.getElementById('wiki-css')) {
    const st = document.createElement('style');
    st.id = 'wiki-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.id = 'wiki';
  let cur = entries[0];
  el.innerHTML = `<div class="panel"><div class="top"><h2>✦ Special characters wiki</h2><button class="x">CLOSE ✕</button></div>
    <div class="tabs">${entries.map((e) => `<button class="tab" data-id="${esc(e.id)}">${esc(e.name)} ${esc(e.kanji)}</button>`).join('')}</div>
    <div class="body"></div></div>`;
  parent.appendChild(el);
  const body = el.querySelector('.body') as HTMLElement;
  const show = (e: WikiEntry) => {
    cur = e;
    el.style.setProperty('--acc', e.color);
    body.innerHTML = page(e, !!onPick);
    body.scrollTop = 0;
    el.querySelectorAll<HTMLElement>('.tab').forEach((t) => t.classList.toggle('sel', t.dataset.id === e.id));
    body.querySelector('.wplay')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onPick?.(cur.id);
      close();
    });
  };
  el.querySelectorAll<HTMLElement>('.tab').forEach((t) =>
    t.addEventListener('click', (ev) => {
      ev.stopPropagation();
      show(entries.find((x) => x.id === t.dataset.id) ?? entries[0]);
    }),
  );
  const onKey = (ev: KeyboardEvent) => {
    ev.stopPropagation();
    if (ev.key === 'Escape') close();
  };
  const close = () => {
    window.removeEventListener('keydown', onKey, true);
    el.remove();
  };
  window.addEventListener('keydown', onKey, true);
  el.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (ev.target === el) close();
  });
  el.querySelector('.x')!.addEventListener('click', (ev) => {
    ev.stopPropagation();
    close();
  });
  show(cur);
  return close;
}
