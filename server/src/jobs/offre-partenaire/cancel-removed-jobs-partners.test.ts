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

describe("Le motif d'une annulation sur business_error est celui du computed apparié", () => {
  it.each([JOB_PARTNER_BUSINESS_ERROR.DESCRIPTION_TOO_SHORT, JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED, JOB_PARTNER_BUSINESS_ERROR.EXPIRED])("%s", async (businessError) => {
    await createJobPartner({ partner_job_id: "bloquee", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "bloquee", partner_label: JOBPARTNERS_LABEL.HELLOWORK, business_error: businessError, validated: false })

    await cancelRemovedJobsPartners({ partner_label: JOBPARTNERS_LABEL.HELLOWORK }, { removalGuard: false })

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "bloquee" })
    expect.soft(job?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(job?.offer_status_history.at(-1)).toMatchObject({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: businessError, granted_by: "cancel-removed-jobs-partners" })
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
  const absentSinceIds = async (partner_label: JOBPARTNERS_LABEL) => {
    const docs = await getDbCollection("jobs_partners")
      .find({ partner_label, flux_absent_since: { $ne: null } }, { projection: { partner_job_id: 1 } })
      .toArray()
    return docs.map(({ partner_job_id }) => partner_job_id).sort()
  }
  const ageAbsences = (partner_label: JOBPARTNERS_LABEL, hours: number) =>
    getDbCollection("jobs_partners").updateMany({ partner_label, flux_absent_since: { $ne: null } }, { $set: { flux_absent_since: new Date(Date.now() - hours * 60 * 60 * 1000) } })
  const runFluxGuard = () => cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

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

  it("(faux positif) un renouvellement nocturne de 6 % passe sur un gros catalogue", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.FRANCE_TRAVAIL, { active: 200, inFlux: 188 })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.FRANCE_TRAVAIL, JOB_STATUS_ENGLISH.ANNULEE)).toBe(12)
  })

  it("un gros catalogue est bloqué au-delà de 15 % de sorties du flux, et ses offres absentes restent en ligne, datées", async () => {
    const ids = await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, active: 200, removed: 32, rate: 32 / 200, maxRate: 0.15 }])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(200)
    expect.soft(await absentSinceIds(JOBPARTNERS_LABEL.HELLOWORK)).toEqual(ids.slice(168).sort())
  })

  it("(faux positif) les mêmes 16 % passent sur un partenaire au seuil par défaut, sans dater les offres", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.JOBTEASER, { active: 200, inFlux: 168 })

    const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } }, { removalGuard: true })

    expect.soft(blocked).toEqual([])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.JOBTEASER, JOB_STATUS_ENGLISH.ANNULEE)).toBe(32)
    expect.soft(await absentSinceIds(JOBPARTNERS_LABEL.JOBTEASER)).toEqual([])
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

    expect.soft(blocked).toEqual([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, active: 41, removed: 20, rate: 20 / 41, maxRate: 0.15 }])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(40)
    // le verdict métier d'une offre encore présente dans le flux n'est pas concerné par le garde-fou
    expect.soft((await getDbCollection("jobs_partners").findOne({ partner_job_id: "expiree" }))?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.KELIO, JOB_STATUS_ENGLISH.ANNULEE)).toBe(10)
    expect.soft(slackUtils.notifyToSlack).toHaveBeenCalledTimes(1)
    expect
      .soft(vi.mocked(slackUtils.notifyToSlack).mock.calls[0]?.[0])
      .toMatchObject({ error: true, message: expect.stringContaining("[garde-fou] Hellowork : 20 offres actives sur 41") })
  })

  it("(cumul) le lendemain d'un blocage, les offres déjà datées ne comptent plus : pas de nouveau blocage ni d'annulation", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })
    await runFluxGuard()
    await ageAbsences(JOBPARTNERS_LABEL.HELLOWORK, 24)

    const { blocked } = await runFluxGuard()

    expect.soft(blocked).toEqual([])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(200)
  })

  it("les nouvelles sorties du flux sous le seuil sont annulées tout de suite, les offres datées attendent la fin du délai", async () => {
    const ids = await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })
    await runFluxGuard()
    await ageAbsences(JOBPARTNERS_LABEL.HELLOWORK, 24)
    await getDbCollection("computed_jobs_partners").deleteMany({ partner_job_id: { $in: ids.slice(158, 168) } })

    const { blocked } = await runFluxGuard()

    expect.soft(blocked).toEqual([])
    const cancelled = await getDbCollection("jobs_partners")
      .find({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ANNULEE }, { projection: { partner_job_id: 1 } })
      .toArray()
    expect.soft(cancelled.map(({ partner_job_id }) => partner_job_id).sort()).toEqual(ids.slice(158, 168).sort())
    expect.soft(await absentSinceIds(JOBPARTNERS_LABEL.HELLOWORK)).toEqual(ids.slice(168).sort())
  })

  it("une offre restée hors du flux au terme du délai est annulée, même quand le run de nuit part quelques heures plus tôt", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })
    await runFluxGuard()
    await ageAbsences(JOBPARTNERS_LABEL.HELLOWORK, 3 * 24 - 1)
    vi.mocked(slackUtils.notifyToSlack).mockClear()

    const { blocked, graceExpiries } = await runFluxGuard()

    expect.soft(blocked).toEqual([])
    expect.soft(graceExpiries).toEqual([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, count: 32 }])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ANNULEE)).toBe(32)
    const cancelled = await getDbCollection("jobs_partners").findOne({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    expect.soft(cancelled?.offer_status_history.at(-1)).toMatchObject({ reason: "supprimée du flux source", granted_by: "cancel-removed-jobs-partners" })
    expect.soft(await absentSinceIds(JOBPARTNERS_LABEL.HELLOWORK)).toEqual([])
    // annulation sans blocage du jour : l'alerte Slack est le seul signal
    expect.soft(slackUtils.notifyToSlack).toHaveBeenCalledTimes(1)
    expect
      .soft(vi.mocked(slackUtils.notifyToSlack).mock.calls[0]?.[0])
      .toMatchObject({ error: true, message: expect.stringContaining("Hellowork : 32 offres sorties du flux pendant un blocage et toujours absentes après 3 jours") })
  })

  it("un partenaire bloqué ce soir voit quand même annulées les offres datées arrivées à échéance, pas les nouvelles", async () => {
    const ids = await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })
    await runFluxGuard()
    await ageAbsences(JOBPARTNERS_LABEL.HELLOWORK, 3 * 24)
    await getDbCollection("computed_jobs_partners").deleteMany({ partner_job_id: { $in: ids.slice(128, 168) } })

    const { blocked, graceExpiries } = await runFluxGuard()

    expect.soft(blocked).toMatchObject([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, active: 200, removed: 40 }])
    expect.soft(graceExpiries).toEqual([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, count: 32 }])
    const cancelled = await getDbCollection("jobs_partners")
      .find({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_status: JOB_STATUS_ENGLISH.ANNULEE }, { projection: { partner_job_id: 1 } })
      .toArray()
    expect.soft(cancelled.map(({ partner_job_id }) => partner_job_id).sort()).toEqual(ids.slice(168).sort())
    expect.soft(await absentSinceIds(JOBPARTNERS_LABEL.HELLOWORK)).toEqual(ids.slice(128, 168).sort())
  })

  it("(faux positif) une offre absente depuis deux jours n'est pas encore annulée", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })
    await runFluxGuard()
    await ageAbsences(JOBPARTNERS_LABEL.HELLOWORK, 2 * 24)

    await runFluxGuard()

    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(200)
  })

  it("une offre datée qui revient dans le flux perd sa date, et compte de nouveau comme sortie si elle disparaît encore", async () => {
    const ids = await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })
    await runFluxGuard()
    await ageAbsences(JOBPARTNERS_LABEL.HELLOWORK, 3 * 24)
    await getDbCollection("computed_jobs_partners").insertMany(
      ids.slice(168).map((partner_job_id) => generateComputedJobsPartnersFixture({ partner_job_id, partner_label: JOBPARTNERS_LABEL.HELLOWORK, validated: true }))
    )

    await runFluxGuard()

    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(200)
    expect.soft(await absentSinceIds(JOBPARTNERS_LABEL.HELLOWORK)).toEqual([])

    await getDbCollection("computed_jobs_partners").deleteMany({ partner_job_id: { $in: ids.slice(168) } })
    const { blocked } = await runFluxGuard()

    expect.soft(blocked).toMatchObject([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, removed: 32 }])
    expect.soft(await countByStatus(JOBPARTNERS_LABEL.HELLOWORK, JOB_STATUS_ENGLISH.ACTIVE)).toBe(200)
  })

  it("forceCancelRemovedJobsPartners annule aussi les offres datées par un blocage, sans attendre le délai", async () => {
    await givenCatalog(JOBPARTNERS_LABEL.HELLOWORK, { active: 200, inFlux: 168 })
    await runFluxGuard()

    await expect(forceCancelRemovedJobsPartners({ partnerLabel: JOBPARTNERS_LABEL.HELLOWORK })).resolves.toMatchObject({ cancelled: 32 })
    expect.soft(await absentSinceIds(JOBPARTNERS_LABEL.HELLOWORK)).toEqual([])
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
