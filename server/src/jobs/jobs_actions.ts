import { captureException, getCurrentHub, runWithAsyncContext } from "@sentry/node"
import { formatDuration, intervalToDuration } from "date-fns"

import { InternalJobs } from "common/model"
import { IInternalJobs } from "common/model/schema/internalJobs/internalJobs.types"
import { sleep } from "common/utils/asyncUtils"

import { getLoggerWithContext } from "../common/logger"

import { createJob, updateJob } from "./job.actions"
import { runJob } from "./jobs"

const logger = getLoggerWithContext("script")

export async function addJob({
  name,
  type = "simple",
  payload = {},
  scheduled_for = new Date(),
  queued = false,
}: Pick<IInternalJobs, "name"> & Partial<Pick<IInternalJobs, "type" | "payload" | "scheduled_for">> & { queued?: boolean }): Promise<number> {
  const job = await createJob({
    name,
    type,
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

  const { value: nextJob } = await InternalJobs.findOneAndUpdate(
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
    const transaction = hub.startTransaction({
      name: `JOB: ${job.name}`,
      op: "processor.job",
    })
    hub.configureScope((scope) => {
      scope.setSpan(transaction)
      scope.setTag("job", job.name)
      scope.setContext("job", job)
    })
    const start = Date.now()
    try {
      return await runner(job, jobFunc)
    } finally {
      transaction.setMeasurement("job.execute", Date.now() - start, "millisecond")
      transaction.finish()
    }
  })
}
