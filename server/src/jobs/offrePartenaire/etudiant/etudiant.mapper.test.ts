import omit from "lodash-es/omit"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { generateJobEtudiantJobFixture } from "@/common/apis/etudiant/etudiant.client.fixture"
import { ETUDIANT_ELIGIBLE_CONTRACT_FR, etudiantJobToJobsPartners, REMOTE_FR_MAP } from "./etudiant.mapper"

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
    expect(omit(etudiantJobToJobsPartners(baseJob), ["_id"])).toMatchSnapshot()
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
