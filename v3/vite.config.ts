import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// The v3 runs in the browser (V3-8): no desktop shell, Vite's default port.
export default defineConfig({
  // PowerSync's web SDK carries web workers and WASM: Vite must not pre-bundle it
  // (as in PowerSync's own example, demos/react-supabase-todolist).
  optimizeDeps: {
    exclude: ["@powersync/web"],
  },
  // In development, the local PowerSync is reached through the app's own site (/powersync):
  // PowerSync syncs from a shared worker, and some browsers do not let it reach another
  // origin (see powerSyncEndpoint in src/db/connector.ts). `vite preview` uses the same.
  server: {
    proxy: {
      "/powersync": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/powersync/, ""),
      },
    },
  },
  plugins: [
    react(),
    // An installable web app (V3-8, plan step 1.6): the first visit keeps the app in the
    // browser, so it opens without network. A new version is fetched when there is network,
    // takes over at once and shows on the next load; the open page is never reloaded under
    // the user's hands.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Perfumería",
        short_name: "Perfumería",
        description: "Formulación de perfumería, también sin conexión.",
        lang: "es",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f6f3",
        theme_color: "#8a5a2b",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // The SQLite WASM builds of the local copy are over Workbox's 2 MiB default, and the
        // app needs them kept to open without network.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,wasm}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
});
