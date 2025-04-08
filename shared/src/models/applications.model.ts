import { ObjectId } from "bson"
import { Jsonify } from "type-fest"

import { RefusalReasons } from "../constants/application.js"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, allLbaItemType, allLbaItemTypeOLD } from "../constants/lbaitem.js"
import { removeUrlsFromText } from "../helpers/common.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { zCallerParam } from "../routes/_params.js"
import { validateSIRET } from "../validators/siretValidator.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "applications" as const

export enum ApplicationScanStatus {
  WAITING_FOR_SCAN = "WAITING_FOR_SCAN",
  VIRUS_DETECTED = "VIRUS_DETECTED",
  ERROR_CLAMAV = "ERROR_CLAMAV",
  NO_VIRUS_DETECTED = "NO_VIRUS_DETECTED",
  DO_NOT_SEND = "DO_NOT_SEND",
  ERROR_APPLICANT_NOT_FOUND = "ERROR_APPLICANT_NOT_FOUND",
}

export enum CompanyFeebackSendStatus {
  SENT = "SENT",
  CANCELED = "CANCELED",
  SCHEDULED = "SCHEDULED",
  ERROR = "ERROR",
}

const ZApplicationOld = z
  .object({
    _id: zObjectId,
    applicant_id: zObjectId,
    applicant_email: z.string().email().describe("Email du candidat"),
    applicant_first_name: z
      .string()
      .min(1)
      .max(50)
      .transform((value) => removeUrlsFromText(value))
      .describe("Prenom du candidat"),
    applicant_last_name: z
      .string()
      .min(1)
      .max(50)
      .transform((value) => removeUrlsFromText(value))
      .describe("Nom du candidat"),
    applicant_phone: extensions.telephone.describe("Téléphone du candidat"),
    applicant_attachment_name: z
      .string()
      .min(1)
      .regex(/((.*?))(\.)+([Dd][Oo][Cc][Xx]|[Pp][Dd][Ff])$/i)
      .describe("Nom du fichier du CV du candidat. Seuls les .docx et .pdf sont autorisés."),
    applicant_message_to_company: z.string().nullable().describe("Un message du candidat vers le recruteur. Ce champ peut contenir la lettre de motivation du candidat."),
    job_searched_by_user: z.string().nullish().describe("Métier recherché par le candidat"),
    company_recruitment_intention: z.string().nullish().describe("L'intention de la société vis à vis du candidat"),
    company_recruitment_intention_date: z.date().nullable().describe("Date d'enregistrement d'intention/avis programmé"),
    company_feedback: z.string().nullish().describe("L'avis donné par la société"),
    company_feedback_reasons: z.array(extensions.buildEnum(RefusalReasons)).nullish(),
    company_feedback_date: z.date().nullish().describe("Date d'intention/avis donnée"),
    company_feedback_send_status: extensions.buildEnum(CompanyFeebackSendStatus).nullable().describe("Etat de l'envoi de l'intention de recrutement"),
    company_siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
    company_email: z.string().describe("Email de l'entreprise"),
    company_phone: z.string().nullish().describe("Numéro de téléphone du recruteur"),
    company_name: z.string().describe("Nom de l'entreprise"),
    company_naf: z.string().nullish().describe("Code NAF de l'entreprise"),
    company_address: z.string().nullish().describe("Adresse de l'entreprise"),
    job_origin: extensions.buildEnum(LBA_ITEM_TYPE).describe("Origine de l'offre d'emploi"),
    job_title: z
      .string()
      .nullish()
      .describe(
        `Le titre de l'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA} . La valeur est fournie par La bonne alternance. `
      ),
    job_id: z
      .string()
      .nullish()
      .describe(
        `L'identifiant de l'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA} . La valeur est fournie par La bonne alternance. `
      ),
    to_applicant_message_id: z.string().nullish().describe("Identifiant chez le transporteur du mail envoyé au candidat"),
    to_company_message_id: z.string().nullish().describe("Identifiant chez le transporteur du mail envoyé à l'entreprise"),
    caller: z.string().nullish().describe("L'identification de la source d'émission de la candidature (pour widget et api)"),
    created_at: z.date().nullable().describe("La date création de la demande"),
    last_update_at: z.date().nullable().describe("Date de dernières mise à jour"),
    scan_status: extensions.buildEnum(ApplicationScanStatus).describe("Status du processus de scan de virus"),
    application_url: z.string().nullish().describe("URL où a été créé la candidature. Uniquement pour les candidatures venant de LBA."),
  })
  .strict()
  .openapi("Application")

export const ZApplication = ZApplicationOld.omit({
  applicant_email: true,
  applicant_first_name: true,
  applicant_last_name: true,
  applicant_phone: true,
})

export type IApplication = z.output<typeof ZApplication>

// KBA 20241011 to remove once V2 is LIVE and V1 support has ended
export const ZNewApplication = ZApplicationOld.extend({
  message: ZApplicationOld.shape.applicant_message_to_company.optional(),
  applicant_file_name: ZApplicationOld.shape.applicant_attachment_name,
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
  job_id: ZApplicationOld.shape.job_id.optional(),
  searched_for_job_label: z.string().nullish().openapi({
    description: "Le métier recherché par le candidat envoyant une candidature spontanée.",
    example: "Vente de fleurs, végétaux",
  }),
})
  .omit({
    _id: true,
    applicant_id: true,
    applicant_message_to_company: true,
    applicant_attachment_name: true,
    job_origin: true,
    to_applicant_message_id: true,
    to_company_message_id: true,
    company_recruitment_intention: true,
    company_recruitment_intention_date: true,
    company_feedback_send_status: true,
    company_feedback: true,
    company_feedback_date: true,
    created_at: true,
    last_update_at: true,
    scan_status: true,
  })
  .openapi("ApplicationUi")

// KBA 20241011 to remove once V2 is LIVE and V1 support has ended
const ZNewApplicationTransitionToV2 = ZApplicationOld.extend({
  message: ZApplicationOld.shape.applicant_message_to_company.optional(),
  applicant_file_name: ZApplicationOld.shape.applicant_attachment_name,
  applicant_file_content: z.string().max(4_215_276).openapi({
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
  job_id: ZApplicationOld.shape.job_id.optional(),
  searched_for_job_label: z.string().nullish().openapi({
    description: "Le métier recherché par le candidat envoyant une candidature spontanée.",
    example: "Vente de fleurs, végétaux",
  }),
})
  .omit({
    _id: true,
    applicant_id: true,
    applicant_message_to_company: true,
    applicant_attachment_name: true,
    job_origin: true,
    to_applicant_message_id: true,
    to_company_message_id: true,
    company_recruitment_intention: true,
    company_feedback: true,
    company_feedback_date: true,
    company_recruitment_intention_date: true,
    company_feedback_send_status: true,
    created_at: true,
    scan_status: true,
    last_update_at: true,
  })
  .openapi("ApplicationUi")
// KBA 20241011 to remove once V2 is LIVE and V1 support has ended
export type INewApplicationV1 = z.output<typeof ZNewApplicationTransitionToV2>

export const ZJobCollectionName = z.enum(["partners", "recruiters", "recruteur"])
export const JobCollectionName = ZJobCollectionName.enum
export type IJobCollectionName = z.output<typeof ZJobCollectionName>

export const ZApplicationApiPrivate = ZApplicationOld.pick({
  applicant_first_name: true,
  applicant_last_name: true,
  applicant_email: true,
  applicant_phone: true,
  applicant_attachment_name: true,
  job_searched_by_user: true,
  caller: true,
  application_url: true,
}).extend({
  applicant_message: ZApplicationOld.shape.applicant_message_to_company.optional(),
  applicant_attachment_content: z.string().max(4_215_276).describe("Le contenu du fichier du CV du candidat. La taille maximale autorisée est de 3 Mo."),
  recipient_id: z
    .string()
    .transform((recipientId) => {
      const [collectionName, jobId] = recipientId.split("_")
      if (!ZJobCollectionName.safeParse(collectionName).success) {
        throw new Error(`Invalid collection name: ${collectionName}`)
      }
      if (collectionName === "partners" || collectionName === "recruiters") {
        if (!ObjectId.isValid(jobId)) {
          throw new Error(`Invalid job identifier: ${jobId}`)
        }
      } else {
        if (!validateSIRET(jobId)) {
          throw new Error(`Invalid siret identifier: ${jobId}`)
        }
      }
      return { collectionName: collectionName as IJobCollectionName, jobId }
    })
    .describe("Identifiant unique de la ressource vers laquelle la candidature est faite, préfixé par le nom de la collection"),
})

export const ZApplicationApiPublic = ZApplicationApiPrivate.omit({
  caller: true,
  job_searched_by_user: true,
  application_url: true,
})

export type IApplicationApiPublicOutput = z.output<typeof ZApplicationApiPublic>
export type IApplicationApiPrivateOutput = z.output<typeof ZApplicationApiPrivate>
export type IApplicationApiPublic = z.input<typeof ZApplicationApiPublic>
export type IApplicationApiPrivate = z.input<typeof ZApplicationApiPrivate>
export type IApplicationApiPrivateJSON = Jsonify<z.input<typeof ZApplicationApiPrivate>>
export type IApplicationApiPublicJSON = Jsonify<z.input<typeof ZApplicationApiPublic>>

export default {
  zod: ZApplication,
  indexes: [
    [{ company_siret: 1 }, {}],
    [{ job_id: 1 }, {}],
    [{ applicant_id: 1 }, {}],
    [{ applicant_id: 1, to_applicant_message_id: 1 }, {}],
    [{ scan_status: 1 }, {}],
    [{ scan_status: 1, to_applicant_message_id: 1 }, {}],
    [{ created_at: 1 }, {}],
    [{ company_email: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
