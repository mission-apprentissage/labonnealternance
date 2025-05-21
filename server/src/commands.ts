import { captureException } from "@sentry/node"
import { program } from "commander"
import { addJob, startJobProcessor } from "job-processor"
import HttpTerminator from "lil-http-terminator"

import { closeMemoryCache } from "./common/apis/client"
import { logger } from "./common/logger"
import { closeSentry } from "./common/sentry/sentry"
import { closeMongodbConnection } from "./common/utils/mongodbUtils"
import { notifyToSlack } from "./common/utils/slackUtils"
import config from "./config"
import { bindProcessorServer } from "./http/jobProcessorServer"
import { bindFastifyServer } from "./http/server"
import { setupJobProcessor } from "./jobs/jobs"
import { SimpleJobDefinition, simpleJobDefinitions } from "./jobs/simpleJobDefinitions"

async function setupAndStartProcessor(signal: AbortSignal, shouldStartWorker: boolean) {
  logger.info("Setup job processor")
  await setupJobProcessor()
  if (shouldStartWorker) {
    logger.info(`Process jobs queue - start`)
    await startJobProcessor(signal)
    logger.info(`Processor shut down`)
  }
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
          // eslint-disable-next-line n/no-process-exit
          process.exit(1)
        }

        shutdownInProgress = true
        logger.info(`Server is shutting down (signal=${signal})`)
        abortController.abort()
      } catch (err) {
        captureException(err)
        logger.error(err, "error during shutdown")
      }
    })
  })

  return abortController.signal
}

program
  .configureHelp({
    sortSubcommands: true,
  })
  .showSuggestionAfterError()
  .hook("preAction", (_, actionCommand) => {
    const command = actionCommand.name()
    // on définit le module du logger en global pour distinguer les logs des jobs
    if (command !== "start") {
      logger.fields.module = `cli:${command}`
    }
    logger.info(`Starting command ${command}`)
  })
  .hook("postAction", async () => {
    await Promise.all([closeMongodbConnection(), closeMemoryCache()])
    await closeSentry()

    setTimeout(async () => {
      await notifyToSlack({ error: true, subject: "Process not released", message: "Review open handles using wtfnode" })
      // eslint-disable-next-line n/no-process-exit
      process.exit(1)
    }, 10_000).unref()
  })

program
  .command("start")
  .option("--withProcessor", "Exécution du processor également")
  .description("Démarre le serveur HTTP")
  .action(async ({ withProcessor = false }) => {
    try {
      const signal = createProcessExitSignal()
      const httpServer = await bindFastifyServer()
      await httpServer.ready()
      await httpServer.listen({ port: config.port, host: "0.0.0.0" })
      logger.info(`Server ready and listening on port ${config.port}`)

      const terminator = HttpTerminator({
        server: httpServer.server,
        maxWaitTimeout: 50_000,
        logger: logger,
      })

      if (signal.aborted) {
        await terminator.terminate()
        return
      }

      await Promise.all([
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
        setupAndStartProcessor(signal, withProcessor),
      ])
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
    try {
      const signal = createProcessExitSignal()
      const httpServer = await bindProcessorServer()
      await httpServer.ready()
      await httpServer.listen({ port: config.port, host: "0.0.0.0" })
      logger.info(`Server ready and listening on port ${config.port}`)

      const terminator = HttpTerminator({
        server: httpServer.server,
        maxWaitTimeout: 50_000,
        logger: logger,
      })

      if (signal.aborted) {
        await terminator.terminate()
        return
      }

      await Promise.all([
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
        setupAndStartProcessor(signal, true),
      ])
    } catch (err) {
      logger.error(err)
      captureException(err)
      throw err
    }
  })

function createJobAction(name) {
  return async (options) => {
    try {
      const { queued = false, ...payload } = options
      await setupJobProcessor()
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

program
  .command("recreate:indexes")
  .description("Recreate MongoDB indexes")
  .option("-d, --drop", "Drop all indexes before recreating them", false)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recreate:indexes"))

program.command("db:validate").description("Validate Documents").option("-q, --queued", "Run job asynchronously", false).action(createJobAction("db:validate"))

program
  .command("remove:duplicates:recruiters")
  .description("Remove duplicate recruiters based on SIRET and EMAIL")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("remove:duplicates:recruiters"))

program
  .command("anonymize-individual")
  .description("Anonymize elements based on id")
  .requiredOption("-c, --collection <string>", " <collection> est la collection sur laquelle s'applique la modification")
  .requiredOption("-i, --id <string>", " <id> est l'identifiant de l'élément à anonymiser")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("anonymize-individual"))

program.command("migrations:up").description("Run migrations up").action(createJobAction("migrations:up"))

program.command("migrations:status").description("Check migrations status").action(createJobAction("migrations:status"))

program.command("migrations:create").description("Run migrations create").requiredOption("-d, --description <string>", "description").action(createJobAction("migrations:create"))

program
  .command("create-api-user")
  .description("Permet de créer un utilisateur ayant accès à l'API")
  .requiredOption("--nom <string>", "nom de l'utilisateur")
  .requiredOption("--prenom <string>", "prenom de l'utilisateur")
  .requiredOption("--email <string>", "email de l'utilisateur")
  .requiredOption("--organization <string>", "organization de l'utilisateur")
  .requiredOption("--scope <string>", "scope")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("api:user:create"))

program
  .command("reset-api-user")
  .description("Permet de réinitialiser la clé API d'un utilisateur")
  .requiredOption("--email <string>", "email de l'utilisateur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("api:user:reset"))

program
  .command("disable-api-user")
  .description("Permet de d'activer/désactiver l'accès d'un utilisateur à l'API")
  .requiredOption("--email <string>", "email de l'utilisateur")
  .option("-s, --state", "state", false)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("api:user:disable"))

program
  .command("recruiterOfferExpirationReminderJob")
  .description("Envoie une relance par mail pour les offres expirant dans 7 jours")
  .requiredOption("--threshold <string>", "threshold")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recruiterOfferExpirationReminderJob"))

program
  .command("export-offre-pole-emploi")
  .description("Exporte les offres vers France Travail")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("pe:offre:export"))

program
  .command("francetravail:jobs:import")
  .description("Récupération des offres de France Travail")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("francetravail:jobs:import"))
program
  .command("francetravail:jobs:classify")
  .description("Classification des offres de France Travail")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("francetravail:jobs:classify"))

/**
 *
 *
 * JOB ORGANISME DE FORMATION
 *
 *
 */

program
  .command("etablissement:invite:premium:follow-up")
  .description("(Relance) Invite les établissements (via email décisionnaire) au premium (Parcoursup)")
  .option("-q, --queued", "Run job asynchronously", false)
  .option("-b, --bypassDate", "Run follow-up now without the 10 days waiting", false)
  .action(createJobAction("etablissement:invite:premium:follow-up"))

program
  .command("etablissement:invite:premium:affelnet:follow-up")
  .description("(Relance) Invite les établissements (via email décisionnaire) au premium (Affelnet)")
  .option("-q, --queued", "Run job asynchronously", false)
  .option("-b, --bypassDate", "Run follow-up now without the 10 days waiting", false)
  .action(createJobAction("etablissement:invite:premium:affelnet:follow-up"))

/**
 *
 *
 * JOB CANDIDAT
 *
 *
 */

program
  .command("sync-sib-blocked")
  .description("Récupère auprès de Brevo la liste des adresses emails bloquées le jour précédent (défaut) ou toutes les adresses bloquées (option)")
  .option("-a, [AllAddresses]", "pour récupérer toutes les adresses bloquées", false)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("brevo:blocked:sync"))

program
  .command("update-geo-locations")
  .description("Procède à la géolocalisation de masse des sociétés dans le fichier des bonnes alternances")
  .option("-f, [ForceRecreate]", "pour forcer la recréation", false)
  .option("-s, [SourceFile]", "fichier source alternatif")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("geo-locations:update"))

program
  .command("update-opcos")
  .description("Procède à la résolution des opcos des sociétés dans le fichier des bonnes alternances")
  .option("-c, [ClearMongo]", "vide la collection des opcos", false)
  .option("-f, [ForceRecreate]", "pour forcer la recréation", false)
  .option("-s, [SourceFile]", "fichier source alternatif")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("opcos:update"))

program
  .command("update-domaines-metiers")
  .description("Procède à l'import du fichier domaines metiers")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("domaines-metiers:update"))

program
  .command("update-domaines-metiers-file")
  .description("Enregistre le fichier spécifié présent dans /assets sur le repository distant. Si key n'est pas précisé il remplacera le fichier par défaut.")
  .requiredOption("--filename <string>", "filename")
  .option("--key <string>", "key")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("domaines-metiers:file:update"))

program
  .command("update-diplomes-metiers")
  .description("Procède à l'association des diplômes par métiers")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("diplomes-metiers:update"))

program
  .command("import-referentiel-opco-constructys")
  .description("Importe les emails pour la collection ReferentielOpco depuis l'opco Constructys")
  .option("-q, --queued", "Run job asynchronously", false)
  .option("-p, [parallelism]", "Number of threads", "10")
  .action(createJobAction("referentiel-opco:constructys:import"))

program
  .command("referentiel:commune:import")
  .description("Importe le référentiel des communes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("referentiel:commune:import"))

simpleJobDefinitions.forEach((jobDef) => {
  const { description } = jobDef
  const command = SimpleJobDefinition.getFctName(jobDef)
  program.command(command).description(description).option("-q, --queued", "Run job asynchronously", false).action(createJobAction(command))
})

export async function startCLI() {
  await program.parseAsync(process.argv)
}
