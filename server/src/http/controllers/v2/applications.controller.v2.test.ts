import { omit } from "lodash-es"
import { ObjectId } from "mongodb"
import { IApplicationApiPublic, JOB_STATUS } from "shared"
import { NIVEAUX_POUR_LBA, RECRUITER_STATUS } from "shared/constants"
import { ApplicationIntention } from "shared/constants/application"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { applicationTestFile, generateApplicantFixture, generateApplicationFixture, wrongApplicationTestFile } from "shared/fixtures/application.fixture"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { generateLbaCompanyFixture } from "shared/fixtures/recruteurLba.fixture"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { describe, expect, it, vi } from "vitest"

import { s3WriteString } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { buildUserForToken } from "@/services/application.service"
import { generateApplicationReplyToken } from "@/services/appLinks.service"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

import { getApiApprentissageTestingToken, getApiApprentissageTestingTokenFromInvalidPrivateKey } from "../../../../tests/utils/jwt.test.utils"

vi.mock("@/common/utils/awsUtils", () => {
  return {
    s3WriteString: vi.fn().mockResolvedValue(undefined),
  }
})
vi.mock("@/services/clamav.service", () => {
  return {
    isInfected: vi.fn().mockResolvedValue(false),
  }
})

const token = getApiApprentissageTestingToken({
  email: "test@test.fr",
  organisation: "Un super Partenaire",
  habilitations: { "applications:write": true, "appointments:write": false, "jobs:write": false },
})
const fakeToken = getApiApprentissageTestingTokenFromInvalidPrivateKey({
  email: "mail@mail.com",
  organisation: "Un super Partenaire",
  habilitations: { "applications:write": true, "appointments:write": false, "jobs:write": false },
})

const recruteur = generateLbaCompanyFixture({
  siret: "11000001500013",
  raison_sociale: "ASSEMBLEE NATIONALE",
  enseigne: "ASSEMBLEE NATIONALE",
  naf_code: "8411Z",
  naf_label: "Administration publique générale",
  rome_codes: ["G1203", "I1203", "M1602", "M1607", "K2303", "K1802", "K1707", "K1206", "I1101", "M1501", "K1404", "K1202", "M1601"],
  street_number: "126",
  street_name: "RUE DE L UNIVERSITE",
  insee_city_code: "75107",
  zip_code: "75007",
  city: "Paris",
  geo_coordinates: "48.860825,2.318606",
  geopoint: parisFixture.centre,
  email: "contact@mail.fr",
  phone: null,
  company_size: "1000-1999",
  website: null,
  opco: "Opco Mobilités",
  opco_short_name: "MOBILITE",
  opco_url: "https://www.opcomobilites.fr/",
  created_at: new Date("2024-07-04T23:24:58.995Z"),
  last_update_at: new Date("2024-07-04T23:24:58.995Z"),
})

const recruiterEmailFixture = "test-application@mail.fr"

const user = generateUserWithAccountFixture({
  _id: new ObjectId("670ce1ded6ce30c3c90a0e1d"),
  email: recruiterEmailFixture,
})

const recruiter = generateRecruiterFixture({
  establishment_siret: "11000001500013",
  establishment_raison_sociale: "ASSEMBLEE NATIONALE",
  geopoint: parisFixture.centre,
  status: RECRUITER_STATUS.ACTIF,
  email: recruiterEmailFixture,
  jobs: [
    {
      rome_code: ["M1602"],
      rome_label: "Opérations administratives",
      job_status: JOB_STATUS.ACTIVE,
      job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
      job_creation_date: new Date("2021-01-01"),
      job_expiration_date: new Date("2050-01-01"),
    },
    {
      _id: new ObjectId("64a43d28eeeb7c3b210faf59"),
      rome_code: ["M1602"],
      rome_label: "Opérations administratives",
      job_status: JOB_STATUS.ACTIVE,
      job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
      job_creation_date: new Date("2021-01-01"),
      job_expiration_date: new Date("2050-01-01"),
    },
  ],
  address_detail: {
    code_insee_localite: parisFixture.code,
  },
  address: parisFixture.nom,
  phone: "0300000000",
})

const referentielRome = generateReferentielRome({
  rome: {
    code_rome: "M1602",
    intitule: "Opérations administratives",
    code_ogr: "475",
  },
})

const applicantFixture = generateApplicantFixture({})

const applicationFixture = generateApplicationFixture({
  _id: new ObjectId("6081289803569600282e0001"),
  job_id: "64a43d28eeeb7c3b210faf59",
  job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
  applicant_id: applicantFixture._id,
})

const userToken = buildUserForToken(applicationFixture, user)
const intentionToken = generateApplicationReplyToken(userToken, applicationFixture._id.toString(), ApplicationIntention.ENTRETIEN)

const mockData = async () => {
  await getDbCollection("recruteurslba").insertOne(recruteur)
  await getDbCollection("recruiters").insertOne(recruiter)
  await getDbCollection("referentielromes").insertOne(referentielRome)
  await getDbCollection("applicants").insertOne(applicantFixture)
  await getDbCollection("applications").insertOne(applicationFixture)
}

useMongo(mockData)

describe("POST /v2/application", () => {
  const httpClient = useServer()

  it("Return 401 if no api key provided", async () => {
    const response = await httpClient().inject({ method: "POST", path: "/api/v2/application" })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token missing-bearer" })
  })

  it("Return 401 if api key is invalid", async () => {
    const response = await httpClient().inject({ method: "POST", path: "/api/v2/application", headers: { authorization: `Bearer ${fakeToken}` } })
    expect.soft(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token invalid-signature" })
  })

  it("Return 202 and create an application using a recruter lba", async () => {
    const body: IApplicationApiPublic = {
      applicant_attachment_name: "cv.pdf",
      applicant_attachment_content: applicationTestFile,
      applicant_email: "jeam.dupont@mail.com",
      applicant_first_name: "Jean",
      applicant_last_name: "Dupont",
      applicant_phone: "0101010101",
      recipient_id: `recruteurslba_${recruteur._id.toString()}`,
    }

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/application",
      body,
      headers: { authorization: `Bearer ${token}` },
    })

    const application = await getDbCollection("applications").findOne({ company_siret: recruteur.siret })
    const applicant = await getDbCollection("applicants").findOne({ _id: application?.applicant_id })

    expect.soft(response.statusCode).toEqual(202)
    expect.soft(response.json()).toEqual({ id: application!._id.toString() })

    expect.soft(omit(applicant, ["createdAt", "last_connection", "updatedAt"])).toEqual({
      _id: applicant?._id,
      email: body.applicant_email,
      firstname: body.applicant_first_name,
      lastname: body.applicant_last_name,
      phone: body.applicant_phone,
    })

    expect(application).toEqual({
      _id: expect.any(ObjectId),
      applicant_id: applicant?._id,
      applicant_attachment_name: body.applicant_attachment_name,
      applicant_message_to_company: "",
      application_url: null,
      company_email: recruteur.email,
      company_feedback: null,
      company_feedback_reasons: null,
      company_name: "ASSEMBLEE NATIONALE",
      company_phone: null,
      company_recruitment_intention: null,
      company_siret: recruteur.siret,
      company_naf: "Administration publique générale",
      company_address: "126 RUE DE L UNIVERSITE, 75007 Paris",
      job_id: recruteur._id.toString(),
      created_at: expect.any(Date),
      job_searched_by_user: null,
      job_title: "ASSEMBLEE NATIONALE",
      job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA,
      last_update_at: expect.any(Date),
      scan_status: "WAITING_FOR_SCAN",
      to_applicant_message_id: null,
      to_company_message_id: null,
      caller: "Un super Partenaire",
    })

    expect(s3WriteString).toHaveBeenCalledWith("applications", `cv-${application!._id}`, {
      Body: body.applicant_attachment_content,
    })
  })

  it("Return 202 and create an application using a recruiter", async () => {
    const job = recruiter.jobs[0]
    const body: IApplicationApiPublic = {
      applicant_attachment_name: "cv.pdf",
      applicant_attachment_content: applicationTestFile,
      applicant_email: "jeam.dupont@mail.com",
      applicant_first_name: "Jean",
      applicant_last_name: "Dupont",
      applicant_phone: "0101010101",
      recipient_id: `recruiters_${job._id.toString()}`,
    }

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/application",
      body,
      headers: { authorization: `Bearer ${token}` },
    })

    const application = await getDbCollection("applications").findOne({ job_id: job._id.toString() })
    const applicant = await getDbCollection("applicants").findOne({ _id: application?.applicant_id })

    expect.soft(response.statusCode).toEqual(202)
    expect.soft(response.json()).toEqual({ id: application!._id.toString() })

    expect.soft(omit(applicant, ["createdAt", "last_connection", "updatedAt"])).toEqual({
      _id: applicant?._id,
      email: body.applicant_email,
      firstname: body.applicant_first_name,
      lastname: body.applicant_last_name,
      phone: body.applicant_phone,
    })

    expect(application).toEqual({
      _id: expect.any(ObjectId),
      applicant_id: applicant?._id,
      applicant_attachment_name: body.applicant_attachment_name,
      applicant_message_to_company: "",
      application_url: null,
      company_address: "Paris",
      company_email: "test-application@mail.fr",
      company_feedback: null,
      company_feedback_reasons: null,
      company_naf: "",
      company_name: "ASSEMBLEE NATIONALE",
      company_phone: "0300000000",
      company_recruitment_intention: null,
      company_siret: recruteur.siret,
      created_at: expect.any(Date),
      job_id: job._id.toString(),
      job_searched_by_user: null,
      job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
      job_title: "Opérations administratives",
      last_update_at: expect.any(Date),
      scan_status: "WAITING_FOR_SCAN",
      to_applicant_message_id: null,
      to_company_message_id: null,
      caller: "Un super Partenaire",
    })

    expect(s3WriteString).toHaveBeenCalledWith("applications", `cv-${application!._id}`, {
      Body: body.applicant_attachment_content,
    })
  })
  it("return 400 as file type is not supported", async () => {
    const job = recruiter.jobs[0]
    const body: IApplicationApiPublic = {
      applicant_attachment_name: "cv.pdf",
      applicant_attachment_content: wrongApplicationTestFile,
      applicant_email: "jeam.dupont@mail.com",
      applicant_first_name: "Jean",
      applicant_last_name: "Dupont",
      applicant_phone: "0101010101",
      recipient_id: `recruiters_${job._id.toString()}`,
    }

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/application",
      body,
      headers: { authorization: `Bearer ${token}` },
    })
    expect.soft(response.statusCode).toEqual(400)
    expect.soft(response.json()).toEqual({ statusCode: 400, error: "Bad Request", message: "File type is not supported" })
  })

  it("save scheduled intention when link in email is followed", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/application/intention/schedule/6081289803569600282e0001?intention=${ApplicationIntention.ENTRETIEN}`,
      headers: { authorization: `Bearer ${intentionToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({
      applicant_first_name: "applicant_firstname",
      applicant_last_name: "applicant_lastname",
      recruiter_email: "faux_email@faux-domaine-compagnie.com",
      recruiter_phone: "0300000000",
    })
    const intentionInDb = await getDbCollection("recruiter_intention_mails").findOne({ applicationId: new ObjectId("6081289803569600282e0001") })
    expect.soft(intentionInDb).not.toEqual(null)
  })

  it("Remove scheduled intention when cancel button", async () => {
    await httpClient().inject({
      method: "GET",
      path: `/api/application/intention/schedule/6081289803569600282e0001?intention=${ApplicationIntention.ENTRETIEN}`,
      headers: { authorization: `Bearer ${intentionToken}` },
    })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/application/intention/cancel/6081289803569600282e0001",
      headers: { authorization: `Bearer ${intentionToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({ result: "ok", message: "intention canceled" })
    const intentionInDb = await getDbCollection("recruiter_intention_mails").findOne({ applicationId: new ObjectId("6081289803569600282e0001") })
    expect.soft(intentionInDb).toEqual(null)
  })

  it("Remove scheduled intention when cancel button", async () => {
    await httpClient().inject({
      method: "GET",
      path: `/api/application/intention/schedule/6081289803569600282e0001?intention=${ApplicationIntention.ENTRETIEN}`,
      headers: { authorization: `Bearer ${intentionToken}` },
    })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/application/intention/cancel/6081289803569600282e0001",
      headers: { authorization: `Bearer ${intentionToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({ result: "ok", message: "intention canceled" })
    const intentionInDb = await getDbCollection("recruiter_intention_mails").findOne({ applicationId: new ObjectId("6081289803569600282e0001") })
    expect.soft(intentionInDb).toEqual(null)
  })

  it.skip("Remove scheduled intention when Envoyer le message button", async () => {
    await httpClient().inject({
      method: "GET",
      path: `/api/application/intention/schedule/6081289803569600282e0001?intention=${ApplicationIntention.ENTRETIEN}`,
      headers: { authorization: `Bearer ${intentionToken}` },
    })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/application/intentionComment/6081289803569600282e0001",
      body: {
        company_feedback: "Bonjour",
        company_recruitment_intention: ApplicationIntention.ENTRETIEN,
        email: "faux_email@faux-domaine-compagnie.com",
        phone: "",
        refusal_reasons: [],
      },
      headers: { authorization: `Bearer ${intentionToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({ result: "ok", message: "comment registered" })
    const intentionInDb = await getDbCollection("recruiter_intention_mails").findOne({ applicationId: new ObjectId("6081289803569600282e0001") })
    expect.soft(intentionInDb).toEqual(null)
    const application = await getDbCollection("applications").findOne({ _id: new ObjectId("6081289803569600282e0001") })
    expect.soft(application!).toMatchObject({
      company_feedback_reasons: [],
      company_feedback: "Bonjour",
      company_recruitment_intention: ApplicationIntention.ENTRETIEN,
    })
  })
})
