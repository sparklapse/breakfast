import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
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
