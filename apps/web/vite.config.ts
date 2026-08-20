import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  console.log(
    'VITE_ envs:',
    Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))
    )
  );

  return {
    // node_modules/.vite (and then node_modules/.vite-cache too, see git
    // history) got left behind root-owned by the docker-compose "web"
    // container, which bind-mounts this whole repo and runs as root --
    // every name tried so far got repoiluted while that container was up.
    // A never-touched name sidesteps that (still under node_modules, so
    // it's covered by the existing gitignore) instead of requiring a sudo
    // cleanup -- safe now that the container's stopped, but if it comes
    // back up and this gets poisoned again, rename it once more (or fix
    // the container to not run as root).
    cacheDir: 'node_modules/.vite-cache-local',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@/src', replacement: path.resolve(__dirname, './src') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    server: {
      // Bind on all interfaces so the Vite dev server is reachable from the
      // nginx container (and its browser-facing WebSocket proxy) in docker-compose.dev.yml.
      host: true,
      // Must match the port nginx/docker-compose.dev.yml proxy to (web:5174).
      port: 5173,
      // Vite blocks requests whose Host header isn't in this list (DNS-rebinding
      // protection) — nginx forwards the original Host, so it must be allowed here.
      allowedHosts: [
        "fale-com-a-missao.com",
        "fale-com-a-missao.com.br",
        "localhost",
        "127.0.0.1"
      ],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      // VITE_HMR_CLIENT_PORT (only set inside the dev docker container) tells the
      // HMR client to open its WebSocket on nginx's public port instead of Vite's
      // internal container port, which the browser can't reach directly.
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : process.env.VITE_HMR_CLIENT_PORT
          ? { clientPort: Number(process.env.VITE_HMR_CLIENT_PORT) }
          : true,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      pool: 'threads',
      threads: {
        singleThread: true,
      },
      setupFiles: ['./src/__tests__/setup.ts'],
      env: {
        VITE_ENV: 'test',
      },
    },
  };
});
