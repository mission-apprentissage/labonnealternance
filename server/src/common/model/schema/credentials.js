const generator = require("generate-password");
const { KEY_GENERATOR_PARAMS } = require("../../constants");
const { Schema } = require("mongoose");

module.exports = new Schema(
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
      default: () => `mna-${generator.generate(KEY_GENERATOR_PARAMS())}`,
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
