import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as mongodbUtils from "@/common/utils/mongodb-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import * as sentryUtils from "@/common/utils/sentry-utils"
import { syncSearchItemsDelta } from "@/services/search/search-items.service"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"

useMongo()

describe("Importing computed_jobs_partners into jobs_partners", () => {
  const oldDesc = "description existante dans la table jobs_partners"
  const newDesc = "nouvelle description dans la table computed_jobs_partners"

  beforeEach(async () => {
    // créations de plusieurs éléments existants dans jobs partners
    // création de plusieurs éléments dans computed jobs partners . certains avec validated true, d'autres false
    // certains éléments validated de computed sont déjà présents dans jobs partners
    await createJobPartner({ partner_job_id: "existing_1" })
    await createJobPartner({ partner_job_id: "existing_2" })
    await createJobPartner({ partner_job_id: "existing_3", offer_description: oldDesc })
    await createComputedJobPartner({ partner_job_id: "computed_1", validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_2", validated: false })
    await createComputedJobPartner({ partner_job_id: "existing_3", offer_description: newDesc, validated: true })
    await createComputedJobPartner({ partner_job_id: "computed_4", validated: false })
    await createComputedJobPartner({ partner_job_id: "computed_5", validated: true, business_error: JOB_PARTNER_BUSINESS_ERROR.CLOSED_COMPANY })

    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("La transition de computed_jobs_partners vers jobs_partners fonctionne comme attendue : \n- les éléments non validated ou avec business_error ne doivent pas se retrouver dans jobs partners\n- les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners\n- les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour", async () => {
    await importFromComputedToJobsPartners()

    // les éléments non validated ou avec business_error ne doivent pas se retrouver dans jobs partners
    const countNonValidatedInJobsPartners = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["computed_2", "computed_4", "computed_5"] } })
    expect.soft(countNonValidatedInJobsPartners).toEqual(0)

    // les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners
    const countNewValidatedInJobsPartners = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["computed_1"] } })
    expect.soft(countNewValidatedInJobsPartners).toEqual(1)

    // les éléments qui existaient avant l'import sont toujours là
    const countExistingStillHere = await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $in: ["existing_1", "existing_2", "existing_3"] } })
    expect.soft(countExistingStillHere).toEqual(3)

    // les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour
    const existing_3 = await getDbCollection("jobs_partners").findOne({ partner_job_id: "existing_3" })
    expect.soft(existing_3?.offer_description === newDesc)
  })

  describe("onImported", () => {
    it("remonte les _id jobs_partners des offres importées, y compris quand ils diffèrent du computed", async () => {
      // "existing_3" est déjà dans jobs_partners avec son propre _id, et son document computed en a
      // un autre : c'est l'_id de jobs_partners qu'il faut remonter, sinon l'appelant travaille sur
      // un _id qui n'existe pas dans la collection (l'indexation search_items le traiterait comme
      // une offre disparue et tenterait de la retirer de l'index).
      const existingJobPartner = await getDbCollection("jobs_partners").findOne({ partner_job_id: "existing_3" })
      const computedOfExisting = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "existing_3" })
      const computedNew = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: "computed_1" })
      expect.soft(existingJobPartner!._id.equals(computedOfExisting!._id)).toBe(false)

      let importedIds: ObjectId[] = []
      await importFromComputedToJobsPartners(undefined, (ids) => {
        importedIds = ids
      })

      const asStrings = importedIds.map((id) => id.toString())
      // Les deux offres validées : la nouvelle (_id du computed) et l'existante (_id de jobs_partners).
      expect.soft(asStrings).toHaveLength(2)
      expect.soft(asStrings).toContain(computedNew!._id.toString())
      expect.soft(asStrings).toContain(existingJobPartner!._id.toString())
      expect.soft(asStrings).not.toContain(computedOfExisting!._id.toString())
    })

    it("n'est pas appelé quand aucune offre n'est importée", async () => {
      await getDbCollection("computed_jobs_partners").updateMany({}, { $set: { validated: false } })
      const onImported = vi.fn()

      await importFromComputedToJobsPartners(undefined, onImported)

      expect(onImported).not.toHaveBeenCalled()
    })
  })
})

describe("when computed_jobs_partners updateOne in the catch block fails", () => {
  useMongo()

  afterEach(async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("should call sentryCaptureException for both errors and not throw", async () => {
    await createComputedJobPartner({ partner_job_id: "error_doc", validated: true })

    // biome-ignore lint/suspicious/noEmptyBlockStatements: test
    const sentrySpy = vi.spyOn(sentryUtils, "sentryCaptureException").mockImplementation(() => {})
    const getDbCollectionOriginal = mongodbUtils.getDbCollection
    const getDbCollectionSpy = vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
      const collection = getDbCollectionOriginal(name)
      if (name === "jobs_partners") {
        return new Proxy(collection, {
          get(target, prop, receiver) {
            if (prop === "updateOne") return () => Promise.reject(new Error("jobs_partners DB error"))
            const value = Reflect.get(target, prop, receiver)
            return typeof value === "function" ? value.bind(target) : value
          },
        }) as typeof collection
      }
      if (name === "computed_jobs_partners") {
        return new Proxy(collection, {
          get(target, prop, receiver) {
            if (prop === "updateOne") return () => Promise.reject(new Error("computed_jobs_partners DB error"))
            const value = Reflect.get(target, prop, receiver)
            return typeof value === "function" ? value.bind(target) : value
          },
        }) as typeof collection
      }
      return collection
    })

    await expect(importFromComputedToJobsPartners()).resolves.toEqual({ total: 1, success: 0, error: 1 })
    expect(sentrySpy).toHaveBeenCalledTimes(2)

    sentrySpy.mockRestore()
    getDbCollectionSpy.mockRestore()
  })
})

describe("offer_status_history lors de l'import", () => {
  useMongo()

  afterEach(async () => {
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("ajoute une entrée dans offer_status_history quand une offre annulée est réactivée par le flux", async () => {
    await createJobPartner({ partner_job_id: "reactivated_1", offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    await createComputedJobPartner({ partner_job_id: "reactivated_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners({})

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "reactivated_1" })
    expect.soft(job?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(job?.offer_status_history.map(({ status, reason, granted_by }) => ({ status, reason, granted_by }))).toContainEqual({
      status: JOB_STATUS_ENGLISH.ACTIVE,
      reason: "réactivée par le flux source",
      granted_by: "import-from-computed-to-jobs-partners",
    })
  })

  it("n'ajoute pas d'entrée de réactivation quand l'offre était déjà active", async () => {
    await createJobPartner({ partner_job_id: "already_active_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await createComputedJobPartner({ partner_job_id: "already_active_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners({})

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "already_active_1" })
    expect.soft(job?.offer_status_history.filter(({ reason }) => reason === "réactivée par le flux source")).toHaveLength(0)
  })

  it("n'ajoute pas d'entrée de réactivation quand une offre annulée reste annulée", async () => {
    await createJobPartner({ partner_job_id: "stay_cancelled_1", offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    await createComputedJobPartner({ partner_job_id: "stay_cancelled_1", offer_status: JOB_STATUS_ENGLISH.ANNULEE, validated: true })

    await importFromComputedToJobsPartners({})

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "stay_cancelled_1" })
    expect.soft(job?.offer_status_history.filter(({ reason }) => reason === "réactivée par le flux source")).toHaveLength(0)
  })

  it("ne réactive pas une offre fermée pour une autre raison que sa disparition du flux", async () => {
    // Observé en prod le 01/09/2026 : PASS rouvrait chaque nuit ses offres fermées au seuil de 80
    // candidatures (application.service), Jobteaser ses doublons, parce que la réapparition dans le
    // flux suffisait à réactiver. Une décision de fermeture prise ailleurs doit survivre au flux.
    await createJobPartner({
      partner_job_id: "closed_threshold_1",
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      offer_status_history: [{ date: new Date(), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "seuil de candidatures atteint", granted_by: "application.service" }],
    })
    await createComputedJobPartner({ partner_job_id: "closed_threshold_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners({})

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "closed_threshold_1" })
    expect.soft(job?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(job?.offer_status_history.filter(({ reason }) => reason === "réactivée par le flux source")).toHaveLength(0)
  })

  it("réactive une offre annulée sans entrée d'historique (dernière transition tracée : une réactivation)", async () => {
    // Tous les chemins d'annulation ne tracent pas encore l'historique : sans preuve de l'origine,
    // la garde ne doit pas geler l'offre — comportement historique conservé.
    await createJobPartner({
      partner_job_id: "cancelled_untracked_1",
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      offer_status_history: [{ date: new Date(), status: JOB_STATUS_ENGLISH.ACTIVE, reason: "réactivée par le flux source", granted_by: "import-from-computed-to-jobs-partners" }],
    })
    await createComputedJobPartner({ partner_job_id: "cancelled_untracked_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners({})

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "cancelled_untracked_1" })
    expect.soft(job?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("réactive une offre annulée par la détection de retrait quand elle réapparaît dans le flux", async () => {
    await createJobPartner({
      partner_job_id: "removed_then_back_1",
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      offer_status_history: [{ date: new Date(), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "supprimée du flux source", granted_by: "cancel-removed-jobs-partners" }],
    })
    await createComputedJobPartner({ partner_job_id: "removed_then_back_1", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners({})

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "removed_then_back_1" })
    expect.soft(job?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(job?.offer_status_history.filter(({ reason }) => reason === "réactivée par le flux source")).toHaveLength(1)
  })

  it("copie les entrées offer_status_history depuis computed_jobs_partners", async () => {
    const historyEntry = { date: new Date(), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "supprimée du flux source", granted_by: "cancel-removed-jobs-partners" }
    await createComputedJobPartner({ partner_job_id: "with_history_1", validated: true, offer_status_history: [historyEntry] })

    await importFromComputedToJobsPartners({})

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "with_history_1" })
    expect.soft(job?.offer_status_history.map(({ status, reason, granted_by }) => ({ status, reason, granted_by }))).toContainEqual({
      status: historyEntry.status,
      reason: historyEntry.reason,
      granted_by: historyEntry.granted_by,
    })
  })
})

describe("updated_at posé par l'import et fenêtre du cron delta search_items", () => {
  useMongo()

  afterEach(async () => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("search_items").deleteMany({})
  })

  /**
   * Reproduction du trou observé en prod le 2026-09-11 : 965 offres modifiées depuis moins de
   * 30 jours dont la position indexée ne correspondait plus à la source. L'import nocturne dure
   * ~26 min, le delta lit `updated_at >= now − 10 min` toutes les 5 min : un document écrit plus
   * de 10 min après le DÉBUT de l'import, mais horodaté à ce début, est déjà hors fenêtre quand
   * il arrive en base. Le delta ne le voit jamais.
   *
   * L'horloge est simulée sur Date seulement (pas les timers, le driver Mongo en dépend) et
   * avancée de 6 min à chaque lecture de l'existant dans jobs_partners, c'est-à-dire juste avant
   * chaque écriture, comme le ferait un import long : 1re offre écrite à t0+6, 2e à t0+12. Le
   * delta qui suit la fin de l'import (t0+12, fenêtre [t0+2, t0+12]) doit voir les deux ; datées
   * du début de l'import (t0), il n'en voyait aucune.
   */
  it("un document écrit tard dans un import long est repris par le delta : updated_at doit dater de l'écriture, pas du début de l'import", async () => {
    const t0 = new Date("2026-09-11T00:01:00.000Z")
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(t0)

    // Deux offres déjà indexées, dont la source va changer d'adresse pendant l'import.
    const stale = await Promise.all(
      ["late_1", "late_2"].map((id) =>
        createJobPartner({
          partner_job_id: id,
          workplace_address_label: "L'Arsenal (65)",
          workplace_geopoint: { type: "Point", coordinates: [0.07696, 43.24636] },
          updated_at: new Date("2026-08-01T00:00:00.000Z"),
        })
      )
    )
    for (const id of ["late_1", "late_2"]) {
      await createComputedJobPartner({
        partner_job_id: id,
        validated: true,
        workplace_address_label: "l'arsenal 44190 Gétigné",
        workplace_geopoint: { type: "Point", coordinates: [-1.264835, 47.08357] },
      })
    }

    // L'import lit l'offre existante (findOne) puis l'écrit (updateOne) : avancer l'horloge à la
    // RÉSOLUTION de la lecture place chaque écriture 6 min plus tard que la précédente. Ni à
    // l'appel de findOne (les deux lectures partent ensemble, l'horloge avancerait deux fois avant
    // la première écriture), ni sur updateOne (ses arguments, dont l'horodatage, sont évalués
    // avant l'appel).
    const getDbCollectionOriginal = mongodbUtils.getDbCollection
    vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
      const collection = getDbCollectionOriginal(name)
      if (name !== "jobs_partners") return collection
      return new Proxy(collection, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver)
          if (prop === "findOne") {
            return (...args: unknown[]) =>
              ((value as (...a: unknown[]) => Promise<unknown>).apply(target, args) as Promise<unknown>).then((found) => {
                vi.setSystemTime(new Date(Date.now() + 6 * 60_000))
                return found
              })
          }
          return typeof value === "function" ? value.bind(target) : value
        },
      }) as typeof collection
    })

    await importFromComputedToJobsPartners()

    // Le delta tourne juste après la fin de l'import, avec sa fenêtre par défaut de 10 min.
    const { scanned } = await syncSearchItemsDelta()

    const written = await getDbCollection("jobs_partners")
      .find({ partner_job_id: { $in: ["late_1", "late_2"] } })
      .toArray()
    // Chaque document est horodaté à sa propre écriture : deux valeurs distinctes, toutes ≥ t0+6.
    expect(new Set(written.map((d) => d.updated_at.getTime())).size).toBe(2)
    for (const d of written) expect(d.updated_at.getTime()).toBeGreaterThanOrEqual(t0.getTime() + 6 * 60_000)
    // Et le delta les a vus tous les deux.
    expect(scanned).toBe(2)
    for (const s of stale) {
      const indexed = await getDbCollection("search_items").findOne({ _id: s._id })
      expect(indexed?.location?.coordinates).toEqual([-1.264835, 47.08357])
    }
  })
})
