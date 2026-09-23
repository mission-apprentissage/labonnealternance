import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import type { IApplicant } from "shared/models/index"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { anonymizeApplicantsAndApplications } from "./anonymize-applicant-and-applications"

vi.mock("@/common/utils/aws-utils", () => ({
  s3Delete: vi.fn().mockResolvedValue(undefined),
  s3WriteString: vi.fn(),
  s3ReadAsString: vi.fn(),
  s3ReadAsStream: vi.fn(),
  s3SignedUrl: vi.fn(),
  getS3FileLastUpdate: vi.fn(),
}))
vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/sentry-utils", () => ({ sentryCaptureException: vi.fn() }))

const s3DeleteSpy = vi.mocked(s3Delete)
const slackSpy = vi.mocked(notifyToSlack)

const NOW = new Date("2026-06-15T00:10:00.000Z")
const RECENT = new Date("2026-01-15T00:00:00.000Z")
const OLD = new Date("2023-06-15T00:00:00.000Z")

const insertApplicant = async (last_connection: Date) => {
  const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr`, last_connection })
  await getDbCollection("applicants").insertOne(applicant)
  return applicant
}

const insertApplication = async (applicant: IApplicant, data: Parameters<typeof generateApplicationFixture>[0] = {}) => {
  const application = generateApplicationFixture({ applicant_id: applicant._id, ...data })
  await getDbCollection("applications").insertOne(application)
  return application
}

describe("anonymizeApplicantsAndApplications", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
    s3DeleteSpy.mockReset()
    s3DeleteSpy.mockResolvedValue(undefined)
    slackSpy.mockReset()
    slackSpy.mockResolvedValue(undefined)
    return async () => vi.useRealTimers()
  })

  it("ne touche pas à un candidat actif, même avec une vieille candidature", async () => {
    const applicant = await insertApplicant(RECENT)
    const application = await insertApplication(applicant, { created_at: OLD, applicant_attachment_deleted_at: null })

    await anonymizeApplicantsAndApplications()

    // Ce job ne regarde que last_connection : l'âge de la candidature ne le concerne pas.
    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(1)
    expect(await getDbCollection("applicants").countDocuments({ _id: applicant._id })).toBe(1)
  })

  it("n'appelle pas S3 quand le CV a déjà été purgé", async () => {
    const applicant = await insertApplicant(OLD)
    const application = await insertApplication(applicant, { applicant_attachment_deleted_at: new Date("2025-01-01T00:00:00.000Z") })

    await anonymizeApplicantsAndApplications()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
    expect(await getDbCollection("applicants").countDocuments({ _id: applicant._id })).toBe(0)
  })

  it("supprime les CV AVANT les documents, pour les deux candidatures du candidat", async () => {
    const applicant = await insertApplicant(OLD)
    const app1 = await insertApplication(applicant, { applicant_attachment_deleted_at: null })
    const app2 = await insertApplication(applicant, { applicant_attachment_deleted_at: null })

    let documentsPresentsPendantS3 = -1
    s3DeleteSpy.mockImplementation(async () => {
      documentsPresentsPendantS3 = await getDbCollection("applications").countDocuments({ applicant_id: applicant._id })
    })

    await anonymizeApplicantsAndApplications()

    expect(s3DeleteSpy).toHaveBeenCalledTimes(2)
    expect(s3DeleteSpy.mock.calls.map(([, key]) => key).sort()).toEqual([`cv-${app1._id}`, `cv-${app2._id}`].sort())
    expect(documentsPresentsPendantS3).toBe(2)
    expect(await getDbCollection("applications").countDocuments({ applicant_id: applicant._id })).toBe(0)
  })

  it("ne fuit pas sur les candidatures d'un candidat non éligible", async () => {
    const inactif = await insertApplicant(OLD)
    const actif = await insertApplicant(RECENT)
    const aPurger = await insertApplication(inactif, { applicant_attachment_deleted_at: null })
    const aConserver = await insertApplication(actif, { applicant_attachment_deleted_at: null })

    await anonymizeApplicantsAndApplications()

    expect(s3DeleteSpy).toHaveBeenCalledTimes(1)
    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${aPurger._id}`)
    expect(await getDbCollection("applications").countDocuments({ _id: aConserver._id })).toBe(1)
  })

  it("traite un candidat inactif sans aucune candidature sans planter", async () => {
    const applicant = await insertApplicant(OLD)

    await expect(anonymizeApplicantsAndApplications()).resolves.not.toThrow()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await getDbCollection("applicants").countDocuments({ _id: applicant._id })).toBe(0)
  })

  it("anonymise quand même et alerte quand la suppression S3 échoue", async () => {
    const applicant = await insertApplicant(OLD)
    const application = await insertApplication(applicant, { applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))

    await anonymizeApplicantsAndApplications()

    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
    const degrade = slackSpy.mock.calls.find(([arg]) => arg.error === true)
    expect(degrade?.[0].message).toContain(`cv-${application._id}`)
  })
})
