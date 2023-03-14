interface IUserValidation {
  validation_type: string
  statut: string
  motif: string
  user: string
  date: Date
}

interface IUserRecruteur {
  nom: string
  prenom: string
  opco: string
  idcc: string
  raison_sociale: string
  enseigne: string
  siret: string
  adresse_detail: object
  adresse: string
  geo_coordonnees: string
  telephone: string
  email: string
  scope: string
  type: string
  id_form: string
  origine: string
  isAdmin: boolean
  email_valide: boolean
  qualiopi: boolean
  last_connection: Date
  createdAt: Date
  updatedAt: Date
  etat_utilisateur: IUserValidation[]
}

export { IUserRecruteur, IUserValidation }
