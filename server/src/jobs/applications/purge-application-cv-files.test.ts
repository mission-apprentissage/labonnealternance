import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { ApplicationScanStatus } from "shared/models/index"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { purgeApplicationCvFiles } from "./purge-application-cv-files"

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

// Fenêtre sans 29 février entre NOW - 1 an et NOW : 1 an = exactement 365 jours.
const NOW = new Date("2026-06-15T00:25:00.000Z")
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 3600 * 1000)

const insertApplication = async (data: Parameters<typeof generateApplicationFixture>[0]) => {
  const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
  await getDbCollection("applicants").insertOne(applicant)
  const application = generateApplicationFixture({ applicant_id: applicant._id, ...data })
  await getDbCollection("applications").insertOne(application)
  return application
}

const deletedAtOf = async (_id: ObjectId) => (await getDbCollection("applications").findOne({ _id }))?.applicant_attachment_deleted_at

describe("purgeApplicationCvFiles", () => {
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
      await getDbCollection("applications").deleteMany({})
      await getDbCollection("applicants").deleteMany({})
    }
  })

  // Les cas qui doivent répondre NON en premier.
  it("ne purge pas une candidature de 364 jours", async () => {
    const application = await insertApplication({ created_at: daysAgo(364), applicant_attachment_deleted_at: null })

    const report = await purgeApplicationCvFiles()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(report.deleted).toBe(0)
    expect(await deletedAtOf(application._id)).toBeNull()
  })

  it("ne purge pas une candidature dont le CV l'a déjà été", async () => {
    const dejaPurge = new Date("2025-01-01T00:00:00.000Z")
    const application = await insertApplication({ created_at: daysAgo(400), applicant_attachment_deleted_at: dejaPurge })

    await purgeApplicationCvFiles()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await deletedAtOf(application._id)).toEqual(dejaPurge)
  })

  it("ignore une candidature à created_at null sans planter", async () => {
    const application = await insertApplication({ created_at: null, applicant_attachment_deleted_at: null })

    const report = await purgeApplicationCvFiles()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(report.deleted).toBe(0)
    expect(await deletedAtOf(application._id)).toBeNull()
  })

  it("ne purge pas un CV infecté déjà supprimé", async () => {
    const dejaPurge = new Date("2026-06-14T00:00:00.000Z")
    await insertApplication({ created_at: daysAgo(1), scan_status: ApplicationScanStatus.VIRUS_DETECTED, applicant_attachment_deleted_at: dejaPurge })

    await purgeApplicationCvFiles()

    expect(s3DeleteSpy).not.toHaveBeenCalled()
  })

  it("purge à la borne exacte de 365 jours", async () => {
    const application = await insertApplication({ created_at: daysAgo(365), applicant_attachment_deleted_at: null })

    const report = await purgeApplicationCvFiles()

    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
    expect(report.deleted).toBe(1)
    expect(await deletedAtOf(application._id)).toEqual(NOW)
  })

  it("purge une candidature de 366 jours", async () => {
    const application = await insertApplication({ created_at: daysAgo(366), applicant_attachment_deleted_at: null })

    await purgeApplicationCvFiles()

    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
  })

  it("purge un CV infecté récent, sans attendre un an", async () => {
    const application = await insertApplication({ created_at: daysAgo(1), scan_status: ApplicationScanStatus.VIRUS_DETECTED, applicant_attachment_deleted_at: null })

    await purgeApplicationCvFiles()

    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
    expect(await deletedAtOf(application._id)).toEqual(NOW)
  })

  it("ne supprime jamais les documents des candidatures", async () => {
    const application = await insertApplication({ created_at: daysAgo(400), applicant_attachment_deleted_at: null })

    await purgeApplicationCvFiles()

    expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(1)
  })

  it("signale un échec partiel sur Slack sans échouer le job", async () => {
    const enEchec = await insertApplication({ created_at: daysAgo(400), applicant_attachment_deleted_at: null })
    const ok = await insertApplication({ created_at: daysAgo(400), applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockImplementation(async (_bucket, key) => {
      if (key === `cv-${enEchec._id}`) throw new Error("S3 indisponible")
    })

    const report = await purgeApplicationCvFiles()

    expect(report.deleted).toBe(1)
    expect(report.failedKeys).toEqual([`cv-${enEchec._id}`])
    expect(await deletedAtOf(enEchec._id)).toBeNull()
    expect(await deletedAtOf(ok._id)).toEqual(NOW)

    const degrade = slackSpy.mock.calls.find(([arg]) => arg.error === true)
    expect(degrade?.[0].message).toContain(`cv-${enEchec._id}`)
  })

  it("échoue franchement quand il y avait du travail et qu'aucune suppression n'a abouti", async () => {
    await insertApplication({ created_at: daysAgo(400), applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))

    await expect(purgeApplicationCvFiles()).rejects.toThrow(/aucune réussie/)
    expect(slackSpy).toHaveBeenCalledWith(expect.objectContaining({ message: "ECHEC de la purge des CV", error: true }))
  })

  it("ne poste rien sur Slack quand il n'y a rien à purger", async () => {
    const report = await purgeApplicationCvFiles()

    expect(report).toMatchObject({ deleted: 0, failedKeys: [] })
    // Le cron ne trouvera du travail qu'au bout d'un an : pas de "0 CV supprimé" chaque nuit.
    expect(slackSpy).not.toHaveBeenCalled()
  })

  it("rend terminale une candidature ancienne encore reprise par le scan", async () => {
    const application = await insertApplication({ created_at: daysAgo(400), scan_status: ApplicationScanStatus.WAITING_FOR_SCAN, applicant_attachment_deleted_at: null })

    const report = await purgeApplicationCvFiles()

    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    // Sinon processApplications la reprendrait toutes les 10 min sur un fichier absent.
    expect(updated?.scan_status).toBe(ApplicationScanStatus.CV_PURGED)
    expect(report.markedUnprocessable).toBe(1)
  })

  it("rend terminale une candidature ancienne dont le mail candidat n'est jamais parti", async () => {
    const application = await insertApplication({
      created_at: daysAgo(400),
      scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
      to_applicant_message_id: null,
      applicant_attachment_deleted_at: null,
    })

    await purgeApplicationCvFiles()

    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updated?.scan_status).toBe(ApplicationScanStatus.CV_PURGED)
  })

  it("ne rend pas terminale une candidature déjà envoyée", async () => {
    const application = await insertApplication({
      created_at: daysAgo(400),
      scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
      to_applicant_message_id: "<msg@lba.fr>",
      applicant_attachment_deleted_at: null,
    })

    const report = await purgeApplicationCvFiles()

    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updated?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    expect(report.markedUnprocessable).toBe(0)
  })

  it("ne rend pas terminale une candidature dont la suppression S3 a échoué", async () => {
    const application = await insertApplication({ created_at: daysAgo(400), scan_status: ApplicationScanStatus.WAITING_FOR_SCAN, applicant_attachment_deleted_at: null })
    s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))

    await expect(purgeApplicationCvFiles()).rejects.toThrow()

    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    // Son CV est peut-être encore là : elle doit rester reprise pour être retentée.
    expect(updated?.scan_status).toBe(ApplicationScanStatus.WAITING_FOR_SCAN)
    expect(updated?.applicant_attachment_deleted_at).toBeNull()
  })

  it("refuse une date de coupure dans le futur", async () => {
    const application = await insertApplication({ created_at: daysAgo(10), applicant_attachment_deleted_at: null })

    await expect(purgeApplicationCvFiles({ before: "2027-01-01T00:00:00.000Z" })).rejects.toThrow(/futur/)
    expect(s3DeleteSpy).not.toHaveBeenCalled()
    expect(await deletedAtOf(application._id)).toBeNull()
  })

  it("refuse une date de coupure illisible", async () => {
    await expect(purgeApplicationCvFiles({ before: "hier" })).rejects.toThrow(/illisible/)
    expect(s3DeleteSpy).not.toHaveBeenCalled()
  })

  it("applique la date de coupure fournie", async () => {
    const application = await insertApplication({ created_at: new Date("2026-01-10T00:00:00.000Z"), applicant_attachment_deleted_at: null })

    await purgeApplicationCvFiles({ before: "2026-02-01T00:00:00.000Z" })

    expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
  })

  it("ne supprime rien en dry-run", async () => {
    const application = await insertApplication({ created_at: daysAgo(400), applicant_attachment_deleted_at: null })

    const report = await purgeApplicationCvFiles({ dryRun: true })

    expect(s3DeleteSpy).not.toHaveBeenCalled()
    // deleted ne compte que les suppressions réelles ; le volume simulé est dans attempted.
    expect(report).toMatchObject({ attempted: 1, deleted: 0 })
    expect(await deletedAtOf(application._id)).toBeNull()
  })

  it("ne rend rien terminal en dry-run", async () => {
    const application = await insertApplication({ created_at: daysAgo(400), scan_status: ApplicationScanStatus.WAITING_FOR_SCAN, applicant_attachment_deleted_at: null })

    const report = await purgeApplicationCvFiles({ dryRun: true })

    expect(report.markedUnprocessable).toBe(0)
    const updated = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updated?.scan_status).toBe(ApplicationScanStatus.WAITING_FOR_SCAN)
  })
})
