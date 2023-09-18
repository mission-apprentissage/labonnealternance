import { model } from "../../../mongodb.js"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"
import { ILbaCompany } from "../lbaCompany/lbaCompany.types.js"

export default model<ILbaCompany>("bonnesboiteslegacy", lbaCompanySchema)
