import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"

import { processSuggestionsNaf, processSuggestionsNafLast24h } from "./process-suggestions-naf"
import { sendSuggestionsNafEmails } from "./send-suggestions-naf-emails"

const { env } = vi.hoisted(() => ({ env: { value: "local" } }))

vi.mock("@/config", async (importOriginal) => {
  const mod = await importOriginal<{ default: Record<string, unknown> }>()
  return {
    default: {
      ...mod.default,
      get env() {
        return env.value
      },
    },
  }
})
vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))
vi.mock("./send-suggestions-naf-emails", () => ({ sendSuggestionsNafEmails: vi.fn().mockResolvedValue({ sent: 0, failed: 0, blacklisted: 0 }) }))

const insertReferentielRow = async () => {
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
}

describe("processSuggestionsNaf", () => {
  useMongo()

  beforeEach(() => {
    env.value = "local"
    vi.mocked(sendSuggestionsNafEmails).mockClear()
    vi.mocked(notifyToSlack).mockClear()
  })

  it("échoue sans rien envoyer tant que le référentiel ROME × NAF est vide", async () => {
    await expect(processSuggestionsNaf()).rejects.toThrow("référentiel ROME × NAF vide")
    expect(sendSuggestionsNafEmails).not.toHaveBeenCalled()
    expect(notifyToSlack).not.toHaveBeenCalled()
  })

  it("envoie et notifie dès que le référentiel est alimenté", async () => {
    await insertReferentielRow()

    expect(await processSuggestionsNaf()).toEqual({ applicants: 0, targets: 0, sendable: 0, sent: 0, failed: 0, blacklisted: 0 })
    expect(sendSuggestionsNafEmails).toHaveBeenCalledOnce()
    expect(notifyToSlack).toHaveBeenCalledOnce()
  })

  it("refuse le test manuel sur 24 h glissantes en production", async () => {
    await insertReferentielRow()
    env.value = "production"

    await expect(processSuggestionsNafLast24h()).rejects.toThrow("réservé hors production")
    expect(sendSuggestionsNafEmails).not.toHaveBeenCalled()
  })

  it("autorise le test manuel sur 24 h glissantes hors production", async () => {
    await insertReferentielRow()
    env.value = "recette"

    await processSuggestionsNafLast24h()
    expect(sendSuggestionsNafEmails).toHaveBeenCalledOnce()
  })
})
