import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: false,
  splitting: false,
  bundle: false, // Don't bundle - preserve module structure
  shims: true,
  skipNodeModulesBundle: true,
  external: ["@prisma/client", "puppeteer", /node_modules/],
  noExternal: [],
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
});
