import { JOBPARTNERS_LABEL, NIVEAUX_DIPLOMES_EUROPEENS } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IEdfJob } from "./edfMapper"
import { edfJobToJobsPartners } from "./edfMapper"

const now = new Date("2026-02-01T00:00:00.000Z")

const baseJob: IEdfJob = {
  id: "100001",
  reference: "2026-100001",
  entityDescription: "Acteur majeur du secteur de l'énergie.",
  creationDate: "20260101",
  modificationDate: "20260201",
  entity: { _: "ENE-EXPLOIT CC", $: { id: "100001", clientcode: "ENE-EXPLOIT" } },
  entityAdress: {
    adress: null,
    postalcode: null,
    city: null,
    country: "France",
  },
  beginningDate: null,
  directUrl: "https://www.edf.fr/edf-recrute/offre/detail/2026-100001?idOrigine=502",
  jobDescription: {
    description: "Au sein du service Informatique, vous développerez des applications web modernes.",
    missionDescription: "Développer des applications web et mobiles.",
    missionDescriptionFormatted: "<p><strong>Missions :</strong></p><ul><li>Développer des applications web et mobiles.</li></ul>",
    applicantProfile: "Niveau de diplôme préparé : Bac+3",
    applicantProfileFormatted: "<p><strong>Niveau de diplôme préparé :</strong> Bac+3</p>",
    title: "Alternance - Développeur Web F/H",
    salaryRange: { _: "Enedis", $: { id: "33360", clientcode: "_TS_SOCIETE_ENEDIS" } },
    contract: { _: "Alternance", $: { id: "34948", clientcode: "CONTRAT_ALTERNANCE" } },
    contractLength: null,
    location: {
      jobLocation: "Lyon",
      regions: { region: { _: "Auvergne-Rhône-Alpes", $: { id: "198", clientcode: "_TS_CO_Region_AuvergneRhoneAlpes" } } },
      departements: { departement: { _: "Rhône (69)", $: { id: "336", clientcode: "_TS_CO_Department_Rhne69" } } },
    },
    customFields: {
      datetime1: { _: "01/09/2026", $: { label: "Date souhaitée de début de mission" } },
      LongText1: { _: "Prime d'intéressement", $: { label: "Rémunération et avantages" } },
    },
  },
  applicantCriteria: {
    diploma: { $: { id: "123", clientcode: "BAC3" } },
    customFields: {
      list1: { _: "De 820€ à 1 823€ par mois", $: { label: "Rémunération" } },
    },
  },
}

describe("edfJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)
    return () => vi.useRealTimers()
  })

  it("should map an alternance job correctly", () => {
    const result = edfJobToJobsPartners(baseJob)
    expect(result).not.toBeNull()
    expect(result).toMatchObject({
      partner_label: JOBPARTNERS_LABEL.EDF,
      partner_job_id: "100001",
      offer_title: "Alternance - Développeur Web F/H",
      contract_type: ["Apprentissage", "Professionnalisation"],
      workplace_name: "Enedis",
      workplace_address_city: "Lyon",
      workplace_description: "Acteur majeur du secteur de l'énergie.",
      apply_url: "https://www.edf.fr/edf-recrute/offre/detail/2026-100001?idOrigine=502",
      offer_multicast: true,
      business_error: null,
    })
  })

  it("should return null for non-alternance contracts (VIE, CDI, etc.)", () => {
    const job: IEdfJob = {
      ...baseJob,
      jobDescription: {
        ...baseJob.jobDescription,
        contract: { _: "VIE", $: { id: "34950", clientcode: "CONTRAT_VIE" } },
        title: "VIE - Ingénieur F/H",
      },
    }
    const result = edfJobToJobsPartners(job)
    expect(result).toBeNull()
  })

  it("should return null for CDI contracts", () => {
    const job: IEdfJob = {
      ...baseJob,
      jobDescription: {
        ...baseJob.jobDescription,
        contract: { _: "CDI", $: { id: "34951", clientcode: "Permanent" } },
        title: "Technicien CDI F/H",
      },
    }
    const result = edfJobToJobsPartners(job)
    expect(result).toBeNull()
  })

  it("should set business_error to WRONG_DATA when title is too short", () => {
    const job: IEdfJob = { ...baseJob, jobDescription: { ...baseJob.jobDescription, title: "AB" } }
    const result = edfJobToJobsPartners(job)
    expect(result?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("should set offer_creation from creationDate (YYYYMMDD)", () => {
    const result = edfJobToJobsPartners(baseJob)
    expect(result?.offer_creation).toEqual(new Date("2025-12-31T23:00:00.000Z")) // 20260101 in Europe/Paris = UTC-1h in winter
  })

  it("should set contract_start from customFields.datetime1 (DD/MM/YYYY)", () => {
    const result = edfJobToJobsPartners(baseJob)
    expect(result?.contract_start).toEqual(new Date("2026-08-31T22:00:00.000Z")) // 01/09/2026 in Europe/Paris = UTC-2h in summer
  })

  it("should use missionDescriptionFormatted as offer_description when available", () => {
    const result = edfJobToJobsPartners(baseJob)
    expect(result?.offer_description).toBe("<p><strong>Missions :</strong></p><ul><li>Développer des applications web et mobiles.</li></ul>")
  })

  it("should fall back to missionDescription when missionDescriptionFormatted is absent", () => {
    const job: IEdfJob = {
      ...baseJob,
      jobDescription: {
        ...baseJob.jobDescription,
        missionDescriptionFormatted: null,
        missionDescription: "Développer des applications web et mobiles pendant 2 ans.",
      },
    }
    const result = edfJobToJobsPartners(job)
    expect(result?.offer_description).toBe("Développer des applications web et mobiles pendant 2 ans.")
  })

  it("should fall back to entity text when salaryRange is absent", () => {
    const job: IEdfJob = {
      ...baseJob,
      jobDescription: { ...baseJob.jobDescription, salaryRange: null },
    }
    const result = edfJobToJobsPartners(job)
    expect(result?.workplace_name).toBe("ENE-EXPLOIT CC")
  })

  it("should use jobLocation as workplace_address_city when entityAdress.city is empty", () => {
    const result = edfJobToJobsPartners(baseJob)
    expect(result?.workplace_address_city).toBe("Lyon")
  })

  describe("diploma level mapping", () => {
    it.each([
      ["BAC3", "6", NIVEAUX_DIPLOMES_EUROPEENS[3].label],
      ["BAC4_BAC5", "7", NIVEAUX_DIPLOMES_EUROPEENS[4].label],
      ["BAC2", "5", NIVEAUX_DIPLOMES_EUROPEENS[2].label],
      ["BAC2_BAC3", "5", NIVEAUX_DIPLOMES_EUROPEENS[2].label],
      ["CAP_BEP_BAC", "4", NIVEAUX_DIPLOMES_EUROPEENS[1].label],
      ["SANS_DIPLOME", "3", NIVEAUX_DIPLOMES_EUROPEENS[0].label],
    ])("should map diploma clientcode %s to european level %s", (clientcode, expectedLevel, expectedLabel) => {
      const job: IEdfJob = {
        ...baseJob,
        applicantCriteria: { ...baseJob.applicantCriteria, diploma: { $: { id: "123", clientcode } } },
      }
      const result = edfJobToJobsPartners(job)
      expect(result?.offer_target_diploma).toEqual({ european: expectedLevel, label: expectedLabel })
    })

    it("should return null for unknown diploma clientcode", () => {
      const job: IEdfJob = {
        ...baseJob,
        applicantCriteria: { ...baseJob.applicantCriteria, diploma: { $: { id: "999", clientcode: "UNKNOWN_CODE" } } },
      }
      const result = edfJobToJobsPartners(job)
      expect(result?.offer_target_diploma).toBeNull()
    })

    it("should return null when diploma is absent", () => {
      const job: IEdfJob = { ...baseJob, applicantCriteria: { ...baseJob.applicantCriteria, diploma: null } }
      const result = edfJobToJobsPartners(job)
      expect(result?.offer_target_diploma).toBeNull()
    })
  })
})
