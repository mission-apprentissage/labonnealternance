import { ICredential, IUserRecruteur } from "shared/models"

interface IInternalJobsSimpleGeneric<Name extends string, Payload = Record<string, never>> {
  _id: string
  name: Name
  type: "simple"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  payload: Payload
  output?: Record<string, unknown> | undefined
  scheduled_for: Date
  started_at?: Date
  ended_at?: Date
  updated_at: Date
  created_at: Date
}

type IInternalJobsSimple =
  | IInternalJobsSimpleGeneric<"migration:remove-version-key-from-all-collections">
  | IInternalJobsSimpleGeneric<"migration:remove-delegated-from-jobs">
  | IInternalJobsSimpleGeneric<"indexes:generate", { index_list?: string; recreate?: boolean }>
  | IInternalJobsSimpleGeneric<
      "user:create",
      Pick<IUserRecruteur, "first_name" | "last_name" | "establishment_siret" | "establishment_raison_sociale" | "phone" | "address" | "email" | "scope"> & {
        type: IUserRecruteur["type"]
        email_valide: IUserRecruteur["is_email_checked"]
      }
    >
  | IInternalJobsSimpleGeneric<"api:user:create", Pick<ICredential, "nom" | "prenom" | "email" | "scope"> & { organization: ICredential["organisation"] }>
  | IInternalJobsSimpleGeneric<"api:user:reset", { email: string }>
  | IInternalJobsSimpleGeneric<"api:user:disable", { email: ICredential["email"]; state?: ICredential["actif"] }>
  | IInternalJobsSimpleGeneric<"formulaire:relance", { threshold: string }>
  | IInternalJobsSimpleGeneric<"formulaire:annulation">
  | IInternalJobsSimpleGeneric<"metabase:offre:create">
  | IInternalJobsSimpleGeneric<"opco:relance">
  | IInternalJobsSimpleGeneric<"pe:offre:export">
  | IInternalJobsSimpleGeneric<"user:validate">
  | IInternalJobsSimpleGeneric<"siret:inError:update">
  | IInternalJobsSimpleGeneric<"etablissement:formations:activate:opt-out">
  | IInternalJobsSimpleGeneric<"etablissement:invite:opt-out">
  | IInternalJobsSimpleGeneric<"etablissement:invite:premium">
  | IInternalJobsSimpleGeneric<"etablissement:invite:premium:affelnet">
  | IInternalJobsSimpleGeneric<"etablissement:invite:premium:follow-up">
  | IInternalJobsSimpleGeneric<"etablissement:invite:premium:affelnet:follow-up">
  | IInternalJobsSimpleGeneric<"premium:activated:reminder">
  | IInternalJobsSimpleGeneric<"premium:invite:one-shot">
  | IInternalJobsSimpleGeneric<"etablissements:formations:sync">
  | IInternalJobsSimpleGeneric<"etablissements:formations:affelnet:sync">
  | IInternalJobsSimpleGeneric<"appointments:anonimize">
  | IInternalJobsSimpleGeneric<"users:anonimize">
  | IInternalJobsSimpleGeneric<"catalogue:trainings:appointments:archive:eligible">
  | IInternalJobsSimpleGeneric<"referentiel:onisep:import">
  | IInternalJobsSimpleGeneric<"catalogue:trainings:sync">
  | IInternalJobsSimpleGeneric<"catalogue:trainings:sync:extra">
  | IInternalJobsSimpleGeneric<"brevo:blocked:sync", { AllAddresses?: boolean }>
  | IInternalJobsSimpleGeneric<"applications:anonymize">
  | IInternalJobsSimpleGeneric<
      "companies:update",
      {
        UseAlgoFile?: boolean
        ClearMongo?: boolean
        BuildIndex?: boolean
        UseSave?: boolean
        ForceRecreate?: boolean
        SourceFile?: string | null
      }
    >
  | IInternalJobsSimpleGeneric<"geo-locations:update", { ForceRecreate?: boolean; SourceFile?: string | null }>
  | IInternalJobsSimpleGeneric<
      "opcos:update",
      {
        ClearMongo?: boolean
        ForceRecreate?: boolean
        SourceFile?: string | null
      }
    >
  | IInternalJobsSimpleGeneric<"domaines-metiers:update">
  | IInternalJobsSimpleGeneric<"domaines-metiers:file:update", { filename: string; key: string }>
  | IInternalJobsSimpleGeneric<"diplomes-metiers:update">
  | IInternalJobsSimpleGeneric<"referentiel:rncp-romes:update">
  | IInternalJobsSimpleGeneric<"mongodb:indexes:create">
  | IInternalJobsSimpleGeneric<"db:validate">
  | IInternalJobsSimpleGeneric<"migrations:up">
  | IInternalJobsSimpleGeneric<"migrations:status">
  | IInternalJobsSimpleGeneric<"migrations:create">
  | IInternalJobsSimpleGeneric<"crons:init">
  | IInternalJobsSimpleGeneric<"crons:scheduler">
// | IInternalJobsSimpleGeneric<"migration:remove-version-key-from-all-collections">
// | IInternalJobsSimpleGeneric<"migration:remove-version-key-from-all-collections">
// | IInternalJobsSimpleGeneric<"migration:remove-version-key-from-all-collections">

// interface IInternalJobs {
//   _id: string
//   name: string
//   type: "simple" | "cron" | "cron_task"
//   status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
//   sync: boolean
//   payload?: Record<string, unknown> | undefined
//   output?: Record<string, unknown> | undefined
//   cron_string?: string
//   scheduled_for: Date
//   started_at?: Date
//   ended_at?: Date
//   updated_at?: Date
//   created_at?: Date | undefined
// }

type CronName =
  | "Reindex formulaire collection"
  | "Create offre collection for metabase"
  | "Cancel lba recruteur expired offers"
  | "Send offer reminder email at J+7"
  | "Send offer reminder email at J+1"
  | "Send reminder to OPCO about awaiting validation users"
  | "Send CSV offers to Pôle emploi"
  | "Check companies validation state"
  | "Mise à jour des recruteurs en erreur"
  | "Active tous les établissements qui ont souscrits à l'opt-out."
  | "Invite les établissements (via email gestionnaire) à l'opt-out."
  | "Invite les établissements (via email gestionnaire) au premium (Parcoursup)."
  | "(Relance) Invite les établissements (via email gestionnaire) au premium (Parcoursup)."
  | "Récupère la liste de toutes les formations du Catalogue et les enregistre en base de données."
  | "Historisation des formations éligibles à la prise de rendez-vous."
  | "Anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus d'un an"
  | "Anonimisation des prises de rendez-vous de plus d'un an"
  | "Récupère la liste de toutes les formations Affelnet du Catalogue et les enregistre en base de données."
  | "Invite les établissements (via email gestionnaire) au premium (Affelnet)."
  | "(Relance) Invite les établissements (via email gestionnaire) au premium (Affelnet)."
  | "Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep"
  | "Mise à jour depuis le Catalogue des formations."
  | "Mise à jour des champs spécifiques de la collection formations catalogue."
  | "Mise à jour des adresses emails bloquées."
  | "Anonymise les candidatures de plus de un an."
  | "Géolocation de masse des sociétés issues de l'algo"
  | "Détermination des opcos des sociétés issues de l'algo"
  | "Mise à jour des sociétés issues de l'algo"

interface IInternalJobsCron {
  _id: string
  name: CronName
  type: "cron"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  cron_string: string
  scheduled_for: Date
  updated_at: Date
  created_at: Date
}

interface IInternalJobsCronTask {
  _id: string
  name: CronName
  type: "cron_task"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  scheduled_for: Date
  started_at?: Date
  ended_at?: Date
  updated_at: Date
  created_at: Date
}

type IInternalJobs = IInternalJobsSimple | IInternalJobsCron | IInternalJobsCronTask

export type { CronName, IInternalJobs, IInternalJobsCron, IInternalJobsSimple, IInternalJobsCronTask }
