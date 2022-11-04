import { v4 as uuidv4 } from "uuid";
import { mongooseInstance } from "../../mongodb.js";

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
    apiKey: {
      type: String,
      default: () => `mna-${uuidv4()}`,
      index: true,
      required: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
