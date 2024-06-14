import { captureException } from "@sentry/node"

import { db, mongooseInstance } from "@/common/mongodb"

import { logger } from "../logger"

import EligibleTrainingsForAppointment from "./schema/eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.schema"
import eligibleTrainingsForAppointmentHistory from "./schema/eligibleTrainingsForAppointmentsHistory/eligibleTrainingsForAppointmentHistory.schema"
import EmailBlacklist from "./schema/emailBlacklist/emailBlacklist.schema"
import Etablissement from "./schema/etablissements/etablissement.schema"
import FicheMetierRomeV4 from "./schema/ficheRomeV4/ficheRomeV4"
import FormationCatalogue from "./schema/formationCatalogue/formationCatalogue.schema"
import GeoLocation from "./schema/geolocation/geolocation.schema"
import InternalJobs from "./schema/internalJobs/internalJobs.schema"
import Job from "./schema/jobs/jobs.schema"
import { Entreprise } from "./schema/multiCompte/entreprise.schema"
import Opco from "./schema/opco/opco.schema"
import Optout from "./schema/optout/optout.schema"
import Recruiter from "./schema/recruiter/recruiter.schema"

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
  EligibleTrainingsForAppointment,
  EmailBlacklist,
  Entreprise,
  Etablissement,
  FicheMetierRomeV4,
  FormationCatalogue,
  GeoLocation,
  InternalJobs,
  Job,
  Opco,
  Optout,
  Recruiter,
  eligibleTrainingsForAppointmentHistory,
}
