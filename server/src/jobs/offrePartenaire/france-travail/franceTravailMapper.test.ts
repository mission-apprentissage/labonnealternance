import { ObjectId } from "bson"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { exactractFTContractDuration, franceTravailJobsToJobsPartners } from "./franceTravailMapper"

const now = new Date("2025-04-01T10:00:00.000Z")

const baseJob = {
  _id: new ObjectId(),
  createdAt: new Date("2025-03-15T10:00:00.000Z"),
  updatedAt: new Date("2025-03-15T10:00:00.000Z"),
  id: "FT-001",
  intitule: "Développeur web H/F",
  description: "Développement d'applications web en alternance.",
  dateCreation: "2025-03-15T10:00:00.000Z",
  romeCode: "M1805",
  entreprise: {
    nom: "Acme Corp",
    siret: "12345678900010",
    url: "https://acme.fr",
    description: "Entreprise de développement logiciel",
  },
  typeContrat: "E2",
  typeContratLibelle: "Contrat apprentissage 12 Mois",
  natureContrat: "Contrat d'apprentissage",
  experienceExige: "D",
  salaire: {},
  alternance: true,
  origineOffre: {
    origine: "1",
    urlOrigine: "https://francetravail.fr/offre/FT-001",
  },
  lieuTravail: {
    libelle: "75056 - Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    codePostal: "75056",
    commune: "Paris",
  },
}

describe("franceTravailJobsToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should map a standard job with codePostal and coordinates", () => {
    expect(franceTravailJobsToJobsPartners(baseJob)).toMatchObject({
      partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
      partner_job_id: "FT-001",
      offer_title: "Développeur web H/F",
      offer_rome_codes: ["M1805"],
      offer_creation: new Date("2025-03-15T10:00:00.000Z"),
      offer_expiration: new Date("2025-05-15T10:00:00.000Z"),
      offer_opening_count: 1,
      offer_multicast: true,
      contract_type: ["Apprentissage"],
      contract_duration: 12,
      workplace_name: "Acme Corp",
      workplace_siret: "12345678900010",
      workplace_website: "https://acme.fr",
      workplace_address_label: "75056 Paris",
      workplace_geopoint: { type: "Point", coordinates: [2.3522, 48.8566] },
      apply_url: "https://francetravail.fr/offre/FT-001",
      business_error: null,
    })
  })

  it("should fall back to department chef-lieu when codePostal is absent and libelle is a department code", () => {
    const job = {
      ...baseJob,
      lieuTravail: {
        libelle: "15 - Cantal",
      },
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      workplace_address_label: "15000 AURILLAC",
      workplace_geopoint: { type: "Point", coordinates: [2.4419, 44.9258] },
      business_error: null,
    })
  })

  it("should fall back to department chef-lieu for Corse (2A)", () => {
    const job = {
      ...baseJob,
      lieuTravail: {
        libelle: "2A - Corse-du-Sud",
      },
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      workplace_address_label: "20000 AJACCIO",
      workplace_geopoint: { type: "Point", coordinates: [8.7386, 41.9192] },
      business_error: null,
    })
  })

  it("should fall back to department chef-lieu for DOM-TOM (974)", () => {
    const job = {
      ...baseJob,
      lieuTravail: {
        libelle: "974 - La Réunion",
      },
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      workplace_address_label: "97400 SAINT-DENIS",
      workplace_geopoint: { type: "Point", coordinates: [55.4504, -20.8823] },
      business_error: null,
    })
  })

  it("should set GEOLOCATION_NOT_FOUND when address cannot be resolved", () => {
    const job = {
      ...baseJob,
      lieuTravail: {
        libelle: "France entière",
      },
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      workplace_address_label: null,
      workplace_geopoint: null,
      business_error: JOB_PARTNER_BUSINESS_ERROR.GEOLOCATION_NOT_FOUND,
    })
  })

  it("should map contract type to PROFESSIONNALISATION", () => {
    const job = {
      ...baseJob,
      natureContrat: "Cont. professionnalisation",
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      contract_type: ["Professionnalisation"],
    })
  })

  it("should use raw coordinates over department fallback when both are available", () => {
    const job = {
      ...baseJob,
      lieuTravail: {
        libelle: "15 - Cantal",
        latitude: 44.5,
        longitude: 2.1,
        codePostal: "15100",
      },
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      workplace_address_label: "15100 Cantal",
      workplace_geopoint: { type: "Point", coordinates: [2.1, 44.5] },
    })
  })

  it("should map formations diploma correctly", () => {
    const job = {
      ...baseJob,
      formations: [{ niveauLibelle: "Bac ou équivalent" }],
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      offer_target_diploma: { european: "4", label: "Bac, Bac Pro, BP (Bac)" },
    })
  })

  it("should map skills from competences", () => {
    const job = {
      ...baseJob,
      competences: [
        { libelle: "JavaScript", exigence: "E" },
        { libelle: "TypeScript", exigence: "S" },
      ],
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      offer_to_be_acquired_skills: ["JavaScript", "TypeScript"],
    })
  })

  it("should use nombrePostes when provided", () => {
    const job = { ...baseJob, nombrePostes: 3 }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      offer_opening_count: 3,
    })
  })

  it("should prefer urlPostulation over origineOffre urls", () => {
    const job = {
      ...baseJob,
      contact: { urlPostulation: "https://postuler.fr/123" },
      origineOffre: {
        origine: "1",
        urlOrigine: "https://francetravail.fr/offre/FT-001",
        partenaires: [{ nom: "P", url: "https://partenaire.fr/123", logo: "" }],
      },
    }

    expect(franceTravailJobsToJobsPartners(job)).toMatchObject({
      apply_url: "https://postuler.fr/123",
    })
  })
})

describe("exactractFTContractDuration", () => {
  it.each([
    ["Contrat apprentissage 12 Mois", 12],
    ["Contrat apprentissage 24 Mois", 24],
    ["Contrat apprentissage 6 Mois", 6],
    ["Contrat apprentissage 36 Mois", 36],
    ["Contrat apprentissage", null],
    ["", null],
  ])("should extract duration from '%s'", (input, expected) => {
    expect(exactractFTContractDuration(input)).toBe(expected)
  })
})
