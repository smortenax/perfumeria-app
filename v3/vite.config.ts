import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The v3 runs in the browser (V3-8): no desktop shell, Vite's default port.
export default defineConfig({
  plugins: [react()],
});
