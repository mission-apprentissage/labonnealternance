import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateJobsPartnersFull } from "shared/fixtures/jobPartners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { UserEventType } from "shared/models/userWithAccount.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { nurturingEntreprises } from "./nurturingEntreprises"

vi.mock("@/services/brevo.service", () => ({ uploadContactListToBrevo: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/slackUtils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

// today fixé au 2026-07-16 (Paris) → fenêtre J+330 = offres créées le 2025-08-20
const TODAY = new Date("2026-07-16T07:00:00Z")
const IN_WINDOW = new Date("2025-08-20T10:00:00Z")

const makeContact = (userId: ObjectId, over: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  role_last_status: AccessStatus.GRANTED,
  user_last_status: UserEventType.ACTIF,
  role_authorized_type: AccessEntityType.ENTREPRISE,
  user__id: userId,
  user_email: `contact-${userId.toHexString()}@entreprise.fr`,
  user_first_name: "Jeanne",
  user_last_name: "Martin",
  entreprise_raison_sociale: "Raison Sociale",
  ...over,
})

const makeOffer = (userId: ObjectId, over: Parameters<typeof generateJobsPartnersFull>[0] = {}) =>
  generateJobsPartnersFull({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: userId,
    offer_title: "Chargé de communication en alternance",
    offer_creation: IN_WINDOW,
    // offre expirée depuis longtemps (l'entreprise est dormante)
    offer_expiration: new Date("2025-10-20"),
    ...over,
  })

describe("nurturingEntreprises", () => {
  useMongo()

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(TODAY)
    vi.mocked(uploadContactListToBrevo).mockClear()
    return async () => {
      vi.useRealTimers()
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("rolemanagement360").deleteMany({})
    }
  })

  it("pousse l'entreprise dormante à J+330 de sa dernière offre et marque l'offre", async () => {
    const userId = new ObjectId()
    const offer = makeOffer(userId)
    await getDbCollection("jobs_partners").insertOne(offer)
    await getDbCollection("rolemanagement360").insertOne(makeContact(userId))

    await nurturingEntreprises()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
    const [account, rows, , listId] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(account).toBe("MARKETING")
    expect(listId).toBe("997")
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe(`contact-${userId.toHexString()}@entreprise.fr`)
    expect(rows[0].raison_sociale).toBe("Raison Sociale")
    expect(rows[0].metier).toBe("Chargé de communication en alternance")

    const marked = await getDbCollection("jobs_partners").findOne({ _id: offer._id })
    expect(marked?.relance_mail_nurturing).not.toBeNull()
  })

  it("exclut l'entreprise revenue déposer une offre plus récente", async () => {
    const userId = new ObjectId()
    await getDbCollection("jobs_partners").insertMany([makeOffer(userId), makeOffer(userId, { offer_creation: new Date("2026-02-01"), offer_expiration: new Date("2026-04-01") })])
    await getDbCollection("rolemanagement360").insertOne(makeContact(userId))

    await nurturingEntreprises()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("exclut l'entreprise ayant une offre encore active", async () => {
    const userId = new ObjectId()
    await getDbCollection("jobs_partners").insertOne(makeOffer(userId, { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_expiration: new Date("2026-12-31") }))
    await getDbCollection("rolemanagement360").insertOne(makeContact(userId))

    await nurturingEntreprises()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("exclut les CFA et les comptes désactivés", async () => {
    const cfaId = new ObjectId()
    const inactiveId = new ObjectId()
    await getDbCollection("jobs_partners").insertMany([makeOffer(cfaId), makeOffer(inactiveId)])
    await getDbCollection("rolemanagement360").insertMany([
      makeContact(cfaId, { role_authorized_type: AccessEntityType.CFA }),
      makeContact(inactiveId, { user_last_status: UserEventType.DESACTIVE }),
    ])

    await nurturingEntreprises()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("ne relance pas deux fois (offre pivot déjà marquée)", async () => {
    const userId = new ObjectId()
    await getDbCollection("jobs_partners").insertOne(makeOffer(userId, { relance_mail_nurturing: new Date("2026-07-15") }))
    await getDbCollection("rolemanagement360").insertOne(makeContact(userId))

    await nurturingEntreprises()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("n'envoie rien en août (relances reportées)", async () => {
    vi.setSystemTime(new Date("2026-08-15T07:00:00Z"))
    const userId = new ObjectId()
    // offre dont l'anniversaire J+330 tombe le 15 août 2026
    await getDbCollection("jobs_partners").insertOne(makeOffer(userId, { offer_creation: new Date("2025-09-19T10:00:00Z"), offer_expiration: new Date("2025-11-19") }))
    await getDbCollection("rolemanagement360").insertOne(makeContact(userId))

    await nurturingEntreprises()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("rattrape les anniversaires d'août le 1er septembre", async () => {
    vi.setSystemTime(new Date("2026-09-01T07:00:00Z"))
    const userId = new ObjectId()
    // anniversaire J+330 tombé le 16 août 2026 → rattrapé le 1er septembre
    await getDbCollection("jobs_partners").insertOne(makeOffer(userId, { offer_creation: new Date("2025-09-20T10:00:00Z"), offer_expiration: new Date("2025-11-20") }))
    await getDbCollection("rolemanagement360").insertOne(makeContact(userId))

    await nurturingEntreprises()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
    const [, rows] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(rows).toHaveLength(1)
  })
})
