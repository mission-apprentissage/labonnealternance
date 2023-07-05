import { randomUUID } from "crypto"
import { model, Schema } from "../../../common/mongodb.js"
import { ICredential } from "./credential.types.js"

export const credentialSchema = new Schema<ICredential>(
  {
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      required: true,
    },
    organisation: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    api_key: {
      type: String,
      default: () => `mna-${randomUUID()}`,
      index: true,
      required: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default model<ICredential>("credential", credentialSchema)
