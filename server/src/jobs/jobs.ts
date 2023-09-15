// import { create as createMigration, status as statusMigration, up as upMigration } from "@/jobs/migrations/migrations"
import { IInternalJobs } from "@/common/model/schema/internalJobs/internalJobs.types"

import { getLoggerWithContext } from "../common/logger"

import anonymizeOldApplications from "./anonymizeOldApplications/anonymizeOldApplications"
import refactorLBACFields from "./cleanAndRenameDBFields/refactorLBACFields"
import { cronsInit, cronsScheduler } from "./crons_actions"
// import { findInvalidDocuments } from "./db/findInvalidDocuments"
// import { recreateIndexes } from "./db/recreateIndexes"
// import { validateModels } from "./db/schemaValidation"
import updateDiplomesMetiers from "./diplomesMetiers/updateDiplomesMetiers"
import updateDomainesMetiers from "./domainesMetiers/updateDomainesMetiers"
import updateDomainesMetiersFile from "./domainesMetiers/updateDomainesMetiersFile"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateFormationCatalogue } from "./formationsCatalogue/updateFormationCatalogue"
import { addJob, executeJob } from "./jobs_actions"
import { createApiUser } from "./lba_recruteur/api/createApiUser"
import { disableApiUser } from "./lba_recruteur/api/disableApiUser"
import { resetApiKey } from "./lba_recruteur/api/resetApiKey"
import { annuleFormulaire } from "./lba_recruteur/formulaire/annuleFormulaire"
import { createUserFromCLI } from "./lba_recruteur/formulaire/createUser"
import { exportPE } from "./lba_recruteur/formulaire/misc/exportPE"
import { relanceFormulaire } from "./lba_recruteur/formulaire/relanceFormulaire"
import { generateIndexes } from "./lba_recruteur/indexes/generateIndexes"
import { relanceOpco } from "./lba_recruteur/opco/relanceOpco"
import { createOffreCollection } from "./lba_recruteur/seed/createOffre"
import { checkAwaitingCompaniesValidation } from "./lba_recruteur/user/misc/updateMissingActivationState"
import { updateSiretInfosInError } from "./lba_recruteur/user/misc/updateSiretInfosInError"
import updateBonnesBoites from "./lbb/updateBonnesBoites"
import updateGeoLocations from "./lbb/updateGeoLocations"
import updateOpcoCompanies from "./lbb/updateOpcoCompanies"
import { activateOptOutEtablissementFormations } from "./rdv/activateOptOutEtablissementFormations"
import { anonimizeAppointments } from "./rdv/anonymizeAppointments"
import { anonimizeUsers } from "./rdv/anonymizeUsers"
import { eligibleTrainingsForAppointmentsHistoryWithCatalogue } from "./rdv/eligibleTrainingsForAppointmentsHistoryWithCatalogue"
import { importReferentielOnisep } from "./rdv/importReferentielOnisep"
import { inviteEtablissementToOptOut } from "./rdv/inviteEtablissementToOptOut"
import { inviteEtablissementToPremium } from "./rdv/inviteEtablissementToPremium"
import { inviteEtablissementAffelnetToPremium } from "./rdv/inviteEtablissementToPremiumAffelnet"
import { inviteEtablissementToPremiumFollowUp } from "./rdv/inviteEtablissementToPremiumFollowUp"
import { inviteEtablissementAffelnetToPremiumFollowUp } from "./rdv/inviteEtablissementToPremiumFollowUpAffelnet"
import { premiumActivatedReminder } from "./rdv/premiumActivatedReminder"
import { premiumInviteOneShot } from "./rdv/premiumInviteOneShot"
import { syncEtablissementsAndFormations } from "./rdv/syncEtablissementsAndFormations"
import { syncAffelnetFormationsFromCatalogueME } from "./rdv/syncEtablissementsAndFormationsAffelnet"
import updateReferentielRncpRomes from "./referentielRncpRome/updateReferentielRncpRomes"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"

const logger = getLoggerWithContext("script")

interface CronDef {
  name: string
  cron_string: string
  handler: () => Promise<number>
}

export const CRONS: Record<string, CronDef> = {
  "Run daily jobs each day at 02h30": {
    name: "Run daily jobs each day at 02h30",
    cron_string: "30 2 * * *",
    handler: async () => {
      // TODO
      return 0
    },
  },
}

export async function runJob(job: IInternalJobs): Promise<number> {
  return executeJob(job, async () => {
    if (job.type === "cron_task") {
      return CRONS[job.name].handler()
    }
    switch (job.name) {
      case "indexes:generate":
        return generateIndexes((job.payload as any))
      case "user:create": {
        const { first_name, last_name, establishment_siret, establishment_raison_sociale, phone, address, email, scope } = job.payload as any
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
              Type: (job.payload as any).type,
              Email_valide: (job.payload as any).email_valide,
            },
          }
        )
      }
      case "api:user:create": {
        const { nom, prenom, email, organization, scope } = job.payload as any
        return createApiUser(nom, prenom, email, organization, scope)
      }
      case "api:user:reset":
        return resetApiKey((job.payload as any)?.email)
      case "api:user:disable": {
        const { email, state } = job.payload as any
        return disableApiUser(email, state)
      }
      case "formulaire:relance": {
        const { threshold } = job.payload as any
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
        return activateOptOutEtablissementFormations()
      case "etablissement:invite:opt-out":
        return inviteEtablissementToOptOut()
      case "etablissement:invite:premium":
        return inviteEtablissementToPremium()
      case "etablissement:invite:premium:affelnet":
        return inviteEtablissementAffelnetToPremium()
      case "etablissement:invite:premium:follow-up":
        return inviteEtablissementToPremiumFollowUp()
      case "etablissement:invite:premium:affelnet:follow-up":
        return inviteEtablissementAffelnetToPremiumFollowUp()
      case "premium:activated:reminder":
        return premiumActivatedReminder()
      case "premium:invite:one-shot":
        return premiumInviteOneShot()
      case "etablissements:formations:sync":
        return syncEtablissementsAndFormations()
      case "etablissements:formations:affelnet:sync":
        return syncAffelnetFormationsFromCatalogueME()
      case "appointments:anonimize":
        return anonimizeAppointments()
      case "users:anonimize":
        return anonimizeUsers()
      case "catalogue:trainings:appointments:archive:eligible":
        return eligibleTrainingsForAppointmentsHistoryWithCatalogue()
      case "referentiel:onisep:import":
        return importReferentielOnisep()
      case "catalogue:trainings:sync":
        return importCatalogueFormationJob()
      case "catalogue:trainings:sync:extra":
        return updateFormationCatalogue()
      case "brevo:blocked:sync":
        return updateBrevoBlockedEmails(job.payload as any)
      case "applications:anonymize":
        return anonymizeOldApplications()
      case "lbac:fields:rename":
        return refactorLBACFields()
      case "companies:update":
        return updateBonnesBoites(job.payload as any)
      case "geo-locations:update":
        return updateGeoLocations(job.payload as any)
      case "opcos:update":
        return updateOpcoCompanies(job.payload as any)
      case "domaines-metiers:update":
        return updateDomainesMetiers()
      case "domaines-metiers:file:update": {
        const { filename, key } = job.payload as any
        return updateDomainesMetiersFile({ filename, key })
      }
      case "diplomes-metiers:update":
        return updateDiplomesMetiers()
      case "referentiel:rncp-romes:update":
        return updateReferentielRncpRomes()
      ///////
      case "indexes:create":
      case "indexes:recreate":
        //recreateIndexes((job.payload as any)?.drop)
        return
      case "db:validate":
        //validateModels()
        return
      case "migrations:up": {
        // await upMigration()
        // Validate all documents after the migration
        await addJob({ name: "db:validate", queued: true })
        return
      }
      case "migrations:status": {
        // const pendingMigrations = await statusMigration()
        // console.log(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`)
        console.log(`migrations-status=synced`)
        return
      }
      case "migrations:create":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // createMigration(job.payload as any)
        return
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
