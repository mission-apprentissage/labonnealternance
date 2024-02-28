import { createMongoDBIndexes } from "@/common/model"
import { IInternalJobsCronTask, IInternalJobsSimple } from "@/common/model/schema/internalJobs/internalJobs.types"
import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations"

import { getLoggerWithContext } from "../common/logger"

import anonymizeOldAppointments from "./anonymization/anonumizeAppointments"
import anonymizeIndividual from "./anonymization/anonymizeIndividual"
import anonymizeOldApplications from "./anonymization/anonymizeOldApplications"
import { anonimizeUserRecruteurs } from "./anonymization/anonymizeUserRecruteurs"
import fixApplications from "./applications/fixApplications"
import { cronsInit, cronsScheduler } from "./crons_actions"
import { checkDiffusibleCompanies, fixDiffusibleCompanies } from "./database/fixDiffusibleCompanies"
import { obfuscateCollections } from "./database/obfuscateCollections"
import { removeVersionKeyFromAllCollections } from "./database/removeVersionKeyFromAllCollections"
import { fixRDVACollections } from "./database/temp/fixRDVACollections"
import { validateModels } from "./database/validateModels"
import updateDiplomesMetiers from "./diplomesMetiers/updateDiplomesMetiers"
import updateDomainesMetiers from "./domainesMetiers/updateDomainesMetiers"
import updateDomainesMetiersFile from "./domainesMetiers/updateDomainesMetiersFile"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateParcoursupAndAffelnetInfoOnFormationCatalogue } from "./formationsCatalogue/updateParcoursupAndAffelnetInfoOnFormationCatalogue"
import { addJob, executeJob } from "./jobs_actions"
import { createApiUser } from "./lba_recruteur/api/createApiUser"
import { disableApiUser } from "./lba_recruteur/api/disableApiUser"
import { resetApiKey } from "./lba_recruteur/api/resetApiKey"
import { annuleFormulaire } from "./lba_recruteur/formulaire/annuleFormulaire"
import { createUserFromCLI } from "./lba_recruteur/formulaire/createUser"
import { fixJobExpirationDate } from "./lba_recruteur/formulaire/fixJobExpirationDate"
import { fixJobType } from "./lba_recruteur/formulaire/fixJobType"
import { fixRecruiterDataValidation } from "./lba_recruteur/formulaire/fixRecruiterDataValidation"
import { exportPE } from "./lba_recruteur/formulaire/misc/exportPE"
import { recoverMissingGeocoordinates } from "./lba_recruteur/formulaire/misc/recoverGeocoordinates"
import { removeIsDelegatedFromJobs } from "./lba_recruteur/formulaire/misc/removeIsDelegatedFromJobs"
import { repiseGeocoordinates } from "./lba_recruteur/formulaire/misc/repriseGeocoordinates"
import { resendDelegationEmailWithAccessToken } from "./lba_recruteur/formulaire/misc/sendDelegationEmailWithSecuredToken"
import { updateAddressDetailOnRecruitersCollection } from "./lba_recruteur/formulaire/misc/updateAddressDetailOnRecruitersCollection"
import { updateMissingStartDate } from "./lba_recruteur/formulaire/misc/updateMissingStartDate"
import { relanceFormulaire } from "./lba_recruteur/formulaire/relanceFormulaire"
import { importReferentielOpcoFromConstructys } from "./lba_recruteur/opco/constructys/constructysImporter"
import { relanceOpco } from "./lba_recruteur/opco/relanceOpco"
import { createOffreCollection } from "./lba_recruteur/seed/createOffre"
import { fillRecruiterRaisonSociale } from "./lba_recruteur/user/misc/fillRecruiterRaisonSociale"
import { fixUserRecruiterCfaDataValidation } from "./lba_recruteur/user/misc/fixUserRecruteurCfaDataValidation"
import { fixUserRecruiterDataValidation } from "./lba_recruteur/user/misc/fixUserRecruteurDataValidation"
import { checkAwaitingCompaniesValidation } from "./lba_recruteur/user/misc/updateMissingActivationState"
import { updateSiretInfosInError } from "./lba_recruteur/user/misc/updateSiretInfosInError"
import buildSAVE from "./lbb/buildSAVE"
import updateGeoLocations from "./lbb/updateGeoLocations"
import updateLbaCompanies from "./lbb/updateLbaCompanies"
import updateOpcoCompanies from "./lbb/updateOpcoCompanies"
import { runGarbageCollector } from "./misc/runGarbageCollector"
import { activateOptoutOnEtablissementAndUpdateReferrersOnETFA } from "./rdv/activateOptoutOnEtablissementAndUpdateReferrersOnETFA"
import { anonimizeAppointments } from "./rdv/anonymizeAppointments"
import { anonymizeUsers } from "./rdv/anonymizeUsers"
import { eligibleTrainingsForAppointmentsHistoryWithCatalogue } from "./rdv/eligibleTrainingsForAppointmentsHistoryWithCatalogue"
import { importReferentielOnisep } from "./rdv/importReferentielOnisep"
import { inviteEtablissementAffelnetToPremium } from "./rdv/inviteEtablissementAffelnetToPremium"
import { inviteEtablissementAffelnetToPremiumFollowUp } from "./rdv/inviteEtablissementAffelnetToPremiumFollowUp"
import { inviteEtablissementParcoursupToPremium } from "./rdv/inviteEtablissementParcoursupToPremium"
import { inviteEtablissementParcoursupToPremiumFollowUp } from "./rdv/inviteEtablissementParcoursupToPremiumFollowUp"
import { inviteEtablissementToOptOut } from "./rdv/inviteEtablissementToOptOut"
import { fixDuplicateUsers } from "./rdv/oneTimeJob/fixDuplicateUsers"
import { repriseEmailRdvs } from "./rdv/oneTimeJob/repriseEmailsRdv"
import { premiumActivatedReminder } from "./rdv/premiumActivatedReminder"
import { premiumInviteOneShot } from "./rdv/premiumInviteOneShot"
import { removeDuplicateEtablissements } from "./rdv/removeDuplicateEtablissements"
import { syncEtablissementDates } from "./rdv/syncEtablissementDates"
import { syncEtablissementsAndFormations } from "./rdv/syncEtablissementsAndFormations"
import { importFicheMetierRomeV3 } from "./seed/ficheMetierRomev3/ficherMetierRomev3"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"
import { controlApplications } from "./verifications/controlApplications"
import { controlAppointments } from "./verifications/controlAppointments"

const logger = getLoggerWithContext("script")

export const CronsMap = {
  "Create offre collection for metabase": {
    cron_string: "55 0 * * *",
    handler: () => addJob({ name: "metabase:offre:create", payload: {} }),
  },
  "Cancel lba recruteur expired offers": {
    cron_string: "15 0 * * *",
    handler: () => addJob({ name: "formulaire:annulation", payload: {} }),
  },
  "Send offer reminder email at J+7": {
    cron_string: "20 0 * * *",
    handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "7" } }),
  },
  "Send offer reminder email at J+1": {
    cron_string: "25 0 * * *",
    handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "1" } }),
  },
  "Send reminder to OPCO about awaiting validation users": {
    cron_string: "30 0 * * 1,3,5",
    handler: () => addJob({ name: "opco:relance", payload: { threshold: "1" } }),
  },
  "Send CSV offers to Pôle emploi": {
    cron_string: "30 5 * * *",
    handler: () => addJob({ name: "pe:offre:export", payload: { threshold: "1" }, productionOnly: true }),
  },
  "Check companies validation state": {
    cron_string: "30 6 * * *",
    handler: () => addJob({ name: "user:validate", payload: { threshold: "1" } }),
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
    handler: () => addJob({ name: "companies:update", payload: { UseAlgoFile: true, ClearMongo: true, UseSave: true } }),
  },
  "Anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus de 1 an": {
    cron_string: "0 0 1 * *",
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
      case "sync:etablissement:dates":
        return syncEtablissementDates()
      case "remove:duplicates:etablissements":
        return removeDuplicateEtablissements()
      case "garbage-collector:run":
        return runGarbageCollector()
      case "anonymize:appointments":
        return anonymizeOldAppointments()
      case "recruiters:delegations": // Temporaire, doit tourner une fois en production
        return resendDelegationEmailWithAccessToken()
      case "fix:duplicate:users": // Temporaire, doit tourner une fois en production
        return fixDuplicateUsers()
      case "migration:correctionRDVA": // Temporaire, doit tourner une fois en recette et production
        return fixRDVACollections()
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
      case "migration:get-missing-geocoords": // Temporaire, doit tourner en recette et production
        return recoverMissingGeocoordinates()
      case "import:rome":
        return importFicheMetierRomeV3()
      case "migration:remove-version-key-from-all-collections": // Temporaire, doit tourner en recette et production
        return removeVersionKeyFromAllCollections()
      case "migration:remove-delegated-from-jobs": // Temporaire, doit tourner en recette et production
        return removeIsDelegatedFromJobs()
      case "user:create": {
        const { first_name, last_name, establishment_siret, establishment_raison_sociale, phone, address, email, scope } = job.payload
        return createUserFromCLI(
          {
            first_name,
            last_name,
            establishment_siret,
            establishment_raison_sociale,
            phone,
            address,
            email,
            scope,
          },
          {
            options: {
              Type: job.payload.type,
              Email_valide: job.payload.email_valide,
            },
          }
        )
      }
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
      case "metabase:offre:create":
        return createOffreCollection()
      case "opco:relance":
        return relanceOpco()
      case "pe:offre:export":
        return exportPE()
      case "user:validate":
        return checkAwaitingCompaniesValidation()
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
      case "etablissement:invite:premium:follow-up":
        return inviteEtablissementParcoursupToPremiumFollowUp()
      case "etablissement:invite:premium:affelnet:follow-up":
        return inviteEtablissementAffelnetToPremiumFollowUp()
      case "premium:activated:reminder":
        return premiumActivatedReminder()
      case "premium:invite:one-shot":
        return premiumInviteOneShot()
      case "etablissements:formations:sync":
        return syncEtablissementsAndFormations()
      case "appointments:anonimize":
        return anonimizeAppointments()
      case "users:anonimize":
        return anonymizeUsers()
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
        return anonimizeUserRecruteurs()
      case "companies:update":
        return updateLbaCompanies(job.payload)
      case "geo-locations:update":
        return updateGeoLocations(job.payload)
      case "opcos:update":
        return updateOpcoCompanies(job.payload)
      case "domaines-metiers:update":
        return updateDomainesMetiers()
      case "save:update":
        return buildSAVE()
      case "domaines-metiers:file:update": {
        const { filename, key } = job.payload
        return updateDomainesMetiersFile({ filename, key })
      }
      case "diplomes-metiers:update":
        return updateDiplomesMetiers()
      case "recruiters:raison-sociale:fill":
        return fillRecruiterRaisonSociale()
      case "recruiters:expiration-date:fix":
        return fixJobExpirationDate()
      case "recruiters:job-type:fix":
        return fixJobType()
      case "fix-applications":
        return fixApplications()
      case "recruiters:data-validation:fix":
        return fixRecruiterDataValidation()
      case "user-recruters:data-validation:fix":
        return fixUserRecruiterDataValidation()
      case "user-recruters-cfa:data-validation:fix":
        return fixUserRecruiterCfaDataValidation()
      case "referentiel-opco:constructys:import": {
        const { parallelism } = job.payload
        return importReferentielOpcoFromConstructys(parseInt(parallelism))
      }
      case "prdv:emails:resend": {
        const { fromDate } = job.payload
        return repriseEmailRdvs({ fromDateStr: fromDate })
      }
      ///////
      case "mongodb:indexes:create":
        return createMongoDBIndexes()
      case "fix-diffusible-companies":
        return fixDiffusibleCompanies(job.payload)
      case "anonymize-individual": {
        const { collection, id } = job.payload
        return anonymizeIndividual({ collection, id })
      }
      case "check-diffusible-companies":
        return checkDiffusibleCompanies()
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
        console.log(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`)
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

      default: {
        logger.warn(`Job not found ${job.name}`)
      }
    }
  })
}
