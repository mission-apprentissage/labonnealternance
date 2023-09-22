const schema = {
  siret_code: {
    type: String,
    default: null,
    description: "SIRET de l'établissement",
  },
  email: {
    type: String,
    default: null,
    description: "Email gestionnaire de l'établissement",
  },
  cfa_read_company_detail_at: {
    type: Date,
    default: null,
    description: "Date de consultation de l'offre",
  },
}

module.exports = { schema }
