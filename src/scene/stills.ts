import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
} from "three"

export const STUDIO_STILLS: Record<string, string> = {
  "india-gate": "/images/studio/india-gate.png",
  "red-fort": "/images/studio/red-fort.png",
  "qutub-minar": "/images/studio/qutub-minar.png",
  lotus: "/images/studio/lotus.png",
  akshardham: "/images/studio/akshardham.png",
  "jama-masjid": "/images/studio/jama-masjid.png",
  jantar: "/images/studio/jantar.png",
  safdarjung: "/images/studio/safdarjung.png",
}

const loader = new TextureLoader()

/** South-facing scan plate on the east apron so the still sits in the twin. */
export function mountStudioPlate(root: Group, id: string) {
  const url = STUDIO_STILLS[id]
  if (!url) return

  const frame = new Mesh(
    new BoxGeometry(3.72, 2.18, 0.08),
    new MeshStandardMaterial({
      color: 0xc9a45b,
      roughness: 0.45,
      metalness: 0.28,
    }),
  )
  frame.position.set(5.1, 1.22, 2.2)
  root.add(frame)

  loader.load(url, (tex) => {
    tex.colorSpace = SRGBColorSpace
    const plate = new Mesh(
      new PlaneGeometry(3.55, 2.0),
      new MeshStandardMaterial({
        map: tex,
        roughness: 0.62,
        metalness: 0.04,
      }),
    )
    plate.position.set(5.1, 1.22, 2.25)
    plate.userData.placeId = id
    plate.userData.extraMat = plate.material
    root.add(plate)
  })
}
