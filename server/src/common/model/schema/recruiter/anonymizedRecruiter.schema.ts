import { IAnonymizedRecruiter } from "shared"

import { model, Schema } from "../../../mongodb"
import { mongoosePagination, Pagination } from "../_shared/mongoose-paginate"

import { nonPersonalInfosRecruiterSchema } from "./recruiter.schema"

const anonymizedRecruiterSchema = new Schema<IAnonymizedRecruiter>(
  {
    ...nonPersonalInfosRecruiterSchema.obj,
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

anonymizedRecruiterSchema.index({ "jobs._id": 1 })
anonymizedRecruiterSchema.plugin(mongoosePagination)

export default model<IAnonymizedRecruiter, Pagination<IAnonymizedRecruiter>>("anonymizedrecruiter", anonymizedRecruiterSchema)
