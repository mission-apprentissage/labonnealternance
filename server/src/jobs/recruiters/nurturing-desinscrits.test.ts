import { useMongo } from "@tests/utils/mongo.test.utils"
import { createEmailBlacklistTest } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { UNSUBSCRIBE_REASONS } from "shared/constants/unsubscribe"
import type { IUnsubscribedLbaCompany } from "shared/models/unsubscribed-recruteur-lba.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { nurturingDesinscrits } from "./nurturing-desinscrits"

vi.mock("@/services/brevo.service", () => ({ uploadContactListToBrevo: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

// today fixé au 2026-07-16 (Paris) → échues : désinscriptions jusqu'au 2025-10-16 inclus
const TODAY = new Date("2026-07-16T07:00:00Z")
const IN_WINDOW = new Date("2025-10-16T10:00:00Z")
const EMAIL = "recrutement@entreprise.fr"

const makeUnsubscribed = (over: Partial<IUnsubscribedLbaCompany> = {}): IUnsubscribedLbaCompany => ({
  _id: new ObjectId(),
  siret: "11000001500013",
  raison_sociale: "Entreprise Test",
  enseigne: "",
  naf_code: "",
  naf_label: "",
  rome_codes: [],
  insee_city_code: null,
  zip_code: null,
  city: null,
  company_size: null,
  created_at: new Date("2024-01-01"),
  last_update_at: new Date("2024-01-01"),
  unsubscribe_date: IN_WINDOW,
  unsubscribe_reason: UNSUBSCRIBE_REASONS.DEJA_TROUVE,
  email: EMAIL,
  relance_nurturing_date: null,
  ...over,
})

describe("nurturing-desinscrits", () => {
  useMongo()

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
    vi.mocked(uploadContactListToBrevo).mockClear()
    return async () => {
      vi.useRealTimers()
      await getDbCollection("unsubscribedrecruteurslba").deleteMany({})
      await getDbCollection("emailblacklists").deleteMany({})
    }
  })

  it("pousse l'entreprise désinscrite il y a 9 mois, la marque et efface son e-mail", async () => {
    const company = makeUnsubscribed()
    await getDbCollection("unsubscribedrecruteurslba").insertOne(company)

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
    const [rows, , listId] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(listId).toBe("994")
    expect(rows).toEqual([{ email: EMAIL, raison_sociale: "Entreprise Test", date_desinscription: IN_WINDOW }])

    const stored = await getDbCollection("unsubscribedrecruteurslba").findOne({ _id: company._id })
    expect(stored?.relance_nurturing_date).toBeInstanceOf(Date)
    expect(stored?.email).toBeNull()
  })

  it("ne relance jamais un autre motif de désinscription", async () => {
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed({ unsubscribe_reason: UNSUBSCRIBE_REASONS.OPPOSITION }))

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("ignore une désinscription dont l'échéance n'est pas atteinte", async () => {
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed({ unsubscribe_date: new Date("2025-10-17T10:00:00Z") }))

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("rattrape une échéance manquée les jours précédents", async () => {
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed({ unsubscribe_date: new Date("2025-10-15T10:00:00Z") }))

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["le 31 mai", "2026-05-31T10:00:00Z", "2027-03-01T07:00:00Z"],
    ["le 31 juillet", "2026-07-31T10:00:00Z", "2027-05-01T07:00:00Z"],
    ["le 31 décembre", "2025-12-31T10:00:00Z", "2026-10-01T07:00:00Z"],
    ["à 23 h 30 heure de Paris", "2026-01-25T22:30:00Z", "2026-10-25T07:00:00Z"],
  ])("relance une désinscription survenue %s", async (_label, unsubscribe_date, today) => {
    vi.setSystemTime(new Date(today))
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed({ unsubscribe_date: new Date(unsubscribe_date) }))

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
  })

  it("ne relance qu'une fois : ignore une désinscription déjà marquée ou sans e-mail", async () => {
    await getDbCollection("unsubscribedrecruteurslba").insertMany([
      makeUnsubscribed({ relance_nurturing_date: new Date("2026-07-01") }),
      makeUnsubscribed({ email: null }),
      makeUnsubscribed({ email: undefined }),
    ])

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("exclut les adresses blacklistées, les marque et efface leur e-mail", async () => {
    await createEmailBlacklistTest({ email: EMAIL })
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed())

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
    const stored = await getDbCollection("unsubscribedrecruteurslba").findOne({})
    expect(stored?.email).toBeNull()
    expect(stored?.relance_nurturing_date).toBeInstanceOf(Date)
  })

  it("n'envoie qu'un mail par adresse, même rattachée à plusieurs établissements désinscrits", async () => {
    const sameDay = makeUnsubscribed({ siret: "11000001500021" })
    const otherDay = makeUnsubscribed({ siret: "11000001500039", unsubscribe_date: new Date("2025-12-01T10:00:00Z") })
    await getDbCollection("unsubscribedrecruteurslba").insertMany([makeUnsubscribed(), sameDay, otherDay])

    await nurturingDesinscrits()

    const [rows] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(rows).toHaveLength(1)

    // Le troisième établissement, dont l'anniversaire tombe plus tard, est neutralisé : pas de second mail à la même adresse
    const stored = await getDbCollection("unsubscribedrecruteurslba").find({}).toArray()
    expect(stored.every((company) => company.relance_nurturing_date instanceof Date && company.email === null)).toBe(true)
  })

  it("ne fait rien si la liste Brevo n'est pas configurée", async () => {
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed())
    const listIds = config.brevo.listIds
    const previous = listIds.nurturingDesinscrits
    listIds.nurturingDesinscrits = undefined

    try {
      await nurturingDesinscrits()
    } finally {
      listIds.nurturingDesinscrits = previous
    }

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
    expect((await getDbCollection("unsubscribedrecruteurslba").findOne({}))?.relance_nurturing_date).toBeNull()
  })

  it("conserve l'e-mail si l'envoi vers Brevo échoue, sans relancer le lendemain", async () => {
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed())
    vi.mocked(uploadContactListToBrevo).mockRejectedValueOnce(new Error("brevo down"))

    await expect(nurturingDesinscrits()).rejects.toThrow("brevo down")

    const stored = await getDbCollection("unsubscribedrecruteurslba").findOne({})
    expect(stored?.email).toBe(EMAIL)
    expect(stored?.relance_nurturing_date).toBeInstanceOf(Date)
  })

  it("n'envoie rien en août (relances reportées)", async () => {
    vi.setSystemTime(new Date("2026-08-15T07:00:00Z"))
    // désinscription dont l'anniversaire tombe le 15 août 2026
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed({ unsubscribe_date: new Date("2025-11-15T10:00:00Z") }))

    await nurturingDesinscrits()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("rattrape les échéances d'août dès le 1er septembre", async () => {
    vi.setSystemTime(new Date("2026-09-01T07:00:00Z"))
    // échéance tombée le 16 août 2026 → rattrapée le 1er septembre
    await getDbCollection("unsubscribedrecruteurslba").insertOne(makeUnsubscribed({ unsubscribe_date: new Date("2025-11-16T10:00:00Z") }))

    await nurturingDesinscrits()

    const [rows] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(rows).toHaveLength(1)
  })
})
