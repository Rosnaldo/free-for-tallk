import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  console.log(
    "VITE_ envs:",
    Object.fromEntries(
      Object.entries(env).filter(([key]) => key.startsWith("VITE_"))
    )
  )

  const basePath = env.VITE_BASE_PATH || '/'

  const redirectToBase = {
    name: 'redirect-to-base',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (basePath !== '/' && req.url === '/') {
          res.writeHead(302, { Location: basePath })
          res.end()
          return
        }
        next()
      })
    }
  }

  return {
    base: env.VITE_CONFIG_BASE,
    plugins: [react(), tailwindcss(), redirectToBase],
    // The old .vite_cache got left behind root-owned by the docker-compose
    // "admin" container, which bind-mounts this whole repo and runs as
    // root -- a never-touched name sidesteps that (still under
    // node_modules, so it's covered by the existing gitignore) instead of
    // requiring a sudo cleanup.
    cacheDir: 'node_modules/.vite-cache-local',
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5174,
      allowedHosts: [
        "fale-com-a-missao.com",
        "fale-com-a-missao.com.br",
        "localhost",
        "127.0.0.1"
      ],
      // VITE_HMR_CLIENT_PORT (only set inside the dev docker container) tells
      // the HMR client to open its WebSocket on nginx's public port instead of
      // Vite's internal container port, which the browser can't reach directly.
      hmr: env.VITE_HMR_CLIENT_PORT
        ? { clientPort: Number(env.VITE_HMR_CLIENT_PORT) }
        : undefined,
    }
  }
})