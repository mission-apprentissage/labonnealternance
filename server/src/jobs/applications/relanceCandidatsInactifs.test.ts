import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { EMAIL_LOG_TYPE } from "shared/models/applicantEmailLog.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { buildRelanceSearchUrl, relanceCandidatsInactifs } from "./relanceCandidatsInactifs"

vi.mock("@/services/brevo.service", () => ({ uploadContactListToBrevo: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/slackUtils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

const BASE_URL = "https://labonnealternance.apprentissage.beta.gouv.fr"

describe("buildRelanceSearchUrl", () => {
  it("réécrit et re-tague une URL de recherche exploitable", () => {
    const result = buildRelanceSearchUrl(`${BASE_URL}/recherche?romes=E1401,E1402&lat=43.282&lon=5.405&address=Marseille+13001&utm_source=old`)
    expect(result).not.toBeNull()
    const url = new URL(result as string)
    expect(url.pathname).toBe("/recherche")
    expect(url.searchParams.get("romes")).toBe("E1401,E1402")
    expect(url.searchParams.get("address")).toBe("Marseille 13001")
    expect(url.searchParams.get("utm_source")).toBe("lba-brevo")
    expect(url.searchParams.get("utm_campaign")).toBe("relance-candidat-inactif")
  })

  it("réécrit un pathname /emploi/ vers /recherche", () => {
    const result = buildRelanceSearchUrl(`${BASE_URL}/emploi/abc?romes=E1401`)
    expect(new URL(result as string).pathname).toBe("/recherche")
  })

  it("retourne null si aucun métier (romes/rncp) exploitable", () => {
    expect(buildRelanceSearchUrl(`${BASE_URL}/recherche?address=Marseille`)).toBeNull()
  })

  it("retourne null pour une URL absente ou invalide", () => {
    expect(buildRelanceSearchUrl(null)).toBeNull()
    expect(buildRelanceSearchUrl(undefined)).toBeNull()
    expect(buildRelanceSearchUrl("pas-une-url")).toBeNull()
  })

  it("retire aussi utm_content et utm_term capturés dans l'URL d'origine", () => {
    const result = buildRelanceSearchUrl(`${BASE_URL}/recherche?romes=E1401&utm_content=abc&utm_term=xyz`)
    const url = new URL(result as string)
    expect(url.searchParams.has("utm_content")).toBe(false)
    expect(url.searchParams.has("utm_term")).toBe(false)
    expect(url.searchParams.get("utm_campaign")).toBe("relance-candidat-inactif")
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

describe("relanceCandidatsInactifs", () => {
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

  it("pousse les candidats de la fenêtre J+7 vers Brevo et logue la relance", async () => {
    // dernière candidature le jour calendaire J-7 (heure de Paris) → dans la fenêtre
    const inWindow = makeApplicant({ last_connection: new Date("2026-07-02T12:00:00Z"), firstname: "Inès" })
    await getDbCollection("applicants").insertOne(inWindow)
    await getDbCollection("applications").insertOne(makeApplication(inWindow._id, { created_at: new Date("2026-07-02T12:00:00Z") }))

    await relanceCandidatsInactifs()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
    const [account, rows, , listId] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(account).toBe("MARKETING")
    expect(listId).toBe("999")
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe(inWindow.email)
    expect(rows[0].firstname).toBe("Inès")
    expect(rows[0].metier).toBe("Communication, marketing, publicité")
    expect(rows[0].lien_recherche).toContain("/recherche?")
    expect(rows[0].lien_recherche).toContain("utm_campaign=relance-candidat-inactif")

    const logs = await getDbCollection("applicants_email_logs").find({ applicant_id: inWindow._id, type: EMAIL_LOG_TYPE.RELANCE_INACTIVITE }).toArray()
    expect(logs).toHaveLength(1)
  })

  it("exclut les candidats hors fenêtre et ceux déjà relancés", async () => {
    // hors fenêtre : dernière candidature hier
    const tooRecent = makeApplicant({ last_connection: new Date("2026-07-08T09:00:00Z") })
    await getDbCollection("applicants").insertOne(tooRecent)
    await getDbCollection("applications").insertOne(makeApplication(tooRecent._id, { created_at: new Date("2026-07-08T09:00:00Z") }))

    // dans la fenêtre mais déjà relancé
    const alreadyRelaunched = makeApplicant({ last_connection: new Date("2026-07-02T12:00:00Z") })
    await getDbCollection("applicants").insertOne(alreadyRelaunched)
    await getDbCollection("applications").insertOne(makeApplication(alreadyRelaunched._id, { created_at: new Date("2026-07-02T12:00:00Z") }))
    await getDbCollection("applicants_email_logs").insertOne({
      _id: new ObjectId(),
      applicant_id: alreadyRelaunched._id,
      application_id: null,
      type: EMAIL_LOG_TYPE.RELANCE_INACTIVITE,
      message_id: null,
      createdAt: new Date("2026-07-02"),
    })

    await relanceCandidatsInactifs()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("laisse LIEN_RECHERCHE vide quand l'URL n'est pas exploitable (CTA générique)", async () => {
    const generic = makeApplicant({ last_connection: new Date("2026-07-02T12:00:00Z") })
    await getDbCollection("applicants").insertOne(generic)
    await getDbCollection("applications").insertOne(makeApplication(generic._id, { created_at: new Date("2026-07-02T12:00:00Z"), application_url: null }))

    await relanceCandidatsInactifs()

    const [, rows] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(rows[0].lien_recherche).toBe("")
  })
})
