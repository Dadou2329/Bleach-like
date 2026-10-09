// Model / animation review mode: ?mode=model&char=ichigo[&form=bankai][&mask=1|cracked][&view=front|three|side|back|face]
// Exposes window.__reishi.view(name), .yaw(deg), .pose(name), .play(clip) for scripted screenshots.
import * as THREE from 'three';
import { Engine } from './engine';
import { generateStage } from './maps/stage';
import { QUALITY_HIGH, QUALITY_LOW } from './render/renderer';
import { CharacterVisual, PropMesh } from './game/characterFactory';
import { buildIchigo, buildTensaZangetsu, buildZangetsuShikai, hollowMask, hollowMaskShatter, type IchigoForm, halfMask } from './chars/ichigo';
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
import { buildZommari, zommariProp } from './chars/zommari';
import { BRUJERIA_CLIPS, BRUJERIA_STANCE, ZOMMARI_CLIPS, ZOMMARI_STANCE } from './chars/zommariClips';
import { AARONIERO_CLIPS, AARONIERO_STANCE, GLOT_CLIPS, GLOT_STANCE, KAIEN_CLIPS, KAIEN_STANCE, NEJIBANA_CLIPS, NEJIBANA_STANCE } from './chars/aaronieroClips';
import { aaronieroProp, buildAaroniero, CAPSULE, GLOT_LIFT } from './chars/aaroniero';
import { buildKaien, nejibanaProp } from './chars/kaien';
import { buildIchigoTybw, tybwBlade } from './chars/ichigoTybw';
import { TYBW_CLIPS, TYBW_STANCE } from './chars/ichigoTybwClips';
import { buildDangai, dangaiSword, mugetsuBlade } from './chars/ichigoDangai';
import { buildIchigoHuman } from './chars/ichigoHuman';
import { DANGAI_CLIPS, DANGAI_STANCE, FINAL_CLIPS, FINAL_STANCE, HUMAN_CLIPS, HUMAN_STANCE } from './chars/ichigoDangaiClips';
import { SHEATH_ON_BACK, baseballBat, firstSheath, firstSword } from './chars/ichigoAgent';
import { FB1_CLIPS, FB1_STANCE, FB2_CLIPS, FB2_STANCE, FB3_CLIPS, FB3_STANCE } from './chars/ichigoFullbringClips';
import { buildIchigoLizard, lizardMask } from './chars/ichigoLizard';
import { LIZARD_CLIPS, LIZARD_STANCE } from './chars/ichigoLizardClips';
import { FB_SHEATH_ON_BACK, buildFullbring, fbArmBlade, fbGuard, fbMachete, fbSheath, tensaV3, zangetsuV2, type FullbringForm } from './chars/ichigoFullbring';
import { AGENT_HUMAN_CLIPS, AGENT_HUMAN_STANCE, SUB_CLIPS, SUB_STANCE } from './chars/ichigoAgentClips';
import { KAIEN_SEALED_CLIPS, KAIEN_SHIKAI_CLIPS, POSSESSED_CLIPS, POSSESSED_STANCE } from './chars/kaienClips';
import { CapsuleGlass } from './vfx/glotoneria';
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
import { adultWings, buildHitsugayaAdult } from './chars/hitsugayaAdult';
import { ADULT_CLIPS, ADULT_STANCE } from './chars/hitsugayaAdultClips';
import { buildRenji, renjiProp, SEGMENT_BASE, SEGMENT_LEN, type RenjiProp } from './chars/renji';
import { buildRenjiTybw, renjiTybwProp, type RenjiTybwProp } from './chars/renjiTybw';
import { buildRukia, rukiaProp } from './chars/rukia';
import { buildChad } from './chars/chad';
import { buildUryu, uryuProp } from './chars/uryu';
import { buildUryuTybw, uryuTybwProp, type UryuTybwForm, type UryuTybwProp } from './chars/uryuTybw';
import { buildHaschwalth, haschwalthProp, type HaschwalthForm, type HaschwalthProp } from './chars/haschwalth';
import { HASCHWALTH_CLIPS, HASCHWALTH_STANCE } from './chars/haschwalthClips';
import { FINGER_HANDS, bazzbProp, buildBazzb, type BazzbProp } from './chars/bazzb';
import { BAZZB_CLIPS, BAZZB_STANCE } from './chars/bazzbClips';
import { bambiettaProp, buildBambietta, type BambiettaProp } from './chars/bambietta';
import { BAMBIETTA_CLIPS, BAMBIETTA_STANCE } from './chars/bambiettaClips';
import { buildCandice, candiceProp, type CandiceForm, type CandiceProp } from './chars/candice';
import { BARBARRIEL_CLIPS, BARBARRIEL_STANCE, CANDICE_CLIPS, CANDICE_STANCE } from './chars/candiceClips';
import { buildLiltotto, liltottoProp, type LiltottoForm, type LiltottoProp } from './chars/liltotto';
import { LILTOTTO_CLIPS, LILTOTTO_STANCE } from './chars/liltottoClips';
import { buildGiselle, giselleProp, skeletonAsset, type GiselleForm, type GiselleProp } from './chars/giselle';
import { AZHALBIORA_CLIPS, AZHALBIORA_STANCE, GISELLE_CLIPS, GISELLE_STANCE, SKELETON_CLIPS, SKELETON_STANCE } from './chars/giselleClips';
import { buildMeninas, meninasProp, type MeninasForm, type MeninasProp } from './chars/meninas';
import { askinProp, buildAskin, type AskinForm, type AskinProp } from './chars/askin';
import { buildGremmy, gremmyProp, type GremmyForm, type GremmyProp } from './chars/gremmy';
import { buildLille, lilleProp, type LilleForm, type LilleProp } from './chars/lille';
import { buildGerard, gerardProp, type GerardForm, type GerardProp } from './chars/gerard';
import { GERARD_CLIPS, GERARD_STANCE, KNIGHT_CLIPS, KNIGHT_STANCE } from './chars/gerardClips';
import { JILLIEL_STANCE, LILLE_CLIPS, LILLE_STANCE, REMNANT_STANCE, TRUE_STANCE } from './chars/lilleClips';
import { jillielAsset, lilleGodProp, remnantAsset, trueFormAsset, type LilleGodProp } from './chars/lilleGod';
import { BULK_CLIPS, BULK_STANCE, GREMMY_CLIPS, GREMMY_STANCE } from './chars/gremmyClips';
import { ASKIN_CLIPS, ASKIN_STANCE, HASSHEIN_CLIPS, HASSHEIN_STANCE } from './chars/askinClips';
import { MENINAS_CLIPS, MENINAS_STANCE, PORNIPORA_CLIPS, PORNIPORA_STANCE } from './chars/meninasClips';
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
import { URYU_TYBW_CLIPS, URYU_TYBW_STANCE, URYU_VOLL_STANCE } from './chars/uryuTybwClips';
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
  /** the Fake Karakura era's form (bankai · final · human) */
  const kForm = (): string => params.get('form') ?? 'bankai';
  const t0 = performance.now();
  const asset = who === 'menos' ? buildMenos(Number(params.get('seed') ?? 3)) : who === 'hollow' ? buildHollow({ seed: Number(params.get('seed') ?? 11) })
    : who === 'grimmjow' ? buildGrimmjow(form === 'pantera' ? 'pantera' : 'sealed') : who === 'byakuya' ? buildByakuya() : who === 'kenpachi' ? buildKenpachi(form === 'bankai' ? 'bankai' : 'sealed')
    : who === 'ulquiorra' ? buildUlquiorra((['murcielago', 'segunda'].includes(params.get('form') ?? '') ? params.get('form') : 'sealed') as UlquiorraForm)
    : who === 'aizen' ? buildAizen((['traitor', 'chrysalis'].includes(params.get('form') ?? '') ? params.get('form') : 'captain') as AizenForm)
    : who === 'hitsugaya' ? buildHitsugaya(form === 'bankai' ? 'bankai' : 'captain')
    : who === 'toshiro' ? (kForm() === 'adult' ? buildHitsugayaAdult() : buildHitsugaya(kForm() === 'tybw-hollow' ? 'tybw-hollow' : kForm() === 'tybw-bankai' ? 'tybw-bankai' : 'tybw'))
    : who === 'renji' ? (kForm().startsWith('oken') ? buildRenjiTybw('oken') : kForm() === 'soo' ? buildRenjiTybw('soo') : buildRenji(form === 'bankai' ? 'bankai' : 'lieutenant'))
    : who === 'hihio' ? { model: kForm() === 'skull-flame' ? renjiProp('skull-flame') : renjiTybwProp((['hihio-bare', 'fur-clump', 'hand-open', 'hand-fist', 'orochio', 'orochio-hot', 'soo-blade', 'tail-vert'].includes(kForm()) ? kForm() : 'hihio') as RenjiTybwProp), springs: [], colliders: [], warnings: [] }
    : who === 'rukia' ? buildRukia(form === 'bankai' ? 'bankai' : 'shinigami')
    : who === 'chad' ? buildChad((['gigante', 'true'].includes(params.get('form') ?? '') ? params.get('form') : 'human') as 'human' | 'gigante' | 'true')
    : who === 'uryu' ? (['sternritter', 'vollstandig'].includes(params.get('form') ?? '') ? buildUryuTybw(params.get('form') as UryuTybwForm) : buildUryu(params.get('form') === 'letzt' ? 'letzt' : 'quincy'))
    : who === 'uryuprop' ? { model: uryuTybwProp(kForm() as UryuTybwProp), springs: [], colliders: [], warnings: [] }
    : who === 'haschwalth' ? buildHaschwalth((['night', 'vessel'].includes(params.get('form') ?? '') ? params.get('form') : 'day') as HaschwalthForm)
    : who === 'hwprop' ? { model: haschwalthProp((params.get('form') === 'shield' ? 'shield' : 'sword') as HaschwalthProp), springs: [], colliders: [], warnings: [] }
    : who === 'bazzb' ? buildBazzb(params.get('form') === 'voll' ? 'voll' : 'base')
    : who === 'bambietta' ? buildBambietta(params.get('form') === 'zofiel' ? 'zofiel' : 'base')
    : who === 'bbprop' ? { model: bambiettaProp((params.get('form') === 'halo' ? 'halo' : 'dao') as BambiettaProp), springs: [], colliders: [], warnings: [] }
    : who === 'candice' ? buildCandice((['barbarriel', 'sklaverei'].includes(params.get('form') ?? '') ? params.get('form') : 'base') as CandiceForm)
    : who === 'ccprop' ? { model: candiceProp((['bow', 'halo'].includes(params.get('form') ?? '') ? params.get('form') : 'sword') as CandiceProp), springs: [], colliders: [], warnings: [] }
    : who === 'liltotto' ? buildLiltotto((['gagael', 'sklaverei'].includes(params.get('form') ?? '') ? params.get('form') : 'base') as LiltottoForm)
    : who === 'ltprop' ? { model: liltottoProp((params.get('form') ?? 'maw.upper') as LiltottoProp), springs: [], colliders: [], warnings: [] }
    : who === 'giselle' ? buildGiselle((['azhalbiora', 'sklaverei'].includes(params.get('form') ?? '') ? params.get('form') : 'base') as GiselleForm)
    : who === 'ggprop' ? { model: giselleProp((['skull', 'bone', 'halo'].includes(params.get('form') ?? '') ? params.get('form') : 'bow') as GiselleProp), springs: [], colliders: [], warnings: [] }
    : who === 'ggskel' ? skeletonAsset()
    : who === 'meninas' ? buildMeninas((['pornipora', 'sklaverei'].includes(params.get('form') ?? '') ? params.get('form') : 'base') as MeninasForm)
    : who === 'mnprop' ? { model: meninasProp((params.get('form') ?? 'dumbbell') as MeninasProp), springs: [], colliders: [], warnings: [] }
    : who === 'askin' ? buildAskin((params.get('form') === 'hasshein' ? 'hasshein' : 'base') as AskinForm)
    : who === 'asprop' ? { model: askinProp((params.get('form') ?? 'bow') as AskinProp), springs: [], colliders: [], warnings: [] }
    : who === 'gremmy' ? buildGremmy((['steel', 'bulk'].includes(params.get('form') ?? '') ? params.get('form') : 'base') as GremmyForm)
    : who === 'gmprop' ? { model: gremmyProp((params.get('form') ?? 'brain') as GremmyProp), springs: [], colliders: [], warnings: [] }
    : who === 'lille' ? (params.get('form') === 'jilliel' ? jillielAsset() : params.get('form') === 'true' ? trueFormAsset() : params.get('form') === 'remnant' ? remnantAsset() : buildLille((params.get('form') === 'open' ? 'open' : 'base') as LilleForm))
    : who === 'llgod' ? { model: lilleGodProp((params.get('form') ?? 'trompete') as LilleGodProp), springs: [], colliders: [], warnings: [] }
    : who === 'llprop' ? { model: lilleProp((params.get('form') ?? 'diagramm') as LilleProp), springs: [], colliders: [], warnings: [] }
    : who === 'gerard' ? buildGerard((['bare', 'asch', 'knight', 'bones'].includes(params.get('form') ?? '') ? params.get('form') : 'helm') as GerardForm, params.get('marked') === '1')
    : who === 'grprop' ? { model: gerardProp((params.get('form') ?? 'hoffnung') as GerardProp), springs: [], colliders: [], warnings: [] }
    : who === 'bzprop' ? { model: bazzbProp((['flame', 'halo'].includes(params.get('form') ?? '') ? params.get('form') : 'crossbow') as BazzbProp), springs: [], colliders: [], warnings: [] }
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
    : who === 'aaroniero' ? buildAaroniero(params.get('form') === 'glotoneria' ? 'glotoneria' : 'sealed')
    : who === 'kaien' ? buildKaien(params.get('form') === 'possessed' ? 'possessed' : 'lieutenant')
    : who === 'lizard' ? buildIchigoLizard()
    : who === 'fullbring' ? (kForm() === 'fb1' ? buildIchigoHuman('casual') : buildFullbring((['fb2', 'fb3', 'shikai2', 'bankai3'].includes(kForm()) ? kForm() : 'fb2') as FullbringForm))
    : who === 'agent' ? (kForm() === 'human' ? buildIchigoHuman('school') : buildIchigo(kForm() === 'shikai' ? 'shikai' : 'substitute'))
    : who === 'dangai' ? (kForm() === 'final' ? buildDangai('final') : kForm() === 'human' ? buildIchigoHuman(params.get('look') === 'casual' ? 'casual' : 'school') : buildDangai('bankai'))
    : who === 'tybw' ? buildIchigoTybw(form === 'hollow' ? 'hollow' : (form as string) === 'chains' ? 'chains' : 'shikai')
    : who === 'zommari' ? buildZommari(params.get('form') === 'brujeria' ? 'brujeria' : params.get('form') === 'blind' ? 'blind' : 'sealed')
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
  if (who === 'lizard') {
    if (params.get('mask') !== '0') ch.attach('mask', lizardMask(), 'face');
    ch.rig.setBoneVisible('fist.L', false);
    ch.rig.setBoneVisible('fist.R', false);
    ch.rig.setBoneVisible('bangs', params.get('mask') === '0');
  }
  if (who === 'fullbring') {
    const f = kForm();
    if (f === 'fb1') ch.attach('sword', fbGuard(), 'grip.R');
    else if (f === 'fb2') ch.attach('blade', fbArmBlade(), 'forearm.R');
    else if (f === 'fb3') {
      ch.attach('sword', fbMachete(), 'grip.R');
      const sh = ch.attach('sheath', fbSheath(), 'back');
      sh.position.set(...FB_SHEATH_ON_BACK.pos);
      sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...FB_SHEATH_ON_BACK.dir).normalize());
    } else ch.attach('sword', f === 'shikai2' ? zangetsuV2() : tensaV3(), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('palm.L', false);
  }
  if (who === 'agent') {
    const f = kForm();
    if (f === 'human') {
      if (params.get('bat')) ch.attach('sword', baseballBat(), 'grip.R');
      ch.rig.setBoneVisible('palm.R', false);
      ch.rig.setBoneVisible('palm.L', false);
    } else {
      ch.attach('sword', f === 'shikai' ? buildZangetsuShikai() : firstSword(), 'grip.R');
      if (f !== 'shikai') {
        const sh = ch.attach('sheath', firstSheath(), 'back');
        sh.position.set(...SHEATH_ON_BACK.pos);
        sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...SHEATH_ON_BACK.dir).normalize());
      }
      ch.rig.setBoneVisible('palm.R', false);
      ch.rig.setBoneVisible('fist.L', false);
    }
  }
  if (who === 'dangai') {
    const f = kForm();
    if (f === 'bankai') {
      ch.attach('sword', dangaiSword(), 'grip.R');
      ch.rig.setBoneVisible('palm.R', false);
      ch.rig.setBoneVisible('palm.L', false);
    } else {
      if (f === 'final' && params.get('blade')) ch.attach('blade', mugetsuBlade(), 'grip.R');
      ch.rig.setBoneVisible('palm.R', false);
      ch.rig.setBoneVisible('palm.L', false);
    }
  }
  if (who === 'tybw') {
    const f = params.get('form') ?? 'shikai';
    if (f === 'chains') {
      ch.attach('sword', tybwBlade('chains'), 'grip.R');
      ch.rig.setBoneVisible('fist.L', false);
    } else if (f === 'bankai') {
      ch.attach('sword', params.get('broken') ? buildZangetsuShikai() : tybwBlade('bankai'), 'grip.R');
      ch.rig.setBoneVisible('fist.L', false);
    } else {
      ch.attach('sword', tybwBlade(f === 'hollow' ? (params.get('veins') ? 'large-veins' : 'large-white') : 'large'), 'grip.R');
      ch.attach('sword2', tybwBlade('small'), 'grip.L');
      ch.rig.setBoneVisible('palm.L', false);
    }
    ch.rig.setBoneVisible('palm.R', false);
  }
  if (who === 'kaien' && params.get('form') !== 'possessed') {
    const shikai = params.get('form') === 'shikai';
    ch.attach(shikai ? 'spear' : 'sword', nejibanaProp(shikai ? 'trident' : 'katana'), 'grip.R');
    ch.attach('saya', nejibanaProp('sheath-empty'), 'hip.L');
  }
  if (who === 'aaroniero') {
    const glot = params.get('form') === 'glotoneria';
    const hd = (params.get('head') ?? 'mask') as 'mask' | 'capsule' | 'kaien';
    ch.attach('head', aaronieroProp(glot ? (`glot-${hd}` as 'glot-mask') : hd), 'skull');
    if (hd === 'capsule') {
      const sk = ch.rig.sockets.get('skull');
      if (sk) new CapsuleGlass(sk, { y: CAPSULE.y + (glot ? GLOT_LIFT : 0), r: CAPSULE.r, h: CAPSULE.h });
    }
    if (glot) ch.attach('mass', aaronieroProp('mass'), 'mass');
    else if (params.get('weapon') === 'nejibana') ch.attach('spear', aaronieroProp('nejibana'), 'grip.R');
    else ch.attach('saya', aaronieroProp('sheath'), 'hip.L');
    if (params.get('maw')) ch.attach('maw', aaronieroProp('maw'), 'maw');
  }
  if (who === 'zommari' && !params.get('form')) {
    ch.attach('saya', zommariProp('sheath'), 'hip.L');
    ch.attach('sword', zommariProp('katana'), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'zommari' && params.get('embrion')) ch.attach('embrion', zommariProp('embrion'), 'embrion');
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
  if (who === 'toshiro') {
    const f = kForm();
    const bankai = f === 'tybw-bankai' || f === 'tybw-hollow' || f === 'adult';
    const drawn = bankai || !!params.get('drawn');
    if (drawn) ch.attach('sword', hitsugayaProp(bankai ? 'bankai-sword' : 'sword'), 'grip.R');
    else ch.attach('sheath', hitsugayaProp('sheathed'), 'back');
    if (f === 'adult' && params.get('wings')) ch.attach('wings', adultWings(), 'back');
    ch.rig.setBoneVisible(drawn ? 'palm.R' : 'fist.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'renji' && (params.get('form') ?? '').startsWith('oken') === false && params.get('form') === 'soo') {
    // Sōō Zabimaru: the blade out of the gauntlet's mouth (&orochio=1: Orochiō, =hot: red-hot)
    const oro = params.get('orochio');
    ch.attach('sword', renjiTybwProp(oro === 'hot' ? 'orochio-hot' : oro ? 'orochio' : 'soo-blade'), 'grip.R');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.L', false);
  } else if (who === 'renji') {
    // sealed: the katana; shikai: the hilt with the six segments assembled on it; bankai: the bone handle
    // (oken / oken-shikai: the same, in the Ōken clothing)
    const f = (params.get('form') ?? 'sealed').replace('oken-', '').replace('oken', 'sealed');
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
  if (who === 'bazzb') {
    // the finger count on the right hand (&hand=1..5), the crossbow (&bow=1), the flame sword (&sword=1), the halo
    const sword = !!params.get('sword');
    const n = sword ? 4 : Number(params.get('hand') ?? 0);
    for (const [i, name] of FINGER_HANDS.entries()) ch.rig.setBoneVisible(name, n === i + 1);
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('fist.R', !(n >= 1 && n <= 5));
    ch.rig.setBoneVisible('palm.L', false);
    if (params.get('bow')) ch.attach('bow', bazzbProp('crossbow'), 'grip.R');
    if (sword) ch.attach('flame', bazzbProp('flame'), 'bf4');
    if (params.get('form') === 'voll' || params.get('halo')) ch.attach('halo', bazzbProp('halo'), 'halo');
  }
  if (who === 'bambietta') {
    if (params.get('dao') !== '0') ch.attach('dao', bambiettaProp('dao'), 'grip.R');
    if (params.get('form') === 'zofiel') ch.attach('halo', bambiettaProp('halo'), 'halo');
    ch.rig.setBoneVisible('palm.R', params.get('dao') === '0');
    ch.rig.setBoneVisible('fist.R', params.get('dao') !== '0');
    ch.rig.setBoneVisible('fist.L', false);
  }
  if (who === 'candice') {
    // Barbarriel: the halo, a wing sword in each hand (&swords=0: bare hands); &bow=1 the Heilig Bogen in the left
    const voll = ['barbarriel', 'sklaverei'].includes(params.get('form') ?? '');
    const swords = voll && params.get('swords') !== '0';
    const bow = !!params.get('bow');
    if (voll) ch.attach('halo', candiceProp('halo'), 'halo');
    if (swords) {
      ch.attach('sword', candiceProp('sword'), 'grip.R');
      ch.attach('sword2', candiceProp('sword'), 'grip.L');
    }
    if (bow) ch.attach('bow', candiceProp('bow'), 'grip.L');
    ch.rig.setBoneVisible('palm.R', !swords);
    ch.rig.setBoneVisible('fist.R', swords);
    ch.rig.setBoneVisible('palm.L', !swords && !bow);
    ch.rig.setBoneVisible('fist.L', swords || bow);
  }
  if (who === 'liltotto') {
    // the lollipop (&candy=0 without); Gagael's halo; &maw=1 The Glutton open at her mouth; &bow=1 the bow
    const voll = ['gagael', 'sklaverei'].includes(params.get('form') ?? '');
    if (params.get('candy') !== '0' && !params.get('maw')) ch.attach('candy', liltottoProp('candy'), 'candy');
    if (voll) ch.attach('halo', liltottoProp('halo'), 'halo');
    if (params.get('maw')) {
      const k = 48 / 24 / 2;
      const up = ch.attach('maw.upper', liltottoProp('maw.upper'), 'mouth');
      const lo = ch.attach('maw.lower', liltottoProp('maw.lower'), 'mouth');
      for (const m of [up, lo]) m.scale.setScalar(k);
      up.rotation.x = -0.5;
      lo.rotation.x = 0.35;
    }
    const bow = !!params.get('bow');
    if (bow) ch.attach('bow', liltottoProp('bow'), 'grip.L');
    ch.rig.setBoneVisible('fist.R', false);
    ch.rig.setBoneVisible('palm.R', true);
    ch.rig.setBoneVisible('fist.L', bow);
    ch.rig.setBoneVisible('palm.L', !bow);
  }
  if (who === 'meninas') {
    // Pornipora's halo; &arm=1 the right arm swollen (&arm=2 both); &db=1 a dumbbell in each hand; &bow=1 the bow
    const voll = ['pornipora', 'sklaverei'].includes(params.get('form') ?? '');
    if (voll) ch.attach('halo', meninasProp('halo'), 'halo');
    const arm = Number(params.get('arm') ?? 0);
    for (const k of arm >= 2 ? ['R', 'L'] : arm >= 1 ? ['R'] : []) {
      ch.attach(`muscle.upper.${k}`, meninasProp('muscle.upper'), `bicep.${k}`);
      ch.attach(`muscle.fore.${k}`, meninasProp('muscle.fore'), `fore.${k}`);
    }
    const db = !!params.get('db');
    const bow = !!params.get('bow');
    if (db) {
      ch.attach('dumbbell', meninasProp('dumbbell'), 'grip.R');
      ch.attach('dumbbell2', meninasProp('dumbbell'), 'grip.L');
    }
    if (bow) ch.attach('bow', meninasProp('bow'), 'grip.L');
    ch.rig.setBoneVisible('fist.R', db || arm >= 1);
    ch.rig.setBoneVisible('palm.R', !db && arm < 1);
    ch.rig.setBoneVisible('fist.L', db || bow || arm >= 2);
    ch.rig.setBoneVisible('palm.L', !db && !bow && arm < 2);
  }
  if (who === 'askin') {
    // Hasshein's halo and staff; &bow=1 the bow out of the bracers; &gun=1 the finger-gun; &thermos=1 the café au lait
    const voll = params.get('form') === 'hasshein';
    if (voll) {
      ch.attach('halo', askinProp('halo'), 'halo');
      ch.attach('staff', askinProp('staff'), 'grip.R');
    }
    if (params.get('bow')) ch.attach('bow', askinProp('bow'), 'bracer');
    const thermos = !!params.get('thermos');
    if (thermos) ch.attach('thermos', askinProp('thermos'), 'grip.L');
    const gun = !!params.get('gun');
    ch.rig.setBoneVisible('point.R', gun);
    ch.rig.setBoneVisible('fist.R', voll && !gun);
    ch.rig.setBoneVisible('palm.R', !voll && !gun);
    ch.rig.setBoneVisible('fist.L', thermos);
    ch.rig.setBoneVisible('palm.L', !thermos);
  }
  if (who === 'giselle') {
    // Azhalbiora's halo; &bow=1 the bone bow in the left hand; &fists=1 Munchy Munchy Babies' skulls on both fists
    const voll = ['azhalbiora', 'sklaverei'].includes(params.get('form') ?? '');
    if (voll) ch.attach('halo', giselleProp('halo'), 'halo');
    const bow = !!params.get('bow');
    const fists = !!params.get('fists');
    if (bow) ch.attach('bow', giselleProp('bow'), 'grip.L');
    if (fists) for (const k of ['L', 'R']) ch.attach(`skull.${k}`, giselleProp('skull'), `knuckle.${k}`).scale.setScalar(params.get('form') === 'sklaverei' ? 2.6 : 2.0);
    ch.rig.setBoneVisible('fist.R', fists);
    ch.rig.setBoneVisible('palm.R', !fists);
    ch.rig.setBoneVisible('fist.L', bow || fists);
    ch.rig.setBoneVisible('palm.L', !bow && !fists);
  }
  if (who === 'lille') {
    // Diagramm in his hands (&rifle=0 without it, &rifle=r the re-formed one)
    const lf = params.get('form') ?? 'base';
    if (lf === 'jilliel' || lf === 'true') {
      ch.attach('head', lilleGodProp(lf === 'true' ? 'head-owl' : 'head-god'), 'headProp');
      ch.attach('halo', lilleGodProp(lf === 'true' ? 'halo-gold' : 'halo-green'), 'halo');
      if (lf === 'true' && params.get('trompete')) ch.attach('trompete', lilleGodProp('trompete'), 'halo', new THREE.Vector3(0, 1.5, -1));
      if (lf === 'true') {
        ch.rig.setBoneVisible('fist.R', false);
        ch.rig.setBoneVisible('fist.L', false);
      }
    } else if (lf === 'remnant') {
      ch.rig.setBoneVisible('fist.R', false);
      ch.rig.setBoneVisible('fist.L', false);
    } else {
      const rifle = params.get('rifle');
      if (rifle !== '0') ch.attach('rifle', lilleProp(rifle === 'r' ? 'diagramm-r' : 'diagramm'), 'grip.R');
      ch.rig.setBoneVisible('palm.R', rifle === '0');
      ch.rig.setBoneVisible('fist.R', rifle !== '0');
    }
  }
  if (who === 'gerard') {
    // Hoffnung in the right hand, the shield on the left forearm (&shield=0, &sword=0 without; &wings=1 the wings)
    const gf = params.get('form') ?? 'helm';
    if (gf !== 'knight' && gf !== 'bones') {
      if (params.get('sword') !== '0') ch.attach('sword', gerardProp(gf === 'asch' ? 'hoffnung-gold' : 'hoffnung'), 'grip.R');
      if (params.get('shield') !== '0') ch.attach('shield', gerardProp(gf === 'asch' ? 'shield-asch' : 'shield'), 'shield');
      if (gf === 'asch') ch.attach('helm', gerardProp('helm-asch'), 'helm.socket');
      if (params.get('wings')) ch.attach('wings', gerardProp('wings'), 'back');
      ch.rig.setBoneVisible('palm.R', params.get('sword') === '0');
      ch.rig.setBoneVisible('fist.R', params.get('sword') !== '0');
    }
  }
  if (who === 'haschwalth') {
    ch.attach('sword', haschwalthProp('sword'), 'grip.R');
    if (params.get('shield') !== '0') ch.attach('shield', haschwalthProp('shield'), 'shield');
    ch.rig.setBoneVisible('palm.R', false);
    ch.rig.setBoneVisible('palm.L', false);
  }
  if (who === 'uryu') {
    const tybwU = ['sternritter', 'vollstandig'].includes(params.get('form') ?? '');
    if (params.get('glasses') !== '0') ch.attach('glasses', uryuProp('glasses'), 'glasses');
    if (!tybwU) ch.attach('cross', uryuProp('cross'), 'wrist.R');
    if (params.get('bow')) ch.attach('bow', uryuTybwProp('bogen'), 'bow');
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
    if (on) ch.attach('mask', m === 'half' ? halfMask() : m === 'cracked' ? cracked[cracked.length - 1] : m === 'cracked0' ? cracked[0] : hollowMask(), 'face');
  };
  setMask(params.get('mask'));
  // body scale (close-ups) and full-view scale (released wings widen the full views)
  const bodyScale = who === 'menos' ? 20 : who === 'hollow' ? 1.45 : who === 'kenpachi' ? 1.16 : who === 'hitsugaya' ? 0.8 : who === 'toshiro' ? (kForm() === 'adult' ? 1.04 : 0.8) : who === 'aizen' ? 1.03 : who === 'renji' ? 1.05 : who === 'rukia' ? 0.82 : who === 'chad' ? 1.1 : who === 'yoruichi' ? 0.9 : who === 'urahara' ? 1.08 : who === 'yamamoto' ? 0.9 : who === 'gin' ? 1.06 : who === 'suifeng' ? 0.84 : who === 'kyoraku' ? 1.12 : who === 'starrk' ? 1.06 : who === 'lilynette' ? 0.8 : who === 'ukitake' ? 1.06 : who === 'nnoitra' ? 1.22 : who === 'baraggan' ? 0.95 : who === 'komamura' ? 1.65 : who === 'tosen' ? (params.get('form') === 'grillo' ? 2.3 : 1.02) : who === 'orihime' ? 0.92 : who === 'mayuri' ? (params.get('form') === 'bankai' ? 7 : 1.02) : who === 'unohana' ? (params.get('form') === 'shikai' ? 5 : 0.94) : who === 'shinji' ? (params.get('form') === 'flower' ? 2.8 : 1.02) : who === 'yhwach' ? 1.16 : who === 'isshin' ? 1.07 : who === 'ikkaku' ? (params.get('form') === 'bankai' ? 1.3 : 1.05) : who === 'rangiku' ? 1.02 : who === 'hisagi' ? 1.04 : who === 'kira' ? 1 : who === 'yumichika' ? 0.98 : who === 'momo' ? 0.88 : who === 'szayel' ? 1.06 : who === 'yammy' ? (params.get('form') === 'ira' ? 6.3 : params.get('form') === 'ape' ? 7.2 : 1.32) : who === 'zommari' ? (params.get('form') ? 1.85 : 1.12) : who === 'kaien' ? 1.06 : who === 'tybw' || who === 'dangai' || who === 'fullbring' || who === 'lizard' ? 1.04 : who === 'aaroniero' ? (params.get('form') === 'glotoneria' ? 5.4 : 1.18) : who === 'nelliel' ? (params.get('form') === 'child' ? 0.56 : params.get('form') === 'gamuza' ? 1.38 : 1) : who === 'haschwalth' ? 1.09 : who === 'bazzb' ? (params.get('form') === 'voll' ? 1.5 : 1.04) : who === 'bambietta' ? (params.get('form') === 'zofiel' ? 1.9 : 0.9) : who === 'candice' ? (['barbarriel', 'sklaverei'].includes(params.get('form') ?? '') ? 2.0 : 0.96) : who === 'liltotto' ? (['gagael', 'sklaverei'].includes(params.get('form') ?? '') ? 1.5 : 0.88) : who === 'giselle' ? (['azhalbiora', 'sklaverei'].includes(params.get('form') ?? '') ? 1.9 : 0.93) : who === 'ggprop' ? ({ bow: 0.9, skull: 0.3, bone: 0.3, halo: 0.6 } as Record<string, number>)[kForm()] ?? 0.9 : who === 'ggskel' ? 0.72 : who === 'meninas' ? (['pornipora', 'sklaverei'].includes(params.get('form') ?? '') ? 1.7 : 1.08) : who === 'mnprop' ? ({ dumbbell: 0.5, baton: 1.0, halteres: 0.9, bow: 0.6, heart: 0.25, halo: 0.6, 'muscle.upper': 0.4, 'muscle.fore': 0.5 } as Record<string, number>)[kForm()] ?? 0.6 : who === 'askin' ? (params.get('form') === 'hasshein' ? 1.5 : 1.06) : who === 'asprop' ? ({ bow: 1.1, staff: 1.5, thermos: 0.25, halo: 0.6 } as Record<string, number>)[kForm()] ?? 1 : who === 'gremmy' ? (params.get('form') === 'bulk' ? 1.1 : 0.9) : who === 'gmprop' ? ({ brain: 0.3, spike: 1.6, bar: 1.6, block: 1.1, column: 4, hand: 6, meteor: 9, rifle: 0.6, missile: 0.5, bomb: 0.25, dome: 1.8 } as Record<string, number>)[kForm()] ?? 1 : who === 'lille' ? ({ jilliel: 2.1, true: 4.0, remnant: 0.95 } as Record<string, number>)[params.get('form') ?? ''] ?? 1.06 : who === 'llprop' ? 3.2 : who === 'gerard' ? 1.26 : who === 'grprop' ? ({ hoffnung: 1.5, 'hoffnung-gold': 1.5, shield: 1.3, 'shield-asch': 1.5, bow: 2, 'helm-asch': 0.6, wings: 2.4 } as Record<string, number>)[kForm()] ?? 1 : who === 'llgod' ? ({ trompete: 4, 'halo-green': 1.6, 'halo-gold': 1, 'head-god': 0.3, 'head-owl': 1 } as Record<string, number>)[kForm()] ?? 1 : who === 'ltprop' ? 1.2 : who === 'ccprop' ? ({ sword: 1.0, bow: 0.8, halo: 0.6 } as Record<string, number>)[kForm()] ?? 1 : who === 'bbprop' ? (params.get('form') === 'halo' ? 0.6 : 0.9) : who === 'bzprop' ? ({ crossbow: 0.9, flame: 2.6, halo: 0.6 } as Record<string, number>)[kForm()] ?? 1 : who === 'hwprop' ? (params.get('form') === 'shield' ? 1.2 : 1.6) : who === 'uryuprop' ? ({ bogen: 2.2, flechette: 0.35, standspitze: 0.15, chip: 0.2 } as Record<string, number>)[kForm()] ?? 1 : who === 'hihio' ? ({ 'hihio-bare': 2.4, 'hand-open': 1.4, 'hand-fist': 1.4, 'fur-clump': 0.8, 'skull-flame': 2.6, 'tail-vert': 0.15, 'soo-blade': 1.1, orochio: 1.4, 'orochio-hot': 1.4 } as Record<string, number>)[kForm()] ?? 2.4 : 1;
  const viewScale = who === 'ulquiorra' && params.get('form') && params.get('form') !== 'sealed' ? 1.7 : who === 'uryu' && params.get('form') === 'vollstandig' ? 1.6 : who === 'hitsugaya' && form === 'bankai' ? 1.7 : who === 'toshiro' && (kForm() === 'tybw-bankai' || kForm() === 'tybw-hollow') ? 1.7 : bodyScale;
  const origin = new THREE.Vector3(16, 2, 16);
  ch.object.position.copy(origin);
  // the giant arm, the hands and the blades hang down from their origin: lift them clear of the floor
  if (who === 'hihio') ch.object.position.y += kForm().startsWith('hand') ? 2.3 : kForm() === 'hihio' || kForm() === 'hihio-bare' || kForm() === 'bankai' ? 3.9 : ['soo-blade', 'orochio', 'orochio-hot'].includes(kForm()) ? 2.1 : 0.2;
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
  const FB_VIEW_CLIPS: Record<string, typeof ICHIGO_CLIPS> = { fb1: FB1_CLIPS, fb2: FB2_CLIPS, fb3: FB3_CLIPS, shikai2: ICHIGO_CLIPS, bankai3: DANGAI_CLIPS };
  const FB_VIEW_STANCE: Record<string, typeof ICHIGO_STANCE> = { fb1: FB1_STANCE, fb2: FB2_STANCE, fb3: FB3_STANCE, shikai2: ICHIGO_STANCE, bankai3: DANGAI_STANCE };
  const anim = new Animator(ch.rig, who === 'menos' ? MENOS_STANCE : who === 'hollow' ? HOLLOW_STANCE : who === 'grimmjow' ? (pantera ? PANTERA_STANCE : GRIMMJOW_STANCE) : who === 'kenpachi' ? kpStance : who === 'ulquiorra' ? uqStance : who === 'aizen' ? azStance : who === 'hitsugaya' ? hgStance : who === 'toshiro' ? (kForm() === 'adult' ? ADULT_STANCE : kForm() === 'tybw-bankai' || kForm() === 'tybw-hollow' ? DAIGUREN_STANCE : params.get('drawn') ? HITSUGAYA_STANCE : HITSUGAYA_SHEATHED_STANCE) : who === 'renji' ? rjStance : who === 'rukia' ? rkStance : who === 'chad' ? chStance : who === 'haschwalth' ? HASCHWALTH_STANCE : who === 'bazzb' ? BAZZB_STANCE : who === 'bambietta' ? BAMBIETTA_STANCE : who === 'liltotto' ? LILTOTTO_STANCE : who === 'giselle' ? (['azhalbiora', 'sklaverei'].includes(params.get('form') ?? '') ? AZHALBIORA_STANCE : GISELLE_STANCE) : who === 'ggskel' ? SKELETON_STANCE : who === 'meninas' ? (['pornipora', 'sklaverei'].includes(params.get('form') ?? '') ? PORNIPORA_STANCE : MENINAS_STANCE) : who === 'askin' ? (params.get('form') === 'hasshein' ? HASSHEIN_STANCE : ASKIN_STANCE) : who === 'gremmy' ? (params.get('form') === 'bulk' ? BULK_STANCE : GREMMY_STANCE) : who === 'gerard' ? (params.get('form') === 'knight' ? KNIGHT_STANCE : params.get('form') === 'bones' ? { idle: {} } : GERARD_STANCE) : who === 'lille' ? (params.get('form') === 'jilliel' ? JILLIEL_STANCE : params.get('form') === 'true' ? TRUE_STANCE : params.get('form') === 'remnant' ? REMNANT_STANCE : LILLE_STANCE) : who === 'candice' ? (['barbarriel', 'sklaverei'].includes(params.get('form') ?? '') && params.get('swords') !== '0' ? BARBARRIEL_STANCE : CANDICE_STANCE) : who === 'uryu' ? (params.get('form') === 'vollstandig' ? URYU_VOLL_STANCE : params.get('form') === 'sternritter' ? URYU_TYBW_STANCE : URYU_STANCE) : who === 'yoruichi' ? YORUICHI_STANCE : who === 'urahara' ? (kpForm === 'sealed' ? URAHARA_STANCE : BENIHIME_STANCE) : who === 'yamamoto' ? (kpForm === 'stripped' ? YAMAMOTO_BARE_STANCE : kpForm === 'shikai' || kpForm === 'tybw' ? RYUJIN_STANCE : YAMAMOTO_STANCE) : who === 'isshin' ? (params.get('form') === 'doctor' ? ISSHIN_DOCTOR_STANCE : ISSHIN_STANCE) : who === 'rangiku' ? (params.get('form') === 'shikai' ? HAINEKO_STANCE : RANGIKU_STANCE): who === 'hisagi' ? (params.get('form') === 'shikai' || params.get('form') === 'bankai' ? KAZESHINI_STANCE : HISAGI_STANCE) : who === 'kira' ? (params.get('form') === 'shikai' ? WABISUKE_STANCE : KIRA_STANCE) : who === 'yumichika' ? (params.get('form') === 'fuji' ? FUJI_STANCE : params.get('form') === 'ruri' ? RURI_STANCE : YUMICHIKA_STANCE) : who === 'momo' ? MOMO_STANCE : who === 'ikkaku' ? (params.get('form') === 'shikai' ? HOZUKIMARU_STANCE : params.get('form') === 'bankai' ? RYUMON_STANCE : IKKAKU_STANCE): who === 'nelliel' ? (params.get('form') === 'child' ? NEL_CHILD_STANCE : params.get('form') === 'gamuza' ? GAMUZA_STANCE : NEL_STANCE) : who === 'hollowichigo' ? (form === 'hollow' ? VASTO_STANCE : HOLLOW_ICHIGO_STANCE) : form === 'hollow' ? VASTO_STANCE : who === 'gin' ? GIN_STANCE : who === 'kyoraku' ? (kpForm === 'shikai' || kpForm === 'bankai' ? KATEN_STANCE : KYORAKU_STANCE) : who === 'starrk' ? (kpForm === 'lobos' ? (params.get('colmillo') ? COLMILLO_STANCE : LOBOS_STANCE) : STARRK_STANCE) : who === 'lilynette' ? (params.get('drawn') ? LILY_ARMED_STANCE : LILY_STANCE) : who === 'ukitake' ? (kpForm === 'shikai' ? SOGYO_STANCE : UKITAKE_STANCE) : who === 'harribel' ? (kpForm === 'tiburon' ? TIBURON_STANCE : HARRIBEL_STANCE) : who === 'nnoitra' ? (kpForm === 'santa' ? SANTA_STANCE : NNOITRA_STANCE) : who === 'baraggan' ? (kpForm === 'arrogante' ? ARROGANTE_STANCE : BARAGGAN_STANCE) : who === 'komamura' ? KOMAMURA_STANCE : who === 'tosen' ? TOSEN_STANCE : who === 'orihime' ? ORIHIME_STANCE : who === 'mayuri' ? (params.get('form') === 'bankai' ? { idle: {} } : MAYURI_STANCE) : who === 'unohana' ? (params.get('form') === 'shikai' ? { idle: {} } : params.get('form') === 'yachiru' || params.get('form') === 'bankai' ? YACHIRU_STANCE : UNOHANA_STANCE) : who === 'suifeng' ? (kpForm === 'bankai' ? RAIKOBEN_STANCE : kpForm === 'shikai' ? SUZUMEBACHI_STANCE : SUIFENG_STANCE) : who === 'shinji' ? (kpForm === 'flower' ? { idle: {} } : kpForm === 'shikai' || kpForm === 'bankai' ? SAKANADE_STANCE : SHINJI_STANCE) : who === 'yhwach' ? (kpForm === 'soulking' ? YHWACH_BLACK_STANCE : YHWACH_STANCE) : who === 'yammy' ? (kpForm === 'ira' ? IRA_STANCE : kpForm === 'ape' ? APE_STANCE : YAMMY_STANCE) : who === 'zommari' ? (kpForm === 'sealed' ? ZOMMARI_STANCE : BRUJERIA_STANCE) : who === 'kaien' ? (kpForm === 'possessed' ? POSSESSED_STANCE : kpForm === 'shikai' ? NEJIBANA_STANCE : KAIEN_STANCE) : who === 'tybw' ? TYBW_STANCE : who === 'dangai' ? (kpForm === 'final' ? FINAL_STANCE : kpForm === 'human' ? HUMAN_STANCE : DANGAI_STANCE) : who === 'agent' ? (kpForm === 'human' ? AGENT_HUMAN_STANCE : kpForm === 'shikai' ? ICHIGO_STANCE : SUB_STANCE) : who === 'fullbring' ? (FB_VIEW_STANCE[kpForm] ?? ICHIGO_STANCE) : who === 'lizard' ? LIZARD_STANCE : who === 'aaroniero' ? (kpForm === 'glotoneria' ? GLOT_STANCE : params.get('weapon') === 'nejibana' ? NEJIBANA_STANCE : params.get('head') === 'kaien' ? KAIEN_STANCE : AARONIERO_STANCE) : ICHIGO_STANCE, ch.springs);
  anim.register(who === 'menos' ? MENOS_CLIPS : who === 'hollow' ? HOLLOW_CLIPS : who === 'grimmjow' ? (pantera ? PANTERA_CLIPS : GRIMMJOW_CLIPS) : who === 'kenpachi' ? KENPACHI_CLIPS : who === 'ulquiorra' ? ULQUIORRA_CLIPS : who === 'aizen' ? AIZEN_CLIPS : who === 'hitsugaya' ? HITSUGAYA_CLIPS : who === 'toshiro' ? (kForm() === 'adult' ? ADULT_CLIPS : HITSUGAYA_CLIPS) : who === 'renji' ? RENJI_CLIPS : who === 'rukia' ? RUKIA_CLIPS : who === 'chad' ? CHAD_CLIPS : who === 'haschwalth' ? HASCHWALTH_CLIPS : who === 'bazzb' ? BAZZB_CLIPS : who === 'bambietta' ? BAMBIETTA_CLIPS : who === 'liltotto' ? LILTOTTO_CLIPS : who === 'giselle' ? (['azhalbiora', 'sklaverei'].includes(params.get('form') ?? '') ? AZHALBIORA_CLIPS : GISELLE_CLIPS) : who === 'ggskel' ? SKELETON_CLIPS : who === 'meninas' ? (['pornipora', 'sklaverei'].includes(params.get('form') ?? '') ? PORNIPORA_CLIPS : MENINAS_CLIPS) : who === 'askin' ? (params.get('form') === 'hasshein' ? HASSHEIN_CLIPS : ASKIN_CLIPS) : who === 'gremmy' ? (params.get('form') === 'bulk' ? BULK_CLIPS : GREMMY_CLIPS) : who === 'gerard' ? (params.get('form') === 'knight' ? KNIGHT_CLIPS : GERARD_CLIPS) : who === 'lille' ? LILLE_CLIPS : who === 'candice' ? (['barbarriel', 'sklaverei'].includes(params.get('form') ?? '') ? BARBARRIEL_CLIPS : CANDICE_CLIPS) : who === 'uryu' ? (['sternritter', 'vollstandig'].includes(params.get('form') ?? '') ? URYU_TYBW_CLIPS : URYU_CLIPS) : who === 'yoruichi' ? YORUICHI_CLIPS : who === 'urahara' ? URAHARA_CLIPS : who === 'yamamoto' ? YAMAMOTO_CLIPS : who === 'isshin' ? (params.get('form') === 'doctor' ? ISSHIN_DOCTOR_CLIPS : ISSHIN_CLIPS) : who === 'rangiku' ? (params.get('form') === 'shikai' ? HAINEKO_CLIPS : RANGIKU_CLIPS): who === 'hisagi' ? (params.get('form') === 'shikai' || params.get('form') === 'bankai' ? KAZESHINI_CLIPS : HISAGI_CLIPS) : who === 'kira' ? (params.get('form') === 'shikai' ? WABISUKE_CLIPS : KIRA_CLIPS) : who === 'yumichika' ? (params.get('form') === 'fuji' ? FUJI_CLIPS : params.get('form') === 'ruri' ? RURI_CLIPS : YUMICHIKA_CLIPS) : who === 'momo' ? (params.get('form') === 'shikai' ? TOBIUME_CLIPS : MOMO_CLIPS) : who === 'ikkaku' ? (params.get('form') === 'shikai' ? HOZUKIMARU_CLIPS : params.get('form') === 'bankai' ? RYUMON_CLIPS : IKKAKU_CLIPS): who === 'nelliel' ? (params.get('form') === 'child' ? NEL_CHILD_CLIPS : params.get('form') === 'gamuza' ? GAMUZA_CLIPS : NEL_CLIPS) : who === 'hollowichigo' ? (form === 'hollow' ? [...VASTO_CLIPS, ...HOLLOW_ICHIGO_EXTRA_VASTO] : HOLLOW_ICHIGO_CLIPS) : form === 'hollow' ? VASTO_CLIPS : who === 'gin' ? GIN_CLIPS : who === 'kyoraku' ? KYORAKU_CLIPS : who === 'starrk' ? STARRK_CLIPS : who === 'lilynette' ? LILY_CLIPS : who === 'ukitake' ? UKITAKE_CLIPS : who === 'harribel' ? HARRIBEL_CLIPS : who === 'nnoitra' ? NNOITRA_CLIPS : who === 'baraggan' ? BARAGGAN_CLIPS : who === 'komamura' ? KOMAMURA_CLIPS : who === 'tosen' ? TOSEN_CLIPS : who === 'orihime' ? ORIHIME_CLIPS : who === 'mayuri' ? MAYURI_CLIPS : who === 'unohana' ? UNOHANA_CLIPS : who === 'suifeng' ? SUIFENG_CLIPS : who === 'shinji' ? SHINJI_CLIPS : who === 'yhwach' ? YHWACH_CLIPS : who === 'yammy' ? (kpForm === 'ira' ? IRA_CLIPS : kpForm === 'ape' ? APE_CLIPS : YAMMY_CLIPS) : who === 'zommari' ? (kpForm === 'sealed' ? ZOMMARI_CLIPS : BRUJERIA_CLIPS) : who === 'kaien' ? (kpForm === 'possessed' ? POSSESSED_CLIPS : kpForm === 'shikai' ? KAIEN_SHIKAI_CLIPS : KAIEN_SEALED_CLIPS) : who === 'tybw' ? TYBW_CLIPS : who === 'dangai' ? (kpForm === 'final' ? FINAL_CLIPS : kpForm === 'human' ? HUMAN_CLIPS : DANGAI_CLIPS) : who === 'agent' ? (kpForm === 'human' ? AGENT_HUMAN_CLIPS : kpForm === 'shikai' ? ICHIGO_CLIPS : SUB_CLIPS) : who === 'fullbring' ? (FB_VIEW_CLIPS[kpForm] ?? ICHIGO_CLIPS) : who === 'lizard' ? LIZARD_CLIPS : who === 'aaroniero' ? (kpForm === 'glotoneria' ? GLOT_CLIPS : params.get('weapon') === 'nejibana' ? NEJIBANA_CLIPS : params.get('head') === 'kaien' ? KAIEN_CLIPS : AARONIERO_CLIPS) : ICHIGO_CLIPS);
  if (who === 'nelliel' && params.get('form') === 'gamuza') anim.twoHandGap = 0.38;
  if (who === 'ikkaku' && params.get('form') === 'shikai') anim.twoHandGap = 0.3;
  if (who === 'lille') anim.twoHandGap = -0.44;
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
