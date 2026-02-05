import { addJob, initJobProcessor } from "job-processor"
import { ObjectId } from "mongodb"

import { anonymizeApplicantsAndApplications } from "./anonymization/anonymizeApplicantAndApplications"
import { anonymizeApplications } from "./anonymization/anonymizeApplications"
import anonymizeAppointments from "./anonymization/anonymizeAppointments"
import anonymizeIndividual from "./anonymization/anonymizeIndividual"
import { anonymizeReportedReasons } from "./anonymization/anonymizeReportedReasons"
import { anonimizeUsersWithAccounts } from "./anonymization/anonimizeUsersWithAccounts"
import { anonymizeUsers } from "./anonymization/anonymizeUsers"
import { removeBrevoContacts } from "./anonymization/removeBrevoContacts"
import { processApplications } from "./applications/processApplications"
import { processRecruiterIntentions } from "./applications/processRecruiterIntentions"
import { recreateIndexes } from "./database/recreateIndexes"
import { validateModels } from "./database/schemaValidation"
import { updateDiplomeMetier } from "./diplomesMetiers/updateDiplomesMetiers"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formationsCatalogue/updateParcoursupAndAffelnetInfoOnFormationCatalogue"
import { generateFranceTravailAccess } from "./franceTravail/generateFranceTravailAccess"
import { createJobsCollectionForMetabase } from "./metabase/metabaseJobsCollection"
import { createRoleManagement360 } from "./metabase/metabaseRoleManagement360"
import { create as createMigration, status as statusMigration, up as upMigration } from "./migrations/migrations"
import { sendMiseEnRelation } from "./miseEnRelation/sendMiseEnRelation"
import { expireJobsPartners } from "./offrePartenaire/expireJobsPartners"
import { importers } from "./offrePartenaire/jobsPartners.importer"
import { processJobPartnersForApi } from "./offrePartenaire/processJobPartnersForApi"
import { processRecruteursLba } from "./offrePartenaire/recruteur-lba/processRecruteursLba"
import { exportFileForAlgo } from "./partenaireExport/exportBlacklistAlgo"
import { sendContactsToBrevo } from "./partenaireExport/exportContactsToBrevo"
import { exportLbaJobsToS3 } from "./partenaireExport/exportJobsToS3"
import { exportJobsToS3V2 } from "./partenaireExport/exportJobsToS3V2"
import { exportRecruteursToBrevo } from "./partenaireExport/exportRecrutersToBrevo"
import { exportJobsToFranceTravail } from "./partenaireExport/exportToFranceTravail"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./rdv/activateOptoutOnEtablissementAndUpdateReferrersOnETFA"
import { eligibleTrainingsForAppointmentsHistoryWithCatalogue } from "./rdv/eligibleTrainingsForAppointmentsHistoryWithCatalogue"
import { importReferentielOnisep } from "./rdv/importReferentielOnisep"
import { inviteEtablissementAffelnetToPremium } from "./rdv/inviteEtablissementAffelnetToPremium"
import { inviteEtablissementAffelnetToPremiumFollowUp } from "./rdv/inviteEtablissementAffelnetToPremiumFollowUp"
import { inviteEtablissementParcoursupToPremium } from "./rdv/inviteEtablissementParcoursupToPremium"
import { inviteEtablissementParcoursupToPremiumFollowUp } from "./rdv/inviteEtablissementParcoursupToPremiumFollowUp"
import { inviteEtablissementToOptOut } from "./rdv/inviteEtablissementToOptOut"
import { removeDuplicateEtablissements } from "./rdv/removeDuplicateEtablissements"
import { resetInvitationDates } from "./rdv/resetInvitationDates"
import { syncEtablissementDates } from "./rdv/syncEtablissementDates"
import { syncEtablissementsAndFormations } from "./rdv/syncEtablissementsAndFormations"
import { cancelOfferJob } from "./recruiters/cancelOfferJob"
import { createApiUser } from "./recruiters/createApiUser"
import { disableApiUser } from "./recruiters/disableApiUser"
import { opcoReminderJob } from "./recruiters/opcoReminderJob"
import { recruiterOfferExpirationReminderJob } from "./recruiters/recruiterOfferExpirationReminderJob"
import { resetApiKey } from "./recruiters/resetApiKey"
import { updateSiretInfosInError } from "./recruiters/updateSiretInfosInErrorJob"
import { updateSEO } from "./seo/updateSEO"
import { SimpleJobDefinition, simpleJobDefinitions } from "./simpleJobDefinitions"
import { updateBrevoBlockedEmails } from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"
import { controlApplications } from "./verifications/controlApplications"
import { controlAppointments } from "./verifications/controlAppointments"
import { premiumActivatedReminder } from "./rdv/premiumActivatedReminder"
import { generateSitemap } from "@/services/sitemap.service"
import { updateReferentielCommune } from "@/services/referentiel/commune/commune.referentiel.service"
import config from "@/config"
import { getDatabase } from "@/common/utils/mongodbUtils"
import { getLoggerWithContext, logger } from "@/common/logger"

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
          "Annulation des offres expirées": {
            cron_string: "15 0 * * *",
            handler: cancelOfferJob,
            tag: "main",
          },
          "Génération du sitemap pour les offres": {
            cron_string: "20 0 * * *",
            handler: generateSitemap,
            tag: "main",
          },
          "Envoi des mails de relance pour l'expiration des offres à J+7": {
            cron_string: "20 9 * * *",
            handler: async () => addJob({ name: "recruiterOfferExpirationReminderJob", payload: { threshold: "7" } }),
          },
          "Envoi des mails de relance pour l'expiration des offres à J+1": {
            cron_string: "25 9 * * *",
            handler: async () => addJob({ name: "recruiterOfferExpirationReminderJob", payload: { threshold: "1" } }),
          },
          "Envoi du rappel de validation des utilisateurs en attente aux OPCOs": {
            cron_string: "30 0 * * 1,3,5",
            handler: opcoReminderJob,
            tag: "main",
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
          "Creation de la collection JOBS pour metabase": {
            cron_string: "55 0 * * *",
            handler: createJobsCollectionForMetabase,
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
          "Historisation des formations éligibles à la prise de rendez-vous": {
            cron_string: "00 4 * * *",
            handler: eligibleTrainingsForAppointmentsHistoryWithCatalogue,
            tag: "main",
          },
          "Export contact recruteurs vers Brevo": {
            cron_string: "10 4 * * *",
            handler: exportRecruteursToBrevo,
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
            cron_string: "0 19 * * *",
            handler: processRecruiterIntentions,
            tag: "main",
          },
          "Emission des contacts vers Brevo": {
            cron_string: "30 22 * * *",
            handler: sendContactsToBrevo,
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
        },
    jobs: {
      "recreate:indexes": {
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
