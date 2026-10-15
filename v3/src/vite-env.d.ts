/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_POWERSYNC_URL: string;
}

/** One-click sign-in for the test phase, filled only by `npm run dev` (vite.config.ts); empty in a build. */
declare const __DEV_LOGINS__: ReadonlyArray<{ readonly who: "test" | "me"; readonly email: string }>;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
