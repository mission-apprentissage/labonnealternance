import { IAnonymizedUserRecruteur } from "shared"

import { model, Schema } from "../../../mongodb"
import { mongoosePagination, Pagination } from "../_shared/mongoose-paginate"

import { nonPersonalInfosUserRecruteurSchema } from "./usersRecruteur.schema"

const anonymizedUserRecruteurSchema = new Schema<IAnonymizedUserRecruteur>(
  {
    ...nonPersonalInfosUserRecruteurSchema.obj,
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

anonymizedUserRecruteurSchema.plugin(mongoosePagination)

export default model<IAnonymizedUserRecruteur, Pagination<IAnonymizedUserRecruteur>>("anonymizedUserRecruteur", anonymizedUserRecruteurSchema)
