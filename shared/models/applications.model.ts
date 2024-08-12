import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, allLbaItemType, allLbaItemTypeOLD } from "../constants/lbaitem"
import { removeUrlsFromText } from "../helpers/common"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zCallerParam } from "../routes/_params"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "applications" as const

export enum ApplicationScanStatus {
  WAITING_FOR_SCAN = "WAITING_FOR_SCAN",
  VIRUS_DETECTED = "VIRUS_DETECTED",
  ERROR_CLAMAV = "ERROR_CLAMAV",
  NO_VIRUS_DETECTED = "NO_VIRUS_DETECTED",
  DO_NOT_SEND = "DO_NOT_SEND",
}

export const ZApplication = z
  .object({
    _id: zObjectId,
    applicant_email: z.string().email().openapi({
      description: "L'adresse email du candidat à laquelle l'entreprise contactée pourra répondre. Les adresses emails temporaires ne sont pas acceptées.",
      example: "john.smith@mail.com",
    }),
    applicant_first_name: z
      .string()
      .max(50)
      .transform((value) => removeUrlsFromText(value))
      .openapi({
        description: "Le prénom du candidat.",
        example: "Jean",
      }),
    applicant_last_name: z
      .string()
      .max(50)
      .transform((value) => removeUrlsFromText(value))
      .openapi({
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
    company_recruitment_intention: z.string().nullish().describe("L'intention de la société vis à vis du candidat"),
    company_feedback: z.string().nullish().describe("L'avis donné par la société"),
    company_feedback_date: z.date().nullish().describe("Date d'intention/avis donnée"),
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
    company_naf: z.string().nullish().openapi({
      description: "La valeur associée au code NAF de l'entreprise. Fournie par La bonne alternance. ",
      example: "Boulangerie et boulangerie-pâtisserie",
    }),
    company_address: z.string().nullish().openapi({
      description: "L'adresse postale de la société. Fournie par La bonne alternance. (champs : place.fullAddress)",
      example: "38 RUE DES HAMECONS, 75021 PARIS-21",
    }),
    job_origin: z
      .enum([allLbaItemType[0], ...allLbaItemType.slice(1), ...allLbaItemTypeOLD])
      .nullable()
      .openapi({
        description: "Le type de société selon la nomenclature La bonne alternance. Fourni par La bonne alternance.",
        example: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
      }),
    job_title: z
      .string()
      .nullish()
      .openapi({
        description: `Le titre de l'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA} . La valeur est fournie par La bonne alternance. `,
        example: "Téléconseil, vente à distance",
      }),
    job_id: z
      .string()
      .nullish()
      .openapi({
        description: `L'identifiant de l'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA} . La valeur est fournie par La bonne alternance. `,
        example: "...59c24c059b...",
      }),
    to_applicant_message_id: z.string().nullish().describe("Identifiant chez le transporteur du mail envoyé au candidat"),
    to_company_message_id: z.string().nullish().describe("Identifiant chez le transporteur du mail envoyé à l'entreprise"),
    caller: z.string().nullish().describe("L'identification de la source d'émission de la candidature (pour widget et api)"),
    created_at: z.date().nullable().describe("La date création de la demande"),
    last_update_at: z.date().nullable().describe("Date de dernières mise à jour"),
    scan_status: extensions.buildEnum(ApplicationScanStatus).describe("Status du processus de scan de virus"),
  })
  .strict()
  .openapi("Application")

export const ZNewApplication = ZApplication.extend({
  message: ZApplication.shape.applicant_message_to_company.optional(),
  applicant_file_name: ZApplication.shape.applicant_attachment_name,
  applicant_file_content: z.string().max(4215276).openapi({
    description: "Le contenu du fichier du CV du candidat. La taille maximale autorisée est de 3 Mo.",
    example: "data:application/pdf;base64,JVBERi0xLjQKJ...",
  }),
  company_type: z.enum([allLbaItemTypeOLD[0], ...allLbaItemTypeOLD.slice(1)]).openapi({
    description: "Le type de société selon la nomenclature La bonne alternance. Fourni par La bonne alternance.",
    example: LBA_ITEM_TYPE_OLD.LBA,
  }),
  iv: z.string().optional().openapi({
    description: "Le vecteur d'initialisation permettant de déchiffrer l'adresse email de la société. Cette valeur est fournie par les apis de LBA.",
    example: "...59c24c059b...",
  }),
  secret: z.string().nullish(),
  company_email: z.string().nullish().openapi({
    description: "L'adresse email de la société pour postuler.Uniquement dans un cas de test",
    example: "fake@dummy.com",
  }),
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
    company_recruitment_intention: true,
    company_feedback: true,
    company_feedback_date: true,
    created_at: true,
    last_update_at: true,
    scan_status: true,
  })
  .openapi("ApplicationUi")

export const ZUsedNewApplication = ZNewApplication.pick({
  caller: true,
  applicant_email: true,
  company_siret: true,
  applicant_file_content: true,
  searched_for_job_label: true,
  job_id: true,
  company_type: true,
  applicant_first_name: true,
  applicant_last_name: true,
  applicant_file_name: true,
  message: true,
  applicant_phone: true,
  secret: true,
  company_email: true,
})

export const ZNewApplicationV2 = ZApplication.extend({
  message: ZApplication.shape.applicant_message_to_company.optional(),
  applicant_file_name: ZApplication.shape.applicant_attachment_name,
  applicant_file_content: z.string().max(4215276).openapi({
    description: "Le contenu du fichier du CV du candidat. La taille maximale autorisée est de 3 Mo.",
    example: "data:application/pdf;base64,JVBERi0xLjQKJ...",
  }),
  company_type: z.enum([allLbaItemType[0], ...allLbaItemType.slice(1)]).openapi({
    description: "Le type de société selon la nomenclature La bonne alternance. Fourni par La bonne alternance.",
    example: LBA_ITEM_TYPE.RECRUTEURS_LBA,
  }),
  iv: z.string().optional().openapi({
    description: "Le vecteur d'initialisation permettant de déchiffrer l'adresse email de la société. Cette valeur est fournie par les apis de LBA.",
    example: "...59c24c059b...",
  }),
  secret: z.string().nullish(),
  company_email: z.string().nullish().openapi({
    description: "L'adresse email de la société pour postuler.Uniquement dans un cas de test",
    example: "fake@dummy.com",
  }),
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
    company_recruitment_intention: true,
    company_feedback: true,
    company_feedback_date: true,
    created_at: true,
    scan_status: true,
    last_update_at: true,
  })
  .openapi("ApplicationUi")

export const ZUsedNewApplicationV2 = ZNewApplication.pick({
  caller: true,
  applicant_email: true,
  company_siret: true,
  applicant_file_content: true,
  searched_for_job_label: true,
  job_id: true,
  company_type: true,
  applicant_first_name: true,
  applicant_last_name: true,
  applicant_file_name: true,
  message: true,
  applicant_phone: true,
  secret: true,
  company_email: true,
})

export type INewApplicationV2 = z.output<typeof ZNewApplicationV2>

export type INewApplication = z.output<typeof ZUsedNewApplication>

export type IApplication = z.output<typeof ZApplication>

export default {
  zod: ZApplication,
  indexes: [
    [{ applicant_email: 1 }, {}],
    [{ applicant_first_name: 1 }, {}],
    [{ applicant_last_name: 1 }, {}],
    [{ applicant_phone: 1 }, {}],
    [{ company_recruitment_intention: 1 }, {}],
    [{ company_siret: 1 }, {}],
    [{ company_email: 1 }, {}],
    [{ company_name: 1 }, {}],
    [{ company_naf: 1 }, {}],
    [{ job_origin: 1 }, {}],
    [{ job_id: 1 }, {}],
    [{ caller: 1 }, {}],
    [{ created_at: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
