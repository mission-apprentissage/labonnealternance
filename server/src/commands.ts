import { captureException } from "@sentry/node"
import { program } from "commander"
// eslint-disable-next-line import/no-extraneous-dependencies
import HttpTerminator from "lil-http-terminator"

import { closeMongoConnection } from "common/mongodb"

import createComponents from "./common/components/components"
import { logger } from "./common/logger"
// import { closeSentry, initSentryProcessor } from "./common/services/sentry/sentry"
import { sleep } from "./common/utils/asyncUtils"
import config from "./config"
import server from "./http/server"
import { addJob, processor } from "./jobs/jobs_actions"

async function startJobProcessor(signal: AbortSignal) {
  logger.info(`Process jobs queue - start`)
  await addJob({
    name: "crons:init",
    queued: true,
  })

  await processor(signal)
  logger.info(`Processor shut down`)
}

function createProcessExitSignal() {
  const abortController = new AbortController()

  let shutdownInProgress = false
  ;["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    ;(process as NodeJS.EventEmitter).on(signal, async () => {
      try {
        if (shutdownInProgress) {
          const message = `Server shut down (FORCED) (signal=${signal})`
          logger.warn(message)
          // eslint-disable-next-line no-process-exit
          process.exit(1)
        }

        shutdownInProgress = true
        logger.info(`Server is shutting down (signal=${signal})`)
        abortController.abort()
      } catch (err) {
        captureException(err)
        logger.error({ err }, "error during shutdown")
      }
    })
  })

  return abortController.signal
}

program
  .configureHelp({
    sortSubcommands: true,
  })
  .hook("preAction", (_, actionCommand) => {
    const command = actionCommand.name()
    // on définit le module du logger en global pour distinguer les logs des jobs
    if (command !== "start") {
      logger.fields.module = `cli:${command}`
      // Pas besoin d'init Sentry dans le cas du server car il est start automatiquement
      // initSentryProcessor()
    }
  })
  .hook("postAction", async () => {
    await closeMongoConnection()
    // await closeSentry()
  })

program
  .command("start")
  .option("--withProcessor", "Exécution du processor également")
  .description("Démarre le serveur HTTP")
  .action(async ({ withProcessor = false }) => {
    try {
      const signal = createProcessExitSignal()

      const components = await createComponents() // using older version with mongoose

      const http = await server(components)
      const httpServer = http.listen(config.port, () => logger.info(`Server ready and listening on port ${config.port}`))

      const terminator = HttpTerminator({
        server: httpServer,
        maxWaitTimeout: 50_000,
        logger: logger,
      })

      if (signal.aborted) {
        await terminator.terminate()
        return
      }

      const tasks = [
        new Promise<void>((resolve, reject) => {
          signal.addEventListener("abort", async () => {
            try {
              await terminator.terminate()
              logger.warn("Server shut down")
              resolve()
            } catch (err) {
              reject(err)
            }
          })
        }),
      ]

      if (withProcessor) {
        tasks.push(startJobProcessor(signal))
      }

      await Promise.all(tasks)
    } catch (err) {
      logger.error(err)
      captureException(err)
      throw err
    }
  })

program
  .command("job_processor:start")
  .description("Run job processor")
  .action(async () => {
    const signal = createProcessExitSignal()
    if (config.disable_processors) {
      // The processor will exit, and be restarted by docker every day
      await sleep(24 * 3_600_000, signal)
      return
    }

    await startJobProcessor(signal)
  })

function createJobAction(name) {
  return async (options) => {
    try {
      const { queued = false, ...payload } = options
      const exitCode = await addJob({
        name,
        queued,
        payload,
      })

      if (exitCode) {
        program.error("Command failed", { exitCode })
      }
    } catch (err) {
      logger.error(err)
      program.error("Command failed", { exitCode: 2 })
    }
  }
}

program.command("db:validate").description("Validate Documents").option("-q, --queued", "Run job asynchronously", false).action(createJobAction("db:validate"))

program.command("migrations:up").description("Run migrations up").action(createJobAction("migrations:up"))

program.command("migrations:status").description("Check migrations status").action(createJobAction("migrations:status"))

program.command("migrations:create").description("Run migrations create").requiredOption("-d, --description <string>", "description").action(createJobAction("migrations:create"))

program
  .command("indexes:create")
  .description("Creation des indexes mongo")
  .option("-d, --drop", "Supprime les indexes existants avant de les recréer")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("indexes:create"))

program
  .command("indexes:recreate")
  .description("Drop and recreate indexes")
  .option("-d, --drop", "Drop indexes before recreating them")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("indexes:recreate"))

/********************/

program
  .command("index [index_list]")
  .description("Synchronise les index des collections mongo & reconstruit les index elasticsearch. <index_list> est la liste des index séparés par des , ")
  .option("-q, --queued", "Run job asynchronously", false)
  // .action((index_list) => {
  //   runScript(() => generateIndexes(index_list))
  // })
  .action(createJobAction("indexes:generate"))

program
  .command("create-user <first_name> <last_name> <email> <scope> <establishment_raison_sociale> [establishment_siret] [phone] [address]")
  .description("Permet de créer un accès utilisateur à l'espace partenaire")
  .option("-admin, [isAdmin]", "utilisateur administrateur", false)
  .requiredOption("-type, <type>", "type d'utilisateur")
  .requiredOption("-email_valide, <email_valide>", "email valide", true)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("user:create"))
// .action((first_name, last_name, email, scope, establishment_raison_sociale, establishment_siret, phone, address, options) => {
//   runScript(() =>
//     createUserFromCLI(
//       {
//         first_name,
//         last_name,
//         establishment_siret,
//         establishment_raison_sociale,
//         phone,
//         address,
//         email,
//         scope,
//       },
//       { options }
//     )
//   )
// })

program
  .command("create-api-user <nom> <prenom> <email> <organization> <scope>")
  .description("Permet de créer un utilisateur ayant accès à l'API")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("api:user:create"))
// .action((nom, prenom, email, organization, scope) => {
//   runScript(() => createApiUser(nom, prenom, email, organization, scope))
// })

program
  .command("reset-api-user <email>")
  .description("Permet de réinitialiser la clé API d'un utilisateur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("api:user:reset"))
// .action((email) => {
//   runScript(() => resetApiKey(email))
// })

program
  .command("disable-api-user <email> [state]")
  .description("Permet de d'activer/désactiver l'accès d'un utilisateur à l'API")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("api:user:disable"))
// .action((email, state) => {
//   runScript(() => disableApiUser(email, state))
// })

program
  .command("relance-formulaire <threshold>")
  .description("Envoie une relance par mail pour les offres expirant dans 7 jours")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("formulaire:relance"))
// .action((threshold) => {
//   runScript(() => relanceFormulaire(parseInt(threshold)))
// })

program
  .command("annulation-formulaire")
  .description("Annule les offres pour lesquels la date d'expiration est correspondante à la date actuelle")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("formulaire:annulation"))
// .action(() => {
//   runScript(() => annuleFormulaire())
// })

program
  .command("creer-offre-metabase")
  .description("Permet de créer une collection dédiée aux offres pour metabase")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("metabase:offre:create"))
// .action(() => {
//   runScript(() => createOffreCollection())
// })

program
  .command("relance-opco")
  .description("Relance les opco avec le nombre d'utilisateur en attente de validation")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("opco:relance"))
// .action(() => {
//   runScript(() => relanceOpco())
// })

program
  .command("export-offre-pole-emploi")
  .description("Exporte les offres vers Pôle Emploi")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("pe:offre:export"))
// .action(() => {
//   runScript((components) => exportPE(components))
// })

program
  .command("validate-user")
  .description("Contrôle de validation des entreprises en attente de validation")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("user:validate"))
// .action(() => {
//   runScript(() => checkAwaitingCompaniesValidation())
// })

program
  .command("update-siret-infos-in-error")
  .description("Remplis les données venant du SIRET pour les utilisateurs ayant eu une erreur pendant l'inscription")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("siret:inError:update"))
// .action(() => {
//   runScript(() => updateSiretInfosInError())
// })

/**
 *
 *
 * JOB ORGANISME DE FORMATION
 *
 *
 */

program
  .command("activate-opt-out-etablissement-formations")
  .description("Active tous les établissements qui ont souscrits à l'opt-out.")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:formations:activate:opt-out"))
// .action(() => {
//   runScript(() => activateOptOutEtablissementFormations())
// })

program
  .command("invite-etablissement-to-opt-out")
  .description("Invite les établissements (via email décisionnaire) à l'opt-out.")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:opt-out"))
// .action(() => {
//   runScript(() => inviteEtablissementToOptOut())
// })

program
  .command("invite-etablissement-to-premium")
  .description("Invite les établissements (via email décisionnaire) au premium (Parcoursup)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:premium"))
// .action(() => {
//   runScript(() => inviteEtablissementToPremium())
// })

export async function startCLI() {
  await program.parseAsync(process.argv)
}
