import { createComputedJobPartner, createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { findIndexed } from "@tests/utils/search-index.test.utils"
import { ObjectId } from "mongodb"
import { generateComputedJobsPartnersFixture, generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getRootLogger } from "@/common/logger"
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
      // un _id qui n'existe pas dans la collection (l'indexation le traiterait comme
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
            if (prop === "bulkWrite") return () => Promise.reject(new Error("jobs_partners DB error"))
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

    await expect(importFromComputedToJobsPartners()).resolves.toEqual({ total: 1, success: 0, error: 1, unchanged: 0 })
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
    // Tous les chemins d'annulation ne tracent pas l'historique : sans preuve de l'origine, la
    // garde ne doit pas geler l'offre.
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

describe("updated_at posé par l'import et fenêtre du cron delta de l'index de recherche", () => {
  useMongo()

  afterEach(async () => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  /**
   * Régression observée en prod le 2026-09-11 : 965 offres modifiées depuis moins de 30 jours à
   * position indexée périmée. Cf. le commentaire sur updated_at dans importFromComputedToJobsPartners.
   *
   * L'horloge est simulée sur Date seulement (le driver Mongo dépend des timers) et avance de
   * 6 min entre la lecture du lot et son écriture : les offres sont écrites à t0+6. Le delta suivant
   * (fenêtre [t0−4, t0+6]) doit les voir ; datées de t0, elles seraient hors fenêtre.
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

    // L'import lit les offres existantes du lot (find) puis l'écrit (bulkWrite) : avancer l'horloge à
    // la RÉSOLUTION de la lecture, pas sur bulkWrite (ses arguments, dont l'horodatage, sont
    // évalués avant l'appel).
    const getDbCollectionOriginal = mongodbUtils.getDbCollection
    const getDbCollectionSpy = vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
      const collection = getDbCollectionOriginal(name)
      if (name !== "jobs_partners") return collection
      return new Proxy(collection, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver)
          if (prop === "find") {
            return (...args: unknown[]) => {
              const cursor = (value as (...a: unknown[]) => { toArray: () => Promise<unknown[]> }).apply(target, args)
              return {
                toArray: async () => {
                  const found = await cursor.toArray()
                  vi.setSystemTime(new Date(Date.now() + 6 * 60_000))
                  return found
                },
              }
            }
          }
          return typeof value === "function" ? value.bind(target) : value
        },
      }) as typeof collection
    })

    await importFromComputedToJobsPartners()
    getDbCollectionSpy.mockRestore()

    // Le delta tourne juste après la fin de l'import, avec sa fenêtre par défaut de 10 min.
    const { scanned } = await syncSearchItemsDelta()

    const written = await getDbCollection("jobs_partners")
      .find({ partner_job_id: { $in: ["late_1", "late_2"] } })
      .toArray()
    // Horodatés à l'écriture du lot (t0+6), pas au début de l'import (t0).
    for (const d of written) expect(d.updated_at.getTime()).toBe(t0.getTime() + 6 * 60_000)
    expect(scanned).toBe(2)
    for (const s of stale) {
      const indexed = await findIndexed(s._id)
      expect(indexed?.location?.coordinates).toEqual([-1.264835, 47.08357])
    }
  })
})

describe("import par lots", () => {
  useMongo()

  afterEach(async () => {
    vi.restoreAllMocks()
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("une écriture en échec n'invalide que son offre, pas le reste du lot", async () => {
    // offer_status_history corrompu : le $push de cette seule offre est refusé par MongoDB.
    await getDbCollection("jobs_partners").insertOne(
      { ...generateJobsPartnersOfferPrivate({ partner_job_id: "corrupted_1" }), offer_status_history: "corrompu" as never },
      { bypassDocumentValidation: true }
    )
    const historyEntry = { date: new Date(), status: JOB_STATUS_ENGLISH.ACTIVE, reason: "test", granted_by: "test" }
    const failing = await createComputedJobPartner({ partner_job_id: "corrupted_1", validated: true, offer_status_history: [historyEntry] })
    const succeeding = await createComputedJobPartner({ partner_job_id: "healthy_1", validated: true })
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test
    vi.spyOn(sentryUtils, "sentryCaptureException").mockImplementation(() => {})
    // `logger` est un Proxy vers l'instance racine hors requête HTTP : c'est elle qu'on espionne.
    const loggerErrorSpy = vi.spyOn(getRootLogger(), "error")

    let importedIds: ObjectId[] = []
    const counters = await importFromComputedToJobsPartners(undefined, (ids) => {
      importedIds = ids
    })

    expect.soft(counters).toEqual({ total: 2, success: 1, error: 1, unchanged: 0 })
    expect.soft(importedIds.map((id) => id.toString())).toEqual([succeeding._id.toString()])
    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: "healthy_1" })).toBe(1)
    const failingComputed = await getDbCollection("computed_jobs_partners").findOne({ _id: failing._id })
    expect.soft(failingComputed?.validated).toBe(false)
    expect.soft(failingComputed?.errors.map((error) => error?.source)).toContain(COMPUTED_ERROR_SOURCE.DB_ERROR)
    const succeedingComputed = await getDbCollection("computed_jobs_partners").findOne({ _id: succeeding._id })
    expect.soft(succeedingComputed?.validated).toBe(true)
    // pino ne sérialise que les Error : avec une chaîne en premier argument, le message de contexte serait perdu.
    expect.soft(loggerErrorSpy).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining("partner_job_id=corrupted_1"))
  })

  it("distingue deux offres de même partner_job_id chez deux partenaires dans le même lot", async () => {
    await createJobPartner({
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      partner_job_id: "shared_id",
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      offer_status_history: [{ date: new Date(), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "seuil de candidatures atteint", granted_by: "application.service" }],
    })
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "shared_id", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })
    await createComputedJobPartner({ partner_label: JOBPARTNERS_LABEL.JOBTEASER, partner_job_id: "shared_id", offer_status: JOB_STATUS_ENGLISH.ACTIVE, validated: true })

    await importFromComputedToJobsPartners()

    const hellowork = await getDbCollection("jobs_partners").findOne({ partner_label: JOBPARTNERS_LABEL.HELLOWORK, partner_job_id: "shared_id" })
    const jobteaser = await getDbCollection("jobs_partners").findOne({ partner_label: JOBPARTNERS_LABEL.JOBTEASER, partner_job_id: "shared_id" })
    // La fermeture au seuil de l'offre Hellowork ne doit ni être levée, ni bloquer l'offre Jobteaser.
    expect.soft(hellowork?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(jobteaser?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(jobteaser?.offer_status_history).toEqual([])
  })

  it("importe toutes les offres quand leur nombre dépasse la taille d'un lot", async () => {
    const count = 2_345
    await getDbCollection("computed_jobs_partners").insertMany(
      Array.from({ length: count }, (_, index) => ({ ...generateComputedJobsPartnersFixture(), partner_job_id: `bulk_${index}`, validated: true }))
    )

    const counters = await importFromComputedToJobsPartners()

    expect.soft(counters).toEqual({ total: count, success: count, error: 0, unchanged: 0 })
    expect.soft(await getDbCollection("jobs_partners").countDocuments({ partner_job_id: { $regex: /^bulk_/ } })).toBe(count)
  })
})

describe("updated_at n'avance que si un champ publié change (cf. hasPublishedChange)", () => {
  useMongo()

  const firstImport = new Date("2026-11-02T00:01:00.000Z")
  const nextImport = new Date("2026-11-02T04:01:00.000Z")

  afterEach(async () => {
    vi.useRealTimers()
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  // Une valeur non nulle de chaque forme (date, objet, tableau, géopoint) : des instances neuves de même valeur ne sont pas un changement.
  const publishedData = () => ({
    partner_job_id: "offer_1",
    validated: true,
    contract_start: new Date("2026-12-01T00:00:00.000Z"),
    offer_target_diploma: { european: "5" as const, label: "BTS, DEUST (Bac+2)" },
    offer_rome_codes: ["M1607"],
    offer_desired_skills: ["Rigueur"],
    workplace_geopoint: { type: "Point" as const, coordinates: [2.3, 48.8] as [number, number] },
    rank: 100,
  })

  // Champ absent du computed et recopié sans `?? null` par toJobPartner : undefined à l'écriture, null à la relecture.
  const dropStreetLabelFromComputed = () => getDbCollection("computed_jobs_partners").updateMany({}, { $unset: { workplace_address_street_label: "" } })

  /** Deux runs successifs : le computed est reconstruit entre les deux, comme à chaque lecture du flux. */
  const importTwice = async (nextComputed: Partial<IComputedJobsPartners> = {}, betweenImports?: () => Promise<void>) => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(firstImport)
    await createComputedJobPartner(publishedData())
    await dropStreetLabelFromComputed()
    await importFromComputedToJobsPartners()
    await betweenImports?.()

    await getDbCollection("computed_jobs_partners").deleteMany({})
    vi.setSystemTime(nextImport)
    await createComputedJobPartner({
      ...publishedData(),
      _id: new ObjectId(),
      created_at: nextImport,
      updated_at: nextImport,
      jobs_in_success: [COMPUTED_ERROR_SOURCE.FILL_LBA_URL],
      errors: [{ source: COMPUTED_ERROR_SOURCE.API_SIRET, error: "data not found" }],
      ...nextComputed,
    })
    await dropStreetLabelFromComputed()
    await importFromComputedToJobsPartners()
    return getDbCollection("jobs_partners").findOne({ partner_job_id: "offer_1" })
  }

  it("une offre inchangée garde son updated_at et n'est pas reprise par le cron delta de l'index", async () => {
    const job = await importTwice()

    expect.soft(job?.updated_at).toEqual(firstImport)
    expect.soft((await syncSearchItemsDelta({ since: nextImport })).scanned).toBe(0)
  })

  it("un changement de rang ou de doublons seul est écrit sans avancer updated_at", async () => {
    const duplicates = [{ partner_job_id: "other", partner_label: JOBPARTNERS_LABEL.JOBTEASER, collectionName: "jobs_partners" as const, reason: "test" }]
    const job = await importTwice({ rank: 10, duplicates })

    expect.soft(job?.rank).toBe(10)
    expect.soft(job?.duplicates).toEqual(duplicates)
    expect.soft(job?.updated_at).toEqual(firstImport)
  })

  it.each([
    ["intitulé", { offer_title: "Un autre intitulé" }],
    ["adresse", { workplace_address_label: "1 rue de Rivoli 75001 Paris", workplace_geopoint: { type: "Point" as const, coordinates: [2.35, 48.86] as [number, number] } }],
    ["diplôme visé", { offer_target_diploma: { european: "6" as const, label: "Licence, BUT, Licence Pro (Bac+3)" } }],
    ["date de début", { contract_start: new Date("2027-01-04T00:00:00.000Z") }],
    ["tableau vidé", { offer_desired_skills: [] }],
    ["statut", { offer_status: JOB_STATUS_ENGLISH.ANNULEE }],
  ])("un changement publié (%s) avance updated_at et déclenche la réindexation", async (_, nextComputed) => {
    const job = await importTwice(nextComputed)

    expect.soft(job?.updated_at).toEqual(nextImport)
    expect.soft((await syncSearchItemsDelta({ since: nextImport })).scanned).toBe(1)
  })

  const cancelBetweenImports = (granted_by: string) => async () => {
    await getDbCollection("jobs_partners").updateOne(
      { partner_job_id: "offer_1" },
      { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE }, $push: { offer_status_history: { date: firstImport, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "test", granted_by } } }
    )
  }

  it("une réactivation par le flux est un changement publié", async () => {
    const job = await importTwice({}, cancelBetweenImports("cancel-removed-jobs-partners"))

    expect.soft(job?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect.soft(job?.updated_at).toEqual(nextImport)
  })

  it("une offre fermée ailleurs et maintenue fermée par la garde de réactivation garde son updated_at", async () => {
    const job = await importTwice({}, cancelBetweenImports("application.service"))

    expect.soft(job?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect.soft(job?.updated_at).toEqual(firstImport)
  })

  it("renvoie le nombre d'offres écrites sans changement publié", async () => {
    await createComputedJobPartner(publishedData())

    expect.soft(await importFromComputedToJobsPartners()).toEqual({ total: 1, success: 1, error: 0, unchanged: 0 })
    expect.soft(await importFromComputedToJobsPartners()).toEqual({ total: 1, success: 1, error: 0, unchanged: 1 })
  })

  it("ne relit des offres existantes que les champs comparés et ceux de la garde de réactivation", async () => {
    const projections: Record<string, unknown>[] = []
    const getDbCollectionOriginal = mongodbUtils.getDbCollection
    const getDbCollectionSpy = vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
      const collection = getDbCollectionOriginal(name)
      if (name !== "jobs_partners") return collection
      return new Proxy(collection, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver)
          if (prop === "find") {
            return (...args: unknown[]) => {
              projections.push((args[1] as { projection?: Record<string, unknown> } | undefined)?.projection ?? {})
              return (value as (...a: unknown[]) => unknown).apply(target, args)
            }
          }
          return typeof value === "function" ? value.bind(target) : value
        },
      }) as typeof collection
    })

    await importTwice()
    getDbCollectionSpy.mockRestore()

    const [projection] = projections
    expect.soft(projection).toMatchObject({
      _id: 1,
      partner_label: 1,
      partner_job_id: 1,
      offer_status: 1,
      offer_title: 1,
      offer_description: 1,
      workplace_geopoint: 1,
      offer_status_history: { $slice: -1 },
    })
    expect.soft(Object.keys(projection ?? {}).filter((field) => ["lba_url", "stats_detail_view", "rank", "duplicates", "updated_at", "created_at"].includes(field))).toEqual([])
  })
})
