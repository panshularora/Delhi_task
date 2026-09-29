import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three"
import { PLACES } from "../data/places"
import { project } from "../lib/geo3d"
import { SIGNATURE_IDS } from "./landmarks"
import type { Palette } from "./materials"

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const dummy = new Object3D()

/** Inverted celestial sky dome with procedural sunset / golden hour / twilight gradient */
export function createSkyDome(atmo: string = "dusk") {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  const updateSky = (mode: string) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 512)
    if (mode === "cyber") {
      grad.addColorStop(0, "#060914")
      grad.addColorStop(0.35, "#141c2c")
      grad.addColorStop(0.7, "#222638")
      grad.addColorStop(1.0, "#363248")
    } else if (mode === "dawn") {
      grad.addColorStop(0, "#182236")
      grad.addColorStop(0.35, "#3c4864")
      grad.addColorStop(0.7, "#886472")
      grad.addColorStop(0.9, "#d28c74")
      grad.addColorStop(1.0, "#f2c69c")
    } else if (mode === "day") {
      grad.addColorStop(0, "#2c5f92")
      grad.addColorStop(0.4, "#5280ae")
      grad.addColorStop(0.8, "#94b8d4")
      grad.addColorStop(1.0, "#e8f2fa")
    } else {
      // Dusk / Golden Hour (Default)
      grad.addColorStop(0, "#0a0c1a")
      grad.addColorStop(0.3, "#261a32")
      grad.addColorStop(0.65, "#72323e")
      grad.addColorStop(0.88, "#c46038")
      grad.addColorStop(1.0, "#f4a454")
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 512)
  }

  updateSky(atmo)
  const tex = new CanvasTexture(canvas)
  const geo = new SphereGeometry(1200, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const mat = new MeshBasicMaterial({
    map: tex,
    side: BackSide,
    depthWrite: false,
  })
  const dome = new Mesh(geo, mat)
  dome.name = "sky-dome"
  dome.userData.updateSky = updateSky
  dome.userData.tex = tex
  return dome
}

export function createGround(palette: Palette) {
  const g = new Group()

  // Base ground plane
  const geo = new PlaneGeometry(480, 480, 1, 1)
  geo.rotateX(-Math.PI / 2)
  const paper = palette.cream.clone()
  paper.color.set(0xe6d6bc)
  paper.roughness = 0.97
  paper.metalness = 0.02
  const baseMesh = new Mesh(geo, paper)
  baseMesh.receiveShadow = true
  baseMesh.userData.extraMat = paper
  g.add(baseMesh)

  const cp = project(28.6315, 77.2167)

  const cpInner = new RingGeometry(1.8, 2.05, 32)
  cpInner.rotateX(-Math.PI / 2)
  const cpOuter = new RingGeometry(3.1, 3.35, 32)
  cpOuter.rotateX(-Math.PI / 2)
  const cpMat = new MeshBasicMaterial({
    color: 0xc9a45b,
    transparent: true,
    opacity: 0.35,
  })
  const innerMesh = new Mesh(cpInner, cpMat)
  innerMesh.position.set(cp.x, 0.03, cp.z)
  const outerMesh = new Mesh(cpOuter, cpMat)
  outerMesh.position.set(cp.x, 0.03, cp.z)
  innerMesh.userData.extraMat = cpMat
  outerMesh.userData.extraMat = cpMat
  g.add(innerMesh, outerMesh)

  return g
}

/** River Yamuna with winding path and bridges */
export function createYamuna(palette: Palette) {
  const g = new Group()
  const pts = [
    [28.74, 77.225],
    [28.71, 77.23],
    [28.67, 77.242],
    [28.64, 77.252],
    [28.61, 77.262],
    [28.58, 77.272],
    [28.54, 77.288],
    [28.5, 77.305],
  ].map(([lat, lng]) => {
    const p = project(lat, lng)
    return new Vector3(p.x, 0.04, p.z)
  })

  const curve = new CatmullRomCurve3(pts)
  const geo = new TubeGeometry(curve, 72, 1.65, 8, false)
  const mesh = new Mesh(geo, palette.water)
  mesh.receiveShadow = true
  mesh.name = "yamuna-river"
  g.add(mesh)

  // Bridges across the Yamuna
  const bridgeSpots = [
    [28.67, 77.242, 4.2], // Signature Bridge area
    [28.628, 77.253, 3.8], // ITO Bridge
    [28.585, 77.27, 4.0], // Nizamuddin Bridge
    [28.55, 77.285, 3.6], // DND / Kalindi Kunj
  ] as const

  bridgeSpots.forEach(([lat, lng, span]) => {
    const p = project(lat, lng)
    const bGeo = new BoxGeometry(span, 0.25, 0.45)
    const bMesh = new Mesh(bGeo, palette.concrete)
    bMesh.position.set(p.x, 0.35, p.z)
    bMesh.rotation.y = 0.25
    g.add(bMesh)
  })

  return g
}

export function kartavyaCurve() {
  const pts = [
    [28.6143, 77.1994], // Rashtrapati Bhavan
    [28.6139, 77.208],
    [28.6134, 77.218],
    [28.6129, 77.2295], // India Gate
    [28.6122, 77.238],
  ].map(([lat, lng]) => {
    const p = project(lat, lng)
    return new Vector3(p.x, 0.08, p.z)
  })
  return new CatmullRomCurve3(pts)
}

export function ringRoadCurve() {
  const spots = [
    [28.67, 77.22],
    [28.65, 77.25],
    [28.6, 77.26],
    [28.56, 77.23],
    [28.56, 77.18],
    [28.62, 77.17],
    [28.67, 77.22],
  ].map(([lat, lng]) => {
    const p = project(lat, lng)
    return new Vector3(p.x, 0.07, p.z)
  })
  return new CatmullRomCurve3(spots, true)
}

export function createKartavya(palette: Palette) {
  const geo = new TubeGeometry(kartavyaCurve(), 32, 0.55, 6, false)
  const m = new Mesh(geo, palette.sand)
  m.receiveShadow = true
  return m
}

const KEEP_R: Record<string, number> = {
  "india-gate": 22,
  "qutub-minar": 24,
  "red-fort": 28,
  lotus: 20,
  humayun: 22,
  akshardham: 22,
  rashtrapati: 26,
  "jama-masjid": 20,
  jantar: 16,
  safdarjung: 20,
}

type KeepPt = { x: number; z: number; r: number }

/** Dense low-rise infill packed between landmarks. Extra box material only. */
export function createFabric(low: boolean) {
  const group = new Group()
  group.name = "city-fabric"

  const sig = PLACES.filter((p) => SIGNATURE_IDS.includes(p.id))
  const keep: KeepPt[] = sig.map((p) => {
    const pt = project(p.lat, p.lng)
    return { x: pt.x, z: pt.z, r: KEEP_R[p.id] ?? 5 }
  })

  const yamuna = [
    [28.74, 77.225],
    [28.71, 77.23],
    [28.67, 77.242],
    [28.64, 77.252],
    [28.61, 77.262],
    [28.58, 77.272],
    [28.54, 77.288],
    [28.5, 77.305],
  ].map(([lat, lng]) => project(lat, lng))

  const max = low ? 640 : 1280
  const rng = mulberry32(286139)
  const occ = new Set<string>()
  const slots: { x: number; z: number; h: number; w: number; d: number; rot: number }[] = []

  const nearYamuna = (x: number, z: number) => {
    for (const y of yamuna) {
      const dx = y.x - x
      const dz = y.z - z
      if (dx * dx + dz * dz < 12) return true
    }
    return false
  }

  const tryAdd = (x: number, z: number, hMul = 1) => {
    if (slots.length >= max) return
    if (nearYamuna(x, z)) return
    let halo = false
    for (const k of keep) {
      const d = Math.hypot(k.x - x, k.z - z)
      if (d < k.r) return
      if (d < k.r * 1.9) halo = true
    }
    if (halo && rng() > 0.05) return
    const key = `${(x * 1.15) | 0}:${(z * 1.15) | 0}`
    if (occ.has(key)) return
    occ.add(key)
    const extra = rng() < 0.08 ? rng() * 1.25 : 0
    const h = (0.28 + rng() * 0.85 + extra) * hMul
    slots.push({
      x,
      z,
      h,
      w: 0.22 + rng() * 0.34,
      d: 0.22 + rng() * 0.34,
      rot: (rng() - 0.5) * 0.32,
    })
  }

  const pairs: { a: KeepPt; b: KeepPt; dist: number }[] = []
  for (let i = 0; i < keep.length; i++) {
    for (let j = i + 1; j < keep.length; j++) {
      const a = keep[i]!
      const b = keep[j]!
      const dist = Math.hypot(b.x - a.x, b.z - a.z)
      if (dist < 28) continue
      pairs.push({ a, b, dist })
    }
  }
  pairs.sort((p, q) => p.dist - q.dist)

  for (const { a, b, dist } of pairs.slice(0, 16)) {
    const dx = b.x - a.x
    const dz = b.z - a.z
    const px = -dz / dist
    const pz = dx / dist
    const gap = low ? 2.1 : 1.7
    const steps = Math.floor(dist / gap)
    for (let s = 1; s < steps; s++) {
      const t = s / steps
      if (t < 0.32 || t > 0.68) continue
      const cx = a.x + dx * t
      const cz = a.z + dz * t
      const lane = (rng() < 0.5 ? -1 : 1) * (1.8 + rng() * 2.4)
      tryAdd(cx + px * lane, cz + pz * lane, 0.5 + rng() * 0.85)
      if (rng() > 0.55) {
        tryAdd(cx + px * -lane * 0.7, cz + pz * -lane * 0.7, 0.4 + rng() * 0.7)
      }
    }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const k of keep) {
    minX = Math.min(minX, k.x)
    maxX = Math.max(maxX, k.x)
    minZ = Math.min(minZ, k.z)
    maxZ = Math.max(maxZ, k.z)
  }
  const pad = 22
  const spacing = low ? 2.45 : 1.95
  for (let x = minX - pad; x <= maxX + pad; x += spacing) {
    for (let z = minZ - pad; z <= maxZ + pad; z += spacing) {
      const jx = x + (rng() - 0.5) * spacing * 0.9
      const jz = z + (rng() - 0.5) * spacing * 0.9
      if (rng() > 0.62) continue
      tryAdd(jx, jz, 0.4 + rng() * 0.95)
    }
  }

  const clusters = [
    { lat: 28.651, lng: 77.175, n: 200, spread: 9.2, h: 0.95 },
    { lat: 28.678, lng: 77.205, n: 170, spread: 8.4, h: 0.8 },
    { lat: 28.548, lng: 77.198, n: 210, spread: 9.6, h: 0.9 },
    { lat: 28.532, lng: 77.248, n: 160, spread: 7.8, h: 0.85 },
    { lat: 28.598, lng: 77.292, n: 180, spread: 9.0, h: 0.78 },
    { lat: 28.575, lng: 77.158, n: 150, spread: 8.0, h: 0.82 },
    { lat: 28.632, lng: 77.285, n: 140, spread: 7.2, h: 0.88 },
    { lat: 28.62, lng: 77.145, n: 130, spread: 7.0, h: 0.76 },
  ]
  for (const c of clusters) {
    const n = low ? Math.floor(c.n * 0.5) : c.n
    const origin = project(c.lat, c.lng)
    for (let k = 0; k < n; k++) {
      tryAdd(
        origin.x + (rng() - 0.5) * c.spread * 2,
        origin.z + (rng() - 0.5) * c.spread * 2,
        c.h,
      )
    }
  }

  const geo = new BoxGeometry(1, 1, 1)
  const mat = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.02,
  })
  const mesh = new InstancedMesh(geo, mat, slots.length)
  mesh.castShadow = !low
  mesh.receiveShadow = true
  mesh.frustumCulled = true
  const tint = new Color()
  const tones = [0xc9b79a, 0xb89a78, 0xd4c4a8, 0x9aaa88, 0xe0c8b0, 0xa89880, 0xc4b090, 0x8a9a84]
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]!
    dummy.position.set(s.x, s.h / 2, s.z)
    dummy.scale.set(s.w, s.h, s.d)
    dummy.rotation.set(0, s.rot, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    tint.set(tones[i % tones.length]!)
    mesh.setColorAt(i, tint)
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.userData.extraMat = mat
  group.add(mesh)
  return group
}

/** Dual-lane Traffic system with bright headlights & crimson taillights */
export function createTraffic(low: boolean) {
  const g = new Group()
  g.name = "traffic"

  const curve1 = kartavyaCurve()
  const curve2 = ringRoadCurve()
  const curves = [curve1, curve2]

  const n = low ? 16 : 36
  const geo = new BoxGeometry(0.42, 0.16, 0.2)

  // Headlights (warm white)
  const headMat = new MeshStandardMaterial({
    color: 0xffffff,
    emissive: new Color(0xfff4d6),
    emissiveIntensity: 2.2,
    roughness: 0.2,
  })
  const headMesh = new InstancedMesh(geo, headMat, n)

  // Taillights (crimson red)
  const tailMat = new MeshStandardMaterial({
    color: 0xff2222,
    emissive: new Color(0xff0022),
    emissiveIntensity: 2.5,
    roughness: 0.2,
  })
  const tailMesh = new InstancedMesh(geo, tailMat, n)

  const items = Array.from({ length: n }, (_, i) => ({
    curve: curves[i % curves.length],
    offset: i / n,
    lane: i % 2 === 0 ? 0.35 : -0.35,
    speed: 0.028 + (i % 3) * 0.008,
  }))

  headMesh.userData.traffic = { items, isHead: true }
  tailMesh.userData.traffic = { items, isHead: false }
  headMesh.userData.extraMat = headMat
  tailMesh.userData.extraMat = tailMat

  g.add(headMesh, tailMesh)
  return g
}

export function stepTraffic(trafficGroup: Group, dt: number) {
  const meshes = trafficGroup.children.filter((c) => (c as InstancedMesh).userData?.traffic)
  for (const m of meshes) {
    const mesh = m as InstancedMesh
    const data = mesh.userData.traffic as {
      items: {
        curve: CatmullRomCurve3
        offset: number
        lane: number
        speed: number
      }[]
      isHead: boolean
    }
    if (!data) continue
    const tmp = new Vector3()
    const look = new Vector3()
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i]
      const dir = data.isHead ? 1 : -1
      it.offset = (it.offset + dt * it.speed * dir + 1) % 1
      it.curve.getPointAt(it.offset, tmp)
      const next = (it.offset + 0.01 * dir + 1) % 1
      it.curve.getPointAt(next, look)

      dummy.position.copy(tmp)
      dummy.position.y = 0.16
      dummy.position.z += it.lane
      dummy.lookAt(look.x, 0.16, look.z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
}

export function createLamps(low: boolean) {
  const curve = kartavyaCurve()
  const n = low ? 10 : 20
  const geo = new BoxGeometry(0.09, 0.85, 0.09)
  const mat = new MeshStandardMaterial({
    color: 0xc9a45b,
    emissive: new Color(0xffb84d),
    emissiveIntensity: 0.8,
    roughness: 0.3,
  })
  const mesh = new InstancedMesh(geo, mat, n)
  const tmp = new Vector3()
  for (let i = 0; i < n; i++) {
    curve.getPointAt(i / (n - 1), tmp)
    dummy.position.set(tmp.x, 0.42, tmp.z + (i % 2 === 0 ? 0.65 : -0.65))
    dummy.scale.set(1, 1, 1)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.userData.extraMat = mat
  return mesh
}

export function createBirds(low: boolean) {
  const n = low ? 12 : 28
  const geo = new BoxGeometry(0.22, 0.04, 0.1)
  const mat = new MeshBasicMaterial({ color: 0x111111 })
  const mesh = new InstancedMesh(geo, mat, n)
  const seeds = Array.from({ length: n }, () => Math.random())
  mesh.userData.birds = { seeds, mat }
  return mesh
}

export function stepBirds(mesh: InstancedMesh, t: number) {
  const data = mesh.userData.birds as { seeds: number[] }
  if (!data) return
  const center = project(28.5931, 77.2197)
  for (let i = 0; i < data.seeds.length; i++) {
    const s = data.seeds[i]
    const a = t * (0.16 + s * 0.22) + s * 6
    const r = 3.5 + s * 6
    dummy.position.set(
      center.x + Math.cos(a) * r,
      4.2 + Math.sin(t * 0.8 + s) * 0.9,
      center.z + Math.sin(a) * r * 0.7,
    )
    dummy.rotation.set(0, -a, Math.sin(t * 8 + s) * 0.35)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}

export function createCrowd(low: boolean) {
  const n = low ? 24 : 55
  const geo = new BoxGeometry(0.14, 0.36, 0.14)
  const mat = new MeshStandardMaterial({ color: 0x221d18, roughness: 0.9 })
  const mesh = new InstancedMesh(geo, mat, n)
  const rng = mulberry32(77)
  const lawn = project(28.6129, 77.2295)
  const chowk = project(28.6506, 77.2303)
  for (let i = 0; i < n; i++) {
    const o = i < n / 2 ? lawn : chowk
    dummy.position.set(o.x + (rng() - 0.5) * 5, 0.18, o.z + (rng() - 0.5) * 5)
    dummy.scale.set(1, 0.8 + rng() * 0.5, 1)
    dummy.rotation.set(0, rng() * Math.PI, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.userData.extraMat = mat
  return mesh
}

/** Starfield with 700 sparkling twinkling stars for night and cyber modes */
export function createStars() {
  const n = 700
  const geo = new BufferGeometry()
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = 260 + Math.random() * 80
    const sinPhi = Math.sin(phi)
    arr[i * 3] = r * sinPhi * Math.cos(theta)
    arr[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15 // keep above horizon
    arr[i * 3 + 2] = r * sinPhi * Math.sin(theta)
  }
  geo.setAttribute("position", new BufferAttribute(arr, 3))
  const mat = new PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  })
  const pts = new Points(geo, mat)
  pts.userData.extraMat = mat
  return pts
}

/** Monsoon rain particle system with falling drops */
export function createRain() {
  const n = 500
  const geo = new BufferGeometry()
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 160
    arr[i * 3 + 1] = Math.random() * 45
    arr[i * 3 + 2] = (Math.random() - 0.5) * 160
  }
  geo.setAttribute("position", new BufferAttribute(arr, 3))
  const mat = new PointsMaterial({
    color: 0xa8c4e0,
    size: 0.28,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  const pts = new Points(geo, mat)
  pts.visible = false
  pts.userData.extraMat = mat
  return pts
}

export function stepRain(pts: Points, dt: number) {
  if (!pts.visible) return
  const pos = pts.geometry.attributes.position as BufferAttribute
  const arr = pos.array as Float32Array
  for (let i = 0; i < arr.length / 3; i++) {
    arr[i * 3 + 1] -= dt * 28
    arr[i * 3] += dt * 3 // wind drift
    if (arr[i * 3 + 1] < 0.1) {
      arr[i * 3 + 1] = 40 + Math.random() * 8
      arr[i * 3] = (Math.random() - 0.5) * 160
    }
  }
  pos.needsUpdate = true
}

/** Clean sky without harsh vertical searchlight columns */
export function createSkyBeams() {
  const g = new Group()
  g.name = "sky-beams"
  return g
}

/** Glowing warm floating sky lanterns drifting gently into the night sky */
export function createSkyLanterns() {
  const n = 18
  const geo = new CylinderGeometry(0.24, 0.18, 0.42, 6)
  const mat = new MeshBasicMaterial({
    color: 0xff8822,
    transparent: true,
    opacity: 0.85,
    blending: AdditiveBlending,
  })
  const mesh = new InstancedMesh(geo, mat, n)
  const data = Array.from({ length: n }, () => ({
    x: (Math.random() - 0.5) * 110,
    y: 2 + Math.random() * 35,
    z: (Math.random() - 0.5) * 110,
    speed: 0.6 + Math.random() * 0.8,
    sway: Math.random() * Math.PI * 2,
  }))
  mesh.userData.lanterns = data
  mesh.userData.extraMat = mat
  return mesh
}

export function stepSkyLanterns(mesh: InstancedMesh, dt: number, t: number) {
  const data = mesh.userData.lanterns as {
    x: number
    y: number
    z: number
    speed: number
    sway: number
  }[]
  if (!data) return
  for (let i = 0; i < data.length; i++) {
    const l = data[i]
    l.y += dt * l.speed
    if (l.y > 45) {
      l.y = 1 + Math.random() * 3
      l.x = (Math.random() - 0.5) * 110
      l.z = (Math.random() - 0.5) * 110
    }
    dummy.position.set(
      l.x + Math.sin(t * 1.2 + l.sway) * 0.8,
      l.y,
      l.z + Math.cos(t * 0.8 + l.sway) * 0.8,
    )
    dummy.scale.setScalar(0.9 + Math.sin(t * 3 + i) * 0.1)
    dummy.rotation.set(0, t * 0.5 + i, Math.sin(t + i) * 0.1)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}

/** Expanding futuristic holographic radar pulse expanding from Connaught Place */
export function createRadarPulse() {
  const cp = project(28.6315, 77.2167)
  const geo = new RingGeometry(0.1, 1.2, 48)
  geo.rotateX(-Math.PI / 2)
  const mat = new MeshBasicMaterial({
    color: 0xc9a45b,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const mesh = new Mesh(geo, mat)
  mesh.position.set(cp.x, 0.08, cp.z)
  mesh.userData.extraMat = mat
  mesh.userData.pulseRadius = 1
  return mesh
}

export function stepRadarPulse(mesh: Mesh, dt: number) {
  let r = (mesh.userData.pulseRadius as number) || 1
  r += dt * 18
  if (r > 85) r = 1
  mesh.userData.pulseRadius = r

  mesh.scale.set(r, r, 1)
  const mat = mesh.userData.extraMat as MeshBasicMaterial
  if (mat) {
    mat.opacity = Math.max(0, 0.22 * (1 - r / 85))
  }
}

/** Luminous celestial disc (setting sun or midnight moon) at the horizon */
export function createCelestial() {
  const g = new Group()
  g.name = "celestial"

  const geo = new SphereGeometry(14, 24, 16)
  const mat = new MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.95,
  })
  const orb = new Mesh(geo, mat)
  orb.position.set(90, 32, -90)
  g.add(orb)

  // Outer corona glow halo
  const coronaGeo = new SphereGeometry(22, 20, 16)
  const coronaMat = new MeshBasicMaterial({
    color: 0xff8822,
    transparent: true,
    opacity: 0.28,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const corona = new Mesh(coronaGeo, coronaMat)
  corona.position.copy(orb.position)
  g.add(corona)

  g.userData.orbMat = mat
  g.userData.coronaMat = coronaMat
  return g
}

