import { captureException, getCurrentHub, runWithAsyncContext } from "@sentry/node"
import { formatDuration, intervalToDuration } from "date-fns"

import { IInternalJobs, IInternalJobsSimple } from "@/common/model/internalJobs.types"
import { sleep } from "@/common/utils/asyncUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

import { getLoggerWithContext } from "../common/logger"
import { getDbCollection } from "../common/utils/mongodbUtils"
import config from "../config"

import { createJobSimple, updateJob } from "./job.actions"
import { runJob } from "./jobs"

const logger = getLoggerWithContext("script")

type AddJobSimpleParams = Pick<IInternalJobsSimple, "name" | "payload"> &
  Partial<Pick<IInternalJobsSimple, "scheduled_for">> & { queued?: boolean; productionOnly?: boolean; disallowPentest?: boolean }

export async function addJob({ name, payload, scheduled_for = new Date(), queued = false, productionOnly = false, disallowPentest = true }: AddJobSimpleParams): Promise<number> {
  if (config.env !== "production" && productionOnly) {
    return 0
  }

  // disable all jobs on pentest env
  if (config.env === "pentest" && disallowPentest) {
    return 0
  }

  const job = await createJobSimple({
    name,
    payload,
    scheduled_for,
    sync: !queued,
  })

  if (!queued && job) {
    return runJob(job)
  }

  return 0
}

export async function processor(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return
  }

  logger.debug(`Process jobs queue - looking for a job to execute`)

  const nextJob = await getDbCollection("internalJobs").findOneAndUpdate(
    {
      type: { $in: ["simple", "cron_task"] },
      status: "pending",
      scheduled_for: { $lte: new Date() },
    },
    { $set: { status: "will_start" } },
    { sort: { scheduled_for: 1 } }
  )

  if (nextJob) {
    logger.info({ job: nextJob.name }, "job will start")
    await runJob(nextJob)
  } else {
    await sleep(45_000, signal) // 45 secondes
  }

  return processor(signal)
}

const runner = async (job: IInternalJobs, jobFunc: () => Promise<unknown>): Promise<number> => {
  const jobLogger = logger.child({
    _id: job._id,
    jobName: job.name,
    created_at: job.created_at,
    updated_at: job.updated_at,
  })

  jobLogger.info("job started")
  const startDate = new Date()
  await updateJob(job._id, {
    status: "running",
    started_at: startDate,
  })
  let error: Error | undefined = undefined
  let result: unknown = undefined

  try {
    result = await jobFunc()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    captureException(err)
    jobLogger.error({ err, writeErrors: err.writeErrors, error: err }, "job error")
    await notifyToSlack({ subject: `Job ${job.name}`, message: `error while running job with id=${job._id}`, error: true })
    error = err?.stack
  }

  const endDate = new Date()
  const ts = endDate.getTime() - startDate.getTime()
  const duration = formatDuration(intervalToDuration({ start: startDate, end: endDate })) || `${ts}ms`
  const status = error ? "errored" : "finished"
  await updateJob(job._id, {
    status: error ? "errored" : "finished",
    output: { duration, result, error },
    ended_at: endDate,
  })

  jobLogger.info({ status, duration }, "job ended")

  if (error) {
    jobLogger.error({ error }, error.constructor.name === "EnvVarError" ? error.message : error)
  }

  return error ? 1 : 0
}

export function executeJob(job: IInternalJobs, jobFunc: () => Promise<unknown>) {
  return runWithAsyncContext(async () => {
    const hub = getCurrentHub()
    const transaction = hub?.startTransaction({
      name: `JOB: ${job.name}`,
      op: "processor.job",
    })
    hub?.configureScope((scope) => {
      scope.setSpan(transaction)
      scope.setTag("job", job.name)
      // scope.setContext("job", job) // TODO
    })
    const start = Date.now()
    try {
      return await runner(job, jobFunc)
    } finally {
      transaction?.setMeasurement("job.execute", Date.now() - start, "millisecond")
      transaction?.finish()
    }
  })
}
