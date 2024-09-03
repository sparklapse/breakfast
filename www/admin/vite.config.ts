import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import swc from "rollup-plugin-svelte-wc";

export default defineConfig({
  plugins: [swc(), sveltekit()],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
  server: {
    proxy: {
      "/overlays": {
        target: "http://localhost:8090",
      },
      "/api": {
        target: "http://localhost:8090",
      },
    },
  },
});
