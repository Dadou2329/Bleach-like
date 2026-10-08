// Model / animation review mode: ?mode=model&char=ichigo[&form=bankai][&mask=1|cracked][&view=front|three|side|back|face]
// Exposes window.__reishi.view(name), .yaw(deg), .pose(name), .play(clip) for scripted screenshots.
import * as THREE from 'three';
import { Engine } from './engine';
import { generateStage } from './maps/stage';
import { QUALITY_HIGH, QUALITY_LOW } from './render/renderer';
import { CharacterVisual, PropMesh } from './game/characterFactory';
import { buildIchigo, buildTensaZangetsu, buildZangetsuShikai, hollowMask, hollowMaskShatter, type IchigoForm } from './chars/ichigo';
import { buildIchigoHollow } from './chars/ichigoHollow';
import { VASTO_CLIPS, VASTO_STANCE } from './chars/ichigoHollowClips';
import { Pose } from './anim/pose';
import { Animator } from './anim/animator';
import { ICHIGO_CLIPS, ICHIGO_STANCE } from './chars/ichigoClips';
import { buildIsshin, isshinProp } from './chars/isshin';
import { ISSHIN_CLIPS, ISSHIN_DOCTOR_CLIPS, ISSHIN_DOCTOR_STANCE, ISSHIN_STANCE } from './chars/isshinClips';
import { HOLLOW_ICHIGO_CLIPS, HOLLOW_ICHIGO_EXTRA_VASTO, HOLLOW_ICHIGO_STANCE } from './chars/hollowIchigoClips';
import { buildNelliel, nelProp, type NelForm } from './chars/nelliel';
import { CREST_SLICES, buildIkkaku, ikkakuCrestSlice, ikkakuProp } from './chars/ikkaku';
import { buildRangiku, rangikuProp } from './chars/rangiku';
import { buildHisagi, hisagiProp } from './chars/hisagi';
import { HISAGI_CLIPS, HISAGI_STANCE, KAZESHINI_CLIPS, KAZESHINI_STANCE } from './chars/hisagiClips';
import { buildKira, kiraProp } from './chars/kira';
import { KIRA_CLIPS, KIRA_STANCE, WABISUKE_CLIPS, WABISUKE_STANCE } from './chars/kiraClips';
import { buildYumichika, yumichikaProp } from './chars/yumichika';
import { buildMomo, momoProp } from './chars/momo';
import { buildSzayel, szayelProp } from './chars/szayel';
import { buildApe, buildIra, buildYammy, yammyProp } from './chars/yammy';
import { APE_CLIPS, APE_STANCE, IRA_CLIPS, IRA_STANCE, YAMMY_CLIPS, YAMMY_STANCE } from './chars/yammyClips';
import { MOMO_CLIPS, MOMO_STANCE, TOBIUME_CLIPS } from './chars/momoClips';
import { FUJI_CLIPS, FUJI_STANCE, RURI_CLIPS, RURI_STANCE, YUMICHIKA_CLIPS, YUMICHIKA_STANCE } from './chars/yumichikaClips';
import { HAINEKO_CLIPS, HAINEKO_STANCE, RANGIKU_CLIPS, RANGIKU_STANCE } from './chars/rangikuClips';
import { HOZUKIMARU_CLIPS, HOZUKIMARU_STANCE, IKKAKU_CLIPS, IKKAKU_STANCE, RYUMON_CLIPS, RYUMON_STANCE } from './chars/ikkakuClips';
import { GAMUZA_CLIPS, GAMUZA_STANCE, NEL_CHILD_CLIPS, NEL_CHILD_STANCE, NEL_CLIPS, NEL_STANCE } from './chars/nellielClips';
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
import { buildUkitake, ukitakeProp } from './chars/ukitake';
import { buildHarribel, harribelProp, type HarribelForm } from './chars/harribel';
import { HARRIBEL_CLIPS, HARRIBEL_STANCE, TIBURON_STANCE } from './chars/harribelClips';
import { buildNnoitra, nnoitraProp, type NnoitraForm } from './chars/nnoitra';
import { baragganProp, buildBaraggan } from './chars/baraggan';
import { buildGiant, buildKomamura, komamuraProp } from './chars/komamura';
import { buildTosen, tosenProp } from './chars/tosen';
import { buildGrillo } from './chars/tosenGrillo';
import { ARROGANTE_STANCE, BARAGGAN_CLIPS, BARAGGAN_STANCE } from './chars/baragganClips';
import { KOMAMURA_CLIPS, KOMAMURA_STANCE } from './chars/komamuraClips';
import { TOSEN_CLIPS, TOSEN_STANCE } from './chars/tosenClips';
import { buildOrihime, rikkaFairy, type FairyName } from './chars/orihime';
import { ORIHIME_CLIPS, ORIHIME_STANCE } from './chars/orihimeClips';
import { buildMayuri, mayuriProp } from './chars/mayuri';
import { buildJizo } from './chars/mayuriBankai';
import { MAYURI_CLIPS, MAYURI_STANCE } from './chars/mayuriClips';
import { buildUnohana, unohanaProp } from './chars/unohana';
import { buildManta } from './chars/unohanaMinazuki';
import { SAKANADE_RING_Z, buildShinji, shinjiProp } from './chars/shinji';
import { buildYhwach, yhwachProp, type YhwachForm } from './chars/yhwach';
import { YHWACH_BLACK_STANCE, YHWACH_CLIPS, YHWACH_STANCE } from './chars/yhwachClips';
import { FLOWER_PETALS, buildFlower, petalAzimuth } from './chars/shinjiFlower';
import { UNOHANA_CLIPS, UNOHANA_STANCE, YACHIRU_STANCE } from './chars/unohanaClips';
import { SAKANADE_STANCE, SHINJI_CLIPS, SHINJI_STANCE } from './chars/shinjiClips';
import { NNOITRA_CLIPS, NNOITRA_STANCE, SANTA_STANCE } from './chars/nnoitraClips';
import { SOGYO_STANCE, UKITAKE_CLIPS, UKITAKE_STANCE } from './chars/ukitakeClips';
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
    : who === 'ukitake' ? buildUkitake()
    : who === 'komamura' ? (params.get('form') === 'giant' ? buildGiant() : params.get('form') === 'limbs' ? buildGiant('limbs') : buildKomamura())
    : who === 'tosen' ? (params.get('form') === 'grillo' ? buildGrillo() : buildTosen(params.get('form') === 'masked' ? 'masked' : 'traitor'))
    : who === 'orihime' ? buildOrihime(params.get('form') === 'rokuten' ? 'rokuten' : 'hueco')
    : who === 'mayuri' ? (params.get('form') === 'bankai' ? buildJizo() : buildMayuri())
    : who === 'shinji' ? (params.get('form') === 'flower' ? buildFlower() : buildShinji())
    : who === 'yhwach' ? buildYhwach((['almighty', 'soulking'].includes(params.get('form') ?? '') ? params.get('form') : 'emperor') as YhwachForm)
    : who === 'unohana' ? (params.get('form') === 'shikai' ? buildManta() : buildUnohana(params.get('form') === 'yachiru' || params.get('form') === 'bankai' ? 'yachiru' : 'retsu'))
    : who === 'baraggan' ? buildBaraggan(params.get('form') === 'arrogante' ? 'arrogante' : 'sealed')
    : who === 'nnoitra' ? buildNnoitra((['patch', 'santa'].includes(params.get('form') ?? '') ? params.get('form') : 'sealed') as NnoitraForm)
    : who === 'harribel' ? buildHarribel((['unzipped', 'tiburon'].includes(params.get('form') ?? '') ? params.get('form') : 'sealed') as HarribelForm)
    : who === 'kyoraku' ? buildKyoraku((['haori', 'shed'].includes(params.get('form') ?? '') ? params.get('form') : 'captain') as KyorakuForm)
    : who === 'suifeng' ? buildSuifeng(params.get('form') === 'shunko' || params.get('form') === 'bankai' ? 'keisen' : 'captain')
    : who === 'yamamoto' ? buildYamamoto(params.get('form') === 'stripped' ? 'stripped' : params.get('form') === 'tybw' ? 'tybw' : 'robed')
    : who === 'yoruichi' ? buildYoruichi((['shunko', 'raijin'].includes(params.get('form') ?? '') ? params.get('form') : 'standard') as YoruichiForm)
    : who === 'hollowichigo' ? (form === 'hollow' ? buildIchigoHollow(true) : buildIchigo(form === 'bankai' ? 'bankai' : 'shikai', 'white'))
    : who === 'isshin' ? buildIsshin(params.get('form') === 'doctor' ? 'doctor' : 'shinigami')
    : who === 'ikkaku' ? buildIkkaku()
    : who === 'rangiku' ? buildRangiku()
    : who === 'hisagi' ? buildHisagi()
    : who === 'kira' ? buildKira()
    : who === 'yumichika' ? buildYumichika()
    : who === 'momo' ? buildMomo()
    : who === 'szayel' ? buildSzayel(params.get('form') === 'fornicaras' ? 'fornicaras' : 'sealed')
    : who === 'yammy' ? (params.get('form') === 'ira' ? buildIra() : params.get('form') === 'ape' ? buildApe() : buildYammy())
    : who === 'nelliel' ? buildNelliel((['child', 'gamuza'].includes(params.get('form') ?? '') ? params.get('form') : 'adult') as NelForm)
    : form === 'hollow' ? buildIchigoHollow()
    : buildIchigo(form === 'bankai' ? 'bankai' : 'shikai');
  const tModel = performance.now() - t0;
  const ch = new CharacterVisual(asset.model, asset.springs, asset.colliders);
  if (who === 'ichigo') ch.attach('sword', form === 'bankai' || form === 'hollow' ? buildTensaZangetsu() : buildZangetsuShikai(), 'grip.R');
  if (who === 'isshin' && params.get('form') !== 'doctor') {
    const drawn = params.get('drawn') !== '0';
    if (drawn) ch.attach('sword', isshinProp('engetsu'), 'grip.R');
    ch.attach('sheath', isshinProp('saya'), 'hip.L');
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible(drawn ? 'palm.R' : 'fist.R', false);
  }
  if (who === 'isshin' && params.get('form') === 'doctor') {
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible('fist.R', false);
  }
  if (who === 'ikkaku') {
    const f = params.get('form') ?? 'sealed';
    if (f === 'sealed') {
      ch.attach('sword', ikkakuProp('katana'), 'grip.R');
      ch.attach('sheath', ikkakuProp('sheath'), 'grip.L');
    } else if (f === 'shikai') ch.attach('sword', ikkakuProp(params.get('split') ? 'staff' : 'spear'), 'grip.R');
    else {
      ch.attach('sword', ikkakuProp('guandao'), 'grip.R');
      ch.attach('spade', ikkakuProp('spade'), 'grip.L');
      const c = ch.attach('center', ikkakuProp('center'), 'back', new THREE.Vector3(0, 0.25, -0.35), new THREE.Euler(0, Math.PI, 0));
      // the crest in its slices, filled to &crest= (0…1) the way the kit lights them
      const fill = Number(params.get('crest') ?? 0);
      for (let i = 0; i < CREST_SLICES; i++) {
        const m = new PropMesh(ikkakuCrestSlice(i));
        const k = Math.max(0, Math.min(1, fill * CREST_SLICES - i));
        const col = new THREE.Color(fill >= 1 ? '#FF3B3B' : '#C3141F').multiplyScalar(fill >= 1 ? 2.2 : 1);
        if (k > 0) m.material.userData.uniforms.uEnergy.value.set(col.r, col.g, col.b, fill >= 1 ? 1 : 0.3 + 0.7 * k);
        c.add(m);
      }
    }
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('palm.L', false);
  }
  if (who === 'rangiku') {
    const shikai = params.get('form') === 'shikai';
    ch.attach('sword', rangikuProp(shikai ? 'hilt' : 'katana'), 'grip.R');
    ch.attach('saya', rangikuProp('saya'), 'obi.back');
    if (!shikai && params.get('seal') !== '0') ch.attach('seal', rangikuProp('seal'), 'chest.front');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'hisagi') {
    const hf = params.get('form');
    if (hf === 'shikai' || hf === 'bankai') {
      ch.attach('sword', hisagiProp('sickle'), 'grip.R');
      ch.attach('sickleL', hisagiProp('sickle'), 'grip.L');
    } else {
      ch.attach('sword', hisagiProp('katana'), 'grip.R');
      ch.rig.setBoneVisible('fist.L', false);
    }
    ch.attach('saya', hisagiProp('saya'), 'hip.L');
    ch.attach('tattoo', hisagiProp('tattoo'), 'cheek.L');
    if (hf === 'bankai') ch.attach('orb', hisagiProp('orb'), 'back', new THREE.Vector3(0, 1.6, -0.3));
    // both fists hold a sickle in the Shikai; sealed, the left hand is open
    ch.rig.setBoneVisible('palm.L', hf !== 'shikai' && hf !== 'bankai');
    ch.rig.setBoneVisible('palm.R', false);
  }
  if (who === 'yammy' && !params.get('form')) {
    ch.attach('saya', yammyProp('sheath'), 'hip.L');
    for (const k of ['fist.L', 'fist.R']) ch.rig.setBoneVisible(k, false);
  }
  if (who === 'szayel') {
    if (params.get('form') !== 'fornicaras') {
      ch.attach('sword', szayelProp('katana'), 'grip.R');
      ch.attach('saya', szayelProp('sheath-empty'), 'hip.L');
      ch.rig.setBoneVisible('palm.R', false);
    } else ch.rig.setBoneVisible('fist.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'momo') {
    ch.attach('sword', momoProp(params.get('form') === 'shikai' ? 'tobiume' : 'katana'), 'grip.R');
    ch.attach('saya', momoProp('saya'), 'hip.L');
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible('palm.R', false);
  }
  if (who === 'yumichika') {
    const yf = params.get('form');
    ch.attach('sword', yumichikaProp(yf === 'fuji' ? 'fuji' : yf === 'ruri' ? 'ruri' : 'katana'), 'grip.R');
    ch.attach('saya', yumichikaProp('saya'), 'hip.L');
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible('palm.R', false);
  }
  if (who === 'kira') {
    ch.attach('sword', kiraProp(params.get('form') === 'shikai' ? 'wabisuke' : 'katana'), 'grip.R');
    ch.attach('saya', kiraProp('saya'), 'hip.L');
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible('palm.R', false);
  }
  if (who === 'nelliel') {
    const nf = params.get('form') ?? 'adult';
    if (nf !== 'child' && params.get('drawn') !== '0') ch.attach('sword', nelProp(nf === 'gamuza' ? 'lance' : 'gamuza'), 'grip.R');
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible(nf === 'child' ? 'fist.R' : 'palm.R', false);
  }
  if (who === 'hollowichigo') {
    if (params.get('drawn') !== '0') ch.attach('sword', form === 'bankai' || form === 'hollow' ? buildTensaZangetsu(true) : buildZangetsuShikai(true), 'grip.R');
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible('palm.R', false);
  }
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
  if (who === 'ukitake') {
    // sealed (drawn=0 sheathes the katana) | shikai (Sōgyo no Kotowari in both hands)
    const f = params.get('form') ?? 'sealed';
    const drawn = f === 'shikai' || params.get('drawn') !== '0';
    if (f === 'shikai') {
      ch.attach('sword', ukitakeProp('sogyo'), 'grip.R');
      ch.attach('sword2', ukitakeProp('sogyo'), 'grip.L');
    } else if (drawn) ch.attach('sword', ukitakeProp('katana'), 'grip.R');
    ch.attach('sheath', ukitakeProp(drawn ? 'sheath-empty' : 'sheath'), 'hip.L');
    ch.rig.setBoneVisible(drawn ? 'palm.R' : 'fist.R', false);
    ch.rig.setBoneVisible(f === 'shikai' ? 'palm.L' : 'fist.L', false);
  }
  if (who === 'tosen' && params.get('form') !== 'grillo') {
    // traitor | masked | grillo; drawn=0 sheathes Suzumushi
    const drawn = params.get('drawn') !== '0';
    if (drawn) ch.attach('sword', tosenProp('suzumushi'), 'grip.R');
    ch.attach('sheath', tosenProp(drawn ? 'sheath-empty' : 'sheath'), 'hip.L');
    ch.rig.setBoneVisible(drawn ? 'palm.R' : 'fist.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'mayuri' && params.get('form') !== 'bankai') {
    // sealed | shikai (the trident in his hand) | bankai (Konjiki Ashisogi Jizō on its own); the sheath hangs before him
    const shikai = params.get('form') === 'shikai';
    ch.attach('sword', mayuriProp(shikai ? 'trident' : 'sword'), 'grip.R');
    ch.attach('sheath', mayuriProp('sheath-empty'), 'front');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'yhwach') {
    // emperor | almighty | soulking (the many-eyed mask on); broad=1 the Reishi broadsword instead of the sword
    ch.attach('sword', yhwachProp(params.get('broad') ? 'broadsword' : 'sword'), 'grip.R');
    if (params.get('form') === 'soulking') ch.attach('mask', yhwachProp('mask'), 'face');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'shinji' && params.get('form') !== 'flower') {
    // sealed (the katana in the fist) | shikai | bankai (the ring sword hanging from the index finger, see the
    // system below; spin=angle, turn=1 keeps it turning); mask=1 puts the Hollow mask on
    const f = params.get('form');
    const ring = f === 'shikai' || f === 'bankai';
    ch.attach('sword', shinjiProp(f === 'shikai' ? 'shikai' : f === 'bankai' ? 'bankai' : 'katana'), ring ? 'finger.R' : 'grip.R');
    if (params.get('mask')) ch.attach('mask', shinjiProp('mask'), 'face');
    ch.rig.setBoneVisible(ring ? 'fist.R' : 'palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'unohana' && params.get('form') !== 'shikai') {
    // retsu | yachiru | bankai (Yachiru with the blood-wet blade); drawn=0 sheathes Minazuki at her left hip
    const drawn = params.get('drawn') !== '0';
    if (drawn) ch.attach('sword', unohanaProp(params.get('form') === 'bankai' ? 'bankai' : 'nodachi'), 'grip.R');
    ch.attach('sheath', unohanaProp(drawn ? 'sheath-empty' : 'sheath'), 'hip.L');
    ch.rig.setBoneVisible(drawn ? 'palm.R' : 'fist.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'orihime') {
    // hueco | rokuten; fairies=1 lines up the six Rikka at four times their size in front of her
    ch.rig.setBoneVisible('fist.R', false);
    ch.rig.setBoneVisible('fist.L', false);
    if (params.get('fairies')) {
      (['tsubaki', 'ayame', 'shuno', 'hinagiku', 'lily', 'baigon'] as FairyName[]).forEach((n, i) => {
        const m = new PropMesh(rikkaFairy(n));
        m.scale.setScalar(4);
        m.position.set(16 - 1.0 + i * 0.4, 2, 16 + 0.55);
        eng.gr.scene.add(m);
      });
    }
  }
  if (who === 'komamura') {
    // the captain with Tenken | giant (the Bankai, at his own size: the game scales it up)
    const giant = params.get('form') === 'giant';
    ch.attach('sword', komamuraProp(giant ? 'giantSword' : 'tenken'), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'baraggan') {
    // sealed (Arrogante in his right hand) | arrogante (Gran Caída)
    const rel = params.get('form') === 'arrogante';
    ch.attach('sword', baragganProp(rel ? 'granCaida' : 'arrogante'), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'nnoitra') {
    // sealed | patch (the eyepatch off) — Santa Teresa in his right hand; santa — a scythe in each of four hands
    const f = params.get('form') ?? 'sealed';
    if (f === 'santa') {
      ch.attach('sword', nnoitraProp('scythe'), 'grip.R');
      ch.attach('scythe2', nnoitraProp('scythe'), 'grip.L');
      ch.attach('scythe3', nnoitraProp('scythe'), 'grip2.R');
      ch.attach('scythe4', nnoitraProp('scythe'), 'grip2.L');
      for (const h of ['palm.R', 'palm.L', 'palm2.R', 'palm2.L']) ch.rig.setBoneVisible(h, false);
    } else {
      ch.attach('sword', nnoitraProp('teresa'), 'grip.R');
      ch.rig.setBoneVisible('palm.R', false);
      ch.rig.setBoneVisible('fist.L', false);
    }
  }
  if (who === 'harribel') {
    // sealed | unzipped (drawn=0 keeps Tiburón across her back) | tiburon (the pata on her right hand)
    const f = params.get('form') ?? 'sealed';
    if (f === 'tiburon') {
      ch.attach('sword', harribelProp('pata'), 'grip.R');
      ch.rig.setBoneVisible('palm.R', false);
      ch.rig.setBoneVisible('fist.L', false);
    } else {
      const drawn = params.get('drawn') !== '0';
      if (drawn) ch.attach('sword', harribelProp('tiburon'), 'grip.R');
      ch.attach('sheath', harribelProp(drawn ? 'sheath-empty' : 'sheath'), 'back');
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
    // other characters attach their own masks above
    if (who !== 'ichigo') return;
    ch.detach('mask');
    const on = who === 'ichigo' && !!m && m !== '0';
    if (who === 'ichigo') ch.rig.setBoneVisible('bangs', !on);
    const cracked = hollowMaskShatter().cracked;
    if (on) ch.attach('mask', m === 'cracked' ? cracked[cracked.length - 1] : m === 'cracked0' ? cracked[0] : hollowMask(), 'face');
  };
  setMask(params.get('mask'));
  // body scale (close-ups) and full-view scale (released wings widen the full views)
  const bodyScale = who === 'menos' ? 20 : who === 'hollow' ? 1.45 : who === 'kenpachi' ? 1.16 : who === 'hitsugaya' ? 0.8 : who === 'aizen' ? 1.03 : who === 'renji' ? 1.05 : who === 'rukia' ? 0.82 : who === 'chad' ? 1.1 : who === 'yoruichi' ? 0.9 : who === 'urahara' ? 1.08 : who === 'yamamoto' ? 0.9 : who === 'gin' ? 1.06 : who === 'suifeng' ? 0.84 : who === 'kyoraku' ? 1.12 : who === 'starrk' ? 1.06 : who === 'lilynette' ? 0.8 : who === 'ukitake' ? 1.06 : who === 'nnoitra' ? 1.22 : who === 'baraggan' ? 0.95 : who === 'komamura' ? 1.65 : who === 'tosen' ? (params.get('form') === 'grillo' ? 2.3 : 1.02) : who === 'orihime' ? 0.92 : who === 'mayuri' ? (params.get('form') === 'bankai' ? 7 : 1.02) : who === 'unohana' ? (params.get('form') === 'shikai' ? 5 : 0.94) : who === 'shinji' ? (params.get('form') === 'flower' ? 2.8 : 1.02) : who === 'yhwach' ? 1.16 : who === 'isshin' ? 1.07 : who === 'ikkaku' ? (params.get('form') === 'bankai' ? 1.3 : 1.05) : who === 'rangiku' ? 1.02 : who === 'hisagi' ? 1.04 : who === 'kira' ? 1 : who === 'yumichika' ? 0.98 : who === 'momo' ? 0.88 : who === 'szayel' ? 1.06 : who === 'yammy' ? (params.get('form') === 'ira' ? 6.3 : params.get('form') === 'ape' ? 7.2 : 1.32) : who === 'nelliel' ? (params.get('form') === 'child' ? 0.56 : params.get('form') === 'gamuza' ? 1.38 : 1) : 1;
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
  const anim = new Animator(ch.rig, who === 'menos' ? MENOS_STANCE : who === 'hollow' ? HOLLOW_STANCE : who === 'grimmjow' ? (pantera ? PANTERA_STANCE : GRIMMJOW_STANCE) : who === 'kenpachi' ? kpStance : who === 'ulquiorra' ? uqStance : who === 'aizen' ? azStance : who === 'hitsugaya' ? hgStance : who === 'renji' ? rjStance : who === 'rukia' ? rkStance : who === 'chad' ? chStance : who === 'uryu' ? URYU_STANCE : who === 'yoruichi' ? YORUICHI_STANCE : who === 'urahara' ? (kpForm === 'sealed' ? URAHARA_STANCE : BENIHIME_STANCE) : who === 'yamamoto' ? (kpForm === 'stripped' ? YAMAMOTO_BARE_STANCE : kpForm === 'shikai' || kpForm === 'tybw' ? RYUJIN_STANCE : YAMAMOTO_STANCE) : who === 'isshin' ? (params.get('form') === 'doctor' ? ISSHIN_DOCTOR_STANCE : ISSHIN_STANCE) : who === 'rangiku' ? (params.get('form') === 'shikai' ? HAINEKO_STANCE : RANGIKU_STANCE): who === 'hisagi' ? (params.get('form') === 'shikai' || params.get('form') === 'bankai' ? KAZESHINI_STANCE : HISAGI_STANCE) : who === 'kira' ? (params.get('form') === 'shikai' ? WABISUKE_STANCE : KIRA_STANCE) : who === 'yumichika' ? (params.get('form') === 'fuji' ? FUJI_STANCE : params.get('form') === 'ruri' ? RURI_STANCE : YUMICHIKA_STANCE) : who === 'momo' ? MOMO_STANCE : who === 'ikkaku' ? (params.get('form') === 'shikai' ? HOZUKIMARU_STANCE : params.get('form') === 'bankai' ? RYUMON_STANCE : IKKAKU_STANCE): who === 'nelliel' ? (params.get('form') === 'child' ? NEL_CHILD_STANCE : params.get('form') === 'gamuza' ? GAMUZA_STANCE : NEL_STANCE) : who === 'hollowichigo' ? (form === 'hollow' ? VASTO_STANCE : HOLLOW_ICHIGO_STANCE) : form === 'hollow' ? VASTO_STANCE : who === 'gin' ? GIN_STANCE : who === 'kyoraku' ? (kpForm === 'shikai' || kpForm === 'bankai' ? KATEN_STANCE : KYORAKU_STANCE) : who === 'starrk' ? (kpForm === 'lobos' ? (params.get('colmillo') ? COLMILLO_STANCE : LOBOS_STANCE) : STARRK_STANCE) : who === 'lilynette' ? (params.get('drawn') ? LILY_ARMED_STANCE : LILY_STANCE) : who === 'ukitake' ? (kpForm === 'shikai' ? SOGYO_STANCE : UKITAKE_STANCE) : who === 'harribel' ? (kpForm === 'tiburon' ? TIBURON_STANCE : HARRIBEL_STANCE) : who === 'nnoitra' ? (kpForm === 'santa' ? SANTA_STANCE : NNOITRA_STANCE) : who === 'baraggan' ? (kpForm === 'arrogante' ? ARROGANTE_STANCE : BARAGGAN_STANCE) : who === 'komamura' ? KOMAMURA_STANCE : who === 'tosen' ? TOSEN_STANCE : who === 'orihime' ? ORIHIME_STANCE : who === 'mayuri' ? (params.get('form') === 'bankai' ? { idle: {} } : MAYURI_STANCE) : who === 'unohana' ? (params.get('form') === 'shikai' ? { idle: {} } : params.get('form') === 'yachiru' || params.get('form') === 'bankai' ? YACHIRU_STANCE : UNOHANA_STANCE) : who === 'suifeng' ? (kpForm === 'bankai' ? RAIKOBEN_STANCE : kpForm === 'shikai' ? SUZUMEBACHI_STANCE : SUIFENG_STANCE) : who === 'shinji' ? (kpForm === 'flower' ? { idle: {} } : kpForm === 'shikai' || kpForm === 'bankai' ? SAKANADE_STANCE : SHINJI_STANCE) : who === 'yhwach' ? (kpForm === 'soulking' ? YHWACH_BLACK_STANCE : YHWACH_STANCE) : who === 'yammy' ? (kpForm === 'ira' ? IRA_STANCE : kpForm === 'ape' ? APE_STANCE : YAMMY_STANCE) : ICHIGO_STANCE, ch.springs);
  anim.register(who === 'menos' ? MENOS_CLIPS : who === 'hollow' ? HOLLOW_CLIPS : who === 'grimmjow' ? (pantera ? PANTERA_CLIPS : GRIMMJOW_CLIPS) : who === 'kenpachi' ? KENPACHI_CLIPS : who === 'ulquiorra' ? ULQUIORRA_CLIPS : who === 'aizen' ? AIZEN_CLIPS : who === 'hitsugaya' ? HITSUGAYA_CLIPS : who === 'renji' ? RENJI_CLIPS : who === 'rukia' ? RUKIA_CLIPS : who === 'chad' ? CHAD_CLIPS : who === 'uryu' ? URYU_CLIPS : who === 'yoruichi' ? YORUICHI_CLIPS : who === 'urahara' ? URAHARA_CLIPS : who === 'yamamoto' ? YAMAMOTO_CLIPS : who === 'isshin' ? (params.get('form') === 'doctor' ? ISSHIN_DOCTOR_CLIPS : ISSHIN_CLIPS) : who === 'rangiku' ? (params.get('form') === 'shikai' ? HAINEKO_CLIPS : RANGIKU_CLIPS): who === 'hisagi' ? (params.get('form') === 'shikai' || params.get('form') === 'bankai' ? KAZESHINI_CLIPS : HISAGI_CLIPS) : who === 'kira' ? (params.get('form') === 'shikai' ? WABISUKE_CLIPS : KIRA_CLIPS) : who === 'yumichika' ? (params.get('form') === 'fuji' ? FUJI_CLIPS : params.get('form') === 'ruri' ? RURI_CLIPS : YUMICHIKA_CLIPS) : who === 'momo' ? (params.get('form') === 'shikai' ? TOBIUME_CLIPS : MOMO_CLIPS) : who === 'ikkaku' ? (params.get('form') === 'shikai' ? HOZUKIMARU_CLIPS : params.get('form') === 'bankai' ? RYUMON_CLIPS : IKKAKU_CLIPS): who === 'nelliel' ? (params.get('form') === 'child' ? NEL_CHILD_CLIPS : params.get('form') === 'gamuza' ? GAMUZA_CLIPS : NEL_CLIPS) : who === 'hollowichigo' ? (form === 'hollow' ? [...VASTO_CLIPS, ...HOLLOW_ICHIGO_EXTRA_VASTO] : HOLLOW_ICHIGO_CLIPS) : form === 'hollow' ? VASTO_CLIPS : who === 'gin' ? GIN_CLIPS : who === 'kyoraku' ? KYORAKU_CLIPS : who === 'starrk' ? STARRK_CLIPS : who === 'lilynette' ? LILY_CLIPS : who === 'ukitake' ? UKITAKE_CLIPS : who === 'harribel' ? HARRIBEL_CLIPS : who === 'nnoitra' ? NNOITRA_CLIPS : who === 'baraggan' ? BARAGGAN_CLIPS : who === 'komamura' ? KOMAMURA_CLIPS : who === 'tosen' ? TOSEN_CLIPS : who === 'orihime' ? ORIHIME_CLIPS : who === 'mayuri' ? MAYURI_CLIPS : who === 'unohana' ? UNOHANA_CLIPS : who === 'suifeng' ? SUIFENG_CLIPS : who === 'shinji' ? SHINJI_CLIPS : who === 'yhwach' ? YHWACH_CLIPS : who === 'yammy' ? (kpForm === 'ira' ? IRA_CLIPS : kpForm === 'ape' ? APE_CLIPS : YAMMY_CLIPS) : ICHIGO_CLIPS);
  if (who === 'nelliel' && params.get('form') === 'gamuza') anim.twoHandGap = 0.38;
  if (who === 'ikkaku' && params.get('form') === 'shikai') anim.twoHandGap = 0.3;
  const loco = { vx: 0, vz: 0, vy: 0, grounded: true, turn: 0, accel: 0 };
  eng.systems.push({ update: (dt) => anim.update(dt, loco) });
  if (who === 'shinji') {
    // the flower's petals open by `open`; the Shikai/Bankai sword hangs on the finger by its ring and turns
    const k = Math.max(0, Math.min(1, Number(params.get('open') ?? 0)));
    const qBase = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
    const qSpin = new THREE.Quaternion();
    let spin = Number(params.get('spin') ?? 2.4);
    eng.systems.push({
      update: (dt) => {
        if (params.get('form') === 'flower') {
          for (let i = 0; i < FLOWER_PETALS; i++) {
            const bi = ch.rig.index(`petal${i}`);
            const a = petalAzimuth(i);
            if (bi >= 0) ch.rig.bones[bi].quaternion.setFromAxisAngle(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), k * 1.25);
          }
          return;
        }
        const sw = ch.props.get('sword');
        if (!sw || sw.parent?.name !== 'finger.R') return;
        if (params.get('turn')) spin += dt * Math.PI * 2;
        const q = qBase.clone().multiply(qSpin.setFromAxisAngle(new THREE.Vector3(1, 0, 0), spin));
        sw.quaternion.copy(q);
        sw.position.set(0, 0, SAKANADE_RING_Z).applyQuaternion(q).negate();
      },
    });
  }
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
