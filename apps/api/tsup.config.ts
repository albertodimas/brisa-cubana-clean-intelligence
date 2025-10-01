import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: false,
  splitting: false,
  bundle: true, // Bundle local dependencies to ensure all modules are compiled
  shims: false, // Disable shims to avoid conflicts with external modules
  skipNodeModulesBundle: true,
  external: ["@prisma/client", "puppeteer", /node_modules/],
  noExternal: [],
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
});
