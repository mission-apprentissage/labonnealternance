import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { deleteCvFilesForApplications } from "./application-cv.service"

vi.mock("@/common/utils/aws-utils", () => ({
  s3Delete: vi.fn().mockResolvedValue(undefined),
  s3WriteString: vi.fn(),
  s3ReadAsString: vi.fn(),
  s3ReadAsStream: vi.fn(),
  s3SignedUrl: vi.fn(),
  getS3FileLastUpdate: vi.fn(),
}))
vi.mock("@/common/utils/sentry-utils", () => ({ sentryCaptureException: vi.fn() }))
vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

useMongo()

const s3DeleteSpy = vi.mocked(s3Delete)
const sentrySpy = vi.mocked(sentryCaptureException)

// applicants.email porte un index unique : un email distinct par candidat, sinon les tests qui en
// insèrent plusieurs tombent sur un E11000 sans rapport avec ce qu'ils vérifient.
const insertApplication = async (data: Parameters<typeof generateApplicationFixture>[0]) => {
  const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
  await getDbCollection("applicants").insertOne(applicant)
  const application = generateApplicationFixture({ applicant_id: applicant._id, ...data })
  await getDbCollection("applications").insertOne(application)
  return application
}

describe("deleteCvFilesForApplications", () => {
  beforeEach(() => {
    s3DeleteSpy.mockReset()
    s3DeleteSpy.mockResolvedValue(undefined)
    sentrySpy.mockReset()
  })

  // Les cas qui doivent répondre NON en premier : c'est là que se cachent les suppressions de CV
  // encore sous rétention.
  it("ne supprime rien pour une candidature hors du filtre", async () => {
    const siretCible = "11111111111111"
    await insertApplication({ company_siret: "99999999999999", applicant_attachment_deleted_at: null })

    const report = await deleteCvFilesForApplications({ company_siret: siretCible }, { context: "test" })

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(report).toEqual({ attempted: 0, deleted: 0, failedKeys: [], remaining: 0 })
  })

  it("ne supprime rien, et ne réécrit pas la date, pour un CV déjà purgé", async () => {
    const dejaPurge = new Date("2025-03-01T10:00:00.000Z")
    const application = await insertApplication({ applicant_attachment_deleted_at: dejaPurge })

    const report = await deleteCvFilesForApplications({ _id: application._id }, { context: "test" })

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(report.attempted).toBe(0)
    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updated?.applicant_attachment_deleted_at).toEqual(dejaPurge)
  })

  it("supprime le CV et pose la date quand le filtre matche et que le CV n'est pas purgé", async () => {
    const application = await insertApplication({ applicant_attachment_deleted_at: null })

    const report = await deleteCvFilesForApplications({ _id: application._id }, { context: "test" })

    expect(s3DeleteSpy).toHaveBeenCalledTimes(1)
    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
    expect(report).toMatchObject({ attempted: 1, deleted: 1, failedKeys: [] })
    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updated?.applicant_attachment_deleted_at).toBeInstanceOf(Date)
  })

  it("ne supprime pas le document de la candidature", async () => {
    const application = await insertApplication({ applicant_attachment_deleted_at: null })

    await deleteCvFilesForApplications({ _id: application._id }, { context: "test" })

    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(1)
  })

  it("laisse la date à null sur un échec S3, sans interrompre le reste du lot", async () => {
    const enEchec = await insertApplication({ applicant_attachment_deleted_at: null })
    const ok1 = await insertApplication({ applicant_attachment_deleted_at: null })
    const ok2 = await insertApplication({ applicant_attachment_deleted_at: null })

    s3DeleteSpy.mockImplementation(async (_bucket, key) => {
      if (key === `cv-${enEchec._id}`) throw new Error("S3 indisponible")
    })

    const report = await deleteCvFilesForApplications({ _id: { $in: [enEchec._id, ok1._id, ok2._id] } }, { context: "test" })

    expect(report.attempted).toBe(3)
    expect(report.deleted).toBe(2)
    expect(report.failedKeys).toEqual([`cv-${enEchec._id}`])
    expect(sentrySpy).toHaveBeenCalledTimes(1)

    const failed = await getDbCollection("applications").findOne({ _id: enEchec._id })
    expect(failed?.applicant_attachment_deleted_at).toBeNull()
    for (const { _id } of [ok1, ok2]) {
      const updated = await getDbCollection("applications").findOne({ _id })
      expect(updated?.applicant_attachment_deleted_at).toBeInstanceOf(Date)
    }
  })

  it("rejoue au passage suivant la candidature laissée en échec", async () => {
    const application = await insertApplication({ applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockRejectedValueOnce(new Error("S3 indisponible"))
    await deleteCvFilesForApplications({ _id: application._id }, { context: "test" })

    const report = await deleteCvFilesForApplications({ _id: application._id }, { context: "test" })

    expect(report).toMatchObject({ attempted: 1, deleted: 1, failedKeys: [] })
    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updated?.applicant_attachment_deleted_at).toBeInstanceOf(Date)
  })

  it("traite tout le lot quand il dépasse batchSize, dernier lot partiel compris", async () => {
    const ids: ObjectId[] = []
    for (let i = 0; i < 5; i++) {
      const application = await insertApplication({ applicant_attachment_deleted_at: null })
      ids.push(application._id)
    }

    const report = await deleteCvFilesForApplications({ _id: { $in: ids } }, { context: "test", batchSize: 2 })

    expect(s3DeleteSpy).toHaveBeenCalledTimes(5)
    expect(report).toMatchObject({ attempted: 5, deleted: 5, failedKeys: [] })
    expect(await getDbCollection("applications").countDocuments({ _id: { $in: ids }, applicant_attachment_deleted_at: null })).toBe(0)
  })

  it("plafonne les remontées Sentry sans tronquer le rapport", async () => {
    const ids: ObjectId[] = []
    for (let i = 0; i < 15; i++) {
      const application = await insertApplication({ applicant_attachment_deleted_at: null })
      ids.push(application._id)
    }
    s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))

    const report = await deleteCvFilesForApplications({ _id: { $in: ids } }, { context: "test" })

    expect(report.failedKeys).toHaveLength(15)
    expect(sentrySpy).toHaveBeenCalledTimes(10)
  })

  it("ne touche ni S3 ni la base en dry-run", async () => {
    const application = await insertApplication({ applicant_attachment_deleted_at: null })

    const report = await deleteCvFilesForApplications({ _id: application._id }, { context: "test", dryRun: true })

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    // deleted ne compte que les suppressions réelles ; le volume simulé est dans attempted.
    expect(report).toMatchObject({ attempted: 1, deleted: 0 })
    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updated?.applicant_attachment_deleted_at).toBeNull()
  })

  it("s'arrête sur le budget temps et rapporte le reliquat", async () => {
    const ids: ObjectId[] = []
    for (let i = 0; i < 4; i++) {
      const application = await insertApplication({ applicant_attachment_deleted_at: null })
      ids.push(application._id)
    }

    // Budget déjà épuisé : la boucle sort avant le premier lot.
    const report = await deleteCvFilesForApplications({ _id: { $in: ids } }, { context: "test", timeoutTs: Date.now() - 1 })

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(report).toMatchObject({ attempted: 0, deleted: 0, remaining: 4 })
  })

  it("ne rapporte aucun reliquat quand le budget suffit", async () => {
    const application = await insertApplication({ applicant_attachment_deleted_at: null })

    const report = await deleteCvFilesForApplications({ _id: application._id }, { context: "test", timeoutTs: Date.now() + 60_000 })

    expect(report).toMatchObject({ attempted: 1, deleted: 1, remaining: 0 })
  })
})
