import { afterEach, describe, expect, it, vi } from "vitest"

// Module rechargé à chaque test : la configuration et les crons sont lus au chargement, comme au démarrage des process.
const loadImporters = async (daytimeRefreshPartners: string) => {
  process.env.LBA_DAYTIME_REFRESH_PARTNERS = daytimeRefreshPartners
  vi.resetModules()
  const { importers } = await import("./jobs-partners.importer")
  return Object.entries(importers).filter(([name]) => name.startsWith("Cycle de journée"))
}

// Chaque test réévalue tout le graphe des importeurs : plus de 5 s sur un runner chargé.
describe("jobs-partners.importer et configuration du cycle de journée", { timeout: 60_000 }, () => {
  afterEach(() => {
    delete process.env.LBA_DAYTIME_REFRESH_PARTNERS
  })

  it("une configuration invalide n'empêche pas le chargement : un seul cron de cycle, qui échoue avec l'erreur de configuration", async () => {
    const cycles = await loadImporters("jobteaser")

    expect.soft(cycles.map(([name, { tag }]) => [name, tag])).toEqual([["Cycle de journée : configuration invalide", "slave"]])
    await expect(cycles[0]?.[1].handler(new AbortController().signal)).rejects.toThrow("LBA_DAYTIME_REFRESH_PARTNERS : jobteaser hors des partenaires flux")
  })

  it("(near-miss) une configuration valide déclare les crons des unités, sans cron d'erreur", async () => {
    const cycles = await loadImporters("Jobteaser")

    expect(cycles.map(([name]) => name)).toEqual(["Cycle de journée Jobteaser"])
  })
})
