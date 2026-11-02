import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as mongodbUtils from "@/common/utils/mongodb-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { buildPartnerPublicationReport, formatPartnerPublicationReport, IMPORTED_FLUX_PARTNER_LABELS } from "./partner-publication-report"

const erreurValidation = [{ source: COMPUTED_ERROR_SOURCE.VALIDATION, error: "champ manquant" }]

describe("buildPartnerPublicationReport", () => {
  useMongo()

  // Vidées avant chaque test aussi : la mesure porte sur des collections entières, que d'autres fichiers de test peuvent laisser remplies.
  const viderCollections = async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  }

  beforeEach(async () => {
    await viderCollections()
    return async () => {
      vi.restoreAllMocks()
      await viderCollections()
    }
  })

  it("compte par partenaire flux les offres reçues, validées, bloquées par motif, en erreur de validation et actives", async () => {
    const hellowork = { partner_label: JOBPARTNERS_LABEL.HELLOWORK }
    await createComputedJobPartner({ ...hellowork, partner_job_id: "hw-1", validated: true })
    await createComputedJobPartner({ ...hellowork, partner_job_id: "hw-2", validated: true })
    await createComputedJobPartner({ ...hellowork, partner_job_id: "hw-3", validated: false, errors: erreurValidation })
    await createComputedJobPartner({ ...hellowork, partner_job_id: "hw-4", validated: false })
    await createComputedJobPartner({ ...hellowork, partner_job_id: "hw-5", business_error: JOB_PARTNER_BUSINESS_ERROR.DUPLICATE })
    await createComputedJobPartner({ ...hellowork, partner_job_id: "hw-6", business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, errors: erreurValidation })
    await createJobPartner({ ...hellowork, partner_job_id: "hw-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ ...hellowork, partner_job_id: "hw-2", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ ...hellowork, partner_job_id: "hw-ancienne", offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    // Partenaire API : hors périmètre flux.
    await createComputedJobPartner({ partner_label: "Mission Apprentissage", partner_job_id: "api-1", validated: false })

    const lines = await buildPartnerPublicationReport([])

    expect(lines).toEqual([
      "",
      "Taux de publication par partenaire flux :",
      "• Hellowork : 6 reçues, 2 validées (50 % hors business_error), 2 en business_error (CFA 1, DUPLICATE 1), 1 en erreur de validation, 1 sans verdict de validation, 2 actives",
    ])
  })

  it("signale un partenaire à 0 publication, un partenaire sous le seuil et un partenaire sans offre reçue, en tête de section", async () => {
    // Cas mesuré au 01/09 : PASS à 100 % d'échec de validation.
    for (const partner_job_id of ["pass-1", "pass-2"]) {
      await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.PASS, partner_job_id, validated: false, errors: erreurValidation })
    }
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.APEC, partner_job_id: "apec-1", validated: true })
    for (const partner_job_id of ["apec-2", "apec-3", "apec-4"]) {
      await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.APEC, partner_job_id, validated: false, errors: erreurValidation })
    }
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.APEC, partner_job_id: "apec-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", validated: true })
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.JOBTEASER, partner_job_id: "jt-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    const lines = await buildPartnerPublicationReport([])

    expect(lines[1]).toBe("Taux de publication par partenaire flux (3 à surveiller) :")
    expect(lines.slice(2).map((line) => line.split(" : ")[0])).toEqual(["• ALERTE APEC", "• ALERTE Jobteaser", "• ALERTE PASS", "• Hellowork"])
    expect(lines.find((line) => line.startsWith("• ALERTE PASS"))).toMatch(/— 0 offre publiée$/)
    expect(lines.find((line) => line.startsWith("• ALERTE APEC"))).toMatch(/1 validées \(25 % hors business_error\).*— taux de publication sous 50 %$/)
    expect(lines.find((line) => line.startsWith("• ALERTE Jobteaser"))).toMatch(/— aucune offre reçue, 1 encore actives$/)
  })

  it("ne signale pas un partenaire dont toutes les offres éligibles sont publiées malgré des blocages métier", async () => {
    // Near-miss : les business_error sont des exclusions voulues, pas un échec de publication.
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", validated: true })
    for (const partner_job_id of ["hw-2", "hw-3", "hw-4"]) {
      await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA })
    }
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    const lines = await buildPartnerPublicationReport([])

    expect(lines[1]).toBe("Taux de publication par partenaire flux :")
    expect(lines[2]).toMatch(/^• Hellowork : 4 reçues, 1 validées \(100 % hors business_error\)/)
  })

  it("signale l'échec de la mesure dans le bilan au lieu de le faire échouer", async () => {
    vi.spyOn(mongodbUtils, "getDbCollection").mockImplementationOnce(() => {
      throw new Error("mongo indisponible")
    })

    const lines = await buildPartnerPublicationReport()

    expect(lines).toEqual(["", "• ALERTE taux de publication par partenaire indisponible : mongo indisponible"])
  })

  it("signale un partenaire à import actif qui n'a plus aucun document, ni reçu ni actif", async () => {
    // Flux tombé ou catalogue entièrement annulé : sans liste des partenaires attendus, il disparaîtrait du bilan.
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", validated: true })
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    const lines = await buildPartnerPublicationReport()

    expect(lines).toContain(
      "• ALERTE Kelio : 0 reçues, 0 validées (n/a hors business_error), 0 en business_error, 0 en erreur de validation, 0 actives — aucune offre reçue, 0 encore actives"
    )
  })

  it("ne signale pas un partenaire flux dont l'import est désactivé", async () => {
    const lines = await buildPartnerPublicationReport()

    for (const label of [JOBPARTNERS_LABEL.JOOBLE, JOBPARTNERS_LABEL.ENGAGEMENT_JEUNES, JOBPARTNERS_LABEL.MONSTER]) {
      expect.soft(lines.filter((line) => line.includes(` ${label} : `))).toEqual([])
    }
  })
})

describe("IMPORTED_FLUX_PARTNER_LABELS", () => {
  it("couvre exactement les imports déclarés dans les crons, et seulement des partenaires flux", async () => {
    const { importers } = await import("./jobs-partners.importer")
    const { jobPartnersByFlux } = await import("./process-job-partners")

    expect(Object.keys(IMPORTED_FLUX_PARTNER_LABELS).sort()).toEqual(
      Object.keys(importers)
        .filter((name) => name.startsWith("Import "))
        .sort()
    )
    for (const label of Object.values(IMPORTED_FLUX_PARTNER_LABELS).flat()) {
      expect.soft(jobPartnersByFlux).toContain(label)
    }
  })
})

describe("formatPartnerPublicationReport", () => {
  it("n'affiche pas de taux quand toutes les offres sont en business_error, et signale l'absence de publication", () => {
    const lines = formatPartnerPublicationReport([{ partner_label: "Kelio", received: 3, validated: 0, businessErrors: { CFA: 3 }, validationErrors: 0, active: 0 }])

    expect(lines[2]).toBe("• ALERTE Kelio : 3 reçues, 0 validées (n/a hors business_error), 3 en business_error (CFA 3), 0 en erreur de validation, 0 actives — 0 offre publiée")
  })
})
