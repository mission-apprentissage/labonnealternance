// warning: types écrits à partir d'un échantillon de données

type FTContact = {
  nom: string
  courriel: string
  coordonnees1: string
  coordonnees2: string
  coordonnees3: string
}

type FTEntreprise = {
  nom: string
  logo: string
  description: string
  siret: string
}

export type FTJob = {
  id: string
  intitule: string
  description: string
  dateCreation: string
  dateActualisation: string
  lieuTravail: {
    libelle: string
    latitude: string
    longitude: string
    codePostal: string
    commune: string
  }
  romeCode: string
  romeLibelle: string
  appellationlibelle: string
  entreprise: FTEntreprise
  typeContrat: string
  typeContratLibelle: string
  natureContrat: string
  experienceExige: string
  experienceLibelle: string
  competences?: [][]
  salaire: object[] | object
  dureeTravailLibelle?: string
  dureeTravailLibelleConverti?: string
  alternance: boolean
  contact?: FTContact
  agence?: object[]
  nombrePostes: number
  accessibleTH: boolean
  deplacementCode?: string
  deplacementLibelle?: string
  qualificationCode?: string
  qualificationLibelle?: string
  codeNAF?: string
  secteurActivite?: string
  secteurActiviteLibelle?: string
  qualitesProfessionnelles?: [][]
  origineOffre: object[]
  offresManqueCandidats?: boolean
  formations?: [][]
  langues?: [][]
  complementExercice?: string
  appellationLibelle: string
}

export type FTResponse = {
  resultats: FTJob[]
}
