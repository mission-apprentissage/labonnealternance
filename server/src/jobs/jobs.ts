import { addJob, initJobProcessor } from "job-processor"
import { ObjectId } from "mongodb"

import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations"

import { getLoggerWithContext } from "../common/logger"
import { getDatabase } from "../common/utils/mongodbUtils"
import config from "../config"

import anonymizeOldAppointments from "./anonymization/anonymizeAppointments"
import anonymizeIndividual from "./anonymization/anonymizeIndividual"
import anonymizeOldApplications from "./anonymization/anonymizeOldApplications"
import { anonimizeUsers } from "./anonymization/anonymizeUserRecruteurs"
import { anonymizeOldUsers } from "./anonymization/anonymizeUsers"
import fixApplications from "./applications/fixApplications"
import { processApplications } from "./applications/processApplications"
import { obfuscateCollections } from "./database/obfuscateCollections"
import { recreateIndexes } from "./database/recreateIndexes"
import { validateModels } from "./database/schemaValidation"
import updateDiplomesMetiers from "./diplomesMetiers/updateDiplomesMetiers"
import updateDomainesMetiers from "./domainesMetiers/updateDomainesMetiers"
import updateDomainesMetiersFile from "./domainesMetiers/updateDomainesMetiersFile"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formationsCatalogue/updateParcoursupAndAffelnetInfoOnFormationCatalogue"
import { generateFranceTravailAccess } from "./franceTravail/generateFranceTravailAccess"
import { pocRomeo } from "./franceTravail/pocRomeo"
import { createJobsCollectionForMetabase } from "./metabase/metabaseJobsCollection"
import { createRoleManagement360 } from "./metabase/metabaseRoleManagement360"
import { runGarbageCollector } from "./misc/runGarbageCollector"
import { importFromComputedToJobsPartners } from "./offrePartenaire/importFromComputedToJobsPartners"
import { importHelloWork } from "./offrePartenaire/importHelloWork"
import { importKelio } from "./offrePartenaire/importKelio"
import { exportLbaJobsToS3 } from "./partenaireExport/exportJobsToS3"
import { exportToFranceTravail } from "./partenaireExport/exportToFranceTravail"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./rdv/activateOptoutOnEtablissementAndUpdateReferrersOnETFA"
import { eligibleTrainingsForAppointmentsHistoryWithCatalogue } from "./rdv/eligibleTrainingsForAppointmentsHistoryWithCatalogue"
import { importReferentielOnisep } from "./rdv/importReferentielOnisep"
import { inviteEtablissementAffelnetToPremium } from "./rdv/inviteEtablissementAffelnetToPremium"
import { inviteEtablissementAffelnetToPremiumFollowUp } from "./rdv/inviteEtablissementAffelnetToPremiumFollowUp"
import { inviteEtablissementParcoursupToPremium } from "./rdv/inviteEtablissementParcoursupToPremium"
import { inviteEtablissementParcoursupToPremiumFollowUp } from "./rdv/inviteEtablissementParcoursupToPremiumFollowUp"
import { inviteEtablissementToOptOut } from "./rdv/inviteEtablissementToOptOut"
import { premiumActivatedReminder } from "./rdv/premiumActivatedReminder"
import { premiumInviteOneShot } from "./rdv/premiumInviteOneShot"
import { removeDuplicateEtablissements } from "./rdv/removeDuplicateEtablissements"
import { syncEtablissementDates } from "./rdv/syncEtablissementDates"
import { syncEtablissementsAndFormations } from "./rdv/syncEtablissementsAndFormations"
import { cancelOfferJob } from "./recruiters/cancelOfferJob"
import { createApiUser } from "./recruiters/createApiUser"
import { disableApiUser } from "./recruiters/disableApiUser"
import { fixJobExpirationDate } from "./recruiters/fixJobExpirationDateJob"
import { fixRecruiterDataValidation } from "./recruiters/fixRecruiterDataValidationJob"
import { opcoReminderJob } from "./recruiters/opcoReminderJob"
import { recruiterOfferExpirationReminderJob } from "./recruiters/recruiterOfferExpirationReminderJob"
import { removeDuplicateRecruiters } from "./recruiters/removeDuplicatesRecruiters"
import { resetApiKey } from "./recruiters/resetApiKey"
import { updateMissingStartDate } from "./recruiters/updateMissingStartDateJob"
import { updateSiretInfosInError } from "./recruiters/updateSiretInfosInErrorJob"
import updateGeoLocations from "./recruteurLba/updateGeoLocations"
import updateOpcoCompanies from "./recruteurLba/updateOpcoCompanies"
import updateLbaCompanies from "./recruteurLba/updateRecruteurLba"
import { importReferentielRome } from "./referentielRome/referentielRome"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"
import { controlApplications } from "./verifications/controlApplications"
import { controlAppointments } from "./verifications/controlAppointments"

export async function setupJobProcessor() {
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
            handler: exportToFranceTravail,
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
          "Anonymise les candidatures de plus de un an": {
            cron_string: "10 0 * * *",
            handler: anonymizeOldApplications,
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
          "Anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus de 1 an": {
            cron_string: "5 1 * * *",
            handler: anonymizeOldUsers,
          },
          "Contrôle quotidien des candidatures": {
            cron_string: "0 10-19/1 * * 1-5",
            handler: config.env === "production" ? () => controlApplications() : () => Promise.resolve(),
          },
          "Contrôle quotidien des prises de rendez-vous": {
            cron_string: "0 11-19/2 * * 1-5",
            handler: config.env === "production" ? () => controlAppointments() : () => Promise.resolve(),
          },
          "Anonymisation des user recruteurs de plus de 2 ans": {
            cron_string: "0 1 * * *",
            handler: anonimizeUsers,
          },
          "Anonymisation des appointments de plus de 1 an": {
            cron_string: "30 1 * * *",
            handler: anonymizeOldAppointments,
          },
          "Lancement du garbage collector": {
            cron_string: "30 3 * * *",
            handler: runGarbageCollector,
          },
          "export des offres LBA sur S3": {
            cron_string: "30 6 * * 1",
            handler: config.env === "production" ? () => exportLbaJobsToS3() : () => Promise.resolve(),
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
      "recreate:indexes": {
        handler: async () => recreateIndexes(),
      },
      "lbajobs:export:s3": {
        handler: async () => exportLbaJobsToS3(),
      },
      "sync:etablissement:dates": {
        handler: async () => syncEtablissementDates(),
      },
      "remove:duplicates:etablissements": {
        handler: async () => removeDuplicateEtablissements(),
      },
      "garbage-collector:run": {
        handler: async () => runGarbageCollector(),
      },
      "anonymize:appointments": {
        handler: async () => anonymizeOldAppointments(),
      },
      "control:applications": {
        handler: async () => controlApplications(),
      },
      "control:appointments": {
        handler: async () => controlAppointments(),
      },
      "recruiters:set-missing-job-start-date": {
        handler: async () => updateMissingStartDate(),
      },
      "import:referentielrome": {
        handler: async () => importReferentielRome(),
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
      "formulaire:annulation": {
        handler: async () => cancelOfferJob(),
      },
      "metabase:role-management:create": {
        handler: async () => createRoleManagement360(),
      },
      "metabase:jobs:collection": {
        handler: async () => createJobsCollectionForMetabase(),
      },
      "opco:relance": {
        handler: async () => opcoReminderJob(),
      },
      "pe:offre:export": {
        handler: async () => updateSiretInfosInError(),
      },
      "siret:inError:update": {
        handler: async () => updateSiretInfosInError(),
      },
      "etablissement:formations:activate:opt-out": {
        handler: async () => activateOptoutOnEtablissementAndUpdateReferrersOnETFA(),
      },
      "etablissement:invite:opt-out": {
        handler: async () => inviteEtablissementToOptOut(),
      },
      "etablissement:invite:premium:parcoursup": {
        handler: async () => inviteEtablissementParcoursupToPremium(),
      },
      "etablissement:invite:premium:affelnet": {
        handler: async () => inviteEtablissementAffelnetToPremium(),
      },
      "etablissement:invite:premium:follow-up": {
        handler: async (job) => inviteEtablissementParcoursupToPremiumFollowUp(job.payload?.bypassDate as any),
      },
      "etablissement:invite:premium:affelnet:follow-up": {
        handler: async (job) => inviteEtablissementAffelnetToPremiumFollowUp(job.payload?.bypassDate as any),
      },
      "premium:activated:reminder": {
        handler: async () => premiumActivatedReminder(),
      },
      "premium:invite:one-shot": {
        handler: async () => premiumInviteOneShot(),
      },
      "etablissements:formations:sync": {
        handler: async () => syncEtablissementsAndFormations(),
      },
      "users:anonimize": {
        handler: async () => anonymizeOldUsers(),
      },
      "catalogue:trainings:appointments:archive:eligible": {
        handler: async () => eligibleTrainingsForAppointmentsHistoryWithCatalogue(),
      },
      "referentiel:onisep:import": {
        handler: async () => importReferentielOnisep(),
      },
      "catalogue:trainings:sync": {
        handler: async () => importCatalogueFormationJob(),
      },
      "catalogue:trainings:sync:extra": {
        handler: async () => updateParcoursupAndAffelnetInfoOnFormationCatalogue(),
      },
      "brevo:blocked:sync": {
        handler: async (job) => updateBrevoBlockedEmails(job.payload as any),
      },
      "applications:anonymize": {
        handler: async () => anonymizeOldApplications(),
      },
      "user-recruteurs:anonymize": {
        handler: async () => anonimizeUsers(),
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
      "recruiters:expiration-date:fix": {
        handler: async () => fixJobExpirationDate(),
      },
      "fix-applications": {
        handler: async () => fixApplications(),
      },
      "recruiters:data-validation:fix": {
        handler: async () => fixRecruiterDataValidation(),
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
      "db:obfuscate": {
        handler: async () => obfuscateCollections(),
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
          const pendingMigrations = await statusMigration()
          console.info(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`)
          return
        },
      },
      "migrations:create": {
        handler: async (job) => createMigration(job.payload as any),
      },
      "import-hellowork": {
        handler: async () => importHelloWork(),
      },
      "import-kelio": {
        handler: async () => importKelio(),
      },
      "import-computed-to-jobs-partners": {
        handler: async () => importFromComputedToJobsPartners(),
      },
      "send-applications": {
        handler: async () => processApplications(),
      },
    },
  })
}
