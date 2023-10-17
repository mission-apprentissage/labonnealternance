import { CronName } from "@/jobs/jobs"

interface IInternalJobsSimple {
  _id: string
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
  _id: string
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
  _id: string
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

export type { CronName, IInternalJobs, IInternalJobsCron, IInternalJobsSimple, IInternalJobsCronTask }
