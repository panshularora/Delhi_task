import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from "three"
import { PLACE_BY_ID } from "../data/places"
import {
  assertDelhiFrame,
  orbitOffset,
  OVERVIEW,
  project,
} from "../lib/geo3d"
import {
  createBirds,
  createFabric,
  createGround,
  createKartavya,
  createLamps,
  createRain,
  createSkyDome,
  createSkyLanterns,
  createStars,
  createTraffic,
  createYamuna,
  stepBirds,
  stepRain,
  stepSkyLanterns,
  stepTraffic,
} from "./environment"
import { BAKED_GLB, inkSketch, loadLandmarkGlb } from "./glbMount"
import { SIGNATURE_BUILDERS } from "./landmarks"
import { createPalette, disposePalette, type Palette } from "./materials"

export type AtmosphereMode = "dusk" | "cyber" | "dawn" | "day"
export type WeatherMode = "clear" | "monsoon"

export type WorldHandlers = {
  onSelect: (id: string) => void
  onHover: (id: string | null, sx: number, sy: number) => void
  onTourChange?: (step: number, total: number, placeId: string) => void
}

type Fly = {
  t: number
  dur: number
  yaw0: number
  yaw1: number
  pitch0: number
  pitch1: number
  d0: number
  d1: number
  tx0: number
  ty0: number
  tz0: number
  tx1: number
  ty1: number
  tz1: number
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function hasWebGL() {
  return typeof WebGLRenderingContext !== "undefined"
}

export { hasWebGL }

// Tailored cinematic camera framings for each signature monument
const LANDMARK_FRAMINGS: Record<
  string,
  { yaw: number; pitch: number; distance: number; yOffset: number }
> = {
  "india-gate": { yaw: -1.45, pitch: 0.28, distance: 26, yOffset: 3.4 },
  "qutub-minar": { yaw: 0.65, pitch: 0.32, distance: 36, yOffset: 5.2 },
  "red-fort": { yaw: -0.45, pitch: 0.38, distance: 42, yOffset: 4.5 },
  lotus: { yaw: 0.55, pitch: 0.42, distance: 38, yOffset: 3.8 },
  humayun: { yaw: 0.32, pitch: 0.34, distance: 44, yOffset: 4.2 },
  akshardham: { yaw: -0.28, pitch: 0.38, distance: 45, yOffset: 4.8 },
  rashtrapati: { yaw: 1.48, pitch: 0.30, distance: 44, yOffset: 4.2 },
  "jama-masjid": { yaw: 0.22, pitch: 0.36, distance: 38, yOffset: 4.2 },
  jantar: { yaw: 0.4, pitch: 0.38, distance: 22, yOffset: 2.4 },
  safdarjung: { yaw: 0.28, pitch: 0.36, distance: 32, yOffset: 3.4 },
}

export interface ScrollWaypoint {
  progress: number
  lat: number
  lng: number
  y: number
  yaw: number
  pitch: number
  distance: number
  atmosphere: AtmosphereMode
}

export const SCROLL_WAYPOINTS: ScrollWaypoint[] = [
  {
    progress: 0,
    lat: 28.62,
    lng: 77.22,
    y: 18,
    yaw: -0.62,
    pitch: 1.12,
    distance: 220,
    atmosphere: "dusk",
  },
  {
    progress: 0.12,
    lat: 28.614,
    lng: 77.21,
    y: 8,
    yaw: -1.05,
    pitch: 0.72,
    distance: 128,
    atmosphere: "dusk",
  },
  {
    progress: 0.26,
    lat: 28.6132,
    lng: 77.221,
    y: 3.4,
    yaw: -1.42,
    pitch: 0.32,
    distance: 48,
    atmosphere: "dusk",
  },
  {
    progress: 0.38,
    lat: 28.6129,
    lng: 77.2295,
    y: 3.6,
    yaw: -1.48,
    pitch: 0.26,
    distance: 22,
    atmosphere: "dusk",
  },
  {
    progress: 0.5,
    lat: 28.54,
    lng: 77.2,
    y: 7,
    yaw: 0.4,
    pitch: 0.48,
    distance: 70,
    atmosphere: "dusk",
  },
  {
    progress: 0.6,
    lat: 28.5245,
    lng: 77.1855,
    y: 6.4,
    yaw: 0.72,
    pitch: 0.24,
    distance: 28,
    atmosphere: "dusk",
  },
  {
    progress: 0.74,
    lat: 28.5933,
    lng: 77.2507,
    y: 4.2,
    yaw: 0.12,
    pitch: 0.3,
    distance: 32,
    atmosphere: "dusk",
  },
  {
    progress: 0.86,
    lat: 28.6562,
    lng: 77.241,
    y: 4.8,
    yaw: -0.55,
    pitch: 0.34,
    distance: 36,
    atmosphere: "dusk",
  },
  {
    progress: 1,
    lat: 28.628,
    lng: 77.218,
    y: 5.5,
    yaw: 0.28,
    pitch: 0.58,
    distance: 96,
    atmosphere: "dusk",
  },
]

export const TOUR_SEQUENCE = [
  "india-gate",
  "rashtrapati",
  "jantar",
  "humayun",
  "lotus",
  "qutub-minar",
  "red-fort",
  "akshardham",
  "jama-masjid",
  "safdarjung",
]

export class DelhiWorld {
  readonly renderer: WebGLRenderer
  readonly scene = new Scene()
  readonly camera: PerspectiveCamera
  private palette: Palette
  private sun: DirectionalLight
  private fill: DirectionalLight
  private hemi: HemisphereLight
  private ambient: AmbientLight
  private traffic: Group
  private lamps: InstancedMesh
  private birds: InstancedMesh
  private stars: Points
  private rain: Points
  private dust: Points
  private lanterns: InstancedMesh
  private landmarks = new Map<string, Group>()
  private itineraryLine: Group | null = null
  private raycaster = new Raycaster()
  private pointer = new Vector2()
  private target = new Vector3(OVERVIEW.target.x, 1.2, OVERVIEW.target.z)
  private yaw = OVERVIEW.yaw
  private pitch = OVERVIEW.pitch
  private distance = OVERVIEW.distance
  private lookX = 0
  private lookY = 0
  private fly: Fly | null = null
  private dragging = false
  private moved = false
  private lastX = 0
  private lastY = 0
  private hoverId: string | null = null
  private focusId: string | null = null
  private reduced: boolean
  private low: boolean
  private active = true
  private raf = 0
  private last = 0
  private handlers: WorldHandlers
  private canvas: HTMLCanvasElement
  private ro: ResizeObserver
  private atmosphere: AtmosphereMode = "dusk"
  private weatherMode: WeatherMode = "clear"
  private isTouringState = false
  private tourIndex = 0
  private tourTimer = 0
  private flameLight: PointLight | null = null
  private skyDome!: Mesh

  constructor(
    canvas: HTMLCanvasElement,
    opts: {
      reduced: boolean
      low: boolean
      night?: boolean
      atmosphere?: AtmosphereMode
      handlers: WorldHandlers
    },
  ) {
    this.canvas = canvas
    this.reduced = opts.reduced
    this.low = opts.low
    this.handlers = opts.handlers

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: !opts.low,
      alpha: false,
      powerPreference: "high-performance",
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.low ? 1.25 : 1.75))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25
    this.renderer.shadowMap.enabled = !opts.low
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.camera = new PerspectiveCamera(46, 1, 0.3, 2000)
    this.scene.fog = new Fog(0x181e2a, 140, 1100)
    this.scene.background = null
    this.renderer.setClearColor(0x121622, 1)

    this.palette = createPalette()
    this.hemi = new HemisphereLight(0x9cb8dc, 0x2d2420, 1.0)
    this.ambient = new AmbientLight(0xf2e8dc, 0.6)
    this.sun = new DirectionalLight(0xfff0dd, 2.2)
    this.sun.position.set(-70, 32, 28)
    this.sun.castShadow = !opts.low
    if (this.sun.castShadow) {
      this.sun.shadow.mapSize.set(opts.low ? 1024 : 2048, opts.low ? 1024 : 2048)
      this.sun.shadow.camera.near = 8
      this.sun.shadow.camera.far = 260
      this.sun.shadow.camera.left = -90
      this.sun.shadow.camera.right = 90
      this.sun.shadow.camera.top = 90
      this.sun.shadow.camera.bottom = -90
      this.sun.shadow.bias = -0.00025
      this.sun.shadow.normalBias = 0.04
    }
    this.fill = new DirectionalLight(0x8ea8c8, 0.55)
    this.fill.position.set(48, 22, -36)
    this.scene.add(this.hemi, this.ambient, this.sun, this.fill)

    const initialAtmo = opts.atmosphere ?? (opts.night ? "cyber" : "dusk")
    this.skyDome = createSkyDome(initialAtmo)
    this.scene.add(this.skyDome)

    // Delhi Environment
    this.scene.add(createGround(this.palette))
    this.scene.add(createYamuna(this.palette))
    this.scene.add(createKartavya(this.palette))
    this.scene.add(createFabric(opts.low))

    this.traffic = createTraffic(opts.low)
    this.scene.add(this.traffic)

    this.lamps = createLamps(opts.low)
    this.scene.add(this.lamps)

    this.birds = createBirds(opts.low)
    this.scene.add(this.birds)

    this.stars = createStars()
    this.scene.add(this.stars)

    this.rain = createRain()
    this.scene.add(this.rain)

    this.dust = this.makeDust()
    this.scene.add(this.dust)

    for (const [id, build] of Object.entries(SIGNATURE_BUILDERS)) {
      if (BAKED_GLB[id]) continue
      const g = build(this.palette)
      g.traverse((o) => {
        o.userData.placeId = id
        if (o.name === "amar-jawan-light") {
          this.flameLight = o as PointLight
        }
      })
      inkSketch(g)
      this.landmarks.set(id, g)
      this.scene.add(g)
    }
    void this.mountBakedLandmarks()

    this.lanterns = createSkyLanterns()
    this.scene.add(this.lanterns)

    // Panoramic command overview of Delhi showing Central Vista, CP, Yamuna & Metro
    this.target = new Vector3(OVERVIEW.target.x, 18, OVERVIEW.target.z)
    this.yaw = OVERVIEW.yaw
    this.pitch = OVERVIEW.pitch
    this.distance = OVERVIEW.distance
    this.applyAtmosphere(initialAtmo)
    this.placeCamera()
    this.resize()
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(() => {
      this.resize()
      this.renderer.render(this.scene, this.camera)
    })

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas.parentElement ?? canvas)

    canvas.addEventListener("pointerdown", this.onDown)
    canvas.addEventListener("pointermove", this.onMove)
    canvas.addEventListener("pointerup", this.onUp)
    canvas.addEventListener("pointerleave", this.onLeave)
    canvas.addEventListener("contextmenu", (e) => e.preventDefault())

    if (import.meta.env.DEV) {
      const fails = assertDelhiFrame()
      if (fails.length) console.warn("[delhi-frame]", fails)
    }
  }

  private makeDust() {
    const n = this.low ? 40 : 80
    const geo = new BufferGeometry()
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 160
      arr[i * 3 + 1] = 1.2 + Math.random() * 24
      arr[i * 3 + 2] = (Math.random() - 0.5) * 160
    }
    geo.setAttribute("position", new BufferAttribute(arr, 3))
    const mat = new PointsMaterial({
      color: 0xcbb89a,
      size: 0.12,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
    const pts = new Points(geo, mat)
    pts.visible = false
    pts.userData.extraMat = mat
    return pts
  }

  private placeCamera() {
    const o = orbitOffset(
      this.yaw + this.lookX * 0.16,
      clamp(this.pitch + this.lookY * 0.08, 0.12, 1.35),
      this.distance,
    )
    this.camera.position.set(this.target.x + o.x, this.target.y + o.y, this.target.z + o.z)
    this.camera.lookAt(this.target)
  }

  setLookNudge(x: number, y: number) {
    this.lookX = lerp(this.lookX, clamp(x, -1, 1), 0.12)
    this.lookY = lerp(this.lookY, clamp(y, -1, 1), 0.12)
  }

  private frames = 0

  private resize() {
    const parent = this.canvas.parentElement ?? this.canvas
    const w = Math.max(parent.clientWidth, this.canvas.clientWidth, 2)
    const h = Math.max(parent.clientHeight, this.canvas.clientHeight, 2)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.placeCamera()
    this.renderer.render(this.scene, this.camera)
  }

  setActive(v: boolean) {
    if (!v && this.frames < 8) return
    this.active = v
  }

  setNight(v: boolean) {
    this.setAtmosphere(v ? "cyber" : "day")
  }

  setAtmosphere(mode: AtmosphereMode) {
    this.atmosphere = mode
    this.applyAtmosphere(mode)
  }

  getAtmosphere(): AtmosphereMode {
    return this.atmosphere
  }

  setWeatherMode(mode: WeatherMode) {
    this.weatherMode = mode
    this.rain.visible = mode === "monsoon"
  }

  getWeatherMode(): WeatherMode {
    return this.weatherMode
  }

  setMetroVisible(_v: boolean) {}

  startTour() {
    this.isTouringState = true
    this.tourIndex = 0
    this.tourTimer = 0
    this.flyToTourStep(this.tourIndex)
  }

  stopTour() {
    this.isTouringState = false
  }

  isTouring(): boolean {
    return this.isTouringState
  }

  private flyToTourStep(index: number) {
    const id = TOUR_SEQUENCE[index % TOUR_SEQUENCE.length]
    this.handlers.onTourChange?.(index + 1, TOUR_SEQUENCE.length, id)
    this.setFocus(id, 2.0)
  }

  setFocus(id: string | null, duration?: number) {
    if (id === this.focusId && !this.isTouringState) return
    this.focusId = id
    if (!id) {
      this.startFly(
        OVERVIEW.yaw,
        OVERVIEW.pitch,
        OVERVIEW.distance,
        this.vec(OVERVIEW.target.x, 1.2, OVERVIEW.target.z),
        duration ?? (this.reduced ? 0.2 : 1.4),
      )
      this.dimFocus(null)
      return
    }

    const g = this.landmarks.get(id)
    const place = PLACE_BY_ID[id]
    const p = g
      ? { x: g.position.x, y: 2.2, z: g.position.z }
      : place
        ? project(place.lat, place.lng, 2.2)
        : null
    if (!p) return

    const framing = LANDMARK_FRAMINGS[id] ?? {
      yaw: this.yaw + 0.18,
      pitch: 0.44,
      distance: 24,
      yOffset: 2.6,
    }

    this.startFly(
      framing.yaw,
      framing.pitch,
      framing.distance,
      this.vec(p.x, framing.yOffset, p.z),
      duration ?? (this.reduced ? 0.2 : 1.4),
    )
    this.dimFocus(id)
  }

  async mountGenerated(id: string, url: string) {
    const root = await loadLandmarkGlb(id, url)
    const old = this.landmarks.get(id)
    if (old) {
      this.scene.remove(old)
      old.traverse((o) => this.disposeObject(o))
    }
    this.landmarks.set(id, root)
    this.scene.add(root)
    this.setFocus(id, 1.5)
  }

  private async mountBakedLandmarks() {
    const ids = Object.keys(BAKED_GLB)
    await Promise.all(
      ids.map(async (id) => {
        const url = BAKED_GLB[id]
        if (!url) return
        try {
          const root = await loadLandmarkGlb(id, url)
          const old = this.landmarks.get(id)
          if (old) {
            this.scene.remove(old)
            old.traverse((o) => this.disposeObject(o))
          }
          this.landmarks.set(id, root)
          this.scene.add(root)
        } catch (err) {
          console.warn(`[twin] failed to mount ${id}`, err)
        }
      }),
    )
  }

  setScrollProgress(progress: number) {
    if (this.dragging || this.focusId) return
    this.fly = null
    this.isTouringState = false
    const p = clamp(progress, 0, 1)

    let i = 0
    while (i < SCROLL_WAYPOINTS.length - 2 && SCROLL_WAYPOINTS[i + 1].progress < p) {
      i++
    }
    const w0 = SCROLL_WAYPOINTS[i]
    const w1 = SCROLL_WAYPOINTS[i + 1]
    const span = Math.max(0.0001, w1.progress - w0.progress)
    const rawT = clamp((p - w0.progress) / span, 0, 1)
    const t = rawT * rawT * (3 - 2 * rawT)

    const p0 = project(w0.lat, w0.lng, w0.y)
    const p1 = project(w1.lat, w1.lng, w1.y)

    this.target.set(
      lerp(p0.x, p1.x, t),
      lerp(p0.y, p1.y, t),
      lerp(p0.z, p1.z, t),
    )
    this.yaw = lerpAngle(w0.yaw, w1.yaw, t)
    this.pitch = lerp(w0.pitch, w1.pitch, t)
    this.distance = lerp(w0.distance, w1.distance, t)

    const targetAtmo = t < 0.5 ? w0.atmosphere : w1.atmosphere
    if (targetAtmo !== this.atmosphere) {
      this.setAtmosphere(targetAtmo)
    }

    const fog = this.scene.fog as Fog
    fog.near = 18 + this.distance * 0.35
    fog.far = 90 + this.distance * 3.4
    this.placeCamera()
  }

  setCameraPreset(preset: "kartavya" | "qutub" | "heritage" | "satellite" | "yamuna") {
    this.isTouringState = false
    this.focusId = null
    this.dimFocus(null)
    if (preset === "kartavya") {
      const p = project(28.6132, 77.225)
      this.startFly(0.18, 0.34, 22, this.vec(p.x, 2.4, p.z), 1.5)
    } else if (preset === "qutub") {
      const p = project(28.5245, 77.1855)
      this.startFly(0.85, 0.28, 26, this.vec(p.x, 6.2, p.z), 1.5)
    } else if (preset === "heritage") {
      const p = project(28.6143, 77.1994)
      this.startFly(1.52, 0.34, 28, this.vec(p.x, 3.6, p.z), 1.5)
    } else if (preset === "yamuna") {
      const p = project(28.6127, 77.2773)
      this.startFly(-0.48, 0.42, 32, this.vec(p.x, 3.5, p.z), 1.5)
    } else {
      this.startFly(OVERVIEW.yaw, 0.65, 68, this.vec(OVERVIEW.target.x, 1.2, OVERVIEW.target.z), 1.5)
    }
  }

  getCameraTelemetry() {
    const deg = Math.round((((this.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI))
    const alt = Math.round(this.camera.position.y * 12)
    return {
      heading: deg,
      alt,
      pitch: Math.round(this.pitch * (180 / Math.PI)),
      dist: Math.round(this.distance * 10),
    }
  }

  setItinerary(points: { lat: number; lng: number }[]) {
    if (this.itineraryLine) {
      this.scene.remove(this.itineraryLine)
      this.itineraryLine.traverse((o) => this.disposeObject(o))
      this.itineraryLine = null
    }
    if (points.length < 2) return
    const pts = points.map((p) => {
      const v = project(p.lat, p.lng)
      return new Vector3(v.x, 0.42, v.z)
    })
    const curve = new CatmullRomCurve3(pts)
    const geo = new TubeGeometry(curve, Math.max(20, pts.length * 10), 0.11, 5, false)
    const mat = new MeshBasicMaterial({ color: 0xffd84a })
    const mesh = new Mesh(geo, mat)
    mesh.userData.extraMat = mat
    const g = new Group()
    g.add(mesh)
    this.itineraryLine = g
    this.scene.add(g)
  }

  start() {
    this.last = performance.now()
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      if (!this.active && this.frames > 8) return
      this.tick(dt, now * 0.001)
    }
    this.raf = requestAnimationFrame(loop)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    this.canvas.removeEventListener("pointerdown", this.onDown)
    this.canvas.removeEventListener("pointermove", this.onMove)
    this.canvas.removeEventListener("pointerup", this.onUp)
    this.canvas.removeEventListener("pointerleave", this.onLeave)
    this.scene.traverse((o) => this.disposeObject(o))
    disposePalette(this.palette)
    this.renderer.dispose()
  }

  private tick(dt: number, t: number) {
    if (this.fly) {
      this.fly.t += dt
      const u = easeInOut(Math.min(1, this.fly.t / this.fly.dur))
      this.yaw = lerp(this.fly.yaw0, this.fly.yaw1, u)
      this.pitch = lerp(this.fly.pitch0, this.fly.pitch1, u)
      this.distance = lerp(this.fly.d0, this.fly.d1, u)
      this.target.set(
        lerp(this.fly.tx0, this.fly.tx1, u),
        lerp(this.fly.ty0, this.fly.ty1, u),
        lerp(this.fly.tz0, this.fly.tz1, u),
      )
      if (u >= 1) this.fly = null
    } else if (this.isTouringState) {
      // Gentle cinematic orbit while admiring the monument
      this.yaw += dt * 0.08
      this.tourTimer += dt
      if (this.tourTimer > 4.8) {
        this.tourTimer = 0
        this.tourIndex = (this.tourIndex + 1) % TOUR_SEQUENCE.length
        this.flyToTourStep(this.tourIndex)
      }
    } else if (!this.dragging && !this.focusId && !this.reduced) {
      this.lookX *= 0.94
      this.lookY *= 0.94
    }

    this.placeCamera()

    if (!this.reduced) {
      stepTraffic(this.traffic, dt)
      stepBirds(this.birds, t)
      stepRain(this.rain, dt)
      if (this.lanterns.visible) stepSkyLanterns(this.lanterns, dt, t)
      if (this.dust.visible) this.dust.rotation.y = t * 0.02
      if (this.stars.visible) {
        this.stars.rotation.y = t * 0.005
      }
      if (this.flameLight) {
        this.flameLight.intensity = 2.0 + Math.sin(t * 18) * 0.5 + Math.cos(t * 27) * 0.3
      }
    }

    this.renderer.render(this.scene, this.camera)
    this.frames += 1
  }

  private startFly(
    yaw: number,
    pitch: number,
    distance: number,
    target: Vector3,
    dur = 1.3,
  ) {
    this.fly = {
      t: 0,
      dur,
      yaw0: this.yaw,
      yaw1: yaw,
      pitch0: this.pitch,
      pitch1: pitch,
      d0: this.distance,
      d1: distance,
      tx0: this.target.x,
      ty0: this.target.y,
      tz0: this.target.z,
      tx1: target.x,
      ty1: target.y,
      tz1: target.z,
    }
  }

  private dimFocus(id: string | null) {
    for (const [key, g] of this.landmarks) {
      const on = !id || key === id
      g.scale.setScalar(on ? 1 : 0.9)
    }
  }

  private applyAtmosphere(atmo: AtmosphereMode) {
    const fog = this.scene.fog as Fog
    const p = this.palette
    const lampMat = this.lamps.userData.extraMat as { emissiveIntensity: number } | undefined

    if (this.skyDome) {
      this.skyDome.userData.updateSky?.(atmo)
      if (this.skyDome.userData.tex) {
        this.skyDome.userData.tex.needsUpdate = true
      }
    }

    if (atmo === "cyber") {
      fog.color.set(0x0e1422)
      fog.near = 110
      fog.far = 950
      this.scene.background = null
      this.renderer.setClearColor(0x0a0e18, 1)

      this.sun.intensity = 1.2
      this.sun.color.set(0x7a9ad0)
      this.sun.position.set(40, 50, 20)
      this.fill.intensity = 0.35
      this.fill.color.set(0x3a5080)

      this.hemi.intensity = 0.75
      this.hemi.color.set(0x4a6890)
      this.hemi.groundColor.set(0x181e28)

      this.ambient.intensity = 0.45
      this.ambient.color.set(0x2a3850)

      this.renderer.toneMappingExposure = 1.2
      this.stars.visible = true
      this.lanterns.visible = true
      this.dust.visible = false

      if (lampMat) lampMat.emissiveIntensity = 2.2
      p.sand.emissive.set(0x000000)
      p.redSand.emissive.set(0x000000)
      p.marble.emissive.set(0x000000)
      p.cream.emissive.set(0x000000)
      p.pink.emissive.set(0x000000)
    } else if (atmo === "dusk") {
      fog.color.set(0x1c202c)
      fog.near = 140
      fog.far = 1100
      this.scene.background = null
      this.renderer.setClearColor(0x141822, 1)

      this.sun.intensity = 2.45
      this.sun.color.set(0xffd2a8)
      this.sun.position.set(-70, 30, 22)
      this.fill.intensity = 0.6
      this.fill.color.set(0x8ea8c8)

      this.hemi.intensity = 1.0
      this.hemi.color.set(0x9cb8dc)
      this.hemi.groundColor.set(0x2d2420)

      this.ambient.intensity = 0.6
      this.ambient.color.set(0xf2e8dc)

      this.renderer.toneMappingExposure = 1.15
      this.stars.visible = false
      this.lanterns.visible = false
      this.dust.visible = true

      if (lampMat) lampMat.emissiveIntensity = 1.2
      p.sand.emissive.set(0x000000)
      p.redSand.emissive.set(0x000000)
      p.marble.emissive.set(0x000000)
      p.cream.emissive.set(0x000000)
      p.pink.emissive.set(0x000000)
    } else if (atmo === "dawn") {
      // Royal Morning (Subah-e-Dilli)
      fog.color.set(0x323a48)
      fog.near = 130
      fog.far = 1000
      this.scene.background = null
      this.renderer.setClearColor(0x262e3c, 1)

      this.sun.intensity = 2.2
      this.sun.color.set(0xffe2c4)
      this.sun.position.set(-50, 32, 35)
      this.fill.intensity = 0.5
      this.fill.color.set(0xa8b8d0)

      this.hemi.intensity = 0.95
      this.hemi.color.set(0xa4bad8)
      this.hemi.groundColor.set(0x2c2622)

      this.ambient.intensity = 0.55
      this.ambient.color.set(0xefe4d6)

      this.renderer.toneMappingExposure = 1.1
      this.stars.visible = false
      this.lanterns.visible = false
      this.dust.visible = true

      p.sand.emissive.set(0x000000)
      p.redSand.emissive.set(0x000000)
      p.marble.emissive.set(0x000000)
      p.cream.emissive.set(0x000000)
      p.pink.emissive.set(0x000000)
    } else {
      // Day
      fog.color.set(0x84a4c4)
      fog.near = 160
      fog.far = 1200
      this.scene.background = null
      this.renderer.setClearColor(0x7898b8, 1)

      this.sun.intensity = 2.15
      this.sun.color.set(0xfff4e4)
      this.sun.position.set(-55, 58, 36)
      this.fill.intensity = 0.55
      this.fill.color.set(0xb9cbe0)

      this.hemi.intensity = 1.05
      this.hemi.color.set(0xa0c4e8)
      this.hemi.groundColor.set(0x3a3832)

      this.ambient.intensity = 0.55
      this.ambient.color.set(0xf2ebe0)

      this.renderer.toneMappingExposure = 0.98
      this.stars.visible = false
      this.lanterns.visible = false
      this.dust.visible = true

      p.sand.emissive.set(0x000000)
      p.redSand.emissive.set(0x000000)
      p.marble.emissive.set(0x000000)
      p.cream.emissive.set(0x000000)
      p.pink.emissive.set(0x000000)
    }
  }

  private hit(cx: number, cy: number): string | null {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((cx - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((cy - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const roots = [...this.landmarks.values()]
    const hits = this.raycaster.intersectObjects(roots, true)
    for (const h of hits) {
      if (h.object.userData.placeId) {
        return h.object.userData.placeId as string
      }
    }
    return null
  }

  private onDown = (e: PointerEvent) => {
    this.dragging = true
    this.moved = false
    this.lastX = e.clientX
    this.lastY = e.clientY
    this.canvas.setPointerCapture(e.pointerId)
  }

  private onMove = (e: PointerEvent) => {
    if (this.dragging) {
      const dx = e.clientX - this.lastX
      const dy = e.clientY - this.lastY
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        this.moved = true
        // If user manually drags, exit tour mode smoothly
        if (this.isTouringState) this.isTouringState = false
      }
      this.lastX = e.clientX
      this.lastY = e.clientY
      this.yaw -= dx * 0.005
      this.pitch = clamp(this.pitch + dy * 0.004, 0.15, 1.35)
      this.fly = null
      return
    }
    const id = this.hit(e.clientX, e.clientY)
    const rect = this.canvas.getBoundingClientRect()
    if (id) {
      this.handlers.onHover(id, e.clientX - rect.left, e.clientY - rect.top)
    } else if (this.hoverId) {
      this.handlers.onHover(null, 0, 0)
    }
    if (id !== this.hoverId) {
      this.hoverId = id
      this.canvas.style.cursor = id ? "pointer" : "grab"
    }
  }

  private onUp = (e: PointerEvent) => {
    this.dragging = false
    try {
      this.canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (!this.moved) {
      const id = this.hit(e.clientX, e.clientY)
      if (id) {
        if (this.isTouringState) this.isTouringState = false
        this.handlers.onSelect(id)
      }
    }
  }

  private onLeave = () => {
    this.dragging = false
    if (this.hoverId) {
      this.hoverId = null
      this.handlers.onHover(null, 0, 0)
    }
  }

  private vec(x: number, y: number, z: number) {
    return new Vector3(x, y, z)
  }

  private disposeObject(o: Object3D) {
    const mesh = o as { geometry?: { dispose: () => void } }
    mesh.geometry?.dispose()
    const extra = o.userData.extraMat as { dispose?: () => void } | undefined
    if (!extra) return
    for (const [k, v] of Object.entries(this.palette)) {
      if (k !== "textures" && v === extra) return
    }
    extra.dispose?.()
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpAngle(a: number, b: number, t: number) {
  const diff = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  return a + diff * t
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}
