import { addJob, initJobProcessor } from "job-processor"
import { ObjectId } from "mongodb"

import { getLoggerWithContext, logger } from "@/common/logger"
import { getDatabase } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { applyPendingClassificationBatches } from "@/services/classification/classification-mistral-batch.service"
import { updateReferentielCommune } from "@/services/referentiel/commune/commune.referentiel.service"
import { controlSearchItemsDrift, syncSearchItemsDelta } from "@/services/search/search-items.service"
import {
  applyKeywordsBatchFile,
  applyPendingMistralBatches,
  generateSearchItemsKeywordsContinuous,
  submitSearchItemsKeywordsBatch,
} from "@/services/search/search-items-keywords.service"
import { generateSitemap } from "@/services/sitemap.service"
import { anonimizeUsersWithAccounts } from "./anonymization/anonimize-users-with-accounts"
import { anonymizeApplicantsAndApplications } from "./anonymization/anonymize-applicant-and-applications"
import { anonymizeApplications } from "./anonymization/anonymize-applications"
import anonymizeAppointments from "./anonymization/anonymize-appointments"
import anonymizeIndividual from "./anonymization/anonymize-individual"
import { anonymizeReportedReasons } from "./anonymization/anonymize-reported-reasons"
import { anonymizeUsers } from "./anonymization/anonymize-users"
import { removeBrevoContacts } from "./anonymization/remove-brevo-contacts"
import { processApplications } from "./applications/process-applications"
import { processRecruiterIntentions } from "./applications/process-recruiter-intentions"
import { relanceCandidatsInactifs } from "./applications/relance-candidats-inactifs"
import { relanceIncitationSpontanee } from "./applications/relance-incitation-spontanee"
import { recreateIndexes } from "./database/recreate-indexes"
import { validateModels } from "./database/schema-validation"
import { updateDiplomeMetier } from "./diplomes-metiers/update-diplomes-metiers"
import { updateHandiEngagement } from "./engagement-handicap/update-handi-engagement"
import { importCatalogueFormationJob } from "./formations-catalogue/formations-catalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formations-catalogue/update-parcoursup-and-affelnet-info-on-formation-catalogue"
import { generateFranceTravailAccess } from "./france-travail/generate-france-travail-access"
import { createRoleManagement360 } from "./metabase/metabase-role-management360"
import { create as createMigration, status as statusMigration, up as upMigration } from "./migrations/migrations"
import { sendMiseEnRelation } from "./mise-en-relation/send-mise-en-relation"
import { closeJobsPartnersOnApplicationThreshold } from "./offre-partenaire/close-jobs-partners-on-application-threshold"
import { expireJobsPartners } from "./offre-partenaire/expire-jobs-partners"
import { importers } from "./offre-partenaire/jobs-partners.importer"
import { processJobPartnersForApi } from "./offre-partenaire/process-job-partners-for-api"
import { processRecruteursLba } from "./offre-partenaire/recruteur-lba/process-recruteurs-lba"
import { exportFileForAlgo } from "./partenaire-export/export-blacklist-algo"
import { sendContactsToBrevo } from "./partenaire-export/export-contacts-to-brevo"
import { exportLbaJobsToS3 } from "./partenaire-export/export-jobs-to-s3"
import { exportJobsToS3V2 } from "./partenaire-export/export-jobs-to-s3-v2"
import { exportRecruteursToBrevo } from "./partenaire-export/export-recruters-to-brevo"
import { exportJobsToFranceTravail, exportJobsToFranceTravailCsvOnly } from "./partenaire-export/export-to-france-travail"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./rdv/activate-optout-on-etablissement-and-update-referrers-on-etfa"
import { importReferentielOnisep } from "./rdv/import-referentiel-onisep"
import { inviteEtablissementAffelnetToPremium } from "./rdv/invite-etablissement-affelnet-to-premium"
import { inviteEtablissementAffelnetToPremiumFollowUp } from "./rdv/invite-etablissement-affelnet-to-premium-follow-up"
import { inviteEtablissementParcoursupToPremium } from "./rdv/invite-etablissement-parcoursup-to-premium"
import { inviteEtablissementParcoursupToPremiumFollowUp } from "./rdv/invite-etablissement-parcoursup-to-premium-follow-up"
import { inviteEtablissementToOptOut } from "./rdv/invite-etablissement-to-opt-out"
import { premiumActivatedReminder, premiumActivatedReminderAffelnet } from "./rdv/premium-activated-reminder"
import { removeDuplicateEtablissements } from "./rdv/remove-duplicate-etablissements"
import { removeEligibleTrainingsForAppointmentsNotInCatalogue } from "./rdv/remove-eligible-trainings-for-appointments-not-in-catalogue"
import { resetInvitationDates } from "./rdv/reset-invitation-dates"
import { syncEtablissementDates } from "./rdv/sync-etablissement-dates"
import { syncEtablissementsAndFormations } from "./rdv/sync-etablissements-and-formations"
import { createApiUser } from "./recruiters/create-api-user"
import { disableApiUser } from "./recruiters/disable-api-user"
import { nurturingEntreprises } from "./recruiters/nurturing-entreprises"
import { opcoReminderJob } from "./recruiters/opco-reminder-job"
import { recruiterOfferExpirationReminderJob } from "./recruiters/recruiter-offer-expiration-reminder-job"
import { resetApiKey } from "./recruiters/reset-api-key"
import { updateSiretInfosInError } from "./recruiters/update-siret-infos-in-error-job"
import { analyzeSearchQueries, rollbackSearchSuggestions } from "./search/analyze-search-queries"
import { fillSearchItemsCollection } from "./search/generate-search-items-collection"
import { updateSEO } from "./seo/update-seo"
import { SimpleJobDefinition, simpleJobDefinitions } from "./simple-job-definitions"
import { updateBrevoBlockedEmails } from "./update-brevo-blocked-emails/update-brevo-blocked-emails"
import { controlApplications } from "./verifications/control-applications"
import { controlAppointments } from "./verifications/control-appointments"

export async function setupJobProcessor() {
  logger.info("Setup job processor")
  return initJobProcessor({
    workerTags: config.worker === "runner-1" ? ["main"] : ["slave"],
    db: getDatabase(),
    logger: getLoggerWithContext("script"),
    crons: ["local", "preview", "pentest"].includes(config.env)
      ? {}
      : {
          ...importers,
          "Génération du token France Travail pour la récupération des offres": {
            cron_string: "*/15 * * * *",
            handler: generateFranceTravailAccess,
            tag: "main",
          },
          "Scan et envoi des candidatures": {
            cron_string: "*/10 * * * *",
            handler: async () => processApplications(),
            tag: "main",
          },
          "Traitement complet des jobs_partners par API": {
            cron_string: "*/10 * * * *",
            handler: processJobPartnersForApi,
            tag: "slave",
          },
          "Expiration des offres jobs_partners": {
            cron_string: "*/30 * * * *",
            handler: expireJobsPartners,
            tag: "main",
          },
          "Clôture des offres jobs_partners au seuil de candidatures": {
            cron_string: "*/30 * * * *",
            handler: async () => closeJobsPartnersOnApplicationThreshold(),
            tag: "main",
          },
          "Mise à jour des adresses emails bloquées": {
            cron_string: "5 0 * * *",
            handler: async () => updateBrevoBlockedEmails({}),
            tag: "main",
          },
          "Anonymisation des candidats & leurs candidatures de plus de deux (2) ans": {
            cron_string: "10 0 * * *",
            handler: anonymizeApplicantsAndApplications,
            tag: "main",
          },
          "Mise à jour des recruteurs en erreur": {
            cron_string: "10 0 * * *",
            handler: updateSiretInfosInError,
            tag: "main",
          },
          "Anonymisation des candidatures de plus de deux (2) ans": {
            cron_string: "15 0 * * *",
            handler: anonymizeApplications,
            tag: "main",
          },
          "Génération du sitemap pour les offres": {
            cron_string: "20 0 * * *",
            handler: generateSitemap,
            tag: "main",
          },
          "Envoi des mails de relance pour l'expiration des offres à J+7": {
            cron_string: "20 9 * * *",
            handler: async () => recruiterOfferExpirationReminderJob(7),
          },
          "Envoi des mails de relance pour l'expiration des offres à J+1": {
            cron_string: "25 9 * * *",
            handler: async () => recruiterOfferExpirationReminderJob(1),
          },
          "Envoi du rappel de validation des utilisateurs en attente aux OPCOs": {
            cron_string: "30 0 * * 1,3,5",
            handler: opcoReminderJob,
            tag: "main",
          },
          "Nurturing des entreprises dormantes (anniversaire du dépôt d'offre)": {
            cron_string: "0 8 * * *",
            handler: config.env === "production" ? async () => nurturingEntreprises() : async () => Promise.resolve(0),
          },
          "Anonymisation des reasons de plus de (1) an": {
            cron_string: "35 0 * * *",
            handler: anonymizeReportedReasons,
            tag: "main",
          },
          "Active tous les établissements qui ont souscrits à l'opt-out": {
            cron_string: "50 0 * * *",
            handler: activateOptoutOnEtablissementAndUpdateReferrersOnETFA,
            tag: "main",
          },
          "Envoi des invitations de mise en relation pour les offres à faibles candidatures": {
            cron_string: "55 1 * * *",
            handler: sendMiseEnRelation,
            tag: "main",
          },
          "Anonymisation des user recruteurs de plus de deux (2) ans": {
            cron_string: "0 1 * * *",
            handler: anonimizeUsersWithAccounts,
            tag: "main",
          },
          "Anonymisation des utilisateurs RDVA de plus de deux (2) ans": {
            cron_string: "5 1 * * *",
            handler: anonymizeUsers,
            tag: "main",
          },
          "Anonymisation des appointments de plus de deux (2) ans": {
            cron_string: "30 1 * * *",
            handler: anonymizeAppointments,
            tag: "main",
          },
          // "Traitement computed et import dans la collection jobs_partners": {
          //   cron_string: "00 3 * * *",
          //   handler: processComputedAndImportToJobPartners,
          //   tag: "slave",
          // },
          "Import des formations depuis le Catalogue RCO": {
            cron_string: "15 2 * * *",
            handler: importCatalogueFormationJob,
            tag: "main",
            checkinMargin: 30,
            maxRuntimeInMinutes: 90,
          },
          "Mise à jour des champs spécifiques de la collection formations catalogue": {
            cron_string: "30 2 * * *",
            handler: updateParcoursupAndAffelnetInfoOnFormationCatalogue,
            tag: "main",
          },
          "Synchronise les formations eligibles à la prise de rendez-vous": {
            cron_string: "45 2 * * *",
            handler: syncEtablissementsAndFormations,
            tag: "main",
          },
          "Export des offres sur S3 v2": {
            cron_string: "0 3 * * *",
            handler: async () => exportJobsToS3V2(),
          },
          "Supprime les etablissements dupliqués à cause du parallélisme du job de synchronisation RDVA": {
            cron_string: "30 3 * * *",
            handler: removeDuplicateEtablissements,
            tag: "main",
          },
          "Suppression des formations éligibles absentes du catalogue": {
            cron_string: "00 4 * * *",
            handler: removeEligibleTrainingsForAppointmentsNotInCatalogue,
            tag: "main",
          },
          "Export contact recruteurs vers Brevo": {
            cron_string: "10 4 * * *",
            handler: exportRecruteursToBrevo,
          },
          "Relance des candidats inactifs (J+7 sans nouvelle candidature)": {
            cron_string: "0 7 * * *",
            handler: config.env === "production" ? async () => relanceCandidatsInactifs() : async () => Promise.resolve(0),
          },
          "Incitation aux candidatures spontanées (J+7 sans candidature spontanée)": {
            cron_string: "10 7 * * *",
            handler: config.env === "production" ? async () => relanceIncitationSpontanee() : async () => Promise.resolve(0),
          },
          "Synchronise les dates des etablissements eligible à la prise de rendez-vous": {
            cron_string: "0 5 * * *",
            handler: syncEtablissementDates,
            tag: "main",
          },
          "Envoi des offres à France Travail": {
            cron_string: "30 5 * * *",
            handler: config.env === "production" ? async () => exportJobsToFranceTravail() : async () => Promise.resolve(0),
            tag: "main",
          },
          "Sync delta search_items (jobs_partners modifiés)": {
            cron_string: "*/15 * * * *",
            handler: async () => syncSearchItemsDelta(),
            tag: "slave",
          },
          // Après processComputedAndImportToJobPartners (départ 00:01, maxRuntime 300 min → fin
          // au plus tard ~05:00) : rattrape ce que la sync incrémentale a manqué et purge les
          // orphelins (suppressions physiques, invisibles au delta).
          "Réconciliation nightly search_items": {
            cron_string: "0 6 * * *",
            handler: fillSearchItemsCollection,
            tag: "slave",
            maxRuntimeInMinutes: 180,
          },
          "Contrôle de dérive search_items (alerte Slack)": {
            cron_string: "30 7 * * *",
            handler: controlSearchItemsDrift,
            tag: "main",
          },
          "Analyse mensuelle des recherches utilisateurs (autocomplete + synonymes)": {
            cron_string: "0 7 1 * *",
            handler: analyzeSearchQueries,
            tag: "slave",
            maxRuntimeInMinutes: 60,
          },
          "Génération continue des keywords search_items (cache + API immédiate)": {
            cron_string: "*/30 * * * *",
            handler: async () => generateSearchItemsKeywordsContinuous(),
            tag: "slave",
          },
          // Après le rechargement dominical des recruteurs (processRecruteursLba, 10:00 UTC) :
          // batch Mistral dédupliqué par texte source, ramassé par applyPendingMistralBatches.
          "Batch hebdo keywords des recruteurs LBA": {
            cron_string: "0 18 * * SUN",
            handler: async () => submitSearchItemsKeywordsBatch({ recruteursOnly: true }),
            tag: "slave",
          },
          "Ramasse des batchs Mistral keywords": {
            cron_string: "10 * * * *",
            handler: applyPendingMistralBatches,
            tag: "slave",
          },
          // Décalé de 10 min par rapport à la ramasse keywords pour étaler la charge Mongo.
          "Ramasse des batchs Mistral classification jobs_partners": {
            cron_string: "20 * * * *",
            handler: applyPendingClassificationBatches,
            tag: "slave",
          },
          "export des offres LBA sur S3": {
            cron_string: "30 6 * * 1",
            handler: config.env === "production" ? async () => exportLbaJobsToS3() : async () => Promise.resolve(0),
            tag: "main",
          },
          "Invite les établissements (via email gestionnaire) à l'opt-out": {
            cron_string: "0 9 * * *",
            handler: inviteEtablissementToOptOut,
            tag: "main",
          },
          "Invite les établissements (via email gestionnaire) au premium (Parcoursup)": {
            cron_string: "0 9 * * *",
            handler: async () => inviteEtablissementParcoursupToPremium(false),
            tag: "main",
          },
          "Invite les établissements (via email gestionnaire) au premium (Affelnet)": {
            cron_string: "15 9 * * *",
            handler: async () => inviteEtablissementAffelnetToPremium(false),
            tag: "main",
          },
          "(Relance) Invite les établissements (via email gestionnaire) au premium (Parcoursup)": {
            cron_string: "30 9 * * *",
            handler: async () => inviteEtablissementParcoursupToPremiumFollowUp(),
            tag: "main",
          },
          "(Relance) Invite les établissements (via email gestionnaire) au premium (Affelnet)": {
            cron_string: "45 9 * * *",
            handler: async () => inviteEtablissementAffelnetToPremiumFollowUp(),
            tag: "main",
          },
          "Rappel aux établissements que le premium est activé (Parcoursup)": {
            cron_string: "0 6 8 1 *",
            handler: async () => premiumActivatedReminder(),
            tag: "main",
          },
          "Rappel aux établissements que la prise de rdv est activée (Affelnet)": {
            cron_string: "0 6 23 3 *",
            handler: async () => premiumActivatedReminderAffelnet(),
            tag: "main",
          },
          "Creation de la collection rolemanagement360": {
            cron_string: "00 10,13,17 * * *",
            handler: createRoleManagement360,
            tag: "main",
          },
          "Contrôle quotidien des candidatures": {
            cron_string: "0 10-19/1 * * 1-5",
            handler: config.env === "production" ? async () => controlApplications() : async () => Promise.resolve(0),
            tag: "main",
          },
          "Contrôle quotidien des prises de rendez-vous": {
            cron_string: "0 11-19/2 * * 1-5",
            handler: config.env === "production" ? async () => controlAppointments() : async () => Promise.resolve(0),
            tag: "main",
          },
          "Mise à jour du référentiel commune": {
            cron_string: "0 15 * * SUN",
            handler: updateReferentielCommune,
            tag: "main",
          },
          "Emission des intentions des recruteurs": {
            cron_string: "*/10 * * * *",
            handler: processRecruiterIntentions,
            tag: "main",
          },
          "Emission des contacts vers Brevo": {
            cron_string: "30 22 * * *",
            handler: config.env === "production" ? async () => sendContactsToBrevo() : async () => Promise.resolve(0),
            tag: "main",
          },
          "Synchronisation Onisep entre Id formation Onisep et Clé ME du catalogue RCO": {
            cron_string: "45 23 * * *",
            handler: importReferentielOnisep,
            tag: "main",
          },
          "Supprime les dates d'invitation et de refus au premium (PARCOURSUP & AFFELNET) des etablissements": {
            cron_string: "0 0 20 11 *",
            handler: resetInvitationDates,
            tag: "main",
          },
          "Export des données pour l'algorithme": {
            cron_string: "0 10 * * FRI",
            handler: exportFileForAlgo,
          },
          "Mise à jour des données calculées pour les pages SEO": {
            cron_string: "0 4 * * SAT",
            handler: updateSEO,
          },
          "Traitement des recruteur LBA par la pipeline jobs partners": {
            cron_string: "0 10 * * SUN",
            handler: async () => processRecruteursLba(),
            tag: "main",
          },
          "Suppression des contacts Brevo de plus de deux ans": {
            cron_string: "0 8 * * SUN",
            handler: removeBrevoContacts,
          },
          "maj-diplome-metier": {
            cron_string: "0 8 * * SUN",
            handler: updateDiplomeMetier,
          },
          "update-handi-engagement": {
            cron_string: "45 4 * * SAT",
            handler: updateHandiEngagement,
          },
        },
    jobs: {
      "indexes:recreate": {
        handler: async (job) => {
          const { drop } = job.payload as any
          await recreateIndexes({ drop })
          return
        },
      },
      "api:user:create": {
        handler: async (job) => {
          const { nom, prenom, email, organization, scope } = job.payload as any
          await createApiUser(nom, prenom, email, organization, scope)
          return
        },
      },
      "api:user:reset": {
        handler: async (job) => resetApiKey(job.payload?.email),
      },
      "api:user:disable": {
        handler: async (job) => {
          const { email, state } = job.payload as any
          await disableApiUser(email, state)
          return
        },
      },
      recruiterOfferExpirationReminderJob: {
        handler: async (job) => {
          const { threshold } = job.payload as any
          await recruiterOfferExpirationReminderJob(parseInt(threshold))
          return
        },
      },
      exportJobsToS3V2: {
        handler: async () => exportJobsToS3V2(),
      },
      "etablissement:invite:premium:follow-up": {
        handler: async (job) => inviteEtablissementParcoursupToPremiumFollowUp(job.payload?.bypassDate as any),
      },
      "etablissement:invite:premium:affelnet:follow-up": {
        handler: async (job) => inviteEtablissementAffelnetToPremiumFollowUp(job.payload?.bypassDate as any),
      },
      "brevo:blocked:sync": {
        handler: async (job) => updateBrevoBlockedEmails(job.payload as any),
      },
      "anonymize-individual": {
        handler: async (job) => {
          const { collection, id } = job.payload as any
          await anonymizeIndividual({ collection, id: new ObjectId(id) })
          return
        },
      },
      "db:validate": {
        handler: async () => validateModels(),
      },
      "migrations:up": {
        handler: async () => {
          await upMigration()
          // Validate all documents after the migration
          await addJob({ name: "db:validate", queued: true, payload: {} })
          return
        },
      },
      "migrations:status": {
        handler: async () => {
          const { count, requireShutdown } = await statusMigration()
          if (count === 0) {
            console.info("migrations-status=synced")
          } else {
            console.info(`migrations-status=${requireShutdown ? "require-shutdown" : "pending"}`)
          }
          return
        },
      },
      "migrations:create": {
        handler: async (job) => createMigration(job.payload as any),
      },
      "referentiel:commune:import": {
        handler: updateReferentielCommune,
      },
      "search:apply-keywords-batch": {
        handler: async (job) => applyKeywordsBatchFile(job.payload as any),
      },
      "search:suggestions:rollback": {
        handler: async (job) => rollbackSearchSuggestions(job.payload as any),
      },
      ...Object.fromEntries(
        simpleJobDefinitions.map((jobDef) => {
          const { fct } = jobDef
          const command = SimpleJobDefinition.getFctName(jobDef)
          return [
            command,
            {
              handler: async (job) => fct(job.payload),
            },
          ]
        })
      ),
    },
  })
}
