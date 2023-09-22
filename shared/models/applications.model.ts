import { z } from "zod"

const phoneRegex = new RegExp(/^\d{10}$/)

export const ZApplication = z
  .object({
    applicant_email: z.string().describe("Adresse email candidat"),
    applicant_first_name: z.string().describe("Prénom du candidat"),
    applicant_last_name: z.string().describe("Nom du candidat"),
    applicant_phone: z.string().regex(phoneRegex).describe("Téléphone du candidat"),
    applicant_attachment_name: z.string().describe("Nom du fichier du CV du candidat"),
    applicant_message_to_company: z.string().nullable().describe("Le message envoyé par le candidat"),
    company_recruitment_intention: z.string().nullable().describe("L'intention de la société vis à vis du candidat"),
    company_feedback: z.string().nullable().describe("L'avis donné par la société"),
    company_feedback_date: z.date().nullable().describe("Date d'intention/avis donnée"),
    company_siret: z.string().describe("Le siret de l'établissement"),
    company_email: z.string().describe("L'adresse email de destination de la candidature"),
    company_name: z.string().describe("Le nom de la société"),
    company_naf: z.string().describe("Le label naf de la société"),
    company_address: z.string().describe("L'adresse physique de la société"),
    job_origin: z.string().describe("Le type de société / offre au sens source d'info La bonne alternance. Ex : lba, lbb, matcha, pejob"),
    job_title: z.string().describe("Le titre de l'offre à laquelle répond le candidat ou le nom de la société en cas de candidature spontanée"),
    job_id: z.string().nullable().describe("L'id externe de l'offre d'emploi"),
    to_applicant_message_id: z.string().nullable().describe("Identifiant chez le transporteur du mail envoyé au candidat"),
    to_company_message_id: z.string().nullable().describe("Identifiant chez le transporteur du mail envoyé à l'entreprise"),
    caller: z.string().nullable().describe("L'identification de la source d'émission de la candidature (pour widget et api)"),
    is_anonymized: z.boolean().nullable().describe("Indique si la candidature a été anonymisée"),
    created_at: z.date().nullable().describe("La date création de la demande"),
    last_update_at: z.date().nullable().describe("Date de dernières mise à jour"),
  })
  .strict()

export const ZApplicationUI = ZApplication.extend({
  message: ZApplication.shape.applicant_message_to_company,
  applicant_file_name: z.string().describe("Nom du fichier du CV du candidat"),
  applicant_file_content: z.string().describe("Contenu de la pièce jointe de candidature"),
  company_type: z.string().describe("Le type de société / offre au sens source d'info La bonne alternance. Ex : lba, lbb, matcha, pejob"),
  iv: z.string().describe("Initialization vector de chiffrement de l'adresse email société"),
  secret: z.string().nullable(),
  crypted_company_email: z.string().nullable(),
}).omit({
  applicant_message_to_company: true,
  to_applicant_message_id: true,
  to_company_message_id: true,
  is_anonymized: true,
  created_at: true,
  last_update_at: true,
})

export type IApplication = z.output<typeof ZApplication>
