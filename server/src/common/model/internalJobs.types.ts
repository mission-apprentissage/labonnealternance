import { ObjectId } from "mongodb"

import { CronName } from "@/jobs/jobs"

/*
  name: Le nom de la tâche
  type: Type du job simple ou cron
  status: Statut courant du job
  sync: Si le job est synchrone
  payload: La donnée liéé à la tâche
  output: Les valeurs de retours du job
  cron_string: standard cron string exemple: '*\/2 * * * *'
  scheduled_for: Date de lancement programmée
  started_at: Date de lancement
  ended_at: Date de fin d'execution
  updated_at: Date de mise à jour en base de données
  created_at: Date d'ajout en base de données
*/

interface IInternalJobsSimple {
  _id: ObjectId
  name: string
  type: "simple"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  payload: Record<string, any>
  output?: Record<string, unknown> | undefined
  scheduled_for: Date
  started_at?: Date
  ended_at?: Date
  updated_at: Date
  created_at: Date
}

interface IInternalJobsCron {
  _id: ObjectId
  name: CronName
  type: "cron"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  cron_string: string
  scheduled_for: Date
  updated_at: Date
  created_at: Date
}

interface IInternalJobsCronTask {
  _id: ObjectId
  name: CronName
  type: "cron_task"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  scheduled_for: Date
  started_at?: Date
  ended_at?: Date
  updated_at: Date
  created_at: Date
}

type IInternalJobs = IInternalJobsSimple | IInternalJobsCron | IInternalJobsCronTask

export type { CronName, IInternalJobs, IInternalJobsCron, IInternalJobsCronTask, IInternalJobsSimple }
