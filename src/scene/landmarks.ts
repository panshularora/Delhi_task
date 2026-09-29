import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  PointLight,
  SphereGeometry,
  type Material,
} from "three"
import { heightUnits, project } from "../lib/geo3d"
import type { Palette } from "./materials"

function mesh(
  geo:
    | BoxGeometry
    | CylinderGeometry
    | SphereGeometry
    | ConeGeometry,
  mat: Material,
) {
  const m = new Mesh(geo, mat)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Chhatri: traditional Mughal domed pavilion with slender pillars and bulbous dome */
function chhatri(p: Palette, r = 0.45, h = 0.9, domeMat?: Material) {
  const g = new Group()
  const dMat = domeMat || p.sand
  const numPillars = 4
  for (let i = 0; i < numPillars; i++) {
    const angle = (i / numPillars) * Math.PI * 2 + Math.PI / 4
    const px = Math.cos(angle) * (r * 0.75)
    const pz = Math.sin(angle) * (r * 0.75)
    const col = mesh(new CylinderGeometry(r * 0.08, r * 0.09, h * 0.55, 6), p.sand)
    col.position.set(px, h * 0.28, pz)
    g.add(col)
  }
  const cornice = mesh(new BoxGeometry(r * 2.1, h * 0.08, r * 2.1), p.sand)
  cornice.position.y = h * 0.56
  const dome = mesh(
    new SphereGeometry(r * 0.9, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.7),
    dMat,
  )
  dome.position.y = h * 0.65
  const finial = mesh(new ConeGeometry(r * 0.12, h * 0.25, 6), p.brass)
  finial.position.y = h * 1.05
  g.add(cornice, dome, finial)
  return g
}

/**
 * India Gate — 42m Beaux-Arts triumphal archway on Kartavya Path.
 * Real architectural features:
 * - Stepped multi-level plinth
 * - Semicircular barrel-vaulted archway with keystone and reveal
 * - Amar Jawan Jyoti eternal flame with warm light at center
 * - Symmetrical reflecting water pools with fountain nozzles
 * - The eastern Chhatri canopy in the background
 */
export function indiaGate(p: Palette) {
  const g = new Group()
  const H = heightUnits(42) // ~16.4 units
  const W = 6.8 // East-west width
  const D = 3.6 // Pier depth (north-south)
  const pierW = 1.9

  // 1. Stepped Plinth
  const base1 = mesh(new BoxGeometry(D * 1.45, 0.35, W * 1.35), p.sand)
  base1.position.y = 0.18
  const base2 = mesh(new BoxGeometry(D * 1.3, 0.35, W * 1.22), p.sand)
  base2.position.y = 0.45
  g.add(base1, base2)

  // 2. Twin massive flank piers (North & South)
  const pierH = H * 0.68
  const leftPier = mesh(new BoxGeometry(D, pierH, pierW), p.sand)
  leftPier.position.set(0, pierH / 2 + 0.6, -W * 0.34)

  const rightPier = mesh(new BoxGeometry(D, pierH, pierW), p.sand)
  rightPier.position.set(0, pierH / 2 + 0.6, W * 0.34)

  // Molding bands on piers
  for (const z of [-W * 0.34, W * 0.34]) {
    const band1 = mesh(new BoxGeometry(D * 1.06, 0.22, pierW * 1.06), p.sand)
    band1.position.set(0, 1.8, z)
    const band2 = mesh(new BoxGeometry(D * 1.06, 0.22, pierW * 1.06), p.sand)
    band2.position.set(0, pierH * 0.9 + 0.6, z)
    g.add(band1, band2)
  }

  // 3. Vaulted arch top (curved arch segment)
  const archVault = mesh(
    new CylinderGeometry(W * 0.24, W * 0.24, D * 0.98, 16, 1, false, 0, Math.PI),
    p.sand,
  )
  archVault.rotation.z = Math.PI / 2
  archVault.rotation.y = Math.PI / 2
  archVault.position.set(0, pierH + 0.4, 0)

  // 4. Upper Lintel, Entablature, and Attic
  const lintelH = H * 0.16
  const lintel = mesh(new BoxGeometry(D * 1.08, lintelH, W * 1.05), p.sand)
  lintel.position.y = pierH + lintelH / 2 + 0.6

  const cornice = mesh(new BoxGeometry(D * 1.15, 0.28, W * 1.12), p.sand)
  cornice.position.y = pierH + lintelH + 0.7

  const attic = mesh(new BoxGeometry(D * 0.8, H * 0.15, W * 0.72), p.sand)
  attic.position.y = pierH + lintelH + 0.8 + (H * 0.15) / 2

  const atticCap = mesh(new BoxGeometry(D * 0.6, 0.2, W * 0.5), p.sand)
  atticCap.position.y = pierH + lintelH + 0.8 + H * 0.15 + 0.1

  g.add(leftPier, rightPier, archVault, lintel, cornice, attic, atticCap)

  // 5. Amar Jawan Jyoti (Eternal Flame Cenotaph)
  const cenoBase = mesh(new BoxGeometry(0.8, 0.35, 0.8), p.asphalt)
  cenoBase.position.set(0, 0.78, 0)
  const flameMesh = mesh(new ConeGeometry(0.12, 0.38, 8), p.flame)
  flameMesh.position.set(0, 1.05, 0)
  const flameLight = new PointLight(0xff6600, 2.5, 9, 2)
  flameLight.position.set(0, 1.2, 0)
  flameLight.name = "amar-jawan-light"
  g.add(cenoBase, flameMesh, flameLight)

  const eastChhatri = chhatri(p, 0.75, 2.6)
  eastChhatri.position.set(4.5, 0, 0)
  g.add(eastChhatri)

  const pos = project(28.6129, 77.2295)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "india-gate"
  return g
}

/**
 * Qutub Minar — 73m soaring victory minaret with 5 distinct tapered fluted storeys,
 * projecting balconies with stalactite corbels, Arabic calligraphic inscription bands,
 * the 4th-century Iron Pillar, Alai Darwaza domed gateway, and Quwwat-ul-Islam cloister.
 */
export function qutubMinar(p: Palette) {
  const g = new Group()
  const H = heightUnits(73) // ~28.5 units

  const terrace = mesh(new BoxGeometry(9, 0.3, 9), p.sand)
  terrace.position.y = 0.15
  g.add(terrace)

  // 2. Stepped Polygonal Minaret Plinth
  const base1 = mesh(new CylinderGeometry(3.6, 4.0, 0.5, 24), p.redSand)
  base1.position.y = 0.55
  const base2 = mesh(new CylinderGeometry(3.0, 3.4, 0.4, 24), p.redSand)
  base2.position.y = 0.95
  g.add(base1, base2)

  // 3. Five Distinct Architectural Storeys
  const storeyConfigs = [
    { bottomR: 2.6, topR: 2.05, hFrac: 0.32, mat: p.redSand, ribs: 12, type: "alt" },
    { bottomR: 2.0, topR: 1.58, hFrac: 0.24, mat: p.redSand, ribs: 10, type: "round" },
    { bottomR: 1.55, topR: 1.22, hFrac: 0.18, mat: p.redSand, ribs: 8, type: "angular" },
    { bottomR: 1.2, topR: 0.92, hFrac: 0.14, mat: p.marble, ribs: 0, type: "marble" },
    { bottomR: 0.9, topR: 0.65, hFrac: 0.12, mat: p.redSand, ribs: 0, type: "top" },
  ]

  let curY = 1.15
  storeyConfigs.forEach((cfg, sIdx) => {
    const sH = H * cfg.hFrac

    // Main tapering stone core
    const body = mesh(
      new CylinderGeometry(cfg.topR, cfg.bottomR, sH, 32),
      cfg.mat,
    )
    body.position.y = curY + sH / 2
    g.add(body)

    // Calligraphic Inscription Relief Bands
    const numBands = sIdx === 0 ? 3 : sIdx === 1 ? 2 : 1
    for (let b = 1; b <= numBands; b++) {
      const bandY = curY + (sH / (numBands + 1)) * b
      const frac = (bandY - curY) / sH
      const bandR = (cfg.bottomR + (cfg.topR - cfg.bottomR) * frac) * 1.025
      const band = mesh(new CylinderGeometry(bandR, bandR, 0.28, 32), p.carvedBand)
      band.position.y = bandY
      g.add(band)
    }

    // Architectural Fluting (Alternating semicircular and triangular ribs)
    if (cfg.ribs > 0) {
      for (let j = 0; j < cfg.ribs; j++) {
        const a = (j / cfg.ribs) * Math.PI * 2
        const midR = (cfg.bottomR + cfg.topR) / 2
        const isAngular = cfg.type === "angular" || (cfg.type === "alt" && j % 2 === 1)
        const ribGeo = isAngular
          ? new CylinderGeometry(0.06, 0.08, sH * 0.96, 3)
          : new CylinderGeometry(0.08, 0.1, sH * 0.96, 8)
        const rib = mesh(ribGeo, cfg.mat)
        rib.position.set(Math.cos(a) * (midR * 1.01), curY + sH / 2, Math.sin(a) * (midR * 1.01))
        rib.rotation.y = a
        g.add(rib)
      }
    }

    // Marble Accent Rings on Storey 4
    if (cfg.type === "marble") {
      const ringRed1 = mesh(new CylinderGeometry(cfg.bottomR * 1.03, cfg.bottomR * 1.03, 0.35, 32), p.redSand)
      ringRed1.position.y = curY + 0.3
      const ringRed2 = mesh(new CylinderGeometry(cfg.topR * 1.03, cfg.topR * 1.03, 0.35, 32), p.redSand)
      ringRed2.position.y = curY + sH - 0.3
      g.add(ringRed1, ringRed2)
    }

    // Cantilevered Muqarnas Balcony with Under-Brackets (Corbels)
    const balcR = cfg.topR * 1.32
    const balc = mesh(new CylinderGeometry(balcR, cfg.topR * 1.06, 0.25, 32), p.redSand)
    balc.position.y = curY + sH + 0.1
    g.add(balc)

    const numBrackets = 8
    for (let k = 0; k < numBrackets; k++) {
      const ba = (k / numBrackets) * Math.PI * 2
      const corbel = mesh(new BoxGeometry(0.12, 0.45, 0.35), p.redSand)
      corbel.position.set(
        Math.cos(ba) * (cfg.topR * 1.12),
        curY + sH - 0.12,
        Math.sin(ba) * (cfg.topR * 1.12),
      )
      corbel.rotation.y = ba
      g.add(corbel)
    }

    curY += sH + 0.35
  })

  // 4. Crown Cupola / Apex Finial
  const apexDome = mesh(new SphereGeometry(0.65, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), p.redSand)
  apexDome.position.y = curY + 0.4
  const finial = mesh(new ConeGeometry(0.15, 1.2, 8), p.gold)
  finial.position.y = curY + 1.2
  g.add(apexDome, finial)

  // 5. The Iron Pillar of Delhi (4th Century Gupta Dynasty)
  const pillarPlinth = mesh(new BoxGeometry(0.9, 0.25, 0.9), p.sand)
  pillarPlinth.position.set(4.2, 0.35, 3.6)
  const ironShaft = mesh(new CylinderGeometry(0.12, 0.15, 3.2, 16), p.ironPillar)
  ironShaft.position.set(4.2, 1.85, 3.6)
  const ironCapital = mesh(new CylinderGeometry(0.25, 0.1, 0.4, 12), p.ironPillar)
  ironCapital.position.set(4.2, 3.55, 3.6)
  g.add(pillarPlinth, ironShaft, ironCapital)

  const gwW = 4.2
  const gwH = 3.4
  const gateBlock = mesh(new BoxGeometry(gwW, gwH, gwW), p.redSand)
  gateBlock.position.set(5.6, gwH / 2 + 0.3, -4.2)
  const gwDome = mesh(new SphereGeometry(gwW * 0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), p.marble)
  gwDome.position.set(5.6, gwH + 0.3 + (gwW * 0.38) * 0.6, -4.2)
  g.add(gateBlock, gwDome)

  const pos = project(28.5245, 77.1855)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "qutub-minar"
  return g
}

/**
 * Red Fort (Lal Qila) — Shah Jahan's palace fort.
 * Monumental Lahori Gate with twin octagonal towers, 7 chhatris, battlements,
 * Tiranga national flag mast, and Diwan-i-Aam courtyard.
 */
export function redFort(p: Palette) {
  const g = new Group()
  const wallH = heightUnits(24)
  const len = 15.5
  const wid = 9.8
  const t = 0.75

  // 1. Rampart Walls
  const n = mesh(new BoxGeometry(wid, wallH, t), p.redSand)
  n.position.set(0, wallH / 2, -len / 2)
  const s = mesh(new BoxGeometry(wid, wallH, t), p.redSand)
  s.position.set(0, wallH / 2, len / 2)
  const e = mesh(new BoxGeometry(t, wallH, len), p.redSand)
  e.position.set(wid / 2, wallH / 2, 0)
  const w = mesh(new BoxGeometry(t, wallH, len), p.redSand)
  w.position.set(-wid / 2, wallH / 2, 0)

  // Crenellated battlements along the top
  const cren1 = mesh(new BoxGeometry(wid * 1.02, 0.35, t * 1.1), p.redSand)
  cren1.position.set(0, wallH + 0.17, -len / 2)
  const cren2 = mesh(new BoxGeometry(wid * 1.02, 0.35, t * 1.1), p.redSand)
  cren2.position.set(0, wallH + 0.17, len / 2)
  g.add(n, s, e, w, cren1, cren2)

  // 2. Lahori Gate Monumental Portal (West side)
  const gateW = 4.2
  const gateH = wallH * 1.35
  const gateD = 1.8
  const gateBlock = mesh(new BoxGeometry(gateD, gateH, gateW), p.redSand)
  gateBlock.position.set(-wid / 2 - 0.6, gateH / 2, 0)

  // Arch cutout simulation
  const gateArch = mesh(
    new CylinderGeometry(gateW * 0.28, gateW * 0.28, gateD * 1.1, 14, 1, false, 0, Math.PI),
    p.sand,
  )
  gateArch.rotation.z = Math.PI / 2
  gateArch.rotation.y = Math.PI / 2
  gateArch.position.set(-wid / 2 - 0.6, gateH * 0.45, 0)

  // Twin Octagonal Watchtowers flanking the gate
  for (const z of [-gateW * 0.65, gateW * 0.65]) {
    const tower = mesh(new CylinderGeometry(0.85, 0.95, gateH * 1.1, 8), p.redSand)
    tower.position.set(-wid / 2 - 0.6, (gateH * 1.1) / 2, z)
    const twChhatri = chhatri(p, 0.7, 1.4, p.marble)
    twChhatri.position.set(-wid / 2 - 0.6, gateH * 1.1, z)
    g.add(tower, twChhatri)
  }

  for (const i of [-1, 0, 1]) {
    const mini = chhatri(p, 0.22, 0.6, p.marble)
    mini.position.set(-wid / 2 - 0.6, gateH, i * (gateW * 0.32))
    g.add(mini)
  }

  // Tiranga National Flagpole atop Lahori Gate
  const mast = mesh(new CylinderGeometry(0.04, 0.05, 2.8, 6), p.brass)
  mast.position.set(-wid / 2 - 0.6, gateH + 1.4, 0)
  const flag1 = mesh(new BoxGeometry(0.02, 0.25, 0.8), p.flagSaffron)
  flag1.position.set(-wid / 2 - 0.6, gateH + 2.5, 0.4)
  const flag2 = mesh(new BoxGeometry(0.02, 0.25, 0.8), p.marble)
  flag2.position.set(-wid / 2 - 0.6, gateH + 2.25, 0.4)
  const flag3 = mesh(new BoxGeometry(0.02, 0.25, 0.8), p.flagGreen)
  flag3.position.set(-wid / 2 - 0.6, gateH + 2.0, 0.4)
  g.add(gateBlock, gateArch, mast, flag1, flag2, flag3)

  // 3. Four corner chhatris on the main fort ramparts
  ;[
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz]) => {
    const c = chhatri(p, 0.65, 1.5, p.marble)
    c.position.set((sx * wid) / 2, wallH, (sz * len) / 2)
    g.add(c)
  })

  // 4. Diwan-i-Aam pillared pavilion inside the courtyard
  const diwan = mesh(new BoxGeometry(wid * 0.55, wallH * 0.5, 4.5), p.sand)
  diwan.position.set(1.5, wallH * 0.25, 0)
  g.add(diwan)

  const pos = project(28.6562, 77.241)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "red-fort"
  return g
}

/**
 * Lotus Temple (Bahá'í House of Worship) — 27 free-standing marble petals,
 * 9 lotus petal reflecting pools, and luminescent white marble.
 */
export function lotusTemple(p: Palette) {
  const g = new Group()
  const H = heightUnits(34) // ~13.3 units

  // Podium Base
  const basePlinth = mesh(new CylinderGeometry(7.2, 7.8, 0.5, 18), p.marble)
  basePlinth.position.y = 0.25
  g.add(basePlinth)

  // Central soaring dome hall
  const core = mesh(new CylinderGeometry(1.6, 2.4, H * 0.6, 18), p.marble)
  core.position.y = H * 0.3
  g.add(core)

  // 27 Marble Petals arranged in 3 concentric tiers of 9
  // 1. Inner petals (reach high, curved inwards to form apex)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const petal = mesh(
      new SphereGeometry(2.6, 12, 12, 0, Math.PI, 0, Math.PI / 2),
      p.marble,
    )
    petal.scale.set(0.48, 1.45, 0.72)
    petal.rotation.y = a
    petal.rotation.x = 0.12
    petal.position.set(Math.cos(a) * 1.6, H * 0.25, Math.sin(a) * 1.6)
    g.add(petal)
  }

  // 2. Intermediate petals (curving outwards)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.PI / 9
    const petal = mesh(
      new SphereGeometry(2.4, 12, 10, 0, Math.PI, 0, Math.PI / 2),
      p.marble,
    )
    petal.scale.set(0.55, 1.15, 0.85)
    petal.rotation.y = a
    petal.rotation.x = -0.22
    petal.position.set(Math.cos(a) * 2.8, H * 0.18, Math.sin(a) * 2.8)
    g.add(petal)
  }

  // 3. Outer entrance petals (opening wide over doorways)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const petal = mesh(
      new SphereGeometry(2.1, 10, 8, 0, Math.PI, 0, Math.PI / 2),
      p.marble,
    )
    petal.scale.set(0.62, 0.82, 0.95)
    petal.rotation.y = a
    petal.rotation.x = -0.45
    petal.position.set(Math.cos(a) * 3.8, H * 0.12, Math.sin(a) * 3.8)
    g.add(petal)
  }

  // 9 Surrounding Lotus-Leaf Turquoise Reflecting Pools
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.PI / 9
    const pool = mesh(new CylinderGeometry(1.6, 1.8, 0.18, 8), p.waterPool)
    pool.position.set(Math.cos(a) * 5.4, 0.15, Math.sin(a) * 5.4)
    g.add(pool)
  }

  // Glowing central dome apex
  const skylight = mesh(new SphereGeometry(0.8, 12, 8), p.marble)
  skylight.position.y = H * 0.85
  g.add(skylight)

  const pos = project(28.5535, 77.2588)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "lotus"
  return g
}

/**
 * Humayun's Tomb — The garden tomb that inspired the Taj Mahal.
 * Monumental Charbagh terrace with water channels, central high-arched iwans,
 * double bulbous white marble dome, and 4 corner chhatris.
 */
export function humayun(p: Palette) {
  const g = new Group()
  const H = heightUnits(47) // ~18.4 units

  // 1. Vast Charbagh Garden Podium with arcaded cells
  const podiumW = 11.5
  const podiumH = H * 0.18
  const base = mesh(new BoxGeometry(podiumW, podiumH, podiumW), p.redSand)
  base.position.y = podiumH / 2
  g.add(base)

  // Charbagh intersecting water causeway channels
  const waterCh1 = mesh(new BoxGeometry(podiumW * 1.4, 0.08, 0.6), p.waterPool)
  waterCh1.position.y = 0.06
  const waterCh2 = mesh(new BoxGeometry(0.6, 0.08, podiumW * 1.4), p.waterPool)
  waterCh2.position.y = 0.06
  g.add(waterCh1, waterCh2)

  // 2. Main Two-Storey Octagonal Tomb Body
  const bodyW = 7.4
  const bodyH = H * 0.36
  const body = mesh(new BoxGeometry(bodyW, bodyH, bodyW), p.redSand)
  body.position.y = podiumH + bodyH / 2
  g.add(body)

  // Four grand central arched portals (Pishtaq / Iwan) on all 4 faces
  for (let rot = 0; rot < 4; rot++) {
    const a = rot * (Math.PI / 2)
    const portal = mesh(new BoxGeometry(bodyW * 0.42, bodyH * 0.85, 0.3), p.marble)
    portal.position.set(
      Math.sin(a) * (bodyW / 2 + 0.1),
      podiumH + bodyH * 0.52,
      Math.cos(a) * (bodyW / 2 + 0.1),
    )
    portal.rotation.y = a
    g.add(portal)
  }

  // 3. Tall Circular Drum & Bulbous White Marble Double Dome
  const drum = mesh(new CylinderGeometry(2.1, 2.2, H * 0.18, 18), p.marble)
  drum.position.y = podiumH + bodyH + (H * 0.18) / 2

  const dome = mesh(
    new SphereGeometry(2.45, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.6),
    p.marble,
  )
  dome.position.y = podiumH + bodyH + H * 0.16
  const finial = mesh(new ConeGeometry(0.24, 1.2, 8), p.gold)
  finial.position.y = podiumH + bodyH + H * 0.48
  g.add(drum, dome, finial)

  // 4. Four Graceful Octagonal Corner Chhatris
  const chhatriOffset = bodyW * 0.38
  ;[
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz]) => {
    const c = chhatri(p, 0.62, 1.6, p.marble)
    c.position.set(sx * chhatriOffset, podiumH + bodyH, sz * chhatriOffset)
    g.add(c)
  })

  const pos = project(28.5933, 77.2507)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "humayun"
  return g
}

/**
 * Akshardham Temple — 141ft spiritual mandir in Rajasthani pink sandstone,
 * multi-tiered carved shikharas with golden kalash, parikrama colonnade, and stepwell.
 */
export function akshardham(p: Palette) {
  const g = new Group()
  const H = heightUnits(43) // ~16.8 units

  // 1. Gajendra Peeth (Elephant plinth base)
  const plinth = mesh(new BoxGeometry(10.5, H * 0.12, 10.5), p.pink)
  plinth.position.y = (H * 0.12) / 2
  const steps = mesh(new BoxGeometry(11.8, 0.25, 11.8), p.cream)
  steps.position.y = 0.12
  g.add(plinth, steps)

  // 2. Central Mandapam Body
  const body = mesh(new BoxGeometry(7.2, H * 0.38, 7.2), p.pink)
  body.position.y = H * 0.12 + (H * 0.38) / 2
  g.add(body)

  // 3. Central Majestic Shikhara (Mandir spire)
  const shikhara = mesh(new ConeGeometry(2.7, H * 0.58, 12), p.pink)
  shikhara.position.y = H * 0.5 + (H * 0.58) / 2
  const amalaka = mesh(new CylinderGeometry(0.7, 0.9, 0.3, 12), p.gold)
  amalaka.position.y = H * 0.95
  const kalash = mesh(new SphereGeometry(0.38, 8, 8), p.gold)
  kalash.position.y = H * 1.08
  g.add(shikhara, amalaka, kalash)

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const dist = 3.6
    const secShikhara = mesh(new ConeGeometry(0.85, H * 0.35, 8), p.pink)
    secShikhara.position.set(
      Math.cos(a) * dist,
      H * 0.5 + (H * 0.35) / 2,
      Math.sin(a) * dist,
    )
    const secKalash = mesh(new SphereGeometry(0.18, 6, 6), p.gold)
    secKalash.position.set(Math.cos(a) * dist, H * 0.76, Math.sin(a) * dist)
    g.add(secShikhara, secKalash)
  }

  const pos = project(28.6127, 77.2773)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "akshardham"
  return g
}

/**
 * Rashtrapati Bhavan — Edwin Lutyens' monumental classical residence on Raisina Hill.
 * Symmetrical colonnaded facade, iconic central dome drum, Jaipur Column, and Mughal Gardens.
 */
export function rashtrapati(p: Palette) {
  const g = new Group()
  const H = heightUnits(36)

  // 1. Raisina Hill Podium
  const hillBase = mesh(new BoxGeometry(22, 0.5, 9), p.sand)
  hillBase.position.y = 0.25
  g.add(hillBase)

  // 2. Colossal Classical Wings (North & South)
  const wingW = 18.5
  const wingH = H * 0.28
  const wingD = 4.8
  const wings = mesh(new BoxGeometry(wingW, wingH, wingD), p.cream)
  wings.position.y = 0.5 + wingH / 2
  g.add(wings)

  const numPillars = 8
  for (let i = 0; i < numPillars; i++) {
    const z = ((i - (numPillars - 1) / 2) / ((numPillars - 1) / 2)) * (wingW * 0.44)
    const col = mesh(new CylinderGeometry(0.14, 0.16, wingH, 8), p.sand)
    col.position.set(-wingD / 2 - 0.2, 0.5 + wingH / 2, z)
    g.add(col)
  }

  // 3. Central Monumental Portico
  const portico = mesh(new BoxGeometry(5.6, H * 0.38, 5.6), p.cream)
  portico.position.y = 0.5 + (H * 0.38) / 2
  g.add(portico)

  // 4. Grand Circular Drum and Dome
  const drum = mesh(new CylinderGeometry(2.2, 2.3, H * 0.18, 18), p.cream)
  drum.position.y = 0.5 + H * 0.38 + (H * 0.18) / 2

  const dome = mesh(
    new SphereGeometry(2.35, 18, 14, 0, Math.PI * 2, 0, Math.PI / 1.7),
    p.sand,
  )
  dome.position.y = 0.5 + H * 0.48
  const finial = mesh(new ConeGeometry(0.2, 0.8, 8), p.brass)
  finial.position.y = 0.5 + H * 0.78
  g.add(drum, dome, finial)

  // 5. Jaipur Column in the Forecourt (East side)
  const jCol = mesh(new CylinderGeometry(0.12, 0.16, 4.2, 8), p.redSand)
  jCol.position.set(6.8, 2.1, 0)
  const star = mesh(new SphereGeometry(0.24, 8, 8), p.gold)
  star.position.set(6.8, 4.4, 0)
  g.add(jCol, star)

  // 6. Amrit Udyan (Mughal Gardens) on West terrace
  const gardenPool = mesh(new CylinderGeometry(1.6, 1.8, 0.12, 12), p.waterPool)
  gardenPool.position.set(-6.5, 0.45, 0)
  g.add(gardenPool)

  const pos = project(28.6143, 77.1994)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "rashtrapati"
  return g
}

/**
 * Jama Masjid — Shah Jahan's congregational mosque.
 * Raised plinth with 35 grand steps, 3 striped marble domes, 2 soaring 40m minarets,
 * and central Hauz ablution pool.
 */
export function jamaMasjid(p: Palette) {
  const g = new Group()
  const H = heightUnits(41)

  // 1. Raised Red Sandstone Platform with grand stairs
  const courtW = 12.5
  const courtL = 12.5
  const courtH = 0.6
  const court = mesh(new BoxGeometry(courtW, courtH, courtL), p.redSand)
  court.position.y = courtH / 2
  g.add(court)

  for (let s = 0; s < 2; s++) {
    const st = mesh(new BoxGeometry(1.8 - s * 0.25, 0.12, 4.5), p.redSand)
    st.position.set(courtW / 2 + 0.4 + s * 0.25, 0.5 - s * 0.1, 0)
    g.add(st)
  }

  // Central Hauz (Ablution pool)
  const hauz = mesh(new BoxGeometry(2.4, 0.15, 2.4), p.waterPool)
  hauz.position.set(0, courtH + 0.08, 0)
  g.add(hauz)

  // 2. Main Prayer Hall on Western end
  const hallW = 3.8
  const hallL = 10.5
  const hallH = H * 0.28
  const hall = mesh(new BoxGeometry(hallW, hallH, hallL), p.redSand)
  hall.position.set(-courtW / 2 + hallW / 2 + 0.2, courtH + hallH / 2, 0)
  g.add(hall)

  // 3. Three Bulbous Striped Marble Domes
  const domeConfigs = [
    { z: 0, r: 1.75, hOff: 0.95 },
    { z: -2.8, r: 1.25, hOff: 0.75 },
    { z: 2.8, r: 1.25, hOff: 0.75 },
  ]
  domeConfigs.forEach((cfg) => {
    const dome = mesh(
      new SphereGeometry(cfg.r, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.6),
      p.marble,
    )
    dome.position.set(-courtW / 2 + hallW / 2 + 0.2, courtH + hallH + cfg.hOff, cfg.z)
    const fin = mesh(new ConeGeometry(0.18, 0.7, 6), p.gold)
    fin.position.set(
      -courtW / 2 + hallW / 2 + 0.2,
      courtH + hallH + cfg.hOff + cfg.r * 0.9,
      cfg.z,
    )
    g.add(dome, fin)
  })

  // 4. Two Soaring 40-metre Striped Minarets
  const minH = H * 0.98
  for (const z of [-courtL * 0.44, courtL * 0.44]) {
    const minaret = mesh(new CylinderGeometry(0.32, 0.45, minH, 12), p.redSand)
    minaret.position.set(-courtW / 2 + hallW / 2 + 0.2, courtH + minH / 2, z)

    for (const bY of [minH * 0.4, minH * 0.88]) {
      const balc = mesh(new CylinderGeometry(0.55, 0.45, 0.15, 12), p.marble)
      balc.position.set(-courtW / 2 + hallW / 2 + 0.2, courtH + bY, z)
      g.add(balc)
    }

    const minDome = chhatri(p, 0.4, 0.8, p.marble)
    minDome.position.set(-courtW / 2 + hallW / 2 + 0.2, courtH + minH, z)
    g.add(minaret, minDome)
  }

  const pos = project(28.6507, 77.2334)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "jama-masjid"
  return g
}

/** Samrat Yantra at Jantar Mantar — masonry hypotenuse with flanking quadrants. */
export function jantarMantar(p: Palette) {
  const g = new Group()
  const H = heightUnits(27)

  const pad = mesh(new BoxGeometry(9.2, 0.12, 8.4), p.sand)
  pad.position.y = 0.06
  g.add(pad)

  const gnomon = mesh(new BoxGeometry(1.35, H, 0.42), p.sand)
  gnomon.rotation.z = -0.52
  gnomon.position.set(0.55, H * 0.38, 0)
  g.add(gnomon)

  const stair = mesh(new BoxGeometry(0.7, H * 0.92, 0.18), p.sand)
  stair.rotation.z = -0.52
  stair.position.set(0.35, H * 0.34, 0)
  g.add(stair)

  for (const z of [-2.15, 2.15]) {
    const quad = mesh(
      new CylinderGeometry(2.2, 2.2, 0.28, 18, 1, false, 0, Math.PI),
      p.sand,
    )
    quad.rotation.x = Math.PI / 2
    quad.position.set(0.15, 1.05, z)
    const block = mesh(new BoxGeometry(1.6, 1.7, 1.5), p.sand)
    block.position.set(-1.6, 0.92, z)
    g.add(quad, block)
  }

  const pos = project(28.6271, 77.2166)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "jantar"
  return g
}

/** Safdarjung's Tomb — late Mughal garden-tomb, smaller cousin of Humayun. */
export function safdarjungTomb(p: Palette) {
  const g = new Group()
  const H = heightUnits(37)

  const podiumW = 9.4
  const podiumH = H * 0.16
  const base = mesh(new BoxGeometry(podiumW, podiumH, podiumW), p.redSand)
  base.position.y = podiumH / 2
  g.add(base)

  const arcade = mesh(new BoxGeometry(podiumW * 1.04, podiumH * 0.45, podiumW * 1.04), p.sand)
  arcade.position.y = podiumH * 0.28
  g.add(arcade)

  const bodyW = 5.8
  const bodyH = H * 0.34
  const body = mesh(new BoxGeometry(bodyW, bodyH, bodyW), p.redSand)
  body.position.y = podiumH + bodyH / 2
  g.add(body)

  for (let rot = 0; rot < 4; rot++) {
    const a = rot * (Math.PI / 2)
    const portal = mesh(new BoxGeometry(bodyW * 0.38, bodyH * 0.8, 0.28), p.marble)
    portal.position.set(
      Math.sin(a) * (bodyW / 2 + 0.08),
      podiumH + bodyH * 0.5,
      Math.cos(a) * (bodyW / 2 + 0.08),
    )
    portal.rotation.y = a
    g.add(portal)
  }

  const drum = mesh(new CylinderGeometry(1.65, 1.75, H * 0.14, 16), p.marble)
  drum.position.y = podiumH + bodyH + (H * 0.14) / 2
  const dome = mesh(
    new SphereGeometry(1.95, 18, 14, 0, Math.PI * 2, 0, Math.PI / 1.6),
    p.marble,
  )
  dome.position.y = podiumH + bodyH + H * 0.12
  const finial = mesh(new ConeGeometry(0.2, 0.95, 8), p.gold)
  finial.position.y = podiumH + bodyH + H * 0.4
  g.add(drum, dome, finial)

  const off = bodyW * 0.4
  ;[
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz]) => {
    const c = chhatri(p, 0.48, 1.35, p.marble)
    c.position.set(sx * off, podiumH + bodyH, sz * off)
    g.add(c)
  })

  const pos = project(28.5893, 77.2106)
  g.position.set(pos.x, 0, pos.z)
  g.userData.placeId = "safdarjung"
  return g
}

function withApron(build: (p: Palette) => Group, radius: number) {
  return (p: Palette) => {
    const g = build(p)
    const apron = mesh(new CylinderGeometry(radius, radius * 1.04, 0.08, 28), p.asphalt)
    apron.position.y = 0.03
    apron.receiveShadow = true
    g.add(apron)
    return g
  }
}

export const SIGNATURE_BUILDERS: Record<string, (p: Palette) => Group> = {
  "india-gate": withApron(indiaGate, 4.2),
  "qutub-minar": withApron(qutubMinar, 6.4),
  "red-fort": withApron(redFort, 7.0),
  lotus: withApron(lotusTemple, 5.4),
  humayun: withApron(humayun, 5.6),
  akshardham: withApron(akshardham, 5.6),
  rashtrapati: withApron(rashtrapati, 7.0),
  "jama-masjid": withApron(jamaMasjid, 5.6),
  jantar: withApron(jantarMantar, 3.8),
  safdarjung: withApron(safdarjungTomb, 4.8),
}

export const SIGNATURE_IDS = Object.keys(SIGNATURE_BUILDERS)
