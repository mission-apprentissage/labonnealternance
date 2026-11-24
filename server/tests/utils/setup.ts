import nock from "nock"
import { afterAll, vi } from "vitest"
import { loadEnvForTests } from "./loadEnvForTests"

loadEnvForTests()

// Sans isolation (cf. vitest.config.ts), un fichier hérite du processus du précédent. Les modules du dépôt sont
// rechargés pour que ses vi.mock s'appliquent et que les caches de module repartent vides ; l'état global qu'il
// laisse (interceptions nock en attente, espions, timers simulés, env et globales stubbés) est remis à zéro.
vi.resetModules()

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
