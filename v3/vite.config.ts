import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// The v3 runs in the browser (V3-8): no desktop shell, Vite's default port.
export default defineConfig({
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
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
