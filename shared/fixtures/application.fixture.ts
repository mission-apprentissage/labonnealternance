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

export const applicationTestFile =
  "data:application/pdf;base64,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c3Rm9t/N8Lv1XNOe3Xo/pDQJ7x+aYvPPx/vnZPrE6/7BtewcJfbOcXdC9g/KNPLXPPNwjB8kdHrWHraLFZvPT/ZPyXQ1r5syNBydK9a4z6FTKHcvubtXM3r6iB25B/lmJ9ef3s/ZIfNPGV1cTo+np8w/O3T9fj49+3R5ZevZB37+A1jMOUYKZW5kc3RyZWFtCmVuZG9iago2IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEgMCBSL0YyIDIgMCBSL0YzIDMgMCBSPj4+Pi9Db250ZW50cyA0IDAgUi9QYXJlbnQgNSAwIFI+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2EtQm9sZC9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvVGltZXMtUm9tYW4vRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbNiAwIFJdPj4KZW5kb2JqCjcgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDUgMCBSPj4KZW5kb2JqCjggMCBvYmoKPDwvUHJvZHVjZXIoaVRleHRTaGFycJIgNS41LjEwIKkyMDAwLTIwMTYgaVRleHQgR3JvdXAgTlYgXChBR1BMLXZlcnNpb25cKSkvQ3JlYXRpb25EYXRlKEQ6MjAyMzA1MTEwOTMwMjUrMDInMDAnKS9Nb2REYXRlKEQ6MjAyMzA1MTEwOTMwMjUrMDInMDAnKT4+CmVuZG9iagp4cmVmCjAgOQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDIwODIgMDAwMDAgbiAKMDAwMDAwMjE3NSAwMDAwMCBuIAowMDAwMDAyMjYzIDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMjM1MyAwMDAwMCBuIAowMDAwMDAxOTUyIDAwMDAwIG4gCjAwMDAwMDI0MDQgMDAwMDAgbiAKMDAwMDAwMjQ0OSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgOS9Sb290IDcgMCBSL0luZm8gOCAwIFIvSUQgWzwwYTE1N2MxMDBiMDJiMzBjYzZmNTRmMGE4ZWJhYWMzYT48MGExNTdjMTAwYjAyYjMwY2M2ZjU0ZjBhOGViYWFjM2E+XT4+CiVpVGV4dC01LjUuMTAKc3RhcnR4cmVmCjI2MTIKJSVFT0YK"