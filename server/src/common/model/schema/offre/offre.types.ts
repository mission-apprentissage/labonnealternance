interface IDelegation {
  siret: string
  email: string
  cfa_read_company_detail_at: Date
}
interface IOffre {
  _id: string
  libelle: string
  rome_appellation_label: string
  niveau: string
  date_debut_apprentissage: Date
  description: string
  romes: string[]
  rome_detail: object
  date_creation: Date
  date_expiration: Date
  date_mise_a_jour: Date
  date_derniere_prolongation: Date
  nombre_prolongation: number
  relance_mail_sent: boolean
  statut: string
  raison_statut: string
  type: string[]
  multi_diffuser: boolean
  delegate: boolean
  number_of_delegations: number
  delegations: IDelegation[]
  elligible_handicap: boolean
  quantite: number
  duree_contrat: number
  rythme_alternance: string
  custom_adress: string
  custom_gps_coordinates: string
}

export { IDelegation, IOffre }
