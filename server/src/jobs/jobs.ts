// import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations"
import { IInternalJobs } from "common/model/schema/internalJobs/internalJobs.types"

import { getLoggerWithContext } from "../common/logger"

import { cronsInit, cronsScheduler } from "./crons_actions"
// import { findInvalidDocuments } from "./db/findInvalidDocuments"
// import { recreateIndexes } from "./db/recreateIndexes"
// import { validateModels } from "./db/schemaValidation"
import { addJob, executeJob } from "./jobs_actions"

const logger = getLoggerWithContext("script")

interface CronDef {
  name: string
  cron_string: string
  handler: () => Promise<number>
}

export const CRONS: Record<string, CronDef> = {
  "Run daily jobs each day at 02h30": {
    name: "Run daily jobs each day at 02h30",
    cron_string: "30 2 * * *",
    handler: async () => {
      return 0
    },
  },
}

export async function runJob(job: IInternalJobs): Promise<number> {
  return executeJob(job, async () => {
    if (job.type === "cron_task") {
      return CRONS[job.name].handler()
    }
    switch (job.name) {
      case "db:find-invalid-documents":
        //findInvalidDocuments((job.payload as any)?.collection)
        return
      case "indexes:create":
      case "indexes:recreate":
        //recreateIndexes((job.payload as any)?.drop)
        return
      case "db:validate":
        //validateModels()
        return
      case "migrations:up": {
        // await upMigration()
        // Validate all documents after the migration
        await addJob({ name: "db:validate", queued: true })
        return
      }
      case "migrations:status": {
        // const pendingMigrations = await statusMigration()
        // console.log(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`)
        console.log(`migrations-status=synced`)
        return
      }
      case "migrations:create":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // createMigration(job.payload as any)
        return
      case "crons:init": {
        await cronsInit()
        return
      }
      case "crons:scheduler":
        return cronsScheduler()

      default: {
        logger.warn(`Job not found ${job.name}`)
      }
    }
  })
}
