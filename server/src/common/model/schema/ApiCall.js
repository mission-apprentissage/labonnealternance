const apiCallSchema = {
  caller: {
    type: String,
    default: null,
    description: "...",
  },
  api: {
    type: String,
    default: null,
    description: "...",
  },
  result: {
    type: String,
    default: null,
    description: "...",
  },
  nb_formations: {
    type: Number,
    default: 0,
    description: "...",
  },
  nb_emplois: {
    type: Number,
    default: 0,
    description: "...",
  },
  result_count: {
    type: Number,
    default: 0,
    description: "...",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
};

module.exports = apiCallSchema;
