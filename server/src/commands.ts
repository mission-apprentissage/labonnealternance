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

program.command("recreate:indexes").description("Recreate MongoDB indexes").option("-q, --queued", "Run job asynchronously", false).action(createJobAction("recreate:indexes"))
program.command("db:validate").description("Validate Documents").option("-q, --queued", "Run job asynchronously", false).action(createJobAction("db:validate"))

program
  .command("remove:duplicates:recruiters")
  .description("Remove duplicate recruiters based on SIRET and EMAIL")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("remove:duplicates:recruiters"))

program
  .command("lbajobs:export:s3")
  .description("Export LBA jobs to JSON files on S3")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("lbajobs:export:s3"))

program
  .command("anonymize-individual")
  .description("Anonymize elements based on id")
  .requiredOption("-c, --collection <string>", " <collection> est la collection sur laquelle s'applique la modification")
  .requiredOption("-i, --id <string>", " <id> est l'identifiant de l'élément à anonymiser")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("anonymize-individual"))

program.command("db:obfuscate").description("Pseudonymisation des documents").option("-q, --queued", "Run job asynchronously", false).action(createJobAction("db:obfuscate"))

program.command("recruiters:delegations").description("Resend delegation email for all jobs created on November 2023").action(createJobAction("recruiters:delegations"))
program.command("migrations:up").description("Run migrations up").action(createJobAction("migrations:up"))

program.command("migrations:status").description("Check migrations status").action(createJobAction("migrations:status"))

program.command("migrations:create").description("Run migrations create").requiredOption("-d, --description <string>", "description").action(createJobAction("migrations:create"))

// Temporaire, one shot à executer en recette et prod
program
  .command("recruiters:set-missing-job-start-date")
  .description("Récupération des geo_coordinates manquants dans la collection Recruiters")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recruiters:set-missing-job-start-date"))
// Temporaire, one shot à executer en recette et prod
program
  .command("recruiters:get-missing-geocoordinates")
  .description("Récupération des geo_coordinates manquants dans la collection Recruiters")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recruiters:get-missing-geocoordinates"))

program
  .command("recruiters:get-missing-address-detail")
  .description("Récupération des address_detail manquants dans la collection Recruiters")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recruiters:get-missing-address-detail"))

program
  .command("import:referentielrome")
  .description("import référentiel rome v4 from XML")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("import:referentielrome"))

// Temporaire, one shot à executer en recette et prod
program
  .command("migration:remove-version-key-from-all-collections")
  .description("Supprime le champ __v de toutes les collections")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("migration:remove-version-key-from-all-collections"))

// Temporaire, one shot à executer en recette et prod
program
  .command("migration:remove-delegated-from-jobs")
  .description("Retirer le champ is_delegated des offres")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("migration:remove-delegated-from-jobs"))

/********************/

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
  .command("metabase:jobs:collection")
  .description("Permet de créer une collection dédiée aux offres pour metabase")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("metabase:jobs:collection"))

program
  .command("metabase:role-management:create")
  .description("Crée une collection jointure entre userWithAccounts, roleManagements, cfas et entreprises pour metabase")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("metabase:role-management:create"))

program
  .command("relance-opco")
  .description("Relance les opco avec le nombre d'utilisateur en attente de validation")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("opco:relance"))

program
  .command("export-offre-pole-emploi")
  .description("Exporte les offres vers France Travail")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("pe:offre:export"))

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
  .command("etablissement:invite:premium:parcoursup")
  .description("Invite les établissements (via email décisionnaire) au premium (Parcoursup)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:premium:parcoursup"))

program
  .command("etablissement:invite:premium:affelnet")
  .description("Invite les établissements (via email décisionnaire) au premium (Affelnet)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissement:invite:premium:affelnet"))

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

program
  .command("premium:activated:reminder")
  .description("Envoi un email à tous les établissements premium pour les informer de l'ouverture des voeux sur Parcoursup")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("premium:activated:reminder"))

program
  .command("premium:invite:one-shot")
  .description("Envoi un email à tous les établissements pas encore premium pour les inviter de nouveau")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("premium:invite:one-shot"))

program
  .command("etablissements:formations:sync")
  .description("Récupère la liste de toutes les formations du Catalogue et les enregistre.")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissements:formations:sync"))

program
  .command("etablissements:formations:inverted:sync")
  .description("Resynchronise les referrers en partant de la table ETFA")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("etablissements:formations:inverted:sync"))

program
  .command("sync:etablissement:dates")
  .description("Resynchronise les dates de la collection Etablissement par siret gestionnaire")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("sync:etablissement:dates"))

program
  .command("appointments:anonimize")
  .description("anonimisation des prises de rendez-vous de plus d'un an")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("appointments:anonimize"))

program
  .command("users:anonimize")
  .description("anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus d'un an")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("users:anonimize"))
program
  .command("catalogue:trainings:appointments:archive:eligible")
  .description("Historise l'egibilité d'une formation à la prise de rendez-vous avec le Catalogue des formations (RCO)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("catalogue:trainings:appointments:archive:eligible"))

program
  .command("referentiel:onisep:import")
  .description("Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("referentiel:onisep:import"))

program
  .command("remove:duplicate:etablissements")
  .description("Supprime les doublon de la collection Etablissements généré par le script de synchronisation (lié au parallélisme)")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("remove:duplicates:etablissements"))

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

program
  .command("fix-job-expiration-date")
  .description("Répare les date d'expiration d'offre qui seraient trop dans le futur")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recruiters:expiration-date:fix"))

program
  .command("fix-job-type")
  .description("Répare les job_type d'offre qui contiennent la valeur enum 'Professionalisation' mal orthographiée")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recruiters:job-type:fix"))

program
  .command("fix-applications")
  .description("Répare les adresses emails comportant des caractères erronés dans la collection applications")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("fix-applications"))

program
  .command("fix-data-validation-recruiters")
  .description("Répare les data de la collection recruiters")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("recruiters:data-validation:fix"))

program
  .command("anonymize-user-recruteurs")
  .description("Anonymize les userrecruteurs qui ne se sont pas connectés depuis plus de 2 ans")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("user-recruteurs:anonymize"))

program
  .command("import-referentiel-opco-constructys")
  .description("Importe les emails pour la collection ReferentielOpco depuis l'opco Constructys")
  .option("-q, --queued", "Run job asynchronously", false)
  .option("-parallelism, [parallelism]", "Number of threads", "10")
  .action(createJobAction("referentiel-opco:constructys:import"))

program
  .command("import-hellowork-raw")
  .description("Importe les offres hellowork dans la collection raw")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("import-hellowork-raw"))

program
  .command("import-hellowork-to-computed")
  .description("Importe les offres hellowork depuis raw vers computed")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("import-hellowork-to-computed"))

program
  .command("import-rhalternance")
  .description("Importe les offres RHAlternance dans la collection raw")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("import-rhalternance"))

program.command("import-kelio").description("Importe les offres kelio").option("-q, --queued", "Run job asynchronously", false).action(createJobAction("import-kelio"))

program
  .command("import-computed-to-jobs-partners")
  .description("Met à jour la collection jobs_partners à partir de computed_jobs_partners")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("import-computed-to-jobs-partners"))

program
  .command("cancel-removed-jobs-partners")
  .description("Met à jour la collection jobs_partners en mettant à 'Annulé' les offres qui ne sont plus dans computed_jobs_partners")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("cancel-removed-jobs-partners"))

program
  .command("send-applications")
  .description("Scanne les virus des pièces jointes et envoie les candidatures. Timeout à 8 minutes.")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("send-applications"))

program
  .command("fill-computed-jobs-partners")
  .description("Enrichi la collection computed_jobs_partners avec les données provenant d'API externes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("fill-computed-jobs-partners"))

program
  .command("referentiel:commune:import")
  .description("Importe le référentiel des communes")
  .option("-q, --queued", "Run job asynchronously", false)
  .action(createJobAction("referentiel:commune:import"))

export async function startCLI() {
  await program.parseAsync(process.argv)
}
