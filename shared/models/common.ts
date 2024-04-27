import BSON, { type ObjectId } from "bson"
import type { IndexOptions, IndexSpecification } from "mongodb"
import { ZodType, z } from "zod"

export type CollectionName =
  | "users"
  | "jobs"
  | "organisations"
  | "persons"
  | "events"
  | "sessions"
  | "documents"
  | "documentContents"
  | "mailingLists"
  | "credentials"
  | "entreprises"
  | "cfas"
  | "emailblacklists"
  | "appointments"
  | "applications"
  | "etablissements"
  | "anonymizedapplications"
  | "anonymized_users"
  | "anonymizedappointments"
  | "anonymizedrecruiters"
  | "anonymizedusers2s"
  | "apicalls"
  | "bonnesboites"
  | "bonnesboiteslegacies"
  | "changelog"
  | "customemailetfas"
  | "diplomesmetiers"
  | "domainesmetiers"
  | "eligible_trainings_for_appointments"
  | "eligible_trainings_for_appointments_histories"
  | "formationcatalogues"
  | "geolocations"
  | "internalJobs"
  | "opcos"
  | "optouts"
  | "recruiters"
  | "referentieloniseps"
  | "referentielromes"
  | "referentielopcos"
  | "rolemanagements"
  | "sessions"
  | "siretdiffusiblestatuses"
  | "unsubscribedbonnesboites"
  | "unsubscribedofs"
  | "userrecruteurs"
  | "users"
  | "userswithaccounts"

export interface IModelDescriptor {
  zod: ZodType
  indexes: [IndexSpecification, IndexOptions][]
  collectionName: CollectionName
}

export const zObjectId = z
  .custom<ObjectId | string>((v) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return BSON.ObjectID.isValid(v as any)
  })
  .transform((v) => new BSON.ObjectID(v))
  .describe("Identifiant unique")
