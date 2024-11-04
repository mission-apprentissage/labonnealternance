import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import { IApplicationApiJobId, IApplicationApiRecruteurId, JOB_STATUS } from "shared"
import { NIVEAUX_POUR_LBA, RECRUITER_STATUS } from "shared/constants"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { applicationTestFile } from "shared/fixtures/application.fixture"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { generateLbaCompanyFixture } from "shared/fixtures/recruteurLba.fixture"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { describe, expect, it, vi } from "vitest"

import { s3Write } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { getApiApprentissageTestingToken, getApiApprentissageTestingTokenFromInvalidPrivateKey } from "../../../../tests/utils/jwt.test.utils"

vi.mock("@/common/utils/awsUtils", () => {
  return {
    s3Write: vi.fn().mockResolvedValue(undefined),
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

const recruiter = generateRecruiterFixture({
  establishment_siret: "11000001500013",
  establishment_raison_sociale: "ASSEMBLEE NATIONALE",
  geopoint: parisFixture.centre,
  status: RECRUITER_STATUS.ACTIF,
  email: "test-application@mail.fr",
  jobs: [
    {
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

const mockData = async () => {
  await getDbCollection("recruteurslba").insertOne(recruteur)
  await getDbCollection("recruiters").insertOne(recruiter)
  await getDbCollection("referentielromes").insertOne(referentielRome)
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
    const body: IApplicationApiRecruteurId = {
      applicant_file_name: "cv.pdf",
      applicant_file_content: applicationTestFile,
      applicant_email: "jeam.dupont@mail.com",
      applicant_first_name: "Jean",
      applicant_last_name: "Dupont",
      applicant_phone: "0101010101",
      recruteur_id: recruteur._id.toString(),
    }

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/application",
      body,
      headers: { authorization: `Bearer ${token}` },
    })

    const application = await getDbCollection("applications").findOne({ company_siret: recruteur.siret })

    expect.soft(response.statusCode).toEqual(202)
    expect.soft(response.json()).toEqual({ id: application!._id.toString() })

    expect(application).toEqual({
      _id: expect.any(ObjectId),
      applicant_attachment_name: body.applicant_file_name,
      applicant_email: body.applicant_email,
      applicant_first_name: body.applicant_first_name,
      applicant_last_name: body.applicant_last_name,
      applicant_message_to_company: "",
      applicant_phone: body.applicant_phone,
      company_email: recruteur.email,
      company_feedback: null,
      company_name: "ASSEMBLEE NATIONALE",
      company_phone: null,
      company_recruitment_intention: null,
      company_siret: recruteur.siret,
      company_naf: "Administration publique générale",
      company_address: "126 RUE DE L UNIVERSITE, 75007 Paris",
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

    expect(s3Write).toHaveBeenCalledWith("applications", `cv-${application!._id}`, {
      Body: body.applicant_file_content,
    })
  })

  it("Return 202 and create an application using a recruiter", async () => {
    const job = recruiter.jobs[0]
    const body: IApplicationApiJobId = {
      applicant_file_name: "cv.pdf",
      applicant_file_content: applicationTestFile,
      applicant_email: "jeam.dupont@mail.com",
      applicant_first_name: "Jean",
      applicant_last_name: "Dupont",
      applicant_phone: "0101010101",
      job_id: job._id.toString(),
    }

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/application",
      body,
      headers: { authorization: `Bearer ${token}` },
    })

    const application = await getDbCollection("applications").findOne({ job_id: job._id.toString() })

    expect.soft(response.statusCode).toEqual(202)
    expect.soft(response.json()).toEqual({ id: application!._id.toString() })

    expect(application).toEqual({
      _id: expect.any(ObjectId),
      applicant_attachment_name: body.applicant_file_name,
      applicant_email: body.applicant_email,
      applicant_first_name: body.applicant_first_name,
      applicant_last_name: body.applicant_last_name,
      applicant_message_to_company: "",
      applicant_phone: body.applicant_phone,
      company_address: "Paris",
      company_email: "test-application@mail.fr",
      company_feedback: null,
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

    expect(s3Write).toHaveBeenCalledWith("applications", `cv-${application!._id}`, {
      Body: body.applicant_file_content,
    })
  })
})
