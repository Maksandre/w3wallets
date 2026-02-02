import { defineConfig } from "tsup";

export default defineConfig([
  {
    entryPoints: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    outDir: "dist",
    clean: true,
  },
  {
    entryPoints: ["src/scripts/cache.ts"],
    format: ["cjs"],
    outDir: "dist/scripts",
    banner: { js: "#!/usr/bin/env node" },
    external: ["@playwright/test", "tsup", "esbuild"],
  },
]);
