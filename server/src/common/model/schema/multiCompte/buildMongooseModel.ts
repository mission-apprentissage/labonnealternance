import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import mongoose, { Schema } from "mongoose"

const { model } = mongoose

export const buildMongooseModel = <T>(schema: Schema<T>, tableName: string) => {
  schema.plugin(mongoosePagination)

  return model<T, Pagination<T>>(tableName, schema)
}
