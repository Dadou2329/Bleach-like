// The playable roster: every character the player can pick or fight in a duel, with its fighter
// definition, kit factory and the assets worth warming up before they are needed (other forms).
import type { Fighter, FighterDef } from './fighter';
import type { Game } from './game';
import type { Kit } from './kits/kit';
import { ICHIGO_DEF, IchigoKit } from './kits/ichigo';
import { buildCached } from './characterFactory';
import { hollowMask, hollowMaskShatter, ichigoAsset, ichigoSword } from '../chars/ichigo';
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
