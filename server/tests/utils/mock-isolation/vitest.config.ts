import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import type { TestSpecification } from "vitest/node"
import { BaseSequencer } from "vitest/node"

class ByNameSequencer extends BaseSequencer {
  override async sort(files: TestSpecification[]) {
    return [...files].sort((a, b) => a.moduleId.localeCompare(b.moduleId))
  }
}

// Conditions du projet server (cf. vitest.config.ts à la racine) : un worker sans isolation, avec son fichier de setup,
// et un ordre fixe pour que chaque fixture passe après celle qui pourrait lui laisser un mock.
export default defineConfig({
  // Par défaut sous la racine du test : un node_modules apparaîtrait à côté des fixtures.
  cacheDir: fileURLToPath(new URL("../../../../node_modules/.vite", import.meta.url)),
  test: {
    root: fileURLToPath(new URL(".", import.meta.url)),
    include: ["*.fixture.ts"],
    setupFiles: ["../setup.ts"],
    isolate: false,
    fileParallelism: false,
    maxWorkers: 1,
    sequence: { sequencer: ByNameSequencer },
  },
})
