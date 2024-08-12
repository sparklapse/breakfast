import { createLogger, defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { resolve } from "node:path";

const logger = createLogger();

export default defineConfig({
  plugins: [solidPlugin()],
  base: "/breakfast",
  build: {
    sourcemap: true,
    outDir: "build",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        welcome: resolve(__dirname, "pages/welcome.html"),
      },
    },
    minify: "terser",
    terserOptions: {
      mangle: false,
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5555,
    proxy: {
      "/api": {
        target: "http://localhost:4444/api/app",
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5555,
    proxy: {
      "/api": {
        target: "http://localhost:4444/api/app",
      },
    },
  },
  customLogger: {
    ...logger,
    warn(msg) {
      // Ark ui -> zag js -> internationalization has issues where some source maps point to non existant files
      if (msg.includes("Failed to load source map")) return;
      console.warn(msg);
    },
  },
  resolve: {
    alias: {
      $lib: resolve("./src/lib"),
      $app: resolve("./src/app"),
    },
  },
});
