import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { EMAIL_LOG_TYPE } from "shared/models/applicantEmailLog.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { relanceIncitationSpontanee } from "./relanceIncitationSpontanee"
import { buildTaggedSearchUrl } from "./relanceSearchUrl"

vi.mock("@/services/brevo.service", () => ({ uploadContactListToBrevo: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/slackUtils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

const BASE_URL = "https://labonnealternance.apprentissage.beta.gouv.fr"

describe("buildTaggedSearchUrl (highlightRecruteursLba)", () => {
  it("ajoute scrollToRecruteursLba=true et l'utm demandé", () => {
    const result = buildTaggedSearchUrl(`${BASE_URL}/recherche?romes=E1401&scrollToRecruteursLba=false`, {
      utmCampaign: "relance-incitation-spontanee",
      highlightRecruteursLba: true,
    })
    const url = new URL(result as string)
    expect(url.searchParams.get("scrollToRecruteursLba")).toBe("true")
    expect(url.searchParams.get("utm_campaign")).toBe("relance-incitation-spontanee")
    expect(url.searchParams.get("utm_source")).toBe("lba-brevo")
  })

  it("n'ajoute pas scrollToRecruteursLba quand l'option est absente", () => {
    const result = buildTaggedSearchUrl(`${BASE_URL}/recherche?romes=E1401`, { utmCampaign: "x" })
    expect(new URL(result as string).searchParams.has("scrollToRecruteursLba")).toBe(false)
  })
})

const makeApplicant = (over: Parameters<typeof generateApplicantFixture>[0] = {}) =>
  generateApplicantFixture({ email: `alex-${new ObjectId().toHexString()}@example.com`, ...over })

const makeApplication = (applicantId: ObjectId, over: Parameters<typeof generateApplicationFixture>[0] = {}) =>
  generateApplicationFixture({
    applicant_id: applicantId,
    application_url: `${BASE_URL}/recherche?romes=E1401&lat=43.282&lon=5.405&address=Marseille+13001`,
    job_searched_by_user: "Communication, marketing, publicité",
    ...over,
  })

describe("relanceIncitationSpontanee", () => {
  useMongo()

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-07-09T09:00:00Z"))
    vi.mocked(uploadContactListToBrevo).mockClear()
    return async () => {
      vi.useRealTimers()
      await getDbCollection("applicants").deleteMany({})
      await getDbCollection("applications").deleteMany({})
      await getDbCollection("applicants_email_logs").deleteMany({})
    }
  })

  it("pousse les inactifs J+7 SANS candidature spontanée vers Brevo, avec CTA scrollToRecruteursLba, et logue la relance", async () => {
    const onlyOffers = makeApplicant({ last_connection: new Date("2026-07-02T12:00:00Z"), firstname: "Inès" })
    await getDbCollection("applicants").insertOne(onlyOffers)
    await getDbCollection("applications").insertOne(makeApplication(onlyOffers._id, { created_at: new Date("2026-07-02T12:00:00Z"), job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA }))

    await relanceIncitationSpontanee()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
    const [account, rows, , listId] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(account).toBe("MARKETING")
    expect(listId).toBe("998")
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe(onlyOffers.email)
    expect(rows[0].lien_recherche).toContain("scrollToRecruteursLba=true")
    expect(rows[0].lien_recherche).toContain("utm_campaign=relance-incitation-spontanee")

    const logs = await getDbCollection("applicants_email_logs").find({ applicant_id: onlyOffers._id, type: EMAIL_LOG_TYPE.RELANCE_INCITATION_SPONTANEE }).toArray()
    expect(logs).toHaveLength(1)
  })

  it("exclut les inactifs ayant DÉJÀ fait une candidature spontanée (ils relèvent de la liste A)", async () => {
    const hasSpontaneous = makeApplicant({ last_connection: new Date("2026-07-02T12:00:00Z") })
    await getDbCollection("applicants").insertOne(hasSpontaneous)
    // fixture par défaut : job_origin = recruteurs_lba (spontanée)
    await getDbCollection("applications").insertOne(makeApplication(hasSpontaneous._id, { created_at: new Date("2026-07-02T12:00:00Z") }))

    await relanceIncitationSpontanee()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("exclut les candidats déjà relancés sur cette liste", async () => {
    const alreadyRelaunched = makeApplicant({ last_connection: new Date("2026-07-02T12:00:00Z") })
    await getDbCollection("applicants").insertOne(alreadyRelaunched)
    await getDbCollection("applications").insertOne(
      makeApplication(alreadyRelaunched._id, { created_at: new Date("2026-07-02T12:00:00Z"), job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA })
    )
    await getDbCollection("applicants_email_logs").insertOne({
      _id: new ObjectId(),
      applicant_id: alreadyRelaunched._id,
      application_id: null,
      type: EMAIL_LOG_TYPE.RELANCE_INCITATION_SPONTANEE,
      message_id: null,
      createdAt: new Date("2026-07-03"),
    })

    await relanceIncitationSpontanee()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })
})
