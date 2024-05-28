import { CreateIndexesOptions, IndexSpecification, ObjectId } from "mongodb"
import { ZodType, z } from "zod"

export type CollectionName =
  | "anonymized_users"
  | "anonymizedapplications"
  | "anonymizedappointments"
  | "anonymizedrecruiters"
  | "anonymizedusers2s"
  | "apicalls"
  | "appointments"
  | "applications"
  | "bonnesboites"
  | "bonnesboiteslegacies"
  | "cfas"
  | "changelog"
  | "credentials"
  | "customemailetfas"
  | "diplomesmetiers"
  | "domainesmetiers"
  | "eligible_trainings_for_appointments"
  | "eligible_trainings_for_appointments_histories"
  | "emailblacklists"
  | "entreprises"
  | "etablissements"
  | "formationcatalogues"
  | "geolocations"
  | "internalJobs"
  | "opcos"
  | "optouts"
  | "recruiters"
  | "referentieloniseps"
  | "referentielopcos"
  | "referentielromes"
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
  indexes: [IndexSpecification, CreateIndexesOptions][]
  collectionName: CollectionName
}

export const zObjectId = z
  .custom<ObjectId | string>((v: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ObjectId.isValid(v as any)
  })
  .transform((v: any) => new ObjectId(v))
  .describe("Identifiant unique")
