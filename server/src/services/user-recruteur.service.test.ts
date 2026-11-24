import { useMongo } from "@tests/utils/mongo.test.utils"
import { entrepriseStatusEventFactory, saveEntreprise } from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { setEntrepriseStatus } from "./user-recruteur.service"

useMongo()

describe("setEntrepriseStatus", () => {
  const PAST = new Date("2026-03-12T00:00:00.000Z")
  const given = async (status: EntrepriseStatus, reason: string) => saveEntreprise({ updatedAt: PAST, status: [entrepriseStatusEventFactory({ status, reason, date: PAST })] })
  const read = async (_id: ObjectId) => (await getDbCollection("entreprises").findOne({ _id }))!

  it.each([
    [EntrepriseStatus.ERROR, "motif", EntrepriseStatus.ERROR, "motif", false],
    [EntrepriseStatus.ERROR, "motif", EntrepriseStatus.ERROR, "autre motif", true],
    [EntrepriseStatus.A_METTRE_A_JOUR, "motif", EntrepriseStatus.ERROR, "motif", true],
    [EntrepriseStatus.DESACTIVE, "motif", EntrepriseStatus.DESACTIVE, "motif", true],
    [EntrepriseStatus.VALIDE, "", EntrepriseStatus.VALIDE, "", false],
    [EntrepriseStatus.VALIDE, "", EntrepriseStatus.VALIDE, "autre motif", false],
  ])("dernier statut %s (%s), nouveau %s (%s) : événement ajouté = %s", async (lastStatus, lastReason, status, reason, added) => {
    const entreprise = await given(lastStatus, lastReason)

    await setEntrepriseStatus(entreprise._id, reason, status)
    const updated = await read(entreprise._id)

    expect.soft(updated.status).toHaveLength(added ? 2 : 1)
    expect.soft(updated.updatedAt.getTime() > PAST.getTime()).toBe(added)
    if (added) {
      expect.soft(updated.status.at(-1)).toMatchObject({ status, reason })
    }
  })
})
