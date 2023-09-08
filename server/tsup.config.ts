// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup"

export default defineConfig((options) => {
  const isDev = options.env?.NODE_ENV !== "production"

  const entry: Record<string, string> = {
    index: isDev ? "src/dev.ts" : "src/main.ts",
  }
  return {
    entry,
    watch: isDev && options.watch ? ["./src"] : false,
    onSuccess: isDev && options.watch ? "yarn cli:up start --withProcessor" : "",
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
    env: {
      ...options.env,
    },
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        "process.env.IS_BUILT": '"true"',
        "process.env.NODE_ENV": isDev ? '"developpement"' : '"production"',
      }
    },
  }
})
