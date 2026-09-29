import {
  Box3,
  BoxGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  LOD,
  Mesh,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  Vector3,
  type Material,
  type Object3D,
} from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { heightUnits, project } from "../lib/geo3d"
import { PLACE_BY_ID } from "../data/places"

/** Real heights in metres — used to scale generated meshes onto the tangent plane. */
export const LANDMARK_HEIGHT_M: Record<string, number> = {
  "india-gate": 42,
  "qutub-minar": 72.5,
  "red-fort": 33,
  lotus: 34,
  humayun: 47,
  akshardham: 43,
  rashtrapati: 55,
  "jama-masjid": 41,
  jantar: 27,
  safdarjung: 37,
}

/** Baked GLBs in /public/models. Facade of each source mesh faces +Z. */
export const BAKED_GLB: Record<string, string> = {
  "india-gate": "/models/india-gate.glb",
  "qutub-minar": "/models/qutub-minar.glb",
  "red-fort": "/models/red-fort.glb",
  lotus: "/models/lotus.glb",
  humayun: "/models/humayun.glb",
  "jama-masjid": "/models/jama-masjid.glb",
}

/**
 * Yaw that takes a +Z facade into world heading.
 * East=+X, North=−Z. India Gate and Lahori Gate face west (−X);
 * Jama Masjid's prayer-hall iwan faces the courtyard to the east (+X);
 * Humayun's Tomb is approached from the south (+Z).
 */
export const LANDMARK_YAW: Record<string, number> = {
  "india-gate": -Math.PI / 2,
  "red-fort": -Math.PI / 2,
  "qutub-minar": 0,
  lotus: 0,
  humayun: 0,
  "jama-masjid": Math.PI / 2,
}

const loader = new GLTFLoader()

let toonRamp: CanvasTexture | null = null

function getToonRamp() {
  if (toonRamp) return toonRamp
  const canvas = document.createElement("canvas")
  canvas.width = 4
  canvas.height = 1
  const ctx = canvas.getContext("2d")!
  const stops = ["#3b2a20", "#7a5340", "#c9a078", "#f4e6c8"]
  stops.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(i, 0, 1, 1)
  })
  const tex = new CanvasTexture(canvas)
  tex.minFilter = NearestFilter
  tex.magFilter = NearestFilter
  toonRamp = tex
  return tex
}

/** Flatten a photoreal mesh into a drawing: toon bands + ink edges. */
export function inkSketch(root: Object3D) {
  root.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    const srcs = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter(
      Boolean,
    ) as Material[]
    const next = srcs.map((raw) => {
      if ((raw as MeshToonMaterial).isMeshToonMaterial) return raw
      const std = raw as MeshStandardMaterial
      const color = std.color ? std.color.clone() : new Color(0xd2b48c)
      color.offsetHSL(0, 0.14, 0.05)
      const toon = new MeshToonMaterial({
        color,
        map: std.map ?? null,
        gradientMap: getToonRamp(),
        transparent: std.transparent,
        opacity: std.opacity,
        side: std.side,
      })
      return toon
    })
    mesh.material = next.length === 1 ? next[0]! : next
    mesh.castShadow = true
    mesh.receiveShadow = true

    const count = mesh.geometry.getAttribute("position")?.count ?? 0
    if (count > 24 && count < 22000 && !mesh.userData.inked) {
      const edges = new EdgesGeometry(mesh.geometry, 24)
      const line = new LineSegments(
        edges,
        new LineBasicMaterial({
          color: 0x1a1410,
          transparent: true,
          opacity: 0.46,
        }),
      )
      line.raycast = () => {}
      mesh.add(line)
      mesh.userData.inked = true
    }
  })
}

function polishMesh(o: Object3D) {
  const mesh = o as Mesh
  if (!mesh.isMesh) return
  mesh.castShadow = true
  mesh.receiveShadow = true
}

export async function loadLandmarkGlb(id: string, url: string): Promise<Group> {
  const gltf = await loader.loadAsync(url)
  const model = gltf.scene
  model.rotation.y = LANDMARK_YAW[id] ?? 0
  model.updateMatrixWorld(true)

  const box = new Box3().setFromObject(model)
  const size = box.getSize(new Vector3())
  const targetH = heightUnits(LANDMARK_HEIGHT_M[id] ?? 40)
  const s = targetH / Math.max(size.y, 0.001)
  model.scale.setScalar(s)
  model.updateMatrixWorld(true)

  const fitted = new Box3().setFromObject(model)
  const center = fitted.getCenter(new Vector3())
  model.position.x -= center.x
  model.position.z -= center.z
  model.position.y -= fitted.min.y
  model.updateMatrixWorld(true)

  const seated = new Box3().setFromObject(model)
  const dim = seated.getSize(new Vector3())

  model.traverse(polishMesh)
  inkSketch(model)

  const lod = new LOD()
  lod.name = `lod-${id}`
  lod.addLevel(model, 0)
  const proxy = new Mesh(
    new BoxGeometry(Math.max(dim.x, 1.2), Math.max(dim.y, 1.2), Math.max(dim.z, 1.2)),
    new MeshStandardMaterial({
      color: new Color(0xb08a6a),
      roughness: 0.78,
      metalness: 0.04,
    }),
  )
  proxy.position.y = dim.y * 0.5
  proxy.castShadow = false
  proxy.receiveShadow = true
  proxy.userData.placeId = id
  lod.addLevel(proxy, 160)

  const root = new Group()
  root.name = `generated-${id}`
  root.add(lod)
  const place = PLACE_BY_ID[id]
  if (place) {
    const p = project(place.lat, place.lng)
    root.position.set(p.x, 0, p.z)
  }
  root.userData.placeId = id
  root.userData.generated = true
  root.traverse((o: Object3D) => {
    o.userData.placeId = id
  })
  return root
}
