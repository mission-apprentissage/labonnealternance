import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { METADATA } = await import("./routes.metadata.utils")

describe("METADATA.dynamic.metierJobById", () => {
  it("construit un title calé sur les requêtes « alternance {secteur} »", () => {
    expect(METADATA.dynamic.metierJobById("Ressources humaines").title).toBe("Alternance ressources humaines : offres et formations | La bonne alternance")
  })

  it("construit une description propre au secteur", () => {
    expect(METADATA.dynamic.metierJobById("Coiffure").description).toBe(
      "Coiffure en alternance : offres d'emploi en apprentissage ou en contrat pro, entreprises qui recrutent et formations du CAP au master partout en France. Service public gratuit."
    )
  })
})
