import { IAnonymizedUser } from "shared/models/anonymizedUsers.model"

import { model } from "../../../mongodb"

import { anonymizedUsersSchema } from "./anonymizedUsers.schema"

export default model<IAnonymizedUser>("anonymized_users", anonymizedUsersSchema)
