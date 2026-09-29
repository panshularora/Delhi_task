import react from "@vitejs/plugin-react"
import type { IncomingMessage, ServerResponse } from "node:http"
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite"

function muapiLocal(key: string): Plugin {
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? ""
    if (url.startsWith("/__muapi/status")) {
      res.setHeader("Content-Type", "application/json")
      res.end(JSON.stringify({ ready: Boolean(key) }))
      return
    }
    if (url.startsWith("/__muapi/fetch")) {
      const u = new URL(url, "http://127.0.0.1").searchParams.get("u") ?? ""
      let host = ""
      try {
        host = new URL(u).hostname
      } catch {
        res.statusCode = 400
        res.end("bad url")
        return
      }
      if (!(host === "muapi.ai" || host.endsWith(".muapi.ai"))) {
        res.statusCode = 400
        res.end("host not allowed")
        return
      }
      fetch(u)
        .then(async (r) => {
          res.statusCode = r.status
          const type = r.headers.get("content-type") ?? "application/octet-stream"
          res.setHeader("Content-Type", type)
          const buf = Buffer.from(await r.arrayBuffer())
          res.end(buf)
        })
        .catch(() => {
          res.statusCode = 502
          res.end("fetch failed")
        })
      return
    }
    next()
  }
  return {
    name: "muapi-local",
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const otdKey = env.OTD_API_KEY ?? ""
  const muapiKey = env.MUAPI_API_KEY ?? ""
  const proxy = {
    "/otd/vehicles": {
      target: "https://otd.delhi.gov.in",
      changeOrigin: true,
      secure: true,
      rewrite: () =>
        `/api/realtime/VehiclePositions.pb?key=${encodeURIComponent(otdKey)}`,
    },
    "/muapi": {
      target: "https://api.muapi.ai",
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(/^\/muapi/, "/api/v1"),
      configure(proxy) {
        proxy.on("proxyReq", (proxyReq) => {
          if (muapiKey) proxyReq.setHeader("x-api-key", muapiKey)
        })
      },
    } satisfies ProxyOptions,
  }

  return {
    plugins: [react(), muapiLocal(muapiKey)],
    optimizeDeps: {
      exclude: ["maplibre-gl"],
      include: ["gtfs-realtime-bindings"],
    },
    server: { proxy },
    preview: { proxy },
  }
})
