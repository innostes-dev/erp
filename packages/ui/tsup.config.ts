import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "components/index": "src/components/index.ts",
    "widgets/index": "src/widgets/index.ts",
  },
  format: ["cjs", "esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  minify: false,
  external: ["react", "react-dom"],
  treeshake: true,
});
