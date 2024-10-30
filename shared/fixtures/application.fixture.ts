import { ObjectId } from "bson"

import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { ApplicationScanStatus, IApplication } from "../models"

export function generateApplicationFixture(data: Partial<IApplication>): IApplication {
  return {
    _id: new ObjectId(),
    applicant_email: "test@test.fr",
    applicant_first_name: "a",
    applicant_last_name: "a",
    applicant_phone: "0125252525",
    applicant_message_to_company: "some blahblahblah",
    applicant_attachment_name: "cv.pdf",
    company_recruitment_intention: null,
    company_feedback: "a",
    company_feedback_date: null,
    company_siret: "34268752200066",
    company_email: "faux_email@faux-domaine-compagnie.com",
    company_name: "nom société",
    company_naf: "Conseil pour les affaires et autres conseils de gestion",
    company_address: "Somewhere over the rainbow",
    job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    job_title: "Leprechaun",
    job_id: null,
    to_applicant_message_id: "<gniagniagnia@domaine.fr>",
    to_company_message_id: "<gnegnegne@domaine.fr>",
    caller: null,
    scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
    created_at: new Date("2024-07-28T03:05:34.187Z"),
    last_update_at: new Date("2024-07-28T03:05:34.187Z"),
    ...data,
  }
}
