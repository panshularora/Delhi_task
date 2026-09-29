/** Open Higgsfield AI client — Muapi via same-origin Vite proxy. Key never ships. */

const ROOT = "/muapi"

export const I2I_MODEL = "nano-banana-2-edit"
export const I2I_ENDPOINT = "nano-banana-2-edit"
export const I3D_ENDPOINT = "tripo3d-h31-image-to-3d"

export type HiggsStatus = { ready: boolean }

export async function higgsfieldStatus(): Promise<HiggsStatus> {
  const res = await fetch("/__muapi/status")
  if (!res.ok) return { ready: false }
  return (await res.json()) as HiggsStatus
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function pickUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>
  const tryOne = (v: unknown): string | null => {
    if (typeof v === "string" && /^https?:\/\//.test(v)) return v
    if (v && typeof v === "object" && typeof (v as { url?: unknown }).url === "string") {
      return (v as { url: string }).url
    }
    return null
  }
  const direct = tryOne(d.url) ?? tryOne(d.output)
  if (direct) return direct
  if (Array.isArray(d.outputs)) {
    for (const o of d.outputs) {
      const u = tryOne(o)
      if (u) return u
    }
  }
  if (d.data && typeof d.data === "object") {
    const nested = pickUrl(d.data)
    if (nested) return nested
  }
  return null
}

async function poll(requestId: string, attempts: number, interval: number): Promise<unknown> {
  const url = `${ROOT}/predictions/${encodeURIComponent(requestId)}/result`
  for (let i = 0; i < attempts; i++) {
    await sleep(interval)
    const res = await fetch(url)
    const text = await res.text()
    let data: unknown = text
    try {
      data = JSON.parse(text) as unknown
    } catch {
      /* keep text */
    }
    if (!res.ok) {
      if (res.status >= 500) continue
      throw new Error(`Poll failed ${res.status}: ${text.slice(0, 160)}`)
    }
    const status = String((data as { status?: string })?.status ?? "").toLowerCase()
    if (status === "completed" || status === "succeeded" || status === "success") return data
    if (status === "failed" || status === "error") {
      const err = (data as { error?: string }).error ?? "generation failed"
      throw new Error(String(err))
    }
  }
  throw new Error("Open Higgsfield timed out while waiting for the mesh.")
}

async function submit(endpoint: string, payload: Record<string, unknown>, attempts: number) {
  const res = await fetch(`${ROOT}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    /* empty */
  }
  if (!res.ok) {
    throw new Error(data.detail ? String(data.detail) : `Muapi ${res.status}: ${text.slice(0, 180)}`)
  }
  const id = String(data.request_id ?? data.id ?? "")
  if (!id) {
    const url = pickUrl(data)
    if (url) return url
    throw new Error("Open Higgsfield returned no request id.")
  }
  const result = await poll(id, attempts, 2000)
  const url = pickUrl(result)
  if (!url) throw new Error("Open Higgsfield finished without an asset URL.")
  return url
}

export async function uploadLocalImage(src: string): Promise<string> {
  const img = await fetch(src)
  if (!img.ok) throw new Error(`Could not read ${src}`)
  const blob = await img.blob()
  const name = src.split("/").pop() || "ref.jpg"
  const file = new File([blob], name, { type: blob.type || "image/jpeg" })
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${ROOT}/upload_file`, { method: "POST", body: form })
  const text = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    /* empty */
  }
  if (!res.ok) throw new Error(text.slice(0, 180) || `upload ${res.status}`)
  const url = pickUrl(data) ?? (typeof data.file_url === "string" ? data.file_url : null)
  if (!url) throw new Error("Upload returned no URL.")
  return url
}

export async function isolateMonument(imageUrl: string, name: string): Promise<string> {
  const prompt = `The same ${name} as a single isolated architectural object, entire structure visible from a three-quarter view, plain white studio backdrop, even museum lighting, photoreal sandstone and marble, no people, no lawn, no cars, no skyline, no text.`
  return submit(
    I2I_ENDPOINT,
    {
      prompt,
      image_url: imageUrl,
      images_list: [imageUrl],
      aspect_ratio: "1:1",
    },
    60,
  )
}

export async function imageToGlb(imageUrl: string): Promise<string> {
  return submit(
    I3D_ENDPOINT,
    {
      image_url: imageUrl,
      texture: true,
      texture_quality: "standard",
      geometry_quality: "standard",
      pbr: true,
      auto_size: true,
    },
    180,
  )
}

export async function fetchAssetBlobUrl(remoteUrl: string): Promise<string> {
  const res = await fetch(`/__muapi/fetch?u=${encodeURIComponent(remoteUrl)}`)
  if (!res.ok) throw new Error(`Could not download mesh (${res.status})`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

const CACHE_KEY = "delhi-sculpt"

export function readSculptCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

export function writeSculptCache(id: string, url: string) {
  const next = { ...readSculptCache(), [id]: url }
  localStorage.setItem(CACHE_KEY, JSON.stringify(next))
}

export async function sculptPlace(opts: {
  id: string
  name: string
  image: string
  onStage?: (stage: string) => void
}): Promise<string> {
  opts.onStage?.("Uploading still")
  const uploaded = await uploadLocalImage(opts.image)
  let meshSource = uploaded
  try {
    opts.onStage?.("Isolating monument")
    meshSource = await isolateMonument(uploaded, opts.name)
  } catch {
    opts.onStage?.("Isolation skipped — meshing the still")
  }
  opts.onStage?.("Tripo3D H3.1 meshing")
  const glbRemote = await imageToGlb(meshSource)
  writeSculptCache(opts.id, glbRemote)
  opts.onStage?.("Placing it")
  return fetchAssetBlobUrl(glbRemote)
}
