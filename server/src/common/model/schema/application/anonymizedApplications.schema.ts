import { allLbaItemType } from "shared/constants/lbaitem"
import { IAnonymizedApplication } from "shared/models/anonymizedApplications.model"

import { model, Schema } from "../../../mongodb"
import { mongoosePagination, Pagination } from "../_shared/mongoose-paginate"

export const anonymizedApplicationSchema = new Schema<IAnonymizedApplication>(
  {
    company_recruitment_intention: {
      type: String,
      default: null,
      required: false,
      description: "L'intention de la société vis à vis du candidat",
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
    company_naf: {
      type: String,
      default: null,
      description: "Le label naf de la société",
    },
    job_origin: {
      type: String,
      default: null,
      enum: allLbaItemType,
      description: "Le type de société / offre au sens source d'info La bonne alternance",
    },
    job_id: {
      type: String,
      default: null,
      description: "L'id externe de l'offre d'emploi",
      index: true,
    },
    caller: {
      type: String,
      default: null,
      description: "L'identification de la source d'émission de la candidature (pour widget et api)",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "La date création de la demande",
    },
  },
  {
    versionKey: false,
  }
)

anonymizedApplicationSchema.plugin(mongoosePagination)

export default model<IAnonymizedApplication, Pagination<IAnonymizedApplication>>("anonymizedapplications", anonymizedApplicationSchema)
