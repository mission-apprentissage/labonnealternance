import { ObjectId } from "mongodb"
import { generateLbaCompanyFixture } from "shared/fixtures/recruteurLba.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { s3Write } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { isInfected } from "@/services/clamav.service"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

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

useMongo()

describe("POST /v1/application", () => {
  const httpClient = useServer()
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
    geopoint: {
      coordinates: [2.318606, 48.860825],
      type: "Point",
    },
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

  beforeEach(async () => {
    await getDbCollection("recruteurslba").insertOne(recruteur)
  })

  it("should create an application with minimal fileds used", async () => {
    // Body cannot change because it is used publicly
    // This test ensure non-regression over the application creation
    const body = {
      applicant_file_name: "cv.pdf",
      applicant_file_content: "data:application/pdf;base64,",
      company_type: "lba",
      applicant_email: "jeam.dupont@mail.com",
      applicant_first_name: "Jean",
      applicant_last_name: "Dupont",
      applicant_phone: "0101010101",
      company_siret: recruteur.siret,
      company_name: recruteur.enseigne,
      caller: "Open Data 42",
    }

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v1/application",
      body,
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({
      message: "messages sent",
      result: "ok",
    })

    const applications = await getDbCollection("applications").find({}).toArray()
    const applicant = await getDbCollection("applicants").findOne({ _id: applications[0]?.applicant_id })

    expect(applications).toEqual([
      {
        _id: expect.any(ObjectId),
        applicant_id: applicant?._id,
        applicant_attachment_name: body.applicant_file_name,
        applicant_email: body.applicant_email,
        applicant_first_name: body.applicant_first_name,
        applicant_last_name: body.applicant_last_name,
        applicant_message_to_company: "",
        applicant_phone: body.applicant_phone,
        caller: body.caller,
        company_address: "126 RUE DE L UNIVERSITE, 75007 Paris",
        company_email: recruteur.email,
        company_feedback: null,
        company_feedback_reasons: null,
        company_naf: "Administration publique générale",
        company_name: "ASSEMBLEE NATIONALE",
        company_phone: null,
        company_recruitment_intention: null,
        company_siret: recruteur.siret,
        created_at: expect.any(Date),
        job_origin: "recruteurs_lba",
        job_title: "ASSEMBLEE NATIONALE",
        last_update_at: expect.any(Date),
        scan_status: "WAITING_FOR_SCAN",
        to_applicant_message_id: null,
        to_company_message_id: null,
      },
    ])

    expect(s3Write).toHaveBeenCalledWith("applications", `cv-${applications[0]._id}`, {
      Body: body.applicant_file_content,
    })

    expect(isInfected).toHaveBeenCalledWith(body.applicant_file_content)
  })
})
