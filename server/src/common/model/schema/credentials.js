import { mongooseInstance } from "../../mongodb.js"

import { randomUUID } from "crypto"

export const credentialSchema = mongooseInstance.Schema(
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
