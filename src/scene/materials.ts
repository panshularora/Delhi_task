import {
  CanvasTexture,
  Color,
  MeshStandardMaterial,
  RepeatWrapping,
  type ColorRepresentation,
  type Texture,
} from "three"

export type Palette = {
  sand: MeshStandardMaterial
  redSand: MeshStandardMaterial
  marble: MeshStandardMaterial
  cream: MeshStandardMaterial
  pink: MeshStandardMaterial
  brass: MeshStandardMaterial
  gold: MeshStandardMaterial
  water: MeshStandardMaterial
  waterPool: MeshStandardMaterial
  park: MeshStandardMaterial
  asphalt: MeshStandardMaterial
  concrete: MeshStandardMaterial
  night: MeshStandardMaterial
  flame: MeshStandardMaterial
  flagSaffron: MeshStandardMaterial
  flagGreen: MeshStandardMaterial
  beacon: MeshStandardMaterial
  windowGlow: MeshStandardMaterial
  carvedBand: MeshStandardMaterial
  ironPillar: MeshStandardMaterial
  textures: Texture[]
}

/** Generates procedural ashlar sandstone masonry with chiseled courses and mortar lines */
function createSandstoneTexture(isRed: boolean): { map: CanvasTexture; bump: CanvasTexture } {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  const bumpCanvas = document.createElement("canvas")
  bumpCanvas.width = 512
  bumpCanvas.height = 512
  const bCtx = bumpCanvas.getContext("2d")!

  // Base sandstone color: Natural Mughal red sandstone vs Dholpur buff sandstone
  ctx.fillStyle = isRed ? "#783028" : "#c2aa90"
  ctx.fillRect(0, 0, 512, 512)

  bCtx.fillStyle = "#808080"
  bCtx.fillRect(0, 0, 512, 512)

  const rows = 16
  const rowHeight = 512 / rows

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight
    const offset = (r % 2) * 32
    const cols = 8
    const colWidth = 512 / cols

    for (let c = 0; c < cols + 1; c++) {
      const x = c * colWidth - offset
      // Subtle natural tone variation per stone block
      const jitter = (Math.random() - 0.5) * 0.1
      const blockColor = isRed
        ? `rgb(${Math.round(120 + jitter * 35)}, ${Math.round(48 + jitter * 20)}, ${Math.round(40 + jitter * 18)})`
        : `rgb(${Math.round(194 + jitter * 25)}, ${Math.round(170 + jitter * 22)}, ${Math.round(144 + jitter * 20)})`

      ctx.fillStyle = blockColor
      ctx.fillRect(x + 1, y + 1, colWidth - 2, rowHeight - 2)

      // Chisel stippling
      for (let s = 0; s < 10; s++) {
        const sx = x + Math.random() * colWidth
        const sy = y + Math.random() * rowHeight
        ctx.fillStyle = isRed ? "rgba(50, 18, 14, 0.12)" : "rgba(100, 85, 70, 0.12)"
        ctx.fillRect(sx, sy, 2, 2)
      }

      // Bump map mortared relief
      bCtx.fillStyle = "#999999"
      bCtx.fillRect(x + 1, y + 1, colWidth - 2, rowHeight - 2)
    }

    // Horizontal mortar groove
    ctx.fillStyle = isRed ? "#441814" : "#8a7968"
    ctx.fillRect(0, y, 512, 1.5)

    bCtx.fillStyle = "#222222"
    bCtx.fillRect(0, y, 512, 2)
  }

  const map = new CanvasTexture(canvas)
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.repeat.set(3, 3)

  const bump = new CanvasTexture(bumpCanvas)
  bump.wrapS = RepeatWrapping
  bump.wrapT = RepeatWrapping
  bump.repeat.set(3, 3)

  return { map, bump }
}

/** Generates Makrana white marble with translucent golden-grey veins */
function createMarbleTexture(): { map: CanvasTexture; bump: CanvasTexture } {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  // Soft luminous marble base
  ctx.fillStyle = "#f5f2eb"
  ctx.fillRect(0, 0, 512, 512)

  // Veins
  ctx.strokeStyle = "rgba(180, 170, 155, 0.25)"
  ctx.lineWidth = 1.5
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    let x = Math.random() * 512
    let y = 0
    ctx.moveTo(x, y)
    while (y < 512) {
      x += (Math.random() - 0.5) * 40
      y += Math.random() * 60 + 20
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const map = new CanvasTexture(canvas)
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.repeat.set(2, 2)

  return { map, bump: map }
}

/** Generates carved Islamic calligraphic & geometric jali bands */
function createCarvedBandTexture(): CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#8a2818"
  ctx.fillRect(0, 0, 512, 128)

  // Borders
  ctx.fillStyle = "#d4af37"
  ctx.fillRect(0, 0, 512, 6)
  ctx.fillRect(0, 122, 512, 6)

  // Calligraphic glyph stubs
  ctx.fillStyle = "#f0ebe1"
  for (let x = 8; x < 512; x += 14) {
    const h = 40 + Math.sin(x * 0.1) * 20
    ctx.fillRect(x, 64 - h / 2, 6, h)
    ctx.beginPath()
    ctx.arc(x + 3, 30, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  const map = new CanvasTexture(canvas)
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.repeat.set(4, 1)
  return map
}

/** Generates asphalt road texture with lane markings and curbs */
function createAsphaltTexture(): CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#22252a"
  ctx.fillRect(0, 0, 512, 512)

  // Road grit noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const c = Math.random() > 0.5 ? 45 : 30
    ctx.fillStyle = `rgb(${c}, ${c + 3}, ${c + 5})`
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  const map = new CanvasTexture(canvas)
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.repeat.set(16, 16)
  return map
}

function mat(
  color: ColorRepresentation,
  extra: ConstructorParameters<typeof MeshStandardMaterial>[0] = {},
) {
  return new MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.08,
    ...extra,
  })
}

export function createPalette(): Palette {
  const redStone = createSandstoneTexture(true)
  const yellowStone = createSandstoneTexture(false)
  const marbleTex = createMarbleTexture()
  const bandTex = createCarvedBandTexture()
  const asphaltTex = createAsphaltTexture()

  const textures = [
    redStone.map,
    redStone.bump,
    yellowStone.map,
    yellowStone.bump,
    marbleTex.map,
    bandTex,
    asphaltTex,
  ]

  return {
    sand: new MeshStandardMaterial({
      color: 0xffffff,
      map: yellowStone.map,
      bumpMap: yellowStone.bump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.02,
    }),
    redSand: new MeshStandardMaterial({
      color: 0xffffff,
      map: redStone.map,
      bumpMap: redStone.bump,
      bumpScale: 0.035,
      roughness: 0.84,
      metalness: 0.03,
    }),
    marble: new MeshStandardMaterial({
      color: 0xffffff,
      map: marbleTex.map,
      roughness: 0.22,
      metalness: 0.12,
    }),
    cream: mat(0xe8ddc5, { roughness: 0.68, metalness: 0.06 }),
    pink: mat(0xd48772, { roughness: 0.72, metalness: 0.04 }),
    brass: mat(0xe4c35a, {
      roughness: 0.24,
      metalness: 0.82,
      emissive: new Color(0x4a3a14),
      emissiveIntensity: 0.35,
    }),
    gold: mat(0xffd700, {
      roughness: 0.18,
      metalness: 0.9,
      emissive: new Color(0x8a6200),
      emissiveIntensity: 0.5,
    }),
    water: mat(0x104860, {
      roughness: 0.12,
      metalness: 0.65,
      emissive: new Color(0x0a2d3c),
      emissiveIntensity: 0.45,
    }),
    waterPool: mat(0x1a6b82, {
      roughness: 0.1,
      metalness: 0.55,
      emissive: new Color(0x0e4250),
      emissiveIntensity: 0.55,
    }),
    park: mat(0x2f5e38, { roughness: 0.9, metalness: 0.02 }),
    asphalt: new MeshStandardMaterial({
      color: 0x4a463e,
      map: asphaltTex,
      roughness: 0.9,
      metalness: 0.06,
    }),
    concrete: mat(0x72767e, { roughness: 0.82, metalness: 0.06 }),
    night: mat(0xc9a45b, {
      emissive: new Color(0xc9a45b),
      emissiveIntensity: 0.95,
      roughness: 0.25,
    }),
    flame: mat(0xff6600, {
      emissive: new Color(0xff4400),
      emissiveIntensity: 3.5,
      roughness: 0.1,
    }),
    flagSaffron: mat(0xff7722, { roughness: 0.65 }),
    flagGreen: mat(0x138808, { roughness: 0.65 }),
    beacon: mat(0xffcc44, {
      emissive: new Color(0xffaa00),
      emissiveIntensity: 2.0,
      roughness: 0.15,
    }),
    windowGlow: mat(0xffea9f, {
      emissive: new Color(0xffb84d),
      emissiveIntensity: 1.5,
      roughness: 0.25,
    }),
    carvedBand: new MeshStandardMaterial({
      map: bandTex,
      roughness: 0.65,
      metalness: 0.15,
    }),
    ironPillar: new MeshStandardMaterial({
      color: 0x2a2b2e,
      roughness: 0.38,
      metalness: 0.85,
    }),
    textures,
  }
}

export function disposePalette(p: Palette) {
  for (const t of p.textures) t.dispose()
  for (const [k, m] of Object.entries(p)) {
    if (k !== "textures" && m instanceof MeshStandardMaterial) {
      m.dispose()
    }
  }
}
