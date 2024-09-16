import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true, useRecommendedBuildConfig: false }),
    {
      name: "de-module",
      transformIndexHtml: (html) => {
        return html.replace('<script type="module"', "<script");
      },
    },
  ],
  build: {
    assetsInlineLimit: Infinity,
    chunkSizeWarningLimit: Infinity,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        sse: resolve("sse.html"),
        local: resolve("local.html"),
      },
    },
  },
});
