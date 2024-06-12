import { captureException } from "@sentry/node"

import { db, mongooseInstance } from "@/common/mongodb"

import { logger } from "../logger"

import Application from "./schema/application/applications.schema"
import AppointmentDetailed from "./schema/appointmentDetailed/appointmentDetailed.schema"
import Appointment from "./schema/appointments/appointment.schema"
import DiplomesMetiers from "./schema/diplomesmetiers/diplomesmetiers.schema"
import DomainesMetiers from "./schema/domainesmetiers/domainesmetiers.schema"
import EligibleTrainingsForAppointment from "./schema/eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.schema"
import eligibleTrainingsForAppointmentHistory from "./schema/eligibleTrainingsForAppointmentsHistory/eligibleTrainingsForAppointmentHistory.schema"
import EmailBlacklist from "./schema/emailBlacklist/emailBlacklist.schema"
import Etablissement from "./schema/etablissements/etablissement.schema"
import FicheMetierRomeV4 from "./schema/ficheRomeV4/ficheRomeV4"
import FormationCatalogue from "./schema/formationCatalogue/formationCatalogue.schema"
import GeoLocation from "./schema/geolocation/geolocation.schema"
import InternalJobs from "./schema/internalJobs/internalJobs.schema"
import Job from "./schema/jobs/jobs.schema"
import LbaCompany from "./schema/lbaCompany/lbaCompany.schema"
import { Cfa } from "./schema/multiCompte/cfa.schema"
import { Entreprise } from "./schema/multiCompte/entreprise.schema"
import { RoleManagement } from "./schema/multiCompte/roleManagement.schema"
import { UserWithAccount } from "./schema/multiCompte/userWithAccount.schema"
import Opco from "./schema/opco/opco.schema"
import Optout from "./schema/optout/optout.schema"
import Recruiter from "./schema/recruiter/recruiter.schema"
import ReferentielOnisep from "./schema/referentielOnisep/referentielOnisep.schema"
import ReferentielOpco from "./schema/referentielOpco/referentielOpco.schema"
import ReferentielRome from "./schema/referentielRome/referentielRome"
import Session from "./schema/session/session.schema"
import SiretDiffusibleStatus from "./schema/siretDiffusibleStatusSchema/siretDiffusibleStatusSchema.schema"
import UnsubscribedLbaCompany from "./schema/unsubscribedLbaCompany/unsubscribedLbaCompany.schema"
import UnsubscribeOF from "./schema/unsubscribedOF/unsubscribeOF.schema"
import User from "./schema/user/user.schema"
import UserRecruteur from "./schema/userRecruteur/usersRecruteur.schema"

const createSpecialIndexes = async () => {
  await db.collection("bonnesboites").createIndex({ geopoint: "2dsphere" })
  await db.collection("formationcatalogues").createIndex({ lieu_formation_geopoint: "2dsphere" })
  await db.collection("recruiters").createIndex({ geopoint: "2dsphere" })
}

export async function createMongoDBIndexes() {
  const results = await Promise.allSettled(
    mongooseInstance.modelNames().map(async (name) => {
      const model = mongooseInstance.model(name)
      return model.createIndexes({ background: true }).catch(async (e) => {
        if (e.codeName === "IndexOptionsConflict" || e.codeName === "IndexKeySpecsConflict") {
          const err = new Error(`Conflict in indexes for ${name}`, { cause: e })
          logger.error(err)
          captureException(err)
          await mongooseInstance.connection.collection(model.collection.name).dropIndexes()
          await model.createIndexes({ background: true })
        } else {
          throw e
        }
      })
    })
  )

  await createSpecialIndexes()

  const errors = results.reduce((acc, r) => {
    if (r.status === "rejected") {
      acc.push(r.reason)

      logger.error(r.reason)
      captureException(r.reason)
    }

    return acc
  }, [] as Error[])

  if (errors.length > 0) {
    throw new AggregateError(errors, `createMongoDBIndexes failed with ${errors.length} errors`)
  }
}

export {
  Application,
  Appointment,
  AppointmentDetailed,
  Cfa,
  DiplomesMetiers,
  DomainesMetiers,
  EligibleTrainingsForAppointment,
  EmailBlacklist,
  Entreprise,
  Etablissement,
  FicheMetierRomeV4,
  FormationCatalogue,
  GeoLocation,
  InternalJobs,
  Job,
  LbaCompany,
  Opco,
  Optout,
  Recruiter,
  ReferentielOnisep,
  ReferentielOpco,
  ReferentielRome,
  RoleManagement,
  Session,
  SiretDiffusibleStatus,
  UnsubscribeOF,
  UnsubscribedLbaCompany,
  User,
  UserRecruteur,
  UserWithAccount,
  eligibleTrainingsForAppointmentHistory,
}
