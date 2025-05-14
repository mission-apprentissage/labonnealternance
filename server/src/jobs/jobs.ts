import { addJob, initJobProcessor } from "job-processor"
import { ObjectId } from "mongodb"

import updateDomainesMetiers from "@/jobs/domainesMetiers/updateDomainesMetiers"
import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations"
import { importers } from "@/jobs/offrePartenaire/jobsPartners.importer"
import { updateReferentielCommune } from "@/services/referentiel/commune/commune.referentiel.service"
import { generateSitemap } from "@/services/sitemap.service"

import { getLoggerWithContext, logger } from "../common/logger"
import { getDatabase } from "../common/utils/mongodbUtils"
import config from "../config"

import { anonymizeApplicantsAndApplications } from "./anonymization/anonymizeApplicantAndApplications"
import { anonymizeApplications } from "./anonymization/anonymizeApplications"
import anonymizeAppointments from "./anonymization/anonymizeAppointments"
import anonymizeIndividual from "./anonymization/anonymizeIndividual"
import { anonimizeUsersWithAccounts } from "./anonymization/anonymizeUserRecruteurs"
import { anonymizeUsers } from "./anonymization/anonymizeUsers"
import { processApplications } from "./applications/processApplications"
import { processRecruiterIntentions } from "./applications/processRecruiterIntentions"
import { sendContactsToBrevo } from "./brevoContacts/sendContactsToBrevo"
import { recreateIndexes } from "./database/recreateIndexes"
import { validateModels } from "./database/schemaValidation"
import { updateDomainesMetiersFile } from "./domainesMetiers/updateDomainesMetiersFile"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formationsCatalogue/updateParcoursupAndAffelnetInfoOnFormationCatalogue"
import { generateFranceTravailAccess } from "./franceTravail/generateFranceTravailAccess"
import { createJobsCollectionForMetabase } from "./metabase/metabaseJobsCollection"
import { createRoleManagement360 } from "./metabase/metabaseRoleManagement360"
import { expireJobsPartners } from "./offrePartenaire/expireJobsPartners"
import { processJobPartnersForApi } from "./offrePartenaire/processJobPartnersForApi"
import { processRecruteursLba } from "./offrePartenaire/recruteur-lba/processRecruteursLba"
import { exportLbaJobsToS3 } from "./partenaireExport/exportJobsToS3"
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
import { SimpleJobDefinition, simpleJobDefinitions } from "./simpleJobDefinitions"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"
import { controlApplications } from "./verifications/controlApplications"
import { controlAppointments } from "./verifications/controlAppointments"

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
            cron_string: "*/5 * * * *",
            handler: generateFranceTravailAccess,
            tag: "main",
          },
          "Scan et envoi des candidatures": {
            cron_string: "*/10 * * * *",
            handler: () => processApplications(),
            tag: "main",
          },
          "Traitement complet des jobs_partners par API": {
            cron_string: "*/10 * * * *",
            handler: processJobPartnersForApi,
            tag: "main",
          },
          "Expiration des offres jobs_partners": {
            cron_string: "*/30 * * * *",
            handler: expireJobsPartners,
            tag: "main",
          },
          "Mise à jour des adresses emails bloquées": {
            cron_string: "5 0 * * *",
            handler: () => updateBrevoBlockedEmails({}),
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
          // "Send offer reminder email at J+7": {
          //   cron_string: "20 0 * * *",
          //   handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "7" } }),
          // },
          // "Send offer reminder email at J+1": {
          //   cron_string: "25 0 * * *",
          //   handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "1" } }),
          // },
          "Envoi du rappel de validation des utilisateurs en attente aux OPCOs": {
            cron_string: "30 0 * * 1,3,5",
            handler: opcoReminderJob,
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
          "Historisation des formations éligibles à la prise de rendez-vous": {
            cron_string: "55 2 * * *",
            handler: eligibleTrainingsForAppointmentsHistoryWithCatalogue,
            tag: "main",
          },
          "Synchronise les formations eligibles à la prise de rendez-vous": {
            cron_string: "45 2 * * *",
            handler: syncEtablissementsAndFormations,
            tag: "main",
          },
          "Supprime les etablissements dupliqués à cause du parallélisme du job de synchronisation RDVA": {
            cron_string: "30 3 * * *",
            handler: removeDuplicateEtablissements,
            tag: "main",
          },
          "Synchronise les dates des etablissements eligible à la prise de rendez-vous": {
            cron_string: "0 5 * * *",
            handler: syncEtablissementDates,
            tag: "main",
          },
          "Envoi des offres à France Travail": {
            cron_string: "30 5 * * *",
            handler: config.env === "production" ? () => exportJobsToFranceTravail() : () => Promise.resolve(0),
            tag: "main",
          },
          "export des offres LBA sur S3": {
            cron_string: "30 6 * * 1",
            handler: config.env === "production" ? () => exportLbaJobsToS3() : () => Promise.resolve(0),
            tag: "main",
          },
          "Invite les établissements (via email gestionnaire) à l'opt-out": {
            cron_string: "0 9 * * *",
            handler: inviteEtablissementToOptOut,
            tag: "main",
          },
          "Invite les établissements (via email gestionnaire) au premium (Parcoursup)": {
            cron_string: "0 9 * * *",
            handler: inviteEtablissementParcoursupToPremium,
            tag: "main",
          },
          "Invite les établissements (via email gestionnaire) au premium (Affelnet)": {
            cron_string: "15 9 * * *",
            handler: inviteEtablissementAffelnetToPremium,
            tag: "main",
          },
          "(Relance) Invite les établissements (via email gestionnaire) au premium (Parcoursup)": {
            cron_string: "30 9 * * *",
            handler: () => inviteEtablissementParcoursupToPremiumFollowUp(),
            tag: "main",
          },
          "(Relance) Invite les établissements (via email gestionnaire) au premium (Affelnet)": {
            cron_string: "45 9 * * *",
            handler: () => inviteEtablissementAffelnetToPremiumFollowUp(),
            tag: "main",
          },
          "Creation de la collection rolemanagement360": {
            cron_string: "00 10,13,17 * * *",
            handler: createRoleManagement360,
            tag: "main",
          },
          "Contrôle quotidien des candidatures": {
            cron_string: "0 10-19/1 * * 1-5",
            handler: config.env === "production" ? () => controlApplications() : () => Promise.resolve(0),
            tag: "main",
          },
          "Contrôle quotidien des prises de rendez-vous": {
            cron_string: "0 11-19/2 * * 1-5",
            handler: config.env === "production" ? () => controlAppointments() : () => Promise.resolve(0),
            tag: "main",
          },
          "Mise à jour du référentiel commune": {
            cron_string: "0 15 * * SUN",
            handler: updateReferentielCommune,
            tag: "main",
          },
          "Emission des intentions des recruteurs": {
            cron_string: "30 20 * * *",
            handler: processRecruiterIntentions,
            tag: "main",
          },
          "Emission des contacts vers Brevo": {
            cron_string: "30 22 * * *",
            handler: sendContactsToBrevo,
            tag: "main",
          },
          "Mise à jour de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep": {
            cron_string: "45 23 * * 2",
            handler: importReferentielOnisep,
            tag: "main",
          },
          "Supprime les dates d'invitation et de refus au premium (PARCOURSUP & AFFELNET) des etablissements": {
            cron_string: "0 0 20 11 *",
            handler: resetInvitationDates,
            tag: "main",
          },
          "Traitement des recruteur LBA par la pipeline jobs partners": {
            cron_string: "0 10 * * SUN",
            handler: processRecruteursLba,
            tag: "main",
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
      "formulaire:relance": {
        handler: async (job) => {
          const { threshold } = job.payload as any
          await recruiterOfferExpirationReminderJob(parseInt(threshold))
          return
        },
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
      "domaines-metiers:update": {
        handler: async () => updateDomainesMetiers(),
      },
      "domaines-metiers:file:update": {
        handler: async (job) => {
          const { filename, key } = job.payload as any
          await updateDomainesMetiersFile({ filename, key })
          return
        },
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
              handler: async () => fct(),
            },
          ]
        })
      ),
    },
  })
}
