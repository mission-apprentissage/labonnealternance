import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import type { IApplication } from "shared/models/index"
import { ApplicationScanStatus } from "shared/models/index"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20260922170000-backfill-application-cv-deleted-at-5495"

/**
 * Ce test vit sous tests/ et non à côté de la migration : le runner liste tous les `.js` du dossier
 * migrations compilé, et `dist` contient les fichiers de test — un `*.test.ts` colocalisé serait
 * donc ramassé comme une migration.
 */
describe("migration backfill-application-cv-deleted-at-5495", () => {
  useMongo()

  const CREATED_AT = new Date("2024-03-01T08:00:00.000Z")

  // Le champ n'existe pas sur les documents antérieurs à #5495 : on le retire explicitement de la
  // fixture, sinon on testerait un état que la migration n'a jamais à traiter.
  const insertLegacyApplication = async (data: Parameters<typeof generateApplicationFixture>[0]) => {
    const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
    await getDbCollection("applicants").insertOne(applicant)
    const { applicant_attachment_deleted_at: _ignored, ...application } = generateApplicationFixture({ applicant_id: applicant._id, created_at: CREATED_AT, ...data })
    await getDbCollection("applications").insertOne(application as IApplication)
    return application
  }

  const deletedAtOf = async (_id: ObjectId) => (await getDbCollection("applications").findOne({ _id }))?.applicant_attachment_deleted_at

  // Les candidatures « en vol » d'abord : ce sont elles qu'un backfill trop large rendrait
  // orphelines pour toujours.
  it.each([
    ["WAITING_FOR_SCAN", { scan_status: ApplicationScanStatus.WAITING_FOR_SCAN }],
    ["ERROR_CLAMAV", { scan_status: ApplicationScanStatus.ERROR_CLAMAV }],
    ["UNKNOWN_ERROR", { scan_status: ApplicationScanStatus.UNKNOWN_ERROR }],
    ["ERROR_APPLICANT_NOT_FOUND", { scan_status: ApplicationScanStatus.ERROR_APPLICANT_NOT_FOUND }],
    ["NO_VIRUS_DETECTED sans mail candidat envoyé", { scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED, to_applicant_message_id: null }],
    // Son s3Delete a pu échouer à l'époque : le fichier infecté est peut-être encore là, et le
    // marquer purgé le rendrait introuvable pour toujours.
    ["VIRUS_DETECTED", { scan_status: ApplicationScanStatus.VIRUS_DETECTED }],
    // Statut legacy jamais repris par processApplications : son CV n'a jamais été supprimé.
    ["DO_NOT_SEND", { scan_status: ApplicationScanStatus.DO_NOT_SEND }],
  ])("laisse intacte une candidature en vol (%s)", async (_label, data) => {
    const application = await insertLegacyApplication(data)

    await up()

    // Son CV est peut-être encore sur S3 : la marquer supprimée rendrait le fichier irrécupérable.
    expect(await deletedAtOf(application._id)).toBeUndefined()
  })

  it("marque une candidature traitée avec sa date de création", async () => {
    const application = await insertLegacyApplication({ scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED, to_applicant_message_id: "<msg@lba.fr>" })

    await up()

    expect(await deletedAtOf(application._id)).toEqual(CREATED_AT)
  })

  it("retombe sur la date du run quand created_at est null", async () => {
    const application = await insertLegacyApplication({ scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED, to_applicant_message_id: "<msg@lba.fr>", created_at: null })

    await up()

    // Surtout pas null : le document serait lu « CV disponible » et ne serait jamais purgé, un
    // created_at null ne matchant pas un $lte sur une date.
    expect(await deletedAtOf(application._id)).toBeInstanceOf(Date)
  })

  it("ne réécrit pas une date déjà posée, et reste idempotente", async () => {
    const dejaPurge = new Date("2025-05-05T05:05:05.000Z")
    const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
    await getDbCollection("applicants").insertOne(applicant)
    const application = generateApplicationFixture({ applicant_id: applicant._id, created_at: CREATED_AT, applicant_attachment_deleted_at: dejaPurge })
    await getDbCollection("applications").insertOne(application)

    await up()
    await up()

    expect(await deletedAtOf(application._id)).toEqual(dejaPurge)
  })

  it("traite aussi les documents legacy qui ne passent plus la validation de schéma", async () => {
    // Hors production, applications est en validationLevel strict + validationAction error : un
    // document historique non conforme fait échouer TOUTE mise à jour, même un $set sans rapport.
    const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
    await getDbCollection("applicants").insertOne(applicant)
    const { applicant_attachment_deleted_at: _ignored, ...base } = generateApplicationFixture({
      applicant_id: applicant._id,
      created_at: CREATED_AT,
      scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
      to_applicant_message_id: "<msg@lba.fr>",
    })
    const legacyDoc = { ...base, champ_retire_du_modele: "legacy" } as unknown as IApplication
    const collection = getDbCollection("applications")

    // Garde-fou anti-vacuité : le document doit réellement être refusé, sinon ce test ne prouve rien.
    await expect(collection.insertOne(legacyDoc)).rejects.toMatchObject({ code: 121 })
    await collection.insertOne(legacyDoc, { bypassDocumentValidation: true })

    await up()

    expect(await deletedAtOf(legacyDoc._id)).toEqual(CREATED_AT)
  })
})
