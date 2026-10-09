// Karakura Town (procedural), 320 m across on 32 m of ground: a Japanese town on a street grid — two-storey houses
// with tiled roofs and block-wall gardens, apartment blocks with open corridors, shops, konbini and offices along the
// main street, a downtown of towers round a department store, Karakura High (school, gym, sports ground), the Kurosaki
// Clinic, Karakura General Hospital, the shrine, Urahara Shop, a park, the riverside with its sakura, the river under
// two road bridges and a high-voltage line, warehouses and a smokestack on the far bank, a construction site with a
// tower crane, and the elevated railway on its piers with Karakura Station, its forecourt and a train at the platform.
// Street lamps, traffic lights, utility poles and their wires, footbridges, curve mirrors, bus stops, phone booths,
// parked cars, vans and lorries. Under the streets: sewer conduits; under it all, 32 m of ground (topsoil, clay, the old
// gravel bed, sand, rock with dark seams, granite, bedrock) — and, deep under Urahara Shop, his training ground.
// Everything is ordinary destructible matter (8 vox/m), built hollow so collapses look right.
import { Rng } from '../core/rng';
import { createBaseMaterials } from '../voxel/materials';
import { VoxelWorld } from '../voxel/world';
import { Builder } from './build';
import { tree } from './testArena';
import { busStop, car, CAR_PAINTS, carport, foundation, hipRoof, konbini, lotFrame, office, sewers, shrine, streetLamp, trafficLight, uraharaShop, type Lot, type Span } from './townParts';
import {
  bicycle, bus, carPark, constructionSite, curveMirror, departmentStore, footbridge, guardRail, hospital, hydrant, koban, lorry, petrolStation,
  phoneBooth, powerLine, pylon, railViaduct, smokestack, stationBuilding, stationPlatforms, stopSign, streetTree, tank, taxi, train, trainingGround,
  van, warehouse, type Block,
} from './cityParts';

export interface TownInfo {
  world: VoxelWorld;
  /** ground height in metres */
  ground: number;
  spawn: [number, number];
  /** the heading at the spawn (yaw: forward = (sin, cos)), down the street so whoever spawns ahead lands on the road */
  spawnYaw: number;
  /** named spots (metres): school yard, clinic, river, bridge… */
  spots: Record<string, [number, number]>;
  /** the river's water band along z (metres), for the backdrop to carry it on past the map */
  river: [number, number];
  /** the map's side in metres */
  size: number;
}

/** metres of ground under the streets, and of sky over them */
export const TOWN_GROUND = 32;
const TOWN_SKY = 72;

type TownBlock = Block & { i: number; j: number };

export function generateKarakura(seed = 7, sizeM = 320): TownInfo {
  const mats = createBaseMaterials();
  const w = VoxelWorld.fromMeters(mats, { x: sizeM, y: TOWN_GROUND + TOWN_SKY, z: sizeM }, 0.125);
  const b = new Builder(w);
  const rng = new Rng(seed);
  const v = (m: number) => b.v(m);
  // the plan is drawn for 320 m: P() places plan metres on a map of another size
  const k = sizeM / 320;
  const P = (m: number) => v(m * k);
  const G = v(TOWN_GROUND);
  const id = (n: string) => b.id(n);
  const S = w.sx;
  const vs = w.vs;
  const toM = (vx: number) => vx * vs;
  // pack the chunks a phase has opened up before the next one, so the whole town never sits in dense arrays at once
  const settle = () => w.compressHot(2500);

  // ---- the ground: one shared layer per chunk row, then boulders, lenses and knobs for the walls of deep craters
  const bedrock = w.bedrockId, grass = id('grass'), dirt = id('dirt'), clay = id('clay'), gravelD = id('gravel_dark'), sand = id('sand');
  const stone = id('stone'), stoneD = id('stone_dark'), granite = id('granite');
  w.fillStrata(G, (y) => {
    if (y < 2) return bedrock;
    const d = (G - y) / 8;
    return d <= 0.125 ? grass : d <= 1 ? dirt : d <= 4.4 ? clay : d <= 5 ? gravelD : d <= 7.5 ? sand : d <= 8 ? gravelD : d <= 11.2 ? stone : d <= 11.8 ? stoneD : d <= 16 ? stone : d <= 17.2 ? stoneD : d <= 25 ? stone : granite;
  });
  for (let i = 0; i < Math.round(190 * k * k); i++) {
    const x = rng.int(4, S - 4), z = rng.int(4, S - 4);
    const r = rng.next();
    if (r < 0.35) b.ellipsoid(x, G - v(rng.range(2, 3.8)), z, v(rng.range(0.4, 0.9)), v(rng.range(0.3, 0.6)), v(rng.range(0.4, 0.9)), stone);
    else if (r < 0.7) b.ellipsoid(x, G - v(rng.range(9, 24)), z, v(rng.range(1.5, 4)), v(rng.range(0.4, 0.9)), v(rng.range(1.5, 4)), stoneD);
    else if (r < 0.85) b.ellipsoid(x, G - v(rng.range(5.6, 7)), z, v(rng.range(1, 2.5)), v(rng.range(0.3, 0.5)), v(rng.range(1, 2.5)), gravelD);
    else b.ellipsoid(x, G - v(rng.range(20, 28)), z, v(rng.range(2, 5)), v(rng.range(0.8, 1.6)), v(rng.range(2, 5)), granite);
  }
  settle();

  // ---- the river along the south (east-west), between grassy embankments
  const rz0 = P(254), rz1 = rz0 + P(16);
  const bank = v(6);
  const waterY = G - v(2.4), bedY = G - v(4);
  for (let z = rz0 - bank; z < rz1 + bank; z++) {
    const inBank = z < rz0 ? (z - (rz0 - bank)) / bank : z >= rz1 ? (rz1 + bank - z) / bank : 1;
    const depth = z < rz0 || z >= rz1 ? Math.round(inBank * (G - waterY)) : G - bedY;
    const top = G - depth;
    b.box(0, top, z, S, G, z + 1, 0);
    if (z >= rz0 && z < rz1) {
      b.box(0, bedY - 1, z, S, bedY, z + 1, id('gravel'));
      b.box(0, bedY, z, S, waterY, z + 1, id('water'));
    } else b.box(0, top - 1, z, S, top, z + 1, grass);
  }
  // the riverside path along the top of the north bank, a guard rail on its river side
  b.box(0, G - 1, rz0 - bank - v(3), S, G, rz0 - bank, id('gravel'));
  settle();

  // ---- the road grid: five north-south roads (B and D the avenues), five east-west (the main street, the railway's)
  const roadsX: Span[] = [[P(34), P(41)], [P(96), P(106)], [P(160), P(167)], [P(222), P(232)], [P(280), P(287)]];
  const roadsZ: Span[] = [[P(26), P(33)], [P(72), P(82)], [P(118), P(125)], [P(176), P(186)], [P(222), P(229)]];
  const MAIN = 1, RAIL = 3, AVENUES = [1, 3];
  const north = rz0 - bank - v(3);
  const asphalt = id('asphalt'), white = id('road_white'), pave = id('pavement'), curb = id('curb'), gravel = id('gravel');
  const sw = v(2);
  const roadZ = (z0: number, z1: number, x0 = 0, x1 = S) => {
    b.box(x0, G - 2, z0 - sw, x1, G + 1, z1 + sw, 0);
    b.box(x0, G - 6, z0 - sw, x1, G - 2, z1 + sw, gravel);
    b.box(x0, G - 2, z0, x1, G, z1, asphalt);
    b.box(x0, G - 1, z0 - sw, x1, G + 1, z0, pave);
    b.box(x0, G - 1, z1, x1, G + 1, z1 + sw, pave);
    b.box(x0, G, z0 - 1, x1, G + 1, z0, curb);
    b.box(x0, G, z1, x1, G + 1, z1 + 1, curb);
    if (z1 - z0 >= v(8)) for (let x = x0; x < x1; x += v(5)) b.box(x, G - 1, (z0 + z1) >> 1, x + v(2.5), G, ((z0 + z1) >> 1) + 1, white);
    b.box(x0, G - 1, z0 + 2, x1, G, z0 + 3, white);
    b.box(x0, G - 1, z1 - 3, x1, G, z1 - 2, white);
  };
  const roadX = (x0: number, x1: number, z0 = 0, z1 = north) => {
    b.box(x0 - sw, G - 2, z0, x1 + sw, G + 1, z1, 0);
    b.box(x0 - sw, G - 6, z0, x1 + sw, G - 2, z1, gravel);
    b.box(x0, G - 2, z0, x1, G, z1, asphalt);
    b.box(x0 - sw, G - 1, z0, x0, G + 1, z1, pave);
    b.box(x1, G - 1, z0, x1 + sw, G + 1, z1, pave);
    b.box(x0 - 1, G, z0, x0, G + 1, z1, curb);
    b.box(x1, G, z0, x1 + 1, G + 1, z1, curb);
    if (x1 - x0 >= v(8)) for (let z = z0; z < z1; z += v(5)) b.box((x0 + x1) >> 1, G - 1, z, ((x0 + x1) >> 1) + 1, G, z + v(2.5), white);
    b.box(x0 + 2, G - 1, z0, x0 + 3, G, z1, white);
    b.box(x1 - 3, G - 1, z0, x1 - 2, G, z1, white);
  };
  // a crossing: the roadways meet in a plus of asphalt; the four corners stay raised pavement with their kerbs
  const crossing = (x0: number, x1: number, z0: number, z1: number) => {
    b.box(x0, G - 2, z0 - sw, x1, G, z1 + sw, asphalt);
    b.box(x0 - sw, G - 2, z0, x1 + sw, G, z1, asphalt);
    b.box(x0, G, z0 - sw, x1, G + 1, z1 + sw, 0);
    b.box(x0 - sw, G, z0, x1 + sw, G + 1, z1, 0);
    for (let x = x0 + 2; x < x1 - 2; x += 6) {
      b.box(x, G - 1, z0 - sw, x + 3, G, z0, white);
      b.box(x, G - 1, z1, x + 3, G, z1 + sw, white);
    }
    for (let z = z0 + 2; z < z1 - 2; z += 6) {
      b.box(x0 - sw, G - 1, z, x0, G, z + 3, white);
      b.box(x1, G - 1, z, x1 + sw, G, z + 3, white);
    }
  };
  for (const [z0, z1] of roadsZ) roadZ(z0, z1);
  for (const [x0, x1] of roadsX) roadX(x0, x1);
  for (const [x0, x1] of roadsX) for (const [z0, z1] of roadsZ) crossing(x0, x1, z0, z1);
  // the avenues carry on over the river on bridges to the road along the far bank
  const farZ: Span = [rz1 + bank + v(5), rz1 + bank + v(12)];
  roadZ(farZ[0], farZ[1], 0, S);
  const bridges: Span[] = [];
  for (const xi of AVENUES) {
    const [bx0, bx1] = roadsX[xi];
    bridge(b, bx0 - sw, bx1 + sw, north, rz1 + bank + v(4), G, waterY);
    roadX(bx0, bx1, rz1 + bank + v(4), S);
    crossing(bx0, bx1, farZ[0], farZ[1]);
    bridges.push([bx0 - sw, bx1 + sw]);
  }
  settle();

  // ---- the elevated railway over the fourth east-west road, end to end
  const [railZ0, railZ1] = roadsZ[RAIL];
  const rail = railViaduct(b, railZ0, railZ1, S, G, roadsX.map(([a, c]): Span => [a - sw, c + sw]));
  const wireY = rail.railTop + v(5.1);
  settle();

  // ---- blocks between the roads, numbered (i west → east, j north → south)
  const xs = [0, ...roadsX.flatMap(([a, c]) => [a - sw, c + sw]), S];
  const zs = [0, ...roadsZ.flatMap(([a, c]) => [a - sw, c + sw]), north];
  const blocks: TownBlock[] = [];
  for (let i = 0; i < xs.length; i += 2)
    for (let j = 0; j < zs.length; j += 2) {
      const x0 = xs[i] + 1, x1 = xs[i + 1] - 1, z0 = zs[j] + 1, z1 = zs[j + 1] - 1;
      if (x1 - x0 > v(10) && z1 - z0 > v(10)) blocks.push({ x0, z0, x1, z1, i: i >> 1, j: j >> 1 });
    }
  const at = (i: number, j: number) => blocks.find((bk) => bk.i === i && bk.j === j);
  const centre = (bk: Block): [number, number] => [toM((bk.x0 + bk.x1) / 2), toM((bk.z0 + bk.z1) / 2)];
  const spots: Record<string, [number, number]> = {};
  const shrineB = at(0, 2), schoolB = at(1, 3), stationB = at(2, 3), hospitalB = at(3, 3), siteB = at(4, 3);
  const deptB = at(3, 1), parkB = at(2, 4), clinicB = at(0, 3), uraharaB = at(1, 4), petrolB = at(1, 2), carParkB = at(4, 2);
  const downtown = (bk: TownBlock) => (bk.i === 3 || bk.i === 4 || bk.i === 5) && (bk.j === 1 || bk.j === 2);
  /** the road a lot fronts: 'main' (the main street or an avenue), 'rail' (under the viaduct), 'side', or none */
  const frontage = (bk: TownBlock, lot: Lot): 'main' | 'rail' | 'side' | null => {
    if (lot.face === 'n' || lot.face === 's') {
      const zi = lot.face === 'n' ? bk.j - 1 : bk.j;
      if (zi < 0 || zi >= roadsZ.length) return null;
      return zi === MAIN ? 'main' : zi === RAIL ? 'rail' : 'side';
    }
    const xi = lot.face === 'w' ? bk.i - 1 : bk.i;
    if (xi < 0 || xi >= roadsX.length) return null;
    return AVENUES.includes(xi) ? 'main' : 'side';
  };
  let hatch: [number, number] | null = null;
  let crane: [number, number, number] | null = null;
  for (const bk of blocks) {
    if (bk === shrineB) {
      const face = 'n';
      shrine(b, { ...bk, face }, G, rng);
      spots.shrine = centre(bk);
    } else if (bk === schoolB) {
      school(b, bk, G, rng);
      spots.school = centre(bk);
    } else if (bk === parkB) {
      park(b, bk, G, rng);
      spots.park = centre(bk);
    } else if (bk === deptB) {
      departmentStore(b, bk, G, rng);
      spots.store = centre(bk);
    } else if (bk === hospitalB) {
      hospital(b, bk, G, rng, 'n');
      spots.hospital = centre(bk);
    } else if (bk === siteB) {
      crane = constructionSite(b, bk, G, rng).crane;
      spots.site = centre(bk);
    } else if (bk === stationB) {
      stationBlock(b, bk, G, rng, rail);
      spots.station = [toM((bk.x0 + bk.x1) / 2), toM(bk.z0 + v(8))];
    } else if (bk.j === roadsZ.length) {
      riverside(b, bk, G, rng, [P(16) - v(7), P(16) + v(7)]);
    } else {
      const lots = subdivide(bk, v, rng);
      const shopLot = bk === uraharaB ? lots.filter((l) => l.face === 's')[Math.floor(lots.filter((l) => l.face === 's').length / 2)] : null;
      const petrolLot = bk === petrolB ? lots.find((l) => l.face === 'n') : null;
      const carParkLot = bk === carParkB ? lots.find((l) => l.face === 's' && l.x1 - l.x0 >= v(11)) : null;
      lots.forEach((lot, li) => {
        if (bk === clinicB && lot === lots.find((l) => l.face === 'e')) {
          clinic(b, lot, G);
          spots.clinic = [toM((lot.x0 + lot.x1) / 2), toM((lot.z0 + lot.z1) / 2)];
          return;
        }
        if (lot === shopLot) {
          hatch = uraharaShop(b, lot, G);
          spots.urahara = [toM((lot.x0 + lot.x1) / 2), toM((lot.z0 + lot.z1) / 2)];
          return;
        }
        if (lot === petrolLot) {
          petrolStation(b, lot, G, rng);
          return;
        }
        if (lot === carParkLot) {
          carPark(b, lot, G, rng, CAR_PAINTS);
          return;
        }
        const front = frontage(bk, lot);
        const big = lot.x1 - lot.x0 >= v(11) && lot.z1 - lot.z0 >= v(11);
        const deep = (lot.face === 'n' || lot.face === 's' ? lot.z1 - lot.z0 : lot.x1 - lot.x0) >= v(13);
        const r = rng.next();
        if (downtown(bk)) {
          if (big && r < 0.5) office(b, lot, G, rng, rng.int(11, 17));
          else if (big && r < 0.72) office(b, lot, G, rng);
          else if (deep && r < 0.8) konbini(b, lot, G, rng);
          else if (r < 0.9) shop(b, lot, G, rng);
          else apartment(b, lot, G, rng);
        } else if (front === 'main' || front === 'rail') {
          if (big && r < 0.26) office(b, lot, G, rng);
          else if (deep && r < 0.38) konbini(b, lot, G, rng);
          else if (r < 0.74) shop(b, lot, G, rng);
          else if (r < 0.88) apartment(b, lot, G, rng);
          else houseJP(b, lot, G, rng);
        } else {
          if (deep && r < 0.03) konbini(b, lot, G, rng);
          else if (r < 0.24) apartment(b, lot, G, rng);
          else houseJP(b, lot, G, rng);
        }
      });
    }
    settle();
  }
  // the road along the far bank: warehouses, a works with its smokestack, a tank farm, lorries (clear of the pylon)
  const pylonX = P(16);
  {
    const fz0 = farZ[1] + sw + 1, fz1 = S - 1;
    const cuts = [...bridges.map(([a, c]): Span => [a, c]), [pylonX - v(6), pylonX + v(6)] as Span].sort((p, q) => p[0] - q[0]);
    let x = 1, n = 0;
    while (x < S - v(14)) {
      const cut = cuts.find(([a, c]) => x < c && x + v(18) > a);
      if (cut) {
        x = cut[1] + 1;
        continue;
      }
      const lw = Math.min(v(rng.range(24, 34)), S - 1 - x);
      const next = cuts.find(([a]) => a > x);
      const x1 = next ? Math.min(x + lw, next[0] - 1) : x + lw;
      if (x1 - x < v(14)) {
        x = x1 + 1;
        continue;
      }
      const lot: Lot = { x0: x, z0: fz0, x1, z1: fz1, face: 'n' };
      if (n === 2) {
        // the tank farm
        b.box(x + 1, G - 2, fz0 + 1, x1 - 1, G, fz1 - 1, id('concrete'));
        const r = v(4.2);
        for (let tx = x + r + v(2); tx + r < x1 - v(1); tx += 2 * r + v(3)) tank(b, tx, (fz0 + fz1) >> 1, G, r, v(rng.range(8, 11)));
        b.walls(x + 1, G, fz0 + 1, x1 - 1, G + v(1), fz1 - 1, 2, id('concrete'));
      } else warehouse(b, lot, G, rng, n === 4);
      n++;
      x = x1 + 1;
    }
    spots.works = [toM(S / 2), toM((fz0 + fz1) / 2)];
    settle();
  }

  // ---- the riverside: sakura on the north bank, benches; the high-voltage line over the river
  const [ax0, ax1] = roadsX[AVENUES[0]];
  for (let x = v(6); x < S - v(6); x += v(rng.range(9, 13))) {
    if (bridges.some(([a, c]) => x > a - v(4) && x < c + v(4)) || Math.abs(x - pylonX) < v(7)) continue;
    sakura(b, x, G, rz0 - bank - v(5.5), rng);
  }
  for (const [a, c] of [[0, bridges[0][0]], [bridges[0][1], bridges[1][0]], [bridges[1][1], S]]) guardRail(b, true, a + v(1), c - v(1), rz0 - bank - 2, G);
  spots.river = [toM((ax0 + ax1) / 2) - 30 * k, toM(rz0 + v(8))];
  spots.bridge = [toM((ax0 + ax1) / 2), toM(rz0 + v(8))];
  {
    const nz = rz0 - bank - v(8), sz = farZ[1] + sw + v(7);
    const a = pylon(b, pylonX, nz, G, true), c = pylon(b, pylonX, sz, G, true);
    for (let i = 0; i < a.length; i++) powerLine(b, a[i], c[i], v(5));
    spots.pylon = [toM(pylonX), toM(nz)];
  }
  settle();

  // ---- footbridges over the main street and avenue D (their stairs run 13 m along the pavements)
  const bridgeMainX = P(132), bridgeDZ = P(100);
  const nearFootbridgeX = (x: number) => x > bridgeMainX - v(4) && x < bridgeMainX + v(16);
  const nearFootbridgeZ = (z: number) => z > bridgeDZ - v(4) && z < bridgeDZ + v(16);
  {
    const [mz0, mz1] = roadsZ[MAIN];
    footbridge(b, bridgeMainX, mz0 - sw, mz1 + sw, G + 1, true);
    const [dx0, dx1] = roadsX[AVENUES[1]];
    footbridge(b, bridgeDZ, dx0 - sw, dx1 + sw, G + 1, false);
  }
  // ---- utility poles along the quieter east-west roads with their wires (not under the viaduct)
  const nearCross = (x: number) => roadsX.some(([a, c]) => x > a - sw - v(3) && x < c + sw + v(3));
  const nearCrossZ = (z: number) => roadsZ.some(([a, c]) => z > a - sw - v(3) && z < c + sw + v(3));
  roadsZ.forEach(([z0], zi) => {
    if (zi === RAIL) return;
    const zp = z0 - sw + 2;
    let prev: [number, number] | null = null;
    for (let x = v(6); x < S - v(4); x += v(16)) {
      if (roadsX.some(([a, c]) => x > a - sw - 4 && x < c + sw + 4) || (zi === MAIN && nearFootbridgeX(x))) { prev = null; continue; }
      pole(b, x, zp, G);
      if (prev) wires(b, prev[0], x, zp, G + v(8.2));
      prev = [x, zp];
    }
  });
  // vending machines, mailboxes and hydrants at the corners; curve mirrors and stop signs where two side roads meet
  roadsX.forEach(([x0, x1], xi) =>
    roadsZ.forEach(([z0, z1], zi) => {
      if (zi === RAIL) return;
      if (rng.chance(0.6)) vending(b, x0 - sw - v(1.4), z0 - sw - v(1.1), G, rng);
      if (rng.chance(0.4)) b.box(x0 - sw - v(0.9), G + 1, z0 - sw - v(2.6), x0 - sw - v(0.3), G + v(1.3), z0 - sw - v(2.1), id('mailbox'));
      if (rng.chance(0.35)) hydrant(b, x1 + sw - 3, z1 + sw - v(1.5), G + 1);
      const minor = !AVENUES.includes(xi) && zi !== MAIN;
      if (minor) {
        curveMirror(b, x1 + sw - 2, z0 - sw + 2, G + 1, -1, 0);
        stopSign(b, x0 - sw + 2, z1 + sw - 3, G + 1, 0, 1);
      }
    }),
  );
  // ---- street lamps: the south kerb of the east-west roads (the poles have the north), both kerbs of the others
  roadsZ.forEach(([, z1], zi) => {
    if (zi === RAIL) return;
    for (let x = v(10); x < S - v(6); x += v(20)) if (!nearCross(x) && !(zi === MAIN && nearFootbridgeX(x))) streetLamp(b, x, z1 + sw - 3, G + 1, 0, -1);
  });
  for (const [xi, [x0, x1]] of roadsX.entries())
    for (let z = v(8); z < north - v(4); z += v(20)) {
      if (nearCrossZ(z) || (xi === AVENUES[1] && nearFootbridgeZ(z))) continue;
      streetLamp(b, x0 - sw + 2, z, G + 1, 1, 0);
      if (!nearCrossZ(z + v(10)) && z + v(10) < north - v(4) && !(xi === AVENUES[1] && nearFootbridgeZ(z + v(10)))) streetLamp(b, x1 + sw - 3, z + v(10), G + 1, -1, 0);
    }
  // ---- traffic lights wherever the main street or an avenue crosses
  roadsX.forEach(([x0, x1], xi) =>
    roadsZ.forEach(([z0, z1], zi) => {
      if (zi !== MAIN && !AVENUES.includes(xi)) return;
      trafficLight(b, x0 - sw + 2, z0 - sw + 2, G + 1, 0, 1);
      trafficLight(b, x1 + sw - 3, z1 + sw - 3, G + 1, 0, -1);
      trafficLight(b, x1 + sw - 3, z0 - sw + 2, G + 1, -1, 0);
      trafficLight(b, x0 - sw + 2, z1 + sw - 3, G + 1, 1, 0);
    }),
  );
  // ---- street trees down both pavements of the avenues (clear of the bus stops and the footbridge)
  const avenueStops = [P(50), P(150), P(204)];
  for (const xi of AVENUES) {
    const [x0, x1] = roadsX[xi];
    for (let z = v(6); z < north - v(3); z += v(9)) {
      if (nearCrossZ(z) || avenueStops.some((q) => Math.abs(q - z) < v(4.5)) || (xi === AVENUES[1] && nearFootbridgeZ(z))) continue;
      streetTree(b, x0 - sw + 4, z, G + 1, rng, xi === AVENUES[1]);
      streetTree(b, x1 + sw - 5, z + v(4.5), G + 1, rng, xi === AVENUES[1]);
    }
  }
  // ---- bus stops on the main street and the avenues; phone booths on the pavement past a corner
  {
    const [, z1] = roadsZ[MAIN];
    for (const x of [P(64), P(152), P(196), P(258)]) if (!nearCross(x) && !nearFootbridgeX(x)) busStop(b, x, z1 + 3, G + 1, true);
    for (const xi of AVENUES) {
      const [x0] = roadsX[xi];
      for (const z of avenueStops) if (!nearCrossZ(z)) busStop(b, x0 - 3, z, G + 1, false);
    }
    phoneBooth(b, roadsX[1][1] + v(1), roadsZ[MAIN][1] + sw + v(2), G + 1);
    phoneBooth(b, roadsX[3][0] - v(1), roadsZ[0][1] + sw + v(2), G + 1);
  }
  // ---- parked cars, vans and lorries along the kerbs of the quieter roads
  for (const zi of [0, 2, 4]) {
    const [z0] = roadsZ[zi];
    for (let x = v(12); x < S - v(12); x += v(rng.range(14, 30))) {
      if (nearCross(x) || !rng.chance(0.6)) continue;
      const r = rng.next();
      if (r < 0.15) van(b, x, z0 + 9, G, true, id(rng.pick(['paint_white', 'car_silver', 'paint_blue'])), rng.chance(0.5));
      else if (r < 0.22) lorry(b, x, z0 + 10, G, true, id(rng.pick(['paint_white', 'car_silver'])), rng.chance(0.5));
      else car(b, x, z0 + 9, G, true, id(rng.pick(CAR_PAINTS)), rng.chance(0.5));
    }
  }
  for (const xi of [0, 2, 4]) {
    const [x0] = roadsX[xi];
    for (let z = v(10); z < north - v(10); z += v(rng.range(16, 30))) if (!nearCrossZ(z) && rng.chance(0.55)) car(b, x0 + 9, z, G, false, id(rng.pick(CAR_PAINTS)), rng.chance(0.5));
  }
  settle();

  // ---- under the streets (none under the viaduct's piers), and deep under Urahara Shop, his training ground
  sewers(b, G, roadsX, roadsZ.filter((_, i) => i !== RAIL), north - v(1), S);
  settle();
  if (uraharaB && hatch) {
    const [hx, hz] = hatch as [number, number];
    const cx = Math.max(P(26), Math.min(S - P(26), hx)), cz = Math.min(hz, rz0 - bank - P(26));
    const floor = G - v(29), ceil = G - v(12);
    trainingGround(b, cx, cz, P(22), P(19), floor, ceil, [hx, hz], G + 2, rng);
    spots.training = [toM(cx), toM(cz)];
  }
  if (crane) spots.crane = [toM(crane[0]), toM(crane[2])];
  w.compressAll();
  const spawn: [number, number] = [toM(P(128)), toM((roadsZ[MAIN][0] + roadsZ[MAIN][1]) / 2)];
  return { world: w, ground: toM(G), spawn, spawnYaw: Math.PI / 2, spots, river: [toM(rz0), toM(rz1)], size: sizeM };
}

/**
 * The station block: Karakura Station along the viaduct (the platforms on the deck, the building against them with its
 * concourse at platform height), a train at the north platform, and the forecourt in front — paving, the bus terminal
 * with a bus in, the taxi rank, planted trees, a police box, a phone booth and the bicycle racks.
 */
function stationBlock(b: Builder, bk: Block, G: number, rng: Rng, rail: ReturnType<typeof railViaduct>): void {
  const v = (m: number) => b.v(m);
  const x0 = bk.x0 + v(1), x1 = bk.x1 - v(1);
  const top = stationPlatforms(b, rail, x0, x1);
  const depth = v(15);
  stationBuilding(b, x0 + v(2), x1 - v(2), bk.z1, depth, G, top, -1);
  train(b, ((x0 + x1) >> 1) - v(30), rail.tracks[0], rail.railTop, 3, rail.railTop + v(5.1));
  // the forecourt
  const fz0 = bk.z0, fz1 = bk.z1 - depth;
  b.box(bk.x0, G - 1, fz0, bk.x1, G, fz1, b.id('stone_path'));
  b.box(bk.x0, G - 1, fz0, bk.x1, G, fz0 + v(1.2), b.id('pavement'));
  // the bus terminal: an island with shelters along the west half, a bus at the stand
  const iz = fz0 + v(7);
  b.box(bk.x0 + v(4), G, iz, ((bk.x0 + bk.x1) >> 1) - v(3), G + 1, iz + v(3), b.id('curb'));
  busStop(b, bk.x0 + v(10), iz + 2, G + 1, true);
  busStop(b, bk.x0 + v(20), iz + 2, G + 1, true);
  bus(b, bk.x0 + v(15), iz - v(2.2), G, true, true);
  // the taxi rank on the east half
  for (let i = 0; i < 3; i++) taxi(b, ((bk.x0 + bk.x1) >> 1) + v(6) + i * v(5.2), iz + v(1.5), G, true, true);
  // trees in planters, a clock on its pole, the police box, a phone booth, bicycles
  for (let x = bk.x0 + v(5); x < bk.x1 - v(4); x += v(9)) {
    if (Math.abs(x - ((bk.x0 + bk.x1) >> 1)) < v(8.5)) continue; // the entrance canopy
    b.box(x - v(1), G, fz1 - v(4), x + v(1), G + v(0.6), fz1 - v(2), b.id('concrete'));
    streetTree(b, x, fz1 - v(3), G + v(0.6), rng);
  }
  const cx = (bk.x0 + bk.x1) >> 1;
  b.box(cx - 1, G, fz0 + v(3), cx + 1, G + v(4), fz0 + v(3) + 2, b.id('metal'));
  b.box(cx - v(0.6), G + v(4), fz0 + v(3) - 2, cx + v(0.6), G + v(5), fz0 + v(3) + 4, b.id('paint_white'));
  b.box(cx, G + v(4.3), fz0 + v(3) - 3, cx + 1, G + v(4.8), fz0 + v(3) - 2, b.id('metal_dark'));
  koban(b, bk.x1 - v(4), fz0 + v(4), G, -1, 0);
  phoneBooth(b, bk.x1 - v(4), fz0 + v(8), G);
  for (let i = 0; i < 7; i++) bicycle(b, bk.x0 + v(3) + i * 4, fz1 - v(7), G, false, b.id(rng.pick(['paint_red', 'paint_blue', 'paint_white', 'metal_dark', 'paint_yellow'])));
}

/** A strip of riverside park between the last street and the riverside path: lawn, a footpath, benches, lamps. */
function riverside(b: Builder, bk: Block, G: number, rng: Rng, avoid: Span): void {
  const v = (m: number) => b.v(m);
  const mid = (bk.z0 + bk.z1) >> 1;
  b.box(bk.x0, G - 1, mid - v(1), bk.x1, G, mid + v(1), b.id('stone_path'));
  for (let x = bk.x0 + v(4); x < bk.x1 - v(4); x += v(14)) {
    if (x + v(9) > avoid[0] && x < avoid[1]) continue;
    b.box(x, G + v(0.4), mid - v(1.8), x + v(1.8), G + v(0.5), mid - v(1.3), b.id('wood'));
    b.box(x, G + v(0.5), mid - v(1.8), x + v(1.8), G + v(0.9), mid - v(1.7), b.id('wood'));
    b.box(x + 1, G, mid - v(1.7), x + 2, G + v(0.4), mid - v(1.4), b.id('metal_dark'));
    b.box(x + v(1.8) - 2, G, mid - v(1.7), x + v(1.8) - 1, G + v(0.4), mid - v(1.4), b.id('metal_dark'));
    if (rng.chance(0.5)) streetLamp(b, x + v(7), mid + v(1.4), G, 0, -1);
  }
  if (bk.x1 - bk.x0 > v(30) && rng.chance(0.5) && !(bk.x0 + v(16) > avoid[0] && bk.x0 < avoid[1])) {
    const px = bk.x0 + v(8);
    b.box(px, G - 1, bk.z0 + v(1), px + v(8), G, mid - v(2), b.id('sand'));
    b.line(px + v(1), G, bk.z0 + v(2), px + v(2), G + v(2.2), bk.z0 + v(2), 1, b.id('paint_red'));
    b.line(px + v(3), G, bk.z0 + v(2), px + v(2), G + v(2.2), bk.z0 + v(2), 1, b.id('paint_red'));
    b.box(px + v(1), G + v(2.2), bk.z0 + v(2), px + v(6), G + v(2.2) + 1, bk.z0 + v(2) + 1, b.id('paint_red'));
  }
}

// ------------------------------------------------------------------------------------------- lots

function subdivide(bk: { x0: number; z0: number; x1: number; z1: number }, v: (m: number) => number, rng: Rng): Lot[] {
  const lots: Lot[] = [];
  const w = bk.x1 - bk.x0, d = bk.z1 - bk.z0;
  const along = w >= d ? 'x' : 'z';
  // two rows back to back, each lot faces outward
  const depth = Math.floor((along === 'x' ? d : w) / 2);
  const len = along === 'x' ? w : d;
  let p = 0;
  while (p < len - v(7)) {
    const lw = Math.min(len - p, v(rng.range(10, 15)));
    for (const half of [0, 1]) {
      if (along === 'x') {
        const z0 = half ? bk.z0 + depth : bk.z0, z1 = half ? bk.z1 : bk.z0 + depth;
        lots.push({ x0: bk.x0 + p, x1: bk.x0 + p + lw, z0, z1, face: half ? 's' : 'n' });
      } else {
        const x0 = half ? bk.x0 + depth : bk.x0, x1 = half ? bk.x1 : bk.x0 + depth;
        lots.push({ x0, x1, z0: bk.z0 + p, z1: bk.z0 + p + lw, face: half ? 'e' : 'w' });
      }
    }
    p += lw;
  }
  return lots;
}

/** Block-wall fence around a lot with a gate gap on the facing side. */
function lotWall(b: Builder, lot: Lot, G: number, gateAt = 0.3): void {
  const cinder = b.id('cinder'), cap = b.id('concrete');
  const h = b.v(1.2);
  const { x0, z0, x1, z1 } = lot;
  const segs: [number, number, number, number][] = [[x0, z0, x1, z0 + 1], [x0, z1 - 1, x1, z1], [x0, z0, x0 + 1, z1], [x1 - 1, z0, x1, z1]];
  for (const [a, c, e, f] of segs) {
    b.box(a, G, c, e, G + h, f, cinder);
    b.box(a, G + h, c, e, G + h + 1, f, cap);
  }
  // gate gap on the road side
  const gw = b.v(1.6);
  if (lot.face === 'n') { const gx = x0 + Math.floor((x1 - x0) * gateAt); b.box(gx, G, z0, gx + gw, G + h + 1, z0 + 1, 0); }
  if (lot.face === 's') { const gx = x0 + Math.floor((x1 - x0) * gateAt); b.box(gx, G, z1 - 1, gx + gw, G + h + 1, z1, 0); }
  if (lot.face === 'w') { const gz = z0 + Math.floor((z1 - z0) * gateAt); b.box(x0, G, gz, x0 + 1, G + h + 1, gz + gw, 0); }
  if (lot.face === 'e') { const gz = z0 + Math.floor((z1 - z0) * gateAt); b.box(x1 - 1, G, gz, x1, G + h + 1, gz + gw, 0); }
}

/** Gable roof over [x0,x1)×[z0,z1) at y, ridge along the longer axis, with overhang and ridge cap. */
function gableRoof(b: Builder, x0: number, z0: number, x1: number, z1: number, y: number, mat: number, over = 4): void {
  const ridgeX = x1 - x0 >= z1 - z0;
  const span = ridgeX ? z1 - z0 : x1 - x0;
  const half = Math.ceil(span / 2) + over;
  const cap = b.id('kawara');
  for (let k = 0; k <= half; k++) {
    const yy = y + Math.floor(k * 0.55);
    if (ridgeX) {
      b.box(x0 - over, yy, z0 - over + k, x1 + over, yy + 1, z0 - over + k + 1, mat);
      b.box(x0 - over, yy, z1 + over - k - 1, x1 + over, yy + 1, z1 + over - k, mat);
      // fill the gable ends (walls under the slope)
      if (k > over) {
        b.box(x0, y, z0 - over + k, x0 + 2, yy, z1 + over - k, b.id('plaster_white'));
        b.box(x1 - 2, y, z0 - over + k, x1, yy, z1 + over - k, b.id('plaster_white'));
      }
    } else {
      b.box(x0 - over + k, yy, z0 - over, x0 - over + k + 1, yy + 1, z1 + over, mat);
      b.box(x1 + over - k - 1, yy, z0 - over, x1 + over - k, yy + 1, z1 + over, mat);
      if (k > over) {
        b.box(x0 - over + k, y, z0, x1 + over - k, yy, z0 + 2, b.id('plaster_white'));
        b.box(x0 - over + k, y, z1 - 2, x1 + over - k, yy, z1, b.id('plaster_white'));
      }
    }
  }
  const ry = y + Math.floor(half * 0.55);
  if (ridgeX) b.box(x0 - over, ry, ((z0 + z1) >> 1) - 1, x1 + over, ry + 2, ((z0 + z1) >> 1) + 1, cap);
  else b.box(((x0 + x1) >> 1) - 1, ry, z0 - over, ((x0 + x1) >> 1) + 1, ry + 2, z1 + over, cap);
}

/** Windows on a wall plane (axis 'x' = wall runs along x at fixed z). */
function windowRow(b: Builder, axis: 'x' | 'z', a0: number, a1: number, fixed: number, y: number, t: number, mat: number, frame: number, step = 18, width = 9, height = 9): void {
  for (let a = a0 + 6; a + width < a1 - 4; a += step) {
    if (axis === 'x') {
      b.box(a, y, fixed, a + width, y + height, fixed + t, mat);
      b.box(a - 1, y - 1, fixed - 1, a + width + 1, y, fixed + t + 1, frame);
      b.box(a + (width >> 1), y, fixed, a + (width >> 1) + 1, y + height, fixed + t, frame);
    } else {
      b.box(fixed, y, a, fixed + t, y + height, a + width, mat);
      b.box(fixed - 1, y - 1, a - 1, fixed + t + 1, y, a + width + 1, frame);
      b.box(fixed, y, a + (width >> 1), fixed + t, y + height, a + (width >> 1) + 1, frame);
    }
  }
}

// ------------------------------------------------------------------------------------------- buildings

const WALLS = ['plaster_white', 'plaster_cream', 'plaster_beige', 'plaster_gray', 'plaster_blue', 'siding_beige', 'siding_blue'];
const ROOFS = ['kawara', 'kawara', 'kawara_brown', 'roof_red', 'roof_green', 'roof_slate'];

function houseJP(b: Builder, lot: Lot, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  lotWall(b, lot, G, rng.range(0.15, 0.7));
  const { W, D, box, pt, alongX } = lotFrame(lot);
  const wall = b.id(rng.pick(WALLS)), roof = b.id(rng.pick(ROOFS));
  const wood = b.id('wood_dark'), win = b.id(rng.chance(0.3) ? 'window_lit' : 'window'), floor = b.id('wood_light');
  const storey = v(2.9), t = 2;
  // the footprint in the lot's frame: set back from the street and the sides, at most ~11 m deep (a garden behind)
  let u1 = W - v(2) - v(rng.range(0, 2.5));
  const u0 = v(2), w0 = v(2) + v(rng.range(0, 1.2)), w1 = Math.min(D - v(2), w0 + v(rng.range(8.5, 11.5)));
  // a wide lot may keep a carport by the gate
  if (W >= v(13) && rng.chance(0.4)) {
    const cw = v(3.2), cd = v(5.4);
    const [ax, az] = pt(W - cw - v(0.4), 2), [cx, cz] = pt(W - v(0.4), 2 + cd);
    carport(b, Math.min(ax, cx), Math.min(az, cz), Math.max(ax, cx), Math.max(az, cz), G, !alongX, rng);
    box(b, W - cw - v(0.4), G, 0, W - v(0.4), G + v(1.3), 1, 0);
    u1 = Math.min(u1, W - cw - v(1));
  }
  const [ax, az] = pt(u0, w0), [cx, cz] = pt(u1, w1);
  const x0 = Math.min(ax, cx), z0 = Math.min(az, cz), hx1 = Math.max(ax, cx), hz1 = Math.max(az, cz);
  foundation(b, x0 - 1, z0 - 1, hx1 + 1, hz1 + 1, G, 1.0);
  b.box(x0 - 1, G, z0 - 1, hx1 + 1, G + 2, hz1 + 1, b.id('concrete'));
  const yb = G + 2;
  const floors = rng.chance(0.85) ? 2 : 1;
  b.walls(x0, yb, z0, hx1, yb + storey * floors, hz1, t, wall);
  for (let f = 0; f < floors; f++) b.box(x0, yb + f * storey, z0, hx1, yb + f * storey + 2, hz1, floor);
  // corner posts + floor band
  for (const [px, pz] of [[x0, z0], [hx1 - t, z0], [x0, hz1 - t], [hx1 - t, hz1 - t]]) b.box(px, yb, pz, px + t, yb + storey * floors, pz + t, wood);
  if (floors > 1) b.walls(x0, yb + storey - 1, z0, hx1, yb + storey + 1, hz1, t, b.id('wood'));
  // windows on all sides
  for (let f = 0; f < floors; f++) {
    const wy = yb + f * storey + v(0.9);
    windowRow(b, 'x', x0, hx1, z0, wy, t, win, wood, rng.int(16, 22), v(1.1), v(1.1));
    windowRow(b, 'x', x0, hx1, hz1 - t, wy, t, win, wood, rng.int(16, 22), v(1.1), v(1.1));
    windowRow(b, 'z', z0, hz1, x0, wy, t, win, wood, 20, v(1), v(1));
    windowRow(b, 'z', z0, hz1, hx1 - t, wy, t, win, wood, 20, v(1), v(1));
  }
  // entrance on the facing side: door + small canopy
  const door = b.id('wood');
  if (lot.face === 'n' || lot.face === 's') {
    const zf = lot.face === 'n' ? z0 : hz1 - t;
    const dx = x0 + v(1.2);
    b.box(dx, yb, zf, dx + v(1.1), yb + v(2.1), zf + t, door);
    const cz = lot.face === 'n' ? zf - v(1) : zf + t;
    b.box(dx - 2, yb + v(2.3), cz, dx + v(1.1) + 2, yb + v(2.3) + 1, cz + v(1), roof);
  } else {
    const xf = lot.face === 'w' ? x0 : hx1 - t;
    const dz = z0 + v(1.2);
    b.box(xf, yb, dz, xf + t, yb + v(2.1), dz + v(1.1), door);
    const cx = lot.face === 'w' ? xf - v(1) : xf + t;
    b.box(cx, yb + v(2.3), dz - 2, cx + v(1), yb + v(2.3) + 1, dz + v(1.1) + 2, roof);
  }
  // 2nd floor balcony with railing on the garden side
  if (floors > 1 && rng.chance(0.6)) {
    const by = yb + storey;
    const rail = b.id('metal');
    if (lot.face === 'n' || lot.face === 's') {
      const zb = lot.face === 'n' ? hz1 : z0 - v(1);
      b.box(x0 + v(1), by, zb, hx1 - v(1), by + 2, zb + v(1), b.id('concrete'));
      b.box(x0 + v(1), by + 2, lot.face === 'n' ? zb + v(1) - 1 : zb, hx1 - v(1), by + v(1), lot.face === 'n' ? zb + v(1) : zb + 1, rail);
    } else {
      const xb = lot.face === 'w' ? hx1 : x0 - v(1);
      b.box(xb, by, z0 + v(1), xb + v(1), by + 2, hz1 - v(1), b.id('concrete'));
      b.box(lot.face === 'w' ? xb + v(1) - 1 : xb, by + 2, z0 + v(1), lot.face === 'w' ? xb + v(1) : xb + 1, by + v(1), hz1 - v(1), rail);
    }
  }
  // roof: gabled, or hipped (寄棟) on a third of them
  if (rng.chance(0.35)) hipRoof(b, x0, z0, hx1, hz1, yb + storey * floors, roof, v(0.6));
  else gableRoof(b, x0, z0, hx1, hz1, yb + storey * floors, roof, v(0.6));
  // the garden behind: a tree or two, or a hedge along the back wall
  if (D - w1 > v(3.5) && rng.chance(0.7)) {
    const [tx, tz] = pt(rng.int(v(2.5), Math.max(v(2.6), W - v(2.5))), Math.min(D - v(2), w1 + v(2.2)));
    tree(b, tx, G, tz, rng);
  } else box(b, 2, G, D - v(1.2), W - 2, G + v(0.9), D - 2, b.id('hedge'));
  // AC unit
  if (rng.chance(0.5)) b.box(hx1, yb + v(0.3), z0 + v(2), hx1 + v(0.4), yb + v(0.9), z0 + v(2.8), b.id('paint_white'));
}

function apartment(b: Builder, lot: Lot, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const x0 = lot.x0 + v(1.5), z0 = lot.z0 + v(1.5), x1 = lot.x1 - v(1.5), z1 = lot.z1 - v(1.5);
  const floors = rng.int(3, 5);
  const storey = v(3);
  const h = floors * storey;
  const wall = b.id(rng.pick(['concrete', 'plaster_cream', 'tile_white', 'plaster_beige'])), slab = b.id('concrete');
  const win = b.id('window'), lit = b.id('window_lit'), rail = b.id('metal'), frame = b.id('metal_dark');
  foundation(b, x0 - 1, z0 - 1, x1 + 1, z1 + 1, G, 1.6);
  b.walls(x0, G, z0, x1, G + h, z1, 2, wall);
  for (let f = 0; f <= floors; f++) b.box(x0, G + f * storey, z0, x1, G + f * storey + 2, z1, slab);
  const facesX = lot.face === 'n' || lot.face === 's';
  for (let f = 0; f < floors; f++) {
    const y = G + f * storey;
    const wy = y + v(0.9);
    const m = rng.chance(0.3) ? lit : win;
    if (facesX) {
      windowRow(b, 'x', x0, x1, z0, wy, 2, m, frame, v(3), v(1.6), v(1.4));
      windowRow(b, 'x', x0, x1, z1 - 2, wy, 2, m, frame, v(3), v(1.6), v(1.4));
      // open corridor on the facing side
      const zc = lot.face === 'n' ? z0 - v(1.2) : z1;
      if (f > 0) {
        b.box(x0, y, zc, x1, y + 2, zc + v(1.2), slab);
        b.box(x0, y + 2, lot.face === 'n' ? zc : zc + v(1.2) - 2, x1, y + v(1.1), lot.face === 'n' ? zc + 2 : zc + v(1.2), rail);
      }
    } else {
      windowRow(b, 'z', z0, z1, x0, wy, 2, m, frame, v(3), v(1.6), v(1.4));
      windowRow(b, 'z', z0, z1, x1 - 2, wy, 2, m, frame, v(3), v(1.6), v(1.4));
      const xc = lot.face === 'w' ? x0 - v(1.2) : x1;
      if (f > 0) {
        b.box(xc, y, z0, xc + v(1.2), y + 2, z1, slab);
        b.box(lot.face === 'w' ? xc : xc + v(1.2) - 2, y + 2, z0, lot.face === 'w' ? xc + 2 : xc + v(1.2), y + v(1.1), z1, rail);
      }
    }
  }
  // roof parapet + water tank
  b.walls(x0, G + h, z0, x1, G + h + v(0.8), z1, 2, wall);
  const tx = x0 + v(2), tz = z0 + v(2);
  b.box(tx, G + h + 2, tz, tx + v(2), G + h + v(1.2), tz + v(2), frame);
  b.cylinderY(tx + v(1), tz + v(1), G + h + v(1.2), G + h + v(2.6), v(0.9), b.id('paint_white'));
}

function shop(b: Builder, lot: Lot, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const x0 = lot.x0 + 2, z0 = lot.z0 + 2, x1 = lot.x1 - 2, z1 = lot.z1 - 2;
  const floors = rng.int(2, 3);
  const storey = v(3.1);
  const wall = b.id(rng.pick(['plaster_cream', 'plaster_white', 'tile_white', 'brick', 'siding_beige']));
  const glass = b.id('glass'), frame = b.id('metal_dark'), slab = b.id('concrete');
  foundation(b, x0 - 1, z0 - 1, x1 + 1, z1 + 1, G, 1.2);
  b.walls(x0, G, z0, x1, G + floors * storey, z1, 2, wall);
  for (let f = 0; f <= floors; f++) b.box(x0, G + f * storey, z0, x1, G + f * storey + 2, z1, slab);
  const awn = b.id(rng.pick(['awning_red', 'awning_blue', 'awning_green']));
  const sign = b.id(rng.pick(['sign_red', 'sign_blue', 'sign_yellow', 'sign_white']));
  const win = b.id(rng.chance(0.4) ? 'window_lit' : 'window');
  const front = lot.face;
  const storefront = (axisX: boolean, fixed: number, out: number) => {
    // big glass front with mullions, shutter box, awning, sign board, upper windows
    if (axisX) {
      b.box(x0 + v(0.8), G + 2, fixed, x1 - v(0.8), G + v(2.6), fixed + 2, glass);
      for (let x = x0 + v(0.8); x < x1 - v(0.8); x += v(2)) b.box(x, G + 2, fixed, x + 1, G + v(2.6), fixed + 2, frame);
      b.box(x0 + v(0.6), G + v(2.6), fixed - 1, x1 - v(0.6), G + v(2.9), fixed + 2, b.id('shutter'));
      for (let k = 0; k < v(1.4); k++) b.box(x0 + v(0.4), G + v(2.9) - Math.floor(k * 0.4), fixed + out * (k + 1) - (out < 0 ? 1 : 0), x1 - v(0.4), G + v(2.9) - Math.floor(k * 0.4) + 1, fixed + out * (k + 1) + (out > 0 ? 1 : 0), awn);
      b.box(x0 + v(1), G + v(3.3), fixed + (out < 0 ? -2 : 2), x1 - v(1), G + v(4.3), fixed + (out < 0 ? 0 : 4), sign);
      for (let f = 1; f < floors; f++) windowRow(b, 'x', x0, x1, fixed, G + f * storey + v(0.9), 2, win, frame, v(2.6), v(1.4), v(1.3));
    } else {
      b.box(fixed, G + 2, z0 + v(0.8), fixed + 2, G + v(2.6), z1 - v(0.8), glass);
      for (let z = z0 + v(0.8); z < z1 - v(0.8); z += v(2)) b.box(fixed, G + 2, z, fixed + 2, G + v(2.6), z + 1, frame);
      b.box(fixed - 1, G + v(2.6), z0 + v(0.6), fixed + 2, G + v(2.9), z1 - v(0.6), b.id('shutter'));
      for (let k = 0; k < v(1.4); k++) b.box(fixed + out * (k + 1) - (out < 0 ? 1 : 0), G + v(2.9) - Math.floor(k * 0.4), z0 + v(0.4), fixed + out * (k + 1) + (out > 0 ? 1 : 0), G + v(2.9) - Math.floor(k * 0.4) + 1, z1 - v(0.4), awn);
      b.box(fixed + (out < 0 ? -2 : 2), G + v(3.3), z0 + v(1), fixed + (out < 0 ? 0 : 4), G + v(4.3), z1 - v(1), sign);
      for (let f = 1; f < floors; f++) windowRow(b, 'z', z0, z1, fixed, G + f * storey + v(0.9), 2, win, frame, v(2.6), v(1.4), v(1.3));
    }
  };
  if (front === 'n') storefront(true, z0, -1);
  else if (front === 's') storefront(true, z1 - 2, 1);
  else if (front === 'w') storefront(false, x0, -1);
  else storefront(false, x1 - 2, 1);
  // flat roof with parapet and a billboard sometimes
  const top = G + floors * storey;
  b.walls(x0, top, z0, x1, top + v(0.7), z1, 2, wall);
  if (rng.chance(0.35)) {
    const bbm = b.id(rng.pick(['sign_red', 'sign_blue', 'sign_yellow']));
    b.box(x0 + v(1), top + v(0.7), (z0 + z1) >> 1, x1 - v(1), top + v(3.2), ((z0 + z1) >> 1) + 2, bbm);
    b.box(x0 + v(1.5), top, ((z0 + z1) >> 1) + 2, x0 + v(1.5) + 2, top + v(3), ((z0 + z1) >> 1) + 4, b.id('metal_dark'));
    b.box(x1 - v(1.5) - 2, top, ((z0 + z1) >> 1) + 2, x1 - v(1.5), top + v(3), ((z0 + z1) >> 1) + 4, b.id('metal_dark'));
  }
}

function clinic(b: Builder, lot: Lot, G: number): void {
  // Kurosaki Clinic: two-storey family home with the clinic on the ground floor, sign by the door
  const v = (m: number) => b.v(m);
  const x0 = lot.x0 + v(1), z0 = lot.z0 + v(1), x1 = lot.x1 - v(1), z1 = lot.z1 - v(1);
  const wall = b.id('plaster_cream'), wood = b.id('wood_dark'), win = b.id('window'), slab = b.id('concrete');
  const storey = v(3);
  foundation(b, x0 - 1, z0 - 1, x1 + 1, z1 + 1, G, 1.2);
  b.box(x0 - 1, G, z0 - 1, x1 + 1, G + 2, z1 + 1, slab);
  b.walls(x0, G + 2, z0, x1, G + 2 + storey * 2, z1, 2, wall);
  b.box(x0, G + 2 + storey, z0, x1, G + 2 + storey + 2, z1, slab);
  for (let f = 0; f < 2; f++) {
    windowRow(b, 'x', x0, x1, z0, G + 2 + f * storey + v(0.9), 2, f === 0 ? b.id('window_lit') : win, wood, v(2.2), v(1.3), v(1.2));
    windowRow(b, 'x', x0, x1, z1 - 2, G + 2 + f * storey + v(0.9), 2, win, wood, v(2.2), v(1.3), v(1.2));
  }
  // clinic entrance (glass double door) + white sign with a red band
  const dz = lot.face === 's' ? z1 - 2 : z0;
  b.box(x0 + v(1.5), G + 2, dz, x0 + v(3.3), G + v(2.6), dz + 2, b.id('glass'));
  const sz = lot.face === 's' ? z1 : z0 - 2;
  b.box(x0 + v(3.8), G + v(2.8), sz, x1 - v(2), G + v(3.8), sz + 2, b.id('sign_white'));
  b.box(x0 + v(3.8), G + v(2.8), sz + (lot.face === 's' ? 2 : -1), x1 - v(2), G + v(3.05), sz + (lot.face === 's' ? 3 : 0), b.id('sign_red'));
  gableRoof(b, x0, z0, x1, z1, G + 2 + storey * 2, b.id('kawara'), v(0.6));
}

function school(b: Builder, bk: { x0: number; z0: number; x1: number; z1: number }, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const cream = b.id('school_cream'), slab = b.id('concrete'), win = b.id('window'), frame = b.id('metal_dark');
  const rail = b.id('metal');
  // perimeter fence (metal mesh posts) and the sports ground
  const fx0 = bk.x0 + 2, fz0 = bk.z0 + 2, fx1 = bk.x1 - 2, fz1 = bk.z1 - 2;
  for (let x = fx0; x < fx1; x += v(2.5)) {
    b.box(x, G, fz0, x + 1, G + v(1.8), fz0 + 1, rail);
    b.box(x, G, fz1 - 1, x + 1, G + v(1.8), fz1, rail);
  }
  for (let z = fz0; z < fz1; z += v(2.5)) {
    b.box(fx0, G, z, fx0 + 1, G + v(1.8), z + 1, rail);
    b.box(fx1 - 1, G, z, fx1, G + v(1.8), z + 1, rail);
  }
  b.box(fx0, G + v(1.7), fz0, fx1, G + v(1.8), fz0 + 1, rail);
  b.box(fx0, G + v(1.7), fz1 - 1, fx1, G + v(1.8), fz1, rail);
  // main building along the north side: 4 floors, long window bands, rooftop fence
  const bx0 = bk.x0 + v(4), bx1 = bk.x1 - v(4);
  const bz0 = bk.z0 + v(4), bz1 = bz0 + v(12);
  const floors = 4, storey = v(3.4), h = floors * storey;
  foundation(b, bx0 - 1, bz0 - 1, bx1 + 1, bz1 + 1, G, 1.8);
  b.walls(bx0, G, bz0, bx1, G + h, bz1, 2, cream);
  for (let f = 0; f <= floors; f++) b.box(bx0, G + f * storey, bz0, bx1, G + f * storey + 2, bz1, slab);
  // interior corridor wall
  b.box(bx0, G, bz0 + v(4), bx1, G + h, bz0 + v(4) + 1, cream);
  for (let x = bx0 + v(10); x < bx1; x += v(10)) b.box(x, G, bz0 + v(4), x + 1, G + h, bz1, cream);
  for (let f = 0; f < floors; f++) {
    const wy = G + f * storey + v(1);
    for (let x = bx0 + v(1); x < bx1 - v(1.5); x += v(2.2)) {
      b.box(x, wy, bz0, x + v(1.8), wy + v(1.6), bz0 + 2, win);
      b.box(x, wy, bz1 - 2, x + v(1.8), wy + v(1.6), bz1, win);
      b.box(x + v(1.8), wy, bz1 - 2, x + v(1.8) + 1, wy + v(1.6), bz1, frame);
    }
  }
  // rooftop safety fence (the famous lunch spot)
  for (let x = bx0; x < bx1; x += v(1.5)) {
    b.box(x, G + h + 2, bz0, x + 1, G + h + v(2), bz0 + 1, rail);
    b.box(x, G + h + 2, bz1 - 1, x + 1, G + h + v(2), bz1, rail);
  }
  b.box(bx0, G + h + v(1.9), bz0, bx1, G + h + v(2), bz0 + 1, rail);
  b.box(bx0, G + h + v(1.9), bz1 - 1, bx1, G + h + v(2), bz1, rail);
  // stair tower + clock
  const sx = (bx0 + bx1) >> 1;
  b.box(sx - v(2.5), G + h, bz0 + v(3), sx + v(2.5), G + h + v(3.6), bz1 - v(3), cream);
  b.cylinderY(sx, bz1 + 1, G + h - v(2.8), G + h - v(2.7), v(1.1), b.id('paint_white'));
  b.box(sx - v(1.1), G + h - v(3.9), bz1, sx + v(1.1), G + h - v(1.7), bz1 + 2, b.id('paint_white'));
  b.box(sx, G + h - v(3), bz1 + 2, sx + 1, G + h - v(2), bz1 + 3, b.id('metal_dark'));
  b.box(sx, G + h - v(2.85), bz1 + 2, sx + v(0.7), G + h - v(2.7), bz1 + 3, b.id('metal_dark'));
  // entrance canopy
  b.box(sx - v(3), G + v(3), bz1, sx + v(3), G + v(3.2), bz1 + v(3), slab);
  b.box(sx - v(3), G, bz1 + v(2.7), sx - v(2.6), G + v(3), bz1 + v(3), slab);
  b.box(sx + v(2.6), G, bz1 + v(2.7), sx + v(3), G + v(3), bz1 + v(3), slab);
  // gymnasium on the east side: tall hall with a curved metal roof
  const gx0 = bx1 - v(22), gz0 = bz1 + v(8), gx1 = bx1, gz1 = Math.min(bk.z1 - v(4), gz0 + v(18));
  if (gz1 - gz0 > v(10)) {
    b.walls(gx0, G, gz0, gx1, G + v(7), gz1, 2, cream);
    windowRow(b, 'x', gx0, gx1, gz0, G + v(4), 2, win, frame, v(3), v(2), v(2));
    const span = gz1 - gz0;
    for (let k = 0; k <= span; k++) {
      const u = (k / span) * 2 - 1;
      const yy = G + v(7) + Math.round((1 - u * u) * v(2.5));
      b.box(gx0 - 2, yy, gz0 + k, gx1 + 2, yy + 1, gz0 + k + 1, b.id('roof_metal'));
    }
  }
  // sports ground (clay) with white lines
  const sx0 = bx0, sz0 = bz1 + v(8), sx1 = gz1 - gz0 > v(10) ? gx0 - v(4) : bx1, sz1 = bk.z1 - v(4);
  if (sx1 - sx0 > v(14) && sz1 - sz0 > v(10)) {
    b.box(sx0, G - 1, sz0, sx1, G, sz1, b.id('clay'));
    const white = b.id('road_white');
    b.box(sx0 + v(2), G - 1, sz0 + v(2), sx1 - v(2), G, sz0 + v(2) + 1, white);
    b.box(sx0 + v(2), G - 1, sz1 - v(2) - 1, sx1 - v(2), G, sz1 - v(2), white);
    b.box(sx0 + v(2), G - 1, sz0 + v(2), sx0 + v(2) + 1, G, sz1 - v(2), white);
    b.box(sx1 - v(2) - 1, G - 1, sz0 + v(2), sx1 - v(2), G, sz1 - v(2), white);
    b.box(((sx0 + sx1) >> 1), G - 1, sz0 + v(2), ((sx0 + sx1) >> 1) + 1, G, sz1 - v(2), white);
    // soccer goals
    for (const gx of [sx0 + v(3), sx1 - v(3) - 1]) {
      const gzm = (sz0 + sz1) >> 1;
      b.box(gx, G, gzm - v(3), gx + 1, G + v(2.2), gzm - v(3) + 1, rail);
      b.box(gx, G, gzm + v(3), gx + 1, G + v(2.2), gzm + v(3) + 1, rail);
      b.box(gx, G + v(2.2), gzm - v(3), gx + 1, G + v(2.2) + 1, gzm + v(3) + 1, rail);
    }
  }
  void rng;
}

function park(b: Builder, bk: { x0: number; z0: number; x1: number; z1: number }, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const path = b.id('stone_path');
  const cx = (bk.x0 + bk.x1) >> 1, cz = (bk.z0 + bk.z1) >> 1;
  b.box(bk.x0 + v(2), G - 1, cz - v(1.2), bk.x1 - v(2), G, cz + v(1.2), path);
  b.box(cx - v(1.2), G - 1, bk.z0 + v(2), cx + v(1.2), G, bk.z1 - v(2), path);
  // fountain
  b.cylinderY(cx, cz, G, G + v(0.6), v(3), b.id('stone'));
  b.cylinderY(cx, cz, G + 1, G + v(0.55), v(2.6), b.id('water'));
  b.cylinderY(cx, cz, G, G + v(1.4), v(0.4), b.id('stone'));
  // sakura and benches
  for (let i = 0; i < 9; i++) {
    const x = rng.int(bk.x0 + v(4), bk.x1 - v(4)), z = rng.int(bk.z0 + v(4), bk.z1 - v(4));
    if (Math.abs(x - cx) < v(5) || Math.abs(z - cz) < v(4)) continue;
    sakura(b, x, G, z, rng);
  }
  const wood = b.id('wood'), metal = b.id('metal_dark');
  for (const [bx, bz] of [[cx - v(8), cz + v(2.5)], [cx + v(6), cz + v(2.5)], [cx - v(8), cz - v(3.2)]]) {
    b.box(bx, G + v(0.4), bz, bx + v(1.8), G + v(0.5), bz + v(0.5), wood);
    b.box(bx, G + v(0.5), bz + v(0.4), bx + v(1.8), G + v(0.9), bz + v(0.5), wood);
    b.box(bx + 1, G, bz + 1, bx + 2, G + v(0.4), bz + 2, metal);
    b.box(bx + v(1.8) - 2, G, bz + 1, bx + v(1.8) - 1, G + v(0.4), bz + 2, metal);
  }
  // playground swing frame
  const sx = bk.x0 + v(6), sz = bk.z1 - v(8);
  b.line(sx, G, sz, sx + v(1), G + v(2.4), sz, 1, metal);
  b.line(sx + v(2), G, sz, sx + v(1), G + v(2.4), sz, 1, metal);
  b.line(sx + v(5), G, sz, sx + v(6), G + v(2.4), sz, 1, metal);
  b.line(sx + v(7), G, sz, sx + v(6), G + v(2.4), sz, 1, metal);
  b.box(sx + v(1), G + v(2.4), sz, sx + v(6), G + v(2.4) + 1, sz + 1, metal);
}

function sakura(b: Builder, x: number, G: number, z: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const bark = b.id('bark'), petals = b.id('sakura');
  const h = v(rng.range(2.6, 3.6));
  b.cylinderY(x, z, G, G + h, v(0.25), bark);
  for (let i = 0; i < 4; i++) {
    const a = rng.range(0, Math.PI * 2);
    const by = G + h * rng.range(0.6, 0.95);
    b.line(x, by, z, x + Math.cos(a) * v(1.8), by + v(1.1), z + Math.sin(a) * v(1.8), 1.2, bark);
  }
  const cy = G + h + v(0.9);
  for (let i = 0; i < 9; i++) {
    const r = v(rng.range(1.1, 1.8));
    b.ellipsoid(x + rng.range(-1, 1) * v(1.8), cy + rng.range(-0.6, 0.8) * v(1), z + rng.range(-1, 1) * v(1.8), r, r * 0.7, r, petals, true);
  }
}

function bridge(b: Builder, x0: number, x1: number, z0: number, z1: number, G: number, waterY: number): void {
  const v = (m: number) => b.v(m);
  const deck = b.id('concrete'), asphalt = b.id('asphalt'), rail = b.id('metal'), pier = b.id('concrete_dark');
  b.box(x0, G - v(1), z0, x1, G - 2, z1, deck);
  b.box(x0, G - 2, z0, x1, G, z1, asphalt);
  // railings and lamp posts
  for (const xr of [x0, x1 - 2]) {
    b.box(xr, G, z0, xr + 2, G + v(1.1), z1, rail);
    for (let z = z0 + v(4); z < z1; z += v(10)) {
      b.box(xr, G, z, xr + 2, G + v(4.5), z + 2, b.id('metal_dark'));
      b.box(xr + (xr === x0 ? 0 : -v(0.8)), G + v(4.3), z, xr + 2 + (xr === x0 ? v(0.8) : 0), G + v(4.6), z + 2, b.id('lamp'));
    }
  }
  // piers down into the river
  for (let z = z0 + v(10); z < z1 - v(6); z += v(12)) b.box(x0 + v(1), waterY - v(4), z, x1 - v(1), G - v(1), z + v(1.5), pier);
}

function pole(b: Builder, x: number, z: number, G: number): void {
  const v = (m: number) => b.v(m);
  const p = b.id('pole'), dark = b.id('metal_dark');
  b.cylinderY(x, z, G, G + v(9), v(0.16), p);
  b.box(x - v(0.9), G + v(8.2), z, x + v(0.9), G + v(8.35), z + 1, dark);
  b.box(x - v(0.7), G + v(7.4), z, x + v(0.7), G + v(7.55), z + 1, dark);
  // transformer can
  b.cylinderY(x + v(0.4), z + v(0.3), G + v(6), G + v(6.9), v(0.25), b.id('paint_white'));
}

function wires(b: Builder, xa: number, xb: number, z: number, y: number): void {
  const wire = b.id('wire');
  for (const dz of [0]) {
    for (const off of [-6, 6]) {
      const steps = Math.abs(xb - xa);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const sag = Math.round(Math.sin(t * Math.PI) * 4);
        b.set(Math.round(xa + (xb - xa) * t) + off, y - sag, z + dz, wire);
      }
    }
  }
}

function vending(b: Builder, x: number, z: number, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  b.box(x, G, z, x + v(1), G + v(1.8), z + v(0.7), b.id('vending'));
  b.box(x + 1, G + v(1), z - 1, x + v(1) - 1, G + v(1.6), z, b.id('glass'));
  b.box(x, G + v(1.7), z, x + v(1), G + v(1.8), z + v(0.7), b.id(rng.chance(0.5) ? 'sign_red' : 'sign_blue'));
}
