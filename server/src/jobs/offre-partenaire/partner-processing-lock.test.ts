import { useMongo } from "@tests/utils/mongo.test.utils"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { acquirePartnerLock, isPartnerLocked, PartnerLockUnavailableError, releasePartnerLock, withPartnerLocks } from "./partner-processing-lock"

useMongo()

const locks = () => getDbCollection("jobs_partners_processing_locks")

describe("verrou par partenaire", () => {
  beforeEach(() => {
    return async () => {
      await locks().deleteMany({})
    }
  })

  it("n'accorde le verrou qu'à un seul traitement, même en concurrence", async () => {
    const results = await Promise.all(["a", "b", "c", "d", "e"].map((owner) => acquirePartnerLock("Hellowork", owner)))

    expect.soft(results.filter(Boolean)).toHaveLength(1)
    expect.soft(await locks().countDocuments({ partner_label: "Hellowork" })).toBe(1)
  })

  it("reste exclusif sans autre index que _id", async () => {
    await locks()
      .dropIndexes()
      .catch((err) => {
        if (err?.codeName !== "NamespaceNotFound") throw err
      })

    const results = await Promise.all(["a", "b", "c", "d", "e"].map((owner) => acquirePartnerLock("Hellowork", owner)))

    expect.soft(results.filter(Boolean)).toHaveLength(1)
    expect.soft(await locks().countDocuments({})).toBe(1)
  })

  it("prolonge le verrou pour son détenteur et l'ignore pour un autre partenaire", async () => {
    expect.soft(await acquirePartnerLock("Hellowork", "a")).toBe(true)
    expect.soft(await acquirePartnerLock("Hellowork", "a")).toBe(true)
    expect.soft(await acquirePartnerLock("Hellowork", "b")).toBe(false)
    expect.soft(await acquirePartnerLock("Kelio", "b")).toBe(true)
  })

  it("seul le détenteur libère le verrou", async () => {
    await acquirePartnerLock("Hellowork", "a")

    await releasePartnerLock("Hellowork", "b")
    expect.soft(await isPartnerLocked("Hellowork")).toBe(true)
    expect.soft(await isPartnerLocked("Hellowork", { exceptOwner: "a" })).toBe(false)

    await releasePartnerLock("Hellowork", "a")
    expect.soft(await isPartnerLocked("Hellowork")).toBe(false)
  })

  it("un verrou expiré (traitement tué) peut être repris", async () => {
    await acquirePartnerLock("Hellowork", "tue", -1)

    expect.soft(await isPartnerLocked("Hellowork")).toBe(false)
    expect.soft(await acquirePartnerLock("Hellowork", "b")).toBe(true)
    expect.soft(await locks().findOne({ partner_label: "Hellowork" })).toMatchObject({ owner: "b" })
  })

  describe("withPartnerLocks", () => {
    it("détient les verrous pendant le traitement et les libère ensuite, y compris sur erreur", async () => {
      let lockedDuringRun = false
      await withPartnerLocks(["Hellowork", "Kelio"], async (locked) => {
        expect(locked).toEqual(["Hellowork", "Kelio"])
        lockedDuringRun = (await isPartnerLocked("Hellowork")) && (await isPartnerLocked("Kelio"))
      })
      expect.soft(lockedDuringRun).toBe(true)
      expect.soft(await locks().countDocuments({})).toBe(0)

      await expect(
        withPartnerLocks(["Hellowork"], async () => {
          throw new Error("boom")
        })
      ).rejects.toThrow("boom")
      expect.soft(await locks().countDocuments({})).toBe(0)
    })

    it("requireAll : échoue sans exécuter le traitement et rend les verrous obtenus", async () => {
      await acquirePartnerLock("Kelio", "autre")
      let ran = false

      await expect(
        withPartnerLocks(["Hellowork", "Kelio"], async () => {
          ran = true
        })
      ).rejects.toThrow(PartnerLockUnavailableError)

      expect.soft(ran).toBe(false)
      expect.soft(await locks().find({}).toArray()).toEqual([expect.objectContaining({ partner_label: "Kelio", owner: "autre" })])
    })

    it("sans requireAll : traite les seuls partenaires disponibles", async () => {
      await acquirePartnerLock("Kelio", "autre")

      const locked = await withPartnerLocks(["Hellowork", "Kelio", "PASS"], async (lockedPartnerLabels) => lockedPartnerLabels, { requireAll: false })

      expect.soft(locked).toEqual(["Hellowork", "PASS"])
      expect.soft(await isPartnerLocked("Kelio")).toBe(true)
    })

    it("attend la libération d'un verrou dans la limite de waitMs", async () => {
      await acquirePartnerLock("Hellowork", "autre")
      setTimeout(() => releasePartnerLock("Hellowork", "autre"), 200)

      const locked = await withPartnerLocks(["Hellowork"], async (lockedPartnerLabels) => lockedPartnerLabels, { waitMs: 5_000, pollIntervalMs: 50 })

      expect(locked).toEqual(["Hellowork"])
    })

    it("est réentrant : un appel imbriqué ne réacquiert ni ne libère les verrous de l'appel englobant", async () => {
      await withPartnerLocks(["Hellowork"], async () => {
        const nested = await withPartnerLocks(["Hellowork"], async (lockedPartnerLabels) => lockedPartnerLabels)
        expect.soft(nested).toEqual(["Hellowork"])
        expect.soft(await isPartnerLocked("Hellowork")).toBe(true)
      })
      expect.soft(await isPartnerLocked("Hellowork")).toBe(false)
    })

    it("exclut deux traitements indépendants lancés en même temps sur le même partenaire", async () => {
      const slowRun = () => withPartnerLocks(["Hellowork"], () => new Promise((resolve) => setTimeout(() => resolve("fini"), 100)))

      const results = await Promise.allSettled([slowRun(), slowRun()])

      expect.soft(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1)
      expect.soft(results.find((result): result is PromiseRejectedResult => result.status === "rejected")?.reason).toBeInstanceOf(PartnerLockUnavailableError)
    })
  })
})
