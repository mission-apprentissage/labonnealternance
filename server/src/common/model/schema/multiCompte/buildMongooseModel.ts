import mongoose, { Schema } from "mongoose"

import { mongoosePagination, Pagination } from "../_shared/mongoose-paginate"

const { model } = mongoose

export const buildMongooseModel = <T>(schema: Schema<T>, tableName: string) => {
  schema.plugin(mongoosePagination)

  return model<T, Pagination<T>>(tableName, schema)
}
