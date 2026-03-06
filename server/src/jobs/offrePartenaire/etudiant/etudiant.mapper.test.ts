import { ObjectId } from "bson"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { etudiantJobToJobsPartners, ETUDIANT_ELIGIBLE_CONTRACT_FR, REMOTE_FR_MAP } from "./etudiant.mapper"
import { generateJobEtudiantJobFixture } from "@/common/apis/etudiant/etudiant.client.fixture"

const now = new Date("2024-07-21T04:49:06.000+02:00")

const baseJob = generateJobEtudiantJobFixture({
  public_id: "job-abc-123",
  name: "Développeur web en alternance",
  publishedAt: "2024-01-01T10:00:00+00:00",
  contract: { public_id: "work_study", translation: { fr: ETUDIANT_ELIGIBLE_CONTRACT_FR, en: "Apprenticeship / Professionalisation" } },
  description: {
    company_desc: "<p>Description entreprise de plus de 30 caractères</p>",
    job_desc: "<p>Description détaillée du poste en alternance sur 30+ caractères ici</p>",
    profile_desc: "<p>Profil recherché</p>",
    benefit_desc: "<p>Avantages</p>",
    process_desc: "<p>Processus</p>",
  },
})

describe("etudiantJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("maps a job to a computed job partner", () => {
    expect(etudiantJobToJobsPartners(baseJob)).toEqual({
      _id: expect.any(ObjectId),
      apply_phone: null,
      apply_url: "https://example.com/apply/123",
      business_error: null,
      contract_duration: null,
      contract_is_disabled_elligible: false,
      contract_remote: null,
      contract_start: null,
      contract_type: ["Apprentissage", "Professionnalisation"],
      created_at: now,
      errors: [],
      jobs_in_success: [],
      offer_access_conditions: [],
      offer_creation: new Date("2024-01-01T09:00:00.000Z"),
      offer_description: "Description détaillée du poste en alternance sur 30+ caractères ici",
      offer_desired_skills: ["Profil recherché"],
      offer_expiration: new Date("2024-03-01T09:00:00.000Z"),
      offer_multicast: false,
      offer_opening_count: 1,
      offer_origin: null,
      offer_rome_codes: null,
      offer_status: "Active",
      offer_status_history: [],
      offer_target_diploma: null,
      offer_title: "Développeur web en alternance",
      offer_to_be_acquired_knowledge: [],
      offer_to_be_acquired_skills: [],
      partner_job_id: "job-abc-123",
      partner_label: JOBPARTNERS_LABEL.JOB_ETUDIANT,
      updated_at: now,
      validated: false,
      workplace_address_city: "Paris",
      workplace_address_label: "1 Rue de la Paix Paris Paris Île-de-France France",
      workplace_address_street_label: "Rue de la Paix",
      workplace_address_zipcode: null,
      workplace_brand: null,
      workplace_description: "Description entreprise de plus de 30 caractères\nAvantages\nProcessus",
      workplace_geopoint: null,
      workplace_idcc: null,
      workplace_legal_name: "Entreprise Test",
      workplace_naf_code: null,
      workplace_naf_label: null,
      workplace_name: "Entreprise Test",
      workplace_opco: null,
      workplace_siret: null,
      workplace_size: null,
      workplace_website: null,
    })
  })

  it("sets business_error when offer_title is shorter than 3 characters", () => {
    const result = etudiantJobToJobsPartners(generateJobEtudiantJobFixture({ name: "AB" }))
    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("sets business_error when job description is shorter than 30 characters", () => {
    const result = etudiantJobToJobsPartners(
      generateJobEtudiantJobFixture({ description: { company_desc: "", job_desc: "<p>Court</p>", profile_desc: "", benefit_desc: "", process_desc: "" } })
    )
    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it.each(Object.entries(REMOTE_FR_MAP))('maps remote "%s" to "%s"', (frLabel, expectedRemote) => {
    const result = etudiantJobToJobsPartners(generateJobEtudiantJobFixture({ remote: { public_id: "any", translation: { fr: frLabel, en: "any" } } }))
    expect(result.contract_remote).toBe(expectedRemote)
  })

  it("sets contract_remote to null when remote is null", () => {
    const result = etudiantJobToJobsPartners(generateJobEtudiantJobFixture({ remote: null }))
    expect(result.contract_remote).toBeNull()
  })

  it("sets contract_remote to null when remote translation is unknown", () => {
    const result = etudiantJobToJobsPartners(generateJobEtudiantJobFixture({ remote: { public_id: "unknown", translation: { fr: "Valeur inconnue", en: "Unknown" } } }))
    expect(result.contract_remote).toBeNull()
  })

  it("strips HTML from descriptions", () => {
    const result = etudiantJobToJobsPartners(
      generateJobEtudiantJobFixture({
        description: {
          company_desc: "<p>Description <strong>entreprise</strong></p>",
          job_desc: "<p>Description <em>poste</em> de plus de trente caractères ici</p>",
          profile_desc: "",
          benefit_desc: "",
          process_desc: "",
        },
      })
    )
    expect(result.offer_description).toBe("Description poste de plus de trente caractères ici")
    expect(result.workplace_description).toBe("Description entreprise")
  })

  it("concatenates company_desc, benefit_desc and process_desc with newlines for workplace_description", () => {
    const result = etudiantJobToJobsPartners(
      generateJobEtudiantJobFixture({
        description: {
          company_desc: "<p>Présentation de l'entreprise</p>",
          job_desc: "<p>Description du poste suffisamment longue pour dépasser trente caractères</p>",
          profile_desc: "",
          benefit_desc: "<p>Tickets restaurant</p>",
          process_desc: "<p>Entretien RH puis technique</p>",
        },
      })
    )
    expect(result.workplace_description).toBe("Présentation de l'entreprise\nTickets restaurant\nEntretien RH puis technique")
  })

  it("sets workplace_description to null when all three fields are empty", () => {
    const result = etudiantJobToJobsPartners(
      generateJobEtudiantJobFixture({
        description: {
          company_desc: "",
          job_desc: "<p>Description du poste suffisamment longue pour passer la validation ici</p>",
          profile_desc: "",
          benefit_desc: "",
          process_desc: "",
        },
      })
    )
    expect(result.workplace_description).toBeNull()
  })
})
