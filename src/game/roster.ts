// The playable roster: every character the player can pick or fight in a duel, with its fighter
// definition, kit factory and the assets worth warming up before they are needed (other forms).
import type { Fighter, FighterDef } from './fighter';
import type { Game } from './game';
import type { Kit } from './kits/kit';
import { ICHIGO_DEF, IchigoKit } from './kits/ichigo';
import { buildCached } from './characterFactory';
import { hollowMask, hollowMaskShatter, ichigoAsset, ichigoSword } from '../chars/ichigo';
import { HOLLOW_ICHIGO_DEF, HollowIchigoKit } from './kits/hollowIchigo';
import { ISSHIN_DEF, IsshinKit } from './kits/isshin';
import { NELLIEL_DEF, NelKit } from './kits/nelliel';
import { nelAsset, nelProp } from '../chars/nelliel';
import { IKKAKU_DEF, IkkakuKit } from './kits/ikkaku';
import { CREST_SLICES, ikkakuCrestSlice, ikkakuProp } from '../chars/ikkaku';
import { RANGIKU_DEF, RangikuKit } from './kits/rangiku';
import { rangikuProp } from '../chars/rangiku';
import { isshinAsset, isshinProp } from '../chars/isshin';
import { ichigoHollowAsset } from '../chars/ichigoHollow';
import { GRIMMJOW_DEF, GrimmjowKit } from './kits/grimmjow';
import { grimmjowAsset, grimmjowProp } from '../chars/grimmjow';
import { BYAKUYA_DEF, ByakuyaKit } from './kits/byakuya';
import { byakuyaProp } from '../chars/byakuya';
import { KENPACHI_DEF, KenpachiKit } from './kits/kenpachi';
import { kenpachiAsset, kenpachiProp } from '../chars/kenpachi';
import { ULQUIORRA_DEF, UlquiorraKit } from './kits/ulquiorra';
import { ulquiorraAsset, ulquiorraProp } from '../chars/ulquiorra';
import { HITSUGAYA_DEF, HitsugayaKit } from './kits/hitsugaya';
import { hitsugayaAsset, hitsugayaProp } from '../chars/hitsugaya';
import { AIZEN_DEF, AizenKit } from './kits/aizen';
import { aizenAsset, aizenProp } from '../chars/aizen';
import { RENJI_DEF, RenjiKit } from './kits/renji';
import { renjiAsset, renjiProp } from '../chars/renji';
import { RUKIA_DEF, RukiaKit } from './kits/rukia';
import { rukiaAsset, rukiaProp } from '../chars/rukia';
import { CHAD_DEF, ChadKit } from './kits/chad';
import { chadAsset } from '../chars/chad';
import { URYU_DEF, UryuKit } from './kits/uryu';
import { uryuAsset, uryuProp } from '../chars/uryu';
import { YORUICHI_DEF, YoruichiKit } from './kits/yoruichi';
import { yoruichiAsset } from '../chars/yoruichi';
import { URAHARA_DEF, UraharaKit } from './kits/urahara';
import { YAMAMOTO_DEF, YamamotoKit } from './kits/yamamoto';
import { GIN_DEF, GinKit } from './kits/gin';
import { SUIFENG_DEF, SuifengKit } from './kits/suifeng';
import { KYORAKU_DEF, KyorakuKit } from './kits/kyoraku';
import { STARRK_DEF, StarrkKit } from './kits/starrk';
import { lilynetteAsset, starrkAsset, starrkProp } from '../chars/starrk';
import { UKITAKE_DEF, UkitakeKit } from './kits/ukitake';
import { ukitakeProp } from '../chars/ukitake';
import { HARRIBEL_DEF, HarribelKit } from './kits/harribel';
import { harribelAsset, harribelProp } from '../chars/harribel';
import { NNOITRA_DEF, NnoitraKit } from './kits/nnoitra';
import { nnoitraAsset, nnoitraProp } from '../chars/nnoitra';
import { BARAGGAN_DEF, BaragganKit } from './kits/baraggan';
import { baragganAsset, baragganProp } from '../chars/baraggan';
import { KOMAMURA_DEF, KomamuraKit } from './kits/komamura';
import { giantAsset, komamuraProp } from '../chars/komamura';
import { TOSEN_DEF, TosenKit } from './kits/tosen';
import { tosenAsset } from '../chars/tosen';
import { ORIHIME_DEF, OrihimeKit } from './kits/orihime';
import { FAIRY_NAMES, orihimeAsset, rikkaFairy } from '../chars/orihime';
import { MAYURI_DEF, MayuriKit } from './kits/mayuri';
import { mayuriProp } from '../chars/mayuri';
import { jizoAsset } from '../chars/mayuriBankai';
import { UNOHANA_DEF, UnohanaKit } from './kits/unohana';
import { unohanaAsset, unohanaProp } from '../chars/unohana';
import { mantaAsset } from '../chars/unohanaMinazuki';
import { SHINJI_DEF, ShinjiKit } from './kits/shinji';
import { shinjiProp } from '../chars/shinji';
import { flowerAsset } from '../chars/shinjiFlower';
import { YHWACH_DEF, YhwachKit } from './kits/yhwach';
import { yhwachAsset, yhwachProp } from '../chars/yhwach';
import { kyorakuAsset, kyorakuProp } from '../chars/kyoraku';
import { suifengAsset, suifengProp } from '../chars/suifeng';
import { ginAsset } from '../chars/gin';
import { yamamotoAsset, yamamotoProp } from '../chars/yamamoto';
import { uraharaProp } from '../chars/urahara';
import { benihimeCurtain, benihimeDoll } from '../chars/uraharaBankai';

export interface RosterEntry {
  id: string;
  name: string;
  kanji: string;
  title: string;
  /** UI accent */
  color: string;
  def(): FighterDef;
  kit(f: Fighter, g: Game): Kit;
  /** build the other forms' meshes in idle time so a release does not hitch */
  warm?(): void;
}

export const ROSTER: RosterEntry[] = [
  {
    id: 'ichigo',
    name: 'Kurosaki Ichigo',
    kanji: '一護',
    title: 'Substitute Shinigami',
    color: '#ff9a3c',
    def: () => ({ ...ICHIGO_DEF, speed: { ...ICHIGO_DEF.speed } }),
    kit: (f, g) => new IchigoKit(f, g),
    warm: () => {
      buildCached(ichigoAsset('bankai').model, true);
      buildCached(ichigoSword('bankai'), false);
      const sh = hollowMaskShatter();
      for (const m of [hollowMask(), ...sh.cracked, ...sh.shards.map((x) => x.model)]) buildCached(m, false);
    },
  },
  {
    id: 'hollowichigo',
    name: 'Hollow Ichigo',
    kanji: '白一護',
    title: 'Zangetsu',
    color: '#e9e6ee',
    def: () => ({ ...HOLLOW_ICHIGO_DEF, speed: { ...HOLLOW_ICHIGO_DEF.speed } }),
    kit: (f, g) => new HollowIchigoKit(f, g),
    warm: () => {
      buildCached(ichigoAsset('bankai', 'white').model, true);
      buildCached(ichigoHollowAsset(true).model, true);
      buildCached(ichigoSword('bankai', 'white'), false);
    },
  },
  {
    id: 'isshin',
    name: 'Isshin Kurosaki',
    kanji: '一心',
    title: 'Former Captain, 10th Division',
    color: '#f1d47b',
    def: () => ({ ...ISSHIN_DEF, speed: { ...ISSHIN_DEF.speed } }),
    kit: (f, g) => new IsshinKit(f, g),
    warm: () => {
      buildCached(isshinAsset('shinigami').model, true);
      for (const k of ['engetsu', 'saya'] as const) buildCached(isshinProp(k), false);
    },
  },
  {
    id: 'grimmjow',
    name: 'Grimmjow Jaegerjaquez',
    kanji: '豹王',
    title: 'Sexta Espada',
    color: '#4fc6e8',
    def: () => ({ ...GRIMMJOW_DEF, speed: { ...GRIMMJOW_DEF.speed } }),
    kit: (f, g) => new GrimmjowKit(f, g),
    warm: () => {
      buildCached(grimmjowAsset('pantera').model, true);
      for (const k of ['katana', 'sheath-empty'] as const) buildCached(grimmjowProp(k), false);
    },
  },
  {
    id: 'byakuya',
    name: 'Kuchiki Byakuya',
    kanji: '千本桜',
    title: 'Captain, 6th Division',
    color: '#f5a9c4',
    def: () => ({ ...BYAKUYA_DEF, speed: { ...BYAKUYA_DEF.speed } }),
    kit: (f, g) => new ByakuyaKit(f, g),
    warm: () => {
      buildCached(byakuyaProp('hilt'), false);
      buildCached(byakuyaProp('giant'), false);
    },
  },
  {
    id: 'renji',
    name: 'Renji Abarai',
    kanji: '蛇尾丸',
    title: 'Lieutenant, 6th Division',
    color: '#ff5a5f',
    def: () => ({ ...RENJI_DEF, speed: { ...RENJI_DEF.speed } }),
    kit: (f, g) => new RenjiKit(f, g),
    warm: () => {
      buildCached(renjiAsset('bankai').model, true);
      for (const k of ['hilt', 'seg0', 'seg1', 'seg2', 'seg3', 'seg4', 'seg5', 'handle', 'skull', 'vertebra'] as const) buildCached(renjiProp(k), false);
    },
  },
  {
    id: 'rukia',
    name: 'Rukia Kuchiki',
    kanji: '袖白雪',
    title: '13th Division',
    color: '#bfe6f7',
    def: () => ({ ...RUKIA_DEF, speed: { ...RUKIA_DEF.speed } }),
    kit: (f, g) => new RukiaKit(f, g),
    warm: () => {
      buildCached(rukiaAsset('bankai').model, true);
      for (const k of ['shikai', 'bankai-sword', 'shirafune'] as const) buildCached(rukiaProp(k), false);
    },
  },
  {
    id: 'chad',
    name: 'Yasutora Sado',
    kanji: '巨人',
    title: 'Fullbringer',
    color: '#c04a9a',
    def: () => ({ ...CHAD_DEF, speed: { ...CHAD_DEF.speed } }),
    kit: (f, g) => new ChadKit(f, g),
    warm: () => {
      buildCached(chadAsset('gigante').model, true);
      buildCached(chadAsset('true').model, true);
    },
  },
  {
    id: 'uryu',
    name: 'Uryū Ishida',
    kanji: '滅却師',
    title: 'Quincy',
    color: '#8fd0ff',
    def: () => ({ ...URYU_DEF, speed: { ...URYU_DEF.speed } }),
    kit: (f, g) => new UryuKit(f, g),
    warm: () => {
      buildCached(uryuAsset('letzt').model, true);
      for (const k of ['seele', 'glasses', 'cross'] as const) buildCached(uryuProp(k), false);
    },
  },
  {
    id: 'orihime',
    name: 'Orihime Inoue',
    kanji: '盾舜六花',
    title: 'Shun Shun Rikka',
    color: '#ffc94a',
    def: () => ({ ...ORIHIME_DEF, speed: { ...ORIHIME_DEF.speed } }),
    kit: (f, g) => new OrihimeKit(f, g),
    warm: () => {
      buildCached(orihimeAsset('rokuten').model, true);
      for (const n of FAIRY_NAMES) buildCached(rikkaFairy(n), false);
    },
  },
  {
    id: 'mayuri',
    name: 'Kurotsuchi Mayuri',
    kanji: '疋殺地蔵',
    title: 'Captain, 12th Division',
    color: '#f28fc0',
    def: () => ({ ...MAYURI_DEF, speed: { ...MAYURI_DEF.speed } }),
    kit: (f, g) => new MayuriKit(f, g),
    warm: () => {
      buildCached(jizoAsset().model, true);
      buildCached(mayuriProp('trident'), false);
    },
  },
  {
    id: 'unohana',
    name: 'Retsu Unohana',
    kanji: '卯ノ花',
    title: 'Captain, 4th Division',
    color: '#9fe8b8',
    def: () => ({ ...UNOHANA_DEF, speed: { ...UNOHANA_DEF.speed } }),
    kit: (f, g) => new UnohanaKit(f, g),
    warm: () => {
      buildCached(unohanaAsset('yachiru').model, true);
      buildCached(mantaAsset().model, true);
      for (const k of ['bankai', 'dagger'] as const) buildCached(unohanaProp(k), false);
    },
  },
  {
    id: 'shinji',
    name: 'Shinji Hirako',
    kanji: '平子',
    title: 'Leader of the Visored',
    color: '#f6a3c7',
    def: () => ({ ...SHINJI_DEF, speed: { ...SHINJI_DEF.speed } }),
    kit: (f, g) => new ShinjiKit(f, g),
    warm: () => { buildCached(flowerAsset().model, true); for (const k of ['shikai', 'bankai', 'mask'] as const) buildCached(shinjiProp(k), false); },
  },
  {
    id: 'yhwach',
    name: 'Yhwach',
    kanji: '全知全能',
    title: 'Emperor of the Wandenreich',
    color: '#4a78f0',
    def: () => ({ ...YHWACH_DEF, speed: { ...YHWACH_DEF.speed } }),
    kit: (f, g) => new YhwachKit(f, g),
    warm: () => { for (const k of ['almighty', 'soulking'] as const) buildCached(yhwachAsset(k).model, true); for (const k of ['broadsword', 'mask'] as const) buildCached(yhwachProp(k), false); },
  },
  {
    id: 'yoruichi',
    name: 'Yoruichi Shihōin',
    kanji: '瞬神',
    title: 'Flash Goddess',
    color: '#b8a8ff',
    def: () => ({ ...YORUICHI_DEF, speed: { ...YORUICHI_DEF.speed } }),
    kit: (f, g) => new YoruichiKit(f, g),
    warm: () => {
      buildCached(yoruichiAsset('shunko').model, true);
      buildCached(yoruichiAsset('raijin').model, true);
    },
  },
  {
    id: 'urahara',
    name: 'Kisuke Urahara',
    kanji: '紅姫',
    title: 'Urahara Shop',
    color: '#c8102e',
    def: () => ({ ...URAHARA_DEF, speed: { ...URAHARA_DEF.speed } }),
    kit: (f, g) => new UraharaKit(f, g),
    warm: () => {
      for (const k of ['shikai', 'cane-blade'] as const) buildCached(uraharaProp(k), false);
      buildCached(benihimeDoll().model, true);
      buildCached(benihimeCurtain(), false);
    },
  },
  {
    id: 'yamamoto',
    name: 'Genryūsai Yamamoto',
    kanji: '流刃若火',
    title: 'Captain-Commander',
    color: '#ff6a12',
    def: () => ({ ...YAMAMOTO_DEF, speed: { ...YAMAMOTO_DEF.speed } }),
    kit: (f, g) => new YamamotoKit(f, g),
    warm: () => {
      buildCached(yamamotoAsset('stripped').model, true);
      buildCached(yamamotoAsset('tybw').model, true);
      for (const k of ['katana', 'bankai'] as const) buildCached(yamamotoProp(k), false);
    },
  },
  {
    id: 'gin',
    name: 'Gin Ichimaru',
    kanji: '神鎗',
    title: 'Captain, 3rd Division',
    color: '#b48cff',
    def: () => ({ ...GIN_DEF, speed: { ...GIN_DEF.speed } }),
    kit: (f, g) => new GinKit(f, g),
    warm: () => {
      buildCached(ginAsset('open').model, true);
    },
  },
  {
    id: 'suifeng',
    name: 'Suì-Fēng',
    kanji: '雀蜂',
    title: 'Captain, 2nd Division',
    color: '#f2c94c',
    def: () => ({ ...SUIFENG_DEF, speed: { ...SUIFENG_DEF.speed } }),
    kit: (f, g) => new SuifengKit(f, g),
    warm: () => {
      buildCached(suifengAsset('keisen').model, true);
      for (const k of ['gauntlet', 'launcher', 'guard', 'missile'] as const) buildCached(suifengProp(k), false);
    },
  },
  {
    id: 'kyoraku',
    name: 'Shunsui Kyōraku',
    kanji: '花天狂骨',
    title: 'Captain, 8th Division',
    color: '#e98fb5',
    def: () => ({ ...KYORAKU_DEF, speed: { ...KYORAKU_DEF.speed } }),
    kit: (f, g) => new KyorakuKit(f, g),
    warm: () => {
      buildCached(kyorakuAsset('haori').model, true);
      buildCached(kyorakuAsset('shed').model, true);
      for (const k of ['katen', 'kyokotsu', 'waki'] as const) buildCached(kyorakuProp(k), false);
    },
  },
  {
    id: 'ukitake',
    name: 'Jūshirō Ukitake',
    kanji: '双魚理',
    title: 'Captain, 13th Division',
    color: '#9c1b2b',
    def: () => ({ ...UKITAKE_DEF, speed: { ...UKITAKE_DEF.speed } }),
    kit: (f, g) => new UkitakeKit(f, g),
    warm: () => buildCached(ukitakeProp('sogyo'), false),
  },
  {
    id: 'kenpachi',
    name: 'Zaraki Kenpachi',
    kanji: '剣八',
    title: 'Captain, 11th Division',
    color: '#f6c823',
    def: () => ({ ...KENPACHI_DEF, speed: { ...KENPACHI_DEF.speed } }),
    kit: (f, g) => new KenpachiKit(f, g),
    warm: () => {
      buildCached(kenpachiAsset('bankai').model, true);
      for (const k of ['cleaver', 'bankai-blade'] as const) buildCached(kenpachiProp(k), false);
    },
  },
  {
    id: 'ulquiorra',
    name: 'Ulquiorra Cifer',
    kanji: '黒翼大魔',
    title: 'Cuarta Espada',
    color: '#38d46a',
    def: () => ({ ...ULQUIORRA_DEF, speed: { ...ULQUIORRA_DEF.speed } }),
    kit: (f, g) => new UlquiorraKit(f, g),
    warm: () => {
      buildCached(ulquiorraAsset('murcielago').model, true);
      buildCached(ulquiorraAsset('segunda').model, true);
      for (const k of ['katana', 'sheath-empty', 'luz', 'lanza'] as const) buildCached(ulquiorraProp(k), false);
    },
  },
  {
    id: 'starrk',
    name: 'Coyote Starrk',
    kanji: '群狼',
    title: 'Primera Espada',
    color: '#6db6ff',
    def: () => ({ ...STARRK_DEF, speed: { ...STARRK_DEF.speed } }),
    kit: (f, g) => new StarrkKit(f, g),
    warm: () => {
      buildCached(lilynetteAsset().model, true);
      buildCached(starrkAsset('glove').model, true);
      buildCached(starrkAsset('lobos').model, true);
      for (const k of ['gunR', 'gunL', 'colmillo', 'wolf', 'lilyBlade'] as const) buildCached(starrkProp(k), false);
    },
  },
  {
    id: 'baraggan',
    name: 'Baraggan Louisenbairn',
    kanji: '髑髏大帝',
    title: 'Segunda Espada',
    color: '#b4232c',
    def: () => ({ ...BARAGGAN_DEF, speed: { ...BARAGGAN_DEF.speed } }),
    kit: (f, g) => new BaragganKit(f, g),
    warm: () => {
      buildCached(baragganAsset('arrogante').model, true);
      buildCached(baragganProp('granCaida'), false);
    },
  },
  {
    id: 'harribel',
    name: 'Tier Harribel',
    kanji: '皇鮫后',
    title: 'Tres Espada',
    color: '#f2c230',
    def: () => ({ ...HARRIBEL_DEF, speed: { ...HARRIBEL_DEF.speed } }),
    kit: (f, g) => new HarribelKit(f, g),
    warm: () => {
      buildCached(harribelAsset('unzipped').model, true);
      buildCached(harribelAsset('tiburon').model, true);
      buildCached(harribelProp('pata'), false);
    },
  },
  {
    id: 'nnoitra',
    name: 'Nnoitra Gilga',
    kanji: '聖哭螳螂',
    title: 'Quinta Espada',
    color: '#f5d33b',
    def: () => ({ ...NNOITRA_DEF, speed: { ...NNOITRA_DEF.speed } }),
    kit: (f, g) => new NnoitraKit(f, g),
    warm: () => {
      buildCached(nnoitraAsset('patch').model, true);
      buildCached(nnoitraAsset('santa').model, true);
      for (const k of ['scythe', 'tongue'] as const) buildCached(nnoitraProp(k), false);
    },
  },
  {
    id: 'nelliel',
    name: 'Nelliel Tu Odelschwanck',
    kanji: '羚騎士',
    title: 'Former Tres Espada',
    color: '#6cc08a',
    def: () => ({ ...NELLIEL_DEF, speed: { ...NELLIEL_DEF.speed } }),
    kit: (f, g) => new NelKit(f, g),
    warm: () => {
      buildCached(nelAsset('child').model, true);
      buildCached(nelAsset('gamuza').model, true);
      buildCached(nelProp('lance'), false);
    },
  },
  {
    id: 'ikkaku',
    name: 'Ikkaku Madarame',
    kanji: '鬼灯丸',
    title: '3rd Seat, 11th Division',
    color: '#e2363b',
    def: () => ({ ...IKKAKU_DEF, speed: { ...IKKAKU_DEF.speed } }),
    kit: (f, g) => new IkkakuKit(f, g),
    warm: () => {
      for (const k of ['spear', 'staff', 'head', 'guandao', 'spade', 'center'] as const) buildCached(ikkakuProp(k), false);
      for (let i = 0; i < CREST_SLICES; i++) buildCached(ikkakuCrestSlice(i), false);
    },
  },
  {
    id: 'rangiku',
    name: 'Rangiku Matsumoto',
    kanji: '灰猫',
    title: 'Lieutenant, 10th Division',
    color: '#f2a65a',
    def: () => ({ ...RANGIKU_DEF, speed: { ...RANGIKU_DEF.speed } }),
    kit: (f, g) => new RangikuKit(f, g),
    warm: () => {
      for (const k of ['hilt', 'blade'] as const) buildCached(rangikuProp(k), false);
    },
  },
  {
    id: 'komamura',
    name: 'Sajin Komamura',
    kanji: '天譴',
    title: 'Captain, 7th Division',
    color: '#d8322b',
    def: () => ({ ...KOMAMURA_DEF, speed: { ...KOMAMURA_DEF.speed } }),
    kit: (f, g) => new KomamuraKit(f, g),
    warm: () => {
      buildCached(giantAsset('limbs').model, true);
      buildCached(giantAsset('whole').model, true);
      buildCached(komamuraProp('giantSword'), false);
    },
  },
  {
    id: 'tosen',
    name: 'Kaname Tōsen',
    kanji: '清虫',
    title: 'Traitor, ex-Captain of the 9th',
    color: '#ff8cc6',
    def: () => ({ ...TOSEN_DEF, speed: { ...TOSEN_DEF.speed } }),
    kit: (f, g) => new TosenKit(f, g),
    warm: () => {
      buildCached(tosenAsset('masked').model, true);
    },
  },
  {
    id: 'hitsugaya',
    name: 'Tōshirō Hitsugaya',
    kanji: '氷輪丸',
    title: 'Captain, 10th Division',
    color: '#7fd6f5',
    def: () => ({ ...HITSUGAYA_DEF, speed: { ...HITSUGAYA_DEF.speed } }),
    kit: (f, g) => new HitsugayaKit(f, g),
    warm: () => {
      buildCached(hitsugayaAsset('bankai').model, true);
      for (const k of ['sword', 'bankai-sword', 'crescent', 'dragon-head'] as const) buildCached(hitsugayaProp(k), false);
    },
  },
  {
    id: 'aizen',
    name: 'Sōsuke Aizen',
    kanji: '鏡花水月',
    title: 'Captain, 5th Division',
    color: '#9b6dff',
    def: () => ({ ...AIZEN_DEF, speed: { ...AIZEN_DEF.speed } }),
    kit: (f, g) => new AizenKit(f, g),
    warm: () => {
      buildCached(aizenAsset('traitor').model, true);
      buildCached(aizenAsset('chrysalis').model, true);
      for (const k of ['fused', 'glasses'] as const) buildCached(aizenProp(k), false);
    },
  },
];

export function rosterEntry(id: string | null | undefined): RosterEntry {
  return ROSTER.find((r) => r.id === id) ?? ROSTER[0];
}
