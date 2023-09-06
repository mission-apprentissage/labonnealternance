import { model, Schema } from "../../../mongodb.js"
import { IInternalJobs } from "./internalJobs.types.js"

export const internalJobsSchema = new Schema<IInternalJobs>({
  name: { type: String, description: "Le nom de la tâche" },
  type: {
    type: String,
    enum: ["simple", "cron", "cron_task"],
    description: "Type du job simple ou cron",
  },
  status: {
    type: String,
    enum: ["pending", "will_start", "running", "finished", "blocked", "errored"],
    description: "Statut courant du job",
  },
  sync: {
    type: Boolean,
    description: "Si le job est synchrone",
  },
  payload: {
    description: "La donnée liéé à la tâche",
  },
  output: {
    description: "Les valeurs de retours du job",
  },
  cron_string: {
    type: String,
    description: "standard cron string exemple: '*/2 * * * *'",
  },
  scheduled_for: {
    type: Date,
    description: "Date de lancement programmée",
  },
  started_at: {
    type: Date,
    description: "Date de lancement",
  },
  ended_at: {
    type: Date,
    description: "Date de fin d'execution",
  },
  updated_at: {
    type: Date,
    description: "Date de mise à jour en base de données",
  },
  created_at: {
    type: Date,
    description: "Date d'ajout en base de données",
  },
})

internalJobsSchema.index({ type: 1, scheduled_for: 1 }, { name: "type_scheduled_for" })
internalJobsSchema.index({ type: 1, status: 1, scheduled_for: 1 }, { name: "type_status_scheduled_for" })
internalJobsSchema.index({ ended_at: 1 }, { expireAfterSeconds: 3600 * 24 * 90 }) // 3 mois

export default model<IInternalJobs>("internalJob", internalJobsSchema)
