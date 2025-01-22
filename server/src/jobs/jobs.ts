import { addJob, initJobProcessor } from "job-processor"
import { ObjectId } from "mongodb"

import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations"
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
import updateDiplomesMetiers from "./diplomesMetiers/updateDiplomesMetiers"
import updateDomainesMetiers from "./domainesMetiers/updateDomainesMetiers"
import updateDomainesMetiersFile from "./domainesMetiers/updateDomainesMetiersFile"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formationsCatalogue/updateParcoursupAndAffelnetInfoOnFormationCatalogue"
import { classifyFranceTravailJobs } from "./franceTravail/classifyJobsFranceTravail"
import { generateFranceTravailAccess } from "./franceTravail/generateFranceTravailAccess"
import { importFranceTravailJobs } from "./franceTravail/importJobsFranceTravail"
import { pocRomeo } from "./franceTravail/pocRomeo"
import { createJobsCollectionForMetabase } from "./metabase/metabaseJobsCollection"
import { createRoleManagement360 } from "./metabase/metabaseRoleManagement360"
import { runGarbageCollector } from "./misc/runGarbageCollector"
import { processJobPartners } from "./offrePartenaire/processJobPartners"
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
import { removeDuplicateRecruiters } from "./recruiters/removeDuplicatesRecruiters"
import { resetApiKey } from "./recruiters/resetApiKey"
import { updateSiretInfosInError } from "./recruiters/updateSiretInfosInErrorJob"
import updateGeoLocations from "./recruteurLba/updateGeoLocations"
import updateOpcoCompanies from "./recruteurLba/updateOpcoCompanies"
import updateLbaCompanies from "./recruteurLba/updateRecruteurLba"
import { SimpleJobDefinition, simpleJobDefinitions } from "./simpleJobDefinitions"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"
import { controlApplications } from "./verifications/controlApplications"
import { controlAppointments } from "./verifications/controlAppointments"

export async function setupJobProcessor() {
  logger.info("Setup job processor")
  return initJobProcessor({
    db: getDatabase(),
    logger: getLoggerWithContext("script"),
    crons: ["local", "preview", "pentest"].includes(config.env)
      ? {}
      : {
          "Creation de la collection JOBS pour metabase": {
            cron_string: "55 0 * * *",
            handler: createJobsCollectionForMetabase,
          },
          "Annulation des offres expirées": {
            cron_string: "15 0 * * *",
            handler: cancelOfferJob,
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
          },
          "Envoi des offres à France Travail": {
            cron_string: "30 5 * * *",
            handler: config.env === "production" ? () => exportJobsToFranceTravail() : () => Promise.resolve(0),
          },
          "Mise à jour des recruteurs en erreur": {
            cron_string: "10 0 * * *",
            handler: updateSiretInfosInError,
          },
          "Active tous les établissements qui ont souscrits à l'opt-out": {
            cron_string: "50 0 * * *",
            handler: activateOptoutOnEtablissementAndUpdateReferrersOnETFA,
          },
          "Invite les établissements (via email gestionnaire) à l'opt-out": {
            cron_string: "0 9 * * *",
            handler: inviteEtablissementToOptOut,
          },
          "Invite les établissements (via email gestionnaire) au premium (Parcoursup)": {
            cron_string: "0 9 * * *",
            handler: inviteEtablissementParcoursupToPremium,
          },
          "(Relance) Invite les établissements (via email gestionnaire) au premium (Parcoursup)": {
            cron_string: "30 9 * * *",
            handler: () => inviteEtablissementParcoursupToPremiumFollowUp(),
          },
          "Invite les établissements (via email gestionnaire) au premium (Affelnet)": {
            cron_string: "15 9 * * *",
            handler: inviteEtablissementAffelnetToPremium,
          },
          "(Relance) Invite les établissements (via email gestionnaire) au premium (Affelnet)": {
            cron_string: "45 9 * * *",
            handler: () => inviteEtablissementAffelnetToPremiumFollowUp(),
          },
          "Synchronise les formations eligibles à la prise de rendez-vous": {
            cron_string: "45 2 * * *",
            handler: syncEtablissementsAndFormations,
          },
          "Supprime les etablissements dupliqués à cause du parallélisme du job de synchronisation RDVA": {
            cron_string: "30 3 * * *",
            handler: removeDuplicateEtablissements,
          },
          "Synchronise les dates des etablissements eligible à la prise de rendez-vous": {
            cron_string: "0 5 * * *",
            handler: syncEtablissementDates,
          },
          "Supprime les dates d'invitation et de refus au premium (PARCOURSUP & AFFELNET) des etablissements": {
            cron_string: "0 0 20 11 *",
            handler: resetInvitationDates,
          },
          "Historisation des formations éligibles à la prise de rendez-vous": {
            cron_string: "55 2 * * *",
            handler: eligibleTrainingsForAppointmentsHistoryWithCatalogue,
          },
          "Mise à jour de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep": {
            cron_string: "45 23 * * 2",
            handler: importReferentielOnisep,
          },
          "Import des formations depuis le Catalogue RCO": {
            cron_string: "15 2 * * *",
            handler: importCatalogueFormationJob,
          },
          "Mise à jour des champs spécifiques de la collection formations catalogue": {
            cron_string: "30 2 * * *",
            handler: updateParcoursupAndAffelnetInfoOnFormationCatalogue,
          },
          "Mise à jour des adresses emails bloquées": {
            cron_string: "5 0 * * *",
            handler: () => updateBrevoBlockedEmails({}),
          },
          "Géolocation de masse des sociétés issues de l'algo": {
            cron_string: "0 5 * * 6",
            handler: () => updateGeoLocations({}),
          },
          "Détermination des opcos des sociétés issues de l'algo": {
            cron_string: "30 6 * * 6",
            handler: () => updateOpcoCompanies({}),
          },
          "Mise à jour des sociétés issues de l'algo": {
            cron_string: "0 5 * * 7",
            handler: () => updateLbaCompanies({ useAlgoFile: true, clearMongo: true }),
          },
          "Contrôle quotidien des candidatures": {
            cron_string: "0 10-19/1 * * 1-5",
            handler: config.env === "production" ? () => controlApplications() : () => Promise.resolve(0),
          },
          "Contrôle quotidien des prises de rendez-vous": {
            cron_string: "0 11-19/2 * * 1-5",
            handler: config.env === "production" ? () => controlAppointments() : () => Promise.resolve(0),
          },
          "Anonymisation des candidatures de plus de deux (2) ans": {
            cron_string: "15 0 * * *",
            handler: anonymizeApplications,
          },
          "Anonymisation des candidats & leurs candidatures de plus de deux (2) ans": {
            cron_string: "10 0 * * *",
            handler: anonymizeApplicantsAndApplications,
          },
          "Anonimisation des utilisateurs RDVA de plus de deux (2) ans": {
            cron_string: "5 1 * * *",
            handler: anonymizeUsers,
          },
          "Anonymisation des user recruteurs de plus de deux (2) ans": {
            cron_string: "0 1 * * *",
            handler: anonimizeUsersWithAccounts,
          },
          "Anonymisation des appointments de plus de deux (2) ans": {
            cron_string: "30 1 * * *",
            handler: anonymizeAppointments,
          },
          "Lancement du garbage collector": {
            cron_string: "30 3 * * *",
            handler: runGarbageCollector,
          },
          "export des offres LBA sur S3": {
            cron_string: "30 6 * * 1",
            handler: config.env === "production" ? () => exportLbaJobsToS3() : () => Promise.resolve(0),
          },
          "Creation de la collection rolemanagement360": {
            cron_string: "00 10,13,17 * * *",
            handler: createRoleManagement360,
          },
          "Scan et envoi des candidatures": {
            cron_string: "*/10 * * * *",
            handler: () => processApplications(),
          },
          "Génération du token France Travail pour la récupération des offres": {
            cron_string: "*/5 * * * *",
            handler: generateFranceTravailAccess,
          },
          "Mise à jour du référentiel commune": {
            cron_string: "0 15 * * SUN",
            handler: updateReferentielCommune,
          },
          "Emission des contacts vers Brevo": {
            cron_string: "30 22 * * *",
            handler: sendContactsToBrevo,
          },
          "Génération du sitemap pour les offres": {
            cron_string: "20 0 * * *",
            handler: generateSitemap,
          },
          "Traitement complet des jobs_partners": {
            cron_string: "40 3 * * *",
            handler: processJobPartners,
          },
          "Import complet des offres France Travail": {
            cron_string: "0 6 * * *",
            handler: importFranceTravailJobs,
          },
          "Emission des intentions des recruteurs": {
            cron_string: "30 20 * * *",
            handler: processRecruiterIntentions,
          },
        },
    jobs: {
      "remove:duplicates:recruiters": {
        handler: async () => removeDuplicateRecruiters(),
      },
      "poc:romeo": {
        handler: async () => pocRomeo(),
      },
      "francetravail:token-offre": {
        handler: async () => generateFranceTravailAccess(),
      },
      "francetravail:jobs:import": {
        handler: async () => importFranceTravailJobs(),
      },
      "francetravail:jobs:classify": {
        handler: async () => classifyFranceTravailJobs(),
      },
      "recreate:indexes": {
        handler: async (job) => {
          const { drop } = job.payload as any
          await recreateIndexes({ drop })
          return
        },
      },
      "garbage-collector:run": {
        handler: async () => runGarbageCollector(),
      },
      "anonymize:appointments": {
        handler: async () => anonymizeAppointments(),
      },
      "control:applications": {
        handler: async () => controlApplications(),
      },
      "control:appointments": {
        handler: async () => controlAppointments(),
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
      "pe:offre:export": {
        handler: async () => exportJobsToFranceTravail(),
      },
      "etablissement:invite:premium:follow-up": {
        handler: async (job) => inviteEtablissementParcoursupToPremiumFollowUp(job.payload?.bypassDate as any),
      },
      "etablissement:invite:premium:affelnet:follow-up": {
        handler: async (job) => inviteEtablissementAffelnetToPremiumFollowUp(job.payload?.bypassDate as any),
      },
      "etablissements:formations:sync": {
        handler: async () => syncEtablissementsAndFormations(),
      },
      "brevo:blocked:sync": {
        handler: async (job) => updateBrevoBlockedEmails(job.payload as any),
      },
      "companies:update": {
        handler: async (job) => updateLbaCompanies(job.payload as any),
      },
      "geo-locations:update": {
        handler: async (job) => updateGeoLocations(job.payload as any),
      },
      "opcos:update": {
        handler: async (job) => updateOpcoCompanies(job.payload as any),
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
      "diplomes-metiers:update": {
        handler: async () => updateDiplomesMetiers(),
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
            console.log("migrations-status=synced")
          } else {
            console.log(`migrations-status=${requireShutdown ? "require-shutdown" : "pending"}`)
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
