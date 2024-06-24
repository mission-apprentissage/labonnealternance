import cronParser from "cron-parser"

import { IInternalJobsCron } from "@/common/model/internalJobs.types"
import config from "@/config"

import { getLoggerWithContext } from "../common/logger"
import { getDbCollection } from "../common/utils/mongodbUtils"

import { createJobCron, createJobCronTask, createJobSimple, findJob, findJobs, updateJob } from "./job.actions"
import { CRONS } from "./jobs"
import { addJob } from "./jobs_actions"

const logger = getLoggerWithContext("script")

function parseCronString(cronString: string, options: { currentDate: string } | object = {}) {
  return cronParser.parseExpression(cronString, {
    tz: "Europe/Paris",
    ...options,
  })
}

export async function cronsInit() {
  if (config.env === "preview") {
    return
  }

  logger.info(`Crons - initialise crons in DB`)
  await getDbCollection("internalJobs").deleteMany({ type: "cron" })
  await getDbCollection("internalJobs").deleteMany({
    status: { $in: ["pending", "will_start"] },
    type: "cron_task",
  })

  if (!CRONS.length) {
    return
  }

  for (const cron of CRONS) {
    await createJobCron({
      name: cron.name,
      cron_string: cron.cron_string,
      scheduled_for: new Date(),
      sync: true,
    })
  }

  await addJob({ name: "crons:scheduler", queued: true, payload: {} })
}

export async function cronsScheduler(): Promise<void> {
  logger.info(`Crons - Check and run crons`)

  const crons = await findJobs<IInternalJobsCron>(
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
    await createJobCronTask({
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
  await createJobSimple({
    name: "crons:scheduler",
    scheduled_for: cron.scheduled_for,
    sync: false,
    payload: {},
  })
}
