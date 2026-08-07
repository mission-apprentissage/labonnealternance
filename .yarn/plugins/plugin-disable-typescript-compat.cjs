// Yarn's builtin `compat/typescript` patch targets the legacy JS compiler
// file layout (lib/_tsc.js, etc). TypeScript 7's native compiler package no
// longer ships those files, so the patch hard-errors on install.
// We use nodeLinker: node-modules (not PnP), so we don't need the patch at
// all — it exists purely to make `typescript` resolvable through PnP's
// virtual filesystem for editor SDKs. This plugin strips the auto-injected
// `patch:...builtin<compat/typescript>` wrapper so `typescript` resolves to
// the plain npm package.
// Upstream fix (limits the patch to typescript < 7): yarnpkg/berry#7190
// Tracking issue: yarnpkg/berry#7191
module.exports = {
  name: "plugin-disable-typescript-compat",
  factory: (require) => {
    const { structUtils } = require("@yarnpkg/core")

    return {
      hooks: {
        reduceDependency: async (dependency) => {
          if (structUtils.stringifyIdent(dependency) !== "typescript") return dependency

          // Only strip the builtin compat/typescript patch — leave any other
          // patch (e.g. a real custom one added later via .yarn/patches) alone.
          if (!dependency.range.startsWith("patch:") || !dependency.range.includes("builtin<compat/typescript>")) return dependency

          const source = dependency.range.match(/^patch:([^#]+)/)?.[1]

          if (!source) return dependency

          const unpatched = structUtils.parseDescriptor(decodeURIComponent(source))

          return structUtils.makeDescriptor(dependency, unpatched.range)
        },
      },
    }
  },
}
