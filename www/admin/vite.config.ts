import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import swc from "rollup-plugin-svelte-wc";

export default defineConfig({
  plugins: [swc(), sveltekit() as any],
  optimizeDeps: {
    include: ["lucide-svelte/icons/*"],
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/_": {
        target: "http://localhost:8090",
      },
      "/overlays": {
        target: "http://localhost:8090",
      },
      "/redirect": {
        target: "http://localhost:8090",
      },
      "/api": {
        target: "http://localhost:8090",
      },
    },
  },
});
