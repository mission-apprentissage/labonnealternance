import { Schema } from "mongoose"

export default new Schema({
  username: {
    type: String,
    default: null,
    description: "Le nom de l'utilisateur",
  },
  date: {
    type: Date,
    default: () => new Date(),
    description: "La date de l'evenement",
  },
  type: {
    type: String,
    default: null,
    description: "Le type d'action",
  },
  action: {
    type: String,
    default: null,
    description: "L'action ayant eu lieu",
  },
  data: {
    type: String,
    default: null,
    description: "La donnée liéé à l'action",
  },
})
