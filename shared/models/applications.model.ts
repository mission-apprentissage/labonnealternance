import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zCallerParam } from "../routes/_params"

import { zObjectId } from "./common"

export const ZApplication = z
  .object({
    _id: zObjectId,
    applicant_email: z.string().email().openapi({
      description: "L'adresse email du candidat à laquelle l'entreprise contactée pourra répondre. Les adresses emails temporaires ne sont pas acceptées.",
      example: "john.smith@mail.com",
    }),
    applicant_first_name: z.string().max(50).openapi({
      description: "Le prénom du candidat.",
      example: "Jean",
    }),
    applicant_last_name: z.string().max(50).openapi({
      description: "Le nom du candidat.",
      example: "Dupont",
    }),
    applicant_phone: extensions.phone().openapi({
      description: "Le numéro de téléphone du candidat.",
      example: "0101010101",
    }),
    applicant_attachment_name: z
      .string()
      .regex(/((.*?))(\.)+(docx|pdf)$/i)
      .openapi({
        description: "Le nom du fichier du CV du candidat. Seuls les .docx et .pdf sont autorisés.",
        example: "cv.pdf",
      }),
    applicant_message_to_company: z.string().nullable().openapi({
      description: "Un message du candidat vers le recruteur. Ce champ peut contenir la lettre de motivation du candidat.",
      example: "Madame, monsieur...",
    }),
    company_recruitment_intention: z.string().nullable().describe("L'intention de la société vis à vis du candidat"),
    company_feedback: z.string().nullable().describe("L'avis donné par la société"),
    company_feedback_date: z.date().nullable().describe("Date d'intention/avis donnée"),
    company_siret: extensions.siret.openapi({
      description: "Le siret de l'entreprise. Fourni par La bonne alternance. ",
      example: "00004993900000",
    }),
    company_email: z.string().openapi({
      description:
        "L'adresse email de la société pour postuler. Vous devez impérativement utiliser les valeurs émises par l'API LBA avec le vecteur d'initialisation correspondant à l'adresse.",
      example: "...f936e4352b5ae5...",
    }),
    company_name: z.string().openapi({
      description: "Le nom de la société. Fourni par La bonne alternance. ",
      example: "Au bon pain d'antan",
    }),
    company_naf: z.string().openapi({
      description: "La valeur associée au code NAF de l'entreprise. Fournie par La bonne alternance. ",
      example: "Boulangerie et boulangerie-pâtisserie",
    }),
    company_address: z.string().nullish().openapi({
      description: "L'adresse postale de la société. Fournie par La bonne alternance. (champs : place.fullAddress)",
      example: "38 RUE DES HAMECONS, 75021 PARIS-21",
    }),
    job_origin: z.string().nullable().openapi({
      description: "Le type de société selon la nomenclature La bonne alternance. Fourni par La bonne alternance.",
      example: "lba|lbb|matcha",
    }),
    job_title: z.string().openapi({
      description:
        'Le titre de l\'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est "matcha" . La valeur est fournie par La bonne alternance. ',
      example: "Téléconseil, vente à distance",
    }),
    job_id: z.string().nullable().openapi({
      description:
        "L'identifiant de l'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est \"matcha\" . La valeur est fournie par La bonne alternance. ",
      example: "...59c24c059b...",
    }),
    to_applicant_message_id: z.string().nullable().describe("Identifiant chez le transporteur du mail envoyé au candidat"),
    to_company_message_id: z.string().nullable().describe("Identifiant chez le transporteur du mail envoyé à l'entreprise"),
    caller: z.string().nullable().describe("L'identification de la source d'émission de la candidature (pour widget et api)"),
    is_anonymized: z.boolean().nullable().describe("Indique si la candidature a été anonymisée"),
    created_at: z.date().nullable().describe("La date création de la demande"),
    last_update_at: z.date().nullable().describe("Date de dernières mise à jour"),
  })
  .strict()
  .openapi("Application")

export const ZApplicationUI = ZApplication.extend({
  message: ZApplication.shape.applicant_message_to_company.optional(),
  applicant_file_name: ZApplication.shape.applicant_attachment_name,
  applicant_file_content: z.string().max(4215276).openapi({
    description: "Le contenu du fichier du CV du candidat. La taille maximale autorisée est de 3 Mo.",
    example: "data:application/pdf;base64,JVBERi0xLjQKJ...",
  }),
  company_type: z.enum(["matcha", "lba"]).openapi({
    description: "Le type de société selon la nomenclature La bonne alternance. Fourni par La bonne alternance.",
    example: "lba",
  }),
  iv: z.string().openapi({
    description: "Le vecteur d'initialisation permettant de déchiffrer l'adresse email de la société. Cette valeur est fournie par les apis de LBA.",
    example: "...59c24c059b...",
  }),
  secret: z.string().nullish(),
  crypted_company_email: z.string().nullish(),
  caller: zCallerParam.nullish(),
  job_id: ZApplication.shape.job_id.optional(),
  searched_for_job_label: z.string().nullish().openapi({
    description: "Le métier recherché par le candidat envoyant une candidature spontanée.",
    example: "Vente de fleurs, végétaux",
  }),
})
  .omit({
    _id: true,
    applicant_message_to_company: true,
    applicant_attachment_name: true,
    job_origin: true,
    to_applicant_message_id: true,
    to_company_message_id: true,
    is_anonymized: true,
    company_recruitment_intention: true,
    company_feedback: true,
    company_feedback_date: true,
    created_at: true,
    last_update_at: true,
  })
  .openapi("ApplicationUi")

export type IApplicationUI = z.output<typeof ZApplicationUI>

export type IApplication = z.output<typeof ZApplication>
