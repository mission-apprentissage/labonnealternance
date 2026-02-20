import fs from "node:fs"

import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { IApecJob } from "./apecMapper"
import { apecJobToJobsPartners } from "./apecMapper"
import { importApecRaw, importApecToComputed } from "./importApec"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("importApec", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_apec").deleteMany({})
    }
  })

  it("should import APEC data into raw_apec then computed_jobs_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/apec/importApec.test.input.xml")
    await importApecRaw(fileStream)
    expect.soft(await getDbCollection("raw_apec").countDocuments({})).toBe(5)

    await importApecToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.APEC }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(5)
    expect.soft(jobs).toMatchSnapshot()
  })
})

describe("apecJobToJobsPartners", () => {
  const baseJob: IApecJob = {
    Reference_apec: "177812004W",
    Date_parution: new Date("2025-12-17T17:50:32"),
    Intitule: "SDR (Sales Development Representative) F/H",
    Nombre_postes: "1",
    Contrat: {
      Type_contrat: "CDI - Alternance - Contrat d'apprentissage",
      Duree_contrat: "24",
    },
    Statut: "Cadre du secteur privé",
    Niveau_experience: "Tous niveaux d'expérience acceptés",
    Salaire_affiche: "18 - 22 k€ brut annuel",
    Fonction: {
      JOB_fonction: "01C",
      Libelle_fonction: "Commercial",
    },
    Secteur_activite: {
      NAF_secteur: "6202A",
      Libelle_secteur: "CONSEIL EN SYSTÈMES ET LOGICIELS INFORMATIQUES",
    },
    Texte_offre: "<p>Description détaillée de l'offre d'alternance pour un SDR.</p>",
    Nom_entreprise: "AROLLA",
    Logo_entreprise: "/media_entreprise/486264/logo.jpg",
    URL: "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/177812004W",
    Zone_deplacement: "Pas de déplacement",
    Lieu: {
      COG_lieu: "75101",
      Libelle_lieu: "PARIS 01",
    },
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    return () => vi.useRealTimers()
  })

  it("should map a CDI alternance job to Apprentissage contract type", () => {
    const result = apecJobToJobsPartners(baseJob)
    expect(result.contract_type).toEqual(["Apprentissage"])
    expect(result.business_error).toBeNull()
  })

  it("should map a non-CDI job to Professionnalisation contract type", () => {
    const job: IApecJob = {
      ...baseJob,
      Contrat: { Type_contrat: "CDD - Alternance - Contrat de professionnalisation", Duree_contrat: "12" },
    }
    const result = apecJobToJobsPartners(job)
    expect(result.contract_type).toEqual(["Professionnalisation"])
    expect(result.business_error).toBeNull()
  })

  it("should set business_error to STAGE when contract duration < 6 months", () => {
    const job: IApecJob = {
      ...baseJob,
      Contrat: { Type_contrat: "CDD - Alternance - Contrat d'apprentissage", Duree_contrat: "1" },
    }
    const result = apecJobToJobsPartners(job)
    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.STAGE)
  })

  it("should set business_error to WRONG_DATA when description is too short", () => {
    const job: IApecJob = { ...baseJob, Texte_offre: "Trop court." }
    const result = apecJobToJobsPartners(job)
    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("should set business_error to WRONG_DATA when title is too short", () => {
    const job: IApecJob = { ...baseJob, Intitule: "AB" }
    const result = apecJobToJobsPartners(job)
    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("should map all fields correctly", () => {
    const result = apecJobToJobsPartners(baseJob)
    expect(result).toMatchObject({
      partner_job_id: "177812004W",
      partner_label: JOBPARTNERS_LABEL.APEC,
      offer_title: "SDR (Sales Development Representative) F/H",
      offer_description: "<p>Description détaillée de l'offre d'alternance pour un SDR.</p>",
      offer_opening_count: 1,
      offer_multicast: false,
      workplace_name: "AROLLA",
      workplace_address_label: "PARIS 01 75101",
      workplace_address_zipcode: "75101",
      workplace_address_city: "PARIS 01",
      workplace_naf_code: "6202A",
      workplace_naf_label: "CONSEIL EN SYSTÈMES ET LOGICIELS INFORMATIQUES",
      apply_url: "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/177812004W",
      business_error: null,
    })
  })
})
