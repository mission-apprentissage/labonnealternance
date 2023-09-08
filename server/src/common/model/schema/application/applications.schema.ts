import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../mongodb.js"
import { IApplication } from "./applications.types.js"
import { ApplicantRole } from "../multiCompte/application2.types.js"
import { ObjectId } from "mongodb"

export const applicationSchema = new Schema<IApplication>({
  applicant_email: {
    type: String,
    default: null,
    description: "Adresse email candidat",
  },
  applicant_first_name: {
    type: String,
    default: null,
    description: "Prénom du candidat",
  },
  applicant_last_name: {
    type: String,
    default: null,
    description: "Nom du candidat",
  },
  applicant_phone: {
    type: String,
    default: null,
    description: "Téléphone du candidat",
  },
  applicant_attachment_name: {
    type: String,
    default: null,
    description: "Nom du fichier du CV du candidat",
  },
  applicant_message_to_company: {
    type: String,
    default: null,
    required: false,
    description: "Le message envoyé par le candidat",
  },
  company_recruitment_intention: {
    type: String,
    default: null,
    required: false,
    description: "L'intention de la société vis à vis du candidat",
  },
  company_feedback: {
    type: String,
    default: null,
    required: false,
    description: "L'avis donné par la société",
  },
  company_feedback_date: {
    type: Date,
    default: null,
    required: false,
    description: "Date d'intention/avis donnée",
  },
  company_siret: {
    type: String,
    default: null,
    description: "Le siret de l'établissement",
    index: true,
  },
  company_email: {
    type: String,
    default: null,
    description: "L'adresse email de destination de la candidature",
  },
  company_name: {
    type: String,
    default: null,
    description: "Le nom de la société",
  },
  company_naf: {
    type: String,
    default: null,
    description: "Le label naf de la société",
  },
  company_address: {
    type: String,
    default: null,
    description: "L'adresse physique de la société",
  },
  job_origin: {
    type: String,
    default: null,
    description: "Le type de société / offre au sens source d'info La bonne alternance. Ex : lba, lbb, matcha, pejob",
  },
  job_title: {
    type: String,
    default: null,
    description: "Le titre de l'offre à laquelle répond le candidat",
  },
  job_id: {
    type: String,
    default: null,
    description: "L'id externe de l'offre d'emploi",
    index: true,
  },
  to_applicant_message_id: {
    type: String,
    default: null,
    description: "Identifiant chez le transporteur du mail envoyé au candidat",
  },
  to_company_message_id: {
    type: String,
    default: null,
    description: "Identifiant chez le transporteur du mail envoyé à l'entreprise",
  },
  caller: {
    type: String,
    default: null,
    description: "L'identification de la source d'émission de la candidature (pour widget et api)",
  },
  is_anonymized: {
    type: Boolean,
    default: false,
    description: "Indique si la candidature a été anonymisée",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "La date création de la demande",
  },
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
  },
  applicant_role: {
    type: String,
    enum: Object.values(ApplicantRole),
    description: "type de candidat: parent | student",
  },
  applicant_id: {
    type: ObjectId,
    description: "id de l'utilisateur qui a postulé",
  },
})

applicationSchema.plugin(mongoosePagination)

export default model<IApplication, Pagination<IApplication>>("applications", applicationSchema)
