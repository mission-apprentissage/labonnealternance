import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import omit from "lodash-es/omit"
import { emploiInclusionJobToJobsPartners, isEligiblePoste } from "./emploi-inclusion.mapper"
import { generateEmploiInclusionJobFixture } from "@/common/apis/emploiInclusion/emploi-inclusion.client.fixture"

const now = new Date("2024-07-21T04:49:06.000+02:00")

const basePoste = {
  id: 42,
  rome: "M1805",
  cree_le: "2024-01-01T10:00:00+00:00",
  mis_a_jour_le: "2024-06-01T10:00:00+00:00",
  recrutement_ouvert: "True",
  description: "Description détaillée du poste en alternance sur 30+ caractères",
  appellation_modifiee: "Développeur web en alternance",
  type_contrat: "Contrat d'apprentissage",
  nombre_postes_ouverts: 2,
  lieu: {
    nom: "Paris",
    departement: "75",
    code_postaux: ["75001"],
    code_insee: "75101",
  },
  profil_recherche: "Profil recherché",
}

const baseJob = generateEmploiInclusionJobFixture({
  postes: [basePoste],
})

describe("isEligiblePoste", () => {
  it("returns true for Contrat d'apprentissage regardless of recrutement_ouvert", () => {
    expect(isEligiblePoste({ ...basePoste, type_contrat: "Contrat d'apprentissage", recrutement_ouvert: "False" })).toBe(true)
  })

  it("returns true for Contrat de professionalisation when recrutement_ouvert is True", () => {
    expect(isEligiblePoste({ ...basePoste, type_contrat: "Contrat de professionalisation", recrutement_ouvert: "True" })).toBe(true)
  })

  it("returns false for Contrat de professionalisation when recrutement_ouvert is not True", () => {
    expect(isEligiblePoste({ ...basePoste, type_contrat: "Contrat de professionalisation", recrutement_ouvert: "False" })).toBe(false)
  })

  it("returns false for other contract types", () => {
    expect(isEligiblePoste({ ...basePoste, type_contrat: "Contrat à durée indéterminée" })).toBe(false)
  })
})

describe("emploiInclusionJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("maps a job and poste to a computed job partner", () => {
    expect(omit(emploiInclusionJobToJobsPartners(baseJob, basePoste), ["_id"])).toMatchSnapshot()
  })

  it("sets business_error when offer_title is shorter than 3 characters", () => {
    const result = emploiInclusionJobToJobsPartners(baseJob, { ...basePoste, appellation_modifiee: "AB" })
    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("sets business_error when description is shorter than 30 characters", () => {
    const result = emploiInclusionJobToJobsPartners(baseJob, { ...basePoste, description: "Court" })
    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("sets workplace_address_label to null when lieu is null", () => {
    const result = emploiInclusionJobToJobsPartners(baseJob, { ...basePoste, lieu: null })
    expect(result.workplace_address_label).toBeNull()
  })

  it("falls back to raison_sociale when enseigne is empty", () => {
    const result = emploiInclusionJobToJobsPartners({ ...baseJob, enseigne: "" }, basePoste)
    expect(result.workplace_name).toBe("Entreprise Test")
  })
})
