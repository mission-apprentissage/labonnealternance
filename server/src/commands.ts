import { captureException } from "@sentry/node"
import { program } from "commander"
// eslint-disable-next-line import/no-extraneous-dependencies
import HttpTerminator from "lil-http-terminator"

import { closeMongoConnection } from "@/common/mongodb"

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
          // eslint-disable-next-line n/no-process-exit
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
      // initSentryProcessor() // TODO
    }
  })
  .hook("postAction", async () => {
    await closeMongoConnection()
    // await closeSentry() // TODO
  })

program
  .command("start")
  .option("--withProcessor", "Exécution du processor également")
  .description("Démarre le serveur HTTP")
  .action(async ({ withProcessor = false }) => {
    try {
      const signal = createProcessExitSignal()
      const httpServer = await server()
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
  .command("index")
  .description("Synchronise les index des collections mongo & reconstruit les index elasticsearch.")
  .option("-i, --index_list <string>", " <index_list> est la liste des index séparés par des ,")
  .option("--recreate", " supprime et recrée tous les indexes", false)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("indexes:generate"))

//yarn cli create-user --first_name a --last_name b --email ab@fr.fr --scope beta --establishment_raison_sociale beta --type ADMIN
program
  .command("create-user")
  .description("Permet de créer un accès utilisateur à l'espace partenaire")
  .requiredOption("--first_name <string>", "prenom de l'utilisateur")
  .requiredOption("--last_name <string>", "nom de l'utilisateur")
  .requiredOption("--email <string>", "email de l'utilisateur")
  .requiredOption("--scope <string>", "scope")
  .requiredOption("--establishment_raison_sociale <string>", " raison sociale de l'établissement")
  .option("--establishment_siret <string>", "siret de l'établissement")
  .option("--phone <string>", "telephone de l'utilisateur")
  .option("--address <string>", "adresse de l'utilisateur")
  .option("-a, --admin", "utilisateur administrateur", false)
  .requiredOption("-t ,--type <string>", "type d'utilisateur")
  .requiredOption("-e, --email_valide", "email valide", true)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("user:create"))

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
  .command("relance-formulaire")
  .description("Envoie une relance par mail pour les offres expirant dans 7 jours")
  .requiredOption("--threshold <string>", "threshold")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("formulaire:relance"))

program
  .command("annulation-formulaire")
  .description("Annule les offres pour lesquels la date d'expiration est correspondante à la date actuelle")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("formulaire:annulation"))

program
  .command("creer-offre-metabase")
  .description("Permet de créer une collection dédiée aux offres pour metabase")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("metabase:offre:create"))

program
  .command("relance-opco")
  .description("Relance les opco avec le nombre d'utilisateur en attente de validation")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("opco:relance"))

program
  .command("export-offre-pole-emploi")
  .description("Exporte les offres vers Pôle Emploi")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("pe:offre:export"))

program
  .command("validate-user")
  .description("Contrôle de validation des entreprises en attente de validation")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("user:validate"))

program
  .command("update-siret-infos-in-error")
  .description("Remplis les données venant du SIRET pour les utilisateurs ayant eu une erreur pendant l'inscription")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("siret:inError:update"))

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

program
  .command("invite-etablissement-to-opt-out")
  .description("Invite les établissements (via email décisionnaire) à l'opt-out.")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:opt-out"))

program
  .command("invite-etablissement-to-premium")
  .description("Invite les établissements (via email décisionnaire) au premium (Parcoursup)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:premium"))

program
  .command("invite-etablissement-affelnet-to-premium")
  .description("Invite les établissements (via email décisionnaire) au premium (Affelnet)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:premium:affelnet"))

program
  .command("invite-etablissement-to-premium-follow-up")
  .description("(Relance) Invite les établissements (via email décisionnaire) au premium (Parcoursup)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:premium:follow-up"))

program
  .command("invite-etablissement-affelnet-to-premium-follow-up")
  .description("(Relance) Invite les établissements (via email décisionnaire) au premium (Affelnet)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:premium:affelnet:follow-up"))

program
  .command("premium-activated-reminder")
  .description("Envoi un email à tous les établissements premium pour les informer de l'ouverture des voeux sur Parcoursup")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("premium:activated:reminder"))

program
  .command("premium-invite-one-shot")
  .description("Envoi un email à tous les établissements pas encore premium pour les inviter de nouveau")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("premium:invite:one-shot"))

program
  .command("sync-etablissements-and-formations")
  .description("Récupère la liste de toutes les formations du Catalogue et les enregistre.")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissements:formations:sync"))

program
  .command("sync-etablissements-and-formations-affelnet")
  .description("Récupère la liste de toutes les formations du Catalogue ME du scope AFFELNET et les enregistre.")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissements:formations:affelnet:sync"))

program
  .command("anonimize-appointments")
  .description("anonimisation des prises de rendez-vous de plus d'un an")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("appointments:anonimize"))

program
  .command("anonimize-users")
  .description("anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus d'un an")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("users:anonimize"))
program
  .command("history-eligible-trainings-for-appointments-catalogue")
  .description("Historise l'egibilité d'une formation à la prise de rendez-vous avec le Catalogue des formations (RCO)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("catalogue:trainings:appointments:archive:eligible"))

program
  .command("import-referentiel-onisep")
  .description("Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("referentiel:onisep:import"))

/**
 *
 *
 * JOB CANDIDAT
 *
 *
 */

program
  .command("sync-catalogue-trainings")
  .description("Importe les formations depuis le Catalogue")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("catalogue:trainings:sync"))

program
  .command("sync-catalogue-trainings-extra-data")
  .description("Mise à jour des champs spécifiques de la collection formations catalogue")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("catalogue:trainings:sync:extra"))

program
  .command("sync-sib-blocked")
  .description("Récupère auprès de Brevo la liste des adresses emails bloquées le jour précédent (défaut) ou toutes les adresses bloquées (option)")
  .option("-all-addresses, [AllAddresses]", "pour récupérer toutes les adresses bloquées", false)
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("brevo:blocked:sync"))

program
  .command("anonymize-applications")
  .description("Anonymise toutes les candidatures de plus de an qui ne sont pas déjà anonymisées")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("applications:anonymize"))

program
  .command("rename-lbac-fields")
  .description("Renomme les champs des collections LBAC")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("lbac:fields:rename"))

program
  .command("update-companies")
  .description("Met à jour la liste des sociétés bonnes alternances")
  .option("-use-algo-file, [UseAlgoFile]", "télécharge et traite le fichier issu de l'algo", false)
  .option("-clear-mongo, [ClearMongo]", "vide la collection des bonnes alternances", false)
  .option("-build-index, [BuildIndex]", "réindex les bonnes boîtes", false)
  .option("-use-save, [UseSave]", "pour appliquer les données SAVE", false)
  .option("-force-recreate, [ForceRecreate]", "pour forcer la recréation", false)
  .option("-source-file, [SourceFile]", "fichier source alternatif")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("companies:update"))

program
  .command("update-geo-locations")
  .description("Procède à la géolocalisation de masse des sociétés dans le fichier des bonnes alternances")
  .option("-force-recreate, [ForceRecreate]", "pour forcer la recréation", false)
  .option("-source-file, [SourceFile]", "fichier source alternatif")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("geo-locations:update"))

program
  .command("update-opcos")
  .description("Procède à la résolution des opcos des sociétés dans le fichier des bonnes alternances")
  .option("-clear-mongo, [ClearMongo]", "vide la collection des opcos", false)
  .option("-force-recreate, [ForceRecreate]", "pour forcer la recréation", false)
  .option("-source-file, [SourceFile]", "fichier source alternatif")
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
  .command("update-referentiel-rncp-romes")
  .description("Procède à la mise à jour du référentiel RNCP codes ROME")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("referentiel:rncp-romes:update"))

export async function startCLI() {
  await program.parseAsync(process.argv)
}
