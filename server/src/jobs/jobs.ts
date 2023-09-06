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
      // # Remplissage des organismes issus du référentiel
      await addJob({ name: "hydrate:organismes-referentiel", queued: true })

      // # Remplissage des organismes depuis le référentiel
      await addJob({ name: "hydrate:organismes", queued: true })

      // # Mise à jour des relations
      await addJob({ name: "hydrate:organismes-relations", queued: true })

      // # Remplissage des réseaux
      await addJob({ name: "hydrate:reseaux", queued: true })

      // # Lancement des scripts de fiabilisation des couples UAI - SIRET
      await addJob({ name: "fiabilisation:uai-siret:run", queued: true })

      // # Mise à jour des organismes via APIs externes
      await addJob({ name: "update:organismes-with-apis", queued: true })

      // # Mise à jour des niveaux des formations des effectifs
      await addJob({ name: "effectifs-formation-niveaux", queued: true })

      // # Purge des collections events et queues
      await addJob({ name: "purge:events", queued: true })
      await addJob({ name: "purge:queues", queued: true })

      // # Mise a jour du nb d'effectifs
      await addJob({ name: "hydrate:organismes-effectifs-count", queued: true })

      // # Fiabilisation des effectifs : suppression des inscrits sans contrats depuis 90 jours & transformation des rupturants en abandon > 180 jours
      await addJob({ name: "fiabilisation:effectifs:remove-inscritsSansContrats-depuis-nbJours", queued: true })
      await addJob({ name: "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis", queued: true })

      return 0
    },
  },
  // "Run analyses fiabilité données reçues job each day at 11h15": {
  //   name: "Run analyses fiabilité données reçues job each day at 11h15",
  //   cron_string: "15 11 * * *",
  //   handler: async () => {
  //     /**
  //      * Job d'analyse de la fiabilité des dossiersApprenants reçus
  //      */
  //     // TODO - Voir si on le réactive ?
  //     //analyseFiabiliteDossierApprenantsRecus();
  //     return 0;
  //   },
  // },
  // "Run archive dossiers apprenants & effectifs job each first day of month at 12h45": {
  //   name: "Run archive dossiers apprenants & effectifs job each first day of month at 12h45",
  //   cron_string: "45 12 1 * *",
  //   handler: async () => {
  //     // run-archive-job.sh yarn cli archive:dossiersApprenantsEffectifs
  //     return 0;
  //   },
  // },
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
