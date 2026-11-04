import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateComputedJobsPartnersFixture, generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import * as slackUtils from "@/common/utils/slack-utils"
import { cancelRemovedJobsPartners } from "./cancel-removed-jobs-partners"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"
import { acquirePartnerLock, PartnerLockUnavailableError } from "./partner-processing-lock"
import { cancelRemovedJobsPartnersFlux, forceCancelRemovedJobsPartners, jobPartnersByFlux } from "./process-job-partners"

useMongo()

describe("Canceling jobs_partners that have been removed from computed_jobs_partners", () => {
  beforeEach(async () => {
    // créations de plusieurs éléments existants dans jobs partners
    // création de plusieurs éléments dans computed jobs partners . certains avec validated true, d'autres false
    // certains éléments validated de computed sont déjà présents dans jobs partners
    // certains éléments dans jobs partners ne sont pas dans computed
    await createJobPartner({ partner_job_id: "existing_1", partner_label: "bidon", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_2", partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_3", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_4", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_5", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_6", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_7", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createJobPartner({ partner_job_id: "existing_8", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    await createComputedJobPartner({ partner_job_id: "computed_1", partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE, validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_2", partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE, validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_3", partner_label: JOBPARTNERS_LABEL.HELLOWORK, validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_4", partner_label: JOBPARTNERS_LABEL.HELLOWORK, validated: true })
    await createComputedJobPartner({ partner_job_id: "existing_5", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_6", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, validated: false })
    await createComputedJobPartner({
      partner_job_id: "existing_7",
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      business_error: JOB_PARTNER_BUSINESS_ERROR.EXPIRED,
      validated: false,
    })
    await createComputedJobPartner({
      partner_job_id: "existing_8",
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      business_error: JOB_PARTNER_BUSINESS_ERROR.EXPIRED,
      validated: false,
    })

    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("L'annulation dans jobs_partners fonctionne comme attendue : \n- les éléments de jobs_partners qui ne sont plus dans computed doivent être taggés Annulé\n- les éléments de jobs_partners qui sont également dans computed sont toujours présents\n-  aucun éléments de jobs_partners n'a été retiré de la collection", async () => {
    const filter = { partner_label: { $in: jobPartnersByFlux } }
    await cancelRemovedJobsPartners(filter, { removalGuard: true })

    const countCanceledJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
    })
    expect.soft(countCanceledJobsPartners).toEqual(5)

    // les éléments de jobs_partners qui ne sont pas des collections à vérifier sont intouchés
    const countNotCanceledJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      partner_job_id: { $in: ["existing_1"] },
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    })
    expect.soft(countNotCanceledJobsPartners).toEqual(1)

    const countRemainingActiveJobsPartners = await getDbCollection("jobs_partners").countDocuments({
      partner_job_id: { $in: ["existing_1", "existing_3", "existing_4"] },
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    })
    expect.soft(countRemainingActiveJobsPartners).toEqual(3)

    const countJobsPartners = await getDbCollection("jobs_partners").countDocuments({})
    expect.soft(countJobsPartners).toEqual(8)
  })
})

describe("Une offre dont le computed est en attente de classification n'est pas annulée", () => {
  beforeEach(() => {
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("CLASSIFICATION_PENDING est un état transitoire de traitement, pas un verdict métier", async () => {
    // Mesuré en prod le 01/09/2026 : tout le catalogue non whitelisté (Hellowork 5 178, France Travail
    // 5 531, Meteojob 1 729 offres cette nuit-là) était annulé à 00h35 parce que le batch Mistral
    // n'avait pas encore répondu, puis réactivé à son retour. Un autre business_error (CFA) reste un
    // motif d'annulation légitime.
    await createJobPartner({ partner_job_id: "pending_1", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({
      partner_job_id: "pending_1",
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING,
      validated: false,
    })
    await createJobPartner({ partner_job_id: "cfa_1", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "cfa_1", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, validated: false })

    await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    const pending = await getDbCollection("jobs_partners").findOne({ partner_job_id: "pending_1" })
    expect.soft(pending?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(pending?.offer_status_history).toHaveLength(0)
    const cfa = await getDbCollection("jobs_partners").findOne({ partner_job_id: "cfa_1" })
    expect.soft(cfa?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
  })
})

describe("Garde-fou d'annulation par partenaire", () => {
  const givenCatalog = async (partner_label: JOBPARTNERS_LABEL, { active, inFlux }: { active: number; inFlux: number }) => {
    const ids = Array.from({ length: active }, (_, i) => `${partner_label}_${i}`)
    await getDbCollection("jobs_partners").insertMany(
      ids.map((partner_job_id) => generateJobsPartnersOfferPrivate({ partner_job_id, partner_label, offer_status: JOB_STATUS_ENGLISH.ACTIVE }))
    )
    if (inFlux > 0) {
      await getDbCollection("computed_jobs_partners").insertMany(
        ids.slice(0, inFlux).map((partner_job_id) => generateComputedJobsPartnersFixture({ partner_job_id, partner_label, validated: true }))
      )
    }
    return ids
  }
  const countByStatus = (partner_label: JOBPARTNERS_LABEL, offer_status: JOB_STATUS_ENGLISH) => getDbCollection("jobs_partners").countDocuments({ partner_label, offer_status })

  beforeEach(() => {
    const notifySpy = vi.spyOn(slackUtils, "notifyToSlack").mockResolvedValue(undefined)
    return async () => {
      notifySpy.mockRestore()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners_processing_locks").deleteMany({})
    }
  })

  it("(faux positif) une rotation normale de 10 % annule exactement les offres retirées, sans blocage ni alerte", async () => {
    const ids = await givenCatalog(JOBPARTNERS_LABEL.JOBTEASER, { active: 200, inFlux: 180 })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([])
    expect.soft(slackUtils.notifyToSlack).not.toHaveBeenCalled()
    const cancelled = await getDbCollection("jobs_partners")
      .find({ partner_label: JOBPARTNERS_LABEL.JOBTEASER, offer_status: JOB_STATUS_ENGLISH.ANNULEE }, { projection: { partner_job_id: 1 } })
      .toArray()
    expect.soft(cancelled.map(({ partner_job_id }) => partner_job_id).sort()).toEqual(ids.slice(180).sort())
  })

  it("un gros catalogue stable est bloqué dès 6 % d'annulations (seuil 5 %)", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 188 })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, active: 200, removed: 12, rate: 12 / 200, maxRate: 0.05 }])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(200)
  })

  it("(faux positif) les mêmes 6 % d'annulations passent sur un partenaire au seuil par défaut", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.JOBTEASER, { active: 200, inFlux: 188 })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.JOBTEASER, JOB_STATUS_ENGLISH.ANNULEE)).toBe(12)
  })

  it("(faux positif) une offre présente dans le flux mais mal enrichie (validated: false, sans business_error) n'est pas annulée", async () => {
    await createJobPartner({ partner_job_id: "mal_enrichie", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "mal_enrichie", partner_label: JOBPARTNERS_LABEL.HELLOWORK, validated: false, business_error: null })

    await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    const offer = await getDbCollection("jobs_partners").findOne({ partner_job_id: "mal_enrichie" })
    expect.soft(offer?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(offer?.offer_status_history).toHaveLength(0)
  })

  it("(faux positif) un petit catalogue n'est pas bloqué en dessous du nombre minimal d'annulations", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.TOULOUSE_METROPOLE, { active: 4, inFlux: 1 })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.TOULOUSE_METROPOLE, JOB_STATUS_ENGLISH.ANNULEE)).toBe(3)
  })

  it("un flux tronqué de moitié n'annule aucune offre retirée du partenaire et déclenche une alerte, sans bloquer les autres partenaires", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 40, inFlux: 20 })
    await givenCatalog(JOBPARTNERS_LABEL.KELIO, { active: 100, inFlux: 90 })
    await createJobPartner({ partner_job_id: "expiree", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "expiree", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: JOB_PARTNER_BUSINESS_ERROR.EXPIRED })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, active: 41, removed: 20, rate: 20 / 41, maxRate: 0.05 }])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(40)
    // le verdict métier d'une offre encore présente dans le flux n'est pas concerné par le garde-fou
    expect.soft((await getDbCollection("jobs_partners").findOne({ partner_job_id: "expiree" }))?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.KELIO, JOB_STATUS_ENGLISH.ANNULEE)).toBe(10)
    expect.soft(slackUtils.notifyToSlack).toHaveBeenCalledTimes(1)
    expect
      .soft(vi.mocked(slackUtils.notifyToSlack).mock.calls[0]?.[0])
      .toMatchObject({ error: true, message: expect.stringContaining("[garde-fou] Hellowork : 20 offres actives sur 41") })
  })

  it("le sous-job des flux sort en erreur sur un blocage, après avoir traité les autres partenaires", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 40, inFlux: 0 })
    await givenCatalog(JOBPARTNERS_LABEL.KELIO, { active: 100, inFlux: 90 })

    await expect(cancelRemovedJobsPartnersFlux()).rejects.toThrow(JobPartnersGuardrailError)

    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(40)
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.KELIO, JOB_STATUS_ENGLISH.ANNULEE)).toBe(10)
    expect.soft(await getDbCollection("jobs_partners_processing_locks").countDocuments({})).toBe(0)
  })

  it("forceCancelRemovedJobsPartners annule après vérification les offres retirées d'un seul partenaire", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 40, inFlux: 20 })
    await givenCatalog(JOBPARTNERS_LABEL.KELIO, { active: 40, inFlux: 0 })

    await expect(forceCancelRemovedJobsPartners({ partnerLabel: JOBPARTNERS_LABEL.HELLOWORK })).resolves.toEqual({
      partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
      activeBefore: 40,
      cancelled: 20,
    })
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.KELIO, JOB_STATUS_ENGLISH.ACTIVE)).toBe(40)
  })

  it("forceCancelRemovedJobsPartners refuse un partenaire hors des flux", async () => {
    await expect(forceCancelRemovedJobsPartners()).rejects.toThrow(/--partnerLabel requis/)
    await expect(forceCancelRemovedJobsPartners({ partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA })).rejects.toThrow(/--partnerLabel requis/)
    await expect(forceCancelRemovedJobsPartners({ partnerLabel: "hellowork" })).rejects.toThrow(/--partnerLabel requis/)
  })

  it("un partenaire verrouillé par un autre traitement n'est pas annulé et le sous-job sort en erreur", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 5, inFlux: 0 })
    await givenCatalog(JOBPARTNERS_LABEL.KELIO, { active: 5, inFlux: 0 })
    await acquirePartnerLock(JOBPARTNERS_LABEL.HELLOWORK, "autre-traitement")

    await expect(cancelRemovedJobsPartnersFlux()).rejects.toThrow(PartnerLockUnavailableError)

    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(5)
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.KELIO, JOB_STATUS_ENGLISH.ANNULEE)).toBe(5)
    expect.soft(await getDbCollection("jobs_partners_processing_locks").findOne({ partner_label: JOBPARTNERS_LABEL.HELLOWORK })).toMatchObject({ owner: "autre-traitement" })
  })
})
