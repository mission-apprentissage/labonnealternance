interface IInternalJobsSimple {
  _id: string
  name: string
  type: "simple"
  status: "pending" | "will_start" | "running" | "finished" | "blocked" | "errored"
  sync: boolean
  payload: Record<string, any>
  output?: Record<string, unknown> | undefined
  scheduled_for: Date
  started_at?: Date
  ended_at?: Date
  updated_at: Date
  created_at: Date
}

type CronName =
  | "Reindex formulaire collection"
  | "Create offre collection for metabase"
  | "Cancel lba recruteur expired offers"
  | "Send offer reminder email at J+7"
  | "Send offer reminder email at J+1"
  | "Send reminder to OPCO about awaiting validation users"
  //| "Send CSV offers to Pôle emploi"
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
