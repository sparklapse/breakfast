import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    viteSingleFile(),
    dts({
      include: ["src/global.d.ts"],
      copyDtsFiles: true,
      beforeWriteFile: (filePath, content) => ({
        filePath: filePath.replace("src/", ""),
        content,
      }),
    }),
  ],
});
