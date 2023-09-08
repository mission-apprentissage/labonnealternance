// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup"

export default defineConfig((options) => {
  const entry: Record<string, string> = {
    index: options.watch ? "src/dev.ts" : "src/index.ts",
  }
  return {
    entry,
    watch: options.watch ? ["./src"] : false,
    onSuccess: options.watch ? "yarn cli:up start" : "",
    // In watch mode doesn't exit cleanly as it causes EADDRINUSE error
    killSignal: "SIGKILL",
    target: "es2022",
    platform: "node",
    format: ["esm"],
    splitting: true,
    shims: false,
    minify: false,
    sourcemap: true,
    // noExternal: ["shared"],
    // Do not include bson which is using top-level await
    // This could be supported in future when using nodejs16 module in tsconfig
    external: ["bson", "mongodb", "dotenv"],
    clean: true,
  }
})
