import { ILbaCompany } from "shared"

import { model } from "../../../mongodb.js"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"

export default model<ILbaCompany>("bonnesboiteslegacy", lbaCompanySchema)
