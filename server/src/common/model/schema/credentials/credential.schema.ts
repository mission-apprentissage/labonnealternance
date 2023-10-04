import { randomUUID } from "crypto"

import { ICredential } from "shared"

import { model, Schema } from "../../../mongodb"

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
  { timestamps: true, versionKey: false }
)

export default model<ICredential>("credential", credentialSchema)
