import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "mongoose"

export const buildMongooseModel = <T>(schema: Schema<T>, tableName: string) => {
  schema.plugin(mongoosePagination)

  return model<T, Pagination<T>>(tableName, schema)
}
