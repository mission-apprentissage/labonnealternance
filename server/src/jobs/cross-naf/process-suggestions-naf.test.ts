import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"

import { processSuggestionsNaf } from "./process-suggestions-naf"
import { sendSuggestionsNafEmails } from "./send-suggestions-naf-emails"

vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))
vi.mock("./send-suggestions-naf-emails", () => ({ sendSuggestionsNafEmails: vi.fn().mockResolvedValue({ sent: 0, failed: 0, blacklisted: 0 }) }))

describe("processSuggestionsNaf", () => {
  useMongo()

  beforeEach(() => {
    vi.mocked(sendSuggestionsNafEmails).mockClear()
    vi.mocked(notifyToSlack).mockClear()
  })

  it("échoue sans rien envoyer tant que le référentiel ROME × NAF est vide", async () => {
    await expect(processSuggestionsNaf()).rejects.toThrow("référentiel ROME × NAF vide")
    expect(sendSuggestionsNafEmails).not.toHaveBeenCalled()
    expect(notifyToSlack).not.toHaveBeenCalled()
  })

  it("envoie et notifie dès que le référentiel est alimenté", async () => {
    const now = new Date()
    await getDbCollection("referentiel_rome_naf").insertOne({
      _id: new ObjectId(),
      rome: "A1101",
      rome_libelle: "Conducteur / Conductrice d'engins agricoles",
      naf: "01.61Z",
      naf_libelle: "Activités de soutien aux cultures",
      rang: 1,
      contrats_par_annee: [],
      created_at: now,
      updated_at: now,
    })

    expect(await processSuggestionsNaf()).toEqual({ applicants: 0, targets: 0, sendable: 0, sent: 0, failed: 0, blacklisted: 0 })
    expect(sendSuggestionsNafEmails).toHaveBeenCalledOnce()
    expect(notifyToSlack).toHaveBeenCalledOnce()
  })
})
