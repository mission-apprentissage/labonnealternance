import nock from "nock"
import { afterAll, vi } from "vitest"
import { loadEnvForTests } from "./loadEnvForTests"

loadEnvForTests()

type EvaluatedModules = {
  idToModuleMap: Map<string, { meta?: object }>
  invalidateModule(node: { meta?: object }): void
}

// Un vi.mock par factory s'inscrit dans le meta du module qu'il remplace (meta.mockedModule), que vi.resetModules()
// ne vide pas : un fichier suivant du même worker qui mocke ce module en automock ou autospy recevrait la factory du
// précédent. Vitest n'expose pas ce graphe de modules : l'accès passe par son état interne (cf. mock-isolation.test.ts).
const forgetFactoryMocksOfPreviousFiles = () => {
  const modules = (globalThis as { __vitest_worker__?: { evaluatedModules?: Partial<EvaluatedModules> } }).__vitest_worker__?.evaluatedModules
  if (!(modules?.idToModuleMap instanceof Map) || typeof modules.invalidateModule !== "function") {
    throw new Error("Graphe de modules de Vitest introuvable (__vitest_worker__.evaluatedModules) : les mocks par factory fuiraient d'un fichier à l'autre.")
  }
  for (const node of modules.idToModuleMap.values()) {
    if (node.meta && "mockedModule" in node.meta) {
      modules.invalidateModule(node)
    }
  }
}

// Sans isolation (cf. vitest.config.ts), un fichier hérite du processus du précédent. Les modules du dépôt sont
// rechargés pour que ses vi.mock s'appliquent et que les caches de module repartent vides ; l'état global qu'il
// laisse (mocks par factory, interceptions nock en attente, espions, timers simulés, env et globales stubbés) est
// remis à zéro.
vi.resetModules()
forgetFactoryMocksOfPreviousFiles()

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
