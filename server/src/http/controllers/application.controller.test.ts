import { omit } from "lodash-es"
import { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { s3WriteString } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { isInfected } from "@/services/clamav.service"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

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

useMongo()

describe("POST /v1/application", () => {
  const httpClient = useServer()
  const recruteur = generateJobsPartnersOfferPrivate({
    partner_label: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    workplace_siret: "11000001500013",
    workplace_legal_name: "ASSEMBLEE NATIONALE",
    workplace_brand: "ASSEMBLEE NATIONALE",
    workplace_naf_code: "8411Z",
    workplace_naf_label: "Administration publique générale",
    offer_rome_codes: ["G1203", "I1203", "M1602", "M1607", "K2303", "K1802", "K1707", "K1206", "I1101", "M1501", "K1404", "K1202", "M1601"],
    workplace_address_label: "126 RUE DE L UNIVERSITE 75107 Paris",
    workplace_geopoint: {
      coordinates: [2.318606, 48.860825],
      type: "Point",
    },
    apply_email: "contact@mail.fr",
    apply_phone: null,
    workplace_size: "1000-1999",
    workplace_website: null,
    workplace_opco: OPCOS_LABEL.MOBILITE,
    created_at: new Date("2024-07-04T23:24:58.995Z"),
  })

  beforeEach(async () => {
    await getDbCollection("jobs_partners").insertOne(recruteur)
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
      company_siret: recruteur.workplace_siret,
      company_name: recruteur.workplace_legal_name,
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

    expect(omit(applicant, ["createdAt", "last_connection", "updatedAt"])).toEqual({
      _id: applicant?._id,
      email: body.applicant_email,
      firstname: body.applicant_first_name,
      lastname: body.applicant_last_name,
      phone: body.applicant_phone,
    })

    expect(applications).toEqual([
      {
        _id: expect.any(ObjectId),
        applicant_id: applicant?._id,
        applicant_attachment_name: body.applicant_file_name,
        applicant_message_to_company: "",
        caller: body.caller,
        company_address: "126 RUE DE L UNIVERSITE 75107 Paris",
        company_email: recruteur.apply_email,
        company_feedback: null,
        company_feedback_send_status: null,
        company_feedback_reasons: null,
        company_naf: "Administration publique générale",
        company_name: "ASSEMBLEE NATIONALE",
        company_phone: null,
        company_recruitment_intention: null,
        company_siret: recruteur.workplace_siret,
        company_recruitment_intention_date: null,
        created_at: expect.any(Date),
        job_id: recruteur._id.toString(),
        job_origin: "recruteurs_lba",
        job_title: "Une super offre d'alternance",
        last_update_at: expect.any(Date),
        scan_status: "WAITING_FOR_SCAN",
        to_applicant_message_id: null,
        to_company_message_id: null,
      },
    ])

    expect(s3WriteString).toHaveBeenCalledWith("applications", `cv-${applications[0]._id}`, {
      Body: body.applicant_file_content,
    })

    expect(isInfected).toHaveBeenCalledWith(body.applicant_file_content)
  })
})
