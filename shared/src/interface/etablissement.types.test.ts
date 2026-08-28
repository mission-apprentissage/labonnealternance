import { describe, expect, it } from "vitest"

import { ZEtablissementCatalogueProcheWithDistance } from "./etablissement.types.js"

// Schéma de réponse de GET /api/etablissement/cfas-proches. Un z.string() strict sur
// entreprise_raison_sociale faisait échouer la sérialisation Fastify en production dès qu'un CFA
// remontait une raison sociale nulle (Sentry LBA-SERVER-5J7KF4ZZZTAKP, 500 sur le parcours de
// création d'offre).
describe("ZEtablissementCatalogueProcheWithDistance", () => {
  const etablissement = {
    _id: "5e8df8e720ff3b2161269f7a",
    siret: "13002526500013",
    numero_voie: "12",
    type_voie: "RUE",
    nom_voie: "DE LA PAIX",
    code_postal: "75002",
    nom_departement: "Paris",
    localite: "PARIS",
    entreprise_raison_sociale: "CFA DE LA PAIX",
    geo_coordonnees: "48.868,2.331",
    distance_en_km: 3.2,
  }

  it("accepte une raison sociale renseignée", () => {
    expect(ZEtablissementCatalogueProcheWithDistance.parse(etablissement).entreprise_raison_sociale).toBe("CFA DE LA PAIX")
  })

  it("accepte une raison sociale nulle", () => {
    expect(ZEtablissementCatalogueProcheWithDistance.parse({ ...etablissement, entreprise_raison_sociale: null }).entreprise_raison_sociale).toBeNull()
  })

  it("refuse une raison sociale absente", () => {
    const { entreprise_raison_sociale: _absent, ...sansRaisonSociale } = etablissement
    expect(ZEtablissementCatalogueProcheWithDistance.safeParse(sansRaisonSociale).success).toBe(false)
  })

  it("refuse une raison sociale d'un autre type", () => {
    expect(ZEtablissementCatalogueProcheWithDistance.safeParse({ ...etablissement, entreprise_raison_sociale: 42 }).success).toBe(false)
  })
})
