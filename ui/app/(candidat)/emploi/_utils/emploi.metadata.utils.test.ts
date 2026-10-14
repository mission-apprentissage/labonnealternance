import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { describe, expect, it } from "vitest"

import { buildEmploiMetaDescription } from "./emploi.metadata.utils"

describe("buildEmploiMetaDescription — meta description des fiches /emploi/*", () => {
  it("décrit une offre LBA avec le poste, l'entreprise et la ville", () => {
    expect(
      buildEmploiMetaDescription(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, {
        title: "Technicien / Technicienne support informatique",
        company: { name: "NUMERITEK" },
        place: { city: "ROSNY-SOUS-BOIS" },
      })
    ).toBe(
      "Technicien / Technicienne support informatique : offre d'alternance chez NUMERITEK à ROSNY-SOUS-BOIS. Postulez en ligne sur La bonne alternance, service public gratuit."
    )
  })

  it("utilise le même modèle pour une offre partenaire", () => {
    expect(
      buildEmploiMetaDescription(LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, {
        title: "Contrat d’apprentissage BTSA GPN 2026/2028 (H/F)",
        company: { name: "Guingamp-Paimpol Agglomération" },
        place: { city: "Plourivo" },
      })
    ).toBe(
      "Contrat d’apprentissage BTSA GPN 2026/2028 (H/F) : offre d'alternance chez Guingamp-Paimpol Agglomération à Plourivo. Postulez en ligne sur La bonne alternance, service public gratuit."
    )
  })

  it("omet l'entreprise quand elle est absente (offre anonymisée)", () => {
    expect(buildEmploiMetaDescription(LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, { title: "Boulanger", company: null, place: { city: "Lyon" } })).toBe(
      "Boulanger : offre d'alternance à Lyon. Postulez en ligne sur La bonne alternance, service public gratuit."
    )
  })

  it("omet la ville quand elle est absente", () => {
    expect(buildEmploiMetaDescription(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, { title: "Boulanger", company: { name: "Maison Durand" }, place: null })).toBe(
      "Boulanger : offre d'alternance chez Maison Durand. Postulez en ligne sur La bonne alternance, service public gratuit."
    )
  })

  it("reste lisible quand le poste, l'entreprise et la ville sont vides ou faits d'espaces", () => {
    expect(buildEmploiMetaDescription(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, { title: " ", company: { name: "" }, place: { city: "  " } })).toBe(
      "Offre d'alternance. Postulez en ligne sur La bonne alternance, service public gratuit."
    )
  })

  it("décrit une candidature spontanée avec l'enseigne, la ville et le secteur", () => {
    expect(
      buildEmploiMetaDescription(LBA_ITEM_TYPE.RECRUTEURS_LBA, {
        title: "RUN MARKET PARTENAIRE INTERMARCHE",
        company: { name: "RUN MARKET PARTENAIRE INTERMARCHE" },
        place: { city: "SAINT-DENIS" },
        nafs: [{ label: "Hypermarchés" }],
      })
    ).toBe(
      "Candidature spontanée en alternance chez RUN MARKET PARTENAIRE INTERMARCHE à SAINT-DENIS (Hypermarchés). Entreprise susceptible de recruter : postulez via La bonne alternance, service public gratuit."
    )
  })

  it("omet le secteur d'une candidature spontanée quand il est absent", () => {
    expect(buildEmploiMetaDescription(LBA_ITEM_TYPE.RECRUTEURS_LBA, { title: "Maison Durand", company: null, place: { city: "Lyon" }, nafs: [] })).toBe(
      "Candidature spontanée en alternance chez Maison Durand à Lyon. Entreprise susceptible de recruter : postulez via La bonne alternance, service public gratuit."
    )
  })

  it("ne renvoie pas de description pour un type non servi par la page (formation)", () => {
    expect(buildEmploiMetaDescription(LBA_ITEM_TYPE.FORMATION, { title: "BTS MCO", company: null, place: null })).toBeUndefined()
  })
})
