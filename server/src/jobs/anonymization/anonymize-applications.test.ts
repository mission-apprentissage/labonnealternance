import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { anonymizeApplications } from "./anonymize-applications"

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

const NOW = new Date("2026-06-15T00:15:00.000Z")
const yearsAgo = (years: number) => new Date(Date.UTC(NOW.getUTCFullYear() - years, NOW.getUTCMonth(), NOW.getUTCDate()))

const insertApplication = async (data: Parameters<typeof generateApplicationFixture>[0]) => {
  const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
  await getDbCollection("applicants").insertOne(applicant)
  const application = generateApplicationFixture({ applicant_id: applicant._id, ...data })
  await getDbCollection("applications").insertOne(application)
  return application
}

describe("anonymizeApplications", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
    s3DeleteSpy.mockReset()
    s3DeleteSpy.mockResolvedValue(undefined)
    slackSpy.mockReset()
    slackSpy.mockResolvedValue(undefined)
    return async () => {
      vi.useRealTimers()
      // Collection non déclarée dans les modèles : clearAllCollections la couvre, mais on la vide
      // explicitement pour ne pas dépendre de cet effet de bord.
      await getDatabase().collection("anonymizedapplications").deleteMany({})
    }
  })

  it("ne touche pas à une candidature de six mois", async () => {
    const application = await insertApplication({ created_at: new Date("2026-01-15T00:00:00.000Z"), applicant_attachment_deleted_at: null })

    await anonymizeApplications()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(1)
  })

  it("anonymise sans appel S3 une candidature dont le CV a déjà été purgé", async () => {
    const application = await insertApplication({ created_at: yearsAgo(3), applicant_attachment_deleted_at: new Date("2025-01-01T00:00:00.000Z") })

    await anonymizeApplications()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
    expect(await getDatabase().collection("anonymizedapplications").countDocuments({})).toBe(1)
  })

  it("supprime le CV AVANT le document, tant que la clé est encore calculable", async () => {
    const application = await insertApplication({ created_at: yearsAgo(3), applicant_attachment_deleted_at: null })

    let documentsPresentsPendantS3 = -1
    s3DeleteSpy.mockImplementation(async () => {
      documentsPresentsPendantS3 = await getDbCollection("applications").countDocuments({ _id: application._id })
    })

    await anonymizeApplications()

    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
    // Purger après le deleteMany rendrait la clé cv-<_id> incalculable.
    expect(documentsPresentsPendantS3).toBe(1)
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
  })

  it("anonymise quand même et alerte quand la suppression S3 échoue", async () => {
    const application = await insertApplication({ created_at: yearsAgo(3), applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))

    await anonymizeApplications()

    // La rétention de données personnelles au-delà du délai légal est le risque le plus large :
    // on supprime le document et on rend l'orphelin visible.
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
    const degrade = slackSpy.mock.calls.find(([arg]) => arg.error === true)
    expect(degrade?.[0].message).toContain(`cv-${application._id}`)
  })
})
