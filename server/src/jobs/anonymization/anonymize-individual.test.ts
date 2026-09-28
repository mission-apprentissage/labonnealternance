import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import type { IApplicant } from "shared/models/index"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import anonymizeIndividual from "./anonymize-individual"

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

const insertApplicant = async () => {
  const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
  await getDbCollection("applicants").insertOne(applicant)
  return applicant
}

const insertApplication = async (applicant: IApplicant, data: Parameters<typeof generateApplicationFixture>[0] = {}) => {
  const application = generateApplicationFixture({ applicant_id: applicant._id, ...data })
  await getDbCollection("applications").insertOne(application)
  return application
}

describe("anonymizeIndividual — droit à l'effacement", () => {
  useMongo()

  beforeEach(() => {
    s3DeleteSpy.mockReset()
    s3DeleteSpy.mockResolvedValue(undefined)
  })

  it("ne touche pas aux candidatures d'un autre candidat", async () => {
    const cible = await insertApplicant()
    await insertApplication(cible, { applicant_attachment_deleted_at: null })
    const autre = await insertApplicant()
    const aConserver = await insertApplication(autre, { applicant_attachment_deleted_at: null })

    await anonymizeIndividual({ collection: "applications", id: cible._id })

    expect(s3DeleteSpy).toHaveBeenCalledTimes(1)
    expect(s3DeleteSpy).not.toHaveBeenCalledWith("applications", `cv-${aConserver._id}`)
    expect(await getDbCollection("applications").countDocuments({ _id: aConserver._id })).toBe(1)
    expect(await getDbCollection("applicants").countDocuments({ _id: autre._id })).toBe(1)
  })

  it("n'appelle pas S3 quand le CV a déjà été purgé", async () => {
    const applicant = await insertApplicant()
    const application = await insertApplication(applicant, { applicant_attachment_deleted_at: new Date("2025-01-01T00:00:00.000Z") })

    await anonymizeIndividual({ collection: "applications", id: applicant._id })

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
    expect(await getDbCollection("applicants").countDocuments({ _id: applicant._id })).toBe(0)
  })

  it("supprime le CV AVANT les documents", async () => {
    const applicant = await insertApplicant()
    const application = await insertApplication(applicant, { applicant_attachment_deleted_at: null })

    let documentsPresentsPendantS3 = -1
    s3DeleteSpy.mockImplementation(async () => {
      documentsPresentsPendantS3 = await getDbCollection("applications").countDocuments({ _id: application._id })
    })

    await anonymizeIndividual({ collection: "applications", id: applicant._id })

    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
    expect(documentsPresentsPendantS3).toBe(1)
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
  })

  it("n'efface rien du tout quand la suppression S3 échoue, pour permettre la reprise", async () => {
    const applicant = await insertApplicant()
    const application = await insertApplication(applicant, { applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))

    await expect(anonymizeIndividual({ collection: "applications", id: applicant._id })).rejects.toThrow(/reprise/)

    // Tout doit être dans son état initial : le document porte la seule clé S3 calculable, et un
    // $merge partiel recréerait un doublon anonymisé au rejeu.
    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(1)
    expect(await getDbCollection("applicants").countDocuments({ _id: applicant._id })).toBe(1)
    expect(await getDbCollection("anonymized_applications").countDocuments({})).toBe(0)
    expect(await getDbCollection("anonymized_applicants").countDocuments({})).toBe(0)
  })

  it("rejoue proprement après un échec S3 transitoire", async () => {
    const applicant = await insertApplicant()
    const application = await insertApplication(applicant, { applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockRejectedValueOnce(new Error("S3 indisponible"))
    await expect(anonymizeIndividual({ collection: "applications", id: applicant._id })).rejects.toThrow()

    await anonymizeIndividual({ collection: "applications", id: applicant._id })

    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(0)
    expect(await getDbCollection("anonymized_applicants").countDocuments({})).toBe(1)
  })
})
