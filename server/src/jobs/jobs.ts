import { ObjectId } from "mongodb"

import { IInternalJobsCronTask, IInternalJobsSimple } from "@/common/model/internalJobs.types"
import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations"

import { getLoggerWithContext } from "../common/logger"

import anonymizeOldAppointments from "./anonymization/anonymizeAppointments"
import anonymizeIndividual from "./anonymization/anonymizeIndividual"
import anonymizeOldApplications from "./anonymization/anonymizeOldApplications"
import { anonimizeUsers } from "./anonymization/anonymizeUserRecruteurs"
import fixApplications from "./applications/fixApplications"
import { processApplications } from "./applications/processApplications"
import { cronsInit, cronsScheduler } from "./crons_actions"
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
import { addJob, executeJob } from "./jobs_actions"
import { createApiUser } from "./lba_recruteur/api/createApiUser"
import { disableApiUser } from "./lba_recruteur/api/disableApiUser"
import { resetApiKey } from "./lba_recruteur/api/resetApiKey"
import { annuleFormulaire } from "./lba_recruteur/formulaire/annuleFormulaire"
import { fixJobExpirationDate } from "./lba_recruteur/formulaire/fixJobExpirationDate"
import { fixJobType } from "./lba_recruteur/formulaire/fixJobType"
import { fixRecruiterDataValidation } from "./lba_recruteur/formulaire/fixRecruiterDataValidation"
import { repiseGeocoordinates } from "./lba_recruteur/formulaire/misc/repriseGeocoordinates"
import { updateAddressDetailOnRecruitersCollection } from "./lba_recruteur/formulaire/misc/updateAddressDetailOnRecruitersCollection"
import { updateMissingStartDate } from "./lba_recruteur/formulaire/misc/updateMissingStartDate"
import { relanceFormulaire } from "./lba_recruteur/formulaire/relanceFormulaire"
import { importReferentielOpcoFromConstructys } from "./lba_recruteur/opco/constructys/constructysImporter"
import { relanceOpco } from "./lba_recruteur/opco/relanceOpco"
import { updateSiretInfosInError } from "./lba_recruteur/user/misc/updateSiretInfosInError"
import { createJobsCollectionForMetabase } from "./metabase/metabaseJobsCollection"
import { createRoleManagement360 } from "./metabase/metabaseRoleManagement360"
import { runGarbageCollector } from "./misc/runGarbageCollector"
import { importHelloWork } from "./offrePartenaire/importHelloWork"
import { exportLbaJobsToS3 } from "./partenaireExport/exportJobsToS3"
import { exportToFranceTravail } from "./partenaireExport/exportToFranceTravail"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./rdv/activateOptoutOnEtablissementAndUpdateReferrersOnETFA"
import { anonimizeAppointments } from "./rdv/anonymizeAppointments"
import { anonymizeOldUsers } from "./rdv/anonymizeUsers"
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
import updateGeoLocations from "./recruteurLba/updateGeoLocations"
import updateOpcoCompanies from "./recruteurLba/updateOpcoCompanies"
import updateLbaCompanies from "./recruteurLba/updateRecruteurLba"
import { importReferentielRome } from "./seed/referentielRome/referentielRome"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"
import { controlApplications } from "./verifications/controlApplications"
import { controlAppointments } from "./verifications/controlAppointments"

const logger = getLoggerWithContext("script")

export const CronsMap = {
  "Create offre collection for metabase": {
    cron_string: "55 0 * * *",
    handler: () => addJob({ name: "metabase:jobs:collection", payload: {} }),
  },
  "Cancel lba recruteur expired offers": {
    cron_string: "15 0 * * *",
    handler: () => addJob({ name: "formulaire:annulation", payload: {} }),
  },
  // "Send offer reminder email at J+7": {
  //   cron_string: "20 0 * * *",
  //   handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "7" } }),
  // },
  // "Send offer reminder email at J+1": {
  //   cron_string: "25 0 * * *",
  //   handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "1" } }),
  // },
  "Send reminder to OPCO about awaiting validation users": {
    cron_string: "30 0 * * 1,3,5",
    handler: () => addJob({ name: "opco:relance", payload: { threshold: "1" } }),
  },
  "Send CSV offers to France Travail": {
    cron_string: "30 5 * * *",
    handler: () => addJob({ name: "pe:offre:export", payload: { threshold: "1" }, productionOnly: true }),
  },
  "Mise à jour des recruteurs en erreur": {
    cron_string: "10 0 * * *",
    handler: () => addJob({ name: "siret:inError:update", payload: {} }),
  },
  "Active tous les établissements qui ont souscrits à l'opt-out.": {
    cron_string: "50 0 * * *",
    handler: () => addJob({ name: "etablissement:formations:activate:opt-out", payload: {} }),
  },
  "Invite les établissements (via email gestionnaire) à l'opt-out.": {
    cron_string: "0 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:opt-out", payload: {} }),
  },
  "Invite les établissements (via email gestionnaire) au premium (Parcoursup).": {
    cron_string: "0 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium:parcoursup", payload: {} }),
  },
  "(Relance) Invite les établissements (via email gestionnaire) au premium (Parcoursup).": {
    cron_string: "30 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium:follow-up", payload: {} }),
  },
  "Récupère la liste de toutes les formations du Catalogue et les enregistre en base de données.": {
    cron_string: "45 2 * * *",
    handler: () => addJob({ name: "etablissements:formations:sync", payload: {} }),
  },
  "Suppression des etablissements dupliqués à cause du parallélisme du job de synchronisation RDVA": {
    cron_string: "30 3 * * *",
    handler: () => addJob({ name: "remove:duplicates:etablissements", payload: {} }),
  },
  "Re-synchronise les referres manquant dans la collection ETFA": {
    cron_string: "10 3 * * *",
    handler: () => addJob({ name: "etablissements:formations:inverted:sync", payload: {} }),
  },
  "Synchronise les dates des etablissements": {
    cron_string: "0 5 * * *",
    handler: () => addJob({ name: "sync:etablissement:dates", payload: {} }),
  },
  "Historisation des formations éligibles à la prise de rendez-vous.": {
    cron_string: "55 2 * * *",
    handler: () => addJob({ name: "catalogue:trainings:appointments:archive:eligible", payload: {} }),
  },
  "Anonimisation des prises de rendez-vous de plus d'un an": {
    cron_string: "10 0 1 * *",
    handler: () => addJob({ name: "appointments:anonimize", payload: {} }),
  },
  "Invite les établissements (via email gestionnaire) au premium (Affelnet).": {
    cron_string: "15 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium:affelnet", payload: {} }),
  },
  "(Relance) Invite les établissements (via email gestionnaire) au premium (Affelnet).": {
    cron_string: "45 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium:affelnet:follow-up", payload: {} }),
  },
  "Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep": {
    cron_string: "45 23 * * 2",
    handler: () => addJob({ name: "referentiel:onisep:import", payload: {} }),
  },
  "Mise à jour depuis le Catalogue des formations.": {
    cron_string: "15 2 * * *",
    handler: () => addJob({ name: "catalogue:trainings:sync", payload: {} }),
  },
  "Mise à jour des champs spécifiques de la collection formations catalogue.": {
    cron_string: "30 2 * * *",
    handler: () => addJob({ name: "catalogue:trainings:sync:extra", payload: {} }),
  },
  "Mise à jour des adresses emails bloquées.": {
    cron_string: "5 0 * * *",
    handler: () => addJob({ name: "brevo:blocked:sync", payload: {} }),
  },
  "Anonymise les candidatures de plus de un an.": {
    cron_string: "10 0 * * *",
    handler: () => addJob({ name: "applications:anonymize", payload: {} }),
  },
  "Géolocation de masse des sociétés issues de l'algo": {
    cron_string: "0 5 * * 6",
    handler: () => addJob({ name: "geo-locations:update", payload: {} }),
  },
  "Détermination des opcos des sociétés issues de l'algo": {
    cron_string: "30 6 * * 6",
    handler: () => addJob({ name: "opcos:update", payload: {} }),
  },
  "Mise à jour des sociétés issues de l'algo": {
    cron_string: "0 5 * * 7",
    handler: () => addJob({ name: "companies:update", payload: { UseAlgoFile: true, ClearMongo: true } }),
  },
  "Anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus de 1 an": {
    cron_string: "5 1 * * *",
    handler: () => addJob({ name: "users:anonimize", payload: {} }),
  },
  "Contrôle quotidien des candidatures": {
    cron_string: "0 10-19/1 * * 1-5",
    handler: () => addJob({ name: "control:applications", payload: {}, productionOnly: true }),
  },
  "Contrôle quotidien des prises de rendez-vous": {
    cron_string: "0 11-19/2 * * 1-5",
    handler: () => addJob({ name: "control:appointments", payload: {}, productionOnly: true }),
  },
  "Anonymisation des user recruteurs de plus de 2 ans": {
    cron_string: "0 1 * * *",
    handler: () => addJob({ name: "user-recruteurs:anonymize", payload: {} }),
  },
  "Anonymisation des appointments de plus de 1 an": {
    cron_string: "30 1 * * *",
    handler: () => addJob({ name: "anonymize:appointments", payload: {} }),
  },
  "Lancement du garbage collector": {
    cron_string: "30 3 * * *",
    handler: () => addJob({ name: "garbage-collector:run", payload: {} }),
  },
  "export des offres LBA sur S3": {
    cron_string: "30 6 * * 1",
    handler: () => addJob({ name: "lbajobs:export:s3", payload: {}, productionOnly: true }),
  },
  "Génération de la collection rolemanagement360": {
    cron_string: "00 10,13,17 * * *",
    handler: () => addJob({ name: "metabase:role-management:create", payload: {} }),
  },
  "Scan et envoi des candidatures": {
    cron_string: "*/10 * * * *",
    handler: () => addJob({ name: "send-applications", payload: { batchSize: 100 } }),
  },
  "Génération du token France Travail pour la récupération des offres": {
    cron_string: "*/5 * * * *",
    handler: () => addJob({ name: "francetravail:token-offre", payload: {} }),
  },
} satisfies Record<string, Omit<CronDef, "name">>

export type CronName = keyof typeof CronsMap

interface CronDef {
  name: CronName
  cron_string: string
  handler: () => Promise<number>
}

export const CRONS: CronDef[] = Object.entries(CronsMap).map(([name, cronDef]) => ({ ...cronDef, name: name as CronName }))

export async function runJob(job: IInternalJobsCronTask | IInternalJobsSimple): Promise<number> {
  return executeJob(job, async () => {
    if (job.type === "cron_task") {
      return CronsMap[job.name].handler()
    }
    switch (job.name) {
      case "poc:romeo":
        return pocRomeo()
      case "francetravail:token-offre":
        return generateFranceTravailAccess()
      case "recreate:indexes":
        return recreateIndexes()
      case "lbajobs:export:s3":
        return exportLbaJobsToS3()
      case "sync:etablissement:dates":
        return syncEtablissementDates()
      case "remove:duplicates:etablissements":
        return removeDuplicateEtablissements()
      case "garbage-collector:run":
        return runGarbageCollector()
      case "anonymize:appointments":
        return anonymizeOldAppointments()
      case "control:applications":
        return controlApplications()
      case "control:appointments":
        return controlAppointments()
      case "recruiters:set-missing-job-start-date":
        return updateMissingStartDate()
      case "recruiters:get-missing-geocoordinates":
        return repiseGeocoordinates()
      case "recruiters:get-missing-address-detail":
        return updateAddressDetailOnRecruitersCollection()
      case "import:referentielrome":
        return importReferentielRome()
      case "api:user:create": {
        const { nom, prenom, email, organization, scope } = job.payload
        return createApiUser(nom, prenom, email, organization, scope)
      }
      case "api:user:reset":
        return resetApiKey(job.payload?.email)
      case "api:user:disable": {
        const { email, state } = job.payload
        return disableApiUser(email, state)
      }
      case "formulaire:relance": {
        const { threshold } = job.payload
        return relanceFormulaire(parseInt(threshold))
      }
      case "formulaire:annulation":
        return annuleFormulaire()
      case "metabase:role-management:create":
        return createRoleManagement360()
      case "metabase:jobs:collection":
        return createJobsCollectionForMetabase()
      case "opco:relance":
        return relanceOpco()
      case "pe:offre:export":
        return exportToFranceTravail()
      case "siret:inError:update":
        return updateSiretInfosInError()
      case "etablissement:formations:activate:opt-out":
        return activateOptoutOnEtablissementAndUpdateReferrersOnETFA()
      case "etablissement:invite:opt-out":
        return inviteEtablissementToOptOut()
      case "etablissement:invite:premium:parcoursup":
        return inviteEtablissementParcoursupToPremium()
      case "etablissement:invite:premium:affelnet":
        return inviteEtablissementAffelnetToPremium()
      case "etablissement:invite:premium:follow-up": {
        const { bypassDate } = job.payload
        return inviteEtablissementParcoursupToPremiumFollowUp(bypassDate)
      }
      case "etablissement:invite:premium:affelnet:follow-up": {
        const { bypassDate } = job.payload
        return inviteEtablissementAffelnetToPremiumFollowUp(bypassDate)
      }
      case "premium:activated:reminder":
        return premiumActivatedReminder()
      case "premium:invite:one-shot":
        return premiumInviteOneShot()
      case "etablissements:formations:sync":
        return syncEtablissementsAndFormations()
      case "appointments:anonimize":
        return anonimizeAppointments()
      case "users:anonimize":
        return anonymizeOldUsers()
      case "catalogue:trainings:appointments:archive:eligible":
        return eligibleTrainingsForAppointmentsHistoryWithCatalogue()
      case "referentiel:onisep:import":
        return importReferentielOnisep()
      case "catalogue:trainings:sync":
        return importCatalogueFormationJob()
      case "catalogue:trainings:sync:extra":
        return updateParcoursupAndAffelnetInfoOnFormationCatalogue()
      case "brevo:blocked:sync":
        return updateBrevoBlockedEmails(job.payload)
      case "applications:anonymize":
        return anonymizeOldApplications()
      case "user-recruteurs:anonymize":
        return anonimizeUsers()
      case "companies:update":
        return updateLbaCompanies(job.payload)
      case "geo-locations:update":
        return updateGeoLocations(job.payload)
      case "opcos:update":
        return updateOpcoCompanies(job.payload)
      case "domaines-metiers:update":
        return updateDomainesMetiers()
      case "domaines-metiers:file:update": {
        const { filename, key } = job.payload
        return updateDomainesMetiersFile({ filename, key })
      }
      case "diplomes-metiers:update":
        return updateDiplomesMetiers()
      case "recruiters:expiration-date:fix":
        return fixJobExpirationDate()
      case "recruiters:job-type:fix":
        return fixJobType()
      case "fix-applications":
        return fixApplications()
      case "recruiters:data-validation:fix":
        return fixRecruiterDataValidation()
      case "referentiel-opco:constructys:import": {
        const { parallelism } = job.payload
        return importReferentielOpcoFromConstructys(parseInt(parallelism))
      }
      case "anonymize-individual": {
        const { collection, id } = job.payload
        return anonymizeIndividual({ collection, id: new ObjectId(id) })
      }
      case "db:validate":
        return validateModels()
      case "db:obfuscate":
        return obfuscateCollections()
      case "migrations:up": {
        await upMigration()
        // Validate all documents after the migration
        await addJob({ name: "db:validate", queued: true, payload: {} })
        return
      }
      case "migrations:status": {
        const pendingMigrations = await statusMigration()
        console.info(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`)
        return
      }
      case "migrations:create":
        return createMigration(job.payload as any)
      case "crons:init": {
        await cronsInit()
        return
      }
      case "crons:scheduler":
        return cronsScheduler()
      case "import-hellowork":
        return importHelloWork()
      case "send-applications": {
        const { batchSize } = job.payload
        return processApplications(batchSize ? parseInt(batchSize, 10) : 100)
      }
      default: {
        logger.warn(`Job not found ${job.name}`)
      }
    }
  })
}
