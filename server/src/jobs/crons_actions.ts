import cronParser from "cron-parser"

import { createJob, findJob, findJobs, updateJob } from "../common/actions/job.actions"

import { CRONS } from "./jobs.js"
import { addJob } from "./jobs_actions.js"

import { getLoggerWithContext } from "../common/logger.js"
const logger = getLoggerWithContext("script")

function parseCronString(cronString: string, options: { currentDate: string } | object = {}) {
  return cronParser.parseExpression(cronString, {
    tz: "Europe/Paris",
    ...options,
  })
}
const db //TODO
export async function cronsInit() {
  logger.info(`Crons - initialise crons in DB`)
  await db.collection("internalJobs").deleteMany({ type: "cron" })
  await db.collection("internalJobs").deleteMany({
    status: "pending",
    type: "cron_task",
  })

  if (!Object.keys(CRONS).length) {
    return
  }

  for (const cron of Object.values(CRONS)) {
    await createJob({
      name: cron.name,
      type: "cron",
      cron_string: cron.cron_string,
      scheduled_for: new Date(),
    })
  }

  await addJob({ name: "crons:scheduler", queued: true })
}

export async function cronsScheduler(): Promise<void> {
  logger.info(`Crons - Check and run crons`)

  const crons = await findJobs(
    {
      type: "cron",
      scheduled_for: { $lte: new Date() },
    },
    { sort: { scheduled_for: 1 } }
  )

  for (const cron of crons) {
    const next = parseCronString(cron.cron_string ?? "", {
      currentDate: cron.scheduled_for,
    }).next()
    await createJob({
      type: "cron_task",
      name: cron.name,
      scheduled_for: next.toDate(),
    })

    await updateJob(cron._id, {
      scheduled_for: next.toDate(),
    })
  }
  const cron = await findJob(
    {
      type: "cron",
    },
    { sort: { scheduled_for: 1 } }
  )

  if (!cron) return

  cron.scheduled_for.setSeconds(cron.scheduled_for.getSeconds() + 1) // add DELTA of 1 sec
  await createJob({
    type: "simple",
    name: "crons:scheduler",
    scheduled_for: cron.scheduled_for,
  })
}
