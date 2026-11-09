import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as mongodbUtils from "@/common/utils/mongodb-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import type { PartnerPublicationStats } from "./partner-publication-report"
import { buildPartnerNightlyTable, formatPartnerNightlyTable, IMPORTED_FLUX_PARTNER_LABELS } from "./partner-publication-report"

const LEGEND =
  "B.err = business_error · E.val = erreur de validation · Taux = Valid. / (Reçues − B.err) · Chgts = runs où le flux a changé / runs sur 24 h · GF = garde-fou déclenché · « sans verdict » = ni validée, ni bloquée, ni en erreur (information)"

const erreurValidation = [{ source: COMPUTED_ERROR_SOURCE.VALIDATION, error: "champ manquant" }]

describe("buildPartnerNightlyTable", () => {
  const since = new Date("2026-11-08T05:30:00.000Z")
  useMongo()

  // Vidées avant chaque test aussi : la mesure porte sur des collections entières, que d'autres fichiers de test peuvent laisser remplies.
  const viderCollections = async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners_flux_signals").deleteMany({})
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

    const lines = await buildPartnerNightlyTable({ since }, [])

    expect(lines).toEqual([
      "",
      "Partenaires flux :",
      "```",
      "Partenaire Reçues B.err Valid. Taux E.val Actives Chgts Sautés Dernier Motif principal Alerte",
      "Hellowork       6     2      2  50%     1       2                      CFA 1 (+1)      1 sans verdict",
      "```",
      LEGEND,
    ])
  })

  it("lit la cadence du flux dans jobs_partners_flux_signals, sur la fenêtre demandée", async () => {
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.PASS, partner_job_id: "pass-1", validated: true })
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.PASS, partner_job_id: "pass-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    const check = (iso: string, changed: boolean, skipped: boolean) => ({ checked_at: new Date(iso), changed, skipped })
    await getDbCollection("jobs_partners_flux_signals").insertOne({
      _id: new ObjectId(),
      partner_label: JOBPARTNERS_LABEL.PASS,
      changed_at: new Date("2026-11-08T13:05:00.000Z"),
      checks: [
        // hors fenêtre
        check("2026-11-08T04:00:00.000Z", true, false),
        check("2026-11-08T09:00:00.000Z", false, true),
        check("2026-11-08T13:05:00.000Z", true, false),
      ],
    })

    const lines = await buildPartnerNightlyTable({ since }, [])

    expect(lines.find((line) => line.startsWith("PASS"))).toMatch(/^PASS +1 +0 +1 +100% +0 +1 +1\/2 +1 08\/11$/)
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

    const lines = await buildPartnerNightlyTable({ since }, [])

    expect(lines[1]).toBe("Partenaires flux (3 à vérifier) :")
    const tableRows = lines.slice(lines.indexOf("```") + 2, lines.lastIndexOf("```"))
    expect(tableRows.map((row) => row.replace(/ +\d.*$/, ""))).toEqual(["! APEC", "! Jobteaser", "! PASS", "Hellowork"])
    expect(tableRows[0]).toMatch(/^! APEC +4 +0 +1 +25% +3 +1 +taux < 50 %$/)
    expect(tableRows[1]).toMatch(/ aucune reçue, 1 actives$/)
    expect(tableRows[2]).toMatch(/ 0 publiée$/)
    expect(lines.slice(lines.lastIndexOf("```") + 1)).toEqual([LEGEND])
  })

  it("ne signale pas un partenaire dont toutes les offres éligibles sont publiées malgré des blocages métier", async () => {
    // Near-miss : les business_error sont des exclusions voulues, pas un échec de publication.
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", validated: true })
    for (const partner_job_id of ["hw-2", "hw-3", "hw-4"]) {
      await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA })
    }
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    const lines = await buildPartnerNightlyTable({ since }, [])

    expect(lines[1]).toBe("Partenaires flux :")
    expect(lines[4]).toMatch(/^Hellowork +4 +3 +1 +100% +0 +1 +CFA 3$/)
  })

  it("signale l'échec de la mesure dans le bilan au lieu de le faire échouer, sans perdre les garde-fous", async () => {
    vi.spyOn(mongodbUtils, "getDbCollection").mockImplementationOnce(() => {
      throw new Error("mongo indisponible")
    })

    const lines = await buildPartnerNightlyTable({ since, guardrailAlerts: new Map([[JOBPARTNERS_LABEL.HELLOWORK, ["GF absentes 45 %"]]]) })

    expect(lines).toEqual(["", "• ALERTE tableau par partenaire indisponible : mongo indisponible", "• Hellowork : GF absentes 45 %"])
  })

  it("signale un partenaire à import actif qui n'a plus aucun document, ni reçu ni actif", async () => {
    // Flux tombé ou catalogue entièrement annulé : sans liste des partenaires attendus, il disparaîtrait du bilan.
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", validated: true })
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "hw-1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    const lines = await buildPartnerNightlyTable({ since })

    expect(lines.find((line) => line.startsWith("! Kelio"))).toMatch(/^! Kelio +0 +0 +0 +n\/a +0 +0 +aucune reçue, 0 actives$/)
  })

  it("ne signale pas un partenaire flux dont l'import est désactivé", async () => {
    const lines = await buildPartnerNightlyTable({ since })

    for (const label of [JOBPARTNERS_LABEL.JOOBLE, JOBPARTNERS_LABEL.ENGAGEMENT_JEUNES, JOBPARTNERS_LABEL.MONSTER]) {
      expect.soft(lines.filter((line) => line.includes(label))).toEqual([])
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

describe("formatPartnerNightlyTable", () => {
  const stats = (partner_label: string, overrides: Partial<PartnerPublicationStats> = {}): PartnerPublicationStats => ({
    partner_label,
    received: 10,
    validated: 10,
    businessErrors: {},
    validationErrors: 0,
    active: 10,
    ...overrides,
  })
  const rowOf = (lines: string[], label: string) => lines.find((line) => line.replace(/^! /, "").startsWith(`${label} `))

  it("(faux positif) aucun suffixe quand un seul motif bloque", () => {
    const lines = formatPartnerNightlyTable([
      stats("EDF", { validated: 5, businessErrors: { FULL_TIME: 5 }, active: 5 }),
      stats("Hellowork", { validated: 4, businessErrors: { CFA: 3, DUPLICATE: 2, EXPIRED: 1 }, active: 4 }),
    ])

    expect(rowOf(lines, "EDF")).toMatch(/ FULL_TIME 5$/)
    expect(rowOf(lines, "Hellowork")).toMatch(/ CFA 3 \(\+2\)$/)
  })

  it("n'affiche pas de taux quand toutes les offres sont en business_error, et signale l'absence de publication", () => {
    const lines = formatPartnerNightlyTable([stats("Kelio", { received: 3, validated: 0, businessErrors: { CFA: 3 }, active: 0 })])

    expect(lines.slice(2)).toEqual([
      "```",
      "Partenaire Reçues B.err Valid. Taux E.val Actives Chgts Sautés Dernier Motif principal Alerte",
      "! Kelio         3     3      0  n/a     0       0                      CFA 3           0 publiée",
      "```",
      LEGEND,
    ])
  })

  it("réunit sur la ligne du partenaire la cadence du flux et les garde-fous, garde-fous en tête", () => {
    const lines = formatPartnerNightlyTable([stats("APEC"), stats("Hellowork"), stats("PASS", { active: 0 })], {
      guardrailAlerts: new Map([["Hellowork", ["GF absentes 7.9 %"]]]),
      cadence: new Map([
        ["Hellowork", { runs: 4, skipped: 2, changed: 1, changed_at: new Date("2026-11-08T23:00:00.000Z") }],
        ["APEC", { runs: 1, skipped: 1, changed: 0, changed_at: null }],
      ]),
    })

    expect(lines[1]).toBe("Partenaires flux (2 à vérifier) :")
    const tableRows = lines.slice(lines.indexOf("```") + 2, lines.lastIndexOf("```"))
    expect(tableRows.map((row) => row.replace(/ +\d.*$/, ""))).toEqual(["! Hellowork", "! PASS", "APEC"])
    // 23 h UTC le 08/11 = 09/11 à Paris
    expect(tableRows[0]).toMatch(/^! Hellowork +10 +0 +10 +100% +0 +10 +1\/4 +2 09\/11 +GF absentes 7.9 %$/)
    expect(tableRows[2]).toMatch(/^APEC +10 +0 +10 +100% +0 +10 +0\/1 +1 jamais$/)
    expect(lines.at(-1)).toBe('Après vérification d\'un « GF absentes » : yarn cli forceCancelRemovedJobsPartners --partnerLabel "<Partenaire>"')
  })

  it("ajoute une ligne pour un garde-fou hors des partenaires mesurés, mais pas pour un signal de cadence seul", () => {
    const lines = formatPartnerNightlyTable([stats("APEC")], {
      guardrailAlerts: new Map([["La Poste", ["GF import vide"]]]),
      cadence: new Map([["Jooble", { runs: 1, skipped: 0, changed: 1, changed_at: null }]]),
    })

    expect(rowOf(lines, "La Poste")).toMatch(/^! La Poste .* GF import vide, aucune reçue, 0 actives$/)
    expect(rowOf(lines, "Jooble")).toBeUndefined()
    // (faux positif) sans garde-fou d'annulation, pas de commande de forçage
    expect(lines.filter((line) => line.includes("forceCancelRemovedJobsPartners"))).toEqual([])
  })
})
