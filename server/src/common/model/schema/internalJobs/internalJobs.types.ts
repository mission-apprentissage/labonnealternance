interface IInternalJobs {
  _id: string
  name: string
  type: "simple" | "cron" | "cron_task"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  payload: any
  output: any
  cron_string?: string
  scheduled_for: Date
  started_at?: Date
  ended_at?: Date
  updated_at?: Date
  created_at?: Date | undefined
}

export { IInternalJobs }
