import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { EMAIL_LOG_TYPE } from "shared/models/applicant-email-log.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import { findSuggestionsNafApplicants, getLast24hWindow, getPreviousDayWindow } from "./find-suggestions-naf-applicants"

const window = { from: new Date("2026-10-12T22:00:00.000Z"), to: new Date("2026-10-13T22:00:00.000Z") }
const IN_WINDOW = new Date("2026-10-13T10:00:00.000Z")
const BEFORE_WINDOW = new Date("2026-10-10T10:00:00.000Z")
const AFTER_WINDOW = new Date("2026-10-14T06:00:00.000Z")

const { OFFRES_EMPLOI_LBA, OFFRES_EMPLOI_PARTENAIRES, RECRUTEURS_LBA } = LBA_ITEM_TYPE

const createApplicant = async (applications: { job_origin: LBA_ITEM_TYPE; created_at: Date }[], createdAt = IN_WINDOW) => {
  const applicant = generateApplicantFixture({ email: `${new ObjectId().toHexString()}@example.com`, createdAt })
  await getDbCollection("applicants").insertOne(applicant)
  if (applications.length) {
    await getDbCollection("applications").insertMany(
      applications.map(({ job_origin, created_at }) =>
        generateApplicationFixture({ applicant_id: applicant._id, job_origin, created_at, job_id: job_origin === RECRUTEURS_LBA ? null : new ObjectId() })
      )
    )
  }
  return applicant._id
}

const findApplicantIds = async () => (await findSuggestionsNafApplicants(window)).map(({ _id }) => _id.toString()).sort()

describe("findSuggestionsNafApplicants", () => {
  useMongo()

  it("retient un candidat dont la 1re candidature, sur une offre LBA, date de la fenêtre", async () => {
    const applicantId = await createApplicant([{ job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW }])

    const applicants = await findSuggestionsNafApplicants(window)

    expect(applicants).toEqual([
      {
        _id: applicantId,
        email: expect.any(String),
        firstname: expect.any(String),
        lastname: expect.any(String),
        applications: [{ _id: expect.any(ObjectId), job_id: expect.any(ObjectId), job_origin: OFFRES_EMPLOI_LBA }],
      },
    ])
  })

  it("exige au moins une candidature sur une offre LBA ou partenaire (RG 5)", async () => {
    const mixed = await createApplicant([
      { job_origin: RECRUTEURS_LBA, created_at: IN_WINDOW },
      { job_origin: OFFRES_EMPLOI_PARTENAIRES, created_at: IN_WINDOW },
    ])
    await createApplicant([
      { job_origin: RECRUTEURS_LBA, created_at: IN_WINDOW },
      { job_origin: RECRUTEURS_LBA, created_at: IN_WINDOW },
    ])

    expect(await findApplicantIds()).toEqual([mixed.toString()])
  })

  it("écarte les candidats créés hors de la fenêtre (RG 3)", async () => {
    await createApplicant(
      [
        { job_origin: OFFRES_EMPLOI_LBA, created_at: BEFORE_WINDOW },
        { job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW },
      ],
      BEFORE_WINDOW
    )
    await createApplicant([{ job_origin: OFFRES_EMPLOI_LBA, created_at: AFTER_WINDOW }], AFTER_WINDOW)

    expect(await findApplicantIds()).toEqual([])
  })

  it("plafonne à 3 candidatures, y compris celles postérieures à la fenêtre (RG 9)", async () => {
    const three = await createApplicant([
      { job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW },
      { job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW },
      { job_origin: OFFRES_EMPLOI_LBA, created_at: AFTER_WINDOW },
    ])
    await createApplicant([
      { job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW },
      { job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW },
      { job_origin: OFFRES_EMPLOI_LBA, created_at: AFTER_WINDOW },
      { job_origin: OFFRES_EMPLOI_LBA, created_at: AFTER_WINDOW },
    ])

    expect(await findApplicantIds()).toEqual([three.toString()])
  })

  it("renvoie les candidatures de la plus ancienne à la plus récente (cf. buildTargetDrafts)", async () => {
    const applicantId = await createApplicant([
      { job_origin: OFFRES_EMPLOI_PARTENAIRES, created_at: AFTER_WINDOW },
      { job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW },
    ])
    const expectedOrder = await getDbCollection("applications").find({ applicant_id: applicantId }).sort({ created_at: 1 }).toArray()

    const [{ applications }] = await findSuggestionsNafApplicants(window)

    expect(applications.map(({ _id }) => _id)).toEqual(expectedOrder.map(({ _id }) => _id))
  })

  it("écarte les candidats ayant déjà reçu l'email de suggestions", async () => {
    const applicantId = await createApplicant([{ job_origin: OFFRES_EMPLOI_LBA, created_at: IN_WINDOW }])
    await getDbCollection("applicants_email_logs").insertOne({
      _id: new ObjectId(),
      applicant_id: applicantId,
      application_id: null,
      type: EMAIL_LOG_TYPE.SUGGESTIONS_NAF,
      message_id: null,
      createdAt: new Date(),
    })

    expect(await findApplicantIds()).toEqual([])
  })
})

describe("fenêtres de sélection", () => {
  it("la veille correspond au jour calendaire de Paris", () => {
    expect(getPreviousDayWindow(new Date("2026-10-14T08:00:00.000Z"))).toEqual(window)
  })

  it("la veille dure 25 h le jour du passage à l'heure d'hiver", () => {
    expect(getPreviousDayWindow(new Date("2026-10-26T08:00:00.000Z"))).toEqual({
      from: new Date("2026-10-24T22:00:00.000Z"),
      to: new Date("2026-10-25T23:00:00.000Z"),
    })
  })

  it("la veille dure 23 h le jour du passage à l'heure d'été", () => {
    expect(getPreviousDayWindow(new Date("2027-03-29T08:00:00.000Z"))).toEqual({
      from: new Date("2027-03-27T23:00:00.000Z"),
      to: new Date("2027-03-28T22:00:00.000Z"),
    })
  })

  it("les dernières 24 h se terminent à l'instant de l'exécution", () => {
    const now = new Date("2026-10-14T08:00:00.000Z")
    expect(getLast24hWindow(now)).toEqual({ from: new Date("2026-10-13T08:00:00.000Z"), to: now })
  })
})
