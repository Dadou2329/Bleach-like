// Model / animation review mode: ?mode=model&char=ichigo[&form=bankai][&mask=1|cracked][&view=front|three|side|back|face]
// Exposes window.__reishi.view(name), .yaw(deg), .pose(name), .play(clip) for scripted screenshots.
import * as THREE from 'three';
import { Engine } from './engine';
import { generateStage } from './maps/stage';
import { QUALITY_HIGH, QUALITY_LOW } from './render/renderer';
import { CharacterVisual } from './game/characterFactory';
import { buildIchigo, buildTensaZangetsu, buildZangetsuShikai, hollowMask, hollowMaskShatter, type IchigoForm } from './chars/ichigo';
import { buildIchigoHollow } from './chars/ichigoHollow';
import { VASTO_CLIPS, VASTO_STANCE } from './chars/ichigoHollowClips';
import { Pose } from './anim/pose';
import { Animator } from './anim/animator';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './chars/ichigoClips';
import { Aura, AURA_ICHIGO_BANKAI, AURA_ICHIGO_SHIKAI } from './vfx/aura';
import { buildMenos, MENOS_CLIPS, MENOS_STANCE } from './chars/menos';
import { buildHollow, HOLLOW_CLIPS, HOLLOW_STANCE } from './chars/hollow';
import { buildGrimmjow, grimmjowProp } from './chars/grimmjow';
import { buildByakuya, byakuyaProp } from './chars/byakuya';
import { buildKenpachi, kenpachiProp } from './chars/kenpachi';
import { buildUlquiorra, ulquiorraProp, type UlquiorraForm } from './chars/ulquiorra';
import { FUSED_ATTACH, aizenProp, buildAizen, type AizenForm } from './chars/aizen';
import { buildHitsugaya, hitsugayaProp } from './chars/hitsugaya';
import { buildRenji, renjiProp, SEGMENT_BASE, SEGMENT_LEN, type RenjiProp } from './chars/renji';
import { buildRukia, rukiaProp } from './chars/rukia';
import { buildChad } from './chars/chad';
import { buildUryu, uryuProp } from './chars/uryu';
import { buildYoruichi, type YoruichiForm } from './chars/yoruichi';
import { buildUrahara, uraharaProp } from './chars/urahara';
import { buildYamamoto, yamamotoProp } from './chars/yamamoto';
import { buildGin, ginProp } from './chars/gin';
import { buildSuifeng, suifengProp } from './chars/suifeng';
import { buildKyoraku, kyorakuProp, type KyorakuForm } from './chars/kyoraku';
import { buildLilynette, buildStarrk, starrkProp, type StarrkForm } from './chars/starrk';
import { COLMILLO_STANCE, LILY_ARMED_STANCE, LILY_CLIPS, LILY_STANCE, LOBOS_STANCE, STARRK_CLIPS, STARRK_STANCE } from './chars/starrkClips';
import { KATEN_STANCE, KYORAKU_CLIPS, KYORAKU_STANCE } from './chars/kyorakuClips';
import { RAIKOBEN_STANCE, SHIKAI_STANCE as SUZUMEBACHI_STANCE, SUIFENG_CLIPS, SUIFENG_STANCE } from './chars/suifengClips';
import { GIN_CLIPS, GIN_STANCE } from './chars/ginClips';
import { GRIMMJOW_CLIPS, GRIMMJOW_STANCE, PANTERA_CLIPS, PANTERA_STANCE } from './chars/grimmjowClips';
import { KENPACHI_BANKAI_STANCE, KENPACHI_CLIPS, KENPACHI_SHIKAI_STANCE, KENPACHI_STANCE } from './chars/kenpachiClips';
import { MURCIELAGO_STANCE, SEGUNDA_STANCE, ULQUIORRA_CLIPS, ULQUIORRA_STANCE, ULQUIORRA_SWORD_STANCE } from './chars/ulquiorraClips';
import { AIZEN_CLIPS, AIZEN_STANCE, CHRYSALIS_STANCE } from './chars/aizenClips';
import { DAIGUREN_STANCE, HITSUGAYA_CLIPS, HITSUGAYA_SHEATHED_STANCE, HITSUGAYA_STANCE } from './chars/hitsugayaClips';
import { HIHIO_STANCE, RENJI_CLIPS, RENJI_STANCE } from './chars/renjiClips';
import { RUKIA_CLIPS, RUKIA_STANCE, TOGAME_STANCE } from './chars/rukiaClips';
import { CHAD_CLIPS, CHAD_STANCE, CHAD_TRUE_STANCE } from './chars/chadClips';
import { URYU_CLIPS, URYU_STANCE } from './chars/uryuClips';
import { YORUICHI_CLIPS, YORUICHI_STANCE } from './chars/yoruichiClips';
import { BENIHIME_STANCE, URAHARA_CLIPS, URAHARA_STANCE } from './chars/uraharaClips';
import { RYUJIN_STANCE, YAMAMOTO_BARE_STANCE, YAMAMOTO_CLIPS, YAMAMOTO_STANCE } from './chars/yamamotoClips';

const VIEWS: Record<string, [number, number, number, number, number, number]> = {
  // camera offset (x,y,z) and target (x,y,z) relative to the model origin
  front: [0, 1.05, 2.25, 0, 0.92, 0],
  three: [1.45, 1.2, 1.75, 0, 0.92, 0],
  side: [2.3, 1.05, 0, 0, 0.92, 0],
  back: [-0.9, 1.25, -2.1, 0, 0.95, 0],
  face: [0.22, 1.66, 0.62, 0, 1.6, 0],
  facefront: [0, 1.62, 0.6, 0, 1.62, 0],
  bust: [0.55, 1.5, 1.1, 0, 1.38, 0],
  feet: [0.6, 0.4, 1.1, 0, 0.2, 0],
  wide: [3.5, 2.2, 6.5, 0, 0.9, 0],
  mid: [2.6, 1.5, 2.9, 0, 0.85, 0],
  midfront: [0.4, 1.4, 3.6, 0, 0.85, 0],
};

export async function bootViewer(app: HTMLElement, params: URLSearchParams): Promise<void> {
  const quality = params.get('q') === 'low' ? QUALITY_LOW : QUALITY_HIGH;
  const world = generateStage();
  const eng = await Engine.create(app, world, quality);
  const form = (params.get('form') ?? 'shikai') as IchigoForm | 'pantera' | 'hollow';
  const who = params.get('char') ?? 'ichigo';
  const t0 = performance.now();
  const asset = who === 'menos' ? buildMenos(Number(params.get('seed') ?? 3)) : who === 'hollow' ? buildHollow({ seed: Number(params.get('seed') ?? 11) })
    : who === 'grimmjow' ? buildGrimmjow(form === 'pantera' ? 'pantera' : 'sealed') : who === 'byakuya' ? buildByakuya() : who === 'kenpachi' ? buildKenpachi(form === 'bankai' ? 'bankai' : 'sealed')
    : who === 'ulquiorra' ? buildUlquiorra((['murcielago', 'segunda'].includes(params.get('form') ?? '') ? params.get('form') : 'sealed') as UlquiorraForm)
    : who === 'aizen' ? buildAizen((['traitor', 'chrysalis'].includes(params.get('form') ?? '') ? params.get('form') : 'captain') as AizenForm)
    : who === 'hitsugaya' ? buildHitsugaya(form === 'bankai' ? 'bankai' : 'captain')
    : who === 'renji' ? buildRenji(form === 'bankai' ? 'bankai' : 'lieutenant')
    : who === 'rukia' ? buildRukia(form === 'bankai' ? 'bankai' : 'shinigami')
    : who === 'chad' ? buildChad((['gigante', 'true'].includes(params.get('form') ?? '') ? params.get('form') : 'human') as 'human' | 'gigante' | 'true')
    : who === 'uryu' ? buildUryu(params.get('form') === 'letzt' ? 'letzt' : 'quincy')
    : who === 'urahara' ? buildUrahara()
    : who === 'gin' ? buildGin(params.get('eyes') === 'open' ? 'open' : 'grin')
    : who === 'starrk' ? buildStarrk((['glove', 'lobos'].includes(params.get('form') ?? '') ? params.get('form') : 'sealed') as StarrkForm)
    : who === 'lilynette' ? buildLilynette()
    : who === 'kyoraku' ? buildKyoraku((['haori', 'shed'].includes(params.get('form') ?? '') ? params.get('form') : 'captain') as KyorakuForm)
    : who === 'suifeng' ? buildSuifeng(params.get('form') === 'shunko' || params.get('form') === 'bankai' ? 'keisen' : 'captain')
    : who === 'yamamoto' ? buildYamamoto(params.get('form') === 'stripped' ? 'stripped' : params.get('form') === 'tybw' ? 'tybw' : 'robed')
    : who === 'yoruichi' ? buildYoruichi((['shunko', 'raijin'].includes(params.get('form') ?? '') ? params.get('form') : 'standard') as YoruichiForm)
    : form === 'hollow' ? buildIchigoHollow()
    : buildIchigo(form === 'bankai' ? 'bankai' : 'shikai');
  const tModel = performance.now() - t0;
  const ch = new CharacterVisual(asset.model, asset.springs, asset.colliders);
  if (who === 'ichigo') ch.attach('sword', form === 'bankai' || form === 'hollow' ? buildTensaZangetsu() : buildZangetsuShikai(), 'grip.R');
  if (who === 'byakuya') {
    const f = params.get('form') ?? 'sealed';
    if (f === 'sealed') ch.attach('sword', byakuyaProp('katana'), 'grip.R');
    if (f === 'shikai') ch.attach('sword', byakuyaProp('hilt'), 'grip.R');
    ch.attach('sheath', byakuyaProp('sheath'), 'hip.L');
  }
  if (who === 'kenpachi') {
    const f = params.get('form') ?? 'sealed';
    ch.attach('sword', kenpachiProp(f === 'shikai' ? 'cleaver' : f === 'bankai' ? 'bankai-blade' : 'nozarashi'), 'grip.R');
    if (f !== 'bankai') ch.attach('sheath', kenpachiProp('saya'), 'hip.L');
    if (f === 'sealed' && params.get('patch') !== '0') ch.attach('patch', kenpachiProp('eyepatch'), 'patch');
    if (f === 'sealed' && params.get('rider') !== '0') ch.attach('rider', kenpachiProp('yachiru'), 'rider');
  }
  if (who === 'ulquiorra') {
    const f = params.get('form') ?? 'sealed';
    const d = params.get('drawn');
    if (f === 'sealed') {
      if (d) ch.attach('sword', ulquiorraProp('katana'), 'grip.R');
      ch.attach('sheath', ulquiorraProp(d ? 'sheath-empty' : 'sheath'), 'hip.L');
    } else if (d) ch.attach('sword', ulquiorraProp(f === 'segunda' ? 'lanza' : 'luz'), 'grip.R');
  }
  if (who === 'aizen') {
    const f = params.get('form') ?? 'captain';
    if (f === 'chrysalis') ch.attach('sword', aizenProp('fused'), 'grip.R', undefined, new THREE.Euler(...FUSED_ATTACH));
    else {
      ch.attach('sword', aizenProp('katana'), 'grip.R');
      ch.attach('sheath', aizenProp('sheath-empty'), 'hip.L');
      if (f === 'captain' && params.get('glasses') !== '0') ch.attach('glasses', aizenProp('glasses'), 'glasses');
    }
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible('palm.R', false);
  }
  if (who === 'hitsugaya') {
    const drawn = form === 'bankai' || !!params.get('drawn');
    if (drawn) ch.attach('sword', hitsugayaProp(form === 'bankai' ? 'bankai-sword' : 'sword'), 'grip.R');
    else ch.attach('sheath', hitsugayaProp('sheathed'), 'back');
    ch.rig.setBoneVisible(drawn ? 'palm.R' : 'fist.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'renji') {
    // sealed: the katana; shikai: the hilt with the six segments assembled on it; bankai: the bone handle
    const f = params.get('form') ?? 'sealed';
    if (f === 'shikai') {
      ch.attach('sword', renjiProp('hilt'), 'grip.R');
      let z = SEGMENT_BASE;
      SEGMENT_LEN.forEach((len, i) => {
        ch.attach(`seg${i}`, renjiProp(`seg${i}` as RenjiProp), 'grip.R', new THREE.Vector3(0, 0, z));
        z += len;
      });
    } else ch.attach('sword', renjiProp(f === 'bankai' ? 'handle' : 'katana'), 'grip.R');
    ch.attach('sheath', renjiProp('sheath-empty'), 'hip.L');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'rukia') {
    const f = params.get('form') ?? 'sealed';
    ch.attach('sword', rukiaProp(f === 'bankai' ? 'bankai-sword' : f === 'shikai' ? 'shikai' : 'katana'), 'grip.R');
    ch.attach('sheath', rukiaProp('sheath-empty'), 'hip.L');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'chad') {
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('palm.L', false);
  }
  if (who === 'suifeng') {
    // captain | shunko (no haori) | shikai | bankai
    const f = params.get('form') ?? 'captain';
    if (f === 'bankai') {
      ch.attach('sword', suifengProp('launcher'), 'arm.R');
      ch.attach('guard', suifengProp('guard'), 'face');
    } else ch.attach('sword', suifengProp(f === 'shikai' ? 'gauntlet' : 'sword'), f === 'shikai' ? 'arm.R' : 'grip.R');
    if (f === 'captain' || f === 'shunko') ch.attach('sheath', suifengProp('sheath'), 'waist.back');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'kyoraku') {
    // captain | haori | shed (the outfits, sealed) | shikai | bankai (the scimitars, in the captain outfit)
    const f = params.get('form') ?? 'captain';
    const dual = f === 'shikai' || f === 'bankai';
    ch.attach('sword', kyorakuProp(dual ? 'katen' : 'tachi'), 'grip.R');
    if (dual) ch.attach('sword2', kyorakuProp('kyokotsu'), 'grip.L');
    else ch.attach('waki', kyorakuProp('waki'), 'hip.L2', new THREE.Vector3(0, 0, -6.3 / 48));
    ch.attach('saya', kyorakuProp('sayaT'), 'hip.L');
    ch.attach('saya2', kyorakuProp('sayaW'), 'hip.L2');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible(dual ? 'palm.L' : 'fist.L', false);
  }
  if (who === 'starrk') {
    // sealed | glove (the left glove off) | lobos (the pistols; colmillo=1 puts Colmillo in the right hand); drawn=0 sheathes the katana
    const f = params.get('form') ?? 'sealed';
    if (f === 'lobos') {
      ch.attach('gunR', starrkProp(params.get('colmillo') ? 'colmillo' : 'gunR'), 'grip.R');
      ch.attach('gunL', starrkProp('gunL'), 'grip.L');
      ch.rig.setBoneVisible('palm.R', false);
      ch.rig.setBoneVisible('palm.L', false);
    } else {
      const drawn = params.get('drawn') !== '0';
      if (drawn) ch.attach('sword', starrkProp('katana'), 'grip.R');
      ch.attach('sheath', starrkProp(drawn ? 'sheath-empty' : 'sheath'), 'hip.L');
      ch.rig.setBoneVisible(drawn ? 'palm.R' : 'fist.R', false);
      ch.rig.setBoneVisible('fist.L', false);
    }
  }
  if (who === 'lilynette') {
    // fists on her hips; drawn=1 puts her scimitar in her hand
    if (params.get('drawn')) ch.attach('sword', starrkProp('lilyBlade'), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('palm.L', false);
  }
  if (who === 'gin') {
    ch.attach('sword', ginProp(), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'yamamoto') {
    // robed (cane) | stripped (bare-handed, the cane in the belt) | shikai (Ryūjin Jakka) | tybw (Zanka no Tachi)
    const f = params.get('form') ?? 'robed';
    if (f === 'stripped') ch.attach('cane', yamamotoProp('cane'), 'hip.L');
    else ch.attach('sword', yamamotoProp(f === 'tybw' ? 'bankai' : f === 'shikai' ? 'katana' : 'cane'), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', f === 'stripped');
    ch.rig.setBoneVisible('palm.L', f !== 'stripped');
  }
  if (who === 'urahara') {
    const f = params.get('form') ?? 'sealed';
    ch.attach('sword', uraharaProp(f === 'shikai' ? 'shikai' : f === 'bankai' ? 'cane-blade' : 'cane'), 'grip.R');
    // the fan is in his left hand while sealed (fan=0 hides it, fan=1 adds it to the other forms)
    if ((params.get('fan') ?? (f === 'sealed' ? '1' : '0')) !== '0') ch.attach('fan', uraharaProp('fan'), 'palm.L');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'yoruichi') {
    ch.rig.setBoneVisible('fist.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'uryu') {
    if (params.get('glasses') !== '0') ch.attach('glasses', uryuProp('glasses'), 'glasses');
    ch.attach('cross', uryuProp('cross'), 'wrist.R');
    if (params.get('seele')) ch.attach('seele', uryuProp('seele'), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('palm.L', false);
  }
  if (who === 'grimmjow' && form !== 'pantera') {
    if (params.get('drawn')) ch.attach('sword', grimmjowProp('katana'), 'grip.R');
    ch.attach('sheath', grimmjowProp(params.get('drawn') ? 'sheath-empty' : 'sheath'), 'hip.L');
  }
  const setMask = (m: string | null) => {
    ch.detach('mask');
    const on = who === 'ichigo' && !!m && m !== '0';
    if (who === 'ichigo') ch.rig.setBoneVisible('bangs', !on);
    const cracked = hollowMaskShatter().cracked;
    if (on) ch.attach('mask', m === 'cracked' ? cracked[cracked.length - 1] : m === 'cracked0' ? cracked[0] : hollowMask(), 'face');
  };
  setMask(params.get('mask'));
  // body scale (close-ups) and full-view scale (released wings widen the full views)
  const bodyScale = who === 'menos' ? 20 : who === 'hollow' ? 1.45 : who === 'kenpachi' ? 1.16 : who === 'hitsugaya' ? 0.8 : who === 'aizen' ? 1.03 : who === 'renji' ? 1.05 : who === 'rukia' ? 0.82 : who === 'chad' ? 1.1 : who === 'yoruichi' ? 0.9 : who === 'urahara' ? 1.08 : who === 'yamamoto' ? 0.9 : who === 'gin' ? 1.06 : who === 'suifeng' ? 0.84 : who === 'kyoraku' ? 1.12 : who === 'starrk' ? 1.06 : who === 'lilynette' ? 0.8 : 1;
  const viewScale = who === 'ulquiorra' && params.get('form') && params.get('form') !== 'sealed' ? 1.7 : who === 'hitsugaya' && form === 'bankai' ? 1.7 : bodyScale;
  const origin = new THREE.Vector3(16, 2, 16);
  ch.object.position.copy(origin);
  eng.gr.scene.add(ch.object);
  const pose = new Pose(ch.rig.count);
  const aura = new Aura(ch, form === 'bankai' ? AURA_ICHIGO_BANKAI : AURA_ICHIGO_SHIKAI, eng.glow);
  aura.target = Number(params.get('aura') ?? 0);
  aura.level = aura.target;
  eng.gr.scene.add(aura.group);
  let auraT = 0;
  const cam = eng.gr.camera;
  let yaw = Number(params.get('yaw') ?? 0);
  let view = params.get('view') ?? 'three';
  const setView = (name: string) => {
    view = name;
    // close-ups frame the head: scale by body height only
    const close = name.startsWith('face') || name === 'bust';
    const k = close ? bodyScale : viewScale;
    const v = (VIEWS[name] ?? VIEWS.three).map((c) => c * k);
    cam.position.set(origin.x + v[0], origin.y + v[1], origin.z + v[2]);
    cam.lookAt(origin.x + v[3], origin.y + v[4], origin.z + v[5]);
  };
  setView(view);
  const poses: Record<string, (p: Pose) => void> = {
    rest: (p) => p.identity(),
    idle: (p) => {
      p.identity();
      const r = ch.rig;
      p.setEuler(r.index('upperarm.L'), 4, 0, 9);
      p.setEuler(r.index('upperarm.R'), -12, 0, -10);
      p.setEuler(r.index('forearm.L'), -12, 0, 0);
      p.setEuler(r.index('forearm.R'), -35, 0, 0);
      p.setEuler(r.index('hand.R'), 20, 0, 0);
      p.setEuler(r.index('thigh.L'), -4, 0, 3);
      p.setEuler(r.index('thigh.R'), 5, 0, -3);
      p.setEuler(r.index('shin.R'), 8, 0, 0);
      p.setEuler(r.index('head'), 4, -6, 0);
    },
    tpose: (p) => {
      p.identity();
      p.setEuler(ch.rig.index('upperarm.L'), 0, 0, 90);
      p.setEuler(ch.rig.index('upperarm.R'), 0, 0, -90);
    },
    swing: (p) => {
      p.identity();
      const r = ch.rig;
      p.setEuler(r.index('upperarm.R'), -150, 0, -20);
      p.setEuler(r.index('forearm.R'), -30, 0, 0);
      p.setEuler(r.index('upperarm.L'), -120, 0, 25);
      p.setEuler(r.index('forearm.L'), -40, 0, 0);
      p.setEuler(r.index('chest'), -8, 15, 0);
      p.setEuler(r.index('thigh.L'), -35, 0, 5);
      p.setEuler(r.index('shin.L'), 40, 0, 0);
      p.setEuler(r.index('thigh.R'), 20, 0, -5);
      p.setEuler(r.index('shin.R'), 25, 0, 0);
      p.hips.set(0, -0.08, 0);
    },
  };
  let poseName = params.get('pose') ?? 'anim';
  const pantera = who === 'grimmjow' && form === 'pantera';
  const kpForm = params.get('form') ?? 'sealed';
  const kpStance = kpForm === 'shikai' ? KENPACHI_SHIKAI_STANCE : kpForm === 'bankai' ? KENPACHI_BANKAI_STANCE : KENPACHI_STANCE;
  const uqStance = kpForm === 'murcielago' ? MURCIELAGO_STANCE : kpForm === 'segunda' ? SEGUNDA_STANCE : params.get('drawn') ? ULQUIORRA_SWORD_STANCE : ULQUIORRA_STANCE;
  const azStance = kpForm === 'chrysalis' ? CHRYSALIS_STANCE : AIZEN_STANCE;
  const hgStance = form === 'bankai' ? DAIGUREN_STANCE : params.get('drawn') ? HITSUGAYA_STANCE : HITSUGAYA_SHEATHED_STANCE;
  const rjStance = form === 'bankai' ? HIHIO_STANCE : RENJI_STANCE;
  const rkStance = form === 'bankai' ? TOGAME_STANCE : RUKIA_STANCE;
  const chStance = kpForm === 'true' ? CHAD_TRUE_STANCE : CHAD_STANCE;
  const anim = new Animator(ch.rig, who === 'menos' ? MENOS_STANCE : who === 'hollow' ? HOLLOW_STANCE : who === 'grimmjow' ? (pantera ? PANTERA_STANCE : GRIMMJOW_STANCE) : who === 'kenpachi' ? kpStance : who === 'ulquiorra' ? uqStance : who === 'aizen' ? azStance : who === 'hitsugaya' ? hgStance : who === 'renji' ? rjStance : who === 'rukia' ? rkStance : who === 'chad' ? chStance : who === 'uryu' ? URYU_STANCE : who === 'yoruichi' ? YORUICHI_STANCE : who === 'urahara' ? (kpForm === 'sealed' ? URAHARA_STANCE : BENIHIME_STANCE) : who === 'yamamoto' ? (kpForm === 'stripped' ? YAMAMOTO_BARE_STANCE : kpForm === 'shikai' || kpForm === 'tybw' ? RYUJIN_STANCE : YAMAMOTO_STANCE) : form === 'hollow' ? VASTO_STANCE : who === 'gin' ? GIN_STANCE : who === 'kyoraku' ? (kpForm === 'shikai' || kpForm === 'bankai' ? KATEN_STANCE : KYORAKU_STANCE) : who === 'starrk' ? (kpForm === 'lobos' ? (params.get('colmillo') ? COLMILLO_STANCE : LOBOS_STANCE) : STARRK_STANCE) : who === 'lilynette' ? (params.get('drawn') ? LILY_ARMED_STANCE : LILY_STANCE) : who === 'suifeng' ? (kpForm === 'bankai' ? RAIKOBEN_STANCE : kpForm === 'shikai' ? SUZUMEBACHI_STANCE : SUIFENG_STANCE) : ICHIGO_STANCE, ch.springs);
  anim.register(who === 'menos' ? MENOS_CLIPS : who === 'hollow' ? HOLLOW_CLIPS : who === 'grimmjow' ? (pantera ? PANTERA_CLIPS : GRIMMJOW_CLIPS) : who === 'kenpachi' ? KENPACHI_CLIPS : who === 'ulquiorra' ? ULQUIORRA_CLIPS : who === 'aizen' ? AIZEN_CLIPS : who === 'hitsugaya' ? HITSUGAYA_CLIPS : who === 'renji' ? RENJI_CLIPS : who === 'rukia' ? RUKIA_CLIPS : who === 'chad' ? CHAD_CLIPS : who === 'uryu' ? URYU_CLIPS : who === 'yoruichi' ? YORUICHI_CLIPS : who === 'urahara' ? URAHARA_CLIPS : who === 'yamamoto' ? YAMAMOTO_CLIPS : form === 'hollow' ? VASTO_CLIPS : who === 'gin' ? GIN_CLIPS : who === 'kyoraku' ? KYORAKU_CLIPS : who === 'starrk' ? STARRK_CLIPS : who === 'lilynette' ? LILY_CLIPS : who === 'suifeng' ? SUIFENG_CLIPS : ICHIGO_CLIPS);
  const loco = { vx: 0, vz: 0, vy: 0, grounded: true, turn: 0, accel: 0 };
  eng.systems.push({ update: (dt) => anim.update(dt, loco) });
  const applyPose = (dt: number) => {
    ch.object.rotation.y = (yaw * Math.PI) / 180;
    if (poseName === 'anim') {
      ch.object.updateMatrixWorld(true);
      anim.apply(dt);
      return;
    }
    (poses[poseName] ?? poses.idle)(pose);
    ch.rig.applyPose(pose);
    ch.object.updateMatrixWorld(true);
    ch.springs.update(dt);
  };
  applyPose(0);
  eng.renderHooks.push((dt) => {
    applyPose(dt);
    auraT += dt;
    aura.update(dt, auraT);
    eng.gr.updateSun(origin.clone().add(new THREE.Vector3(0, 1, 0)));
  });
  document.getElementById('boot')?.remove();
  eng.start();
  (window as unknown as { __reishi: unknown }).__reishi = {
    ready: () => eng.pendingWork === 0 && eng.frames > 2,
    stats: () => ({ modelMs: Math.round(tModel), meshMs: Math.round(ch.stats.buildMs), voxels: ch.stats.voxels, tris: ch.stats.triangles, warnings: asset.warnings }),
    view: setView,
    yaw: (d: number) => { yaw = d; },
    pose: (n: string) => { poseName = n; },
    play: (n: string, loop = false) => {
      poseName = 'anim';
      const go = () => anim.play(n, { onEnd: loop ? () => setTimeout(go, 300) : undefined });
      go();
    },
    /** freeze clip n at time t (seconds) for inspection */
    scrub: (n: string, t: number) => {
      poseName = 'anim';
      anim.stopAll(0);
      for (const a of anim.active) a.done = true;
      anim.active.length = 0;
      const inst = anim.play(n, { fadeIn: 0, hold: true });
      if (inst) { inst.time = t; inst.speed = 0; inst.weight = 1; }
    },
    move: (vz: number, vx = 0, grounded = true, vy = 0) => {
      poseName = 'anim';
      anim.stopAll(0.05);
      Object.assign(loco, { vz, vx, grounded, vy });
    },
    animator: anim,
    aura: (lv: number) => { aura.target = lv; aura.level = lv; },
    pillar: () => aura.pillarBurst(3),
    /** '1' | 'cracked0' | 'cracked' | '0' */
    mask: (m: string) => setMask(m),
    engine: eng,
    character: ch,
    get currentView() { return view; },
  };
}
