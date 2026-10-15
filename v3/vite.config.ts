import { createClient } from "@supabase/supabase-js";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * One-click sign-in for the test phase, in development only (`npm run dev`), with no password:
 * the user asked for it to open their own account directly (2026-10-15). The accounts are
 * DEV_LOGIN_EMAIL (yours) and TEST_USER_A_EMAIL of .env.local; the page only learns their mails.
 * The dev server asks the LOCAL Supabase, with its secret key, for a one-use sign-in link for that
 * mail, and the page redeems it (verifyOtp). A build (`npm run build`, what is published) has
 * neither the list nor the endpoint.
 */
type DevAccount = { who: "test" | "me"; email: string };
function devAccounts(env: Record<string, string>): DevAccount[] {
  return [
    { who: "me" as const, email: env.DEV_LOGIN_EMAIL },
    { who: "test" as const, email: env.TEST_USER_A_EMAIL },
  ].filter((a) => a.email);
}

/** The endpoint that gives the page a one-use sign-in for one of those accounts. */
function devLogin(): Plugin {
  return {
    name: "perfumeria-dev-login",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const accounts = devAccounts(env);
      server.middlewares.use("/__dev/login", (req, res) => {
        const answer = (status: number, body: object) => {
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };
        // Only this computer, only the app's own page, only the local Supabase.
        const loopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "");
        const origin = req.headers.origin;
        const sameSite = !origin || origin === `http://${req.headers.host}`;
        const local = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/.test(env.VITE_SUPABASE_URL ?? "");
        if (req.method !== "POST" || !loopback || !sameSite || !local || !env.SUPABASE_LOCAL_SECRET_KEY) return answer(403, { error: "forbidden" });
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          void (async () => {
            try {
              const who = (JSON.parse(body) as { who?: string }).who;
              const account = accounts.find((a) => a.who === who);
              if (!account) return answer(404, { error: "no such account" });
              const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_LOCAL_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
              const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: account.email });
              if (error) throw error;
              answer(200, { tokenHash: data.properties.hashed_token });
            } catch (e) {
              answer(500, { error: e instanceof Error ? e.message : String(e) });
            }
          })();
        });
      });
    },
  };
}

// The v3 runs in the browser (V3-8): no desktop shell, Vite's default port.
export default defineConfig(({ command, mode }) => ({
  define: { __DEV_LOGINS__: JSON.stringify(command === "serve" ? devAccounts(loadEnv(mode, process.cwd(), "")) : []) },
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
    devLogin(),
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
}));
