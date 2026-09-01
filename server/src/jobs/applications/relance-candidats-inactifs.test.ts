import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { EMAIL_LOG_TYPE } from "shared/models/applicant-email-log.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { buildRelanceSearchUrl, relanceCandidatsInactifs } from "./relance-candidats-inactifs"

vi.mock("@/services/brevo.service", () => ({ uploadContactListToBrevo: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

const BASE_URL = "https://labonnealternance.apprentissage.beta.gouv.fr"

// URL de candidature réelle depuis la bascule du nouveau moteur : fiche détail portant la
// recherche d'origine dans son `?from=`.
const NEW_ENGINE_APPLICATION_URL = `${BASE_URL}/emploi/offres_emploi_lba/abc123/boulanger?from=${encodeURIComponent("/recherche?q=Boulanger&lieu_label=Marseille 13001&latitude=43.282&longitude=5.405&page=2")}&utm_source=old`

describe("buildRelanceSearchUrl", () => {
  it("rejoue la recherche portée par le ?from= d'une fiche détail du nouveau moteur", () => {
    const result = buildRelanceSearchUrl(NEW_ENGINE_APPLICATION_URL)
    expect(result).not.toBeNull()
    const url = new URL(result as string)
    expect(url.pathname).toBe("/recherche")
    expect(url.searchParams.get("q")).toBe("Boulanger")
    expect(url.searchParams.get("lieu_label")).toBe("Marseille 13001")
    expect(url.searchParams.get("latitude")).toBe("43.282")
    expect(url.searchParams.get("utm_source")).toBe("lba-brevo")
    expect(url.searchParams.get("utm_campaign")).toBe("relance-candidat-inactif")
  })

  it("repart de la première page de résultats", () => {
    expect(new URL(buildRelanceSearchUrl(NEW_ENGINE_APPLICATION_URL) as string).searchParams.has("page")).toBe(false)
  })

  it("traduit une URL de recherche legacy (candidature d'avant la bascule)", () => {
    const result = buildRelanceSearchUrl(`${BASE_URL}/recherche?romes=E1401,E1402&job_name=Boulanger&lat=43.282&lon=5.405&address=Marseille+13001&utm_source=old`)
    const url = new URL(result as string)
    expect(url.pathname).toBe("/recherche")
    expect(url.searchParams.get("q")).toBe("Boulanger")
    expect(url.searchParams.get("lieu_label")).toBe("Marseille 13001")
    expect(url.searchParams.get("latitude")).toBe("43.282")
    // Les codes ROME ne sont pas compris par le nouveau moteur : ils ne doivent pas survivre.
    expect(url.searchParams.has("romes")).toBe(false)
    expect(url.searchParams.get("utm_source")).toBe("lba-brevo")
  })

  it("retourne null quand la fiche détail ne porte aucune recherche", () => {
    expect(buildRelanceSearchUrl(`${BASE_URL}/emploi/offres_emploi_lba/abc123/boulanger?utm_source=lba`)).toBeNull()
  })

  it("retourne null pour un romes seul : aucun libellé métier à rejouer", () => {
    expect(buildRelanceSearchUrl(`${BASE_URL}/recherche?romes=E1401`)).toBeNull()
  })

  it("retourne null pour un lieu sans coordonnées", () => {
    expect(buildRelanceSearchUrl(`${BASE_URL}/recherche?address=Marseille`)).toBeNull()
  })

  it("retourne null pour une URL absente ou invalide", () => {
    expect(buildRelanceSearchUrl(null)).toBeNull()
    expect(buildRelanceSearchUrl(undefined)).toBeNull()
    expect(buildRelanceSearchUrl("pas-une-url")).toBeNull()
  })

  it("retire aussi utm_content et utm_term capturés dans l'URL d'origine", () => {
    const result = buildRelanceSearchUrl(`${BASE_URL}/recherche?q=Boulanger&utm_content=abc&utm_term=xyz`)
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
    application_url: NEW_ENGINE_APPLICATION_URL,
    job_searched_by_user: "Communication, marketing, publicité",
    ...over,
  })

describe("relance-candidats-inactifs", () => {
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
    expect(rows[0].lien_recherche).toContain("q=Boulanger")
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
  it("exclut les inactifs qui n'ont jamais fait de candidature spontanée (pris en charge par la liste B)", async () => {
    const onlyOffers = makeApplicant({ last_connection: new Date("2026-07-02T12:00:00Z") })
    await getDbCollection("applicants").insertOne(onlyOffers)
    await getDbCollection("applications").insertOne(makeApplication(onlyOffers._id, { created_at: new Date("2026-07-02T12:00:00Z"), job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA }))

    await relanceCandidatsInactifs()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })
})
