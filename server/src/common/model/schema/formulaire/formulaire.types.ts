import { IOffre } from "../offre/offre.types.js"

interface IFormulaire {
  id_form: string
  raison_sociale: string
  enseigne: string
  siret: string
  adresse_detail: object
  adresse: string
  geo_coordonnees: string
  mandataire: boolean
  gestionnaire: string
  nom: string
  prenom: string
  telephone: string
  email: string
  offres: IOffre[]
  origine: string
  opco: string
  idcc: string
  statut: string
  code_naf: string
  libelle_naf: string
  tranche_effectif: string
  date_creation_etablissement: Date
  createdAt: Date
  updatedAt: Date
}

export { IFormulaire }
