import { ILbaCompany } from "shared"

import { model } from "../../../mongodb"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"

export default model<ILbaCompany>("bonnesboitesnondiffusibles", lbaCompanySchema)
