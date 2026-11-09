// @ts-expect-error
import path from "node:path"

import { configDefaults, defineConfig } from "vitest/config"

// Le projet server partage un processus entre fichiers (isolate: false) : l'import du graphe serveur, payé une
// fois par worker au lieu d'une fois par fichier, représentait les deux tiers du temps des tests. Les fichiers
// qui initialisent Sentry restent isolés : son client et l'instrumentation OpenTelemetry valent pour tout le
// processus, et sentry-pii doit charger Sentry avant mongodb. État partagé remis à zéro : cf. tests/utils/setup.ts.
// web-vitals.private.controller remplace le logger de tout le graphe serveur qu'il démarre.
const serverIsolatedFiles = ["src/common/sentry/sentry-pii.test.ts", "src/common/utils/sentry-utils.test.ts", "src/http/controllers/_private/web-vitals.private.controller.test.ts"]

const serverProject = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./server/src"),
      "@tests": path.resolve(__dirname, "./server/tests"),
    },
  },
  test: {
    root: "./server",
    setupFiles: ["./tests/utils/setup.ts"],
    clearMocks: true,
    sequence: {
      // Important for useMongo to be sequential
      hooks: "stack" as const,
    },
  },
}

export default defineConfig({
  server: {
    watch: {
      ignored: ["**/venv/**"],
    },
  },
  test: {
    projects: [
      {
        ...serverProject,
        test: {
          ...serverProject.test,
          name: { label: "server", color: "blue" },
          include: ["./tests/**/*.test.ts", "**/*.test.ts"],
          exclude: [...configDefaults.exclude, ...serverIsolatedFiles],
          // Une seule fois pour les deux projets server : le teardown supprime les bases de test.
          globalSetup: ["./tests/utils/globalSetup.ts"],
          isolate: false,
        },
      },
      {
        ...serverProject,
        test: {
          ...serverProject.test,
          name: { label: "server-isolated", color: "cyan" },
          include: serverIsolatedFiles,
        },
      },
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./ui"),
          },
        },
        // le tsconfig de Next impose jsx: preserve, que Vite suivrait : sans runtime explicite, un
        // test ne peut pas importer un composant .tsx du dépôt.
        oxc: { jsx: { runtime: "automatic" } },
        test: {
          name: "ui",
          root: "./ui",
          include: ["./**/*.test.(js|jsx|ts|tsx)"],
          setupFiles: ["./tests/setup.ts"],
        },
      },
      {
        test: {
          name: "shared",
          root: "./shared",
          include: ["**/*.test.ts"],
        },
      },
    ],
  },
})
