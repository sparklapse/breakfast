import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "node:fs";
import { resolve as pathRes } from "node:path";

const EXTENSIONS = [".js", ".ts", ".jsx", ".tsx"];
const EXTERNAL = [
  // Get the list of packages from package.json dependencies
  ...Object.keys(JSON.parse(readFileSync(pathRes("./package.json"))).dependencies),
  "solid-js/store",
  "solid-js/web",
];

/**
 * 1.
 * Silence circular dependency warnings for specific packages
 * https://github.com/rollup/rollup/issues/1089#issuecomment-402109607
 *
 * 2.
 * Silence a solid import warning that never actually is imported
 *
 * @param {import("rollup").RollupLog} warning
 * @returns
 */
const onwarn = (warning) => {
  // 1
  if (warning.code === "CIRCULAR_DEPENDENCY" && warning.message.includes("node_modules")) return;

  // 2
  if (
    warning.message.includes(
      `"memo" is imported from external module "solid-js/web" but never used in`,
    )
  )
    return;

  // Warn like normal
  console.warn(`(!) ${warning.message}`);
};

/** @type {import("rollup").RollupOptions} */
export default {
  input: {
    index: "./src/lib/lib.ts",
    components: "./src/lib/lib-components.ts",
  },
  output: [
    {
      dir: "./dist/lib",
      entryFileNames: "[name].js",
      // file: `./dist/lib/index.mjs`,
      format: "esm",
      exports: "named",
    },
  ],
  external: EXTERNAL,
  onwarn,
  plugins: [
    babel({
      babelHelpers: "bundled",
      presets: ["babel-preset-solid"],
      extensions: EXTENSIONS,
    }),
    typescript({
      sourceMap: false,
      tsconfig: "./tsconfig.build.json",
    }),
    commonjs(),
    resolve({
      browser: true,
      exportConditions: [],
      extensions: EXTENSIONS,
    }),
    // terser({
    // }),
  ],
};
