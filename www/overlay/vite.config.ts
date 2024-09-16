import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true }),
    {
      name: "de-module",
      transformIndexHtml: (html) => {
        return html.replace('<script type="module"', "<script");
      },
    },
  ],
});
