import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import anonymizedApplicationsModel from "shared/models/anonymized-applications.model"
import { modelDescriptors } from "shared/models/models"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { modelToKeep } from "@/jobs/database/obfuscate-collections"
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

const listUndeclaredCollections = async () => {
  const declared = new Set<string>([...modelDescriptors.map(({ collectionName }) => collectionName), ...modelToKeep])
  const existing = await getDatabase().listCollections().toArray()
  return existing.map(({ name }) => name).filter((name) => !declared.has(name))
}

describe("anonymizeApplications", () => {
  useMongo()

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
    s3DeleteSpy.mockReset()
    s3DeleteSpy.mockResolvedValue(undefined)
    slackSpy.mockReset()
    slackSpy.mockResolvedValue(undefined)
    // `clearAllCollections` vide les collections mais ne les supprime pas : une collection hors
    // modèles laissée par un run précédent rendrait le garde-fou ci-dessous toujours rouge.
    for (const name of await listUndeclaredCollections()) {
      await getDatabase().dropCollection(name)
    }
    return () => {
      vi.useRealTimers()
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
    expect(await getDbCollection(anonymizedApplicationsModel.collectionName).countDocuments({})).toBe(1)
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

  it("écrit la candidature anonymisée dans la collection déclarée par le modèle", async () => {
    const application = await insertApplication({ created_at: yearsAgo(3), applicant_attachment_deleted_at: null })

    await anonymizeApplications()

    const anonymized = await getDbCollection(anonymizedApplicationsModel.collectionName).find({}).toArray()
    expect(anonymized).toHaveLength(1)
    expect(anonymized[0]._id).toEqual(application._id)
    expect(anonymized[0].company_siret).toBe(application.company_siret)
    // La projection ne doit laisser passer aucune donnée identifiante.
    expect(anonymized[0].company_email).toBeUndefined()
    expect(anonymized[0].applicant_message_to_company).toBeUndefined()
  })

  // Garde-fou sur le nom de collection ciblé par le `$merge` : il a divergé du modèle
  // (« anonymizedapplications » sans underscore) et le cron a alimenté pendant des mois une
  // collection absente des modèles, donc absente d'`obfuscateCollections`.
  it("ne crée aucune collection en dehors des modèles déclarés", async () => {
    await insertApplication({ created_at: yearsAgo(3), applicant_attachment_deleted_at: null })

    await anonymizeApplications()

    expect(await listUndeclaredCollections()).toEqual([])
  })
})
